/**
 * DesignForge AI — Figma to HTML & CSS Code Generator
 *
 * Converts any Figma frame or node tree directly into clean, semantic,
 * modern HTML and CSS without any AI API keys or network dependencies.
 * Full image extraction support into assets/ folder and live preview base64.
 */

export interface ExportedAsset {
  filename: string;
  relativePath: string;
  base64: string;
  mimeType: string;
}

export interface FigmaToCodeResult {
  html: string;
  css: string;
  combinedHtml: string;
  frameName: string;
  nodeId: string;
  width: number;
  height: number;
  nodeCount: number;
  assets: ExportedAsset[];
}

interface CssRule {
  selector: string;
  declarations: Record<string, string>;
}

class CodeGeneratorContext {
  private classCount = new Map<string, number>();
  private usedClasses = new Set<string>();
  private assetCount = new Map<string, number>();
  private rules: CssRule[] = [];
  public nodeCount = 0;
  public assets: ExportedAsset[] = [];

  public getUniqueClassName(name: string, fallback: string): string {
    let clean = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!clean || /^\d+$/.test(clean) || clean.length < 2) {
      clean = fallback;
    }

    if (!this.classCount.has(clean)) {
      this.classCount.set(clean, 1);
      this.usedClasses.add(clean);
      return clean;
    }

    const count = this.classCount.get(clean)! + 1;
    this.classCount.set(clean, count);
    const unique = `${clean}-${count}`;
    this.usedClasses.add(unique);
    return unique;
  }

  public registerAsset(suggestedName: string, base64: string, mimeType = "image/png"): ExportedAsset {
    let clean = suggestedName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!clean || clean.length < 2) {
      clean = "asset";
    }

    let filename = `${clean}.png`;
    if (this.assetCount.has(clean)) {
      const count = this.assetCount.get(clean)! + 1;
      this.assetCount.set(clean, count);
      filename = `${clean}-${count}.png`;
    } else {
      this.assetCount.set(clean, 1);
    }

    const asset: ExportedAsset = {
      filename,
      relativePath: `assets/${filename}`,
      base64,
      mimeType,
    };
    this.assets.push(asset);
    return asset;
  }

  public addRule(selector: string, declarations: Record<string, string>) {
    const filtered: Record<string, string> = {};
    for (const [key, val] of Object.entries(declarations)) {
      if (val !== undefined && val !== null && val !== "") {
        filtered[key] = val;
      }
    }
    if (Object.keys(filtered).length > 0) {
      this.rules.push({ selector, declarations: filtered });
    }
  }

  public formatCss(): string {
    const lines: string[] = [];

    // CSS Reset & Base styling
    lines.push(`/* DesignForge AI — Generated Stylesheet */`);
    lines.push(`* {`);
    lines.push(`  box-sizing: border-box;`);
    lines.push(`  margin: 0;`);
    lines.push(`  padding: 0;`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`body {`);
    lines.push(`  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;`);
    lines.push(`  -webkit-font-smoothing: antialiased;`);
    lines.push(`  -moz-osx-font-smoothing: grayscale;`);
    lines.push(`  overflow-x: hidden;`);
    lines.push(`  background-color: transparent;`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`img {`);
    lines.push(`  display: block;`);
    lines.push(`  max-width: 100%;`);
    lines.push(`  height: auto;`);
    lines.push(`}`);
    lines.push(``);

    for (const rule of this.rules) {
      lines.push(`${rule.selector} {`);
      for (const [prop, val] of Object.entries(rule.declarations)) {
        lines.push(`  ${prop}: ${val};`);
      }
      lines.push(`}`);
      lines.push(``);
    }

    return lines.join("\n");
  }
}

// ─── Color & Paint Helpers ─────────────────────────────────────

