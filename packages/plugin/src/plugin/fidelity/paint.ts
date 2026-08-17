/**
 * DesignForge AI — Paint & Background Fidelity Adapter
 *
 * Distinguishes background paints, transparent fills, solid colors, borders, and nested backgrounds.
 */

import { hexToFigmaRGB, createSolidPaint } from "../utils/color-utils";
import { processGradientFidelity } from "./gradients";
import { cssGradientToFigmaPaint } from "../utils/css-gradient-converter";

export interface RawFillSpec {
  type: string;
  color?: string;
  opacity?: number;
  gradient?: string;
  rawGradient?: string;
  gradientStops?: any[];
}

/**
 * Resolves raw fill specifications into Figma Paint array.
 */
export function processPaintFidelity(
  fillsInput: RawFillSpec[],
  nodeName = "Node"
): Paint[] {
  if (!Array.isArray(fillsInput) || fillsInput.length === 0) {
    console.log(`[BACKGROUND_FILL_FIDELITY] Figma Node "${nodeName}": Input fills: none → Resolved Figma Paint: []`);
    return [];
  }

  const paints: Paint[] = [];

  for (const fill of fillsInput) {
    try {
      console.log(`[Paint Converter] CSS background: ${JSON.stringify(fill)}`);

      // 1. Solid Color
      if (fill.type === "SOLID" && fill.color) {
        const opacity = typeof fill.opacity === "number" ? fill.opacity : 1;
        if (opacity === 0 || fill.color === "transparent" || fill.color === "rgba(0, 0, 0, 0)") {
          console.log(`[FILL] Resolved: transparent fill (opacity 0)`);
          continue;
        }
        const paint = createSolidPaint(fill.color, opacity);
        console.log(`[BACKGROUND_FILL_FIDELITY] DOM background: SOLID (${fill.color}) → extracted fill: ${JSON.stringify(fill)} → final Figma fill: ${JSON.stringify(paint)}`);
        paints.push(paint);
        continue;
      }

      // 2. Gradients via rawGradient string
      if (fill.rawGradient) {
        const converted = cssGradientToFigmaPaint(fill.rawGradient);
        if (converted && converted.length > 0) {
          console.log(`[BACKGROUND_FILL_FIDELITY] DOM background: Gradient (${fill.rawGradient}) → extracted fill: ${JSON.stringify(fill)} → final Figma fill: ${JSON.stringify(converted)}`);
          paints.push(...converted);
          continue;
        }
      }

      // 3. Gradients via processGradientFidelity (string)
      if (fill.type?.includes("GRADIENT") && fill.gradient) {
        const gradientPaints = processGradientFidelity(fill.gradient);
        if (gradientPaints && gradientPaints.length > 0) {
          console.log(`[BACKGROUND_FILL_FIDELITY] DOM background: Gradient (${fill.gradient}) → extracted fill: ${JSON.stringify(fill)} → final Figma fill: ${JSON.stringify(gradientPaints)}`);
          paints.push(...gradientPaints);
          continue;
        }
      }

      // 4. Gradients via parsed stops/type
      if (
        fill.type === "GRADIENT_LINEAR" ||
        fill.type === "GRADIENT_RADIAL" ||
        fill.type === "GRADIENT_ANGULAR" ||
        fill.type === "GRADIENT_DIAMOND"
      ) {
        const type = fill.type as "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
        
        if (!fill.gradientStops || !Array.isArray(fill.gradientStops) || fill.gradientStops.length === 0) {
          console.warn("[Paint Converter] Invalid or empty gradient stops. Falling back to solid.");
          paints.push(createSolidPaint("#E0E0E0", 1));
          continue;
        }

        const stops = fill.gradientStops.map((stop: any) => {
          const colorHex = stop.color || "#FFFFFF";
          return {
            position: typeof stop.position === "number" ? stop.position : 0,
            color: {
              ...hexToFigmaRGB(colorHex),
              a: typeof stop.opacity === "number" ? stop.opacity : 1,
            }
          };
        });

        const matrix = [
          [1, 0, 0],
          [0, 1, 0]
        ] as [[number, number, number], [number, number, number]];

        const paint = {
          type,
          gradientTransform: matrix,
          gradientStops: stops,
          opacity: fill.opacity ?? 1,
        } as GradientPaint;

        console.log(`[BACKGROUND_FILL_FIDELITY] DOM background: Gradient (${fill.type}) → extracted fill: ${JSON.stringify(fill)} → final Figma fill: ${JSON.stringify(paint)}`);
        paints.push(paint);
        continue;
      }

      // Fallback for unsupported paint type
      if (fill.color) {
        const opacity = typeof fill.opacity === "number" ? fill.opacity : 1;
        const paint = createSolidPaint(fill.color, opacity);
        console.log(`[BACKGROUND_FILL_FIDELITY] DOM background: Fallback SOLID (${fill.color}) → extracted fill: ${JSON.stringify(fill)} → final Figma fill: ${JSON.stringify(paint)}`);
        paints.push(paint);
      } else {
        console.warn(`[Paint Converter] Unsupported paint type: ${fill.type}. Falling back to solid.`);
        paints.push(createSolidPaint("#E0E0E0", 1));
      }
    } catch (err) {
      console.error("[Paint Converter] Error converting paint. Safe fallback used.", err);
      paints.push(createSolidPaint("#E0E0E0", 1));
    }
  }

  // Defensive validation layer: Filter out any null or invalid paint objects
  const resolved = paints.filter((p) => {
    if (!p) return false;
    if (p.type === "SOLID") {
      return typeof p.color === "object" && p.color !== null;
    }
    if (
      p.type === "GRADIENT_LINEAR" ||
      p.type === "GRADIENT_RADIAL" ||
      p.type === "GRADIENT_ANGULAR" ||
      p.type === "GRADIENT_DIAMOND"
    ) {
      const gp = p as GradientPaint;
      return Array.isArray(gp.gradientStops) && gp.gradientStops.length > 0 && Array.isArray(gp.gradientTransform);
    }
    return false;
  });

  return resolved;
}
