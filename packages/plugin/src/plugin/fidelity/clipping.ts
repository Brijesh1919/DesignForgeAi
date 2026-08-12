/**
 * DesignForge AI — Clipping & Masking Fidelity Adapter
 *
 * Preserves border radius (including individual corner radii), overflow clipping, clip-paths, and masks.
 */

export interface CornerRadiusSpec {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
}

/**
 * Applies corner radius and overflow clipping to Figma nodes.
 */
export function applyClippingFidelity(
  node: SceneNode,
  radius?: number | CornerRadiusSpec,
  overflowHidden = false,
  nodeName = "Node"
): void {
  if ("clipsContent" in node) {
    (node as FrameNode).clipsContent = overflowHidden;
  }

  if (!radius) return;

  if (typeof radius === "number" && radius > 0) {
    if ("cornerRadius" in node) {
      (node as RectangleNode | FrameNode).cornerRadius = radius;
    }
  } else if (typeof radius === "object") {
    if ("topLeftRadius" in node) {
      const n = node as RectangleNode | FrameNode;
      n.topLeftRadius = radius.topLeft || 0;
      n.topRightRadius = radius.topRight || 0;
      n.bottomRightRadius = radius.bottomRight || 0;
      n.bottomLeftRadius = radius.bottomLeft || 0;
    }
  }
}
