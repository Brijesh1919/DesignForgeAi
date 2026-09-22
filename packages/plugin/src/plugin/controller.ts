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
      await handleGetCanvasSelection(msg.payload?.requestId, msg.payload?.maxDepth, msg.payload?.nodeId);
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

    case "EXECUTE_ADJUST_MOBILE_LAYOUT":
      await handleAdjustMobileLayout(msg.payload);
      break;

    case "EXECUTE_ADD_PROTOTYPE_EFFECTS":
      await handleAddPrototypeEffects(msg.payload);
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

async function handleGetCanvasSelection(requestId?: string, customMaxDepth = 10, nodeId?: string): Promise<void> {
  try {
    let selection = [...figma.currentPage.selection];
    if (nodeId) {
      const explicit = (await figma.getNodeByIdAsync(nodeId)) as SceneNode;
      if (explicit) selection = [explicit];
    }
    // Collect all frames on current page (including inside sections/groups)
    const allFrames: FrameNode[] = [];
    function collectAllFrames(container: any) {
      if (!container || !container.children) return;
      for (const child of container.children) {
        if (child.type === "FRAME") {
          allFrames.push(child);
        }
        if (child.type === "SECTION" || child.type === "GROUP") {
          collectAllFrames(child);
        }
      }
    }
    collectAllFrames(figma.currentPage);

    if (selection.length === 0 && allFrames.length > 0) {
      // Prioritize recently created frame or frame matching mobile or last frame
      const mob = allFrames.find((f) => f.name.toLowerCase().includes("mobile") || (f.width >= 320 && f.width <= 480));
      selection = [mob || allFrames[allFrames.length - 1]];
    }
    const maxDepth = customMaxDepth || 10;
    function safeNumber(val: any): number | undefined {
      return typeof val === "number" && !isNaN(val) ? Math.round(val) : undefined;
    }

    function inspectNodeSummary(node: SceneNode, depth = 0): any {
      const summary: any = {
        id: String(node.id || ""),
        name: String(node.name || ""),
        type: String(node.type || ""),
        width: Math.round(node.width || 0),
        height: Math.round(node.height || 0),
        x: Math.round(node.x || 0),
        y: Math.round(node.y || 0),
        layoutMode: "layoutMode" in node && typeof (node as any).layoutMode === "string" ? (node as any).layoutMode : "NONE",
        layoutPositioning: "layoutPositioning" in node && typeof (node as any).layoutPositioning === "string" ? (node as any).layoutPositioning : undefined,
        layoutSizingHorizontal: "layoutSizingHorizontal" in node && typeof (node as any).layoutSizingHorizontal === "string" ? (node as any).layoutSizingHorizontal : undefined,
        layoutSizingVertical: "layoutSizingVertical" in node && typeof (node as any).layoutSizingVertical === "string" ? (node as any).layoutSizingVertical : undefined,
        childrenCount: "children" in node && Array.isArray((node as any).children) ? (node as any).children.length : 0,
        effects: "effects" in node && Array.isArray((node as any).effects)
          ? (node as any).effects.map((e: any) => ({ type: String(e.type || ""), radius: typeof e.radius === "number" ? e.radius : 0, visible: Boolean(e.visible) }))
          : undefined,
        fills: "fills" in node && Array.isArray((node as any).fills)
          ? (node as any).fills.map((f: any) => ({ type: String(f.type || ""), visible: f.visible !== false, opacity: typeof f.opacity === "number" ? f.opacity : 1 }))
          : undefined,
        cornerRadius: "cornerRadius" in node ? safeNumber((node as any).cornerRadius) : undefined,
        strokeWeight: "strokeWeight" in node ? safeNumber((node as any).strokeWeight) : undefined,
        padding: "paddingTop" in node ? [safeNumber((node as any).paddingTop) || 0, safeNumber((node as any).paddingRight) || 0, safeNumber((node as any).paddingBottom) || 0, safeNumber((node as any).paddingLeft) || 0] : undefined,
        itemSpacing: "itemSpacing" in node ? safeNumber((node as any).itemSpacing) : undefined,
      };

      if ("reactions" in node && Array.isArray((node as any).reactions) && (node as any).reactions.length > 0) {
        summary.reactions = (node as any).reactions.map((r: any) => ({
          trigger: r.trigger ? { type: r.trigger.type } : undefined,
          actions: Array.isArray(r.actions) ? r.actions.map((a: any) => ({ type: a.type, destinationId: a.destinationId, navigation: a.navigation })) : undefined,
        }));
      }

      if (node.type === "TEXT") {
        try {
          const tn = node as TextNode;
          summary.text = String(tn.characters || "").slice(0, 100);
          summary.textAlignHorizontal = String(tn.textAlignHorizontal || "");
          summary.fontSize = typeof tn.fontSize === "number" ? Math.round(tn.fontSize) : undefined;
          summary.letterSpacing = tn.letterSpacing !== figma.mixed ? (tn.letterSpacing as any)?.value : "MIXED";
          summary.fontName = tn.fontName !== figma.mixed ? `${(tn.fontName as FontName).family} ${(tn.fontName as FontName).style}` : "MIXED";
        } catch {}
      }

      if ("children" in node && depth < maxDepth && Array.isArray((node as any).children)) {
        summary.children = (node as any).children.map((c: SceneNode) => inspectNodeSummary(c, depth + 1));
      }

      return summary;
    }

    const nodes = selection.map((node) => inspectNodeSummary(node, 0));

    figma.ui.postMessage({
      type: "CANVAS_SELECTION_RESULT",
      payload: {
        requestId,
        selection: nodes,
        availableFrames: allFrames.map((f) => ({
          id: f.id,
          name: f.name,
          width: Math.round(f.width),
          height: Math.round(f.height),
          parentType: f.parent?.type,
        })),
        currentPageName: figma.currentPage.name,
        currentPageChildren: figma.currentPage.children.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        })),
      },
    });
  } catch (err: any) {
    console.warn("[Controller] Failed to read canvas selection:", err);
    figma.ui.postMessage({
      type: "CANVAS_SELECTION_RESULT",
      payload: {
        requestId,
        selection: [],
        error: String(err?.message || err),
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
          const wasAbsolute = "layoutPositioning" in child && (child as any).layoutPositioning === "ABSOLUTE";
          const savedX = child.x;
          const savedY = child.y;
          selectedFrame.appendChild(child);
          if (wasAbsolute && "layoutPositioning" in child) {
            (child as any).layoutPositioning = "ABSOLUTE";
            child.x = savedX;
            child.y = savedY;
          }
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


async function handleAdjustMobileLayout(payload: any = {}): Promise<void> {
  try {
    const requestId = payload.requestId;
    let targetNode: FrameNode | null = null;

    if (payload.nodeId) {
      targetNode = (await figma.getNodeByIdAsync(payload.nodeId)) as FrameNode;
    }
    if (!targetNode && figma.currentPage.selection.length > 0) {
      const candidate = figma.currentPage.selection[0];
      if (candidate.type === "FRAME") {
        targetNode = candidate as FrameNode;
      } else if ("parent" in candidate && candidate.parent && candidate.parent.type === "FRAME") {
        targetNode = candidate.parent as FrameNode;
      }
    }
    if (!targetNode) {
      const allFrames: FrameNode[] = [];
      function collectFrames(c: any) {
        if (!c || !c.children) return;
        for (const ch of c.children) {
          if (ch.type === "FRAME") allFrames.push(ch);
          if (ch.type === "SECTION" || ch.type === "GROUP") collectFrames(ch);
        }
      }
      collectFrames(figma.currentPage);
      targetNode =
        allFrames.find((f) => f.name === "Option 4") ||
        allFrames.find((f) => f.name === "Option 3") ||
        allFrames.find((f) => f.name === "Option 2") ||
        allFrames.find((f) => f.name.includes("Mobile")) ||
        allFrames[allFrames.length - 1];
    }

    if (!targetNode) {
      throw new Error("No frame selected. Please select a frame in Figma first.");
    }

    figma.notify(`📱 Converting "${targetNode.name}" to responsive Mobile UI...`, { timeout: 3500 });

    const targetWidth = payload.viewportWidth || 390;
    const horizontalMargin = payload.horizontalPadding ?? 20;
    const contentWidth = targetWidth - horizontalMargin * 2; // 350px
    const sectionGap = payload.sectionSpacing ?? 28;
    const cardGap = payload.cardSpacing ?? 14;
    const buttonTargetHeight = payload.buttonHeight ?? 48;

    let nodesAdjusted = 0;
    const sectionsAnalyzed: Array<{ name: string; type: string; role: string; details: string }> = [];

    // Safe font loader
    const loadedFonts = new Set<string>();
    async function ensureFontLoaded(fontName: FontName): Promise<boolean> {
      const key = `${fontName.family}__${fontName.style}`;
      if (loadedFonts.has(key)) return true;
      try {
        await figma.loadFontAsync(fontName);
        loadedFonts.add(key);
        return true;
      } catch {
        try {
          const fallback: FontName = { family: "Inter", style: "Regular" };
          await figma.loadFontAsync(fallback);
          return true;
        } catch {
          return false;
        }
      }
    }

    async function loadAndPrepareFont(textNode: TextNode): Promise<boolean> {
      const fallback: FontName = { family: "Inter", style: "Regular" };
      const fallbackBold: FontName = { family: "Inter", style: "Bold" };
      const fallbackMedium: FontName = { family: "Inter", style: "Medium" };

      await ensureFontLoaded(fallback);
      await ensureFontLoaded(fallbackBold);
      await ensureFontLoaded(fallbackMedium);

      if (textNode.fontName === figma.mixed) {
        try {
          const segments = textNode.getStyledTextSegments(["fontName"]);
          for (const seg of segments) {
            if (seg.fontName) {
              try {
                await figma.loadFontAsync(seg.fontName);
              } catch {
                try {
                  textNode.setRangeFontName(seg.start, seg.end, fallback);
                } catch {}
              }
            }
          }
          return true;
        } catch {
          try {
            textNode.setRangeFontName(0, textNode.characters.length, fallback);
            return true;
          } catch {
            return false;
          }
        }
      }

      // Single font
      const currentFont = textNode.fontName as FontName;
      try {
        await figma.loadFontAsync(currentFont);
        return true;
      } catch {
        // Current font is missing / unloadable on client machine!
        // We MUST replace it with Inter so Figma allows changing letterSpacing and fontSize!
        try {
          const styleStr = (currentFont.style || "").toLowerCase();
          const targetStyle = styleStr.includes("bold") ? "Bold" : (styleStr.includes("medium") || styleStr.includes("semi") ? "Medium" : "Regular");
          const chosenFallback: FontName = { family: "Inter", style: targetStyle };
          try {
            await figma.loadFontAsync(chosenFallback);
            textNode.fontName = chosenFallback;
          } catch {
            textNode.fontName = fallback;
          }
          return true;
        } catch {
          return false;
        }
      }
    }

    function safeSetLayout(n: any, canStretch = true) {
      try {
        if ("layoutPositioning" in n) n.layoutPositioning = "AUTO";
      } catch {}
      try {
        if ("layoutAlign" in n) n.layoutAlign = canStretch ? "STRETCH" : "INHERIT";
      } catch {}
    }

    function isIconNode(node: SceneNode): boolean {
      if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "STAR" || node.type === "LINE") {
        return true;
      }
      const n = (node.name || "").toLowerCase();
      const iconKeywords = [
        "icon", "outline", "caret", "arrow", "search", "bag", "cart", "user",
        "menu", "hamburger", "close", "vector", "svg", "star", "chevron", "check",
        "bx:", "eva:", "bitcoin-icons:", "lucide:", "tabler:", "heroicons:", "feather:",
        "bell", "heart", "share", "filter", "sort", "dots", "plus", "minus", "cross"
      ];
      const hasIconName = iconKeywords.some((kw) => n.includes(kw));
      if (hasIconName) {
        if (node.height <= 64 || node.width <= 64 || (node.height <= 80 && node.width <= 160)) return true;
      }
      if (node.type === "FRAME" || node.type === "INSTANCE" || node.type === "GROUP") {
        if (node.width <= 44 && node.height <= 44) return true;
        if ("children" in node && (node as any).children.length > 0 && (node as any).children.length <= 4) {
          const onlyVectors = (node as any).children.every(
            (c: any) => c.type === "VECTOR" || c.type === "LINE" || c.type === "RECTANGLE" || c.type === "GROUP" || c.type === "BOOLEAN_OPERATION"
          );
          if (onlyVectors && node.height <= 50) return true;
        }
      }
      return false;
    }

    function createHamburgerIcon(): FrameNode {
      const icon = figma.createFrame();
      icon.name = "Mobile Menu Icon";
      icon.resize(26, 26);
      icon.fills = [];
      icon.layoutMode = "VERTICAL";
      icon.primaryAxisAlignItems = "CENTER";
      icon.counterAxisAlignItems = "CENTER";
      icon.primaryAxisSizingMode = "FIXED";
      icon.counterAxisSizingMode = "FIXED";
      icon.itemSpacing = 4;
      icon.paddingLeft = 3;
      icon.paddingRight = 3;
      icon.paddingTop = 5;
      icon.paddingBottom = 5;

      for (let i = 0; i < 3; i++) {
        const bar = figma.createRectangle();
        bar.name = `bar-${i + 1}`;
        bar.resize(20, 2.5);
        bar.cornerRadius = 1.25;
        bar.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.95 }];
        icon.appendChild(bar);
      }
      return icon;
    }

    function createCloseIcon(): FrameNode {
      const icon = figma.createFrame();
      icon.name = "Close Icon";
      icon.resize(36, 36);
      icon.fills = [];
      icon.layoutMode = "HORIZONTAL";
      icon.primaryAxisAlignItems = "CENTER";
      icon.counterAxisAlignItems = "CENTER";
      const txt = figma.createText();
      txt.characters = "✕";
      txt.fontSize = 18;
      txt.letterSpacing = { value: 0, unit: "PIXELS" };
      txt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.85 }];
      icon.appendChild(txt);
      return icon;
    }

    async function createMobileNavDrawer(categoryLinks: string[], brandAccent: RGB = { r: 0.85, g: 0.35, b: 0.15 }): Promise<{ drawer: ComponentNode; closeBtn: FrameNode; navItemRows: FrameNode[]; ctaBtn: FrameNode }> {
      const drawer = figma.createComponent();
      drawer.name = "Mobile Navigation Drawer (Component)";
      drawer.resize(390, 100);
      drawer.fills = [{ type: "SOLID", color: { r: 0.08, g: 0.08, b: 0.09 }, opacity: 1 }];
      drawer.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
      drawer.strokeWeight = 1;
      drawer.cornerRadius = 16;
      drawer.layoutMode = "VERTICAL";
      drawer.primaryAxisSizingMode = "AUTO"; // Hug
      drawer.counterAxisSizingMode = "FIXED"; // 390px
      drawer.primaryAxisAlignItems = "MIN";
      drawer.counterAxisAlignItems = "CENTER";
      drawer.itemSpacing = 0;
      drawer.paddingLeft = 16;
      drawer.paddingRight = 16;
      drawer.paddingTop = 16;
      drawer.paddingBottom = 20;

      // Header row
      const headerRow = figma.createFrame();
      headerRow.name = "Drawer Header";
      headerRow.resize(358, 44);
      headerRow.fills = [];
      headerRow.layoutMode = "HORIZONTAL";
      headerRow.primaryAxisSizingMode = "FIXED";
      headerRow.counterAxisSizingMode = "AUTO";
      headerRow.primaryAxisAlignItems = "SPACE_BETWEEN";
      headerRow.counterAxisAlignItems = "CENTER";

      const titleText = figma.createText();
      await ensureFontLoaded({ family: "Inter", style: "Bold" });
      titleText.fontName = { family: "Inter", style: "Bold" };
      titleText.characters = "Explore Products";
      titleText.fontSize = 16;
      titleText.letterSpacing = { value: 0, unit: "PIXELS" };
      titleText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.95 }];
      headerRow.appendChild(titleText);

      const closeBtn = createCloseIcon();
      headerRow.appendChild(closeBtn);
      drawer.appendChild(headerRow);

      // Divider
      const div1 = figma.createRectangle();
      div1.name = "Divider";
      div1.resize(358, 1);
      div1.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
      drawer.appendChild(div1);

      // List rows for each category
      const navItemRows: FrameNode[] = [];
      const links = categoryLinks.length > 0 ? categoryLinks : ["Mugs", "Tumblers", "Water Bottles", "Coolers", "Accessories", "Customize", "B2B Bulk Orders"];
      for (const linkText of links) {
        const row = figma.createFrame();
        row.name = `Nav Item — ${linkText}`;
        row.resize(358, 48);
        row.fills = [];
        row.layoutMode = "HORIZONTAL";
        row.primaryAxisSizingMode = "FIXED";
        row.counterAxisSizingMode = "AUTO";
        row.primaryAxisAlignItems = "SPACE_BETWEEN";
        row.counterAxisAlignItems = "CENTER";
        row.paddingTop = 12;
        row.paddingBottom = 12;

        const rowText = figma.createText();
        await ensureFontLoaded({ family: "Inter", style: "Medium" });
        rowText.fontName = { family: "Inter", style: "Medium" };
        rowText.characters = linkText;
        rowText.fontSize = 15;
        rowText.letterSpacing = { value: 0, unit: "PIXELS" };
        rowText.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 }, opacity: 1 }];
        row.appendChild(rowText);

        const chevron = figma.createText();
        await ensureFontLoaded({ family: "Inter", style: "Regular" });
        chevron.fontName = { family: "Inter", style: "Regular" };
        chevron.characters = "›";
        chevron.fontSize = 18;
        chevron.letterSpacing = { value: 0, unit: "PIXELS" };
        chevron.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 }, opacity: 1 }];
        row.appendChild(chevron);

        drawer.appendChild(row);
        navItemRows.push(row);

        const itemDiv = figma.createRectangle();
        itemDiv.name = "Divider";
        itemDiv.resize(358, 1);
        itemDiv.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.05 }];
        drawer.appendChild(itemDiv);
      }

      // Drawer Bottom CTA
      const ctaBtn = figma.createFrame();
      ctaBtn.name = "Drawer CTA Button";
      ctaBtn.resize(358, 48);
      ctaBtn.fills = [{ type: "SOLID", color: brandAccent, opacity: 1 }];
      ctaBtn.cornerRadius = 8;
      ctaBtn.layoutMode = "HORIZONTAL";
      ctaBtn.primaryAxisAlignItems = "CENTER";
      ctaBtn.counterAxisAlignItems = "CENTER";
      ctaBtn.paddingTop = 12;
      ctaBtn.paddingBottom = 12;

      const btnText = figma.createText();
      await ensureFontLoaded({ family: "Inter", style: "Bold" });
      btnText.fontName = { family: "Inter", style: "Bold" };
      btnText.characters = "Request Custom Quote ↗";
      btnText.fontSize = 15;
      btnText.letterSpacing = { value: 0, unit: "PIXELS" };
      btnText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 1 }];
      ctaBtn.appendChild(btnText);
      drawer.appendChild(ctaBtn);

      return { drawer, closeBtn, navItemRows, ctaBtn };
    }

    async function createMobileHeaderBar(logoNode: SceneNode | null): Promise<{ header: FrameNode; hamburger: FrameNode; menuBtn: FrameNode }> {
      const header = figma.createFrame();
      header.name = "Mobile Header Bar (56px)";
      header.resize(390, 56);
      header.layoutMode = "HORIZONTAL";
      header.primaryAxisSizingMode = "FIXED";
      header.counterAxisSizingMode = "AUTO";
      header.primaryAxisAlignItems = "SPACE_BETWEEN";
      header.counterAxisAlignItems = "CENTER";
      header.paddingLeft = 16;
      header.paddingRight = 16;
      header.paddingTop = 10;
      header.paddingBottom = 10;
      header.fills = [{ type: "SOLID", color: { r: 0.07, g: 0.07, b: 0.08 }, opacity: 1 }];

      // Left: Logo container
      const logoContainer = figma.createFrame();
      logoContainer.name = "Logo Container";
      logoContainer.resize(110, 36);
      logoContainer.fills = [];
      logoContainer.layoutMode = "HORIZONTAL";
      logoContainer.primaryAxisAlignItems = "MIN";
      logoContainer.counterAxisAlignItems = "CENTER";

      if (logoNode) {
        const clonedLogo = logoNode.clone();
        clonedLogo.name = "Brand Logo";
        if (clonedLogo.width > 0 && clonedLogo.height > 0) {
          const ratio = clonedLogo.height / clonedLogo.width;
          const targetH = Math.min(28, clonedLogo.height);
          const targetW = Math.min(120, Math.round(targetH / ratio));
          try { clonedLogo.resize(targetW, targetH); } catch {}
        }
        logoContainer.resize(clonedLogo.width, 36);
        logoContainer.appendChild(clonedLogo);
      } else {
        const brandTxt = figma.createText();
        await ensureFontLoaded({ family: "Inter", style: "Bold" });
        brandTxt.fontName = { family: "Inter", style: "Bold" };
        brandTxt.characters = "PELICAN";
        brandTxt.fontSize = 18;
        brandTxt.letterSpacing = { value: 0, unit: "PIXELS" };
        brandTxt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 1 }];
        logoContainer.appendChild(brandTxt);
      }
      header.appendChild(logoContainer);

      // Right: Action Group (Search + Bag + Dedicated Menu Button)
      const actionGroup = figma.createFrame();
      actionGroup.name = "Header Actions";
      actionGroup.resize(110, 36);
      actionGroup.fills = [];
      actionGroup.layoutMode = "HORIZONTAL";
      actionGroup.primaryAxisSizingMode = "AUTO";
      actionGroup.counterAxisSizingMode = "AUTO";
      actionGroup.primaryAxisAlignItems = "MAX";
      actionGroup.counterAxisAlignItems = "CENTER";
      actionGroup.itemSpacing = 12;

      const searchBtn = figma.createFrame();
      searchBtn.name = "Search Action";
      searchBtn.resize(24, 24);
      searchBtn.fills = [];
      const sTxt = figma.createText();
      await ensureFontLoaded({ family: "Inter", style: "Regular" });
      sTxt.fontName = { family: "Inter", style: "Regular" };
      sTxt.characters = "🔍";
      sTxt.fontSize = 14;
      searchBtn.appendChild(sTxt);
      searchBtn.layoutMode = "HORIZONTAL";
      searchBtn.primaryAxisAlignItems = "CENTER";
      searchBtn.counterAxisAlignItems = "CENTER";
      actionGroup.appendChild(searchBtn);

      const bagBtn = figma.createFrame();
      bagBtn.name = "Cart Action";
      bagBtn.resize(24, 24);
      bagBtn.fills = [];
      const bTxt = figma.createText();
      await ensureFontLoaded({ family: "Inter", style: "Regular" });
      bTxt.fontName = { family: "Inter", style: "Regular" };
      bTxt.characters = "🛍";
      bTxt.fontSize = 15;
      bagBtn.appendChild(bTxt);
      bagBtn.layoutMode = "HORIZONTAL";
      bagBtn.primaryAxisAlignItems = "CENTER";
      bagBtn.counterAxisAlignItems = "CENTER";
      actionGroup.appendChild(bagBtn);

      // Dedicated Touch-Friendly List / Menu Button
      const menuBtn = figma.createFrame();
      menuBtn.name = "Menu Button (List Icon)";
      menuBtn.resize(36, 36);
      menuBtn.fills = [];
      menuBtn.layoutMode = "HORIZONTAL";
      menuBtn.primaryAxisAlignItems = "CENTER";
      menuBtn.counterAxisAlignItems = "CENTER";

      const hamburger = createHamburgerIcon();
      menuBtn.appendChild(hamburger);
      actionGroup.appendChild(menuBtn);

      header.appendChild(actionGroup);
      return { header, hamburger, menuBtn };
    }

    // 1. Sort direct children by their Y position (or X if same row)
    const sortedDirectChildren = [...targetNode.children].sort((a, b) => (Math.abs(a.y - b.y) < 15 ? a.x - b.x : a.y - b.y));

    // 2. Configure targetNode as vertical Auto Layout
    targetNode.resize(targetWidth, targetNode.height);
    targetNode.layoutMode = "VERTICAL";
    targetNode.primaryAxisSizingMode = "AUTO"; // Hug content vertically
    targetNode.counterAxisSizingMode = "FIXED"; // Exactly 390px wide
    targetNode.primaryAxisAlignItems = "MIN";
    targetNode.counterAxisAlignItems = "CENTER";
    targetNode.itemSpacing = 0;
    targetNode.paddingTop = 0;
    targetNode.paddingBottom = 48; // Clean bottom clearance on mobile
    targetNode.paddingLeft = 0;
    targetNode.paddingRight = 0;
    targetNode.clipsContent = true;
    nodesAdjusted++;

    // 3. Scan for Announcement Bar and Web Navigation
    let announcementNode: SceneNode | null = null;
    let navSectionNode: SceneNode | null = null;
    let logoFound: SceneNode | null = null;
    const categoryLinksFound: string[] = [];

    for (let i = 0; i < Math.min(4, sortedDirectChildren.length); i++) {
      const s = sortedDirectChildren[i];
      const sName = (s.name || "").toLowerCase();

      // Check for Announcement Bar
      let isAnnounce = sName.includes("banner") || sName.includes("announc");
      function scanAnnounce(n: any) {
        if (!n) return;
        if (n.type === "TEXT" && n.characters) {
          const t = n.characters.toLowerCase();
          if (t.includes("off") || t.includes("deal") || t.includes("sale") || t.includes("free shipping")) {
            isAnnounce = true;
          }
        }
        if (n.children && Array.isArray(n.children)) n.children.forEach(scanAnnounce);
      }
      scanAnnounce(s);

      if (isAnnounce && s.height <= 60 && !announcementNode) {
        announcementNode = s;
        continue;
      }

      // Check for Web Navigation
      let hasLogoOrLinks = false;
      function scanNav(n: any) {
        if (!n) return;
        const name = (n.name || "").toLowerCase();
        if ((name.includes("logo") || (n.fills && Array.isArray(n.fills) && n.fills.some((f: any) => f.type === "IMAGE") && n.height <= 80 && n.width >= 40)) && !logoFound) {
          logoFound = n;
          hasLogoOrLinks = true;
        }
        if (n.type === "TEXT" && n.characters) {
          const t = n.characters.trim();
          if (["MUGS", "TUMBLERS", "WATER BOTTLES", "COOLER", "COOLERS", "ACCESSORIES", "CUSTOMIZE", "B2B", "SHOP", "ABOUT", "PRODUCTS"].includes(t.toUpperCase())) {
            if (!categoryLinksFound.includes(t)) categoryLinksFound.push(t);
            hasLogoOrLinks = true;
          }
        }
        if (n.children && Array.isArray(n.children)) n.children.forEach(scanNav);
      }
      scanNav(s);

      if ((hasLogoOrLinks || sName.includes("nav") || sName.includes("header") || sName.includes("menu")) && !navSectionNode) {
        navSectionNode = s;
      }
    }

    // 4. Process Announcement Bar first if present (Centered on mobile)
    if (announcementNode) {
      safeSetLayout(announcementNode);
      try {
        if ("resize" in announcementNode) (announcementNode as any).resize(targetWidth, 36);
      } catch {}
      if (announcementNode.type === "FRAME") {
        const bFrame = announcementNode as FrameNode;
        try {
          bFrame.layoutMode = "HORIZONTAL";
          bFrame.primaryAxisSizingMode = "FIXED";
          bFrame.counterAxisSizingMode = "AUTO";
          bFrame.primaryAxisAlignItems = "CENTER";
          bFrame.counterAxisAlignItems = "CENTER";
          bFrame.paddingLeft = 12;
          bFrame.paddingRight = 12;
        } catch {}
        for (const c of bFrame.children) {
          await formatBlock(c, targetWidth - 24, true);
        }
      }
      targetNode.insertChild(0, announcementNode);
      sectionsAnalyzed.push({ name: announcementNode.name, type: announcementNode.type, role: "Announcement Bar", details: "390px full width, centered 12-13px announcement text" });
      nodesAdjusted++;
    }

    // 5. Replace Web Navigation with Mobile Header Bar & Standalone Drawer Component
    if (navSectionNode) {
      const oldDrawers = figma.currentPage.children.filter(
        (c) => c.name.includes("Mobile Navigation Drawer") && Math.abs(c.y - targetNode.y) < 600
      );
      for (const oldD of oldDrawers) {
        try { oldD.remove(); } catch {}
      }

      const { header: mobileHeader, hamburger, menuBtn } = await createMobileHeaderBar(logoFound);
      const { drawer: mobileDrawer, closeBtn, navItemRows, ctaBtn } = await createMobileNavDrawer(categoryLinksFound);

      const insertIndex = announcementNode ? 1 : 0;
      targetNode.insertChild(insertIndex, mobileHeader);

      // Place mobileDrawer outside targetNode on canvas as a standalone reusable Component!
      figma.currentPage.appendChild(mobileDrawer);
      mobileDrawer.x = targetNode.x + targetNode.width + 60;
      mobileDrawer.y = targetNode.y;

      // Connect hamburger menu icon and menu button to open mobileDrawer as an overlay in prototype playing mode!
      const openDrawerReaction = {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: mobileDrawer.id,
            navigation: "OVERLAY",
            transition: {
              type: "MOVE_IN",
              direction: "TOP",
              matchLayers: false,
              duration: 0.3,
              easing: { type: "EASE_OUT" },
            },
          },
        ],
        action: {
          type: "NODE",
          destinationId: mobileDrawer.id,
          navigation: "OVERLAY",
          transition: {
            type: "MOVE_IN",
            direction: "TOP",
            matchLayers: false,
            duration: 0.3,
            easing: { type: "EASE_OUT" },
          },
        },
      };

      try {
        await (menuBtn as any).setReactionsAsync([openDrawerReaction]);
      } catch (err) {
        console.warn("[Controller] Failed to set menuBtn reaction:", err);
      }
      try {
        await (hamburger as any).setReactionsAsync([openDrawerReaction]);
      } catch (err) {
        console.warn("[Controller] Failed to set hamburger reaction:", err);
      }
      for (const bar of hamburger.children) {
        try {
          await (bar as any).setReactionsAsync([openDrawerReaction]);
        } catch {}
      }

      // Connect close button to dismiss overlay
      const closeReaction = {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "BACK",
          },
        ],
        action: {
          type: "BACK",
        },
      };
      try {
        await (closeBtn as any).setReactionsAsync([closeReaction]);
        for (const c of closeBtn.children) {
          try { await (c as any).setReactionsAsync([closeReaction]); } catch {}
        }
      } catch (err) {
        console.warn("[Controller] Failed to set closeBtn reaction:", err);
      }

      for (const row of navItemRows) {
        try {
          await (row as any).setReactionsAsync([closeReaction]);
        } catch {}
      }
      try {
        await (ctaBtn as any).setReactionsAsync([closeReaction]);
      } catch {}

      // Set current frame as prototype start node so pressing Play in Figma begins directly here
      try {
        figma.currentPage.prototypeStartNode = targetNode;
      } catch {}

      try { navSectionNode.remove(); } catch {}

      sectionsAnalyzed.push({
        name: "Mobile Header & Drawer",
        type: "COMPONENT",
        role: "Mobile Navigation Component",
        details: "Created 56px Mobile Header Bar with List/Menu icon wired to standalone Mobile Drawer Menu Component on canvas (Prototype Overlay ON_CLICK).",
      });
      nodesAdjusted += 10;
    }

    // 6. Unpack main content wrapper if sections are nested in a single container
    const rawChildren = [...targetNode.children].filter(
      (c) => c !== announcementNode && !c.name.includes("Mobile Header") && !c.name.includes("Mobile Navigation Drawer")
    );

    const sectionsToFormat: SceneNode[] = [];
    for (const child of rawChildren) {
      if (
        child.type === "FRAME" &&
        (child as FrameNode).children.length >= 2 &&
        child.height > 600
      ) {
        // This is a wrapper frame enclosing multiple sections!
        const sectionKids = [...(child as FrameNode).children].sort((a, b) => (Math.abs(a.y - b.y) < 15 ? a.x - b.x : a.y - b.y));
        for (const sk of sectionKids) {
          targetNode.appendChild(sk);
          sectionsToFormat.push(sk);
        }
        try { child.remove(); } catch {}
      } else {
        sectionsToFormat.push(child);
      }
    }

    // Process each content section
    for (let sIdx = 0; sIdx < sectionsToFormat.length; sIdx++) {
      const section = sectionsToFormat[sIdx];
      const secName = (section.name || "").toLowerCase();
      safeSetLayout(section);

      if (section.type === "FRAME" || section.type === "INSTANCE" || section.type === "COMPONENT") {
        const contentFrame = section as FrameNode;
        try {
          contentFrame.resize(targetWidth, contentFrame.height);
        } catch {}

        const kids = [...contentFrame.children].sort((a, b) => (Math.abs(a.y - b.y) < 15 ? a.x - b.x : a.y - b.y));
        for (const k of kids) {
          try { contentFrame.appendChild(k); } catch {}
        }

        const isHero = sIdx === 0 || secName.includes("hero") || secName.includes("banner");
        const isFooter = sIdx === sectionsToFormat.length - 1 || secName.includes("footer");
        const isSteps = secName.includes("work") || secName.includes("step") || secName.includes("process");
        const isStats = secName.includes("order") || secName.includes("stat") || secName.includes("unit");
        const isFormSection = secName.includes("quote") || secName.includes("form") || secName.includes("contact");

        // Mobile UI guidelines: Hero, Footer, Steps, Stats, and Section Intros default to CENTER
        const shouldCenterSection = isHero || isFooter || isSteps || isStats;

        try {
          contentFrame.layoutMode = "VERTICAL";
          contentFrame.primaryAxisSizingMode = "AUTO"; // Hug
          contentFrame.counterAxisSizingMode = "FIXED"; // 390px
          contentFrame.primaryAxisAlignItems = "MIN";
          contentFrame.counterAxisAlignItems = "CENTER";
          contentFrame.itemSpacing = sectionGap;
          contentFrame.paddingLeft = 0;
          contentFrame.paddingRight = 0;
          contentFrame.paddingTop = 16;
          contentFrame.paddingBottom = 28;
          contentFrame.clipsContent = true;
        } catch {}
        nodesAdjusted++;

        const role = isFooter ? "Footer Section" : isHero ? "Hero Section" : isFormSection ? "Form Section" : isSteps ? "Process / Steps Section" : "Content Showcase Section";

        for (const card of kids) {
          await formatBlock(card, contentWidth, shouldCenterSection);
        }

        sectionsAnalyzed.push({
          name: section.name,
          type: section.type,
          role,
          details: `Vertical Auto Layout (390px), ${kids.length} stacked blocks formatted (${shouldCenterSection ? "Center Aligned" : "Responsive Layout"})`,
        });
      }
    }

    // Helper: Proportional mobile corner radius according to mobile design guidelines
    function applySmartCornerRadius(f: FrameNode, isBtn: boolean) {
      if (isIconNode(f)) { f.cornerRadius = 0; return; }
      if (f.height <= 4) { f.cornerRadius = 0; return; } // Dividers, underlines
      if (isBtn) { f.cornerRadius = 8; return; } // Standard button
      if (f.height <= 28) { f.cornerRadius = 4; return; } // Tags, badges, chips
      if (f.height <= 54) { f.cornerRadius = 8; return; } // Inputs, form fields
      if (f.width >= 160 && f.height >= 60) { f.cornerRadius = 12; return; } // Cards
      f.cornerRadius = 6;
    }

    function isEffectivelyEmpty(n: any): boolean {
      if (!n) return true;
      if (n.type === "TEXT") return !n.characters || n.characters.trim().length === 0;
      if (n.type === "VECTOR" || n.type === "LINE" || n.type === "RECTANGLE" || n.type === "ELLIPSE") {
        return false;
      }
      const hasFills = n.fills && Array.isArray(n.fills) && n.fills.some((f: any) => f.visible !== false);
      const hasStrokes = n.strokes && Array.isArray(n.strokes) && n.strokes.some((s: any) => s.visible !== false);
      if (hasFills || hasStrokes) return false;
      if (!n.children || n.children.length === 0) return true;
      return n.children.every((c: any) => isEffectivelyEmpty(c));
    }

    // Recursive helper to format cards, grids, buttons, icons, and text
    async function formatBlock(node: SceneNode, maxWidth: number, centerAlign = false) {
      // 1. Icon Normalization
      if (isIconNode(node)) {
        nodesAdjusted++;
        const targetSize = 24;
        try {
          if ("resize" in node) (node as any).resize(targetSize, targetSize);
        } catch {}
        safeSetLayout(node, false); // INHERIT, never STRETCH!
        try {
          if ("layoutSizingHorizontal" in node) (node as any).layoutSizingHorizontal = "FIXED";
          if ("layoutSizingVertical" in node) (node as any).layoutSizingVertical = "FIXED";
          if ("cornerRadius" in node) (node as any).cornerRadius = 0;
          if ("paddingTop" in node) {
            (node as any).paddingTop = 0;
            (node as any).paddingRight = 0;
            (node as any).paddingBottom = 0;
            (node as any).paddingLeft = 0;
          }
        } catch {}

        // Scale vector children proportionally within 18x18 and center them
        if ("children" in node && Array.isArray((node as any).children)) {
          const maxDim = 18;
          for (const vc of (node as any).children) {
            if (vc.type === "VECTOR" || vc.type === "LINE" || vc.type === "RECTANGLE" || vc.type === "GROUP") {
              if (vc.width > maxDim || vc.height > maxDim) {
                const scale = Math.min(maxDim / vc.width, maxDim / vc.height);
                try {
                  vc.resize(Math.max(1, Math.round(vc.width * scale)), Math.max(1, Math.round(vc.height * scale)));
                } catch {}
              }
              try {
                vc.x = Math.round((24 - vc.width) / 2);
                vc.y = Math.round((24 - vc.height) / 2);
              } catch {}
            }
          }
        }
        return;
      }

      // 2. Empty spacer frame elimination: REMOVE from tree!
      if (isEffectivelyEmpty(node)) {
        try {
          node.remove();
          nodesAdjusted++;
          return;
        } catch {}
      }

      // 3. Frame / Component / Instance Formatting
      let workingNode: SceneNode = node;
      if (node.type === "INSTANCE") {
        try {
          workingNode = (node as InstanceNode).detachInstance();
          nodesAdjusted++;
        } catch {
          workingNode = node;
        }
      }

      if (
        workingNode.type === "FRAME" ||
        workingNode.type === "COMPONENT" ||
        workingNode.type === "COMPONENT_SET" ||
        workingNode.type === "INSTANCE" ||
        workingNode.type === "GROUP"
      ) {
        const frame = workingNode as FrameNode;
        nodesAdjusted++;

        const frameWidth = Math.min(maxWidth, Math.max(30, frame.width));
        try {
          frame.resize(frameWidth, frame.height);
          if ("clipsContent" in frame) frame.clipsContent = true;
        } catch {}
        safeSetLayout(frame, true);

        const hasVisualBackground =
          "fills" in frame &&
          Array.isArray(frame.fills) &&
          frame.fills.length > 0 &&
          (frame.fills[0] as any).visible !== false;

        const children = "children" in frame && Array.isArray((frame as any).children) ? [...(frame as any).children] : [];

        // Check if this container is an intro, hero, or section header that should be center-aligned
        const fName = (frame.name || "").toLowerCase();
        const isHero = fName.includes("hero") || fName.includes("banner");
        const isHeaderOrIntro = fName.includes("header") || fName.includes("title") || fName.includes("intro") || fName.includes("badge") || fName.includes("tag");
        const isFormRow = fName.includes("input") || fName.includes("field") || fName.includes("form") || fName.includes("dropdown") || fName.includes("message") || fName.includes("email") || fName.includes("quantity");
        const isCard = fName.includes("card") || (hasVisualBackground && frameWidth < 300);

        const isTextOnlyGroup = children.length >= 1 && children.every(c => c.type === "TEXT");
        const hasLargeHeading = children.some(c => c.type === "TEXT" && typeof (c as TextNode).fontSize === "number" && (c as TextNode).fontSize >= 18);

        let shouldCenterThis = centerAlign;
        if (isFormRow) {
          shouldCenterThis = false; // Form labels and input fields stay cleanly left-aligned!
        } else if (isHero || isHeaderOrIntro || isTextOnlyGroup || (hasLargeHeading && !isCard)) {
          shouldCenterThis = true;
        }

        // Check if this frame is a button
        const isButton =
          frame.name.toLowerCase().includes("btn") ||
          frame.name.toLowerCase().includes("button") ||
          frame.name.toLowerCase().includes("cta") ||
          (children.length <= 2 &&
            children.some((c) => c.type === "TEXT") &&
            frame.height >= 32 &&
            frame.height <= 64 &&
            hasVisualBackground);

        if (isButton && "layoutMode" in frame && frame.type !== "INSTANCE") {
          try {
            frame.layoutMode = "HORIZONTAL";
            frame.primaryAxisSizingMode = "AUTO";
            frame.counterAxisSizingMode = "FIXED";
            frame.resize(Math.min(maxWidth, Math.max(140, frame.width)), buttonTargetHeight);
            frame.primaryAxisAlignItems = "CENTER";
            frame.counterAxisAlignItems = "CENTER";
            frame.paddingLeft = 20;
            frame.paddingRight = 20;
            frame.paddingTop = 12;
            frame.paddingBottom = 12;
            frame.cornerRadius = 8;
            if (shouldCenterThis || centerAlign) {
              frame.layoutAlign = "INHERIT"; // centered in auto layout parent!
            }
          } catch {}
          for (const c of children) {
            if (c.type === "TEXT") {
              const t = c as TextNode;
              await loadAndPrepareFont(t);
              t.fontSize = Math.min(16, Math.max(14, typeof t.fontSize === "number" ? t.fontSize : 15));
              t.textAutoResize = "WIDTH_AND_HEIGHT";
              t.textAlignHorizontal = "CENTER";
              try {
                t.letterSpacing = { value: 0, unit: "PIXELS" };
              } catch {}
            }
          }
          return;
        }

        // Check if this frame is a dropdown (e.g. form input with caret)
        const isDropdown = children.some(c => (c.name || "").toLowerCase().includes("caret") || (c.name || "").toLowerCase().includes("down"));
        if (isDropdown && "layoutMode" in frame && frame.type !== "INSTANCE") {
          try {
            frame.layoutMode = "HORIZONTAL";
            frame.primaryAxisSizingMode = "AUTO";
            frame.counterAxisSizingMode = "FIXED";
            frame.resize(frameWidth, 46);
            frame.primaryAxisAlignItems = "SPACE_BETWEEN";
            frame.counterAxisAlignItems = "CENTER";
            frame.paddingLeft = 14;
            frame.paddingRight = 14;
            frame.cornerRadius = 8;
          } catch {}
        }

        // Determine if children should be HORIZONTAL or VERTICAL
        let canBeHorizontal = false;
        if (children.length >= 2 && children.length <= 5) {
          const totalKidsWidth =
            children.reduce((sum, c) => sum + Math.min(c.width, maxWidth), 0) + (children.length - 1) * 8;
          if (totalKidsWidth <= maxWidth && children.every((c) => c.width < maxWidth * 0.6)) {
            const yDiffs = Math.abs(children[0].y - children[1].y);
            if (yDiffs < 25) canBeHorizontal = true;
          }
        }
        if (children.length >= 2 && children.every(c => isIconNode(c))) {
          canBeHorizontal = true;
        }

        if ("layoutMode" in frame && frame.type !== "INSTANCE") {
          try {
            if (canBeHorizontal) {
              const sortedH = children.sort((a, b) => a.x - b.x);
              for (const c of sortedH) frame.appendChild(c);
              frame.layoutMode = "HORIZONTAL";
              frame.primaryAxisSizingMode = "AUTO";
              frame.counterAxisSizingMode = "AUTO";
              frame.primaryAxisAlignItems = shouldCenterThis ? "CENTER" : "MIN";
              frame.counterAxisAlignItems = "CENTER";
              frame.itemSpacing = 8;
            } else {
              const sortedV = children.sort((a, b) => (Math.abs(a.y - b.y) < 15 ? a.x - b.x : a.y - b.y));
              for (const c of sortedV) frame.appendChild(c);
              frame.layoutMode = "VERTICAL";
              frame.primaryAxisSizingMode = "AUTO";
              frame.counterAxisSizingMode = "FIXED";
              frame.primaryAxisAlignItems = "MIN";
              frame.counterAxisAlignItems = shouldCenterThis ? "CENTER" : "MIN";

              // Smart itemSpacing based on context
              const isFormGroup = children.length === 2 && children[0].type === "TEXT";
              const isTextGroup = children.every(c => c.type === "TEXT");
              frame.itemSpacing = isFormGroup ? 6 : (isTextGroup ? 8 : cardGap);
            }

            if (hasVisualBackground) {
              applySmartCornerRadius(frame, isButton);
              const pad = isButton ? 12 : (frameWidth >= 200 ? 14 : 8);
              frame.paddingTop = pad;
              frame.paddingBottom = pad;
              frame.paddingLeft = pad;
              frame.paddingRight = pad;
            }
          } catch {}
        }

        const innerPad = hasVisualBackground ? (isButton ? 12 : (frameWidth >= 200 ? 14 : 8)) : 0;
        const innerMaxWidth = hasVisualBackground ? frameWidth - innerPad * 2 : frameWidth;

        for (const child of children) {
          await formatBlock(child, innerMaxWidth, shouldCenterThis);
        }
      } else if (workingNode.type === "TEXT") {
        const textNode = workingNode as TextNode;
        nodesAdjusted++;

        safeSetLayout(textNode, true);

        // 1. Ensure fonts are loaded and replace any missing fonts so Figma allows updates
        const fontReady = await loadAndPrepareFont(textNode);

        if (fontReady) {
          // 2. Mobile Typography: In mobile UI, negative letter spacing causes characters to stack/overlap.
          // ALL negative letter spacing is strictly reset to 0px.
          // In addition, all headings (fontSize >= 18) are reset to 0px letter spacing.
          const isHeading = typeof textNode.fontSize === "number" && textNode.fontSize >= 18;
          if (textNode.letterSpacing !== figma.mixed) {
            const ls = textNode.letterSpacing as LetterSpacing;
            if (isHeading || (ls && typeof ls.value === "number" && ls.value < 0)) {
              try {
                textNode.letterSpacing = { value: 0, unit: "PIXELS" };
              } catch {}
            }
          } else {
            try {
              const segments = textNode.getStyledTextSegments(["letterSpacing", "fontSize"]);
              for (const seg of segments) {
                if (seg.fontSize >= 18 || (seg.letterSpacing && seg.letterSpacing.value < 0)) {
                  textNode.setRangeLetterSpacing(seg.start, seg.end, { value: 0, unit: "PIXELS" });
                }
              }
            } catch {
              try {
                textNode.setRangeLetterSpacing(0, textNode.characters.length, { value: 0, unit: "PIXELS" });
              } catch {}
            }
          }

          // 3. Responsive mobile typography scale
          if (typeof textNode.fontSize === "number") {
            if (textNode.fontSize > 36) {
              textNode.fontSize = Math.min(26, textNode.fontSize);
              textNode.lineHeight = { value: 34, unit: "PIXELS" };
            } else if (textNode.fontSize >= 24) {
              textNode.fontSize = Math.min(20, textNode.fontSize);
              textNode.lineHeight = { value: 26, unit: "PIXELS" };
            } else if (textNode.fontSize >= 17) {
              textNode.fontSize = Math.min(15, textNode.fontSize);
              textNode.lineHeight = { value: 21, unit: "PIXELS" };
            } else if (textNode.fontSize >= 14) {
              textNode.fontSize = Math.min(13, textNode.fontSize);
              textNode.lineHeight = { value: 18, unit: "PIXELS" };
            }

            // Ensure line height prevents vertical multiline stacking
            if (textNode.lineHeight !== figma.mixed) {
              const lh = textNode.lineHeight as LineHeight;
              if (lh.unit === "PIXELS" && lh.value < textNode.fontSize * 1.25) {
                textNode.lineHeight = { value: Math.round(textNode.fontSize * 1.35), unit: "PIXELS" };
              }
            }
          }
        }

        // Apply Center text alignment if requested by parent container or hero/intro, except for form fields
        if (centerAlign) {
          try {
            textNode.textAlignHorizontal = "CENTER";
          } catch {}
        } else {
          try {
            textNode.textAlignHorizontal = "LEFT";
          } catch {}
        }

        if (textNode.characters && textNode.characters.length <= 25 && textNode.width <= maxWidth && !centerAlign) {
          try {
            textNode.textAutoResize = "WIDTH_AND_HEIGHT";
          } catch {}
        } else {
          try {
            textNode.textAutoResize = "HEIGHT";
            textNode.resize(Math.min(maxWidth, Math.max(60, textNode.width)), textNode.height);
          } catch {}
        }
      } else if (workingNode.type === "RECTANGLE" || workingNode.type === "VECTOR" || workingNode.type === "LINE") {
        if (isIconNode(workingNode)) {
          return;
        }
        safeSetLayout(workingNode, true);
        if (workingNode.width > maxWidth) {
          const ratio = workingNode.height / workingNode.width;
          const newH = Math.round(maxWidth * ratio);
          try {
            workingNode.resize(maxWidth, Math.max(1, newH));
          } catch {}
        }
        nodesAdjusted++;
      }
    }

    // Focus on targetNode on canvas
    figma.currentPage.selection = [targetNode];
    figma.viewport.scrollAndZoomIntoView([targetNode]);

    figma.notify(`✓ Mobile UI Conversion Complete: ${nodesAdjusted} elements aligned to 390px!`, { timeout: 4000 });

    figma.ui.postMessage({
      type: "ADJUST_MOBILE_LAYOUT_RESULT",
      payload: {
        requestId,
        success: true,
        frameName: targetNode.name,
        nodesAdjusted,
        sections: sectionsAnalyzed,
        details: `Successfully converted "${targetNode.name}" to responsive Mobile UI (390px width, vertical Auto Layout, touch targets >= 48px, wrapped typography).`,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Adjust mobile layout failed:", err);
    figma.ui.postMessage({
      type: "ADJUST_MOBILE_LAYOUT_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to adjust mobile layout",
      },
    });
    figma.notify(`❌ Layout adjustment error: ${err.message}`, { error: true, timeout: 4000 });
  }
}

