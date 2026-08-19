/**
 * DesignForge AI — Coordinate Normalizer
 *
 * Performs ONLY minimal normalization on AI-detected coordinates:
 * - Rounds fractional pixels to nearest integer
 * - Clamps minimum dimensions to 1px
 *
 * Does NOT snap siblings, does NOT uniformize gaps, does NOT
 * snap to token scales. Preserves original AI coordinates faithfully.
 */



import type { UINode, DesignAnalysis } from "@designforge/shared";

/**
 * Snaps a spacing/radius dimension to the nearest defined design token scale value.
 * Used only by downstream consumers (auto-layout), not by the normalizer itself.
 */
export function snapToScale(value: number, scale: number[]): number {
  if (value <= 0 || scale.length === 0) return value;
  let closest = scale[0]!;
  let minDiff = Math.abs(value - closest);

  for (const s of scale) {
    const diff = Math.abs(value - s);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return closest;
}

/**
 * Normalizes a node's coordinates with minimal adjustments.
 * Only rounds fractional pixels and clamps minimum dimensions.
 */
function normalizeNodeCoordinates(node: UINode): UINode {
  const normalized = { ...node };

  // Round fractional pixels and clamp minimum dimensions
  normalized.bounds = {
    x: Math.round(normalized.bounds.x),
    y: Math.round(normalized.bounds.y),
    width: Math.max(1, Math.round(normalized.bounds.width)),
    height: Math.max(1, Math.round(normalized.bounds.height)),
  };

  // Recurse into children
  if (normalized.children && normalized.children.length > 0) {
    normalized.children = normalized.children.map(normalizeNodeCoordinates);
  }

  return normalized;
}

/**
 * Gently normalizes coordinates without aggressive snapping.
 */
export function optimizeLayout(analysis: DesignAnalysis): DesignAnalysis {
  const result = { ...analysis };
  result.rootFrame = normalizeNodeCoordinates(result.rootFrame);
  return result;
}
