/**
 * DesignForge AI — Image Preprocessor
 *
 * Handles image validation, formatting, auto-trimming borders,
 * aspect-ratio preserving resizing, and thumbnail generation.
 */

import sharp from "sharp";
import {
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_SIZE_BYTES,
} from "@designforge/shared";
import { ValidationError } from "../../middleware/error-handler.js";

export interface ProcessedImage {
  buffer: Buffer;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  thumbnail: string; // Small base64 thumbnail for history
}

/**
 * Validates and preprocesses screenshots:
 * - Trims transparent/excess solid borders
 * - Standardizes formats to PNG
 * - Resizes extremely large images maintaining aspect ratio
 * - Produces base64 streams and user-friendly previews
 */
export async function preprocessImage(
  buffer: Buffer
): Promise<ProcessedImage> {
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new ValidationError("Could not read image dimensions");
  }

  // Check file size limits
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new ValidationError(
      `Image size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit.`
    );
  }

  // 1. Trim transparent/solid borders automatically using Sharp's trim with threshold
  // We use threshold 10 to clear slight variations in borders.
  let img = sharp(buffer).trim({ threshold: 10 });

  // Get trimmed dimensions
  const trimmedBuffer = await img.toBuffer();
  const trimmedMetadata = await sharp(trimmedBuffer).metadata();

  const widthAfterTrim = trimmedMetadata.width || metadata.width;
  const heightAfterTrim = trimmedMetadata.height || metadata.height;

  let finalWidth = widthAfterTrim;
  let finalHeight = heightAfterTrim;

  // 2. Resize extremely large screenshots maintaining aspect ratio
  if (finalWidth > MAX_IMAGE_WIDTH || finalHeight > MAX_IMAGE_HEIGHT) {
    const scale = Math.min(
      MAX_IMAGE_WIDTH / finalWidth,
      MAX_IMAGE_HEIGHT / finalHeight
    );
    finalWidth = Math.round(finalWidth * scale);
    finalHeight = Math.round(finalHeight * scale);

    img = img.resize(finalWidth, finalHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert output strictly to PNG for vision model analysis consistency
  const outputBuffer = await img.png({ quality: 90 }).toBuffer();

  // 3. Generate thumbnail for history panel
  const thumbnailBuffer = await sharp(outputBuffer)
    .resize(120, 120, { fit: "cover" })
    .png({ quality: 60 })
    .toBuffer();

  return {
    buffer: outputBuffer,
    base64: outputBuffer.toString("base64"),
    mimeType: "image/png",
    width: finalWidth,
    height: finalHeight,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    thumbnail: thumbnailBuffer.toString("base64"),
  };
}
