/**
 * DesignForge AI — Vision AI Analyzer Service (Gemini Edition)
 *
 * Sends screenshots to Google Gemini API (gemini-2.5-flash) with structured
 * JSON schema configuration to analyze layout and output design data.
 */

import { OpenRouterVisionProvider } from "./openrouter-provider.js";
import { config } from "../../config/index.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";
import { validateSchemaStructure, getAnalysisResponseSchema } from "./openrouter-schema.js";
import { AIServiceError } from "../../middleware/error-handler.js";
import { MAX_RETRIES, RETRY_DELAY_MS } from "@designforge/shared";
import { analyzeScreenshotToVisualJson } from "./VisualAnalyzer.js";
import { generateHtmlCssFromVisualDocument, validateGeneratedOutput } from "./HtmlCssGenerator.js";
import { validateFidelity } from "../validation/FidelityValidator.js";

export interface IntegrityCheckResult {
  isCorrupt: boolean;
  reason?: string;
}

/**
 * Checks whether LLM generated HTML/CSS is truncated, reached token limits, or contains repetitive selectors.
 */
export function checkOutputIntegrity(
  _rawText: string,
  html: string,
  css: string,
  outputTokens: number,
  numPredict: number
): IntegrityCheckResult {
  // 1. Check if maximum token limit was hit
  if (numPredict > 0 && outputTokens >= numPredict) {
    return {
      isCorrupt: true,
      reason: `Hit maximum output token limit (${outputTokens}/${numPredict} tokens)`,
    };
  }

  // 2. Check for recursive/repetitive selectors (e.g. .sidebar .sidebar or .a.b .a.b)
  const repetitiveSelectorRegex = /\.([a-zA-Z0-9_-]+)(?:\s+\.\1)+/gi;
  if (repetitiveSelectorRegex.test(css)) {
    return {
      isCorrupt: true,
      reason: `Detected recursive/repetitive CSS selector pattern`,
    };
  }

  // 3. Check for repeated class names in a single selector string
  const selectorLines = css.split("{");
  for (const chunk of selectorLines) {
    const selectorStr = chunk.split("}").pop() || "";
    const classes = selectorStr.match(/\.([a-zA-Z0-9_-]+)/g);
    if (classes && classes.length > 3) {
      const counts: Record<string, number> = {};
      for (const cls of classes) {
        counts[cls] = (counts[cls] || 0) + 1;
        if (counts[cls]! >= 2) {
          return {
            isCorrupt: true,
            reason: `Detected repeated class '${cls}' in selector '${selectorStr.trim()}'`,
          };
        }
      }
    }
  }

  // 4. Check for unclosed/truncated CSS declarations at end of CSS
  const trimmedCss = css.trim();
  if (trimmedCss.length > 20 && !trimmedCss.endsWith("}") && !trimmedCss.endsWith(";")) {
    return {
      isCorrupt: true,
      reason: `CSS output is incomplete or truncated`,
    };
  }

  // 5. Check for unclosed/truncated HTML
  const trimmedHtml = html.trim();
  if (trimmedHtml.length > 50 && !trimmedHtml.endsWith("</div>") && !trimmedHtml.endsWith(">")) {
    return {
      isCorrupt: true,
      reason: `HTML output is incomplete or truncated`,
    };
  }

  return { isCorrupt: false };
}
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
  originalWidth?: number;
  originalHeight?: number;
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
 * Resilient multi-strategy parser to extract HTML and CSS from LLM/VLM text output.
 */
