/**
 * DesignForge AI — Gradient Fidelity Adapter
 *
 * Converts CSS linear and radial gradients into valid Figma GradientPaint objects.
 * Validates gradient transform matrices and prevents invalid transform properties.
 */

import { cssGradientToFigmaPaint } from "../utils/css-gradient-converter";

export interface GradientValidationResult {
  valid: boolean;
  paints?: Paint[];
  reason?: string;
}

/**
 * Validates a Figma GradientPaint object.
 */
export function validateGradientPaint(paint: GradientPaint): boolean {
  if (!paint.type || !paint.type.includes("GRADIENT")) return false;
  if (!Array.isArray(paint.gradientStops) || paint.gradientStops.length === 0) return false;

  const matrix = paint.gradientTransform;
  if (!Array.isArray(matrix) || matrix.length !== 2) return false;
  if (!Array.isArray(matrix[0]) || matrix[0].length !== 3) return false;
  if (!Array.isArray(matrix[1]) || matrix[1].length !== 3) return false;

  // Check for NaN or infinite numbers in transform matrix
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const val = matrix[r][c];
      if (typeof val !== "number" || isNaN(val) || !isFinite(val)) {
        return false;
      }
    }
  }

  // Check stops
  for (const stop of paint.gradientStops) {
    if (typeof stop.position !== "number" || isNaN(stop.position)) return false;
    if (!stop.color || typeof stop.color.r !== "number" || typeof stop.color.g !== "number" || typeof stop.color.b !== "number") {
      return false;
    }
  }

  return true;
}

/**
 * Processes a CSS gradient string into validated Figma gradient paints.
 */
export function processGradientFidelity(gradientStr: string): Paint[] | null {
  console.log(`[GRADIENT] Detected: "${gradientStr}"`);
  const paints = cssGradientToFigmaPaint(gradientStr);

  if (!paints || paints.length === 0) {
    console.log(`[GRADIENT] Fallback: Could not parse CSS gradient string`);
    return null;
  }

  const validPaints: Paint[] = [];
  for (const p of paints) {
    if (p.type.includes("GRADIENT") && validateGradientPaint(p as GradientPaint)) {
      const gp = p as GradientPaint;
      console.log(`[GRADIENT] Type: ${gp.type}`);
      console.log(`[GRADIENT] Stops: ${gp.gradientStops.length}`);
      console.log(`[GRADIENT] Transform: ${JSON.stringify(gp.gradientTransform)}`);
      console.log(`[GRADIENT] Applied successfully`);
      validPaints.push(gp);
    } else if (p.type === "SOLID") {
      validPaints.push(p);
    } else {
      console.warn(`[GRADIENT] Fallback: Gradient paint matrix or stop validation failed`);
    }
  }

  return validPaints.length > 0 ? validPaints : null;
}
