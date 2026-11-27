import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function buildFigmaMotion3DCircularCarousel() {
  // 1. Load Fonts
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  // 2. Identify Target Frame 1 and 3D space
  const frame1 = await figma.getNodeByIdAsync('1099:4115');
  if (!frame1) return { error: 'Target frame 1099:4115 not found' };

  let space = await figma.getNodeByIdAsync('1099:4116');
  if (!space) {
    space = figma.createFrame();
    space.name = '3D space';
    frame1.appendChild(space);
  }

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

  // 3. Style Frame 1 as a Spatial 3D Showcase Stage
  frame1.name = '✨ 3D Circular Animation (Figma Motion & 3D Space)';
  frame1.resize(520, 420);
  frame1.fills = solidFill(245, 242, 235); // #F5F2EB warm luxury oatmeal
  frame1.cornerRadius = 24;
  frame1.strokes = solidFill(228, 222, 212);
  frame1.strokeWeight = 1;
  frame1.effects = [createShadow(16, 36, 0.14, { r: 0.15, g: 0.12, b: 0.08 })];
  frame1.clipsContent = false;

  // Clear non-3D space children in frame1
  for (let i = frame1.children.length - 1; i >= 0; i--) {
    if (frame1.children[i].id !== space.id) {
      frame1.children[i].remove();
    }
  }

  // Background Ambient Light Disk
  const ambLight = figma.createEllipse();
  ambLight.name = 'Ambient 3D Glow';
  ambLight.resize(360, 360);
  ambLight.x = 80;
  ambLight.y = 50;
  ambLight.fills = solidFill(245, 158, 11, 0.12);
  ambLight.effects = [{ type: 'LAYER_BLUR', radius: 100, visible: true }];
  frame1.insertChild(0, ambLight);

  // Top Header Area in Frame 1
  const badgePill = figma.createFrame();
  badgePill.name = 'Header Pill';
  badgePill.resize(230, 24);
  badgePill.x = 24;
  badgePill.y = 20;
  badgePill.cornerRadius = 12;
  badgePill.fills = solidFill(217, 119, 6, 0.12);
  badgePill.strokes = solidFill(217, 119, 6, 0.3);
  badgePill.strokeWeight = 1;
  const badgeText = createText('✦ 3D CIRCULAR MOTION ORBIT', 9, 'Bold', rgb(180, 83, 9), 16, 5, { letterSpacing: 0.8 });
  badgePill.appendChild(badgeText);
  frame1.appendChild(badgePill);

  const motionStatus = figma.createFrame();
  motionStatus.name = 'Motion Timeline Status';
  motionStatus.resize(175, 24);
  motionStatus.x = 320;
  motionStatus.y = 20;
  motionStatus.cornerRadius = 12;
  motionStatus.fills = solidFill(16, 185, 129, 0.12);
  motionStatus.strokes = solidFill(16, 185, 129, 0.35);
  motionStatus.strokeWeight = 1;
  const statusDot = figma.createEllipse();
  statusDot.name = 'Pulse';
  statusDot.resize(6, 6);
  statusDot.x = 10;
  statusDot.y = 9;
  statusDot.fills = solidFill(16, 185, 129);
  statusDot.effects = [createShadow(0, 4, 0.9, rgb(16, 185, 129))];
  motionStatus.appendChild(statusDot);
  const statusLabel = createText('Figma Motion 8.0s Active', 10, 'Semi Bold', rgb(5, 150, 105), 22, 6);
  motionStatus.appendChild(statusLabel);
  frame1.appendChild(motionStatus);

  const titleText = createText('3D Space Transform & Circular Carousel', 17, 'Bold', rgb(28, 25, 23), 24, 52);
  frame1.appendChild(titleText);

  // 4. Configure 3D Space Container
  space.name = '3D space';
  space.resize(520, 320);
  space.x = 0;
  space.y = 80;
  space.fills = [];
  space.strokes = [];
  space.clipsContent = false;

  // Clear existing cards in 3D space
  while (space.children.length > 0) {
    space.children[0].remove();
  }

  // 8 Memories Data
  const memoriesData = [
    {
      id: 0,
      title: 'Midnight Bonfire at Emerald Bay',
      caption: 'Tahoe Bonfire 🔥',
      themeColor: rgb(245, 158, 11),
      drawPhoto: (photo, w, h) => {
        photo.fills = solidFill(15, 23, 42);
        const glow = figma.createEllipse();
        glow.resize(Math.round(w * 0.7), Math.round(w * 0.7));
        glow.x = Math.round(w * 0.15);
        glow.y = Math.round(h - w * 0.6);
        glow.fills = solidFill(245, 158, 11, 0.7);
        glow.effects = [{ type: 'LAYER_BLUR', radius: 18, visible: true }];
        photo.appendChild(glow);

        const flame = figma.createPolygon();
        flame.resize(22, 36);
        flame.x = Math.round(w / 2 - 11);
        flame.y = Math.round(h - 44);
        flame.fills = solidFill(239, 68, 68);
        photo.appendChild(flame);

        const flameIn = figma.createPolygon();
        flameIn.resize(12, 22);
        flameIn.x = Math.round(w / 2 - 6);
        flameIn.y = Math.round(h - 32);
        flameIn.fills = solidFill(254, 240, 138);
        photo.appendChild(flameIn);

        const f1 = figma.createEllipse();
        f1.resize(14, 20);
        f1.x = Math.round(w / 2 - 28);
        f1.y = Math.round(h - 26);
        f1.fills = solidFill(10, 15, 26);
        photo.appendChild(f1);

        const f2 = figma.createEllipse();
        f2.resize(14, 20);
        f2.x = Math.round(w / 2 + 14);
        f2.y = Math.round(h - 26);
        f2.fills = solidFill(10, 15, 26);
        photo.appendChild(f2);
      }
    },
    {
      id: 1,
      title: 'Alpine Ridge Summit Trail',
      caption: 'Alpine Cliff 🏔️',
      themeColor: rgb(56, 189, 248),
      drawPhoto: (photo, w, h) => {
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
        const peak = figma.createPolygon();
        peak.resize(56, 50);
        peak.x = Math.round(w - 58);
        peak.y = Math.round(h - 60);
        peak.fills = solidFill(255, 255, 255);
        photo.appendChild(peak);

        const cliff = figma.createPolygon();
        cliff.resize(68, 54);
        cliff.rotation = 90;
        cliff.x = 60;
        cliff.y = Math.round(h - 58);
        cliff.fills = solidFill(30, 41, 59);
        photo.appendChild(cliff);
      }
    },
    {
      id: 2,
      title: 'Cappadocia Dawn Balloon Flight',
      caption: 'Sunrise Balloons 🎈',
      themeColor: rgb(244, 63, 94),
      drawPhoto: (photo, w, h) => {
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
        const balloon = figma.createEllipse();
        balloon.resize(32, 40);
        balloon.x = Math.round(w / 2 - 16);
        balloon.y = 18;
        balloon.fills = solidFill(239, 68, 68);
        photo.appendChild(balloon);

        const burner = figma.createEllipse();
        burner.resize(14, 14);
        burner.x = Math.round(w / 2 - 7);
        burner.y = 52;
        burner.fills = solidFill(254, 240, 138);
        burner.effects = [{ type: 'LAYER_BLUR', radius: 6, visible: true }];
        photo.appendChild(burner);
      }
    },
    {
      id: 3,
      title: 'Sunset Carnival Spinning Swings',
      caption: 'Carnival Swings 🎡',
      themeColor: rgb(244, 114, 182),
      drawPhoto: (photo, w, h) => {
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
        const mast = figma.createRectangle();
        mast.resize(6, 52);
        mast.x = Math.round(w / 2 - 3);
        mast.y = Math.round(h - 52);
        mast.fills = solidFill(30, 41, 59);
        photo.appendChild(mast);

        const canopy = figma.createPolygon();
        canopy.resize(50, 20);
        canopy.x = Math.round(w / 2 - 25);
        canopy.y = Math.round(h - 66);
        canopy.fills = solidFill(239, 68, 68);
        photo.appendChild(canopy);
      }
    },
    {
      id: 4,
      title: 'First Powder Snow Trek',
      caption: 'Powder Snow ❄️',
      themeColor: rgb(148, 163, 184),
      drawPhoto: (photo, w, h) => {
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
        const ridge = figma.createPolygon();
        ridge.resize(Math.round(w * 0.9), 50);
        ridge.x = Math.round(w * 0.1);
        ridge.y = Math.round(h - 50);
        ridge.fills = solidFill(71, 85, 105);
        photo.appendChild(ridge);
      }
    },
    {
      id: 5,
      title: 'Sunlit Pine Meadow Hike',
      caption: 'Meadow Hike 🌲',
      themeColor: rgb(16, 185, 129),
      drawPhoto: (photo, w, h) => {
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
        for (let t = 0; t < 3; t++) {
          const pine = figma.createPolygon();
          pine.resize(20, 36);
          pine.x = Math.round(10 + t * 24);
          pine.y = Math.round(h - 40 - (t % 2) * 6);
          pine.fills = solidFill(6, 78, 59);
          photo.appendChild(pine);
        }
      }
    },
    {
      id: 6,
      title: 'Stargazing Camp under the Milky Way',
      caption: 'Camp Stargaze ⛺',
      themeColor: rgb(253, 224, 71),
      drawPhoto: (photo, w, h) => {
        photo.fills = solidFill(11, 15, 25);
        for (let st = 0; st < 8; st++) {
          const star = figma.createEllipse();
          star.resize(2, 2);
          star.x = (st * 13 + 7) % (w - 10);
          star.y = (st * 9 + 5) % (h * 0.6);
          star.fills = solidFill(255, 255, 255);
          photo.appendChild(star);
        }
        const tent = figma.createPolygon();
        tent.resize(28, 24);
        tent.x = Math.round(w / 2 - 14);
        tent.y = Math.round(h - 26);
        tent.fills = solidFill(253, 224, 71);
        photo.appendChild(tent);
      }
    },
    {
      id: 7,
      title: 'Amalfi Coast Azure Cliffs',
      caption: 'Amalfi Waters 🌊',
      themeColor: rgb(34, 211, 238),
      drawPhoto: (photo, w, h) => {
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
        const cliff = figma.createPolygon();
        cliff.resize(44, 65);
        cliff.rotation = 90;
        cliff.x = Math.round(w - 15);
        cliff.y = Math.round(h - 60);
        cliff.fills = solidFill(180, 83, 9);
        photo.appendChild(cliff);
      }
    }
  ];

  // 5. Geometry of 3D Cylinder
  const cx = 260; // center of 520px space
  const cy = 160; // center of 320px space
  const R = 155;  // 3D cylinder radius
  const cardW = 114;
  const cardH = 146;

  const polaroidNodes = [];

  for (let k = 0; k < 8; k++) {
    const mem = memoriesData[k];
    const theta0 = (2 * Math.PI * k) / 8;
    const sin0 = Math.sin(theta0);
    const cos0 = Math.cos(theta0);

    // Initial position on cylinder
    const initX = Math.round(cx + R * sin0 - cardW / 2);
    const initY = Math.round(cy - R * cos0 * 0.22 - cardH / 2);
    const initRot = Math.round(sin0 * 9.5);
    const initZ = cos0;
    const initScale = 0.78 + 0.26 * ((initZ + 1) / 2);
    const initOpacity = initZ < -0.2 ? 0.72 + 0.28 * ((initZ + 1) / 0.8) : 1.0;

    const pFrame = figma.createFrame();
    pFrame.name = 'Polaroid_' + (k + 1);
    pFrame.resize(cardW, cardH);
    pFrame.x = initX;
    pFrame.y = initY;
    pFrame.rotation = initRot;
    pFrame.cornerRadius = 6;
    pFrame.fills = solidFill(255, 255, 255, initOpacity);
    pFrame.strokes = solidFill(225, 220, 210, 0.75);
    pFrame.strokeWeight = 1;
    pFrame.effects = [
      createShadow(14, 22, 0.22, { r: 0.15, g: 0.12, b: 0.1 }),
      createShadow(2, 6, 0.08, { r: 0, g: 0, b: 0 })
    ];

    const pad = 6;
    const photoW = cardW - 2 * pad;
    const photoH = Math.round((cardH - pad) * 0.75);

    const photo = figma.createFrame();
    photo.name = 'Photo';
    photo.resize(photoW, photoH);
    photo.x = pad;
    photo.y = pad;
    photo.cornerRadius = 3;
    photo.clipsContent = true;

    mem.drawPhoto(photo, photoW, photoH);
    pFrame.appendChild(photo);

    const capText = createText(mem.caption, 8, 'Semi Bold', rgb(68, 64, 60), pad, pad + photoH + 4);
    pFrame.appendChild(capText);

    polaroidNodes.push({ node: pFrame, z: initZ, index: k });
  }

  // Sort nodes back-to-front by initial Z
  polaroidNodes.sort((a, b) => a.z - b.z);
  for (const p of polaroidNodes) {
    space.appendChild(p.node);
  }

  // 6. APPLY NATIVE FIGMA MOTION TIMELINE ON FRAME 1 & CARDS
  const duration = 8.0;
  const timelineId = frame1.timelines && frame1.timelines.length > 0 ? frame1.timelines[0].id : frame1.id;

  if (typeof frame1.setTimelineDuration === 'function') {
    try {
      frame1.setTimelineDuration(timelineId, duration);
    } catch (err) {
      console.warn('setTimelineDuration error:', err);
    }
  }

  // Apply SCENE_3D_PERSPECTIVE on space
  try {
    space.applyManualKeyframeTrack(
      { type: 'PROPERTY', name: 'SCENE_3D_PERSPECTIVE' },
      {
        baseValue: { type: 'FLOAT', value: 800 },
        keyframes: [
          { timelinePosition: 0.0, value: { type: 'FLOAT', value: 800 }, easing: { type: 'LINEAR' } },
          { timelinePosition: 8.0, value: { type: 'FLOAT', value: 800 }, easing: { type: 'LINEAR' } }
        ]
      }
    );
  } catch (err) {
    console.warn('Perspective track error:', err);
  }

  // Generate 3D Circular Orbit Tracks for each of the 8 cards
  const timePoints = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
  let tracksAppliedTotal = 0;

  for (let k = 0; k < 8; k++) {
    const card = polaroidNodes.find(p => p.index === k).node;
    const theta0 = (2 * Math.PI * k) / 8;

    const xKeyframes = [];
    const yKeyframes = [];
    const zKeyframes = [];
    const rotYKeyframes = [];
    const scaleKeyframes = [];
    const opacityKeyframes = [];

    // Card initial base offset at t=0
    const baseXVal = R * Math.sin(theta0);
    const baseYVal = -R * Math.cos(theta0) * 0.22;
    const baseZVal = R * Math.cos(theta0);
    const baseRotYVal = -theta0 * (180 / Math.PI);

    for (const t of timePoints) {
      // Smooth continuous circular orbit
      const theta = theta0 + (2 * Math.PI * t) / duration;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Relative to initial position
      const curX = R * sinT;
      const curY = -R * cosT * 0.22;
      const curZ = R * cosT;
      const curRotY = -theta * (180 / Math.PI);

      const dx = Math.round(curX - baseXVal);
      const dy = Math.round(curY - baseYVal);
      const dz = Math.round(curZ);
      const dRotY = Math.round(curRotY - baseRotYVal);

      const scaleVal = parseFloat((0.78 + 0.26 * ((cosT + 1) / 2)).toFixed(2));
      const opVal = parseFloat((0.72 + 0.28 * ((cosT + 1) / 2)).toFixed(2));

      const easing = { type: 'LINEAR' };

      xKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: dx }, easing });
      yKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: dy }, easing });
      zKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: dz }, easing });
      rotYKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: dRotY }, easing });
      scaleKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: scaleVal }, easing });
      opacityKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: opVal }, easing });
    }

    function safeApply(name, baseVal, keyframes) {
      try {
        card.applyManualKeyframeTrack(
          { type: 'PROPERTY', name },
          {
            baseValue: { type: 'FLOAT', value: baseVal },
            keyframes
          }
        );
        tracksAppliedTotal++;
      } catch (e) {
        console.warn('Track apply error on ' + name + ':', e);
      }
    }

    safeApply('TRANSLATION_X', 0, xKeyframes);
    safeApply('TRANSLATION_Y', 0, yKeyframes);
    safeApply('TRANSFORM_3D_TRANSLATION_Z', Math.round(baseZVal), zKeyframes);
    safeApply('TRANSFORM_3D_ROTATION_Y', 0, rotYKeyframes);
    safeApply('SCALE_X', 1.0, scaleKeyframes);
    safeApply('SCALE_Y', 1.0, scaleKeyframes);
    safeApply('OPACITY', 1.0, opacityKeyframes);
  }

  // Bottom instruction label in Frame 1
  const btmHint = createText(
    '💡 Open Figma Motion panel to play timeline, or inspect 3D space transform tracks.',
    11,
    'Medium',
    rgb(120, 113, 108),
    24,
    388
  );
  frame1.appendChild(btmHint);

  figma.currentPage.selection = [frame1];
  figma.viewport.scrollAndZoomIntoView([frame1]);

  return {
    success: true,
    frameId: frame1.id,
    frameName: frame1.name,
    spaceId: space.id,
    cardsCount: polaroidNodes.length,
    timelineDuration: duration,
    tracksAppliedTotal
  };
}

return await buildFigmaMotion3DCircularCarousel();
`;

async function main() {
  console.log('Sending Figma Motion 3D Circular Carousel script to bridge...');
  const res = await executeFigmaCode(script);
  console.log('Bridge Response:', JSON.stringify(res, null, 2));
}

main();
