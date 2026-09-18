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
import { processAssets, base64ToUint8Array } from "./builders/image-builder";
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
import { restructureUINodeLayout } from "./utils/layout-restructurer";
import { sanitizeFigmaLayoutTree } from "./utils/layout-validator";
import { runLayoutEngineTests } from "./utils/layout-test-runner";
import { generateCodeFromFigmaNode } from "./generators/figma-to-code";

// ─── Plugin Init ─────────────────────────────────────────────

figma.showUI(__html__, {
  width: 380,
  height: 620,
  themeColors: true,
  title: "DesignForge AI",
});

// Run layout engine validation suite at startup
runLayoutEngineTests().catch((err) => console.error("Failed to run layout engine tests:", err));

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

    case "GET_CANVAS_SELECTION":
      await handleGetCanvasSelection(msg.payload?.requestId);
      break;

    case "EXECUTE_REMOVE_BACKGROUND":
      await handleRemoveBackground(msg.payload?.requestId, msg.payload?.nodeId);
      break;

    case "APPLY_REMOVE_BACKGROUND_RESULT":
      await handleApplyRemoveBackgroundResult(msg.payload);
      break;

    case "EXECUTE_RECOLOR_THEME":
      await handleRecolorTheme(msg.payload);
      break;

    case "EXPORT_FRAME_CODE":
      await handleExportFrameCode(msg.payload?.requestId, msg.payload?.nodeId);
      break;

    default:
      break;
  }
};

// Listen for selection changes on canvas and notify UI
figma.on("selectionchange", () => {
  handleGetCanvasSelection().catch((err) => console.warn("[Controller] selectionchange error:", err));
});

let lastGeneratedFrameId: string | null = null;

async function handleGetCanvasSelection(requestId?: string): Promise<void> {
  try {
    let selection = [...figma.currentPage.selection];
    if (selection.length === 0) {
      const topFrames = figma.currentPage.children.filter((n) => n.type === "FRAME") as FrameNode[];
      if (topFrames.length > 0) {
        selection = [topFrames[topFrames.length - 1]];
      }
    }
    function inspectNodeSummary(node: SceneNode, depth = 0, maxDepth = 2): any {
      const summary: any = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: Math.round(node.width),
        height: Math.round(node.height),
        layoutMode: "layoutMode" in node ? (node as any).layoutMode : "NONE",
        layoutSizingHorizontal: "layoutSizingHorizontal" in node ? (node as any).layoutSizingHorizontal : undefined,
        layoutSizingVertical: "layoutSizingVertical" in node ? (node as any).layoutSizingVertical : undefined,
        childrenCount: "children" in node ? (node as any).children.length : 0,
      };

      if (node.type === "TEXT") {
        summary.text = (node as TextNode).characters?.slice(0, 80);
      }

      if ("children" in node && depth < maxDepth) {
        summary.children = (node as any).children.map((c: SceneNode) => inspectNodeSummary(c, depth + 1, maxDepth));
      }

      return summary;
    }

    const nodes = selection.map((node) => inspectNodeSummary(node, 0, 2));

    figma.ui.postMessage({
      type: "CANVAS_SELECTION_RESULT",
      payload: {
        requestId,
        selection: nodes,
      },
    });
  } catch (err: any) {
    console.warn("[Controller] Failed to read canvas selection:", err);
    figma.ui.postMessage({
      type: "CANVAS_SELECTION_RESULT",
      payload: {
        requestId,
        selection: [],
      },
    });
  }
}

