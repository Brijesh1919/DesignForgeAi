/**
 * DesignForge AI — Backend Configuration
 *
 * Validates and exports all environment variables
 * using Zod for type-safe configuration.
 */

import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // OpenRouter
  AI_PROVIDER: z.string().default("ollama"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("google/gemini-2.5-flash"),

  // Ollama
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("qwen2.5vl:3b"),

  // Plugin & Cache
  AI_CACHE_ENABLED: z.coerce.boolean().default(false),
  CORS_ORIGINS: z.string().default("*"),
  MAX_IMAGE_SIZE_MB: z.coerce.number().default(10),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of parsed.error.issues) {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}

export const config = loadConfig();

export type Config = z.infer<typeof envSchema>;
