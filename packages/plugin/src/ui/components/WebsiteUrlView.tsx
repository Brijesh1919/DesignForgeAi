/**
 * DesignForge AI — Website URL → Figma: Input Mode Component
 *
 * Isolated component for the new Website URL input mode.
 * Uses existing theme.css design system classes throughout.
 * Does NOT modify any existing UI components.
 */

import React, { useState, useCallback } from "react";
import { useWebsiteConversion, type WebsiteConversionOptions } from "../hooks/useWebsiteConversion";

// ─── Viewport Presets ─────────────────────────────────────────────────────────

const VIEWPORT_PRESETS = [
  { label: "Desktop 1440\u00d7900",  width: 1440, height: 900  },
  { label: "Laptop 1280\u00d7800",   width: 1280, height: 800  },
  { label: "Tablet 768\u00d71024",   width: 768,  height: 1024 },
  { label: "Mobile 390\u00d7844",    width: 390,  height: 844  },
];

// ─── Progress Steps ───────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
  { id: "opening",         label: "Opening website..." },
  { id: "rendering",       label: "Rendering page..." },
  { id: "waiting-fonts",   label: "Loading fonts & images..." },
  { id: "analyzing",       label: "Analyzing layout..." },
  { id: "extracting",      label: "Extracting styles..." },
  { id: "importing-assets",label: "Importing assets..." },
  { id: "creating-layers", label: "Creating Figma layers..." },
  { id: "finalizing",      label: "Finalizing design..." },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const WebsiteUrlView: React.FC = () => {
  const [url, setUrl]                   = useState("");
  const [viewportIndex, setViewportIndex] = useState(0);
  const [options, setOptions]           = useState<WebsiteConversionOptions>({
    editableText:    true,
    autoLayout:      true,
    importImages:    true,
    preserveFonts:   true,
    preserveShadows: true,
    preserveBorders: true,
  });

  const { convertWebsiteToFigma, conversionState } = useWebsiteConversion();

  const viewport = VIEWPORT_PRESETS[viewportIndex] ?? VIEWPORT_PRESETS[0];

  const handleConvert = useCallback(async () => {
    if (conversionState.isConverting) return;
    await convertWebsiteToFigma(url, viewport, options);
  }, [url, viewport, options, convertWebsiteToFigma, conversionState.isConverting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleConvert();
  }, [handleConvert]);

  const toggleOption = useCallback((key: keyof WebsiteConversionOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isConverting = conversionState.isConverting;
  const currentStepIndex = PROGRESS_STEPS.findIndex((s) => s.id === conversionState.step);

  // ─── Conversion Overlay ────────────────────────────────────
  if (isConverting) {
    return (
      <div className="website-conversion fade-in">
        <div className="processing__spinner" style={{ marginBottom: "var(--space-4)" }}>
          <div className="processing__spinner-inner">🌐</div>
        </div>
        <h3 className="processing__title" style={{ fontSize: "14px" }}>Converting Website</h3>
        <p className="processing__message">{conversionState.stepMessage || "Processing..."}</p>
        <div className="processing__progress-bar">
          <div className="processing__progress-fill" style={{ width: `${conversionState.progress}%` }} />
        </div>
        <div className="processing__steps" style={{ marginTop: "var(--space-4)" }}>
          {PROGRESS_STEPS.map((step, i) => {
            let icon = "\u26aa";
            let className = "processing__step processing__step--pending";
            if (i < currentStepIndex)     { icon = "\u2705"; className = "processing__step processing__step--done"; }
            else if (i === currentStepIndex) { icon = "\u26a1"; className = "processing__step processing__step--active"; }
            return (
              <div key={step.id} className={className}>
                <span className="processing__step-icon">{icon}</span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Input Form ────────────────────────────────────────────
  return (
    <div className="website-url-view fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      {/* Hero banner */}
      <div className="website-url-view__hero card" style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
        padding: "var(--space-4)",
        textAlign: "center",
      }}>
        <span style={{ fontSize: "28px", display: "block", marginBottom: "var(--space-2)" }}>🌐</span>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Website URL → Editable Figma</p>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Enter any public URL to convert the rendered page into fully editable Figma layers with Auto Layout, typography, colors, and images.
        </p>
      </div>

      {/* URL Input */}
      <div>
        <label className="label" htmlFor="website-url-input">Website URL</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", fontSize: "14px", pointerEvents: "none", zIndex: 1 }}>🔗</span>
          <input
            id="website-url-input"
            type="url"
            className="input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ paddingLeft: "36px" }}
            autoComplete="url"
            spellCheck={false}
          />
        </div>
        {conversionState.error && (
          <div style={{ marginTop: "var(--space-2)", padding: "var(--space-2) var(--space-3)", background: "var(--error-bg)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ fontSize: "11px", color: "var(--error)", lineHeight: 1.4 }}>⚠️ {conversionState.error}</p>
          </div>
        )}
      </div>

      {/* Viewport */}
      <div>
        <label className="label" htmlFor="website-viewport-select">Viewport</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-2)" }}>
          {VIEWPORT_PRESETS.map((preset, i) => {
            const isSelected = viewportIndex === i;
            const icon = i === 0 ? "🖥️" : i === 1 ? "💻" : i === 2 ? "📱" : "📱";
            return (
              <button
                key={preset.label}
                id={`viewport-btn-${i}`}
                className={`btn ${isSelected ? "btn--primary" : "btn--secondary"} btn--sm`}
                onClick={() => setViewportIndex(i)}
                style={{ flexDirection: "column", gap: "2px", padding: "var(--space-2)", height: "auto", fontSize: "11px" }}
                title={`${preset.width}×${preset.height}`}
              >
                <span style={{ fontSize: "16px" }}>{icon}</span>
                <span style={{ fontWeight: 600 }}>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="card" style={{ padding: "var(--space-3)" }}>
        <p className="card__title" style={{ marginBottom: "var(--space-3)" }}>Conversion Options</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {(
            [
              { key: "editableText",    icon: "📝", label: "Editable Text",     desc: "Preserve all text as editable Figma text layers" },
              { key: "autoLayout",      icon: "📐", label: "Auto Layout",        desc: "Detect flex/grid → Figma Auto Layout frames" },
              { key: "importImages",    icon: "🖼️",  label: "Import Images",     desc: "Download and embed images as Figma fills" },
              { key: "preserveFonts",   icon: "🔤", label: "Preserve Fonts",     desc: "Match font families from Google Fonts" },
              { key: "preserveShadows", icon: "🌗", label: "Preserve Shadows",   desc: "Convert CSS box-shadows to Figma effects" },
              { key: "preserveBorders", icon: "🔲", label: "Preserve Borders",   desc: "Convert CSS borders to Figma strokes" },
            ] as const
          ).map(({ key, icon, label, desc }) => {
            const enabled = options[key as keyof WebsiteConversionOptions];
            return (
              <div
                key={key}
                id={`option-${key}`}
                className="toggle"
                onClick={() => toggleOption(key as keyof WebsiteConversionOptions)}
                style={{ cursor: "pointer", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-1)", transition: "background var(--transition-fast)" }}
                title={desc}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "14px", width: "18px", textAlign: "center", flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{label}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "1px" }}>{desc}</p>
                  </div>
                </div>
                <div className={`toggle__switch ${enabled ? "toggle__switch--active" : ""}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert Button */}
      <button
        id="website-convert-btn"
        className="btn btn--primary btn--full"
        onClick={handleConvert}
        disabled={!url.trim() || isConverting}
        style={{ marginTop: "var(--space-2)" }}
      >
        🌐 Convert to Figma
      </button>

      {/* Info note */}
      <div style={{ padding: "var(--space-2) var(--space-3)", background: "var(--info-bg)", borderRadius: "var(--radius-md)", border: "1px solid rgba(59,130,246,0.15)" }}>
        <p style={{ fontSize: "10px", color: "var(--info)", lineHeight: 1.5 }}>
          💡 Works best with public websites. The page is rendered at the selected viewport using a real browser engine. Conversion typically takes 10–30 seconds.
        </p>
      </div>
    </div>
  );
};
