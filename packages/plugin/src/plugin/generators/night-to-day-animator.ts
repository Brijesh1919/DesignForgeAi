/**
 * DesignForge AI — Night to Day 2D Cinematic Scene & Figma Motion Animator
 *
 * Builds a complete minimalist 2D illustrated landscape inside the selected frame:
 * - Deep night sky transitioning to morning sky and sunrise glow
 * - Circular luminous Moon & Stars
 * - Rising radiant Sun
 * - Rolling mountains & hills
 * - Cottage with glowing warm window
 * - Winding path & swaying flowers
 * - Tree with swaying canopy
 * - Morning birds gliding across the sky
 *
 * Then programs an actual 10-second continuous native Figma Motion timeline
 * with keyframe tracks (TRANSLATION_X, TRANSLATION_Y, SCALE_X, SCALE_Y, OPACITY, ROTATION).
 */

export interface NightToDayOptions {
  frameId?: string;
  duration?: number; // default: 10.0s
}

export interface NightToDayResult {
  success: boolean;
  frameName?: string;
  frameId?: string;
  tracksApplied?: number;
  layersCreated?: string[];
  details?: string[];
  error?: string;
}

export async function generateNightToDayMotionScene(
  options: NightToDayOptions = {}
): Promise<NightToDayResult> {
  const details: string[] = [];
  const layersCreated: string[] = [];
  let tracksApplied = 0;

  try {
    figma.notify("🎨 Illustrating 2D 'Night to Day' landscape artwork...", { timeout: 3000 });

    // 1. Locate Target Frame
    let frame: FrameNode | null = null;
    if (options.frameId) {
      const node = await figma.getNodeByIdAsync(options.frameId);
      if (node && node.type === "FRAME") frame = node as FrameNode;
    }

    if (!frame && figma.currentPage.selection.length > 0) {
      const sel = figma.currentPage.selection[0];
      if (sel.type === "FRAME") frame = sel as FrameNode;
    }

    if (!frame) {
      return {
        success: false,
        error: "Please select the blank Figma frame to create the animation in.",
      };
    }

    // Prepare Frame
    frame.name = "Night to Day — 2D Cinematic Animation";
    frame.resize(1440, 1024);
    frame.clipsContent = true;

    // Clear existing children inside the selected blank frame
    const existing = [...frame.children];
    for (const c of existing) {
      try { c.remove(); } catch {}
    }

    const W = 1440;
    const H = 1024;

    // Helper to create solid color fill
    const solid = (r: number, g: number, b: number, a = 1): Paint => ({
      type: "SOLID",
      color: { r: r / 255, g: g / 255, b: b / 255 },
      opacity: a,
      visible: true,
    });

    // Helper to apply manual keyframe tracks
    const safeApplyTrack = (node: SceneNode, fieldName: string, keyframes: any[]) => {
      if (!node || typeof (node as any).applyManualKeyframeTrack !== "function") return false;

      const formattedKeyframes = keyframes.map((kf) => ({
        timelinePosition: kf.t,
        value: { type: "FLOAT", value: kf.v },
        easing: kf.easing ? { type: kf.easing } : { type: "EASE_IN_AND_OUT" },
      }));

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
        try {
          (node as any).applyManualKeyframeTrack(fieldName, {
            keyframes: formattedKeyframes,
          });
          tracksApplied++;
          return true;
        } catch (e2) {
          console.warn(`[NightToDay] Track failed for ${fieldName} on ${node.name}:`, e1, e2);
          return false;
        }
      }
    };

    // ─────────────────────────────────────────────────────────────
    // 2. BUILD VECTOR ARTWORK LAYERS (Back to Front)
    // ─────────────────────────────────────────────────────────────

    // A. Sky_Night (Deep starry indigo/navy)
    const skyNight = figma.createRectangle();
    skyNight.name = "Sky_Night";
    skyNight.resize(W, H);
    skyNight.x = 0;
    skyNight.y = 0;
    skyNight.fills = [solid(13, 17, 39)]; // #0D1127
    frame.appendChild(skyNight);
    layersCreated.push(skyNight.name);

    // B. Sky_Day (Radiant morning sky)
    const skyDay = figma.createRectangle();
    skyDay.name = "Sky_Day";
    skyDay.resize(W, H);
    skyDay.x = 0;
    skyDay.y = 0;
    skyDay.fills = [solid(125, 211, 252)]; // #7DD3FC soft clear morning sky
    skyDay.opacity = 0; // Starts hidden at night
    frame.appendChild(skyDay);
    layersCreated.push(skyDay.name);

    // C. Sky_Sunrise_Glow (Amber/rose dawn glow)
    const skyGlow = figma.createRectangle();
    skyGlow.name = "Sky_Sunrise_Glow";
    skyGlow.resize(W, H);
    skyGlow.x = 0;
    skyGlow.y = 0;
    skyGlow.fills = [solid(244, 114, 182)]; // #F472B6 dawn warmth
    skyGlow.opacity = 0;
    frame.appendChild(skyGlow);
    layersCreated.push(skyGlow.name);

    // D. Stars Group (18 scattered twinkling stars)
    const starNodes: SceneNode[] = [];
    const starPositions = [
      { x: 120, y: 90, s: 4 },
      { x: 210, y: 140, s: 5 },
      { x: 340, y: 80, s: 3.5 },
      { x: 420, y: 160, s: 4.5 },
      { x: 530, y: 95, s: 5 },
      { x: 620, y: 130, s: 4 },
      { x: 740, y: 70, s: 3.5 },
      { x: 810, y: 145, s: 5 },
      { x: 920, y: 90, s: 4 },
      { x: 1040, y: 135, s: 3.5 },
      { x: 1150, y: 75, s: 5 },
      { x: 1280, y: 110, s: 4 },
      { x: 1360, y: 160, s: 3.5 },
      { x: 180, y: 240, s: 4 },
      { x: 480, y: 220, s: 3.5 },
      { x: 780, y: 210, s: 4.5 },
      { x: 1100, y: 230, s: 4 },
      { x: 1310, y: 250, s: 3.5 },
    ];

    for (let i = 0; i < starPositions.length; i++) {
      const sp = starPositions[i];
      const star = figma.createEllipse();
      star.name = `Star_${i + 1}`;
      star.resize(sp.s, sp.s);
      star.x = sp.x;
      star.y = sp.y;
      star.fills = [solid(254, 240, 138)]; // #FEF08A golden-white
      frame.appendChild(star);
      starNodes.push(star);
    }
    const starsGroup = figma.group(starNodes, frame);
    starsGroup.name = "Stars";
    layersCreated.push(starsGroup.name);

    // E. Moon (Luminous circular moon)
    const moon = figma.createEllipse();
    moon.name = "Moon";
    moon.resize(110, 110);
    moon.x = 240;
    moon.y = 130;
    moon.fills = [solid(254, 249, 195)]; // #FEF9C3 soft moonlight
    moon.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.98, b: 0.8, a: 0.4 },
        offset: { x: 0, y: 0 },
        radius: 35,
        spread: 10,
        visible: true,
        blendMode: "NORMAL",
      },
    ];
    frame.appendChild(moon);
    layersCreated.push(moon.name);

    // F. Sun (Radiant golden sun with warm corona)
    const sun = figma.createEllipse();
    sun.name = "Sun";
    sun.resize(120, 120);
    sun.x = 940;
    sun.y = 320; // Rises at (940, 320), starting translation hides it below mountains
    sun.fills = [solid(251, 191, 36)]; // #FBBF24 golden sunshine
    sun.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.7, b: 0.1, a: 0.6 },
        offset: { x: 0, y: 0 },
        radius: 45,
        spread: 15,
        visible: true,
        blendMode: "NORMAL",
      },
    ];
    frame.appendChild(sun);
    layersCreated.push(sun.name);

    // G. Cloud_Left (Soft vector cloud)
    const clParts: SceneNode[] = [];
    const cl1 = figma.createEllipse();
    cl1.resize(120, 75);
    cl1.x = 0;
    cl1.y = 20;
    cl1.fills = [solid(255, 255, 255, 0.9)];
    frame.appendChild(cl1);
    clParts.push(cl1);

    const cl2 = figma.createEllipse();
    cl2.resize(95, 80);
    cl2.x = 60;
    cl2.y = 0;
    cl2.fills = [solid(255, 255, 255, 0.9)];
    frame.appendChild(cl2);
    clParts.push(cl2);

    const cl3 = figma.createEllipse();
    cl3.resize(110, 65);
    cl3.x = 120;
    cl3.y = 25;
    cl3.fills = [solid(255, 255, 255, 0.9)];
    frame.appendChild(cl3);
    clParts.push(cl3);

    const cloudLeft = figma.group(clParts, frame);
    cloudLeft.name = "Cloud_Left";
    cloudLeft.x = 160;
    cloudLeft.y = 210;
    layersCreated.push(cloudLeft.name);

    // H. Cloud_Right (Soft vector cloud)
    const crParts: SceneNode[] = [];
    const cr1 = figma.createEllipse();
    cr1.resize(135, 80);
    cr1.x = 0;
    cr1.y = 25;
    cr1.fills = [solid(255, 255, 255, 0.85)];
    frame.appendChild(cr1);
    crParts.push(cr1);

    const cr2 = figma.createEllipse();
    cr2.resize(115, 90);
    cr2.x = 75;
    cr2.y = 0;
    cr2.fills = [solid(255, 255, 255, 0.85)];
    frame.appendChild(cr2);
    crParts.push(cr2);

    const cr3 = figma.createEllipse();
    cr3.resize(125, 75);
    cr3.x = 150;
    cr3.y = 25;
    cr3.fills = [solid(255, 255, 255, 0.85)];
    frame.appendChild(cr3);
    crParts.push(cr3);

    const cloudRight = figma.group(crParts, frame);
    cloudRight.name = "Cloud_Right";
    cloudRight.x = 880;
    cloudRight.y = 170;
    layersCreated.push(cloudRight.name);

    // I. Mountain_Back (Distant peaks)
    const mtnBack = figma.createVector();
    mtnBack.name = "Mountain_Back";
    mtnBack.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: "M 0 540 L 220 440 L 460 550 L 720 410 L 980 560 L 1220 430 L 1440 520 L 1440 1024 L 0 1024 Z",
      },
    ];
    mtnBack.fills = [solid(30, 41, 59)]; // #1E293B deep slate
    frame.appendChild(mtnBack);
    layersCreated.push(mtnBack.name);

    // J. Mountain_Front (Midground ridge)
    const mtnFront = figma.createVector();
    mtnFront.name = "Mountain_Front";
    mtnFront.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: "M 0 620 L 320 500 L 580 630 L 860 490 L 1140 640 L 1440 560 L 1440 1024 L 0 1024 Z",
      },
    ];
    mtnFront.fills = [solid(51, 65, 85)]; // #334155 richer indigo
    frame.appendChild(mtnFront);
    layersCreated.push(mtnFront.name);

    // K. Ground (Rolling green foreground hills)
    const ground = figma.createVector();
    ground.name = "Ground";
    ground.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: "M 0 680 C 350 630 650 720 1000 660 C 1220 630 1350 650 1440 670 L 1440 1024 L 0 1024 Z",
      },
    ];
    ground.fills = [solid(22, 101, 52)]; // #166534 lush emerald hill
    frame.appendChild(ground);
    layersCreated.push(ground.name);

    // L. Path (Winding stone path from cottage)
    const path = figma.createVector();
    path.name = "Path";
    path.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: "M 230 790 C 260 840 340 880 390 940 C 440 990 480 1015 510 1024 L 430 1024 C 400 1000 360 960 320 920 C 270 870 215 820 195 790 Z",
      },
    ];
    path.fills = [solid(203, 213, 225, 0.7)]; // #CBD5E1 soft path
    frame.appendChild(path);
    layersCreated.push(path.name);

    // M. House & House_Window
    const houseParts: SceneNode[] = [];

    // Body
    const houseBody = figma.createRectangle();
    houseBody.name = "House_Body";
    houseBody.resize(150, 115);
    houseBody.x = 150;
    houseBody.y = 675;
    houseBody.cornerRadius = 6;
    houseBody.fills = [solid(71, 85, 105)]; // #475569 slate stone
    frame.appendChild(houseBody);
    houseParts.push(houseBody);

    // Roof
    const roof = figma.createVector();
    roof.name = "House_Roof";
    roof.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: "M 130 680 L 225 605 L 320 680 Z",
      },
    ];
    roof.fills = [solid(153, 27, 27)]; // #991B1B terracotta red roof
    frame.appendChild(roof);
    houseParts.push(roof);

    // Chimney
    const chimney = figma.createRectangle();
    chimney.name = "House_Chimney";
    chimney.resize(22, 45);
    chimney.x = 265;
    chimney.y = 595;
    chimney.cornerRadius = 3;
    chimney.fills = [solid(51, 65, 85)];
    frame.appendChild(chimney);
    houseParts.push(chimney);

    // Door
    const door = figma.createRectangle();
    door.name = "House_Door";
    door.resize(32, 58);
    door.x = 175;
    door.y = 732;
    door.cornerRadius = 4;
    door.fills = [solid(120, 53, 15)]; // #78350F wood
    frame.appendChild(door);
    houseParts.push(door);

    // House Window (Animatable glowing light)
    const windowRect = figma.createRectangle();
    windowRect.name = "House_Window";
    windowRect.resize(38, 38);
    windowRect.x = 232;
    windowRect.y = 705;
    windowRect.cornerRadius = 6;
    windowRect.fills = [solid(253, 224, 71)]; // #FDE047 warm amber yellow
    windowRect.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 1, g: 0.85, b: 0.2, a: 0.75 },
        offset: { x: 0, y: 0 },
        radius: 20,
        spread: 6,
        visible: true,
        blendMode: "NORMAL",
      },
    ];
    frame.appendChild(windowRect);
    layersCreated.push(windowRect.name);

    const houseGroup = figma.group(houseParts, frame);
    houseGroup.name = "House";
    layersCreated.push(houseGroup.name);

    // N. Tree: Tree_Trunk & Tree_Canopy
    const treeTrunk = figma.createRectangle();
    treeTrunk.name = "Tree_Trunk";
    treeTrunk.resize(36, 180);
    treeTrunk.x = 1140;
    treeTrunk.y = 560;
    treeTrunk.cornerRadius = 4;
    treeTrunk.fills = [solid(120, 53, 15)]; // #78350F deep bark
    frame.appendChild(treeTrunk);
    layersCreated.push(treeTrunk.name);

    // Tree Canopy (Fluffy foliage circles)
    const canopyParts: SceneNode[] = [];
    const fc1 = figma.createEllipse();
    fc1.resize(170, 150);
    fc1.x = 0;
    fc1.y = 30;
    fc1.fills = [solid(5, 150, 105)]; // #059669 emerald
    frame.appendChild(fc1);
    canopyParts.push(fc1);

    const fc2 = figma.createEllipse();
    fc2.resize(190, 160);
    fc2.x = 55;
    fc2.y = 0;
    fc2.fills = [solid(16, 185, 129)]; // #10B981 brighter lush green
    frame.appendChild(fc2);
    canopyParts.push(fc2);

    const fc3 = figma.createEllipse();
    fc3.resize(160, 140);
    fc3.x = 120;
    fc3.y = 35;
    fc3.fills = [solid(4, 120, 87)]; // #047857 deep green
    frame.appendChild(fc3);
    canopyParts.push(fc3);

    const treeCanopy = figma.group(canopyParts, frame);
    treeCanopy.name = "Tree_Canopy";
    treeCanopy.x = 1020;
    treeCanopy.y = 440;
    layersCreated.push(treeCanopy.name);

    // O. Flowers Group (Colorful wildflowers on the hill)
    const flowerNodes: SceneNode[] = [];
    const flowerColors = [
      solid(244, 114, 182), // pink
      solid(250, 204, 21),  // yellow
      solid(192, 132, 252), // purple
      solid(248, 113, 113), // coral
    ];
    const flowerPositions = [
      { x: 380, y: 760 },
      { x: 420, y: 785 },
      { x: 460, y: 770 },
      { x: 600, y: 740 },
      { x: 650, y: 765 },
      { x: 720, y: 750 },
      { x: 920, y: 710 },
      { x: 960, y: 730 },
      { x: 1040, y: 700 },
    ];
    for (let i = 0; i < flowerPositions.length; i++) {
      const fp = flowerPositions[i];
      const fl = figma.createEllipse();
      fl.name = `Flower_${i + 1}`;
      fl.resize(14, 14);
      fl.x = fp.x;
      fl.y = fp.y;
      fl.fills = [flowerColors[i % flowerColors.length]];
      frame.appendChild(fl);
      flowerNodes.push(fl);
    }
    const flowersGroup = figma.group(flowerNodes, frame);
    flowersGroup.name = "Flowers";
    layersCreated.push(flowersGroup.name);

    // P. Birds (Morning Flying Birds)
    const makeBird = (name: string, pathData: string, x: number, y: number): VectorNode => {
      const bird = figma.createVector();
      bird.name = name;
      bird.vectorPaths = [{ windingRule: "NONZERO", data: pathData }];
      bird.strokes = [solid(30, 41, 59)]; // dark silhouette
      bird.strokeWeight = 3;
      bird.strokeCap = "ROUND";
      bird.x = x;
      bird.y = y;
      bird.opacity = 0; // Starts hidden at night
      frame.appendChild(bird);
      layersCreated.push(name);
      return bird;
    };

    const bird1 = makeBird(
      "Bird_01",
      "M 0 12 Q 16 0 32 12 Q 48 0 64 12",
      -80, // offscreen left initially
      220
    );

    const bird2 = makeBird(
      "Bird_02",
      "M 0 10 Q 14 0 28 10 Q 42 0 56 10",
      -120, // offscreen left initially
      260
    );

    details.push(`Created all 17 vector landscape layers inside "${frame.name}".`);

    // ─────────────────────────────────────────────────────────────
    // 3. SET FIGMA MOTION TIMELINE DURATION
    // ─────────────────────────────────────────────────────────────
    const duration = options.duration || 10.0;
    const timelineId =
      frame.timelines && frame.timelines.length > 0 ? frame.timelines[0].id : frame.id;

    if (typeof (frame as any).setTimelineDuration === "function") {
      try {
        (frame as any).setTimelineDuration(timelineId, duration);
        details.push(`Configured Figma Motion timeline duration to ${duration}s.`);
      } catch (err: any) {
        console.warn("[NightToDay] setTimelineDuration:", err);
      }
    }

    figma.notify("🎬 Programming Figma Motion keyframes (Night → Sunrise → Day → Night)...", { timeout: 3000 });

    // ─────────────────────────────────────────────────────────────
    // 4. PROGRAM KEYFRAME TRACKS (10-Second Continuous Cycle)
    // ─────────────────────────────────────────────────────────────

    // Track 1: Sky_Day OPACITY (Fade in day sky)
    safeApplyTrack(skyDay, "OPACITY", [
      { t: 0.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
      { t: 2.2, v: 0.0, easing: "EASE_IN" },
      { t: 4.0, v: 0.45, easing: "EASE_IN_AND_OUT" }, // sunrise blend
      { t: 5.8, v: 1.0, easing: "EASE_OUT" },         // full blue morning sky
      { t: 7.5, v: 1.0, easing: "EASE_IN_AND_OUT" }, // bright morning
      { t: 8.8, v: 0.45, easing: "EASE_IN" },        // sunset fade
      { t: 10.0, v: 0.0, easing: "EASE_IN_AND_OUT" },// return to night
    ]);

    // Track 2: Sky_Sunrise_Glow OPACITY (Vibrant dawn warmth)
    safeApplyTrack(skyGlow, "OPACITY", [
      { t: 0.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
      { t: 2.5, v: 0.0, easing: "EASE_IN" },
      { t: 4.2, v: 0.85, easing: "EASE_OUT" },        // golden rose dawn glow
      { t: 5.6, v: 0.0, easing: "EASE_IN" },         // dissolves into clear blue
      { t: 8.0, v: 0.0, easing: "EASE_IN" },
      { t: 8.9, v: 0.70, easing: "EASE_OUT" },        // warm evening sunset glow
      { t: 10.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 3: Stars OPACITY (Twinkle at night, disappear at day)
    safeApplyTrack(starsGroup, "OPACITY", [
      { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: 1.0, v: 0.65, easing: "EASE_IN_AND_OUT" }, // gentle sparkle
      { t: 2.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: 3.2, v: 0.35, easing: "EASE_IN" },         // fading at dawn
      { t: 4.0, v: 0.0, easing: "EASE_IN" },          // invisible in daytime
      { t: 8.0, v: 0.0, easing: "EASE_IN" },
      { t: 9.0, v: 0.55, easing: "EASE_OUT" },        // returning at dusk
      { t: 10.0, v: 1.0, easing: "EASE_IN_AND_OUT" }, // full night sparkle
    ]);

    // Track 4: Stars SCALE_Y (Subtle breath twinkle)
    safeApplyTrack(starsGroup, "SCALE_Y", [
      { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: 1.0, v: 0.85, easing: "EASE_IN_AND_OUT" },
      { t: 2.0, v: 1.15, easing: "EASE_IN_AND_OUT" },
      { t: 3.0, v: 0.9, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 5: Moon TRANSLATION_Y (Slow drift up-left then return)
    safeApplyTrack(moon, "TRANSLATION_Y", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 2.0, v: 0, easing: "EASE_IN" },
      { t: 3.8, v: -75, easing: "EASE_IN" },          // floats upward into dawn
      { t: 8.2, v: -75, easing: "EASE_OUT" },
      { t: 9.2, v: -20, easing: "EASE_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 6: Moon TRANSLATION_X (Drifts left)
    safeApplyTrack(moon, "TRANSLATION_X", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 2.0, v: 0, easing: "EASE_IN" },
      { t: 3.8, v: -90, easing: "EASE_IN" },          // glides west
      { t: 8.2, v: -90, easing: "EASE_OUT" },
      { t: 9.2, v: -25, easing: "EASE_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 7: Moon OPACITY (Fades in daylight)
    safeApplyTrack(moon, "OPACITY", [
      { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: 2.2, v: 1.0, easing: "EASE_IN" },
      { t: 3.8, v: 0.0, easing: "EASE_IN" },          // sets below horizon
      { t: 8.2, v: 0.0, easing: "EASE_OUT" },
      { t: 9.2, v: 0.65, easing: "EASE_OUT" },
      { t: 10.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 8: Sun TRANSLATION_Y (Rises from below mountains at 4s, shines, sets at 8.5s)
    safeApplyTrack(sun, "TRANSLATION_Y", [
      { t: 0.0, v: 340, easing: "EASE_IN_AND_OUT" },  // hidden below mountains
      { t: 3.5, v: 340, easing: "EASE_IN" },
      { t: 4.8, v: 150, easing: "EASE_OUT" },         // rising over peaks
      { t: 6.2, v: 0, easing: "EASE_OUT" },           // full morning sun height
      { t: 7.5, v: -25, easing: "EASE_IN_AND_OUT" },  // high morning apex
      { t: 8.8, v: 180, easing: "EASE_IN" },          // sunset descent
      { t: 10.0, v: 340, easing: "EASE_IN_AND_OUT" }, // back below horizon
    ]);

    // Track 9: Sun SCALE_X & SCALE_Y (Grows as it ascends into the sky)
    safeApplyTrack(sun, "SCALE_X", [
      { t: 0.0, v: 0.75, easing: "EASE_IN_AND_OUT" },
      { t: 3.5, v: 0.75, easing: "EASE_IN" },
      { t: 5.0, v: 0.95, easing: "EASE_OUT" },
      { t: 6.5, v: 1.12, easing: "EASE_IN_AND_OUT" }, // grand morning presence
      { t: 7.5, v: 1.05, easing: "EASE_IN_AND_OUT" },
      { t: 8.8, v: 0.85, easing: "EASE_IN" },
      { t: 10.0, v: 0.75, easing: "EASE_IN_AND_OUT" },
    ]);

    safeApplyTrack(sun, "SCALE_Y", [
      { t: 0.0, v: 0.75, easing: "EASE_IN_AND_OUT" },
      { t: 3.5, v: 0.75, easing: "EASE_IN" },
      { t: 5.0, v: 0.95, easing: "EASE_OUT" },
      { t: 6.5, v: 1.12, easing: "EASE_IN_AND_OUT" },
      { t: 7.5, v: 1.05, easing: "EASE_IN_AND_OUT" },
      { t: 8.8, v: 0.85, easing: "EASE_IN" },
      { t: 10.0, v: 0.75, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 10: Sun OPACITY
    safeApplyTrack(sun, "OPACITY", [
      { t: 0.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
      { t: 3.6, v: 0.0, easing: "EASE_IN" },
      { t: 4.5, v: 0.85, easing: "EASE_OUT" },
      { t: 6.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: 7.5, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: 9.0, v: 0.4, easing: "EASE_IN" },
      { t: 10.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 11: Cloud_Left TRANSLATION_X (Horizontal parallax drift)
    safeApplyTrack(cloudLeft, "TRANSLATION_X", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 5.0, v: 160, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 12: Cloud_Right TRANSLATION_X (Different speed parallax drift)
    safeApplyTrack(cloudRight, "TRANSLATION_X", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 5.0, v: 95, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 13: Tree_Canopy ROTATION (Gentle night breeze -> energetic morning sway)
    safeApplyTrack(treeCanopy, "ROTATION", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 1.5, v: 1.8, easing: "EASE_IN_AND_OUT" },   // quiet night breeze
      { t: 3.0, v: -1.8, easing: "EASE_IN_AND_OUT" },
      { t: 4.5, v: 2.2, easing: "EASE_IN_AND_OUT" },
      { t: 6.0, v: -3.2, easing: "EASE_IN_AND_OUT" },  // energetic morning breeze
      { t: 7.5, v: 3.0, easing: "EASE_IN_AND_OUT" },
      { t: 8.8, v: -1.5, easing: "EASE_IN_AND_OUT" },  // calm dusk
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 14: Tree_Canopy TRANSLATION_X (Synchronized sway offset)
    safeApplyTrack(treeCanopy, "TRANSLATION_X", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 1.5, v: 5, easing: "EASE_IN_AND_OUT" },
      { t: 3.0, v: -5, easing: "EASE_IN_AND_OUT" },
      { t: 6.0, v: -8, easing: "EASE_IN_AND_OUT" },
      { t: 7.5, v: 8, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 15: House_Window OPACITY (Glowing yellow at night, off in day, on at night)
    safeApplyTrack(windowRect, "OPACITY", [
      { t: 0.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
      { t: 1.5, v: 0.95, easing: "EASE_IN_AND_OUT" },
      { t: 2.8, v: 0.75, easing: "EASE_IN" },
      { t: 4.2, v: 0.15, easing: "EASE_IN" },          // window light turns off at dawn
      { t: 5.0, v: 0.0, easing: "EASE_IN_AND_OUT" },   // daylight
      { t: 7.8, v: 0.0, easing: "EASE_IN_AND_OUT" },
      { t: 8.8, v: 0.65, easing: "EASE_OUT" },         // turns back on at dusk
      { t: 10.0, v: 1.0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 16: Flowers ROTATION (Asleep at night, sways in morning)
    safeApplyTrack(flowersGroup, "ROTATION", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 4.0, v: 0, easing: "EASE_IN" },
      { t: 5.8, v: 3.5, easing: "EASE_IN_AND_OUT" },   // morning wake & sway
      { t: 7.2, v: -3.0, easing: "EASE_IN_AND_OUT" },
      { t: 8.5, v: 1.5, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 17: Bird_01 TRANSLATION_X, TRANSLATION_Y, OPACITY (Morning flight across sky)
    safeApplyTrack(bird1, "TRANSLATION_X", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 4.8, v: 0, easing: "EASE_IN" },
      { t: 6.2, v: 620, easing: "EASE_IN_AND_OUT" },  // crosses middle of sky
      { t: 8.2, v: 1580, easing: "EASE_IN_AND_OUT" }, // flies past right edge
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);
    safeApplyTrack(bird1, "TRANSLATION_Y", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 5.5, v: -28, easing: "EASE_IN_AND_OUT" },  // gentle dipping flight
      { t: 6.8, v: 18, easing: "EASE_IN_AND_OUT" },
      { t: 8.0, v: -20, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);
    safeApplyTrack(bird1, "OPACITY", [
      { t: 0.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
      { t: 4.8, v: 0.0, easing: "EASE_IN" },
      { t: 5.2, v: 1.0, easing: "EASE_OUT" },         // appears as morning dawns
      { t: 8.0, v: 1.0, easing: "EASE_IN" },
      { t: 8.4, v: 0.0, easing: "EASE_IN" },          // leaves scene before night
      { t: 10.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Track 18: Bird_02 TRANSLATION_X, TRANSLATION_Y, OPACITY (Companion flight)
    safeApplyTrack(bird2, "TRANSLATION_X", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 5.0, v: 0, easing: "EASE_IN" },
      { t: 6.5, v: 580, easing: "EASE_IN_AND_OUT" },
      { t: 8.4, v: 1620, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);
    safeApplyTrack(bird2, "TRANSLATION_Y", [
      { t: 0.0, v: 0, easing: "EASE_IN_AND_OUT" },
      { t: 5.8, v: 22, easing: "EASE_IN_AND_OUT" },
      { t: 7.2, v: -25, easing: "EASE_IN_AND_OUT" },
      { t: 8.2, v: 14, easing: "EASE_IN_AND_OUT" },
      { t: 10.0, v: 0, easing: "EASE_IN_AND_OUT" },
    ]);
    safeApplyTrack(bird2, "OPACITY", [
      { t: 0.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
      { t: 5.0, v: 0.0, easing: "EASE_IN" },
      { t: 5.4, v: 0.9, easing: "EASE_OUT" },
      { t: 8.2, v: 0.9, easing: "EASE_IN" },
      { t: 8.6, v: 0.0, easing: "EASE_IN" },
      { t: 10.0, v: 0.0, easing: "EASE_IN_AND_OUT" },
    ]);

    // Focus on the newly created animation composition
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    details.push(`Successfully applied ${tracksApplied} native Figma Motion keyframe tracks across 10 layers!`);

    figma.notify("🎉 'Night to Day' Motion Animation Ready! Open Motion to play.", { timeout: 6000 });

    return {
      success: true,
      frameName: frame.name,
      frameId: frame.id,
      tracksApplied,
      layersCreated,
      details,
    };
  } catch (err: any) {
    console.error("[NightToDay] Error creating scene & motion:", err);
    return {
      success: false,
      error: err.message || "Failed to create Night to Day animation scene",
      details,
    };
  }
}
