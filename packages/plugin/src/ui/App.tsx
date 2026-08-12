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
    } else {
      sendMessage({ type: "RESIZE_WINDOW", payload: { width: 380, height: 620 } });
    }
  }, [currentView, htmlContent, cssContent, sendMessage]);

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
      <main className="app__content" style={{ padding: "16px" }}>
        {currentView === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Input Mode Selector */}
            {(!htmlContent && !cssContent) && (
              <div
                style={{
                  display: "flex",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  padding: "4px",
                  border: "1px solid var(--border-default)",
                }}
              >
                <button
                  onClick={() => setInputMode("screenshot")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "none",
                    background: inputMode === "screenshot" ? "var(--accent-primary)" : "transparent",
                    color: inputMode === "screenshot" ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "var(--transition-fast)",
                  }}
                >
                  📸 Screenshot Mode
                </button>
                <button
                  onClick={() => setInputMode("html-css")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "none",
                    background: inputMode === "html-css" ? "var(--accent-primary)" : "transparent",
                    color: inputMode === "html-css" ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "var(--transition-fast)",
                  }}
                >
                  📄 HTML / CSS Mode
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
