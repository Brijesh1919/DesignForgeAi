/**
 * DesignForge AI — Frame Builder
 *
 * Recursively builds Figma frame nodes from the UINode tree.
 * Handles Auto Layout, styling, constraints, and child nesting.
 */

import { hexToFigmaRGB, createSolidPaint } from "../utils/color-utils";
import { buildTextNode } from "./text-builder";
import { isComponentInstance } from "./component-builder";
import { insertImage } from "./image-builder";
import { cssGradientToFigmaPaint } from "../utils/css-gradient-converter";
import { renderSVGNode } from "../fidelity/svg";
import { renderImageNode } from "../fidelity/images";
import { processEffectsFidelity } from "../fidelity/effects";
import { processGradientFidelity } from "../fidelity/gradients";
import { sortStackingOrder } from "../fidelity/stacking";
import {
  canUseAutoLayoutSizing,
  safeSetFillHorizontal,
  safeSetFillVertical,
  safeSetHugHorizontal,
  safeSetHugVertical,
  safeSetFixedHorizontal,
  safeSetFixedVertical,
  safeSetAbsolute,
  safeSetAutoPositioning,
  classifyElement,
  determineSizingBehavior,
} from "../utils/safe-layout";

interface UINode {
  type: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  layout: {
    direction: "HORIZONTAL" | "VERTICAL" | "NONE";
    primaryAxisSizing: "FIXED" | "HUG" | "FILL";
    counterAxisSizing: "FIXED" | "HUG" | "FILL";
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    itemSpacing: number;
    alignment: string;
    wrap: boolean;
  };
  childLayout: {
    layoutAlign: string;
    layoutGrow: number;
  };
  constraints: {
    horizontal: string;
    vertical: string;
  };
  style: {
    fills: any[];
    strokes: any[];
    effects: any[];
    cornerRadius: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
    opacity: number;
    clipsContent: boolean;
    visible: boolean;
  };
  text?: any;
  componentRef?: string;
  imageRef?: string;
  svgContent?: string;
  iconName?: string;
  children?: UINode[];
}

interface BuildContext {
  components: Map<string, ComponentNode>;
  imageAssets: Map<string, Uint8Array>;
  depth: number;
  debugMode?: boolean;
  settings?: any;
  counts?: {
    frames: number;
    texts: number;
    images: number;
    skipped: number;
  };
  baseGeometryMap?: Map<string, { x: number; y: number; width: number; height: number }>;
  baseTextPropsMap?: Map<string, any>;
  isAutoLayoutBuild?: boolean;
  uiNodeMap?: Map<string, UINode>;

  parentBrowserX?: number;
  parentBrowserY?: number;
  parentFigmaX?: number;
  parentFigmaY?: number;
}

function printAutoLayoutPlan(node: UINode, parentUiNode: UINode | null) {
  if (parentUiNode === null) {
    console.log(`[AutoLayout Plan]\n\nRoot:\n${node.bounds.width} × ${node.bounds.height}`);
  }

  const nameLower = (node.name || "").toLowerCase();
  const isNavbar = nameLower.includes("navbar") || nameLower.includes("header") || nameLower.includes("nav");

  if (parentUiNode !== null) {
    const computedStyle = node.style || {};
    const sizing = determineSizingBehavior(node, parentUiNode, computedStyle, node.children);
    const isAbsolute = node.style?.position === "absolute" || node.style?.position === "fixed";
    
    let label = node.name || node.type;
    if (isNavbar) {
      console.log(`${label}:\nFIXED / TOP`);
    } else {
      let behavior = "";
      if (isAbsolute) {
        behavior = "ABSOLUTE";
      } else {
        behavior = `${sizing.horizontal} / ${node.layout?.direction || "NONE"}`;
      }
      console.log(`${label}:\n${behavior}`);
    }
  }

  if (node.children) {
    for (const child of node.children) {
      printAutoLayoutPlan(child, node);
    }
  }
}

export async function buildNodeTreeWithAutoLayout(
  node: UINode,
  parent: BaseNode & ChildrenMixin,
  context: BuildContext
): Promise<SceneNode | null> {
  // Output a concise layout plan diagnostic before starting generation
  printAutoLayoutPlan(node, null);

  const uiNodeMap = new Map<string, UINode>();

  // Pass 1: Build structural tree with Auto Layout disabled
  const pass1Settings = {
    ...context.settings,
    createAutoLayout: false,
    preserveAbsolutePosition: true,
  };
  const pass1Context = {
    ...context,
    settings: pass1Settings,
    isAutoLayoutBuild: true, // Flag to keep original DOM order (avoid sorting by zIndex)
    uiNodeMap,
  };
  const figmaNode = await buildNodeTree(node, parent, pass1Context);
  if (!figmaNode) return null;

  // Pass 2: Configure layout recursively
  const pass2Context = {
    ...context,
    uiNodeMap,
  };
  configureAutoLayoutRecursively(figmaNode, node, null, pass2Context);

  // FINAL TEXT NORMALIZATION PASS (TEXT ONLY):
  // Force every TEXT node inside an Auto Layout parent to HUG horizontally and vertically.
  const normalizeTextNodes = (figmaChild: SceneNode) => {
    if (figmaChild.type === "TEXT") {
      const textNode = figmaChild as TextNode;
      if ("layoutSizingHorizontal" in textNode && "layoutSizingVertical" in textNode) {
        try {
          textNode.layoutSizingHorizontal = "HUG";
          textNode.layoutSizingVertical = "HUG";
          textNode.textAutoResize = "WIDTH_AND_HEIGHT";
        } catch (e) {
          // Ignore if parent is not Auto Layout
        }
      }
    }
    if ("children" in figmaChild) {
      for (const subChild of (figmaChild as any).children) {
        normalizeTextNodes(subChild);
      }
    }
  };
  normalizeTextNodes(figmaNode);

  return figmaNode;
}

