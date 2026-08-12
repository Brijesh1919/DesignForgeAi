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
 * Normalizes CSS dimension values (em, rem, vh, vw, % -> px).
 */
function normalizeDimensions(css: string): string {
  let cleaned = css;

  // 1rem / 1em -> 16px
  cleaned = cleaned.replace(/: \s*([0-9.]+)\s*r?em/g, (_, val) => {
    const px = Math.round(parseFloat(val) * 16);
    return `: ${px}px`;
  });

  // vw -> assume 1200px width
  cleaned = cleaned.replace(/: \s*([0-9.]+)\s*vw/g, (_, val) => {
    const px = Math.round((parseFloat(val) / 100) * 1200);
    return `: ${px}px`;
  });

  // vh -> assume 900px height
  cleaned = cleaned.replace(/: \s*([0-9.]+)\s*vh/g, (_, val) => {
    const px = Math.round((parseFloat(val) / 100) * 900);
    return `: ${px}px`;
  });

  return cleaned;
}

/**
 * Converts unsupported CSS layout properties.
 */
function convertUnsupportedLayouts(css: string): string {
  let cleaned = css;

  // Let browser layout engine calculate positions. Do NOT convert grid to flex or strip position: absolute.
  // We keep standard sanitizations if any are needed, but allow grids, absolute, and calc.

  return cleaned;
}

/**
 * Main entry point for HTML/CSS validation and normalization.
 */
export function validateAndNormalizeHtmlCss(
  html: string,
  css: string
): NormalizedResult {
  const errors: string[] = [];

  // 1. Check for Javascript or inline handlers
  if (
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(html) ||
    /on\w+\s*=\s*"[^"]*"/gi.test(html)
  ) {
    errors.push("Security validation failed: Javascript elements or handlers detected.");
  }

  // 2. Check for external resources and URLs
  if (
    /<link\s+[^>]*href="http/gi.test(html) ||
    /@import\s+url/gi.test(css) ||
    /src\s*=\s*['"]?https?:\/\//gi.test(html) ||
    /url\s*\(\s*['"]?https?:\/\//gi.test(css)
  ) {
    errors.push("External resource restriction failed: external URLs, images, or stylesheets detected.");
  }

  // 3. Verify .design-root exists in the HTML
  if (!html.includes("design-root")) {
    errors.push("Structural validation failed: Missing container element with class 'design-root'.");
  }

  // 4. Verify CSS exists
  if (!css || !css.trim()) {
    errors.push("Style validation failed: Generated CSS is empty.");
  }

  // 5. Verify Root has explicit width and height
  const hasWidth = /\.design-root\s*{[^}]*width\s*:\s*\d+px/i.test(css) || /style="[^"]*width\s*:\s*\d+px/i.test(html);
  const hasHeight = /\.design-root\s*{[^}]*height\s*:\s*\d+px/i.test(css) || /style="[^"]*height\s*:\s*\d+px/i.test(html);
  if (!hasWidth || !hasHeight) {
    errors.push("Geometry validation failed: Root container (.design-root) must specify explicit pixel width and height.");
  }

  // 6. Verify HTML is not obviously truncated
  const isTruncated = html.length > 50 && !html.trim().endsWith("</div>") && !html.trim().endsWith(">") && !html.trim().endsWith("</html>");
  if (isTruncated) {
    errors.push("Data integrity validation failed: HTML output appears to be truncated.");
  }

  // Parse check: basic HTML cleanup (strip scripts, iframes for safety)
  let cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .trim();

  // Basic HTML validation warning
  if (!cleanHtml) {
    errors.push("HTML content is empty or contains only scripts/iframes.");
  }

  // Normalize CSS rules
  let cleanCss = css.trim();
  cleanCss = normalizeColors(cleanCss);
  cleanCss = normalizeDimensions(cleanCss);
  cleanCss = convertUnsupportedLayouts(cleanCss);

  // Normalize HTML layout structures (e.g. strip unsupported inline styles if any)
  cleanHtml = cleanHtml.replace(/style="([^"]*)"/gi, (_, styleVal) => {
    let normalizedInline = normalizeColors(styleVal);
    normalizedInline = normalizeDimensions(normalizedInline);
    normalizedInline = convertUnsupportedLayouts(normalizedInline);
    return `style="${normalizedInline}"`;
  });

  return {
    html: cleanHtml,
    css: cleanCss,
    errors,
  };
}
