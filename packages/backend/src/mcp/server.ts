/**
 * DesignForge AI — Model Context Protocol (MCP) Server
 * Exposes DesignForge AI tools to Antigravity and other MCP-compatible AI agents.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const BACKEND_URL = process.env.DESIGNFORGE_BACKEND_URL || "http://localhost:3001";

/**
 * Dispatches a tool execution request to the local DesignForge backend bridge
 */
async function executeBridgeCommand(type: string, payload: any = {}, timeoutMs: number = 90000): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/bridge/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload, timeoutMs }),
    });

    const result = (await response.json()) as { success: boolean; data?: any; error?: string };

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.data?.error || `HTTP error ${response.status}`);
    }

    return result.data;
  } catch (err: any) {
    if (err.cause?.code === "ECONNREFUSED" || err.message.includes("fetch failed")) {
      throw new Error(
        `Cannot connect to DesignForge backend at ${BACKEND_URL}. Ensure 'pnpm dev:backend' is running.`
      );
    }
    throw err;
  }
}

/**
 * Queries current connectivity status of the backend bridge
 */
async function getBridgeStatus(): Promise<{ connected: boolean; clientCount: number; lastActivity: number }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/bridge/status`);
    const result = (await response.json()) as { success: boolean; data: any };
    return result.data;
  } catch (err: any) {
    return { connected: false, clientCount: 0, lastActivity: 0 };
  }
}

export async function runMcpServer(): Promise<void> {
  const server = new Server(
    {
      name: "designforge-ai",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: "designforge_ping",
        description: "Check the connection status between Antigravity, the DesignForge backend, and the active Figma plugin.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "designforge_convert_url",
        description: "Scrapes a live website URL and renders it directly onto the active Figma canvas with Auto Layout, typography, colors, and images.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The full public URL of the website to convert (e.g., https://shinefoods.in)",
            },
            autoLayout: {
              type: "boolean",
              description: "Whether to generate using modern Figma Auto Layout (default: true).",
              default: true,
            },
            viewport: {
              type: "string",
              description: "Viewport preset to capture ('desktop', 'laptop', 'tablet', or 'mobile').",
              enum: ["desktop", "laptop", "tablet", "mobile"],
              default: "desktop",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "designforge_get_selection",
        description: "Inspects layers currently selected in Figma, returning node names, IDs, types, dimensions, and Auto Layout properties.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "designforge_generate_ai",
        description: "Generates a UI component or page layout in Figma from a natural language prompt (e.g. 'hero section for a modern cafe with brown aesthetic and CTA').",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Detailed description of the UI to generate.",
            },
            autoLayout: {
              type: "boolean",
              description: "Whether to enable Auto Layout (default: true).",
              default: true,
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "designforge_apply_code",
        description: "Renders custom HTML/CSS or a pre-built DesignAnalysis JSON into editable Figma layers in the current document. Pass either 'html' for HTML/CSS rendering, or 'analysisJson' for direct design tree injection (faster, no Playwright required).",
        inputSchema: {
          type: "object",
          properties: {
            html: {
              type: "string",
              description: "HTML markup string to render (optional if analysisJson is provided).",
              default: "",
            },
            css: {
              type: "string",
              description: "CSS stylesheet string to apply alongside html.",
              default: "",
            },
            analysisJson: {
              type: "string",
              description: "Pre-built DesignAnalysis JSON string for direct injection into Figma without any web rendering. Use this for programmatic designs.",
              default: "",
            },
            autoLayout: {
              type: "boolean",
              description: "Whether to enable Auto Layout (default: true).",
              default: true,
            },
          },
          required: [],
        },
      },
      {
        name: "designforge_remove_bg",
        description: "Removes the background from the currently selected image or layer in Figma, replacing it with a clean transparent cutout.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];

    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "designforge_ping": {
          const status = await getBridgeStatus();
          const message = status.connected
            ? `🟢 DesignForge AI Bridge is ONLINE.\n- Connected Figma Plugin Clients: ${status.clientCount}\n- Backend Server: ${BACKEND_URL}\n- Status: Ready to receive design commands.`
            : `🟡 DesignForge Backend is running, but no Figma plugin is currently connected.\n- Backend Server: ${BACKEND_URL}\n- Action required: Open Figma, launch the 'DesignForge AI' plugin, and switch to the '🔌 Agent Bridge' tab.`;
          return { content: [{ type: "text", text: message }] };
        }

        case "designforge_convert_url": {
          const url = String(args?.url || "").trim();
          if (!url) throw new Error("URL is required");
          const autoLayout = args?.autoLayout !== false;
          const viewport = String(args?.viewport || "desktop");

          const data = await executeBridgeCommand("EXECUTE_URL_TO_DESIGN", {
            url,
            autoLayout,
            viewport,
          });

          return {
            content: [
              {
                type: "text",
                text: `✅ **Successfully converted website to Figma design!**\n\n- **URL**: ${url}\n- **Auto Layout**: ${autoLayout ? "ENABLED" : "DISABLED"}\n- **Viewport**: ${viewport}\n- **Created Frame**: ${data?.frameName || "Imported Website"}\n- **Layers Generated**: ${data?.nodeCount || "All"}\n\nThe design is now visible and editable in your active Figma file.`,
              },
            ],
          };
        }

        case "designforge_get_selection": {
          const data = await executeBridgeCommand("GET_CANVAS_SELECTION", {});

          if (!data || !data.selection || data.selection.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "ℹ️ No layers are currently selected in the active Figma document.",
                },
              ],
            };
          }

          const selectionList = data.selection
            .map(
              (node: any, idx: number) =>
                `${idx + 1}. **${node.name}** (Type: \`${node.type}\`, ID: \`${node.id}\`)\n   - Dimensions: ${Math.round(node.width)} × ${Math.round(node.height)}\n   - Auto Layout Mode: \`${node.layoutMode || "NONE"}\`\n   - Sizing: H=\`${node.layoutSizingHorizontal || "FIXED"}\`, V=\`${node.layoutSizingVertical || "FIXED"}\`\n   - Children Count: ${node.childrenCount || 0}`
            )
            .join("\n\n");

          return {
            content: [
              {
                type: "text",
                text: `📋 **Current Figma Selection (${data.selection.length} layer${data.selection.length > 1 ? "s" : ""}):**\n\n${selectionList}`,
              },
            ],
          };
        }

        case "designforge_generate_ai": {
          const prompt = String(args?.prompt || "").trim();
          if (!prompt) throw new Error("Prompt is required");
          const autoLayout = args?.autoLayout !== false;

          const data = await executeBridgeCommand("EXECUTE_AI_PROMPT", {
            prompt,
            autoLayout,
          });

          return {
            content: [
              {
                type: "text",
                text: `✨ **AI Design Generated Successfully in Figma!**\n\n- **Prompt**: "${prompt}"\n- **Created Frame**: ${data?.frameName || "Generated Component"}\n- **Auto Layout**: ${autoLayout ? "ENABLED" : "DISABLED"}`,
              },
            ],
          };
        }

        case "designforge_apply_code": {
          const html = String(args?.html || "").trim();
          const css = String(args?.css || "").trim();
          const analysisJson = String(args?.analysisJson || "").trim();
          const autoLayout = args?.autoLayout !== false;

          if (!html && !analysisJson) throw new Error("Either 'html' or 'analysisJson' is required.");

          const data = await executeBridgeCommand("EXECUTE_HTML_CSS", { html, css, analysisJson, autoLayout });

          return {
            content: [
              {
                type: "text",
                text: `🎨 **Design Applied in Figma!**\n\n- **Frame Name**: ${data?.frameName || "Custom Code Frame"}\n- **Nodes Created**: ${data?.nodesCreated || "All layers"}\n- **Status**: Design is now visible and editable in Figma.`,
              },
            ],
          };
        }

        case "designforge_remove_bg": {
          const data = await executeBridgeCommand("REMOVE_BACKGROUND", {});

          return {
            content: [
              {
                type: "text",
                text: `✂️ **Background Removed!**\n\n- **Target Layer**: ${data?.nodeName || "Selected Layer"}\n- **Status**: Background successfully removed and applied directly to the layer in Figma.`,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `❌ Error executing ${name}: ${err.message}`,
          },
        ],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[DesignForge MCP] Server running on stdio");
}
