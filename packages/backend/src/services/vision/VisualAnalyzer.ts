/**
 * DesignForge AI — OpenRouter Visual Analyzer Service
 *
 * Sends UI screenshots to OpenRouter Vision API and returns
 * structured VisualDocument JSON — NEVER HTML or CSS directly.
 *
 * Pipeline Step 1: Screenshot → OpenRouter Vision → VisualDocument JSON
 */

import { OpenRouterVisionProvider } from "./openrouter-provider.js";
import { config } from "../../config/index.js";
import { validateVisualJson } from "./VisualJsonValidator.js";
import {
  OPENROUTER_VISUAL_JSON_SYSTEM_PROMPT,
  JSON_REPAIR_SYSTEM_PROMPT,
  buildOpenRouterVisualJsonUserPrompt,
  buildOpenRouterVisualRepairPrompt,
} from "./prompts.js";
import type { VisualDocument } from "./VisualSchema.js";
import { AIServiceError } from "../../middleware/error-handler.js";

export interface VisualAnalyzerResult {
  doc: VisualDocument;
  rawJson: string;
  outputTokens: number;
  modelGenerationMs: number;
  wasRetried: boolean;
}

export interface VisualAnalyzerOptions {
  imageBase64: string;
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  apiKey?: string;
  model?: string;
}

/**
 * Analyzes a screenshot using OpenRouter Vision API and returns
 * a validated VisualDocument containing all identified visual elements.
 */
export async function analyzeScreenshotToVisualJson(
  options: VisualAnalyzerOptions
): Promise<VisualAnalyzerResult> {
  const { imageBase64, width, height, apiKey } = options;
  const originalW = options.originalWidth || width;
  const originalH = options.originalHeight || height;
  const modelName = options.model || config.OPENROUTER_MODEL;
  const effectiveApiKey = apiKey || config.OPENROUTER_API_KEY || "";
  const visionMaxTokens = Number(
    process.env.VISUAL_ANALYSIS_MAX_TOKENS ||
    (config as any).VISUAL_ANALYSIS_MAX_TOKENS ||
    config.OPENROUTER_VISION_MAX_TOKENS ||
    2800
  );
  const repairMaxTokens = Number(
    process.env.JSON_REPAIR_MAX_TOKENS ||
    (config as any).JSON_REPAIR_MAX_TOKENS ||
    2000
  );

  if (!effectiveApiKey) {
    throw new AIServiceError("OpenRouter API Key is missing. Set OPENROUTER_API_KEY in .env or provide header.", {
      provider: "openrouter",
    });
  }

  // Required logging per specification
  console.log(`[Visual Analysis] Provider: openrouter`);
  console.log(`[Visual Analysis] Model: ${modelName}`);
  console.log(`[Visual Analysis]`);
  console.log(`Original image: ${originalW} x ${originalH}`);
  console.log(`Analysis image: ${width} x ${height}`);
  console.log(`Max output tokens: ${visionMaxTokens}`);

  const client = new OpenRouterVisionProvider({ apiKey: effectiveApiKey });

  const systemPrompt = OPENROUTER_VISUAL_JSON_SYSTEM_PROMPT
    .replace(/{width}/g, String(width))
    .replace(/{height}/g, String(height));
  const userPrompt = buildOpenRouterVisualJsonUserPrompt(width, height);

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const startTime = Date.now();

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: "image/png",
          },
        },
        userPrompt,
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.1,
        maxTokens: visionMaxTokens,
      },
    });

    const elapsedMs = Date.now() - startTime;
    const rawText = response.text || "";
    const outputTokens = response.usage?.completion_tokens || 0;

    // Validate & Normalize returned JSON
    const validation = validateVisualJson(rawText, width, height);

    if (validation.valid && validation.doc && validation.stats.totalElements > 0) {
      return {
        doc: validation.doc,
        rawJson: rawText,
        outputTokens,
        modelGenerationMs: elapsedMs,
        wasRetried: false,
      };
    }

    // Repair pass if validation failed or 0 elements detected (Text-only repair pass per Rule 6)
    const errorReason = validation.errors.join("; ") || (validation.stats.totalElements === 0 ? "0 elements detected" : "invalid structure");
    console.warn(`⚠️ [VisualJSON] Initial pass failed (${errorReason}). Running text-only repair pass...`);

    const repairPrompt = buildOpenRouterVisualRepairPrompt(width, height, rawText, errorReason);

    const repairResponse = await client.models.generateContent({
      model: modelName,
      contents: [repairPrompt], // Text-only: Do NOT send image in repair pass (Rule 6)
      config: {
        systemInstruction: JSON_REPAIR_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1,
        maxTokens: repairMaxTokens,
      },
    });

    const repairText = repairResponse.text || "";
    console.log(`\n[VisualJSON] Evaluating repair pass output...`);
    const repairValidation = validateVisualJson(repairText, width, height);
    const repairSuccess = repairValidation.valid && repairValidation.doc !== null && repairValidation.stats.totalElements > 0;

    if (repairSuccess && repairValidation.doc) {
      return {
        doc: repairValidation.doc,
        rawJson: repairText,
        outputTokens: outputTokens + (repairResponse.usage?.completion_tokens || 0),
        modelGenerationMs: Date.now() - startTime,
        wasRetried: true,
      };
    }

    throw new AIServiceError(
      `OpenRouter visual analysis returned invalid JSON: ${validation.errors.concat(repairValidation.errors).join("; ")}`,
      { validationErrors: validation.errors.concat(repairValidation.errors) }
    );
  } catch (err: any) {
    if (err instanceof AIServiceError) throw err;
    console.error(`❌ [Vision] OpenRouter request failed: ${err.message}`);
    throw new AIServiceError(`OpenRouter vision analysis failed: ${err.message}`, {
      model: modelName,
      cause: err.message,
    });
  }
}
