/**
 * DesignForge AI — Vision AI Analyzer Service (Gemini Edition)
 *
 * Sends screenshots to Google Gemini API (gemini-2.5-flash) with structured
 * JSON schema configuration to analyze layout and output design data.
 */

import { OpenRouterVisionProvider } from "./openrouter-provider.js";
import { config } from "../../config/index.js";
import { SYSTEM_PROMPT, buildUserPrompt, HTML_GENERATION_SYSTEM_PROMPT, buildHtmlUserPrompt, HTML_REVISION_SYSTEM_PROMPT, buildHtmlRevisionUserPrompt, OLLAMA_HTML_GENERATION_SYSTEM_PROMPT, buildOllamaHtmlUserPrompt, OLLAMA_HTML_REVISION_SYSTEM_PROMPT, buildOllamaHtmlRevisionUserPrompt } from "./prompts.js";
import { validateSchemaStructure, getAnalysisResponseSchema } from "./openrouter-schema.js";
import { AIServiceError } from "../../middleware/error-handler.js";
import { MAX_RETRIES, RETRY_DELAY_MS } from "@designforge/shared";
import { OllamaService } from "../OllamaService.js";
function getSDKVersion(): string {
  return "1.0.0 (OpenRouter)";
}

// Initialize standard client using environment variables
const openRouterClient = new OpenRouterVisionProvider({
  apiKey: config.OPENROUTER_API_KEY || "",
});

interface AnalyzeImageOptions {
  imageBase64: string;
  mimeType: string;
  width: number;
  height: number;
  apiKey?: string; // Optional user-provided key
  model?: string;  // Optional user-provided model
  debugMode?: boolean; // Enable schema logging/debug output
  aiProvider?: string; // Optional AI provider (openrouter or ollama)
}

/**
 * Analyze a UI screenshot using Gemini Vision with Structured JSON schema.
 * Returns a validated DesignAnalysis object.
 */
