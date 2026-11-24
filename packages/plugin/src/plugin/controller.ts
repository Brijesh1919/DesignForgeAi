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
import { generateProductStoryLanding } from "./generators/product-story-landing";
import { generateCinematicSceneAnimation } from "./generators/cinematic-scene-animator";
import { createFigmaMotionAnimation } from "./generators/figma-motion-animator";
import { generateNightToDayMotionScene } from "./generators/night-to-day-animator";
import { generateColorSwitcherComponent } from "./generators/color-switcher-component";
import { generateLoaderBufferAnimation } from "./generators/loader-buffer-animator";
import { convertToResponsiveFrame } from "./generators/responsive-converter";

// ─── Plugin Init ─────────────────────────────────────────────

figma.showUI(__html__, {
  width: 520,
  height: 700,
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

    case "CONVERT_RESPONSIVE_FRAME":
      await handleConvertResponsiveFrame(msg.payload);
      break;

    case "EXECUTE_ADJUST_MOBILE_LAYOUT":
      await handleAdjustMobileLayout(msg.payload);
      break;

    case "EXECUTE_ADD_PROTOTYPE_EFFECTS":
      await handleAddPrototypeEffects(msg.payload);
      break;

    case "EXECUTE_CREATE_CAROUSEL_COMPONENT":
      await handleCreateCarouselComponent(msg.payload);
      break;

    case "EXECUTE_CREATE_PRODUCT_LANDING_PAGE":
      await handleCreateProductLandingPage(msg.payload);
      break;

    case "EXECUTE_ANIMATE_SCENE":
      await handleAnimateScene(msg.payload);
      break;

    case "EXECUTE_FIGMA_MOTION_ANIMATION":
      await handleFigmaMotionAnimation(msg.payload);
      break;

    case "EXECUTE_GENERATE_NIGHT_TO_DAY":
      await handleGenerateNightToDay(msg.payload);
      break;

    case "EXECUTE_CREATE_COLOR_SWITCHER":
      await handleCreateColorSwitcher(msg.payload);
      break;

    case "EXECUTE_CREATE_LOADER_BUFFER":
      await handleCreateLoaderBuffer(msg.payload);
      break;

    case "EXECUTE_EVAL_SCRIPT":
      await handleEvalScript(msg.payload);
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

    // If user clicked inside a frame (e.g. on text, vector, or rectangle),
    // resolve to its top-level frame so the frame is cleanly selected
    if (selection.length > 0 && selection[0].type !== "FRAME") {
      let curr: any = selection[0];
      while (curr && curr.parent && curr.parent.type !== "PAGE") {
        if (curr.parent.type === "SECTION" && curr.type === "FRAME") break;
        curr = curr.parent;
      }
      if (curr && curr.type === "FRAME") {
        selection = [curr];
      }
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
          ? (node as any).fills.map((f: any) => ({
              type: String(f.type || ""),
              visible: f.visible !== false,
              opacity: typeof f.opacity === "number" ? f.opacity : 1,
              color: f.color ? { r: Math.round(f.color.r * 255), g: Math.round(f.color.g * 255), b: Math.round(f.color.b * 255) } : undefined,
              gradientStops: f.gradientStops ? f.gradientStops.map((s: any) => ({ position: s.position, color: s.color })) : undefined,
              imageHash: typeof f.imageHash === "string" ? f.imageHash : undefined,
            }))
          : undefined,
        arcData: "arcData" in node ? (node as any).arcData : undefined,
        strokes: "strokes" in node && Array.isArray((node as any).strokes)
          ? (node as any).strokes.map((s: any) => ({
              type: String(s.type || ""),
              visible: s.visible !== false,
              color: s.color ? { r: Math.round(s.color.r * 255), g: Math.round(s.color.g * 255), b: Math.round(s.color.b * 255) } : undefined,
            }))
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

      // Check pluginData & sharedPluginData
      try {
        if (typeof (node as any).getPluginDataKeys === "function") {
          const pKeys = (node as any).getPluginDataKeys();
          if (pKeys.length > 0) {
            summary.pluginData = {};
            for (const k of pKeys) summary.pluginData[k] = (node as any).getPluginData(k);
          }
        }
        if (typeof (node as any).getSharedPluginDataKeys === "function") {
          for (const ns of ["motion", "figma", "figmotion", "animate", "keyframes", "timeline", "motion_plugin"]) {
            const spKeys = (node as any).getSharedPluginDataKeys(ns);
            if (spKeys && spKeys.length > 0) {
              if (!summary.sharedPluginData) summary.sharedPluginData = {};
              summary.sharedPluginData[ns] = {};
              for (const k of spKeys) summary.sharedPluginData[ns][k] = (node as any).getSharedPluginData(ns, k);
            }
          }
        }
      } catch {}

      // Check figma.motion
      try {
        summary.hasFigmaMotion = typeof (figma as any).motion !== "undefined";
        if (summary.hasFigmaMotion) {
          const m = (figma as any).motion;
          const own = Object.getOwnPropertyNames(m);
          const proto = Object.getPrototypeOf(m) ? Object.getOwnPropertyNames(Object.getPrototypeOf(m)) : [];
          summary.figmaMotionProps = [...new Set([...own, ...proto])];
          try {
            summary.animationStyles = m.figmaAnimationStyles ? m.figmaAnimationStyles() : null;
          } catch (e: any) { summary.animationStylesError = e.message; }
        }
        // Check node motion properties
        summary.nodeTimelines = (node as any).timelines;
        summary.nodeManualKeyframeTracks = (node as any).manualKeyframeTracks;
        summary.nodeAnimations = (node as any).animations;
        summary.methodSignatures = {
          applyAnimationStyle: (node as any).applyAnimationStyle ? (node as any).applyAnimationStyle.toString() : null,
          applyManualKeyframeTrack: (node as any).applyManualKeyframeTrack ? (node as any).applyManualKeyframeTrack.toString() : null,
          setTimelineDuration: (node as any).setTimelineDuration ? (node as any).setTimelineDuration.toString() : null,
          playheadPosition: (figma as any).motion?.playheadPosition,
        };
      } catch (err: any) {
        summary.motionCheckError = err.message;
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
        const currentFills = Array.isArray(node.fills) ? [...node.fills] : [];
        const existingImage = currentFills.find((f: any) => f?.type === "IMAGE");
        const scaleMode = existingImage?.scaleMode || "FILL";
        node.fills = [
          {
            type: "IMAGE",
            imageHash: newImage.hash,
            scaleMode,
            ...(existingImage?.imageTransform ? { imageTransform: existingImage.imageTransform } : {}),
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
        json: codeResult.json,
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

async function handleConvertResponsiveFrame(payload: any = {}): Promise<void> {
  try {
    figma.notify(`📱 Converting to ${payload.targetWidth || 412}px responsive layout...`, { timeout: 3000 });
    const result = await convertToResponsiveFrame(payload);

    figma.ui.postMessage({
      type: "CONVERT_RESPONSIVE_RESULT",
      payload: {
        requestId: payload.requestId,
        ...result,
      },
    });

    if (result.success) {
      figma.notify(`✨ Converted "${result.frameName}" to ${result.targetWidth}px!`, { timeout: 3500 });
    } else {
      figma.notify(`❌ Conversion error: ${result.error || "Failed to convert frame"}`, { error: true, timeout: 4000 });
    }
  } catch (err: any) {
    figma.ui.postMessage({
      type: "CONVERT_RESPONSIVE_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Unexpected error converting responsive frame",
      },
    });
    figma.notify(`❌ Error: ${err.message || "Unknown error"}`, { error: true, timeout: 4000 });
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
    const result = await convertToResponsiveFrame({
      nodeId: targetNode.id,
      targetWidth,
      createNewFrame: false,
      horizontalPadding: payload.horizontalPadding ?? 20,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to convert frame to responsive mobile UI");
    }

    figma.notify(`✓ Mobile UI Conversion Complete: elements aligned to ${targetWidth}px!`, { timeout: 4000 });

    figma.ui.postMessage({
      type: "ADJUST_MOBILE_LAYOUT_RESULT",
      payload: {
        requestId,
        success: true,
        frameName: targetNode.name,
        targetWidth,
        nodesAdjusted: result.textNodesScaled || 0,
        sectionsAdjusted: result.sectionsAdjusted || 0,
        details: `Successfully converted "${targetNode.name}" to responsive Mobile UI (${targetWidth}px).`,
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

async function handleCreateCarouselComponent(payload: any = {}): Promise<void> {
  try {
    const requestId = payload.requestId;
    let targetNode: FrameNode | null = null;

    if (payload.nodeId) {
      targetNode = (await figma.getNodeByIdAsync(payload.nodeId)) as FrameNode;
    }
    if (!targetNode && figma.currentPage.selection.length > 0) {
      const cand = figma.currentPage.selection[0];
      if (cand.type === "FRAME" || cand.type === "COMPONENT" || cand.type === "GROUP") {
        targetNode = cand as FrameNode;
      }
    }
    if (!targetNode) {
      targetNode = (await figma.getNodeByIdAsync("305:3407")) as FrameNode;
    }
    if (!targetNode) {
      targetNode = (await figma.getNodeByIdAsync("777:4809")) as FrameNode;
    }
    if (!targetNode) {
      throw new Error("No frame selected. Please select the product carousel frame.");
    }

    // Collect the product card nodes from targetNode
    let cardNodes: SceneNode[] = [];
    if ("children" in targetNode && targetNode.children.length > 0) {
      if (targetNode.children.length === 1 && "children" in targetNode.children[0] && (targetNode.children[0] as any).children.length >= 2) {
        cardNodes = [...(targetNode.children[0] as any).children];
      } else {
        cardNodes = [...targetNode.children];
      }
    }

    if (cardNodes.length === 0) {
      throw new Error("Selected frame does not contain child product cards.");
    }

    const slideCount = cardNodes.length;
    const viewportWidth = payload.viewportWidth || targetNode.width || 1319;
    const viewportHeight = payload.viewportHeight || targetNode.height || 394;
    const isInfiniteMarquee = payload.mode === "infinite_marquee" || payload.infinite !== false || viewportWidth > 500 || slideCount > 4;

    if (isInfiniteMarquee) {
      figma.notify(`⚡ Creating seamless infinite right-to-left marquee carousel from "${targetNode.name}"...`, { timeout: 3500 });

      // Determine spacing
      let itemSpacing = 4;
      if (targetNode.children.length === 1 && "itemSpacing" in targetNode.children[0]) {
        itemSpacing = (targetNode.children[0] as any).itemSpacing ?? 4;
      } else if ("itemSpacing" in targetNode) {
        itemSpacing = (targetNode as any).itemSpacing ?? 4;
      }

      // Calculate total cycle width
      const singleCycleWidth = cardNodes.reduce((sum, c) => sum + c.width, 0) + (cardNodes.length - 1) * itemSpacing;
      const repeatDistance = Math.round(singleCycleWidth + itemSpacing);

      // Duration: slow, calm, gentle right-to-left flow (e.g. 30s)
      const duration = payload.duration || 30;

      const variants: ComponentNode[] = [];

      for (let stateIdx = 0; stateIdx < 2; stateIdx++) {
        const variant = figma.createComponent();
        variant.name = stateIdx === 0 ? "State=Start" : "State=Loop";
        variant.resize(viewportWidth, viewportHeight);
        variant.clipsContent = true; // Crucial: visible in only width of 1319 and height of 394!
        variant.cornerRadius = typeof targetNode.cornerRadius === "number" ? targetNode.cornerRadius : 0;
        variant.fills = targetNode.fills ? JSON.parse(JSON.stringify(targetNode.fills)) : [];
        variant.strokes = targetNode.strokes ? JSON.parse(JSON.stringify(targetNode.strokes)) : [];
        variant.strokeWeight = typeof targetNode.strokeWeight === "number" ? targetNode.strokeWeight : 0;
        variant.layoutMode = "NONE";

        // Slides Track (MUST have identical name across all variants for Smart Animate)
        const track = figma.createFrame();
        track.name = "Slides Track";
        track.layoutMode = "HORIZONTAL";
        track.primaryAxisSizingMode = "AUTO";
        track.counterAxisSizingMode = "AUTO";
        track.itemSpacing = itemSpacing;
        track.paddingLeft = 0;
        track.paddingRight = 0;
        track.paddingTop = 0;
        track.paddingBottom = 0;
        track.fills = [];
        track.clipsContent = false;

        // Cycle 1: original cards with unique 1-to-1 indexed names for Smart Animate
        for (let j = 0; j < cardNodes.length; j++) {
          const clone = cardNodes[j].clone();
          clone.name = `Card ${String(j + 1).padStart(2, "0")}`;
          track.appendChild(clone);
        }
        // Cycle 2: duplicated cards for seamless continuous infinite loop
        for (let j = 0; j < cardNodes.length; j++) {
          const clone = cardNodes[j].clone();
          clone.name = `Card ${String(cardNodes.length + j + 1).padStart(2, "0")}`;
          track.appendChild(clone);
        }

        track.x = stateIdx === 0 ? 0 : -repeatDistance;
        track.y = 0;

        variant.appendChild(track);
        figma.currentPage.appendChild(variant);
        variants.push(variant);
      }

      // Combine as Variants
      const componentSet = figma.combineAsVariants(variants, figma.currentPage);
      componentSet.name = "Infinite Product Carousel (Continuous Marquee)";
      componentSet.layoutMode = "HORIZONTAL";
      componentSet.itemSpacing = 40;
      componentSet.paddingLeft = 24;
      componentSet.paddingRight = 24;
      componentSet.paddingTop = 24;
      componentSet.paddingBottom = 24;
      componentSet.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.98 }, opacity: 1 }];
      componentSet.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.9, b: 0.92 }, opacity: 1 }];
      componentSet.strokeWeight = 1;
      componentSet.cornerRadius = 16;
      componentSet.x = targetNode.x;
      componentSet.y = targetNode.y + targetNode.height + 60;

      // Reactions:
      // State=Start -> State=Loop: AFTER_TIMEOUT (0.001s) -> SMART_ANIMATE LINEAR (duration: 30s)
      const toLoopReaction = {
        trigger: { type: "AFTER_TIMEOUT", timeout: 0.001 },
        actions: [
          {
            type: "NODE",
            destinationId: variants[1].id,
            navigation: "CHANGE_TO",
            transition: {
              type: "SMART_ANIMATE",
              duration: duration,
              easing: { type: "LINEAR" },
            },
          },
        ],
      };

      // State=Loop -> State=Start: AFTER_TIMEOUT (0.001s) -> INSTANT (Seamless invisible reset with NO comeback!)
      const toStartReaction = {
        trigger: { type: "AFTER_TIMEOUT", timeout: 0.001 },
        actions: [
          {
            type: "NODE",
            destinationId: variants[0].id,
            navigation: "CHANGE_TO",
            transition: null,
          },
        ],
      };

      await (variants[0] as any).setReactionsAsync([toLoopReaction]);
      await (variants[1] as any).setReactionsAsync([toStartReaction]);

      // Create live ready-to-preview Instance of Variant 0
      const instance = variants[0].createInstance();
      instance.name = `Infinite Product Carousel — Live (${viewportWidth}x${viewportHeight})`;
      const parentContainer = targetNode.parent || figma.currentPage;
      const targetIdx = targetNode.parent ? targetNode.parent.children.indexOf(targetNode) : -1;
      if (targetIdx >= 0) {
        targetNode.parent!.insertChild(targetIdx + 1, instance);
      } else {
        parentContainer.appendChild(instance);
      }
      instance.x = targetNode.x;
      instance.y = targetNode.y;

      // Hide targetNode so user sees the new interactive instance seamlessly
      targetNode.visible = false;

      // Set prototype flow starting point
      figma.currentPage.flowStartingPoints = [
        { nodeId: instance.id, name: "Infinite Product Carousel (Continuous)" },
      ];

      // Select instance and scroll into view
      figma.currentPage.selection = [instance];
      figma.viewport.scrollAndZoomIntoView([instance]);

      figma.notify(`✓ Infinite Product Carousel Ready! (${slideCount} cards, seamless right-to-left marquee). Press Play ▶ to preview.`, { timeout: 4500 });

      figma.ui.postMessage({
        type: "CREATE_CAROUSEL_COMPONENT_RESULT",
        payload: {
          requestId,
          success: true,
          componentSetId: componentSet.id,
          instanceId: instance.id,
          slideCount,
          viewportWidth,
          viewportHeight,
          duration,
          mode: "infinite_marquee",
          details: [
            `Viewport: ${viewportWidth} × ${viewportHeight} with clipsContent=true`,
            `${slideCount} product cards duplicated into 2-cycle continuous track (${slideCount * 2} cards total)`,
            `Right-to-left smooth motion at steady pace (SMART_ANIMATE, ${duration}s, LINEAR)`,
            "Instant invisible loop reset on cycle completion (Zero comeback / Zero rewind)",
            "Automatic prototype playback without any buttons",
            "Placed interactive instance at original frame position",
          ],
        },
      });
      return;
    }

    figma.notify(`⚡ Creating interactive square product carousel from "${targetNode.name}"...`, { timeout: 3500 });
    let imageNodes = cardNodes;
    const squareSize = payload.squareSize || 320;

    // Load fonts for chevrons & badges
    try {
      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    } catch {}

    const variants: ComponentNode[] = [];

    // Create 4 Component Variants
    for (let i = 0; i < slideCount; i++) {
      const variant = figma.createComponent();
      variant.name = `Slide=${i + 1}`;
      variant.resize(squareSize, squareSize);
      variant.clipsContent = true; // Only one product is visible in the square frame!
      variant.cornerRadius = 16;
      variant.fills = [{ type: "SOLID", color: { r: 0.08, g: 0.08, b: 0.1 }, opacity: 1 }];
      variant.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
      variant.strokeWeight = 1;
      variant.layoutMode = "NONE";

      // 1. Slides Track (Identical layer name across all variants for SMART_ANIMATE!)
      const track = figma.createFrame();
      track.name = "Slides Track";
      track.resize(squareSize * slideCount, squareSize);
      track.fills = [];
      track.layoutMode = "HORIZONTAL";
      track.primaryAxisSizingMode = "FIXED";
      track.counterAxisSizingMode = "FIXED";
      track.primaryAxisAlignItems = "CENTER";
      track.counterAxisAlignItems = "CENTER";
      track.itemSpacing = 0;
      track.clipsContent = false;
      track.x = -i * squareSize;
      track.y = 0;

      // Add each of the 4 slide cards into the track
      for (let j = 0; j < slideCount; j++) {
        const slideCard = figma.createFrame();
        slideCard.name = `Slide Card ${j + 1}`;
        slideCard.resize(squareSize, squareSize);
        slideCard.fills = [];
        slideCard.layoutMode = "VERTICAL";
        slideCard.primaryAxisAlignItems = "CENTER";
        slideCard.counterAxisAlignItems = "CENTER";
        slideCard.paddingBottom = 24;

        // Clone the source product image node
        const sourceNode = imageNodes[j];
        const clonedImg = sourceNode.clone() as FrameNode;
        const maxImgW = squareSize - 40;
        const maxImgH = squareSize - 70;
        const scale = Math.min(maxImgW / clonedImg.width, maxImgH / clonedImg.height, 1);
        clonedImg.resize(Math.round(clonedImg.width * scale), Math.round(clonedImg.height * scale));

        slideCard.appendChild(clonedImg);
        track.appendChild(slideCard);
      }
      variant.appendChild(track);

      // 2. Slide Counter Badge in top-right (e.g. "1 / 4")
      const badge = figma.createFrame();
      badge.name = "Slide Counter Badge";
      badge.resize(48, 22);
      badge.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.5 }];
      badge.cornerRadius = 11;
      badge.layoutMode = "HORIZONTAL";
      badge.primaryAxisAlignItems = "CENTER";
      badge.counterAxisAlignItems = "CENTER";
      badge.x = squareSize - 58;
      badge.y = 12;

      const badgeTxt = figma.createText();
      badgeTxt.fontName = { family: "Inter", style: "Medium" };
      badgeTxt.characters = `${i + 1} / ${slideCount}`;
      badgeTxt.fontSize = 11;
      badgeTxt.letterSpacing = { value: 0, unit: "PIXELS" };
      badgeTxt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.85 }];
      badge.appendChild(badgeTxt);
      variant.appendChild(badge);

      // 3. Navigation Chevron Arrows: Prev & Next
      const prevBtn = figma.createFrame();
      prevBtn.name = "Prev Button";
      prevBtn.resize(28, 28);
      prevBtn.cornerRadius = 14;
      prevBtn.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.45 }];
      prevBtn.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.15 }];
      prevBtn.strokeWeight = 1;
      prevBtn.layoutMode = "HORIZONTAL";
      prevBtn.primaryAxisAlignItems = "CENTER";
      prevBtn.counterAxisAlignItems = "CENTER";
      prevBtn.x = 10;
      prevBtn.y = Math.round((squareSize - 28) / 2);

      const prevTxt = figma.createText();
      prevTxt.fontName = { family: "Inter", style: "Bold" };
      prevTxt.characters = "‹";
      prevTxt.fontSize = 16;
      prevTxt.letterSpacing = { value: 0, unit: "PIXELS" };
      prevTxt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.9 }];
      prevBtn.appendChild(prevTxt);
      variant.appendChild(prevBtn);

      const nextBtn = figma.createFrame();
      nextBtn.name = "Next Button";
      nextBtn.resize(28, 28);
      nextBtn.cornerRadius = 14;
      nextBtn.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.45 }];
      nextBtn.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.15 }];
      nextBtn.strokeWeight = 1;
      nextBtn.layoutMode = "HORIZONTAL";
      nextBtn.primaryAxisAlignItems = "CENTER";
      nextBtn.counterAxisAlignItems = "CENTER";
      nextBtn.x = squareSize - 38;
      nextBtn.y = Math.round((squareSize - 28) / 2);

      const nextTxt = figma.createText();
      nextTxt.fontName = { family: "Inter", style: "Bold" };
      nextTxt.characters = "›";
      nextTxt.fontSize = 16;
      nextTxt.letterSpacing = { value: 0, unit: "PIXELS" };
      nextTxt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.9 }];
      nextBtn.appendChild(nextTxt);
      variant.appendChild(nextBtn);

      // 4. Pagination Dots Indicator row at bottom
      const dotsRow = figma.createFrame();
      dotsRow.name = "Pagination Dots";
      const dotsWidth = slideCount * 14 + 16;
      dotsRow.resize(dotsWidth, 16);
      dotsRow.fills = [];
      dotsRow.layoutMode = "HORIZONTAL";
      dotsRow.primaryAxisAlignItems = "CENTER";
      dotsRow.counterAxisAlignItems = "CENTER";
      dotsRow.itemSpacing = 6;
      dotsRow.x = Math.round((squareSize - dotsWidth) / 2);
      dotsRow.y = squareSize - 22;

      for (let d = 0; d < slideCount; d++) {
        const dot = figma.createFrame();
        dot.name = `Dot ${d + 1}`;
        const isActive = d === i;
        dot.resize(isActive ? 18 : 6, 6);
        dot.cornerRadius = 3;
        dot.fills = [
          {
            type: "SOLID",
            color: isActive ? { r: 0.95, g: 0.45, b: 0.2 } : { r: 1, g: 1, b: 1 },
            opacity: isActive ? 1 : 0.25,
          },
        ];
        dotsRow.appendChild(dot);
      }
      variant.appendChild(dotsRow);

      figma.currentPage.appendChild(variant);
      variants.push(variant);
    }

    // Combine all 4 variants into an official ComponentSetNode!
    const componentSet = figma.combineAsVariants(variants, figma.currentPage);
    componentSet.name = "Product Carousel (Component Set)";
    componentSet.layoutMode = "HORIZONTAL";
    componentSet.itemSpacing = 24;
    componentSet.paddingLeft = 24;
    componentSet.paddingRight = 24;
    componentSet.paddingTop = 24;
    componentSet.paddingBottom = 24;
    componentSet.fills = [{ type: "SOLID", color: { r: 0.04, g: 0.04, b: 0.06 }, opacity: 1 }];
    componentSet.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
    componentSet.cornerRadius = 20;

    // Position Component Set neatly next to targetNode
    componentSet.x = targetNode.x + targetNode.width + 60;
    componentSet.y = targetNode.y;

    // Wire Prototyping Reactions between Variants with SMART_ANIMATE and EASE_IN_AND_OUT
    for (let i = 0; i < slideCount; i++) {
      const currentVariant = variants[i];
      const nextIndex = (i + 1) % slideCount;
      const prevIndex = (i - 1 + slideCount) % slideCount;
      const nextVariant = variants[nextIndex];
      const prevVariant = variants[prevIndex];

      // 1. Auto-scroll transition: AFTER_TIMEOUT (2.5 seconds delay)
      // Ease in and ease out smooth animated glide!
      const autoScrollReaction = {
        trigger: {
          type: "AFTER_TIMEOUT",
          timeout: 2.5,
        },
        actions: [
          {
            type: "NODE",
            destinationId: nextVariant.id,
            navigation: "CHANGE_TO",
            transition: {
              type: "SMART_ANIMATE",
              duration: 0.65,
              easing: { type: "EASE_IN_AND_OUT" },
            },
          },
        ],
        action: {
          type: "NODE",
          destinationId: nextVariant.id,
          navigation: "CHANGE_TO",
          transition: {
            type: "SMART_ANIMATE",
            duration: 0.65,
            easing: { type: "EASE_IN_AND_OUT" },
          },
        },
      };

      // 2. Click / Tap to advance: ON_CLICK
      const clickReaction = {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: nextVariant.id,
            navigation: "CHANGE_TO",
            transition: {
              type: "SMART_ANIMATE",
              duration: 0.55,
              easing: { type: "EASE_IN_AND_OUT" },
            },
          },
        ],
        action: {
          type: "NODE",
          destinationId: nextVariant.id,
          navigation: "CHANGE_TO",
          transition: {
            type: "SMART_ANIMATE",
            duration: 0.55,
            easing: { type: "EASE_IN_AND_OUT" },
          },
        },
      };

      // 3. Swipe / Drag gesture: ON_DRAG
      const dragReaction = {
        trigger: { type: "ON_DRAG" },
        actions: [
          {
            type: "NODE",
            destinationId: nextVariant.id,
            navigation: "CHANGE_TO",
            transition: {
              type: "SMART_ANIMATE",
              duration: 0.55,
              easing: { type: "EASE_IN_AND_OUT" },
            },
          },
        ],
        action: {
          type: "NODE",
          destinationId: nextVariant.id,
          navigation: "CHANGE_TO",
          transition: {
            type: "SMART_ANIMATE",
            duration: 0.55,
            easing: { type: "EASE_IN_AND_OUT" },
          },
        },
      };

      // Apply to current variant root
      try {
        await (currentVariant as any).setReactionsAsync([autoScrollReaction, clickReaction, dragReaction]);
      } catch (err) {
        try {
          await (currentVariant as any).setReactionsAsync([autoScrollReaction]);
        } catch {}
      }

      // Track: Wire click to advance
      const trackChild = currentVariant.findChild(c => c.name === "Slides Track");
      if (trackChild) {
        try {
          await (trackChild as any).setReactionsAsync([clickReaction, dragReaction]);
        } catch {}
      }

      // Next Button: ON_CLICK -> nextVariant
      const nextBtnChild = currentVariant.findChild(c => c.name === "Next Button");
      if (nextBtnChild) {
        try {
          await (nextBtnChild as any).setReactionsAsync([
            {
              trigger: { type: "ON_CLICK" },
              actions: [
                {
                  type: "NODE",
                  destinationId: nextVariant.id,
                  navigation: "CHANGE_TO",
                  transition: {
                    type: "SMART_ANIMATE",
                    duration: 0.5,
                    easing: { type: "EASE_IN_AND_OUT" },
                  },
                },
              ],
              action: {
                type: "NODE",
                destinationId: nextVariant.id,
                navigation: "CHANGE_TO",
                transition: {
                  type: "SMART_ANIMATE",
                  duration: 0.5,
                  easing: { type: "EASE_IN_AND_OUT" },
                },
              },
            },
          ]);
        } catch {}
      }

      // Prev Button: ON_CLICK -> prevVariant
      const prevBtnChild = currentVariant.findChild(c => c.name === "Prev Button");
      if (prevBtnChild) {
        try {
          await (prevBtnChild as any).setReactionsAsync([
            {
              trigger: { type: "ON_CLICK" },
              actions: [
                {
                  type: "NODE",
                  destinationId: prevVariant.id,
                  navigation: "CHANGE_TO",
                  transition: {
                    type: "SMART_ANIMATE",
                    duration: 0.5,
                    easing: { type: "EASE_IN_AND_OUT" },
                  },
                },
              ],
              action: {
                type: "NODE",
                destinationId: prevVariant.id,
                navigation: "CHANGE_TO",
                transition: {
                  type: "SMART_ANIMATE",
                  duration: 0.5,
                  easing: { type: "EASE_IN_AND_OUT" },
                },
              },
            },
          ]);
        } catch {}
      }

      // Pagination Dots: wire each Dot d to jump to Variant d
      const dotsRowChild = currentVariant.findChild(c => c.name === "Pagination Dots") as FrameNode;
      if (dotsRowChild && dotsRowChild.children) {
        for (let d = 0; d < slideCount; d++) {
          const dotChild = dotsRowChild.children[d];
          const destVar = variants[d];
          if (dotChild && destVar && d !== i) {
            try {
              await (dotChild as any).setReactionsAsync([
                {
                  trigger: { type: "ON_CLICK" },
                  actions: [
                    {
                      type: "NODE",
                      destinationId: destVar.id,
                      navigation: "CHANGE_TO",
                      transition: {
                        type: "SMART_ANIMATE",
                        duration: 0.5,
                        easing: { type: "EASE_IN_AND_OUT" },
                      },
                    },
                  ],
                  action: {
                    type: "NODE",
                    destinationId: destVar.id,
                    navigation: "CHANGE_TO",
                    transition: {
                      type: "SMART_ANIMATE",
                      duration: 0.5,
                      easing: { type: "EASE_IN_AND_OUT" },
                    },
                  },
                },
              ]);
            } catch {}
          }
        }
      }
    }

    // Create a live ready-to-play single square frame Instance of Variant 1!
    const instance = variants[0].createInstance();
    instance.name = "Product Carousel (Square)";
    const parentContainer = targetNode.parent || figma.currentPage;
    parentContainer.appendChild(instance);
    instance.x = targetNode.x;
    instance.y = targetNode.y;

    // Set prototype flow start point to the square instance or currentPage
    try {
      figma.currentPage.prototypeStartNode = instance;
    } catch {}

    // Select the new square instance and zoom into view
    figma.currentPage.selection = [instance];
    figma.viewport.scrollAndZoomIntoView([instance]);

    figma.notify(`✓ Square Product Carousel Ready (${slideCount} products, smooth ease-in-out scroll)! Press Play ▶ to preview.`, { timeout: 4000 });

    figma.ui.postMessage({
      type: "CREATE_CAROUSEL_COMPONENT_RESULT",
      payload: {
        requestId,
        success: true,
        componentSetId: componentSet.id,
        instanceId: instance.id,
        squareSize,
        slideCount,
        details: [
          `Single square frame (${squareSize}x${squareSize}) showing 1 product at a time`,
          `${slideCount} product variants inside interactive Component Set`,
          "Smooth scrolling animation between products (SMART_ANIMATE, 0.65s, EASE_IN_AND_OUT)",
          "Auto-scrolls one by one every 2.5s with infinite loop",
          "Interactive pagination dots and next/prev chevrons for manual control",
          "Tap or swipe card to advance",
          "Live instance placed at selected frame position",
        ],
      },
    });
  } catch (err: any) {
    console.error("[Controller] Create carousel component failed:", err);
    figma.ui.postMessage({
      type: "CREATE_CAROUSEL_COMPONENT_RESULT",
      payload: {
        requestId: payload?.requestId,
        success: false,
        error: err.message || "Failed to create carousel component",
      },
    });
    figma.notify(`❌ Carousel error: ${err.message}`, { error: true, timeout: 4000 });
  }
}

