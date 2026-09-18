/**
 * DesignForge AI — WebSocket Bridge Hub
 * Coordinates communication between the MCP server and active Figma plugin sessions.
 */

import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import type { Server as HttpServer } from "http";

export interface BridgeCommand {
  id: string;
  type: "PING" | "EXECUTE_URL_TO_DESIGN" | "GET_CANVAS_SELECTION" | "EXECUTE_AI_PROMPT" | "EXECUTE_HTML_CSS" | "REMOVE_BACKGROUND" | "RECOLOR_THEME";
  payload?: any;
  timestamp: number;
}

export interface BridgeResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

interface PendingRequest {
  id: string;
  resolve: (response: BridgeResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class BridgeHub {
  private static instance: BridgeHub;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private lastActivityTime: number = Date.now();

  private constructor() {}

  public static getInstance(): BridgeHub {
    if (!BridgeHub.instance) {
      BridgeHub.instance = new BridgeHub();
    }
    return BridgeHub.instance;
  }

  /**
   * Attaches WebSocketServer to the given HTTP server instance
   */
  public attach(server: HttpServer): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({ server, path: "/bridge" });

    this.wss.on("connection", (ws: WebSocket) => {
      this.clients.add(ws);
      this.lastActivityTime = Date.now();
      console.log(`[BridgeHub] Figma plugin client connected (total: ${this.clients.size})`);

      // Greet the newly connected plugin
      ws.send(
        JSON.stringify({
          type: "BRIDGE_WELCOME",
          payload: {
            message: "Connected to DesignForge AI Agent Bridge Hub",
            timestamp: Date.now(),
          },
        })
      );

      ws.on("message", (raw: string) => {
        try {
          const message = JSON.parse(raw.toString());
          this.handleIncomingMessage(message);
        } catch (err) {
          console.error("[BridgeHub] Failed to parse message from plugin:", err);
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`[BridgeHub] Figma plugin client disconnected (remaining: ${this.clients.size})`);
      });

      ws.on("error", (err) => {
        console.warn("[BridgeHub] Client connection error:", err);
        this.clients.delete(ws);
      });
    });

    console.log("[BridgeHub] WebSocket bridge endpoint initialized at ws://localhost:3001/bridge");
  }

  /**
   * Status check helper
   */
  public getStatus(): { connected: boolean; clientCount: number; lastActivity: number } {
    return {
      connected: this.clients.size > 0,
      clientCount: this.clients.size,
      lastActivity: this.lastActivityTime,
    };
  }

  /**
   * Dispatches a command to connected Figma plugin client(s) and waits for response
   */
  public async sendCommand(
    type: BridgeCommand["type"],
    payload: any = {},
    timeoutMs: number = 60000
  ): Promise<BridgeResponse> {
    if (this.clients.size === 0) {
      throw new Error(
        "No active Figma plugin connected. Please open the 'DesignForge AI' plugin in Figma and switch to the '🔌 Agent Bridge' tab."
      );
    }

    const id = uuidv4();
    const command: BridgeCommand = {
      id,
      type,
      payload,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new Error(
            `Figma command timed out after ${timeoutMs / 1000}s. Ensure the plugin remains open and active in Figma.`
          )
        );
      }, timeoutMs);

      this.pendingRequests.set(id, { id, resolve, reject, timeout });

      const messageStr = JSON.stringify(command);
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      }
    });
  }

  private handleIncomingMessage(message: any): void {
    this.lastActivityTime = Date.now();

    // Check if this is a response to a pending request
    if (message.id && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.id);

      const response: BridgeResponse = {
        id: message.id,
        success: message.success !== false,
        data: message.data,
        error: message.error,
        timestamp: Date.now(),
      };

      pending.resolve(response);
      return;
    }

    // Otherwise it's a heartbeat/ping from the plugin
    if (message.type === "PLUGIN_PING") {
      // respond with pong
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "BRIDGE_PONG",
              payload: { timestamp: Date.now() },
            })
          );
        }
      }
    }
  }
}
