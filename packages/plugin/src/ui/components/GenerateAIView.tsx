import React from "react";
import { useAppStore } from "../stores/appStore";
import { useAnalysis } from "../hooks/useAnalysis";

const EXAMPLE_PROMPTS = [
  "Create a modern SaaS landing page for an AI resume builder with hero, features, pricing and testimonials.",
  "Design a sleek dark-mode crypto analytics dashboard with portfolio overview, live chart, and recent transactions.",
  "Build a clean mobile banking app screen with balance card, quick transfer buttons, and activity list.",
];

export const GenerateAIView: React.FC = () => {
  const { aiPrompt, setAiPrompt, isGeneratingAi } = useAppStore();
  const { generateFromPrompt } = useAnalysis();

  const handleGenerate = () => {
    if (!aiPrompt.trim() || isGeneratingAi) return;
    generateFromPrompt(aiPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Title & Subtitle */}
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
          <span>✨</span> Generate with AI
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
          Describe the design you want
        </p>
      </div>

      {/* Large Prompt Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGeneratingAi}
          placeholder='e.g. "Create a modern SaaS landing page for an AI resume builder with a navbar, hero section, CTA buttons, feature cards, testimonials and a pricing section."'
          className="input"
          style={{
            width: "100%",
            height: "160px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: "14px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            opacity: isGeneratingAi ? 0.7 : 1,
          }}
        />
        <span
          style={{
            position: "absolute",
            right: "10px",
            bottom: "10px",
            fontSize: "10px",
            color: "var(--text-tertiary)",
            pointerEvents: "none",
          }}
        >
          {aiPrompt.length > 0 ? `${aiPrompt.length} chars • Ctrl+Enter to run` : "Ctrl+Enter to run"}
        </span>
      </div>

      {/* Quick Examples */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          💡 Example Prompts:
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {EXAMPLE_PROMPTS.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAiPrompt(example)}
              disabled={isGeneratingAi}
              style={{
                textAlign: "left",
                background: "var(--surface-glass)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 10px",
                color: "var(--text-secondary)",
                fontSize: "11px",
                lineHeight: 1.4,
                cursor: isGeneratingAi ? "not-allowed" : "pointer",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingAi) {
                  e.currentTarget.style.borderColor = "var(--accent-primary)";
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isGeneratingAi) {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "var(--surface-glass)";
                }
              }}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleGenerate}
        disabled={isGeneratingAi || !aiPrompt.trim()}
        className="btn btn--primary btn--full btn--lg"
        style={{
          marginTop: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          cursor: isGeneratingAi || !aiPrompt.trim() ? "not-allowed" : "pointer",
        }}
      >
        {isGeneratingAi ? (
          <>
            <span style={{ animation: "spin-slow 2s linear infinite", display: "inline-block" }}>⚙️</span>
            Generating your design...
          </>
        ) : (
          <>
            <span>✨</span>
            Generate HTML/CSS
          </>
        )}
      </button>
    </div>
  );
};