function colorToCssRgba(color: RGB | RGBA, alphaMultiplier = 1): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = "a" in color ? color.a * alphaMultiplier : alphaMultiplier;

  if (a >= 0.99) {
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return hex.toUpperCase();
  }
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(2)})`;
}

function parseFillsToCss(fills: readonly Paint[] | PluginAPI["mixed"]): {
  backgroundColor?: string;
  background?: string;
  imageFill?: ImagePaint;
} {
  if (!Array.isArray(fills) || fills.length === 0) {
    return {};
  }

  const visibleFills = fills.filter((f) => f.visible !== false);
  if (visibleFills.length === 0) {
    return {};
  }

  const imageFill = visibleFills.find((f) => f.type === "IMAGE") as ImagePaint | undefined;
  const solid = visibleFills.find((f) => f.type === "SOLID") as SolidPaint | undefined;
  const gradient = visibleFills.find(
    (f) => f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL"
  ) as GradientPaint | undefined;

  if (gradient && gradient.type === "GRADIENT_LINEAR") {
    try {
      const transform = gradient.gradientTransform;
      const a = transform[0][0];
      const b = transform[1][0];
      const angleRad = Math.atan2(b, a);
      let angleDeg = Math.round((angleRad * 180) / Math.PI + 90);
      if (angleDeg < 0) angleDeg += 360;

      const stops = gradient.gradientStops
        .map((s) => `${colorToCssRgba(s.color)} ${Math.round(s.position * 100)}%`)
        .join(", ");

      return { background: `linear-gradient(${angleDeg}deg, ${stops})`, imageFill };
    } catch {
      // Fallback
    }
  }

  if (solid) {
    return {
      backgroundColor: colorToCssRgba(solid.color, solid.opacity ?? 1),
      imageFill,
    };
  }

  return { imageFill };
}

function parseStrokesToCss(node: MinimalStrokesMixin): { border?: string } {
  if (!("strokes" in node) || !Array.isArray(node.strokes) || node.strokes.length === 0) {
    return {};
  }
  const stroke = node.strokes.find((s) => s.visible !== false && s.type === "SOLID") as SolidPaint | undefined;
  if (!stroke) return {};

  const weight = typeof (node as any).strokeWeight === "number" ? Math.max(1, Math.round((node as any).strokeWeight)) : 1;
  const color = colorToCssRgba(stroke.color, stroke.opacity ?? 1);
  return { border: `${weight}px solid ${color}` };
}

function parseEffectsToCss(effects: readonly Effect[]): { boxShadow?: string; filter?: string; backdropFilter?: string } {
  if (!Array.isArray(effects) || effects.length === 0) return {};

  const shadows: string[] = [];
  let filterBlur = 0;
  let backdropBlur = 0;

  for (const eff of effects) {
    if (eff.visible === false) continue;

    if (eff.type === "DROP_SHADOW" || eff.type === "INNER_SHADOW") {
      const inset = eff.type === "INNER_SHADOW" ? "inset " : "";
      const x = Math.round(eff.offset.x);
      const y = Math.round(eff.offset.y);
      const radius = Math.round(eff.radius);
      const spread = Math.round(eff.spread || 0);
      const color = colorToCssRgba(eff.color);
      shadows.push(`${inset}${x}px ${y}px ${radius}px ${spread}px ${color}`);
    } else if (eff.type === "LAYER_BLUR") {
      filterBlur = Math.round(eff.radius);
    } else if (eff.type === "BACKGROUND_BLUR") {
      backdropBlur = Math.round(eff.radius);
    }
  }

  const res: { boxShadow?: string; filter?: string; backdropFilter?: string } = {};
  if (shadows.length > 0) res.boxShadow = shadows.join(", ");
  if (filterBlur > 0) res.filter = `blur(${filterBlur}px)`;
  if (backdropBlur > 0) res.backdropFilter = `blur(${backdropBlur}px)`;
  return res;
}

function parseCornerRadiusToCss(node: any): { borderRadius?: string } {
  if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
    return { borderRadius: `${Math.round(node.cornerRadius)}px` };
  }
  if (
    typeof node.topLeftRadius === "number" ||
    typeof node.topRightRadius === "number" ||
    typeof node.bottomRightRadius === "number" ||
    typeof node.bottomLeftRadius === "number"
  ) {
    const tl = Math.round(node.topLeftRadius || 0);
    const tr = Math.round(node.topRightRadius || 0);
    const br = Math.round(node.bottomRightRadius || 0);
    const bl = Math.round(node.bottomLeftRadius || 0);
    if (tl || tr || br || bl) {
      return { borderRadius: `${tl}px ${tr}px ${br}px ${bl}px` };
    }
  }
  return {};
}

function parseFontWeight(style: string): string {
  const s = style.toLowerCase();
  if (s.includes("black") || s.includes("heavy")) return "900";
  if (s.includes("extra bold") || s.includes("extrabold")) return "800";
  if (s.includes("bold")) return "700";
  if (s.includes("semi bold") || s.includes("semibold")) return "600";
  if (s.includes("medium")) return "500";
  if (s.includes("light")) return "300";
  if (s.includes("thin")) return "200";
  return "400";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof (figma as any).base64Encode === "function") {
    return (figma as any).base64Encode(bytes);
  }
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

function bytesToUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder("utf-8").decode(bytes);
  }
  let str = "";
  const len = bytes.byteLength;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    const slice = bytes.subarray(i, Math.min(i + chunk, len));
    str += String.fromCharCode.apply(null, slice as any);
  }
  return decodeURIComponent(escape(str));
}

// ─── Image Exporter (Direct Hash or Node Export) ───────────────

async function exportNodeOrPaintImage(
  node: SceneNode,
  imagePaint?: ImagePaint
): Promise<string | null> {
  // 1. Try figma.getImageByHash (pristine original asset, no overlays)
  if (imagePaint && imagePaint.imageHash && typeof (figma as any).getImageByHash === "function") {
    try {
      const img = (figma as any).getImageByHash(imagePaint.imageHash);
      if (img && typeof img.getBytesAsync === "function") {
        const bytes = await img.getBytesAsync();
        if (bytes && bytes.byteLength > 0) {
          return bytesToBase64(bytes);
        }
      }
    } catch (hashErr) {
      console.warn(`[FigmaToCode] getImageByHash failed for ${node.name}:`, hashErr);
    }
  }

  // 2. Fallback: exportAsync directly on the node
  try {
    const maxDim = Math.max(node.width, node.height);
    const scale = Math.min(2, Math.max(1, 1200 / Math.max(1, maxDim)));
    const bytes = await node.exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: scale },
    });
    if (bytes && bytes.byteLength > 0) {
      return bytesToBase64(bytes);
    }
  } catch (err) {
    console.warn(`[FigmaToCode] exportAsync failed for ${node.name}:`, err);
  }

  return null;
}

// ─── Recursive Node Tree Converter ─────────────────────────────

async function convertNode(
  node: SceneNode,
  ctx: CodeGeneratorContext,
  parentLayoutMode: "NONE" | "HORIZONTAL" | "VERTICAL" | null,
  isRoot: boolean,
  indent = "  "
): Promise<string> {
  if (!node.visible) return "";
  ctx.nodeCount++;

  const decls: Record<string, string> = {};

  // Sizing & Positioning
  const isAutoLayoutChild = parentLayoutMode === "HORIZONTAL" || parentLayoutMode === "VERTICAL";
  const isAbsoluteChild = !isRoot && (!isAutoLayoutChild || (node as any).layoutPositioning === "ABSOLUTE");

  if (isRoot) {
    decls["width"] = "100%";
    decls["max-width"] = `${Math.round(node.width)}px`;
    decls["min-height"] = `${Math.round(node.height)}px`;
    decls["margin"] = "0 auto";
    decls["position"] = "relative";
  } else if (isAbsoluteChild) {
    decls["position"] = "absolute";
    decls["left"] = `${Math.round(node.x)}px`;
    decls["top"] = `${Math.round(node.y)}px`;
    decls["width"] = `${Math.round(node.width)}px`;
    decls["height"] = `${Math.round(node.height)}px`;
  } else {
    // In Auto Layout parent
    const layoutSizingH = (node as any).layoutSizingHorizontal;
    const layoutSizingV = (node as any).layoutSizingVertical;
    const layoutGrow = (node as any).layoutGrow;
    const layoutAlign = (node as any).layoutAlign;

    if (layoutSizingH === "FILL" || layoutGrow === 1) {
      decls["flex"] = "1 1 0%";
      decls["width"] = "100%";
    } else if (layoutSizingH === "HUG") {
      decls["width"] = "fit-content";
    } else {
      decls["width"] = `${Math.round(node.width)}px`;
      decls["flex-shrink"] = "0";
    }

    if (layoutSizingV === "FILL" || layoutAlign === "STRETCH") {
      decls["align-self"] = "stretch";
    } else if (layoutSizingV === "HUG") {
      decls["height"] = "fit-content";
    } else if (node.type !== "TEXT") {
      decls["height"] = `${Math.round(node.height)}px`;
      decls["flex-shrink"] = "0";
    }
  }

  // Opacity
  if (typeof (node as any).opacity === "number" && (node as any).opacity < 1) {
    decls["opacity"] = `${+(node as any).opacity.toFixed(2)}`;
  }

  // Corner Radius, Strokes & Effects
  if ("cornerRadius" in node || "topLeftRadius" in node) {
    const cr = parseCornerRadiusToCss(node);
    if (cr.borderRadius) decls["border-radius"] = cr.borderRadius;
  }
  if ("strokes" in node) {
    const strokes = parseStrokesToCss(node as any);
    if (strokes.border) decls["border"] = strokes.border;
  }
  if ("effects" in node && Array.isArray((node as any).effects)) {
    const fx = parseEffectsToCss((node as any).effects);
    if (fx.boxShadow) decls["box-shadow"] = fx.boxShadow;
    if (fx.filter) decls["filter"] = fx.filter;
    if (fx.backdropFilter) decls["backdrop-filter"] = fx.backdropFilter;
  }

  // ─── 1. TEXT NODES ───────────────────────────────────────────
  if (node.type === "TEXT") {
    const textNode = node as TextNode;
    const characters = textNode.characters || "";
    if (!characters.trim()) return "";

    const className = ctx.getUniqueClassName(node.name, "text");

    // Typography
    if (textNode.fontName !== figma.mixed) {
      decls["font-family"] = `"${textNode.fontName.family}", sans-serif`;
      decls["font-weight"] = parseFontWeight(textNode.fontName.style);
    }
    if (typeof textNode.fontSize === "number") {
      decls["font-size"] = `${Math.round(textNode.fontSize)}px`;
    }
    if (textNode.lineHeight !== figma.mixed) {
      const lh = textNode.lineHeight;
      if (lh.unit === "PIXELS") {
        decls["line-height"] = `${Math.round(lh.value)}px`;
      } else if (lh.unit === "PERCENT") {
        decls["line-height"] = `${+(lh.value / 100).toFixed(2)}`;
      }
    }
    if (textNode.letterSpacing !== figma.mixed) {
      const ls = textNode.letterSpacing;
      if (ls.unit === "PIXELS" && Math.abs(ls.value) > 0.1) {
        decls["letter-spacing"] = `${+ls.value.toFixed(2)}px`;
      } else if (ls.unit === "PERCENT" && Math.abs(ls.value) > 0.1) {
        decls["letter-spacing"] = `${+(ls.value / 100).toFixed(3)}em`;
      }
    }
    if (textNode.textAlignHorizontal) {
      const alignMap: Record<string, string> = {
        LEFT: "left",
        CENTER: "center",
        RIGHT: "right",
        JUSTIFIED: "justify",
      };
      const val = alignMap[textNode.textAlignHorizontal];
      if (val) {
        decls["text-align"] = val;
      }
    }
    if (textNode.textCase === "UPPER") {
      decls["text-transform"] = "uppercase";
    } else if (textNode.textCase === "LOWER") {
      decls["text-transform"] = "lowercase";
    } else if (textNode.textCase === "TITLE") {
      decls["text-transform"] = "capitalize";
    }

    // Text color
    if (Array.isArray(textNode.fills) && textNode.fills.length > 0) {
      const fill = textNode.fills.find((f) => f.visible !== false && f.type === "SOLID") as SolidPaint | undefined;
      if (fill) {
        decls["color"] = colorToCssRgba(fill.color, fill.opacity ?? 1);
      }
    }

    ctx.addRule(`.${className}`, decls);

    // Semantic tag choice
    const fontSize = typeof textNode.fontSize === "number" ? textNode.fontSize : 16;
    const nameLower = node.name.toLowerCase();
    let tag = "p";

    if (fontSize >= 32 || nameLower.includes("h1") || nameLower.includes("headline")) {
      tag = "h1";
    } else if (fontSize >= 24 || nameLower.includes("h2")) {
      tag = "h2";
    } else if (fontSize >= 20 || nameLower.includes("h3")) {
      tag = "h3";
    } else if (fontSize >= 16 && (decls["font-weight"] === "600" || decls["font-weight"] === "700")) {
      tag = "h4";
    } else if (nameLower.includes("badge") || nameLower.includes("tag") || nameLower.includes("label")) {
      tag = "span";
    }

    const formattedContent = escapeHtml(characters).replace(/\n/g, "<br />\n" + indent + "  ");
    return `${indent}<${tag} class="${className}">${formattedContent}</${tag}>\n`;
  }

  // ─── 2. VECTOR / ICON NODES ──────────────────────────────────
  if (
    node.type === "VECTOR" ||
    node.type === "BOOLEAN_OPERATION" ||
    node.type === "STAR" ||
    node.type === "POLYGON"
  ) {
    try {
      const svgBytes = await node.exportAsync({ format: "SVG" });
      let svgContent = bytesToUtf8(svgBytes);

      // Clean up SVG tag
      svgContent = svgContent.replace(/<\?xml[^>]*\?>/gi, "").trim();
      const className = ctx.getUniqueClassName(node.name, "icon");
      decls["display"] = "inline-block";
      decls["vertical-align"] = "middle";
      ctx.addRule(`.${className}`, decls);

      // Add class to SVG root
      svgContent = svgContent.replace(/<svg\b([^>]*)>/i, `<svg class="${className}" $1>`);
      return `${indent}${svgContent}\n`;
    } catch {
      const className = ctx.getUniqueClassName(node.name, "vector");
      decls["background-color"] = "currentColor";
      ctx.addRule(`.${className}`, decls);
      return `${indent}<div class="${className}"></div>\n`;
    }
  }

  // ─── 3. SHAPES & IMAGES (RECTANGLE, ELLIPSE, LEAF FRAMES) ─────
  if (node.type === "ELLIPSE") {
    decls["border-radius"] = "50%";
  }

  // Check fills
  const fills = "fills" in node && Array.isArray((node as any).fills) ? (node as any).fills : [];
  const fillResult = parseFillsToCss(fills);
  if (fillResult.backgroundColor) decls["background-color"] = fillResult.backgroundColor;
  if (fillResult.background) decls["background"] = fillResult.background;

  const isContainer = "children" in node;
  const childCount = isContainer ? ((node as any).children?.length || 0) : 0;
  const imageFill = fillResult.imageFill;

  const isNamedAsImage =
    node.name.toLowerCase().includes("image") ||
    node.name.toLowerCase().includes("photo") ||
    node.name.toLowerCase().includes("avatar") ||
    node.name.toLowerCase().includes("picture") ||
    node.name.toLowerCase().includes("img");

  // CASE A: Node is an image element (Rectangle or childless Frame with Image fill or named image)
  if (imageFill || (isNamedAsImage && (!isContainer || childCount === 0))) {
    const base64 = await exportNodeOrPaintImage(node, imageFill);
    if (base64) {
      const asset = ctx.registerAsset(node.name, base64);
      const className = ctx.getUniqueClassName(node.name, "image");
      decls["object-fit"] = "cover";
      ctx.addRule(`.${className}`, decls);
      return `${indent}<img src="${asset.relativePath}" alt="${escapeHtml(node.name)}" class="${className}" />\n`;
    }
  }

  // ─── 4. FRAMES / GROUPS / CONTAINERS ─────────────────────────
  const currentLayoutMode: "NONE" | "HORIZONTAL" | "VERTICAL" =
    "layoutMode" in node && typeof (node as any).layoutMode === "string"
      ? (node as any).layoutMode
      : "NONE";

  if (isContainer) {
    // If container HAS an image fill and has children (e.g. Hero Section with background photo):
    if (imageFill) {
      const base64 = await exportNodeOrPaintImage(node, imageFill);
      if (base64) {
        const asset = ctx.registerAsset(`${node.name}-bg`, base64);
        decls["background-image"] = `url('${asset.relativePath}')`;
        decls["background-size"] = "cover";
        decls["background-position"] = "center";
        decls["background-repeat"] = "no-repeat";
      }
    }

    if ((node as any).clipsContent) {
      decls["overflow"] = "hidden";
    }

    if (currentLayoutMode === "HORIZONTAL" || currentLayoutMode === "VERTICAL") {
      decls["display"] = "flex";
      decls["flex-direction"] = currentLayoutMode === "VERTICAL" ? "column" : "row";

      // Gap
      const itemSpacing = (node as any).itemSpacing;
      if (typeof itemSpacing === "number" && itemSpacing > 0) {
        decls["gap"] = `${Math.round(itemSpacing)}px`;
      }

      // Justify Content
      const primaryAlign = (node as any).primaryAxisAlignItems;
      if (primaryAlign === "CENTER") decls["justify-content"] = "center";
      else if (primaryAlign === "MAX") decls["justify-content"] = "flex-end";
      else if (primaryAlign === "SPACE_BETWEEN") decls["justify-content"] = "space-between";
      else decls["justify-content"] = "flex-start";

      // Align Items
      const counterAlign = (node as any).counterAxisAlignItems;
      if (counterAlign === "CENTER") decls["align-items"] = "center";
      else if (counterAlign === "MAX") decls["align-items"] = "flex-end";
      else if (counterAlign === "BASELINE") decls["align-items"] = "baseline";
      else decls["align-items"] = "flex-start";

      // Flex Wrap
      if ((node as any).layoutWrap === "WRAP") {
        decls["flex-wrap"] = "wrap";
      }

      // Padding
      const pt = Math.round((node as any).paddingTop || 0);
      const pr = Math.round((node as any).paddingRight || 0);
      const pb = Math.round((node as any).paddingBottom || 0);
      const pl = Math.round((node as any).paddingLeft || 0);

      if (pt || pr || pb || pl) {
        if (pt === pr && pr === pb && pb === pl) {
          decls["padding"] = `${pt}px`;
        } else if (pt === pb && pr === pl) {
          decls["padding"] = `${pt}px ${pr}px`;
        } else {
          decls["padding"] = `${pt}px ${pr}px ${pb}px ${pl}px`;
        }
      }
    } else if (!isRoot && (node as any).children && (node as any).children.length > 0) {
      decls["position"] = isAbsoluteChild ? "absolute" : "relative";
    }
  }

  // Tag heuristic for containers
  const nameLower = node.name.toLowerCase();
  let tag = "div";
  if (nameLower.includes("header") || nameLower.includes("nav")) {
    tag = nameLower.includes("nav") ? "nav" : "header";
  } else if (nameLower.includes("footer")) {
    tag = "footer";
  } else if (nameLower.includes("section") || nameLower.includes("hero")) {
    tag = "section";
  } else if (nameLower.includes("button") || nameLower.includes("btn") || nameLower.includes("cta")) {
    tag = "button";
    decls["cursor"] = "pointer";
    decls["border"] = decls["border"] || "none";
  } else if (nameLower.includes("card") || nameLower.includes("article")) {
    tag = "article";
  }

  const className = ctx.getUniqueClassName(node.name, isContainer ? "container" : "shape");
  ctx.addRule(`.${className}`, decls);

  // Recurse children
  let childrenHtml = "";
  if (isContainer) {
    const children = (node as any).children as SceneNode[];
    for (const child of children) {
      childrenHtml += await convertNode(child, ctx, currentLayoutMode, false, indent + "  ");
    }
  }

  if (childrenHtml.trim()) {
    return `${indent}<${tag} class="${className}">\n${childrenHtml}${indent}</${tag}>\n`;
  }
  return `${indent}<${tag} class="${className}"></${tag}>\n`;
}

// ─── Main Export Function ──────────────────────────────────────

export async function generateCodeFromFigmaNode(targetNode: SceneNode): Promise<FigmaToCodeResult> {
  const ctx = new CodeGeneratorContext();

  const bodyHtml = await convertNode(
    targetNode,
    ctx,
    null,
    true, // isRoot
    "    "
  );

  const css = ctx.formatCss();
  const title = escapeHtml(targetNode.name);

  // Standard index.html with linked style.css (for ZIP export with assets/)
  const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
${bodyHtml}
</body>
</html>`;

  // For live preview iframe & single file: replace assets/ with data URLs so all images render!
  let previewBodyHtml = bodyHtml;
  let previewCss = css;

  for (const asset of ctx.assets) {
    const dataUrl = `data:${asset.mimeType};base64,${asset.base64}`;
    previewBodyHtml = previewBodyHtml.split(asset.relativePath).join(dataUrl);
    previewCss = previewCss.split(asset.relativePath).join(dataUrl);
  }

  const combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — DesignForge AI</title>
  <style>
${previewCss}
  </style>
</head>
<body>
${previewBodyHtml}
</body>
</html>`;

  return {
    html: standaloneHtml,
    css,
    combinedHtml,
    frameName: targetNode.name,
    nodeId: targetNode.id,
    width: Math.round(targetNode.width),
    height: Math.round(targetNode.height),
    nodeCount: ctx.nodeCount,
    assets: ctx.assets,
  };
}
