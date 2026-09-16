/**
 * DesignForge AI — Bridge REST API
 * Exposes bridge status and command execution endpoints for the MCP server.
 */

import { Router, Request, Response } from "express";
import { BridgeHub } from "../services/bridge/bridge-hub.js";

export const bridgeRouter: Router = Router();
const bridgeHub = BridgeHub.getInstance();

/**
 * GET /api/bridge/status
 * Returns current connectivity status of the Figma plugin bridge
 */
bridgeRouter.get("/status", (_req: Request, res: Response) => {
  const status = bridgeHub.getStatus();
  res.json({
    success: true,
    data: status,
  });
});

/**
 * POST /api/bridge/execute
 * Executes a tool command on the active Figma canvas via WebSocket
 */
bridgeRouter.post("/execute", async (req: Request, res: Response) => {
  try {
    const { type, payload, timeoutMs } = req.body;

    if (!type) {
      res.status(400).json({
        success: false,
        error: "Missing required command 'type'",
      });
      return;
    }

    const response = await bridgeHub.sendCommand(type, payload, timeoutMs || 60000);

    res.json({
      success: response.success,
      data: response.data,
      error: response.error,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to execute bridge command",
    });
  }
});
