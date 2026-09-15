/**
 * DesignForge AI — Website URL → Figma: Backend Normalizer
 *
 * Cleans and validates the raw WebsiteExtractionResult from Playwright
 * before it is sent to the plugin UI for Figma conversion.
 */

import type { WebsiteExtractionResult, WebsiteNode, WebsiteAsset, WebsiteFont } from "./WebsiteTypes.js";

/**
 * Normalizes the extraction result:
 * - Validates bounds (clamp negatives, fix NaN)
 * - Resolves relative image URLs to absolute
 * - Deduplicates fonts
 * - Removes zero-size invisible leaves
 */
export function normalizeExtractionResult(
  result: WebsiteExtractionResult,
  baseUrl: string
): WebsiteExtractionResult {
  console.log(`[WebsiteToFigma] Normalizing ${result.assets.length} assets, ${result.fonts.length} fonts`);

  const normalizedAssets = normalizeAssets(result.assets, baseUrl);
  const normalizedFonts  = deduplicateFonts(result.fonts);
  const normalizedRoot   = normalizeNode(result.rootNode, baseUrl, 0);

  return {
    ...result,
    assets: normalizedAssets,
    fonts:  normalizedFonts,
    rootNode: normalizedRoot ?? result.rootNode,
  };
}

function normalizeNode(node: WebsiteNode, baseUrl: string, depth: number): WebsiteNode | null {
  if (depth > 60) return node;

  // Filter out invisible tiny stubs / offscreen sr-only links / tracking elements
  const isOffscreenSrOnly = (node.bounds.x < 0 && node.bounds.y < 0 && node.bounds.width <= 10) ||
    (node.bounds.width <= 1 && node.bounds.height <= 1);
  const isZeroSize = node.bounds.width <= 0 || node.bounds.height <= 0;
  if ((isOffscreenSrOnly || isZeroSize) && node.tagName !== "body" && node.tagName !== "html") {
    return null;
  }

  // Validate bounds
  let { x, y, width, height } = node.bounds;
  if (isNaN(x)) x = 0;
  if (isNaN(y)) y = 0;
  if (isNaN(width) || width <= 0) width = 1;
  if (isNaN(height) || height <= 0) height = 1;

  // Validate fills
  const fills = (node.style.fills ?? []).filter((f) => {
    if (f.type === "SOLID") return f.color && f.color.startsWith("#");
    return true;
  });

  // Validate opacity
  let opacity = node.style.opacity;
  if (isNaN(opacity) || opacity < 0) opacity = 1;
  if (opacity > 1) opacity = 1;

  let imageRef = node.imageRef;
  if (imageRef && typeof imageRef === "string") {
    if (!imageRef.startsWith("http") && !imageRef.startsWith("data:") && !imageRef.startsWith("//")) {
      try {
        imageRef = new URL(imageRef, baseUrl).href;
      } catch (_) {}
    } else if (imageRef.startsWith("//")) {
      imageRef = "https:" + imageRef;
    }
  }

  const children = (node.children || [])
    .map((child) => normalizeNode(child, baseUrl, depth + 1))
    .filter(Boolean) as WebsiteNode[];

  // Enforce VERTICAL layout direction on root containers
  const tagLower = (node.tagName || "").toLowerCase();
  const layout = { ...node.layout };
  if (tagLower === "body" || tagLower === "html" || tagLower === "main") {
    if (layout.display !== "flex" && layout.display !== "inline-flex") {
      layout.direction = "VERTICAL";
    }
  }

  return {
    ...node,
    bounds: { x, y, width, height },
    layout,
    style: { ...node.style, fills, opacity },
    imageRef,
    children,
  };
}

function normalizeAssets(assets: WebsiteAsset[], baseUrl: string): WebsiteAsset[] {
  return assets.map((asset) => {
    let src = asset.src;
    // Convert relative URLs to absolute
    if (src && !src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("//")) {
      try {
        src = new URL(src, baseUrl).href;
      } catch (_) {
        // Leave as-is if URL construction fails
      }
    } else if (src && src.startsWith("//")) {
      src = "https:" + src;
    }
    return { ...asset, src };
  });
}

function deduplicateFonts(fonts: WebsiteFont[]): WebsiteFont[] {
  const seen = new Set<string>();
  return fonts.filter((font) => {
    const key = `${font.family}|${font.weight}|${font.style}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
