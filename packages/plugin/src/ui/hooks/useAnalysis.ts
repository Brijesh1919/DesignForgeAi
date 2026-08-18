/**
 * DesignForge AI — Analysis & HTML/CSS Pipeline Hook
 *
 * Manages both screenshot-to-HTML conversion and HTML/CSS-to-Figma extraction.
 */

import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useFigmaMessages } from "./useFigmaMessages";
import { extractDesignFromHtmlCss } from "../utils/dom-extractor";

export function useAnalysis() {
  const {
    settings,
    selectedImage,
    htmlContent,
    cssContent,
    setHtmlContent,
    setCssContent,
    setProcessing,
    setAnalysisJson,
    setView,
    setStartTime,
    addToast,
    setError,
    setDebugData,
  } = useAppStore();

  const { sendMessage } = useFigmaMessages();

  // Workflow 1: Convert Screenshot to HTML & CSS
  const generateHtmlFromScreenshot = useCallback(async () => {
    if (!selectedImage) {
      addToast("error", "No image selected");
      return;
    }

    if (!settings.backendUrl) {
      addToast("error", "Backend URL not configured. Check Settings.");
      return;
    }

    try {
      setView("processing");
      setStartTime(Date.now());
      setError(null);

      setProcessing("analyzing", "Generating semantic HTML & CSS...", 25);

      const apiUrl = `${settings.backendUrl}/api/analyze-html`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (settings.apiKey) {
        headers["X-API-Key"] = settings.apiKey;
      }

      if (settings.geminiModel) {
        const isOllama = settings.aiProvider === "ollama";
        const isCloudModel = settings.geminiModel.includes("/");
        if (!(isOllama && isCloudModel) && !(!isOllama && !isCloudModel)) {
          headers["X-Gemini-Model"] = settings.geminiModel;
        }
      }

      if (settings.aiProvider) {
        headers["X-AI-Provider"] = settings.aiProvider;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageBase64: selectedImage.base64,
          mimeType: "image/png",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody?.error?.message || `Server error: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "HTML generation failed");
      }

      const { html, css } = result.data;
      setHtmlContent(html || "");
      setCssContent(css || "");

      addToast("success", "Semantic HTML & CSS generated successfully!");
      setView("upload"); // Will show the code editors view when view is "upload" and content is available
    } catch (err) {
      const message = err instanceof Error ? err.message : "HTML generation failed";
      setError(message);
      setProcessing("error", message, 0);
      addToast("error", message);
      setView("upload");
    }
  }, [
    selectedImage,
    settings,
    setProcessing,
    setHtmlContent,
    setCssContent,
    setView,
    setStartTime,
    addToast,
    setError,
  ]);

  // Unified Workflow: Convert rendered HTML & CSS directly to Figma
  const convertHtmlCssToFigma = useCallback(async (customHtml?: string, customCss?: string) => {
    const finalHtml = (customHtml !== undefined ? customHtml : htmlContent)
      .replace(/^```[a-zA-Z]*\n?/g, "")
      .replace(/```$/g, "")
      .replace(/^`[a-zA-Z]*\n?/g, "")
      .trim();
    const finalCss = (customCss !== undefined ? customCss : cssContent)
      .replace(/^```[a-zA-Z]*\n?/g, "")
      .replace(/```$/g, "")
      .replace(/^`[a-zA-Z]*\n?/g, "")
      .trim();

    if (!finalHtml.trim()) {
      addToast("error", "HTML content is empty");
      return;
    }

    try {
      setView("processing");
      setStartTime(Date.now());
      setError(null);

      setProcessing("building-layout", "Parsing DOM tree and computing styles...", 30);

      // Extract design tree from rendered HTML/CSS in sandbox iframe
      const designAnalysis = await extractDesignFromHtmlCss(finalHtml, finalCss, {
        createAutoLayout: settings.createAutoLayout,
        createComponents: settings.createComponents,
        createVariables: settings.createVariables,
        createPaintStyles: settings.createPaintStyles,
        createTextStyles: settings.createTextStyles,
        generateConstraints: settings.generateConstraints,
        preserveAbsolutePosition: settings.createAutoLayout ? false : settings.preserveAbsolutePosition,
        optimizeLayerNames: settings.optimizeLayerNames,
        viewportPreset: settings.viewportPreset,
        debugMode: settings.debugMode,
      });

      // Resolve image assets (from src URLs, data URIs, SVG, or screenshot crops)
      if (designAnalysis.assets && designAnalysis.assets.length > 0) {
        setProcessing("inserting-images", "Resolving image assets...", 50);
        await resolveImageAssets(
          designAnalysis.assets,
          selectedImage?.base64,
          settings.backendUrl
        );
      }

      setProcessing("creating-nodes", "Sending to Figma...", 75);

      const analysisJsonStr = JSON.stringify(designAnalysis);
      setAnalysisJson(analysisJsonStr);

      if (settings.debugMode) {
        setDebugData((prev) => ({
          ...prev,
          detectedComponents: `Found components: ${designAnalysis.components?.length || 0}`,
          detectedAssets: `Extracted assets: ${designAnalysis.assets?.length || 0}`,
          figmaConversionResult: `Root layout built with ${designAnalysis.rootFrame?.children?.length || 0} nodes.`,
        }));
      }

      // Send to plugin sandbox (controller.ts) to reconstruct the Figma nodes
      sendMessage({
        type: "START_GENERATION",
        payload: {
          analysisJson: analysisJsonStr,
          imageBase64: selectedImage?.base64 || "", // Fallback if no screenshot
          settings,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "DOM extraction failed";
      setError(message);
      setProcessing("error", message, 0);
      addToast("error", message);
      setView("upload");
    }
  }, [
    htmlContent,
    cssContent,
    settings,
    selectedImage,
    setProcessing,
    setAnalysisJson,
    setView,
    setStartTime,
    addToast,
    setError,
    sendMessage,
    setDebugData,
  ]);

  // Main startAnalysis flow (Convert directly to Design):
  // Screenshot -> Figma-compatible HTML/CSS -> client-side DOM extraction -> Figma
  const startAnalysis = useCallback(async () => {
    if (!selectedImage) {
      addToast("error", "No image selected");
      return;
    }

    if (!settings.backendUrl) {
      addToast("error", "Backend URL not configured. Check Settings.");
      return;
    }

    try {
      setView("processing");
      setStartTime(Date.now());
      setError(null);

      setProcessing("analyzing", "Generating semantic HTML & CSS...", 25);

      const apiUrl = `${settings.backendUrl}/api/analyze-html`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (settings.apiKey) {
        headers["X-API-Key"] = settings.apiKey;
      }

      if (settings.geminiModel) {
        const isOllama = settings.aiProvider === "ollama";
        const isCloudModel = settings.geminiModel.includes("/");
        if (!(isOllama && isCloudModel) && !(!isOllama && !isCloudModel)) {
          headers["X-Gemini-Model"] = settings.geminiModel;
        }
      }

      if (settings.aiProvider) {
        headers["X-AI-Provider"] = settings.aiProvider;
      }

      headers["X-Debug-Mode"] = settings.debugMode ? "true" : "false";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageBase64: selectedImage.base64,
          mimeType: "image/png",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody?.error?.message || `Server error: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "HTML generation failed");
      }

      const { html, css } = result.data;
      setHtmlContent(html || "");
      setCssContent(css || "");

      if (result.debug) {
        setDebugData({
          screenshotDimensions: result.debug.screenshotDimensions,
          visionAnalysis: result.debug.visionAnalysis,
          generatedHtml: result.debug.generatedHtml,
          generatedCss: result.debug.generatedCss,
          normalizedHtmlCss: result.debug.normalizedHtmlCss,
          validationErrors: result.debug.validationErrors,
        });
      } else {
        setDebugData(null);
      }

      setProcessing("building-layout", "Parsing DOM tree and computing styles...", 55);

      // Extract design tree from rendered HTML/CSS in sandbox iframe
      const designAnalysis = await extractDesignFromHtmlCss(html || "", css || "", {
        createAutoLayout: settings.createAutoLayout,
        createComponents: settings.createComponents,
        createVariables: settings.createVariables,
        createPaintStyles: settings.createPaintStyles,
        createTextStyles: settings.createTextStyles,
        generateConstraints: settings.generateConstraints,
        preserveAbsolutePosition: settings.createAutoLayout ? false : settings.preserveAbsolutePosition,
        optimizeLayerNames: settings.optimizeLayerNames,
        debugMode: settings.debugMode,
      });

      // Resolve image assets (from src URLs, data URIs, SVG, or screenshot crops)
      if (designAnalysis.assets && designAnalysis.assets.length > 0) {
        setProcessing("inserting-images", "Resolving image assets...", 70);
        await resolveImageAssets(
          designAnalysis.assets,
          selectedImage?.base64,
          settings.backendUrl
        );
      }

      setProcessing("creating-nodes", "Sending to Figma...", 85);

      const analysisJsonStr = JSON.stringify(designAnalysis);
      setAnalysisJson(analysisJsonStr);

      if (settings.debugMode) {
        setDebugData((prev) => ({
          ...prev,
          detectedComponents: `Found components: ${designAnalysis.components?.length || 0}`,
          detectedAssets: `Extracted assets: ${designAnalysis.assets?.length || 0}`,
          figmaConversionResult: `Root layout built with ${designAnalysis.rootFrame?.children?.length || 0} nodes.`,
        }));
      }

      sendMessage({
        type: "START_GENERATION",
        payload: {
          analysisJson: analysisJsonStr,
          imageBase64: selectedImage.base64,
          settings,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setProcessing("error", message, 0);
      addToast("error", message);
      setView("upload");
    }
  }, [
    selectedImage,
    settings,
    setProcessing,
    setAnalysisJson,
    setView,
    setStartTime,
    addToast,
    setError,
    sendMessage,
    setDebugData,
    setHtmlContent,
    setCssContent,
  ]);

  return { startAnalysis, generateHtmlFromScreenshot, convertHtmlCssToFigma };
}

/**
 * Resolves image assets to base64 data:
 * - Data URLs (PNG, JPEG, WebP, GIF)
 * - SVG data URIs (rasterized via HTML5 Canvas)
 * - Remote HTTP/HTTPS image URLs (direct fetch, or backend proxy fallback if CORS blocks)
 * - Screenshot region crops (if selectedImage is provided)
 */
async function resolveImageAssets(
  assets: any[],
  selectedImageBase64: string | undefined,
  backendUrl: string
): Promise<void> {
  if (!assets || assets.length === 0) return;

  for (const asset of assets) {
    if (asset.base64) continue;
    const src = asset.src;
    if (!src || typeof src !== "string") continue;

    try {
      if (src.startsWith("data:image/")) {
        if (src.startsWith("data:image/svg+xml")) {
          // Rasterize SVG data URI to PNG base64 via Canvas
          const b64 = await rasterizeImageSrc(
            src,
            asset.bounds?.width || 100,
            asset.bounds?.height || 100
          );
          if (b64) asset.base64 = b64;
        } else {
          // Standard raster data URL
          const commaIdx = src.indexOf(",");
          if (commaIdx !== -1) {
            asset.base64 = src.slice(commaIdx + 1);
          }
        }
      } else if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("//") ||
        src.startsWith("blob:")
      ) {
        const fullUrl = src.startsWith("//") ? `https:${src}` : src;
        let fetched = false;

        // Attempt 1: Direct fetch in browser
        try {
          const res = await fetch(fullUrl);
          if (res.ok) {
            const blob = await res.blob();
            const b64 = await blobToBase64(blob);
            if (b64) {
              asset.base64 = b64;
              fetched = true;
            }
          }
        } catch (_) {
          // Browser fetch failed (likely CORS)
        }

        // Attempt 2: Server-side proxy fetch (bypasses browser CORS)
        if (!fetched && backendUrl) {
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
                fetched = true;
              }
            }
          } catch (_) {
            // Proxy fetch failed
          }
        }

        // Attempt 3: Canvas rasterization fallback
        if (!fetched) {
          try {
            const b64 = await rasterizeImageSrc(
              fullUrl,
              asset.bounds?.width || 100,
              asset.bounds?.height || 100
            );
            if (b64) asset.base64 = b64;
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn(`[ImageResolver] Failed to resolve asset ${asset.id}:`, err);
    }
  }

  // Fallback: Crop from screenshot if selectedImage is available for remaining unresolved assets
  const unextracted = assets.filter((a) => a.bounds && !a.base64);
  if (selectedImageBase64 && unextracted.length > 0 && backendUrl) {
    try {
      const assetsResponse = await fetch(`${backendUrl}/api/assets/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImageBase64,
          regions: unextracted.map((a) => ({
            id: a.id,
            ...a.bounds,
          })),
        }),
      });
      if (assetsResponse.ok) {
        const assetsResult = await assetsResponse.json();
        for (const extracted of assetsResult.assets || []) {
          const asset = assets.find((a) => a.id === extracted.id);
          if (asset && extracted.base64) {
            asset.base64 = extracted.base64;
          }
        }
      }
    } catch (e) {
      console.warn("Asset extraction from screenshot failed — continuing", e);
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

function rasterizeImageSrc(
  src: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width || img.naturalWidth || 100));
        canvas.height = Math.max(
          1,
          Math.round(height || img.naturalHeight || 100)
        );
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png");
          const comma = dataUrl.indexOf(",");
          resolve(comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl);
          return;
        }
      } catch (_) {}
      resolve("");
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}
