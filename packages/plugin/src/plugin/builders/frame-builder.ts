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

  parentBrowserX?: number;
  parentBrowserY?: number;
  parentFigmaX?: number;
  parentFigmaY?: number;
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
    const sortedChildren = [...node.children].sort((a, b) => {
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
    const sortedChildren = [...node.children].sort((a, b) => {
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
