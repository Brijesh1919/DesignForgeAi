/**
 * DesignForge AI — Website URL → Figma: Conversion Hook
 *
 * Isolated hook for the Website URL → Figma pipeline.
 * Does NOT modify or depend on useAnalysis.ts or dom-extractor.ts.
 *
 * Pipeline:
 *   1. Validate URL
 *   2. POST /api/website-to-figma → WebsiteExtractionResult
 *   3. Resolve image assets via /api/assets/fetch-url proxy
 *   4. Normalize → DesignAnalysis (website-normalizer.ts)
 *   5. Send START_GENERATION to plugin sandbox
 */

import { useCallback, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { useFigmaMessages } from "./useFigmaMessages";
import { normalizeWebsiteToDesignAnalysis } from "../utils/website-normalizer";
import type { WebsiteExtractionResult } from "../utils/website-normalizer";

export interface WebsiteConversionOptions {
  editableText:    boolean;
  autoLayout:      boolean;
  importImages:    boolean;
  preserveFonts:   boolean;
  preserveShadows: boolean;
  preserveBorders: boolean;
}

export type WebsiteProgressStep =
  | "idle"
  | "opening"
  | "rendering"
  | "waiting-fonts"
  | "analyzing"
  | "extracting"
  | "importing-assets"
  | "creating-layers"
  | "finalizing"
  | "error";

export interface WebsiteConversionState {
  isConverting: boolean;
  step: WebsiteProgressStep;
  stepMessage: string;
  progress: number;
  error: string | null;
}

export function useWebsiteConversion() {
  const { settings, setView, setProcessing, addToast, setAnalysisJson, setStartTime, setError } = useAppStore();
  const { sendMessage } = useFigmaMessages();

  const [conversionState, setConversionState] = useState<WebsiteConversionState>({
    isConverting: false,
    step: "idle",
    stepMessage: "",
    progress: 0,
    error: null,
  });

  const updateStep = useCallback((step: WebsiteProgressStep, message: string, progress: number) => {
    setConversionState((prev) => ({ ...prev, step, stepMessage: message, progress, error: null }));
  }, []);

  const convertWebsiteToFigma = useCallback(
    async (url: string, viewport: { width: number; height: number }, options: WebsiteConversionOptions) => {
      // ─── Input validation ──────────────────────────────────
      if (!url || !url.trim()) {
        addToast("error", "Please enter a website URL.");
        return;
      }
      try {
        const parsed = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          addToast("error", "Only http and https URLs are supported.");
          return;
        }
      } catch (_) {
        addToast("error", "Invalid URL. Please enter a valid website address.");
        return;
      }

      if (!settings.backendUrl) {
        addToast("error", "Backend URL not configured. Check Settings.");
        return;
      }

      const normalizedUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;

      setConversionState({ isConverting: true, step: "opening", stepMessage: "Opening website...", progress: 5, error: null });
      setView("processing");
      setStartTime(Date.now());
      setError(null);
      setProcessing("analyzing", "Opening website...", 5);

      try {
        // ─── Step 1: Browser rendering via backend ──────────
        updateStep("rendering", "Rendering page...", 12);
        setProcessing("analyzing", "Rendering page with Playwright...", 12);

        const apiUrl = `${settings.backendUrl}/api/website-to-figma`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s total client timeout

        let response: Response;
        try {
          response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: normalizedUrl, viewport, options }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const msg = (errorBody as any)?.error || `Server error: ${response.status}`;

          // Specific user-friendly messages
          if (response.status === 503) {
            throw new Error("Website URL feature is not enabled on the backend. Set ENABLE_WEBSITE_TO_FIGMA=true in backend .env");
          }
          throw new Error(msg);
        }

        const result = await response.json() as { success: boolean; data?: WebsiteExtractionResult; error?: string };

        if (!result.success || !result.data) {
          throw new Error(result.error || "Extraction failed — no data returned.");
        }

        const extractionResult = result.data;

        console.log(`[WebsiteToFigma] URL: ${extractionResult.url}`);
        console.log(`[WebsiteToFigma] Viewport: ${extractionResult.viewport.width}x${extractionResult.viewport.height}`);
        console.log(`[WebsiteToFigma] Page dimensions: ${extractionResult.pageWidth}x${extractionResult.pageHeight}`);
        console.log(`[WebsiteToFigma] Fonts: ${extractionResult.fonts?.length ?? 0}`);
        console.log(`[WebsiteToFigma] SVGs: ${countSVGs(extractionResult.rootNode)}`);

        // ─── Step 2: Resolve image assets ───────────────────
        if (options.importImages && extractionResult.assets && extractionResult.assets.length > 0) {
          updateStep("importing-assets", "Importing assets...", 45);
          setProcessing("inserting-images", "Importing assets...", 45);
          await resolveWebsiteAssets(extractionResult.assets, settings.backendUrl);
        }

        // ─── Step 3: Normalize → DesignAnalysis ─────────────
        updateStep("creating-layers", "Creating Figma layers...", 65);
        setProcessing("creating-nodes", "Normalizing design tree...", 65);

        const designAnalysis = normalizeWebsiteToDesignAnalysis(extractionResult, {
          createAutoLayout:   options.autoLayout,
          importImages:       options.importImages,
          preserveShadows:    options.preserveShadows,
          preserveBorders:    options.preserveBorders,
        });

        // Attach resolved asset base64 data & SVG vectors
        if (extractionResult.assets) {
          const assetMap = new Map<string, any>();
          for (const asset of extractionResult.assets) {
            if (asset.src) assetMap.set(asset.src, asset);
            if (asset.id) assetMap.set(asset.id, asset);
          }

          if (designAnalysis.assets) {
            for (const analysisAsset of designAnalysis.assets) {
              const matched = assetMap.get(analysisAsset.src) || (analysisAsset.id ? assetMap.get(analysisAsset.id) : undefined);
              if (matched) {
                if (matched.base64) (analysisAsset as any).base64 = matched.base64;
                if (matched.isSvg) (analysisAsset as any).isSvg = matched.isSvg;
                if (matched.svgText) (analysisAsset as any).svgText = matched.svgText;
              }
            }
          }
          // Inject SVG text into vector nodes referencing SVG assets
          injectSvgContentToNodes(designAnalysis.rootFrame, extractionResult.assets);
        }

        // ─── Step 4: Send to plugin sandbox ─────────────────
        updateStep("finalizing", "Finalizing design...", 85);
        setProcessing("finalizing", "Sending to Figma...", 85);

        const analysisJsonStr = JSON.stringify(designAnalysis);
        setAnalysisJson(analysisJsonStr);

        sendMessage({
          type: "START_GENERATION",
          payload: {
            analysisJson: analysisJsonStr,
            imageBase64: "", // No screenshot for website conversion
            settings: {
              ...settings,
              createAutoLayout: options.autoLayout,
            },
          },
        });

        setConversionState((prev) => ({ ...prev, isConverting: false, step: "finalizing", progress: 90 }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Website conversion failed";

        let userMessage = message;
        if (message.includes("aborted") || message.includes("abort")) {
          userMessage = "Request timed out. The website may be too slow or complex.";
        } else if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
          userMessage = "Cannot connect to backend. Is the backend server running?";
        }

        console.error(`[WebsiteToFigma] Error:`, err);

        setConversionState({ isConverting: false, step: "error", stepMessage: userMessage, progress: 0, error: userMessage });
        setError(userMessage);
        setProcessing("error", userMessage, 0);
        addToast("error", userMessage);
        setView("upload");
      }
    },
    [settings, setView, setProcessing, addToast, setAnalysisJson, setStartTime, setError, sendMessage, updateStep]
  );

  const resetConversionState = useCallback(() => {
    setConversionState({ isConverting: false, step: "idle", stepMessage: "", progress: 0, error: null });
  }, []);

  return { convertWebsiteToFigma, conversionState, resetConversionState };
}

