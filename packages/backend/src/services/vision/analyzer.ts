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
 * Decodes JSON string escape sequences (e.g. \" -> ", \n -> newline).
 */
function decodeJsonEscapeSequences(str: string): string {
  try {
    return JSON.parse(`"${str}"`);
  } catch {
    return str
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\")
      .replace(/\\\//g, "/");
  }
}

/**
 * Extracts string values of "html" and "css" fields from malformed JSON text.
 */
function extractFieldsFromMalformedJson(text: string): { html: string; css: string } {
  let html = "";
  let css = "";

  // Match "html": "..."
  const htmlKeyIdx = text.indexOf('"html"');
  if (htmlKeyIdx !== -1) {
    const colonIdx = text.indexOf(":", htmlKeyIdx + 6);
    if (colonIdx !== -1) {
      const firstQuoteIdx = text.indexOf('"', colonIdx + 1);
      if (firstQuoteIdx !== -1) {
        let i = firstQuoteIdx + 1;
        let escaped = false;
        let content = "";
        while (i < text.length) {
          const char = text[i];
          if (char === "\\") {
            escaped = !escaped;
          } else if (char === '"' && !escaped) {
            const rest = text.slice(i + 1).trim();
            if (
              rest.startsWith(",") ||
              rest.startsWith("}") ||
              rest.startsWith('"css"') ||
              i >= text.length - 10
            ) {
              break;
            }
          } else {
            escaped = false;
          }
          content += char;
          i++;
        }
        html = decodeJsonEscapeSequences(content);
      }
    }
  }

  // Match "css": "..."
  const cssKeyIdx = text.indexOf('"css"');
  if (cssKeyIdx !== -1) {
    const colonIdx = text.indexOf(":", cssKeyIdx + 5);
    if (colonIdx !== -1) {
      const firstQuoteIdx = text.indexOf('"', colonIdx + 1);
      if (firstQuoteIdx !== -1) {
        let i = firstQuoteIdx + 1;
        let escaped = false;
        let content = "";
        while (i < text.length) {
          const char = text[i];
          if (char === "\\") {
            escaped = !escaped;
          } else if (char === '"' && !escaped) {
            break;
          } else {
            escaped = false;
          }
          content += char;
          i++;
        }
        css = decodeJsonEscapeSequences(content);
      }
    }
  }

  return { html, css };
}

/**
 * Sanitizes an HTML string:
 * - Strips any accidental JSON wrapper prefix/suffix (e.g. `{ "html": ` or `" }`)
 * - Decodes escaped quotes on HTML/SVG attributes (e.g. viewBox=\"0 0 24 24\" -> viewBox="0 0 24 24")
 * - Decodes double-escaped quotes on attributes (e.g. viewBox="\"0 0 24 24\"" -> viewBox="0 0 24 24")
 * - Preserves all SVG tags, paths, and attributes.
 */
export function sanitizeHtmlString(html: string): string {
  if (!html) return "";

  let cleaned = html.trim();

  // Strip generic markdown code fences
  cleaned = cleaned
    .replace(/^```(?:html|xml)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Strip accidental leading JSON wrapper residue like `{\n  "html": "`
  cleaned = cleaned.replace(/^\s*\{\s*"html"\s*:\s*"/i, "");
  // Strip accidental trailing JSON wrapper residue like `",\s*"css": "..." }` or `"`
  cleaned = cleaned.replace(/"\s*(?:,\s*"css"\s*:\s*"[\s\S]*")?\s*\}\s*$/i, "");

  // If the string starts with `"` and ends with `"`, strip the outer string quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1);
  }

  // Fix escaped quotes in HTML attributes:
  // e.g. class=\"btn\" -> class="btn"
  // e.g. viewBox=\"0 0 24 24\" -> viewBox="0 0 24 24"
  // e.g. d=\"M12 2L2 7l10 5...\" -> d="M12 2L2 7l10 5..."
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)=\\"([^"\\]*(?:\\.[^"\\]*)*)\\"/g, '$1="$2"');

  // Fix double-escaped quotes inside attribute values:
  // e.g. viewBox="\"0 0 24 24\"" -> viewBox="0 0 24 24"
  cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)="\\+"([^"]*?)\\*"/g, '$1="$2"');

  // Fix any remaining `=\"` or `\"` at attribute boundaries in tags
  cleaned = cleaned.replace(/<([a-zA-Z0-9]+)\s+([^>]+)>/g, (_match, tagName, attrs) => {
    let fixedAttrs = attrs;
    fixedAttrs = fixedAttrs.replace(/=\\"(.*?)\\"/g, '="$1"');
    fixedAttrs = fixedAttrs.replace(/=\\"(.*?)\"/g, '="$1"');
    fixedAttrs = fixedAttrs.replace(/="(.*?)\\"/g, '="$1"');
    return `<${tagName} ${fixedAttrs}>`;
  });

  return cleaned.trim();
}

/**
 * Sanitizes CSS string:
 * - Strips outer fences
 * - Decodes escaped newlines
 */
export function sanitizeCssString(css: string): string {
  if (!css) return "";
  let cleaned = css.trim();
  cleaned = cleaned
    .replace(/^```css\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1);
  }

  if (cleaned.includes("\\n") || cleaned.includes('\\"')) {
    cleaned = cleaned
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");
  }

  return cleaned.trim();
}

import * as csstree from "css-tree";

/**
 * Helper to extract class names from an HTML string
 */
export function extractHtmlClasses(html: string): string[] {
  const classMatches = html.matchAll(/class=["']([^"']*)["']/gi);
  const classSet = new Set<string>();
  for (const m of classMatches) {
    if (m[1]) {
      const tokens = m[1].trim().split(/\s+/);
      for (const t of tokens) {
        if (t && t !== "design-root") {
          classSet.add(t);
        }
      }
    }
  }
  return Array.from(classSet);
}

/**
 * Helper to extract class selectors from a CSS string using AST
 */
export function extractCssClasses(css: string): string[] {
  if (!css || !css.trim()) return [];
  try {
    const classSet = new Set<string>();
    const ast = csstree.parse(css, { parseCustomProperty: true, positions: false });
    csstree.walk(ast, (node) => {
      if (node.type === "ClassSelector" && node.name && node.name !== "design-root") {
        classSet.add(node.name);
      }
    });
    return Array.from(classSet);
  } catch {
    const classSet = new Set<string>();
    // Non-digit starting class selector regex to prevent matching numbers like .6 or .2
    const selectorMatches = css.matchAll(/(?:^|[\s,>+~{;}])\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g);
    for (const m of selectorMatches) {
      if (m[1] && m[1] !== "design-root") {
        classSet.add(m[1]);
      }
    }
    return Array.from(classSet);
  }
}

/**
 * Count CSS rule blocks ({ ... })
 */
export function countCssRules(css: string): number {
  if (!css || !css.trim()) return 0;
  try {
    let count = 0;
    const ast = csstree.parse(css, { parseCustomProperty: true, positions: false });
    csstree.walk(ast, (node) => {
      if (node.type === "Rule") count++;
    });
    return count;
  } catch {
    const matches = css.match(/\{[\s\S]*?\}/g);
    return matches ? matches.length : 0;
  }
}

/**
 * Log structured AI & CSS debug diagnostics (does not truncate critical debug info)
 */
function logCssDiagnostics(rawText: string, html: string, css: string) {
  const hasHtml = typeof html === "string" && html.trim().length > 0;
  const hasCss = typeof css === "string" && css.trim().length > 0;
  const ruleCount = countCssRules(css);
  const htmlClasses = extractHtmlClasses(html);
  const cssClasses = extractCssClasses(css);

  console.log(`[AI DEBUG] Response type: ${typeof rawText}`);
  console.log(`[AI DEBUG] Has html: ${hasHtml}`);
  console.log(`[AI DEBUG] Has css: ${hasCss}`);
  console.log(`[AI DEBUG] HTML length: ${html.length}`);
  console.log(`[AI DEBUG] CSS length: ${css.length}`);
  console.log(`[AI DEBUG] CSS first 500 characters:\n${css.slice(0, 500)}`);

  console.log(`[CSS DEBUG] Has html: ${hasHtml}`);
  console.log(`[CSS DEBUG] Has css: ${hasCss}`);
  console.log(`[CSS DEBUG] Parsed HTML length: ${html.length}`);
  console.log(`[CSS DEBUG] Parsed CSS length: ${css.length}`);
  console.log(`[CSS DEBUG] Number of CSS rules: ${ruleCount}`);
  console.log(`[CSS DEBUG] CSS preview:\n${css.slice(0, 300)}${css.length > 300 ? "..." : ""}`);
  console.log(`[CSS DEBUG] HTML classes detected: ${htmlClasses.join(", ") || "(none)"}`);
  console.log(`[CSS DEBUG] CSS classes detected: ${cssClasses.join(", ") || "(none)"}`);
}

/**
 * Centralized response parser per Task 7
 */
export function parseDesignResponse(
  input: any,
  width?: number,
  height?: number
): { html: string; css: string } {
  return normalizeAIHtmlResponse(input, width, height);
}

/**
 * Robust normalization of any AI output format into clean, unescaped HTML and CSS.
 */
export function normalizeAIHtmlResponse(
  input: any,
  _width?: number,
  _height?: number
): { html: string; css: string } {
  if (!input) {
    return { html: "", css: "" };
  }

  const rawInputStr = typeof input === "string" ? input : typeof input === "object" ? JSON.stringify(input) : String(input);

  // 1. Handle direct object input { html, css }
  if (typeof input === "object" && input !== null) {
    let rawHtml = typeof input.html === "string" ? input.html : "";
    let rawCss = typeof input.css === "string" ? input.css : "";

    // If html property itself is a JSON string or markdown block, unwrap it
    if (rawHtml.trim().startsWith("{") || rawHtml.trim().startsWith("```")) {
      const unwrapped = normalizeAIHtmlResponse(rawHtml);
      rawHtml = unwrapped.html;
      if (!rawCss && unwrapped.css) rawCss = unwrapped.css;
    }

    // Extract any inline <style> tags from HTML into CSS
    const styleMatches = rawHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
      for (const s of styleMatches) {
        const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
        if (inner) rawCss = (rawCss ? rawCss + "\n" + inner : inner);
      }
      rawHtml = rawHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
    }

    const resultHtml = sanitizeHtmlString(rawHtml);
    const resultCss = sanitizeCssString(rawCss);

    logCssDiagnostics(rawInputStr, resultHtml, resultCss);

    return {
      html: resultHtml,
      css: resultCss,
    };
  }

  if (typeof input !== "string") {
    return { html: String(input), css: "" };
  }

  let text = input.trim();
  if (!text) {
    return { html: "", css: "" };
  }

  // 2. Strip outer wrapper fences if the whole payload is enclosed in a single ```json or ``` code block
  const outerWrapperMatch = text.match(/^```(?:json|html|xml|css|text)?\s*([\s\S]*?)\s*```$/i);
  if (outerWrapperMatch && outerWrapperMatch[1]) {
    const unwrapped = outerWrapperMatch[1].trim();
    if (unwrapped.startsWith("{") || unwrapped.includes("```html") || unwrapped.includes("```css")) {
      text = unwrapped;
    }
  }

  // 3. Strategy: Check for separate ```html and ```css blocks (the primary recommended format)
  // Use non-greedy and boundary-flexible matching to handle unclosed fences or surrounding text
  const htmlBlockMatch = text.match(/```(?:html|xml)\s*([\s\S]*?)(?:```|$)/i);
  const cssBlockMatch = text.match(/```css\s*([\s\S]*?)(?:```|$)/i);

  if (htmlBlockMatch || cssBlockMatch) {
    let extractedHtml = htmlBlockMatch ? htmlBlockMatch[1]?.trim() || "" : "";
    let extractedCss = cssBlockMatch ? cssBlockMatch[1]?.trim() || "" : "";

    // If CSS block wasn't fenced with ```css, look for labeled sections like "CSS:\n..."
    if (!extractedCss) {
      const labeledCssMatch = text.match(/(?:^|\n)(?:CSS|Styles?):\s*(?:```css)?\s*([\s\S]*?)(?:```|$)/i);
      if (labeledCssMatch && labeledCssMatch[1]) {
        extractedCss = labeledCssMatch[1].trim();
      }
    }

    // Extract any inline <style> tags inside the HTML block
    const styleMatches = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
      for (const s of styleMatches) {
        const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
        if (inner) extractedCss = (extractedCss ? extractedCss + "\n" + inner : inner);
      }
      extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
    }

    if (extractedHtml || extractedCss) {
      const resultHtml = sanitizeHtmlString(extractedHtml);
      const resultCss = sanitizeCssString(extractedCss);

      logCssDiagnostics(text, resultHtml, resultCss);

      return {
        html: resultHtml,
        css: resultCss,
      };
    }
  }

  // 4. Strategy: Check for labeled sections without markdown fences: "HTML:\n...\nCSS:\n..."
  const labeledHtmlMatch = text.match(/(?:^|\n)HTML:\s*([\s\S]*?)(?=(?:\nCSS:|\nStyles?:|$))/i);
  const labeledCssMatch = text.match(/(?:^|\n)(?:CSS|Styles?):\s*([\s\S]*?)$/i);
  if (labeledHtmlMatch && labeledHtmlMatch[1]) {
    let extractedHtml = labeledHtmlMatch[1].trim();
    let extractedCss = labeledCssMatch && labeledCssMatch[1] ? labeledCssMatch[1].trim() : "";

    const styleMatches = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
      for (const s of styleMatches) {
        const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
        if (inner) extractedCss = (extractedCss ? extractedCss + "\n" + inner : inner);
      }
      extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
    }

    const resultHtml = sanitizeHtmlString(extractedHtml);
    const resultCss = sanitizeCssString(extractedCss);

    logCssDiagnostics(text, resultHtml, resultCss);

    return {
      html: resultHtml,
      css: resultCss,
    };
  }

  // 5. Strategy: JSON parsing
  const looksLikeJson =
    text.startsWith("{") ||
    /^\s*"?(?:html|css)"?\s*:/i.test(text) ||
    /"html"\s*:\s*"/i.test(text);

  if (looksLikeJson) {
    // Strategy 5A: Direct JSON.parse
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        let extractedHtml = typeof parsed.html === "string" ? parsed.html : "";
        let extractedCss = typeof parsed.css === "string" ? parsed.css : "";

        if (extractedHtml.trim().startsWith("{") || extractedHtml.trim().startsWith("```")) {
          const inner = normalizeAIHtmlResponse(extractedHtml);
          extractedHtml = inner.html;
          if (!extractedCss && inner.css) extractedCss = inner.css;
        }

        const styleMatches = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (styleMatches) {
          for (const s of styleMatches) {
            const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
            if (inner) extractedCss = (extractedCss ? extractedCss + "\n" + inner : inner);
          }
          extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
        }

        const resultHtml = sanitizeHtmlString(extractedHtml);
        const resultCss = sanitizeCssString(extractedCss);

        logCssDiagnostics(text, resultHtml, resultCss);

        return {
          html: resultHtml,
          css: resultCss,
        };
      }
    } catch {
      // Continue to 5B
    }

    // Strategy 5B: JSON with unescaped control characters
    try {
      const sanitizedControlChars = text.replace(/[\u0000-\u001F]+/g, (m) =>
        m === "\n" ? "\\n" : m === "\r" ? "\\r" : m === "\t" ? "\\t" : ""
      );
      const parsed = JSON.parse(sanitizedControlChars);
      if (parsed && typeof parsed === "object") {
        let extractedHtml = parsed.html || "";
        let extractedCss = parsed.css || "";

        const styleMatches = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (styleMatches) {
          for (const s of styleMatches) {
            const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
            if (inner) extractedCss = (extractedCss ? extractedCss + "\n" + inner : inner);
          }
          extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
        }

        const resultHtml = sanitizeHtmlString(extractedHtml);
        const resultCss = sanitizeCssString(extractedCss);

        logCssDiagnostics(text, resultHtml, resultCss);

        return {
          html: resultHtml,
          css: resultCss,
        };
      }
    } catch {
      // Continue to 5C
    }

    // Strategy 5C: Extract JSON substring between { and }
    const jsonSubMatch = text.match(/\{[\s\S]*"html"[\s\S]*\}/);
    if (jsonSubMatch) {
      try {
        const parsed = JSON.parse(jsonSubMatch[0]);
        if (parsed && (typeof parsed.html === "string" || typeof parsed.css === "string")) {
          let extractedHtml = parsed.html || "";
          let extractedCss = parsed.css || "";

          const styleMatches = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
          if (styleMatches) {
            for (const s of styleMatches) {
              const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
              if (inner) extractedCss = (extractedCss ? extractedCss + "\n" + inner : inner);
            }
            extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
          }

          const resultHtml = sanitizeHtmlString(extractedHtml);
          const resultCss = sanitizeCssString(extractedCss);

          logCssDiagnostics(text, resultHtml, resultCss);

          return {
            html: resultHtml,
            css: resultCss,
          };
        }
      } catch {
        try {
          const sanitized = jsonSubMatch[0].replace(/[\u0000-\u001F]+/g, (m) =>
            m === "\n" ? "\\n" : m === "\r" ? "\\r" : m === "\t" ? "\\t" : ""
          );
          const parsed = JSON.parse(sanitized);
          if (parsed && (typeof parsed.html === "string" || typeof parsed.css === "string")) {
            let extractedHtml = parsed.html || "";
            let extractedCss = parsed.css || "";

            const styleMatches = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
            if (styleMatches) {
              for (const s of styleMatches) {
                const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
                if (inner) extractedCss = (extractedCss ? extractedCss + "\n" + inner : inner);
              }
              extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
            }

            const resultHtml = sanitizeHtmlString(extractedHtml);
            const resultCss = sanitizeCssString(extractedCss);

            logCssDiagnostics(text, resultHtml, resultCss);

            return {
              html: resultHtml,
              css: resultCss,
            };
          }
        } catch {
          // Continue to 5D
        }
      }
    }

    // Strategy 5D: Robust field extractor for malformed/truncated JSON
    const extractedFromFields = extractFieldsFromMalformedJson(text);
    if (extractedFromFields.html || extractedFromFields.css) {
      let extractedHtml = extractedFromFields.html;
      let extractedCss = extractedFromFields.css;

      const styleMatches = extractedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleMatches) {
        for (const s of styleMatches) {
          const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
          if (inner) extractedCss = (extractedCss ? extractedCss + "\n" + inner : inner);
        }
        extractedHtml = extractedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
      }

      const resultHtml = sanitizeHtmlString(extractedHtml);
      const resultCss = sanitizeCssString(extractedCss);

      logCssDiagnostics(text, resultHtml, resultCss);

      return {
        html: resultHtml,
        css: resultCss,
      };
    }
  }

  // 6. Strategy: If string is pure HTML (not JSON) with embedded <style>
  const styleMatches = text.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  let cssFromStyle = "";
  let htmlWithoutStyle = text;

  if (styleMatches) {
    for (const s of styleMatches) {
      const inner = s.replace(/<\/?style[^>]*>/gi, "").trim();
      if (inner) cssFromStyle = (cssFromStyle ? cssFromStyle + "\n" + inner : inner);
    }
    htmlWithoutStyle = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
  }

  htmlWithoutStyle = htmlWithoutStyle
    .replace(/```[a-z]*\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // If after stripping, htmlWithoutStyle is actually a JSON wrapper, unwrap it
  if (htmlWithoutStyle.startsWith("{") && /"html"\s*:/i.test(htmlWithoutStyle)) {
    return normalizeAIHtmlResponse(htmlWithoutStyle);
  }

  const resultHtml = sanitizeHtmlString(htmlWithoutStyle);
  const resultCss = sanitizeCssString(cssFromStyle);

  logCssDiagnostics(text, resultHtml, resultCss);

  return {
    html: resultHtml,
    css: resultCss,
  };
}

/**
 * Resilient multi-strategy parser to extract HTML and CSS from LLM/VLM text output.
 */
export function parseHtmlCssFromText(
  rawText: string,
  width?: number,
  height?: number
): { html: string; css: string } {
  return normalizeAIHtmlResponse(rawText, width, height);
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

