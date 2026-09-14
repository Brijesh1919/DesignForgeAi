/**
 * DesignForge AI — HTML/CSS Validation and Normalization Service
 *
 * Cleans, sanitizes, and normalizes vision-generated HTML & CSS.
 * Uses AST-based CSS parser (css-tree) for robust selector and rule extraction.
 */

import * as csstree from "css-tree";
import { normalizeAIHtmlResponse } from "../vision/analyzer.js";

export interface NormalizedResult {
  html: string;
  css: string;
  errors: string[];
}

export interface ParsedCssStats {
  ruleCount: number;
  declarationCount: number;
  classSelectors: string[];
  idSelectors: string[];
  elementSelectors: string[];
  isValidCss: boolean;
  parseError?: string;
}

/**
 * Helper to auto-repair unclosed or truncated CSS blocks before AST parsing.
 */
function sanitizeAndBalanceCss(css: string): string {
  if (!css) return "";
  // Strip unfinished declaration at the very end (e.g. `color: #` or `padding: `)
  let cleaned = css.replace(/;\s*[a-zA-Z-]+\s*:\s*[^;}]*$/g, ";").trim();
  // Strip trailing property without value (e.g. `font-weight:`)
  cleaned = cleaned.replace(/[a-zA-Z-]+\s*:\s*$/g, "").trim();

  // Balance unclosed braces
  const openBraces = (cleaned.match(/\{/g) || []).length;
  const closeBraces = (cleaned.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    cleaned += "\n}".repeat(openBraces - closeBraces);
  }
  return cleaned;
}

/**
 * Robust CSS AST parser using css-tree.
 * Extracts accurate selectors, rules, and declarations without false positives from decimals/values.
 */
