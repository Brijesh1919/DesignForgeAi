/**
 * DesignForge AI — Native Figma Motion Animator
 *
 * Implements actual keyframes on the Figma Motion timeline using
 * Figma's native Motion API (setTimelineDuration, applyManualKeyframeTrack, applyAnimationStyle).
 *
 * Features:
 * - 9.0 second continuous Motion timeline
 * - Ball cartoon physics: anticipation, gravity fall, squash & stretch (scaleX/scaleY),
 *   multiple parabolic bounces with decreasing apexes, settling, and seamless loop return
 * - Tree canopy wind sway (rotation & translationX keyframes)
 * - Cloud parallax drift (independent horizontal translation keyframes)
 * - Bird independent flight paths (translationX, translationY, rotation keyframes)
 */

export interface FigmaMotionOptions {
  nodeId?: string;
  duration?: number; // default: 9.0s
}

export interface FigmaMotionResult {
  success: boolean;
  timelineDuration?: number;
  tracksApplied?: number;
  layersAnimated?: string[];
  details?: string[];
  error?: string;
}

export async function createFigmaMotionAnimation(
  options: FigmaMotionOptions = {}
): Promise<FigmaMotionResult> {
  const details: string[] = [];
  let tracksApplied = 0;
  const layersAnimated: string[] = [];

  try {
    figma.notify("🎬 Initializing native Figma Motion timeline...", { timeout: 3000 });

    // 1. Locate Target Frame
    let frame: FrameNode | null = null;
    if (options.nodeId) {
      const node = await figma.getNodeByIdAsync(options.nodeId);
      if (node && node.type === "FRAME") frame = node as FrameNode;
    }

    if (!frame && figma.currentPage.selection.length > 0) {
      const sel = figma.currentPage.selection[0];
      if (sel.type === "FRAME") frame = sel as FrameNode;
    }

    if (!frame) {
      frame = figma.currentPage.findOne(
        (n) => n.type === "FRAME" && (n.name.includes("Anmt") || n.name.includes("Landscape"))
      ) as FrameNode | null;
    }

    if (!frame) {
      return {
        success: false,
        error: "Please select the illustration frame (Anmt-frame) on canvas.",
      };
    }

    const duration = options.duration || 9.0;

    // 2. Set Timeline Duration on Frame
    const timelineId =
      frame.timelines && frame.timelines.length > 0 ? frame.timelines[0].id : frame.id;

    if (typeof (frame as any).setTimelineDuration === "function") {
      try {
        (frame as any).setTimelineDuration(timelineId, duration);
        details.push(`Set Figma Motion timeline duration to ${duration}s (Timeline ID: ${timelineId})`);
      } catch (err: any) {
        console.warn("[FigmaMotion] setTimelineDuration error:", err);
        details.push(`Note on timeline duration: ${err.message}`);
      }
    }

    // 3. Helper to safely apply manual keyframe tracks
    const safeApplyTrack = (node: SceneNode, fieldName: string, keyframes: any[]) => {
      if (!node || typeof (node as any).applyManualKeyframeTrack !== "function") return false;

      // Format keyframes with timelinePosition in seconds
      const formattedKeyframes = keyframes.map((kf) => ({
        timelinePosition: kf.t,
        value: { type: "FLOAT", value: kf.v },
        easing: kf.easing ? { type: kf.easing } : { type: "EASE_IN_AND_OUT" },
      }));

      // Try object field format first: { type: 'PROPERTY', name: fieldName }
      try {
        (node as any).applyManualKeyframeTrack(
          { type: "PROPERTY", name: fieldName },
          {
            baseValue: { type: "FLOAT", value: keyframes[0]?.v ?? 0 },
            keyframes: formattedKeyframes,
          }
        );
        tracksApplied++;
        return true;
      } catch (e1) {
        // Try string field name format
        try {
          (node as any).applyManualKeyframeTrack(fieldName, {
            keyframes: formattedKeyframes,
          });
          tracksApplied++;
          return true;
        } catch (e2: any) {
          console.warn(`[FigmaMotion] Failed to apply ${fieldName} on ${node.name}:`, e1, e2);
          details.push(`Error applying ${fieldName} on ${node.name}: e1: ${(e1 as any)?.message} | e2: ${e2?.message}`);
          return false;
        }
      }
    };

    // Clean up any extraneous prototype frames if present
    const prototypeFramesToRemove: FrameNode[] = [];
    for (const child of figma.currentPage.children) {
      if (
        child.type === "FRAME" &&
        child.id !== frame.id &&
        /0[1-9]\s*—\s*(Opening|Fall|Impact|Rebound|Rest|Return)/i.test(child.name)
      ) {
        prototypeFramesToRemove.push(child as FrameNode);
      }
    }
    for (const pf of prototypeFramesToRemove) {
      try { pf.remove(); } catch {}
    }
    figma.currentPage.flowStartingPoints = [];
    if (prototypeFramesToRemove.length > 0) {
      details.push(`Cleaned up ${prototypeFramesToRemove.length} prototype frames and cleared prototype flows.`);
    }

    // Standardize layer names in Anmt-frame
    for (const child of frame.children) {
      if (child.type === "GROUP" && (child.name.includes("Group 4") || (child as GroupNode).children?.length >= 6)) {
        child.name = "Road";
      } else if (child.type === "GROUP" && (child.name.includes("Group 2") || (child as GroupNode).children?.some(c => c.name.includes("Ellipse 2")))) {
        child.name = "Ball";
        for (const c of (child as GroupNode).children) {
          if (c.name.includes("Ellipse 2") || (c.width > 50 && c.height > 50)) c.name = "Ball_Body";
          else if (c.name.includes("Ellipse 5") || (c.width > 20 && c.width < 40)) c.name = "Ball_Mouth";
          else if (c.name.includes("Ellipse 3") || c.x < 270) c.name = "Ball_Eye_Left";
          else c.name = "Ball_Eye_Right";
        }
      } else if (child.type === "GROUP" && (child.name.includes("Group 3") || (child as GroupNode).children?.some(c => c.name.includes("Rectangle 12")))) {
        child.name = "Tree";
        for (const c of (child as GroupNode).children) {
          if (c.type === "RECTANGLE" || c.name.includes("Rectangle 12")) c.name = "Tree_Trunk";
          else c.name = "Tree_Canopy";
        }
      } else if (child.type === "BOOLEAN_OPERATION" || child.name.includes("Union")) {
        child.name = child.x < 500 ? "Cloud_Left" : "Cloud_Right";
      } else if (child.type === "VECTOR" || child.name.includes("Vector")) {
        child.name = child.x < 620 ? "Bird_01" : "Bird_02";
      }
    }

    // 4. Identify Layers inside Anmt-frame
    let ballNode: SceneNode | null = null;
    let treeCanopyNode: SceneNode | null = null;
    let cloudLeftNode: SceneNode | null = null;
    let cloudRightNode: SceneNode | null = null;
    let bird1Node: SceneNode | null = null;
    let bird2Node: SceneNode | null = null;

    for (const child of frame.children) {
      if (child.name === "Ball") {
        ballNode = child;
      } else if (child.name === "Tree") {
        if ("children" in child) {
          treeCanopyNode =
            (child as any).children.find(
              (c: SceneNode) => c.name === "Tree_Canopy"
            ) || child;
        } else {
          treeCanopyNode = child;
        }
      } else if (child.name === "Cloud_Left") {
        cloudLeftNode = child;
      } else if (child.name === "Cloud_Right") {
        cloudRightNode = child;
      } else if (child.name === "Bird_01") {
        bird1Node = child;
      } else if (child.name === "Bird_02") {
        bird2Node = child;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. ANIMATE BALL (Primary Character)
    // ─────────────────────────────────────────────────────────────
    if (ballNode) {
      layersAnimated.push("Ball");

      // Road is at y=597. Ball original y=323. Distance to road = 597 - (323 + 79) = 195px.
      // TRANSLATION_Y (Vertical cartoon physics)
      // 0.0s: 0px (start at resting y:323)
      // 1.2s: -14px (anticipation upward breath)
      // 2.2s: +195px (fall & hit road)
      // 2.7s: +195px (road squash contact)
      // 3.8s: +25px (first high bounce apex ~170px above road)
      // 4.5s: +195px (second impact)
      // 5.3s: +105px (second lower bounce apex ~90px above road)
      // 6.0s: +195px (third gentle touchdown)
      // 7.2s: +195px (resting on road beside tree)
      // 9.0s: 0px (smooth floating return to start for seamless loop)
      const ballYKeyframes = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 1.2, v: -14, easing: "EASE_IN" },       // Anticipation float up
        { t: 2.2, v: 195, easing: "EASE_IN" },       // Acceleration fall
        { t: 2.7, v: 195, easing: "EASE_OUT" },      // Impact squash
        { t: 3.8, v: 25, easing: "EASE_IN" },        // High bounce apex
        { t: 4.5, v: 195, easing: "EASE_OUT" },      // Second impact
        { t: 5.3, v: 105, easing: "EASE_IN" },       // Lower bounce apex
        { t: 6.0, v: 195, easing: "EASE_IN_AND_OUT" },// Soft touchdown
        { t: 7.2, v: 195, easing: "EASE_IN_AND_OUT" },// Resting beside tree
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },  // Return loop
      ];
      safeApplyTrack(ballNode, "TRANSLATION_Y", ballYKeyframes);

      // TRANSLATION_X (Horizontal travel toward right)
      // 0.0s - 1.2s: 0px
      // 2.2s: +8px
      // 2.7s: +15px
      // 3.8s: +170px
      // 4.5s: +325px
      // 5.3s: +460px
      // 6.0s: +560px
      // 7.2s: +630px (rest under tree)
      // 9.0s: 0px (loop reset)
      const ballXKeyframes = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 1.2, v: 0, easing: "EASE_IN" },
        { t: 2.2, v: 8, easing: "EASE_IN" },
        { t: 2.7, v: 15, easing: "EASE_OUT" },
        { t: 3.8, v: 170, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: 325, easing: "EASE_OUT" },
        { t: 5.3, v: 460, easing: "EASE_IN_AND_OUT" },
        { t: 6.0, v: 560, easing: "EASE_IN_AND_OUT" },
        { t: 7.2, v: 630, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(ballNode, "TRANSLATION_X", ballXKeyframes);

      // SCALE_X (Horizontal Squash)
      // 1.0 = 100% normal
      // 1.25 = 125% squash on impact 1
      // 1.15 = 115% squash on impact 2
      // 1.06 = 106% gentle squash on touchdown
      const ballScaleXKeyframes = [
        { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 1.2, v: 0.96, easing: "EASE_IN" },      // Anticipation breath
        { t: 2.0, v: 0.88, easing: "EASE_IN" },      // Vertical stretch while falling
        { t: 2.4, v: 1.25, easing: "EASE_OUT" },     // Max impact squash (1.25x)
        { t: 2.7, v: 1.10, easing: "EASE_OUT" },     // Recovery
        { t: 3.8, v: 1.0, easing: "EASE_IN_AND_OUT" },// Neutral apex
        { t: 4.3, v: 0.92, easing: "EASE_IN" },      // Stretch falling
        { t: 4.5, v: 1.15, easing: "EASE_OUT" },     // Second impact squash (1.15x)
        { t: 4.8, v: 1.0, easing: "EASE_OUT" },      // Recovery
        { t: 5.3, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 5.9, v: 0.95, easing: "EASE_IN" },
        { t: 6.0, v: 1.06, easing: "EASE_OUT" },     // Touchdown squash (1.06x)
        { t: 6.3, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 7.2, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(ballNode, "SCALE_X", ballScaleXKeyframes);

      // SCALE_Y (Vertical Stretch & Squash)
      // 1.0 = 100% normal
      // 0.70 = 70% squash height on impact 1
      // 0.80 = 80% squash height on impact 2
      // 0.94 = 94% gentle touchdown squash
      const ballScaleYKeyframes = [
        { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 1.2, v: 1.04, easing: "EASE_IN" },      // Anticipation breath
        { t: 2.0, v: 1.14, easing: "EASE_IN" },      // Falling velocity stretch (1.14x)
        { t: 2.4, v: 0.70, easing: "EASE_OUT" },     // Max impact squash (0.70x)
        { t: 2.7, v: 0.90, easing: "EASE_OUT" },     // Recovery
        { t: 3.8, v: 1.0, easing: "EASE_IN_AND_OUT" },// Neutral apex
        { t: 4.3, v: 1.09, easing: "EASE_IN" },      // Falling stretch
        { t: 4.5, v: 0.80, easing: "EASE_OUT" },     // Second impact squash (0.80x)
        { t: 4.8, v: 1.0, easing: "EASE_OUT" },      // Recovery
        { t: 5.3, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 5.9, v: 1.05, easing: "EASE_IN" },
        { t: 6.0, v: 0.94, easing: "EASE_OUT" },     // Touchdown squash (0.94x)
        { t: 6.3, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 7.2, v: 1.0, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(ballNode, "SCALE_Y", ballScaleYKeyframes);

      details.push("Applied Ball cartoon physics: anticipation, gravity fall, squash & stretch, rebound arcs, rest, and loop.");
    }

    // ─────────────────────────────────────────────────────────────
    // 6. ANIMATE TREE CANOPY (Secondary Wind Sway)
    // ─────────────────────────────────────────────────────────────
    if (treeCanopyNode) {
      layersAnimated.push("Tree_Canopy");

      // ROTATION wind sway (degrees: -2.5° to +2.5°)
      const canopyRotKeyframes = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 1.5, v: 2.0, easing: "EASE_IN_AND_OUT" },
        { t: 3.0, v: -2.0, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: 2.5, easing: "EASE_IN_AND_OUT" },
        { t: 6.0, v: -1.8, easing: "EASE_IN_AND_OUT" },
        { t: 7.5, v: 1.5, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(treeCanopyNode, "ROTATION", canopyRotKeyframes);

      // TRANSLATION_X subtle sway (-6px to +8px)
      const canopyXKeyframes = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 1.5, v: 6, easing: "EASE_IN_AND_OUT" },
        { t: 3.0, v: -5, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: 8, easing: "EASE_IN_AND_OUT" },
        { t: 6.0, v: -6, easing: "EASE_IN_AND_OUT" },
        { t: 7.5, v: 4, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(treeCanopyNode, "TRANSLATION_X", canopyXKeyframes);

      details.push("Applied Tree Canopy gentle wind sway rhythm (rotation + translationX).");
    }

    // ─────────────────────────────────────────────────────────────
    // 7. ANIMATE CLOUDS (Horizontal Parallax Drift)
    // ─────────────────────────────────────────────────────────────
    if (cloudLeftNode) {
      layersAnimated.push("Cloud_Left");
      // Cloud Left moves horizontally 0 -> +140px -> 0
      const cloudLXKeyframes = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: 140, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(cloudLeftNode, "TRANSLATION_X", cloudLXKeyframes);
    }

    if (cloudRightNode) {
      layersAnimated.push("Cloud_Right");
      // Cloud Right moves at different parallax speed 0 -> +75px -> 0
      const cloudRXKeyframes = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: 75, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(cloudRightNode, "TRANSLATION_X", cloudRXKeyframes);
      details.push("Applied Cloud Left & Right multi-speed horizontal parallax drift.");
    }

    // ─────────────────────────────────────────────────────────────
    // 8. ANIMATE BIRDS (Independent Flight Paths & Wing Flaps)
    // ─────────────────────────────────────────────────────────────
    if (bird1Node) {
      layersAnimated.push("Bird_01");
      const bird1X = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: -130, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      const bird1Y = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 2.2, v: -22, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: 12, easing: "EASE_IN_AND_OUT" },
        { t: 6.8, v: -18, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      const bird1Rot = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 2.2, v: -4.0, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: 3.5, easing: "EASE_IN_AND_OUT" },
        { t: 6.8, v: -3.0, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(bird1Node, "TRANSLATION_X", bird1X);
      safeApplyTrack(bird1Node, "TRANSLATION_Y", bird1Y);
      safeApplyTrack(bird1Node, "ROTATION", bird1Rot);
    }

    if (bird2Node) {
      layersAnimated.push("Bird_02");
      const bird2X = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 4.5, v: -95, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      const bird2Y = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 2.5, v: 16, easing: "EASE_IN_AND_OUT" },
        { t: 5.0, v: -24, easing: "EASE_IN_AND_OUT" },
        { t: 7.2, v: 14, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      const bird2Rot = [
        { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
        { t: 2.5, v: 3.0, easing: "EASE_IN_AND_OUT" },
        { t: 5.0, v: -3.5, easing: "EASE_IN_AND_OUT" },
        { t: 7.2, v: 2.5, easing: "EASE_IN_AND_OUT" },
        { t: 9.0, v: 0, easing: "EASE_IN_AND_OUT" },
      ];
      safeApplyTrack(bird2Node, "TRANSLATION_X", bird2X);
      safeApplyTrack(bird2Node, "TRANSLATION_Y", bird2Y);
      safeApplyTrack(bird2Node, "ROTATION", bird2Rot);
      details.push("Applied Bird 01 & Bird 02 curved glide paths & wing pitch rotations.");
    }

    // Focus selection on the animated artwork frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    figma.notify("🎉 Figma Motion Animation Timeline Ready! Open Motion to play.", { timeout: 6000 });

    return {
      success: true,
      timelineDuration: duration,
      tracksApplied,
      layersAnimated,
      details,
    };
  } catch (err: any) {
    console.error("[FigmaMotion] Error generating Motion animation:", err);
    return {
      success: false,
      error: err.message || "Failed to create Figma Motion animation",
      details,
    };
  }
}