async function handleEvalScript(payload: any = {}): Promise<void> {
  const requestId = payload.requestId;
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction("figma", payload.code);
    const result = await fn(figma);
    figma.ui.postMessage({
      type: "EVAL_SCRIPT_RESULT",
      payload: {
        requestId,
        success: true,
        data: result,
      },
    });
  } catch (err: any) {
    console.error("[Controller] handleEvalScript error:", err);
    figma.ui.postMessage({
      type: "EVAL_SCRIPT_RESULT",
      payload: {
        requestId,
        success: false,
        error: err.message || String(err),
      },
    });
  }
}

async function handleCreateProductLandingPage(payload: any = {}): Promise<void> {
  try {
    const result = await generateProductStoryLanding({
      sourceNodeId: payload.nodeId,
      startX: payload.startX,
      startY: payload.startY,
    });
    figma.ui.postMessage({
      type: "PRODUCT_LANDING_PAGE_CREATED",
      payload: {
        requestId: payload.requestId,
        success: result.success,
        framesCount: result.framesCount,
        rootFrameId: result.rootFrameId,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to create product landing page:", err);
    figma.ui.postMessage({
      type: "PRODUCT_LANDING_PAGE_CREATED",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to create product landing page",
      },
    });
  }
}

async function handleAnimateScene(payload: any = {}): Promise<void> {
  try {
    const result = await generateCinematicSceneAnimation({
      sourceNodeId: payload.nodeId,
      startX: payload.startX,
      startY: payload.startY,
    });
    figma.ui.postMessage({
      type: "ANIMATE_SCENE_RESULT",
      payload: {
        requestId: payload.requestId,
        success: result.success,
        framesCount: result.framesCount,
        rootFrameId: result.rootFrameId,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to animate scene:", err);
    figma.ui.postMessage({
      type: "ANIMATE_SCENE_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to animate scene",
      },
    });
  }
}

async function handleFigmaMotionAnimation(payload: any = {}): Promise<void> {
  try {
    const result = await createFigmaMotionAnimation({
      nodeId: payload.nodeId,
      duration: payload.duration || 9.0,
    });
    figma.ui.postMessage({
      type: "FIGMA_MOTION_ANIMATION_RESULT",
      payload: {
        requestId: payload.requestId,
        success: result.success,
        timelineDuration: result.timelineDuration,
        tracksApplied: result.tracksApplied,
        layersAnimated: result.layersAnimated,
        details: result.details,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to create Figma Motion animation:", err);
    figma.ui.postMessage({
      type: "FIGMA_MOTION_ANIMATION_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to create Figma Motion animation",
      },
    });
  }
}

async function handleGenerateNightToDay(payload: any = {}): Promise<void> {
  try {
    const result = await generateNightToDayMotionScene({
      frameId: payload.frameId,
      duration: payload.duration || 10.0,
    });
    figma.ui.postMessage({
      type: "GENERATE_NIGHT_TO_DAY_RESULT",
      payload: {
        requestId: payload.requestId,
        success: result.success,
        frameName: result.frameName,
        frameId: result.frameId,
        tracksApplied: result.tracksApplied,
        layersCreated: result.layersCreated,
        details: result.details,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to generate Night to Day scene:", err);
    figma.ui.postMessage({
      type: "GENERATE_NIGHT_TO_DAY_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to generate Night to Day scene",
      },
    });
  }
}

async function handleCreateColorSwitcher(payload: any = {}): Promise<void> {
  try {
    const result = await generateColorSwitcherComponent({
      frameId: payload.frameId,
      cardId: payload.cardId,
    });
    figma.ui.postMessage({
      type: "CREATE_COLOR_SWITCHER_RESULT",
      payload: {
        requestId: payload.requestId,
        success: result.success,
        componentSetId: result.componentSetId,
        componentSetName: result.componentSetName,
        instanceId: result.instanceId,
        variantsCount: result.variantsCount,
        details: result.details,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to create color switcher component:", err);
    figma.ui.postMessage({
      type: "CREATE_COLOR_SWITCHER_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to create color switcher component",
      },
    });
  }
}

async function handleCreateLoaderBuffer(payload: any = {}): Promise<void> {
  try {
    const result = await generateLoaderBufferAnimation({
      nodeId: payload.nodeId,
      duration: payload.duration || 1.0,
    });
    figma.ui.postMessage({
      type: "CREATE_LOADER_BUFFER_RESULT",
      payload: {
        requestId: payload.requestId,
        success: result.success,
        componentSetId: result.componentSetId,
        componentSetName: result.componentSetName,
        motionFrameId: result.motionFrameId,
        instanceId: result.instanceId,
        details: result.details,
        error: result.error,
      },
    });
  } catch (err: any) {
    console.error("[Controller] Failed to create loader buffer animation:", err);
    figma.ui.postMessage({
      type: "CREATE_LOADER_BUFFER_RESULT",
      payload: {
        requestId: payload.requestId,
        success: false,
        error: err.message || "Failed to create loader buffer animation",
      },
    });
  }
}


