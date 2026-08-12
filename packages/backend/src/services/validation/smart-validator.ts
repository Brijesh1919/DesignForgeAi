/**
 * DesignForge AI — Smart JSON Validation and Auto-Repair
 *
 * Validates layout JSON against the shared Zod schema.
 * If validation fails or JSON is malformed, uses Gemini to perform
 * targeted repair before falling back to full screenshot re-analysis.
 */

import { DesignAnalysisSchema } from "@designforge/shared";
import type { DesignAnalysis } from "@designforge/shared";
import { OpenRouterVisionProvider } from "../vision/openrouter-provider.js";


interface RepairOptions {
  client: OpenRouterVisionProvider;
  modelName: string;
  rawText: string;
  validationError: string;
}

/**
 * Attempts to repair malformed JSON using a fast, low-temperature prompt.
 */
async function repairJsonWithAI(options: RepairOptions): Promise<string> {
  const { client, modelName, rawText, validationError } = options;

  console.log(`[Validation] Initiating OpenRouter auto-repair for JSON...`);

  const prompt = `The JSON layout structure you returned is invalid or has schema validation errors.

ValidationError:
${validationError}

Raw Response Content to Fix:
${rawText}

Task:
Fix the syntax errors, unescaped quotes, or schema mismatch issues.
Output ONLY the valid, complete JSON.
No markdown codeblocks (e.g. do NOT write \`\`\`json), no preamble, no explanations. Just pure JSON.`;

  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.1, // Strict layout repair
      responseMimeType: "application/json",
    },
  });

  return response.text || "";
}

/**
 * Validates the LLM JSON output.
 * If invalid, triggers a targeted repair request.
 */
export async function smartValidate(
  rawText: string,
  client: OpenRouterVisionProvider,
  modelName: string
): Promise<DesignAnalysis> {
  let parsed: any;
  let validationError = "";

  // 1. Try parsing JSON
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    validationError = `JSON Parse Error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 2. Validate against Zod schema
  if (!validationError) {
    const result = DesignAnalysisSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    } else {
      validationError = result.error.errors
        .map((e) => `- ${e.path.join(".")}: ${e.message}`)
        .join("\n");
    }
  }

  console.warn(`[Validation] JSON is invalid. Errors:\n${validationError}`);

  // 3. Trigger targeted repair
  try {
    const repairedText = await repairJsonWithAI({
      client,
      modelName,
      rawText,
      validationError,
    });

    const repairedParsed = JSON.parse(repairedText);
    const repairedResult = DesignAnalysisSchema.safeParse(repairedParsed);

    if (repairedResult.success) {
      console.log(`[Validation] JSON successfully repaired by AI.`);
      return repairedResult.data;
    } else {
      throw new Error(
        `AI repair failed validation:\n${repairedResult.error.errors.map((e) => e.message).join("\n")}`
      );
    }
  } catch (repairErr) {
    console.error(`[Validation] Repair failed:`, repairErr);
    throw repairErr; // Fall back to re-running the full analysis pipeline
  }
}
