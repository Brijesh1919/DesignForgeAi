import React from "react";
import { useAppStore } from "../stores/appStore";

export const ProcessingView: React.FC = () => {
  const { processingStage, processingMessage, processingProgress } = useAppStore();

  const stages = [
    { id: "uploading", label: "Uploading..." },
    { id: "analyzing", label: "Analyzing Layout..." },
    { id: "reading-text", label: "Reading Text..." },
    { id: "extracting-colors", label: "Extracting Colors..." },
    { id: "detecting-components", label: "Building Components..." },
    { id: "building-layout", label: "Generating Auto Layout..." },
    { id: "creating-nodes", label: "Creating Figma Nodes..." },
    { id: "finalizing", label: "Finalizing..." },
  ];

  const getStageStatus = (stageId: string) => {
    const currentIndex = stages.findIndex((s) => s.id === processingStage);
    const stageIndex = stages.findIndex((s) => s.id === stageId);

    if (processingStage === "error") return "error";
    if (currentIndex === -1) return "pending";
    if (stageIndex < currentIndex) return "done";
    if (stageIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="processing fade-in">
      <div className="processing__spinner">
        <div className="processing__spinner-inner">⚙️</div>
      </div>
      <h3 className="processing__title">Generating Figma Design</h3>
      <p className="processing__message">{processingMessage || "Processing..."}</p>

      <div className="processing__progress-bar">
        <div
          className="processing__progress-fill"
          style={{ width: `${processingProgress}%` }}
        ></div>
      </div>

      <div className="processing__steps" style={{ marginTop: "24px" }}>
        {stages.map((stage) => {
          const status = getStageStatus(stage.id);
          let icon = "⚪";
          let className = "processing__step processing__step--pending";

          if (status === "done") {
            icon = "✅";
            className = "processing__step processing__step--done";
          } else if (status === "active") {
            icon = "⚡";
            className = "processing__step processing__step--active";
          }

          return (
            <div key={stage.id} className={className}>
              <span className="processing__step-icon">{icon}</span>
              <span>{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
