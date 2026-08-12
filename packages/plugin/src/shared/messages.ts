/**
 * DesignForge AI — Plugin Message Protocol
 *
 * Defines all messages passed between the Plugin UI (React iframe)
 * and the Plugin Sandbox (Figma API) via postMessage.
 */

import type {
  ProcessingStage,
  PluginSettings,
  GenerationResult,
  HistoryItem,
} from "./types";

// ─── UI → Plugin Messages ────────────────────────────────────

export type UIToPluginMessage =
  | {
      type: "START_GENERATION";
      payload: {
        analysisJson: string; // Serialized DesignAnalysis
        imageBase64: string; // Original image for asset extraction
        settings: PluginSettings;
      };
    }
  | {
      type: "CANCEL_GENERATION";
    }
  | {
      type: "LOAD_SETTINGS";
    }
  | {
      type: "SAVE_SETTINGS";
      payload: PluginSettings;
    }
  | {
      type: "LOAD_HISTORY";
    }
  | {
      type: "DELETE_HISTORY_ITEM";
      payload: { id: string };
    }
  | {
      type: "CLEAR_HISTORY";
    }
  | {
      type: "ZOOM_TO_NODE";
      payload: { nodeId: string };
    }
  | {
      type: "EXPORT_JSON";
      payload: { analysisJson: string };
    }
  | {
      type: "RESIZE_WINDOW";
      payload: { width: number; height: number };
    };

// ─── Plugin → UI Messages ────────────────────────────────────

export type PluginToUIMessage =
  | {
      type: "PROGRESS_UPDATE";
      payload: {
        stage: ProcessingStage;
        message: string;
        progress: number; // 0-100
      };
    }
  | {
      type: "GENERATION_COMPLETE";
      payload: GenerationResult;
    }
  | {
      type: "GENERATION_ERROR";
      payload: {
        message: string;
        details?: string;
      };
    }
  | {
      type: "SETTINGS_LOADED";
      payload: PluginSettings;
    }
  | {
      type: "HISTORY_LOADED";
      payload: HistoryItem[];
    }
  | {
      type: "NOTIFICATION";
      payload: {
        type: "success" | "error" | "warning" | "info";
        message: string;
      };
    };

// ─── Union Type ──────────────────────────────────────────────

export type PluginMessage = UIToPluginMessage | PluginToUIMessage;
