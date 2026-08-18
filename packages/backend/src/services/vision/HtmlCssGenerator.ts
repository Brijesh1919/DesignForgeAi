/**
 * DesignForge AI — Pixel-Perfect UI Reconstruction Engine (HTML/CSS)
 *
 * Converts a validated VisualDocument JSON scene graph into pixel-accurate HTML/CSS
 * that strictly reconstructs the source screenshot.
 *
 * Principles:
 * 1. The screenshot is the single ground truth — pixel accuracy over semantic conventions
 * 2. Exact absolute geometry (left, top, width, height) preserves visual positions
 * 3. Exact typography (size, weight, line-height, letter-spacing, color, wrapping)
 * 4. Observed colors, borders, radius, and shadows (never normalized or generalized)
 * 5. Inline vector SVGs for icons; accurate placeholders for images
 * 6. Zero overflow: hidden on root (Rule 6)
 *
 * Schema Version: v7-visual-reconstruction
 */

import type {
  VisualDocument,
  VisualElement,
  ContainerLayoutMode,
} from "./VisualSchema.js";

export interface GeneratedHtmlCss {
  html: string;
  css: string;
  elementCount: number;
  textNodeCount: number;
  sectionCount: number;
  imageCount: number;
  iconCount: number;
  regions: {
    header?: { x: number; y: number; width: number; height: number };
    sidebar?: { x: number; y: number; width: number; height: number };
    hero?: { x: number; y: number; width: number; height: number };
    footer?: { x: number; y: number; width: number; height: number };
  };
}

interface CssRule {
  selector: string;
  declarations: string[];
}

/** Converts a string to a safe CSS class name */
function toClassName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/** Formats a number to CSS pixel string */
function px(val: number | undefined): string {
  if (val === undefined || isNaN(val)) return "0px";
  return `${Math.round(val)}px`;
}

/** Checks if a string is a valid CSS color */
function isColor(c: string | undefined): boolean {
  if (!c || typeof c !== "string") return false;
  return /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+)$/.test(c.trim());
}

/** Escapes special HTML characters */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Returns a high-quality inline SVG for recognized UI icons.
 * For unknown icons, renders a clean geometric glyph matching detected size & tint (never a star!).
 */
