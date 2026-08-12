/**
 * DesignForge AI — Text Builder
 *
 * Creates editable text nodes in Figma with proper
 * font loading, styling, and text properties.
 */

import { loadFont } from "../utils/font-loader";
import { hexToFigmaRGB } from "../utils/color-utils";

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

  // Load the font
  const fontName = await loadFont(
    textProps.fontFamily || "Inter",
    textProps.fontWeight || "Regular"
  );

  // Set font
  text.fontName = fontName;

  // Set text content
  text.characters = textProps.content || "";

  // Set font size
  text.fontSize = Math.max(1, textProps.fontSize || 16);

  // Set text auto sizing
  const widthVal = textProps.width || 100;
  const heightVal = textProps.height || 20;
  const estLineHeight = textProps.lineHeight || (textProps.fontSize * 1.5) || 24;
  
  if (textProps.textAlign === "CENTER" || textProps.textAlign === "RIGHT" || textProps.textAlign === "JUSTIFIED") {
    text.textAutoResize = "HEIGHT";
    text.resize(Math.max(1, widthVal), Math.max(1, heightVal + 4));
  } else if (heightVal <= estLineHeight * 1.5) {
    text.textAutoResize = "WIDTH_AND_HEIGHT";
  } else {
    text.textAutoResize = "HEIGHT";
    text.resize(Math.max(1, widthVal), Math.max(1, heightVal + 4)); // +4px safety buffer
  }

  // Set text color
  if (textProps.color) {
    text.fills = [
      {
        type: "SOLID",
        color: hexToFigmaRGB(textProps.color),
        opacity: textProps.opacity ?? 1,
      },
    ];
  }

  // Set line height
  if (textProps.lineHeight && textProps.lineHeight > 0) {
    text.lineHeight = {
      value: textProps.lineHeight,
      unit: "PIXELS",
    };
  } else {
    text.lineHeight = { unit: "AUTO" };
  }

  // Set letter spacing
  if (textProps.letterSpacing && textProps.letterSpacing !== 0) {
    text.letterSpacing = {
      value: textProps.letterSpacing,
      unit: "PIXELS",
    };
  }

  // Set text alignment
  switch (textProps.textAlign) {
    case "LEFT":
      text.textAlignHorizontal = "LEFT";
      break;
    case "CENTER":
      text.textAlignHorizontal = "CENTER";
      break;
    case "RIGHT":
      text.textAlignHorizontal = "RIGHT";
      break;
    case "JUSTIFIED":
      text.textAlignHorizontal = "JUSTIFIED";
      break;
    default:
      text.textAlignHorizontal = "LEFT";
  }

  // Set text case
  switch (textProps.textCase) {
    case "UPPER":
      text.textCase = "UPPER";
      break;
    case "LOWER":
      text.textCase = "LOWER";
      break;
    case "TITLE":
      text.textCase = "TITLE";
      break;
    case "SMALL_CAPS":
      text.textCase = "SMALL_CAPS";
      break;
    default:
      text.textCase = "ORIGINAL";
  }

  // Set text decoration
  switch (textProps.textDecoration) {
    case "UNDERLINE":
      text.textDecoration = "UNDERLINE";
      break;
    case "STRIKETHROUGH":
      text.textDecoration = "STRIKETHROUGH";
      break;
    default:
      text.textDecoration = "NONE";
  }

  // Set name
  text.name = name;

  return text;
}
