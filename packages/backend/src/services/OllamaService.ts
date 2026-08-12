/**
 * DesignForge AI — Ollama Local Vision Service
 *
 * Calls local Ollama vision API (/api/chat) with 5-minute timeout.
 */

import { config } from "../config/index.js";
import { AIServiceError } from "../middleware/error-handler.js";

interface GenerateOllamaOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  width: number;
  height: number;
  format?: string;
}

export class OllamaService {
  /**
   * Generates content using a local Ollama vision model.
   */
  static async generateContent(options: GenerateOllamaOptions): Promise<string> {
    const { systemPrompt, userPrompt, imageBase64, width, height } = options;
    const model = options.model || config.OLLAMA_MODEL;
    const baseUrl = config.OLLAMA_BASE_URL;

    // Strip data-URI prefix if present in the base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    console.log(`[Ollama Vision]`);
    console.log(`Model:            ${model}`);
    console.log(`Context:          16384`);
    console.log(`Image dimensions: ${width}x${height}`);
    console.log(`Request started:  ${new Date().toISOString()}`);

    const startTime = Date.now();
    const controller = new AbortController();
    // 5 minutes timeout = 300,000 ms
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 300000);

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
              images: [cleanBase64],
            },
          ],
          stream: false,
          ...(options.format ? { format: options.format } : {}),
          options: {
            temperature: 0.1,
            num_ctx: 16384,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const endTime = Date.now();
      const elapsed = ((endTime - startTime) / 1000).toFixed(1);
      console.log(`Request completed: ${new Date().toISOString()}`);
      console.log(`Generation time:  ${elapsed}s`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama HTTP Error ${response.status}: ${errorText}`);
      }

      const responseBody = (await response.json()) as any;
      const responseText = responseBody.message?.content || "";

      return responseText;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        console.error(`❌ [Ollama Vision] Request timed out after 5 minutes`);
        throw new AIServiceError("Ollama request timed out after 5 minutes.", {
          model,
          timeout: true,
        });
      }
      console.error(`❌ [Ollama Vision] Request failed: ${err.message}`);
      throw new AIServiceError(`Ollama local vision request failed: ${err.message}`, {
        cause: err.message,
        model,
      });
    }
  }
}
