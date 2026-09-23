/**
 * DesignForge AI — Product Story Landing Page Generator
 * Creates an 8-chapter continuous interactive product landing page in Figma
 * where the selected product physically travels and transforms across viewport states
 * connected with Figma Smart Animate prototype transitions.
 */

interface GeneratorOptions {
  sourceNodeId?: string;
  startX?: number;
  startY?: number;
}

export async function generateProductStoryLanding(options: GeneratorOptions = {}): Promise<{
  success: boolean;
  framesCount: number;
  rootFrameId: string;
  error?: string;
}> {
  try {
    // 1. Locate source product node
    let sourceNode: SceneNode | null = null;
    if (options.sourceNodeId) {
      sourceNode = (await figma.getNodeByIdAsync(options.sourceNodeId)) as SceneNode;
    }
    if (!sourceNode && figma.currentPage.selection.length > 0) {
      sourceNode = figma.currentPage.selection[0];
    }
    if (!sourceNode) {
      // Find Tumbler or top image on canvas
      const allRects = figma.currentPage.findAll(n => n.name.toLowerCase().includes("tumbler") || n.name.toLowerCase().includes("chatgpt"));
      if (allRects.length > 0) sourceNode = allRects[0];
    }

    if (!sourceNode) {
      throw new Error("No product layer found. Please select the Tumbler image on the canvas first.");
    }

    // Extract image fill
    let imagePaint: ImagePaint | null = null;
    if ("fills" in sourceNode && Array.isArray((sourceNode as any).fills)) {
      const fills = (sourceNode as any).fills as Paint[];
      const imgFill = fills.find(f => f.type === "IMAGE") as ImagePaint | undefined;
      if (imgFill && imgFill.imageHash) {
        imagePaint = {
          type: "IMAGE",
          imageHash: imgFill.imageHash,
          scaleMode: "FIT",
        };
      }
    }

    if (!imagePaint) {
      throw new Error("Selected layer does not contain a valid image fill.");
    }

    figma.notify("🎨 Designing 8-Chapter Interactive Story Landing Page...", { timeout: 3500 });

    // 2. Preload required typography
    const loadedFonts = new Set<string>();
    async function getSafeFont(weight: "Regular" | "Medium" | "Bold" = "Regular"): Promise<FontName> {
      const candidates: FontName[] = [
        { family: "Inter", style: weight },
        { family: "Inter", style: weight === "Bold" ? "Bold" : "Regular" },
        { family: "Roboto", style: weight },
        { family: "Helvetica Neue", style: "Regular" },
      ];
      for (const fn of candidates) {
        const key = `${fn.family}:${fn.style}`;
        if (loadedFonts.has(key)) return fn;
        try {
          await figma.loadFontAsync(fn);
          loadedFonts.add(key);
          return fn;
        } catch {}
      }
      const fallback: FontName = { family: "Inter", style: "Regular" };
      await figma.loadFontAsync(fallback);
      return fallback;
    }

    await getSafeFont("Regular");
    await getSafeFont("Medium");
    await getSafeFont("Bold");

    // Palette tokens
    const cObsidianBg: RGB = { r: 11 / 255, g: 12 / 255, b: 14 / 255 };      // #0B0C0E
    const cObsidianSurface: RGB = { r: 18 / 255, g: 20 / 255, b: 24 / 255 }; // #121418
    const cObsidianBorder: RGB = { r: 35 / 255, g: 38 / 255, b: 46 / 255 };  // #23262E
    const cPureWhite: RGB = { r: 1, g: 1, b: 1 };                             // #FFFFFF
    const cWhiteMuted: RGB = { r: 160 / 255, g: 164 / 255, b: 173 / 255 };   // #A0A4AD

    const cOffWhiteBg: RGB = { r: 251 / 255, g: 249 / 255, b: 245 / 255 };   // #FBF9F5
    const cOffWhiteCard: RGB = { r: 1, g: 1, b: 1 };                         // #FFFFFF
    const cOffWhiteBorder: RGB = { r: 232 / 255, g: 228 / 255, b: 220 / 255 };// #E8E4DC
    const cDarkText: RGB = { r: 16 / 255, g: 17 / 255, b: 20 / 255 };        // #101114
    const cMutedSlate: RGB = { r: 105 / 255, g: 110 / 255, b: 120 / 255 };   // #696E78

    const cWarmBeigeBg: RGB = { r: 242 / 255, g: 238 / 255, b: 230 / 255 };  // #F2EEE6
    const cWarmBeigeCard: RGB = { r: 249 / 255, g: 247 / 255, b: 242 / 255 };// #F9F7F2
    const cWarmBeigeBorder: RGB = { r: 222 / 255, g: 216 / 255, b: 206 / 255 };// #DED8CE
    const cWarmDarkText: RGB = { r: 28 / 255, g: 26 / 255, b: 24 / 255 };    // #1C1A18
    const cWarmMutedText: RGB = { r: 120 / 255, g: 114 / 255, b: 104 / 255 };// #787268

    function solid(c: RGB, opacity = 1): Paint[] {
      return [{ type: "SOLID", color: c, opacity }];
    }

    const frameWidth = 1440;
    const frameHeight = 900;
    const startX = options.startX ?? (sourceNode.x + sourceNode.width + 120);
    const startY = options.startY ?? sourceNode.y;
    const spacingX = 1600;

    // Helper: Create Text
    async function makeText(
      parent: BaseNode & ChildrenMixin,
      content: string,
      x: number,
      y: number,
      opts: {
        size?: number;
        weight?: "Regular" | "Medium" | "Bold";
        color?: RGB;
        opacity?: number;
        width?: number;
        align?: "LEFT" | "CENTER" | "RIGHT";
        letterSpacing?: number;
        lineHeight?: number;
      } = {}
    ): Promise<TextNode> {
      const t = figma.createText();
      parent.appendChild(t);
      const font = await getSafeFont(opts.weight || "Regular");
      t.fontName = font;
      t.characters = content;
      t.fontSize = opts.size || 14;
      t.x = x;
      t.y = y;
      t.fills = solid(opts.color || cDarkText, opts.opacity ?? 1);
      if (opts.letterSpacing) t.letterSpacing = { value: opts.letterSpacing, unit: "PIXELS" };
      if (opts.lineHeight) t.lineHeight = { value: opts.lineHeight, unit: "PIXELS" };
      if (opts.align) t.textAlignHorizontal = opts.align;
      if (opts.width) {
        t.textAutoResize = "HEIGHT";
        t.resize(opts.width, t.height);
      }
      return t;
    }

    // Helper: Create Pill / Button
    async function makePill(
      parent: BaseNode & ChildrenMixin,
      label: string,
      x: number,
      y: number,
      opts: {
        bg?: RGB;
        border?: RGB;
        textColor?: RGB;
        height?: number;
        px?: number;
        weight?: "Regular" | "Medium" | "Bold";
        fontSize?: number;
      } = {}
    ): Promise<FrameNode> {
      const f = figma.createFrame();
      parent.appendChild(f);
      f.x = x;
      f.y = y;
      f.layoutMode = "HORIZONTAL";
      f.primaryAxisAlignItems = "CENTER";
      f.counterAxisAlignItems = "CENTER";
      f.primaryAxisSizingMode = "AUTO";
      f.counterAxisSizingMode = "FIXED";
      f.resize(100, opts.height || 40);
      f.cornerRadius = (opts.height || 40) / 2;
      f.paddingLeft = opts.px || 20;
      f.paddingRight = opts.px || 20;
      f.fills = opts.bg ? solid(opts.bg) : [];
      if (opts.border) {
        f.strokes = solid(opts.border);
        f.strokeWeight = 1;
      }
      const t = await makeText(f, label, 0, 0, {
        size: opts.fontSize || 12,
        weight: opts.weight || "Medium",
        color: opts.textColor || cDarkText,
        letterSpacing: 0.5,
      });
      return f;
    }

    // Helper: Shared Top Navigation
    async function makeHeader(
      frame: FrameNode,
      activeIdx: number,
      theme: "dark" | "light" | "beige"
    ): Promise<void> {
      const isDark = theme === "dark";
      const isBeige = theme === "beige";
      const textColor = isDark ? cPureWhite : (isBeige ? cWarmDarkText : cDarkText);
      const mutedColor = isDark ? cWhiteMuted : (isBeige ? cWarmMutedText : cMutedSlate);
      const borderColor = isDark ? cObsidianBorder : (isBeige ? cWarmBeigeBorder : cOffWhiteBorder);

      // Logo Left
      await makeText(frame, "PELICAN  //  STUDIO", 72, 38, {
        size: 13,
        weight: "Bold",
        color: textColor,
        letterSpacing: 1.5,
      });

      // Chapter tags in center
      const chapters = ["01 HERO", "02 FOCUS", "03 STORY", "04 MOTION", "05 PILLARS", "06 ESSENCE", "07 SHOWCASE", "08 INQUIRE"];
      const navContainer = figma.createFrame();
      frame.appendChild(navContainer);
      navContainer.name = "Top Nav Tabs";
      navContainer.x = 420;
      navContainer.y = 30;
      navContainer.layoutMode = "HORIZONTAL";
      navContainer.itemSpacing = 24;
      navContainer.fills = [];

      for (let i = 0; i < chapters.length; i++) {
        const isActive = i === activeIdx;
        const navItem = await makeText(navContainer, chapters[i], 0, 0, {
          size: 11,
          weight: isActive ? "Bold" : "Medium",
          color: isActive ? textColor : mutedColor,
          opacity: isActive ? 1 : 0.65,
          letterSpacing: 0.8,
        });
        navItem.name = `Nav Link ${i + 1}`;
      }

      // Order CTA Button Right
      const ctaBtn = await makePill(frame, "ORDER VESSEL — $48", 1210, 26, {
        bg: isDark ? cPureWhite : cDarkText,
        textColor: isDark ? cDarkText : cPureWhite,
        height: 38,
        px: 18,
        weight: "Bold",
        fontSize: 11,
      });
      ctaBtn.name = "Header CTA";

      // Hairline divider
      const line = figma.createRectangle();
      frame.appendChild(line);
      line.name = "Header Divider";
      line.x = 72;
      line.y = 76;
      line.resize(1296, 1);
      line.fills = solid(borderColor);
    }

    // Helper: Shared Bottom Interactive Bar
    async function makeBottomBar(
      frame: FrameNode,
      chapterIndex: number,
      nextChapterName: string,
      theme: "dark" | "light" | "beige"
    ): Promise<{ nextBtn: FrameNode }> {
      const isDark = theme === "dark";
      const isBeige = theme === "beige";
      const textColor = isDark ? cPureWhite : (isBeige ? cWarmDarkText : cDarkText);
      const mutedColor = isDark ? cWhiteMuted : (isBeige ? cWarmMutedText : cMutedSlate);
      const borderColor = isDark ? cObsidianBorder : (isBeige ? cWarmBeigeBorder : cOffWhiteBorder);

      // Hairline top of bottom bar
      const line = figma.createRectangle();
      frame.appendChild(line);
      line.x = 72;
      line.y = 824;
      line.resize(1296, 1);
      line.fills = solid(borderColor);

      // Left status hint
      await makeText(frame, "CLICK ANYWHERE OR PRESS NEXT TO TRAVEL THROUGH THE STORY", 72, 846, {
        size: 11,
        weight: "Medium",
        color: mutedColor,
        letterSpacing: 1,
      });

      // Center Chapter Indicator
      const indicator = await makePill(frame, `CHAPTER 0${chapterIndex + 1} OF 08`, 635, 836, {
        border: borderColor,
        textColor: textColor,
        height: 34,
        px: 16,
        fontSize: 10,
        weight: "Bold",
      });
      indicator.name = "Chapter Indicator";

      // Right: Next Chapter Button
      const nextBtn = await makePill(frame, `${nextChapterName}  →`, 1170, 834, {
        bg: isDark ? cPureWhite : cDarkText,
        textColor: isDark ? cDarkText : cPureWhite,
        height: 38,
        px: 22,
        weight: "Bold",
        fontSize: 11,
      });
      nextBtn.name = "Next Chapter CTA";

      return { nextBtn };
    }

    // Helper: Add Product Layer with identical name "Product Asset" for Smart Animate
    function placeProduct(
      parent: FrameNode,
      x: number,
      y: number,
      w: number,
      h: number,
      opacity = 1
    ): RectangleNode {
      const rect = figma.createRectangle();
      parent.appendChild(rect);
      rect.name = "Product Asset"; // CRITICAL FOR FIGMA SMART ANIMATE
      rect.resize(w, h);
      rect.x = x;
      rect.y = y;
      rect.fills = [imagePaint!];
      rect.opacity = opacity;
      return rect;
    }

    const createdFrames: FrameNode[] = [];
    const nextButtons: FrameNode[] = [];

    // =========================================================================
    // FRAME 1: 01 — Hero
    // =========================================================================
    const f1 = figma.createFrame();
    createdFrames.push(f1);
    f1.name = "01 — Hero";
    f1.resize(frameWidth, frameHeight);
    f1.x = startX;
    f1.y = startY;
    f1.fills = solid(cObsidianBg);
    f1.clipsContent = true;

    await makeHeader(f1, 0, "dark");

    // Decorative circle pedestal behind product
    const pedestal1 = figma.createEllipse();
    f1.appendChild(pedestal1);
    pedestal1.name = "Pedestal Aura";
    pedestal1.resize(520, 520);
    pedestal1.x = 810;
    pedestal1.y = 170;
    pedestal1.fills = solid(cObsidianSurface);
    pedestal1.strokes = solid(cObsidianBorder);
    pedestal1.strokeWeight = 1;

    // Place Product in Hero
    placeProduct(f1, 840, 140, 460, 590);

    // Left Hero Typography & Badges
    const badge1 = await makePill(f1, "ARCHITECTURAL EDITION // NO. 001", 72, 160, {
      border: cObsidianBorder,
      textColor: cWhiteMuted,
      height: 32,
      px: 14,
      fontSize: 10,
    });

    await makeText(f1, "THE DEFINITIVE\nVESSEL FOR DAILY\nENDURANCE.", 72, 220, {
      size: 58,
      weight: "Bold",
      color: cPureWhite,
      lineHeight: 64,
      letterSpacing: -1.2,
      width: 680,
    });

    await makeText(
      f1,
      "Engineered from pro-grade 18/8 cold-rolled steel and vacuum-sealed with zero tolerance. Designed to travel seamlessly with you through every terrain, meeting, and journey.",
      72,
      440,
      {
        size: 16,
        weight: "Regular",
        color: cWhiteMuted,
        lineHeight: 26,
        width: 520,
      }
    );

    // Hero Action Buttons
    const heroBtn1 = await makePill(f1, "DISCOVER THE VESSEL  →", 72, 530, {
      bg: cPureWhite,
      textColor: cDarkText,
      height: 48,
      px: 28,
      weight: "Bold",
      fontSize: 13,
    });

    const heroBtn2 = await makePill(f1, "SPEC SHEET [PDF]", 280, 530, {
      border: cObsidianBorder,
      textColor: cWhiteMuted,
      height: 48,
      px: 22,
      weight: "Medium",
      fontSize: 13,
    });

    // Metric Badges bottom left
    const statsContainer = figma.createFrame();
    f1.appendChild(statsContainer);
    statsContainer.x = 72;
    statsContainer.y = 660;
    statsContainer.layoutMode = "HORIZONTAL";
    statsContainer.itemSpacing = 48;
    statsContainer.fills = [];

    const stats1 = [
      { num: "36 HRS", label: "ICE COLD" },
      { num: "40 OZ", label: "CAPACITY" },
      { num: "18/8", label: "PRO-STEEL" },
      { num: "0.5 MM", label: "WALL SPEC" },
    ];
    for (const s of stats1) {
      const col = figma.createFrame();
      statsContainer.appendChild(col);
      col.layoutMode = "VERTICAL";
      col.itemSpacing = 4;
      col.fills = [];
      await makeText(col, s.num, 0, 0, { size: 18, weight: "Bold", color: cPureWhite, letterSpacing: -0.5 });
      await makeText(col, s.label, 0, 0, { size: 10, weight: "Medium", color: cWhiteMuted, letterSpacing: 0.8 });
    }

    const { nextBtn: n1 } = await makeBottomBar(f1, 0, "02 PRODUCT FOCUS", "dark");
    nextButtons.push(n1);

    // =========================================================================
    // FRAME 2: 02 — Product Focus
    // =========================================================================
    const f2 = figma.createFrame();
    createdFrames.push(f2);
    f2.name = "02 — Product Focus";
    f2.resize(frameWidth, frameHeight);
    f2.x = startX + spacingX;
    f2.y = startY;
    f2.fills = solid(cOffWhiteBg);
    f2.clipsContent = true;

    await makeHeader(f2, 1, "light");

    // Title Section at Top
    await makeText(f2, "ANATOMY OF PRECISION", 72, 110, {
      size: 11,
      weight: "Bold",
      color: cMutedSlate,
      letterSpacing: 1.5,
    });
    await makeText(f2, "EVERY COMPONENT HAS A PURPOSE.", 72, 130, {
      size: 34,
      weight: "Bold",
      color: cDarkText,
      letterSpacing: -0.8,
    });

    // Center Stage Product
    placeProduct(f2, 490, 140, 460, 590);

    // Architectural Callout Cards with Leader Lines
    async function makeCallout(
      parent: FrameNode,
      x: number,
      y: number,
      title: string,
      desc: string,
      lineStartX: number,
      lineStartY: number,
      lineEndX: number,
      lineEndY: number
    ) {
      const card = figma.createFrame();
      parent.appendChild(card);
      card.x = x;
      card.y = y;
      card.resize(260, 84);
      card.cornerRadius = 8;
      card.fills = solid(cOffWhiteCard);
      card.strokes = solid(cOffWhiteBorder);
      card.strokeWeight = 1;
      card.paddingLeft = 16;
      card.paddingRight = 16;
      card.paddingTop = 14;
      card.layoutMode = "VERTICAL";
      card.itemSpacing = 4;

      await makeText(card, title, 0, 0, { size: 11, weight: "Bold", color: cDarkText, letterSpacing: 0.8 });
      await makeText(card, desc, 0, 0, { size: 12, weight: "Regular", color: cMutedSlate, lineHeight: 18, width: 228 });

      // Hairline Leader Line
      const line = figma.createVector();
      parent.appendChild(line);
      line.name = `Leader Line - ${title}`;
      line.vectorPaths = [
        {
          windingRule: "NONE",
          data: `M ${lineStartX} ${lineStartY} L ${lineEndX} ${lineEndY}`,
        },
      ];
      line.strokes = solid(cMutedSlate, 0.45);
      line.strokeWeight = 1;
      line.strokeCap = "ROUND";

      // Small anchor dot
      const dot = figma.createEllipse();
      parent.appendChild(dot);
      dot.resize(6, 6);
      dot.x = lineEndX - 3;
      dot.y = lineEndY - 3;
      dot.fills = solid(cDarkText);
    }

    // Callout 1: Acrylic Lid & Straw (Top Left)
    await makeCallout(
      f2,
      120,
      190,
      "TRITAN™ CRYSTAL LID",
      "Shatterproof dual-flow slider with pro-grade ultra-clear straw.",
      380,
      230,
      590,
      210
    );

    // Callout 2: 18/8 Rim (Top Right)
    await makeCallout(
      f2,
      1040,
      220,
      "ELECTROPOLISHED RIM",
      "Cold-forged beveled stainless lip engineered for smooth tasting flow.",
      1040,
      260,
      890,
      250
    );

    // Callout 3: Ergonomic Handle (Middle Right)
    await makeCallout(
      f2,
      1040,
      400,
      "WELDED SOLID-CORE GRIP",
      "Counterbalanced mass distribution for zero wrist fatigue during carry.",
      1040,
      440,
      940,
      430
    );

    // Callout 4: Temp-Lock Vacuum Core (Middle Left)
    await makeCallout(
      f2,
      120,
      420,
      "TEMP-LOCK™ VACUUM",
      "Dual-wall copper lined insulation. 36H ice cold with zero condensation.",
      380,
      460,
      560,
      460
    );

    // Callout 5: 72mm Tapered Base (Bottom Left)
    await makeCallout(
      f2,
      140,
      630,
      "72MM TAPERED BASE",
      "Precision engineered base fits flush into 99% of automotive holders.",
      400,
      670,
      620,
      690
    );

    const { nextBtn: n2 } = await makeBottomBar(f2, 1, "03 FEATURE STORYTELLING", "light");
    nextButtons.push(n2);

    // =========================================================================
    // FRAME 3: 03 — Feature Storytelling
    // =========================================================================
    const f3 = figma.createFrame();
    createdFrames.push(f3);
    f3.name = "03 — Feature Storytelling";
    f3.resize(frameWidth, frameHeight);
    f3.x = startX + spacingX * 2;
    f3.y = startY;
    f3.fills = solid(cWarmBeigeBg);
    f3.clipsContent = true;

    await makeHeader(f3, 2, "beige");

    // Product shifted left
    placeProduct(f3, 140, 140, 440, 580);

    // Right Storytelling Narrative Stack
    await makeText(f3, "CHAPTER III // CHRONICLES OF CRAFT", 660, 110, {
      size: 11,
      weight: "Bold",
      color: cWarmMutedText,
      letterSpacing: 1.5,
    });

    await makeText(f3, "ENGINEERED FOR\nLIFELONG TRANSIT.", 660, 130, {
      size: 40,
      weight: "Bold",
      color: cWarmDarkText,
      lineHeight: 46,
      letterSpacing: -1,
    });

    // 3 Feature Cards
    const features3 = [
      {
        num: "01",
        title: "TRI-LAYER THERMAL SHIELD",
        desc: "A vacuum micro-gap between two 304 pro-grade stainless steel walls creates a complete thermal barrier. Outside remains dry to the touch even with boiling espresso or crushed ice.",
        spec: "36H ICE FROZEN  ·  ZERO SWEAT",
      },
      {
        num: "02",
        title: "LEAK-DEFYING HYDRAULICS",
        desc: "Food-grade silicone gasket with our proprietary magnetic slider valve. Engineered to survive 100,000 continuous slide cycles without fluid weeping or seal degradation.",
        spec: "100% BPA FREE  ·  SPLASH-PROOF",
      },
      {
        num: "03",
        title: "COUNTERBALANCED FULCRUM",
        desc: "By positioning the solid-weld grip handle high and tight against the primary cylinder, 40 ounces of water feels like 16 ounces in hand through superior biomechanical leverage.",
        spec: "ERGONOMIC PERFECTION  ·  NATURAL CARRY",
      },
    ];

    let cardY = 240;
    for (const f of features3) {
      const card = figma.createFrame();
      f3.appendChild(card);
      card.x = 660;
      card.y = cardY;
      card.resize(680, 155);
      card.cornerRadius = 10;
      card.fills = solid(cWarmBeigeCard);
      card.strokes = solid(cWarmBeigeBorder);
      card.strokeWeight = 1;
      card.paddingLeft = 24;
      card.paddingRight = 24;
      card.paddingTop = 18;
      card.layoutMode = "VERTICAL";
      card.itemSpacing = 6;

      const topRow = figma.createFrame();
      card.appendChild(topRow);
      topRow.layoutMode = "HORIZONTAL";
      topRow.primaryAxisAlignItems = "SPACE_BETWEEN";
      topRow.counterAxisAlignItems = "CENTER";
      topRow.fills = [];
      topRow.resize(632, 20);

      await makeText(topRow, `${f.num}  —  ${f.title}`, 0, 0, {
        size: 13,
        weight: "Bold",
        color: cWarmDarkText,
        letterSpacing: 0.8,
      });

      await makeText(topRow, f.spec, 0, 0, {
        size: 10,
        weight: "Bold",
        color: cWarmMutedText,
        letterSpacing: 0.5,
      });

      await makeText(card, f.desc, 0, 0, {
        size: 13,
        weight: "Regular",
        color: cWarmMutedText,
        lineHeight: 21,
        width: 632,
      });

      cardY += 175;
    }

    const { nextBtn: n3 } = await makeBottomBar(f3, 2, "04 PRODUCT IN MOTION", "beige");
    nextButtons.push(n3);

    // =========================================================================
    // FRAME 4: 04 — Product In Motion
    // =========================================================================
    const f4 = figma.createFrame();
    createdFrames.push(f4);
    f4.name = "04 — Product In Motion";
    f4.resize(frameWidth, frameHeight);
    f4.x = startX + spacingX * 3;
    f4.y = startY;
    f4.fills = solid(cObsidianBg);
    f4.clipsContent = true;

    await makeHeader(f4, 3, "dark");

    // Giant Ghost Typography
    await makeText(f4, "MOMENTUM", 72, 110, {
      size: 130,
      weight: "Bold",
      color: cPureWhite,
      opacity: 0.04,
      letterSpacing: -4,
    });

    // Architectural Wireframe Grid lines
    for (let i = 0; i < 4; i++) {
      const gLine = figma.createRectangle();
      f4.appendChild(gLine);
      gLine.x = 72 + i * 324;
      gLine.y = 80;
      gLine.resize(1, 744);
      gLine.fills = solid(cObsidianBorder, 0.4);
    }

    // Left Motion Copy & Metric Cards
    await makePill(f4, "DYNAMIC TEST REPORT // LAB CERTIFIED", 72, 170, {
      border: cObsidianBorder,
      textColor: cWhiteMuted,
      height: 32,
      px: 14,
      fontSize: 10,
    });

    await makeText(f4, "BUILT FOR THE CHASE.\nNEVER COMPROMISED.", 72, 230, {
      size: 52,
      weight: "Bold",
      color: cPureWhite,
      lineHeight: 58,
      letterSpacing: -1.2,
      width: 620,
    });

    await makeText(
      f4,
      "Whether locked into a downhill gravel bike cage, vibrating on a vehicle console across rocky switchbacks, or stationed at your studio workbench, the Pelican Tumbler stands unwavering.",
      72,
      380,
      {
        size: 16,
        weight: "Regular",
        color: cWhiteMuted,
        lineHeight: 26,
        width: 540,
      }
    );

    // Performance Metric Cards (4 tiles)
    const metrics4 = [
      { val: "36H", label: "Cold Preservation", sub: "Below 42°F at 72h" },
      { val: "100%", label: "BPA & Lead Free", sub: "Food grade inert" },
      { val: "5 FT", label: "Drop Rated", sub: "Concrete drop tested" },
      { val: "0.5mm", label: "Wall Tolerance", sub: "Aerospace precision" },
    ];

    const grid4 = figma.createFrame();
    f4.appendChild(grid4);
    grid4.x = 72;
    grid4.y = 510;
    grid4.layoutMode = "HORIZONTAL";
    grid4.itemSpacing = 20;
    grid4.fills = [];

    for (const m of metrics4) {
      const tile = figma.createFrame();
      grid4.appendChild(tile);
      tile.resize(130, 110);
      tile.cornerRadius = 8;
      tile.fills = solid(cObsidianSurface);
      tile.strokes = solid(cObsidianBorder);
      tile.strokeWeight = 1;
      tile.paddingLeft = 14;
      tile.paddingTop = 14;
      tile.layoutMode = "VERTICAL";
      tile.itemSpacing = 4;

      await makeText(tile, m.val, 0, 0, { size: 24, weight: "Bold", color: cPureWhite, letterSpacing: -0.5 });
      await makeText(tile, m.label, 0, 0, { size: 10, weight: "Bold", color: cWhiteMuted, letterSpacing: 0.5 });
      await makeText(tile, m.sub, 0, 0, { size: 9, weight: "Regular", color: cWhiteMuted, opacity: 0.7 });
    }

    // Dynamic diagonal stance product on right
    placeProduct(f4, 820, 150, 480, 600);

    const { nextBtn: n4 } = await makeBottomBar(f4, 3, "05 WHY IT MATTERS", "dark");
    nextButtons.push(n4);

    // =========================================================================
    // FRAME 5: 05 — Why It Matters
    // =========================================================================
    const f5 = figma.createFrame();
    createdFrames.push(f5);
    f5.name = "05 — Why It Matters";
    f5.resize(frameWidth, frameHeight);
    f5.x = startX + spacingX * 4;
    f5.y = startY;
    f5.fills = solid(cOffWhiteBg);
    f5.clipsContent = true;

    await makeHeader(f5, 4, "light");

    // Header at Top
    await makeText(f5, "FOUNDATIONAL DESIGN PRINCIPLES", 72, 110, {
      size: 11,
      weight: "Bold",
      color: cMutedSlate,
      letterSpacing: 1.5,
    });
    await makeText(f5, "THREE PILLARS OF UNCOMPROMISED VALUE.", 72, 130, {
      size: 34,
      weight: "Bold",
      color: cDarkText,
      letterSpacing: -0.8,
    });

    // 3 Large Architectural Pillars
    const pillars = [
      {
        num: "01",
        title: "DESIGNED WITH PURPOSE",
        desc: "No superfluous trims or trend-driven gimmicks. Every chamfer, radius, and thread was iterated through 48 physical prototypes to deliver pure tactile equilibrium.",
        spec: "100% RECYCLABLE STEEL",
      },
      {
        num: "02",
        title: "BUILT AROUND THE USER",
        desc: "An ergonomic silhouette sculpted to fit human hands naturally. The tapered base fits car cup holders effortlessly while holding an uncompromising 40 ounces.",
        spec: "UNIVERSAL CUPHOLDER SEAT",
      },
      {
        num: "03",
        title: "MADE TO PERFORM",
        desc: "Cold-rolled 18/8 stainless steel engineered to outlast a thousand disposable cups. An heirloom companion backed by Pelican's legendary lifetime integrity.",
        spec: "LIFETIME INTEGRITY PLEDGE",
      },
    ];

    for (let i = 0; i < 3; i++) {
      const p = pillars[i];
      const pCol = figma.createFrame();
      f5.appendChild(pCol);
      pCol.x = 72 + i * 440;
      pCol.y = 200;
      pCol.resize(400, 240);
      pCol.cornerRadius = 10;
      pCol.fills = solid(cOffWhiteCard);
      pCol.strokes = solid(cOffWhiteBorder);
      pCol.strokeWeight = 1;
      pCol.paddingLeft = 24;
      pCol.paddingRight = 24;
      pCol.paddingTop = 22;
      pCol.layoutMode = "VERTICAL";
      pCol.itemSpacing = 8;

      await makeText(pCol, p.num, 0, 0, { size: 36, weight: "Bold", color: cDarkText, letterSpacing: -1 });
      await makeText(pCol, p.title, 0, 0, { size: 14, weight: "Bold", color: cDarkText, letterSpacing: 0.8 });
      await makeText(pCol, p.desc, 0, 0, { size: 13, weight: "Regular", color: cMutedSlate, lineHeight: 21, width: 352 });
      await makeText(pCol, p.spec, 0, 0, { size: 10, weight: "Bold", color: cDarkText, letterSpacing: 1 });
    }

    // Product Positioned Lower Center grounding the pillars
    placeProduct(f5, 530, 430, 380, 480);

    const { nextBtn: n5 } = await makeBottomBar(f5, 4, "06 PRODUCT + STORY", "light");
    nextButtons.push(n5);

    // =========================================================================
    // FRAME 6: 06 — Product + Story
    // =========================================================================
    const f6 = figma.createFrame();
    createdFrames.push(f6);
    f6.name = "06 — Product + Story";
    f6.resize(frameWidth, frameHeight);
    f6.x = startX + spacingX * 5;
    f6.y = startY;
    f6.fills = solid(cWarmBeigeBg);
    f6.clipsContent = true;

    await makeHeader(f6, 5, "beige");

    // Magazine editorial split composition
    // Left Product Stance
    placeProduct(f6, 160, 130, 480, 610);

    // Right Editorial Column
    const editCol = figma.createFrame();
    f6.appendChild(editCol);
    editCol.x = 720;
    editCol.y = 120;
    editCol.resize(640, 680);
    editCol.fills = [];
    editCol.layoutMode = "VERTICAL";
    editCol.itemSpacing = 20;

    await makeText(editCol, "CHAPTER VI // THE ESSENCE OF FORM", 0, 0, {
      size: 11,
      weight: "Bold",
      color: cWarmMutedText,
      letterSpacing: 1.5,
    });

    await makeText(editCol, "THE VESSEL OF\nUNCOMPROMISED FORM.", 0, 0, {
      size: 46,
      weight: "Bold",
      color: cWarmDarkText,
      lineHeight: 52,
      letterSpacing: -1,
      width: 600,
    });

    // Pull quote block
    const quoteBox = figma.createFrame();
    editCol.appendChild(quoteBox);
    quoteBox.resize(600, 110);
    quoteBox.paddingLeft = 20;
    quoteBox.paddingTop = 10;
    quoteBox.fills = [];
    quoteBox.strokes = solid(cWarmDarkText);
    quoteBox.strokeWeight = 1;
    quoteBox.strokeAlign = "INSIDE";

    await makeText(
      quoteBox,
      "“A truly great object doesn't clamor for attention. It exists with quiet authority, becoming essential to how you move through each day.”",
      0,
      0,
      {
        size: 16,
        weight: "Medium",
        color: cWarmDarkText,
        lineHeight: 26,
        width: 560,
      }
    );

    await makeText(
      editCol,
      "In an era of planned obsolescence and thin disposable plastics, we built a standard of permanence. The Pelican Studio 40oz Tumbler represents hundreds of hours refining thermal vacuum seals, cold-forged stainless steel, and hand-welded balances.\n\nWhether in the backcountry under torrential skies or on an oak desk in central Manhattan, it belongs.",
      0,
      0,
      {
        size: 14,
        weight: "Regular",
        color: cWarmMutedText,
        lineHeight: 24,
        width: 580,
      }
    );

    // Studio signature row
    const signRow = figma.createFrame();
    editCol.appendChild(signRow);
    signRow.layoutMode = "HORIZONTAL";
    signRow.itemSpacing = 36;
    signRow.fills = [];

    await makeText(signRow, "PELICAN DESIGN LABS  ·  TORRANCE, CA", 0, 0, {
      size: 11,
      weight: "Bold",
      color: cWarmDarkText,
      letterSpacing: 1,
    });

    const { nextBtn: n6 } = await makeBottomBar(f6, 5, "07 FINAL PRODUCT MOMENT", "beige");
    nextButtons.push(n6);

    // =========================================================================
    // FRAME 7: 07 — Final Product Moment
    // =========================================================================
    const f7 = figma.createFrame();
    createdFrames.push(f7);
    f7.name = "07 — Final Product Moment";
    f7.resize(frameWidth, frameHeight);
    f7.x = startX + spacingX * 6;
    f7.y = startY;
    f7.fills = solid(cPureWhite);
    f7.clipsContent = true;

    await makeHeader(f7, 6, "light");

    // Center Monumental Title & Statement Above Product
    await makeText(f7, "THE ULTIMATE CARRIER", 72, 100, {
      size: 12,
      weight: "Bold",
      color: cMutedSlate,
      letterSpacing: 2,
      width: 1296,
      align: "CENTER",
    });

    await makeText(f7, "ONE VESSEL. FOREVER.", 72, 126, {
      size: 56,
      weight: "Bold",
      color: cDarkText,
      letterSpacing: -1.5,
      width: 1296,
      align: "CENTER",
    });

    // Grand Monumental Product Centerpiece (Scaled up!)
    placeProduct(f7, 460, 130, 520, 640);

    // Left & Right Supportive Editorial Specs
    const leftSpec = figma.createFrame();
    f7.appendChild(leftSpec);
    leftSpec.x = 90;
    leftSpec.y = 360;
    leftSpec.resize(320, 180);
    leftSpec.layoutMode = "VERTICAL";
    leftSpec.itemSpacing = 8;
    leftSpec.fills = [];

    await makeText(leftSpec, "SPECIFICATION MATRIX", 0, 0, { size: 10, weight: "Bold", color: cMutedSlate, letterSpacing: 1 });
    await makeText(leftSpec, "• 18/8 Pro Kitchen-Grade Steel\n• Double-Wall Vacuum Insulated\n• Spill-Resistant Tritan Slider\n• Heavy-Duty Powdercoat Finish\n• BPA, Lead & Phthalate Free", 0, 0, {
      size: 13,
      weight: "Medium",
      color: cDarkText,
      lineHeight: 24,
    });

    const rightSpec = figma.createFrame();
    f7.appendChild(rightSpec);
    rightSpec.x = 1030;
    rightSpec.y = 360;
    rightSpec.resize(320, 180);
    rightSpec.layoutMode = "VERTICAL";
    rightSpec.itemSpacing = 8;
    rightSpec.fills = [];

    await makeText(rightSpec, "SATISFACTION GUARANTEE", 0, 0, { size: 10, weight: "Bold", color: cMutedSlate, letterSpacing: 1 });
    await makeText(rightSpec, "• Lifetime Craftsmanship Warranty\n• 30-Day Risk-Free Field Test\n• Free Carbon-Neutral Shipping\n• Laser Customization Ready", 0, 0, {
      size: 13,
      weight: "Medium",
      color: cDarkText,
      lineHeight: 24,
    });

    // Big Center Call-to-Action
    const finalCta = await makePill(f7, "CLAIM YOUR TUMBLER — $48", 580, 760, {
      bg: cDarkText,
      textColor: cPureWhite,
      height: 50,
      px: 36,
      weight: "Bold",
      fontSize: 13,
    });
    finalCta.name = "Final Primary CTA";

    const { nextBtn: n7 } = await makeBottomBar(f7, 6, "08 CONCIERGE & CONTACT", "light");
    nextButtons.push(n7);

    // =========================================================================
    // FRAME 8: 08 — Contact & Concierge
    // =========================================================================
    const f8 = figma.createFrame();
    createdFrames.push(f8);
    f8.name = "08 — Contact & Concierge";
    f8.resize(frameWidth, frameHeight);
    f8.x = startX + spacingX * 7;
    f8.y = startY;
    f8.fills = solid(cObsidianBg);
    f8.clipsContent = true;

    await makeHeader(f8, 7, "dark");

    // Left: Contact & Inquiries Form
    const formBox = figma.createFrame();
    f8.appendChild(formBox);
    formBox.x = 72;
    formBox.y = 110;
    formBox.resize(600, 680);
    formBox.layoutMode = "VERTICAL";
    formBox.itemSpacing = 16;
    formBox.fills = [];

    await makeText(formBox, "CONCIERGE & CORPORATE EDITIONS", 0, 0, {
      size: 11,
      weight: "Bold",
      color: cWhiteMuted,
      letterSpacing: 1.5,
    });

    await makeText(formBox, "LET'S TALK.", 0, 0, {
      size: 52,
      weight: "Bold",
      color: cPureWhite,
      letterSpacing: -1.2,
    });

    await makeText(
      formBox,
      "Interested in custom studio branding, laser serialization, or bulk atelier editions for your team? Send our industrial designers a note.",
      0,
      0,
      {
        size: 14,
        weight: "Regular",
        color: cWhiteMuted,
        lineHeight: 22,
        width: 560,
      }
    );

    // Helper: Form Input Field
    async function makeField(parent: FrameNode, label: string, placeholder: string, height = 48) {
      const field = figma.createFrame();
      parent.appendChild(field);
      field.resize(560, height);
      field.cornerRadius = 6;
      field.fills = solid(cObsidianSurface);
      field.strokes = solid(cObsidianBorder);
      field.strokeWeight = 1;
      field.paddingLeft = 16;
      field.paddingRight = 16;
      field.layoutMode = "HORIZONTAL";
      field.counterAxisAlignItems = "CENTER";

      await makeText(field, placeholder, 0, 0, {
        size: 13,
        weight: "Regular",
        color: cWhiteMuted,
        opacity: 0.7,
      });
    }

    await makeField(formBox, "NAME", "Your full name");
    await makeField(formBox, "EMAIL", "Work or personal email address");
    await makeField(formBox, "MESSAGE", "Project scope, custom quantity, or inquiry...", 100);

    const submitBtn = await makePill(formBox, "SEND INQUIRY TO CONCIERGE  →", 0, 0, {
      bg: cPureWhite,
      textColor: cDarkText,
      height: 48,
      px: 32,
      weight: "Bold",
      fontSize: 13,
    });
    submitBtn.name = "Submit Button";

    // Right: Studio Location & Docked Product
    const infoBox = figma.createFrame();
    f8.appendChild(infoBox);
    infoBox.x = 740;
    infoBox.y = 110;
    infoBox.resize(628, 220);
    infoBox.cornerRadius = 10;
    infoBox.fills = solid(cObsidianSurface);
    infoBox.strokes = solid(cObsidianBorder);
    infoBox.strokeWeight = 1;
    infoBox.paddingLeft = 32;
    infoBox.paddingRight = 32;
    infoBox.paddingTop = 28;
    infoBox.layoutMode = "VERTICAL";
    infoBox.itemSpacing = 10;

    await makeText(infoBox, "PELICAN ATELIER // GLOBAL HEADQUARTERS", 0, 0, {
      size: 12,
      weight: "Bold",
      color: cPureWhite,
      letterSpacing: 1,
    });

    await makeText(
      infoBox,
      "23215 Early Avenue  ·  Torrance, CA 90505\nDirect Line: +1 (800) 473-5422\nConcierge: concierge@pelicanstudio.design",
      0,
      0,
      {
        size: 13,
        weight: "Regular",
        color: cWhiteMuted,
        lineHeight: 24,
      }
    );

    // Product Resting at Bottom-Right to complete journey
    placeProduct(f8, 860, 310, 390, 500);

    // Bottom Bar on Frame 8 with Replay Loop
    const { nextBtn: n8 } = await makeBottomBar(f8, 7, "↺ REPLAY JOURNEY FROM HERO", "dark");
    nextButtons.push(n8);

    // =========================================================================
    // 3. PROTOTYPE SMART ANIMATE INTERACTIONS
    // =========================================================================
    figma.notify("🔗 Wiring Smart Animate Prototype Reactions across all 8 chapters...", { timeout: 2500 });

    for (let i = 0; i < createdFrames.length; i++) {
      const cur = createdFrames[i];
      const next = createdFrames[(i + 1) % createdFrames.length];
      const prev = createdFrames[(i - 1 + createdFrames.length) % createdFrames.length];

      // Reaction: Smart Animate to next frame
      const smartAnimateReaction: any = {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: next.id,
            navigation: "NAVIGATE",
            transition: {
              type: "SMART_ANIMATE",
              duration: 0.8,
              easing: { type: "EASE_IN_AND_OUT" },
            },
          },
        ],
        action: {
          type: "NODE",
          destinationId: next.id,
          navigation: "NAVIGATE",
          transition: {
            type: "SMART_ANIMATE",
            duration: 0.8,
            easing: { type: "EASE_IN_AND_OUT" },
          },
        },
      };

      // Also drag to advance
      const dragReaction: any = {
        trigger: { type: "ON_DRAG" },
        actions: [
          {
            type: "NODE",
            destinationId: next.id,
            navigation: "NAVIGATE",
            transition: {
              type: "SMART_ANIMATE",
              duration: 0.8,
              easing: { type: "EASE_IN_AND_OUT" },
            },
          },
        ],
      };

      // Apply to frame root
      try {
        await (cur as any).setReactionsAsync([smartAnimateReaction, dragReaction]);
      } catch {
        try {
          await (cur as any).setReactionsAsync([smartAnimateReaction]);
        } catch (e) {
          console.warn(`Could not set frame reaction on ${cur.name}:`, e);
        }
      }

      // Wire Next Button specifically
      if (nextButtons[i]) {
        try {
          await (nextButtons[i] as any).setReactionsAsync([smartAnimateReaction]);
        } catch {}
      }

      // Wire Top Nav links on each frame
      const navTabs = cur.findChild(c => c.name === "Top Nav Tabs") as FrameNode | null;
      if (navTabs && "children" in navTabs) {
        for (let t = 0; t < navTabs.children.length; t++) {
          const tabNode = navTabs.children[t];
          const destFrame = createdFrames[t];
          if (tabNode && destFrame && t !== i) {
            const tabReaction: any = {
              trigger: { type: "ON_CLICK" },
              actions: [
                {
                  type: "NODE",
                  destinationId: destFrame.id,
                  navigation: "NAVIGATE",
                  transition: {
                    type: "SMART_ANIMATE",
                    duration: 0.75,
                    easing: { type: "EASE_IN_AND_OUT" },
                  },
                },
              ],
            };
            try {
              await (tabNode as any).setReactionsAsync([tabReaction]);
            } catch {}
          }
        }
      }
    }

    // Set first frame as prototype starting point and zoom into it
    figma.currentPage.selection = [f1];
    figma.viewport.scrollAndZoomIntoView([f1]);

    figma.notify("✨ 8-Chapter Interactive Product Landing Page Generated Successfully!", { timeout: 4500 });

    return {
      success: true,
      framesCount: createdFrames.length,
      rootFrameId: f1.id,
    };
  } catch (err: any) {
    console.error("[generateProductStoryLanding] Error:", err);
    figma.notify(`❌ Failed: ${err.message}`, { error: true, timeout: 5000 });
    return {
      success: false,
      framesCount: 0,
      rootFrameId: "",
      error: err.message || "Unknown error occurred",
    };
  }
}
