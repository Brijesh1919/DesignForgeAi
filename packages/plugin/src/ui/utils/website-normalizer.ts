/**
 * DesignForge AI — Website URL → Figma: Client-Side Normalizer
 *
 * Converts a WebsiteExtractionResult (from the backend Playwright renderer)
 * into a DesignAnalysis object compatible with the existing START_GENERATION
 * pipeline (buildNodeTree in controller.ts).
 *
 * This module is ISOLATED from dom-extractor.ts.
 * It does not share code with the existing HTML/CSS extraction pipeline.
 */

import type { DesignAnalysis, UINode, LayoutDirection, Alignment } from "../../shared/types";

// ─── Shared Type Definitions (mirrors backend WebsiteTypes) ───────────────────
// We intentionally re-define these locally rather than creating a shared package
// dependency, to keep the new feature fully isolated.

interface WNodeBounds { x: number; y: number; width: number; height: number; }
interface WNodeFill { type: string; color?: string; opacity?: number; gradientStops?: any[]; }
interface WNodeStroke { color: string; opacity: number; weight: number; weights?: any; position: string; }
interface WNodeEffect { type: string; color?: string; offsetX?: number; offsetY?: number; blur?: number; spread?: number; opacity?: number; radius?: number; visible: boolean; }
interface WNodeText { content: string; fontFamily: string; fontWeight: string; fontSize: number; lineHeight?: number; letterSpacing: number; textAlign: string; textCase: string; textDecoration: string; color: string; opacity: number; width: number; height: number; }
interface WNodeLayout { display: string; direction: string; flexDirection: string; justifyContent: string; alignItems: string; flexWrap: string; gap: number; rowGap: number; columnGap: number; paddingTop: number; paddingRight: number; paddingBottom: number; paddingLeft: number; marginTop: number; marginRight: number; marginBottom: number; marginLeft: number; flexGrow: number; flexShrink: number; alignSelf: string; gridTemplateColumns?: string; }
interface WNodeStyle { fills: WNodeFill[]; strokes: WNodeStroke[]; effects: WNodeEffect[]; cornerRadius: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number }; opacity: number; clipsContent: boolean; visible: boolean; position: string; zIndex: number; overflow: string; objectFit?: string; transform?: string; }

interface WebsiteNode {
  id: string; type: string; tagName: string; name: string;
  bounds: WNodeBounds; layout: WNodeLayout; style: WNodeStyle;
  text?: WNodeText; imageRef?: string; svgContent?: string;
  isPseudo?: boolean; pseudoType?: string; children: WebsiteNode[];
}

interface WebsiteAsset { id: string; src: string; base64?: string; mimeType?: string; width: number; height: number; bounds: WNodeBounds; }
interface WebsiteFont { family: string; weight: string; style: string; }

export interface WebsiteExtractionResult {
  url: string; title: string; viewport: { width: number; height: number };
  pageWidth: number; pageHeight: number;
  rootNode: WebsiteNode; assets: WebsiteAsset[]; fonts: WebsiteFont[];
  extractedAt: number;
}

export interface WebsiteNormalizationOptions {
  createAutoLayout:   boolean;
  importImages:       boolean;
  preserveShadows:    boolean;
  preserveBorders:    boolean;
}

// ─── Alignment Mapping ────────────────────────────────────────────────────────

function mapAlignment(jc: string, ai: string): Alignment {
  if (ai === "center" && jc === "center")    return "CENTER";
  if (ai === "center" && jc === "flex-end")  return "CENTER_RIGHT";
  if (ai === "center")                        return "CENTER_LEFT";
  if (ai === "flex-end" && jc === "center")  return "BOTTOM_CENTER";
  if (ai === "flex-end" && jc === "flex-end")return "BOTTOM_RIGHT";
  if (ai === "flex-end")                      return "BOTTOM_LEFT";
  if (jc === "center")                        return "TOP_CENTER";
  if (jc === "flex-end")                      return "TOP_RIGHT";
  return "TOP_LEFT";
}

// ─── Counter for asset IDs ────────────────────────────────────────────────────
let assetCounter = 0;

// ─── Main Conversion ──────────────────────────────────────────────────────────

/**
 * Converts a WebsiteExtractionResult into a DesignAnalysis suitable for
 * the existing START_GENERATION → buildNodeTree pipeline.
 */
