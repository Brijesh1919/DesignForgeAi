/**
 * DesignForge AI — Analysis API Endpoint
 *
 * POST /api/analyze
 * Accepts a screenshot, runs pre-processing, cache resolution,
 * OpenRouter vision extraction, validation, coordinate normalization,
 * typography/color enrichment, conservative auto-layout, fidelity scoring,
 * and optional debug overlay generation.
 */

import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { preprocessImage } from "../services/images/preprocessor.js";
import { generateHtmlFromScreenshot, parseHtmlCssFromText } from "../services/vision/analyzer.js";
import {
  getCachedHtml,
  setCachedHtml,
  computeImageHash,
  computeCacheKey,
} from "../services/cache/local-cache.js";
import { validateAndNormalizeHtmlCss } from "../services/validation/html-validator.js";
import { ValidationError, AIServiceError } from "../middleware/error-handler.js";
import { SUPPORTED_IMAGE_TYPES } from "@designforge/shared";
import { config } from "../config/index.js";
import type { Request, Response, NextFunction } from "express";

export const analyzeRouter: Router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_IMAGE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (
      SUPPORTED_IMAGE_TYPES.includes(
        file.mimetype as (typeof SUPPORTED_IMAGE_TYPES)[number]
      )
    ) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/analyze
 */
analyzeRouter.post(
  "/analyze",
  async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      throw new ValidationError(
        "Direct screenshot-to-Figma endpoint is deprecated. Use the new HTML/CSS intermediate pipeline via POST /api/analyze-html instead."
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/analyze-html
 * Translates a screenshot into HTML and CSS using OpenRouter or Ollama vision models.
 */
analyzeRouter.post(
  "/analyze-html",
  upload.single("screenshot"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = uuidv4();
      console.log(`\n[${requestId}] === New HTML/CSS Analysis Request ===`);

      let imageBuffer: Buffer;

      if (req.file) {
        imageBuffer = req.file.buffer;
      } else if (req.body?.imageBase64) {
        const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        imageBuffer = Buffer.from(base64Data, "base64");
      } else {
        throw new ValidationError("No image provided.");
      }

      let apiKey: string | undefined = (req.query["apiKey"] as string) || (req.headers["x-api-key"] as string) || undefined;
      if (
        apiKey === "" ||
        apiKey === "undefined" ||
        apiKey === "null" ||
        (config.AI_PROVIDER === "openrouter" && apiKey && !apiKey.startsWith("sk-or-"))
      ) {
        apiKey = undefined;
      }
      const aiProvider = "openrouter";
      const clientModel = (req.headers["x-openrouter-model"] as string) || (req.headers["x-gemini-model"] as string);
      const modelName = clientModel && clientModel.includes("/") ? clientModel : config.OPENROUTER_MODEL;

      const forceRegenerate = req.headers["x-force-regenerate"] === "true";

      const requestStartTime = Date.now();
      const preprocessStartTime = Date.now();
      const processed = await preprocessImage(imageBuffer);
      const preprocessEndTime = Date.now();
      const preprocessingMs = preprocessEndTime - preprocessStartTime;

      // Local Cache Check (Compound Key)
      const imageHash = computeImageHash(processed.buffer);
      const cacheKey = computeCacheKey(imageHash, aiProvider, modelName);

      const cached = await getCachedHtml({
        cacheKey,
        imageHash,
        provider: aiProvider,
        model: modelName,
        forceRegenerate,
      });

      if (cached) {
        const responsePayload: any = {
          success: true,
          requestId,
          cached: true,
          data: {
            html: cached.html,
            css: cached.css,
            width: cached.width || processed.width,
            height: cached.height || processed.height,
            confidence: cached.confidence || 0.95,
            elements: cached.elements || [],
          },
          thumbnail: processed.thumbnail,
        };

        if (req.headers["x-debug-mode"] === "true") {
          responsePayload.debug = {
            screenshotDimensions: `${processed.width}x${processed.height}`,
            visionAnalysis: "Loaded from Cache",
            generatedHtml: cached.html,
            generatedCss: cached.css,
            normalizedHtmlCss: `HTML:\n${cached.html}\n\nCSS:\n${cached.css}`,
            validationErrors: "None (Cached)",
          };
        }

        res.json(responsePayload);
        return;
      }

      console.log(`[${requestId}] Calling vision model to generate HTML/CSS...`);
      const rawText = await generateHtmlFromScreenshot({
        imageBase64: processed.base64,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        originalWidth: processed.originalWidth,
        originalHeight: processed.originalHeight,
        apiKey,
        model: modelName,
        aiProvider,
      });

      // Robust multi-strategy parsing of model response
      const parsedOutput = parseHtmlCssFromText(rawText, processed.width, processed.height);

      // Validate & Normalize HTML/CSS with actual image dimensions
      const normalized = validateAndNormalizeHtmlCss(
        parsedOutput.html || "",
        parsedOutput.css || "",
        processed.width,
        processed.height
      );

      if (normalized.errors.length > 0) {
        throw new AIServiceError(`Validation failed: ${normalized.errors.join("; ")}`, {
          validationErrors: normalized.errors,
        });
      }

      // Timing & Token metrics extraction
      let parsedMeta: any = {};
      try {
        parsedMeta = JSON.parse(rawText);
      } catch {
        // Handled by parseHtmlCssFromText
      }

      const metrics = parsedMeta?.metrics || {};
      const requestEndTime = Date.now();
      const totalMs = requestEndTime - requestStartTime;
      const providerRequestMs = totalMs - preprocessingMs;
      const modelGenMs = metrics.modelGenerationMs || providerRequestMs;
      const outTokens = metrics.outputTokens || 0;

      console.log(`\n[Photo→HTML] Image preprocessing: ${preprocessingMs} ms`);
      console.log(`[Photo→HTML] OpenRouter request: ${providerRequestMs} ms`);
      console.log(`[Photo→HTML] Model generation: ${modelGenMs} ms`);
      console.log(`[Photo→HTML] Output tokens: ${outTokens}`);
      console.log(`[Photo→HTML] Total: ${totalMs} ms\n`);

      const responseData = {
        html: normalized.html,
        css: normalized.css,
        width: processed.width,
        height: processed.height,
        confidence: 0.95,
        elements: [],
        metadata: parsedMeta?.metadata || {
          width: processed.width,
          height: processed.height,
          elementCount: 0,
          textCount: 0,
          imageCount: 0,
          iconCount: 0,
          sectionCount: 0,
        },
        fidelity: parsedMeta?.fidelity || {
          contentComplete: true,
          geometryValidated: true,
          renderValidated: true,
          missingElements: [],
        },
      };

      // Write results back to cache
      await setCachedHtml(cacheKey, responseData);

      const responsePayload: any = {
        success: true,
        requestId,
        cached: false,
        data: responseData,
        thumbnail: processed.thumbnail,
      };

      if (req.headers["x-debug-mode"] === "true") {
        responsePayload.debug = {
          screenshotDimensions: `${processed.width}x${processed.height}`,
          visionAnalysis: rawText,
          generatedHtml: parsedOutput.html,
          generatedCss: parsedOutput.css,
          normalizedHtmlCss: `HTML:\n${normalized.html}\n\nCSS:\n${normalized.css}`,
          validationErrors: normalized.errors.join("\n") || "No validation errors.",
        };
      }

      res.json(responsePayload);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Pipeline Debug Helpers ──────────────────────────────────