// ─── Asset Resolution with Concurrency Pool & SVG Inlining ───────────────────

async function resolveWebsiteAssets(assets: any[], backendUrl: string): Promise<void> {
  if (!assets || assets.length === 0) return;

  const CONCURRENCY = 6;
  const queue = [...assets];

  async function worker() {
    while (queue.length > 0) {
      const asset = queue.shift();
      if (!asset) break;
      if (asset.base64) continue;
      const src = asset.src;
      if (!src || typeof src !== "string") continue;

      try {
        if (src.startsWith("data:image/svg+xml")) {
          const comma = src.indexOf(",");
          if (comma !== -1) {
            const raw = src.slice(comma + 1);
            asset.base64 = src.includes(";base64,") ? raw : btoa(decodeURIComponent(raw));
            asset.isSvg = true;
            try {
              asset.svgText = src.includes(";base64,") ? atob(raw) : decodeURIComponent(raw);
            } catch (_) {}
          }
          continue;
        }

        if (src.startsWith("data:image/")) {
          const comma = src.indexOf(",");
          if (comma !== -1) asset.base64 = src.slice(comma + 1);
          continue;
        }

        if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) {
          const fullUrl = src.startsWith("//") ? `https:${src}` : src;
          const isSvgUrl = fullUrl.toLowerCase().includes(".svg");

          // Attempt 1: Backend proxy (bypasses browser CORS inside Figma iframe)
          if (backendUrl) {
            try {
              const proxyRes = await fetch(`${backendUrl}/api/assets/fetch-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: fullUrl }),
              });
              if (proxyRes.ok) {
                const data = await proxyRes.json();
                if (data.base64) {
                  asset.base64 = data.base64;
                  if (isSvgUrl || (data.mimeType && data.mimeType.includes("svg"))) {
                    asset.isSvg = true;
                    try {
                      asset.svgText = atob(data.base64);
                    } catch (_) {}
                  }
                  continue;
                }
              }
            } catch (_) { /* Fall through to direct fetch */ }
          }

          // Attempt 2: Direct browser fetch fallback
          try {
            const res = await fetch(fullUrl);
            if (res.ok) {
              const blob = await res.blob();
              const base64 = await blobToBase64(blob);
              if (base64) {
                asset.base64 = base64;
                if (isSvgUrl || blob.type.includes("svg")) {
                  asset.isSvg = true;
                  try {
                    asset.svgText = atob(base64);
                  } catch (_) {}
                }
                continue;
              }
            }
          } catch (_) { /* CORS blocked */ }
        }
      } catch (err) {
        console.warn(`[WebsiteToFigma] Failed to resolve asset ${asset.id}:`, err);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, assets.length) }, () => worker());
  await Promise.all(workers);
}

function injectSvgContentToNodes(node: any, assets: any[]) {
  if (!node) return;
  if ((node.type === "IMAGE" || node.type === "VECTOR") && node.imageRef) {
    const matchedAsset = assets.find(
      (a) => a.src === node.imageRef || a.id === node.imageRef
    );
    if (matchedAsset && matchedAsset.svgText) {
      node.type = "VECTOR";
      node.svgContent = matchedAsset.svgText;
    }
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      injectSvgContentToNodes(child, assets);
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const comma = res.indexOf(",");
      resolve(comma !== -1 ? res.slice(comma + 1) : res);
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(blob);
  });
}

function countSVGs(node: any): number {
  if (!node) return 0;
  let count = node.type === "VECTOR" ? 1 : 0;
  for (const child of node.children || []) count += countSVGs(child);
  return count;
}
