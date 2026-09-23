/**
 * DesignForge AI — Cinematic 2D Scene Animator
 *
 * Transforms a static landscape illustration into a polished,
 * looping 2D animated scene with realistic physics (squash & stretch,
 * gravity acceleration, parabolic arcs, wind sway, cloud parallax, bird flight)
 * using Figma Smart Animate and After Delay triggers.
 */

export interface SceneAnimatorOptions {
  sourceNodeId?: string;
  startX?: number;
  startY?: number;
}

export interface SceneAnimatorResult {
  success: boolean;
  framesCount?: number;
  rootFrameId?: string;
  error?: string;
}

interface KeyframeConfig {
  name: string;
  timeout: number;          // Delay in seconds before transition starts
  duration: number;         // Smart Animate transition duration in seconds
  easing: "EASE_IN_AND_OUT" | "EASE_IN" | "EASE_OUT" | "GENTLE" | "BOUNCE" | "QUICK";
  // Ball transform
  ball: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  // Tree canopy sway offset
  treeCanopy: {
    x: number;
    y: number;
  };
  // Clouds parallax
  cloudLeft: {
    x: number;
    y: number;
  };
  cloudRight: {
    x: number;
    y: number;
  };
  // Birds flight path
  bird1: {
    x: number;
    y: number;
    rotation?: number;
  };
  bird2: {
    x: number;
    y: number;
    rotation?: number;
  };
}

/**
 * 9 Keyframes choreographed for realistic physics and looping:
 * Base road surface top is at y = 597
 * Initial ball position: x = 234, y = 323, size = 79x79
 * Initial tree canopy: x = 887, y = 289
 * Initial cloud left: x = 135, y = 46
 * Initial cloud right: x = 887, y = 54
 * Initial bird 1: x = 568, y = 170
 * Initial bird 2: x = 707, y = 161
 */