function applyHorizontalFillSafely(node: SceneNode, parent: BaseNode | null) {
  if (parent && "layoutMode" in parent && (parent as any).layoutMode !== "NONE") {
    safeSetFillHorizontal(node);
  } else {
    safeSetFixedHorizontal(node);
  }
}

function applyVerticalFillSafely(node: SceneNode, parent: BaseNode | null) {
  if (parent && "layoutMode" in parent && (parent as any).layoutMode !== "NONE") {
    safeSetFillVertical(node);
  } else {
    safeSetHugVertical(node);
  }
}

function configureAutoLayoutRecursively(
  figmaNode: SceneNode,
  uiNode: UINode,
  parentUiNode: UINode | null,
  context: BuildContext
): void {
  if (!figmaNode) return;

  // 1. Configure Auto Layout mode on this frame FIRST (top-down layout configuration)
  const isAutoLayoutEnabled = context.settings?.createAutoLayout === true;
  if (isAutoLayoutEnabled && (figmaNode.type === "FRAME" || figmaNode.type === "COMPONENT")) {
    const frame = figmaNode as FrameNode;
    const isFlex = uiNode.layout?.direction !== "NONE";

    if (isFlex) {
      frame.layoutMode = uiNode.layout.direction;

      frame.paddingTop = Math.max(0, uiNode.layout.paddingTop ?? 0);
      frame.paddingRight = Math.max(0, uiNode.layout.paddingRight ?? 0);
      frame.paddingBottom = Math.max(0, uiNode.layout.paddingBottom ?? 0);
      frame.paddingLeft = Math.max(0, uiNode.layout.paddingLeft ?? 0);
      frame.itemSpacing = Math.max(0, uiNode.layout.itemSpacing ?? 0);

      let primaryAlign: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN" = "MIN";
      const jc = (uiNode.layout as any).justifyContent || "";
      if (jc === "center") primaryAlign = "CENTER";
      else if (jc === "flex-end" || jc === "end") primaryAlign = "MAX";
      else if (jc === "space-between") primaryAlign = "SPACE_BETWEEN";
      frame.primaryAxisAlignItems = primaryAlign;

      let counterAlign: "MIN" | "CENTER" | "MAX" | "STRETCH" = "MIN";
      const ai = (uiNode.layout as any).alignItems || "";
      if (ai === "center") counterAlign = "CENTER";
      else if (ai === "flex-end" || ai === "end") counterAlign = "MAX";
      else if (ai === "stretch") counterAlign = "STRETCH";
      frame.counterAxisAlignItems = counterAlign;

      if (uiNode.layout.wrap) {
        frame.layoutWrap = "WRAP";
      }

      // Centered content & Grouped card row alignment mapping (Requirement 2 & Requirement 3)
      const isCenteredInStyle =
        (uiNode.style as any)?.textAlign === "center" ||
        jc === "center" ||
        ai === "center" ||
        (uiNode.layout as any)?.alignment === "CENTER" ||
        uiNode.name?.includes("RowGroup");
      const hasCenteredChildText = uiNode.children?.some(
        c => (c.style as any)?.textAlign === "center" || c.text?.textAlign === "CENTER"
      );

      if (isCenteredInStyle || hasCenteredChildText) {
        if (frame.layoutMode === "HORIZONTAL") {
          frame.primaryAxisAlignItems = "CENTER";
        } else if (frame.layoutMode === "VERTICAL") {
          frame.counterAxisAlignItems = "CENTER";
          if (jc === "center") {
            frame.primaryAxisAlignItems = "CENTER";
          }
        }
      }
    } else {
      // Force Auto Layout vertical default for any container that contains flow children and has layoutMode = NONE
      const children = frame.children;
      const hasFlowChildren = children.some(child => {
        return !("layoutPositioning" in child && (child as any).layoutPositioning === "ABSOLUTE");
      });
      const classification = classifyElement(uiNode, parentUiNode);
      const isAbsoluteOrDecorative = classification === "ABSOLUTE_CHILD" || classification === "DECORATIVE";

      if (hasFlowChildren && !isAbsoluteOrDecorative) {
        frame.layoutMode = "VERTICAL";
        frame.itemSpacing = 8; // Default spacing
        frame.paddingTop = 0;
        frame.paddingRight = 0;
        frame.paddingBottom = 0;
        frame.paddingLeft = 0;
      }
    }

    // Sticky / fixed header scrolling wrapper configuration for the main page frame
    if (parentUiNode === null) {
      // NOTE: We configure the root frame to be VERTICAL Auto Layout, and it hugs its children vertically!
      frame.layoutMode = "VERTICAL";
      frame.primaryAxisSizingMode = "AUTO"; // HUG vertically
      frame.counterAxisSizingMode = "FIXED"; // Width is fixed to source width (1440)
      frame.itemSpacing = 0;
      frame.paddingTop = 0;
      frame.paddingRight = 0;
      frame.paddingBottom = 0;
      frame.paddingLeft = 0;
      frame.overflowDirection = "VERTICAL";
      let fixedCount = 0;

      const children = frame.children;
      for (const child of children) {
        const nameLower = (child.name || "").toLowerCase();
        const isNavbar = nameLower.includes("navbar") || nameLower.includes("header") || nameLower.includes("nav");
        if (isNavbar && "layoutPositioning" in child) {
          (child as any).layoutPositioning = "ABSOLUTE";
          child.x = 0;
          child.y = 0;
          if ("resize" in child) {
            child.resize(frame.width, child.height);
          }
          (child as any).scrollBehavior = "FIXED";
          fixedCount++;
          console.log(`[FIXED NAV] scrollContainer: ${frame.name}, fixedChild: ${child.name}, numberOfFixedChildren: ${fixedCount}`);
        }
      }
    }
  }

  // 2. Configure layout sizing and positioning of this node inside its parent Auto Layout container
  const parentFigma = figmaNode.parent;
  if (parentFigma && (parentFigma.type === "FRAME" || parentFigma.type === "COMPONENT")) {
    const parentFrame = parentFigma as FrameNode;
    if (parentFrame.layoutMode !== "NONE") {
      const computedStyle = uiNode.style || {};
      const sizing = determineSizingBehavior(uiNode, parentUiNode, computedStyle, uiNode.children);
      const isAbsolute = uiNode.style?.position === "absolute" || uiNode.style?.position === "fixed";

      try {
        if (isAbsolute) {
          safeSetAbsolute(figmaNode);
          if ("x" in figmaNode && "y" in figmaNode) {
            figmaNode.x = uiNode.bounds.x;
            figmaNode.y = uiNode.bounds.y;
          }
        } else {
          if (sizing.horizontal === "FILL") {
            applyHorizontalFillSafely(figmaNode, parentFigma);
          } else if (sizing.horizontal === "HUG") {
            safeSetHugHorizontal(figmaNode);
          } else {
            safeSetFixedHorizontal(figmaNode);
            if ("resize" in figmaNode && figmaNode.type !== "TEXT") {
              figmaNode.resize(Math.max(1, uiNode.bounds.width), figmaNode.height);
            }
          }

          if (sizing.vertical === "FILL") {
            applyVerticalFillSafely(figmaNode, parentFigma);
          } else if (sizing.vertical === "HUG") {
            safeSetHugVertical(figmaNode);
          } else {
            safeSetFixedVertical(figmaNode);
            if ("resize" in figmaNode && figmaNode.type !== "TEXT") {
              figmaNode.resize(figmaNode.width, Math.max(1, uiNode.bounds.height));
            }
          }
        }

        if (uiNode.type === "TEXT" && "textAutoResize" in figmaNode) {
          const textNode = figmaNode as TextNode;
          if (sizing.horizontal === "FILL") {
            applyHorizontalFillSafely(textNode, parentFigma);
            textNode.textAutoResize = "HEIGHT";
            safeSetHugVertical(textNode);
          } else if (sizing.horizontal === "FIXED") {
            safeSetFixedHorizontal(textNode);
            textNode.resize(Math.max(1, uiNode.bounds.width), textNode.height);
            textNode.textAutoResize = "HEIGHT";
            safeSetHugVertical(textNode);
          } else {
            // Normal content-sized text -> HUG width & HUG height
            safeSetHugHorizontal(textNode);
            textNode.textAutoResize = "WIDTH_AND_HEIGHT";
            safeSetHugVertical(textNode);
          }

          if (textNode.textAlignHorizontal === "CENTER" || (uiNode.style as any)?.textAlign === "center" || uiNode.text?.textAlign === "CENTER") {
            textNode.textAlignHorizontal = "CENTER";
          }

          // Final defensive rule: TEXT vertical layout sizing must be HUG
          if ("layoutSizingVertical" in textNode) {
            try {
              (textNode as any).layoutSizingVertical = "HUG";
            } catch (err) {
              console.warn("[TEXT HUG] Failed to set layoutSizingVertical to HUG:", err);
            }
          }
        }

        // Semantic sizing debug log matching the layout decision output requirement
        console.log(`[LAYOUT DECISION]
name: ${uiNode.name || uiNode.type}
role: ${classifyElement(uiNode, parentUiNode)}
parent: ${parentUiNode?.name || "unknown"}
cssDisplay: ${uiNode.layout?.direction || "NONE"}
cssPosition: ${uiNode.style?.position || "static"}
layoutMode: ${parentFrame.layoutMode}
horizontalSizing: ${isAbsolute ? "FIXED (ABSOLUTE)" : sizing.horizontal}
verticalSizing: ${isAbsolute ? "FIXED (ABSOLUTE)" : sizing.vertical}
reason: ${isAbsolute ? "absolute positioning overlay" : sizing.reason}`);

      } catch (err) {
        console.warn(`[AUTO_LAYOUT FALLBACK] Failed for "${figmaNode.name}":`, err);
        safeSetFixedHorizontal(figmaNode);
        safeSetFixedVertical(figmaNode);
      }
    }
  }

  // 3. Recurse children after configuring parent frame and current node sizing (top-down traversal)
  if ("children" in figmaNode) {
    const figmaChildren = (figmaNode as any).children as SceneNode[];
    const sortedUiChildren = context.isAutoLayoutBuild
      ? [...(uiNode.children || [])]
      : [...(uiNode.children || [])].sort((a, b) => {
          const az = (a.style as any)?.zIndex || 0;
          const bz = (b.style as any)?.zIndex || 0;
          return az - bz;
        });

    for (let i = 0; i < figmaChildren.length; i++) {
      const figmaChild = figmaChildren[i];
      let uiChild = context.uiNodeMap?.get(figmaChild.id);
      
      // Fallback to index-based lookup if not in map
      if (!uiChild && uiNode.children) {
        uiChild = sortedUiChildren[i];
      }

      if (figmaChild && uiChild) {
        configureAutoLayoutRecursively(figmaChild, uiChild, uiNode, context);
      }
    }
  }
}

