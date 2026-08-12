import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import { useAnalysis } from "../hooks/useAnalysis";
import { useFigmaMessages } from "../hooks/useFigmaMessages";
import { extractDesignFromHtmlCss } from "../utils/dom-extractor";

export const CodeWorkspace: React.FC = () => {
  const {
    htmlContent,
    cssContent,
    setHtmlContent,
    setCssContent,
    settings,
    updateSetting,
    addToast,
    analysisJson,
    setAnalysisJson,
    selectedImage,
    clearImage,
    inputMode,
  } = useAppStore();

  const { convertHtmlCssToFigma } = useAnalysis();
  const { sendMessage } = useFigmaMessages();

  const [activeTab, setActiveTab] = useState<"html" | "css" | "preview">("html");
  const [localHtml, setLocalHtml] = useState(htmlContent);
  const [localCss, setLocalCss] = useState(cssContent);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showDeveloper, setShowDeveloper] = useState(false);
  const [liveSceneGraph, setLiveSceneGraph] = useState<string>("");

  const previewRef = useRef<HTMLIFrameElement>(null);

  // Sync state with store on load/change
  useEffect(() => {
    setLocalHtml(htmlContent);
  }, [htmlContent]);

  useEffect(() => {
    setLocalCss(cssContent);
  }, [cssContent]);

  // Update live preview in iframe
  const updatePreview = () => {
    if (!previewRef.current) return;
    const doc = previewRef.current.contentDocument || previewRef.current.contentWindow?.document;
    if (!doc) return;

    console.log("[HTML PREVIEW]", {
      iframeWidth: previewRef.current.style.width,
      iframeHeight: previewRef.current.style.height,
      selectedImageWidth: selectedImage?.width,
      selectedImageHeight: selectedImage?.height,
    });

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 12px; font-family: sans-serif; background: #ffffff; color: #333333; }
          * { box-sizing: border-box; }
          ${localCss}
        </style>
      </head>
      <body>
        ${localHtml || "<div style='color: #666; text-align: center; margin-top: 40px;'>Write some HTML to see it rendered here.</div>"}
      </body>
      </html>
    `);
    doc.close();
  };

  useEffect(() => {
    if (activeTab === "preview") {
      updatePreview();
    }
  }, [activeTab, localHtml, localCss]);

  // Real-time Scene Graph Extraction
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (localHtml.trim()) {
        try {
          const analysis = await extractDesignFromHtmlCss(localHtml, localCss, {
            createAutoLayout: settings.createAutoLayout,
            createComponents: settings.createComponents,
            createVariables: settings.createVariables,
            createPaintStyles: settings.createPaintStyles,
            createTextStyles: settings.createTextStyles,
            generateConstraints: settings.generateConstraints,
            preserveAbsolutePosition: settings.preserveAbsolutePosition,
            optimizeLayerNames: settings.optimizeLayerNames,
            debugMode: settings.debugMode,
          });
          const jsonStr = JSON.stringify(analysis, null, 2);
          setLiveSceneGraph(jsonStr);
          setAnalysisJson(jsonStr);
        } catch (err) {
          setLiveSceneGraph(`Scene graph error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [localHtml, localCss, settings, setAnalysisJson]);

  const handleConvert = () => {
    setHtmlContent(localHtml);
    setCssContent(localCss);
    convertHtmlCssToFigma(localHtml, localCss);
  };

  const handleCheckboxChange = (key: keyof typeof settings) => {
    const newVal = !settings[key];
    updateSetting(key, newVal as any);
    sendMessage({ type: "SAVE_SETTINGS", payload: { ...settings, [key]: newVal } });
  };

  const handleExport = (type: "html" | "css" | "json") => {
    let content = "";
    let filename = "";

    if (type === "html") {
      content = localHtml;
      filename = "design.html";
    } else if (type === "css") {
      content = localCss;
      filename = "design.css";
    } else if (type === "json") {
      content = liveSceneGraph || "{}";
      filename = "scene-graph.json";
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    addToast("success", `${filename} exported successfully!`);
  };

  // Helper selectors
  const parseDOMTree = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const formatNode = (node: Element, depth = 0): string => {
        const indent = "  ".repeat(depth);
        const className = node.className ? `.${node.className.trim().split(/\s+/)[0]}` : "";
        const idName = node.id ? `#${node.id}` : "";
        let res = `${indent}<${node.tagName.toLowerCase()}${idName}${className}>\n`;
        for (const child of Array.from(node.children)) {
          res += formatNode(child, depth + 1);
        }
        return res;
      };
      return doc.body.children.length ? Array.from(doc.body.children).map(c => formatNode(c)).join("") : "Empty DOM";
    } catch {
      return "Invalid HTML DOM Structure";
    }
  };

  const extractTokensFromCss = (css: string): string => {
    const hexMatches = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    const varMatches = css.match(/--[\w-]+\s*:\s*[^;]+/g) || [];
    const uniqueHex = Array.from(new Set(hexMatches));
    const uniqueVars = Array.from(new Set(varMatches));
    return `[Colors]\n${uniqueHex.join("\n") || "No colors discovered"}\n\n[CSS Variables]\n${uniqueVars.join("\n") || "No CSS variables discovered"}`;
  };

  const findComponentsInHtml = (html: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const tagCounts: Record<string, number> = {};
      const walk = (node: Element) => {
        tagCounts[node.tagName.toLowerCase()] = (tagCounts[node.tagName.toLowerCase()] || 0) + 1;
        for (const child of Array.from(node.children)) {
          walk(child);
        }
      };
      for (const child of Array.from(doc.body.children)) {
        walk(child);
      }
      return `Component Candidates (Repeating tags):\n` + Object.entries(tagCounts)
        .filter(([_, count]) => count > 1)
        .map(([tag, count]) => `- ${tag} (${count} instances)`)
        .join("\n");
    } catch {
      return "No components detected";
    }
  };

  return (
    <div className="code-workspace fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Workspace Tabs */}
      <div className="tabs" style={{ display: "flex", borderBottom: "1px solid var(--border-default)", gap: "4px", alignItems: "center" }}>
        {inputMode === "screenshot" && (htmlContent || cssContent) && (
          <button
            onClick={() => {
              clearImage();
              setHtmlContent("");
              setCssContent("");
            }}
            className="btn btn--secondary btn--sm"
            style={{
              marginRight: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        )}
        <button
          className={`tab-btn ${activeTab === "html" ? "tab-btn--active" : ""}`}
          onClick={() => setActiveTab("html")}
          style={{
            padding: "8px 16px",
            background: activeTab === "html" ? "var(--bg-tertiary)" : "transparent",
            color: activeTab === "html" ? "var(--text-primary)" : "var(--text-secondary)",
            border: "none",
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          📄 HTML Editor
        </button>
        <button
          className={`tab-btn ${activeTab === "css" ? "tab-btn--active" : ""}`}
          onClick={() => setActiveTab("css")}
          style={{
            padding: "8px 16px",
            background: activeTab === "css" ? "var(--bg-tertiary)" : "transparent",
            color: activeTab === "css" ? "var(--text-primary)" : "var(--text-secondary)",
            border: "none",
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          🎨 CSS Editor
        </button>
        <button
          className={`tab-btn ${activeTab === "preview" ? "tab-btn--active" : ""}`}
          onClick={() => setActiveTab("preview")}
          style={{
            padding: "8px 16px",
            background: activeTab === "preview" ? "var(--bg-tertiary)" : "transparent",
            color: activeTab === "preview" ? "var(--text-primary)" : "var(--text-secondary)",
            border: "none",
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          👁️ Live Preview
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="editor-container" style={{ position: "relative" }}>
        {activeTab === "html" && (
          <textarea
            value={localHtml}
            onChange={(e) => setLocalHtml(e.target.value)}
            placeholder="<!-- Write your HTML structure here -->"
            className="input input--mono"
            style={{
              width: "100%",
              height: "320px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              padding: "12px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              resize: "vertical",
            }}
          />
        )}

        {activeTab === "css" && (
          <textarea
            value={localCss}
            onChange={(e) => setLocalCss(e.target.value)}
            placeholder="/* Write your CSS rules here */"
            className="input input--mono"
            style={{
              width: "100%",
              height: "320px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              padding: "12px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              resize: "vertical",
            }}
          />
        )}

        {activeTab === "preview" && (
          <div
            style={{
              width: "100%",
              height: "380px",
              background: "#ffffff",
              borderRadius: "8px",
              overflow: "auto",
              border: "1px solid var(--border-default)",
            }}
          >
            <iframe
              ref={previewRef}
              title="DesignForge Live Preview"
              style={{
                width: selectedImage ? `${selectedImage.width}px` : "100%",
                height: selectedImage ? `${selectedImage.height}px` : "100%",
                border: "none",
                background: "#ffffff",
              }}
            />
          </div>
        )}
      </div>

      {/* Options Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Advanced Options */}
        <div className="card" style={{ padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-default)", borderRadius: "8px" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <h4 style={{ margin: 0, fontSize: "13px" }}>⚙️ Advanced Options</h4>
            <span>{showAdvanced ? "▼" : "▶"}</span>
          </div>

          {showAdvanced && (
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.createAutoLayout}
                  onChange={() => handleCheckboxChange("createAutoLayout")}
                  className="custom-checkbox"
                />
                Create Auto Layout
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.createComponents}
                  onChange={() => handleCheckboxChange("createComponents")}
                  className="custom-checkbox"
                />
                Create Components
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.createVariables}
                  onChange={() => handleCheckboxChange("createVariables")}
                  className="custom-checkbox"
                />
                Create Variables
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.createPaintStyles}
                  onChange={() => handleCheckboxChange("createPaintStyles")}
                  className="custom-checkbox"
                />
                Create Paint Styles
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.createTextStyles}
                  onChange={() => handleCheckboxChange("createTextStyles")}
                  className="custom-checkbox"
                />
                Create Text Styles
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.generateConstraints}
                  onChange={() => handleCheckboxChange("generateConstraints")}
                  className="custom-checkbox"
                />
                Generate Constraints
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.preserveAbsolutePosition}
                  onChange={() => handleCheckboxChange("preserveAbsolutePosition")}
                  className="custom-checkbox"
                />
                Preserve Absolute Position
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.optimizeLayerNames}
                  onChange={() => handleCheckboxChange("optimizeLayerNames")}
                  className="custom-checkbox"
                />
                Optimize Layer Names
              </label>
            </div>
          )}
        </div>

        {/* Developer Options */}
        <div className="card" style={{ padding: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-default)", borderRadius: "8px" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setShowDeveloper(!showDeveloper)}
          >
            <h4 style={{ margin: 0, fontSize: "13px" }}>🛠️ Developer Options</h4>
            <span>{showDeveloper ? "▼" : "▶"}</span>
          </div>

          {showDeveloper && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <div className="checkbox-grid">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showDOMTree}
                    onChange={() => handleCheckboxChange("showDOMTree")}
                    className="custom-checkbox"
                  />
                  Show DOM Tree
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showDesignTokens}
                    onChange={() => handleCheckboxChange("showDesignTokens")}
                    className="custom-checkbox"
                  />
                  Show Design Tokens
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showComponentTree}
                    onChange={() => handleCheckboxChange("showComponentTree")}
                    className="custom-checkbox"
                  />
                  Show Component Tree
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showSceneGraph}
                    onChange={() => handleCheckboxChange("showSceneGraph")}
                    className="custom-checkbox"
                  />
                  Show Scene Graph
                </label>
              </div>

              {/* Export Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={() => handleExport("html")} className="btn btn--secondary btn--sm" style={{ flex: 1 }}>
                  Export HTML
                </button>
                <button onClick={() => handleExport("css")} className="btn btn--secondary btn--sm" style={{ flex: 1 }}>
                  Export CSS
                </button>
                <button onClick={() => handleExport("json")} className="btn btn--secondary btn--sm" style={{ flex: 1 }}>
                  Export JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Developer Outputs */}
      {settings.showDOMTree && (
        <div className="card" style={{ padding: "12px", borderRadius: "8px" }}>
          <h5 style={{ margin: "0 0 8px 0" }}>🌲 Live DOM Tree</h5>
          <pre style={{ fontSize: "11px", maxHeight: "150px", overflow: "auto", background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
            {parseDOMTree(localHtml)}
          </pre>
        </div>
      )}

      {settings.showDesignTokens && (
        <div className="card" style={{ padding: "12px", borderRadius: "8px" }}>
          <h5 style={{ margin: "0 0 8px 0" }}>🪙 Live Design Tokens</h5>
          <pre style={{ fontSize: "11px", maxHeight: "150px", overflow: "auto", background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
            {extractTokensFromCss(localCss)}
          </pre>
        </div>
      )}

      {settings.showComponentTree && (
        <div className="card" style={{ padding: "12px", borderRadius: "8px" }}>
          <h5 style={{ margin: "0 0 8px 0" }}>🧩 Live Component Tree</h5>
          <pre style={{ fontSize: "11px", maxHeight: "150px", overflow: "auto", background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
            {findComponentsInHtml(localHtml)}
          </pre>
        </div>
      )}

      {settings.showSceneGraph && (
        <div className="card" style={{ padding: "12px", borderRadius: "8px" }}>
          <h5 style={{ margin: "0 0 8px 0" }}>💠 Live Scene Graph (Figma Ready)</h5>
          <pre style={{ fontSize: "11px", maxHeight: "150px", overflow: "auto", background: "var(--bg-secondary)", padding: "8px", borderRadius: "4px" }}>
            {liveSceneGraph}
          </pre>
        </div>
      )}

      {/* Viewport Selection */}
      <div className="card" style={{ padding: "10px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border-default)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>
          🖥️ Target Viewport
        </span>
        <select
          value={settings.viewportPreset || "1440x900"}
          onChange={(e) => {
            const newVal = e.target.value as any;
            updateSetting("viewportPreset", newVal);
            sendMessage({ type: "SAVE_SETTINGS", payload: { ...settings, viewportPreset: newVal } });
          }}
          className="select"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          <option value="1920x1080">1920 × 1080 (Desktop Wide)</option>
          <option value="1440x900">1440 × 900 (Desktop Default)</option>
          <option value="1024x768">1024 × 768 (Tablet)</option>
          <option value="768x1024">768 × 1024 (Tablet Portrait)</option>
          <option value="389x844">389 × 844 (Mobile)</option>
        </select>
      </div>

      {/* Main Conversion CTA */}
      <button onClick={handleConvert} className="btn btn--primary btn--full btn--lg" style={{ marginTop: "8px" }}>
        🚀 Continue to Figma
      </button>
    </div>
  );
};
