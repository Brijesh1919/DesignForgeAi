import fs from "fs";

async function main() {
  const code = `
    (async () => {
      // 1. Preload Fonts
      const fonts = [
        { family: "DM Sans", style: "Regular" },
        { family: "DM Sans", style: "Medium" },
        { family: "DM Sans", style: "SemiBold" },
        { family: "DM Sans", style: "Bold" },
        { family: "Inter", style: "Regular" },
        { family: "Inter", style: "Medium" },
        { family: "Inter", style: "Bold" },
      ];
      for (const f of fonts) {
        try {
          await figma.loadFontAsync(f);
        } catch (e) {
          console.warn("Could not load font", f, e);
        }
      }

      // 2. Remove previous redesign frame if exists
      const existing = figma.currentPage.children.find(c => c.name === "Posh Xessories | Modern E-Commerce Redesign (1440)");
      if (existing) {
        existing.remove();
      }

      // 3. Define Color Tokens
      const C = {
        navyDark: { r: 0.047, g: 0.122, b: 0.239 },     // #0C1F3D
        navyDeeper: { r: 0.035, g: 0.082, b: 0.165 },   // #09152A
        royalBlue: { r: 0.141, g: 0.341, b: 1.000 },    // #2457FF
        royalBlueSoft: { r: 0.925, g: 0.949, b: 1.000 },// #ECF2FF
        coralRed: { r: 0.831, g: 0.125, b: 0.169 },     // #D4202B
        coralRedSoft: { r: 1.000, g: 0.925, b: 0.925 }, // #FFEAEA
        slateDark: { r: 0.063, g: 0.094, b: 0.157 },    // #101828
        slateBody: { r: 0.278, g: 0.329, b: 0.404 },    // #475467
        slateMuted: { r: 0.400, g: 0.439, b: 0.522 },   // #667085
        slateLight: { r: 0.600, g: 0.640, b: 0.700 },   // #99A3B3
        borderSoft: { r: 0.918, g: 0.925, b: 0.941 },   // #EAECF0
        borderSubtle: { r: 0.945, g: 0.953, b: 0.965 }, // #F1F3F6
        bgIce: { r: 0.973, g: 0.980, b: 0.988 },        // #F8FAFC
        bgWarm: { r: 0.965, g: 0.973, b: 0.984 },       // #F6F8FB
        white: { r: 1.0, g: 1.0, b: 1.0 },              // #FFFFFF
        green: { r: 0.059, g: 0.541, b: 0.373 },        // #0F8A5F
        greenSoft: { r: 0.894, g: 0.961, b: 0.925 },    // #E4F5EC
        footerBg: { r: 0.043, g: 0.075, b: 0.169 },     // #0B132B
        footerBorder: { r: 0.118, g: 0.161, b: 0.231 }  // #1E293B
      };

      // 4. Helper builders
      const FONT_HEAD = { family: "DM Sans", style: "Bold" };
      const FONT_SEMI = { family: "DM Sans", style: "SemiBold" };
      const FONT_MED = { family: "DM Sans", style: "Medium" };
      const FONT_REG = { family: "DM Sans", style: "Regular" };

      async function createText(characters, font, fontSize, color, options = {}) {
        await figma.loadFontAsync(font);
        const t = figma.createText();
        t.fontName = font;
        t.fontSize = fontSize;
        t.characters = String(characters);
        t.fills = [{ type: "SOLID", color }];
        if (options.lineHeight) t.lineHeight = { value: options.lineHeight, unit: "PIXELS" };
        if (options.letterSpacing) t.letterSpacing = { value: options.letterSpacing, unit: "PERCENT" };
        if (options.textCase) t.textCase = options.textCase;
        if (options.layoutAlign) t.layoutAlign = options.layoutAlign;
        if (options.layoutGrow !== undefined) t.layoutGrow = options.layoutGrow;
        if (options.textAutoResize) t.textAutoResize = options.textAutoResize;
        return t;
      }

      function createSolidFill(color, opacity = 1) {
        return [{ type: "SOLID", color, opacity }];
      }

      function createImageFill(hash, scaleMode = "FIT") {
        return [{ type: "IMAGE", imageHash: hash, scaleMode }];
      }

      function createStroke(color, weight = 1) {
        return {
          strokes: [{ type: "SOLID", color }],
          strokeWeight: weight
        };
      }

      // Create Root Frame
      const root = figma.createFrame();
      root.name = "Posh Xessories | Modern E-Commerce Redesign (1440)";
      root.layoutMode = "VERTICAL";
      root.resize(1440, 100);
      root.counterAxisSizingMode = "FIXED";
      root.primaryAxisSizingMode = "AUTO";
      root.fills = createSolidFill(C.white);
      root.itemSpacing = 0;
      root.x = 1600;
      root.y = 0;

      // ==========================================
      // SECTION 1: TOP ANNOUNCEMENT / UTILITY BAR
      // ==========================================
      const topBar = figma.createFrame();
      topBar.name = "01 Top Utility Bar";
      topBar.layoutMode = "HORIZONTAL";
      topBar.resize(1440, 38);
      topBar.counterAxisSizingMode = "FIXED";
      topBar.primaryAxisSizingMode = "FIXED";
      topBar.layoutAlign = "STRETCH";
      topBar.fills = createSolidFill(C.navyDeeper);
      topBar.primaryAxisAlignItems = "CENTER";
      topBar.counterAxisAlignItems = "CENTER";
      topBar.paddingLeft = 80;
      topBar.paddingRight = 80;

      const topInner = figma.createFrame();
      topInner.name = "Inner";
      topInner.layoutMode = "HORIZONTAL";
      topInner.primaryAxisSizingMode = "FIXED";
      topInner.counterAxisSizingMode = "AUTO";
      topInner.resize(1280, 24);
      topInner.layoutAlign = "STRETCH";
      topInner.primaryAxisAlignItems = "SPACE_BETWEEN";
      topInner.counterAxisAlignItems = "CENTER";
      topInner.fills = [];

      // Left notice
      const topNotice = figma.createFrame();
      topNotice.layoutMode = "HORIZONTAL";
      topNotice.itemSpacing = 8;
      topNotice.counterAxisAlignItems = "CENTER";
      topNotice.fills = [];

      const pulseDot = figma.createEllipse();
      pulseDot.resize(7, 7);
      pulseDot.fills = createSolidFill({ r: 0.0, g: 0.9, b: 0.6 });
      topNotice.appendChild(pulseDot);

      const topTxt = await createText(
        "Free artwork review on every order. Need it fast? Ask about 48-hr rush production on select items.",
        FONT_MED, 12, { r: 0.88, g: 0.92, b: 0.98 }
      );
      topNotice.appendChild(topTxt);
      topInner.appendChild(topNotice);

      // Right credentials
      const topRight = figma.createFrame();
      topRight.layoutMode = "HORIZONTAL";
      topRight.itemSpacing = 16;
      topRight.counterAxisAlignItems = "CENTER";
      topRight.fills = [];

      const phoneTxt = await createText("📞 (800) 555-POSH", FONT_SEMI, 12, C.white);
      topRight.appendChild(phoneTxt);

      const divPipe = await createText("•", FONT_REG, 12, C.slateMuted);
      topRight.appendChild(divPipe);

      const credTxt = await createText(
        "ASI 79028 | PPAI 206478 | SAGE 64870 | UPIC POSHX",
        FONT_MED, 11, { r: 0.65, g: 0.72, b: 0.85 }, { letterSpacing: 3 }
      );
      topRight.appendChild(credTxt);
      topInner.appendChild(topRight);

      topBar.appendChild(topInner);
      root.appendChild(topBar);

      // ==========================================
      // SECTION 2: MAIN NAVIGATION HEADER
      // ==========================================
      const header = figma.createFrame();
      header.name = "02 Main Navigation Header";
      header.layoutMode = "VERTICAL";
      header.resize(1440, 84);
      header.counterAxisSizingMode = "FIXED";
      header.primaryAxisSizingMode = "FIXED";
      header.layoutAlign = "STRETCH";
      header.fills = createSolidFill(C.white);
      header.strokes = createStroke(C.borderSoft).strokes;
      header.strokeWeight = 1;
      header.primaryAxisAlignItems = "CENTER";
      header.paddingLeft = 80;
      header.paddingRight = 80;

      const headerInner = figma.createFrame();
      headerInner.name = "Container";
      headerInner.layoutMode = "HORIZONTAL";
      headerInner.primaryAxisSizingMode = "FIXED";
      headerInner.counterAxisSizingMode = "AUTO";
      headerInner.resize(1280, 52);
      headerInner.primaryAxisAlignItems = "SPACE_BETWEEN";
      headerInner.counterAxisAlignItems = "CENTER";
      headerInner.fills = [];

      // Brand Logo
      const logoFrame = figma.createFrame();
      logoFrame.name = "Brand Logo";
      logoFrame.layoutMode = "HORIZONTAL";
      logoFrame.itemSpacing = 12;
      logoFrame.counterAxisAlignItems = "CENTER";
      logoFrame.fills = [];

      // Monogram badge
      const logoIcon = figma.createFrame();
      logoIcon.resize(38, 38);
      logoIcon.cornerRadius = 8;
      logoIcon.fills = createSolidFill(C.navyDark);
      logoIcon.layoutMode = "HORIZONTAL";
      logoIcon.primaryAxisAlignItems = "CENTER";
      logoIcon.counterAxisAlignItems = "CENTER";
      const pxTxt = await createText("PX", FONT_HEAD, 16, C.white);
      logoIcon.appendChild(pxTxt);
      logoFrame.appendChild(logoIcon);

      const logoTextGroup = figma.createFrame();
      logoTextGroup.layoutMode = "VERTICAL";
      logoTextGroup.itemSpacing = 2;
      logoTextGroup.fills = [];
      const brandName = await createText("POSH XESSORIES", FONT_HEAD, 20, C.navyDark, { letterSpacing: 0.5 });
      const brandSub = await createText("PREMIUM B2B MERCHANDISE", FONT_SEMI, 9, C.slateMuted, { letterSpacing: 8 });
      logoTextGroup.appendChild(brandName);
      logoTextGroup.appendChild(brandSub);
      logoFrame.appendChild(logoTextGroup);
      headerInner.appendChild(logoFrame);

      // Search Bar Container
      const searchContainer = figma.createFrame();
      searchContainer.name = "Search Bar";
      searchContainer.layoutMode = "HORIZONTAL";
      searchContainer.resize(520, 44);
      searchContainer.counterAxisSizingMode = "FIXED";
      searchContainer.primaryAxisSizingMode = "FIXED";
      searchContainer.cornerRadius = 10;
      searchContainer.fills = createSolidFill(C.bgIce);
      searchContainer.strokes = createStroke(C.borderSoft).strokes;
      searchContainer.strokeWeight = 1;
      searchContainer.paddingLeft = 14;
      searchContainer.paddingRight = 10;
      searchContainer.counterAxisAlignItems = "CENTER";
      searchContainer.itemSpacing = 10;

      const searchLens = await createText("🔍", FONT_REG, 13, C.slateMuted);
      searchContainer.appendChild(searchLens);

      const searchInput = await createText(
        "Search by product name or SKU, e.g. TX-2107...",
        FONT_REG, 13.5, C.slateMuted, { layoutGrow: 1 }
      );
      searchContainer.appendChild(searchInput);

      // Category filter pill inside search
      const catPill = figma.createFrame();
      catPill.layoutMode = "HORIZONTAL";
      catPill.paddingLeft = 10;
      catPill.paddingRight = 10;
      catPill.paddingTop = 5;
      catPill.paddingBottom = 5;
      catPill.cornerRadius = 6;
      catPill.fills = createSolidFill(C.white);
      catPill.strokes = createStroke(C.borderSoft).strokes;
      catPill.strokeWeight = 1;
      const catPillTxt = await createText("All categories ▾", FONT_MED, 12, C.slateDark);
      catPill.appendChild(catPillTxt);
      searchContainer.appendChild(catPill);

      // Search button
      const searchBtn = figma.createFrame();
      searchBtn.layoutMode = "HORIZONTAL";
      searchBtn.paddingLeft = 14;
      searchBtn.paddingRight = 14;
      searchBtn.paddingTop = 7;
      searchBtn.paddingBottom = 7;
      searchBtn.cornerRadius = 6;
      searchBtn.fills = createSolidFill(C.navyDark);
      const searchBtnTxt = await createText("Search", FONT_SEMI, 12.5, C.white);
      searchBtn.appendChild(searchBtnTxt);
      searchContainer.appendChild(searchBtn);

      headerInner.appendChild(searchContainer);

      // Right Nav User Actions
      const userActions = figma.createFrame();
      userActions.name = "User Actions";
      userActions.layoutMode = "HORIZONTAL";
      userActions.itemSpacing = 16;
      userActions.counterAxisAlignItems = "CENTER";
      userActions.fills = [];

      // Quick Order Button
      const quickSkuBtn = figma.createFrame();
      quickSkuBtn.layoutMode = "HORIZONTAL";
      quickSkuBtn.paddingLeft = 14;
      quickSkuBtn.paddingRight = 14;
      quickSkuBtn.paddingTop = 9;
      quickSkuBtn.paddingBottom = 9;
      quickSkuBtn.cornerRadius = 8;
      quickSkuBtn.fills = createSolidFill(C.white);
      quickSkuBtn.strokes = createStroke(C.navyDark).strokes;
      quickSkuBtn.strokeWeight = 1.5;
      const quickSkuTxt = await createText("⚡ Quick SKU Order", FONT_SEMI, 13, C.navyDark);
      quickSkuBtn.appendChild(quickSkuTxt);
      userActions.appendChild(quickSkuBtn);

      // Login / Register group
      const authGroup = figma.createFrame();
      authGroup.layoutMode = "HORIZONTAL";
      authGroup.itemSpacing = 8;
      authGroup.counterAxisAlignItems = "CENTER";
      authGroup.fills = [];
      const loginTxt = await createText("Login", FONT_SEMI, 13.5, C.navyDark);
      const slashTxt = await createText("/", FONT_REG, 13.5, C.slateMuted);
      const regTxt = await createText("Register", FONT_SEMI, 13.5, C.royalBlue);
      authGroup.appendChild(loginTxt);
      authGroup.appendChild(slashTxt);
      authGroup.appendChild(regTxt);
      userActions.appendChild(authGroup);

      // Quote List Button
      const quoteListBtn = figma.createFrame();
      quoteListBtn.name = "Quote List Button";
      quoteListBtn.layoutMode = "HORIZONTAL";
      quoteListBtn.paddingLeft = 16;
      quoteListBtn.paddingRight = 16;
      quoteListBtn.paddingTop = 9;
      quoteListBtn.paddingBottom = 9;
      quoteListBtn.cornerRadius = 8;
      quoteListBtn.itemSpacing = 8;
      quoteListBtn.counterAxisAlignItems = "CENTER";
      quoteListBtn.fills = createSolidFill(C.navyDark);

      const quoteIcon = await createText("📋", FONT_REG, 13, C.white);
      const quoteTitle = await createText("Quote list", FONT_SEMI, 13, C.white);
      const quoteBadge = figma.createFrame();
      quoteBadge.resize(20, 20);
      quoteBadge.cornerRadius = 10;
      quoteBadge.fills = createSolidFill(C.royalBlue);
      quoteBadge.layoutMode = "HORIZONTAL";
      quoteBadge.primaryAxisAlignItems = "CENTER";
      quoteBadge.counterAxisAlignItems = "CENTER";
      const badgeCount = await createText("0", FONT_HEAD, 11, C.white);
      quoteBadge.appendChild(badgeCount);

      quoteListBtn.appendChild(quoteIcon);
      quoteListBtn.appendChild(quoteTitle);
      quoteListBtn.appendChild(quoteBadge);
      userActions.appendChild(quoteListBtn);

      headerInner.appendChild(userActions);
      header.appendChild(headerInner);
      root.appendChild(header);

      // ==========================================
      // SECTION 3: SECONDARY CATEGORY STRIP
      // ==========================================
      const subNav = figma.createFrame();
      subNav.name = "03 Category SubNav";
      subNav.layoutMode = "HORIZONTAL";
      subNav.resize(1440, 46);
      subNav.counterAxisSizingMode = "FIXED";
      subNav.primaryAxisSizingMode = "FIXED";
      subNav.layoutAlign = "STRETCH";
      subNav.fills = createSolidFill(C.bgIce);
      subNav.strokes = createStroke(C.borderSoft).strokes;
      subNav.strokeWeight = 1;
      subNav.primaryAxisAlignItems = "CENTER";
      subNav.paddingLeft = 80;
      subNav.paddingRight = 80;

      const subNavInner = figma.createFrame();
      subNavInner.layoutMode = "HORIZONTAL";
      subNavInner.resize(1280, 30);
      subNavInner.itemSpacing = 28;
      subNavInner.counterAxisAlignItems = "CENTER";
      subNavInner.fills = [];

      const navLinks = [
        { label: "Drinkware", active: false },
        { label: "Journals & Jotters", active: true },
        { label: "Padfolios", active: false },
        { label: "Power & Mobile", active: false },
        { label: "Business Card Cases", active: false },
        { label: "Metal & Stylus Pens", active: false },
        { label: "Tote Bags & Travel", active: false },
        { label: "Custom Packaging", active: false },
        { label: "Decoration Guide", active: false },
        { label: "🔥 Closeout Deals", active: false, highlight: true }
      ];

      for (const link of navLinks) {
        const linkItem = figma.createFrame();
        linkItem.layoutMode = "HORIZONTAL";
        linkItem.counterAxisAlignItems = "CENTER";
        linkItem.paddingTop = 6;
        linkItem.paddingBottom = 6;
        linkItem.fills = [];

        const color = link.highlight ? C.coralRed : (link.active ? C.royalBlue : C.slateBody);
        const font = (link.active || link.highlight) ? FONT_SEMI : FONT_MED;
        const linkTxt = await createText(link.label, font, 13, color);
        linkItem.appendChild(linkTxt);
        subNavInner.appendChild(linkItem);
      }
      subNav.appendChild(subNavInner);
      root.appendChild(subNav);

      // ==========================================
      // SECTION 4: HIGH-IMPACT HERO COMMERCE SECTION
      // ==========================================
      const heroSection = figma.createFrame();
      heroSection.name = "04 Hero Merchandising Section";
      heroSection.layoutMode = "VERTICAL";
      heroSection.resize(1440, 640);
      heroSection.counterAxisSizingMode = "FIXED";
      heroSection.primaryAxisSizingMode = "FIXED";
      heroSection.layoutAlign = "STRETCH";
      heroSection.fills = createSolidFill(C.white);
      heroSection.paddingLeft = 80;
      heroSection.paddingRight = 80;
      heroSection.paddingTop = 48;
      heroSection.paddingBottom = 48;
      heroSection.itemSpacing = 32;

      const heroInner = figma.createFrame();
      heroInner.name = "Hero Two-Column";
      heroInner.layoutMode = "HORIZONTAL";
      heroInner.resize(1280, 480);
      heroInner.counterAxisSizingMode = "FIXED";
      heroInner.primaryAxisSizingMode = "FIXED";
      heroInner.layoutAlign = "STRETCH";
      heroInner.primaryAxisAlignItems = "SPACE_BETWEEN";
      heroInner.counterAxisAlignItems = "CENTER";
      heroInner.fills = [];

      // Left Column (Hero Content)
      const heroLeft = figma.createFrame();
      heroLeft.name = "Hero Left Content";
      heroLeft.layoutMode = "VERTICAL";
      heroLeft.resize(650, 460);
      heroLeft.primaryAxisSizingMode = "AUTO";
      heroLeft.itemSpacing = 20;
      heroLeft.fills = [];

      // Eyebrow tag
      const heroEyebrow = figma.createFrame();
      heroEyebrow.layoutMode = "HORIZONTAL";
      heroEyebrow.itemSpacing = 8;
      heroEyebrow.paddingLeft = 12;
      heroEyebrow.paddingRight = 12;
      heroEyebrow.paddingTop = 5;
      heroEyebrow.paddingBottom = 5;
      heroEyebrow.cornerRadius = 20;
      heroEyebrow.fills = createSolidFill(C.royalBlueSoft);
      heroEyebrow.strokes = createStroke(C.royalBlue, 1).strokes;
      const eyebrowStar = await createText("★", FONT_HEAD, 11, C.royalBlue);
      const eyebrowText = await createText(
        "PREMIUM PROMOTIONAL HARDCOVER & SOFT-TOUCH JOURNALS",
        FONT_HEAD, 10.5, C.royalBlue, { letterSpacing: 6 }
      );
      heroEyebrow.appendChild(eyebrowStar);
      heroEyebrow.appendChild(eyebrowText);
      heroLeft.appendChild(heroEyebrow);

      // Big Title
      const heroTitle = await createText(
        "Journals that carry your brand with authority.",
        FONT_HEAD, 44, C.navyDark, { lineHeight: 52, letterSpacing: -1.2 }
      );
      heroTitle.layoutAlign = "STRETCH";
      heroLeft.appendChild(heroTitle);

      // Subtitle
      const heroSub = await createText(
        "Soft-touch covers in every corporate palette. Masterfully crafted for high-retention client gifts, conferences, and executive kits. Deboss, metallic foil or vivid edge-to-edge print.",
        FONT_REG, 16, C.slateBody, { lineHeight: 26 }
      );
      heroSub.layoutAlign = "STRETCH";
      heroLeft.appendChild(heroSub);

      // Button Group
      const heroBtns = figma.createFrame();
      heroBtns.layoutMode = "HORIZONTAL";
      heroBtns.itemSpacing = 14;
      heroBtns.counterAxisAlignItems = "CENTER";
      heroBtns.fills = [];

      const shopJournalsBtn = figma.createFrame();
      shopJournalsBtn.layoutMode = "HORIZONTAL";
      shopJournalsBtn.paddingLeft = 24;
      shopJournalsBtn.paddingRight = 24;
      shopJournalsBtn.paddingTop = 14;
      shopJournalsBtn.paddingBottom = 14;
      shopJournalsBtn.cornerRadius = 8;
      shopJournalsBtn.fills = createSolidFill(C.navyDark);
      const shopJournalsTxt = await createText("Shop Journals Collection →", FONT_SEMI, 15, C.white);
      shopJournalsBtn.appendChild(shopJournalsTxt);
      heroBtns.appendChild(shopJournalsBtn);

      const sampleBtn = figma.createFrame();
      sampleBtn.layoutMode = "HORIZONTAL";
      sampleBtn.paddingLeft = 20;
      sampleBtn.paddingRight = 20;
      sampleBtn.paddingTop = 13;
      sampleBtn.paddingBottom = 13;
      sampleBtn.cornerRadius = 8;
      sampleBtn.fills = createSolidFill(C.white);
      sampleBtn.strokes = createStroke(C.borderSoft, 1.5).strokes;
      const sampleTxt = await createText("Request Free Sample", FONT_SEMI, 14.5, C.slateDark);
      sampleBtn.appendChild(sampleTxt);
      heroBtns.appendChild(sampleBtn);
      heroLeft.appendChild(heroBtns);

      // Micro Trust Badges Row
      const microTrust = figma.createFrame();
      microTrust.layoutMode = "HORIZONTAL";
      microTrust.itemSpacing = 20;
      microTrust.counterAxisAlignItems = "CENTER";
      microTrust.paddingTop = 10;
      microTrust.fills = [];

      const trusts = [
        "✓ Free Virtual Art Proofs",
        "✓ Quantity-Based Tier Pricing",
        "✓ 48-Hour Rush Production"
      ];
      for (const tr of trusts) {
        const trTxt = await createText(tr, FONT_MED, 12.5, C.slateBody);
        microTrust.appendChild(trTxt);
      }
      heroLeft.appendChild(microTrust);
      heroInner.appendChild(heroLeft);

      // Right Column (Visual Merchandising Showcase)
      const heroRight = figma.createFrame();
      heroRight.name = "Hero Visual Showcase";
      heroRight.layoutMode = "VERTICAL";
      heroRight.resize(580, 480);
      heroRight.counterAxisSizingMode = "FIXED";
      heroRight.primaryAxisSizingMode = "FIXED";
      heroRight.cornerRadius = 20;
      heroRight.fills = createSolidFill(C.bgIce);
      heroRight.strokes = createStroke(C.borderSoft).strokes;
      heroRight.strokeWeight = 1;
      heroRight.paddingLeft = 24;
      heroRight.paddingRight = 24;
      heroRight.paddingTop = 24;
      heroRight.paddingBottom = 24;
      heroRight.itemSpacing = 16;

      // Main Journal Photo
      const heroImgFrame = figma.createFrame();
      heroImgFrame.name = "Hero Journal Image";
      heroImgFrame.resize(532, 320);
      heroImgFrame.cornerRadius = 14;
      heroImgFrame.fills = createImageFill("82661b2c45d6541f4a9b6c071d07c089cb138243", "FIT");
      heroImgFrame.layoutMode = "VERTICAL";
      heroImgFrame.primaryAxisAlignItems = "SPACE_BETWEEN";
      heroImgFrame.paddingLeft = 14;
      heroImgFrame.paddingTop = 14;

      // Tag on image
      const hotBadge = figma.createFrame();
      hotBadge.layoutMode = "HORIZONTAL";
      hotBadge.paddingLeft = 10;
      hotBadge.paddingRight = 10;
      hotBadge.paddingTop = 4;
      hotBadge.paddingBottom = 4;
      hotBadge.cornerRadius = 6;
      hotBadge.fills = createSolidFill(C.navyDark);
      const hotBadgeTxt = await createText("★ Distributor Bestseller", FONT_SEMI, 11, C.white);
      hotBadge.appendChild(hotBadgeTxt);
      heroImgFrame.appendChild(hotBadge);
      heroRight.appendChild(heroImgFrame);

      // Color Variants Selector Bar
      const variantBar = figma.createFrame();
      variantBar.name = "Variant Bar";
      variantBar.layoutMode = "HORIZONTAL";
      variantBar.resize(532, 80);
      variantBar.counterAxisSizingMode = "FIXED";
      variantBar.layoutAlign = "STRETCH";
      variantBar.primaryAxisAlignItems = "SPACE_BETWEEN";
      variantBar.counterAxisAlignItems = "CENTER";
      variantBar.cornerRadius = 12;
      variantBar.fills = createSolidFill(C.white);
      variantBar.strokes = createStroke(C.borderSoft).strokes;
      variantBar.strokeWeight = 1;
      variantBar.paddingLeft = 16;
      variantBar.paddingRight = 16;

      // Left color swatches
      const swatchesGroup = figma.createFrame();
      swatchesGroup.layoutMode = "HORIZONTAL";
      swatchesGroup.itemSpacing = 12;
      swatchesGroup.counterAxisAlignItems = "CENTER";
      swatchesGroup.fills = [];

      const swatchImgs = [
        { hash: "f44f1cdb62615967b66df8701047120d911f32a7", title: "Midnight Navy" },
        { hash: "6431f4bfa85d6b46ef32a487dd545d9e5ea5ee7f", title: "Saddle Tan" },
        { hash: "461b3ab296ee9796013346b3f7f45bca532a8ff9", title: "Charcoal Black" }
      ];

      for (let i = 0; i < swatchImgs.length; i++) {
        const sw = swatchImgs[i];
        const swFrame = figma.createFrame();
        swFrame.resize(50, 50);
        swFrame.cornerRadius = 8;
        swFrame.fills = createImageFill(sw.hash, "FIT");
        swFrame.strokes = createStroke(i === 0 ? C.royalBlue : C.borderSoft, i === 0 ? 2 : 1).strokes;
        swatchesGroup.appendChild(swFrame);
      }

      const swatchLabelGroup = figma.createFrame();
      swatchLabelGroup.layoutMode = "VERTICAL";
      swatchLabelGroup.itemSpacing = 2;
      swatchLabelGroup.fills = [];
      const swTitle = await createText("Cover Colors Available", FONT_SEMI, 12, C.slateDark);
      const swSub = await createText("18 vibrant & classic hues", FONT_REG, 11, C.slateMuted);
      swatchLabelGroup.appendChild(swTitle);
      swatchLabelGroup.appendChild(swSub);
      swatchesGroup.appendChild(swatchLabelGroup);
      variantBar.appendChild(swatchesGroup);

      // Right price break callout
      const priceCallout = figma.createFrame();
      priceCallout.layoutMode = "VERTICAL";
      priceCallout.itemSpacing = 2;
      priceCallout.counterAxisAlignItems = "MAX";
      priceCallout.fills = [];
      const priceFrom = await createText("As low as", FONT_MED, 11, C.slateMuted);
      const priceVal = await createText("$8.98 / ea", FONT_HEAD, 16, C.green);
      const minQty = await createText("100 min • Free digital proof", FONT_REG, 10.5, C.slateMuted);
      priceCallout.appendChild(priceFrom);
      priceCallout.appendChild(priceVal);
      priceCallout.appendChild(minQty);
      variantBar.appendChild(priceCallout);

      heroRight.appendChild(variantBar);
      heroInner.appendChild(heroRight);
      heroSection.appendChild(heroInner);
      root.appendChild(heroSection);

      // ==========================================
      // SECTION 5: FLOATING QUICK ORDER BY SKU DOCK
      // ==========================================
      const quickOrderDock = figma.createFrame();
      quickOrderDock.name = "05 Quick Order by SKU Dock";
      quickOrderDock.layoutMode = "VERTICAL";
      quickOrderDock.resize(1440, 150);
      quickOrderDock.counterAxisSizingMode = "FIXED";
      quickOrderDock.primaryAxisSizingMode = "FIXED";
      quickOrderDock.layoutAlign = "STRETCH";
      quickOrderDock.fills = createSolidFill(C.bgWarm);
      quickOrderDock.strokes = createStroke(C.borderSoft).strokes;
      quickOrderDock.strokeWeight = 1;
      quickOrderDock.paddingLeft = 80;
      quickOrderDock.paddingRight = 80;
      quickOrderDock.paddingTop = 20;
      quickOrderDock.paddingBottom = 20;
      quickOrderDock.primaryAxisAlignItems = "CENTER";

      const quickDockCard = figma.createFrame();
      quickDockCard.name = "Quick Dock Card";
      quickDockCard.layoutMode = "HORIZONTAL";
      quickDockCard.resize(1280, 108);
      quickDockCard.counterAxisSizingMode = "FIXED";
      quickDockCard.cornerRadius = 14;
      quickDockCard.fills = createSolidFill(C.white);
      quickDockCard.strokes = createStroke(C.borderSoft).strokes;
      quickDockCard.strokeWeight = 1;
      quickDockCard.paddingLeft = 28;
      quickDockCard.paddingRight = 28;
      quickDockCard.primaryAxisAlignItems = "SPACE_BETWEEN";
      quickDockCard.counterAxisAlignItems = "CENTER";

      // Left info
      const qdLeft = figma.createFrame();
      qdLeft.layoutMode = "VERTICAL";
      qdLeft.itemSpacing = 6;
      qdLeft.resize(300, 68);
      qdLeft.fills = [];

      const qdTitleGroup = figma.createFrame();
      qdTitleGroup.layoutMode = "HORIZONTAL";
      qdTitleGroup.itemSpacing = 8;
      qdTitleGroup.counterAxisAlignItems = "CENTER";
      qdTitleGroup.fills = [];
      const qdTitle = await createText("Quick order by SKU", FONT_HEAD, 18, C.navyDark);
      const qdBadge = figma.createFrame();
      qdBadge.paddingLeft = 6;
      qdBadge.paddingRight = 6;
      qdBadge.paddingTop = 2;
      qdBadge.paddingBottom = 2;
      qdBadge.cornerRadius = 4;
      qdBadge.fills = createSolidFill(C.royalBlueSoft);
      const qdBadgeTxt = await createText("DISTRIBUTOR FAST-TRACK", FONT_HEAD, 9.5, C.royalBlue);
      qdBadge.appendChild(qdBadgeTxt);
      qdTitleGroup.appendChild(qdTitle);
      qdTitleGroup.appendChild(qdBadge);
      qdLeft.appendChild(qdTitleGroup);

      const qdSub = await createText(
        "Enter product codes & quantities for instant quote line-items.",
        FONT_REG, 13, C.slateBody
      );
      qdLeft.appendChild(qdSub);
      quickDockCard.appendChild(qdLeft);

      // Middle SKU Input fields
      const qdInputs = figma.createFrame();
      qdInputs.layoutMode = "HORIZONTAL";
      qdInputs.itemSpacing = 12;
      qdInputs.counterAxisAlignItems = "CENTER";
      qdInputs.fills = [];

      // SKU 1 Input
      const sku1 = figma.createFrame();
      sku1.layoutMode = "HORIZONTAL";
      sku1.resize(170, 44);
      sku1.cornerRadius = 8;
      sku1.fills = createSolidFill(C.bgIce);
      sku1.strokes = createStroke(C.borderSoft).strokes;
      sku1.strokeWeight = 1;
      sku1.paddingLeft = 14;
      sku1.paddingRight = 14;
      sku1.counterAxisAlignItems = "CENTER";
      const sku1Txt = await createText("TX-2107 × 250", FONT_SEMI, 13.5, C.slateDark);
      sku1.appendChild(sku1Txt);
      qdInputs.appendChild(sku1);

      // SKU 2 Input
      const sku2 = figma.createFrame();
      sku2.layoutMode = "HORIZONTAL";
      sku2.resize(170, 44);
      sku2.cornerRadius = 8;
      sku2.fills = createSolidFill(C.bgIce);
      sku2.strokes = createStroke(C.borderSoft).strokes;
      sku2.strokeWeight = 1;
      sku2.paddingLeft = 14;
      sku2.paddingRight = 14;
      sku2.counterAxisAlignItems = "CENTER";
      const sku2Txt = await createText("DW-8966 × 500", FONT_SEMI, 13.5, C.slateDark);
      sku2.appendChild(sku2Txt);
      qdInputs.appendChild(sku2);

      quickDockCard.appendChild(qdInputs);

      // Right Action Group
      const qdActions = figma.createFrame();
      qdActions.layoutMode = "HORIZONTAL";
      qdActions.itemSpacing = 12;
      qdActions.counterAxisAlignItems = "CENTER";
      qdActions.fills = [];

      const addQuoteBtn = figma.createFrame();
      addQuoteBtn.layoutMode = "HORIZONTAL";
      addQuoteBtn.paddingLeft = 20;
      addQuoteBtn.paddingRight = 20;
      addQuoteBtn.paddingTop = 12;
      addQuoteBtn.paddingBottom = 12;
      addQuoteBtn.cornerRadius = 8;
      addQuoteBtn.fills = createSolidFill(C.navyDark);
      const addQuoteTxt = await createText("+ Add to quote list", FONT_SEMI, 14, C.white);
      addQuoteBtn.appendChild(addQuoteTxt);
      qdActions.appendChild(addQuoteBtn);

      const exampleBtn = figma.createFrame();
      exampleBtn.layoutMode = "HORIZONTAL";
      exampleBtn.paddingLeft = 14;
      exampleBtn.paddingRight = 14;
      exampleBtn.paddingTop = 11;
      exampleBtn.paddingBottom = 11;
      exampleBtn.cornerRadius = 8;
      exampleBtn.fills = createSolidFill(C.white);
      exampleBtn.strokes = createStroke(C.borderSoft).strokes;
      exampleBtn.strokeWeight = 1;
      const exampleTxt = await createText("Example", FONT_MED, 13, C.slateBody);
      exampleBtn.appendChild(exampleTxt);
      qdActions.appendChild(exampleBtn);

      quickDockCard.appendChild(qdActions);
      quickOrderDock.appendChild(quickDockCard);
      root.appendChild(quickOrderDock);

      // ==========================================
      // SECTION 6: WHY DISTRIBUTORS CHOOSE US & CREDIBILITY
      // ==========================================
      const whyChooseUs = figma.createFrame();
      whyChooseUs.name = "06 Why Distributors Choose Us";
      whyChooseUs.layoutMode = "VERTICAL";
      whyChooseUs.resize(1440, 360);
      whyChooseUs.counterAxisSizingMode = "FIXED";
      whyChooseUs.primaryAxisSizingMode = "FIXED";
      whyChooseUs.layoutAlign = "STRETCH";
      whyChooseUs.fills = createSolidFill(C.white);
      whyChooseUs.paddingLeft = 80;
      whyChooseUs.paddingRight = 80;
      whyChooseUs.paddingTop = 40;
      whyChooseUs.paddingBottom = 40;
      whyChooseUs.itemSpacing = 28;

      // Section Header
      const whyHeader = figma.createFrame();
      whyHeader.layoutMode = "HORIZONTAL";
      whyHeader.resize(1280, 36);
      whyHeader.primaryAxisAlignItems = "SPACE_BETWEEN";
      whyHeader.counterAxisAlignItems = "CENTER";
      whyHeader.fills = [];

      const whyHeadGroup = figma.createFrame();
      whyHeadGroup.layoutMode = "HORIZONTAL";
      whyHeadGroup.itemSpacing = 12;
      whyHeadGroup.counterAxisAlignItems = "CENTER";
      whyHeadGroup.fills = [];
      const whyTitle = await createText("Why distributors choose Posh Xessories", FONT_HEAD, 26, C.navyDark);
      const whyBadge = figma.createFrame();
      whyBadge.paddingLeft = 8;
      whyBadge.paddingRight = 8;
      whyBadge.paddingTop = 3;
      whyBadge.paddingBottom = 3;
      whyBadge.cornerRadius = 4;
      whyBadge.fills = createSolidFill(C.greenSoft);
      const whyBadgeTxt = await createText("5-STAR VERIFIED SUPPLIER", FONT_HEAD, 10, C.green);
      whyBadge.appendChild(whyBadgeTxt);
      whyHeadGroup.appendChild(whyTitle);
      whyHeadGroup.appendChild(whyBadge);
      whyHeader.appendChild(whyHeadGroup);
      whyChooseUs.appendChild(whyHeader);

      // 4 Credibility Cards Grid
      const credGrid = figma.createFrame();
      credGrid.name = "Credibility Grid";
      credGrid.layoutMode = "HORIZONTAL";
      credGrid.resize(1280, 110);
      credGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
      credGrid.itemSpacing = 20;
      credGrid.fills = [];

      const credItems = [
        {
          num: "1",
          title: "Rated #1 in California",
          sub: "Top 10 in the nation for customer satisfaction & precision delivery.",
          color: C.royalBlue
        },
        {
          num: "★",
          title: "ASI 5-Star supplier",
          sub: "Also recognized as a PRO Supplier and 2018 SAGE Rated Supplier.",
          color: C.coralRed
        },
        {
          num: "$",
          title: "Published decoration pricing",
          sub: "See imprint costs in the Decoration Price Guide with zero surprise fees.",
          color: C.green
        },
        {
          num: "✉",
          title: "Quote or sample in one step",
          sub: "Request virtual mockups or hands-on samples directly from any product card.",
          color: C.navyDark
        }
      ];

      for (const item of credItems) {
        const cCard = figma.createFrame();
        cCard.layoutMode = "HORIZONTAL";
        cCard.resize(305, 108);
        cCard.counterAxisSizingMode = "FIXED";
        cCard.cornerRadius = 12;
        cCard.fills = createSolidFill(C.bgIce);
        cCard.strokes = createStroke(C.borderSoft).strokes;
        cCard.strokeWeight = 1;
        cCard.paddingLeft = 16;
        cCard.paddingRight = 16;
        cCard.paddingTop = 16;
        cCard.paddingBottom = 16;
        cCard.itemSpacing = 14;
        cCard.counterAxisAlignItems = "CENTER";

        // Number/Icon badge
        const badgeBox = figma.createFrame();
        badgeBox.resize(40, 40);
        badgeBox.cornerRadius = 8;
        badgeBox.fills = createSolidFill(item.color);
        badgeBox.layoutMode = "HORIZONTAL";
        badgeBox.primaryAxisAlignItems = "CENTER";
        badgeBox.counterAxisAlignItems = "CENTER";
        const badgeChar = await createText(item.num, FONT_HEAD, 16, C.white);
        badgeBox.appendChild(badgeChar);
        cCard.appendChild(badgeBox);

        const cTextGroup = figma.createFrame();
        cTextGroup.layoutMode = "VERTICAL";
        cTextGroup.itemSpacing = 4;
        cTextGroup.fills = [];
        const cTitle = await createText(item.title, FONT_HEAD, 14.5, C.navyDark);
        const cSub = await createText(item.sub, FONT_REG, 12, C.slateBody, { lineHeight: 17 });
        cTextGroup.appendChild(cTitle);
        cTextGroup.appendChild(cSub);
        cCard.appendChild(cTextGroup);

        credGrid.appendChild(cCard);
      }
      whyChooseUs.appendChild(credGrid);

      // Awards banner
      const awardsBanner = figma.createFrame();
      awardsBanner.name = "Awards and Supplier Ratings Banner";
      awardsBanner.resize(1280, 80);
      awardsBanner.cornerRadius = 10;
      awardsBanner.fills = createImageFill("7764c7875b2dc68434771fdb8bb99a3a96860ecb", "FIT");
      whyChooseUs.appendChild(awardsBanner);
      root.appendChild(whyChooseUs);

      // ==========================================
      // SECTION 7: SHOP BY CATEGORY (FEATURED & FULL GRID)
      // ==========================================
      const catSection = figma.createFrame();
      catSection.name = "07 Shop by Category";
      catSection.layoutMode = "VERTICAL";
      catSection.resize(1440, 780);
      catSection.counterAxisSizingMode = "FIXED";
      catSection.primaryAxisSizingMode = "FIXED";
      catSection.layoutAlign = "STRETCH";
      catSection.fills = createSolidFill(C.bgIce);
      catSection.paddingLeft = 80;
      catSection.paddingRight = 80;
      catSection.paddingTop = 48;
      catSection.paddingBottom = 48;
      catSection.itemSpacing = 24;

      // Header
      const catHead = figma.createFrame();
      catHead.layoutMode = "HORIZONTAL";
      catHead.resize(1280, 36);
      catHead.primaryAxisAlignItems = "SPACE_BETWEEN";
      catHead.counterAxisAlignItems = "CENTER";
      catHead.fills = [];

      const catTitle = await createText("Shop by category", FONT_HEAD, 28, C.navyDark);
      const viewAllLink = await createText("View all categories →", FONT_SEMI, 14.5, C.royalBlue);
      catHead.appendChild(catTitle);
      catHead.appendChild(viewAllLink);
      catSection.appendChild(catHead);

      // Top 3 Large Featured Hero Categories
      const topHeroCats = figma.createFrame();
      topHeroCats.name = "Top Hero Categories";
      topHeroCats.layoutMode = "HORIZONTAL";
      topHeroCats.resize(1280, 190);
      topHeroCats.itemSpacing = 20;
      topHeroCats.fills = [];

      const heroCatData = [
        {
          name: "Drinkware",
          sub: "Bottles, tumblers, mugs & accessories.",
          hash: "8c2c86ff168e10d0684e0887a1dc38a568e4aea4",
          count: "60+ Models"
        },
        {
          name: "Padfolios & Folios",
          sub: "For executive client meetings & conferences.",
          hash: "9b83431c944fca8c44dc1864e29cb1fe9dafe4bb",
          count: "35+ Styles"
        },
        {
          name: "Power & Mobile",
          sub: "Power banks, cables, stands & electronics.",
          hash: "182cdeb6f7ef0ee76b5c2d308f7fb9807a04910b",
          count: "45+ Devices"
        }
      ];

      for (const hc of heroCatData) {
        const hcCard = figma.createFrame();
        hcCard.layoutMode = "HORIZONTAL";
        hcCard.resize(413, 190);
        hcCard.cornerRadius = 16;
        hcCard.fills = createSolidFill(C.white);
        hcCard.strokes = createStroke(C.borderSoft).strokes;
        hcCard.strokeWeight = 1;
        hcCard.paddingLeft = 24;
        hcCard.paddingRight = 16;
        hcCard.paddingTop = 20;
        hcCard.paddingBottom = 20;
        hcCard.primaryAxisAlignItems = "SPACE_BETWEEN";
        hcCard.counterAxisAlignItems = "CENTER";

        const hcInfo = figma.createFrame();
        hcInfo.layoutMode = "VERTICAL";
        hcInfo.itemSpacing = 8;
        hcInfo.resize(220, 140);
        hcInfo.fills = [];

        const countChip = figma.createFrame();
        countChip.paddingLeft = 8;
        countChip.paddingRight = 8;
        countChip.paddingTop = 3;
        countChip.paddingBottom = 3;
        countChip.cornerRadius = 4;
        countChip.fills = createSolidFill(C.royalBlueSoft);
        const countTxt = await createText(hc.count, FONT_SEMI, 10.5, C.royalBlue);
        countChip.appendChild(countTxt);
        hcInfo.appendChild(countChip);

        const hTitle = await createText(hc.name, FONT_HEAD, 19, C.navyDark);
        const hSub = await createText(hc.sub, FONT_REG, 13, C.slateBody, { lineHeight: 18 });
        const hCta = await createText("Shop Category →", FONT_SEMI, 13, C.navyDark);
        hcInfo.appendChild(hTitle);
        hcInfo.appendChild(hSub);
        hcInfo.appendChild(hCta);
        hcCard.appendChild(hcInfo);

        // Thumbnail
        const hcThumb = figma.createFrame();
        hcThumb.resize(130, 130);
        hcThumb.cornerRadius = 12;
        hcThumb.fills = createImageFill(hc.hash, "FIT");
        hcCard.appendChild(hcThumb);

        topHeroCats.appendChild(hcCard);
      }
      catSection.appendChild(topHeroCats);

      // Remaining Categories Grid (14 items in 2 rows of 7)
      const allCatGrid = figma.createFrame();
      allCatGrid.name = "All Categories Grid";
      allCatGrid.layoutMode = "VERTICAL";
      allCatGrid.resize(1280, 420);
      allCatGrid.itemSpacing = 16;
      allCatGrid.fills = [];

      const remainingCats = [
        { name: "Barware", hash: "3b74d769fa02497a9f99e8d356fae459db4b94f1" },
        { name: "Bluetooth Speakers", hash: "ea9172b0c360c4bc566ff7382d62d29ba42c8d23" },
        { name: "Business Card Cases", hash: "3c358a04e40c80a00aa887885fda3efde8045c69" },
        { name: "Closeout Items", hash: "078f34bebf761a2fb6e4693a1197779f4c022f46" },
        { name: "Custom Packaging", hash: "5c30b2184f9ea933e46c764e43343fc08a8f8e02" },
        { name: "Electronics", hash: "428b737e954fa168a2ee34b2cf61a3ba377a0ba1" },
        { name: "Journals & Jotters", hash: "b729c0ea4ef0c99fbb343468dd5cfad89d4fb9f8" },
        { name: "Jr. Padfolios", hash: "79ad0b9048a1c97bc0999aa7cb3503aa35147fb3" },
        { name: "Luggage Tags", hash: "1df6e03e911244e8a1563f15c7e7b68aa4a053c8" },
        { name: "Metal Pens", hash: "6c22fd29074a3f12445107e3240e53a7a9228965" },
        { name: "Mobile Xessories", hash: "fbb79119eb45155f9aee96a66793bb6c4db61872" },
        { name: "Novelties", hash: "15db170b2260ff0a9693eb7794354cfa5bbd338a" },
        { name: "Stylus Pens", hash: "be9659248740c02c6767eb3ff305d233e5dd34f7" },
        { name: "Tote Bags", hash: "107246607ea7dc67027389146522c070c897f1f0" }
      ];

      // Row 1
      const catRow1 = figma.createFrame();
      catRow1.layoutMode = "HORIZONTAL";
      catRow1.resize(1280, 190);
      catRow1.itemSpacing = 14;
      catRow1.fills = [];

      // Row 2
      const catRow2 = figma.createFrame();
      catRow2.layoutMode = "HORIZONTAL";
      catRow2.resize(1280, 190);
      catRow2.itemSpacing = 14;
      catRow2.fills = [];

      for (let i = 0; i < remainingCats.length; i++) {
        const cat = remainingCats[i];
        const card = figma.createFrame();
        card.layoutMode = "VERTICAL";
        card.resize(170, 190);
        card.cornerRadius = 12;
        card.fills = createSolidFill(C.white);
        card.strokes = createStroke(C.borderSoft).strokes;
        card.strokeWeight = 1;
        card.paddingTop = 14;
        card.paddingBottom = 14;
        card.paddingLeft = 12;
        card.paddingRight = 12;
        card.primaryAxisAlignItems = "SPACE_BETWEEN";
        card.counterAxisAlignItems = "CENTER";

        const imgBox = figma.createFrame();
        imgBox.resize(110, 110);
        imgBox.cornerRadius = 8;
        imgBox.fills = createImageFill(cat.hash, "FIT");
        card.appendChild(imgBox);

        const nameTxt = await createText(cat.name, FONT_SEMI, 13, C.navyDark);
        nameTxt.textAlignHorizontal = "CENTER";
        card.appendChild(nameTxt);

        if (i < 7) {
          catRow1.appendChild(card);
        } else {
          catRow2.appendChild(card);
        }
      }
      allCatGrid.appendChild(catRow1);
      allCatGrid.appendChild(catRow2);
      catSection.appendChild(allCatGrid);

      root.appendChild(catSection);

      // ==========================================
      // SECTION 8: FEATURED PRODUCTS & TOP SELLERS
      // ==========================================
      const featuredSec = figma.createFrame();
      featuredSec.name = "08 Featured Products Showcase";
      featuredSec.layoutMode = "VERTICAL";
      featuredSec.resize(1440, 1020);
      featuredSec.counterAxisSizingMode = "FIXED";
      featuredSec.primaryAxisSizingMode = "FIXED";
      featuredSec.layoutAlign = "STRETCH";
      featuredSec.fills = createSolidFill(C.white);
      featuredSec.paddingLeft = 80;
      featuredSec.paddingRight = 80;
      featuredSec.paddingTop = 50;
      featuredSec.paddingBottom = 50;
      featuredSec.itemSpacing = 28;

      // Header with filters & pagination
      const featHead = figma.createFrame();
      featHead.layoutMode = "HORIZONTAL";
      featHead.resize(1280, 44);
      featHead.primaryAxisAlignItems = "SPACE_BETWEEN";
      featHead.counterAxisAlignItems = "CENTER";
      featHead.fills = [];

      const featTitleGroup = figma.createFrame();
      featTitleGroup.layoutMode = "HORIZONTAL";
      featTitleGroup.itemSpacing = 12;
      featTitleGroup.counterAxisAlignItems = "CENTER";
      featTitleGroup.fills = [];
      const featTitle = await createText("Featured products", FONT_HEAD, 28, C.navyDark);
      const featBadge = figma.createFrame();
      featBadge.paddingLeft = 8;
      featBadge.paddingRight = 8;
      featBadge.paddingTop = 3;
      featBadge.paddingBottom = 3;
      featBadge.cornerRadius = 4;
      featBadge.fills = createSolidFill(C.royalBlueSoft);
      const featBadgeTxt = await createText("DISTRIBUTOR TOP PICKS", FONT_HEAD, 10, C.royalBlue);
      featBadge.appendChild(featBadgeTxt);
      featTitleGroup.appendChild(featTitle);
      featTitleGroup.appendChild(featBadge);
      featHead.appendChild(featTitleGroup);

      // Filter tabs + navigation arrows
      const featControls = figma.createFrame();
      featControls.layoutMode = "HORIZONTAL";
      featControls.itemSpacing = 16;
      featControls.counterAxisAlignItems = "CENTER";
      featControls.fills = [];

      const arrowsGroup = figma.createFrame();
      arrowsGroup.layoutMode = "HORIZONTAL";
      arrowsGroup.itemSpacing = 8;
      arrowsGroup.fills = [];
      const leftArrow = figma.createFrame();
      leftArrow.resize(36, 36);
      leftArrow.cornerRadius = 18;
      leftArrow.fills = createSolidFill(C.bgIce);
      leftArrow.strokes = createStroke(C.borderSoft).strokes;
      leftArrow.strokeWeight = 1;
      leftArrow.layoutMode = "HORIZONTAL";
      leftArrow.primaryAxisAlignItems = "CENTER";
      leftArrow.counterAxisAlignItems = "CENTER";
      const lArrTxt = await createText("←", FONT_HEAD, 14, C.slateDark);
      leftArrow.appendChild(lArrTxt);
      arrowsGroup.appendChild(leftArrow);

      const rightArrow = figma.createFrame();
      rightArrow.resize(36, 36);
      rightArrow.cornerRadius = 18;
      rightArrow.fills = createSolidFill(C.navyDark);
      rightArrow.layoutMode = "HORIZONTAL";
      rightArrow.primaryAxisAlignItems = "CENTER";
      rightArrow.counterAxisAlignItems = "CENTER";
      const rArrTxt = await createText("→", FONT_HEAD, 14, C.white);
      rightArrow.appendChild(rArrTxt);
      arrowsGroup.appendChild(rightArrow);

      featControls.appendChild(arrowsGroup);
      featHead.appendChild(featControls);
      featuredSec.appendChild(featHead);

      // Featured Products Grid (6 Cards, 3 x 2)
      const featGrid = figma.createFrame();
      featGrid.name = "Featured Products Grid (3x2)";
      featGrid.layoutMode = "VERTICAL";
      featGrid.resize(1280, 840);
      featGrid.itemSpacing = 24;
      featGrid.fills = [];

      const featProducts = [
        {
          name: "Pro Series | Elite TPU Leather Business Card Holder",
          sku: "SKU TX-2107",
          price: "$8.98 to $11.50 each",
          hash: "3c358a04e40c80a00aa887885fda3efde8045c69",
          badge: "Bestseller"
        },
        {
          name: "Elite RFID Card Holder Wallet",
          sku: "SKU TX-2207",
          price: "$8.98 to $11.03 each",
          hash: "d037801c046eefff34f019153a9ea91baffec9bb",
          badge: "RFID Protected"
        },
        {
          name: "Oceanside Key Chain",
          sku: "SKU TX-8810",
          price: "$4.18 to $5.13 each",
          hash: "a24cc640c63753fe99f2489e131fdecef5f18b57",
          badge: "Laser Engraved"
        },
        {
          name: "Sweethome Key Chain",
          sku: "SKU TX-916958",
          price: "$3.88 to $4.97 each",
          hash: "2ad78b5fd5576d2b595c6a12360f0b2a57be09f8",
          badge: "High Volume"
        },
        {
          name: "Madison 4000 mAh Slim Power Bank",
          sku: "SKU EX-8067",
          price: "$9.98 to $9.98 each",
          hash: "c78217a11b2e09bc3fef325a7db3a2c2c09e71ee",
          badge: "UL Certified"
        },
        {
          name: "Summit 32oz Double Wall Vacuum Insulated 18/8",
          sku: "SKU DW-8966",
          price: "$10.28 to $12.62 each",
          hash: "c6841f4ff6daccda73c1f36dd03a50a757133582",
          badge: "Pro Grade 18/8"
        }
      ];

      const fRow1 = figma.createFrame();
      fRow1.layoutMode = "HORIZONTAL";
      fRow1.resize(1280, 396);
      fRow1.itemSpacing = 20;
      fRow1.fills = [];

      const fRow2 = figma.createFrame();
      fRow2.layoutMode = "HORIZONTAL";
      fRow2.resize(1280, 396);
      fRow2.itemSpacing = 20;
      fRow2.fills = [];

      for (let i = 0; i < featProducts.length; i++) {
        const p = featProducts[i];
        const card = figma.createFrame();
        card.name = "Product Card / " + p.sku;
        card.layoutMode = "VERTICAL";
        card.resize(413, 396);
        card.cornerRadius = 14;
        card.fills = createSolidFill(C.white);
        card.strokes = createStroke(C.borderSoft).strokes;
        card.strokeWeight = 1;
        card.paddingTop = 16;
        card.paddingBottom = 16;
        card.paddingLeft = 16;
        card.paddingRight = 16;
        card.itemSpacing = 12;

        // Image Container
        const imgBox = figma.createFrame();
        imgBox.resize(381, 190);
        imgBox.cornerRadius = 10;
        imgBox.fills = createImageFill(p.hash, "FIT");
        imgBox.paddingLeft = 10;
        imgBox.paddingTop = 10;

        // Tag chip
        const tagChip = figma.createFrame();
        tagChip.paddingLeft = 8;
        tagChip.paddingRight = 8;
        tagChip.paddingTop = 3;
        tagChip.paddingBottom = 3;
        tagChip.cornerRadius = 4;
        tagChip.fills = createSolidFill(C.navyDark);
        const tagTxt = await createText(p.badge, FONT_SEMI, 10.5, C.white);
        tagChip.appendChild(tagTxt);
        imgBox.appendChild(tagChip);
        card.appendChild(imgBox);

        // Product SKU & Category
        const metaRow = figma.createFrame();
        metaRow.layoutMode = "HORIZONTAL";
        metaRow.itemSpacing = 8;
        metaRow.counterAxisAlignItems = "CENTER";
        metaRow.fills = [];
        const skuTxt = await createText(p.sku, FONT_SEMI, 12, C.royalBlue);
        metaRow.appendChild(skuTxt);
        card.appendChild(metaRow);

        // Product Name
        const nameTxt = await createText(p.name, FONT_HEAD, 15, C.navyDark, { lineHeight: 20 });
        card.appendChild(nameTxt);

        // Pricing Info
        const priceRow = figma.createFrame();
        priceRow.layoutMode = "HORIZONTAL";
        priceRow.itemSpacing = 8;
        priceRow.counterAxisAlignItems = "BASELINE";
        priceRow.fills = [];
        const priceTxt = await createText(p.price, FONT_HEAD, 15.5, C.green);
        const breakTxt = await createText("✓ Breaks by qty", FONT_MED, 11.5, C.slateMuted);
        priceRow.appendChild(priceTxt);
        priceRow.appendChild(breakTxt);
        card.appendChild(priceRow);

        // Action Row
        const actRow = figma.createFrame();
        actRow.layoutMode = "HORIZONTAL";
        actRow.itemSpacing = 10;
        actRow.counterAxisAlignItems = "CENTER";
        actRow.fills = [];

        // Quantity Stepper
        const qtyStepper = figma.createFrame();
        qtyStepper.layoutMode = "HORIZONTAL";
        qtyStepper.paddingLeft = 10;
        qtyStepper.paddingRight = 10;
        qtyStepper.paddingTop = 8;
        qtyStepper.paddingBottom = 8;
        qtyStepper.cornerRadius = 6;
        qtyStepper.fills = createSolidFill(C.bgIce);
        qtyStepper.strokes = createStroke(C.borderSoft).strokes;
        qtyStepper.strokeWeight = 1;
        qtyStepper.itemSpacing = 12;
        const qMinus = await createText("-", FONT_SEMI, 12, C.slateMuted);
        const qVal = await createText("100", FONT_SEMI, 13, C.slateDark);
        const qPlus = await createText("+", FONT_SEMI, 12, C.slateMuted);
        qtyStepper.appendChild(qMinus);
        qtyStepper.appendChild(qVal);
        qtyStepper.appendChild(qPlus);
        actRow.appendChild(qtyStepper);

        // Add to Quote CTA
        const quoteBtn = figma.createFrame();
        quoteBtn.layoutMode = "HORIZONTAL";
        quoteBtn.paddingLeft = 16;
        quoteBtn.paddingRight = 16;
        quoteBtn.paddingTop = 9;
        quoteBtn.paddingBottom = 9;
        quoteBtn.cornerRadius = 6;
        quoteBtn.fills = createSolidFill(C.navyDark);
        quoteBtn.layoutGrow = 1;
        quoteBtn.primaryAxisAlignItems = "CENTER";
        const quoteBtnTxt = await createText("Add to quote", FONT_SEMI, 13, C.white);
        quoteBtn.appendChild(quoteBtnTxt);
        actRow.appendChild(quoteBtn);

        card.appendChild(actRow);

        // View details link
        const detailsLink = await createText("View product details →", FONT_SEMI, 12, C.royalBlue);
        card.appendChild(detailsLink);

        if (i < 3) {
          fRow1.appendChild(card);
        } else {
          fRow2.appendChild(card);
        }
      }
      featGrid.appendChild(fRow1);
      featGrid.appendChild(fRow2);
      featuredSec.appendChild(featGrid);

      root.appendChild(featuredSec);

      // ==========================================
      // SECTION 9: PROMOTIONAL COLLECTIONS (SPLIT BANNERS)
      // ==========================================
      const promoSec = figma.createFrame();
      promoSec.name = "09 Promotional Collections Banners";
      promoSec.layoutMode = "VERTICAL";
      promoSec.resize(1440, 360);
      promoSec.counterAxisSizingMode = "FIXED";
      promoSec.primaryAxisSizingMode = "FIXED";
      promoSec.layoutAlign = "STRETCH";
      promoSec.fills = createSolidFill(C.bgWarm);
      promoSec.paddingLeft = 80;
      promoSec.paddingRight = 80;
      promoSec.paddingTop = 40;
      promoSec.paddingBottom = 40;
      promoSec.itemSpacing = 20;

      // Section Header
      const promoHead = figma.createFrame();
      promoHead.layoutMode = "HORIZONTAL";
      promoHead.itemSpacing = 12;
      promoHead.counterAxisAlignItems = "CENTER";
      promoHead.fills = [];
      const promoTitle = await createText("Promotional collections", FONT_HEAD, 26, C.navyDark);
      const promoBadge = figma.createFrame();
      promoBadge.paddingLeft = 6;
      promoBadge.paddingRight = 6;
      promoBadge.paddingTop = 2;
      promoBadge.paddingBottom = 2;
      promoBadge.cornerRadius = 4;
      promoBadge.fills = createSolidFill(C.royalBlueSoft);
      const promoBadgeTxt = await createText("CURATED THEMES", FONT_HEAD, 10, C.royalBlue);
      promoBadge.appendChild(promoBadgeTxt);
      promoHead.appendChild(promoTitle);
      promoHead.appendChild(promoBadge);
      promoSec.appendChild(promoHead);

      // 2 Wide Split Banners
      const bannersGroup = figma.createFrame();
      bannersGroup.layoutMode = "HORIZONTAL";
      bannersGroup.resize(1280, 220);
      bannersGroup.itemSpacing = 24;
      bannersGroup.fills = [];

      // Banner 1: Travel Essentials
      const b1 = figma.createFrame();
      b1.layoutMode = "VERTICAL";
      b1.resize(628, 220);
      b1.cornerRadius = 16;
      b1.fills = createImageFill("007bffdcddbf3c09191d96b997c458d927a77e5e", "FILL");
      b1.paddingLeft = 32;
      b1.paddingRight = 32;
      b1.paddingTop = 32;
      b1.paddingBottom = 32;
      b1.primaryAxisAlignItems = "SPACE_BETWEEN";

      const b1Top = figma.createFrame();
      b1Top.layoutMode = "VERTICAL";
      b1Top.itemSpacing = 6;
      b1Top.fills = [];
      const b1Eyebrow = await createText("EXECUTIVE ON-THE-GO", FONT_HEAD, 11, C.white, { letterSpacing: 4 });
      const b1Title = await createText("Travel essentials", FONT_HEAD, 26, C.white);
      const b1Sub = await createText("Luggage tags, organisers and durable carry gear.", FONT_MED, 14, C.white);
      b1Top.appendChild(b1Eyebrow);
      b1Top.appendChild(b1Title);
      b1Top.appendChild(b1Sub);
      b1.appendChild(b1Top);

      const b1Btn = figma.createFrame();
      b1Btn.layoutMode = "HORIZONTAL";
      b1Btn.paddingLeft = 16;
      b1Btn.paddingRight = 16;
      b1Btn.paddingTop = 8;
      b1Btn.paddingBottom = 8;
      b1Btn.cornerRadius = 6;
      b1Btn.fills = createSolidFill(C.white);
      const b1BtnTxt = await createText("Shop travel →", FONT_SEMI, 13, C.navyDark);
      b1Btn.appendChild(b1BtnTxt);
      b1.appendChild(b1BtnBtn = b1Btn);
      bannersGroup.appendChild(b1);

      // Banner 2: Small gifts, big reach
      const b2 = figma.createFrame();
      b2.layoutMode = "VERTICAL";
      b2.resize(628, 220);
      b2.cornerRadius = 16;
      b2.fills = createImageFill("13127cfc1eec4f8c40df141d408ebc4a8564070a", "FILL");
      b2.paddingLeft = 32;
      b2.paddingRight = 32;
      b2.paddingTop = 32;
      b2.paddingBottom = 32;
      b2.primaryAxisAlignItems = "SPACE_BETWEEN";

      const b2Top = figma.createFrame();
      b2Top.layoutMode = "VERTICAL";
      b2Top.itemSpacing = 6;
      b2Top.fills = [];
      const b2Eyebrow = await createText("HIGH VOLUME / TRADE SHOWS", FONT_HEAD, 11, C.white, { letterSpacing: 4 });
      const b2Title = await createText("Small gifts, big reach", FONT_HEAD, 26, C.white);
      const b2Sub = await createText("Key chains and novelties at low price points for maximum ROI.", FONT_MED, 14, C.white);
      b2Top.appendChild(b2Eyebrow);
      b2Top.appendChild(b2Title);
      b2Top.appendChild(b2Sub);
      b2.appendChild(b2Top);

      const b2Btn = figma.createFrame();
      b2Btn.layoutMode = "HORIZONTAL";
      b2Btn.paddingLeft = 16;
      b2Btn.paddingRight = 16;
      b2Btn.paddingTop = 8;
      b2Btn.paddingBottom = 8;
      b2Btn.cornerRadius = 6;
      b2Btn.fills = createSolidFill(C.white);
      const b2BtnTxt = await createText("Shop novelties →", FONT_SEMI, 13, C.navyDark);
      b2Btn.appendChild(b2BtnTxt);
      b2.appendChild(b2Btn);
      bannersGroup.appendChild(b2);

      promoSec.appendChild(bannersGroup);
      root.appendChild(promoSec);

      // ==========================================
      // SECTION 10: COMPLETE PRODUCT CATALOG GRID (21 REMAINING PRODUCTS)
      // ==========================================
      const catalogSec = figma.createFrame();
      catalogSec.name = "10 Full Product Catalog Grid";
      catalogSec.layoutMode = "VERTICAL";
      catalogSec.resize(1440, 1850);
      catalogSec.counterAxisSizingMode = "FIXED";
      catalogSec.primaryAxisSizingMode = "FIXED";
      catalogSec.layoutAlign = "STRETCH";
      catalogSec.fills = createSolidFill(C.white);
      catalogSec.paddingLeft = 80;
      catalogSec.paddingRight = 80;
      catalogSec.paddingTop = 50;
      catalogSec.paddingBottom = 50;
      catalogSec.itemSpacing = 28;

      // Header with filter chips
      const catSecHead = figma.createFrame();
      catSecHead.layoutMode = "HORIZONTAL";
      catSecHead.resize(1280, 48);
      catSecHead.primaryAxisAlignItems = "SPACE_BETWEEN";
      catSecHead.counterAxisAlignItems = "CENTER";
      catSecHead.fills = [];

      const catSecTitleGroup = figma.createFrame();
      catSecTitleGroup.layoutMode = "HORIZONTAL";
      catSecTitleGroup.itemSpacing = 14;
      catSecTitleGroup.counterAxisAlignItems = "CENTER";
      catSecTitleGroup.fills = [];
      const catSecTitle = await createText("All products", FONT_HEAD, 28, C.navyDark);
      const catSecCount = figma.createFrame();
      catSecCount.paddingLeft = 10;
      catSecCount.paddingRight = 10;
      catSecCount.paddingTop = 4;
      catSecCount.paddingBottom = 4;
      catSecCount.cornerRadius = 6;
      catSecCount.fills = createSolidFill(C.bgIce);
      catSecCount.strokes = createStroke(C.borderSoft).strokes;
      catSecCount.strokeWeight = 1;
      const countLabel = await createText("27 products in catalog", FONT_SEMI, 12, C.slateBody);
      catSecCount.appendChild(countLabel);
      catSecTitleGroup.appendChild(catSecTitle);
      catSecTitleGroup.appendChild(catSecCount);
      catSecHead.appendChild(catSecTitleGroup);

      // Filter toggles
      const filterToggles = figma.createFrame();
      filterToggles.layoutMode = "HORIZONTAL";
      filterToggles.itemSpacing = 12;
      filterToggles.counterAxisAlignItems = "CENTER";
      filterToggles.fills = [];

      const f1 = await createText("Show items with listed pricing", FONT_MED, 13, C.slateDark);
      const f2 = await createText("• Featured only", FONT_MED, 13, C.slateDark);
      const fClear = await createText("Clear all filters", FONT_SEMI, 13, C.royalBlue);
      filterToggles.appendChild(f1);
      filterToggles.appendChild(f2);
      filterToggles.appendChild(fClear);
      catSecHead.appendChild(filterToggles);

      catalogSec.appendChild(catSecHead);

      // Catalog Notice Note
      const noteBox = figma.createFrame();
      noteBox.resize(1280, 44);
      noteBox.cornerRadius = 8;
      noteBox.fills = createSolidFill(C.bgIce);
      noteBox.paddingLeft = 16;
      noteBox.paddingRight = 16;
      noteBox.layoutMode = "HORIZONTAL";
      noteBox.counterAxisAlignItems = "CENTER";
      const noteTxt = await createText(
        "Priced items (TX-2107, TX-2207, TX-8810, TX-916958, EX-8067, DW-8966) use figures from the live site. Other catalog items show decoration pricing on product page.",
        FONT_REG, 12.5, C.slateBody
      );
      noteBox.appendChild(noteTxt);
      catalogSec.appendChild(noteBox);

      // 21 Remaining Catalog Products in 4 Columns
      const catalog21 = [
        { name: "Straw tumblers", cat: "Drinkware", hash: "2ed0f4607d2b4f55986b0c04fb60665ff1368772" },
        { name: "Cork-base mugs", cat: "Drinkware", hash: "3a8cfd7c9c53d49da4f6e6493c2859370e07f1a9" },
        { name: "Insulated sport bottles", cat: "Drinkware", hash: "ee8e280a84ef3debeb6b81932d83859518649fe6" },
        { name: "Stainless water bottles", cat: "Drinkware", hash: "8c2c86ff168e10d0684e0887a1dc38a568e4aea4" },
        { name: "Wine tumblers", cat: "Drinkware", hash: "62212da36e9ff935f8db9f969eb2ecb822d66eb7" },
        { name: "Soft-cover journals", cat: "Journals & Jotters", hash: "f2f559ac9fcfb20f4c8e762c668cb77854652285" },
        { name: "Debossed journals", cat: "Journals & Jotters", hash: "b729c0ea4ef0c99fbb343468dd5cfad89d4fb9f8" },
        { name: "Leather padfolios", cat: "Padfolios", hash: "9b83431c944fca8c44dc1864e29cb1fe9dafe4bb" },
        { name: "Jr. padfolios", cat: "Jr. Padfolios", hash: "79ad0b9048a1c97bc0999aa7cb3503aa35147fb3" },
        { name: "Metal pens", cat: "Metal Pens", hash: "6c22fd29074a3f12445107e3240e53a7a9228965" },
        { name: "Stylus pens", cat: "Stylus Pens", hash: "be9659248740c02c6767eb3ff305d233e5dd34f7" },
        { name: "Branded power banks", cat: "Power Banks", hash: "182cdeb6f7ef0ee76b5c2d308f7fb9807a04910b" },
        { name: "Bluetooth speakers", cat: "Bluetooth Speakers", hash: "515b6df1e155bc8f509311394c86cb32cfcb13ad" },
        { name: "Tote bags", cat: "Tote Bags", hash: "107246607ea7dc67027389146522c070c897f1f0" },
        { name: "Luggage tags", cat: "Luggage Tags", hash: "1df6e03e911244e8a1563f15c7e7b68aa4a053c8" },
        { name: "Leatherette coasters", cat: "Barware", hash: "3b74d769fa02497a9f99e8d356fae459db4b94f1" },
        { name: "Charging cables", cat: "Mobile Xessories", hash: "fbb79119eb45155f9aee96a66793bb6c4db61872" },
        { name: "Pet waste bag holders", cat: "Novelties", hash: "15db170b2260ff0a9693eb7794354cfa5bbd338a" },
        { name: "Glass scale", cat: "Electronics", hash: "428b737e954fa168a2ee34b2cf61a3ba377a0ba1" },
        { name: "Closeout assortment", cat: "Closeout Items", hash: "078f34bebf761a2fb6e4693a1197779f4c022f46" },
        { name: "Gift boxes", cat: "Custom Packaging", hash: "5c30b2184f9ea933e46c764e43343fc08a8f8e02" }
      ];

      const catRowsContainer = figma.createFrame();
      catRowsContainer.layoutMode = "VERTICAL";
      catRowsContainer.resize(1280, 1600);
      catRowsContainer.itemSpacing = 20;
      catRowsContainer.fills = [];

      for (let r = 0; r < catalog21.length; r += 4) {
        const rowSlice = catalog21.slice(r, r + 4);
        const gridRow = figma.createFrame();
        gridRow.layoutMode = "HORIZONTAL";
        gridRow.resize(1280, 280);
        gridRow.itemSpacing = 20;
        gridRow.fills = [];

        for (const item of rowSlice) {
          const itemCard = figma.createFrame();
          itemCard.layoutMode = "VERTICAL";
          itemCard.resize(305, 280);
          itemCard.cornerRadius = 12;
          itemCard.fills = createSolidFill(C.white);
          itemCard.strokes = createStroke(C.borderSoft).strokes;
          itemCard.strokeWeight = 1;
          itemCard.paddingLeft = 14;
          itemCard.paddingRight = 14;
          itemCard.paddingTop = 14;
          itemCard.paddingBottom = 14;
          itemCard.itemSpacing = 8;

          const pThumb = figma.createFrame();
          pThumb.resize(277, 130);
          pThumb.cornerRadius = 8;
          pThumb.fills = createImageFill(item.hash, "FIT");
          itemCard.appendChild(pThumb);

          const catTag = await createText(item.cat, FONT_SEMI, 11, C.royalBlue);
          itemCard.appendChild(catTag);

          const titleTag = await createText(item.name, FONT_HEAD, 14, C.navyDark);
          itemCard.appendChild(titleTag);

          const priceNote = await createText("Pricing on product page", FONT_MED, 12, C.slateMuted);
          itemCard.appendChild(priceNote);

          const actBtn = figma.createFrame();
          actBtn.layoutMode = "HORIZONTAL";
          actBtn.paddingLeft = 12;
          actBtn.paddingRight = 12;
          actBtn.paddingTop = 6;
          actBtn.paddingBottom = 6;
          actBtn.cornerRadius = 6;
          actBtn.fills = createSolidFill(C.bgIce);
          actBtn.strokes = createStroke(C.borderSoft).strokes;
          actBtn.strokeWeight = 1;
          actBtn.primaryAxisAlignItems = "CENTER";
          actBtn.layoutAlign = "STRETCH";
          const actTxt = await createText("View details / Quote", FONT_SEMI, 12, C.navyDark);
          actBtn.appendChild(actTxt);
          itemCard.appendChild(actBtn);

          gridRow.appendChild(itemCard);
        }
        catRowsContainer.appendChild(gridRow);
      }
      catalogSec.appendChild(catRowsContainer);
      root.appendChild(catalogSec);

      // ==========================================
      // SECTION 11: SHOP BY INDUSTRY SOLUTIONS
      // ==========================================
      const industrySec = figma.createFrame();
      industrySec.name = "11 Shop by Industry Solutions";
      industrySec.layoutMode = "VERTICAL";
      industrySec.resize(1440, 560);
      industrySec.counterAxisSizingMode = "FIXED";
      industrySec.primaryAxisSizingMode = "FIXED";
      industrySec.layoutAlign = "STRETCH";
      industrySec.fills = createSolidFill(C.bgIce);
      industrySec.paddingLeft = 80;
      industrySec.paddingRight = 80;
      industrySec.paddingTop = 48;
      industrySec.paddingBottom = 48;
      industrySec.itemSpacing = 24;

      // Header
      const indHead = figma.createFrame();
      indHead.layoutMode = "HORIZONTAL";
      indHead.itemSpacing = 12;
      indHead.counterAxisAlignItems = "CENTER";
      indHead.fills = [];
      const indTitle = await createText("Shop by industry", FONT_HEAD, 28, C.navyDark);
      const indBadge = figma.createFrame();
      indBadge.paddingLeft = 8;
      indBadge.paddingRight = 8;
      indBadge.paddingTop = 3;
      indBadge.paddingBottom = 3;
      indBadge.cornerRadius = 4;
      indBadge.fills = createSolidFill(C.royalBlueSoft);
      const indBadgeTxt = await createText("TAILORED INDUSTRY PACKAGES", FONT_HEAD, 10, C.royalBlue);
      indBadge.appendChild(indBadgeTxt);
      indHead.appendChild(indTitle);
      indHead.appendChild(indBadge);
      industrySec.appendChild(indHead);

      // 8 Industry Cards (2 rows of 4)
      const indGrid = figma.createFrame();
      indGrid.name = "Industry Cards Matrix";
      indGrid.layoutMode = "VERTICAL";
      indGrid.resize(1280, 400);
      indGrid.itemSpacing = 18;
      indGrid.fills = [];

      const industries = [
        {
          name: "Corporate gifting",
          tags: ["Journals & Jotters", "Drinkware", "Padfolios"],
          icon: "💼"
        },
        {
          name: "Education",
          tags: ["Tote Bags", "Stylus Pens", "Drinkware"],
          icon: "🎓"
        },
        {
          name: "Healthcare",
          tags: ["Metal Pens", "Tote Bags", "Power Banks"],
          icon: "🏥"
        },
        {
          name: "Financial",
          tags: ["Padfolios", "Business Card Cases", "Metal Pens"],
          icon: "🏦"
        },
        {
          name: "Hospitality",
          tags: ["Luggage Tags", "Travel Xessories", "Drinkware"],
          icon: "🛎️"
        },
        {
          name: "Events and trade shows",
          tags: ["Tote Bags", "Mobile Xessories", "Luggage Tags"],
          icon: "🎪"
        },
        {
          name: "Non-profit",
          tags: ["Tote Bags", "Novelties", "Drinkware"],
          icon: "🤝"
        },
        {
          name: "Technology",
          tags: ["Power Banks", "Mobile Xessories", "Bluetooth Speakers"],
          icon: "⚡"
        }
      ];

      const indRow1 = figma.createFrame();
      indRow1.layoutMode = "HORIZONTAL";
      indRow1.resize(1280, 185);
      indRow1.itemSpacing = 20;
      indRow1.fills = [];

      const indRow2 = figma.createFrame();
      indRow2.layoutMode = "HORIZONTAL";
      indRow2.resize(1280, 185);
      indRow2.itemSpacing = 20;
      indRow2.fills = [];

      for (let i = 0; i < industries.length; i++) {
        const ind = industries[i];
        const card = figma.createFrame();
        card.layoutMode = "VERTICAL";
        card.resize(305, 185);
        card.cornerRadius = 12;
        card.fills = createSolidFill(C.white);
        card.strokes = createStroke(C.borderSoft).strokes;
        card.strokeWeight = 1;
        card.paddingLeft = 20;
        card.paddingRight = 20;
        card.paddingTop = 18;
        card.paddingBottom = 18;
        card.itemSpacing = 12;

        const iconTitle = figma.createFrame();
        iconTitle.layoutMode = "HORIZONTAL";
        iconTitle.itemSpacing = 10;
        iconTitle.counterAxisAlignItems = "CENTER";
        iconTitle.fills = [];
        const iIcon = await createText(ind.icon, FONT_REG, 18, C.navyDark);
        const iTitle = await createText(ind.name, FONT_HEAD, 16, C.navyDark);
        iconTitle.appendChild(iIcon);
        iconTitle.appendChild(iTitle);
        card.appendChild(iconTitle);

        // Tag Pills
        const tagsBox = figma.createFrame();
        tagsBox.layoutMode = "VERTICAL";
        tagsBox.itemSpacing = 6;
        tagsBox.fills = [];

        for (const t of ind.tags) {
          const pill = figma.createFrame();
          pill.layoutMode = "HORIZONTAL";
          pill.paddingLeft = 8;
          pill.paddingRight = 8;
          pill.paddingTop = 3;
          pill.paddingBottom = 3;
          pill.cornerRadius = 4;
          pill.fills = createSolidFill(C.bgIce);
          const pillTxt = await createText("• " + t, FONT_MED, 12, C.slateBody);
          pill.appendChild(pillTxt);
          tagsBox.appendChild(pill);
        }
        card.appendChild(tagsBox);

        if (i < 4) indRow1.appendChild(card);
        else indRow2.appendChild(card);
      }
      indGrid.appendChild(indRow1);
      indGrid.appendChild(indRow2);
      industrySec.appendChild(indGrid);

      root.appendChild(industrySec);

      // ==========================================
      // SECTION 12: DISTRIBUTOR PORTAL CALLOUT BANNER
      // ==========================================
      const portalSec = figma.createFrame();
      portalSec.name = "12 Distributor Portal Callout";
      portalSec.layoutMode = "VERTICAL";
      portalSec.resize(1440, 220);
      portalSec.counterAxisSizingMode = "FIXED";
      portalSec.primaryAxisSizingMode = "FIXED";
      portalSec.layoutAlign = "STRETCH";
      portalSec.fills = createSolidFill(C.white);
      portalSec.paddingLeft = 80;
      portalSec.paddingRight = 80;
      portalSec.paddingTop = 30;
      portalSec.paddingBottom = 30;
      portalSec.primaryAxisAlignItems = "CENTER";

      const portalCard = figma.createFrame();
      portalCard.name = "Portal Card";
      portalCard.layoutMode = "HORIZONTAL";
      portalCard.resize(1280, 160);
      portalCard.cornerRadius = 16;
      portalCard.fills = createSolidFill(C.navyDark);
      portalCard.paddingLeft = 40;
      portalCard.paddingRight = 40;
      portalCard.paddingTop = 30;
      portalCard.paddingBottom = 30;
      portalCard.primaryAxisAlignItems = "SPACE_BETWEEN";
      portalCard.counterAxisAlignItems = "CENTER";

      const portalLeft = figma.createFrame();
      portalLeft.layoutMode = "VERTICAL";
      portalLeft.itemSpacing = 8;
      portalLeft.resize(700, 100);
      portalLeft.fills = [];

      const pTitle = await createText(
        "Distributors: log in for your pricing.",
        FONT_HEAD, 26, C.white
      );
      const pSub = await createText(
        "Track orders, reorder faster and manage your quotes. New here? Register to get started with instant access to distributor tools.",
        FONT_REG, 14.5, { r: 0.82, g: 0.88, b: 0.95 }, { lineHeight: 22 }
      );
      portalLeft.appendChild(pTitle);
      portalLeft.appendChild(pSub);
      portalCard.appendChild(portalLeft);

      const portalRight = figma.createFrame();
      portalRight.layoutMode = "HORIZONTAL";
      portalRight.itemSpacing = 14;
      portalRight.counterAxisAlignItems = "CENTER";
      portalRight.fills = [];

      const distLoginBtn = figma.createFrame();
      distLoginBtn.layoutMode = "HORIZONTAL";
      distLoginBtn.paddingLeft = 24;
      distLoginBtn.paddingRight = 24;
      distLoginBtn.paddingTop = 13;
      distLoginBtn.paddingBottom = 13;
      distLoginBtn.cornerRadius = 8;
      distLoginBtn.fills = createSolidFill(C.royalBlue);
      const distLoginTxt = await createText("Distributor login →", FONT_SEMI, 14.5, C.white);
      distLoginBtn.appendChild(distLoginTxt);
      portalRight.appendChild(distLoginBtn);

      const distRegBtn = figma.createFrame();
      distRegBtn.layoutMode = "HORIZONTAL";
      distRegBtn.paddingLeft = 20;
      distRegBtn.paddingRight = 20;
      distRegBtn.paddingTop = 12;
      distRegBtn.paddingBottom = 12;
      distRegBtn.cornerRadius = 8;
      distRegBtn.fills = createSolidFill(C.navyDark);
      distRegBtn.strokes = createStroke(C.white, 1.5).strokes;
      const distRegTxt = await createText("Register", FONT_SEMI, 14, C.white);
      distRegBtn.appendChild(distRegTxt);
      portalRight.appendChild(distRegBtn);

      portalCard.appendChild(portalRight);
      portalSec.appendChild(portalCard);
      root.appendChild(portalSec);

      // ==========================================
      // SECTION 13: NEWSLETTER & OFFERS STRIP
      // ==========================================
      const newsSec = figma.createFrame();
      newsSec.name = "13 Newsletter Strip";
      newsSec.layoutMode = "VERTICAL";
      newsSec.resize(1440, 130);
      newsSec.counterAxisSizingMode = "FIXED";
      newsSec.primaryAxisSizingMode = "FIXED";
      newsSec.layoutAlign = "STRETCH";
      newsSec.fills = createSolidFill(C.bgIce);
      newsSec.strokes = createStroke(C.borderSoft).strokes;
      newsSec.strokeWeight = 1;
      newsSec.paddingLeft = 80;
      newsSec.paddingRight = 80;
      newsSec.paddingTop = 24;
      newsSec.paddingBottom = 24;
      newsSec.primaryAxisAlignItems = "CENTER";

      const newsInner = figma.createFrame();
      newsInner.layoutMode = "HORIZONTAL";
      newsInner.resize(1280, 72);
      newsInner.primaryAxisAlignItems = "SPACE_BETWEEN";
      newsInner.counterAxisAlignItems = "CENTER";
      newsInner.fills = [];

      const newsLeft = figma.createFrame();
      newsLeft.layoutMode = "VERTICAL";
      newsLeft.itemSpacing = 4;
      newsLeft.fills = [];
      const newsTitle = await createText("Promotions and new products", FONT_HEAD, 20, C.navyDark);
      const newsSub = await createText("Special offers, straight to your inbox.", FONT_REG, 14, C.slateBody);
      newsLeft.appendChild(newsTitle);
      newsLeft.appendChild(newsSub);
      newsInner.appendChild(newsLeft);

      const newsForm = figma.createFrame();
      newsForm.layoutMode = "HORIZONTAL";
      newsForm.itemSpacing = 10;
      newsForm.counterAxisAlignItems = "CENTER";
      newsForm.fills = [];

      const emailInput = figma.createFrame();
      emailInput.resize(320, 44);
      emailInput.cornerRadius = 8;
      emailInput.fills = createSolidFill(C.white);
      emailInput.strokes = createStroke(C.borderSoft).strokes;
      emailInput.strokeWeight = 1;
      emailInput.paddingLeft = 14;
      emailInput.layoutMode = "HORIZONTAL";
      emailInput.counterAxisAlignItems = "CENTER";
      const emailTxt = await createText("Work email", FONT_REG, 14, C.slateMuted);
      emailInput.appendChild(emailTxt);
      newsForm.appendChild(emailInput);

      const signBtn = figma.createFrame();
      signBtn.layoutMode = "HORIZONTAL";
      signBtn.paddingLeft = 20;
      signBtn.paddingRight = 20;
      signBtn.paddingTop = 12;
      signBtn.paddingBottom = 12;
      signBtn.cornerRadius = 8;
      signBtn.fills = createSolidFill(C.navyDark);
      const signTxt = await createText("Sign up", FONT_SEMI, 14, C.white);
      signBtn.appendChild(signTxt);
      newsForm.appendChild(signBtn);

      newsInner.appendChild(newsForm);
      newsSec.appendChild(newsInner);
      root.appendChild(newsSec);

      // ==========================================
      // SECTION 14: PROFESSIONAL MULTI-COLUMN FOOTER
      // ==========================================
      const footer = figma.createFrame();
      footer.name = "14 Professional Footer";
      footer.layoutMode = "VERTICAL";
      footer.resize(1440, 420);
      footer.counterAxisSizingMode = "FIXED";
      footer.primaryAxisSizingMode = "FIXED";
      footer.layoutAlign = "STRETCH";
      footer.fills = createSolidFill(C.footerBg);
      footer.paddingLeft = 80;
      footer.paddingRight = 80;
      footer.paddingTop = 50;
      footer.paddingBottom = 30;
      footer.itemSpacing = 36;

      const footerTop = figma.createFrame();
      footerTop.name = "Footer Columns";
      footerTop.layoutMode = "HORIZONTAL";
      footerTop.resize(1280, 240);
      footerTop.primaryAxisAlignItems = "SPACE_BETWEEN";
      footerTop.fills = [];

      // Col 1: About Us
      const col1 = figma.createFrame();
      col1.layoutMode = "VERTICAL";
      col1.resize(360, 220);
      col1.itemSpacing = 14;
      col1.fills = [];
      const col1Title = await createText("About us", FONT_HEAD, 15, C.white);
      const col1Desc = await createText(
        "Posh Xessories, Inc. was started with one mission: help people make the best impressions at the best price.",
        FONT_REG, 14, { r: 0.72, g: 0.78, b: 0.88 }, { lineHeight: 22 }
      );
      const callLink = await createText("📞 Click to call: (800) 555-POSH", FONT_SEMI, 13.5, C.royalBlue);
      const affilTxt = await createText("ASI 79028 | PPAI 206478 | SAGE 64870", FONT_MED, 11, C.slateLight);
      col1.appendChild(col1Title);
      col1.appendChild(col1Desc);
      col1.appendChild(callLink);
      col1.appendChild(affilTxt);
      footerTop.appendChild(col1);

      // Col 2: Corporate Office
      const col2 = figma.createFrame();
      col2.layoutMode = "VERTICAL";
      col2.resize(220, 220);
      col2.itemSpacing = 12;
      col2.fills = [];
      const col2Title = await createText("Corporate office", FONT_HEAD, 15, C.white);
      const addr1 = await createText("Chino, CA 91710, USA", FONT_REG, 14, { r: 0.72, g: 0.78, b: 0.88 });
      const addr2 = await createText("Hours: Mon - Fri 8am - 5pm PST", FONT_REG, 13, C.slateLight);
      const addr3 = await createText("Support: quotes@poshxessories.com", FONT_REG, 13, { r: 0.72, g: 0.78, b: 0.88 });
      col2.appendChild(col2Title);
      col2.appendChild(addr1);
      col2.appendChild(addr2);
      col2.appendChild(addr3);
      footerTop.appendChild(col2);

      // Col 3: Common FAQ & Resources
      const col3 = figma.createFrame();
      col3.layoutMode = "VERTICAL";
      col3.resize(220, 220);
      col3.itemSpacing = 10;
      col3.fills = [];
      const col3Title = await createText("Common FAQ", FONT_HEAD, 15, C.white);
      const faq1 = await createText("• Artwork & Digital Proofs", FONT_REG, 13.5, { r: 0.72, g: 0.78, b: 0.88 });
      const faq2 = await createText("• Decoration Price Guide", FONT_REG, 13.5, { r: 0.72, g: 0.78, b: 0.88 });
      const faq3 = await createText("• Rush Production Timelines", FONT_REG, 13.5, { r: 0.72, g: 0.78, b: 0.88 });
      const faq4 = await createText("• Shipping & Drop Deliveries", FONT_REG, 13.5, { r: 0.72, g: 0.78, b: 0.88 });
      col3.appendChild(col3Title);
      col3.appendChild(faq1);
      col3.appendChild(faq2);
      col3.appendChild(faq3);
      col3.appendChild(faq4);
      footerTop.appendChild(col3);

      // Col 4: Connect with us
      const col4 = figma.createFrame();
      col4.layoutMode = "VERTICAL";
      col4.resize(240, 220);
      col4.itemSpacing = 12;
      col4.fills = [];
      const col4Title = await createText("Connect with us", FONT_HEAD, 15, C.white);
      const s1 = await createText("LinkedIn: /company/posh-xessories", FONT_REG, 13.5, { r: 0.72, g: 0.78, b: 0.88 });
      const s2 = await createText("Distributor Portal Login", FONT_SEMI, 13.5, C.royalBlue);
      const s3 = await createText("Catalog PDF Download (2026)", FONT_REG, 13.5, { r: 0.72, g: 0.78, b: 0.88 });
      col4.appendChild(col4Title);
      col4.appendChild(s1);
      col4.appendChild(s2);
      col4.appendChild(s3);
      footerTop.appendChild(col4);

      footer.appendChild(footerTop);

      // Divider Line
      const fDiv = figma.createFrame();
      fDiv.resize(1280, 1);
      fDiv.fills = createSolidFill(C.footerBorder);
      footer.appendChild(fDiv);

      // Bottom Copyright Bar
      const fBottom = figma.createFrame();
      fBottom.layoutMode = "HORIZONTAL";
      fBottom.resize(1280, 24);
      fBottom.primaryAxisAlignItems = "SPACE_BETWEEN";
      fBottom.counterAxisAlignItems = "CENTER";
      fBottom.fills = [];

      const copyTxt = await createText("© PoshXessories. All rights reserved.", FONT_REG, 12.5, C.slateLight);
      const protoTxt = await createText(
        "Concept 02 design prototype. Not connected to the live store.",
        FONT_REG, 12, C.slateMuted
      );
      fBottom.appendChild(copyTxt);
      fBottom.appendChild(protoTxt);
      footer.appendChild(fBottom);

      root.appendChild(footer);

      // Select new frame and zoom viewport to it
      figma.currentPage.selection = [root];
      figma.viewport.scrollAndZoomIntoView([root]);

      return {
        success: true,
        rootId: root.id,
        rootName: root.name,
        width: root.width,
        height: root.height,
        sectionsCount: root.children.length
      };
    })()
  `;

  console.log("Building Posh Xessories Modern E-Commerce Redesign...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 60000,
    }),
  });

  const data = await res.json();
  console.log("Execution result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
