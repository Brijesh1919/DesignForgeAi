/**
 * DesignForge AI — AI Design Generation API Endpoint
 *
 * POST /api/generate
 * Accepts a natural language prompt, generates visually complete HTML/CSS
 * using OpenRouter / Gemini with strict JSON schema contract, validates and
 * normalizes output, and returns standard HTML/CSS payload for the plugin preview & Figma pipeline.
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { OpenRouterVisionProvider } from "../services/vision/openrouter-provider.js";
import { parseDesignResponse } from "../services/vision/analyzer.js";
import { validateAndNormalizeHtmlCss, validateCssCoverage } from "../services/validation/html-validator.js";
import {
  GENERATE_DESIGN_SYSTEM_PROMPT,
  AI_DESIGN_RESPONSE_SCHEMA,
  AI_CSS_REPAIR_SCHEMA,
  buildGenerateDesignUserPrompt,
  buildGenerateDesignRepairPrompt,
} from "../services/vision/generate-prompt.js";
import { ValidationError, AIServiceError } from "../middleware/error-handler.js";
import { config } from "../config/index.js";
import type { Request, Response, NextFunction } from "express";

export const generateRouter: Router = Router();

// Initialize standard OpenRouter client using server environment key
const defaultClient = new OpenRouterVisionProvider({
  apiKey: config.OPENROUTER_API_KEY || "",
});

/**
 * POST /api/generate
 */