export function getIconSvg(iconType: string | undefined, color = "#6B7280", size = 16): string {
  const c = isColor(color) ? color : "#6B7280";
  const s = size > 0 ? size : 16;
  const norm = (iconType || "unknown").toLowerCase().trim();

  switch (norm) {
    case "dashboard":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`;
    case "users":
    case "user":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    case "marketing":
    case "megaphone":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`;
    case "content":
    case "document":
    case "file-text":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
    case "folder":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    case "file":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
    case "cart":
    case "shopping-cart":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
    case "analytics":
    case "chart":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
    case "mail":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    case "calendar":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    case "settings":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    case "bell":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
    case "search":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    case "chevron-right":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    case "chevron-down":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    case "chevron-left":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    case "menu":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    case "check":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    case "close":
    case "x":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    case "plus":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    case "lock":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    case "help":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    case "logout":
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
    default:
      // Subtle UI placeholder glyph — NEVER a fake star!
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" stroke-dasharray="2 2"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

/** Extracts geometry from bbox or flat aliases */
function getElementGeometry(el: VisualElement): {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
} {
  const b = el.bbox || el.bounds;
  return {
    x: b?.x ?? el.x,
    y: b?.y ?? el.y,
    width: b?.width ?? el.width,
    height: b?.height ?? el.height,
  };
}

/** Extracts style properties from style sub-object or flat aliases */
function getElementStyles(el: VisualElement) {
  const s = el.style || {};
  return {
    fontFamily: el.fontFamily,
    fontSize: s.fontSize ?? el.fontSize,
    fontWeight: s.fontWeight ?? el.fontWeight,
    lineHeight: s.lineHeight ?? el.lineHeight,
    letterSpacing: s.letterSpacing ?? el.letterSpacing,
    color: s.color ?? el.color,
    textAlign: s.textAlign ?? el.textAlign,
    textTransform: s.textTransform ?? el.textTransform,
    background: s.background ?? el.background,
    borderRadius: s.borderRadius ?? el.borderRadius,
    border: s.border ?? el.border,
    boxShadow: s.boxShadow ?? el.boxShadow,
    opacity: s.opacity ?? el.opacity,
    padding: s.padding ?? el.padding,
    margin: s.margin ?? el.margin,
    gap: s.gap ?? el.gap,
  };
}

/**
 * Main HTML/CSS generator.
 * Converts a VisualDocument into self-contained, measurement-accurate HTML + CSS output.
 */
export function generateHtmlCssFromVisualDocument(doc: VisualDocument): GeneratedHtmlCss {
  console.log(`\n[HTML Generator] Generating deterministic HTML/CSS...`);

  const viewport = doc.canvas || doc.viewport || { width: 375, height: 812 };
  const global = doc.global || {};
  const cssRules: CssRule[] = [];
  const classCounter: Record<string, number> = {};

  let elementCount = 0;
  let textNodeCount = 0;
  let sectionCount = 0;
  let imageCount = 0;
  let iconCount = 0;

  const regions: GeneratedHtmlCss["regions"] = {};

  const bg = (doc.canvas?.background && isColor(doc.canvas.background))
    ? doc.canvas.background
    : isColor(global.background)
    ? (global.background as string)
    : "#ffffff";

  // ── Root style (NO overflow: hidden — Rule 6) ─────────
  const rootDecls = [
    `position: relative`,
    `width: ${px(viewport.width)}`,
    `min-height: ${px(viewport.height)}`,
    `box-sizing: border-box`,
    `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif`,
    `color: ${isColor(global.color) ? global.color : "#111827"}`,
    `background: ${bg}`,
    `display: flex`,
    `flex-direction: ${global.layoutDirection === "row" ? "row" : "column"}`,
  ];
  cssRules.push({
    selector: "* { box-sizing: border-box; margin: 0; padding: 0; }\n.design-root",
    declarations: rootDecls,
  });

  /**
   * Allocates a unique CSS class name for an element based on type or role.
   */
  function allocClass(el: VisualElement): string {
    const baseStr = el.role || el.type || "element";
    const base = toClassName(baseStr);
    const count = classCounter[base] ?? 0;
    classCounter[base] = count + 1;
    return `${base}-${count}`;
  }

  /**
   * Generates CSS declarations for an element using measured geometry, layout modes, and styles.
   */
  function buildDeclarations(
    el: VisualElement,
    _cssClass: string,
    isTopLevelSection: boolean,
    isAbsolute: boolean,
    parentW: number,
    _parentH: number
  ): string[] {
    const decls: string[] = [];

    const geom = getElementGeometry(el);
    const st = getElementStyles(el);
    const layoutMode = typeof el.layout === "string" ? (el.layout as ContainerLayoutMode) : undefined;

    // Positioning
    if (isTopLevelSection) {
      // Top-level sections stack as natural vertical flow blocks across the page
      decls.push("position: relative");
      decls.push("width: 100%");
      if (geom.height !== undefined && geom.height > 0) {
        decls.push(`min-height: ${px(geom.height)}`);
      }
    } else if (isAbsolute && geom.x !== undefined && geom.y !== undefined) {
      decls.push("position: absolute");
      decls.push(`left: ${px(geom.x)}`);
      decls.push(`top: ${px(geom.y)}`);
      if (geom.width !== undefined && geom.width > 0) decls.push(`width: ${px(geom.width)}`);
      if (geom.height !== undefined && geom.height > 0) decls.push(`height: ${px(geom.height)}`);
    } else {
      decls.push("position: relative");
      if (geom.width !== undefined && geom.width > 0 && geom.width < parentW * 0.98) {
        decls.push(`width: ${px(geom.width)}`);
      }
      if (geom.height !== undefined && geom.height > 0) {
        decls.push(`height: ${px(geom.height)}`);
      }
    }

    // Colors
    if (isColor(st.background)) decls.push(`background: ${st.background}`);
    if (isColor(st.color)) decls.push(`color: ${st.color}`);

    // Measured Typography
    if (st.fontFamily) decls.push(`font-family: ${st.fontFamily}`);
    if (st.fontSize !== undefined && st.fontSize > 0) decls.push(`font-size: ${px(st.fontSize)}`);
    if (st.fontWeight !== undefined && st.fontWeight > 0) decls.push(`font-weight: ${st.fontWeight}`);
    if (st.lineHeight !== undefined) {
      decls.push(`line-height: ${typeof st.lineHeight === "number" ? px(st.lineHeight) : st.lineHeight}`);
    }
    if (st.letterSpacing !== undefined) {
      decls.push(`letter-spacing: ${typeof st.letterSpacing === "number" ? px(st.letterSpacing) : st.letterSpacing}`);
    }
    if (st.textAlign) decls.push(`text-align: ${st.textAlign}`);
    if (st.textTransform) decls.push(`text-transform: ${st.textTransform}`);

    // Visual styles
    if (st.borderRadius !== undefined && st.borderRadius > 0) decls.push(`border-radius: ${px(st.borderRadius)}`);
    if (typeof st.border === "string" && st.border.trim()) decls.push(`border: ${st.border}`);
    if (typeof st.boxShadow === "string" && st.boxShadow.trim()) decls.push(`box-shadow: ${st.boxShadow}`);
    if (st.opacity !== undefined && st.opacity < 1) decls.push(`opacity: ${st.opacity}`);

    // Spacing
    if (st.padding !== undefined) {
      decls.push(`padding: ${typeof st.padding === "number" ? px(st.padding) : st.padding}`);
    }
    if (st.margin !== undefined) {
      decls.push(`margin: ${typeof st.margin === "number" ? px(st.margin) : st.margin}`);
    }
    if (st.gap !== undefined && st.gap > 0) {
      decls.push(`gap: ${px(st.gap)}`);
    }

    // Explicit Layout Mode mapping
    if (layoutMode) {
      switch (layoutMode) {
        case "ROW":
          decls.push("display: flex");
          decls.push("flex-direction: row");
          decls.push("align-items: center");
          if (el.type === "navbar" || el.type === "navigation") {
            decls.push("justify-content: space-between");
          }
          break;
        case "COLUMN":
          decls.push("display: flex");
          decls.push("flex-direction: column");
          break;
        case "TWO_COLUMN":
          decls.push("display: grid");
          decls.push("grid-template-columns: 1fr 1fr");
          decls.push("align-items: center");
          break;
        case "THREE_COLUMN":
          decls.push("display: grid");
          decls.push("grid-template-columns: repeat(3, 1fr)");
          break;
        case "FOUR_COLUMN":
          decls.push("display: grid");
          decls.push("grid-template-columns: repeat(4, 1fr)");
          break;
        case "GRID":
          decls.push("display: grid");
          decls.push("grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))");
          break;
        case "CENTER":
          decls.push("display: flex");
          decls.push("flex-direction: column");
          decls.push("align-items: center");
          decls.push("justify-content: center");
          decls.push("text-align: center");
          break;
        case "STACK":
        case "OVERLAY":
          decls.push("position: relative");
          break;
        case "ABSOLUTE":
          decls.push("position: absolute");
          break;
      }
    }

    // Type-specific display defaults if display not yet defined
    if (!decls.some(d => d.startsWith("display:"))) {
      switch (el.type) {
        case "sidebar":
          sectionCount++;
          regions.sidebar = {
            x: geom.x ?? 0,
            y: geom.y ?? 0,
            width: geom.width ?? parentW,
            height: geom.height ?? (geom.height || 800),
          };
          decls.push("display: flex");
          decls.push("flex-direction: column");
          break;
        case "navbar":
        case "header":
          sectionCount++;
          regions.header = {
            x: geom.x ?? 0,
            y: geom.y ?? 0,
            width: geom.width ?? parentW,
            height: geom.height ?? (geom.height || 64),
          };
          decls.push("display: flex");
          decls.push("flex-direction: row");
          decls.push("align-items: center");
          decls.push("justify-content: space-between");
          break;
        case "section":
        case "footer":
        case "card":
        case "container":
        case "column":
        case "list":
          sectionCount++;
          decls.push("display: flex");
          decls.push("flex-direction: column");
          break;
        case "row":
        case "navigation":
          sectionCount++;
          decls.push("display: flex");
          decls.push("flex-direction: row");
          decls.push("align-items: center");
          break;
        case "menu-item":
          decls.push("display: flex");
          decls.push("align-items: center");
          if (st.gap === undefined) decls.push("gap: 12px");
          break;
        case "heading":
        case "text":
        case "paragraph":
        case "label":
          decls.push("display: block");
          decls.push("white-space: pre-wrap");
          decls.push("word-break: break-word");
          break;
        case "button":
          decls.push("display: inline-flex");
          decls.push("align-items: center");
          decls.push("justify-content: center");
          decls.push("cursor: pointer");
          decls.push("border: none");
          break;
        case "divider":
          decls.push("display: block");
          if (!decls.some(d => d.startsWith("background:"))) decls.push("background: #E5E7EB");
          if (!decls.some(d => d.startsWith("height:"))) decls.push("height: 1px");
          break;
        case "icon":
          iconCount++;
          decls.push("display: inline-flex");
          decls.push("align-items: center");
          decls.push("justify-content: center");
          break;
        case "image":
        case "logo":
        case "avatar":
          imageCount++;
          decls.push("display: block");
          if (el.objectFit) decls.push(`object-fit: ${el.objectFit}`);
          break;
      }
    }

    return decls;
  }

  /**
   * Recursively renders a VisualElement into semantic HTML and CSS rules.
   */
  function renderElement(
    el: VisualElement,
    parentW: number,
    parentH: number,
    depth: number,
    isTopLevel: boolean
  ): string {
    elementCount++;

    const cssClass = allocClass(el);
    const geom = getElementGeometry(el);
    const st = getElementStyles(el);

    const elemW = geom.width ?? parentW;
    const elemH = geom.height ?? parentH;

    const isAbsolute = !isTopLevel && el.layout === "ABSOLUTE";
    const decls = buildDeclarations(el, cssClass, isTopLevel, isAbsolute, parentW, parentH);

    cssRules.push({ selector: `.${cssClass}`, declarations: decls });

    // Active state styling for highlighted menu items
    const isActive = el.state === "active" || el.isActive === true;
    if (isActive) {
      const activeDecls = [
        `background: ${st.background ? st.background : "rgba(220, 53, 69, 0.1)"}`,
        `color: ${st.color ? st.color : "#DC3545"}`,
        `font-weight: ${st.fontWeight ? Math.max(st.fontWeight, 600) : 600}`,
      ];
      cssRules.push({ selector: `.${cssClass}.active`, declarations: activeDecls });
    }

    const classNames = [cssClass];
    if (isActive) classNames.push("active");
    const classAttr = `class="${classNames.join(" ")}"`;

    const rawText = el.text || el.content || "";
    const escapedText = rawText ? escapeHtml(rawText) : "";

    // ── Semantic Element Renderers ────────────────────────
    switch (el.type) {
      case "heading": {
        textNodeCount++;
        const fs = st.fontSize || 20;
        const tag = fs >= 20 ? "h1" : fs >= 16 ? "h2" : "h3";
        return `  <${tag} ${classAttr}>${escapedText}</${tag}>`;
      }
      case "paragraph":
      case "text":
      case "label": {
        textNodeCount++;
        const tag = el.type === "paragraph" ? "p" : "span";
        return `  <${tag} ${classAttr}>${escapedText}</${tag}>`;
      }
      case "button": {
        textNodeCount++;
        let innerHtml = escapedText || "Button";
        if (el.isIcon || el.iconType) {
          const iconHtml = getIconSvg(el.iconType, st.color || "#FFFFFF", 16);
          innerHtml = `${iconHtml} <span>${escapedText}</span>`;
        }
        return `  <button ${classAttr}>${innerHtml}</button>`;
      }
      case "link": {
        textNodeCount++;
        return `  <a href="#" ${classAttr}>${escapedText || "Link"}</a>`;
      }
      case "input": {
        const placeholder = rawText ? `placeholder="${escapedText}"` : `placeholder="Search..."`;
        return `  <input type="text" ${classAttr} ${placeholder} />`;
      }
      case "divider": {
        return `  <hr ${classAttr} />`;
      }
      case "badge": {
        textNodeCount++;
        return `  <span ${classAttr}>${escapedText || "New"}</span>`;
      }
      case "icon": {
        const iconColor = el.iconColor || st.color || "#6B7280";
        const iconSize = geom.width || geom.height || 16;
        const svgContent = getIconSvg(el.iconType || el.iconName, iconColor, iconSize);
        return `  <div ${classAttr}>${svgContent}</div>`;
      }
      case "image":
      case "logo":
      case "avatar": {
        imageCount++;
        const imgW = geom.width || 120;
        const imgH = geom.height || 60;
        const radius = st.borderRadius || (el.type === "avatar" ? Math.round(imgW / 2) : 4);
        const bgFill = st.background || "#F3F4F6";
        const altText = escapedText || el.type;

        // Render clean inline SVG placeholder image preserving exact geometry
        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}" viewBox="0 0 ${imgW} ${imgH}"><rect width="100%" height="100%" rx="${radius}" fill="${bgFill}"/><text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="12" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">${altText}</text></svg>`;
        const src = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;

        return `  <img ${classAttr} src="${src}" alt="${altText}" />`;
      }
      case "menu-item": {
        textNodeCount++;
        const iconColor = el.iconColor || st.color || (isActive ? "#DC3545" : "#6B7280");
        const leadingIcon = el.iconType || el.iconName
          ? getIconSvg(el.iconType || el.iconName, iconColor, 16)
          : "";

        let trailingBadge = "";
        if (el.badge?.text) {
          const badgeBg = el.badge.background || "#EF4444";
          const badgeColor = el.badge.color || "#FFFFFF";
          trailingBadge = `<span style="margin-left: auto; background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; padding: 2px 6px; border-radius: 9999px;">${escapeHtml(el.badge.text)}</span>`;
        } else if (el.rightIcon) {
          const rightSvg = getIconSvg(el.rightIcon, iconColor, 14);
          trailingBadge = `<span style="margin-left: auto;">${rightSvg}</span>`;
        }

        return `  <div ${classAttr}>${leadingIcon}<span>${escapedText}</span>${trailingBadge}</div>`;
      }
      case "sidebar": {
        const childrenHtml = renderChildren(el.children, elemW, elemH, depth + 1);
        return `  <aside ${classAttr}>\n${childrenHtml}\n  </aside>`;
      }
      case "navbar": {
        const childrenHtml = renderChildren(el.children, elemW, elemH, depth + 1);
        return `  <nav ${classAttr}>\n${childrenHtml}\n  </nav>`;
      }
      case "header": {
        const childrenHtml = renderChildren(el.children, elemW, elemH, depth + 1);
        return `  <header ${classAttr}>\n${childrenHtml}\n  </header>`;
      }
      case "footer": {
        const childrenHtml = renderChildren(el.children, elemW, elemH, depth + 1);
        return `  <footer ${classAttr}>\n${childrenHtml}\n  </footer>`;
      }
      case "section": {
        const childrenHtml = renderChildren(el.children, elemW, elemH, depth + 1);
        return `  <section ${classAttr}>\n${childrenHtml}\n  </section>`;
      }
      case "navigation":
      case "list": {
        const childrenHtml = renderChildren(el.children, elemW, elemH, depth + 1);
        return `  <ul ${classAttr}>\n${childrenHtml}\n  </ul>`;
      }
      default: {
        // Generic container / card / row / column
        const childrenHtml = renderChildren(el.children, elemW, elemH, depth + 1);
        const textContent = escapedText ? `<span>${escapedText}</span>` : "";
        return `  <div ${classAttr}>\n${textContent}${childrenHtml}\n  </div>`;
      }
    }
  }

  /**
   * Helper to render child elements recursively.
   */
  function renderChildren(
    children: VisualElement[] | undefined,
    parentW: number,
    parentH: number,
    depth: number
  ): string {
    if (!Array.isArray(children) || children.length === 0) return "";
    return children
      .map(child => renderElement(child, parentW, parentH, depth, false))
      .join("\n");
  }

  // ── Render Top-Level Elements ─────────────────────────
  const bodyHtml = doc.elements
    .map(el => renderElement(el, viewport.width, viewport.height, 0, true))
    .join("\n");

  const fullHtml = `<div class="design-root">\n${bodyHtml}\n</div>`;

  // ── Build Final CSS String ────────────────────────────
  const cssBlocks: string[] = [];
  const seenSelectors = new Set<string>();

  for (const rule of cssRules) {
    if (seenSelectors.has(rule.selector)) continue;
    seenSelectors.add(rule.selector);

    if (rule.declarations.length === 0) continue;

    // Deduplicate properties (Bug 18 fix) so each CSS property is emitted only once
    const declMap = new Map<string, string>();
    for (const d of rule.declarations) {
      const colonIdx = d.indexOf(":");
      if (colonIdx !== -1) {
        const prop = d.slice(0, colonIdx).trim().toLowerCase();
        const val = d.slice(colonIdx + 1).trim();
        declMap.set(prop, val);
      } else {
        declMap.set(d.trim(), "");
      }
    }

    if (declMap.size === 0) continue;
    const body = Array.from(declMap.entries())
      .map(([prop, val]) => (val ? `  ${prop}: ${val};` : `  ${prop};`))
      .join("\n");
    cssBlocks.push(`${rule.selector} {\n${body}\n}`);
  }

  const fullCss = cssBlocks.join("\n\n");

  console.log(`[HTML Generator] Elements generated: ${elementCount}`);
  console.log(`[HTML Generator] Text nodes: ${textNodeCount}`);
  console.log(`[HTML Generator] Sections/Containers: ${sectionCount}`);
  console.log(`[HTML Generator] Images: ${imageCount}`);
  console.log(`[HTML Generator] ✓ HTML/CSS generated successfully`);

  return {
    html: fullHtml,
    css: fullCss,
    elementCount,
    textNodeCount,
    sectionCount,
    imageCount,
    iconCount,
    regions,
  };
}

/**
 * Validates generated HTML and CSS for basic structural correctness and anti-corruption.
 */
export function validateGeneratedOutput(
  html: string,
  css: string,
  _stats?: { elementCount: number; textNodeCount: number }
): string[] {
  const errors: string[] = [];

  if (!html || html.length < 20) {
    errors.push("Generated HTML is empty or too short");
  }
  if (!html.includes('class="design-root"')) {
    errors.push('Generated HTML is missing root <div class="design-root">');
  }
  if (!css || css.length < 20) {
    errors.push("Generated CSS is empty or too short");
  }

  // Check for overflow: hidden on root (Rule 6 violation)
  const rootOverflowMatch = /\.design-root\s*{[^}]*overflow\s*:\s*hidden/i.test(css);
  if (rootOverflowMatch) {
    errors.push(".design-root must not have overflow: hidden (Rule 6)");
  }

  // Check for recursive selector patterns
  const recursiveRegex = /\.([a-zA-Z0-9_-]+)(?:\s+\.\1)+/g;
  if (recursiveRegex.test(css)) {
    errors.push("Generated CSS contains recursive selector patterns");
  }

  console.log(`\n[HTML Validation]`);
  console.log(`  HTML:       ${html.length > 20 ? "PASS" : "FAIL"}`);
  console.log(`  CSS:        ${css.length > 20 ? "PASS" : "FAIL"}`);
  console.log(`  Repetition: ${!recursiveRegex.test(css) ? "PASS" : "FAIL"}`);
  console.log(`  Overflow:   ${!rootOverflowMatch ? "PASS" : "FAIL"}`);

  return errors;
}