async function handleRemoveBackground(requestId?: string, nodeId?: string): Promise<void> {
  try {
    let targetNodes: SceneNode[] = [];
    if (nodeId) {
      const singleNode = (await figma.getNodeByIdAsync(nodeId)) as SceneNode;
      if (singleNode) targetNodes.push(singleNode);
    }
    if (targetNodes.length === 0) {
      targetNodes = [...figma.currentPage.selection];
    }
    if (targetNodes.length === 0) {
      throw new Error("No layers selected. Please select one or more images or layers first.");
    }

    figma.notify(`Exporting ${targetNodes.length} layer(s) for background removal...`, { timeout: 2000 });

    const items: Array<{ nodeId: string; nodeName: string; imageBase64: string }> = [];

    for (const node of targetNodes) {
      const bytes = await node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 1 },
      });

      let imageBase64 = "";
      if (typeof (figma as any).base64Encode === "function") {
        imageBase64 = (figma as any).base64Encode(bytes);
      } else {
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        imageBase64 = btoa(binary);
      }

      items.push({
        nodeId: node.id,
        nodeName: node.name,
        imageBase64,
      });
    }

    figma.ui.postMessage({
      type: "REMOVE_BACKGROUND_EXPORT_READY",
      payload: {
        requestId,
        items,
        nodeId: items[0]?.nodeId,
        nodeName: items[0]?.nodeName,
        imageBase64: items[0]?.imageBase64,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Remove background export failed:", err);
    figma.ui.postMessage({
      type: "REMOVE_BACKGROUND_RESULT",
      payload: {
        requestId,
        success: false,
        error: err.message || "Failed to export image",
      },
    });
  }
}

async function handleApplyRemoveBackgroundResult(payload: {
  requestId?: string;
  nodeId?: string;
  transparentBase64?: string;
  results?: Array<{ nodeId: string; transparentBase64: string }>;
}): Promise<void> {
  try {
    const list = payload.results || (payload.nodeId && payload.transparentBase64 ? [{ nodeId: payload.nodeId, transparentBase64: payload.transparentBase64 }] : []);
    if (!list.length) throw new Error("No processed image data provided");

    let updatedCount = 0;
    for (const item of list) {
      const node = (await figma.getNodeByIdAsync(item.nodeId)) as GeometryMixin & SceneNode;
      if (node && "fills" in node && item.transparentBase64) {
        const bytes = base64ToUint8Array(item.transparentBase64);
        const newImage = figma.createImage(bytes);
        node.fills = [
          {
            type: "IMAGE",
            imageHash: newImage.hash,
            scaleMode: "FIT",
          },
        ];
        updatedCount++;
      }
    }

    figma.notify(`✂️ Background removed from ${updatedCount} layer(s)!`, { timeout: 3500 });

    figma.ui.postMessage({
      type: "REMOVE_BACKGROUND_RESULT",
      payload: {
        requestId: payload.requestId,
        success: true,
        nodeName: `${updatedCount} layer(s)`,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to apply transparent image:", err);
    figma.ui.postMessage({
      type: "REMOVE_BACKGROUND_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to apply image fill",
      },
    });
  }
}

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

  // Capture canvas selection immediately before any async operations
  const currentSelection = figma.currentPage.selection;
  const selectedFrame =
    currentSelection.length === 1 && currentSelection[0].type === "FRAME"
      ? (currentSelection[0] as FrameNode)
      : null;

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

    // AUTO-LAYOUT: Pass createAutoLayout directly from canonicalOptions into the tree builder.
    // When Auto Layout is enabled, preserveAbsolutePosition must be false so the two flags
    // don't cancel each other out. All other optional enhancement passes remain disabled
    // here — they run separately as post-processors AFTER the tree is built.
    if (canonicalOptions.createAutoLayout) {
      console.log("[AUTO-LAYOUT] enabled — will be applied during frame tree build");
    }

    const baseSettings = {
      ...payload.settings,
      createAutoLayout: canonicalOptions.createAutoLayout,          // ← THE FIX: was always false
      createComponents: false,
      createVariables: false,
      createPaintStyles: false,
      createTextStyles: false,
      generateConstraints: false,
      // When Auto Layout is on, preserve-absolute-position must be OFF so the
      // layoutMode branch in buildFrame() is actually reached.
      preserveAbsolutePosition: canonicalOptions.createAutoLayout ? false : true,
    };

    let rootFrame = analysis.rootFrame;
    if (!rootFrame) {
      throw new Error("No rootFrame in analysis result");
    }

    if (canonicalOptions.createAutoLayout && !analysis.metadata?.isWebsite) {
      console.log("[Layout Restructuring] Auto Layout is enabled. Running layout restructuring pass on rootFrame...");
      rootFrame = restructureUINodeLayout(rootFrame);
      analysis.rootFrame = rootFrame;

      if (analysis.components && analysis.components.length > 0) {
        console.log("[Layout Restructuring] Running layout restructuring pass on component templates...");
        for (const comp of analysis.components) {
          if (comp.template) {
            comp.template = restructureUINodeLayout(comp.template);
          }
        }
      }
    } else if (analysis.metadata?.isWebsite) {
      console.log("[Layout Restructuring] Website import detected — preserving native DOM flex/grid layout structure.");
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
      // Auto Layout is applied natively during buildNodeTree (in frame-builder.ts buildFrame).
      // The post-processor pass is intentionally not used — the frame-builder handles it
      // recursively using the actual DOM layout data from the analysis JSON.
      console.log("[AUTO-LAYOUT] native tree-build pass complete — skipping redundant post-processor");
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
    validateGeometryPostProcess(result, baseGeometryMap, baseTextPropsMap, canonicalOptions.createAutoLayout);

    // LAYOUT SANITIZATION PASS
    sanitizeFigmaLayoutTree(result);

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

    // If a frame was selected on the canvas, transfer the generated design into it (unless it's a mobile companion frame)
    let finalNode: SceneNode = result;
    const isCompanionMobile = selectedFrame && selectedFrame.width > 1000 && result.width < 600;
    if (selectedFrame && selectedFrame.type === "FRAME" && !isCompanionMobile) {
      console.log(`[Target Frame] Populating generated design directly into selected frame "${selectedFrame.name}" (${selectedFrame.id})`);
      if (result.type === "FRAME") {
        const frameResult = result as FrameNode;
        selectedFrame.name = frameResult.name;
        selectedFrame.resize(frameResult.width, frameResult.height);
        selectedFrame.fills = frameResult.fills;
        selectedFrame.strokes = frameResult.strokes;
        selectedFrame.strokeWeight = frameResult.strokeWeight;
        selectedFrame.strokeAlign = frameResult.strokeAlign;
        selectedFrame.cornerRadius = frameResult.cornerRadius;
        selectedFrame.effects = frameResult.effects;
        selectedFrame.layoutMode = frameResult.layoutMode;
        selectedFrame.primaryAxisSizingMode = frameResult.primaryAxisSizingMode;
        selectedFrame.counterAxisSizingMode = frameResult.counterAxisSizingMode;
        selectedFrame.primaryAxisAlignItems = frameResult.primaryAxisAlignItems;
        selectedFrame.counterAxisAlignItems = frameResult.counterAxisAlignItems;
        selectedFrame.paddingTop = frameResult.paddingTop;
        selectedFrame.paddingRight = frameResult.paddingRight;
        selectedFrame.paddingBottom = frameResult.paddingBottom;
        selectedFrame.paddingLeft = frameResult.paddingLeft;
        selectedFrame.itemSpacing = frameResult.itemSpacing;
        selectedFrame.clipsContent = frameResult.clipsContent;

        // Clear existing children from selected frame before transferring new children
        const oldChildren = [...selectedFrame.children];
        for (const oldChild of oldChildren) {
          oldChild.remove();
        }

        const childrenToMove = [...frameResult.children];
        for (const child of childrenToMove) {
          selectedFrame.appendChild(child);
        }
        frameResult.remove();
        finalNode = selectedFrame;
      } else {
        const oldChildren = [...selectedFrame.children];
        for (const oldChild of oldChildren) {
          oldChild.remove();
        }
        selectedFrame.appendChild(result);
        finalNode = selectedFrame;
      }
    } else if (isCompanionMobile && selectedFrame) {
      result.x = selectedFrame.x + selectedFrame.width + 80;
      result.y = selectedFrame.y;
      finalNode = result;
    }

    lastGeneratedFrameId = finalNode.id;

    // Set relaunch data on the root frame
    if ("setRelaunchData" in finalNode) {
      (finalNode as FrameNode).setRelaunchData({
        regenerate: "Regenerate this design with DesignForge AI",
      });
    }

    // Zoom viewport to the result and keep selected
    figma.currentPage.selection = [finalNode];
    figma.viewport.scrollAndZoomIntoView([finalNode]);

    // Count nodes
    const nodeCount = countNodes(finalNode);
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
    const node = await figma.getNodeByIdAsync(nodeId);
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

async function handleRecolorTheme(payload: { requestId?: string }): Promise<void> {
  try {
    let targetFrames: FrameNode[] = [];
    const selection = figma.currentPage.selection;
    for (const node of selection) {
      if (node.type === "FRAME") targetFrames.push(node as FrameNode);
    }
    if (targetFrames.length === 0) {
      const topFrames = figma.currentPage.children.filter((n) => n.type === "FRAME") as FrameNode[];
      targetFrames = topFrames.filter(
        (f) => f.name.includes("VisaWala") || f.width === 1440 || f.width === 390
      );
    }

    if (targetFrames.length === 0) {
      throw new Error("No frames found to update.");
    }

    // Color definitions for Visa Consultancy Color System
    const cDeepNavy: RGB = { r: 11 / 255, g: 31 / 255, b: 58 / 255 };       // #0B1F3A
    const cRoyalBlue: RGB = { r: 21 / 255, g: 94 / 255, b: 239 / 255 };      // #155EEF
    const cSkyBlue: RGB = { r: 56 / 255, g: 189 / 255, b: 248 / 255 };       // #38BDF8
    const cSoftOffWhite: RGB = { r: 247 / 255, g: 249 / 255, b: 252 / 255 }; // #F7F9FC
    const cPureWhite: RGB = { r: 1, g: 1, b: 1 };                             // #FFFFFF
    const cSlateText: RGB = { r: 100 / 255, g: 116 / 255, b: 139 / 255 };    // #64748B
    const cLightBorder: RGB = { r: 220 / 255, g: 229 / 255, b: 240 / 255 };  // #DCE5F0
    const cEmerald: RGB = { r: 18 / 255, g: 183 / 255, b: 106 / 255 };       // #12B76A
    const cElevatedNavy: RGB = { r: 14 / 255, g: 39 / 255, b: 72 / 255 };    // #0E2748
    const cDeepestNavy: RGB = { r: 6 / 255, g: 19 / 255, b: 36 / 255 };      // #061324
    const cSoftSlate: RGB = { r: 148 / 255, g: 163 / 255, b: 184 / 255 };    // #94A3B8

    function toHex(r: number, g: number, b: number): string {
      const h = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
      return `#${h(r)}${h(g)}${h(b)}`.toLowerCase();
    }

    let nodesUpdated = 0;

    function transformColor(orig: RGB, node: SceneNode, isStroke: boolean): RGB | null {
      const hex = toHex(orig.r, orig.g, orig.b);

      // 1. Orange / Red / Coral Accents
      const isOrangeHue =
        hex === "#ff4621" ||
        hex === "#ff4b26" ||
        hex === "#ff3b30" ||
        hex === "#f44a22" ||
        hex === "#ff5500" ||
        hex === "#ff5a36" ||
        hex === "#ea580c" ||
        (orig.r > 0.8 && orig.g >= 0.15 && orig.g <= 0.48 && orig.b < 0.32);

      if (isOrangeHue) {
        if (node.type === "TEXT") {
          const txt = (node as TextNode).characters?.trim() || "";
          const parentName = node.parent?.name?.toLowerCase() || "";
          const nodeName = node.name.toLowerCase();
          if (
            txt === "No Borders." ||
            txt.includes(".com") ||
            /^\+?\d+/.test(txt) ||
            parentName.includes("badge") ||
            parentName.includes("tag") ||
            parentName.includes("eyebrow") ||
            nodeName.includes("badge") ||
            nodeName.includes("tag")
          ) {
            return cSkyBlue;
          }
          return cRoyalBlue;
        }
        const nodeName = node.name.toLowerCase();
        if (nodeName.includes("tag") || nodeName.includes("badge") || nodeName.includes("highlight")) {
          return cSkyBlue;
        }
        return cRoyalBlue;
      }

      // 2. Old Deep Black / Jet / Primary Dark Backgrounds (#0a0b0d)
      if (hex === "#0a0b0d" || hex === "#08090b" || hex === "#000000" || hex === "#050505") {
        return cDeepNavy;
      }

      // 3. Old Charcoal Cards (#111318, #12141a, #141311, #1a1816, #1e2029)
      if (
        hex === "#111318" ||
        hex === "#12141a" ||
        hex === "#141311" ||
        hex === "#1a1816" ||
        hex === "#1e2029" ||
        hex === "#13161f"
      ) {
        return cElevatedNavy;
      }

      // 4. Old Deep Footer (#060709, #060505, #040507)
      if (hex === "#060709" || hex === "#060505" || hex === "#040507") {
        return cDeepestNavy;
      }

      // 5. Old Warm Chalk / Light Backgrounds (#f8f7f4, #f7f4ee, #f4f3f0, #faf9f6)
      if (
        hex === "#f8f7f4" ||
        hex === "#f7f4ee" ||
        hex === "#f4f3f0" ||
        hex === "#faf9f6" ||
        hex === "#f5f5f5"
      ) {
        return cSoftOffWhite;
      }

      // 6. Old Light Borders (#e2ddd5, #dcd7ce, #ede8e1, #e2ddd3, #ede8de, #e9e5de)
      if (
        hex === "#e2ddd5" ||
        hex === "#dcd7ce" ||
        hex === "#ede8e1" ||
        hex === "#e2ddd3" ||
        hex === "#ede8de" ||
        hex === "#e9e5de" ||
        hex === "#e5e7eb" ||
        hex === "#e2e8f0"
      ) {
        return cLightBorder;
      }

      // 7. Old Muted Grey Text on Light (#555d6b, #636b78, #727a89, #5c574c, #767064, #6f788a, #475467)
      if (
        hex === "#555d6b" ||
        hex === "#636b78" ||
        hex === "#727a89" ||
        hex === "#5c574c" ||
        hex === "#767064" ||
        hex === "#6f788a" ||
        hex === "#475467" ||
        hex === "#667085"
      ) {
        return cSlateText;
      }

      // 8. Old Muted Grey Text on Dark (#a6afc0, #929bb0, #8c93a0, #7d8596, #cfd4de, #a0a8b8, #8c867a, #9e978a)
      if (
        hex === "#a6afc0" ||
        hex === "#929bb0" ||
        hex === "#8c93a0" ||
        hex === "#7d8596" ||
        hex === "#cfd4de" ||
        hex === "#a0a8b8" ||
        hex === "#8c867a" ||
        hex === "#9e978a"
      ) {
        return cSoftSlate;
      }

      // 9. Old Green Indicator (#00d084, #22c55e, #047857, #10b981)
      if (hex === "#00d084" || hex === "#22c55e" || hex === "#047857" || hex === "#10b981") {
        return cEmerald;
      }

      return null;
    }

    function processNode(node: SceneNode) {
      if ("fills" in node && Array.isArray((node as any).fills)) {
        const fills = [...((node as any).fills as Paint[])];
        let changed = false;
        const newFills = fills.map((f) => {
          if (f.type === "SOLID") {
            const next = transformColor(f.color, node, false);
            if (next) {
              changed = true;
              return { ...f, color: next };
            }
          } else if (
            f.type === "GRADIENT_LINEAR" ||
            f.type === "GRADIENT_RADIAL" ||
            f.type === "GRADIENT_ANGULAR" ||
            f.type === "GRADIENT_DIAMOND"
          ) {
            let gradChanged = false;
            const stops = f.gradientStops.map((stop) => {
              const next = transformColor(stop.color, node, false);
              if (next) {
                gradChanged = true;
                return { ...stop, color: { ...stop.color, r: next.r, g: next.g, b: next.b } };
              }
              return stop;
            });
            if (gradChanged) {
              changed = true;
              return { ...f, gradientStops: stops };
            }
          }
          return f;
        });
        if (changed) {
          (node as any).fills = newFills;
          nodesUpdated++;
        }
      }

      if ("strokes" in node && Array.isArray((node as any).strokes)) {
        const strokes = [...((node as any).strokes as Paint[])];
        let changed = false;
        const newStrokes = strokes.map((s) => {
          if (s.type === "SOLID") {
            const next = transformColor(s.color, node, true);
            if (next) {
              changed = true;
              return { ...s, color: next };
            }
          } else if (s.type === "GRADIENT_LINEAR" || s.type === "GRADIENT_RADIAL") {
            let gradChanged = false;
            const stops = s.gradientStops.map((stop) => {
              const next = transformColor(stop.color, node, true);
              if (next) {
                gradChanged = true;
                return { ...stop, color: { ...stop.color, r: next.r, g: next.g, b: next.b } };
              }
              return stop;
            });
            if (gradChanged) {
              changed = true;
              return { ...s, gradientStops: stops };
            }
          }
          return s;
        });
        if (changed) {
          (node as any).strokes = newStrokes;
          nodesUpdated++;
        }
      }

      if ("effects" in node && Array.isArray((node as any).effects)) {
        const effects = [...((node as any).effects as Effect[])];
        let changed = false;
        const newEffects = effects.map((eff) => {
          if ((eff.type === "DROP_SHADOW" || eff.type === "INNER_SHADOW") && eff.color) {
            const next = transformColor(eff.color, node, false);
            if (next) {
              changed = true;
              return { ...eff, color: { ...eff.color, r: next.r, g: next.g, b: next.b } };
            }
          }
          return eff;
        });
        if (changed) {
          (node as any).effects = newEffects;
          nodesUpdated++;
        }
      }

      if ("children" in node) {
        for (const child of (node as any).children) {
          processNode(child);
        }
      }
    }

    for (const frame of targetFrames) {
      processNode(frame);
    }

    figma.notify(`✨ VisaWala.com color theme updated on ${nodesUpdated} properties across ${targetFrames.length} frames!`, {
      timeout: 3500,
    });

    figma.ui.postMessage({
      type: "RECOLOR_THEME_RESULT",
      payload: {
        requestId: payload.requestId,
        success: true,
        nodesUpdated,
        framesCount: targetFrames.length,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Recolor theme failed:", err);
    figma.ui.postMessage({
      type: "RECOLOR_THEME_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to update colors",
      },
    });
  }
}

async function handleExportFrameCode(requestId?: string, nodeId?: string): Promise<void> {
  try {
    let targetNode: SceneNode | null = null;
    if (nodeId) {
      targetNode = (await figma.getNodeByIdAsync(nodeId)) as SceneNode;
    }
    if (!targetNode && figma.currentPage.selection.length > 0) {
      targetNode = figma.currentPage.selection[0];
    }
    if (!targetNode) {
      const topFrames = figma.currentPage.children.filter((n) => n.type === "FRAME") as FrameNode[];
      if (topFrames.length > 0) {
        targetNode = topFrames[topFrames.length - 1];
      }
    }

    if (!targetNode) {
      throw new Error("No frame or layer selected. Please select a frame on the canvas first.");
    }

    figma.notify(`Extracting HTML & CSS from "${targetNode.name}"...`, { timeout: 2000 });

    const codeResult = await generateCodeFromFigmaNode(targetNode);

    figma.ui.postMessage({
      type: "FRAME_CODE_EXPORTED",
      payload: {
        requestId,
        success: true,
        frameName: codeResult.frameName,
        nodeId: codeResult.nodeId,
        width: codeResult.width,
        height: codeResult.height,
        html: codeResult.html,
        css: codeResult.css,
        combinedHtml: codeResult.combinedHtml,
        nodeCount: codeResult.nodeCount,
        assets: codeResult.assets,
      },
    });

    figma.notify(`✓ Extracted ${codeResult.nodeCount} layers to clean HTML & CSS!`, { timeout: 3000 });
  } catch (err: any) {
    console.error("[Controller] Failed to export frame code:", err);
    figma.ui.postMessage({
      type: "FRAME_CODE_EXPORTED",
      payload: {
        requestId,
        success: false,
        frameName: "",
        nodeId: "",
        width: 0,
        height: 0,
        html: "",
        css: "",
        combinedHtml: "",
        nodeCount: 0,
        error: err.message || "Failed to extract code from frame",
      },
    });
    figma.notify(`❌ Export error: ${err.message || "Unknown error"}`, { error: true, timeout: 3500 });
  }
}

