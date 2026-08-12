/**
 * DesignForge AI — Constraint Generator
 *
 * Assigns relative scaling and alignment constraints (Left/Right, Top/Bottom, Center, Scale)
 * to elements within absolutely positioned frames (NONE direction Auto Layout).
 */

import type { UINode, DesignAnalysis } from "@designforge/shared";

/**
 * Assigns layout constraints recursively.
 */
function applyNodeConstraints(node: UINode, parent: UINode | null): UINode {
  const updated = { ...node };

  if (parent && parent.layout.direction === "NONE") {
    const parentWidth = parent.bounds.width;
    const parentHeight = parent.bounds.height;

    const leftDistance = node.bounds.x;
    const rightDistance = parentWidth - (node.bounds.x + node.bounds.width);
    const topDistance = node.bounds.y;
    const bottomDistance = parentHeight - (node.bounds.y + node.bounds.height);

    let horizontal = "LEFT";
    let vertical = "TOP";

    // 1. Horizontal Constraints Inference
    // If it spans nearly the entire width -> LEFT_RIGHT (stretch)
    if (leftDistance <= 24 && rightDistance <= 24) {
      horizontal = "LEFT_RIGHT";
    }
    // If it's located on the right side
    else if (rightDistance < leftDistance && rightDistance <= parentWidth * 0.25) {
      horizontal = "RIGHT";
    }
    // If it's centered
    else if (Math.abs(leftDistance - rightDistance) <= parentWidth * 0.1) {
      horizontal = "CENTER";
    }
    // Default to LEFT
    else {
      horizontal = "LEFT";
    }

    // 2. Vertical Constraints Inference
    // If it spans nearly the entire height -> TOP_BOTTOM
    if (topDistance <= 24 && bottomDistance <= 24) {
      vertical = "TOP_BOTTOM";
    }
    // If it's located near the bottom
    else if (bottomDistance < topDistance && bottomDistance <= parentHeight * 0.2) {
      vertical = "BOTTOM";
    }
    // If it's centered
    else if (Math.abs(topDistance - bottomDistance) <= parentHeight * 0.1) {
      vertical = "CENTER";
    }
    // Default to TOP
    else {
      vertical = "TOP";
    }

    updated.constraints = {
      horizontal: horizontal as any,
      vertical: vertical as any,
    };
  }

  // Recurse children
  if (updated.children && updated.children.length > 0) {
    updated.children = updated.children.map((c) =>
      applyNodeConstraints(c, updated)
    );
  }

  return updated;
}

/**
 * Traverses design analysis payload to generate responsive constraints on layout nodes.
 */
export function generateConstraints(analysis: DesignAnalysis): DesignAnalysis {
  const result = { ...analysis };
  result.rootFrame = applyNodeConstraints(result.rootFrame, null);
  return result;
}
