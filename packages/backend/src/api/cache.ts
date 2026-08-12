/**
 * DesignForge AI — Cache Management API
 *
 * POST /api/cache/clear
 * Clears the local filesystem cache.
 */

import { Router } from "express";
import { clearCache } from "../services/cache/local-cache.js";
import type { Request, Response, NextFunction } from "express";

export const cacheRouter: Router = Router();

/**
 * POST /api/cache/clear
 */
cacheRouter.post(
  "/cache/clear",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("[Cache API] Clearing local cache...");
      const clearedCount = await clearCache();

      res.json({
        success: true,
        message: `Successfully cleared ${clearedCount} cached screens.`,
        clearedCount,
      });
    } catch (err) {
      next(err);
    }
  }
);
