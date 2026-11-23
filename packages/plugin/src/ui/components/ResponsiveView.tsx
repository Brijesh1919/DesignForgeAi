/**
 * DesignForge AI — Responsive Viewport Converter View
 *
 * Direct tab to convert any selected desktop/tablet design
 * into responsive Mobile (375/390/412), Tablet (768/834), Desktop (1280/1440),
 * or custom viewport breakpoints with 1 click.
 */

import React, { useState, useEffect } from "react";
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

interface DevicePreset {
  id: string;
  category: "mobile" | "tablet" | "desktop";
  label: string;
  width: number;
  description: string;
  icon: string;
  recommended?: boolean;
}

const DEVICE_PRESETS: DevicePreset[] = [
  // Mobile
  {
    id: "mobile-412",
    category: "mobile",
    label: "Android / Pixel",
    width: 412,
    description: "Modern Android & Pixel standard",
    icon: "📱",
    recommended: true,
  },
  {
    id: "mobile-390",
    category: "mobile",
    label: "iPhone 15 / 16",
    width: 390,
    description: "Apple iOS standard viewport",
    icon: "📱",
  },
  {
    id: "mobile-375",
    category: "mobile",
    label: "Compact Mobile",
    width: 375,
    description: "iPhone SE & small screens",
    icon: "📱",
  },
  // Tablet
  {
    id: "tablet-768",
    category: "tablet",
    label: "iPad Portrait",
    width: 768,
    description: "iPad Mini / 10.2\" Portrait",
    icon: "📟",
    recommended: true,
  },
  {
    id: "tablet-834",
    category: "tablet",
    label: "iPad Air / Pro",
    width: 834,
    description: "iPad Air & 11\" Pro",
    icon: "📟",
  },
  // Desktop
  {
    id: "desktop-1280",
    category: "desktop",
    label: "Laptop",
    width: 1280,
    description: "Compact laptop & web baseline",
    icon: "💻",
  },
  {
    id: "desktop-1440",
    category: "desktop",
    label: "Desktop",
    width: 1440,
    description: "Standard 1440px web desktop",
    icon: "💻",
    recommended: true,
  },
  {
    id: "desktop-1920",
    category: "desktop",
    label: "Widescreen",
    width: 1920,
    description: "1080p full HD display",
    icon: "🖥️",
  },
];

