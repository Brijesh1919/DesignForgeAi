/**
 * DesignForge AI — Plugin Controller
 *
 * Main entry point for the Figma plugin sandbox.
 * Orchestrates the entire generation pipeline:
 * 1. Receives DesignAnalysis JSON from the UI
 * 2. Creates styles and variables
 * 3. Builds component definitions
 * 4. Recursively builds the node tree
 * 5. Applies final constraints and cleanup
 */

import type { UIToPluginMessage, PluginToUIMessage } from "../shared/messages";
import type { PluginSettings, GenerationOptions, GenerationResult } from "../shared/types";
import { preloadCommonFonts } from "./utils/font-loader";
import { generateStyles } from "./generators/style-generator";
import { generateVariables } from "./generators/variable-generator";
import { buildComponents } from "./builders/component-builder";
import { buildNodeTree } from "./builders/frame-builder";
import { processAssets } from "./builders/image-builder";
import { validateFidelity } from "./utils/fidelity-validator";
import {
  applyAutoLayout,
  applyVariables,
  applyPaintStyles,
  applyTextStyles,
  applyComponents,
  applyConstraints,
  logPostEnhancementMetrics,
} from "./utils/post-processors";
import { validateGeometryPostProcess, BaseRect } from "./utils/geometry-validator";
import { recordBaseRenderBaseline } from "./utils/base-render-logger";
import { applyFidelityAdapter } from "./fidelity";

// ─── Plugin Init ─────────────────────────────────────────────

figma.showUI(__html__, {
  width: 380,
  height: 620,
  themeColors: true,
  title: "DesignForge AI",
});

// ─── Message Handler ─────────────────────────────────────────

figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  switch (msg.type) {
    case "START_GENERATION":
      await handleGeneration(msg.payload);
      break;

    case "CANCEL_GENERATION":
      // Cancel is handled by the UI side aborting the fetch
      break;

    case "LOAD_SETTINGS":
      await loadSettings();
      break;

    case "SAVE_SETTINGS":
      await saveSettings(msg.payload);
      break;

    case "LOAD_HISTORY":
      await loadHistory();
      break;

    case "DELETE_HISTORY_ITEM":
      await deleteHistoryItem(msg.payload.id);
      break;

    case "CLEAR_HISTORY":
      await clearHistory();
      break;

    case "ZOOM_TO_NODE":
      await zoomToNode(msg.payload.nodeId);
      break;

    case "RESIZE_WINDOW":
      figma.ui.resize(msg.payload.width, msg.payload.height);
      break;

    default:
      break;
  }
};

// Handle relaunch
if (figma.command === "regenerate") {
  figma.showUI(__html__, {
    width: 380,
    height: 620,
    themeColors: true,
    title: "DesignForge AI",
  });
}

// ─── Generation Pipeline ─────────────────────────────────────

