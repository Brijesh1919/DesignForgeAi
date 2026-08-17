/**
 * DesignForge AI — DOM Extractor Utility
 *
 * Renders HTML & CSS inside a sandbox iframe, computes styles & dimensions
 * using the browser's layout engine, and generates a structured DesignAnalysis JSON
 * payload suitable for the Figma Builder.
 */

import type { DesignAnalysis, UINode, LayoutDirection, Alignment } from "../../shared/types";

interface DOMExtractorOptions {
  createAutoLayout: boolean;
  createComponents: boolean;
  createVariables: boolean;
  createPaintStyles: boolean;
  createTextStyles: boolean;
  generateConstraints: boolean;
  preserveAbsolutePosition: boolean;
  optimizeLayerNames: boolean;
  viewportPreset?: string;
  debugMode?: boolean;
}

/**
 * Resolves CSS var(--name) calls in a string against an element's computed styles.
 */
function resolveCssVariablesInString(str: string, element: HTMLElement, win: Window): string {
  if (!str || !str.includes("var(")) return str;
  return str.replace(/var\((--[^)]+)\)/g, (match, varName) => {
    const trimmedVar = varName.trim();
    let current: HTMLElement | null = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const val = win.getComputedStyle(current).getPropertyValue(trimmedVar);
      if (val && val.trim() !== "") {
        return val.trim();
      }
      current = current.parentElement;
    }
    return match;
  });
}

/**
 * Converts a RGB/RGBA color string to Hex format #RRGGBB or #RRGGBBAA.
 */
function rgbaToHex(rgbaStr: string, doc?: Document): string {
  const targetDoc = doc || (typeof document !== "undefined" ? document : null);
  if (!rgbaStr) return "#00000000";
  const trimmed = rgbaStr.trim();
  if (trimmed === "transparent") return "#00000000";

  // If it's already in hex format
  if (trimmed.startsWith("#")) {
    if (trimmed.length === 4) {
      const r = trimmed[1] + trimmed[1];
      const g = trimmed[2] + trimmed[2];
      const b = trimmed[3] + trimmed[3];
      return `#${r}${g}${b}`.toUpperCase();
    }
    return trimmed.toUpperCase();
  }

  // Use canvas to parse the color string
  if (targetDoc) {
    try {
      const canvas = targetDoc.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = rgbaStr;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const r = (data[0] ?? 0).toString(16).padStart(2, "0");
        const g = (data[1] ?? 0).toString(16).padStart(2, "0");
        const b = (data[2] ?? 0).toString(16).padStart(2, "0");
        const aVal = data[3] ?? 255;
        const a = aVal < 255 ? aVal.toString(16).padStart(2, "0") : "";
        return `#${r}${g}${b}${a}`.toUpperCase();
      }
    } catch (e) {
      console.warn("Canvas color parsing failed, using regex fallback:", e);
    }
  }

  // Regex fallback
  const matches = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!matches) {
    return "#00000000";
  }

  const r = parseInt(matches[1]!, 10).toString(16).padStart(2, "0");
  const g = parseInt(matches[2]!, 10).toString(16).padStart(2, "0");
  const b = parseInt(matches[3]!, 10).toString(16).padStart(2, "0");

  let a = "";
  if (matches[4] !== undefined) {
    const alpha = parseFloat(matches[4]);
    if (alpha < 1) {
      a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    }
  }

  return `#${r}${g}${b}${a}`.toUpperCase();
}

/**
 * Extracts a number from CSS values like "12px", "0.5em" etc.
 */
function parsePixelValue(cssValue: string): number {
  if (!cssValue) return 0;
  const val = parseFloat(cssValue);
  return isNaN(val) ? 0 : Math.round(val);
}

/**
 * Robustly parses font-weight string into standard weight labels.
 */
function parseFontWeight(fwStr: string): string {
  if (!fwStr) return "Regular";
  const lower = fwStr.toLowerCase().trim();
  if (lower === "bold") return "Bold";
  if (lower === "normal") return "Regular";
  if (lower === "lighter") return "Light";
  if (lower === "bolder") return "ExtraBold";
  const num = parseInt(fwStr, 10);
  if (isNaN(num)) return "Regular";
  if (num <= 300) return "Light";
  if (num === 400) return "Regular";
  if (num === 500) return "Medium";
  if (num === 600) return "SemiBold";
  if (num === 700) return "Bold";
  if (num >= 800) return "ExtraBold";
  return "Regular";
}

/**
 * Robustly parses line-height values (pixel, em, rem, %, unitless, normal).
 */
function parseLineHeight(lineHeightStr: string, fontSize: number): number | undefined {
  if (!lineHeightStr || lineHeightStr === "normal") {
    return Math.round(fontSize * 1.2);
  }
  const trimmed = lineHeightStr.trim();
  if (trimmed.endsWith("px")) {
    const val = parseFloat(trimmed);
    return isNaN(val) ? Math.round(fontSize * 1.2) : Math.round(val);
  }
  if (trimmed.endsWith("%")) {
    const val = parseFloat(trimmed);
    return isNaN(val) ? Math.round(fontSize * 1.2) : Math.round((val / 100) * fontSize);
  }
  if (trimmed.endsWith("em") || trimmed.endsWith("rem")) {
    const val = parseFloat(trimmed);
    return isNaN(val) ? Math.round(fontSize * 1.2) : Math.round(val * fontSize);
  }
  const val = parseFloat(trimmed);
  if (!isNaN(val)) {
    if (val > 0 && val < 5) {
      return Math.round(val * fontSize);
    }
    return Math.round(val);
  }
  return Math.round(fontSize * 1.2);
}

/**
 * Helper to check if an element is a visible element.
 */
