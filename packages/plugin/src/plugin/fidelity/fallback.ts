/**
 * DesignForge AI — Visual Fallback System
 *
 * Generic visual fallback adapter.
 * When native Figma nodes cannot represent complex CSS/SVG features,
 * creates an isolated visual fallback node preserving exact bounds, x, y, width, height.
 */

export interface FallbackOptions {
  reason: string;
  bounds: { x: number; y: number; width: number; height: number };
  nodeName?: string;
  imageBytes?: Uint8Array;
}

/**
 * Creates an isolated visual fallback node in Figma preserving exact visual placement.
 */
export function createVisualFallback(
  parent: BaseNode & ChildrenMixin,
  options: FallbackOptions
): FrameNode | RectangleNode {
  const name = options.nodeName || "Visual Fallback";
  const bounds = options.bounds;

  console.log(`[FALLBACK] Created "${name}"`);
  console.log(`[FALLBACK] Reason: ${options.reason}`);
  console.log(`[FALLBACK] Bounds: x=${bounds.x}, y=${bounds.y}, w=${bounds.width}, h=${bounds.height}`);

  if (options.imageBytes && options.imageBytes.length > 0) {
    const rect = figma.createRectangle();
    rect.name = name;
    rect.x = bounds.x;
    rect.y = bounds.y;
    rect.resize(Math.max(1, bounds.width), Math.max(1, bounds.height));

    const image = figma.createImage(options.imageBytes);
    rect.fills = [
      {
        type: "IMAGE",
        scaleMode: "FILL",
        imageHash: image.hash,
      },
    ];
    parent.appendChild(rect);
    return rect;
  }

  // Styled frame fallback
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = bounds.x;
  frame.y = bounds.y;
  frame.resize(Math.max(1, bounds.width), Math.max(1, bounds.height));
  frame.fills = [
    {
      type: "SOLID",
      color: { r: 0.95, g: 0.95, b: 0.98 },
      opacity: 0.8,
    },
  ];
  frame.strokes = [
    {
      type: "SOLID",
      color: { r: 0.7, g: 0.7, b: 0.8 },
      opacity: 0.5,
    },
  ];
  frame.strokeWeight = 1;
  frame.clipsContent = true;

  parent.appendChild(frame);
  return frame;
}