export function normalizeWebsiteToDesignAnalysis(
  result: WebsiteExtractionResult,
  options: WebsiteNormalizationOptions
): DesignAnalysis {
  console.log(`[WebsiteToFigma] Normalizing design tree...`);
  assetCounter = 0;

  const assets: any[] = [];
  const rootUINode = convertNode(result.rootNode, null, options, assets, result.assets || [], 0);

  console.log(`[WebsiteToFigma] Auto Layout frames: ${countAutoLayout(rootUINode)}`);
  console.log(`[WebsiteToFigma] Absolute positioned nodes: ${countAbsolute(rootUINode)}`);
  console.log(`[WebsiteToFigma] Text nodes: ${countByType(rootUINode, "TEXT")}`);
  console.log(`[WebsiteToFigma] Images: ${assets.length}`);
  console.log(`[WebsiteToFigma] Conversion complete`);

  // Build a minimal DesignAnalysis matching the existing schema
  const analysis: DesignAnalysis = {
    rootFrame: rootUINode,
    assets,
    components: [],
    colorTokens: [],
    textStyles: [],
    shadowTokens: [],
    metadata: {
      pageName: result.title || "Website Import",
      deviceType: result.viewport.width >= 1024 ? "desktop" : result.viewport.width >= 768 ? "tablet" : "mobile",
      timestamp: result.extractedAt,
      isWebsite: true,
    },
  } as any;

  return analysis;
}

// ─── Node Converter ───────────────────────────────────────────────────────────

