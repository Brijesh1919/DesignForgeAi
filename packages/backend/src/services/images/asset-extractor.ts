/**
 * DesignForge AI — Image Asset Extractor
 *
 * Extracts coordinate-bounded regions from original image buffers
 * to crop individual illustrations, logos, icons, and avatars.
 */

import sharp from "sharp";
import { ValidationError } from "../../middleware/error-handler.js";

export interface AssetCropRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedAsset {
  id: string;
  base64: string;
  error?: string;
}

/**
 * Extracts a region from an image buffer based on bounding boxes.
 */
export async function extractAssetRegion(
  imageBuffer: Buffer,
  bounds: Omit<AssetCropRegion, "id">
): Promise<string> {
  const metadata = await sharp(imageBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new ValidationError("Could not read image dimensions for cropping");
  }

  // Clamp bounding parameters to image size
  const left = Math.max(0, Math.round(bounds.x));
  const top = Math.max(0, Math.round(bounds.y));
  const width = Math.min(Math.round(bounds.width), metadata.width - left);
  const height = Math.min(Math.round(bounds.height), metadata.height - top);

  if (width <= 0 || height <= 0) {
    throw new ValidationError(
      `Invalid crop region bounding sizes: w=${bounds.width}, h=${bounds.height}`
    );
  }

  const cropped = await sharp(imageBuffer)
    .extract({ left, top, width, height })
    .png()
    .toBuffer();

  return cropped.toString("base64");
}

/**
 * Batch crop regions from a screenshot.
 */
export async function batchExtractAssets(
  imageBuffer: Buffer,
  regions: AssetCropRegion[]
): Promise<CroppedAsset[]> {
  const results: CroppedAsset[] = [];
  const hashCache = new Map<string, string>(); // Cache base64 by bounds signature to avoid duplicate crops

  for (const region of regions) {
    const signature = `${region.x}_${region.y}_${region.width}_${region.height}`;

    if (hashCache.has(signature)) {
      results.push({ id: region.id, base64: hashCache.get(signature)! });
      continue;
    }

    try {
      const base64 = await extractAssetRegion(imageBuffer, region);
      hashCache.set(signature, base64);
      results.push({ id: region.id, base64 });
    } catch (err) {
      console.error(`[Asset Extractor] Failed to extract asset ${region.id}:`, err);
      results.push({
        id: region.id,
        base64: "",
        error: err instanceof Error ? err.message : "Crop failed",
      });
    }
  }

  return results;
}
