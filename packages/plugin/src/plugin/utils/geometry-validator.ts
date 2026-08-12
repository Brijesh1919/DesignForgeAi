/**
 * DesignForge AI — Post-Processor Geometry Validator
 *
 * Compares final Figma node geometry against the baseline Stage 1 bounds map.
 * Ensures tolerance <= 0.5px. If any post-processor alters bounds beyond tolerance,
 * it logs the mismatch and automatically restores the exact baseline geometry.
 */

export interface BaseRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Validates node bounds against Stage 1 base geometry map.
 */
export function validateGeometryPostProcess(
  rootNode: SceneNode,
  baseGeometryMap: Map<string, BaseRect>
): { passCount: number; failCount: number } {
  console.log("[Geometry Validation] Starting post-processor geometry validation pass (tolerance <= 0.5px)...");

  let passCount = 0;
  let failCount = 0;

  const validateNode = (node: SceneNode) => {
    const base = baseGeometryMap.get(node.id);

    if (base) {
      const fx = "x" in node ? node.x : 0;
      const fy = "y" in node ? node.y : 0;
      const fw = "width" in node ? node.width : 0;
      const fh = "height" in node ? node.height : 0;

      const xDiff = Math.abs(fx - base.x);
      const yDiff = Math.abs(fy - base.y);
      const wDiff = Math.abs(fw - base.width);
      const hDiff = Math.abs(fh - base.height);

      if (xDiff > 0.5 || yDiff > 0.5 || wDiff > 0.5 || hDiff > 0.5) {
        failCount++;
        console.log(`[Geometry Validation]\nNode: ${node.name}\nStatus: FAILED\nRestoring base geometry.\n  Base: ${base.x},${base.y},${base.width},${base.height}\n  Final: ${fx},${fy},${fw},${fh}`);

        // Restore original baseline geometry
        try {
          if ("layoutMode" in node && (node as FrameNode).layoutMode !== "NONE") {
            (node as FrameNode).layoutMode = "NONE";
          }
          if ("x" in node) node.x = base.x;
          if ("y" in node) node.y = base.y;
          if ("resize" in node) {
            (node as any).resize(Math.max(1, base.width), Math.max(1, base.height));
          }
        } catch (err) {
          console.warn(`[Geometry Validation] Failed to restore bounds for "${node.name}":`, err);
        }
      } else {
        passCount++;
        console.log(`[Geometry Validation]\nNode: ${node.name}\nBase: ${base.x},${base.y},${base.width},${base.height}\nFinal: ${fx},${fy},${fw},${fh}\nStatus: PASS`);
      }
    }

    if ("children" in node) {
      for (const child of (node as any).children) {
        validateNode(child);
      }
    }
  };

  validateNode(rootNode);
  console.log(`[Geometry Validation Summary] PASS: ${passCount}, RESTORED: ${failCount}`);
  return { passCount, failCount };
}
