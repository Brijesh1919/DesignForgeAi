/**
 * DesignForge AI — Font Loader
 *
 * Manages loading and caching fonts for the Figma plugin.
 * Maps detected font names to available Figma fonts with fallbacks.
 */

const loadedFonts = new Set<string>();

/**
 * Font weight name to Figma font style mapping.
 */
const WEIGHT_MAP: Record<string, string> = {
  Thin: "Thin",
  ExtraLight: "ExtraLight",
  Light: "Light",
  Regular: "Regular",
  Medium: "Medium",
  SemiBold: "SemiBold",
  Bold: "Bold",
  ExtraBold: "ExtraBold",
  Black: "Black",
};

/**
 * Common Figma font style names for different weights.
 * Some fonts use different naming conventions.
 */
const WEIGHT_ALTERNATIVES: Record<string, string[]> = {
  Thin: ["Thin", "Hairline", "100"],
  ExtraLight: ["ExtraLight", "UltraLight", "200"],
  Light: ["Light", "300"],
  Regular: ["Regular", "Normal", "400", "Book"],
  Medium: ["Medium", "500"],
  SemiBold: ["SemiBold", "DemiBold", "600"],
  Bold: ["Bold", "700"],
  ExtraBold: ["ExtraBold", "UltraBold", "800"],
  Black: ["Black", "Heavy", "900"],
};

/**
 * Load a font, with fallback logic.
 * Returns the loaded FontName or a fallback.
 */
export async function loadFont(
  family: string,
  weight: string = "Regular"
): Promise<FontName> {
  const style = WEIGHT_MAP[weight] || "Regular";
  const cacheKey = `${family}:${style}`;

  // Check cache
  if (loadedFonts.has(cacheKey)) {
    return { family, style };
  }

  // Try exact match
  try {
    await figma.loadFontAsync({ family, style });
    loadedFonts.add(cacheKey);
    return { family, style };
  } catch {
    // Try weight alternatives
    const alternatives = WEIGHT_ALTERNATIVES[weight] || [style];
    for (const altStyle of alternatives) {
      try {
        await figma.loadFontAsync({ family, style: altStyle });
        const altKey = `${family}:${altStyle}`;
        loadedFonts.add(altKey);
        return { family, style: altStyle };
      } catch {
        continue;
      }
    }

    // Fall back to Inter
    const fallbackFamily = "Inter";
    try {
      await figma.loadFontAsync({ family: fallbackFamily, style });
      const fallbackKey = `${fallbackFamily}:${style}`;
      loadedFonts.add(fallbackKey);
      return { family: fallbackFamily, style };
    } catch {
      // Last resort: Inter Regular
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      loadedFonts.add("Inter:Regular");
      return { family: "Inter", style: "Regular" };
    }
  }
}

/**
 * Pre-load a set of commonly used fonts.
 */
export async function preloadCommonFonts(): Promise<void> {
  const commonFonts: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Bold" },
  ];

  for (const font of commonFonts) {
    try {
      await figma.loadFontAsync(font);
      loadedFonts.add(`${font.family}:${font.style}`);
    } catch {
      // Silently skip unavailable fonts
    }
  }
}
