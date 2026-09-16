#!/usr/bin/env node

/**
 * DesignForge AI — MCP Server CLI Binary
 * Invoked by Antigravity via stdio.
 */

import { runMcpServer } from "../dist/mcp/server.js";

runMcpServer().catch((error) => {
  console.error("[DesignForge MCP Fatal Error]:", error);
  process.exit(1);
});