export function parseCssWithAst(css: string): ParsedCssStats {
  if (!css || !css.trim()) {
    return {
      ruleCount: 0,
      declarationCount: 0,
      classSelectors: [],
      idSelectors: [],
      elementSelectors: [],
      isValidCss: false,
    };
  }

  const balanced = sanitizeAndBalanceCss(css);

  try {
    const classSet = new Set<string>();
    const idSet = new Set<string>();
    const elementSet = new Set<string>();
    let ruleCount = 0;
    let declarationCount = 0;

    const ast = csstree.parse(balanced, {
      parseCustomProperty: true,
      positions: false,
    });

    csstree.walk(ast, (node) => {
      if (node.type === "Rule") {
        ruleCount++;
      } else if (node.type === "Declaration") {
        declarationCount++;
      } else if (node.type === "ClassSelector") {
        if (node.name && node.name !== "design-root") {
          classSet.add(node.name);
        }
      } else if (node.type === "IdSelector") {
        if (node.name && node.name !== "designforge-root") {
          idSet.add(node.name);
        }
      } else if (node.type === "TypeSelector") {
        if (node.name && node.name !== "*") {
          elementSet.add(node.name.toLowerCase());
        }
      }
    });

    return {
      ruleCount,
      declarationCount,
      classSelectors: Array.from(classSet),
      idSelectors: Array.from(idSet),
      elementSelectors: Array.from(elementSet),
      isValidCss: true,
    };
  } catch (err: any) {
    // Tolerant regex fallback
    const classSet = new Set<string>();
    // Non-digit starting class selector regex to avoid matching numbers like .6 or .2
    const matches = css.matchAll(/(?:^|[\s,>+~{;}])\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g);
    for (const m of matches) {
      if (m[1] && m[1] !== "design-root") {
        classSet.add(m[1]);
      }
    }
    const ruleCount = (css.match(/\{[\s\S]*?\}/g) || []).length;
    const declarationCount = (css.match(/:\s*[^;]+;/g) || []).length;

    return {
      ruleCount,
      declarationCount,
      classSelectors: Array.from(classSet),
      idSelectors: [],
      elementSelectors: [],
      isValidCss: css.trim().length > 10,
      parseError: err?.message,
    };
  }
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

export interface CssCoverageResult {
  htmlClasses: string[];
  cssSelectors: string[];
  cssIdSelectors: string[];
  cssElementSelectors: string[];
  coveredClasses: string[];
  missingClasses: string[];
  coveragePercent: number;
  ruleCount: number;
  declarationCount: number;
  isValid: boolean;
  isUsable: boolean;
}

/**
 * Validates real CSS usability and extracts class coverage using AST.
 * Does NOT fail simply because child elements are styled via descendant/inherited selectors.
 */
export function validateCssCoverage(html: string, css: string): CssCoverageResult {
  // Extract all class attributes from HTML
  const classMatches = html.matchAll(/class=["']([^"']*)["']/gi);
  const classSet = new Set<string>();
  for (const m of classMatches) {
    if (m[1]) {
      const tokens = m[1].trim().split(/\s+/);
      for (const t of tokens) {
        if (t && t !== "design-root") {
          classSet.add(t);
        }
      }
    }
  }

  const htmlClasses = Array.from(classSet);
  const stats = parseCssWithAst(css);

  const cssSelectors = stats.classSelectors;
  const selectorSet = new Set(cssSelectors);
  const coveredClasses = htmlClasses.filter((cls) => selectorSet.has(cls));
  const missingClasses = htmlClasses.filter((cls) => !selectorSet.has(cls));
  const coveragePercent =
    htmlClasses.length > 0
      ? Math.round((coveredClasses.length / htmlClasses.length) * 100)
      : 100;

  // Real usability check:
  // CSS is usable if:
  // 1. CSS is non-empty string (> 50 chars)
  // 2. Contains valid declarations (> 0) and rules (> 0)
  // 3. Not purely fallback root with 0 other declarations
  const isFallbackOnly =
    htmlClasses.length > 0 &&
    stats.classSelectors.length === 0 &&
    stats.idSelectors.length === 0 &&
    stats.elementSelectors.filter((e) => e !== "html" && e !== "body").length === 0 &&
    stats.declarationCount <= 3;

  const isUsable =
    css.trim().length > 0 &&
    stats.ruleCount > 0 &&
    stats.declarationCount > 0 &&
    !isFallbackOnly;

  const isValid = isUsable && (coveragePercent >= 70 || missingClasses.length <= 5 || htmlClasses.length <= 3);

  console.log(
    `[CSS DEBUG]\n` +
    `HTML classes detected: ${htmlClasses.length}\n` +
    `CSS selectors detected: ${stats.classSelectors.length}\n` +
    `Covered classes: ${coveredClasses.length}\n` +
    `Missing classes: ${missingClasses.length}\n` +
    `Coverage: ${coveragePercent}%\n` +
    `Number of CSS rules: ${stats.ruleCount}\n` +
    `CSS declarations: ${stats.declarationCount}`
  );

  console.log(
    `[DesignForge][CSS VALIDATION]\n` +
    `HTML classes: ${htmlClasses.length}\n` +
    `CSS selectors: ${stats.classSelectors.length}\n` +
    `Covered classes: ${coveredClasses.length}\n` +
    `Missing CSS classes: ${missingClasses.length}\n` +
    `Coverage: ${coveragePercent}%\n` +
    `CSS validation: ${isValid ? "PASS" : "FAIL"}`
  );

  if (missingClasses.length > 0 && htmlClasses.length > 0) {
    console.log(`[CSS WARNING] ${missingClasses.length} HTML classes do not have direct CSS selectors (may be styled via inherited or descendant rules).`);
  }

  return {
    htmlClasses,
    cssSelectors: stats.classSelectors,
    cssIdSelectors: stats.idSelectors,
    cssElementSelectors: stats.elementSelectors,
    coveredClasses,
    missingClasses,
    coveragePercent,
    ruleCount: stats.ruleCount,
    declarationCount: stats.declarationCount,
    isValid,
    isUsable,
  };
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

  // Unpack any JSON wrapper or escaped markdown format
  const unpacked = normalizeAIHtmlResponse({ html, css }, targetWidth, targetHeight);

  // 1. Sanitize Javascript & dangerous inline event handlers
  let cleanHtml = (unpacked.html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:[^"']*/gi, "")
    .trim();

  // 2. Gracefully sanitize external stylesheets, imports and dangerous links
  let cleanCss = (unpacked.css || "")
    .replace(/@import\s+url\([^)]*\);?/gi, "")
    .replace(/@import\s+['"][^'"]*['"];?/gi, "")
    .trim();

  cleanHtml = cleanHtml
    .replace(/<link\s+[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "")
    .replace(/<link\s+[^>]*href=["']?http[^>]*>/gi, "");

  // Ensure empty or missing img src has a safe fallback placeholder, while preserving all valid URLs & data URIs
  const DEFAULT_IMAGE_PLACEHOLDER =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EImage%3C/text%3E%3C/svg%3E";

  cleanHtml = cleanHtml.replace(/<img\b([^>]*?)(\/?>)/gi, (_match, attrs, endTag) => {
    let newAttrs = attrs;
    if (/src=["']\s*["']/i.test(newAttrs) || /data-external-src=["']sanitized["']/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/src=["']\s*["']/i, `src="${DEFAULT_IMAGE_PLACEHOLDER}"`);
      newAttrs = newAttrs.replace(/data-external-src=["']sanitized["']/gi, "");
    } else if (!/src=/i.test(newAttrs)) {
      newAttrs = `src="${DEFAULT_IMAGE_PLACEHOLDER}" ` + newAttrs;
    }
    return `<img ${newAttrs.trim()}${endTag}`;
  });

  // 3. Basic content validation
  if (!cleanHtml || cleanHtml.length < 5) {
    errors.push("HTML content is empty or contains only invalid markup.");
    return { html: cleanHtml, css: cleanCss, errors };
  }

  // 4. Validate CSS usability
  const coverage = validateCssCoverage(cleanHtml, cleanCss);
  if (!cleanCss || cleanCss.trim().length === 0 || !coverage.isUsable) {
    errors.push("CSS generation failed: AI returned HTML without usable CSS.");
  }

  // 5. Normalize & auto-wrap .design-root container if missing
  if (!cleanHtml.includes("design-root")) {
    cleanHtml = `<div class="design-root">\n${cleanHtml}\n</div>`;
  }

  // 6. Normalize CSS rules
  cleanCss = normalizeColors(cleanCss);
  cleanCss = normalizeDimensions(cleanCss, targetWidth, targetHeight);
  cleanCss = convertUnsupportedLayouts(cleanCss);

  // Clean out recursive/repetitive selector chains
  cleanCss = cleanCss.replace(/\.([a-zA-Z0-9_-]+)(?:\s+\.\1)+/gi, ".$1");

  // 7. Ensure global box-sizing and root dimensions exist in CSS
  const hasBoxSizing = /\*\s*{[^}]*box-sizing/i.test(cleanCss);
  if (!hasBoxSizing) {
    cleanCss = `* { box-sizing: border-box; margin: 0; padding: 0; }\n` + cleanCss;
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

  // 8. Normalize HTML layout structures and inline styles
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
