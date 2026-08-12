import React from "react";
import { useAppStore } from "../stores/appStore";
import type { PluginSettings } from "../../shared/types";

interface SettingsPanelProps {
  onSave: (settings: PluginSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSave }) => {
  const { settings, updateSetting, addToast } = useAppStore();

  const handleToggle = (key: keyof PluginSettings) => {
    if (typeof settings[key] === "boolean") {
      const newValue = !settings[key];
      updateSetting(key, newValue);
      onSave({ ...settings, [key]: newValue });
    }
  };

  const handleInputChange = (key: keyof PluginSettings, value: string) => {
    updateSetting(key, value);
    onSave({ ...settings, [key]: value });
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch(`${settings.backendUrl}/api/cache/clear`, {
        method: "POST",
      });
      if (response.ok) {
        const result = await response.json();
        addToast("success", result.message || "Cache cleared successfully.");
      } else {
        throw new Error("Failed to clear cache");
      }
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to clear cache.");
    }
  };

  return (
    <div className="settings fade-in">
      <div className="settings__section">
        <h4 className="settings__section-title">Backend Configuration</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label className="label">Backend Server URL</label>
            <input
              type="text"
              value={settings.backendUrl}
              onChange={(e) => handleInputChange("backendUrl", e.target.value)}
              placeholder="http://localhost:3001"
              className="input"
            />
          </div>
          <div>
            <label className="label">AI Provider</label>
            <select
              value={settings.aiProvider || "ollama"}
              onChange={(e) => handleInputChange("aiProvider", e.target.value)}
              className="select"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="openrouter">OpenRouter (Cloud)</option>
            </select>
          </div>
          <div>
            <label className="label">AI Model Name</label>
            <input
              type="text"
              value={settings.geminiModel}
              onChange={(e) => handleInputChange("geminiModel", e.target.value)}
              placeholder="qwen2.5vl:3b"
              className="input"
            />
          </div>
          <div>
            <label className="label">OpenRouter API Key (Optional)</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => handleInputChange("apiKey", e.target.value)}
              placeholder="Leave blank to use server key"
              className="input input--mono"
            />
          </div>
        </div>
      </div>

      <div className="settings__section">
        <h4 className="settings__section-title">Design Generation Options</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="toggle">
            <span className="toggle__label">Enable Auto Layout</span>
            <div
              className={`toggle__switch ${settings.createAutoLayout ? "toggle__switch--active" : ""}`}
              onClick={() => handleToggle("createAutoLayout")}
            />
          </div>

          <div className="toggle">
            <span className="toggle__label">Infer Components</span>
            <div
              className={`toggle__switch ${settings.createComponents ? "toggle__switch--active" : ""}`}
              onClick={() => handleToggle("createComponents")}
            />
          </div>

          <div className="toggle">
            <span className="toggle__label">Create Paint Styles</span>
            <div
              className={`toggle__switch ${settings.createPaintStyles ? "toggle__switch--active" : ""}`}
              onClick={() => handleToggle("createPaintStyles")}
            />
          </div>

          <div className="toggle">
            <span className="toggle__label">Create Variables</span>
            <div
              className={`toggle__switch ${settings.createVariables ? "toggle__switch--active" : ""}`}
              onClick={() => handleToggle("createVariables")}
            />
          </div>

          <div className="toggle">
            <span className="toggle__label">Developer / Debug Mode</span>
            <div
              className={`toggle__switch ${settings.debugMode ? "toggle__switch--active" : ""}`}
              onClick={() => handleToggle("debugMode")}
            />
          </div>
        </div>
      </div>

      <div className="settings__section">
        <h4 className="settings__section-title">Quality & Optimization</h4>
        <div>
          <label className="label">Quality Mode</label>
          <select
            value={settings.qualityMode}
            onChange={(e) => handleInputChange("qualityMode", e.target.value)}
            className="select"
          >
            <option value="fast">Fast (Speed Optimized)</option>
            <option value="balanced">Balanced</option>
            <option value="accurate">Accurate (Full Layout Inference)</option>
          </select>
        </div>
      </div>

      <div className="settings__section">
        <h4 className="settings__section-title">Cache Operations</h4>
        <button onClick={handleClearCache} className="btn btn--secondary btn--full btn--sm">
          Clear Local Layout Cache
        </button>
      </div>
    </div>
  );
};
