/**
 * DesignForge AI — Agent / MCP Bridge View
 * Connects the active Figma document to Antigravity and other MCP-compatible AI agents.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useFigmaMessages } from "../hooks/useFigmaMessages";
import { useWebsiteConversion } from "../hooks/useWebsiteConversion";

interface ActivityLogItem {
  id: string;
  time: string;
  command: string;
  status: "pending" | "success" | "error";
  details: string;
}

export const AgentBridgeView: React.FC = () => {
  const settings = useAppStore((s) => s.settings);
  const { sendMessage } = useFigmaMessages();
  const { convertWebsiteToFigma } = useWebsiteConversion();

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<any>(null);
  const pendingRequestsRef = useRef<Map<string, (result: any) => void>>(new Map());
  const isMountedRef = useRef(true);
  const isBusyRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const convertWebsiteToFigmaRef = useRef(convertWebsiteToFigma);
  convertWebsiteToFigmaRef.current = convertWebsiteToFigma;

  const addLog = useCallback((command: string, status: "pending" | "success" | "error", details: string) => {
    const item: ActivityLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      command,
      status,
      details,
    };
    setLogs((prev) => [item, ...prev.slice(0, 30)]);
  }, []);

  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

  // Update existing log status
  const updateLog = useCallback((id: string, status: "success" | "error", details: string) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, status, details } : log))
    );
  }, []);

  const updateLogRef = useRef(updateLog);
  updateLogRef.current = updateLog;

  // Listen to messages from Figma's sandbox (code.js)
  useEffect(() => {
    const handlePluginMessage = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === "CANVAS_SELECTION_RESULT") {
        const requestId = msg.payload?.requestId;
        if (requestId && pendingRequestsRef.current.has(requestId)) {
          const resolver = pendingRequestsRef.current.get(requestId)!;
          pendingRequestsRef.current.delete(requestId);
          resolver(msg.payload);
        }
      }

      if (
        msg.type === "REMOVE_BACKGROUND_EXPORT_READY" ||
        msg.type === "REMOVE_BACKGROUND_RESULT" ||
        msg.type === "RECOLOR_THEME_RESULT" ||
        msg.type === "ADJUST_MOBILE_LAYOUT_RESULT" ||
        msg.type === "ADD_PROTOTYPE_EFFECTS_RESULT"
      ) {
        const requestId = msg.payload?.requestId;
        if (requestId && pendingRequestsRef.current.has(requestId)) {
          const resolver = pendingRequestsRef.current.get(requestId)!;
          pendingRequestsRef.current.delete(requestId);
          resolver(msg.payload);
        }
      }

      if (msg.type === "GENERATION_COMPLETE") {
        const pendingKey = "CURRENT_GENERATION";
        if (pendingRequestsRef.current.has(pendingKey)) {
          const resolver = pendingRequestsRef.current.get(pendingKey)!;
          pendingRequestsRef.current.delete(pendingKey);
          resolver({ success: true, ...msg.payload });
        }
      }

      if (msg.type === "GENERATION_ERROR") {
        const pendingKey = "CURRENT_GENERATION";
        if (pendingRequestsRef.current.has(pendingKey)) {
          const resolver = pendingRequestsRef.current.get(pendingKey)!;
          pendingRequestsRef.current.delete(pendingKey);
          resolver({ success: false, error: msg.payload?.message || "Generation error" });
        }
      }
    };

    window.addEventListener("message", handlePluginMessage);
    return () => window.removeEventListener("message", handlePluginMessage);
  }, []);

  // Connect to the local WebSocket bridge
  const connectBridge = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setConnectionStatus("connecting");
    const ws = new WebSocket("ws://localhost:3001/bridge");
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) {
        ws.close();
        return;
      }
      setConnectionStatus("connected");
      addLogRef.current("System", "success", "Connected to DesignForge AI Agent Bridge (ws://localhost:3001/bridge)");
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus("disconnected");
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connectBridge();
        }
      }, 3000);
    };

    ws.onerror = () => {
      if (!isMountedRef.current) return;
      setConnectionStatus("disconnected");
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "BRIDGE_WELCOME") {
          return;
        }

        if (data.type === "BRIDGE_PONG") {
          return;
        }

        const { id, type, payload } = data;

        if (type === "PING") {
          ws.send(JSON.stringify({ id, success: true, data: { status: "pong", time: Date.now() } }));
          addLogRef.current("Ping", "success", "Agent ping received and acknowledged");
          return;
        }

        if (type === "GET_CANVAS_SELECTION") {
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Inspect Selection", "pending", "Reading selected layers from Figma canvas...");

          const selectionResult = await new Promise<any>((resolve) => {
            pendingRequestsRef.current.set(id, resolve);
            sendMessageRef.current({
              type: "GET_CANVAS_SELECTION",
              payload: { requestId: id, maxDepth: payload?.maxDepth, nodeId: payload?.nodeId },
            });
            setTimeout(() => {
              if (pendingRequestsRef.current.has(id)) {
                pendingRequestsRef.current.delete(id);
                resolve({ selection: [] });
              }
            }, 8000);
          });

          const count = selectionResult?.selection?.length || 0;
          updateLogRef.current(logId, "success", `Returned ${count} selected layer(s) to Antigravity`);

          ws.send(JSON.stringify({ id, success: true, data: selectionResult }));
          return;
        }

        if (type === "EXECUTE_URL_TO_DESIGN") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is already busy generating a design. Please wait for it to finish." }));
            return;
          }
          isBusyRef.current = true;
          const targetUrl = payload.url;
          const autoLayout = payload.autoLayout !== false;
          const viewportStr = payload.viewport || "desktop";

          const vpMap: Record<string, { width: number; height: number }> = {
            desktop: { width: 1440, height: 900 },
            laptop: { width: 1280, height: 800 },
            tablet: { width: 768, height: 1024 },
            mobile: { width: 390, height: 844 },
          };
          const viewportObj = vpMap[viewportStr] || vpMap.desktop;

          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Convert URL", "pending", `Extracting & generating: ${targetUrl} (AL: ${autoLayout ? "ON" : "OFF"})`);

          try {
            const buildPromise = new Promise<any>((resolve) => {
              pendingRequestsRef.current.set("CURRENT_GENERATION", resolve);
              setTimeout(() => {
                if (pendingRequestsRef.current.has("CURRENT_GENERATION")) {
                  pendingRequestsRef.current.delete("CURRENT_GENERATION");
                  resolve({ success: false, error: "Generation timed out after 90s" });
                }
              }, 90000);
            });

            await convertWebsiteToFigmaRef.current(targetUrl, viewportObj, {
              editableText: true,
              autoLayout: autoLayout,
              importImages: true,
              preserveFonts: true,
              preserveShadows: true,
              preserveBorders: true,
            });

            const buildResult = await buildPromise;

            if (buildResult.success) {
              updateLogRef.current(logId, "success", `Design generated: "${buildResult.frameName || "Page"}"`);
              ws.send(JSON.stringify({
                id,
                success: true,
                data: {
                  frameName: buildResult.frameName || targetUrl,
                  nodeCount: buildResult.nodesCreated || 0,
                  warnings: buildResult.warnings || [],
                },
              }));
            } else {
              throw new Error(buildResult.error || "Generation failed in Figma");
            }
          } catch (err: any) {
            updateLogRef.current(logId, "error", `Failed: ${err.message}`);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }

        if (type === "EXECUTE_AI_PROMPT") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is already busy generating a design. Please wait for it to finish." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("AI Generate", "pending", `Generating from prompt: "${payload.prompt}"`);

          try {
            // Send prompt to backend generate API
            const response = await fetch("http://localhost:3001/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: payload.prompt }),
            });

            const genData = await response.json();
            if (!genData.success) throw new Error(genData.error || "AI generation failed");

            // Dispatch to Figma
            const buildResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set("CURRENT_GENERATION", resolve);
              sendMessageRef.current({
                type: "START_GENERATION",
                payload: {
                  analysisJson: JSON.stringify(genData.data?.analysis),
                  imageBase64: "",
                  settings: {
                    ...settingsRef.current,
                    createAutoLayout: payload.autoLayout !== false,
                  },
                },
              });
              setTimeout(() => resolve({ success: false, error: "Timed out" }), 60000);
            });

            updateLogRef.current(logId, buildResult.success ? "success" : "error", buildResult.frameName || "AI Component");
            ws.send(JSON.stringify({ id, success: buildResult.success, data: buildResult }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }

        if (type === "REMOVE_BACKGROUND") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is currently busy. Please wait for it to finish." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Remove BG", "pending", "Exporting selected layer(s) from Figma...");

          try {
            // 1. Ask controller to export selected layer(s) as PNG base64
            const exportResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set(id, resolve);
              sendMessageRef.current({ type: "EXECUTE_REMOVE_BACKGROUND", payload: { requestId: id } });
              setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                  pendingRequestsRef.current.delete(id);
                  resolve({ success: false, error: "Timed out waiting for layer export" });
                }
              }, 25000);
            });

            const items: Array<{ nodeId: string; nodeName: string; imageBase64: string }> =
              exportResult.items || (exportResult.imageBase64 ? [exportResult] : []);

            if (!items.length) {
              throw new Error(exportResult?.error || "No layers selected or failed to export images");
            }

            updateLogRef.current(logId, "pending", `Removing background from ${items.length} layer(s) via AI...`);

            // 2. Process all items with backend /api/assets/remove-bg
            const results: Array<{ nodeId: string; transparentBase64: string }> = [];

            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              updateLogRef.current(logId, "pending", `Removing background ${i + 1}/${items.length}: "${item.nodeName}"...`);

              const res = await fetch("http://localhost:3001/api/assets/remove-bg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: item.imageBase64 }),
              });
              const data = await res.json();
              if (data.success && data.transparentBase64) {
                results.push({ nodeId: item.nodeId, transparentBase64: data.transparentBase64 });
              }
            }

            if (!results.length) {
              throw new Error("Background removal failed for all selected layers");
            }

            updateLogRef.current(logId, "pending", `Applying transparent cutouts to ${results.length} layer(s)...`);

            // 3. Ask controller to apply transparent image fills
            const applyResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set(id, resolve);
              sendMessageRef.current({
                type: "APPLY_REMOVE_BACKGROUND_RESULT",
                payload: {
                  requestId: id,
                  results,
                },
              });
              setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                  pendingRequestsRef.current.delete(id);
                  resolve({ success: false, error: "Timed out applying transparent images" });
                }
              }, 15000);
            });

            if (!applyResult || !applyResult.success) {
              throw new Error(applyResult?.error || "Failed to apply transparent images");
            }

            updateLogRef.current(logId, "success", `Background removed from ${results.length} layer(s)!`);
            ws.send(JSON.stringify({ id, success: true, data: { count: results.length } }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }

        if (type === "RECOLOR_THEME") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is currently busy. Please wait for it to finish." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Recolor Theme", "pending", "Applying new color theme to selected frames in Figma...");

          try {
            const recolorResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set(id, resolve);
              sendMessageRef.current({ type: "EXECUTE_RECOLOR_THEME", payload: { requestId: id, ...payload } });
              setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                  pendingRequestsRef.current.delete(id);
                  resolve({ success: false, error: "Timed out applying recolor theme" });
                }
              }, 30000);
            });

            if (!recolorResult || !recolorResult.success) {
              throw new Error(recolorResult?.error || "Failed to recolor theme");
            }

            updateLogRef.current(logId, "success", `Theme updated on ${recolorResult.nodesUpdated || "selected"} layers!`);
            ws.send(JSON.stringify({ id, success: true, data: recolorResult }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }

        if (type === "EXECUTE_HTML_CSS") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is already busy generating a design. Please wait for it to complete." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Apply Code", "pending", "Rendering HTML/CSS design in Figma...");

          try {
            const { html = "", css = "", analysisJson = "" } = payload as { html?: string; css?: string; analysisJson?: string };

            // If a pre-built analysisJson is provided, use it directly with START_GENERATION
            if (analysisJson) {
              const buildResult = await new Promise<any>((resolve) => {
                pendingRequestsRef.current.set("CURRENT_GENERATION", resolve);
                sendMessageRef.current({
                  type: "START_GENERATION",
                  payload: {
                    analysisJson,
                    imageBase64: "",
                    settings: { ...settingsRef.current, createAutoLayout: payload.autoLayout !== false },
                  },
                });
                setTimeout(() => resolve({ success: false, error: "Timed out after 90s" }), 90000);
              });
              updateLogRef.current(logId, buildResult.success ? "success" : "error", buildResult.frameName || (buildResult.error ?? "Done"));
              ws.send(JSON.stringify({ id, success: buildResult.success, data: buildResult, error: buildResult.error }));
              return;
            }

            // Otherwise, render HTML in a hidden iframe, read computed styles, build DesignAnalysis
            if (!html.trim()) throw new Error("Either html or analysisJson is required");

            let fullHtml = html;
            if (css && !html.includes("<style")) {
              fullHtml = html.replace("</head>", `<style>${css}</style></head>`);
            }

            addLogRef.current("Apply Code", "pending", "Extracting layout from HTML iframe...");

            const targetWidth = (payload as any).width || 1440;
            // Render inside a hidden iframe so we can read computed styles
            const iframe = document.createElement("iframe");
            iframe.style.cssText = `position:fixed;top:-10000px;left:-10000px;width:${targetWidth}px;height:auto;min-height:1024px;border:none;visibility:hidden;`;
            document.body.appendChild(iframe);

            await new Promise<void>((resolve) => {
              iframe.onload = () => resolve();
              iframe.srcdoc = fullHtml;
              setTimeout(resolve, 5000);
            });

            // Give fonts and layout a moment to settle
            await new Promise<void>((r) => setTimeout(r, 500));

            const iDoc = iframe.contentDocument;
            const iWin = iframe.contentWindow;

            if (!iDoc || !iWin) {
              document.body.removeChild(iframe);
              throw new Error("Failed to access iframe document");
            }

            function parseColorAndAlpha(colorStr: string): { hex: string; alpha: number } {
              if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") {
                return { hex: "#ffffff", alpha: 0 };
              }
              if (colorStr.startsWith("#")) {
                if (colorStr.length === 9) {
                  const hex = colorStr.slice(0, 7);
                  const alpha = parseInt(colorStr.slice(7, 9), 16) / 255;
                  return { hex, alpha };
                }
                return { hex: colorStr, alpha: 1 };
              }
              const match = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
              if (match) {
                const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
                const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
                const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
                const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
                return { hex: `#${r}${g}${b}`, alpha };
              }
              return { hex: parseColorToHex(colorStr), alpha: 1 };
            }

            function parseColorToHex(colorStr: string): string {
              if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") return "#ffffff";
              if (colorStr.startsWith("#")) return colorStr;
              const match = colorStr.match(/\d+/g);
              if (!match || match.length < 3) return "#ffffff";
              const r = parseInt(match[0], 10).toString(16).padStart(2, "0");
              const g = parseInt(match[1], 10).toString(16).padStart(2, "0");
              const b = parseInt(match[2], 10).toString(16).padStart(2, "0");
              return `#${r}${g}${b}`;
            }

            function mapFontWeight(w: string): "Thin" | "ExtraLight" | "Light" | "Regular" | "Medium" | "SemiBold" | "Bold" | "ExtraBold" | "Black" {
              const num = parseInt(w, 10);
              if (num >= 900) return "Black";
              if (num >= 800) return "ExtraBold";
              if (num >= 700 || w === "bold") return "Bold";
              if (num >= 600) return "SemiBold";
              if (num >= 500) return "Medium";
              if (num >= 300 || w === "light") return "Light";
              if (num >= 200) return "ExtraLight";
              if (num >= 100) return "Thin";
              return "Regular";
            }

            function extractNode(el: Element, depth: number, parentRect: DOMRect | null): any {
              const cs = iWin!.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              const tag = el.tagName.toLowerCase();
              const children: any[] = [];
              if (depth < 10 && tag !== "svg") {
                for (const child of Array.from(el.children)) {
                  const childTag = child.tagName.toLowerCase();
                  if (childTag !== "script" && childTag !== "style" && childTag !== "link" && childTag !== "meta") {
                    children.push(extractNode(child, depth + 1, rect));
                  }
                }
              }

              const bg = cs.backgroundColor;
              const fills: any[] = [];
              if (cs.backgroundImage && cs.backgroundImage !== "none" && (cs.backgroundImage.includes("gradient") || cs.backgroundImage.includes("radial-gradient"))) {
                fills.push({
                  type: cs.backgroundImage.includes("radial-gradient") ? "GRADIENT_RADIAL" : "GRADIENT_LINEAR",
                  rawGradient: cs.backgroundImage,
                  opacity: parseFloat(cs.opacity) || 1,
                });
              } else if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
                const { hex, alpha } = parseColorAndAlpha(bg);
                if (alpha > 0) {
                  fills.push({
                    type: "SOLID",
                    color: hex,
                    opacity: alpha * (parseFloat(cs.opacity) || 1),
                  });
                }
              }

              let imageUrl: string | undefined;
              if (tag === "img") {
                imageUrl = (el as HTMLImageElement).src || el.getAttribute("src") || undefined;
              } else if (cs.backgroundImage && cs.backgroundImage !== "none" && cs.backgroundImage.includes("url(")) {
                const match = cs.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (match && match[1] && !match[1].startsWith("data:image/svg")) {
                  imageUrl = match[1];
                }
              }

              const strokes: any[] = [];
              const borderW = parseFloat(cs.borderWidth) || 0;
              const borderC = cs.borderColor;
              if (borderW > 0 && borderC && borderC !== "transparent" && borderC !== "rgba(0, 0, 0, 0)") {
                const { hex, alpha } = parseColorAndAlpha(borderC);
                if (alpha > 0) {
                  strokes.push({
                    color: hex,
                    weight: borderW,
                    opacity: alpha,
                    position: "INSIDE",
                    dashPattern: [],
                  });
                }
              }

              // Effects extraction: box-shadow, backdrop-filter, filter
              const effects: any[] = [];
              const boxShadow = cs.boxShadow;
              if (boxShadow && boxShadow !== "none") {
                const shadowParts = boxShadow.split(/,(?![^(]*\))/);
                for (const part of shadowParts) {
                  const trimmed = part.trim();
                  if (!trimmed) continue;
                  const isInner = trimmed.includes("inset");
                  const clean = trimmed.replace("inset", "").trim();
                  let colorHex = "#000000";
                  let colorAlpha = 0.08;
                  const colorMatch = clean.match(/rgba?\([^)]+\)/);
                  if (colorMatch) {
                    const parsed = parseColorAndAlpha(colorMatch[0]);
                    colorHex = parsed.hex;
                    colorAlpha = parsed.alpha;
                  }
                  const pxMatches = clean.replace(/rgba?\([^)]+\)/, "").match(/-?[\d.]+px|-?\d+/g);
                  if (pxMatches && pxMatches.length >= 2) {
                    const ox = parseFloat(pxMatches[0]) || 0;
                    const oy = parseFloat(pxMatches[1]) || 0;
                    const blur = pxMatches.length >= 3 ? parseFloat(pxMatches[2]) || 0 : 4;
                    const spread = pxMatches.length >= 4 ? parseFloat(pxMatches[3]) || 0 : 0;
                    effects.push({
                      type: isInner ? "INNER_SHADOW" : "DROP_SHADOW",
                      color: colorHex,
                      opacity: colorAlpha,
                      offset: { x: ox, y: oy },
                      radius: blur,
                      spread,
                      visible: true,
                    });
                  }
                }
              }

              const backdropFilter = cs.backdropFilter || (cs as any).webkitBackdropFilter;
              if (backdropFilter && backdropFilter !== "none" && backdropFilter.includes("blur(")) {
                const blurMatch = backdropFilter.match(/blur\(\s*([\d.]+)px\s*\)/);
                if (blurMatch) {
                  effects.push({
                    type: "BACKGROUND_BLUR",
                    radius: Math.round(parseFloat(blurMatch[1])),
                    visible: true,
                  });
                }
              }

              const filter = cs.filter;
              if (filter && filter !== "none" && filter.includes("blur(")) {
                const blurMatch = filter.match(/blur\(\s*([\d.]+)px\s*\)/);
                if (blurMatch) {
                  effects.push({
                    type: "LAYER_BLUR",
                    radius: Math.round(parseFloat(blurMatch[1])),
                    visible: true,
                  });
                }
              }

              const display = cs.display;
              const flexDir = cs.flexDirection;
              const justifyContent = cs.justifyContent;
              const alignItems = cs.alignItems;
              const gap = parseFloat(cs.gap) || parseFloat(cs.columnGap) || 0;

              const isFlex = display === "flex" || display === "inline-flex";
              const hasVisualFrame = fills.length > 0 || strokes.length > 0 || effects.length > 0 || (parseFloat(cs.paddingTop) || 0) > 0 || (parseFloat(cs.paddingLeft) || 0) > 0 || (parseFloat(cs.borderRadius) || 0) > 0;
              const isTextEl = tag !== "img" && tag !== "svg" && children.length === 0 && (el.textContent || "").trim().length > 0 && !hasVisualFrame;
              const direction = isFlex ? (flexDir === "column" ? "VERTICAL" : "HORIZONTAL") : (hasVisualFrame ? "HORIZONTAL" : "NONE");

              const relX = parentRect ? Math.max(0, rect.left - parentRect.left) : rect.left;
              const relY = parentRect ? Math.max(0, rect.top - parentRect.top) : rect.top;

              const bounds = {
                x: Math.round(relX),
                y: Math.round(relY),
                width: Math.max(1, Math.round(rect.width)),
                height: Math.max(1, Math.round(rect.height)),
              };

              let alignment: any = "TOP_LEFT";
              if ((justifyContent === "center" && alignItems === "center") || cs.textAlign === "center") alignment = "CENTER";
              else if (justifyContent === "center") alignment = "TOP_CENTER";
              else if (alignItems === "center") alignment = "CENTER_LEFT";
              else if (alignItems === "flex-end") alignment = "BOTTOM_LEFT";

              const layout = {
                direction,
                primaryAxisSizing: "HUG",
                counterAxisSizing: "HUG",
                paddingTop: parseFloat(cs.paddingTop) || 0,
                paddingRight: parseFloat(cs.paddingRight) || 0,
                paddingBottom: parseFloat(cs.paddingBottom) || 0,
                paddingLeft: parseFloat(cs.paddingLeft) || 0,
                itemSpacing: gap,
                alignment,
                wrap: cs.flexWrap === "wrap",
              };

              const childLayout = {
                layoutAlign: cs.alignSelf === "stretch" ? "STRETCH" : "INHERIT",
                layoutGrow: parseFloat(cs.flexGrow) > 0 ? 1 : 0,
              };

              // If this is a container with visual background/border and text but no child elements, synthesize a text child
              if (!isTextEl && tag !== "img" && tag !== "svg" && children.length === 0 && (el.textContent || "").trim().length > 0) {
                const textContent = (el.textContent || "").trim();
                const padLeft = parseFloat(cs.paddingLeft) || 0;
                const padTop = parseFloat(cs.paddingTop) || 0;
                children.push({
                  type: "TEXT",
                  name: textContent.slice(0, 30),
                  bounds: {
                    x: padLeft,
                    y: padTop,
                    width: Math.max(1, bounds.width - padLeft - (parseFloat(cs.paddingRight) || 0)),
                    height: Math.max(1, bounds.height - padTop - (parseFloat(cs.paddingBottom) || 0)),
                  },
                  layout: { direction: "NONE" },
                  childLayout: { layoutAlign: "INHERIT", layoutGrow: 0 },
                  constraints: { horizontal: "LEFT", vertical: "TOP" },
                  style: { fills: [], strokes: [], effects: [], cornerRadius: 0, opacity: 1, clipsContent: false, visible: true },
                  text: {
                    content: textContent,
                    fontFamily: (cs.fontFamily || "Inter").split(",")[0].replace(/['"]/g, "").trim() || "Inter",
                    fontWeight: mapFontWeight(cs.fontWeight),
                    fontSize: Math.max(8, parseFloat(cs.fontSize) || 14),
                    letterSpacing: parseFloat(cs.letterSpacing) || 0,
                    textAlign: cs.textAlign === "center" ? "CENTER" : cs.textAlign === "right" ? "RIGHT" : "LEFT",
                    textCase: cs.textTransform === "uppercase" ? "UPPER" : cs.textTransform === "lowercase" ? "LOWER" : "ORIGINAL",
                    textDecoration: cs.textDecorationLine?.includes("underline") ? "UNDERLINE" : "NONE",
                    color: parseColorToHex(cs.color),
                    opacity: 1,
                  },
                });
              }

              const nodeType = tag === "svg" ? "VECTOR" : (tag === "img" ? "IMAGE" : (isTextEl ? "TEXT" : "FRAME"));
              const node: any = {
                type: nodeType,
                name: (el.getAttribute("class") || el.tagName).replace(/\s+/g, " ").trim().slice(0, 40) || (isTextEl ? "Text" : "Frame"),
                bounds,
                layout,
                childLayout,
                constraints: { horizontal: "LEFT", vertical: "TOP" },
                style: {
                  fills,
                  strokes,
                  effects,
                  cornerRadius: parseFloat(cs.borderRadius) || 0,
                  opacity: parseFloat(cs.opacity) || 1,
                  clipsContent: cs.overflow === "hidden" || cs.overflowX === "hidden" || cs.overflowY === "hidden",
                  visible: cs.display !== "none" && cs.visibility !== "hidden",
                  position: (cs.position === "absolute" || cs.position === "fixed") ? "absolute" : undefined,
                },
                children: (isTextEl || tag === "svg" || tag === "img") ? undefined : children,
              };

              if (imageUrl) {
                node.imageUrl = imageUrl;
              }
              if (tag === "svg") {
                node.svgContent = el.outerHTML;
              }

              if (isTextEl) {
                const textContent = (el.textContent || "").trim();
                node.text = {
                  content: textContent,
                  fontFamily: (cs.fontFamily || "Inter").split(",")[0].replace(/['"]/g, "").trim() || "Inter",
                  fontWeight: mapFontWeight(cs.fontWeight),
                  fontSize: Math.max(8, parseFloat(cs.fontSize) || 14),
                  letterSpacing: parseFloat(cs.letterSpacing) || 0,
                  textAlign: cs.textAlign === "center" ? "CENTER" : cs.textAlign === "right" ? "RIGHT" : "LEFT",
                  textCase: cs.textTransform === "uppercase" ? "UPPER" : cs.textTransform === "lowercase" ? "LOWER" : "ORIGINAL",
                  textDecoration: cs.textDecorationLine?.includes("underline") ? "UNDERLINE" : "NONE",
                  color: parseColorToHex(cs.color),
                  opacity: 1,
                };
              }

              return node;
            }

            const rootNode = extractNode(iDoc.body, 0, null);
            document.body.removeChild(iframe);

            const bodyStyle = iWin.getComputedStyle(iDoc.body);
            const docTitle = (payload as any).title || iDoc.title || iDoc.querySelector("h1, h2, .brand, .logo")?.textContent?.trim() || "Design";
            const fullContentHeight = Math.max(
              iDoc.body.scrollHeight || 0,
              iDoc.documentElement?.scrollHeight || 0,
              Math.round(iDoc.body.getBoundingClientRect().height || 0)
            );
            const docWidth = (payload as any).width || Math.max(100, Math.round(iDoc.body.getBoundingClientRect().width || targetWidth));
            const docHeight = (payload as any).height || Math.max(100, fullContentHeight);
            const bodyFlexDir = bodyStyle.display.includes("flex")
              ? (bodyStyle.flexDirection === "column" ? "VERTICAL" : "HORIZONTAL")
              : (rootNode.layout?.direction || "NONE");

            rootNode.name = docTitle;
            rootNode.bounds = { x: 0, y: 0, width: docWidth, height: docHeight };
            rootNode.layout.direction = bodyFlexDir;
            rootNode.layout.paddingTop = parseFloat(bodyStyle.paddingTop) || 0;
            rootNode.layout.paddingRight = parseFloat(bodyStyle.paddingRight) || 0;
            rootNode.layout.paddingBottom = parseFloat(bodyStyle.paddingBottom) || 0;
            rootNode.layout.paddingLeft = parseFloat(bodyStyle.paddingLeft) || 0;
            rootNode.layout.itemSpacing = parseFloat(bodyStyle.gap) || parseFloat(bodyStyle.rowGap) || 0;
            if (bodyStyle.alignItems === "center" || bodyStyle.justifyContent === "center") {
              rootNode.layout.alignment = "CENTER";
            }
            rootNode.style.clipsContent = bodyStyle.overflow === "hidden" || bodyStyle.overflowX === "hidden" || bodyStyle.overflowY === "hidden";

            // Build compliant DesignAnalysis
            const analysis = {
              rootFrame: rootNode,
              assets: [],
              components: [],
              colorTokens: [],
              textStyles: [],
              shadowTokens: [],
              metadata: {
                pageName: docTitle,
                deviceType: docWidth < 600 ? "mobile" : docWidth < 1000 ? "tablet" : "desktop",
                timestamp: Date.now(),
                viewportWidth: docWidth,
                viewportHeight: docHeight,
                isWebsite: true,
              },
            };

            const buildResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set("CURRENT_GENERATION", resolve);
              sendMessageRef.current({
                type: "START_GENERATION",
                payload: {
                  analysisJson: JSON.stringify(analysis),
                  imageBase64: "",
                  settings: { ...settingsRef.current, createAutoLayout: payload.autoLayout !== false },
                },
              });
              setTimeout(() => resolve({ success: false, error: "Timed out after 90s" }), 90000);
            });

            updateLogRef.current(logId, buildResult.success ? "success" : "error", buildResult.frameName || (buildResult.error ?? "Done"));
            ws.send(JSON.stringify({ id, success: buildResult.success, data: buildResult, error: buildResult.error }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }

        if (type === "ADJUST_MOBILE_LAYOUT") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is currently busy. Please wait." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Mobile Adjust", "pending", "Optimizing mobile layout and spacing in Figma...");

          try {
            const adjustResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set(id, resolve);
              sendMessageRef.current({ type: "EXECUTE_ADJUST_MOBILE_LAYOUT", payload: { requestId: id, ...payload } });
              setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                  pendingRequestsRef.current.delete(id);
                  resolve({ success: false, error: "Timed out adjusting mobile layout" });
                }
              }, 40000);
            });

            if (!adjustResult || !adjustResult.success) {
              throw new Error(adjustResult?.error || "Failed to adjust mobile layout");
            }

            updateLogRef.current(logId, "success", `Mobile layout optimized: ${adjustResult.nodesAdjusted || "all"} nodes!`);
            ws.send(JSON.stringify({ id, success: true, data: adjustResult }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }

        if (type === "ADD_PROTOTYPE_EFFECTS") {
          if (isBusyRef.current) {
            ws.send(JSON.stringify({ id, success: false, error: "Figma is currently busy. Please wait." }));
            return;
          }
          isBusyRef.current = true;
          const logId = Math.random().toString(36).substring(2, 9);
          addLogRef.current("Prototype Effects", "pending", "Adding prototype animations and interactive effects...");

          try {
            const effectsResult = await new Promise<any>((resolve) => {
              pendingRequestsRef.current.set(id, resolve);
              sendMessageRef.current({ type: "EXECUTE_ADD_PROTOTYPE_EFFECTS", payload: { requestId: id, ...payload } });
              setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                  pendingRequestsRef.current.delete(id);
                  resolve({ success: false, error: "Timed out adding prototype effects" });
                }
              }, 40000);
            });

            if (!effectsResult || !effectsResult.success) {
              throw new Error(effectsResult?.error || "Failed to add prototype effects");
            }

            updateLogRef.current(logId, "success", `Prototype effects ready: ${effectsResult.effectsAdded || 0} interactions wired!`);
            ws.send(JSON.stringify({ id, success: true, data: effectsResult }));
          } catch (err: any) {
            updateLogRef.current(logId, "error", err.message);
            ws.send(JSON.stringify({ id, success: false, error: err.message }));
          } finally {
            isBusyRef.current = false;
          }
          return;
        }

        // Unknown command
        ws.send(JSON.stringify({ id, success: false, error: `Unsupported command: ${type}` }));
      } catch (err) {
        console.error("[AgentBridgeView] Message handling error:", err);
      }
    };
  }, []);

  // Keep connection alive with heartbeat and auto-reconnect
  useEffect(() => {
    isMountedRef.current = true;
    connectBridge();
    const interval = setInterval(() => {
      if (
        isMountedRef.current &&
        (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)
      ) {
        connectBridge();
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectBridge]);

  const testPing = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog("Ping Test", "error", "Bridge is offline. Start the backend first.");
      return;
    }
    const t0 = performance.now();
    wsRef.current.send(JSON.stringify({ type: "PLUGIN_PING", timestamp: Date.now() }));
    setTimeout(() => {
      const lat = Math.round(performance.now() - t0);
      setPingLatency(lat);
      addLog("Ping Test", "success", `Roundtrip bridge latency: ${lat}ms`);
    }, 50);
  };

  const copyMcpConfig = () => {
    const configSnippet = JSON.stringify(
      {
        mcpServers: {
          "designforge-ai": {
            "command": "node",
            "args": [
              "c:/Users/brijesh9177/Desktop/Projects/photo-to-design/packages/backend/bin/mcp-server.js"
            ]
          }
        }
      },
      null,
      2
    );

    navigator.clipboard.writeText(configSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "var(--text-primary)" }}>
      {/* Status Card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: connectionStatus === "connected" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: `1px solid ${connectionStatus === "connected" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: connectionStatus === "connected" ? "#10b981" : "#ef4444",
              boxShadow: connectionStatus === "connected" ? "0 0 8px #10b981" : "none",
            }}
          />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700 }}>
              {connectionStatus === "connected" ? "Agent Bridge Online" : "Bridge Disconnected"}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
              {connectionStatus === "connected"
                ? "Listening on ws://localhost:3001/bridge"
                : "Ensure 'pnpm dev:backend' is running locally"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => {
              sendMessageRef.current({
                type: "EXECUTE_ADJUST_MOBILE_LAYOUT",
                payload: { requestId: Math.random().toString(36).substring(2, 9), viewportWidth: 390 },
              });
            }}
            style={{
              padding: "5px 10px",
              fontSize: "11px",
              fontWeight: 600,
              background: "var(--accent-primary)",
              border: "none",
              borderRadius: "6px",
              color: "#ffffff",
              cursor: "pointer",
            }}
            title="Convert selected frame to responsive Mobile UI (390px)"
          >
            📱 Mobile UI (390px)
          </button>
          <button
            onClick={() => {
              sendMessageRef.current({
                type: "EXECUTE_ADD_PROTOTYPE_EFFECTS",
                payload: { requestId: Math.random().toString(36).substring(2, 9) },
              });
            }}
            style={{
              padding: "5px 10px",
              fontSize: "11px",
              fontWeight: 600,
              background: "#6366f1",
              border: "none",
              borderRadius: "6px",
              color: "#ffffff",
              cursor: "pointer",
            }}
            title="Add animations, sticky header, smooth scrolling, and effects to mobile prototype"
          >
            ✨ Prototype Effects
          </button>
          <button
            onClick={testPing}
            style={{
              padding: "5px 10px",
              fontSize: "11px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            ⚡ Test Ping {pingLatency !== null ? `(${pingLatency}ms)` : ""}
          </button>
        </div>
      </div>

      {/* Instructions Card */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "8px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
          <span>📖</span> How to Use with Antigravity
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", lineHeight: "1.5" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>1.</span>
            <span>
              Verify backend is running locally: <code>pnpm dev:backend</code> (port 3001).
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>2.</span>
            <span>
              Add the MCP configuration to <code>~/.gemini/config/mcp_config.json</code>:
            </span>
          </div>

          <button
            onClick={copyMcpConfig}
            style={{
              padding: "7px 12px",
              background: copied ? "#10b981" : "var(--accent-primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background 0.2s ease",
            }}
          >
            {copied ? "✓ Copied to Clipboard!" : "📋 Copy Antigravity MCP Config"}
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>3.</span>
            <span>
              Keep this <strong>🔌 Agent Bridge</strong> tab open in Figma so incoming commands are received.
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>4.</span>
            <span>
              Prompt Antigravity directly in chat:
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                <li><em>"Convert https://shinefoods.in to design with Auto Layout"</em></li>
                <li><em>"What layers are selected in Figma right now?"</em></li>
                <li><em>"Generate a modern dark pricing card in Figma"</em></li>
              </ul>
            </span>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "8px",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: 700 }}>📡 Live Activity Stream</div>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "10px",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div
          style={{
            maxHeight: "180px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "11px",
            fontFamily: "monospace",
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
              Waiting for agent commands from Antigravity...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: "6px 8px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${
                    log.status === "success" ? "#10b981" : log.status === "error" ? "#ef4444" : "#f59e0b"
                  }`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)" }}>
                  <span>{log.command}</span>
                  <span>{log.time}</span>
                </div>
                <div style={{ marginTop: "2px", color: "var(--text-primary)", wordBreak: "break-word" }}>
                  {log.details}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