async function handleGeneration(payload: {
  analysisJson: string;
  imageBase64: string;
  settings: PluginSettings;
}) {
  const startTime = Date.now();

  const canonicalOptions: GenerationOptions = {
    createAutoLayout: payload.settings.createAutoLayout === true,
    createComponents: payload.settings.createComponents === true,
    createVariables: payload.settings.createVariables === true,
    createPaintStyles: payload.settings.createPaintStyles === true,
    createTextStyles: payload.settings.createTextStyles === true,
    generateConstraints: payload.settings.generateConstraints === true,
    preserveAbsolutePosition: payload.settings.preserveAbsolutePosition !== false,
    optimizeLayerNames: payload.settings.optimizeLayerNames === true,
  };

  console.log(`[Generation Options]\n${JSON.stringify(canonicalOptions, null, 2)}`);

  try {
    const analysis = JSON.parse(payload.analysisJson);

    // Diagnostics Logs Requested
    console.log(`[DIAGNOSTICS]`);
    console.log(`- Final Generation Options:`, JSON.stringify(payload.settings, null, 2));
    console.log(`- Component Generation Enabled: ${payload.settings.createComponents}`);
    console.log(`- Eligible Component Nodes Count: ${analysis.components?.length || 0}`);
    if (!payload.settings.createComponents) {
      console.log(`- Component Builder Skipped Reason: createComponents setting is false`);
    } else if (!analysis.components || analysis.components.length === 0) {
      console.log(`- Component Builder Skipped Reason: analysis.components is empty or undefined`);
    } else {
      console.log(`- Component Builder will run with ${analysis.components.length} components`);
    }

    const paintCandidates = analysis.colorTokens?.length || 0;
    const textCandidates = analysis.textStyles?.length || 0;
    const effectCandidates = analysis.shadowTokens?.length || 0;
    console.log(`- Paint Styles Candidates: ${paintCandidates}`);
    console.log(`- Text Styles Candidates: ${textCandidates}`);
    console.log(`- Effect Styles Candidates: ${effectCandidates}`);

    if (!payload.settings.createPaintStyles && !payload.settings.createTextStyles) {
      console.log(`- Style Generator Skipped Reason: both createPaintStyles and createTextStyles settings are false`);
    } else {
      if (payload.settings.createPaintStyles && paintCandidates === 0) {
        console.log(`- Paint Style Category Skipped Reason: 0 paint/color candidates in analysis JSON`);
      }
      if (payload.settings.createTextStyles && textCandidates === 0) {
        console.log(`- Text Style Category Skipped Reason: 0 text style candidates in analysis JSON`);
      }
    }

    const countNodesRecursive = (node: any): number => {
      let count = 1;
      if (node.children) {
        for (const child of node.children) {
          count += countNodesRecursive(child);
        }
      }
      return count;
    };
    console.log(`- Total Nodes received by Figma Builder: ${analysis.rootFrame ? countNodesRecursive(analysis.rootFrame) : 0}`);

    // Step 0: Load all pages — required by modern Figma Plugin API before
    // any node manipulation (appendChild, createFrame, createComponent, etc.)
    sendProgress("creating-nodes", "Loading pages...", 5);
    await figma.loadAllPagesAsync();

    // Step 1: Preload fonts
    sendProgress("creating-nodes", "Loading fonts...", 10);
    await preloadCommonFonts();

    // Step 0: Load pages and common fonts
    sendProgress("creating-nodes", "Loading pages & fonts...", 10);
    await figma.loadAllPagesAsync();
    await preloadCommonFonts();

    // Step 1: Process image assets
    sendProgress("inserting-images", "Processing image assets...", 20);
    const imageAssets = processAssets(analysis.assets || []);

    // Initialize counts tracking
    const counts = { frames: 0, texts: 0, images: 0, skipped: 0 };
    const baseGeometryMap = new Map<string, BaseRect>();
    const baseTextPropsMap = new Map<string, any>();

    const baseSettings = {
      ...payload.settings,
      createAutoLayout: false,
      createComponents: false,
      createVariables: false,
      createPaintStyles: false,
      createTextStyles: false,
      generateConstraints: false,
      preserveAbsolutePosition: true,
    };

    const rootFrame = analysis.rootFrame;
    if (!rootFrame) {
      throw new Error("No rootFrame in analysis result");
    }

    const page = figma.currentPage;

    // STAGE 1: BASE_RENDER (Created FIRST and remains unchanged)
    console.log("[BASE_RENDER] Started");
    sendProgress("creating-nodes", "Building BASE_RENDER design tree...", 40);

    const result = await buildNodeTree(rootFrame, page, {
      components: new Map<string, ComponentNode>(),
      imageAssets,
      depth: 0,
      debugMode: payload.settings.debugMode,
      settings: baseSettings,
      counts,
      baseGeometryMap,
      baseTextPropsMap,
    });

    if (!result) {
      throw new Error("Failed to build root frame");
    }

    console.log("[BASE_RENDER] Completed");

    // Record BASE_RENDER baseline snapshot & node count BEFORE enhancements
    const baselineSnapshot = recordBaseRenderBaseline(result);

    // FIDELITY ADAPTER LAYER (HTML/CSS -> Figma 90% -> 99% Fidelity Upgrade)
    await applyFidelityAdapter(rootFrame, result, baselineSnapshot);

    // STAGE 2: ISOLATED OPTIONAL ENHANCEMENT PASSES
    sendProgress("creating-nodes", "Executing optional enhancement passes...", 70);

    let componentCount = 0;
    let variableCount = 0;
    let styleCount = 0;

    if (canonicalOptions.createAutoLayout) {
      await applyAutoLayout(result, baseGeometryMap);
    }
    if (canonicalOptions.createVariables) {
      variableCount = await applyVariables(analysis, canonicalOptions);
    }
    if (canonicalOptions.createPaintStyles) {
      styleCount += await applyPaintStyles(analysis, canonicalOptions);
    }
    if (canonicalOptions.createTextStyles) {
      styleCount += await applyTextStyles(analysis, canonicalOptions);
    }
    if (canonicalOptions.createComponents) {
      const componentsMap = await applyComponents(analysis, imageAssets, canonicalOptions);
      componentCount = componentsMap.size;
    }
    if (canonicalOptions.generateConstraints) {
      await applyConstraints(result, baseGeometryMap);
    }

    // POST-ENHANCEMENT GEOMETRY VALIDATION PASS (Tolerance <= 0.5px)
    validateGeometryPostProcess(result, baseGeometryMap, baseTextPropsMap);

    const printFigmaHierarchy = (node: SceneNode, indent = ""): string => {
      let rStr = `${indent}${node.name} (${node.type}) [x=${node.x}, y=${node.y}, w=${node.width}, h=${node.height}]\n`;
      if ("children" in node) {
        for (const child of (node as any).children) {
          rStr += printFigmaHierarchy(child, indent + "  ");
        }
      }
      return rStr;
    };
    console.log(`[GENERATED FIGMA HIERARCHY]\n` + printFigmaHierarchy(result));

    console.log(`[Builder]
Created ${counts.frames} frames
Created ${counts.texts} text nodes
Created ${counts.images} image nodes
Skipped ${counts.skipped} elements`);

    // Run post-generation fidelity validation pass
    validateFidelity(rootFrame, result);

    // Step 7: Position and finalize
    sendProgress("finalizing", "Finalizing design...", 90);

    // Set relaunch data on the root frame
    if ("setRelaunchData" in result) {
      (result as FrameNode).setRelaunchData({
        regenerate: "Regenerate this design with DesignForge AI",
      });
    }

    // Zoom viewport to the result
    figma.viewport.scrollAndZoomIntoView([result]);

    // Count nodes
    const nodeCount = countNodes(result);
    const elapsed = Date.now() - startTime;

    // Save to history
    await saveHistoryItem({
      id: `gen_${Date.now()}`,
      thumbnail: "", // Would be set from UI
      pageName: analysis.metadata?.pageName || "Untitled",
      deviceType: analysis.metadata?.deviceType || "unknown",
      nodeCount,
      componentCount,
      timestamp: Date.now(),
    });

    // Send completion
    const completionResult: GenerationResult = {
      nodeCount,
      componentCount,
      styleCount,
      variableCount,
      colorTokenCount: analysis.colorTokens?.length || 0,
      textStyleCount: analysis.textStyles?.length || 0,
      frameName: rootFrame.name || "Design",
      elapsed,
    };

    sendMessage({
      type: "GENERATION_COMPLETE",
      payload: completionResult,
    });

    figma.notify(
      `✅ Design generated! ${nodeCount} nodes, ${componentCount} components`,
      { timeout: 4000 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    console.error("[DesignForge] Generation error:", err);

    sendMessage({
      type: "GENERATION_ERROR",
      payload: {
        message: `Generation failed: ${message}`,
        details: err instanceof Error ? err.stack : undefined,
      },
    });

    figma.notify(`❌ ${message}`, { error: true, timeout: 5000 });
  }
}

// ─── Settings ────────────────────────────────────────────────

async function loadSettings() {
  const settings = await figma.clientStorage.getAsync("settings");
  sendMessage({
    type: "SETTINGS_LOADED",
    payload: settings || {
      backendUrl: "http://localhost:3001",
      apiKey: "",
      theme: "dark",
      qualityMode: "balanced",
      createAutoLayout: false,
      createComponents: false,
      createVariables: false,
      createPaintStyles: false,
      createTextStyles: false,
      generateConstraints: false,
      preserveAbsolutePosition: true,
      optimizeLayerNames: false,
      showDOMTree: false,
      showDesignTokens: false,
      showComponentTree: false,
      showSceneGraph: false,
      aiProvider: "ollama",
    },
  });
}

async function saveSettings(settings: PluginSettings) {
  await figma.clientStorage.setAsync("settings", settings);
}

// ─── History ─────────────────────────────────────────────────

async function loadHistory() {
  const history =
    (await figma.clientStorage.getAsync("history")) || [];
  sendMessage({
    type: "HISTORY_LOADED",
    payload: history,
  });
}

async function saveHistoryItem(item: any) {
  const history =
    (await figma.clientStorage.getAsync("history")) || [];
  history.unshift(item);

  // Keep max 20 items
  if (history.length > 20) {
    history.length = 20;
  }

  await figma.clientStorage.setAsync("history", history);
}

async function deleteHistoryItem(id: string) {
  let history =
    (await figma.clientStorage.getAsync("history")) || [];
  history = history.filter((item: any) => item.id !== id);
  await figma.clientStorage.setAsync("history", history);

  sendMessage({
    type: "HISTORY_LOADED",
    payload: history,
  });
}

async function clearHistory() {
  await figma.clientStorage.setAsync("history", []);
  sendMessage({
    type: "HISTORY_LOADED",
    payload: [],
  });
}

// ─── Utilities ───────────────────────────────────────────────

async function zoomToNode(nodeId: string) {
  try {
    const node = figma.getNodeById(nodeId);
    if (node && "type" in node) {
      // Ensure the page containing this node is loaded
      let parent = node.parent;
      while (parent && parent.type !== "PAGE") {
        parent = parent.parent;
      }
      if (parent && parent.type === "PAGE") {
        await (parent as PageNode).loadAsync();
      }
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
    }
  } catch (err) {
    console.error(`[DesignForge] Failed to zoom to node ${nodeId}: ${err}`);
  }
}

function countNodes(node: SceneNode): number {
  let count = 1;
  if ("children" in node) {
    for (const child of (node as FrameNode).children) {
      count += countNodes(child);
    }
  }
  return count;
}

function sendProgress(stage: string, message: string, progress: number) {
  sendMessage({
    type: "PROGRESS_UPDATE",
    payload: { stage: stage as any, message, progress },
  });
}

function sendMessage(msg: PluginToUIMessage) {
  figma.ui.postMessage(msg);
}
