/**
 * DesignForge AI — Website URL → Figma: API Endpoint
 *
 * POST /api/website-to-figma
 *
 * Accepts a public URL + viewport, uses Playwright to render the page,
 * extracts computed styles and bounding boxes, and returns a
 * WebsiteExtractionResult JSON for the plugin to convert into Figma nodes.
 *
 * This is a NEW isolated route. It does not modify any existing endpoints.
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { renderAndExtractWebsite } from "../services/website/WebsiteRenderer.js";
import { normalizeExtractionResult } from "../services/website/WebsiteNormalizer.js";
import type { WebsiteToFigmaRequest, WebsiteToFigmaResponse } from "../services/website/WebsiteTypes.js";
import { ValidationError } from "../middleware/error-handler.js";
import type { Request, Response, NextFunction } from "express";

export const websiteRouter: Router = Router();

// Feature gate — prevents crashes when Playwright is not installed
const FEATURE_ENABLED = process.env.ENABLE_WEBSITE_TO_FIGMA === "true";

/**
 * Validates a URL string is safe and public.
 */
function validateUrl(url: string): void {
  if (!url || typeof url !== "string") {
    throw new ValidationError("Missing url field in request body.");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (_) {
    throw new ValidationError(`Invalid URL: "${url}". Must be a valid absolute URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError(`Unsupported protocol: "${parsed.protocol}". Only http and https are allowed.`);
  }
  // Block private network ranges
  const hostname = parsed.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.16.")
  ) {
    throw new ValidationError("Private network URLs are not supported. Enter a public website URL.");
  }
}

/**
 * POST /api/website-to-figma
 */
websiteRouter.post(
  "/website-to-figma",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!FEATURE_ENABLED) {
        res.status(503).json({
          success: false,
          error: "Website URL feature is not enabled. Set ENABLE_WEBSITE_TO_FIGMA=true in backend .env",
        } satisfies WebsiteToFigmaResponse);
        return;
      }

      const requestId = uuidv4();
      const body = req.body as Partial<WebsiteToFigmaRequest>;

      console.log(`\n[${requestId}] === Website URL → Figma Request ===`);

      // Validate URL
      validateUrl(body.url ?? "");
      const url = body.url!;

      // Validate viewport
      const viewport = body.viewport ?? { width: 1440, height: 900 };
      if (
        typeof viewport.width !== "number" || viewport.width < 320 || viewport.width > 3840 ||
        typeof viewport.height !== "number" || viewport.height < 240 || viewport.height > 2160
      ) {
        throw new ValidationError("Invalid viewport dimensions. Width must be 320–3840, height 240–2160.");
      }

      console.log(`[WebsiteToFigma] URL: ${url}`);
      console.log(`[WebsiteToFigma] Viewport: ${viewport.width}x${viewport.height}`);

      const startTime = Date.now();

      // Run browser rendering + extraction
      const rawResult = await renderAndExtractWebsite(url, {
        viewport,
        timeoutMs: 45_000,
        stabilizationMs: 800,
      });

      // Normalize and clean the result
      const result = normalizeExtractionResult(rawResult, url);

      const elapsed = Date.now() - startTime;
      console.log(`[WebsiteToFigma] Conversion complete in ${elapsed}ms`);
      console.log(`[WebsiteToFigma] Page dimensions: ${result.pageWidth}x${result.pageHeight}`);
      console.log(`[WebsiteToFigma] Fonts: ${result.fonts.length}`);
      console.log(`[WebsiteToFigma] Assets: ${result.assets.length}`);

      res.json({
        success: true,
        data: result,
        requestId,
      } satisfies WebsiteToFigmaResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Provide user-friendly error messages for common browser errors
      let userMessage = message;
      if (message.includes("net::ERR_NAME_NOT_RESOLVED")) {
        userMessage = "Website not found. Check the URL and try again.";
      } else if (message.includes("net::ERR_CONNECTION_REFUSED")) {
        userMessage = "Connection refused. The website may be down or blocking automated access.";
      } else if (message.includes("net::ERR_CONNECTION_TIMED_OUT") || message.includes("Timeout")) {
        userMessage = "Website took too long to load. Try again or use a simpler page.";
      } else if (message.includes("Navigation failed") || message.includes("net::ERR")) {
        userMessage = `Failed to load website: ${message}`;
      }

      console.error(`[WebsiteToFigma] Error: ${message}`);

      if (err instanceof ValidationError) {
        next(err);
        return;
      }

      res.status(500).json({
        success: false,
        error: userMessage,
      } satisfies WebsiteToFigmaResponse);
    }
  }
);