/**
 * Build a Figma node tree from a UINode.
 * This is the main recursive builder that creates the entire design.
 */
export async function buildNodeTree(
  node: UINode,
  parent: BaseNode & ChildrenMixin,
  context: BuildContext
): Promise<SceneNode | null> {
  if (context.settings?.createAutoLayout === true) {
    return buildNodeTreeWithAutoLayout(node, parent, context);
  }
  const pBx = context.parentBrowserX ?? 0;
  const pBy = context.parentBrowserY ?? 0;
  const pFx = context.parentFigmaX ?? 0;
  const pFy = context.parentFigmaY ?? 0;

  const browserAbsX = pBx + node.bounds.x;
  const browserAbsY = pBy + node.bounds.y;

  const subContext: BuildContext = {
    ...context,
    parentBrowserX: browserAbsX,
    parentBrowserY: browserAbsY,
    parentFigmaX: pFx + node.bounds.x,
    parentFigmaY: pFy + node.bounds.y,
  };

  console.log(`[FIGMA INPUT]\n${node.name || node.type}\n  x=${node.bounds.x}\n  y=${node.bounds.y}\n  width=${node.bounds.width}\n  height=${node.bounds.height}`);

  // Handle component instances
  if (node.componentRef && isComponentInstance(node.componentRef, context.components)) {
    try {
      const instance = await buildComponentInstance(node, subContext);
      if (instance) {
        parent.appendChild(instance);
        if (context.uiNodeMap) {
          context.uiNodeMap.set(instance.id, node);
        }
        if (context.debugMode) {
          console.log(`Creating Component Instance for "${node.name}"... ✓`);
        }
        return instance;
      }
    } catch (err) {
      if (context.debugMode) {
        console.log(`Creating Component Instance for "${node.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
      }
      if (context.counts) context.counts.skipped++;
      throw err;
    }
  }

  let figmaNode: SceneNode;

  switch (node.type) {
    case "TEXT":
      try {
        figmaNode = await buildTextNode(node.text, node.name);
        if (context.counts) context.counts.texts++;
        if (context.debugMode) {
          console.log(`Creating Text Node "${node.name}"... ✓`);
        }
      } catch (err) {
        if (context.debugMode) {
          console.log(`Creating Text Node "${node.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (context.counts) context.counts.skipped++;
        throw err;
      }
      break;

    case "IMAGE":
      try {
        figmaNode = await buildImageFrame(node, subContext);
        if (context.counts) context.counts.images++;
        if (context.debugMode) {
          console.log(`Creating Image Frame "${node.name}"... ✓`);
        }
      } catch (err) {
        if (context.debugMode) {
          console.log(`Creating Image Frame "${node.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (context.counts) context.counts.skipped++;
        throw err;
      }
      break;

    case "ELLIPSE":
      try {
        figmaNode = buildEllipse(node);
        if (context.counts) context.counts.frames++;
        if (context.debugMode) {
          console.log(`Creating Ellipse "${node.name}"... ✓`);
        }
      } catch (err) {
        if (context.debugMode) {
          console.log(`Creating Ellipse "${node.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (context.counts) context.counts.skipped++;
        throw err;
      }
      break;

    case "LINE":
      try {
        figmaNode = buildLine(node);
        if (context.counts) context.counts.frames++;
        if (context.debugMode) {
          console.log(`Creating Line "${node.name}"... ✓`);
        }
      } catch (err) {
        if (context.debugMode) {
          console.log(`Creating Line "${node.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (context.counts) context.counts.skipped++;
        throw err;
      }
      break;

    case "RECTANGLE":
      try {
        figmaNode = buildRectangle(node);
        if (context.counts) context.counts.frames++;
        if (context.debugMode) {
          console.log(`Creating Rectangle "${node.name}"... ✓`);
        }
      } catch (err) {
        if (context.debugMode) {
          console.log(`Creating Rectangle "${node.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (context.counts) context.counts.skipped++;
        throw err;
      }
      break;
    case "SVG":
    case "VECTOR":
      try {
        figmaNode = await renderSVGNode(parent, {
          nodeName: node.name,
          bounds: node.bounds,
          svgContent: node.svgContent,
        });
        if (context.counts) context.counts.frames++;
      } catch (err) {
        if (context.counts) context.counts.skipped++;
        throw err;
      }
      break;

    default:
      // FRAME, GROUP, ICON, COMPONENT_INSTANCE, VECTOR → build as frame
      try {
        figmaNode = await buildFrame(node, subContext);
        if (context.counts) context.counts.frames++;
        if (context.debugMode) {
          console.log(`Creating Frame "${node.name}"... ✓`);
        }
      } catch (err) {
        if (context.debugMode) {
          console.log(`Creating Frame "${node.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (context.counts) context.counts.skipped++;
        throw err;
      }
      break;
  }

  // Set position and size
  const isTextNode = node.type === "TEXT";
  if ("resize" in figmaNode && !isTextNode) {
    try {
      figmaNode.resize(Math.max(1, node.bounds.width), Math.max(1, node.bounds.height));
    } catch (e) {
      console.warn("Failed to resize node:", e);
    }
  }

  const isParentAutoLayout = parent && (parent.type === "FRAME" || parent.type === "COMPONENT") && (parent as any).layoutMode !== "NONE";
  
  if (isParentAutoLayout) {
    if (node.style?.position === "absolute" && "layoutPositioning" in figmaNode) {
      (figmaNode as any).layoutPositioning = "ABSOLUTE";
      if ("x" in figmaNode && "y" in figmaNode) {
        figmaNode.x = node.bounds.x;
        figmaNode.y = node.bounds.y;
      }
    }
  } else {
    if ("x" in figmaNode && "y" in figmaNode) {
      figmaNode.x = node.bounds.x;
      figmaNode.y = node.bounds.y;
    }
  }

  // Set common properties
  if (context.settings?.optimizeLayerNames === false) {
    figmaNode.name = node.type === "TEXT" ? "Text" : node.type === "IMAGE" ? "Image" : "Frame";
  } else {
    figmaNode.name = node.name;
  }
  figmaNode.visible = node.style.visible;

  if ("opacity" in figmaNode) {
    figmaNode.opacity = node.style.opacity;
  }

  // Set constraints (only for nodes in non-auto-layout parents)
  if ("constraints" in figmaNode && context.settings?.generateConstraints === true) {
    try {
      figmaNode.constraints = {
        horizontal: mapConstraint(node.constraints.horizontal) as ConstraintType,
        vertical: mapConstraint(node.constraints.vertical) as ConstraintType,
      };
    } catch {
      // Constraints may fail in auto layout — that's OK
    }
  }

  parent.appendChild(figmaNode);

  if (figmaNode) {
    const fx = "x" in figmaNode ? figmaNode.x : 0;
    const fy = "y" in figmaNode ? figmaNode.y : 0;
    const fw = "width" in figmaNode ? figmaNode.width : 0;
    const fh = "height" in figmaNode ? figmaNode.height : 0;
    if (context.baseGeometryMap) {
      context.baseGeometryMap.set(figmaNode.id, { x: fx, y: fy, width: fw, height: fh });
    }
    if (node.type === "TEXT" && context.baseTextPropsMap) {
      const textNode = figmaNode as TextNode;
      context.baseTextPropsMap.set(figmaNode.id, {
        fontName: textNode.fontName,
        fontSize: textNode.fontSize,
        lineHeight: textNode.lineHeight,
        letterSpacing: textNode.letterSpacing,
        textAlignHorizontal: textNode.textAlignHorizontal,
        textAlignVertical: textNode.textAlignVertical,
        textCase: textNode.textCase,
        textDecoration: textNode.textDecoration,
        fills: textNode.fills,
        characters: textNode.characters,
        textAutoResize: textNode.textAutoResize,
        x: textNode.x,
        y: textNode.y,
        width: textNode.width,
        height: textNode.height,
      });
    }

    const targetSections = ["HEADER", "hero", "hero-visual", "dashboard-preview", "trusted", "features", "stats", "CTA", "footer"];
    const matchesSection = targetSections.some(sec => node.name?.toLowerCase().includes(sec.toLowerCase()) || node.type?.toLowerCase().includes(sec.toLowerCase()));
    
    if (matchesSection) {
      console.log(`[GEOMETRY TRACE]
element: ${node.name || node.type}
browserAbsolute: x=${browserAbsX} y=${browserAbsY} w=${node.bounds.width} h=${node.bounds.height}
parentBrowser: x=${pBx} y=${pBy}
normalized: x=${node.bounds.x} y=${node.bounds.y} w=${node.bounds.width} h=${node.bounds.height}
parentFigma: x=${pFx} y=${pFy}
finalFigma: x=${fx} y=${fy} w=${fw} h=${fh}
transform: none`);
    }
    
    // DIAGNOSTIC INSTRUMENTATION: Stage 3 (buildNodeTree) & Stage 4 (Figma Node Applied)
    const nodeFills = "fills" in figmaNode && Array.isArray(figmaNode.fills) ? figmaNode.fills : [];
    const nodeStrokes = "strokes" in figmaNode && Array.isArray(figmaNode.strokes) ? figmaNode.strokes : [];
    const nodeEffects = "effects" in figmaNode && Array.isArray(figmaNode.effects) ? figmaNode.effects : [];
    
    console.log(`[DIAGNOSTIC BUILDER TRACE - Node: "${node.name || node.type}"]
- Category 1 (Solid background):
  DesignAnalysis fills: ${JSON.stringify(node.style?.fills?.filter((f: any) => f.type === "SOLID") || [])}
  Figma node applied fills: ${JSON.stringify(nodeFills.filter((f: any) => f.type === "SOLID"))}
- Category 2 (Gradient):
  DesignAnalysis fills: ${JSON.stringify(node.style?.fills?.filter((f: any) => f.type?.includes("GRADIENT")) || [])}
  Figma node applied fills: ${JSON.stringify(nodeFills.filter((f: any) => f.type?.includes("GRADIENT")))}
- Category 3 (Blur/Drop shadow/Effect):
  DesignAnalysis effects: ${JSON.stringify(node.style?.effects || [])}
  Figma node applied effects: ${JSON.stringify(nodeEffects)}
- Category 4 (SVG/Vector/Chart):
  DesignAnalysis type: "${node.type}", svgContent: ${node.svgContent ? "present (" + node.svgContent.length + " bytes)" : "missing"}
  Figma node created type: "${figmaNode.type}"
- Category 5 (Typography):
  DesignAnalysis text: ${JSON.stringify(node.text || "none")}
  Figma node type: "${figmaNode.type}" (fontName=${node.type === "TEXT" && "fontName" in figmaNode ? JSON.stringify((figmaNode as TextNode).fontName) : "n/a"})
- Category 6 (Border/stroke):
  DesignAnalysis strokes: ${JSON.stringify(node.style?.strokes || [])}
  Figma node applied strokes: ${JSON.stringify(nodeStrokes)}`);

    console.log(`[FIGMA OUTPUT]\n${figmaNode.name || figmaNode.type}\n  x=${fx}\n  y=${fy}\n  width=${fw}\n  height=${fh}`);
  }

  if (figmaNode && context.uiNodeMap) {
    context.uiNodeMap.set(figmaNode.id, node);
  }

  return figmaNode;
}

/**
 * Build a Figma Frame with Auto Layout.
 */
async function buildFrame(
  node: UINode,
  context: BuildContext
): Promise<FrameNode> {
  const frame = figma.createFrame();

  // Set dimensions first — always use the exact computed browser dimensions
  frame.resize(
    Math.max(1, node.bounds.width),
    Math.max(1, node.bounds.height)
  );

  // Apply fills
  frame.fills = buildFills(node.style.fills);

  // Apply corner radius
  applyCornerRadius(frame, node.style.cornerRadius);

  // Apply strokes
  if (node.style.strokes.length > 0) {
    frame.strokes = node.style.strokes.map((s: any) => createSolidPaint(s.color, s.opacity));
    const firstStroke = node.style.strokes[0];
    const topW = firstStroke.weights?.top ?? firstStroke.weight ?? 0;
    const rightW = firstStroke.weights?.right ?? firstStroke.weight ?? 0;
    const bottomW = firstStroke.weights?.bottom ?? firstStroke.weight ?? 0;
    const leftW = firstStroke.weights?.left ?? firstStroke.weight ?? 0;
    const rVal = typeof node.style.cornerRadius === "number"
      ? `${node.style.cornerRadius}px`
      : JSON.stringify(node.style.cornerRadius || 0);

    console.log(`[BORDER]
node: ${node.name}
top: ${topW}px ${firstStroke.color || ""}
right: ${rightW}px ${firstStroke.color || ""}
bottom: ${bottomW}px ${firstStroke.color || ""}
left: ${leftW}px ${firstStroke.color || ""}`);

    if (firstStroke.weights) {
      frame.strokeTopWeight = firstStroke.weights.top;
      frame.strokeRightWeight = firstStroke.weights.right;
      frame.strokeBottomWeight = firstStroke.weights.bottom;
      frame.strokeLeftWeight = firstStroke.weights.left;
    } else {
      frame.strokeWeight = firstStroke.weight || 1;
    }
    frame.strokeAlign = (firstStroke.position || "INSIDE") as "INSIDE" | "OUTSIDE" | "CENTER";
  }

  // Apply effects (shadows, blurs)
  frame.effects = buildEffects(node.style.effects, node.name);

  // Clip content
  frame.clipsContent = node.style.clipsContent;

  // Set Auto Layout ONLY when:
  // 1. The node's layout direction is not NONE (i.e., flex container)
  // 2. The createAutoLayout setting is enabled
  // 3. preserveAbsolutePosition is NOT enabled
  const isAutoLayoutEnabled = context.settings?.createAutoLayout === true;
  const isPreserveAbsolute = context.settings?.preserveAbsolutePosition === true;
  const useAutoLayout = node.layout.direction !== "NONE" && isAutoLayoutEnabled && !isPreserveAbsolute;

  if (useAutoLayout) {
    frame.layoutMode = node.layout.direction;

    // Use FIXED sizing to preserve exact computed dimensions
    frame.primaryAxisSizingMode = "FIXED";
    frame.counterAxisSizingMode = "FIXED";

    // Padding
    frame.paddingTop = node.layout.paddingTop;
    frame.paddingRight = node.layout.paddingRight;
    frame.paddingBottom = node.layout.paddingBottom;
    frame.paddingLeft = node.layout.paddingLeft;

    // Item spacing
    frame.itemSpacing = node.layout.itemSpacing;

    // Primary axis alignment
    let primaryAlign: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN" = "MIN";
    const jc = (node.layout as any).justifyContent;
    if (jc === "center") primaryAlign = "CENTER";
    else if (jc === "flex-end" || jc === "end") primaryAlign = "MAX";
    else if (jc === "space-between") primaryAlign = "SPACE_BETWEEN";
    frame.primaryAxisAlignItems = primaryAlign;

    // Counter axis alignment
    let counterAlign: "MIN" | "CENTER" | "MAX" = "MIN";
    const ai = (node.layout as any).alignItems;
    if (ai === "center") counterAlign = "CENTER";
    else if (ai === "flex-end" || ai === "end") counterAlign = "MAX";
    frame.counterAxisAlignItems = counterAlign;

    // Wrap
    if (node.layout.wrap) {
      frame.layoutWrap = "WRAP";
    }
  }

  // Always set absolute position
  frame.x = node.bounds.x;
  frame.y = node.bounds.y;

  // Build children recursively (sorted by computed zIndex so layers stack correctly!)
  if (node.children && node.children.length > 0) {
    const sortedChildren = (context as any).isAutoLayoutBuild
      ? [...node.children]
      : [...node.children].sort((a, b) => {
          const az = (a.style as any)?.zIndex || 0;
          const bz = (b.style as any)?.zIndex || 0;
          return az - bz;
        });

    for (const child of sortedChildren) {
      const childNode = await buildNodeTree(child, frame, {
        ...context,
        depth: context.depth + 1,
      });

      // Set child layout properties in auto layout
      if (childNode && useAutoLayout) {
        applyChildLayout(childNode, child.childLayout, node.layout.direction);
      }
    }
  }

  return frame;
}

/**
 * Build a rectangle node.
 */
function buildRectangle(node: UINode): RectangleNode {
  const rect = figma.createRectangle();
  rect.resize(Math.max(1, node.bounds.width), Math.max(1, node.bounds.height));
  rect.fills = buildFills(node.style.fills);
  applyCornerRadius(rect, node.style.cornerRadius);

  if (node.style.strokes.length > 0) {
    rect.strokes = node.style.strokes.map((s: any) => createSolidPaint(s.color, s.opacity));
    const firstStroke = node.style.strokes[0];
    const topW = firstStroke.weights?.top ?? firstStroke.weight ?? 0;
    const rightW = firstStroke.weights?.right ?? firstStroke.weight ?? 0;
    const bottomW = firstStroke.weights?.bottom ?? firstStroke.weight ?? 0;
    const leftW = firstStroke.weights?.left ?? firstStroke.weight ?? 0;
    const rVal = typeof node.style.cornerRadius === "number"
      ? `${node.style.cornerRadius}px`
      : JSON.stringify(node.style.cornerRadius || 0);

    console.log(`[BORDER]
node: ${node.name}
top: ${topW}px ${firstStroke.color || ""}
right: ${rightW}px ${firstStroke.color || ""}
bottom: ${bottomW}px ${firstStroke.color || ""}
left: ${leftW}px ${firstStroke.color || ""}`);

    if (firstStroke.weights) {
      rect.strokeTopWeight = firstStroke.weights.top;
      rect.strokeRightWeight = firstStroke.weights.right;
      rect.strokeBottomWeight = firstStroke.weights.bottom;
      rect.strokeLeftWeight = firstStroke.weights.left;
    } else {
      rect.strokeWeight = firstStroke.weight || 1;
    }
    rect.strokeAlign = (firstStroke.position || "INSIDE") as "INSIDE" | "OUTSIDE" | "CENTER";
  }

  rect.effects = buildEffects(node.style.effects, node.name);
  return rect;
}

/**
 * Build an ellipse node.
 */
function buildEllipse(node: UINode): EllipseNode {
  const ellipse = figma.createEllipse();
  ellipse.resize(Math.max(1, node.bounds.width), Math.max(1, node.bounds.height));
  ellipse.fills = buildFills(node.style.fills);

  if (node.style.strokes.length > 0) {
    ellipse.strokes = node.style.strokes.map((s: any) => createSolidPaint(s.color, s.opacity));
    ellipse.strokeWeight = node.style.strokes[0]?.weight || 1;
  }

  return ellipse;
}

/**
 * Build a line node.
 */
function buildLine(node: UINode): LineNode {
  const line = figma.createLine();
  line.resize(Math.max(1, node.bounds.width), 0);

  if (node.style.strokes.length > 0) {
    line.strokes = node.style.strokes.map((s: any) => createSolidPaint(s.color, s.opacity));
    line.strokeWeight = node.style.strokes[0]?.weight || 1;
  }

  return line;
}

/**
 * Build an image frame (frame with image fill).
 */
async function buildImageFrame(
  node: UINode,
  context: BuildContext
): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.resize(Math.max(1, node.bounds.width), Math.max(1, node.bounds.height));
  applyCornerRadius(frame, node.style.cornerRadius);

  if (node.imageRef && context.imageAssets.has(node.imageRef)) {
    const imageData = context.imageAssets.get(node.imageRef)!;
    await insertImage(frame, imageData, context.debugMode);
  } else {
    console.log(`[ImageFallback] Missing image source: ${node.name || node.type}`);
    frame.fills = [createSolidPaint("#E0E0E0")];
  }

  frame.clipsContent = true;

  // Build children recursively (so nested overlays inside containers with bg-image aren't skipped!)
  if (node.children && node.children.length > 0) {
    const sortedChildren = (context as any).isAutoLayoutBuild
      ? [...node.children]
      : [...node.children].sort((a, b) => {
          const az = (a.style as any)?.zIndex || 0;
          const bz = (b.style as any)?.zIndex || 0;
          return az - bz;
        });

    for (const child of sortedChildren) {
      await buildNodeTree(child, frame, {
        ...context,
        depth: context.depth + 1,
      });
    }
  }

  return frame;
}

/**
 * Build a component instance from a component reference.
 */
async function buildComponentInstance(
  node: UINode,
  context: BuildContext
): Promise<InstanceNode | null> {
  const component = context.components.get(node.componentRef!);
  if (!component) return null;

  const instance = component.createInstance();
  instance.resize(Math.max(1, node.bounds.width), Math.max(1, node.bounds.height));
  instance.name = node.name;

  return instance;
}

// ─── Helper Functions ────────────────────────────────────────

/**
 * Build Figma fills from schema fills.
 */
/**
 * Apply corner radius to a node.
 */
function applyCornerRadius(
  node: FrameNode | RectangleNode,
  radius: any
): void {
  if (!radius) {
    node.cornerRadius = 0;
    return;
  }
  if (typeof radius === "number") {
    node.cornerRadius = isNaN(radius) ? 0 : radius;
  } else if (typeof radius === "object") {
    node.topLeftRadius = isNaN(radius.topLeft) ? 0 : radius.topLeft;
    node.topRightRadius = isNaN(radius.topRight) ? 0 : radius.topRight;
    node.bottomRightRadius = isNaN(radius.bottomRight) ? 0 : radius.bottomRight;
    node.bottomLeftRadius = isNaN(radius.bottomLeft) ? 0 : radius.bottomLeft;
  }
}

/**
 * Build Figma effects from schema effects.
 */
function buildEffects(effects: any[], nodeName = "Node"): Effect[] {
  if (!effects || effects.length === 0) return [];
  return processEffectsFidelity(effects, nodeName);
}

/**
 * Build Figma fills from schema fills.
 */
function buildFills(fills: any[]): Paint[] {
  if (!fills || fills.length === 0) return [];

  const paints: Paint[] = [];

  for (const f of fills) {
    try {
      console.log(`[Paint Converter] CSS background: ${JSON.stringify(f)}`);

      if (f.type === "SOLID") {
        console.log(`[Paint Converter] Paint type: SOLID`);
        console.log(`[Paint Converter] Fallback used: false`);
        paints.push(createSolidPaint(f.color, f.opacity ?? 1));
        continue;
      }

      if (f.rawGradient) {
        const converted = cssGradientToFigmaPaint(f.rawGradient);
        if (converted && converted.length > 0) {
          paints.push(...converted);
          continue;
        }
      }

      if (
        f.type === "GRADIENT_LINEAR" ||
        f.type === "GRADIENT_RADIAL" ||
        f.type === "GRADIENT_ANGULAR" ||
        f.type === "GRADIENT_DIAMOND"
      ) {
        const type = f.type as "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
        
        // Validate stops
        if (!f.gradientStops || !Array.isArray(f.gradientStops) || f.gradientStops.length === 0) {
          console.warn("[Paint Converter] Invalid or empty gradient stops. Falling back to solid.");
          console.log(`[Paint Converter] Fallback used: true (Missing gradient stops)`);
          paints.push(createSolidPaint("#E0E0E0", 1));
          continue;
        }

        const stops = f.gradientStops.map((stop: any) => {
          const colorHex = stop.color || "#FFFFFF";
          return {
            position: typeof stop.position === "number" ? stop.position : 0,
            color: {
              ...hexToFigmaRGB(colorHex),
              a: typeof stop.opacity === "number" ? stop.opacity : 1,
            }
          };
        });

        const matrix = [
          [1, 0, 0],
          [0, 1, 0]
        ] as [[number, number, number], [number, number, number]];

        console.log(`[Paint Converter] Paint type: ${type}`);
        console.log(`[Paint Converter] Gradient stops: ${stops.length} stops`);
        console.log(`[Paint Converter] Gradient transform: ${JSON.stringify(matrix)}`);
        console.log(`[Paint Converter] Fallback used: false`);

        paints.push({
          type,
          gradientTransform: matrix,
          gradientStops: stops,
          opacity: f.opacity ?? 1,
        } as GradientPaint);
        continue;
      }

      // Unsupported CSS backgrounds -> safely fall back to solid background
      console.warn(`[Paint Converter] Unsupported paint type: ${f.type}. Falling back to solid.`);
      console.log(`[Paint Converter] Fallback used: true (Unsupported paint type: ${f.type})`);
      paints.push(createSolidPaint("#E0E0E0", 1));
    } catch (err) {
      console.error("[Paint Converter] Error converting paint. Safe fallback used.", err);
      console.log(`[Paint Converter] Fallback used: true (Crash prevention)`);
      paints.push(createSolidPaint("#E0E0E0", 1));
    }
  }

  // Defensive validation layer: Filter out any null or invalid paint objects
  return paints.filter((p) => {
    if (!p) return false;
    if (p.type === "SOLID") {
      return typeof p.color === "object" && p.color !== null;
    }
    if (
      p.type === "GRADIENT_LINEAR" ||
      p.type === "GRADIENT_RADIAL" ||
      p.type === "GRADIENT_ANGULAR" ||
      p.type === "GRADIENT_DIAMOND"
    ) {
      const gp = p as GradientPaint;
      return Array.isArray(gp.gradientStops) && gp.gradientStops.length > 0 && Array.isArray(gp.gradientTransform);
    }
    return false;
  });
}

/**
 * Apply alignment to a frame.
 */
function applyAlignment(frame: FrameNode, alignment: string): void {
  switch (alignment) {
    case "TOP_LEFT":
      frame.primaryAxisAlignItems = "MIN";
      frame.counterAxisAlignItems = "MIN";
      break;
    case "TOP_CENTER":
      frame.primaryAxisAlignItems = "MIN";
      frame.counterAxisAlignItems = "CENTER";
      break;
    case "TOP_RIGHT":
      frame.primaryAxisAlignItems = "MIN";
      frame.counterAxisAlignItems = "MAX";
      break;
    case "CENTER_LEFT":
      frame.primaryAxisAlignItems = "CENTER";
      frame.counterAxisAlignItems = "MIN";
      break;
    case "CENTER":
      frame.primaryAxisAlignItems = "CENTER";
      frame.counterAxisAlignItems = "CENTER";
      break;
    case "CENTER_RIGHT":
      frame.primaryAxisAlignItems = "CENTER";
      frame.counterAxisAlignItems = "MAX";
      break;
    case "BOTTOM_LEFT":
      frame.primaryAxisAlignItems = "MAX";
      frame.counterAxisAlignItems = "MIN";
      break;
    case "BOTTOM_CENTER":
      frame.primaryAxisAlignItems = "MAX";
      frame.counterAxisAlignItems = "CENTER";
      break;
    case "BOTTOM_RIGHT":
      frame.primaryAxisAlignItems = "MAX";
      frame.counterAxisAlignItems = "MAX";
      break;
  }
}

/**
 * Apply child layout properties in auto layout.
 */
function applyChildLayout(
  node: SceneNode,
  childLayout: { layoutAlign: string; layoutGrow: number },
  _parentDirection: string
): void {
  if (!("layoutAlign" in node)) return;

  try {
    if (childLayout.layoutAlign === "STRETCH") {
      (node as any).layoutAlign = "STRETCH";
    }

    if (childLayout.layoutGrow === 1) {
      (node as any).layoutGrow = 1;
    }
  } catch {
    // May fail for some node types — that's OK
  }
}

/**
 * Map constraint string to Figma constraint type.
 */
function mapConstraint(constraint: string): string {
  const map: Record<string, string> = {
    LEFT: "MIN",
    RIGHT: "MAX",
    LEFT_RIGHT: "STRETCH",
    CENTER: "CENTER",
    SCALE: "SCALE",
    TOP: "MIN",
    BOTTOM: "MAX",
    TOP_BOTTOM: "STRETCH",
  };

  return map[constraint] || "MIN";
}
