/**
 * DesignForge AI — Paint & Background Fidelity Adapter
 *
 * Distinguishes background paints, transparent fills, solid colors, borders, and nested backgrounds.
 */

import { hexToFigmaRGB, createSolidPaint } from "../utils/color-utils";
import { processGradientFidelity } from "./gradients";

export interface RawFillSpec {
  type: string;
  color?: string;
  opacity?: number;
  gradient?: string;
}

/**
 * Resolves raw fill specifications into Figma Paint array.
 */
export function processPaintFidelity(
  fillsInput: RawFillSpec[],
  nodeName = "Node"
): Paint[] {
  if (!Array.isArray(fillsInput) || fillsInput.length === 0) {
    console.log(`[FILL] Background for "${nodeName}": none`);
    console.log(`[FILL] Resolved: []`);
    return [];
  }

  const resultPaints: Paint[] = [];

  for (const fill of fillsInput) {
    console.log(`[FILL] Background for "${nodeName}": type=${fill.type}, color=${fill.color || 'none'}, gradient=${fill.gradient ? 'present' : 'none'}`);

    if (fill.type?.includes("GRADIENT") && fill.gradient) {
      const gradientPaints = processGradientFidelity(fill.gradient);
      if (gradientPaints && gradientPaints.length > 0) {
        console.log(`[FILL] Resolved: ${gradientPaints.length} gradient paint(s)`);
        console.log(`[FILL] Type: ${gradientPaints[0].type}`);
        console.log(`[FILL] Applied to "${nodeName}"`);
        resultPaints.push(...gradientPaints);
        continue;
      }
    }

    if (fill.color) {
      const opacity = typeof fill.opacity === "number" ? fill.opacity : 1;
      if (opacity === 0 || fill.color === "transparent" || fill.color === "rgba(0, 0, 0, 0)") {
        console.log(`[FILL] Resolved: transparent fill (opacity 0)`);
        continue;
      }

      const paint = createSolidPaint(fill.color, opacity);
      console.log(`[FILL] Resolved: SOLID (${fill.color}, opacity=${opacity})`);
      console.log(`[FILL] Type: SOLID`);
      console.log(`[FILL] Applied to "${nodeName}"`);
      resultPaints.push(paint);
    }
  }

  return resultPaints;
}