export const ResponsiveView: React.FC = () => {
  const { sendMessage } = useFigmaMessages();

  const [selectedFrame, setSelectedFrame] = useState<SelectedFrameInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<"mobile" | "tablet" | "desktop" | "custom">("mobile");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("mobile-412");
  const [conversionMode, setConversionMode] = useState<"smart" | "direct">("smart");
  const [customWidth, setCustomWidth] = useState<number>(412);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [scaleTypography, setScaleTypography] = useState<boolean>(true);
  const [reflowGrids, setReflowGrids] = useState<boolean>(true);
  const [createNewFrame, setCreateNewFrame] = useState<boolean>(true);

  // Result state
  const [conversionResult, setConversionResult] = useState<{
    success: boolean;
    frameId?: string;
    frameName?: string;
    targetWidth?: number;
    width?: number;
    height?: number;
    sectionsAdjusted?: number;
    textNodesScaled?: number;
    gridsReflowed?: number;
    error?: string;
  } | null>(null);

  // Request selection on mount
  useEffect(() => {
    sendMessage({ type: "GET_CANVAS_SELECTION" });
  }, [sendMessage]);

  // Listen for selection changes and conversion results
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === "CANVAS_SELECTION_RESULT") {
        const selection = msg.payload?.selection || [];
        if (selection.length > 0 && selection[0].type === "FRAME") {
          setSelectedFrame(selection[0]);
        } else {
          setSelectedFrame(null);
        }
      } else if (msg.type === "CONVERT_RESPONSIVE_RESULT") {
        setIsConverting(false);
        setConversionResult(msg.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const currentPreset = DEVICE_PRESETS.find((p) => p.id === selectedPresetId);
  const targetWidth = activeCategory === "custom" ? customWidth : currentPreset?.width || 412;

  const handleConvert = () => {
    if (!selectedFrame || isConverting) return;
    setIsConverting(true);
    setConversionResult(null);

    sendMessage({
      type: "CONVERT_RESPONSIVE_FRAME",
      payload: {
        nodeId: selectedFrame.id,
        targetWidth,
        mode: conversionMode,
        scaleTypography,
        reflowGrids,
        createNewFrame,
      },
    });
  };

  const handleZoomToFrame = (frameId?: string) => {
    if (frameId) {
      sendMessage({ type: "ZOOM_TO_NODE", payload: { nodeId: frameId } });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        height: "100%",
        paddingBottom: "16px",
      }}
    >
      {/* Intro Header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>📱</span>
          <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
            Responsive Viewport Converter
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
          Select any frame on your canvas, pick a target viewport breakpoint, and convert it instantly with perfect
          auto-layout and content preservation.
        </p>
      </div>

      {/* Selected Frame Status Card */}
      <div
        style={{
          background: selectedFrame ? "var(--bg-secondary)" : "rgba(234, 88, 12, 0.08)",
          border: `1px solid ${selectedFrame ? "var(--border-default)" : "rgba(234, 88, 12, 0.25)"}`,
          borderRadius: "var(--radius-md)",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.5px", color: selectedFrame ? "var(--accent-primary)" : "#ea580c" }}>
            {selectedFrame ? "ACTIVE SELECTION" : "NO FRAME SELECTED"}
          </span>
          <button
            onClick={() => sendMessage({ type: "GET_CANVAS_SELECTION" })}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "11px",
              cursor: "pointer",
              padding: "2px 4px",
            }}
            title="Refresh Selection"
          >
            🔄 Refresh
          </button>
        </div>

        {selectedFrame ? (
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedFrame.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Current size: <strong>{selectedFrame.width}px × {selectedFrame.height}px</strong>
              {selectedFrame.layoutMode && ` • Auto Layout (${selectedFrame.layoutMode})`}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            Please click on any landing page or design frame on your canvas to begin.
          </div>
        )}
      </div>

      {/* Device Category Tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
          TARGET VIEWPORT:
        </div>
        <div
          style={{
            display: "flex",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-sm)",
            padding: "3px",
            border: "1px solid var(--border-default)",
            gap: "2px",
          }}
        >
          {(["mobile", "tablet", "desktop", "custom"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                if (cat !== "custom") {
                  const firstOfCat = DEVICE_PRESETS.find((p) => p.category === cat);
                  if (firstOfCat) setSelectedPresetId(firstOfCat.id);
                }
              }}
              style={{
                flex: 1,
                border: "none",
                background: activeCategory === cat ? "var(--accent-primary)" : "transparent",
                color: activeCategory === cat ? "#ffffff" : "var(--text-secondary)",
                padding: "6px 8px",
                borderRadius: "var(--radius-xs)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s ease",
              }}
            >
              {cat === "mobile" ? "📱 Mobile" : cat === "tablet" ? "📟 Tablet" : cat === "desktop" ? "💻 Desktop" : "⚙️ Custom"}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards or Custom Width Input */}
      {activeCategory !== "custom" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {DEVICE_PRESETS.filter((p) => p.category === activeCategory).map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: isSelected ? "var(--bg-hover)" : "var(--bg-secondary)",
                  border: `1.5px solid ${isSelected ? "var(--accent-primary)" : "var(--border-default)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{preset.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {preset.label}
                      </span>
                      {preset.recommended && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            padding: "2px 5px",
                            borderRadius: "4px",
                            background: "rgba(37, 99, 235, 0.15)",
                            color: "var(--accent-primary)",
                          }}
                        >
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                      {preset.description}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {preset.width}px
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Custom Viewport Width (px):
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="number"
              min={320}
              max={2560}
              value={customWidth}
              onChange={(e) => setCustomWidth(Math.max(300, parseInt(e.target.value) || 412))}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-default)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>px</span>
          </div>
        </div>
      )}

      {/* Conversion Architecture Mode */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
          CONVERSION ARCHITECTURE
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div
            onClick={() => setConversionMode("smart")}
            style={{
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: `1.5px solid ${conversionMode === "smart" ? "var(--color-primary, #6366f1)" : "var(--border-default)"}`,
              background: conversionMode === "smart" ? "rgba(99, 102, 241, 0.08)" : "var(--bg-primary)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "11.5px", color: "var(--text-primary)" }}>
              <span>✨</span>
              <span>Smart Mobile</span>
              <span style={{ fontSize: "9px", background: "var(--color-primary, #6366f1)", color: "#fff", padding: "1px 5px", borderRadius: "4px" }}>PRO</span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.3 }}>
              Mobile-first components (2-col grid, 1-col cards, navbar) with 100% asset preservation.
            </span>
          </div>

          <div
            onClick={() => setConversionMode("direct")}
            style={{
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: `1.5px solid ${conversionMode === "direct" ? "var(--color-primary, #6366f1)" : "var(--border-default)"}`,
              background: conversionMode === "direct" ? "rgba(99, 102, 241, 0.08)" : "var(--bg-primary)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "11.5px", color: "var(--text-primary)" }}>
              <span>📐</span>
              <span>Direct Tree</span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.3 }}>
              Direct hierarchy clone with vertical stacking and clamped child widths.
            </span>
          </div>
        </div>
      </div>

      {/* Reflow Options */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
          CONVERSION RULES
        </span>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={reflowGrids}
            onChange={(e) => setReflowGrids(e.target.checked)}
          />
          Reflow multi-column grids (4-col & 2-col to mobile stack)
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={scaleTypography}
            onChange={(e) => setScaleTypography(e.target.checked)}
          />
          Scale typography proportionally (safe font-loader)
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "var(--text-secondary)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={createNewFrame}
            onChange={(e) => setCreateNewFrame(e.target.checked)}
          />
          Create as new frame beside original (recommended)
        </label>
      </div>

      {/* Main Convert Button */}
      <button
        onClick={handleConvert}
        disabled={!selectedFrame || isConverting}
        className="btn btn--primary btn--full btn--lg"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginTop: "4px",
          opacity: !selectedFrame || isConverting ? 0.6 : 1,
          cursor: !selectedFrame || isConverting ? "not-allowed" : "pointer",
        }}
      >
        {isConverting ? (
          <>
            <span className="spinner" />
            <span>Reflowing to {targetWidth}px...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Convert to {activeCategory === "custom" ? "Custom" : currentPreset?.label} ({targetWidth}px)</span>
          </>
        )}
      </button>

      {/* Conversion Result Banner */}
      {conversionResult && (
        <div
          style={{
            background: conversionResult.success ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)",
            border: `1px solid ${conversionResult.success ? "rgba(22, 163, 74, 0.3)" : "rgba(220, 38, 38, 0.3)"}`,
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px" }}>{conversionResult.success ? "✅" : "❌"}</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "12px",
                color: conversionResult.success ? "var(--color-success, #16a34a)" : "var(--color-error, #dc2626)",
              }}
            >
              {conversionResult.success ? "Conversion Complete!" : "Conversion Failed"}
            </span>
          </div>

          {conversionResult.success ? (
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "3px" }}>
              <div>Created: <strong>{conversionResult.frameName}</strong></div>
              <div>Size: <strong>{conversionResult.width}px × {conversionResult.height}px</strong></div>
              <div>Reflow metrics: {conversionResult.sectionsAdjusted} sections adjusted, {conversionResult.textNodesScaled} text nodes scaled.</div>
              {conversionResult.frameId && (
                <button
                  onClick={() => handleZoomToFrame(conversionResult.frameId)}
                  className="btn btn--secondary"
                  style={{ alignSelf: "flex-start", marginTop: "6px", padding: "4px 10px", fontSize: "11px" }}
                >
                  🔍 Zoom to Frame
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              {conversionResult.error || "Unknown conversion error"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
