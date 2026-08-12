/**
 * DesignForge AI — Gemini JSON Schema for Structured Outputs
 *
 * This converts our Zod schema into the JSON Schema format
 * that the Google Gemini API requires for responseSchema.
 */

import { getAnalysisResponseSchema } from "../services/vision/openrouter-schema.js";

/**
 * Generate the JSON Schema for OpenRouter responseSchema.
 * Returns the OpenRouter-compatible response schema.
 */
export function getAnalysisJsonSchema() {
  return getAnalysisResponseSchema();
}
