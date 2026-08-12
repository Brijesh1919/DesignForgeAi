/**
 * DesignForge AI — Color Utilities
 *
 * Conversion between hex strings and Figma RGB (0-1 range).
 */

/**
 * Parse a hex color string to Figma-compatible RGB object (0-1 range).
 */
export function hexToFigmaRGB(hex: string): RGB {
  const clean = hex.replace("#", "");

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  return { r, g, b };
}

/**
 * Parse a hex color string to Figma-compatible RGBA object.
 */
export function hexToFigmaRGBA(hex: string): RGBA {
  const clean = hex.replace("#", "");

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  let a = 1;
  if (clean.length === 8) {
    a = parseInt(clean.substring(6, 8), 16) / 255;
  }

  return { r, g, b, a };
}

/**
 * Convert Figma RGB to hex string.
 */
export function figmaRGBToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(rgb.g * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(rgb.b * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Create a Figma solid paint from a hex color.
 */
export function createSolidPaint(hex: string, opacity: number = 1): SolidPaint {
  return {
    type: "SOLID",
    color: hexToFigmaRGB(hex),
    opacity,
  };
}

/**
 * Calculate perceived brightness of a hex color (0-255).
 */
export function brightness(hex: string): number {
  const rgb = hexToFigmaRGB(hex);
  return (rgb.r * 255 * 299 + rgb.g * 255 * 587 + rgb.b * 255 * 114) / 1000;
}
