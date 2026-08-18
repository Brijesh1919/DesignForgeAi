/**
 * DesignForge AI — HTML/CSS Validation and Normalization Service
 *
 * Cleans, sanitizes, and normalizes vision-generated HTML & CSS.
 * Ensures the code is optimized to feed into the Figma DOM Extractor.
 */

export interface NormalizedResult {
  html: string;
  css: string;
  errors: string[];
}

/**
 * Normalizes CSS color values (e.g. named colors to hex, cleaning rgb formatting).
 */
function normalizeColors(css: string): string {
  const colorMap: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    gray: "#808080",
    grey: "#808080",
    transparent: "rgba(0,0,0,0)",
  };

  let cleaned = css;
  // Replace named colors
  for (const [name, hex] of Object.entries(colorMap)) {
    const regex = new RegExp(`:\\s*${name}\\s*(;|})`, "gi");
    cleaned = cleaned.replace(regex, `: ${hex}$1`);
  }

  return cleaned;
}

/**
 * Normalizes CSS dimension values (em, rem, vh, vw -> px).
 */
function normalizeDimensions(css: string, expectedWidth = 1200, expectedHeight = 900): string {
  let cleaned = css;

  // 1rem / 1em -> 16px
  cleaned = cleaned.replace(/:\s*([0-9.]+)\s*r?em/g, (_, val) => {
    const px = Math.round(parseFloat(val) * 16);
    return `: ${px}px`;
  });

  // vw -> based on screenshot width
  cleaned = cleaned.replace(/:\s*([0-9.]+)\s*vw/g, (_, val) => {
    const px = Math.round((parseFloat(val) / 100) * expectedWidth);
    return `: ${px}px`;
  });

  // vh -> based on screenshot height
  cleaned = cleaned.replace(/:\s*([0-9.]+)\s*vh/g, (_, val) => {
    const px = Math.round((parseFloat(val) / 100) * expectedHeight);
    return `: ${px}px`;
  });

  return cleaned;
}

/**
 * Converts unsupported CSS layout properties.
 */
function convertUnsupportedLayouts(css: string): string {
  return css;
}

/**
 * Main entry point for HTML/CSS validation and normalization.
 */
export function validateAndNormalizeHtmlCss(
  html: string,
  css: string,
  expectedWidth?: number,
  expectedHeight?: number
): NormalizedResult {
  const errors: string[] = [];
  const targetWidth = expectedWidth && expectedWidth > 0 ? expectedWidth : 1200;
  const targetHeight = expectedHeight && expectedHeight > 0 ? expectedHeight : 900;

  // 1. Sanitize Javascript & dangerous inline event handlers
  let cleanHtml = (html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:[^"']*/gi, "")
    .trim();

  // 2. Gracefully sanitize external stylesheets, imports and remote images
  let cleanCss = (css || "")
    .replace(/@import\s+url\([^)]*\);?/gi, "")
    .replace(/@import\s+['"][^'"]*['"];?/gi, "")
    .trim();

  cleanHtml = cleanHtml
    .replace(/<link\s+[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
    .replace(/<link\s+[^>]*href=["']?http[^>]*>/gi, "");

  // Convert external image src to neutral placeholders
  cleanHtml = cleanHtml.replace(/src=["']https?:\/\/[^"']*["']/gi, 'src="" data-external-src="sanitized"');

  // 3. Basic content validation
  if (!cleanHtml || cleanHtml.length < 5) {
    errors.push("HTML content is empty or contains only invalid markup.");
    return { html: cleanHtml, css: cleanCss, errors };
  }

  // 4. Normalize & auto-wrap .design-root container if missing
  if (!cleanHtml.includes("design-root")) {
    cleanHtml = `<div class="design-root">\n${cleanHtml}\n</div>`;
  }

  // 5. Normalize CSS rules
  cleanCss = normalizeColors(cleanCss);
  cleanCss = normalizeDimensions(cleanCss, targetWidth, targetHeight);
  cleanCss = convertUnsupportedLayouts(cleanCss);

  // Clean out recursive/repetitive selector chains
  cleanCss = cleanCss.replace(/\.([a-zA-Z0-9_-]+)(?:\s+\.\1)+/gi, ".$1");

  // 6. Ensure global box-sizing and root dimensions exist in CSS
  const hasBoxSizing = /\*\s*{[^}]*box-sizing/i.test(cleanCss);
  if (!hasBoxSizing) {
    cleanCss = `* { box-sizing: border-box; }\n` + cleanCss;
  }

  const hasRootWidth = /\.design-root\s*{[^}]*width\s*:\s*\d+px/i.test(cleanCss);
  const hasRootHeight = /\.design-root\s*{[^}]*(?:min-)?height\s*:\s*\d+px/i.test(cleanCss);

  if (!hasRootWidth || !hasRootHeight) {
    const rootStyleRule = `
.design-root {
  position: relative;
  width: ${targetWidth}px;
  min-height: ${targetHeight}px;
  box-sizing: border-box;
}`;
    cleanCss = rootStyleRule + "\n" + cleanCss;
  }

  // 7. Normalize HTML layout structures and inline styles
  cleanHtml = cleanHtml.replace(/style="([^"]*)"/gi, (_, styleVal) => {
    let normalizedInline = normalizeColors(styleVal);
    normalizedInline = normalizeDimensions(normalizedInline, targetWidth, targetHeight);
    normalizedInline = convertUnsupportedLayouts(normalizedInline);
    return `style="${normalizedInline}"`;
  });

  return {
    html: cleanHtml,
    css: cleanCss,
    errors,
  };
}
