/**
 * DesignForge AI — Plugin Shared Types
 *
 * Types shared between the Plugin UI (React iframe)
 * and the Plugin Sandbox (Figma API).
 */

// ─── Processing Stages ──────────────────────────────────────

export type ProcessingStage =
  | "idle"
  | "uploading"
  | "analyzing"
  | "reading-text"
  | "extracting-colors"
  | "detecting-components"
  | "building-layout"
  | "creating-nodes"
  | "generating-styles"
  | "inserting-images"
  | "finalizing"
  | "complete"
  | "error";

// ─── Settings ────────────────────────────────────────────────

export interface GenerationOptions {
  createAutoLayout: boolean;
  createComponents: boolean;
  createVariables: boolean;
  createPaintStyles: boolean;
  createTextStyles: boolean;
  generateConstraints: boolean;
  preserveAbsolutePosition: boolean;
  optimizeLayerNames: boolean;
}

export interface PluginSettings extends GenerationOptions {
  backendUrl: string;
  apiKey: string;
  geminiModel: string;
  theme: "dark" | "light" | "system";
  qualityMode: "fast" | "balanced" | "ultra";
  debugMode: boolean;

  // New Developer Options
  showDOMTree: boolean;
  showDesignTokens: boolean;
  showComponentTree: boolean;
  showSceneGraph: boolean;

  viewportPreset: "1440x900" | "1920x1080" | "1024x768" | "768x1024" | "389x844";
  aiProvider?: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  backendUrl: "http://localhost:3001",
  apiKey: "",
  geminiModel: "qwen2.5vl:3b", // Set qwen2.5vl:3b as default model
  theme: "dark",
  qualityMode: "balanced",
  debugMode: false,
  viewportPreset: "1440x900",

  // New Advanced Options Defaults (must be UNCHECKED by default)
  createAutoLayout: false,
  createComponents: false,
  createVariables: false,
  createPaintStyles: false,
  createTextStyles: false,
  generateConstraints: false,
  preserveAbsolutePosition: true,
  optimizeLayerNames: false,

  // New Developer Options Defaults
  showDOMTree: false,
  showDesignTokens: false,
  showComponentTree: false,
  showSceneGraph: false,

  aiProvider: "ollama",
};

// ─── History ─────────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  thumbnail: string; // base64 small thumbnail
  pageName: string;
  deviceType: string;
  nodeCount: number;
  componentCount: number;
  timestamp: number;
}

// ─── Generation Result ──────────────────────────────────────

export interface GenerationResult {
  nodeCount: number;
  componentCount: number;
  styleCount: number;
  variableCount: number;
  colorTokenCount: number;
  textStyleCount: number;
  frameName: string;
  elapsed: number;
}

// ─── View State ──────────────────────────────────────────────

export type PluginView = "upload" | "processing" | "result" | "history" | "settings" | "debug";
