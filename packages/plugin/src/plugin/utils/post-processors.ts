/**
 * DesignForge AI — Optional Post-Processors Module (Phase 4 Auto Layout Safety)
 *
 * Implements isolated enhancement passes (applyAutoLayout, applyVariables, applyPaintStyles,
 * applyTextStyles, applyComponents, applyConstraints) operating strictly AFTER Stage 1 BASE_RENDER.
 * Phase 4 enforces strict Auto Layout safety guardrails with 0.5px tolerance geometry validation.
 */

import type { BaseRect } from "./geometry-validator";
import type { GenerationOptions } from "../../shared/types";
import { generateStyles } from "../generators/style-generator";
import { generateVariables } from "../generators/variable-generator";
import { buildComponents } from "../builders/component-builder";

export interface NodeBoundsSnapshot {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Captures a baseline geometry snapshot of a container node and all its descendants.
 */
function captureDescendantsSnapshot(root: SceneNode): Map<string, NodeBoundsSnapshot> {
  const map = new Map<string, NodeBoundsSnapshot>();
  const walk = (node: SceneNode) => {
    map.set(node.id, {
      id: node.id,
      name: node.name,
      x: "x" in node ? node.x : 0,
      y: "y" in node ? node.y : 0,
      width: "width" in node ? node.width : 0,
      height: "height" in node ? node.height : 0,
    });
    if ("children" in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  };
  walk(root);
  return map;
}

/**
 * Restores baseline geometry bounds for a container node and all descendants.
 */
function restoreDescendantsSnapshot(map: Map<string, NodeBoundsSnapshot>, root: SceneNode): void {
  const walk = (node: SceneNode) => {
    const snap = map.get(node.id);
    if (snap) {
      if ("layoutMode" in node && (node as FrameNode).layoutMode !== "NONE") {
        (node as FrameNode).layoutMode = "NONE";
      }
      if ("x" in node) node.x = snap.x;
      if ("y" in node) node.y = snap.y;
      if ("resize" in node) {
        (node as any).resize(Math.max(1, snap.width), Math.max(1, snap.height));
      }
    }
    if ("children" in node) {
      for (const child of (node as FrameNode).children) {
        walk(child);
      }
    }
  };
  walk(root);
}

/**
 * Evaluates whether a container is unsafe for Auto Layout conversion.
 */
function isUnsafeContainer(frame: FrameNode): boolean {
  if (!frame.children || frame.children.length < 2) return true;

  for (const child of frame.children) {
    const cType = child.type;
    if (
      cType === "VECTOR" ||
      cType === "BOOLEAN_OPERATION" ||
      cType === "STAR" ||
      cType === "POLYGON" ||
      cType === "LINE"
    ) {
      return true;
    }
    const isAbsolute = (child as any).layoutPositioning === "ABSOLUTE";
    if (isAbsolute) return true;

    const cName = child.name.toLowerCase();
    if (
      cName.includes("overlay") ||
      cName.includes("modal") ||
      cName.includes("backdrop") ||
      cName.includes("blob") ||
      cName.includes("decorative")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Logs post-enhancement metrics comparing node geometry against baseline bounds map.
 */
export function logPostEnhancementMetrics(
  passName: string,
  rootNode: SceneNode,
  baseGeometryMap: Map<string, BaseRect>
): void {
  let totalNodes = 0;
  let changedNodes = 0;
  let xyChangedNodes = 0;
  let whChangedNodes = 0;

  const traverse = (node: SceneNode) => {
    totalNodes++;
    const base = baseGeometryMap.get(node.id);
    if (base) {
      const fx = "x" in node ? node.x : 0;
      const fy = "y" in node ? node.y : 0;
      const fw = "width" in node ? node.width : 0;
      const fh = "height" in node ? node.height : 0;

      const xyDiff = Math.abs(fx - base.x) > 0.5 || Math.abs(fy - base.y) > 0.5;
      const whDiff = Math.abs(fw - base.width) > 0.5 || Math.abs(fh - base.height) > 0.5;

      if (xyDiff) xyChangedNodes++;
      if (whDiff) whChangedNodes++;
      if (xyDiff || whDiff) changedNodes++;
    }

    if ("children" in node) {
      for (const child of (node as FrameNode).children) {
        traverse(child);
      }
    }
  };

  traverse(rootNode);

  const rootW = "width" in rootNode ? Math.round(rootNode.width) : 1440;
  const rootH = "height" in rootNode ? Math.round(rootNode.height) : 900;

  console.log(`[ENHANCEMENT METRICS - ${passName}]
Total node count: ${totalNodes}
Root dimensions: ${rootW}x${rootH}
Changed node count: ${changedNodes}
Nodes whose x/y changed: ${xyChangedNodes}
Nodes whose width/height changed: ${whChangedNodes}`);
}

/**
 * Isolated Phase 4 Safe Auto Layout Post-Processor
 */
export async function applyAutoLayout(
  rootNode: SceneNode,
  baseGeometryMap: Map<string, BaseRect>
): Promise<void> {
  console.log("[ENHANCEMENT] AutoLayout started");

  let candidateCount = 0;
  let appliedCount = 0;
  let skippedCount = 0;
  let revertedCount = 0;
  let totalGeometryChanges = 0;

  try {
    const processFrame = (node: SceneNode) => {
      if ("children" in node) {
        for (const child of [...(node as FrameNode).children]) {
          processFrame(child);
        }
      }

      if (node.type === "FRAME" || node.type === "COMPONENT") {
        const frame = node as FrameNode;
        if (!frame.children || frame.children.length < 2) return;

        candidateCount++;
        console.log(`[AUTOLAYOUT] Candidate: ${frame.name}`);

        if (isUnsafeContainer(frame)) {
          skippedCount++;
          console.log(`[AUTOLAYOUT] Skipped — unsafe container`);
          return;
        }

        const snapshotMap = captureDescendantsSnapshot(frame);

        const firstChild = frame.children[0]!;
        const secondChild = frame.children[1]!;
        const isVertical = Math.abs(secondChild.y - firstChild.y) > Math.abs(secondChild.x - firstChild.x);

        frame.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";
        frame.primaryAxisSizingMode = "FIXED";
        frame.counterAxisSizingMode = "FIXED";

        let geometryChanged = false;
        const checkWalk = (n: SceneNode) => {
          const snap = snapshotMap.get(n.id);
          if (snap) {
            const nx = "x" in n ? n.x : 0;
            const ny = "y" in n ? n.y : 0;
            const nw = "width" in n ? n.width : 0;
            const nh = "height" in n ? n.height : 0;

            if (
              Math.abs(nx - snap.x) > 0.5 ||
              Math.abs(ny - snap.y) > 0.5 ||
              Math.abs(nw - snap.width) > 0.5 ||
              Math.abs(nh - snap.height) > 0.5
            ) {
              geometryChanged = true;
              totalGeometryChanges++;
            }
          }
          if ("children" in n) {
            for (const ch of (n as FrameNode).children) checkWalk(ch);
          }
        };

        checkWalk(frame);

        if (geometryChanged) {
          revertedCount++;
          console.log(`[AUTOLAYOUT] Geometry changed — reverting`);
          restoreDescendantsSnapshot(snapshotMap, frame);
        } else {
          appliedCount++;
          console.log(`[AUTOLAYOUT] Applied: ${frame.name}`);
          console.log(`[AUTOLAYOUT] Geometry preserved`);
        }
      }
    };

    processFrame(rootNode);

    console.log(`[AUTOLAYOUT Summary]
Candidates: ${candidateCount}
Applied: ${appliedCount}
Skipped: ${skippedCount}
Reverted: ${revertedCount}
Geometry changes: ${totalGeometryChanges}`);

    logPostEnhancementMetrics("AutoLayout", rootNode, baseGeometryMap);
  } catch (err) {
    console.error("[ENHANCEMENT] AutoLayout failed safely:", err);
  }
  console.log("[ENHANCEMENT] AutoLayout completed");
}

/**
 * Isolated Variables Post-Processor
 */
export async function applyVariables(
  analysis: any,
  options: GenerationOptions
): Promise<number> {
  console.log("[ENHANCEMENT] Variables started");
  let variableCount = 0;
  try {
    if (options.createVariables) {
      variableCount = await generateVariables(
        analysis.colorTokens || [],
        analysis.spacingScale || [],
        analysis.radiusScale || [],
        false
      );
    }
  } catch (err) {
    console.error("[ENHANCEMENT] Variables failed safely:", err);
  }
  console.log("[ENHANCEMENT] Variables completed");
  return variableCount;
}

/**
 * Isolated Paint Styles Post-Processor
 */
export async function applyPaintStyles(
  analysis: any,
  options: GenerationOptions
): Promise<number> {
  console.log("[ENHANCEMENT] PaintStyles started");
  let paintStylesCount = 0;
  try {
    if (options.createPaintStyles) {
      const styleCounts = await generateStyles(
        analysis.colorTokens || [],
        [],
        [],
        { ...options, createPaintStyles: true, createTextStyles: false } as any
      );
      paintStylesCount = styleCounts.paintStyles;
    }
  } catch (err) {
    console.error("[ENHANCEMENT] PaintStyles failed safely:", err);
  }
  console.log("[ENHANCEMENT] PaintStyles completed");
  return paintStylesCount;
}

/**
 * Isolated Text Styles Post-Processor
 */
export async function applyTextStyles(
  analysis: any,
  options: GenerationOptions
): Promise<number> {
  console.log("[ENHANCEMENT] TextStyles started");
  let textStylesCount = 0;
  try {
    if (options.createTextStyles) {
      const styleCounts = await generateStyles(
        [],
        analysis.textStyles || [],
        [],
        { ...options, createPaintStyles: false, createTextStyles: true } as any
      );
      textStylesCount = styleCounts.textStyles;
    }
  } catch (err) {
    console.error("[ENHANCEMENT] TextStyles failed safely:", err);
  }
  console.log("[ENHANCEMENT] TextStyles completed");
  return textStylesCount;
}

/**
 * Isolated Components Post-Processor
 */
export async function applyComponents(
  analysis: any,
  imageAssets: Map<string, Uint8Array>,
  options: GenerationOptions
): Promise<Map<string, ComponentNode>> {
  console.log("[ENHANCEMENT] Components started");
  let componentsMap = new Map<string, ComponentNode>();
  try {
    if (options.createComponents && analysis.components?.length > 0) {
      componentsMap = await buildComponents(
        analysis.components,
        imageAssets,
        false
      );
    }
  } catch (err) {
    console.error("[ENHANCEMENT] Components failed safely:", err);
  }
  console.log("[ENHANCEMENT] Components completed");
  return componentsMap;
}

/**
 * Isolated Constraints Post-Processor
 */
export async function applyConstraints(
  rootNode: SceneNode,
  baseGeometryMap: Map<string, BaseRect>
): Promise<void> {
  console.log("[ENHANCEMENT] Constraints started");
  try {
    const applyToNode = (node: SceneNode) => {
      const base = baseGeometryMap.get(node.id);
      if ("constraints" in node && base) {
        try {
          const isParentAutoLayout =
            node.parent && "layoutMode" in node.parent && (node.parent as any).layoutMode !== "NONE";
          if (!isParentAutoLayout) {
            (node as any).constraints = {
              horizontal: "MIN",
              vertical: "MIN",
            };
          }
        } catch {
          // Constraints safety
        }
      }

      if ("children" in node) {
        for (const child of (node as FrameNode).children) {
          applyToNode(child);
        }
      }
    };

    applyToNode(rootNode);
    logPostEnhancementMetrics("Constraints", rootNode, baseGeometryMap);
  } catch (err) {
    console.error("[ENHANCEMENT] Constraints failed safely:", err);
  }
  console.log("[ENHANCEMENT] Constraints completed");
}
