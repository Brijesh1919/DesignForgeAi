/**
 * DesignForge AI — Express Server Entry Point
 */

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { OpenRouterVisionProvider } from "./services/vision/openrouter-provider.js";
import { config } from "./config/index.js";
import { analyzeRouter } from "./api/analyze.js";
import { assetsRouter } from "./api/assets.js";
import { healthRouter } from "./api/health.js";
import { cacheRouter } from "./api/cache.js";
import { debugRouter } from "./api/debug.js";
import { errorHandler } from "./middleware/error-handler.js";

const app: Express = express();

// ─── Middleware ───────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: config.CORS_ORIGINS === "*" ? "*" : config.CORS_ORIGINS.split(","),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Gemini-Model", "X-Debug-Mode"],
    maxAge: 86400,
  })
);

app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  express.json({
    limit: `${config.MAX_IMAGE_SIZE_MB + 2}mb`,
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: `${config.MAX_IMAGE_SIZE_MB + 2}mb`,
  })
);

// ─── Routes ──────────────────────────────────────────────────

app.use("/api", healthRouter);
app.use("/api", analyzeRouter);
app.use("/api", assetsRouter);
app.use("/api", cacheRouter);
app.use("/api", debugRouter);

// ─── Error Handler (must be last) ────────────────────────────

app.use(errorHandler);

function getSDKVersion(): string {
  return "1.0.0 (OpenRouter)";
}

// ─── Start Server ────────────────────────────────────────────

app.listen(config.PORT, async () => {
  const sdkVersion = getSDKVersion();
  const backendUrl = `http://localhost:${config.PORT}`;
  const isOllama = config.AI_PROVIDER === "ollama";

  console.log("");
  console.log("  ╔═══════════════════════════════════════════════════════════╗");
  console.log("  ║                 DesignForge AI — Backend                  ║");
  console.log("  ╠═══════════════════════════════════════════════════════════╣");
  console.log(`  ║  🚀 Server URL:       ${backendUrl.padEnd(35)} ║`);
  console.log(`  ║  📦 Environment:      ${config.NODE_ENV.padEnd(35)} ║`);
  console.log(`  ║  🔌 Provider:         ${config.AI_PROVIDER.padEnd(35)} ║`);
  if (isOllama) {
    console.log(`  ║  🤖 Ollama Model:     ${config.OLLAMA_MODEL.padEnd(35)} ║`);
    console.log(`  ║  🌐 Ollama Endpoint:  ${config.OLLAMA_BASE_URL.padEnd(35)} ║`);
  } else {
    const apiKeyStatus = config.OPENROUTER_API_KEY ? "CONFIGURED (hidden)" : "MISSING";
    console.log(`  ║  🤖 OpenRouter Model: ${config.OPENROUTER_MODEL.padEnd(35)} ║`);
    console.log(`  ║  🔑 API Key Status:   ${apiKeyStatus.padEnd(35)} ║`);
    console.log(`  ║  📦 SDK Version:      ${sdkVersion.padEnd(35)} ║`);
  }
  console.log("  ╚═══════════════════════════════════════════════════════════╝");
  console.log("");

  if (isOllama) {
    console.log(`[Startup] Local Ollama backend configured. Verification skipped.`);
    return;
  }

  console.log("[Startup] Performing OpenRouter model validation...");
  try {
    const client = new OpenRouterVisionProvider({ apiKey: config.OPENROUTER_API_KEY || "" });
    const response: any = await client.models.list();
    const rawList = response.models || response.pageInternal || [];
    const availableModels = rawList.map((m: any) => m.name);

    if (availableModels.includes(config.OPENROUTER_MODEL)) {
      console.log(`[Startup] ✓ OpenRouter model "${config.OPENROUTER_MODEL}" found`);
    } else {
      console.error(`[Startup] ✗ Model "${config.OPENROUTER_MODEL}" not found in available models list.`);
      console.error("[Startup] CRITICAL: Startup validation failed. Terminating process.");
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`[Startup] ✗ Model validation failed to connect to OpenRouter API: ${err.message}`);
    console.error("[Startup] CRITICAL: Startup validation failed. Terminating process.");
    process.exit(1);
  }
});

export default app;