function convertNode(
  node: WebsiteNode,
  parentNode: WebsiteNode | null,
  options: WebsiteNormalizationOptions,
  assets: any[],
  resultAssets: any[],
  depth: number
): UINode {
  const { x, y, width, height } = node.bounds;

  // ─── Filter out invisible stubs / tracking anchors ──────────────────
  const isOffscreenSrOnly = (node.bounds.x < 0 && node.bounds.y < 0 && node.bounds.width <= 10) ||
    (node.bounds.width <= 1 && node.bounds.height <= 1);
  const isZeroSize = node.bounds.width <= 0 || node.bounds.height <= 0;
  const isTrackingStub = (node.name || "").includes("hs-web-interactives") || (node.name || "").includes("didomi");
  if ((isOffscreenSrOnly || isZeroSize || isTrackingStub) && (!node.children || node.children.length === 0) && node.tagName !== "body" && node.tagName !== "html") {
    return null as any;
  }

  // ─── Type ──────────────────────────────────────────────────
  let type: UINode["type"] = "FRAME";
  if (node.type === "TEXT")   type = "TEXT";
  if (node.type === "IMAGE")  type = "IMAGE";
  if (node.type === "VECTOR") type = "VECTOR";

  // ─── Fills ─────────────────────────────────────────────────
  const fills: any[] = options.importImages
    ? node.style.fills.map(mapFill).filter(Boolean)
    : node.style.fills.filter(f => f.type !== "GRADIENT_LINEAR" && f.type !== "GRADIENT_RADIAL").map(mapFill).filter(Boolean);

  // ─── Strokes ────────────────────────────────────────────────
  const strokes: any[] = options.preserveBorders
    ? node.style.strokes.map(mapStroke).filter(Boolean)
    : [];

  // ─── Effects ────────────────────────────────────────────────
  const effects: any[] = options.preserveShadows
    ? node.style.effects.map(mapEffect).filter(Boolean)
    : node.style.effects.filter(e => e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR").map(mapEffect).filter(Boolean);

  // ─── Corner Radius ──────────────────────────────────────────
  let cornerRadius: any = 0;
  if (typeof node.style.cornerRadius === "number") {
    cornerRadius = node.style.cornerRadius;
  } else if (node.style.cornerRadius && typeof node.style.cornerRadius === "object") {
    const cr = node.style.cornerRadius as any;
    cornerRadius = { topLeft: cr.topLeft || 0, topRight: cr.topRight || 0, bottomRight: cr.bottomRight || 0, bottomLeft: cr.bottomLeft || 0 };
  }

  // ─── Layout ─────────────────────────────────────────────────
  const l = node.layout;
  const isFlex = l.display === "flex" || l.display === "inline-flex";
  const isGrid = l.display === "grid" || l.display === "inline-grid";
  const tagLower = (node.tagName || "").toLowerCase();

  let direction: LayoutDirection = "NONE";
  let itemSpacing = 0;
  let alignment: Alignment = "TOP_LEFT";

  if (tagLower === "body" || tagLower === "html" || tagLower === "main") {
    // Root block containers in HTML flow are strictly VERTICAL
    if (!isFlex || (l.flexDirection || "").includes("column")) {
      direction = "VERTICAL";
    }
  } else if (options.createAutoLayout && (isFlex || isGrid)) {
    direction = (l.flexDirection || "").includes("column") ? "VERTICAL" : "HORIZONTAL";
    itemSpacing = l.gap || l.columnGap || l.rowGap || 0;
    alignment = mapAlignment(l.justifyContent || "flex-start", l.alignItems || "flex-start");
  } else if (options.createAutoLayout && l.direction !== "NONE") {
    direction = l.direction as LayoutDirection;
  }

  // ─── Image Ref ──────────────────────────────────────────────
  let imageRef: string | undefined = undefined;
  if ((type === "IMAGE" || node.imageRef) && node.imageRef && options.importImages) {
    const assetId = `website_asset_${++assetCounter}`;
    imageRef = assetId;
    const matched = resultAssets.find((a: any) => a.src === node.imageRef || a.id === node.imageRef);
    assets.push({
      id: assetId,
      src: node.imageRef,
      bounds: { x, y, width, height },
      base64: matched?.base64,
      isSvg: matched?.isSvg,
      svgText: matched?.svgText,
    });
    if (node.imageRef.toLowerCase().includes(".svg") || node.imageRef.startsWith("data:image/svg+xml") || matched?.isSvg) {
      type = "VECTOR";
      if (matched?.svgText && !node.svgContent) {
        node.svgContent = matched.svgText;
      }
    }
  }

  // ─── Text ───────────────────────────────────────────────────
  let text: any = undefined;
  if (type === "TEXT" && node.text) {
    const t = node.text;
    text = {
      content:       t.content,
      fontFamily:    t.fontFamily || "Inter",
      fontWeight:    t.fontWeight || "Regular",
      fontSize:      t.fontSize || 14,
      lineHeight:    t.lineHeight,
      letterSpacing: t.letterSpacing || 0,
      textAlign:     (t.textAlign || "LEFT") as any,
      textCase:      (t.textCase || "ORIGINAL") as any,
      textDecoration:(t.textDecoration || "NONE") as any,
      color:         t.color || "#000000",
      opacity:       t.opacity ?? 1.0,
      width,
      height,
    };
  }

  // ─── Layout Align & Sizing ──────────────────────────────────
  let layoutAlign = "INHERIT";
  let layoutGrow = l.flexGrow || 0;
  let primaryAxisSizing: "FIXED" | "AUTO" = "FIXED";
  let counterAxisSizing: "FIXED" | "AUTO" = "FIXED";

  if (options.createAutoLayout && direction !== "NONE") {
    if (depth === 0) {
      primaryAxisSizing = "FIXED";
      counterAxisSizing = "FIXED";
    } else if (direction === "VERTICAL") {
      primaryAxisSizing = "AUTO"; // HUG height so container grows with content
      counterAxisSizing = l.alignSelf === "stretch" || (parentNode && Math.abs(width - parentNode.bounds.width) < 20) ? "FIXED" : "AUTO";
    } else {
      // Horizontal containers
      primaryAxisSizing = layoutGrow > 0 ? "FIXED" : "AUTO";
      counterAxisSizing = "AUTO";
    }
  }

  if (options.createAutoLayout && parentNode) {
    const parentDir = parentNode.layout?.direction;
    const isParentFlexOrGrid = parentNode.layout?.display === "flex" ||
      parentNode.layout?.display === "inline-flex" ||
      parentNode.layout?.display === "grid";

    if (parentDir === "VERTICAL") {
      const tag = node.tagName?.toLowerCase() || "";
      if (l.alignSelf === "stretch" || Math.abs(width - parentNode.bounds.width) < 30 ||
          ["p", "h1", "h2", "h3", "h4", "button", "header", "footer", "section", "hr"].includes(tag)) {
        layoutAlign = "STRETCH";
      }
    } else if (parentDir === "HORIZONTAL") {
      if (l.alignSelf === "stretch") {
        layoutAlign = "STRETCH";
      }
      const siblingsCount = parentNode.children?.length || 1;
      const isParentWrapping = parentNode.layout?.flexWrap === "wrap" || parentNode.layout?.display === "grid" || parentNode.layout?.display === "inline-grid";
      // IMPORTANT: In wrapped containers (grids or flex-wrap), children MUST retain layoutGrow = 0 so they can wrap!
      if (siblingsCount >= 2 && isParentFlexOrGrid && !isParentWrapping) {
        if (layoutGrow === 0 && (l.flexShrink > 0 || width > 100)) {
          layoutGrow = 1; // Stretch column items to fill available horizontal width
        }
      }
    }
  }

  // ─── Children ───────────────────────────────────────────────
  const children: UINode[] = node.children
    .map((child) => convertNode(child, node, options, assets, resultAssets, depth + 1))
    .filter(Boolean) as UINode[];

  // ─── Assemble UINode ─────────────────────────────────────────
  const uiNode: UINode = {
    type,
    name:  node.name || node.tagName || "Layer",
    role:  node.tagName || "div",
    bounds: { x, y, width, height },
    layout: {
      direction,
      primaryAxisSizing,
      counterAxisSizing,
      paddingTop:          l.paddingTop    || 0,
      paddingRight:        l.paddingRight  || 0,
      paddingBottom:       l.paddingBottom || 0,
      paddingLeft:         l.paddingLeft   || 0,
      itemSpacing,
      alignment,
      wrap:                (l.flexWrap === "wrap" || isGrid) && direction === "HORIZONTAL",
      justifyContent:      l.justifyContent,
      alignItems:          l.alignItems,
      marginTop:           l.marginTop    || 0,
      marginRight:         l.marginRight  || 0,
      marginBottom:        l.marginBottom || 0,
      marginLeft:          l.marginLeft   || 0,
      gridTemplateColumns: l.gridTemplateColumns,
    } as any,
    childLayout: {
      layoutAlign,
      layoutGrow,
    },
    constraints: { horizontal: "LEFT", vertical: "TOP" },
    style: {
      fills,
      strokes,
      effects,
      cornerRadius,
      opacity:       node.style.opacity ?? 1.0,
      clipsContent:  node.style.clipsContent,
      visible:       node.style.visible,
      position:      node.style.position || "static",
      zIndex:        node.style.zIndex   || 0,
    } as any,
    text,
    imageRef,
    svgContent: node.svgContent,
    children,
  } as any;

  return uiNode;
}

// ─── Fill Mapper ─────────────────────────────────────────────────────────────

function mapFill(fill: WNodeFill): any {
  if (!fill) return null;
  if (fill.type === "SOLID") {
    return { type: "SOLID", color: fill.color || "#000000", opacity: fill.opacity ?? 1.0 };
  }
  if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL") {
    if (!fill.gradientStops || fill.gradientStops.length < 2) return null;
    return { type: fill.type, gradientStops: fill.gradientStops };
  }
  return null;
}