async function handleAddPrototypeEffects(payload: any = {}): Promise<void> {
  try {
    const requestId = payload.requestId;
    let targetNode: FrameNode | null = null;

    if (payload.nodeId) {
      targetNode = (await figma.getNodeByIdAsync(payload.nodeId)) as FrameNode;
    }
    if (!targetNode && figma.currentPage.selection.length > 0) {
      const cand = figma.currentPage.selection[0];
      if (cand.type === "FRAME") targetNode = cand as FrameNode;
      else if ("parent" in cand && cand.parent && cand.parent.type === "FRAME") targetNode = cand.parent as FrameNode;
    }
    if (!targetNode) {
      const allFrames: FrameNode[] = [];
      function collectFrames(c: any) {
        if (!c || !c.children) return;
        for (const ch of c.children) {
          if (ch.type === "FRAME") allFrames.push(ch);
          if (ch.type === "SECTION" || ch.type === "GROUP") collectFrames(ch);
        }
      }
      collectFrames(figma.currentPage);
      targetNode =
        allFrames.find((f) => f.name === "Option 4") ||
        allFrames.find((f) => f.name === "Option 2") ||
        allFrames.find((f) => f.name.includes("Mobile")) ||
        allFrames[allFrames.length - 1];
    }

    if (!targetNode) {
      throw new Error("No frame selected. Please select a mobile frame first.");
    }

    figma.notify(`⚡ Adding prototype animations and effects to "${targetNode.name}"...`, { timeout: 3500 });

    let effectsAdded = 0;
    const detailsList: string[] = [];

    // 1. Prototype Flow Starting Point
    try {
      figma.currentPage.prototypeStartNode = targetNode;
      effectsAdded++;
      detailsList.push("Set prototype flow start point to mobile screen");
    } catch {}

    // 2. Vertical Scroll Overflow & Fixed Sticky Header Navigation
    try {
      targetNode.overflowDirection = "VERTICAL";
      if (targetNode.children.length >= 2) {
        const hasHeader = targetNode.children.some(c => c.name.includes("Header"));
        if (hasHeader) {
          targetNode.numberOfFixedChildren = 2; // Pinned Announcement + Header Bar to top
          effectsAdded++;
          detailsList.push("Pinned header navigation bar fixed to top during scroll");
        }
      }
    } catch {}

    // Helper: Recursively search for a node matching a predicate
    function findNodeByPredicate(root: SceneNode, pred: (n: any) => boolean): SceneNode | null {
      if (pred(root)) return root;
      if ("children" in root && Array.isArray((root as any).children)) {
        for (const ch of (root as any).children) {
          const res = findNodeByPredicate(ch, pred);
          if (res) return res;
        }
      }
      return null;
    }

    function findAllNodesByPredicate(root: SceneNode, pred: (n: any) => boolean, acc: SceneNode[] = []): SceneNode[] {
      if (pred(root)) acc.push(root);
      if ("children" in root && Array.isArray((root as any).children)) {
        for (const ch of (root as any).children) {
          findAllNodesByPredicate(ch, pred, acc);
        }
      }
      return acc;
    }

    // 3. Identify Sections in the Mobile UI Frame
    const directChildren = [...targetNode.children];
    const announcementBar = directChildren.find(c => (c.name || "").toLowerCase().includes("announc") || (c.height <= 45 && c.y < 50));
    const headerBar = directChildren.find(c => c.name.includes("Header"));

    // Content sections
    const contentSections = directChildren.filter(c => c !== announcementBar && c !== headerBar);
    const heroSection = contentSections[0];
    const showcaseSection = contentSections[1] || contentSections.find(c => c.height > 1500);
    const stepsSection = contentSections[2] || contentSections.find(c => (c.name || "").toLowerCase().includes("work"));
    const statsSection = contentSections[3];
    const quoteFormSection = contentSections.find(c => {
      const hasQuote = findNodeByPredicate(c, n => n.type === "TEXT" && (n.characters || "").toLowerCase().includes("quote"));
      return Boolean(hasQuote) && c !== heroSection;
    }) || contentSections[contentSections.length - 2];
    const footerSection = contentSections[contentSections.length - 1];

    // 4. In-page Smooth Scroll Animation: Hero CTA -> Quote Form Section
    if (heroSection && quoteFormSection) {
      const heroCta = findNodeByPredicate(heroSection, n => {
        if (n.type === "FRAME" && n.height >= 40 && n.height <= 64) {
          const txt = findNodeByPredicate(n, cn => cn.type === "TEXT" && (cn.characters || "").toLowerCase().includes("quote"));
          return Boolean(txt);
        }
        return false;
      });

      if (heroCta) {
        const scrollReaction = {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: quoteFormSection.id,
              navigation: "SCROLL_TO",
              transition: {
                type: "SCROLL_ANIMATE",
                duration: 0.55,
                easing: { type: "EASE_OUT" },
              },
            },
          ],
          action: {
            type: "NODE",
            destinationId: quoteFormSection.id,
            navigation: "SCROLL_TO",
            transition: {
              type: "SCROLL_ANIMATE",
              duration: 0.55,
              easing: { type: "EASE_OUT" },
            },
          },
        };
        try {
          await (heroCta as any).setReactionsAsync([scrollReaction]);
          effectsAdded++;
          detailsList.push("Hero CTA 'get your custom quote': Smooth animated scroll to Quote Form");
        } catch (err) {
          console.warn("[Effects] Failed to wire hero CTA reaction:", err);
        }
      }
    }

    // 5. In-page Smooth Scroll Animation: Announcement Bar -> Drinkware Showcase
    if (announcementBar && showcaseSection) {
      const announceReaction = {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: showcaseSection.id,
            navigation: "SCROLL_TO",
            transition: {
              type: "SCROLL_ANIMATE",
              duration: 0.5,
              easing: { type: "EASE_OUT" },
            },
          },
        ],
        action: {
          type: "NODE",
          destinationId: showcaseSection.id,
          navigation: "SCROLL_TO",
          transition: {
            type: "SCROLL_ANIMATE",
            duration: 0.5,
            easing: { type: "EASE_OUT" },
          },
        },
      };
      try {
        await (announcementBar as any).setReactionsAsync([announceReaction]);
        effectsAdded++;
        detailsList.push("Announcement Bar: Smooth animated scroll to Drinkware Collection");
      } catch (err) {
        console.warn("[Effects] Failed to wire announcement reaction:", err);
      }
    }

    // 6. Header Logo: Smooth animated scroll back to top (Hero)
    if (headerBar && heroSection) {
      const logo = findNodeByPredicate(headerBar, n => (n.name || "").toLowerCase().includes("logo"));
      if (logo) {
        const topReaction = {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: heroSection.id,
              navigation: "SCROLL_TO",
              transition: {
                type: "SCROLL_ANIMATE",
                duration: 0.45,
                easing: { type: "EASE_OUT" },
              },
            },
          ],
          action: {
            type: "NODE",
            destinationId: heroSection.id,
            navigation: "SCROLL_TO",
            transition: {
              type: "SCROLL_ANIMATE",
              duration: 0.45,
              easing: { type: "EASE_OUT" },
            },
          },
        };
        try {
          await (logo as any).setReactionsAsync([topReaction]);
          effectsAdded++;
          detailsList.push("Brand Logo: Smooth animated scroll back to top of screen");
        } catch (err) {
          console.warn("[Effects] Failed to wire logo reaction:", err);
        }
      }
    }

    // 7. Interactive Form Submission Effect: Quote Confirmation Toast Overlay
    let toastComponent: ComponentNode | null = null;
    const existingToasts = figma.currentPage.children.filter(c => c.name.includes("Quote Confirmation Toast"));
    if (existingToasts.length > 0) {
      toastComponent = existingToasts[0] as ComponentNode;
    } else {
      toastComponent = figma.createComponent();
      toastComponent.name = "Quote Confirmation Toast (Component)";
      toastComponent.resize(360, 110);
      toastComponent.fills = [{ type: "SOLID", color: { r: 0.08, g: 0.08, b: 0.1 }, opacity: 0.98 }];
      toastComponent.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.8, b: 0.4 }, opacity: 0.4 }];
      toastComponent.strokeWeight = 1;
      toastComponent.cornerRadius = 14;
      toastComponent.layoutMode = "VERTICAL";
      toastComponent.primaryAxisSizingMode = "AUTO";
      toastComponent.counterAxisSizingMode = "FIXED";
      toastComponent.primaryAxisAlignItems = "MIN";
      toastComponent.counterAxisAlignItems = "CENTER";
      toastComponent.itemSpacing = 8;
      toastComponent.paddingLeft = 16;
      toastComponent.paddingRight = 16;
      toastComponent.paddingTop = 14;
      toastComponent.paddingBottom = 16;

      const tRow = figma.createFrame();
      tRow.name = "Toast Row";
      tRow.resize(328, 28);
      tRow.fills = [];
      tRow.layoutMode = "HORIZONTAL";
      tRow.primaryAxisAlignItems = "SPACE_BETWEEN";
      tRow.counterAxisAlignItems = "CENTER";

      const titleTxt = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      titleTxt.fontName = { family: "Inter", style: "Bold" };
      titleTxt.characters = "✓ Quote Request Received!";
      titleTxt.fontSize = 15;
      titleTxt.letterSpacing = { value: 0, unit: "PIXELS" };
      titleTxt.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.9, b: 0.5 }, opacity: 1 }];
      tRow.appendChild(titleTxt);

      const closeT = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      closeT.fontName = { family: "Inter", style: "Regular" };
      closeT.characters = "✕";
      closeT.fontSize = 15;
      closeT.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.6 }];
      tRow.appendChild(closeT);
      toastComponent.appendChild(tRow);

      const subTxt = figma.createText();
      subTxt.fontName = { family: "Inter", style: "Regular" };
      subTxt.characters = "Our corporate team will review your order specs and reply within 1 business day.";
      subTxt.fontSize = 13;
      subTxt.lineHeight = { value: 18, unit: "PIXELS" };
      subTxt.letterSpacing = { value: 0, unit: "PIXELS" };
      subTxt.fills = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.82 }, opacity: 1 }];
      subTxt.resize(328, 36);
      subTxt.textAutoResize = "HEIGHT";
      toastComponent.appendChild(subTxt);

      figma.currentPage.appendChild(toastComponent);
      toastComponent.x = targetNode.x + targetNode.width + 60;
      toastComponent.y = targetNode.y + 720;

      try {
        await (toastComponent as any).setReactionsAsync([
          {
            trigger: { type: "ON_CLICK" },
            actions: [{ type: "BACK" }],
            action: { type: "BACK" },
          },
        ]);
      } catch {}
    }

    // Wire Form Submit Button to open this confirmation toast overlay!
    if (quoteFormSection && toastComponent) {
      const formSubmitBtn = findNodeByPredicate(quoteFormSection, n => {
        if (n.type === "FRAME" && n.height >= 40 && n.height <= 64) {
          const txt = findNodeByPredicate(n, cn => cn.type === "TEXT" && ((cn.characters || "").toLowerCase().includes("request") || (cn.characters || "").toLowerCase().includes("submit")));
          return Boolean(txt);
        }
        return false;
      });

      if (formSubmitBtn) {
        const submitReaction = {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: toastComponent.id,
              navigation: "OVERLAY",
              transition: {
                type: "MOVE_IN",
                direction: "TOP",
                matchLayers: false,
                duration: 0.35,
                easing: { type: "EASE_OUT" },
              },
            },
          ],
          action: {
            type: "NODE",
            destinationId: toastComponent.id,
            navigation: "OVERLAY",
            transition: {
              type: "MOVE_IN",
              direction: "TOP",
              matchLayers: false,
              duration: 0.35,
              easing: { type: "EASE_OUT" },
            },
          },
        };
        try {
          await (formSubmitBtn as any).setReactionsAsync([submitReaction]);
          effectsAdded++;
          detailsList.push("Form Submit Button: Opens animated Quote Confirmation Toast overlay");
        } catch (err) {
          console.warn("[Effects] Failed to wire form submit button:", err);
        }
      }
    }

    // 8. Product Cards "Explore ↗" buttons: Smooth scroll to Quote Form
    if (showcaseSection && quoteFormSection) {
      const exploreButtons = findAllNodesByPredicate(showcaseSection, n => {
        if (n.type === "FRAME" && n.height < 40) {
          const hasArrow = findNodeByPredicate(n, cn => cn.type === "TEXT" && (cn.characters || "").includes("↗"));
          return Boolean(hasArrow);
        }
        return false;
      });

      for (const eb of exploreButtons) {
        const ebReaction = {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: quoteFormSection.id,
              navigation: "SCROLL_TO",
              transition: {
                type: "SCROLL_ANIMATE",
                duration: 0.55,
                easing: { type: "EASE_OUT" },
              },
            },
          ],
          action: {
            type: "NODE",
            destinationId: quoteFormSection.id,
            navigation: "SCROLL_TO",
            transition: {
              type: "SCROLL_ANIMATE",
              duration: 0.55,
              easing: { type: "EASE_OUT" },
            },
          },
        };
        try {
          await (eb as any).setReactionsAsync([ebReaction]);
          effectsAdded++;
        } catch {}
      }
      if (exploreButtons.length > 0) {
        detailsList.push(`Product Explore links: Smooth scroll to Quote Form (${exploreButtons.length} cards)`);
      }
    }

    // 9. Wire Drawer Nav Items for In-Page Navigation & Menu Button Overlay
    const drawerComponent = figma.currentPage.children.find(c => c.name.includes("Mobile Navigation Drawer")) as ComponentNode;
    if (drawerComponent) {
      // Connect Menu button / Hamburger in Header to open Drawer as top slide-in overlay
      if (headerBar) {
        const menuBtn = findNodeByPredicate(headerBar, n => (n.name || "").includes("Menu Button") || (n.name || "").includes("Hamburger"));
        if (menuBtn) {
          const openDrawerReaction = {
            trigger: { type: "ON_CLICK" },
            actions: [
              {
                type: "NODE",
                destinationId: drawerComponent.id,
                navigation: "OVERLAY",
                transition: {
                  type: "MOVE_IN",
                  direction: "TOP",
                  matchLayers: false,
                  duration: 0.3,
                  easing: { type: "EASE_OUT" },
                },
              },
            ],
            action: {
              type: "NODE",
              destinationId: drawerComponent.id,
              navigation: "OVERLAY",
              transition: {
                type: "MOVE_IN",
                direction: "TOP",
                matchLayers: false,
                duration: 0.3,
                easing: { type: "EASE_OUT" },
              },
            },
          };
          try {
            await (menuBtn as any).setReactionsAsync([openDrawerReaction]);
            effectsAdded++;
            detailsList.push("Menu / List Icon: Opens Mobile Navigation Drawer as top slide-down overlay");
          } catch {}
        }
      }

      // Connect Drawer close button to dismiss overlay
      const drawerCloseBtn = findNodeByPredicate(drawerComponent, n => (n.name || "").toLowerCase().includes("close") || (n.name || "").includes("✕"));
      if (drawerCloseBtn) {
        try {
          await (drawerCloseBtn as any).setReactionsAsync([
            {
              trigger: { type: "ON_CLICK" },
              actions: [{ type: "BACK" }],
              action: { type: "BACK" },
            },
          ]);
          effectsAdded++;
        } catch {}
      }

      const drawerNavItems = findAllNodesByPredicate(drawerComponent, n => (n.name || "").includes("Nav Item"));
      for (const item of drawerNavItems) {
        const itemText = (item.name || "").toLowerCase();
        let targetDest = showcaseSection;
        if (itemText.includes("custom") || itemText.includes("quote") || itemText.includes("b2b")) {
          targetDest = quoteFormSection;
        }

        if (targetDest) {
          const navReaction = {
            trigger: { type: "ON_CLICK" },
            actions: [
              {
                type: "NODE",
                destinationId: targetDest.id,
                navigation: "SCROLL_TO",
                transition: {
                  type: "SCROLL_ANIMATE",
                  duration: 0.5,
                  easing: { type: "EASE_OUT" },
                },
              },
            ],
            action: {
              type: "NODE",
              destinationId: targetDest.id,
              navigation: "SCROLL_TO",
              transition: {
                type: "SCROLL_ANIMATE",
                duration: 0.5,
                easing: { type: "EASE_OUT" },
              },
            },
          };
          try {
            await (item as any).setReactionsAsync([navReaction]);
            effectsAdded++;
          } catch {}
        }
      }

      // Drawer CTA
      const dCta = findNodeByPredicate(drawerComponent, n => (n.name || "").includes("Drawer CTA"));
      if (dCta && quoteFormSection) {
        const dCtaReaction = {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: quoteFormSection.id,
              navigation: "SCROLL_TO",
              transition: {
                type: "SCROLL_ANIMATE",
                duration: 0.55,
                easing: { type: "EASE_OUT" },
              },
            },
          ],
          action: {
            type: "NODE",
            destinationId: quoteFormSection.id,
            navigation: "SCROLL_TO",
            transition: {
              type: "SCROLL_ANIMATE",
              duration: 0.55,
              easing: { type: "EASE_OUT" },
            },
          },
        };
        try {
          await (dCta as any).setReactionsAsync([dCtaReaction]);
          effectsAdded++;
          detailsList.push("Drawer CTA: Smooth scroll to Quote Form");
        } catch {}
      }
    }

    // 10. Footer Back To Top
    if (footerSection && heroSection) {
      const footerLogoOrBtn = findNodeByPredicate(footerSection, n => {
        const name = (n.name || "").toLowerCase();
        return name.includes("logo") || name.includes("top") || name.includes("pelican");
      });
      if (footerLogoOrBtn) {
        const backToTop = {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: heroSection.id,
              navigation: "SCROLL_TO",
              transition: {
                type: "SCROLL_ANIMATE",
                duration: 0.6,
                easing: { type: "EASE_OUT" },
              },
            },
          ],
          action: {
            type: "NODE",
            destinationId: heroSection.id,
            navigation: "SCROLL_TO",
            transition: {
              type: "SCROLL_ANIMATE",
              duration: 0.6,
              easing: { type: "EASE_OUT" },
            },
          },
        };
        try {
          await (footerLogoOrBtn as any).setReactionsAsync([backToTop]);
          effectsAdded++;
          detailsList.push("Footer: Smooth scroll back to top");
        } catch {}
      }
    }

    // Focus on targetNode in Figma
    figma.currentPage.selection = [targetNode];
    figma.viewport.scrollAndZoomIntoView([targetNode]);

    figma.notify(`⚡ Prototype Animations & Effects Ready (${effectsAdded} interactions wired)! Press Play ▶ to test.`, { timeout: 4000 });

    figma.ui.postMessage({
      type: "ADD_PROTOTYPE_EFFECTS_RESULT",
      payload: {
        requestId,
        success: true,
        frameName: targetNode.name,
        effectsAdded,
        details: detailsList,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Add prototype effects failed:", err);
    figma.ui.postMessage({
      type: "ADD_PROTOTYPE_EFFECTS_RESULT",
      payload: {
        requestId: payload?.requestId,
        success: false,
        error: err.message || "Failed to add prototype effects",
      },
    });
    figma.notify(`❌ Prototype effects error: ${err.message}`, { error: true, timeout: 4000 });
  }
}


