import { Router } from "express";
import { OpenRouterVisionProvider } from "../services/vision/openrouter-provider.js";
import { config } from "../config/index.js";

function getSDKVersion(): string {
  return "1.0.0 (OpenRouter)";
}

export const debugRouter: Router = Router();

// Expose on both paths for backward compatibility with plugin UI
const debugHandler = async (_req: any, res: any) => {
  const sdkVersion = getSDKVersion();
  const configuredModel = config.OPENROUTER_MODEL;
  
  let availableModels: string[] = [];
  let apiReachable = false;
  let modelExists = false;

  try {
    const client = new OpenRouterVisionProvider({ apiKey: config.OPENROUTER_API_KEY || "" });
    const response: any = await client.models.list();
    const rawList = response.models || response.pageInternal || [];
    availableModels = rawList.map((m: any) => m.name);
    apiReachable = true;
    modelExists = availableModels.includes(configuredModel);
  } catch (err) {
    console.error(`[Debug API] Failed to reach OpenRouter API:`, err);
  }

  res.json({
    sdkVersion,
    configuredModel,
    availableModels,
    modelExists,
    apiReachable,
    environment: config.NODE_ENV
  });
};

debugRouter.get("/debug/gemini", debugHandler);
debugRouter.get("/debug/openrouter", debugHandler);

