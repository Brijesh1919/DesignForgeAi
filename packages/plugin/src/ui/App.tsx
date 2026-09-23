import React, { useEffect } from "react";
import { useAppStore } from "./stores/appStore";
import { useFigmaMessages } from "./hooks/useFigmaMessages";
import { useAnalysis } from "./hooks/useAnalysis";
import { Header } from "./components/Header";
import { UploadZone } from "./components/UploadZone";
import { ProcessingView } from "./components/ProcessingView";
import { ResultView } from "./components/ResultView";
import { HistoryPanel } from "./components/HistoryPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { DebugConsole } from "./components/DebugConsole";
import { CodeWorkspace } from "./components/CodeWorkspace";
import { GenerateAIView } from "./components/GenerateAIView";
import { WebsiteUrlView } from "./components/WebsiteUrlView";
import { AgentBridgeView } from "./components/AgentBridgeView";
import { ExportCodeView } from "./components/ExportCodeView";
import "./styles/theme.css";

const ToastItem: React.FC<{ toast: any; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`toast toast--${toast.type}`}
      onClick={() => onRemove(toast.id)}
      style={{ cursor: "pointer" }}
    >
      {toast.message}
    </div>
  );
};

export const App: React.FC = () => {
  const {
    currentView,
    setView,
    selectedImage,
    clearImage,
    toasts,
    removeToast,
    settings,
    inputMode,
    setInputMode,
    htmlContent,
    cssContent,
    setHtmlContent,
    setCssContent,
  } = useAppStore();

  const { sendMessage } = useFigmaMessages();
  const { startAnalysis, generateHtmlFromScreenshot } = useAnalysis();

  // Load initial settings and history on mount
  useEffect(() => {
    sendMessage({ type: "LOAD_SETTINGS" });
    sendMessage({ type: "LOAD_HISTORY" });
  }, [sendMessage]);

  // Dynamically resize window based on split-view state
  useEffect(() => {
    if (currentView === "upload" && (htmlContent || cssContent)) {
      sendMessage({ type: "RESIZE_WINDOW", payload: { width: 980, height: 720 } });
    } else if (currentView === "upload" && inputMode === "export-code") {
      // Handled internally by ExportCodeView
    } else {
      sendMessage({ type: "RESIZE_WINDOW", payload: { width: 460, height: 660 } });
    }
  }, [currentView, htmlContent, cssContent, inputMode, sendMessage]);

  const handleSaveSettings = (newSettings: typeof settings) => {
    sendMessage({ type: "SAVE_SETTINGS", payload: newSettings });
  };

  const handleDeleteHistory = (id: string) => {
    sendMessage({ type: "DELETE_HISTORY_ITEM", payload: { id } });
  };

  const handleClearHistory = () => {
    sendMessage({ type: "CLEAR_HISTORY" });
  };

  const handleRegenerate = () => {
    clearImage();
    setHtmlContent("");
    setCssContent("");
    setView("upload");
  };

  return (
    <div className="app" data-theme={settings.theme === "system" ? "dark" : settings.theme}>
      <Header />
      <main
        className="app__content"
        style={{
          padding: inputMode === "export-code" ? "12px 16px" : "16px 18px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "calc(100vh - 48px)",
          overflow: inputMode === "export-code" ? "hidden" : "auto",
        }}
      >
        {currentView === "upload" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: inputMode === "export-code" ? "10px" : "16px",
              flex: 1,
              height: "100%",
              minHeight: 0,
            }}
          >
            {/* Input Mode Selector */}
            {(!htmlContent && !cssContent) && (
              <div className="feature-tabs" role="tablist">
                <button
                  id="tab-screenshot"
                  role="tab"
                  aria-selected={inputMode === "screenshot"}
                  onClick={() => setInputMode("screenshot")}
                  className={`feature-tab ${inputMode === "screenshot" ? "feature-tab--active" : ""}`}
                >
                  <span>📸</span> Photo
                </button>
                <button
                  id="tab-html-css"
                  role="tab"
                  aria-selected={inputMode === "html-css"}
                  onClick={() => setInputMode("html-css")}
                  className={`feature-tab ${inputMode === "html-css" ? "feature-tab--active" : ""}`}
                >
                  <span>📄</span> Code
                </button>
                <button
                  id="tab-generate-ai"
                  role="tab"
                  aria-selected={inputMode === "generate-ai"}
                  onClick={() => setInputMode("generate-ai")}
                  className={`feature-tab ${inputMode === "generate-ai" ? "feature-tab--active" : ""}`}
                >
                  <span>✨</span> AI
                </button>
                <button
                  id="tab-website-url"
                  role="tab"
                  aria-selected={inputMode === "website-url"}
                  onClick={() => setInputMode("website-url")}
                  className={`feature-tab ${inputMode === "website-url" ? "feature-tab--active" : ""}`}
                >
                  <span>🌐</span> URL
                </button>
                <button
                  id="tab-agent-bridge"
                  role="tab"
                  aria-selected={inputMode === "agent-bridge"}
                  onClick={() => setInputMode("agent-bridge")}
                  className={`feature-tab ${inputMode === "agent-bridge" ? "feature-tab--active" : ""}`}
                >
                  <span>🔌</span> Agent
                </button>
                <button
                  id="tab-export-code"
                  role="tab"
                  aria-selected={inputMode === "export-code"}
                  onClick={() => setInputMode("export-code")}
                  className={`feature-tab ${inputMode === "export-code" ? "feature-tab--active" : ""}`}
                >
                  <span>&lt;/&gt;</span> Export
                </button>
              </div>
            )}

            {/* View renders depending on inputMode */}
            {inputMode === "screenshot" && !htmlContent && !cssContent ? (
              <>
                <UploadZone />
                {selectedImage && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button onClick={startAnalysis} className="btn btn--primary btn--full btn--lg">
                      ✨ Generate Design
                    </button>
                    <button onClick={generateHtmlFromScreenshot} className="btn btn--secondary btn--full">
                      🎨 Generate HTML & CSS
                    </button>
                  </div>
                )}
              </>
            ) : inputMode === "generate-ai" && !htmlContent && !cssContent ? (
              <GenerateAIView />
            ) : inputMode === "website-url" && !htmlContent && !cssContent ? (
              <WebsiteUrlView />
            ) : inputMode === "export-code" && !htmlContent && !cssContent ? (
              <ExportCodeView />
            ) : inputMode === "agent-bridge" && !htmlContent && !cssContent ? (
              null
            ) : selectedImage && (htmlContent || cssContent) ? (
              <div style={{ display: "flex", gap: "16px", height: "620px", width: "100%", overflow: "hidden" }}>
                {/* Left Pane: Original Screenshot */}
                <div
                  className="card"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    padding: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    📸 Original Screenshot
                  </h4>
                  <div
                    style={{
                      flex: 1,
                      overflow: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-tertiary)",
                      borderRadius: "6px",
                      padding: "8px",
                    }}
                  >
                    <img
                      src={selectedImage.base64}
                      alt="Original UI"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: "4px",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    />
                  </div>
                </div>

                {/* Right Pane: Code Workspace */}
                <div style={{ flex: 1.2, display: "flex", flexDirection: "column", overflow: "auto" }}>
                  <CodeWorkspace />
                </div>
              </div>
            ) : (
              <CodeWorkspace />
            )}

            {/* Persistent Agent Bridge Connection */}
            <div style={{ display: inputMode === "agent-bridge" && !htmlContent && !cssContent ? "block" : "none" }}>
              <AgentBridgeView />
            </div>
          </div>
        )}

        {currentView === "processing" && <ProcessingView />}

        {currentView === "result" && (
          <ResultView onRegenerate={handleRegenerate} />
        )}

        {currentView === "history" && (
          <HistoryPanel onDelete={handleDeleteHistory} onClear={handleClearHistory} />
        )}

        {currentView === "settings" && (
          <SettingsPanel onSave={handleSaveSettings} />
        )}

        {currentView === "debug" && <DebugConsole />}
      </main>

      {/* Toast notifications */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
};
