import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function build3DMemoryCarousel() {
  // 1. Load Fonts
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  // Clean up any existing generated steps
  const oldSteps = figma.currentPage.findAll(n => n.name.startsWith('✨ 3D Memory Carousel - Step'));
  for (const s of oldSteps) s.remove();

  // Helper Functions
  function rgb(r, g, b) {
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  function solidFill(r, g, b, a = 1) {
    return [{ type: 'SOLID', color: rgb(r, g, b), opacity: a }];
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

  // 8 Memories Data
  const memoriesData = [
    {
      id: 0,
      title: 'Midnight Bonfire at Emerald Bay',
      caption: 'Tahoe Bonfire 🔥',
      date: 'July 14, 2024',
      location: '📍 Lake Tahoe, CA',
      note: 'Acoustic guitar & laughing under the pine embers',
      audioTime: '0:42',
      themeColor: rgb(245, 158, 11),
      drawPhoto: (photo, w, h, s) => {
        // Deep night sky
        photo.fills = solidFill(15, 23, 42);

        // Distant pine trees
        const tree1 = figma.createPolygon();
        tree1.resize(Math.round(24 * s), Math.round(44 * s));
        tree1.x = Math.round(6 * s);
        tree1.y = Math.round(h - 48 * s);
        tree1.fills = solidFill(10, 15, 26);
        photo.appendChild(tree1);

        const tree2 = figma.createPolygon();
        tree2.resize(Math.round(20 * s), Math.round(36 * s));
        tree2.x = Math.round(w - 26 * s);
        tree2.y = Math.round(h - 40 * s);
        tree2.fills = solidFill(10, 15, 26);
        photo.appendChild(tree2);

        // Ground hill
        const ground = figma.createEllipse();
        ground.resize(Math.round(w * 1.4), Math.round(36 * s));
        ground.x = Math.round(-w * 0.2);
        ground.y = Math.round(h - 18 * s);
        ground.fills = solidFill(12, 10, 9);
        photo.appendChild(ground);

        // Campfire warm radial glow
        const glow = figma.createEllipse();
        glow.resize(Math.round(56 * s), Math.round(56 * s));
        glow.x = Math.round(w / 2 - 28 * s);
        glow.y = Math.round(h - 52 * s);
        glow.fills = solidFill(245, 158, 11, 0.7);
        glow.effects = [{ type: 'LAYER_BLUR', radius: Math.round(18 * s), visible: true }];
        photo.appendChild(glow);

        // Flame shape
        const flameOuter = figma.createPolygon();
        flameOuter.resize(Math.round(18 * s), Math.round(30 * s));
        flameOuter.x = Math.round(w / 2 - 9 * s);
        flameOuter.y = Math.round(h - 38 * s);
        flameOuter.fills = solidFill(239, 68, 68);
        photo.appendChild(flameOuter);

        const flameInner = figma.createPolygon();
        flameInner.resize(Math.round(10 * s), Math.round(20 * s));
        flameInner.x = Math.round(w / 2 - 5 * s);
        flameInner.y = Math.round(h - 28 * s);
        flameInner.fills = solidFill(254, 240, 138);
        photo.appendChild(flameInner);

        // Friend silhouettes
        const friend1 = figma.createEllipse();
        friend1.resize(Math.round(12 * s), Math.round(18 * s));
        friend1.x = Math.round(w / 2 - 24 * s);
        friend1.y = Math.round(h - 24 * s);
        friend1.fills = solidFill(12, 10, 9);
        photo.appendChild(friend1);

        const friend2 = figma.createEllipse();
        friend2.resize(Math.round(12 * s), Math.round(18 * s));
        friend2.x = Math.round(w / 2 + 12 * s);
        friend2.y = Math.round(h - 24 * s);
        friend2.fills = solidFill(12, 10, 9);
        photo.appendChild(friend2);

        // Sparks
        for (let i = 0; i < 4; i++) {
          const spark = figma.createEllipse();
          spark.resize(Math.round(2 * s), Math.round(2 * s));
          spark.x = Math.round(w / 2 - 10 * s + i * 6 * s);
          spark.y = Math.round(h - 46 * s - i * 4 * s);
          spark.fills = solidFill(253, 224, 71);
          photo.appendChild(spark);
        }
      }
    },
    {
      id: 1,
      title: 'Alpine Ridge Summit Trail',
      caption: 'Alpine Cliff 🏔️',
      date: 'August 03, 2024',
      location: '📍 Mount Rainier, WA',
      note: 'Riding bikes across the ridge before the storm',
      audioTime: '1:15',
      themeColor: rgb(56, 189, 248),
      drawPhoto: (photo, w, h, s) => {
        // Alpine blue sky
        photo.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 56/255, g: 189/255, b: 248/255, a: 1 } },
              { position: 1, color: { r: 186/255, g: 230/255, b: 253/255, a: 1 } }
            ]
          }
        ];

        // Snow-capped peak in distance
        const peak = figma.createPolygon();
        peak.resize(Math.round(54 * s), Math.round(48 * s));
        peak.x = Math.round(w - 56 * s);
        peak.y = Math.round(h - 58 * s);
        peak.fills = solidFill(255, 255, 255);
        peak.strokes = solidFill(148, 163, 184, 0.5);
        peak.strokeWeight = 1;
        photo.appendChild(peak);

        // Dark Rocky Ridge
        const cliff = figma.createPolygon();
        cliff.resize(Math.round(70 * s), Math.round(56 * s));
        cliff.rotation = 90;
        cliff.x = Math.round(62 * s);
        cliff.y = Math.round(h - 60 * s);
        cliff.fills = solidFill(30, 41, 59);
        photo.appendChild(cliff);

        // Biker silhouette on ledge
        const biker = figma.createEllipse();
        biker.resize(Math.round(8 * s), Math.round(12 * s));
        biker.x = Math.round(28 * s);
        biker.y = Math.round(h - 48 * s);
        biker.fills = solidFill(15, 23, 42);
        photo.appendChild(biker);
      }
    },
    {
      id: 2,
      title: 'Cappadocia Dawn Balloon Flight',
      caption: 'Sunrise Balloons 🎈',
      date: 'June 21, 2024',
      location: '📍 Goreme Valley, Turkey',
      note: 'The roar of the fire burners at 5:00 AM',
      audioTime: '0:38',
      themeColor: rgb(244, 63, 94),
      drawPhoto: (photo, w, h, s) => {
        // Dawn Gradient
        photo.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 88/255, g: 28/255, b: 135/255, a: 1 } },
              { position: 0.55, color: { r: 244/255, g: 63/255, b: 94/255, a: 1 } },
              { position: 1, color: { r: 251/255, g: 146/255, b: 60/255, a: 1 } }
            ]
          }
        ];

        // Distant Valley Ridge
        const valley = figma.createEllipse();
        valley.resize(Math.round(w * 1.5), Math.round(34 * s));
        valley.x = Math.round(-w * 0.25);
        valley.y = Math.round(h - 18 * s);
        valley.fills = solidFill(55, 48, 163);
        photo.appendChild(valley);

        // Main Hot Air Balloon
        const balloon = figma.createEllipse();
        balloon.resize(Math.round(30 * s), Math.round(38 * s));
        balloon.x = Math.round(w / 2 - 15 * s);
        balloon.y = Math.round(16 * s);
        balloon.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 239/255, g: 68/255, b: 68/255, a: 1 } },
              { position: 1, color: { r: 245/255, g: 158/255, b: 11/255, a: 1 } }
            ]
          }
        ];
        photo.appendChild(balloon);

        // Burner Flame Burst
        const burner = figma.createEllipse();
        burner.resize(Math.round(12 * s), Math.round(12 * s));
        burner.x = Math.round(w / 2 - 6 * s);
        burner.y = Math.round(48 * s);
        burner.fills = solidFill(254, 240, 138);
        burner.effects = [{ type: 'LAYER_BLUR', radius: Math.round(6 * s), visible: true }];
        photo.appendChild(burner);

        // Distant tiny balloon
        const distB = figma.createEllipse();
        distB.resize(Math.round(10 * s), Math.round(13 * s));
        distB.x = Math.round(w - 24 * s);
        distB.y = Math.round(24 * s);
        distB.fills = solidFill(251, 146, 60);
        photo.appendChild(distB);
      }
    },
    {
      id: 3,
      title: 'Sunset Carnival Spinning Swings',
      caption: 'Carnival Swings 🎡',
      date: 'July 28, 2024',
      location: '📍 Santa Monica Pier, CA',
      note: 'Cotton candy, ocean breeze, and vertigo giggles',
      audioTime: '0:55',
      themeColor: rgb(244, 114, 182),
      drawPhoto: (photo, w, h, s) => {
        photo.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 96/255, g: 165/255, b: 250/255, a: 1 } },
              { position: 0.6, color: { r: 251/255, g: 191/255, b: 36/255, a: 1 } },
              { position: 1, color: { r: 244/255, g: 114/255, b: 182/255, a: 1 } }
            ]
          }
        ];

        // Central Swing Mast
        const mast = figma.createRectangle();
        mast.resize(Math.round(6 * s), Math.round(52 * s));
        mast.x = Math.round(w / 2 - 3 * s);
        mast.y = Math.round(h - 52 * s);
        mast.fills = solidFill(30, 41, 59);
        photo.appendChild(mast);

        // Umbrella Canopy
        const canopy = figma.createPolygon();
        canopy.resize(Math.round(48 * s), Math.round(20 * s));
        canopy.x = Math.round(w / 2 - 24 * s);
        canopy.y = Math.round(h - 66 * s);
        canopy.fills = solidFill(239, 68, 68);
        photo.appendChild(canopy);

        // Flying Swings in motion
        for (let i = 0; i < 3; i++) {
          const seat = figma.createEllipse();
          seat.resize(Math.round(6 * s), Math.round(8 * s));
          seat.x = Math.round(w / 2 - 32 * s + i * 28 * s);
          seat.y = Math.round(h - 46 * s + (i % 2) * 6 * s);
          seat.fills = solidFill(15, 23, 42);
          photo.appendChild(seat);
        }
      }
    },
    {
      id: 4,
      title: 'First Powder Snow Trek',
      caption: 'Powder Snow ❄️',
      date: 'December 18, 2024',
      location: '📍 Aspen Highlands, CO',
      note: 'Absolute silence in the pines after fresh powder',
      audioTime: '0:29',
      themeColor: rgb(148, 163, 184),
      drawPhoto: (photo, w, h, s) => {
        // Dramatic Alpine Monochrome
        photo.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 241/255, g: 245/255, b: 249/255, a: 1 } },
              { position: 1, color: { r: 148/255, g: 163/255, b: 184/255, a: 1 } }
            ]
          }
        ];

        // Snow Ridge
        const snowRidge = figma.createPolygon();
        snowRidge.resize(Math.round(w * 0.9), Math.round(52 * s));
        snowRidge.x = Math.round(w * 0.1);
        snowRidge.y = Math.round(h - 52 * s);
        snowRidge.fills = solidFill(71, 85, 105);
        photo.appendChild(snowRidge);

        // Powder slope
        const slope = figma.createPolygon();
        slope.resize(Math.round(w * 0.8), Math.round(36 * s));
        slope.x = 0;
        slope.y = Math.round(h - 36 * s);
        slope.fills = solidFill(255, 255, 255);
        photo.appendChild(slope);
      }
    },
    {
      id: 5,
      title: 'Sunlit Pine Meadow Hike',
      caption: 'Meadow Hike 🌲',
      date: 'May 12, 2024',
      location: '📍 Yosemite Valley, CA',
      note: 'Walking through shafts of sunlight with Sarah',
      audioTime: '1:04',
      themeColor: rgb(16, 185, 129),
      drawPhoto: (photo, w, h, s) => {
        // Meadow Green Sky
        photo.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 187/255, g: 247/255, b: 208/255, a: 1 } },
              { position: 1, color: { r: 52/255, g: 211/255, b: 153/255, a: 1 } }
            ]
          }
        ];

        // Pine trees in distance
        for (let t = 0; t < 4; t++) {
          const pine = figma.createPolygon();
          pine.resize(Math.round(18 * s), Math.round(34 * s));
          pine.x = Math.round(t * 18 * s);
          pine.y = Math.round(h - 40 * s - (t % 2) * 6 * s);
          pine.fills = solidFill(6, 78, 59);
          photo.appendChild(pine);
        }

        // Foreground Green Meadow
        const meadow = figma.createEllipse();
        meadow.resize(Math.round(w * 1.5), Math.round(30 * s));
        meadow.x = Math.round(-w * 0.25);
        meadow.y = Math.round(h - 16 * s);
        meadow.fills = solidFill(4, 120, 87);
        photo.appendChild(meadow);
      }
    },
    {
      id: 6,
      title: 'Stargazing Camp under the Milky Way',
      caption: 'Camp Stargaze ⛺',
      date: 'August 14, 2024',
      location: '📍 Joshua Tree, CA',
      note: 'Watching shooting stars from the warm tent',
      audioTime: '0:49',
      themeColor: rgb(253, 224, 71),
      drawPhoto: (photo, w, h, s) => {
        photo.fills = solidFill(11, 15, 25);

        // Milky way wash
        const nebula = figma.createEllipse();
        nebula.resize(Math.round(w * 1.2), Math.round(40 * s));
        nebula.rotation = -25;
        nebula.x = Math.round(-10 * s);
        nebula.y = Math.round(10 * s);
        nebula.fills = solidFill(99, 102, 241, 0.35);
        nebula.effects = [{ type: 'LAYER_BLUR', radius: Math.round(16 * s), visible: true }];
        photo.appendChild(nebula);

        // Stars
        for (let st = 0; st < 8; st++) {
          const star = figma.createEllipse();
          star.resize(Math.round(1.5 * s), Math.round(1.5 * s));
          star.x = Math.round((st * 11 * s + 7) % (w - 10));
          star.y = Math.round((st * 7 * s + 5) % (h * 0.6));
          star.fills = solidFill(255, 255, 255);
          photo.appendChild(star);
        }

        // Glowing Tent
        const tent = figma.createPolygon();
        tent.resize(Math.round(28 * s), Math.round(24 * s));
        tent.x = Math.round(w / 2 - 14 * s);
        tent.y = Math.round(h - 26 * s);
        tent.fills = solidFill(253, 224, 71);
        tent.effects = [createShadow(0, 10, 0.8, rgb(253, 224, 71))];
        photo.appendChild(tent);
      }
    },
    {
      id: 7,
      title: 'Amalfi Coast Azure Cliffs',
      caption: 'Amalfi Waters 🌊',
      date: 'September 04, 2024',
      location: '📍 Positano, Italy',
      note: 'Diving into crystal turquoise Mediterranean waves',
      audioTime: '1:20',
      themeColor: rgb(34, 211, 238),
      drawPhoto: (photo, w, h, s) => {
        // Turquoise Ocean
        photo.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 56/255, g: 189/255, b: 248/255, a: 1 } },
              { position: 0.6, color: { r: 6/255, g: 182/255, b: 212/255, a: 1 } },
              { position: 1, color: { r: 14/255, g: 116/255, b: 144/255, a: 1 } }
            ]
          }
        ];

        // Terracotta Cliff
        const cliff = figma.createPolygon();
        cliff.resize(Math.round(42 * s), Math.round(65 * s));
        cliff.rotation = 90;
        cliff.x = Math.round(w - 20 * s);
        cliff.y = Math.round(h - 60 * s);
        cliff.fills = solidFill(180, 83, 9);
        photo.appendChild(cliff);

        // Wave surf
        const wave = figma.createEllipse();
        wave.resize(Math.round(w * 0.9), Math.round(10 * s));
        wave.x = 0;
        wave.y = Math.round(h - 18 * s);
        wave.fills = solidFill(255, 255, 255, 0.6);
        photo.appendChild(wave);
      }
    }
  ];

  // Setup 4 Prototype Frames (Step 1, Step 2, Step 3, Step 4)
  const stepFrames = [];
  const startX = 4006;
  const startY = 335;

  for (let s = 0; s < 4; s++) {
    const f = figma.createFrame();
    f.name = \`✨ 3D Memory Carousel - Step \${s + 1} (\${s * 45}° Active)\`;
    f.resize(412, 917);
    f.x = startX + s * 460;
    f.y = startY;
    f.fills = solidFill(238, 233, 225); // #EEE9E1 warm luxury oatmeal linen
    f.clipsContent = true;
    figma.currentPage.appendChild(f);
    stepFrames.push(f);
  }

  // Populate Frame
  function populateFrame(frame, stepIndex) {
    const angleOffset = (stepIndex * Math.PI) / 4; // 0, 45, 90, 135 deg
    const activeMemoryIndex = stepIndex % 8;
    const activeMem = memoriesData[activeMemoryIndex];

    // 1. Ambient Background Glow
    const bgGlow = figma.createEllipse();
    bgGlow.name = 'Ambient Memory Aura';
    bgGlow.resize(360, 360);
    bgGlow.x = 26;
    bgGlow.y = 120;
    bgGlow.fills = solidFill(activeMem.themeColor.r * 255, activeMem.themeColor.g * 255, activeMem.themeColor.b * 255, 0.18);
    bgGlow.effects = [{ type: 'LAYER_BLUR', radius: 110, visible: true }];
    frame.appendChild(bgGlow);

    // 2. Status Bar
    const statusBar = figma.createFrame();
    statusBar.name = 'Status Bar';
    statusBar.resize(412, 44);
    statusBar.fills = [];
    const timeText = createText('9:41', 14, 'Bold', rgb(41, 37, 36), 32, 14);
    const iconsText = createText('􀙇  􀌪  􀛨', 13, 'Bold', rgb(41, 37, 36), 325, 14);
    statusBar.appendChild(timeText);
    statusBar.appendChild(iconsText);
    frame.appendChild(statusBar);

    // 3. App Header Bar
    const header = figma.createFrame();
    header.name = 'App Header';
    header.resize(412, 60);
    header.y = 44;
    header.fills = [];

    const avatar = figma.createFrame();
    avatar.name = 'User Avatar';
    avatar.resize(38, 38);
    avatar.x = 24;
    avatar.y = 10;
    avatar.cornerRadius = 19;
    avatar.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [[1, 0, 0], [0, 1, 0]],
        gradientStops: [
          { position: 0, color: { r: 217/255, g: 119/255, b: 6/255, a: 1 } },
          { position: 1, color: { r: 245/255, g: 158/255, b: 11/255, a: 1 } }
        ]
      }
    ];
    const avInitial = createText('B', 15, 'Bold', rgb(255, 255, 255), 14, 10);
    avatar.appendChild(avInitial);
    header.appendChild(avatar);

    const titleGroup = figma.createFrame();
    titleGroup.name = 'Vault Title Group';
    titleGroup.resize(220, 42);
    titleGroup.x = 72;
    titleGroup.y = 8;
    titleGroup.fills = [];
    const eyebrow = createText('MEMORY VAULT • 2024', 10, 'Bold', rgb(168, 85, 247), 0, 0, { letterSpacing: 0.8 });
    const mainTitle = createText('Summer Memories ▾', 16, 'Bold', rgb(28, 25, 23), 0, 16);
    titleGroup.appendChild(eyebrow);
    titleGroup.appendChild(mainTitle);
    header.appendChild(titleGroup);

    const bookmarkBtn = figma.createFrame();
    bookmarkBtn.name = 'Search / Filter';
    bookmarkBtn.resize(36, 36);
    bookmarkBtn.x = 352;
    bookmarkBtn.y = 11;
    bookmarkBtn.cornerRadius = 18;
    bookmarkBtn.fills = solidFill(255, 255, 255, 0.7);
    bookmarkBtn.strokes = solidFill(220, 215, 205, 0.6);
    bookmarkBtn.strokeWeight = 1;
    const bIcon = createText('🔍', 14, 'Regular', rgb(41, 37, 36), 10, 9);
    bookmarkBtn.appendChild(bIcon);
    header.appendChild(bookmarkBtn);

    frame.appendChild(header);

    // 4. View Mode Switcher
    const pillsRow = figma.createFrame();
    pillsRow.name = 'View Mode Switcher';
    pillsRow.resize(364, 34);
    pillsRow.x = 24;
    pillsRow.y = 104;
    pillsRow.fills = solidFill(228, 222, 212, 0.7);
    pillsRow.cornerRadius = 17;

    const pill1 = figma.createFrame();
    pill1.name = 'Pill 3D Ring Active';
    pill1.resize(115, 28);
    pill1.x = 3;
    pill1.y = 3;
    pill1.cornerRadius = 14;
    pill1.fills = solidFill(28, 25, 23);
    const pill1Text = createText('◈ 3D Ring', 11, 'Bold', rgb(255, 255, 255), 18, 7);
    pill1.appendChild(pill1Text);
    pillsRow.appendChild(pill1);

    const pill2 = figma.createFrame();
    pill2.name = 'Pill Grid';
    pill2.resize(80, 28);
    pill2.x = 122;
    pill2.y = 3;
    pill2.fills = [];
    const pill2Text = createText('▦ Grid', 11, 'Medium', rgb(120, 113, 108), 16, 7);
    pill2.appendChild(pill2Text);
    pillsRow.appendChild(pill2);

    const pill3 = figma.createFrame();
    pill3.name = 'Pill Timeline';
    pill3.resize(90, 28);
    pill3.x = 206;
    pill3.y = 3;
    pill3.fills = [];
    const pill3Text = createText('◷ Timeline', 11, 'Medium', rgb(120, 113, 108), 16, 7);
    pill3.appendChild(pill3Text);
    pillsRow.appendChild(pill3);

    const pill4 = figma.createFrame();
    pill4.name = 'Pill Map';
    pill4.resize(60, 28);
    pill4.x = 300;
    pill4.y = 3;
    pill4.fills = [];
    const pill4Text = createText('📍 Map', 11, 'Medium', rgb(120, 113, 108), 10, 7);
    pill4.appendChild(pill4Text);
    pillsRow.appendChild(pill4);

    frame.appendChild(pillsRow);

    // 5. THE 3D CAROUSEL STAGE (y: 146, h: 370)
    const stage = figma.createFrame();
    stage.name = 'Carousel Stage';
    stage.resize(412, 370);
    stage.y = 146;
    stage.fills = [];
    stage.clipsContent = false;

    const stageHint = createText('SWIPE OR CLICK TO ROTATE 3D RING', 9, 'Bold', rgb(168, 162, 158), 0, 8, { align: 'CENTER', w: 412, letterSpacing: 0.8 });
    stage.appendChild(stageHint);

    const cx = 206;
    const cy = 186;
    const Rx = 138;
    const Ry = 42;

    const polaroidNodes = [];

    for (let k = 0; k < 8; k++) {
      const mem = memoriesData[k];
      const theta = (2 * Math.PI * k) / 8 - angleOffset;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const px = cx + Rx * sinT;
      const py = cy + Ry * cosT;
      const z = cosT;

      const scale = 0.72 + 0.32 * ((z + 1) / 2);
      const cardW = Math.round(114 * scale);
      const cardH = Math.round(146 * scale);

      const rot = Math.round(sinT * 9.5);
      const opacity = z < -0.2 ? 0.74 + 0.26 * ((z + 1) / 0.8) : 1.0;

      const shadowY = Math.round(16 * Math.max(0.2, (z + 1) / 2));
      const shadowBlur = Math.round(24 * Math.max(0.3, (z + 1) / 2));
      const shadowAlpha = 0.12 + 0.18 * Math.max(0, (z + 1) / 2);

      const pFrame = figma.createFrame();
      pFrame.name = \`Polaroid_\${k + 1}\`;
      pFrame.resize(cardW, cardH);
      pFrame.x = Math.round(px - cardW / 2);
      pFrame.y = Math.round(py - cardH / 2);
      pFrame.rotation = rot;
      pFrame.cornerRadius = Math.round(5 * scale);
      pFrame.fills = solidFill(255, 255, 255, opacity);
      pFrame.strokes = solidFill(225, 220, 210, 0.75);
      pFrame.strokeWeight = 1;
      pFrame.effects = [
        createShadow(shadowY, shadowBlur, shadowAlpha, { r: 0.15, g: 0.12, b: 0.1 }),
        createShadow(2, 6, 0.08, { r: 0, g: 0, b: 0 })
      ];

      const pad = Math.max(4, Math.round(6 * scale));
      const photoW = cardW - 2 * pad;
      const photoH = Math.round((cardH - pad) * 0.75);

      const photo = figma.createFrame();
      photo.name = 'Photo';
      photo.resize(photoW, photoH);
      photo.x = pad;
      photo.y = pad;
      photo.cornerRadius = Math.max(2, Math.round(3 * scale));
      photo.clipsContent = true;

      // Draw custom scenery artwork for this photo!
      mem.drawPhoto(photo, photoW, photoH, scale);

      pFrame.appendChild(photo);

      // Bottom handwritten-style caption
      const capText = createText(
        mem.caption,
        Math.max(6, Math.round(8 * scale)),
        'Semi Bold',
        rgb(68, 64, 60),
        pad,
        pad + photoH + Math.max(3, Math.round(4 * scale))
      );
      pFrame.appendChild(capText);

      polaroidNodes.push({ node: pFrame, z: z, index: k });
    }

    polaroidNodes.sort((a, b) => a.z - b.z);
    for (const p of polaroidNodes) {
      stage.appendChild(p.node);
    }

    // Navigation Arrow Buttons
    const prevBtn = figma.createFrame();
    prevBtn.name = 'Prev Button';
    prevBtn.resize(36, 36);
    prevBtn.x = 12;
    prevBtn.y = 168;
    prevBtn.cornerRadius = 18;
    prevBtn.fills = solidFill(255, 255, 255, 0.9);
    prevBtn.strokes = solidFill(215, 210, 200, 0.85);
    prevBtn.strokeWeight = 1;
    prevBtn.effects = [createShadow(4, 12, 0.15, { r: 0.1, g: 0.08, b: 0.05 })];
    const prevIcon = createText('‹', 20, 'Bold', rgb(41, 37, 36), 12, 5);
    prevBtn.appendChild(prevIcon);
    stage.appendChild(prevBtn);

    const nextBtn = figma.createFrame();
    nextBtn.name = 'Next Button';
    nextBtn.resize(36, 36);
    nextBtn.x = 364;
    nextBtn.y = 168;
    nextBtn.cornerRadius = 18;
    nextBtn.fills = solidFill(255, 255, 255, 0.9);
    nextBtn.strokes = solidFill(215, 210, 200, 0.85);
    nextBtn.strokeWeight = 1;
    nextBtn.effects = [createShadow(4, 12, 0.15, { r: 0.1, g: 0.08, b: 0.05 })];
    const nextIcon = createText('›', 20, 'Bold', rgb(41, 37, 36), 13, 5);
    nextBtn.appendChild(nextIcon);
    stage.appendChild(nextBtn);

    // Indicator Dots
    const dotsRow = figma.createFrame();
    dotsRow.name = 'Rotation Dots';
    dotsRow.resize(120, 16);
    dotsRow.x = (412 - 120) / 2;
    dotsRow.y = 348;
    dotsRow.fills = [];

    for (let d = 0; d < 8; d++) {
      const isAct = d === activeMemoryIndex;
      const dot = figma.createFrame();
      dot.name = \`Dot_\${d + 1}\`;
      dot.resize(isAct ? 18 : 6, 6);
      dot.x = d * 14;
      dot.y = 5;
      dot.cornerRadius = 3;
      dot.fills = isAct ? solidFill(28, 25, 23) : solidFill(180, 175, 165, 0.7);
      dotsRow.appendChild(dot);
    }
    stage.appendChild(dotsRow);

    frame.appendChild(stage);

    // 6. ACTIVE MEMORY CARD (Bottom Sheet Container, y: 524, h: 286)
    const memCard = figma.createFrame();
    memCard.name = 'Active Memory Card';
    memCard.resize(372, 286);
    memCard.x = 20;
    memCard.y = 524;
    memCard.cornerRadius = 24;
    memCard.fills = solidFill(255, 255, 255, 0.95);
    memCard.strokes = solidFill(230, 225, 215, 0.7);
    memCard.strokeWeight = 1;
    memCard.effects = [
      createShadow(12, 32, 0.12, { r: 0.15, g: 0.12, b: 0.08 }),
      createShadow(2, 6, 0.06, { r: 0, g: 0, b: 0 })
    ];

    const memBadge = figma.createFrame();
    memBadge.name = 'Memory Badge';
    memBadge.resize(140, 22);
    memBadge.x = 20;
    memBadge.y = 18;
    memBadge.cornerRadius = 11;
    memBadge.fills = solidFill(activeMem.themeColor.r * 255, activeMem.themeColor.g * 255, activeMem.themeColor.b * 255, 0.18);
    const badgeText = createText('✦ ACTIVE MEMORY', 9, 'Bold', rgb(activeMem.themeColor.r * 255, activeMem.themeColor.g * 255, activeMem.themeColor.b * 255), 14, 4, { letterSpacing: 0.6 });
    memBadge.appendChild(badgeText);
    memCard.appendChild(memBadge);

    const memDate = createText(activeMem.date, 11, 'Medium', rgb(168, 162, 158), 245, 21);
    memCard.appendChild(memDate);

    const cardTitle = createText(activeMem.title, 18, 'Bold', rgb(28, 25, 23), 20, 48, { w: 332, lineHeight: 22 });
    memCard.appendChild(cardTitle);

    const cardLoc = createText(activeMem.location, 12, 'Semi Bold', rgb(120, 113, 108), 20, 76);
    memCard.appendChild(cardLoc);

    const cardNote = createText(\`“\${activeMem.note}”\`, 12, 'Regular', rgb(87, 83, 78), 20, 98, { w: 332, lineHeight: 18 });
    memCard.appendChild(cardNote);

    const audioBox = figma.createFrame();
    audioBox.name = 'Voice Note Audio Player';
    audioBox.resize(332, 42);
    audioBox.x = 20;
    audioBox.y = 142;
    audioBox.cornerRadius = 12;
    audioBox.fills = solidFill(245, 240, 232, 0.8);
    audioBox.strokes = solidFill(230, 224, 215, 0.7);
    audioBox.strokeWeight = 1;

    const playCircle = figma.createFrame();
    playCircle.name = 'Play Button';
    playCircle.resize(26, 26);
    playCircle.x = 10;
    playCircle.y = 8;
    playCircle.cornerRadius = 13;
    playCircle.fills = solidFill(28, 25, 23);
    const playTriangle = createText('▶', 10, 'Bold', rgb(255, 255, 255), 9, 7);
    playCircle.appendChild(playTriangle);
    audioBox.appendChild(playCircle);

    const waveFrame = figma.createFrame();
    waveFrame.name = 'Waveform Bars';
    waveFrame.resize(180, 20);
    waveFrame.x = 48;
    waveFrame.y = 11;
    waveFrame.fills = [];
    const barHeights = [6, 12, 18, 10, 16, 20, 14, 8, 12, 18, 15, 9, 14, 20, 16, 10, 8, 14, 18, 12, 6];
    barHeights.forEach((bh, bIdx) => {
      const bar = figma.createFrame();
      bar.name = \`Bar_\${bIdx}\`;
      bar.resize(3, bh);
      bar.x = bIdx * 8;
      bar.y = (20 - bh) / 2;
      bar.cornerRadius = 1.5;
      bar.fills = bIdx < 9 ? solidFill(28, 25, 23) : solidFill(200, 195, 185);
      waveFrame.appendChild(bar);
    });
    audioBox.appendChild(waveFrame);

    const timeLabel = createText(activeMem.audioTime, 11, 'Semi Bold', rgb(87, 83, 78), 285, 14);
    audioBox.appendChild(timeLabel);

    memCard.appendChild(audioBox);

    const reliveBtn = figma.createFrame();
    reliveBtn.name = 'Relive in 3D Button';
    reliveBtn.resize(220, 42);
    reliveBtn.x = 20;
    reliveBtn.y = 196;
    reliveBtn.cornerRadius = 12;
    reliveBtn.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [[1, 0, 0], [0, 1, 0]],
        gradientStops: [
          { position: 0, color: { r: 234/255, g: 88/255, b: 12/255, a: 1 } },
          { position: 1, color: { r: 217/255, g: 119/255, b: 6/255, a: 1 } }
        ]
      }
    ];
    reliveBtn.effects = [createShadow(4, 12, 0.35, rgb(217, 119, 6))];
    const reliveText = createText('⟳ Relive in 3D Space', 13, 'Bold', rgb(255, 255, 255), 45, 12);
    reliveBtn.appendChild(reliveText);
    memCard.appendChild(reliveBtn);

    const favBtn = figma.createFrame();
    favBtn.name = 'Favorite Button';
    favBtn.resize(46, 42);
    favBtn.x = 250;
    favBtn.y = 196;
    favBtn.cornerRadius = 12;
    favBtn.fills = solidFill(245, 240, 232);
    favBtn.strokes = solidFill(225, 220, 210);
    favBtn.strokeWeight = 1;
    const favIcon = createText('♡', 16, 'Bold', rgb(41, 37, 36), 16, 11);
    favBtn.appendChild(favIcon);
    memCard.appendChild(favBtn);

    const shareBtn = figma.createFrame();
    shareBtn.name = 'Share Button';
    shareBtn.resize(46, 42);
    shareBtn.x = 306;
    shareBtn.y = 196;
    shareBtn.cornerRadius = 12;
    shareBtn.fills = solidFill(245, 240, 232);
    shareBtn.strokes = solidFill(225, 220, 210);
    shareBtn.strokeWeight = 1;
    const shareIcon = createText('↗', 16, 'Bold', rgb(41, 37, 36), 17, 11);
    shareBtn.appendChild(shareIcon);
    memCard.appendChild(shareBtn);

    const friendsRow = createText('Tagged: Sarah M., Alex K., Elena +2 others', 10, 'Medium', rgb(140, 130, 120), 22, 254);
    memCard.appendChild(friendsRow);

    frame.appendChild(memCard);

    // 7. BOTTOM NAVIGATION DOCK
    const dock = figma.createFrame();
    dock.name = 'Bottom Navigation Dock';
    dock.resize(372, 58);
    dock.x = 20;
    dock.y = 824;
    dock.cornerRadius = 29;
    dock.fills = solidFill(255, 255, 255, 0.95);
    dock.strokes = solidFill(230, 225, 215, 0.8);
    dock.strokeWeight = 1;
    dock.effects = [
      createShadow(10, 24, 0.12, { r: 0.15, g: 0.12, b: 0.08 }),
      { type: 'BACKGROUND_BLUR', radius: 16, visible: true }
    ];

    const dockItems = [
      { icon: '◈', label: 'Vault', x: 26, active: true },
      { icon: '📖', label: 'Journal', x: 96, active: false },
      { icon: '＋', label: 'Add', x: 166, isFab: true },
      { icon: '♡', label: 'Favorites', x: 242, active: false },
      { icon: '⚙', label: 'Settings', x: 316, active: false }
    ];

    dockItems.forEach(item => {
      if (item.isFab) {
        const fab = figma.createFrame();
        fab.name = 'Add Memory FAB';
        fab.resize(42, 42);
        fab.x = item.x;
        fab.y = 8;
        fab.cornerRadius = 21;
        fab.fills = [
          {
            type: 'GRADIENT_LINEAR',
            gradientTransform: [[1, 0, 0], [0, 1, 0]],
            gradientStops: [
              { position: 0, color: { r: 234/255, g: 88/255, b: 12/255, a: 1 } },
              { position: 1, color: { r: 217/255, g: 119/255, b: 6/255, a: 1 } }
            ]
          }
        ];
        fab.effects = [createShadow(4, 10, 0.35, rgb(217, 119, 6))];
        const plus = createText('＋', 18, 'Bold', rgb(255, 255, 255), 12, 8);
        fab.appendChild(plus);
        dock.appendChild(fab);
      } else {
        const dIcon = createText(item.icon, 16, item.active ? 'Bold' : 'Regular', item.active ? rgb(28, 25, 23) : rgb(168, 162, 158), item.x, 10);
        const dLabel = createText(item.label, 9, item.active ? 'Bold' : 'Medium', item.active ? rgb(28, 25, 23) : rgb(168, 162, 158), item.x - 2, 34);
        dock.appendChild(dIcon);
        dock.appendChild(dLabel);
      }
    });

    frame.appendChild(dock);
  }

  // Populate all 4 frames
  for (let s = 0; s < 4; s++) {
    populateFrame(stepFrames[s], s);
  }

  // =========================================================================
  // --- WIRE PROTOTYPE ANIMATIONS BETWEEN FRAMES (CONTINUOUS 3D ROTATION) ---
  // =========================================================================

  for (let s = 0; s < 4; s++) {
    const curFrame = stepFrames[s];
    const nextFrame = stepFrames[(s + 1) % 4];
    const prevFrame = stepFrames[(s + 3) % 4];

    // 1. AFTER_TIMEOUT: auto-rotate continuously in 3D space
    await curFrame.setReactionsAsync([
      {
        trigger: { type: 'AFTER_TIMEOUT', timeout: 2.2 },
        actions: [
          {
            type: 'NODE',
            destinationId: nextFrame.id,
            navigation: 'NAVIGATE',
            transition: {
              type: 'SMART_ANIMATE',
              duration: 0.85,
              easing: { type: 'EASE_IN_AND_OUT' }
            }
          }
        ]
      }
    ]);

    // 2. Interactive Next Button on Stage
    const nextBtn = curFrame.findOne(n => n.name === 'Next Button');
    if (nextBtn) {
      await nextBtn.setReactionsAsync([
        {
          trigger: { type: 'ON_CLICK' },
          actions: [
            {
              type: 'NODE',
              destinationId: nextFrame.id,
              navigation: 'NAVIGATE',
              transition: {
                type: 'SMART_ANIMATE',
                duration: 0.65,
                easing: { type: 'EASE_IN_AND_OUT' }
              }
            }
          ]
        }
      ]);
    }

    // 3. Interactive Prev Button on Stage
    const prevBtn = curFrame.findOne(n => n.name === 'Prev Button');
    if (prevBtn) {
      await prevBtn.setReactionsAsync([
        {
          trigger: { type: 'ON_CLICK' },
          actions: [
            {
              type: 'NODE',
              destinationId: prevFrame.id,
              navigation: 'NAVIGATE',
              transition: {
                type: 'SMART_ANIMATE',
                duration: 0.65,
                easing: { type: 'EASE_IN_AND_OUT' }
              }
            }
          ]
        }
      ]);
    }

    // 4. Interactive Drag on Stage
    const stage = curFrame.findOne(n => n.name === 'Carousel Stage');
    if (stage) {
      await stage.setReactionsAsync([
        {
          trigger: { type: 'ON_DRAG' },
          actions: [
            {
              type: 'NODE',
              destinationId: nextFrame.id,
              navigation: 'NAVIGATE',
              transition: {
                type: 'SMART_ANIMATE',
                duration: 0.65,
                easing: { type: 'EASE_IN_AND_OUT' }
              }
            }
          ]
        }
      ]);
    }
  }

  figma.currentPage.selection = [stepFrames[0]];
  figma.viewport.scrollAndZoomIntoView([stepFrames[0]]);

  return {
    success: true,
    framesCount: stepFrames.length,
    frameIds: stepFrames.map(f => f.id),
    frameNames: stepFrames.map(f => f.name)
  };
}

return await build3DMemoryCarousel();
`;

async function main() {
  console.log('Sending enhanced 3D Memory Carousel builder script to Figma local bridge...');
  const res = await executeFigmaCode(script);
  console.log('Bridge Response:', JSON.stringify(res, null, 2));
}

main();
