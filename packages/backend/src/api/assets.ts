/**
 * DesignForge AI — Asset Extraction Endpoint
 *
 * POST /api/assets/extract
 * Crops individual image regions from a screenshot.
 */

import { Router } from "express";
import { extractAssetRegion } from "../services/images/asset-extractor.js";
import { ValidationError } from "../middleware/error-handler.js";
import type { Request, Response, NextFunction } from "express";

export const assetsRouter: Router = Router();

interface ExtractRequest {
  imageBase64: string;
  regions: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

/**
 * POST /api/assets/extract
 *
 * Given a base64 image and an array of bounding box regions,
 * returns cropped images for each region.
 */
assetsRouter.post(
  "/assets/extract",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as ExtractRequest;

      if (!body.imageBase64) {
        throw new ValidationError("Missing imageBase64 in request body");
      }

      if (!body.regions || !Array.isArray(body.regions)) {
        throw new ValidationError("Missing or invalid regions array");
      }

      const imageBuffer = Buffer.from(
        body.imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      console.log(
        `[Assets] Extracting ${body.regions.length} regions...`
      );

      const results: { id: string; base64: string; error?: string }[] = [];

      for (const region of body.regions) {
        try {
          const base64 = await extractAssetRegion(imageBuffer, region);
          results.push({ id: region.id, base64 });
        } catch (err) {
          console.error(
            `[Assets] Failed to extract region ${region.id}: ${err}`
          );
          results.push({
            id: region.id,
            base64: "",
            error:
              err instanceof Error
                ? err.message
                : "Failed to extract region",
          });
        }
      }

      const successful = results.filter((r) => !r.error).length;
      console.log(
        `[Assets] Extracted ${successful}/${body.regions.length} regions successfully`
      );

      res.json({
        success: true,
        assets: results,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/assets/fetch-url
 *
 * Fetches a remote image URL server-side and returns its base64 encoding.
 * Used by plugin to bypass browser CORS when importing remote HTML images.
 */
assetsRouter.post(
  "/assets/fetch-url",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        throw new ValidationError("Missing url in request body");
      }

      console.log(`[Assets] Fetching remote image: ${url.slice(0, 100)}...`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/png";

      console.log(`[Assets] Remote image fetched successfully (${base64.length} bytes base64)`);

      res.json({
        success: true,
        base64,
        mimeType,
      });
    } catch (err) {
      next(err);
    }
  }
);
