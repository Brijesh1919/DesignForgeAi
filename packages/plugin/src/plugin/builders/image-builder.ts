/**
 * DesignForge AI — Image Builder
 *
 * Handles inserting images into Figma frames as image fills.
 */

/**
 * Insert an image into a frame as an image fill.
 */
export async function insertImage(
  frame: FrameNode | RectangleNode,
  imageData: Uint8Array,
  debugMode?: boolean
): Promise<void> {
  try {
    const image = figma.createImage(imageData);

    frame.fills = [
      {
        type: "IMAGE",
        imageHash: image.hash,
        scaleMode: "FILL",
      },
    ];

    if (debugMode) {
      console.log(`Creating Image Fill for "${frame.name}"... ✓`);
    }
  } catch (err) {
    console.error(`Failed to insert image: ${err}`);
    if (debugMode) {
      console.log(`Creating Image Fill for "${frame.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
    }
    // Keep placeholder fill
    frame.fills = [
      {
        type: "SOLID",
        color: { r: 0.88, g: 0.88, b: 0.88 },
      },
    ];
  }
}

/**
 * Convert a base64 string to a Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(clean);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Batch convert base64 assets to Uint8Arrays.
 */
export function processAssets(
  assets: { id: string; base64?: string }[]
): Map<string, Uint8Array> {
  const map = new Map<string, Uint8Array>();

  for (const asset of assets) {
    if (asset.base64) {
      try {
        map.set(asset.id, base64ToUint8Array(asset.base64));
      } catch (err) {
        console.error(`Failed to process asset ${asset.id}: ${err}`);
      }
    }
  }

  return map;
}
