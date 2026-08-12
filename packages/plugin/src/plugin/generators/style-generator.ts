/**
 * DesignForge AI — Style Generator
 *
 * Creates Figma local styles from extracted design tokens:
 * - Paint styles (colors)
 * - Text styles (typography)
 * - Effect styles (shadows)
 */

import { hexToFigmaRGB, createSolidPaint } from "../utils/color-utils";
import { loadFont } from "../utils/font-loader";

interface ColorToken {
  name: string;
  value: string;
  category: string;
}

interface TextStyleToken {
  name: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  lineHeight?: number;
  letterSpacing: number;
}

interface ShadowToken {
  name: string;
  effect: {
    type: string;
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    opacity: number;
  };
}

interface StyleCounts {
  paintStyles: number;
  textStyles: number;
  effectStyles: number;
}

/**
 * Generate all local styles from design tokens.
 */
export async function generateStyles(
  colorTokens: ColorToken[],
  textStyles: TextStyleToken[],
  shadowTokens: ShadowToken[],
  settings: { createPaintStyles: boolean; createTextStyles: boolean; debugMode?: boolean }
): Promise<StyleCounts> {
  let paintStyleCount = 0;
  let textStyleCount = 0;
  let effectStyleCount = 0;

  const debugMode = settings.debugMode;

  // Get existing styles to avoid duplicates
  const existingPaintStyles = await figma.getLocalPaintStylesAsync();
  const existingPaintNames = new Set(existingPaintStyles.map((s) => s.name));

  const existingTextStyles = await figma.getLocalTextStylesAsync();
  const existingTextNames = new Set(existingTextStyles.map((s) => s.name));

  const existingEffectStyles = await figma.getLocalEffectStylesAsync();
  const existingEffectNames = new Set(existingEffectStyles.map((s) => s.name));

  // ─── Paint Styles (Colors) ──────────────────────────────────

  if (settings.createPaintStyles) {
    for (const token of colorTokens) {
      const styleName = `DesignForge/${capitalize(token.category)}/${token.name}`;

      if (existingPaintNames.has(styleName)) continue;

      try {
        const style = figma.createPaintStyle();
        style.name = styleName;
        style.paints = [createSolidPaint(token.value)];
        paintStyleCount++;
        if (debugMode) {
          console.log(`Creating Paint Style "${styleName}"... ✓`);
        }
      } catch (err) {
        console.error(`Failed to create paint style "${styleName}": ${err}`);
        if (debugMode) {
          console.log(`Creating Paint Style "${styleName}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // ─── Text Styles (Typography) ──────────────────────────────

  if (settings.createTextStyles) {
    for (const token of textStyles) {
      const styleName = `DesignForge/Typography/${token.name}`;

      if (existingTextNames.has(styleName)) continue;

      try {
        const fontName = await loadFont(
          token.fontFamily || "Inter",
          token.fontWeight || "Regular"
        );

        const style = figma.createTextStyle();
        style.name = styleName;
        style.fontName = fontName;
        style.fontSize = token.fontSize;

        if (token.lineHeight && token.lineHeight > 0) {
          style.lineHeight = { value: token.lineHeight, unit: "PIXELS" };
        }

        if (token.letterSpacing && token.letterSpacing !== 0) {
          style.letterSpacing = { value: token.letterSpacing, unit: "PIXELS" };
        }

        textStyleCount++;
        if (debugMode) {
          console.log(`Creating Text Style "${styleName}"... ✓`);
        }
      } catch (err) {
        console.error(`Failed to create text style "${styleName}": ${err}`);
        if (debugMode) {
          console.log(`Creating Text Style "${styleName}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // ─── Effect Styles (Shadows) ────────────────────────────────

  if (settings.createPaintStyles) {
    for (const token of shadowTokens) {
    const styleName = `DesignForge/Shadows/${token.name}`;

    if (existingEffectNames.has(styleName)) continue;

    try {
      const style = figma.createEffectStyle();
      style.name = styleName;
      style.effects = [
        {
          type: (token.effect.type || "DROP_SHADOW") as "DROP_SHADOW" | "INNER_SHADOW",
          color: {
            ...hexToFigmaRGB(token.effect.color),
            a: token.effect.opacity ?? 0.25,
          },
          offset: {
            x: token.effect.offsetX || 0,
            y: token.effect.offsetY || 0,
          },
          radius: token.effect.blur || 0,
          spread: token.effect.spread || 0,
          visible: true,
          blendMode: "NORMAL" as BlendMode,
        },
      ];

      effectStyleCount++;
      if (debugMode) {
        console.log(`Creating Effect Style "${styleName}"... ✓`);
      }
    } catch (err) {
      console.error(`Failed to create effect style "${styleName}": ${err}`);
      if (debugMode) {
        console.log(`Creating Effect Style "${styleName}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

  console.log(
    `[Styles] Created ${paintStyleCount} paint, ${textStyleCount} text, ${effectStyleCount} effect styles`
  );

  return {
    paintStyles: paintStyleCount,
    textStyles: textStyleCount,
    effectStyles: effectStyleCount,
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