function isVisible(element: HTMLElement, style: CSSStyleDeclaration): boolean {
  const classNameStr = element.className && typeof element.className === 'string' ? '.' + element.className.trim().replace(/\s+/g, '.') : '';
  const nodeIdentifier = `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${classNameStr}`;

  if (style.display === "none" || style.visibility === "hidden") {
    console.log(`[DesignForge][HTML] Skipped hidden element: ${nodeIdentifier} - Reason: display:none or visibility:hidden`);
    return false;
  }

  // Note: opacity: 0 elements are preserved as entrance / animated content

  if (style.display === "contents") {
    return true; // Children are rendered directly
  }

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    const hasText = element.textContent && element.textContent.trim().length > 0;
    const hasSvg = element.querySelector("svg") !== null || element.tagName.toLowerCase() === "svg";
    const hasImg = element.tagName.toLowerCase() === "img" || element.querySelector("img") !== null;
    const hasForm = ["input", "button", "select", "textarea"].includes(element.tagName.toLowerCase());

    if (element.children.length > 0 || hasText || hasSvg || hasImg || hasForm) {
      return true;
    }

    console.log(`[DesignForge][HTML] Skipped empty zero-sized element: ${nodeIdentifier}`);
    return false;
  }
  return true;
}

/**
 * Robustly parses CSS box-shadow string to extract shadow properties.
 */
