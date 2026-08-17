/**
 * DesignForge AI — Layout Validator and Sanitizer
 *
 * Traverses the final generated Figma node tree (post-adapters and post-processors)
 * and automatically sanitizes/corrects any properties that violate Figma API rules,
 * particularly layoutPositioning = "ABSOLUTE" and layoutSizingHorizontal/Vertical = "FILL" constraints.
 */

import {
  canUseAutoLayoutSizing,
  safeSetAutoPositioning,
  safeSetFixedHorizontal,
  safeSetFixedVertical,
} from "./safe-layout";

export function sanitizeFigmaLayoutTree(rootNode: SceneNode): void {
  console.log("[Layout Validator] Running defensive layout validation and sanitization pass...");

  let absoluteFixedCount = 0;
  let invalidFillHorizontalCount = 0;
  let invalidFillVerticalCount = 0;
  let invalidSizingFixedCount = 0;

  const sanitizeNode = (node: SceneNode, parent: (BaseNode & ChildrenMixin) | null) => {
    const parentIsAL = canUseAutoLayoutSizing(node);

    // 1. Check layoutPositioning = "ABSOLUTE" safety
    if ("layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE") {
      if (!parentIsAL) {
        console.warn(
          `[DesignForge][Validation] Resetting layoutPositioning on "${
            node.name || node.type
          }" from "ABSOLUTE" to "AUTO" because parent "${parent?.name || "canvas"}" layoutMode is NONE or not a frame.`
        );
        safeSetAutoPositioning(node);
        absoluteFixedCount++;
      }
    }

    // 2. Check layoutSizingHorizontal = "FILL" safety
    if ("layoutSizingHorizontal" in node && (node as any).layoutSizingHorizontal === "FILL") {
      if (!parentIsAL) {
        console.warn(
          `[DesignForge][Validation] Invalid horizontal FILL detected on "${
            node.name || node.type
          }". Parent "${parent?.name || "canvas"}" is not Auto Layout. Converting horizontal sizing to FIXED.`
        );
        safeSetFixedHorizontal(node);
        invalidFillHorizontalCount++;
      }
    }

    // 3. Check layoutSizingVertical = "FILL" safety
    if ("layoutSizingVertical" in node && (node as any).layoutSizingVertical === "FILL") {
      if (!parentIsAL) {
        console.warn(
          `[DesignForge][Validation] Invalid vertical FILL detected on "${
            node.name || node.type
          }". Parent "${parent?.name || "canvas"}" is not Auto Layout. Converting vertical sizing to FIXED.`
        );
        safeSetFixedVertical(node);
        invalidFillVerticalCount++;
      }
    }

    // 4. Validate frame Auto Layout sizing modes
    if ("layoutMode" in node) {
      const frame = node as FrameNode;
      if (frame.layoutMode && frame.layoutMode !== "NONE") {
        if (frame.primaryAxisSizingMode !== "FIXED" && frame.primaryAxisSizingMode !== "AUTO") {
          frame.primaryAxisSizingMode = "FIXED";
          invalidSizingFixedCount++;
        }
        if (frame.counterAxisSizingMode !== "FIXED" && frame.counterAxisSizingMode !== "AUTO") {
          frame.counterAxisSizingMode = "FIXED";
          invalidSizingFixedCount++;
        }
      }
    }

    // Recurse children
    if ("children" in node) {
      const children = [...(node as any).children];
      for (const child of children) {
        sanitizeNode(child, node as any);
      }
    }
  };

  sanitizeNode(rootNode, rootNode.parent);

  let sectionsFillCount = 0;
  let containersFillCount = 0;
  let cardsFillCount = 0;
  let textHugCount = 0;
  let buttonsHugCount = 0;
  let iconsFixedCount = 0;
  let absoluteOverlaysCount = 0;

  const collectStats = (node: SceneNode) => {
    const nameLower = (node.name || "").toLowerCase();
    const typeLower = (node.type || "").toLowerCase();

    const isAbsolute = "layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE";
    if (isAbsolute) {
      absoluteOverlaysCount++;
    }

    const horizontalSizing = "layoutSizingHorizontal" in node ? (node as any).layoutSizingHorizontal : "HUG";

    if (nameLower.includes("section") || nameLower.includes("hero")) {
      if (horizontalSizing === "FILL") sectionsFillCount++;
    } else if (
      nameLower.includes("container") ||
      nameLower.includes("wrapper") ||
      nameLower.includes("inner") ||
      nameLower.includes("rowgroup")
    ) {
      if (horizontalSizing === "FILL") containersFillCount++;
    } else if (nameLower.includes("card") || nameLower.includes("item")) {
      if (horizontalSizing === "FILL") cardsFillCount++;
    } else if (typeLower === "text") {
      if (horizontalSizing === "HUG") textHugCount++;
    } else if (nameLower.includes("button") || nameLower.includes("btn")) {
      if (horizontalSizing === "HUG") buttonsHugCount++;
    } else if (
      nameLower.includes("icon") ||
      nameLower.includes("avatar") ||
      nameLower.includes("logo") ||
      typeLower === "vector"
    ) {
      const supportsV2Sizing = "layoutSizingHorizontal" in node && "layoutSizingVertical" in node;
      const finalHMode = supportsV2Sizing ? (node as any).layoutSizingHorizontal : "FIXED";
      if (finalHMode === "FIXED") iconsFixedCount++;
    }

    if ("children" in node) {
      for (const child of (node as any).children) {
        collectStats(child);
      }
    }
  };

  collectStats(rootNode);

  console.log(`[DesignForge][RESPONSIVE SUMMARY]
Root: PASS
Sections FILL: ${sectionsFillCount}
Containers FILL: ${containersFillCount}
Cards FILL: ${cardsFillCount}
Text HUG: ${textHugCount}
Buttons HUG: ${buttonsHugCount}
Icons FIXED: ${iconsFixedCount}
Absolute overlays: ${absoluteOverlaysCount}`);

  console.log(
    `[Layout Validator] Sanitization completed. Fixed ${absoluteFixedCount} absolute positioning nodes, ${invalidFillHorizontalCount} invalid horizontal FILL nodes, ${invalidFillVerticalCount} invalid vertical FILL nodes, ${invalidSizingFixedCount} invalid sizing values.`
  );
}
