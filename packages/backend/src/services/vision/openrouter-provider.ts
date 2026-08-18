import { config as appConfig } from "../../config/index.js";

export interface GenerateContentOptions {
  model: string;
  contents: any;
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    temperature?: number;
    maxTokens?: number;
  };
}

export class OpenRouterVisionProvider {
  public apiKey: string;
  public baseUrl = "https://openrouter.ai/api/v1";

  public models = {
    generateContent: async (options: GenerateContentOptions) => {
      const url = `${this.baseUrl}/chat/completions`;
      const { model, contents, config: sdkConfig } = options;

      const headers: Record<string, string> = {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "DesignForge AI",
      };

      const messages: any[] = [];

      // Add system instruction if present
      if (sdkConfig?.systemInstruction) {
        messages.push({
          role: "system",
          content: sdkConfig.systemInstruction,
        });
      }

      // Parse contents
      const userParts: any[] = [];
      if (typeof contents === "string") {
        userParts.push({
          type: "text",
          text: contents,
        });
      } else if (Array.isArray(contents)) {
        for (const part of contents) {
          if (typeof part === "string") {
            userParts.push({
              type: "text",
              text: part,
            });
          } else if (part && typeof part === "object") {
            if (part.inlineData) {
              userParts.push({
                type: "image_url",
                image_url: {
                  url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                },
              });
            } else if (part.text) {
              userParts.push({
                type: "text",
                text: part.text,
              });
            }
          }
        }
      }

      messages.push({
        role: "user",
        content: userParts,
      });

      const maxTokens = Number(
        sdkConfig?.maxTokens ||
        process.env.OPENROUTER_VISION_MAX_TOKENS ||
        (appConfig as any).OPENROUTER_VISION_MAX_TOKENS ||
        appConfig.OPENROUTER_MAX_TOKENS ||
        2800
      );

      const payload: any = {
        model,
        messages,
        temperature: sdkConfig?.temperature ?? 0.1,
        max_tokens: maxTokens,
      };

      if (sdkConfig?.responseMimeType === "application/json") {
        if (sdkConfig.responseSchema) {
          payload.response_format = {
            type: "json_schema",
            json_schema: {
              name: "DesignAnalysis",
              strict: false,
              schema: sdkConfig.responseSchema,
            }
          };
        } else {
          payload.response_format = {
            type: "json_object"
          };
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }

        const status = response.status;
        const errorMsg = typeof errorBody === "object" ? (errorBody.error?.message || JSON.stringify(errorBody)) : errorBody;

        let parsedError = `OpenRouter API request failed with status ${status}: ${errorMsg}`;
        if (status === 401) {
          parsedError = `Unauthorized: Invalid or missing OpenRouter API key.`;
        } else if (status === 404) {
          parsedError = `Not Found: Configured model "${model}" is not found or unsupported on OpenRouter.`;
        } else if (status === 429) {
          parsedError = `Rate Limit / Quota Exceeded: Your OpenRouter account is rate limited or out of credits.`;
        } else if (status >= 500) {
          parsedError = `OpenRouter Server Error: The upstream OpenRouter service returned status ${status}.`;
        }

        const errObj: any = new Error(parsedError);
        errObj.status = status;
        errObj.error = errorBody;
        errObj.url = url;
        throw errObj;
      }

      const data = (await response.json()) as any;
      const contentText = data.choices?.[0]?.message?.content || "";
      return {
        text: contentText,
        choices: data.choices,
        usage: data.usage,
      };
    },

    list: async () => {
      const url = `${this.baseUrl}/models`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list OpenRouter models: status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const models = (data.data || []).map((m: any) => ({
        name: m.id,
        displayName: m.name,
        description: m.description,
      }));

      return {
        models,
        pageInternal: models,
      };
    }
  };

  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }
}