export async function analyzeScreenshot(
  options: AnalyzeImageOptions
): Promise<string> {
  const { imageBase64, mimeType, width, height, apiKey, model, debugMode } = options;

  // Use user-provided key if available, otherwise use server key
  const client = apiKey
    ? new OpenRouterVisionProvider({ apiKey })
    : openRouterClient;

  const modelName = model || config.OPENROUTER_MODEL;

  console.log(`[Vision Analysis] API Key Present: ${!!apiKey || !!config.OPENROUTER_API_KEY}`);
  console.log(`[Vision Analysis] API Key Source: ${apiKey ? "Header" : "Environment"}`);
  console.log(`[Vision Analysis] Model: ${modelName}`);
  console.log(`[Vision Analysis] Endpoint: https://openrouter.ai/api/v1/chat/completions`);

  // Detect device type and platform from dimensions
  const deviceType = detectDeviceType(width, height);
  const platform = detectPlatform(width, height);

  const userPrompt = buildUserPrompt(width, height, deviceType, platform);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[Vision] Attempt ${attempt}/${MAX_RETRIES} — Analyzing ${width}x${height} ${deviceType} screenshot via OpenRouter (${modelName})...`
      );

      const startTime = Date.now();

      const responseSchema = getAnalysisResponseSchema();

      // Check structural validation
      const structuralErrors = validateSchemaStructure(responseSchema);
      if (structuralErrors.length > 0) {
        console.error("Schema validation failed\n");
        structuralErrors.forEach(e => {
          console.error(`Path:\n${e.path}\n`);
          console.error(`Required:\n${JSON.stringify(e.required)}\n`);
          console.error(`Properties:\n${JSON.stringify(e.properties)}\n`);
          console.error(`Missing:\n${e.missing.join(", ")}\n`);
        });

        if (debugMode) {
          console.error("Generated schema:\n", JSON.stringify(responseSchema, null, 2));
        }

        const firstErr = structuralErrors[0];
        throw new Error(
          `Schema validation failed at path "${firstErr?.path}": Missing properties [${firstErr?.missing.join(", ")}]`
        );
      }

      if (debugMode) {
        console.log(`[Vision] DEBUG: Sending the following schema to OpenRouter (${modelName}):`);
        console.log(JSON.stringify(responseSchema, null, 2));
      }

      const sdkVer = getSDKVersion();
      console.log("=================================");
      console.log(`[Vision] API Call Details:`);
      console.log(`- Model Name:       ${modelName}`);
      console.log(`- SDK Version:      ${sdkVer}`);
      console.log(`- API Version:      v1 (Completions API)`);
      console.log(`- Base URL:         https://openrouter.ai/api/v1`);
      console.log(`- Transport:        REST / HTTP`);
      console.log("=================================");

      const response = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          userPrompt,
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1, // Low temp for layout consistency
        },
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Vision] Analysis completed in ${elapsed}s`);

      return response.text || "";
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));

      const sdkVer = getSDKVersion();
      console.error("=================================");
      console.error(`❌ [Vision] Attempt ${attempt} failed with API error:`);
      console.error(`- Model:            ${modelName}`);
      console.error(`- SDK Version:      ${sdkVer}`);
      console.error(`- HTTP Status:      ${err.status || err.statusCode || "unknown"}`);
      console.error(`- Request URL:      https://openrouter.ai/api/v1/chat/completions`);
      console.error(`- Error Message:    ${err.message}`);
      if (err.error) {
        console.error(`- Error Details:    `, JSON.stringify(err.error, null, 2));
      }
      if (err.cause) {
        console.error(`- Error Cause:      `, err.cause);
      }
      console.error(`- Stack Trace:      `, err.stack);
      console.error("=================================");

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[Vision] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new AIServiceError(
    `Gemini vision analysis failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
    { lastError: lastError?.message }
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function detectDeviceType(
  width: number,
  height: number
): "mobile" | "tablet" | "desktop" | "unknown" {
  const aspectRatio = height / width;

  if (width <= 480 || (aspectRatio > 1.5 && width <= 430)) return "mobile";
  if (width <= 1024 && width > 480) return "tablet";
  if (width > 1024) return "desktop";
  return "unknown";
}

function detectPlatform(
  width: number,
  height: number
): "ios" | "android" | "web" | "unknown" {
  // Common iOS screen sizes
  const iosWidths = [375, 390, 393, 414, 428, 430];
  const androidWidths = [360, 384, 400, 412, 480];

  if (width > 1024) return "web";
  if (iosWidths.includes(width)) return "ios";
  if (androidWidths.includes(width)) return "android";
  if (height / width > 1.5) return "unknown"; // Mobile but unclear platform
  return "web";
}


function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate semantic HTML and CSS from a screenshot using OpenRouter Vision.
 * Returns a JSON string containing { html, css }
 */
export async function generateHtmlFromScreenshot(
  options: AnalyzeImageOptions
): Promise<string> {
  const { imageBase64, mimeType, width, height, apiKey, model, aiProvider } = options;

  const targetProvider = aiProvider || config.AI_PROVIDER;
  const client = apiKey
    ? new OpenRouterVisionProvider({ apiKey })
    : openRouterClient;

  const modelName = model || (targetProvider === "ollama" ? config.OLLAMA_MODEL : config.OPENROUTER_MODEL);

  console.log(`[Vision HTML] Provider: ${targetProvider}`);
  console.log(`[Vision HTML] Model: ${modelName}`);

  let lastError: Error | null = null;
  const retries = targetProvider === "ollama" ? 1 : MAX_RETRIES;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `[Vision HTML] Attempt ${attempt}/${retries} — Generating HTML for ${width}x${height} screenshot via ${targetProvider} (${modelName})...`
      );

      // Phase 1: Generate Initial Code
      let initialText = "";
      if (targetProvider === "ollama") {
        const systemPrompt = OLLAMA_HTML_GENERATION_SYSTEM_PROMPT.replace("{width}", String(width)).replace("{height}", String(height));
        const userPrompt = buildOllamaHtmlUserPrompt(width, height);
        initialText = await OllamaService.generateContent({
          model: modelName,
          systemPrompt: systemPrompt,
          userPrompt: userPrompt,
          imageBase64,
          width,
          height,
        });
      } else {
        const userPrompt = buildHtmlUserPrompt(width, height);
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            userPrompt,
          ],
          config: {
            systemInstruction: HTML_GENERATION_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });
        initialText = response.text || "";
      }

      // Pre-clean initial code (strip fences)
      initialText = initialText.replace(/```html/g, "").replace(/```xml/g, "").replace(/```/g, "").trim();
      if (targetProvider === "ollama") {
        const endTag = '</div>';
        const startIndex = initialText.toLowerCase().indexOf('<div class="design-root"');
        const endIndex = initialText.toLowerCase().lastIndexOf('</div>');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          initialText = initialText.substring(startIndex, endIndex + endTag.length);
        }
      }

      if (!initialText.trim()) {
        throw new Error("Generated empty layout output.");
      }

      console.log(`[Vision HTML] Initial output generated successfully. Running self-correction reflection...`);

      // Phase 2: Self-Correction Loop
      let revisionText = "";

      if (targetProvider === "ollama") {
        const revisionPrompt = buildOllamaHtmlRevisionUserPrompt(initialText);
        revisionText = await OllamaService.generateContent({
          model: modelName,
          systemPrompt: OLLAMA_HTML_REVISION_SYSTEM_PROMPT,
          userPrompt: revisionPrompt,
          imageBase64,
          width,
          height,
        });
      } else {
        let initialHtml = "";
        let initialCss = "";
        try {
          const parsed = JSON.parse(initialText);
          initialHtml = parsed.html || "";
          initialCss = parsed.css || "";
        } catch (err) {
          const htmlMatch = initialText.match(/"html":\s*"([\s\S]*?)"(?=,\s*"css"|\s*\})/);
          const cssMatch = initialText.match(/"css":\s*"([\s\S]*?)"(?=\s*\})/);
          initialHtml = htmlMatch ? (htmlMatch[1] || "") : initialText;
          initialCss = cssMatch ? (cssMatch[1] || "") : "";
        }
        const revisionPrompt = buildHtmlRevisionUserPrompt(initialHtml, initialCss);
        const revisionResponse = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            revisionPrompt,
          ],
          config: {
            systemInstruction: HTML_REVISION_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });
        revisionText = revisionResponse.text || initialText;
      }

      console.log(`[Vision HTML] Self-correction completed.`);

      const finalRawText = (revisionText || initialText).trim();

      if (targetProvider === "ollama") {
        // Parse raw HTML + style block into expected { html, css } JSON format
        let cleanText = finalRawText.replace(/```html/g, "").replace(/```xml/g, "").replace(/```/g, "").trim();
        const endTag = '</div>';
        const startIndex = cleanText.toLowerCase().indexOf('<div class="design-root"');
        const endIndex = cleanText.toLowerCase().lastIndexOf('</div>');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          cleanText = cleanText.substring(startIndex, endIndex + endTag.length);
        }
        let html = cleanText;
        let css = "";

        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        const match = styleRegex.exec(cleanText);
        if (match && match[1]) {
          css = match[1].trim();
          html = cleanText.replace(styleRegex, "").trim();
        }

        return JSON.stringify({ html, css, width, height, confidence: 0.95, elements: [] });
      }

      return finalRawText;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`❌ [Vision HTML] Attempt ${attempt} failed: ${err.message}`);

      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw new AIServiceError(
    `${targetProvider} HTML/CSS generation failed after ${retries} attempts: ${lastError?.message}`,
    { lastError: lastError?.message }
  );
}

