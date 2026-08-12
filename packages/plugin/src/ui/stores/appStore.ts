/**
 * DesignForge AI — Zustand App Store
 */

import { create } from "zustand";
import type { PluginView, ProcessingStage, PluginSettings, HistoryItem, GenerationResult } from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface AppState {
  // View
  currentView: PluginView;
  setView: (view: PluginView) => void;

  // Settings
  settings: PluginSettings;
  setSettings: (settings: PluginSettings) => void;
  updateSetting: <K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) => void;

  // Upload
  selectedImage: { base64: string; name: string; width: number; height: number; size: number } | null;
  setSelectedImage: (image: AppState["selectedImage"]) => void;
  clearImage: () => void;

  // Processing
  processingStage: ProcessingStage;
  processingMessage: string;
  processingProgress: number;
  setProcessing: (stage: ProcessingStage, message: string, progress: number) => void;
  startTime: number | null;
  setStartTime: (time: number | null) => void;

  // Results
  generationResult: GenerationResult | null;
  setGenerationResult: (result: GenerationResult | null) => void;
  analysisJson: string | null;
  setAnalysisJson: (json: string | null) => void;
  debugData: {
    screenshotDimensions?: string;
    visionAnalysis?: string;
    generatedHtml?: string;
    generatedCss?: string;
    normalizedHtmlCss?: string;
    validationErrors?: string;
    detectedComponents?: string;
    detectedAssets?: string;
    figmaConversionResult?: string;
    rawGeminiJson?: string;
    optimizedJson?: string;
    componentDetection?: string;
    layoutTree?: string;
    designTokens?: string;
    autoLayoutDecisions?: string;
    constraints?: string;
    prompt?: string;
    debugReport?: string;
  } | null;
  setDebugData: (data: AppState["debugData"]) => void;

  // History
  history: HistoryItem[];
  setHistory: (items: HistoryItem[]) => void;

  // Toasts
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;

  // HTML & CSS
  htmlContent: string;
  cssContent: string;
  inputMode: "screenshot" | "html-css";
  setHtmlContent: (html: string) => void;
  setCssContent: (css: string) => void;
  setInputMode: (mode: "screenshot" | "html-css") => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // View
  currentView: "upload",
  setView: (view) => set({ currentView: view }),

  // Settings
  settings: DEFAULT_SETTINGS,
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),

  // Upload
  selectedImage: null,
  setSelectedImage: (image) => set({ selectedImage: image }),
  clearImage: () => set({ selectedImage: null }),

  // Processing
  processingStage: "idle",
  processingMessage: "",
  processingProgress: 0,
  setProcessing: (stage, message, progress) =>
    set({ processingStage: stage, processingMessage: message, processingProgress: progress }),
  startTime: null,
  setStartTime: (time) => set({ startTime: time }),

  // Results
  generationResult: null,
  setGenerationResult: (result) => set({ generationResult: result }),
  analysisJson: null,
  setAnalysisJson: (json) => set({ analysisJson: json }),
  debugData: null,
  setDebugData: (data) => set({ debugData: data }),

  // History
  history: [],
  setHistory: (items) => set({ history: items }),

  // Toasts
  toasts: [],
  addToast: (type, message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: `toast_${Date.now()}`, type, message },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // HTML & CSS
  htmlContent: "",
  cssContent: "",
  inputMode: "screenshot",
  setHtmlContent: (html) => set({ htmlContent: html }),
  setCssContent: (css) => set({ cssContent: css }),
  setInputMode: (mode) => set({ inputMode: mode }),

  // Error
  error: null,
  setError: (error) => set({ error }),
}));