generateRouter.post(
  "/generate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = uuidv4();
      const { prompt, width: customWidth, height: customHeight } = req.body || {};

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        throw new ValidationError("A non-empty natural language prompt is required.");
      }

      console.log(`\n[${requestId}] === New AI Design Generation Request ===`);
      console.log(`[${requestId}] Prompt: "${prompt.trim().slice(0, 100)}..."`);

      // Extract client-provided or default API key and model
      let apiKey: string | undefined =
        (req.query["apiKey"] as string) ||
        (req.headers["x-api-key"] as string) ||
        undefined;

      if (
        apiKey === "" ||
        apiKey === "undefined" ||
        apiKey === "null" ||
        (config.AI_PROVIDER === "openrouter" && apiKey && !apiKey.startsWith("sk-or-"))
      ) {
        apiKey = undefined;
      }

      const client = apiKey
        ? new OpenRouterVisionProvider({ apiKey })
        : defaultClient;

      const clientModel =
        (req.headers["x-openrouter-model"] as string) ||
        (req.headers["x-gemini-model"] as string);

      const modelName =
        clientModel && clientModel.includes("/") ? clientModel : config.AI_DESIGN_MODEL;

      const width = Number(customWidth) > 0 ? Number(customWidth) : 1200;
      const height = Number(customHeight) > 0 ? Number(customHeight) : 900;

      const userPrompt = buildGenerateDesignUserPrompt(prompt.trim());

      const tStart = Date.now();
      console.log(`[${requestId}] Calling OpenRouter model (${modelName}) with strict JSON schema...`);

      const effectiveMaxTokens = Number(
        process.env.AI_MAX_TOKENS ||
        (config as any).AI_MAX_TOKENS ||
        config.GENERATE_MAX_TOKENS ||
        2500
      );

      const response = await client.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: GENERATE_DESIGN_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: AI_DESIGN_RESPONSE_SCHEMA,
          temperature: 0.3,
          maxTokens: effectiveMaxTokens,
        },
      });

      let rawText = response.text || "";
      const tElapsed = ((Date.now() - tStart) / 1000).toFixed(1);
      console.log(`[${requestId}] AI generation completed in ${tElapsed}s (${rawText.length} characters)`);

      if (!rawText.trim()) {
        throw new AIServiceError("The AI model returned an empty response. Please try again.");
      }

      // Robust multi-strategy parsing of model response
      let parsedOutput = parseDesignResponse(rawText, width, height);

      console.log(`\n[AI DEBUG]`);
      console.log(`HTML length: ${parsedOutput.html.length}`);
      console.log(`CSS length: ${parsedOutput.css.length}`);

      if (!parsedOutput.html || !parsedOutput.html.trim()) {
        throw new AIServiceError(
          "Failed to parse valid HTML from the AI response. Please try refining your prompt."
        );
      }

      // Sections 8, 9, 10: Validate CSS coverage & perform intelligent repair if needed
      let coverage = validateCssCoverage(parsedOutput.html, parsedOutput.css);

      let repairAttempt = 0;
      const MAX_REPAIR_ATTEMPTS = 2;

      while ((!coverage.isUsable || !coverage.isValid) && repairAttempt < MAX_REPAIR_ATTEMPTS) {
        repairAttempt++;
        console.log(`\n[CSS REPAIR]`);
        console.log(`Attempt ${repairAttempt}`);
        console.log(`Missing classes: ${coverage.missingClasses.join(", ") || "(none)"}`);

        const repairPrompt = buildGenerateDesignRepairPrompt(
          parsedOutput.html,
          parsedOutput.css,
          coverage.missingClasses
        );

        try {
          const repairResponse = await client.models.generateContent({
            model: modelName,
            contents: repairPrompt,
            config: {
              systemInstruction: "You are an expert CSS engineer. Return pure JSON with a 'css' field containing the complete CSS rules required to style the requested HTML classes.",
              responseMimeType: "application/json",
              responseSchema: AI_CSS_REPAIR_SCHEMA,
              temperature: 0.2,
              maxTokens: effectiveMaxTokens,
            },
          });

          const repairText = repairResponse.text || "";
          if (repairText.trim()) {
            let repairParsed = parseDesignResponse(repairText, width, height);
            let additionalCss = repairParsed.css;

            if (!additionalCss && repairText.includes("{")) {
              try {
                const parsedObj = JSON.parse(repairText);
                if (parsedObj.css) additionalCss = parsedObj.css;
              } catch {
                if (repairText.includes("{") && repairText.includes("}")) {
                  additionalCss = repairText.replace(/```css|```json|```/gi, "").trim();
                }
              }
            }

            if (additionalCss && additionalCss.trim()) {
              parsedOutput.css = parsedOutput.css + "\n\n/* Repaired Section Styles */\n" + additionalCss.trim();
            }
          }
        } catch (repairErr: any) {
          console.warn(`[CSS REPAIR] Repair attempt ${repairAttempt} error:`, repairErr.message);
        }

        coverage = validateCssCoverage(parsedOutput.html, parsedOutput.css);

        console.log(`\n[CSS REPAIR]`);
        console.log(`Attempt ${repairAttempt} result:`);
        console.log(`CSS length: ${parsedOutput.css.length}`);
        console.log(`Coverage: ${coverage.coveragePercent}%\n`);

        if (coverage.isValid && coverage.isUsable) {
          break;
        }
      }

      if (!coverage.isUsable || !coverage.isValid) {
        throw new AIServiceError("AI generated incomplete CSS after repair attempts.");
      }

      // Validate & Normalize HTML/CSS
      const normalized = validateAndNormalizeHtmlCss(
        parsedOutput.html,
        parsedOutput.css,
        width,
        height
      );

      console.log(`\n[NORMALIZATION DEBUG]`);
      console.log(`HTML length: ${normalized.html.length}`);
      console.log(`CSS length: ${normalized.css.length}`);

      if (normalized.errors.length > 0) {
        console.warn(`[${requestId}] HTML/CSS normalization errors/warnings:`, normalized.errors);
        const criticalError = normalized.errors.find(
          (e) => e.includes("CSS generation failed") || e.includes("HTML content is empty")
        );
        if (criticalError) {
          throw new AIServiceError(criticalError);
        }
      }

      console.log(`\n[DESIGN GRAPH DEBUG]`);
      console.log(`HTML length: ${normalized.html.length}`);
      console.log(`CSS length: ${normalized.css.length}`);

      const responseData = {
        html: normalized.html,
        css: normalized.css,
        width,
        height,
        confidence: 1.0,
        elements: [],
      };

      const responsePayload: any = {
        success: true,
        requestId,
        data: responseData,
      };

      if (req.headers["x-debug-mode"] === "true") {
        responsePayload.debug = {
          rawResponse: rawText,
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