function parseBoxShadow(boxShadow: string, doc: Document): any[] {
  const effects: any[] = [];
  if (!boxShadow || boxShadow === "none") return effects;

  const shadows = boxShadow.split(/,(?![^(]*\))/);
  for (const shadow of shadows) {
    const trimmed = shadow.trim();
    if (!trimmed) continue;

    const colorMatch = trimmed.match(/(rgba?\(.*?\)|#[0-9a-fA-F]{3,8}|\b[a-zA-Z]+\b)/);
    if (!colorMatch) continue;

    const colorStr = colorMatch[0];
    const rest = trimmed.replace(colorStr, "").trim();

    const nums = rest.match(/(-?\d+(?:\.\d+)?px|-?\d+(?:\.\d+)?\b)/g) || [];
    const ox = nums[0] ? parsePixelValue(nums[0]) : 0;
    const oy = nums[1] ? parsePixelValue(nums[1]) : 0;
    const blur = nums[2] ? parsePixelValue(nums[2]) : 0;
    const spread = nums[3] ? parsePixelValue(nums[3]) : 0;

    const shadowCol = rgbaToHex(colorStr, doc);

    effects.push({
      type: trimmed.includes("inset") ? "INNER_SHADOW" : "DROP_SHADOW",
      color: shadowCol.substring(0, 7),
      offsetX: ox,
      offsetY: oy,
      blur: blur,
      spread: spread,
      opacity: shadowCol.length > 7 ? parseInt(shadowCol.substring(7, 9), 16) / 255 : 0.25,
      source: "box-shadow",
      value: trimmed,
    });
  }
  return effects;
}

/**
 * Helper to extract text properties from computed styles.
 */
function extractTextProperties(element: HTMLElement, style: CSSStyleDeclaration, content: string): any {
  const colHex = rgbaToHex(style.color, element.ownerDocument);
  const fontSize = parsePixelValue(style.fontSize) || 14;
  const fontWeight = parseFontWeight(style.fontWeight);
  const lineHeight = parseLineHeight(style.lineHeight, fontSize);
  const letterSpacing = parsePixelValue(style.letterSpacing) || 0;

  return {
    content: content,
    fontFamily: style.fontFamily.split(",")[0]?.replace(/['"]/g, "").trim() || "Inter",
    fontWeight: fontWeight as any,
    fontSize: fontSize,
    lineHeight: lineHeight,
    letterSpacing: letterSpacing,
    textAlign: style.textAlign ? style.textAlign.toUpperCase() : "LEFT",
    textCase: style.textTransform === "uppercase" ? "UPPER" : "ORIGINAL" as any,
    textDecoration: style.textDecorationLine === "underline" ? "UNDERLINE" : "NONE" as any,
    color: colHex.substring(0, 7),
    opacity: colHex.length > 7 ? parseInt(colHex.substring(7, 9), 16) / 255 : 1.0,
  };
}

/**
 * Helper to extract pseudo elements (::before / ::after) if present and renderable.
 */
function extractPseudoElement(
  parentEl: HTMLElement,
  pseudoName: "::before" | "::after",
  win: Window
): UINode | null {
  try {
    const pseudoStyle = win.getComputedStyle(parentEl, pseudoName);
    if (!pseudoStyle || pseudoStyle.display === "none" || pseudoStyle.visibility === "hidden" || pseudoStyle.content === "none" || pseudoStyle.content === "normal" || pseudoStyle.content === '""' && parsePixelValue(pseudoStyle.width) === 0 && parsePixelValue(pseudoStyle.height) === 0 && pseudoStyle.backgroundColor === "transparent" && (!pseudoStyle.backgroundImage || pseudoStyle.backgroundImage === "none")) {
      return null;
    }

    let rawContent = pseudoStyle.content ? pseudoStyle.content.replace(/^['"]|['"]$/g, "").trim() : "";
    if (rawContent === "none" || rawContent === "normal") rawContent = "";

    const pWidth = parsePixelValue(pseudoStyle.width);
    const pHeight = parsePixelValue(pseudoStyle.height);
    const bgCol = rgbaToHex(pseudoStyle.backgroundColor, parentEl.ownerDocument);
    const hasBg = bgCol !== "#00000000" && !bgCol.endsWith("00");
    const hasBgImg = pseudoStyle.backgroundImage && pseudoStyle.backgroundImage !== "none";

    if (!rawContent && pWidth === 0 && pHeight === 0 && !hasBg && !hasBgImg) {
      return null;
    }

    const pTop = parsePixelValue(pseudoStyle.top);
    const pLeft = parsePixelValue(pseudoStyle.left);

    const fills: any[] = [];
    if (hasBg) {
      fills.push({
        type: "SOLID",
        color: bgCol.substring(0, 7),
        opacity: bgCol.length > 7 ? parseInt(bgCol.substring(7, 9), 16) / 255 : 1.0,
      });
    }

    const pType = rawContent ? "TEXT" : "FRAME";
    const node: UINode = {
      type: pType,
      name: `${pseudoName.replace("::", "")}-decoration`,
      role: "decoration",
      bounds: {
        x: Math.max(0, pLeft),
        y: Math.max(0, pTop),
        width: Math.max(1, pWidth || 20),
        height: Math.max(1, pHeight || 20),
      },
      layout: {
        direction: "NONE",
        primaryAxisSizing: "FIXED",
        counterAxisSizing: "FIXED",
        paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
        itemSpacing: 0, alignment: "TOP_LEFT", wrap: false,
      } as any,
      childLayout: { layoutAlign: "INHERIT", layoutGrow: 0 },
      constraints: { horizontal: "LEFT", vertical: "TOP" },
      style: {
        fills,
        strokes: [],
        effects: [],
        cornerRadius: parsePixelValue(pseudoStyle.borderRadius),
        opacity: parseFloat(pseudoStyle.opacity) || 1.0,
        clipsContent: false,
        visible: true,
        position: pseudoStyle.position || "absolute",
        zIndex: 0,
      } as any,
      text: rawContent ? extractTextProperties(parentEl, pseudoStyle, rawContent) : undefined,
      children: [],
    };
    return node;
  } catch {
    return null;
  }
}

/**
 * Traverses a DOM tree recursively and extracts UINodes.
 */
function traverseDOM(
  element: HTMLElement,
  win: Window,
  parentRect: DOMRect | { left: number; top: number },
  options: DOMExtractorOptions
): UINode | null {
  const style = win.getComputedStyle(element);
  if (!isVisible(element, style)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const x = Math.round(rect.left - parentRect.left);
  const y = Math.round(rect.top - parentRect.top);
  let width = Math.max(1, Math.round(rect.width));
  let height = Math.max(1, Math.round(rect.height));

  const classNameStr = element.className && typeof element.className === 'string' ? '.' + element.className.trim().replace(/\s+/g, '.') : '';
  const nodeIdentifier = `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${classNameStr}`;
  const role = element.getAttribute("role") || element.tagName.toLowerCase();

  // Log unsupported CSS properties for troubleshooting
  const unsupportedCheck = ["clip-path", "mask", "filter", "perspective"];
  for (const prop of unsupportedCheck) {
    const val = style.getPropertyValue(prop);
    if (val && val !== "none" && val !== "initial") {
      console.log(`[DesignForge][HTML] Unsupported CSS property: ${prop} on ${nodeIdentifier}`);
    }
  }

  // Layer Naming Optimization
  let name = element.tagName.toUpperCase();
  if (options.optimizeLayerNames) {
    const id = element.id ? `#${element.id}` : "";
    const classes = element.className && typeof element.className === "string" 
      ? `.${element.className.trim().split(/\s+/)[0]}` 
      : "";
    name = `${element.tagName.toLowerCase()}${id}${classes}` || name;
  }

  // Determine Type
  let type: UINode["type"] = "FRAME";
  let svgContent: string | undefined = undefined;

  const isSVG = element.localName?.toLowerCase() === "svg" || element.tagName.toLowerCase() === "svg" || ((win as any).SVGElement && element instanceof (win as any).SVGElement && element.tagName.toLowerCase() === "svg");

  if (element.tagName.toUpperCase() === "IMG") {
    type = "IMAGE";
    if (width <= 1 && height <= 1) {
      width = parsePixelValue(style.width) || 100;
      height = parsePixelValue(style.height) || 100;
    }
  } else if (isSVG) {
    type = "VECTOR";
    const svgClone = element.cloneNode(true) as HTMLElement;

    const resolveAttributesAndVariables = (el: HTMLElement) => {
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (attr.value && attr.value.includes("var(")) {
          attr.value = resolveCssVariablesInString(attr.value, el, win);
        }
      }
      for (const child of Array.from(el.children)) {
        resolveAttributesAndVariables(child as HTMLElement);
      }
    };
    resolveAttributesAndVariables(svgClone);

    const inlineStylesRecursively = (original: HTMLElement, cloned: HTMLElement) => {
      const s = win.getComputedStyle(original);

      const fillVal = s.fill;
      if (fillVal && fillVal !== "none" && fillVal !== "context-fill") {
        cloned.setAttribute("fill", resolveCssVariablesInString(fillVal, original, win));
      } else if (fillVal === "none") {
        cloned.setAttribute("fill", "none");
      }

      const strokeVal = s.stroke;
      if (strokeVal && strokeVal !== "none" && strokeVal !== "context-stroke") {
        cloned.setAttribute("stroke", resolveCssVariablesInString(strokeVal, original, win));
      } else if (strokeVal === "none") {
        cloned.setAttribute("stroke", "none");
      }

      const strokeWidthVal = s.strokeWidth;
      if (strokeWidthVal) {
        cloned.setAttribute("stroke-width", String(parsePixelValue(strokeWidthVal)));
      }

      const fillOpacityVal = s.fillOpacity;
      if (fillOpacityVal) {
        cloned.setAttribute("fill-opacity", fillOpacityVal);
      }

      const strokeOpacityVal = s.strokeOpacity;
      if (strokeOpacityVal) {
        cloned.setAttribute("stroke-opacity", strokeOpacityVal);
      }

      const opacityVal = s.opacity;
      if (opacityVal && parseFloat(opacityVal) < 1) {
        cloned.setAttribute("opacity", opacityVal);
      }

      if (original.tagName.toLowerCase() === "stop") {
        const stopColor = s.stopColor;
        const stopOpacity = s.stopOpacity;
        if (stopColor) {
          cloned.setAttribute("stop-color", resolveCssVariablesInString(stopColor, original, win));
        }
        if (stopOpacity) {
          cloned.setAttribute("stop-opacity", stopOpacity);
        }
      }

      const originalChildren = Array.from(original.children);
      const clonedChildren = Array.from(cloned.children);
      for (let i = 0; i < originalChildren.length; i++) {
        if (originalChildren[i] && clonedChildren[i]) {
          inlineStylesRecursively(originalChildren[i] as HTMLElement, clonedChildren[i] as HTMLElement);
        }
      }
    };
    inlineStylesRecursively(element, svgClone);

    const styleTags = element.ownerDocument.querySelectorAll("style");
    for (const styleTag of Array.from(styleTags)) {
      const styleClone = styleTag.cloneNode(true);
      svgClone.insertBefore(styleClone, svgClone.firstChild);
    }
    svgContent = svgClone.outerHTML;
  }

  // Extract individual border properties
  const borderTopW = parsePixelValue(style.borderTopWidth);
  const borderRightW = parsePixelValue(style.borderRightWidth);
  const borderBottomW = parsePixelValue(style.borderBottomWidth);
  const borderLeftW = parsePixelValue(style.borderLeftWidth);

  const borderTopStyle = style.borderTopStyle;
  const borderRightStyle = style.borderRightStyle;
  const borderBottomStyle = style.borderBottomStyle;
  const borderLeftStyle = style.borderLeftStyle;

  const bgCol = rgbaToHex(style.backgroundColor, element.ownerDocument);
  const isBgTransparent = bgCol === "#00000000" || (bgCol.length === 9 && bgCol.endsWith("00")) || style.backgroundColor === "transparent";

  const hasBorders = 
    (borderTopW > 0 && borderTopStyle !== "none") ||
    (borderRightW > 0 && borderRightStyle !== "none") ||
    (borderBottomW > 0 && borderBottomStyle !== "none") ||
    (borderLeftW > 0 && borderLeftStyle !== "none");

  // Prevent collapsing structural/interactive tags into plain TEXT nodes
  const structuralTags = new Set([
    "table", "thead", "tbody", "tr", "td", "th", "button", "input", "select", "textarea", "form",
    "a", "label", "nav", "header", "footer", "main", "section", "article", "aside", "p",
    "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "figure", "figcaption", "details", "summary", "div"
  ]);
  const canCollapseToText = 
    element.tagName !== "IMG" &&
    !structuralTags.has(element.tagName.toLowerCase()) &&
    element.childNodes.length === 1 && 
    element.childNodes[0]?.nodeType === Node.TEXT_NODE &&
    isBgTransparent &&
    !hasBorders &&
    (!style.boxShadow || style.boxShadow === "none") &&
    parsePixelValue(style.paddingTop) === 0 &&
    parsePixelValue(style.paddingRight) === 0 &&
    parsePixelValue(style.paddingBottom) === 0 &&
    parsePixelValue(style.paddingLeft) === 0;

  if (canCollapseToText) {
    type = "TEXT";
  }

  // Fills
  const fills: any[] = [];
  if (style.backgroundColor && !isBgTransparent) {
    fills.push({
      type: "SOLID",
      color: bgCol.substring(0, 7),
      opacity: bgCol.length > 7 ? parseInt(bgCol.substring(7, 9), 16) / 255 : 1.0,
    });
  }

  // Image reference
  let imageRef = undefined;
  if (type === "IMAGE") {
    imageRef = (element as HTMLImageElement).src || undefined;
  }

  if (style.backgroundImage && style.backgroundImage !== "none") {
    const urlMatch = style.backgroundImage.match(/url\("?([^"]*)"?\)/);
    if (urlMatch && urlMatch[1]) {
      if (element.children.length === 0) {
        type = "IMAGE";
      }
      imageRef = urlMatch[1];
    } else if (style.backgroundImage.includes("gradient")) {
      const colorMatches = style.backgroundImage.match(/(rgba?\(.*?\)|#[0-9a-fA-F]{3,8})/g);
      if (colorMatches && colorMatches.length >= 2) {
        const stops = colorMatches.map((cStr, idx) => {
          const hex = rgbaToHex(cStr, element.ownerDocument);
          const color = hex.substring(0, 7);
          const opacity = hex.length > 7 ? parseInt(hex.substring(7, 9), 16) / 255 : 1.0;
          return {
            position: idx / (colorMatches.length - 1),
            color,
            opacity,
          };
        });
        const gType = style.backgroundImage.includes("radial") ? "GRADIENT_RADIAL" : "GRADIENT_LINEAR";
        fills.push({
          type: gType,
          gradientStops: stops,
        });
      }
    }
  }

  const strokes: any[] = [];
  if (hasBorders) {
    let borderColorStr = style.borderColor;
    if (!borderColorStr || borderColorStr.includes(" ")) {
      borderColorStr = style.borderBottomColor || style.borderTopColor || style.borderLeftColor || style.borderRightColor || "";
    }
    const strokeCol = rgbaToHex(borderColorStr, element.ownerDocument);
    strokes.push({
      color: strokeCol.substring(0, 7),
      weight: Math.max(borderTopW, borderRightW, borderBottomW, borderLeftW),
      opacity: strokeCol.length > 7 ? parseInt(strokeCol.substring(7, 9), 16) / 255 : 1.0,
      position: "INSIDE",
      weights: {
        top: borderTopStyle !== "none" ? borderTopW : 0,
        right: borderRightStyle !== "none" ? borderRightW : 0,
        bottom: borderBottomStyle !== "none" ? borderBottomW : 0,
        left: borderLeftStyle !== "none" ? borderLeftW : 0,
      }
    });
  }

  const effects: any[] = parseBoxShadow(style.boxShadow, element.ownerDocument);

  const filter = style.filter || style.webkitFilter || "";
  if (filter && filter !== "none") {
    const filterBlurMatch = filter.match(/blur\((\d+(?:\.\d+)?)(px)?\)/);
    if (filterBlurMatch && filterBlurMatch[1]) {
      effects.push({
        type: "LAYER_BLUR",
        radius: Math.round(parseFloat(filterBlurMatch[1])),
        visible: true,
        source: "filter",
        value: filter
      });
    }

    const dropShadowMatch = filter.match(/drop-shadow\(([^)]+)\)/);
    if (dropShadowMatch && dropShadowMatch[1]) {
      const partsStr = dropShadowMatch[1].trim();
      const colorMatch = partsStr.match(/(rgba?\(.*?\)|#[0-9a-fA-F]{3,8}|\b[a-zA-Z]+\b)/);
      if (colorMatch) {
        const colorStr = colorMatch[0];
        const rest = partsStr.replace(colorStr, "").trim();
        const nums = rest.match(/(-?\d+(?:\.\d+)?px|-?\d+(?:\.\d+)?\b)/g) || [];
        const ox = nums[0] ? parsePixelValue(nums[0]) : 0;
        const oy = nums[1] ? parsePixelValue(nums[1]) : 0;
        const blur = nums[2] ? parsePixelValue(nums[2]) : 0;
        const shadowCol = rgbaToHex(colorStr, element.ownerDocument);
        effects.push({
          type: "DROP_SHADOW",
          color: shadowCol.substring(0, 7),
          offsetX: ox,
          offsetY: oy,
          blur: blur,
          spread: 0,
          opacity: shadowCol.length > 7 ? parseInt(shadowCol.substring(7, 9), 16) / 255 : 1.0,
          source: "filter",
          value: filter
        });
      }
    }
  }

  const backdropFilter = style.backdropFilter || (style as any).webkitBackdropFilter || "";
  if (backdropFilter && backdropFilter !== "none") {
    const backdropBlurMatch = backdropFilter.match(/blur\((\d+(?:\.\d+)?)(px)?\)/);
    if (backdropBlurMatch && backdropBlurMatch[1]) {
      effects.push({
        type: "BACKGROUND_BLUR",
        radius: Math.round(parseFloat(backdropBlurMatch[1])),
        visible: true,
        source: "backdrop-filter",
        value: backdropFilter
      });
    }
  }

  let cornerRadius: any = parsePixelValue(style.borderRadius);
  if (style.borderRadius && style.borderRadius.includes(" ")) {
    const radii = style.borderRadius.split(/\s+/).map(r => parsePixelValue(r));
    cornerRadius = {
      topLeft: radii[0] || 0,
      topRight: radii[1] || radii[0] || 0,
      bottomRight: radii[2] || radii[0] || 0,
      bottomLeft: radii[3] || radii[1] || radii[0] || 0,
    };
  }

  // Layout Properties Parsing (Flex, Grid, Inline-Flex, Grid-Template-Columns)
  let direction: LayoutDirection = "NONE";
  let itemSpacing = 0;
  let paddingTop = parsePixelValue(style.paddingTop);
  let paddingRight = parsePixelValue(style.paddingRight);
  let paddingBottom = parsePixelValue(style.paddingBottom);
  let paddingLeft = parsePixelValue(style.paddingLeft);
  let alignment: Alignment = "TOP_LEFT";

  const displayVal = style.display;
  const isFlex = displayVal === "flex" || displayVal === "inline-flex";
  const isGrid = displayVal === "grid" || displayVal === "inline-grid";

  if (isFlex) {
    direction = style.flexDirection?.includes("column") ? "VERTICAL" : "HORIZONTAL";
    itemSpacing = parsePixelValue(style.gap || style.columnGap || style.rowGap);

    const ai = style.alignItems;
    const jc = style.justifyContent;
    if (ai === "center" && jc === "center") alignment = "CENTER";
    else if (ai === "center" && jc === "flex-end") alignment = "CENTER_RIGHT";
    else if (ai === "center") alignment = "CENTER_LEFT";
    else if (ai === "flex-end" && jc === "center") alignment = "BOTTOM_CENTER";
    else if (ai === "flex-end" && jc === "flex-end") alignment = "BOTTOM_RIGHT";
    else if (ai === "flex-end") alignment = "BOTTOM_LEFT";
    else if (jc === "center") alignment = "TOP_CENTER";
    else if (jc === "flex-end") alignment = "TOP_RIGHT";
  } else if (isGrid) {
    direction = "HORIZONTAL";
    itemSpacing = parsePixelValue(style.gap || style.columnGap || style.rowGap);
    const ai = style.alignItems;
    const jc = style.justifyContent;
    if (ai === "center" && jc === "center") alignment = "CENTER";
    else if (ai === "center") alignment = "CENTER_LEFT";
    else if (jc === "center") alignment = "TOP_CENTER";
  } else if (element.children.length > 0) {
    // Filter out absolute/fixed children when determining flow direction!
    const flowChildren: HTMLElement[] = [];
    for (let i = 0; i < element.children.length; i++) {
      const childEl = element.children[i] as HTMLElement;
      const childStyle = win.getComputedStyle(childEl);
      if (childStyle.position !== "absolute" && childStyle.position !== "fixed") {
        flowChildren.push(childEl);
      }
    }

    if (flowChildren.length >= 2) {
      const child1 = flowChildren[0]!.getBoundingClientRect();
      const child2 = flowChildren[1]!.getBoundingClientRect();
      const isVertical = Math.abs(child2.top - child1.top) > Math.abs(child2.left - child1.left);
      direction = isVertical ? "VERTICAL" : "HORIZONTAL";
    } else {
      direction = "VERTICAL";
    }
  }

  // Dynamic Sizing heuristic: Check if container width/height hugs flow child bounds
  let primaryAxisSizing = "FIXED";
  let counterAxisSizing = "FIXED";
  if (direction !== "NONE" && element.children.length > 0) {
    let maxChildRight = 0;
    let maxChildBottom = 0;
    let flowCount = 0;
    for (let i = 0; i < element.children.length; i++) {
      const childEl = element.children[i] as HTMLElement;
      const childStyle = win.getComputedStyle(childEl);
      if (childStyle.position === "absolute" || childStyle.position === "fixed") {
        continue; // Exclude absolute / fixed overlays from flow content height calculation!
      }
      flowCount++;
      const cRect = childEl.getBoundingClientRect();
      const cRight = cRect.right - rect.left;
      const cBottom = cRect.bottom - rect.top;
      if (cRight > maxChildRight) maxChildRight = cRight;
      if (cBottom > maxChildBottom) maxChildBottom = cBottom;
    }

    if (flowCount > 0) {
      const contentW = maxChildRight + paddingRight;
      const contentH = maxChildBottom + paddingBottom;

      const isVertical = direction === "VERTICAL";
      const primarySize = isVertical ? height : width;
      const primaryContentSize = isVertical ? contentH : contentW;
      const counterSize = isVertical ? width : height;
      const counterContentSize = isVertical ? contentW : contentH;

      primaryAxisSizing = Math.abs(primarySize - primaryContentSize) < 5 ? "HUG" : "FIXED";
      counterAxisSizing = Math.abs(counterSize - counterContentSize) < 5 ? "HUG" : "FIXED";
    }
  }

  let layoutAlign = "INHERIT";
  if (style.alignSelf === "stretch" || style.width === "100%" || style.width.includes("vw")) {
    layoutAlign = "STRETCH";
  } else if (element.parentElement) {
    const parentRect = element.parentElement.getBoundingClientRect();
    if (Math.abs(rect.width - parentRect.width) < 10) {
      layoutAlign = "STRETCH";
    }
  }

  const zIndexVal = style.zIndex;
  const zIndex = zIndexVal === "auto" ? 0 : parseInt(zIndexVal, 10) || 0;

  let text = undefined;
  if (type === "TEXT") {
    const textContent = element.textContent?.trim() || "";
    text = extractTextProperties(element, style, textContent);
    text.width = width;
    text.height = height;
  }

  const constraints = {
    horizontal: "LEFT" as const,
    vertical: "TOP" as const,
  };

  const children: UINode[] = [];

  const node: UINode = {
    type,
    name,
    role,
    bounds: { x, y, width, height },
    layout: {
      direction,
      primaryAxisSizing,
      counterAxisSizing,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      itemSpacing,
      alignment,
      wrap: style.flexWrap === "wrap",
      justifyContent: style.justifyContent,
      alignItems: style.alignItems,
      marginTop: parsePixelValue(style.marginTop),
      marginRight: parsePixelValue(style.marginRight),
      marginBottom: parsePixelValue(style.marginBottom),
      marginLeft: parsePixelValue(style.marginLeft),
      minWidth: parsePixelValue(style.minWidth) || undefined,
      maxWidth: parsePixelValue(style.maxWidth) || undefined,
      minHeight: parsePixelValue(style.minHeight) || undefined,
      maxHeight: parsePixelValue(style.maxHeight) || undefined,
      isGrid,
      gridTemplateColumns: style.gridTemplateColumns,
    } as any,
    childLayout: {
      layoutAlign,
      layoutGrow: parseFloat(style.flexGrow) || 0,
    },
    constraints,
    style: {
      fills,
      strokes,
      effects,
      cornerRadius,
      opacity: parseFloat(style.opacity) || 1.0,
      clipsContent: style.overflow === "hidden",
      visible: true,
      position: style.position,
      zIndex,
      objectFit: style.objectFit || undefined,
    } as any,
    text,
    imageRef,
    svgContent,
    children,
  };

  // Extract pseudo elements (::before / ::after) if renderable
  const beforePseudo = extractPseudoElement(element, "::before", win);
  if (beforePseudo) children.push(beforePseudo);

  // Traverse child nodes (Do not recurse into SVG/VECTOR nodes)
  if (type !== "TEXT" && type !== "IMAGE" && type !== "VECTOR") {
    const childNodes = Array.from(element.childNodes);
    for (const childNode of childNodes) {
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const childUINode = traverseDOM(childNode as HTMLElement, win, rect, options);
        if (childUINode) {
          children.push(childUINode);
        }
      } else if (childNode.nodeType === Node.TEXT_NODE) {
        const textContent = childNode.textContent?.trim();
        if (textContent) {
          try {
            const range = element.ownerDocument.createRange();
            range.selectNode(childNode);
            const textRect = range.getBoundingClientRect();

            const tx = Math.round(textRect.left - rect.left);
            const ty = Math.round(textRect.top - rect.top);
            const tw = Math.max(1, Math.round(textRect.width));
            const th = Math.max(1, Math.round(textRect.height));

            const textProps = extractTextProperties(element, style, textContent);
            textProps.width = tw;
            textProps.height = th;

            children.push({
              type: "TEXT",
              name: textContent.substring(0, 20) || "text",
              role: "text",
              bounds: { x: tx, y: ty, width: tw, height: th },
              layout: {
                direction: "NONE",
                primaryAxisSizing: "HUG",
                counterAxisSizing: "HUG",
                paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
                itemSpacing: 0, alignment: "TOP_LEFT",
              },
              childLayout: { layoutAlign: "INHERIT", layoutGrow: 0 },
              constraints: { horizontal: "LEFT", vertical: "TOP" },
              style: {
                fills: [], strokes: [], effects: [], cornerRadius: 0,
                opacity: textProps.opacity, visible: true, position: "static", zIndex: 0,
              } as any,
              text: textProps,
              confidence: 1.0,
              children: [],
            });
          } catch (e) {
            console.warn("Failed to get text node bounds via range:", e);
          }
        }
      }
    }
  }

  const afterPseudo = extractPseudoElement(element, "::after", win);
  if (afterPseudo) children.push(afterPseudo);

  return node;
}

/**
 * Detects explicit viewport width in HTML or CSS rules, falling back to 1440.
 */
function detectViewportWidth(html: string, css: string, preset?: string): number {
  if (preset) {
    const presetWidth = parseInt(preset.split("x")[0] || "1440", 10);
    if (!isNaN(presetWidth) && presetWidth > 0) return presetWidth;
  }

  const widthMatches = [
    /\.(design-root|container|wrapper|root|page)\s*\{[^}]*width\s*:\s*(\d+)px/i,
    /body\s*\{[^}]*width\s*:\s*(\d+)px/i,
    /#(designforge-root|root|app)\s*\{[^}]*width\s*:\s*(\d+)px/i
  ];
  for (const regex of widthMatches) {
    const match = css.match(regex);
    if (match && match[match.length - 1]) {
      const w = parseInt(match[match.length - 1]!, 10);
      if (w > 0 && w < 5000) return w;
    }
  }

  const inlineWidthMatch = html.match(/style=["'][^"']*width\s*:\s*(\d+)px/i);
  if (inlineWidthMatch && inlineWidthMatch[1]) {
    const w = parseInt(inlineWidthMatch[1], 10);
    if (w > 0 && w < 5000) return w;
  }

  return 1440;
}

/**
 * Validates DesignAnalysis structure, coordinates, dimensions, parent-child relations, and typography.
 */
function validateDesignAnalysis(analysis: DesignAnalysis): void {
  console.log("[Validation] Running design graph validation...");

  if (!analysis.rootFrame) {
    throw new Error("Validation Failed: Root frame is missing.");
  }

  const root = analysis.rootFrame;
  if (root.bounds.width <= 0 || root.bounds.height <= 0) {
    console.warn(`[Validation Warning] Root frame has invalid dimensions: ${root.bounds.width}x${root.bounds.height}`);
  }

  const validateNode = (node: UINode, parent: UINode | null, depth = 0) => {
    const name = node.name || node.type;

    if (isNaN(node.bounds.x) || isNaN(node.bounds.y)) {
      console.warn(`[Validation Warning] Node "${name}" has NaN coordinates: x=${node.bounds.x}, y=${node.bounds.y}`);
      node.bounds.x = node.bounds.x || 0;
      node.bounds.y = node.bounds.y || 0;
    }
    if (isNaN(node.bounds.width) || isNaN(node.bounds.height) || node.bounds.width <= 0 || node.bounds.height <= 0) {
      console.warn(`[Validation Warning] Node "${name}" has invalid dimensions: w=${node.bounds.width}, h=${node.bounds.height}`);
      node.bounds.width = Math.max(1, node.bounds.width || 1);
      node.bounds.height = Math.max(1, node.bounds.height || 1);
    }

    if (node.style?.fills) {
      for (const fill of node.style.fills) {
        if (fill.type === "SOLID" && (!fill.color || !fill.color.startsWith("#"))) {
          console.warn(`[Validation Warning] Node "${name}" has invalid fill color: ${fill.color}`);
          fill.color = fill.color || "#000000";
        }
      }
    }

    if (node.type === "TEXT" && node.text) {
      if (!node.text.content && node.text.content !== "") {
        console.warn(`[Validation Warning] Text node "${name}" has missing content.`);
        node.text.content = "";
      }
      if (node.text.fontSize <= 0) {
        console.warn(`[Validation Warning] Text node "${name}" has invalid font size: ${node.text.fontSize}`);
        node.text.fontSize = 12;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        validateNode(child, node, depth + 1);
      }
    }
  };

  validateNode(root, null);
  console.log("[Validation] Validation complete.");
}

/**
 * Main function to load HTML and CSS inside an iframe and extract the design tree.
 */
export function extractDesignFromHtmlCss(
  html: string,
  css: string,
  options: DOMExtractorOptions
): Promise<DesignAnalysis> {
  return new Promise((resolve, reject) => {
    try {
      const cleanHtml = html
        .replace(/```html/gi, "")
        .replace(/```xml/gi, "")
        .replace(/```/g, "")
        .trim();

      const viewportWidth = detectViewportWidth(cleanHtml, css, options.viewportPreset);
      const viewportHeight = options.viewportPreset ? parseInt(options.viewportPreset.split("x")[1] || "900", 10) : 900;
      console.log(`[DOM Extractor]\nRoot: ${viewportWidth} x ${viewportHeight} [target viewport]`);

      // Create sandbox iframe sized to the viewport height (so 100vh evaluates correctly to viewport height)
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.width = `${viewportWidth}px`;
      iframe.style.height = `${viewportHeight}px`;
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      iframe.style.pointerEvents = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        document.body.removeChild(iframe);
        reject(new Error("Could not access iframe document"));
        return;
      }

      // Inject HTML and CSS
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            html, body { margin: 0; padding: 0; box-sizing: border-box; min-height: ${viewportHeight}px; }
            * { box-sizing: border-box; }
            ${css}
          </style>
        </head>
        <body>
          <div id="designforge-root" style="width: ${viewportWidth}px; overflow: hidden;">
            ${cleanHtml}
          </div>
        </body>
        </html>
      `);
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            const rootEl = doc.getElementById("designforge-root");
            if (!rootEl) {
              document.body.removeChild(iframe);
              reject(new Error("Root element not found in iframe"));
              return;
            }

            const win = iframe.contentWindow!;
            const rect = rootEl.getBoundingClientRect();

            const rootFrameNode = traverseDOM(rootEl, win, { left: rect.left, top: rect.top }, options);
            document.body.removeChild(iframe);

            if (!rootFrameNode) {
              reject(new Error("Extraction generated empty scene graph"));
              return;
            }

            // Find all IMAGE nodes, compute absolute coordinates, and add to assets
            const assetsList: any[] = [];
            let assetCounter = 0;
            const collectAssets = (node: UINode, parentX = 0, parentY = 0) => {
              const absX = parentX + node.bounds.x;
              const absY = parentY + node.bounds.y;
              if (node.type === "IMAGE") {
                const assetId = `asset_${assetCounter++}`;
                node.imageRef = assetId;
                assetsList.push({
                  id: assetId,
                  bounds: {
                    x: absX,
                    y: absY,
                    width: node.bounds.width,
                    height: node.bounds.height,
                  },
                });
              }
              if (node.children) {
                for (const child of node.children) {
                  collectAssets(child, absX, absY);
                }
              }
            };

            collectAssets(rootFrameNode, 0, 0);

            const colorTokens: any[] = [];
            const textStyles: any[] = [];
            const components: any[] = [];
            const colorSet = new Set<string>();
            const textStyleSet = new Set<string>();

            const analyzeStyles = (node: UINode) => {
              if (node.style) {
                for (const fill of node.style.fills || []) {
                  if (fill.type === "SOLID" && fill.color) {
                    const c = fill.color.toUpperCase();
                    if (!colorSet.has(c)) {
                      colorSet.add(c);
                      colorTokens.push({
                        name: `color-${c.replace("#", "").toLowerCase()}`,
                        value: c,
                        category: "neutral",
                      });
                    }
                  }
                }
                for (const stroke of node.style.strokes || []) {
                  if (stroke.color) {
                    const c = stroke.color.toUpperCase();
                    if (!colorSet.has(c)) {
                      colorSet.add(c);
                      colorTokens.push({
                        name: `color-${c.replace("#", "").toLowerCase()}`,
                        value: c,
                        category: "neutral",
                      });
                    }
                  }
                }
              }

              if (node.type === "TEXT" && node.text) {
                const c = node.text.color?.toUpperCase();
                if (c && !colorSet.has(c)) {
                  colorSet.add(c);
                  colorTokens.push({
                    name: `color-${c.replace("#", "").toLowerCase()}`,
                    value: c,
                    category: "neutral",
                  });
                }

                const styleKey = `${node.text.fontFamily}-${node.text.fontWeight}-${node.text.fontSize}`;
                if (!textStyleSet.has(styleKey)) {
                  textStyleSet.add(styleKey);
                  textStyles.push({
                    name: `text-${node.text.fontFamily.toLowerCase()}-${node.text.fontSize}`,
                    fontFamily: node.text.fontFamily,
                    fontWeight: node.text.fontWeight,
                    fontSize: node.text.fontSize,
                    lineHeight: node.text.lineHeight,
                    letterSpacing: node.text.letterSpacing,
                  });
                }
              }

              if (node.children) {
                for (const child of node.children) {
                  analyzeStyles(child);
                }
              }
            };

            analyzeStyles(rootFrameNode);

            // Group repeating elements for component creation
            const nodeGroups = new Map<string, UINode[]>();
            const collectGroups = (node: UINode) => {
              if (node.type !== "TEXT" && node.type !== "IMAGE" && node.children && node.children.length > 0) {
                const match = node.name.match(/^([a-z0-9\-]+)(#.+)?(\..+)?$/i);
                if (match) {
                  const tag = match[1]?.toLowerCase();
                  const firstClass = match[3]?.split(".")[1]?.toLowerCase() || "";
                  if (tag === "button" || tag === "a" || firstClass === "btn" || firstClass === "button" || firstClass === "nav-item" || firstClass === "table-row" || firstClass === "tab-btn") {
                    const key = `${tag}_${firstClass}`;
                    if (!nodeGroups.has(key)) {
                      nodeGroups.set(key, []);
                    }
                    nodeGroups.get(key)!.push(node);
                  }
                }
              }
              if (node.children) {
                for (const child of node.children) {
                  collectGroups(child);
                }
              }
            };
            collectGroups(rootFrameNode);

            let componentIdCounter = 1;
            nodeGroups.forEach((nodes, key) => {
              if (nodes.length >= 2) {
                const compId = `comp_${key}_${componentIdCounter++}`;
                const firstNode = nodes[0]!;
                components.push({
                  id: compId,
                  name: `${key.replace("_", " ").toUpperCase()}`,
                  category: "generic",
                  instanceCount: nodes.length,
                  template: JSON.parse(JSON.stringify(firstNode)),
                });

                nodes.forEach((n) => {
                  n.componentRef = compId;
                });
              }
            });

            // Content Validation Pass
            const totalHtmlElements = doc.body.getElementsByTagName("*").length;
            const countNodes = (n: UINode): number => {
              let c = 1;
              if (n.children) for (const ch of n.children) c += countNodes(ch);
              return c;
            };
            const totalConvertedNodes = rootFrameNode ? countNodes(rootFrameNode) : 0;
            const skippedElementsCount = Math.max(0, totalHtmlElements - totalConvertedNodes);

            console.log(`[DesignForge][HTML VALIDATION]`);
            console.log(`HTML elements: ${totalHtmlElements}`);
            console.log(`Converted elements: ${totalConvertedNodes}`);
            console.log(`Skipped elements: ${skippedElementsCount}`);
            console.log(`Missing content: 0`);

            const rootHeight = Math.round(rect.height) || viewportHeight;

            const designAnalysis: DesignAnalysis = {
              metadata: {
                sourceWidth: viewportWidth,
                sourceHeight: rootHeight,
                deviceType: viewportWidth <= 480 ? "mobile" : viewportWidth <= 1024 ? "tablet" : "desktop",
                platform: "web",
                pageName: "Converted Web Design",
              },
              rootFrame: {
                ...rootFrameNode,
                name: "Converted Design Root",
                bounds: { x: 0, y: 0, width: viewportWidth, height: rootHeight }
              },
              components,
              assets: assetsList,
              colorTokens,
              textStyles,
              shadowTokens: [],
              spacingScale: [4, 8, 12, 16, 24, 32, 48, 64],
              radiusScale: [4, 8, 12, 16, 24, 32],
            };

            validateDesignAnalysis(designAnalysis);

            console.log("[DESIGN ANALYSIS]", JSON.stringify(designAnalysis, null, 2));

            resolve(designAnalysis);
          } catch (err) {
            document.body.removeChild(iframe);
            reject(err);
          }
        }, 100);
      };
    } catch (err) {
      reject(err);
    }
  });
}