const ANIMATION_KEYFRAMES: KeyframeConfig[] = [
  // ─── 01: Opening & Anticipation (0.0s - 1.2s) ───
  {
    name: "01 — Opening & Anticipation",
    timeout: 1.0,
    duration: 0.85,
    easing: "EASE_IN",
    ball: { x: 234, y: 310, w: 77, h: 81 }, // Subtle upward breath/anticipation before drop
    treeCanopy: { x: 887, y: 289 },
    cloudLeft: { x: 135, y: 46 },
    cloudRight: { x: 887, y: 54 },
    bird1: { x: 568, y: 170, rotation: 0 },
    bird2: { x: 707, y: 161, rotation: 0 },
  },

  // ─── 02: Downward Fall & Velocity Stretch (1.2s - 2.0s) ───
  {
    name: "02 — Fall & Velocity Stretch",
    timeout: 0.05,
    duration: 0.22,
    easing: "EASE_IN",
    ball: { x: 238, y: 508, w: 72, h: 89 }, // Elongated along Y-axis due to gravity speed
    treeCanopy: { x: 893, y: 289 },        // Light breeze sway right
    cloudLeft: { x: 165, y: 46 },
    cloudRight: { x: 902, y: 54 },
    bird1: { x: 515, y: 154, rotation: -4 },
    bird2: { x: 655, y: 150, rotation: 3 },
  },

  // ─── 03: Impact 1: Maximum Road Squash (2.0s - 2.3s) ───
  {
    name: "03 — Impact 1 (Road Squash)",
    timeout: 0.05,
    duration: 0.68,
    easing: "EASE_OUT",
    ball: { x: 226, y: 539, w: 96, h: 58 }, // Horizontal squash! (539 + 58 = 597 road top)
    treeCanopy: { x: 896, y: 289 },
    cloudLeft: { x: 195, y: 46 },
    cloudRight: { x: 918, y: 54 },
    bird1: { x: 468, y: 142, rotation: 2 },
    bird2: { x: 608, y: 142, rotation: -3 },
  },

  // ─── 04: Rebound Apex 1: High Arc (2.3s - 3.6s) ───
  {
    name: "04 — Rebound Apex 1 (High Arc)",
    timeout: 0.05,
    duration: 0.58,
    easing: "EASE_IN",
    ball: { x: 410, y: 395, w: 79, h: 79 }, // Rebounds 202px above road, traveling right
    treeCanopy: { x: 884, y: 289 },         // Sway back toward center
    cloudLeft: { x: 232, y: 46 },
    cloudRight: { x: 938, y: 54 },
    bird1: { x: 418, y: 132, rotation: -3 },
    bird2: { x: 558, y: 135, rotation: 2 },
  },

  // ─── 05: Impact 2: Medium Squash (3.6s - 4.5s) ───
  {
    name: "05 — Impact 2 (Medium Squash)",
    timeout: 0.05,
    duration: 0.52,
    easing: "EASE_OUT",
    ball: { x: 560, y: 531, w: 90, h: 66 }, // Second contact (531 + 66 = 597 road top)
    treeCanopy: { x: 880, y: 289 },         // Gentle sway left
    cloudLeft: { x: 270, y: 46 },
    cloudRight: { x: 960, y: 54 },
    bird1: { x: 360, y: 122, rotation: 3 },
    bird2: { x: 500, y: 128, rotation: -2 },
  },

  // ─── 06: Rebound Apex 2: Lower Arc (4.5s - 5.6s) ───
  {
    name: "06 — Rebound Apex 2 (Lower Arc)",
    timeout: 0.05,
    duration: 0.44,
    easing: "EASE_IN",
    ball: { x: 695, y: 485, w: 79, h: 79 }, // Apex 112px above road
    treeCanopy: { x: 885, y: 289 },
    cloudLeft: { x: 310, y: 46 },
    cloudRight: { x: 982, y: 54 },
    bird1: { x: 298, y: 112, rotation: -2 },
    bird2: { x: 438, y: 122, rotation: 3 },
  },

  // ─── 07: Impact 3: Gentle Touchdown (5.6s - 6.5s) ───
  {
    name: "07 — Impact 3 (Gentle Touchdown)",
    timeout: 0.05,
    duration: 0.72,
    easing: "EASE_IN_AND_OUT",
    ball: { x: 795, y: 524, w: 84, h: 73 }, // Gentle squash near tree trunk
    treeCanopy: { x: 890, y: 289 },
    cloudLeft: { x: 350, y: 46 },
    cloudRight: { x: 1004, y: 54 },
    bird1: { x: 238, y: 104, rotation: 2 },
    bird2: { x: 378, y: 116, rotation: -3 },
  },

  // ─── 08: Settle Under Tree & Scene Flow (6.5s - 8.2s) ───
  {
    name: "08 — Rest Under Tree & Flow",
    timeout: 1.1,
    duration: 1.35,
    easing: "EASE_IN_AND_OUT",
    ball: { x: 865, y: 518, w: 79, h: 79 }, // Sits comfortably in tree shade on road
    treeCanopy: { x: 887, y: 289 },
    cloudLeft: { x: 395, y: 46 },
    cloudRight: { x: 1028, y: 54 },
    bird1: { x: 172, y: 96, rotation: 0 },
    bird2: { x: 312, y: 110, rotation: 0 },
  },

  // ─── 09: Return Float & Seamless Loop (8.2s - 10.0s) ───
  {
    name: "09 — Return Float & Loop Reset",
    timeout: 0.05,
    duration: 0.85,
    easing: "EASE_IN_AND_OUT",
    ball: { x: 234, y: 323, w: 79, h: 79 }, // Glides gently back to origin
    treeCanopy: { x: 887, y: 289 },
    cloudLeft: { x: 135, y: 46 },           // Seamlessly resets cloud position
    cloudRight: { x: 887, y: 54 },
    bird1: { x: 568, y: 170, rotation: 0 },
    bird2: { x: 707, y: 161, rotation: 0 },
  },
];

