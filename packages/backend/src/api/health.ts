/**
 * DesignForge AI — Health Check Endpoint
 */

import { Router } from "express";
import { config } from "../config/index.js";

export const healthRouter: Router = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    version: "0.1.0",
    environment: config.NODE_ENV,
    model: config.OPENROUTER_MODEL,
    timestamp: new Date().toISOString(),
    services: {
      openrouter: !!config.OPENROUTER_API_KEY,
    },
  });
});
