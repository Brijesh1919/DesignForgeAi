import React from "react";
import { useAppStore } from "../stores/appStore";

interface ResultViewProps {
  onRegenerate: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ onRegenerate }) => {
  const { generationResult, setView } = useAppStore();

  if (!generationResult) return null;

  return (
    <div className="result fade-in">
      <div className="result__header">
        <span className="result__success-icon">🎉</span>
        <h3 className="result__title">Conversion Complete</h3>
        <p className="result__subtitle">Reconstructed design is ready in Figma</p>
      </div>

      <div className="result__stats">
        <div className="result__stat">
          <div className="result__stat-value">{generationResult.nodeCount}</div>
          <div className="result__stat-label">Nodes Created</div>
        </div>
        <div className="result__stat">
          <div className="result__stat-value">{generationResult.componentCount}</div>
          <div className="result__stat-label">Components</div>
        </div>
        <div className="result__stat">
          <div className="result__stat-value">{generationResult.styleCount}</div>
          <div className="result__stat-label">Styles</div>
        </div>
        <div className="result__stat">
          <div className="result__stat-value">{generationResult.variableCount}</div>
          <div className="result__stat-label">Variables</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "12px" }}>
        <h4 className="card__title">Design Summary</h4>
        <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Root Frame:</span>
            <span>{generationResult.frameName}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Colors Extracted:</span>
            <span>{generationResult.colorTokenCount} tokens</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Text Styles:</span>
            <span>{generationResult.textStyleCount} styles</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Generation Time:</span>
            <span>{(generationResult.elapsed / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="result__actions" style={{ marginTop: "24px" }}>
        <button onClick={onRegenerate} className="btn btn--primary btn--full">
          Convert Another Screen
        </button>
        <button onClick={() => setView("upload")} className="btn btn--secondary btn--full">
          Back to Upload
        </button>
      </div>
    </div>
  );
};
