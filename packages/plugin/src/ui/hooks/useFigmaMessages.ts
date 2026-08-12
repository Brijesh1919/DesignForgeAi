/**
 * DesignForge AI — Figma Messages Hook
 *
 * Bidirectional communication with the Figma plugin sandbox.
 */

import { useEffect, useCallback } from "react";
import type { UIToPluginMessage, PluginToUIMessage } from "../../shared/messages";
import { useAppStore } from "../stores/appStore";

/**
 * Hook to send messages to the Figma plugin sandbox
 * and receive messages from it.
 */
export function useFigmaMessages() {
  const {
    setSettings,
    setHistory,
    setProcessing,
    setGenerationResult,
    setView,
    addToast,
    setError,
  } = useAppStore();

  // Listen for messages from the plugin
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data.pluginMessage as PluginToUIMessage;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case "PROGRESS_UPDATE":
          setProcessing(
            msg.payload.stage,
            msg.payload.message,
            msg.payload.progress
          );
          break;

        case "GENERATION_COMPLETE":
          setGenerationResult(msg.payload);
          setProcessing("complete", "Design generated!", 100);
          setView("result");
          break;

        case "GENERATION_ERROR":
          setError(msg.payload.message);
          setProcessing("error", msg.payload.message, 0);
          addToast("error", msg.payload.message);
          setView("upload");
          break;

        case "SETTINGS_LOADED":
          setSettings(msg.payload);
          break;

        case "HISTORY_LOADED":
          setHistory(msg.payload);
          break;

        case "NOTIFICATION":
          addToast(msg.payload.type, msg.payload.message);
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setSettings, setHistory, setProcessing, setGenerationResult, setView, addToast, setError]);

  // Send message to plugin
  const sendMessage = useCallback((msg: UIToPluginMessage) => {
    parent.postMessage({ pluginMessage: msg }, "*");
  }, []);

  return { sendMessage };
}
