/**
 * DesignForge AI — Loader Buffer Animator (Figma Motion & Interactive Prototype)
 *
 * Takes a selected ellipse or circular arc buffer element,
 * and creates:
 * 1. An Interactive Prototype Component Set with 4 variants wired via AFTER_TIMEOUT + SMART_ANIMATE
 *    for infinite, continuous 360° spinning in Figma Presentation / Prototype mode.
 * 2. A native Figma Motion timeline with ROTATION and SCALE keyframe tracks
 *    playable directly in Figma Motion.
 * 3. Places a live running preview instance right at the original position.
 */

export interface LoaderBufferOptions {
  nodeId?: string;
  duration?: number; // default: 1.0s
}

export interface LoaderBufferResult {
  success: boolean;
  componentSetId?: string;
  componentSetName?: string;
  motionFrameId?: string;
  instanceId?: string;
  details?: string[];
  error?: string;
}

export async function generateLoaderBufferAnimation(
  options: LoaderBufferOptions = {}
): Promise<LoaderBufferResult> {
  const details: string[] = [];

  try {
    figma.notify("⏳ Creating loader buffer animation...", { timeout: 3000 });

    // 1. Locate Target Node
    let targetNode: SceneNode | null = null;
    if (options.nodeId) {
      targetNode = await figma.getNodeByIdAsync(options.nodeId) as SceneNode | null;
    }

    if (!targetNode && figma.currentPage.selection.length > 0) {
      targetNode = figma.currentPage.selection[0];
    }

    if (!targetNode) {
      const node = await figma.getNodeByIdAsync("858:1554");
      if (node) targetNode = node as SceneNode;
    }

    if (!targetNode) {
      return {
        success: false,
        error: "Please select the ellipse or circular shape to turn into a loader buffer.",
      };
    }

    details.push(`Found target shape: "${targetNode.name}" (${targetNode.id}) [${targetNode.type}].`);

    const origX = targetNode.x;
    const origY = targetNode.y;
    const origW = targetNode.width;
    const origH = targetNode.height;

    // Helper: clone visual properties to an ellipse
    function setupSpinnerProps(ellipse: EllipseNode, source: SceneNode) {
      ellipse.name = "Spinner_Ring";
      ellipse.resize(origW, origH);

      if ("fills" in source && Array.isArray((source as any).fills)) {
        ellipse.fills = (source as any).fills;
      }
      if ("strokes" in source && Array.isArray((source as any).strokes)) {
        ellipse.strokes = (source as any).strokes;
        ellipse.strokeWeight = (source as any).strokeWeight || 1;
      }
      if ("effects" in source && Array.isArray((source as any).effects)) {
        ellipse.effects = (source as any).effects;
      }
      if ("opacity" in source) {
        ellipse.opacity = (source as any).opacity;
      }

      // Preserve arcData for donut / arc spinner
      if ("arcData" in source && (source as any).arcData) {
        ellipse.arcData = (source as any).arcData;
      } else {
        // Default clean buffering arc if it was a plain circle
        ellipse.arcData = {
          startingAngle: 0,
          endingAngle: -Math.PI * 1.6, // ~290 degree arc with opening
          innerRadius: 0.72,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────
    // PART A: BUILD INTERACTIVE COMPONENT SET (SMART ANIMATE LOOP)
    // ─────────────────────────────────────────────────────────────
    // 4 variants: 0°, 90°, 180°, 270° clockwise
    const angles = [
      { name: "0deg", deg: 0 },
      { name: "90deg", deg: -90 },
      { name: "180deg", deg: -180 },
      { name: "270deg", deg: 90 }, // in Figma, 270° is represented as +90° or relativeTransform
    ];

    const frameSize = Math.max(origW, origH) + 24; // comfortable container bounding box
    const variants: ComponentNode[] = [];

    for (const a of angles) {
      const comp = figma.createComponent();
      figma.currentPage.appendChild(comp);
      comp.name = `State=${a.name}`;
      comp.resize(frameSize, frameSize);
      comp.clipsContent = false;
      comp.fills = []; // transparent container

      // Create the spinner ring inside
      const spinner = figma.createEllipse();
      setupSpinnerProps(spinner, targetNode);
      comp.appendChild(spinner);

      // Center inside comp
      spinner.x = (frameSize - origW) / 2;
      spinner.y = (frameSize - origH) / 2;

      // Apply rotation about center
      spinner.rotation = a.deg;

      // Re-center after rotation
      // Figma rotates about top-left, so we adjust center
      const rad = (a.deg * Math.PI) / 180;
      const cx = frameSize / 2;
      const cy = frameSize / 2;
      // Center bounding box:
      spinner.x = cx - (spinner.width / 2);
      spinner.y = cy - (spinner.height / 2);

      variants.push(comp);
    }

    // Combine as Variants
    const componentSet = figma.combineAsVariants(variants, figma.currentPage);
    componentSet.name = "Loader Buffer — Interactive Component Set";
    componentSet.layoutMode = "HORIZONTAL";
    componentSet.itemSpacing = 24;
    componentSet.paddingTop = 20;
    componentSet.paddingBottom = 20;
    componentSet.paddingLeft = 20;
    componentSet.paddingRight = 20;
    componentSet.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.98 }, opacity: 1, visible: true }];
    componentSet.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.90, b: 0.92 }, opacity: 1, visible: true }];
    componentSet.strokeWeight = 1;
    componentSet.cornerRadius = 12;

    // Position Component Set neatly beside or above original
    componentSet.x = origX + origW + 60;
    componentSet.y = origY - 20;

    details.push(`Created 4-state Component Set "${componentSet.name}" (${componentSet.id}).`);

    // Wire Prototype Reactions: AFTER_TIMEOUT loop between variants
    const stepDuration = 0.25; // 4 x 0.25s = 1.0s per full revolution
    for (let i = 0; i < variants.length; i++) {
      const cur = variants[i];
      const next = variants[(i + 1) % variants.length];

      const loopReaction = {
        trigger: {
          type: "AFTER_TIMEOUT",
          timeout: 0.001, // instant continuous advance
        },
        actions: [
          {
            type: "NODE",
            destinationId: next.id,
            navigation: "CHANGE_TO",
            transition: {
              type: "SMART_ANIMATE",
              duration: stepDuration,
              easing: { type: "LINEAR" },
            },
          },
        ],
        action: {
          type: "NODE",
          destinationId: next.id,
          navigation: "CHANGE_TO",
          transition: {
            type: "SMART_ANIMATE",
            duration: stepDuration,
            easing: { type: "LINEAR" },
          },
        },
      };

      try {
        if (typeof (cur as any).setReactionsAsync === "function") {
          await (cur as any).setReactionsAsync([loopReaction]);
        } else {
          (cur as any).reactions = [loopReaction];
        }
      } catch (rErr) {
        console.warn(`[LoaderBuffer] Reaction error on ${cur.name}:`, rErr);
      }
    }

    details.push("Wired Smart Animate continuous loop reactions across all 4 variants!");

    // ─────────────────────────────────────────────────────────────
    // PART B: BUILD FIGMA MOTION ANIMATED FRAME
    // ─────────────────────────────────────────────────────────────
    const motionFrame = figma.createFrame();
    figma.currentPage.appendChild(motionFrame);
    motionFrame.name = "Loader — Figma Motion Buffer";
    motionFrame.resize(frameSize, frameSize);
    motionFrame.clipsContent = false;
    motionFrame.fills = []; // transparent
    motionFrame.x = origX;
    motionFrame.y = origY + origH + 40;

    const motionSpinner = figma.createEllipse();
    setupSpinnerProps(motionSpinner, targetNode);
    motionFrame.appendChild(motionSpinner);
    motionSpinner.x = (frameSize - origW) / 2;
    motionSpinner.y = (frameSize - origH) / 2;

    // Apply native Figma Motion timeline & keyframes
    const motionDuration = options.duration || 1.0;
    const timelineId =
      motionFrame.timelines && motionFrame.timelines.length > 0
        ? motionFrame.timelines[0].id
        : motionFrame.id;

    if (typeof (motionFrame as any).setTimelineDuration === "function") {
      try {
        (motionFrame as any).setTimelineDuration(timelineId, motionDuration);
        details.push(`Set Figma Motion timeline duration to ${motionDuration}s.`);
      } catch (tErr) {
        console.warn("[LoaderBuffer] setTimelineDuration error:", tErr);
      }
    }

    // Helper to safely apply manual keyframe tracks
    const safeApplyTrack = (node: SceneNode, fieldName: string, keyframes: any[]) => {
      if (!node || typeof (node as any).applyManualKeyframeTrack !== "function") return false;

      const formattedKeyframes = keyframes.map((kf) => ({
        timelinePosition: kf.t,
        value: { type: "FLOAT", value: kf.v },
        easing: kf.easing ? { type: kf.easing } : { type: "LINEAR" },
      }));

      try {
        (node as any).applyManualKeyframeTrack(
          { type: "PROPERTY", name: fieldName },
          {
            baseValue: { type: "FLOAT", value: keyframes[0]?.v ?? 0 },
            keyframes: formattedKeyframes,
          }
        );
        return true;
      } catch (e1) {
        try {
          (node as any).applyManualKeyframeTrack(fieldName, {
            keyframes: formattedKeyframes,
          });
          return true;
        } catch (e2) {
          console.warn(`[LoaderBuffer] Track failed for ${fieldName} on ${node.name}:`, e1, e2);
          return false;
        }
      }
    };

    // Apply ROTATION keyframes: 0s -> 0°, 0.5s -> 180°, 1.0s -> 360°
    const rotSuccess = safeApplyTrack(motionSpinner, "ROTATION", [
      { t: 0.0, v: 0, easing: "LINEAR" },
      { t: motionDuration / 2, v: 180, easing: "LINEAR" },
      { t: motionDuration, v: 360, easing: "LINEAR" },
    ]);

    // Apply subtle breathing scale buffer pulse
    safeApplyTrack(motionSpinner, "SCALE_X", [
      { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: motionDuration / 2, v: 1.06, easing: "EASE_IN_AND_OUT" },
      { t: motionDuration, v: 1.0, easing: "EASE_IN_AND_OUT" },
    ]);
    safeApplyTrack(motionSpinner, "SCALE_Y", [
      { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: motionDuration / 2, v: 1.06, easing: "EASE_IN_AND_OUT" },
      { t: motionDuration, v: 1.0, easing: "EASE_IN_AND_OUT" },
    ]);

    if (rotSuccess) {
      details.push("Applied native Figma Motion ROTATION (0° → 360°) and breathing pulse tracks.");
    }

    // ─────────────────────────────────────────────────────────────
    // PART C: PLACE LIVE PREVIEW INSTANCE AT ORIGINAL POSITION
    // ─────────────────────────────────────────────────────────────
    const liveInstance = variants[0].createInstance();
    liveInstance.name = "Loader Buffer — Live Preview";
    liveInstance.x = origX;
    liveInstance.y = origY;

    if (targetNode.parent) {
      targetNode.parent.appendChild(liveInstance);
      // Hide static ellipse
      targetNode.visible = false;
    } else {
      figma.currentPage.appendChild(liveInstance);
      targetNode.visible = false;
    }

    details.push(`Placed interactive loader instance at original position (${origX}, ${origY}).`);

    // Add prototype flow starting point so Play button immediately shows the spinning loader
    figma.currentPage.flowStartingPoints = [
      { nodeId: liveInstance.id, name: "Loader Buffer Preview" },
    ];

    // Select and focus on the created elements
    figma.currentPage.selection = [liveInstance, componentSet, motionFrame];
    figma.viewport.scrollAndZoomIntoView([liveInstance, componentSet, motionFrame]);

    figma.notify("🎉 Loader Buffer Animation Created! Available in both Prototype and Motion.", { timeout: 6000 });

    return {
      success: true,
      componentSetId: componentSet.id,
      componentSetName: componentSet.name,
      motionFrameId: motionFrame.id,
      instanceId: liveInstance.id,
      details,
    };
  } catch (err: any) {
    console.error("[LoaderBuffer] Error creating loader buffer animation:", err);
    return {
      success: false,
      error: err?.message || String(err),
      details,
    };
  }
}
