/**
 * DesignForge AI — Geometry Fidelity Adapter
 *
 * Enforces browser-derived getBoundingClientRect bounds as the sole source of truth for:
 * x, y, width, height.
 * Prevents layout recalculation from raw CSS or arbitrary Auto Layout sizing overrides.
 */

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Validates and locks node geometry to browser-measured bounding rect.
 */
export function enforceBrowserGeometry(
  node: SceneNode,
  bounds: ElementBounds
): { x: number; y: number; width: number; height: number } {
  const safeWidth = Math.max(1, Math.round(bounds.width));
  const safeHeight = Math.max(1, Math.round(bounds.height));
  const safeX = Math.round(bounds.x);
  const safeY = Math.round(bounds.y);

  if ("resize" in node && node.type !== "TEXT") {
    try {
      node.resize(safeWidth, safeHeight);
    } catch (err) {
      console.warn(`[GEOMETRY] Failed to resize node "${node.name}":`, err);
    }
  }

  if ("x" in node && "y" in node) {
    node.x = safeX;
    node.y = safeY;
  }

  return { x: safeX, y: safeY, width: safeWidth, height: safeHeight };
}