// ─── Stroke Mapper ────────────────────────────────────────────────────────────

function mapStroke(stroke: WNodeStroke): any {
  if (!stroke) return null;
  return {
    color:    stroke.color    || "#000000",
    weight:   stroke.weight   || 1,
    opacity:  stroke.opacity  ?? 1.0,
    position: stroke.position || "INSIDE",
    weights:  stroke.weights,
  };
}

// ─── Effect Mapper ────────────────────────────────────────────────────────────

function mapEffect(effect: WNodeEffect): any {
  if (!effect) return null;
  if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
    return {
      type:    effect.type,
      color:   effect.color   || "#000000",
      offsetX: effect.offsetX ?? 0,
      offsetY: effect.offsetY ?? 0,
      blur:    effect.blur     ?? 4,
      spread:  effect.spread   ?? 0,
      opacity: effect.opacity  ?? 0.25,
      source:  "box-shadow",
      value:   "",
    };
  }
  if (effect.type === "LAYER_BLUR") {
    return { type: "LAYER_BLUR", radius: effect.radius ?? 4, visible: true, source: "filter", value: "" };
  }
  if (effect.type === "BACKGROUND_BLUR") {
    return { type: "BACKGROUND_BLUR", radius: effect.radius ?? 4, visible: true, source: "backdrop-filter", value: "" };
  }
  return null;
}

// ─── Debug Counters ───────────────────────────────────────────────────────────

function countAutoLayout(node: UINode): number {
  let count = (node as any).layout?.direction !== "NONE" ? 1 : 0;
  for (const child of (node.children || [])) count += countAutoLayout(child);
  return count;
}

function countAbsolute(node: UINode): number {
  let count = (node as any).style?.position === "absolute" || (node as any).style?.position === "fixed" ? 1 : 0;
  for (const child of (node.children || [])) count += countAbsolute(child);
  return count;
}

function countByType(node: UINode, type: string): number {
  let count = node.type === type ? 1 : 0;
  for (const child of (node.children || [])) count += countByType(child, type);
  return count;
}
