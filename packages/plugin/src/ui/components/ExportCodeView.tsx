/**
 * DesignForge AI — Export Code View
 *
 * Extracts clean, modern HTML & CSS directly from any selected Figma frame.
 * 100% offline, zero AI/API key dependencies.
 * Features a fully stretchable workstation:
 * - Draggable splitter to freely stretch preview & code panes
 * - 1-click Full Preview (100% width) / Split / Full Code presets
 * - Auto-Fit Scale to dynamically scale desktop designs to any width
 * - Fluid stretch & responsive device presets (1440, 1024, 768, 375)
 * - Window Expand toggle (980px ↔ 1280px)
 * - 100% full-height vertical stretch
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import JSZip from "jszip";
import { useFigmaMessages } from "../hooks/useFigmaMessages";

interface SelectedFrameInfo {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  layoutMode?: string;
  childrenCount: number;
}

interface ExportedAsset {
  filename: string;
  relativePath: string;
  base64: string;
  mimeType: string;
}

export const ExportCodeView: React.FC = () => {
  const { sendMessage } = useFigmaMessages();

  const [selectedFrame, setSelectedFrame] = useState<SelectedFrameInfo | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Extracted code state
  const [extractedHtml, setExtractedHtml] = useState<string>("");
  const [extractedCss, setExtractedCss] = useState<string>("");
  const [combinedHtml, setCombinedHtml] = useState<string>("");
  const [nodeCount, setNodeCount] = useState<number>(0);
  const [assets, setAssets] = useState<ExportedAsset[]>([]);

  // UI state
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "css" | "combined">("html");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Stretchable Layout & Pane states
  const [viewMode, setViewMode] = useState<"split" | "full-preview" | "full-code">("split");
  const [splitPercent, setSplitPercent] = useState<number>(44); // Left (code) width %
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isWindowExpanded, setIsWindowExpanded] = useState<boolean>(false);

  // Preview stretch & scaling state
  // "fit" = dynamically scale to fit preview container
  // "fluid" = 100% width responsive
  // "1440" | "1024" | "768" | "375" = fixed device presets
  const [previewMode, setPreviewMode] = useState<"fit" | "fluid" | "1440" | "1024" | "768" | "375">("fit");
  const [zoomScale, setZoomScale] = useState<number | null>(null); // Custom override or null for auto

  // Container measurement refs
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(500);

  // Request selection on mount
  useEffect(() => {
    sendMessage({ type: "GET_CANVAS_SELECTION" });
  }, [sendMessage]);

  // Adjust window size on code extraction
  useEffect(() => {
    if (extractedHtml || extractedCss) {
      const width = isWindowExpanded ? 1280 : 980;
      const height = isWindowExpanded ? 820 : 720;
      sendMessage({ type: "RESIZE_WINDOW", payload: { width, height } });
    } else {
      sendMessage({ type: "RESIZE_WINDOW", payload: { width: 460, height: 660 } });
    }
  }, [extractedHtml, extractedCss, isWindowExpanded, sendMessage]);

  // Listen for messages from plugin sandbox
  useEffect(() => {
    const handlePluginMessage = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === "CANVAS_SELECTION_RESULT") {
        const selection = msg.payload?.selection || [];
        if (selection.length > 0) {
          setSelectedFrame(selection[0]);
        } else {
          setSelectedFrame(null);
        }
      } else if (msg.type === "FRAME_CODE_EXPORTED") {
        setIsExtracting(false);
        if (msg.payload?.success) {
          setExtractedHtml(msg.payload.html || "");
          setExtractedCss(msg.payload.css || "");
          setCombinedHtml(msg.payload.combinedHtml || "");
          setNodeCount(msg.payload.nodeCount || 0);
          setAssets(msg.payload.assets || []);
          setExtractError(null);
        } else {
          setExtractError(msg.payload?.error || "Failed to extract code from frame.");
        }
      }
    };

    window.addEventListener("message", handlePluginMessage);
    return () => window.removeEventListener("message", handlePluginMessage);
  }, []);

  // Measure preview viewport width for auto-fit scaling
  useEffect(() => {
    if (!previewViewportRef.current) return;
    const el = previewViewportRef.current;

    const measure = () => {
      if (el) {
        setViewportWidth(el.clientWidth - 24); // accounts for 12px padding on each side
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode, splitPercent, isWindowExpanded]);

  // Draggable Splitter Mouse Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const offset = e.clientX - rect.left;
      const newPercent = Math.max(16, Math.min(84, (offset / rect.width) * 100));
      setSplitPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleExtract = () => {
    setIsExtracting(true);
    setExtractError(null);
    sendMessage({
      type: "EXPORT_FRAME_CODE",
      payload: {
        nodeId: selectedFrame?.id,
      },
    });
  };

  const handleRefreshSelection = () => {
    sendMessage({ type: "GET_CANVAS_SELECTION" });
  };

  const handleCopy = async (type: "html" | "css" | "combined") => {
    let text = "";
    if (type === "html") text = extractedHtml;
    else if (type === "css") text = extractedCss;
    else text = combinedHtml;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleDownloadHtml = () => {
    const filename = `${(selectedFrame?.name || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    const blob = new Blob([combinedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      const baseName = (selectedFrame?.name || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-");

      zip.file("index.html", extractedHtml);
      zip.file("style.css", extractedCss);

      // Add assets/ folder to ZIP
      if (assets && assets.length > 0) {
        const assetsFolder = zip.folder("assets");
        if (assetsFolder) {
          for (const asset of assets) {
            const cleanBase64 = asset.base64.replace(/^data:[^;]+;base64,/, "");
            assetsFolder.file(asset.filename, cleanBase64, { base64: true });
          }
        }
      }

      zip.file(
        "README.md",
        `# ${selectedFrame?.name || "Exported Design"}

Exported from Figma using DesignForge AI (Zero AI / Direct DOM extraction).

## Project Structure:
- \`index.html\`: Semantic HTML structure
- \`style.css\`: Complete CSS styles
- \`assets/\`: Extracted visual assets (${assets.length} file${assets.length === 1 ? "" : "s"})

Open \`index.html\` in any web browser to preview.`
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseName}-code.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to create ZIP: ${err.message || String(err)}`);
    }
  };

  const handleToggleExpandWindow = () => {
    const next = !isWindowExpanded;
    setIsWindowExpanded(next);
    sendMessage({
      type: "RESIZE_WINDOW",
      payload: {
        width: next ? 1280 : 980,
        height: next ? 820 : 720,
      },
    });
  };

  const handleReset = () => {
    setExtractedHtml("");
    setExtractedCss("");
    setCombinedHtml("");
    setNodeCount(0);
    setAssets([]);
    setExtractError(null);
    sendMessage({ type: "RESIZE_WINDOW", payload: { width: 460, height: 660 } });
  };

  // ─── INITIAL VIEW: Select Frame to Extract ───────────────────────
  if (!extractedHtml && !extractedCss) {
    return (
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Header Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>&lt;/&gt;</span> Export HTML & CSS
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              Convert any Figma frame into clean code · 100% offline & zero AI required
            </p>
          </div>
          <button
            onClick={handleRefreshSelection}
            title="Refresh canvas selection"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🔄 Sync
          </button>
        </div>

        {/* Frame Selection Card */}
        {selectedFrame ? (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(21, 94, 239, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "rgba(21, 94, 239, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  🖼️
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      maxWidth: "240px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedFrame.name}
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                    {selectedFrame.width} × {selectedFrame.height} px
                    {selectedFrame.layoutMode && selectedFrame.layoutMode !== "NONE"
                      ? ` · Auto Layout (${selectedFrame.layoutMode})`
                      : " · Freeform"}
                  </p>
                </div>
              </div>
              <span
                style={{
                  background: "rgba(18, 183, 106, 0.15)",
                  color: "#12B76A",
                  border: "1px solid rgba(18, 183, 106, 0.3)",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                ● Ready
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                padding: "10px",
                background: "rgba(0,0,0,0.15)",
                borderRadius: "6px",
                fontSize: "11px",
              }}
            >
              <div style={{ color: "var(--text-secondary)" }}>
                Layers: <strong style={{ color: "var(--text-primary)" }}>{selectedFrame.childrenCount} direct</strong>
              </div>
              <div style={{ color: "var(--text-secondary)" }}>
                Type: <strong style={{ color: "var(--text-primary)" }}>{selectedFrame.type}</strong>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "24px 16px",
              border: "1.5px dashed var(--border-default)",
              borderRadius: "10px",
              textAlign: "center",
              background: "var(--bg-secondary)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "28px" }}>👆</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              Select a frame on canvas
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, maxWidth: "260px" }}>
              Click on any frame, card, section, or page design in Figma to extract its full HTML & CSS.
            </p>
            <button
              onClick={handleRefreshSelection}
              className="btn btn--secondary"
              style={{ fontSize: "11px", padding: "6px 12px", marginTop: "4px" }}
            >
              🔄 Detect Selected Frame
            </button>
          </div>
        )}

        {/* Extraction Button */}
        <button
          onClick={handleExtract}
          disabled={!selectedFrame || isExtracting}
          className="btn btn--primary btn--full btn--lg"
          style={{
            fontSize: "13px",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 14px rgba(21, 94, 239, 0.3)",
          }}
        >
          {isExtracting ? (
            <>
              <div className="spinner" style={{ width: "16px", height: "16px" }} />
              <span>Extracting HTML & CSS...</span>
            </>
          ) : (
            <>
              <span>&lt;/&gt;</span>
              <span>Extract HTML & CSS</span>
            </>
          )}
        </button>

        {extractError && (
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(240, 68, 56, 0.1)",
              border: "1px solid rgba(240, 68, 56, 0.3)",
              color: "#F04438",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            ⚠️ {extractError}
          </div>
        )}

        {/* Feature Highlights */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginTop: "6px",
          }}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-default)",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "3px" }}>
              ⚡ 100% Offline
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
              Direct Figma node tree conversion. Zero AI API keys.
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-secondary)",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-default)",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "3px" }}>
              📦 Stretchable Preview
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
              Draggable split panes, live interactive scaling & full preview.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STRETCHABLE WORKSTATION VIEW ─────────────────────────────────

  const activeCode =
    activeCodeTab === "html" ? extractedHtml : activeCodeTab === "css" ? extractedCss : combinedHtml;

  // Compute scale factor for Auto-Fit
  const designWidth = selectedFrame?.width || 1440;
  const designHeight = selectedFrame?.height || 900;
  const autoFitScale = viewportWidth > 0 ? Math.min(1, viewportWidth / designWidth) : 1;
  const effectiveScale = zoomScale !== null ? zoomScale : previewMode === "fit" ? autoFitScale : 1;

  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "100%",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Invisible overlay during drag to prevent iframe stealing mouse events */}
      {isDragging && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            cursor: "col-resize",
            userSelect: "none",
          }}
        />
      )}

      {/* Top Action Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-secondary)",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-default)",
          flexWrap: "wrap",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {/* Left: Frame Info & Reset */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleReset}
            title="Extract another frame"
            style={{
              background: "transparent",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px" }}>🖼️</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
                maxWidth: "180px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedFrame?.name || "Frame"}
            </span>
            <span
              style={{
                fontSize: "10px",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38BDF8",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              {nodeCount} nodes
            </span>
            {assets.length > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  background: "rgba(34, 197, 94, 0.15)",
                  color: "#22C55E",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                🖼️ {assets.length} {assets.length === 1 ? "asset" : "assets"}
              </span>
            )}
          </div>
        </div>

        {/* Center: View Layout Switcher (Split / Full Preview / Full Code) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--bg-tertiary)",
            padding: "2px",
            borderRadius: "6px",
            border: "1px solid var(--border-default)",
            gap: "2px",
          }}
        >
          <button
            onClick={() => setViewMode("split")}
            title="Split View (Draggable divider)"
            style={{
              padding: "4px 9px",
              borderRadius: "4px",
              border: "none",
              background: viewMode === "split" ? "var(--accent-primary)" : "transparent",
              color: viewMode === "split" ? "#ffffff" : "var(--text-secondary)",
              fontSize: "10.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "var(--transition-fast)",
            }}
          >
            <span>◫</span> Split
          </button>
          <button
            onClick={() => setViewMode("full-preview")}
            title="Full Preview (Stretch across entire window)"
            style={{
              padding: "4px 9px",
              borderRadius: "4px",
              border: "none",
              background: viewMode === "full-preview" ? "var(--accent-primary)" : "transparent",
              color: viewMode === "full-preview" ? "#ffffff" : "var(--text-secondary)",
              fontSize: "10.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "var(--transition-fast)",
            }}
          >
            <span>👁️</span> Full Preview
          </button>
          <button
            onClick={() => setViewMode("full-code")}
            title="Full Code (Full width editor)"
            style={{
              padding: "4px 9px",
              borderRadius: "4px",
              border: "none",
              background: viewMode === "full-code" ? "var(--accent-primary)" : "transparent",
              color: viewMode === "full-code" ? "#ffffff" : "var(--text-secondary)",
              fontSize: "10.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "var(--transition-fast)",
            }}
          >
            <span>📄</span> Full Code
          </button>
        </div>

        {/* Right: Export & Copy Actions + Window Expand */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Copy Button */}
          <button
            onClick={() => handleCopy(activeCodeTab)}
            className="btn btn--secondary"
            style={{
              padding: "4px 9px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>{copiedType === activeCodeTab ? "✓" : "📋"}</span>
            <span>{copiedType === activeCodeTab ? "Copied!" : `Copy ${activeCodeTab.toUpperCase()}`}</span>
          </button>

          {/* Download HTML Button */}
          <button
            onClick={handleDownloadHtml}
            className="btn btn--secondary"
            title="Download single .html file"
            style={{
              padding: "4px 9px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>⬇</span>
            <span>.html</span>
          </button>

          {/* Download ZIP Button */}
          <button
            onClick={handleDownloadZip}
            className="btn btn--primary"
            title="Download index.html + style.css as ZIP"
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>📦</span>
            <span>ZIP</span>
          </button>

          {/* Window Expand Toggle Button */}
          <button
            onClick={handleToggleExpandWindow}
            title={isWindowExpanded ? "Contract window to 980px" : "Expand window to 1280px for wide workstation"}
            style={{
              background: isWindowExpanded ? "rgba(99, 102, 241, 0.2)" : "transparent",
              border: "1px solid var(--border-default)",
              color: isWindowExpanded ? "var(--accent-primary)" : "var(--text-secondary)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {isWindowExpanded ? "⤡ 980px" : "⤢ 1280px"}
          </button>
        </div>
      </div>

      {/* Main Stretchable Split-Pane Content */}
      <div
        ref={splitContainerRef}
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          height: "100%",
          position: "relative",
          overflow: "hidden",
          userSelect: isDragging ? "none" : "auto",
        }}
      >
        {/* ─── LEFT PANE: CODE EDITOR ─── */}
        <div
          style={{
            width: viewMode === "full-code" ? "100%" : viewMode === "full-preview" ? "0%" : `${splitPercent}%`,
            display: viewMode === "full-preview" ? "none" : "flex",
            flexDirection: "column",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            overflow: "hidden",
            flexShrink: 0,
            transition: isDragging ? "none" : "width 0.15s ease",
          }}
        >
          {/* Editor Tab Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-tertiary)",
              padding: "5px 10px",
              borderBottom: "1px solid var(--border-default)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => setActiveCodeTab("html")}
                style={{
                  padding: "4px 9px",
                  borderRadius: "4px",
                  border: "none",
                  background: activeCodeTab === "html" ? "var(--bg-primary)" : "transparent",
                  color: activeCodeTab === "html" ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "11px",
                  fontWeight: activeCodeTab === "html" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                index.html
              </button>
              <button
                onClick={() => setActiveCodeTab("css")}
                style={{
                  padding: "4px 9px",
                  borderRadius: "4px",
                  border: "none",
                  background: activeCodeTab === "css" ? "var(--bg-primary)" : "transparent",
                  color: activeCodeTab === "css" ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "11px",
                  fontWeight: activeCodeTab === "css" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                style.css
              </button>
              <button
                onClick={() => setActiveCodeTab("combined")}
                style={{
                  padding: "4px 9px",
                  borderRadius: "4px",
                  border: "none",
                  background: activeCodeTab === "combined" ? "var(--bg-primary)" : "transparent",
                  color: activeCodeTab === "combined" ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "11px",
                  fontWeight: activeCodeTab === "combined" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                Single File
              </button>
            </div>

            <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
              {activeCode.split("\n").length} lines · {(activeCode.length / 1024).toFixed(1)} KB
            </span>
          </div>

          {/* Monospace Code Display */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "12px",
              background: "#080d1a",
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: "11.5px",
              lineHeight: 1.55,
              color: "#d1d5db",
              whiteSpace: "pre",
              userSelect: "text",
            }}
          >
            {activeCode}
          </div>
        </div>

        {/* ─── DRAGGABLE RESIZE SPLITTER ─── */}
        {viewMode === "split" && (
          <div
            onMouseDown={handleMouseDown}
            title="Click and drag to stretch the preview or code pane"
            style={{
              width: "12px",
              cursor: "col-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              userSelect: "none",
              zIndex: 20,
              position: "relative",
            }}
          >
            {/* Grab bar indicator */}
            <div
              style={{
                width: isDragging ? "4px" : "3px",
                height: "56px",
                borderRadius: "4px",
                background: isDragging ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.2)",
                boxShadow: isDragging ? "0 0 12px var(--accent-primary)" : "none",
                transition: "background 0.15s, width 0.15s, height 0.15s",
              }}
            />
          </div>
        )}

        {/* ─── RIGHT PANE: STRETCHABLE LIVE PREVIEW ─── */}
        <div
          style={{
            flex: viewMode === "full-preview" ? "1 1 100%" : "1 1 0%",
            width: viewMode === "full-code" ? "0%" : undefined,
            display: viewMode === "full-code" ? "none" : "flex",
            flexDirection: "column",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            overflow: "hidden",
            minWidth: 0,
            transition: isDragging ? "none" : "width 0.15s ease",
          }}
        >
          {/* Preview Header & Viewport Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-tertiary)",
              padding: "5px 10px",
              borderBottom: "1px solid var(--border-default)",
              flexShrink: 0,
              flexWrap: "wrap",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px" }}>👁️</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>
                Live Preview
              </span>
              <span
                style={{
                  fontSize: "9.5px",
                  color: "var(--text-secondary)",
                  background: "var(--bg-primary)",
                  padding: "1px 5px",
                  borderRadius: "3px",
                }}
              >
                {previewMode === "fit"
                  ? `Fit (${Math.round(effectiveScale * 100)}%)`
                  : previewMode === "fluid"
                  ? "Fluid 100%"
                  : `${previewMode}px`}
              </span>
            </div>

            {/* Viewport / Scale Mode Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
              {/* Fit Stretch */}
              <button
                onClick={() => {
                  setPreviewMode("fit");
                  setZoomScale(null);
                }}
                title="Auto-Fit: Scales and stretches design to fit container width"
                style={{
                  padding: "3px 7px",
                  borderRadius: "4px",
                  border: "none",
                  background: previewMode === "fit" && zoomScale === null ? "var(--accent-primary)" : "transparent",
                  color: previewMode === "fit" && zoomScale === null ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ↔️ Fit
              </button>

              {/* Fluid Responsive */}
              <button
                onClick={() => {
                  setPreviewMode("fluid");
                  setZoomScale(null);
                }}
                title="Fluid: 100% width responsive stretch"
                style={{
                  padding: "3px 7px",
                  borderRadius: "4px",
                  border: "none",
                  background: previewMode === "fluid" ? "var(--accent-primary)" : "transparent",
                  color: previewMode === "fluid" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🌊 Fluid
              </button>

              {/* 1440 Desktop */}
              <button
                onClick={() => {
                  setPreviewMode("1440");
                  setZoomScale(null);
                }}
                title="Desktop 1440px"
                style={{
                  padding: "3px 6px",
                  borderRadius: "4px",
                  border: "none",
                  background: previewMode === "1440" ? "var(--accent-primary)" : "transparent",
                  color: previewMode === "1440" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                🖥️ 1440
              </button>

              {/* 768 Tablet */}
              <button
                onClick={() => {
                  setPreviewMode("768");
                  setZoomScale(null);
                }}
                title="Tablet 768px"
                style={{
                  padding: "3px 6px",
                  borderRadius: "4px",
                  border: "none",
                  background: previewMode === "768" ? "var(--accent-primary)" : "transparent",
                  color: previewMode === "768" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                📱 768
              </button>

              {/* 375 Mobile */}
              <button
                onClick={() => {
                  setPreviewMode("375");
                  setZoomScale(null);
                }}
                title="Mobile 375px"
                style={{
                  padding: "3px 6px",
                  borderRadius: "4px",
                  border: "none",
                  background: previewMode === "375" ? "var(--accent-primary)" : "transparent",
                  color: previewMode === "375" ? "#ffffff" : "var(--text-secondary)",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                📱 375
              </button>

              {/* Zoom In / Out toggles */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--bg-primary)",
                  borderRadius: "4px",
                  border: "1px solid var(--border-default)",
                  marginLeft: "2px",
                }}
              >
                <button
                  onClick={() => setZoomScale((prev) => Math.max(0.2, (prev ?? effectiveScale) - 0.1))}
                  title="Zoom Out"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    padding: "2px 5px",
                    cursor: "pointer",
                    fontSize: "10px",
                  }}
                >
                  −
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  title="100% 1:1 Scale"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    padding: "2px 4px",
                    cursor: "pointer",
                    fontSize: "9px",
                  }}
                >
                  100%
                </button>
                <button
                  onClick={() => setZoomScale((prev) => Math.min(2.0, (prev ?? effectiveScale) + 0.1))}
                  title="Zoom In"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    padding: "2px 5px",
                    cursor: "pointer",
                    fontSize: "10px",
                  }}
                >
                  +
                </button>
              </div>

              {/* Reload Button */}
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                title="Reload Preview"
                style={{
                  padding: "3px 6px",
                  borderRadius: "4px",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "10px",
                  cursor: "pointer",
                  marginLeft: "2px",
                }}
              >
                🔄
              </button>
            </div>
          </div>

          {/* Iframe Viewport Area */}
          <div
            ref={previewViewportRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              background: "#060913",
              padding: "12px",
              position: "relative",
            }}
          >
            {/* Auto-Fit Scaled Viewport */}
            {previewMode === "fit" || zoomScale !== null ? (
              <div
                style={{
                  width: `${Math.round(designWidth * effectiveScale)}px`,
                  height: `${Math.round(designHeight * effectiveScale)}px`,
                  minHeight: `${Math.round(designHeight * effectiveScale)}px`,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
                  borderRadius: "8px",
                  background: "#ffffff",
                  flexShrink: 0,
                  transition: isDragging ? "none" : "width 0.15s ease, height 0.15s ease",
                }}
              >
                <iframe
                  key={iframeKey}
                  srcDoc={combinedHtml}
                  title="Exported Design Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: `${designWidth}px`,
                    height: `${designHeight}px`,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: "top left",
                    border: "none",
                    background: "#ffffff",
                    pointerEvents: isDragging ? "none" : "auto",
                  }}
                />
              </div>
            ) : previewMode === "fluid" ? (
              /* Fluid 100% responsive viewport */
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100%",
                  display: "flex",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <iframe
                  key={iframeKey}
                  srcDoc={combinedHtml}
                  title="Exported Design Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "100%",
                    border: "none",
                    background: "#ffffff",
                    pointerEvents: isDragging ? "none" : "auto",
                  }}
                />
              </div>
            ) : (
              /* Fixed Device Viewport (1440, 1024, 768, 375) */
              <div
                style={{
                  width: `${previewMode}px`,
                  height: `${designHeight}px`,
                  minHeight: "100%",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#ffffff",
                  flexShrink: 0,
                  transition: "width 0.2s ease",
                }}
              >
                <iframe
                  key={iframeKey}
                  srcDoc={combinedHtml}
                  title="Exported Design Preview"
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "100%",
                    border: "none",
                    background: "#ffffff",
                    pointerEvents: isDragging ? "none" : "auto",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
