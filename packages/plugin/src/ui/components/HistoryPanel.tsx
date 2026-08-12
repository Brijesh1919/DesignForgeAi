import React from "react";
import { useAppStore } from "../stores/appStore";

interface HistoryPanelProps {
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onDelete, onClear }) => {
  const { history } = useAppStore();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Recent Generations</h3>
        {history.length > 0 && (
          <button onClick={onClear} className="btn btn--secondary btn--sm">
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history__empty">
          <span className="history__empty-icon">📁</span>
          <p>No design history yet.</p>
          <p style={{ fontSize: "11px", marginTop: "4px" }}>Generated designs will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {history.map((item) => (
            <div key={item.id} className="history__item card">
              <div className="history__item-thumb">
                {item.thumbnail ? (
                  <img src={`data:image/png;base64,${item.thumbnail}`} alt="Thumbnail" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--bg-tertiary)" }} />
                )}
              </div>
              <div className="history__item-info">
                <div className="history__item-name">{item.pageName}</div>
                <div className="history__item-meta">
                  <span>{item.deviceType}</span>
                  <span style={{ margin: "0 4px" }}>•</span>
                  <span>{item.nodeCount} layers</span>
                  <span style={{ margin: "0 4px" }}>•</span>
                  <span>{formatDate(item.timestamp)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="history__item-delete"
                title="Delete item"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
