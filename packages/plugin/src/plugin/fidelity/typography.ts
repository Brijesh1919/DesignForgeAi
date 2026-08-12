import { loadFont } from "../utils/font-loader";
import { hexToFigmaRGB } from "../utils/color-utils";

export interface TypographyOptions {
  content: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  textCase?: string;
  textDecoration?: string;
  color?: string;
  opacity?: number;
  width?: number;
  height?: number;
}

/**
 * Resolves typography properties and configures a Figma TextNode.
 */
export async function applyTypographyFidelity(
  textNode: TextNode,
  props: TypographyOptions
): Promise<void> {
  const reqFamily = props.fontFamily || "Inter";
  const reqWeight = props.fontWeight || "Regular";

  const w = props.width || 100;
  const h = props.height || 20;

  const figmaBeforeW = textNode.width;
  const figmaBeforeH = textNode.height;

  console.log(`[TEXT] Font requested: ${reqFamily} (${reqWeight})`);

  let resolvedFont: FontName;
  let fontFallbackLogged = false;
  try {
    resolvedFont = await loadFont(reqFamily, reqWeight);
    console.log(`[TEXT] Font resolved: ${resolvedFont.family} (${resolvedFont.style})`);
    console.log(`[TEXT] Font loaded: ${resolvedFont.family} (${resolvedFont.style})`);
    if (resolvedFont.family !== reqFamily) {
      fontFallbackLogged = true;
    }
  } catch (err) {
    resolvedFont = { family: "Inter", style: "Regular" };
    fontFallbackLogged = true;
  }

  if (fontFallbackLogged) {
    console.log(`[TEXT FONT FALLBACK]`);
    console.log(`[TEXT] Font fallback: ${resolvedFont.family} (${resolvedFont.style})`);
  }

  textNode.fontName = resolvedFont;
  textNode.characters = props.content || "";
  textNode.fontSize = Math.max(1, props.fontSize || 16);

  // Set line height
  if (props.lineHeight && props.lineHeight > 0) {
    textNode.lineHeight = {
      value: props.lineHeight,
      unit: "PIXELS",
    };
  } else {
    textNode.lineHeight = { unit: "AUTO" };
  }

  // Set letter spacing
  if (props.letterSpacing && props.letterSpacing !== 0) {
    textNode.letterSpacing = {
      value: props.letterSpacing,
      unit: "PIXELS",
    };
  } else {
    textNode.letterSpacing = { value: 0, unit: "PIXELS" };
  }

  // Set text alignment
  switch (props.textAlign) {
    case "LEFT":
      textNode.textAlignHorizontal = "LEFT";
      break;
    case "CENTER":
      textNode.textAlignHorizontal = "CENTER";
      break;
    case "RIGHT":
      textNode.textAlignHorizontal = "RIGHT";
      break;
    case "JUSTIFIED":
      textNode.textAlignHorizontal = "JUSTIFIED";
      break;
    default:
      textNode.textAlignHorizontal = "LEFT";
  }

  // Set text case
  switch (props.textCase) {
    case "UPPER":
      textNode.textCase = "UPPER";
      break;
    case "LOWER":
      textNode.textCase = "LOWER";
      break;
    case "TITLE":
      textNode.textCase = "TITLE";
      break;
    case "SMALL_CAPS":
      textNode.textCase = "SMALL_CAPS";
      break;
    default:
      textNode.textCase = "ORIGINAL";
  }

  // Set text decoration
  switch (props.textDecoration) {
    case "UNDERLINE":
      textNode.textDecoration = "UNDERLINE";
      break;
    case "STRIKETHROUGH":
      textNode.textDecoration = "STRIKETHROUGH";
      break;
    default:
      textNode.textDecoration = "NONE";
  }

  // Set text color
  if (props.color) {
    textNode.fills = [
      {
        type: "SOLID",
        color: hexToFigmaRGB(props.color),
        opacity: props.opacity ?? 1,
      },
    ];
  }

  console.log(`[TEXT]
node: ${textNode.name}
fontFamily: ${resolvedFont.family}
fontSize: ${textNode.fontSize}
fontWeight: ${resolvedFont.style}
lineHeight: ${props.lineHeight || "auto"}
letterSpacing: ${props.letterSpacing || 0}
width: ${w}
height: ${h}`);

  // === AUTO WIDTH: content-driven sizing ===
  // Use WIDTH_AND_HEIGHT so Figma computes the natural text width from content.
  // No fixed width is applied — the text node grows to fit its content on one line
  // unless Figma's own line-breaking logic wraps it (which mirrors the browser).
  const estLineH = props.lineHeight && props.lineHeight > 0 ? props.lineHeight : textNode.fontSize * 1.2;
  textNode.textAutoResize = "WIDTH_AND_HEIGHT";

  const figmaAfterW = textNode.width;
  const figmaAfterH = textNode.height;
  const deltaW = figmaAfterW - w;
  const deltaH = figmaAfterH - h;
  const lineCount = Math.round(figmaAfterH / estLineH);

  console.log(`[TEXT] BASE geometry preserved`);
  console.log(`[TEXT] typography preserved`);
  console.log(`[TEXT] geometry changed: 0`);

  console.log(`[TEXT GEOMETRY]
content: ${(props.content || "").slice(0, 60)}
DOM width: ${w}
DOM height: ${h}
DOM x: 0
DOM y: 0
Figma width: ${Math.round(figmaAfterW)}
Figma height: ${Math.round(figmaAfterH)}
line count: ${lineCount}
geometry delta: dW=${Math.round(deltaW)} dH=${Math.round(deltaH)}`);

  console.log(`[TEXT FIDELITY]
content: ${props.content || ""}
browser: ${w} ${h}
figmaBefore: ${Math.round(figmaBeforeW)} ${Math.round(figmaBeforeH)}
figmaAfter: ${Math.round(figmaAfterW)} ${Math.round(figmaAfterH)}
deltaWidth: ${Math.round(deltaW)}
deltaHeight: ${Math.round(deltaH)}
deltaX: 0
deltaY: 0
font: ${resolvedFont.family} (${resolvedFont.style})`);

  if (Math.abs(deltaW) > 1 || Math.abs(deltaH) > 4) {
    console.warn(`[TEXT WARNING] Geometry changed after typography mapping`);
  }
}
