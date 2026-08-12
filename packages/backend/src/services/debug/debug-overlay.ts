/**
 * DesignForge AI — Debug Overlay Generator
 *
 * Composites bounding box rectangles on top of the source screenshot
 * to visually verify detection quality. Color-coded by node type,
 * labeled with name and confidence score.
 */

import type { UINode, DesignAnalysis } from "@designforge/shared";
import sharp from "sharp";

/**
 * Color mapping by node type (RGB values).
 */
const TYPE_COLORS: Record<string, { r: number; g: number; b: number }> = {
  FRAME: { r: 59, g: 130, b: 246 },       // Blue
  TEXT: { r: 34, g: 197, b: 94 },          // Green
  IMAGE: { r: 239, g: 68, b: 68 },         // Red
  RECTANGLE: { r: 234, g: 179, b: 8 },     // Yellow
  ELLIPSE: { r: 168, g: 85, b: 247 },      // Purple
  LINE: { r: 249, g: 115, b: 22 },         // Orange
  ICON: { r: 236, g: 72, b: 153 },         // Pink
  GROUP: { r: 20, g: 184, b: 166 },        // Teal
  VECTOR: { r: 107, g: 114, b: 128 },      // Gray
  COMPONENT_INSTANCE: { r: 99, g: 102, b: 241 }, // Indigo
};

/**
 * Collects all nodes with their absolute (global) positions.
 */
function collectAbsoluteNodes(
  node: UINode,
  parentGlobalX: number,
  parentGlobalY: number,
  result: { node: UINode; globalX: number; globalY: number }[] = []
): { node: UINode; globalX: number; globalY: number }[] {
  const globalX = parentGlobalX + node.bounds.x;
  const globalY = parentGlobalY + node.bounds.y;

  result.push({ node, globalX, globalY });

  if (node.children) {
    for (const child of node.children) {
      collectAbsoluteNodes(child, globalX, globalY, result);
    }
  }

  return result;
}

/**
 * Creates an SVG overlay string with bounding box rectangles.
 */
function createOverlaySVG(
  analysis: DesignAnalysis,
  width: number,
  height: number
): string {
  const allNodes = collectAbsoluteNodes(analysis.rootFrame, 0, 0);

  // Skip the root frame itself (it covers the entire screen)
  const nodes = allNodes.slice(1);

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;

  for (const { node, globalX, globalY } of nodes) {
    const color = TYPE_COLORS[node.type] || TYPE_COLORS.FRAME!;
    const w = node.bounds.width;
    const h = node.bounds.height;
    const confidence = (node.confidence ?? 1.0).toFixed(2);

    // Semi-transparent fill rectangle
    svgContent += `<rect x="${globalX}" y="${globalY}" width="${w}" height="${h}" `;
    svgContent += `fill="rgba(${color.r},${color.g},${color.b},0.08)" `;
    svgContent += `stroke="rgb(${color.r},${color.g},${color.b})" stroke-width="1" />`;

    // Label (only for nodes large enough to show text)
    if (w > 40 && h > 16) {
      const label = `${node.name} (${confidence})`;
      const fontSize = Math.min(10, Math.max(7, Math.round(h * 0.25)));

      svgContent += `<text x="${globalX + 3}" y="${globalY + fontSize + 2}" `;
      svgContent += `font-family="monospace" font-size="${fontSize}" `;
      svgContent += `fill="rgb(${color.r},${color.g},${color.b})" `;
      svgContent += `opacity="0.9">`;
      svgContent += escapeXml(label.substring(0, 40));
      svgContent += `</text>`;
    }
  }

  svgContent += `</svg>`;
  return svgContent;
}

/**
 * Escapes special XML characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates a debug overlay PNG by compositing bounding boxes over the source image.
 * Returns base64-encoded PNG string.
 */
export async function generateDebugOverlay(
  analysis: DesignAnalysis,
  imageBuffer: Buffer
): Promise<string> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || analysis.metadata.sourceWidth;
    const height = metadata.height || analysis.metadata.sourceHeight;

    const svgOverlay = createOverlaySVG(analysis, width, height);
    const svgBuffer = Buffer.from(svgOverlay);

    const overlayImage = await sharp(imageBuffer)
      .composite([{
        input: svgBuffer,
        top: 0,
        left: 0,
      }])
      .png()
      .toBuffer();

    const base64 = overlayImage.toString("base64");
    console.log(`[Debug Overlay] Generated overlay with ${collectAbsoluteNodes(analysis.rootFrame, 0, 0).length} bounding boxes`);

    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.error(`[Debug Overlay] Failed to generate overlay: ${err}`);
    return "";
  }
}
