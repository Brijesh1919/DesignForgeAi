import React, { useState } from "react";
import { useAppStore } from "../stores/appStore";

export const DebugConsole: React.FC = () => {
  const { debugData } = useAppStore();
  const [activeSection, setActiveSection] = useState<string>("report");

  if (!debugData) {
    return (
      <div className="fade-in card" style={{ padding: "24px", textAlign: "center", color: "var(--text-tertiary)" }}>
        <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📊</span>
        <p>No debug data available.</p>
        <p style={{ fontSize: "11px", marginTop: "4px" }}>
          Enable Developer Mode in Settings and run a layout generation to view layout pipelines.
        </p>
      </div>
    );
  }

  const sections = [
    { id: "dimensions", label: "Screenshot Dimensions", content: debugData.screenshotDimensions },
    { id: "vision", label: "Vision Analysis", content: debugData.visionAnalysis },
    { id: "html", label: "Generated HTML", content: debugData.generatedHtml },
    { id: "css", label: "Generated CSS", content: debugData.generatedCss },
    { id: "normalized", label: "Normalized HTML/CSS", content: debugData.normalizedHtmlCss },
    { id: "errors", label: "HTML/CSS Validation Errors", content: debugData.validationErrors },
    { id: "components", label: "Detected Components", content: debugData.detectedComponents },
    { id: "assets", label: "Detected Assets", content: debugData.detectedAssets },
    { id: "figma", label: "Figma Conversion Result", content: debugData.figmaConversionResult },
    // Backward compatibility fallbacks
    { id: "report", label: "Debug Report (Legacy)", content: debugData.debugReport },
    { id: "tree", label: "Layout Tree (Legacy)", content: debugData.layoutTree },
  ];

  const currentContent = sections.find((s) => s.id === activeSection)?.content || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    alert("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `designforge_debug_${activeSection}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Pipeline Inspector</h3>

      <div style={{ marginBottom: "12px" }}>
        <label className="label">Inspector Phase</label>
        <select
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
          className="select"
        >
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: "260px" }}>
        <textarea
          readOnly
          value={currentContent}
          className="input input--mono"
          style={{
            width: "100%",
            height: "100%",
            resize: "none",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            padding: "12px",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            fontSize: "11px",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <button onClick={handleCopy} className="btn btn--secondary btn--sm" style={{ flex: 1 }}>
          Copy Output
        </button>
        <button onClick={handleDownload} className="btn btn--primary btn--sm" style={{ flex: 1 }}>
          Export File
        </button>
      </div>
    </div>
  );
};
