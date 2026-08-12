/**
 * DesignForge AI — Conservative Auto Layout Reconstruction
 *
 * Only applies Auto Layout when children form a clear, high-confidence
 * row or column alignment (>95% confidence). Otherwise preserves
 * absolute positioning (direction: "NONE").
 *
 * Uses exact measured gaps from AI coordinates. Does NOT snap to token scales.
 */

import type { UINode, DesignAnalysis } from "@designforge/shared";

/** Threshold: alignment variance must be ≤ 5px for all children */
const ALIGN_VARIANCE_THRESHOLD = 5;
/** Threshold: gap consistency variance must be ≤ 3px */
const GAP_CONSISTENCY_THRESHOLD = 3;

/**
 * Checks if children form a high-confidence horizontal stack.
 */
function isConfidentHorizontalStack(children: UINode[]): { confident: boolean; gap: number } {
  if (children.length < 2) return { confident: false, gap: 0 };

  const sorted = [...children].sort((a, b) => a.bounds.x - b.bounds.x);

  // Check Y-alignment: all children should share nearly the same Y
  const yValues = sorted.map(c => c.bounds.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  if (yMax - yMin > ALIGN_VARIANCE_THRESHOLD) return { confident: false, gap: 0 };

  // Check gap consistency
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i]!.bounds.x - (sorted[i - 1]!.bounds.x + sorted[i - 1]!.bounds.width);
    gaps.push(gap);
  }

  if (gaps.length === 0) return { confident: false, gap: 0 };

  // All gaps must be non-negative
  if (gaps.some(g => g < -2)) return { confident: false, gap: 0 };

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const maxVariance = Math.max(...gaps.map(g => Math.abs(g - avgGap)));

  if (maxVariance > GAP_CONSISTENCY_THRESHOLD) return { confident: false, gap: 0 };

  return { confident: true, gap: Math.round(avgGap) };
}

/**
 * Checks if children form a high-confidence vertical stack.
 */
function isConfidentVerticalStack(children: UINode[]): { confident: boolean; gap: number } {
  if (children.length < 2) return { confident: false, gap: 0 };

  const sorted = [...children].sort((a, b) => a.bounds.y - b.bounds.y);

  // Check X-alignment: all children should share nearly the same X
  const xValues = sorted.map(c => c.bounds.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  if (xMax - xMin > ALIGN_VARIANCE_THRESHOLD) return { confident: false, gap: 0 };

  // Check gap consistency
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i]!.bounds.y - (sorted[i - 1]!.bounds.y + sorted[i - 1]!.bounds.height);
    gaps.push(gap);
  }

  if (gaps.length === 0) return { confident: false, gap: 0 };

  if (gaps.some(g => g < -2)) return { confident: false, gap: 0 };

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const maxVariance = Math.max(...gaps.map(g => Math.abs(g - avgGap)));

  if (maxVariance > GAP_CONSISTENCY_THRESHOLD) return { confident: false, gap: 0 };

  return { confident: true, gap: Math.round(avgGap) };
}

/**
 * Calculate paddings from parent boundaries to outermost children.
 */
function calculatePaddings(parent: UINode, children: UINode[]) {
  if (children.length === 0) return { top: 0, right: 0, bottom: 0, left: 0 };

  const minX = Math.min(...children.map(c => c.bounds.x));
  const maxX = Math.max(...children.map(c => c.bounds.x + c.bounds.width));
  const minY = Math.min(...children.map(c => c.bounds.y));
  const maxY = Math.max(...children.map(c => c.bounds.y + c.bounds.height));

  return {
    top: Math.max(0, minY),
    right: Math.max(0, parent.bounds.width - maxX),
    bottom: Math.max(0, parent.bounds.height - maxY),
    left: Math.max(0, minX),
  };
}

/**
 * Reconstructs Auto Layout for a single node (only if high-confidence).
 */
function reconstructNode(node: UINode): UINode {
  const updated = { ...node };

  if (updated.children && updated.children.length > 0) {
    // Process children first (bottom-up)
    updated.children = updated.children.map(reconstructNode);

    const children = updated.children;

    if (children.length >= 2) {
      const hResult = isConfidentHorizontalStack(children);
      const vResult = isConfidentVerticalStack(children);

      let direction: "HORIZONTAL" | "VERTICAL" | null = null;
      let gap = 0;

      if (hResult.confident && !vResult.confident) {
        direction = "HORIZONTAL";
        gap = hResult.gap;
      } else if (vResult.confident && !hResult.confident) {
        direction = "VERTICAL";
        gap = vResult.gap;
      }
      // If both or neither are confident, keep absolute positioning

      if (direction) {
        const paddings = calculatePaddings(updated, children);

        updated.layout = {
          direction,
          primaryAxisSizing: "HUG",
          counterAxisSizing: "HUG",
          paddingTop: paddings.top,
          paddingRight: paddings.right,
          paddingBottom: paddings.bottom,
          paddingLeft: paddings.left,
          itemSpacing: Math.max(0, gap),
          alignment: "TOP_LEFT",
          wrap: false,
        };

        // Set child layout properties
        for (const child of children) {
          if (!child.childLayout) {
            child.childLayout = { layoutAlign: "INHERIT", layoutGrow: 0 };
          }
        }
      }
      // else: keep direction "NONE" (absolute positioning) — the default from Zod
    }
  }

  return updated;
}

/**
 * Applies conservative Auto Layout reconstruction to the design tree.
 */
export function reconstructAutoLayout(analysis: DesignAnalysis): DesignAnalysis {
  const result = { ...analysis };
  result.rootFrame = reconstructNode(result.rootFrame);
  return result;
}
