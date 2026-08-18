/**
 * DesignForge AI — Local Cache Service
 *
 * Caches layout analysis JSON payloads locally in backend filesystem.
 * Uses a SHA-256 hash of the screenshot buffer.
 *
 * v5: Migrated to Visual JSON pipeline (Screenshot → JSON → Deterministic HTML/CSS)
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import type { DesignAnalysis } from "@designforge/shared";
import { config } from "../../config/index.js";
import { VISUAL_SCHEMA_VERSION, GENERATOR_VERSION } from "../vision/VisualSchema.js";

const CACHE_DIR = path.resolve(process.cwd(), ".cache");

export const SCREENSHOT_HTML_PROMPT_VERSION = "v7";
export const SCREENSHOT_HTML_PIPELINE_VERSION = "v7";

/**
 * Computes a SHA-256 hash of a buffer.
 */
export function computeImageHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Computes a compound SHA-256 cache key including image hash, provider, model, prompt version, and pipeline version.
 */
export function computeCacheKey(
  imageHash: string,
  provider: string,
  model: string
): string {
  const rawKey = `${imageHash}:${provider}:${model}:${SCREENSHOT_HTML_PROMPT_VERSION}:${SCREENSHOT_HTML_PIPELINE_VERSION}:${VISUAL_SCHEMA_VERSION}:${GENERATOR_VERSION}`;
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Ensures cache directory exists.
 */
async function ensureCacheDirExists(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.error("[Cache] Failed to create cache directory:", err);
  }
}

/**
 * Gets cached layout analysis by image hash.
 */
export async function getCachedAnalysis(hash: string): Promise<DesignAnalysis | null> {
  await ensureCacheDirExists();
  const filePath = path.join(CACHE_DIR, `${hash}.json`);

  try {
    const data = await fs.readFile(filePath, "utf-8");
    console.log(`[Cache] Cache HIT for hash ${hash.substring(0, 8)}`);
    return JSON.parse(data);
  } catch {
    return null; // Cache miss
  }
}

export interface GetCacheOptions {
  cacheKey: string;
  imageHash: string;
  provider: string;
  model: string;
  forceRegenerate?: boolean;
}

/**
 * Gets cached HTML/CSS response by compound key and options.
 */
export async function getCachedHtml(
  options: GetCacheOptions
): Promise<any | null> {
  const { cacheKey, imageHash, provider, model, forceRegenerate } = options;

  console.log(`[Cache]`);
  console.log(`Image Hash:       ${imageHash.substring(0, 8)}`);
  console.log(`Provider:         ${provider}`);
  console.log(`Model:            ${model}`);
  console.log(`Pipeline Version: ${SCREENSHOT_HTML_PIPELINE_VERSION}`);
  console.log(`Prompt Version:   ${SCREENSHOT_HTML_PROMPT_VERSION}`);
  console.log(`Cache Enabled:    ${config.AI_CACHE_ENABLED}`);
  console.log(`Force Regenerate: ${!!forceRegenerate}`);

  if (!config.AI_CACHE_ENABLED || forceRegenerate) {
    console.log(`Result:           MISS (Cache ${!config.AI_CACHE_ENABLED ? "disabled" : "forced refresh"})`);
    return null;
  }

  await ensureCacheDirExists();
  const filePath = path.join(CACHE_DIR, `html_${cacheKey}.json`);

  try {
    const data = await fs.readFile(filePath, "utf-8");
    console.log(`Result:           HIT (${cacheKey.substring(0, 8)})`);
    return JSON.parse(data);
  } catch {
    console.log(`Result:           MISS`);
    return null; // Cache miss
  }
}

/**
 * Writes HTML/CSS response to cache.
 */
export async function setCachedHtml(
  cacheKey: string,
  htmlData: any
): Promise<void> {
  await ensureCacheDirExists();
  const filePath = path.join(CACHE_DIR, `html_${cacheKey}.json`);

  try {
    await fs.writeFile(filePath, JSON.stringify(htmlData, null, 2), "utf-8");
    console.log(`[Cache] Successfully cached HTML/CSS response (${cacheKey.substring(0, 8)})`);
  } catch (err) {
    console.error("[Cache] Failed to write HTML cache file:", err);
  }
}

/**
 * Writes layout analysis response to cache.
 */
export async function setCachedAnalysis(
  hash: string,
  analysis: DesignAnalysis
): Promise<void> {
  await ensureCacheDirExists();
  const filePath = path.join(CACHE_DIR, `${hash}.json`);

  try {
    await fs.writeFile(filePath, JSON.stringify(analysis, null, 2), "utf-8");
    console.log(`[Cache] Successfully cached analysis for hash ${hash.substring(0, 8)}`);
  } catch (err) {
    console.error("[Cache] Failed to write cache file:", err);
  }
}

/**
 * Clears all files inside the cache directory.
 */
export async function clearCache(): Promise<number> {
  await ensureCacheDirExists();
  try {
    const files = await fs.readdir(CACHE_DIR);
    let count = 0;

    for (const file of files) {
      if (file.endsWith(".json")) {
        await fs.unlink(path.join(CACHE_DIR, file));
        count++;
      }
    }

    console.log(`[Cache] Cleared ${count} items from local cache.`);
    return count;
  } catch (err) {
    console.error("[Cache] Failed to clear cache directory:", err);
    return 0;
  }
}
