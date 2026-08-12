/**
 * DesignForge AI — CSS Gradient to Figma Paint Converter
 *
 * Converts CSS linear-gradient, radial-gradient, and multi-stop gradient definitions
 * into valid Figma GradientPaint objects with exact gradientTransform 2x3 matrices and gradientStops.
 */

import { hexToFigmaRGB } from "./color-utils";

/**
 * Converts a CSS gradient string into Figma-compatible Paint objects.
 */
export function cssGradientToFigmaPaint(gradientStr: string): Paint[] | null {
  if (!gradientStr || gradientStr === "none") return null;

  try {
    console.log(`[Paint] Gradient detected: ${gradientStr}`);

    if (gradientStr.includes("radial-gradient")) {
      return parseRadialGradient(gradientStr);
    } else if (gradientStr.includes("linear-gradient")) {
      return parseLinearGradient(gradientStr);
    }

    console.warn(`[Paint] Gradient type unsupported: ${gradientStr}`);
    return null;
  } catch (err) {
    console.warn(`[Paint] Gradient conversion failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Parses CSS linear-gradient into a Figma GRADIENT_LINEAR Paint.
 */
function parseLinearGradient(cssStr: string): Paint[] | null {
  // Extract content inside linear-gradient(...)
  const match = cssStr.match(/linear-gradient\((.*)\)/i);
  if (!match || !match[1]) return null;

  const content = match[1].trim();

  // Separate angle/direction from stops
  const parts = splitCSSArgs(content);
  if (parts.length < 2) return null;

  let angleDeg = 180; // default to bottom (180deg)
  let stopStartIndex = 0;

  const firstPart = parts[0].trim();
  if (firstPart.endsWith("deg")) {
    angleDeg = parseFloat(firstPart);
    stopStartIndex = 1;
  } else if (firstPart.startsWith("to ")) {
    angleDeg = parseDirectionToAngle(firstPart);
    stopStartIndex = 1;
  }

  // Parse color stops
  const stops = parseGradientStops(parts.slice(stopStartIndex));
  if (stops.length === 0) return null;

  // Compute 2x3 transform matrix for Figma
  const matrix = calculateLinearGradientTransform(angleDeg);

  const paint: GradientPaint = {
    type: "GRADIENT_LINEAR",
    gradientTransform: matrix,
    gradientStops: stops,
    opacity: 1,
  };

  console.log(`[Paint] Gradient converted: GRADIENT_LINEAR with ${stops.length} stops (${angleDeg}deg)`);
  return [paint];
}

/**
 * Parses CSS radial-gradient into a Figma GRADIENT_RADIAL Paint.
 */
function parseRadialGradient(cssStr: string): Paint[] | null {
  const match = cssStr.match(/radial-gradient\((.*)\)/i);
  if (!match || !match[1]) return null;

  const content = match[1].trim();
  const parts = splitCSSArgs(content);

  let stopStartIndex = 0;
  if (parts[0].includes("circle") || parts[0].includes("ellipse") || parts[0].includes("at ")) {
    stopStartIndex = 1;
  }

  const stops = parseGradientStops(parts.slice(stopStartIndex));
  if (stops.length === 0) return null;

  // Centered radial matrix for Figma
  const matrix: [[number, number, number], [number, number, number]] = [
    [0.5, 0, 0.25],
    [0, 0.5, 0.25],
  ];

  const paint: GradientPaint = {
    type: "GRADIENT_RADIAL",
    gradientTransform: matrix,
    gradientStops: stops,
    opacity: 1,
  };

  console.log(`[Paint] Gradient converted: GRADIENT_RADIAL with ${stops.length} stops`);
  return [paint];
}

/**
 * Splits CSS function arguments respecting nested parentheses.
 */
function splitCSSArgs(str: string): string[] {
  const result: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "(") {
      parenDepth++;
      current += char;
    } else if (char === ")") {
      parenDepth--;
      current += char;
    } else if (char === "," && parenDepth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Parses direction keywords like "to bottom right" to degrees.
 */
function parseDirectionToAngle(dirStr: string): number {
  const dir = dirStr.toLowerCase().trim();
  switch (dir) {
    case "to top": return 0;
    case "to right": return 90;
    case "to bottom": return 180;
    case "to left": return 270;
    case "to top right":
    case "to right top": return 45;
    case "to bottom right":
    case "to right bottom": return 135;
    case "to bottom left":
    case "to left bottom": return 225;
    case "to top left":
    case "to left top": return 315;
    default: return 180;
  }
}

/**
 * Calculates a 2x3 affine transform matrix for a linear gradient angle in Figma.
 */
function calculateLinearGradientTransform(angleDeg: number): [[number, number, number], [number, number, number]] {
  const normAngle = ((angleDeg % 360) + 360) % 360;
  const rad = (normAngle * Math.PI) / 180;

  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const a = cos;
  const b = sin;
  const c = -sin;
  const d = cos;

  const tx = 0.5 - 0.5 * a - 0.5 * c;
  const ty = 0.5 - 0.5 * b - 0.5 * d;

  return [
    [a, c, tx],
    [b, d, ty],
  ];
}

/**
 * Parses CSS gradient stops into Figma ColorStop array.
 */
function parseGradientStops(stopParts: string[]): ColorStop[] {
  const rawStops: { colorHex: string; opacity: number; posPercent: number | null }[] = [];

  for (const part of stopParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const colorMatch = trimmed.match(/(rgba?\(.*?\)|#[0-9a-fA-F]{3,8}|\b[a-zA-Z]+\b)/);
    if (!colorMatch) continue;

    const colorStr = colorMatch[0];
    const rest = trimmed.replace(colorStr, "").trim();

    const percentMatch = rest.match(/(\d+(?:\.\d+)?)%/);
    const posPercent = percentMatch ? parseFloat(percentMatch[1]) / 100 : null;

    const hex = parseColorToHex(colorStr);
    const colorHex = hex.substring(0, 7);
    const opacity = hex.length > 7 ? parseInt(hex.substring(7, 9), 16) / 255 : 1.0;

    rawStops.push({ colorHex, opacity, posPercent });
  }

  if (rawStops.length === 0) return [];

  const count = rawStops.length;
  return rawStops.map((stop, i) => {
    let position = stop.posPercent;
    if (position === null) {
      position = i / Math.max(1, count - 1);
    }

    return {
      position: Math.max(0, Math.min(1, position)),
      color: {
        ...hexToFigmaRGB(stop.colorHex),
        a: stop.opacity,
      },
    };
  });
}

/**
 * Fallback color parser for hex/rgb strings.
 */
function parseColorToHex(colorStr: string): string {
  const str = colorStr.trim();
  if (str.startsWith("#")) {
    if (str.length === 4) {
      return `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`.toUpperCase();
    }
    return str.toUpperCase();
  }

  const matches = str.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (matches) {
    const r = parseInt(matches[1]!, 10).toString(16).padStart(2, "0");
    const g = parseInt(matches[2]!, 10).toString(16).padStart(2, "0");
    const b = parseInt(matches[3]!, 10).toString(16).padStart(2, "0");
    let a = "";
    if (matches[4] !== undefined) {
      const alpha = parseFloat(matches[4]);
      if (alpha < 1) {
        a = Math.round(alpha * 255).toString(16).padStart(2, "0");
      }
    }
    return `#${r}${g}${b}${a}`.toUpperCase();
  }

  return "#808080";
}