export function parseHtmlCssFromText(
  rawText: string,
  _width?: number,
  _height?: number
): { html: string; css: string } {
  if (!rawText || !rawText.trim()) {
    return { html: "", css: "" };
  }

  let text = rawText.trim();

  // 1. Direct JSON parse after stripping outer markdown code fences
  const strippedText = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(strippedText);
    if (parsed && (typeof parsed.html === "string" || typeof parsed.css === "string")) {
      return {
        html: parsed.html || "",
        css: parsed.css || "",
      };
    }
  } catch {
    // Continue to next strategy
  }

  // 2. Extract JSON substring with "html" and "css"
  const jsonMatch = text.match(/\{[\s\S]*"html"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && (typeof parsed.html === "string" || typeof parsed.css === "string")) {
        return {
          html: parsed.html || "",
          css: parsed.css || "",
        };
      }
    } catch {
      // Continue
    }
  }

  // 3. Extract separate ```html and ```css blocks
  const htmlBlockMatch = text.match(/```(?:html|xml)\s*([\s\S]*?)```/i);
  const cssBlockMatch = text.match(/```css\s*([\s\S]*?)```/i);

  if (htmlBlockMatch || cssBlockMatch) {
    let extractedHtml = htmlBlockMatch ? htmlBlockMatch[1]?.trim() || "" : "";
    let extractedCss = cssBlockMatch ? cssBlockMatch[1]?.trim() || "" : "";

    // If html contains a <style> block, extract and append to css
    const styleInHtml = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleInHtml && styleInHtml[1]) {
      extractedCss = (extractedCss + "\n" + styleInHtml[1]).trim();
      extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
    }

    if (extractedHtml || extractedCss) {
      return {
        html: extractedHtml,
        css: extractedCss,
      };
    }
  }

  // 4. Extract <style> block from unified HTML
  const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  let cssFromStyle = "";
  let htmlWithoutStyle = text;

  if (styleMatch && styleMatch[1]) {
    cssFromStyle = styleMatch[1].trim();
    htmlWithoutStyle = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
  }

  // Strip generic markdown fences
  htmlWithoutStyle = htmlWithoutStyle.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();

  if (/<[a-z][\s\S]*>/i.test(htmlWithoutStyle)) {
    return {
      html: htmlWithoutStyle,
      css: cssFromStyle,
    };
  }

  // 5. Fallback heuristic for JSON-like "html": "..." and "css": "..."
  const htmlKeyMatch = text.match(/"html"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"css"|\s*\})/);
  const cssKeyMatch = text.match(/"css"\s*:\s*"([\s\S]*?)"(?=\s*\})/);
  if (htmlKeyMatch || cssKeyMatch) {
    return {
      html: htmlKeyMatch ? htmlKeyMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"') : "",
      css: cssKeyMatch ? cssKeyMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"') : "",
    };
  }

  return { html: text, css: "" };
}

/**
 * Generate semantic HTML and CSS from a screenshot using OpenRouter Vision.
 * Returns a JSON string containing { html, css }
 */
export async function generateHtmlFromScreenshot(
  options: AnalyzeImageOptions
): Promise<string> {
  const { imageBase64, width, height, originalWidth, originalHeight, apiKey, model } = options;

  const modelName = model || config.OPENROUTER_MODEL;
  const tStart = Date.now();

  // Step 1: OpenRouter Visual JSON analysis (Phase 1)
  const analyzerResult = await analyzeScreenshotToVisualJson({
    imageBase64,
    width,
    height,
    originalWidth,
    originalHeight,
    apiKey,
    model: modelName,
  });

  // Step 2: Deterministic HTML/CSS generation
  const generated = generateHtmlCssFromVisualDocument(analyzerResult.doc);

  // Step 3: Output validation
  const validationErrors = validateGeneratedOutput(
    generated.html,
    generated.css,
    { elementCount: generated.elementCount, textNodeCount: generated.textNodeCount }
  );

  if (validationErrors.length > 0) {
    console.warn(`⚠️ [Photo→HTML] Output validation warnings:`);
    for (const err of validationErrors) {
      console.warn(`   - ${err}`);
    }
  }

  // Step 4: Content Completeness & Fidelity Pass
  const fidelityResult = validateFidelity(analyzerResult.doc, generated);

  const tEnd = Date.now();

  return JSON.stringify({
    html: generated.html,
    css: generated.css,
    width,
    height,
    confidence: 0.95,
    elements: [],
    metadata: fidelityResult.metadata,
    fidelity: fidelityResult.fidelity,
    metrics: {
      provider: "openrouter",
      model: modelName,
      modelGenerationMs: analyzerResult.modelGenerationMs,
      outputTokens: analyzerResult.outputTokens,
      visualElements: analyzerResult.doc.elements.length,
      wasRetried: analyzerResult.wasRetried,
      totalPipelineMs: tEnd - tStart,
    },
  });
}

