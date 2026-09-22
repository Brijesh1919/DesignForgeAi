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
    }
  | {
      type: "GET_CANVAS_SELECTION";
      payload?: { requestId?: string };
    }
  | {
      type: "EXECUTE_REMOVE_BACKGROUND";
      payload?: { requestId?: string; nodeId?: string };
    }
  | {
      type: "APPLY_REMOVE_BACKGROUND_RESULT";
      payload: {
        requestId?: string;
        nodeId?: string;
        transparentBase64?: string;
        results?: Array<{ nodeId: string; transparentBase64: string }>;
      };
    }
  | {
      type: "EXECUTE_RECOLOR_THEME";
      payload: { requestId?: string };
    }
  | {
      type: "EXPORT_FRAME_CODE";
      payload?: {
        requestId?: string;
        nodeId?: string;
      };
    }
  | {
      type: "EXECUTE_ADJUST_MOBILE_LAYOUT";
      payload?: {
        requestId?: string;
        nodeId?: string;
        viewportWidth?: number;
        horizontalPadding?: number;
        sectionSpacing?: number;
        cardSpacing?: number;
        cardCornerRadius?: number;
        cardPadding?: number;
        buttonHeight?: number;
        maxTitleFontSize?: number;
      };
    }
  | {
      type: "EXECUTE_ADD_PROTOTYPE_EFFECTS";
      payload?: {
        requestId?: string;
        nodeId?: string;
      };
    }
  | {
      type: "EXECUTE_CREATE_CAROUSEL_COMPONENT";
      payload?: {
        requestId?: string;
        nodeId?: string;
        squareSize?: number;
      };
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
      type: "CANVAS_SELECTION_RESULT";
      payload: {
        requestId?: string;
        selection: Array<{
          id: string;
          name: string;
          type: string;
          width: number;
          height: number;
          layoutMode?: string;
          layoutSizingHorizontal?: string;
          layoutSizingVertical?: string;
          childrenCount: number;
        }>;
      };
    }
  | {
      type: "REMOVE_BACKGROUND_EXPORT_READY";
      payload: {
        requestId?: string;
        nodeId?: string;
        nodeName?: string;
        imageBase64?: string;
        items?: Array<{ nodeId: string; nodeName: string; imageBase64: string }>;
      };
    }
  | {
      type: "REMOVE_BACKGROUND_RESULT";
      payload: {
        requestId?: string;
        success: boolean;
        nodeName?: string;
        error?: string;
      };
    }
  | {
      type: "RECOLOR_THEME_RESULT";
      payload: {
        requestId?: string;
        success: boolean;
        nodesUpdated?: number;
        framesCount?: number;
        error?: string;
      };
    }
  | {
      type: "FRAME_CODE_EXPORTED";
      payload: {
        requestId?: string;
        success: boolean;
        frameName: string;
        nodeId: string;
        width: number;
        height: number;
        html: string;
        css: string;
        combinedHtml: string;
        nodeCount: number;
        assets?: Array<{
          filename: string;
          relativePath: string;
          base64: string;
          mimeType: string;
        }>;
        error?: string;
      };
    }
  | {
      type: "ADJUST_MOBILE_LAYOUT_RESULT";
      payload: {
        requestId?: string;
        success: boolean;
        frameName?: string;
        nodesAdjusted?: number;
        details?: string;
        error?: string;
      };
    }
  | {
      type: "ADD_PROTOTYPE_EFFECTS_RESULT";
      payload: {
        requestId?: string;
        success: boolean;
        frameName?: string;
        effectsAdded?: number;
        details?: string[];
        error?: string;
      };
    }
  | {
      type: "CREATE_CAROUSEL_COMPONENT_RESULT";
      payload: {
        requestId?: string;
        success: boolean;
        componentSetId?: string;
        instanceId?: string;
        squareSize?: number;
        slideCount?: number;
        details?: string[];
        error?: string;
      };
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
