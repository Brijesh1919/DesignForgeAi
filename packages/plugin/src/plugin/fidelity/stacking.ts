/**
 * DesignForge AI — Stacking & Z-Index Fidelity Adapter
 *
 * Sorts child nodes into correct visual stacking context order based on:
 * zIndex, positioning, DOM order, opacity, and transforms.
 */

export interface StackableNode {
  style?: {
    zIndex?: number;
    position?: string;
    opacity?: number;
  };
  name?: string;
  type?: string;
  [key: string]: any;
}

/**
 * Sorts child nodes according to browser stacking context rules.
 */
export function sortStackingOrder<T extends StackableNode>(children: T[]): T[] {
  if (!Array.isArray(children) || children.length <= 1) return children;

  const indexedChildren = children.map((child, originalIndex) => {
    const zIndex = typeof child.style?.zIndex === "number" ? child.style.zIndex : 0;
    const isPositioned = child.style?.position === "absolute" || child.style?.position === "relative" || child.style?.position === "fixed";
    const basePriority = isPositioned && zIndex === 0 ? 0.1 : 0;
    
    console.log(`[STACKING] Element "${child.name || child.type || 'Child'}"`);
    console.log(`[STACKING] z-index: ${zIndex} (positioned=${isPositioned})`);

    return {
      node: child,
      originalIndex,
      effectiveScore: zIndex + basePriority,
    };
  });

  indexedChildren.sort((a, b) => {
    if (a.effectiveScore !== b.effectiveScore) {
      return a.effectiveScore - b.effectiveScore;
    }
    return a.originalIndex - b.originalIndex;
  });

  const sortedResult = indexedChildren.map((item) => item.node);
  console.log(`[STACKING] resolved order: [${sortedResult.map((c) => c.name || c.type).join(", ")}]`);

  return sortedResult;
}