export async function generateCinematicSceneAnimation(
  options: SceneAnimatorOptions = {}
): Promise<SceneAnimatorResult> {
  try {
    figma.notify("🎬 Preparing 2D Cinematic Animation...", { timeout: 2500 });

    // 1. Locate Source Frame
    let sourceFrame: FrameNode | null = null;
    if (options.sourceNodeId) {
      const node = await figma.getNodeByIdAsync(options.sourceNodeId);
      if (node && node.type === "FRAME") sourceFrame = node as FrameNode;
    }

    if (!sourceFrame && figma.currentPage.selection.length > 0) {
      const selected = figma.currentPage.selection[0];
      if (selected.type === "FRAME") sourceFrame = selected as FrameNode;
    }

    if (!sourceFrame) {
      // Find frame named 'Anmt-frame' or similar on current page
      sourceFrame = figma.currentPage.findOne(
        (n) => n.type === "FRAME" && (n.name.includes("Anmt") || n.name.includes("Landscape"))
      ) as FrameNode | null;
    }

    if (!sourceFrame) {
      return {
        success: false,
        error: "Please select the illustration frame (Anmt-frame) on the Figma canvas to animate.",
      };
    }

    // 2. Identify & standardize layer names on a template clone
    // Helper to standardize layer names inside a frame
    const standardizeLayers = (frame: FrameNode) => {
      // Find groups and vectors
      for (const child of frame.children) {
        // Road group
        if (
          child.type === "GROUP" &&
          child.name.includes("Group 4") ||
          (child.type === "GROUP" && "children" in child && (child as GroupNode).children.length >= 6)
        ) {
          child.name = "Road";
          let bandIndex = 1;
          for (const c of (child as GroupNode).children) {
            c.name = `Road_Band_${bandIndex++}`;
          }
        }

        // Ball group (4 ellipses: Body, Eye Left, Eye Right, Mouth)
        if (
          child.type === "GROUP" &&
          (child.name.includes("Group 2") ||
            ("children" in child && (child as GroupNode).children.some((c) => c.name.includes("Ellipse 2"))))
        ) {
          child.name = "Ball";
          for (const c of (child as GroupNode).children) {
            if (c.name.includes("Ellipse 2") || (c.width > 50 && c.height > 50)) {
              c.name = "Ball_Body";
            } else if (c.name.includes("Ellipse 5") || (c.width > 20 && c.width < 40)) {
              c.name = "Ball_Mouth";
            } else if (c.name.includes("Ellipse 3") || c.x < 270) {
              c.name = "Ball_Eye_Left";
            } else {
              c.name = "Ball_Eye_Right";
            }
          }
        }

        // Tree group (Trunk rectangle & Canopy ellipse)
        if (
          child.type === "GROUP" &&
          (child.name.includes("Group 3") ||
            ("children" in child && (child as GroupNode).children.some((c) => c.name.includes("Rectangle 12"))))
        ) {
          child.name = "Tree";
          for (const c of (child as GroupNode).children) {
            if (c.type === "RECTANGLE" || c.name.includes("Rectangle 12")) {
              c.name = "Tree_Trunk";
            } else {
              c.name = "Tree_Canopy";
            }
          }
        }

        // Clouds (Boolean Unions)
        if (child.type === "BOOLEAN_OPERATION" || child.name.includes("Union")) {
          if (child.x < 500) {
            child.name = "Cloud_Left";
          } else {
            child.name = "Cloud_Right";
          }
        }

        // Birds (Vectors)
        if (child.type === "VECTOR" || child.name.includes("Vector")) {
          if (child.x < 620) {
            child.name = "Bird_01";
          } else {
            child.name = "Bird_02";
          }
        }
      }
    };

    // Standardize source frame layer names as well for complete consistency
    standardizeLayers(sourceFrame);

    const startX = options.startX ?? sourceFrame.x;
    const startY = options.startY ?? (sourceFrame.y + sourceFrame.height + 160);
    const frameGap = 80;

    const createdFrames: FrameNode[] = [];

    // 3. Generate Keyframe Sequence
    for (let i = 0; i < ANIMATION_KEYFRAMES.length; i++) {
      const kf = ANIMATION_KEYFRAMES[i];
      figma.notify(`✨ Crafting State ${i + 1}/${ANIMATION_KEYFRAMES.length}: ${kf.name}...`, { timeout: 1500 });

      // Clone source frame
      const frame = sourceFrame.clone();
      frame.name = kf.name;
      frame.x = startX + i * (sourceFrame.width + frameGap);
      frame.y = startY;

      // Standardize layer names in cloned frame
      standardizeLayers(frame);

      // Apply keyframe transforms:

      // A. Ball transform (position + squash/stretch)
      const ballGroup = frame.findOne((n) => n.name === "Ball") as GroupNode | FrameNode | null;
      if (ballGroup) {
        const ballBody = ballGroup.findOne((n) => n.name === "Ball_Body");
        const eyeL = ballGroup.findOne((n) => n.name === "Ball_Eye_Left");
        const eyeR = ballGroup.findOne((n) => n.name === "Ball_Eye_Right");
        const mouth = ballGroup.findOne((n) => n.name === "Ball_Mouth");

        const targetW = kf.ball.w;
        const targetH = kf.ball.h;
        const targetX = kf.ball.x;
        const targetY = kf.ball.y;

        // Base original proportions
        const scaleX = targetW / 79;
        const scaleY = targetH / 79;

        if (ballBody && "resize" in ballBody) {
          ballBody.resize(targetW, targetH);
          ballBody.x = targetX;
          ballBody.y = targetY;
        }

        // Relative face element offsets
        // Original: Ball (x:234, y:323), EyeL (x:250, y:352), EyeR (x:287, y:352), Mouth (x:260, y:373)
        if (eyeL) {
          eyeL.x = targetX + (250 - 234) * scaleX;
          eyeL.y = targetY + (352 - 323) * scaleY;
          if ("resize" in eyeL) eyeL.resize(Math.max(4, 10 * scaleX), Math.max(4, 11 * scaleY));
        }

        if (eyeR) {
          eyeR.x = targetX + (287 - 234) * scaleX;
          eyeR.y = targetY + (352 - 323) * scaleY;
          if ("resize" in eyeR) eyeR.resize(Math.max(4, 10 * scaleX), Math.max(4, 11 * scaleY));
        }

        if (mouth) {
          mouth.x = targetX + (260 - 234) * scaleX;
          mouth.y = targetY + (373 - 323) * scaleY;
          if ("resize" in mouth) mouth.resize(Math.max(10, 27 * scaleX), Math.max(4, 11 * scaleY));
        }
      }

      // B. Tree Canopy sway
      const treeCanopy = frame.findOne((n) => n.name === "Tree_Canopy");
      if (treeCanopy) {
        treeCanopy.x = kf.treeCanopy.x;
        treeCanopy.y = kf.treeCanopy.y;
      }

      // C. Clouds parallax
      const cloudL = frame.findOne((n) => n.name === "Cloud_Left");
      if (cloudL) {
        cloudL.x = kf.cloudLeft.x;
        cloudL.y = kf.cloudLeft.y;
      }

      const cloudR = frame.findOne((n) => n.name === "Cloud_Right");
      if (cloudR) {
        cloudR.x = kf.cloudRight.x;
        cloudR.y = kf.cloudRight.y;
      }

      // D. Birds flight path & wing position
      const bird1 = frame.findOne((n) => n.name === "Bird_01");
      if (bird1) {
        bird1.x = kf.bird1.x;
        bird1.y = kf.bird1.y;
        if (typeof kf.bird1.rotation === "number" && "rotation" in bird1) {
          bird1.rotation = kf.bird1.rotation;
        }
      }

      const bird2 = frame.findOne((n) => n.name === "Bird_02");
      if (bird2) {
        bird2.x = kf.bird2.x;
        bird2.y = kf.bird2.y;
        if (typeof kf.bird2.rotation === "number" && "rotation" in bird2) {
          bird2.rotation = kf.bird2.rotation;
        }
      }

      createdFrames.push(frame);
    }

    // 4. Wire Prototype Reactions with Smart Animate & After Delay
    figma.notify("🔗 Wiring Smart Animate prototype loop...", { timeout: 2000 });

    for (let i = 0; i < createdFrames.length; i++) {
      const cur = createdFrames[i];
      const next = createdFrames[(i + 1) % createdFrames.length];
      const kf = ANIMATION_KEYFRAMES[i];

      const afterDelayReaction: any = {
        trigger: {
          type: "AFTER_TIMEOUT",
          timeout: kf.timeout,
        },
        actions: [
          {
            type: "NODE",
            destinationId: next.id,
            navigation: "NAVIGATE",
            transition: {
              type: "SMART_ANIMATE",
              duration: kf.duration,
              easing: { type: kf.easing },
            },
          },
        ],
      };

      try {
        await (cur as any).setReactionsAsync([afterDelayReaction]);
      } catch (err) {
        console.warn(`[SceneAnimator] Failed to set reaction on frame ${cur.name}:`, err);
      }
    }

    // 5. Configure Flow Starting Point
    figma.currentPage.flowStartingPoints = [
      {
        nodeId: createdFrames[0].id,
        name: "▶️ 2D Cinematic Animation — Colorful Landscape",
      },
    ];

    // 6. Select and focus on the generated animation sequence
    figma.currentPage.selection = [createdFrames[0]];
    figma.viewport.scrollAndZoomIntoView(createdFrames);

    figma.notify("🎉 2D Cinematic Animation Complete! Press Play to view prototype.", { timeout: 6000 });

    return {
      success: true,
      framesCount: createdFrames.length,
      rootFrameId: createdFrames[0].id,
    };
  } catch (err: any) {
    console.error("[SceneAnimator] Error generating animation:", err);
    return {
      success: false,
      error: err.message || "Failed to generate cinematic scene animation",
    };
  }
}
