/**
 * DesignForge AI — Text Builder
 *
 * Creates editable text nodes in Figma with proper
 * font loading, styling, and text properties.
 */

import { loadFont } from "../utils/font-loader";
import { hexToFigmaRGB } from "../utils/color-utils";
import { applyTypographyFidelity } from "../fidelity/typography";

interface TextProps {
  content: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  lineHeight?: number;
  letterSpacing: number;
  textAlign: string;
  textCase: string;
  textDecoration: string;
  color: string;
  opacity: number;
  maxLines?: number;
  width?: number;
  height?: number;
}

/**
 * Build a Figma text node from text properties.
 */
export async function buildTextNode(
  textProps: TextProps | undefined,
  name: string
): Promise<TextNode> {
  const text = figma.createText();

  if (!textProps) {
    // Fallback for empty text nodes
    await loadFont("Inter", "Regular");
    text.characters = "";
    text.name = name;
    return text;
  }

  // Set name
  text.name = name;

  // Apply typography fidelity adapter for font loading & styling & geometry locking
  await applyTypographyFidelity(text, textProps);

  return text;
}
