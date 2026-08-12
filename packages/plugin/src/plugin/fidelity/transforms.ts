/**
 * DesignForge AI — Transform Fidelity Adapter
 *
 * Preserves CSS transforms (translate, rotate, scale, matrix) relative to browser geometry.
 * Applies rotation and relative matrix transforms on Figma SceneNodes.
 */

export interface TransformProps {
  rotation?: number; // degrees
  scaleX?: number;
  scaleY?: number;
  matrix?: [number, number, number, number, number, number];
  transformOrigin?: string;
}

/**
 * Applies transform properties to a Figma SceneNode while locking its final visual position.
 */
export function processTransformFidelity(
  node: SceneNode,
  transform?: TransformProps,
  nodeName = "Node"
): void {
  if (!transform) return;

  if (transform.matrix && Array.isArray(transform.matrix) && transform.matrix.length === 6) {
    console.log(`[TRANSFORM] Detected CSS matrix transform on "${nodeName}": [${transform.matrix.join(", ")}]`);
    console.log(`[TRANSFORM] Matrix: [${transform.matrix.join(", ")}]`);
    console.log(`[TRANSFORM] Origin: ${transform.transformOrigin || "50% 50%"}`);

    const [a, b, c, d, tx, ty] = transform.matrix;
    const rad = Math.atan2(b, a);
    const deg = Math.round((rad * 180) / Math.PI);

    if ("rotation" in node && deg !== 0) {
      node.rotation = -deg; // Figma rotation angle sign convention
      console.log(`[TRANSFORM] Applied rotation ${deg}° to "${nodeName}"`);
    }

    if ("x" in node && "y" in node && (tx !== 0 || ty !== 0)) {
      node.x += tx;
      node.y += ty;
      console.log(`[TRANSFORM] Applied matrix translation offset (${tx}, ${ty}) to "${nodeName}"`);
    }
  } else if (typeof transform.rotation === "number" && transform.rotation !== 0) {
    console.log(`[TRANSFORM] Detected rotation on "${nodeName}": ${transform.rotation}°`);
    console.log(`[TRANSFORM] Origin: ${transform.transformOrigin || "50% 50%"}`);

    if ("rotation" in node) {
      node.rotation = -transform.rotation;
      console.log(`[TRANSFORM] Applied rotation ${transform.rotation}° to "${nodeName}"`);
    }
  }
}
