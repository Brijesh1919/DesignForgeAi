import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function buildTactile3DStudio() {
  // 1. Load Fonts
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  // 2. Locate Target Frame 89
  const targetFrame = await figma.getNodeByIdAsync('1082:2255');
  if (!targetFrame) return { error: 'Target frame 1082:2255 not found' };

  // Rename and style Frame 89
  targetFrame.name = '✨ 3D Mouse Hover Tilt & Parallax Cards (1440x1024)';
  targetFrame.resize(1440, 1024);
  targetFrame.fills = [{ type: 'SOLID', color: { r: 0.031, g: 0.043, b: 0.071 } }]; // #080B12 deep space obsidian
  targetFrame.clipsContent = true;

  // Clear existing children in Frame 89
  while (targetFrame.children.length > 0) {
    targetFrame.children[0].remove();
  }

  // Remove old component sets container if it exists
  const oldCompContainer = figma.currentPage.findOne(n => n.name === '📦 3D Tilt Component Sets (Master Components)');
  if (oldCompContainer) oldCompContainer.remove();

  // --- Helper Functions ---
  function rgb(r, g, b) {
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  function solidFill(r, g, b, a = 1) {
    return [{ type: 'SOLID', color: rgb(r, g, b), opacity: a }];
  }

  function createText(text, size, weight, color, x, y, options = {}) {
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: weight };
    t.fontSize = size;
    t.characters = text;
    t.fills = [{ type: 'SOLID', color: color, opacity: options.opacity || 1 }];
    t.x = x;
    t.y = y;
    if (options.align) t.textAlignHorizontal = options.align;
    if (options.w) {
      t.textAutoResize = 'NONE';
      t.resize(options.w, options.h || size * 1.4);
    }
    if (options.lineHeight) {
      t.lineHeight = { value: options.lineHeight, unit: 'PIXELS' };
    }
    if (options.letterSpacing) {
      t.letterSpacing = { value: options.letterSpacing, unit: 'PIXELS' };
    }
    return t;
  }

  function createShadow(y, blur, opacity, colorRgb = { r: 0, g: 0, b: 0 }, spread = 0) {
    return {
      type: 'DROP_SHADOW',
      color: { r: colorRgb.r, g: colorRgb.g, b: colorRgb.b, a: opacity },
      offset: { x: 0, y: y },
      radius: blur,
      spread: spread,
      visible: true,
      blendMode: 'NORMAL'
    };
  }

  // --- Background Ambient Atmosphere in Target Frame ---
  const glow1 = figma.createEllipse();
  glow1.name = 'Ambient Glow Violet';
  glow1.resize(500, 500);
  glow1.x = 80;
  glow1.y = 80;
  glow1.fills = solidFill(99, 102, 241, 0.12);
  glow1.effects = [{ type: 'LAYER_BLUR', radius: 140, visible: true }];
  targetFrame.appendChild(glow1);

  const glow2 = figma.createEllipse();
  glow2.name = 'Ambient Glow Cyan';
  glow2.resize(550, 550);
  glow2.x = 820;
  glow2.y = 300;
  glow2.fills = solidFill(6, 182, 212, 0.10);
  glow2.effects = [{ type: 'LAYER_BLUR', radius: 160, visible: true }];
  targetFrame.appendChild(glow2);

  // --- Top Navigation Bar ---
  const navBar = figma.createFrame();
  navBar.name = 'Top Navigation Bar';
  navBar.resize(1320, 56);
  navBar.x = 60;
  navBar.y = 20;
  navBar.cornerRadius = 16;
  navBar.fills = solidFill(15, 23, 42, 0.65);
  navBar.strokes = solidFill(51, 65, 85, 0.6);
  navBar.strokeWeight = 1;
  navBar.effects = [
    { type: 'BACKGROUND_BLUR', radius: 20, visible: true },
    createShadow(4, 16, 0.25)
  ];

  // Brand Logo
  const logoBox = figma.createFrame();
  logoBox.name = 'Logo Box';
  logoBox.resize(32, 32);
  logoBox.x = 18;
  logoBox.y = 12;
  logoBox.cornerRadius = 8;
  logoBox.fills = [
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[1, 0, 0], [0, 1, 0]],
      gradientStops: [
        { position: 0, color: { r: 99/255, g: 102/255, b: 241/255, a: 1 } },
        { position: 1, color: { r: 6/255, g: 182/255, b: 212/255, a: 1 } }
      ]
    }
  ];
  const logoIcon = createText('⬡', 18, 'Bold', rgb(255, 255, 255), 7, 5);
  logoBox.appendChild(logoIcon);
  navBar.appendChild(logoBox);

  const brandTitle = createText('TILT.3D', 16, 'Bold', rgb(255, 255, 255), 58, 17, { letterSpacing: 0.5 });
  navBar.appendChild(brandTitle);

  const versionPill = figma.createFrame();
  versionPill.name = 'Version Pill';
  versionPill.resize(80, 22);
  versionPill.x = 145;
  versionPill.y = 17;
  versionPill.cornerRadius = 6;
  versionPill.fills = solidFill(6, 182, 212, 0.15);
  versionPill.strokes = solidFill(6, 182, 212, 0.3);
  versionPill.strokeWeight = 1;
  const versionText = createText('SPATIAL v2.4', 9, 'Bold', rgb(34, 211, 238), 7, 4, { letterSpacing: 0.5 });
  versionPill.appendChild(versionText);
  navBar.appendChild(versionPill);

  // Center Nav Links with clean separated spacing
  const navItems = [
    { label: 'Features', x: 330, active: false },
    { label: '3D Parallax Engine', x: 420, active: true },
    { label: 'Tilt Physics', x: 575, active: false },
    { label: 'Pricing Suite', x: 685, active: false },
    { label: 'Documentation', x: 795, active: false }
  ];
  navItems.forEach(item => {
    const lText = createText(
      item.label,
      13,
      item.active ? 'Semi Bold' : 'Medium',
      item.active ? rgb(255, 255, 255) : rgb(148, 163, 184),
      item.x,
      19
    );
    navBar.appendChild(lText);
  });

  // Right Status Pill & CTA Button
  const statusPill = figma.createFrame();
  statusPill.name = 'Status Indicator';
  statusPill.resize(165, 30);
  statusPill.x = 985;
  statusPill.y = 13;
  statusPill.cornerRadius = 20;
  statusPill.fills = solidFill(16, 185, 129, 0.12);
  statusPill.strokes = solidFill(16, 185, 129, 0.35);
  statusPill.strokeWeight = 1;

  const statusDot = figma.createEllipse();
  statusDot.name = 'Green Pulse';
  statusDot.resize(8, 8);
  statusDot.x = 12;
  statusDot.y = 11;
  statusDot.fills = solidFill(52, 211, 153, 1);
  statusDot.effects = [createShadow(0, 6, 0.9, rgb(52, 211, 153))];
  statusPill.appendChild(statusDot);

  const statusText = createText('3D Hover Active', 11, 'Semi Bold', rgb(52, 211, 153), 28, 7);
  statusPill.appendChild(statusText);
  navBar.appendChild(statusPill);

  const demoBtn = figma.createFrame();
  demoBtn.name = 'Demo CTA Button';
  demoBtn.resize(120, 32);
  demoBtn.x = 1175;
  demoBtn.y = 12;
  demoBtn.cornerRadius = 10;
  demoBtn.fills = [
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[1, 0, 0], [0, 1, 0]],
      gradientStops: [
        { position: 0, color: { r: 99/255, g: 102/255, b: 241/255, a: 1 } },
        { position: 1, color: { r: 129/255, g: 140/255, b: 248/255, a: 1 } }
      ]
    }
  ];
  const demoBtnText = createText('Launch App', 12, 'Semi Bold', rgb(255, 255, 255), 25, 8);
  demoBtn.appendChild(demoBtnText);
  navBar.appendChild(demoBtn);

  targetFrame.appendChild(navBar);

  // --- Hero Section ---
  const heroEyebrow = figma.createFrame();
  heroEyebrow.name = 'Hero Eyebrow Tag';
  heroEyebrow.resize(380, 26);
  heroEyebrow.x = (1440 - 380) / 2;
  heroEyebrow.y = 92;
  heroEyebrow.cornerRadius = 13;
  heroEyebrow.fills = solidFill(15, 23, 42, 0.8);
  heroEyebrow.strokes = [
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[1, 0, 0], [0, 1, 0]],
      gradientStops: [
        { position: 0, color: { r: 99/255, g: 102/255, b: 241/255, a: 0.8 } },
        { position: 1, color: { r: 6/255, g: 182/255, b: 212/255, a: 0.8 } }
      ]
    }
  ];
  heroEyebrow.strokeWeight = 1;
  const eyebrowText = createText('⚡ TACTILE 3D SURFACE & PARALLAX HOVER ENGINE', 10, 'Bold', rgb(199, 210, 254), 16, 6, { letterSpacing: 0.8 });
  heroEyebrow.appendChild(eyebrowText);
  targetFrame.appendChild(heroEyebrow);

  const heroHeadline = createText(
    'Tactile 3D Mouse Tilt & Multi-Layer Parallax Cards',
    30,
    'Bold',
    rgb(255, 255, 255),
    60,
    128,
    { align: 'CENTER', w: 1320, letterSpacing: -0.5 }
  );
  targetFrame.appendChild(heroHeadline);

  const heroSubtext = createText(
    'Hover your cursor over any card below in Prototype Mode (Shift + Space). Each surface physically tilts 5°–8° toward the cursor with dynamic specular sheen sweep, elevated 3D depth shadows, and multi-plane Z-axis parallax separation.',
    14,
    'Regular',
    rgb(148, 163, 184),
    270,
    172,
    { align: 'CENTER', w: 900, lineHeight: 22 }
  );
  targetFrame.appendChild(heroSubtext);

  // --- Section 1 Header ---
  const sec1Label = createText('INTERACTIVE 3D FEATURE CARDS', 11, 'Bold', rgb(129, 140, 248), 60, 232, { letterSpacing: 1 });
  const sec1Sub = createText('Physical angular tilt vectors with independent holographic layer parallax', 12, 'Regular', rgb(100, 116, 139), 290, 232);
  targetFrame.appendChild(sec1Label);
  targetFrame.appendChild(sec1Sub);

  // --- Section 2 Header ---
  const sec2Label = createText('INTERACTIVE 3D PRICING PLANS', 11, 'Bold', rgb(167, 139, 250), 60, 584, { letterSpacing: 1 });
  const sec2Sub = createText('Tactile physical feedback on hover with glowing aura and elevated CTA buttons', 12, 'Regular', rgb(100, 116, 139), 280, 584);
  targetFrame.appendChild(sec2Label);
  targetFrame.appendChild(sec2Sub);

  // --- Bottom Hint Bar ---
  const bottomHint = createText(
    '💡 PROTOTYPE TIP: Select this frame and press Shift + Space to run the interactive presentation with live 3D hover tilt physics.',
    12,
    'Medium',
    rgb(148, 163, 184),
    60,
    992,
    { align: 'CENTER', w: 1320 }
  );
  targetFrame.appendChild(bottomHint);

  // =========================================================================
  // --- BUILD 6 INTERACTIVE 3D TILT COMPONENT SETS ---
  // Container placed neatly below Frame 89 at y: 1420
  // =========================================================================

  const compSetsContainer = figma.createFrame();
  compSetsContainer.name = '📦 3D Tilt Component Sets (Master Components)';
  compSetsContainer.resize(1440, 1500);
  compSetsContainer.x = 2068;
  compSetsContainer.y = 1420;
  compSetsContainer.fills = solidFill(10, 15, 26, 0.98);
  compSetsContainer.cornerRadius = 24;
  compSetsContainer.strokes = solidFill(30, 41, 59, 0.8);
  compSetsContainer.strokeWeight = 1;

  const compHeader = createText('Interactive 3D Mouse Hover Tilt Component Sets Library', 20, 'Bold', rgb(255, 255, 255), 40, 24);
  const compSubHeader = createText('Each component set contains State=Default (resting) and State=Hover (tilted 3D with parallax & specular sheen). Wired with WHILE_HOVERING & SMART_ANIMATE.', 13, 'Regular', rgb(148, 163, 184), 40, 56);
  compSetsContainer.appendChild(compHeader);
  compSetsContainer.appendChild(compSubHeader);

  // Helper to construct a Feature Card Variant
  function buildFeatureCardVariant(state, config) {
    const isHover = state === 'Hover';
    const comp = figma.createComponent();
    comp.name = \`State=\${state}\`;
    comp.resize(420, 300);
    comp.clipsContent = false;
    comp.fills = [];

    // The Physical Card Body that Tilts
    const body = figma.createFrame();
    body.name = 'CardPhysicalBody';
    body.resize(400, 280);
    body.cornerRadius = 22;
    body.clipsContent = true;

    if (!isHover) {
      body.x = 10;
      body.y = 10;
      body.rotation = 0;
      body.fills = solidFill(config.bgDefault.r, config.bgDefault.g, config.bgDefault.b, 0.85);
      body.strokes = solidFill(51, 65, 85, 0.5);
      body.strokeWeight = 1;
      body.effects = [
        createShadow(8, 20, 0.35, { r: 0, g: 0, b: 0 }),
        { type: 'BACKGROUND_BLUR', radius: 16, visible: true }
      ];
    } else {
      // 3D TILT POSITION & ROTATION
      body.x = config.hoverX;
      body.y = config.hoverY;
      body.rotation = config.hoverRotation;
      body.fills = solidFill(config.bgHover.r, config.bgHover.g, config.bgHover.b, 0.95);
      body.strokes = [
        {
          type: 'GRADIENT_LINEAR',
          gradientTransform: [[1, 0, 0], [0, 1, 0]],
          gradientStops: [
            { position: 0, color: { r: config.accentRgb.r, g: config.accentRgb.g, b: config.accentRgb.b, a: 1 } },
            { position: 1, color: { r: config.secondaryRgb.r, g: config.secondaryRgb.g, b: config.secondaryRgb.b, a: 0.9 } }
          ]
        }
      ];
      body.strokeWeight = 1.5;
      body.effects = [
        createShadow(32, 54, 0.65, { r: 0, g: 0, b: 0 }),
        createShadow(10, 36, 0.45, config.accentRgb),
        { type: 'BACKGROUND_BLUR', radius: 24, visible: true }
      ];
    }

    // Ambient Glow Blob inside card
    const glow = figma.createEllipse();
    glow.name = 'Ambient Glow Blob';
    glow.resize(isHover ? 220 : 130, isHover ? 220 : 130);
    glow.x = isHover ? config.glowHoverX : config.glowDefX;
    glow.y = isHover ? config.glowHoverY : config.glowDefY;
    glow.fills = solidFill(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255, isHover ? 0.45 : 0.15);
    glow.effects = [{ type: 'LAYER_BLUR', radius: isHover ? 50 : 35, visible: true }];
    body.appendChild(glow);

    // Specular Glass Light Sheen (sweeps across on hover)
    const sheen = figma.createFrame();
    sheen.name = 'Specular Light Sheen';
    sheen.resize(320, 400);
    sheen.rotation = 35;
    sheen.x = isHover ? 50 : -220;
    sheen.y = isHover ? -140 : -320;
    sheen.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [[0, 1, 0], [-1, 0, 1]],
        gradientStops: [
          { position: 0, color: { r: 1, g: 1, b: 1, a: 0 } },
          { position: 0.5, color: { r: 1, g: 1, b: 1, a: isHover ? 0.18 : 0.02 } },
          { position: 1, color: { r: 1, g: 1, b: 1, a: 0 } }
        ]
      }
    ];
    body.appendChild(sheen);

    // Floating 3D Graphic (Isometric Construct) with Parallax Depth Offset
    const graphicGroup = figma.createFrame();
    graphicGroup.name = 'Floating 3D Hologram';
    graphicGroup.resize(56, 56);
    graphicGroup.cornerRadius = 14;
    graphicGroup.fills = solidFill(20, 27, 45, 0.9);
    graphicGroup.strokes = solidFill(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255, isHover ? 0.9 : 0.4);
    graphicGroup.strokeWeight = 1;

    // Parallax Shift
    if (!isHover) {
      graphicGroup.x = 24;
      graphicGroup.y = 24;
      graphicGroup.effects = [createShadow(4, 10, 0.35)];
    } else {
      graphicGroup.x = 24 + config.parallaxDx;
      graphicGroup.y = 24 + config.parallaxDy;
      graphicGroup.effects = [
        createShadow(16, 24, 0.65),
        createShadow(6, 16, 0.5, config.accentRgb)
      ];
    }

    const iconSymbol = createText(config.iconChar, 24, 'Bold', rgb(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255), 14, 12);
    graphicGroup.appendChild(iconSymbol);
    body.appendChild(graphicGroup);

    // Content Container (Text & Metadata)
    const content = figma.createFrame();
    content.name = 'Card Content';
    content.resize(352, 175);
    content.fills = [];

    // Subtle Parallax Shift for Content
    if (!isHover) {
      content.x = 24;
      content.y = 92;
    } else {
      content.x = 24 + Math.round(config.parallaxDx * 0.4);
      content.y = 92 + Math.round(config.parallaxDy * 0.4);
    }

    const tag = createText(config.tagText, 10, 'Bold', rgb(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255), 0, 0, { letterSpacing: 0.6 });
    content.appendChild(tag);

    const title = createText(config.titleText, 18, 'Bold', rgb(255, 255, 255), 0, 20);
    content.appendChild(title);

    const desc = createText(config.descText, 12, 'Regular', rgb(148, 163, 184), 0, 48, { w: 350, lineHeight: 18 });
    content.appendChild(desc);

    // Dynamic Physics Metric Pill
    const metricPill = figma.createFrame();
    metricPill.name = 'Metric Pill';
    metricPill.resize(352, 28);
    metricPill.x = 0;
    metricPill.y = 110;
    metricPill.cornerRadius = 8;
    metricPill.fills = solidFill(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255, isHover ? 0.18 : 0.08);
    metricPill.strokes = solidFill(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255, isHover ? 0.45 : 0.2);
    metricPill.strokeWeight = 1;

    const metricText = createText(config.metricText, 10, 'Semi Bold', rgb(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255), 10, 7);
    metricPill.appendChild(metricText);
    content.appendChild(metricPill);

    // Interactive CTA Link
    const ctaText = createText(
      isHover ? \`\${config.ctaLabel} ➔\` : \`\${config.ctaLabel} →\`,
      12,
      'Semi Bold',
      isHover ? rgb(255, 255, 255) : rgb(148, 163, 184),
      0,
      148
    );
    content.appendChild(ctaText);

    body.appendChild(content);
    comp.appendChild(body);
    return comp;
  }

  // Configurations for 3 Feature Cards
  const featConfigs = [
    {
      name: 'Feature Card 1 (Left Tilt -5.8°)',
      iconChar: '◈',
      tagText: '01 / TACTILE DEPTH',
      titleText: 'Spatial Depth Matrix',
      descText: 'Multi-layer depth decomposition creates genuine stereoscopic physical presence when hovered.',
      metricText: '⚡ Tilt Vector: -5.8° Rotational • Z-Offset: +24px',
      ctaLabel: 'Inspect Depth Geometry',
      bgDefault: { r: 12, g: 16, b: 29 },
      bgHover: { r: 18, g: 22, b: 42 },
      accentRgb: rgb(129, 140, 248),
      secondaryRgb: rgb(168, 85, 247),
      hoverX: 14,
      hoverY: 6,
      hoverRotation: -5.5,
      glowDefX: 20,
      glowDefY: 20,
      glowHoverX: 10,
      glowHoverY: -10,
      parallaxDx: 14,
      parallaxDy: -12
    },
    {
      name: 'Feature Card 2 (Forward Pitch Lift)',
      iconChar: '✧',
      tagText: '02 / SPECULAR SHEEN',
      titleText: 'Raytraced Glass Prism',
      descText: 'Dynamic Fresnel reflection highlights sweep across the glass surface matching virtual cursor angle.',
      metricText: '✨ Pitch: Forward Lift • Specular Gloss: 100% HDR',
      ctaLabel: 'View Light Physics',
      bgDefault: { r: 12, g: 19, b: 34 },
      bgHover: { r: 16, g: 26, b: 46 },
      accentRgb: rgb(34, 211, 238),
      secondaryRgb: rgb(56, 189, 248),
      hoverX: 6,
      hoverY: 2,
      hoverRotation: 0,
      glowDefX: 130,
      glowDefY: 20,
      glowHoverX: 110,
      glowHoverY: -20,
      parallaxDx: 12,
      parallaxDy: -14
    },
    {
      name: 'Feature Card 3 (Right Tilt +5.8°)',
      iconChar: '◎',
      tagText: '03 / HAPTIC PHYSICS',
      titleText: 'Kinetic Gyro Springs',
      descText: 'Physical spring damping curves simulate realistic mass, inertia, and tactile resistance upon hover.',
      metricText: '⚡ Tilt Vector: +5.8° Rotational • 0.04s Damping',
      ctaLabel: 'Test Kinetic Curves',
      bgDefault: { r: 11, g: 20, b: 22 },
      bgHover: { r: 15, g: 29, b: 31 },
      accentRgb: rgb(52, 211, 153),
      secondaryRgb: rgb(16, 185, 129),
      hoverX: 8,
      hoverY: 14,
      hoverRotation: 5.5,
      glowDefX: 220,
      glowDefY: 20,
      glowHoverX: 200,
      glowHoverY: -10,
      parallaxDx: -14,
      parallaxDy: -12
    }
  ];

  const featureComponentSets = [];
  for (let i = 0; i < featConfigs.length; i++) {
    const cfg = featConfigs[i];
    const defComp = buildFeatureCardVariant('Default', cfg);
    const hovComp = buildFeatureCardVariant('Hover', cfg);

    // Arrange variants cleanly side-by-side
    defComp.x = 20;
    defComp.y = 20;
    hovComp.x = 460;
    hovComp.y = 20;

    const compSet = figma.combineAsVariants([defComp, hovComp], compSetsContainer);
    compSet.name = cfg.name;
    compSet.x = 40;
    compSet.y = 100 + i * 360;

    // Set Prototype Reaction with setReactionsAsync
    await defComp.setReactionsAsync([
      {
        trigger: { type: 'ON_HOVER' },
        actions: [
          {
            type: 'NODE',
            destinationId: hovComp.id,
            navigation: 'CHANGE_TO',
            transition: {
              type: 'SMART_ANIMATE',
              duration: 0.35,
              easing: { type: 'EASE_OUT' }
            }
          }
        ]
      }
    ]);

    featureComponentSets.push(compSet);
  }

  // --- Helper to construct a Pricing Card Variant ---
  function buildPricingCardVariant(state, config) {
    const isHover = state === 'Hover';
    const comp = figma.createComponent();
    comp.name = \`State=\${state}\`;
    comp.resize(420, 340);
    comp.clipsContent = false;
    comp.fills = [];

    const body = figma.createFrame();
    body.name = 'PricingPhysicalBody';
    body.resize(400, 320);
    body.cornerRadius = 22;
    body.clipsContent = true;

    if (!isHover) {
      body.x = 10;
      body.y = 10;
      body.rotation = 0;
      body.fills = solidFill(config.bgDefault.r, config.bgDefault.g, config.bgDefault.b, 0.88);
      body.strokes = config.isPopular ? solidFill(168, 85, 247, 0.6) : solidFill(51, 65, 85, 0.5);
      body.strokeWeight = config.isPopular ? 1.5 : 1;
      body.effects = [
        createShadow(8, 20, 0.35, { r: 0, g: 0, b: 0 }),
        { type: 'BACKGROUND_BLUR', radius: 16, visible: true }
      ];
    } else {
      body.x = config.hoverX;
      body.y = config.hoverY;
      body.rotation = config.hoverRotation;
      body.fills = solidFill(config.bgHover.r, config.bgHover.g, config.bgHover.b, 0.96);
      body.strokes = [
        {
          type: 'GRADIENT_LINEAR',
          gradientTransform: [[1, 0, 0], [0, 1, 0]],
          gradientStops: [
            { position: 0, color: { r: config.accentRgb.r, g: config.accentRgb.g, b: config.accentRgb.b, a: 1 } },
            { position: 1, color: { r: config.secondaryRgb.r, g: config.secondaryRgb.g, b: config.secondaryRgb.b, a: 0.9 } }
          ]
        }
      ];
      body.strokeWeight = 1.5;
      body.effects = [
        createShadow(34, 56, 0.65, { r: 0, g: 0, b: 0 }),
        createShadow(12, 38, 0.5, config.accentRgb),
        { type: 'BACKGROUND_BLUR', radius: 24, visible: true }
      ];
    }

    // Glow Blob
    const glow = figma.createEllipse();
    glow.name = 'Pricing Glow';
    glow.resize(isHover ? 260 : 160, isHover ? 260 : 160);
    glow.x = isHover ? config.glowHoverX : config.glowDefX;
    glow.y = isHover ? config.glowHoverY : config.glowDefY;
    glow.fills = solidFill(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255, isHover ? 0.45 : 0.12);
    glow.effects = [{ type: 'LAYER_BLUR', radius: isHover ? 55 : 40, visible: true }];
    body.appendChild(glow);

    // Specular Light Sweep
    const sheen = figma.createFrame();
    sheen.name = 'Specular Light Sweep';
    sheen.resize(320, 420);
    sheen.rotation = 35;
    sheen.x = isHover ? 40 : -220;
    sheen.y = isHover ? -130 : -320;
    sheen.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [[0, 1, 0], [-1, 0, 1]],
        gradientStops: [
          { position: 0, color: { r: 1, g: 1, b: 1, a: 0 } },
          { position: 0.5, color: { r: 1, g: 1, b: 1, a: isHover ? 0.16 : 0.02 } },
          { position: 1, color: { r: 1, g: 1, b: 1, a: 0 } }
        ]
      }
    ];
    body.appendChild(sheen);

    // Floating Popular Badge if Popular
    if (config.isPopular) {
      const popBadge = figma.createFrame();
      popBadge.name = 'Popular 3D Badge';
      popBadge.resize(130, 24);
      popBadge.cornerRadius = 12;
      popBadge.fills = [
        {
          type: 'GRADIENT_LINEAR',
          gradientTransform: [[1, 0, 0], [0, 1, 0]],
          gradientStops: [
            { position: 0, color: { r: 236/255, g: 72/255, b: 153/255, a: 1 } },
            { position: 1, color: { r: 168/255, g: 85/255, b: 247/255, a: 1 } }
          ]
        }
      ];

      if (!isHover) {
        popBadge.x = 246;
        popBadge.y = 20;
        popBadge.effects = [createShadow(3, 8, 0.4, { r: 236/255, g: 72/255, b: 153/255 })];
      } else {
        // Floating Parallax Badge Lift!
        popBadge.x = 246 + config.parallaxDx;
        popBadge.y = 20 + config.parallaxDy;
        popBadge.effects = [
          createShadow(10, 18, 0.6, { r: 236/255, g: 72/255, b: 153/255 }),
          createShadow(4, 10, 0.5)
        ];
      }

      const popText = createText('★ MOST POPULAR', 9, 'Bold', rgb(255, 255, 255), 14, 5, { letterSpacing: 0.5 });
      popBadge.appendChild(popText);
      body.appendChild(popBadge);
    }

    // Pricing Header Content
    const headFrame = figma.createFrame();
    headFrame.name = 'Plan Header';
    headFrame.resize(352, 90);
    headFrame.fills = [];

    if (!isHover) {
      headFrame.x = 24;
      headFrame.y = 20;
    } else {
      headFrame.x = 24 + Math.round(config.parallaxDx * 0.5);
      headFrame.y = 20 + Math.round(config.parallaxDy * 0.5);
    }

    const planTag = createText(config.planName, 11, 'Bold', rgb(config.accentRgb.r * 255, config.accentRgb.g * 255, config.accentRgb.b * 255), 0, 0, { letterSpacing: 0.8 });
    headFrame.appendChild(planTag);

    const priceText = createText(config.price, 28, 'Bold', rgb(255, 255, 255), 0, 18);
    headFrame.appendChild(priceText);

    const periodText = createText(config.period, 12, 'Regular', rgb(148, 163, 184), 85, 30);
    headFrame.appendChild(periodText);

    const planDesc = createText(config.planDesc, 11, 'Regular', rgb(148, 163, 184), 0, 56, { w: 350, lineHeight: 16 });
    headFrame.appendChild(planDesc);

    body.appendChild(headFrame);

    // Features List
    const featList = figma.createFrame();
    featList.name = 'Features List';
    featList.resize(352, 105);
    featList.fills = [];
    featList.x = 24;
    featList.y = 118;

    config.features.forEach((feat, fIdx) => {
      const fItem = createText(feat, 11, 'Medium', rgb(203, 213, 225), 0, fIdx * 20);
      featList.appendChild(fItem);
    });
    body.appendChild(featList);

    // CTA Button
    const ctaBtn = figma.createFrame();
    ctaBtn.name = 'Pricing CTA Button';
    ctaBtn.resize(352, 42);
    ctaBtn.x = 24;
    ctaBtn.y = 254;
    ctaBtn.cornerRadius = 12;

    if (!isHover) {
      if (config.isPopular) {
        ctaBtn.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 147/255, g: 51/255, b: 234/255, a: 1 } },
              { position: 1, color: { r: 79/255, g: 70/255, b: 229/255, a: 1 } }
            ]
          }
        ];
        ctaBtn.effects = [createShadow(4, 12, 0.35, rgb(147, 51, 234))];
      } else {
        ctaBtn.fills = solidFill(30, 41, 59, 0.6);
        ctaBtn.strokes = solidFill(71, 85, 105, 0.5);
        ctaBtn.strokeWeight = 1;
      }
    } else {
      // Hover State: Elevated Button with Neon Glow
      ctaBtn.fills = [
        {
          type: 'GRADIENT_LINEAR',
          gradientTransform: [[1, 0, 0], [0, 1, 0]],
          gradientStops: [
            { position: 0, color: { r: config.accentRgb.r, g: config.accentRgb.g, b: config.accentRgb.b, a: 1 } },
            { position: 1, color: { r: config.secondaryRgb.r, g: config.secondaryRgb.g, b: config.secondaryRgb.b, a: 1 } }
          ]
        }
      ];
      ctaBtn.effects = [
        createShadow(10, 24, 0.6, config.accentRgb),
        createShadow(2, 8, 0.4)
      ];
    }

    const ctaBtnText = createText(
      config.ctaText,
      13,
      'Bold',
      rgb(255, 255, 255),
      0,
      11,
      { align: 'CENTER', w: 352 }
    );
    ctaBtn.appendChild(ctaBtnText);
    body.appendChild(ctaBtn);

    comp.appendChild(body);
    return comp;
  }

  // Configurations for 3 Pricing Cards
  const pricingConfigs = [
    {
      name: 'Pricing Tier 1 (Starter - Left Tilt)',
      planName: 'STARTER SPATIAL',
      price: '$29',
      period: '/ month',
      planDesc: 'Ideal for independent developers experimenting with tactile 3D cards.',
      features: [
        '✓ Up to 10 Interactive 3D Projects',
        '✓ Standard 60fps Spring Damping Engine',
        '✓ Angular Mouse Tilt Simulation (5°)',
        '✓ Community Shader & Reflection Presets'
      ],
      ctaText: 'Get Starter Tier',
      isPopular: false,
      bgDefault: { r: 12, g: 16, b: 29 },
      bgHover: { r: 18, g: 22, b: 42 },
      accentRgb: rgb(129, 140, 248),
      secondaryRgb: rgb(99, 102, 241),
      hoverX: 14,
      hoverY: 6,
      hoverRotation: -4.8,
      glowDefX: 20,
      glowDefY: 20,
      glowHoverX: 10,
      glowHoverY: -10,
      parallaxDx: 12,
      parallaxDy: -10
    },
    {
      name: 'Pricing Tier 2 (Pro Studio - Lift & Popular)',
      planName: 'PRO STUDIO',
      price: '$79',
      period: '/ month',
      planDesc: 'Comprehensive 3D hover physics engine for production SaaS applications.',
      features: [
        '✓ Unlimited Interactive Spatial Canvases',
        '✓ 120fps Hardware-Accelerated Physics',
        '✓ Dynamic Multi-plane Z-Parallax Shifts',
        '✓ Real-time Specular Fresnel Reflection',
        '✓ One-click React & Three.js Vector Code'
      ],
      ctaText: 'Start 14-Day Free Trial',
      isPopular: true,
      bgDefault: { r: 16, g: 14, b: 35 },
      bgHover: { r: 24, g: 18, b: 52 },
      accentRgb: rgb(192, 132, 252),
      secondaryRgb: rgb(236, 72, 153),
      hoverX: 6,
      hoverY: 2,
      hoverRotation: 0,
      glowDefX: 120,
      glowDefY: 20,
      glowHoverX: 100,
      glowHoverY: -20,
      parallaxDx: 14,
      parallaxDy: -12
    },
    {
      name: 'Pricing Tier 3 (Enterprise - Right Tilt)',
      planName: 'ENTERPRISE SUITE',
      price: '$199',
      period: '/ month',
      planDesc: 'Custom spatial design systems and dedicated WebGL infrastructure for scale.',
      features: [
        '✓ Everything in Pro Studio Suite',
        '✓ Dedicated WebGL Cluster & Low Latency',
        '✓ Custom 3D Matrix & Affine Skew SDK',
        '✓ 99.99% Rendering Uptime SLA',
        '✓ Dedicated Spatial Design Architect'
      ],
      ctaText: 'Contact Enterprise',
      isPopular: false,
      bgDefault: { r: 26, g: 20, b: 12 },
      bgHover: { r: 38, g: 28, b: 15 },
      accentRgb: rgb(251, 191, 36),
      secondaryRgb: rgb(245, 158, 11),
      hoverX: 8,
      hoverY: 14,
      hoverRotation: 4.8,
      glowDefX: 200,
      glowDefY: 20,
      glowHoverX: 180,
      glowHoverY: -10,
      parallaxDx: -12,
      parallaxDy: -10
    }
  ];

  const pricingComponentSets = [];
  for (let i = 0; i < pricingConfigs.length; i++) {
    const cfg = pricingConfigs[i];
    const defComp = buildPricingCardVariant('Default', cfg);
    const hovComp = buildPricingCardVariant('Hover', cfg);

    // Arrange variants cleanly side-by-side
    defComp.x = 20;
    defComp.y = 20;
    hovComp.x = 460;
    hovComp.y = 20;

    const compSet = figma.combineAsVariants([defComp, hovComp], compSetsContainer);
    compSet.name = cfg.name;
    compSet.x = 40;
    compSet.y = 1200 + i * 400;

    await defComp.setReactionsAsync([
      {
        trigger: { type: 'ON_HOVER' },
        actions: [
          {
            type: 'NODE',
            destinationId: hovComp.id,
            navigation: 'CHANGE_TO',
            transition: {
              type: 'SMART_ANIMATE',
              duration: 0.35,
              easing: { type: 'EASE_OUT' }
            }
          }
        ]
      }
    ]);

    pricingComponentSets.push(compSet);
  }

  // Adjust compSetsContainer height to fit all 6 nicely
  compSetsContainer.resize(960, 2450);

  // =========================================================================
  // --- INSTANTIATE THE 6 INTERACTIVE CARDS DIRECTLY INSIDE FRAME 89 ---
  // =========================================================================

  // Feature Cards Row (y: 262)
  for (let i = 0; i < featureComponentSets.length; i++) {
    const set = featureComponentSets[i];
    const inst = set.defaultVariant.createInstance();
    inst.name = \`Interactive Feature Card \${i + 1}\`;
    inst.x = 60 + i * 450;
    inst.y = 262;
    targetFrame.appendChild(inst);
  }

  // Pricing Cards Row (y: 614)
  for (let i = 0; i < pricingComponentSets.length; i++) {
    const set = pricingComponentSets[i];
    const inst = set.defaultVariant.createInstance();
    inst.name = \`Interactive Pricing Card \${i + 1}\`;
    inst.x = 60 + i * 450;
    inst.y = 614;
    targetFrame.appendChild(inst);
  }

  // Select targetFrame
  figma.currentPage.selection = [targetFrame];
  figma.viewport.scrollAndZoomIntoView([targetFrame]);

  return {
    success: true,
    targetFrameId: targetFrame.id,
    targetFrameName: targetFrame.name,
    featureComponents: featureComponentSets.map(s => s.name),
    pricingComponents: pricingComponentSets.map(s => s.name),
    childrenCount: targetFrame.children.length
  };
}

return await buildTactile3DStudio();
`;

async function main() {
  console.log('Sending refined script to Figma local bridge...');
  const res = await executeFigmaCode(script);
  console.log('Bridge Response:', JSON.stringify(res, null, 2));
}

main();
