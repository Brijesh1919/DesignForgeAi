import fs from "fs";

async function main() {
  const code = `
    (async () => {
      let currentStep = "start";
      try {
        currentStep = "preload fonts";
        const fontsToLoad = [
          { family: "Inter", style: "Regular" },
          { family: "Inter", style: "Medium" },
          { family: "Inter", style: "SemiBold" },
          { family: "Inter", style: "Bold" },
          { family: "Roboto", style: "Regular" },
          { family: "Roboto", style: "Bold" },
        ];
        for (const f of fontsToLoad) {
          try {
            await figma.loadFontAsync(f);
          } catch (e) {
            console.warn("Could not load font:", f, e);
          }
        }

        // Color palette
        const C = {
          navyDark: { r: 0.043, g: 0.075, b: 0.161 },       // #0B1329
          navySlate: { r: 0.059, g: 0.090, b: 0.165 },      // #0F172A
          slateDark: { r: 0.118, g: 0.161, b: 0.235 },      // #1E293B
          slateBody: { r: 0.278, g: 0.333, b: 0.416 },      // #475569
          slateMuted: { r: 0.392, g: 0.455, b: 0.545 },     // #64748B
          slateLight: { r: 0.580, g: 0.639, b: 0.722 },     // #94A3B8
          borderSubtle: { r: 0.886, g: 0.910, b: 0.941 },   // #E2E8F0
          borderLight: { r: 0.945, g: 0.961, b: 0.976 },    // #F1F5F9
          bgCanvas: { r: 0.973, g: 0.980, b: 0.988 },       // #F8FAFC
          bgPure: { r: 1, g: 1, b: 1 },                      // #FFFFFF
          bluePrimary: { r: 0.145, g: 0.388, b: 0.922 },    // #2563EB
          blueDark: { r: 0.114, g: 0.306, b: 0.847 },       // #1D4ED8
          blueTint: { r: 0.937, g: 0.965, b: 1 },           // #EFF6FF
          blueBorder: { r: 0.749, g: 0.859, b: 0.988 },     // #BFDBFE
          skyAccent: { r: 0.220, g: 0.741, b: 0.973 },      // #38BDF8
          darkFooter: { r: 0.024, g: 0.051, b: 0.102 },     // #060D1A
        };

        const IMAGES = {
          heroJournal: "df4bba0a9467ce46cfaf29ff39a3bef993fb82ba",
          heroMiniSpec: "bbdf1340bd6a32fecd172be4550d12a0fc3bb6aa",
          catDrinkware: "51f15da5298768c124a2099fc777514829a78a60",
          catJournals: "0cebb3a95ee925b7f4534a82d25507f75a2f7b10",
          catPadfolios: "8dcb3836316be569d7871ce2926229c5ad34d3ae",
          catPowerBanks: "36ffd210e4eca8bc44652ea9ff70d791aaf76d1f",
          catMetalPens: "604cec058a98d1aa20fecefe76f6a579bccd98d7",
          catToteBags: "e4651da1f8634c00f79c5460903d77c235b4f285",
          catCardCases: "bbdf1340bd6a32fecd172be4550d12a0fc3bb6aa",
          prodTX2107: "f5f268cb593f8e3f81b0986bdb024f774790e8c5",
          prodDW8966: "47851d5b18c67a22347d97e8c9bfabce3ecc1089",
          prodEX8067: "74a1a6ae11ac82b38c12baded0399cdecc427afa",
          prodTX8810: "19f197e33989c4b558be6c7cf9281ea405bd6ba3",
          awardsBanner: "602c2705f1c18bf9081c2d7abd8479e0efca7c75",
        };

        // Helper: Create Text Node
        function createTxt(text, size = 14, style = "Regular", color = C.slateDark, opts = {}) {
          const t = figma.createText();
          try {
            t.fontName = { family: "Inter", style: style };
          } catch (e) {
            t.fontName = { family: "Roboto", style: "Regular" };
          }
          t.characters = text;
          t.fontSize = size;
          t.fills = [{ type: "SOLID", color: color }];
          if (opts.lineHeight) {
            t.lineHeight = { value: opts.lineHeight, unit: "PIXELS" };
          }
          if (opts.letterSpacing) {
            t.letterSpacing = { value: opts.letterSpacing, unit: "PIXELS" };
          }
          if (opts.textAlignHorizontal) {
            t.textAlignHorizontal = opts.textAlignHorizontal;
          }
          if (opts.opacity !== undefined) {
            t.opacity = opts.opacity;
          }
          return t;
        }

        // Helper: Create Image Node (Frame or Rect)
        function createImgNode(name, width, height, hash, scaleMode = "FIT", bgColor = null, cornerRadius = 0) {
          const frame = figma.createFrame();
          frame.name = name;
          frame.resize(width, height);
          frame.cornerRadius = cornerRadius;
          frame.clipsContent = true;

          const fills = [];
          if (bgColor) {
            fills.push({ type: "SOLID", color: bgColor });
          }
          if (hash) {
            fills.push({
              type: "IMAGE",
              imageHash: hash,
              scaleMode: scaleMode,
            });
          }
          frame.fills = fills;
          return frame;
        }

        // Remove old redesign frame if already exists
        currentStep = "remove old frame";
        const oldRedesign = figma.currentPage.children.filter(c => c.name.includes("Posh Xessories | Simplified Homepage Redesign"));
        for (const old of oldRedesign) {
          old.remove();
        }

        // Create Root Page Frame
        currentStep = "create root frame";
        const root = figma.createFrame();
        root.name = "Posh Xessories | Simplified Homepage Redesign (1440)";
        root.resize(1440, 3200);
        root.x = 11432;
        root.y = -277;
        root.layoutMode = "VERTICAL";
        root.primaryAxisSizingMode = "AUTO";
        root.counterAxisSizingMode = "FIXED";
        root.itemSpacing = 0;
        root.fills = [{ type: "SOLID", color: C.bgPure }];

        // ========================================================
        // 1. TOP CERTIFICATIONS TRUST STRIP
        // ========================================================
        currentStep = "1. top strip";
        const topStrip = figma.createFrame();
        topStrip.name = "Top Certification Strip";
        topStrip.resize(1440, 38);
        topStrip.layoutMode = "HORIZONTAL";
        topStrip.primaryAxisAlignItems = "SPACE_BETWEEN";
        topStrip.counterAxisAlignItems = "CENTER";
        topStrip.paddingLeft = 80;
        topStrip.paddingRight = 80;
        topStrip.fills = [{ type: "SOLID", color: C.navyDark }];

        // Left Badges
        const certLeft = figma.createFrame();
        certLeft.name = "Certifications";
        certLeft.layoutMode = "HORIZONTAL";
        certLeft.counterAxisAlignItems = "CENTER";
        certLeft.itemSpacing = 16;
        certLeft.fills = [];

        const certs = ["ASI 79028", "PPAI 206478", "SAGE 64870", "UPIC POSHX"];
        certs.forEach((cert, idx) => {
          const pill = figma.createFrame();
          pill.name = cert;
          pill.layoutMode = "HORIZONTAL";
          pill.paddingLeft = 8;
          pill.paddingRight = 8;
          pill.paddingTop = 3;
          pill.paddingBottom = 3;
          pill.cornerRadius = 4;
          pill.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
          const t = createTxt(cert, 11, "Medium", { r: 0.85, g: 0.9, b: 0.98 });
          pill.appendChild(t);
          certLeft.appendChild(pill);

          if (idx < certs.length - 1) {
            const dot = createTxt("•", 10, "Regular", { r: 0.4, g: 0.45, b: 0.55 });
            certLeft.appendChild(dot);
          }
        });
        topStrip.appendChild(certLeft);

        // Right Phone & Location
        const certRight = figma.createFrame();
        certRight.name = "Distributor Hotline";
        certRight.layoutMode = "HORIZONTAL";
        certRight.counterAxisAlignItems = "CENTER";
        certRight.itemSpacing = 12;
        certRight.fills = [];

        const callText = createTxt("Distributor Support & Orders: Chino, CA, USA", 11.5, "Medium", { r: 0.8, g: 0.85, b: 0.95 });
        certRight.appendChild(callText);
        topStrip.appendChild(certRight);

        root.appendChild(topStrip);

        // ========================================================
        // 2. MAIN HEADER & NAVIGATION
        // ========================================================
        currentStep = "2. header";
        const header = figma.createFrame();
        header.name = "Header Navigation";
        header.resize(1440, 76);
        header.layoutMode = "HORIZONTAL";
        header.primaryAxisAlignItems = "SPACE_BETWEEN";
        header.counterAxisAlignItems = "CENTER";
        header.paddingLeft = 80;
        header.paddingRight = 80;
        header.fills = [{ type: "SOLID", color: C.bgPure }];
        header.strokes = [{ type: "SOLID", color: C.borderLight }];
        header.strokeWeight = 1;
        header.strokeAlign = "INSIDE";

        // Brand Logo
        const logoGroup = figma.createFrame();
        logoGroup.name = "Brand Logo";
        logoGroup.layoutMode = "HORIZONTAL";
        logoGroup.counterAxisAlignItems = "CENTER";
        logoGroup.itemSpacing = 12;
        logoGroup.fills = [];

        // Monogram Mark
        const logoBadge = figma.createFrame();
        logoBadge.name = "Logo Emblem";
        logoBadge.resize(38, 38);
        logoBadge.cornerRadius = 10;
        logoBadge.layoutMode = "HORIZONTAL";
        logoBadge.primaryAxisAlignItems = "CENTER";
        logoBadge.counterAxisAlignItems = "CENTER";
        logoBadge.fills = [{ type: "SOLID", color: C.navySlate }];
        const emblemTxt = createTxt("PX", 16, "Bold", C.bgPure);
        logoBadge.appendChild(emblemTxt);
        logoGroup.appendChild(logoBadge);

        // Brand Text
        const brandNames = figma.createFrame();
        brandNames.name = "Brand Title";
        brandNames.layoutMode = "VERTICAL";
        brandNames.itemSpacing = 0;
        brandNames.fills = [];

        const wordmark = figma.createFrame();
        wordmark.name = "Wordmark";
        wordmark.layoutMode = "HORIZONTAL";
        wordmark.itemSpacing = 4;
        wordmark.counterAxisAlignItems = "CENTER";
        wordmark.fills = [];
        wordmark.appendChild(createTxt("POSH", 20, "Bold", C.navySlate));
        wordmark.appendChild(createTxt("XESSORIES", 20, "Bold", C.bluePrimary));
        brandNames.appendChild(wordmark);

        const brandSub = createTxt("OFFICIAL PROMOTIONAL PRODUCTS", 9, "Bold", C.slateMuted, { letterSpacing: 1 });
        brandNames.appendChild(brandSub);
        logoGroup.appendChild(brandNames);

        header.appendChild(logoGroup);

        // Center Navigation Links
        const navMenu = figma.createFrame();
        navMenu.name = "Navigation Links";
        navMenu.layoutMode = "HORIZONTAL";
        navMenu.counterAxisAlignItems = "CENTER";
        navMenu.itemSpacing = 32;
        navMenu.fills = [];

        const navLinks = [
          { label: "Products", active: true },
          { label: "E-flyers / Promotions", active: false },
          { label: "How to order", active: false },
          { label: "My account", active: false },
        ];

        navLinks.forEach(link => {
          const navItem = figma.createFrame();
          navItem.name = link.label;
          navItem.layoutMode = "HORIZONTAL";
          navItem.counterAxisAlignItems = "CENTER";
          navItem.itemSpacing = 6;
          navItem.paddingTop = 8;
          navItem.paddingBottom = 8;
          navItem.paddingLeft = 12;
          navItem.paddingRight = 12;
          navItem.cornerRadius = 8;
          if (link.active) {
            navItem.fills = [{ type: "SOLID", color: C.bgCanvas }];
          } else {
            navItem.fills = [];
          }
          const t = createTxt(link.label, 15, link.active ? "SemiBold" : "Medium", link.active ? C.navySlate : C.slateBody);
          navItem.appendChild(t);
          navMenu.appendChild(navItem);
        });
        header.appendChild(navMenu);

        // Right CTAs (Login & Register)
        const headerActions = figma.createFrame();
        headerActions.name = "Header Actions";
        headerActions.layoutMode = "HORIZONTAL";
        headerActions.counterAxisAlignItems = "CENTER";
        headerActions.itemSpacing = 14;
        headerActions.fills = [];

        // Login Button
        const loginBtn = figma.createFrame();
        loginBtn.name = "Login Button";
        loginBtn.layoutMode = "HORIZONTAL";
        loginBtn.counterAxisAlignItems = "CENTER";
        loginBtn.paddingTop = 10;
        loginBtn.paddingBottom = 10;
        loginBtn.paddingLeft = 18;
        loginBtn.paddingRight = 18;
        loginBtn.cornerRadius = 10;
        loginBtn.fills = [];
        loginBtn.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        loginBtn.strokeWeight = 1;
        loginBtn.appendChild(createTxt("Login", 15, "SemiBold", C.navySlate));
        headerActions.appendChild(loginBtn);

        // Register Button
        const regBtn = figma.createFrame();
        regBtn.name = "Register Button";
        regBtn.layoutMode = "HORIZONTAL";
        regBtn.counterAxisAlignItems = "CENTER";
        regBtn.paddingTop = 10;
        regBtn.paddingBottom = 10;
        regBtn.paddingLeft = 22;
        regBtn.paddingRight = 22;
        regBtn.cornerRadius = 10;
        regBtn.fills = [{ type: "SOLID", color: C.navySlate }];
        regBtn.appendChild(createTxt("Register", 14.5, "SemiBold", C.bgPure));
        headerActions.appendChild(regBtn);

        header.appendChild(headerActions);
        root.appendChild(header);

        // ========================================================
        // 3. HERO MERCHANDISING SECTION
        // ========================================================
        currentStep = "3. hero section";
        const heroSection = figma.createFrame();
        heroSection.name = "Hero Section";
        heroSection.resize(1440, 600);
        heroSection.layoutMode = "VERTICAL";
        heroSection.paddingLeft = 80;
        heroSection.paddingRight = 80;
        heroSection.paddingTop = 56;
        heroSection.paddingBottom = 56;
        heroSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        // Hero Inner Row (1280px wide)
        const heroRow = figma.createFrame();
        heroRow.name = "Hero Content Grid";
        heroRow.resize(1280, 488);
        heroRow.layoutMode = "HORIZONTAL";
        heroRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        heroRow.counterAxisAlignItems = "CENTER";
        heroRow.fills = [];

        // Left Hero Column (640px)
        const heroLeft = figma.createFrame();
        heroLeft.name = "Hero Copy & Search";
        heroLeft.resize(640, 488);
        heroLeft.layoutMode = "VERTICAL";
        heroLeft.counterAxisAlignItems = "MIN";
        heroLeft.itemSpacing = 24;
        heroLeft.fills = [];

        // Trust Eyebrow Badge
        const heroPill = figma.createFrame();
        heroPill.name = "Trust Badge";
        heroPill.layoutMode = "HORIZONTAL";
        heroPill.counterAxisAlignItems = "CENTER";
        heroPill.itemSpacing = 8;
        heroPill.paddingLeft = 14;
        heroPill.paddingRight = 14;
        heroPill.paddingTop = 6;
        heroPill.paddingBottom = 6;
        heroPill.cornerRadius = 20;
        heroPill.fills = [{ type: "SOLID", color: C.blueTint }];
        heroPill.strokes = [{ type: "SOLID", color: C.blueBorder }];
        heroPill.strokeWeight = 1;
        heroPill.appendChild(createTxt("★ ASI 5-STAR SUPPLIER • RATED #1 IN CALIFORNIA", 12, "Bold", C.blueDark, { letterSpacing: 0.5 }));
        heroLeft.appendChild(heroPill);

        // Headline & Subtitle Container
        const heroTextCol = figma.createFrame();
        heroTextCol.name = "Hero Titles";
        heroTextCol.layoutMode = "VERTICAL";
        heroTextCol.itemSpacing = 16;
        heroTextCol.fills = [];

        const heroHead = createTxt("Promotional products your clients will keep.", 50, "Bold", C.navySlate, { lineHeight: 58 });
        heroHead.resize(620, 116);
        heroTextCol.appendChild(heroHead);

        const heroSub = createTxt("Search by name or SKU, or start with a category.", 18, "Regular", C.slateBody, { lineHeight: 28 });
        heroSub.resize(620, 28);
        heroTextCol.appendChild(heroSub);
        heroLeft.appendChild(heroTextCol);

        // Search Command Bar
        const searchBar = figma.createFrame();
        searchBar.name = "Search Bar Container";
        searchBar.resize(620, 64);
        searchBar.layoutMode = "HORIZONTAL";
        searchBar.primaryAxisAlignItems = "SPACE_BETWEEN";
        searchBar.counterAxisAlignItems = "CENTER";
        searchBar.paddingLeft = 20;
        searchBar.paddingRight = 8;
        searchBar.cornerRadius = 14;
        searchBar.fills = [{ type: "SOLID", color: C.bgPure }];
        searchBar.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        searchBar.strokeWeight = 1.5;

        // Search Input Left
        const searchInputContent = figma.createFrame();
        searchInputContent.name = "Search Input";
        searchInputContent.layoutMode = "HORIZONTAL";
        searchInputContent.counterAxisAlignItems = "CENTER";
        searchInputContent.itemSpacing = 12;
        searchInputContent.fills = [];

        const searchIconPlaceholder = createTxt("🔍", 16, "Regular", C.slateMuted);
        searchInputContent.appendChild(searchIconPlaceholder);

        const searchPlaceholder = createTxt("Try “TX-2107” or “journals”", 16, "Regular", C.slateLight);
        searchInputContent.appendChild(searchPlaceholder);
        searchBar.appendChild(searchInputContent);

        // Search Button
        const searchBtn = figma.createFrame();
        searchBtn.name = "Search Button";
        searchBtn.layoutMode = "HORIZONTAL";
        searchBtn.counterAxisAlignItems = "CENTER";
        searchBtn.paddingLeft = 28;
        searchBtn.paddingRight = 28;
        searchBtn.paddingTop = 13;
        searchBtn.paddingBottom = 13;
        searchBtn.cornerRadius = 10;
        searchBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
        searchBtn.appendChild(createTxt("Search", 15.5, "Bold", C.bgPure));
        searchBar.appendChild(searchBtn);

        heroLeft.appendChild(searchBar);

        // Popular Tags Row
        const popRow = figma.createFrame();
        popRow.name = "Popular Tags";
        popRow.layoutMode = "HORIZONTAL";
        popRow.counterAxisAlignItems = "CENTER";
        popRow.itemSpacing = 10;
        popRow.fills = [];

        popRow.appendChild(createTxt("Popular:", 14, "Medium", C.slateMuted));

        const popTags = ["Drinkware", "Journals", "Power banks", "Tote bags"];
        popTags.forEach(tag => {
          const pill = figma.createFrame();
          pill.name = tag;
          pill.layoutMode = "HORIZONTAL";
          pill.counterAxisAlignItems = "CENTER";
          pill.paddingLeft = 14;
          pill.paddingRight = 14;
          pill.paddingTop = 7;
          pill.paddingBottom = 7;
          pill.cornerRadius = 20;
          pill.fills = [{ type: "SOLID", color: C.bgPure }];
          pill.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          pill.strokeWeight = 1;
          pill.appendChild(createTxt(tag, 13.5, "SemiBold", C.navySlate));
          popRow.appendChild(pill);
        });
        heroLeft.appendChild(popRow);

        heroRow.appendChild(heroLeft);

        // Right Hero Visual Column (580px wide)
        const heroRight = figma.createFrame();
        heroRight.name = "Hero Visual Showcase";
        heroRight.resize(580, 488);
        heroRight.layoutMode = "NONE"; // Allow floating elements
        heroRight.fills = [];

        // Main Showcase Photo
        const heroPhoto = createImgNode(
          "Image (Branded journals with client logos)",
          580,
          440,
          IMAGES.heroJournal,
          "FILL",
          C.bgCanvas,
          24
        );
        heroPhoto.x = 0;
        heroPhoto.y = 10;
        heroPhoto.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        heroPhoto.strokeWeight = 1;
        heroRight.appendChild(heroPhoto);

        // Floating Spec Card
        const specCard = figma.createFrame();
        specCard.name = "Hero Mini Spec Card";
        specCard.resize(300, 84);
        specCard.x = 24;
        specCard.y = 380;
        specCard.layoutMode = "HORIZONTAL";
        specCard.counterAxisAlignItems = "CENTER";
        specCard.paddingLeft = 14;
        specCard.paddingRight = 16;
        specCard.itemSpacing = 14;
        specCard.cornerRadius = 18;
        specCard.fills = [{ type: "SOLID", color: C.bgPure }];
        specCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        specCard.strokeWeight = 1;

        // Spec Thumbnail
        const specThumb = createImgNode(
          "Image",
          54,
          54,
          IMAGES.heroMiniSpec,
          "FIT",
          C.bgCanvas,
          10
        );
        specCard.appendChild(specThumb);

        // Spec Details
        const specDetails = figma.createFrame();
        specDetails.name = "Spec Details";
        specDetails.layoutMode = "VERTICAL";
        specDetails.itemSpacing = 4;
        specDetails.fills = [];

        const specBadge = createTxt("TOP PRODUCT PICK", 9.5, "Bold", C.bluePrimary, { letterSpacing: 0.8 });
        specDetails.appendChild(specBadge);

        const specTitle = createTxt("TX-2107 Card Holder", 14.5, "Bold", C.navySlate);
        specDetails.appendChild(specTitle);

        const specPrice = createTxt("$8.98 to $11.50 each", 13, "Medium", C.slateBody);
        specDetails.appendChild(specPrice);

        specCard.appendChild(specDetails);
        heroRight.appendChild(specCard);

        heroRow.appendChild(heroRight);
        heroSection.appendChild(heroRow);
        root.appendChild(heroSection);

        // ========================================================
        // 4. 8-CATEGORY LAUNCHPAD GRID
        // ========================================================
        currentStep = "4. categories";
        const catSection = figma.createFrame();
        catSection.name = "Category Launchpad Grid";
        catSection.resize(1440, 260);
        catSection.layoutMode = "VERTICAL";
        catSection.paddingLeft = 80;
        catSection.paddingRight = 80;
        catSection.paddingTop = 44;
        catSection.paddingBottom = 44;
        catSection.itemSpacing = 20;
        catSection.fills = [{ type: "SOLID", color: C.bgPure }];

        // Section Heading
        const catHeadRow = figma.createFrame();
        catHeadRow.name = "Category Header";
        catHeadRow.resize(1280, 28);
        catHeadRow.layoutMode = "HORIZONTAL";
        catHeadRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        catHeadRow.counterAxisAlignItems = "CENTER";
        catHeadRow.fills = [];
        catHeadRow.appendChild(createTxt("Browse Popular Categories", 20, "Bold", C.navySlate));
        catHeadRow.appendChild(createTxt("View full promotional catalog →", 14, "SemiBold", C.bluePrimary));
        catSection.appendChild(catHeadRow);

        // 8 Category Cards Row (1280px wide)
        const catGrid = figma.createFrame();
        catGrid.name = "Categories Row";
        catGrid.resize(1280, 160);
        catGrid.layoutMode = "HORIZONTAL";
        catGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
        catGrid.counterAxisAlignItems = "CENTER";
        catGrid.fills = [];

        const categoryList = [
          { name: "Drinkware", hash: IMAGES.catDrinkware, isPlus: false },
          { name: "Journals & Jotters", hash: IMAGES.catJournals, isPlus: false },
          { name: "Padfolios", hash: IMAGES.catPadfolios, isPlus: false },
          { name: "Power Banks", hash: IMAGES.catPowerBanks, isPlus: false },
          { name: "Metal Pens", hash: IMAGES.catMetalPens, isPlus: false },
          { name: "Tote Bags", hash: IMAGES.catToteBags, isPlus: false },
          { name: "Business Card Cases", hash: IMAGES.catCardCases, isPlus: false },
          { name: "All categories", hash: null, isPlus: true },
        ];

        categoryList.forEach(cat => {
          const card = figma.createFrame();
          card.name = cat.name;
          card.resize(146, 154);
          card.layoutMode = "VERTICAL";
          card.primaryAxisAlignItems = "CENTER";
          card.counterAxisAlignItems = "CENTER";
          card.paddingTop = 14;
          card.paddingBottom = 14;
          card.paddingLeft = 8;
          card.paddingRight = 8;
          card.itemSpacing = 10;
          card.cornerRadius = 16;
          card.fills = [{ type: "SOLID", color: C.bgPure }];
          card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          card.strokeWeight = 1;

          if (cat.isPlus) {
            // Plus circle icon
            const plusFrame = figma.createFrame();
            plusFrame.name = "+";
            plusFrame.resize(76, 76);
            plusFrame.cornerRadius = 38;
            plusFrame.layoutMode = "HORIZONTAL";
            plusFrame.primaryAxisAlignItems = "CENTER";
            plusFrame.counterAxisAlignItems = "CENTER";
            plusFrame.fills = [{ type: "SOLID", color: C.blueTint }];
            plusFrame.appendChild(createTxt("+", 32, "Bold", C.bluePrimary));
            card.appendChild(plusFrame);
          } else {
            // Category Image Frame
            const iconFrame = createImgNode("Image", 76, 76, cat.hash, "FIT", C.bgCanvas, 14);
            card.appendChild(iconFrame);
          }

          const label = createTxt(cat.name, 13.5, "SemiBold", C.navySlate, { textAlignHorizontal: "CENTER", lineHeight: 17 });
          label.resize(130, 34);
          card.appendChild(label);

          catGrid.appendChild(card);
        });
        catSection.appendChild(catGrid);
        root.appendChild(catSection);

        // ========================================================
        // 5. FEATURED PRODUCTS SECTION
        // ========================================================
        currentStep = "5. featured products";
        const featSection = figma.createFrame();
        featSection.name = "Featured Products Section";
        featSection.resize(1440, 720);
        featSection.layoutMode = "VERTICAL";
        featSection.paddingLeft = 80;
        featSection.paddingRight = 80;
        featSection.paddingTop = 56;
        featSection.paddingBottom = 56;
        featSection.itemSpacing = 32;
        featSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        // Section Header Row
        const featHeader = figma.createFrame();
        featHeader.name = "Section Header";
        featHeader.resize(1280, 52);
        featHeader.layoutMode = "HORIZONTAL";
        featHeader.primaryAxisAlignItems = "SPACE_BETWEEN";
        featHeader.counterAxisAlignItems = "CENTER";
        featHeader.fills = [];

        const featTitleCol = figma.createFrame();
        featTitleCol.name = "Title & Subtitle";
        featTitleCol.layoutMode = "VERTICAL";
        featTitleCol.itemSpacing = 4;
        featTitleCol.fills = [];
        featTitleCol.appendChild(createTxt("Featured products", 32, "Bold", C.navySlate));
        featTitleCol.appendChild(createTxt("Price per unit. It drops as quantity rises.", 16, "Regular", C.slateBody));
        featHeader.appendChild(featTitleCol);

        // View All Link
        const viewAllPill = figma.createFrame();
        viewAllPill.name = "View all products button";
        viewAllPill.layoutMode = "HORIZONTAL";
        viewAllPill.counterAxisAlignItems = "CENTER";
        viewAllPill.paddingLeft = 20;
        viewAllPill.paddingRight = 20;
        viewAllPill.paddingTop = 10;
        viewAllPill.paddingBottom = 10;
        viewAllPill.cornerRadius = 10;
        viewAllPill.fills = [{ type: "SOLID", color: C.blueTint }];
        viewAllPill.strokes = [{ type: "SOLID", color: C.blueBorder }];
        viewAllPill.strokeWeight = 1;
        viewAllPill.appendChild(createTxt("View all products →", 15, "SemiBold", C.blueDark));
        featHeader.appendChild(viewAllPill);

        featSection.appendChild(featHeader);

        // 4 Product Cards Grid (1280px wide)
        const prodGrid = figma.createFrame();
        prodGrid.name = "Product Grid (4 Cards)";
        prodGrid.resize(1280, 480);
        prodGrid.layoutMode = "HORIZONTAL";
        prodGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
        prodGrid.fills = [];

        const products = [
          {
            title: "Pro Series | Elite TPU Leather Business Card Holder",
            sku: "SKU TX-2107",
            price: "$8.98 to $11.50",
            hash: IMAGES.prodTX2107,
          },
          {
            title: "Summit 32oz Double Wall Vacuum Insulated 18/8",
            sku: "SKU DW-8966",
            price: "$10.28 to $12.62",
            hash: IMAGES.prodDW8966,
          },
          {
            title: "Madison 4000 mAh Slim Power Bank",
            sku: "SKU EX-8067",
            price: "$9.98 to $9.98",
            hash: IMAGES.prodEX8067,
          },
          {
            title: "Oceanside Key Chain",
            sku: "SKU TX-8810",
            price: "$4.18 to $5.13",
            hash: IMAGES.prodTX8810,
          },
        ];

        products.forEach(p => {
          const card = figma.createFrame();
          card.name = p.sku;
          card.resize(302, 474);
          card.layoutMode = "VERTICAL";
          card.cornerRadius = 20;
          card.clipsContent = true;
          card.fills = [{ type: "SOLID", color: C.bgPure }];
          card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          card.strokeWeight = 1;

          // Product Image Container
          const imgContainer = figma.createFrame();
          imgContainer.name = "Image Area";
          imgContainer.resize(302, 230);
          imgContainer.layoutMode = "NONE";
          imgContainer.fills = [{ type: "SOLID", color: C.bgCanvas }];

          // Centered Product Photo
          const prodPhoto = createImgNode("Product Photo", 200, 200, p.hash, "FIT", null, 0);
          prodPhoto.x = 51;
          prodPhoto.y = 15;
          imgContainer.appendChild(prodPhoto);

          // "Featured" Tag
          const featBadge = figma.createFrame();
          featBadge.name = "Featured Tag";
          featBadge.layoutMode = "HORIZONTAL";
          featBadge.paddingLeft = 10;
          featBadge.paddingRight = 10;
          featBadge.paddingTop = 5;
          featBadge.paddingBottom = 5;
          featBadge.cornerRadius = 6;
          featBadge.fills = [{ type: "SOLID", color: C.navySlate }];
          featBadge.x = 16;
          featBadge.y = 16;
          featBadge.appendChild(createTxt("FEATURED", 10.5, "Bold", C.bgPure, { letterSpacing: 0.6 }));
          imgContainer.appendChild(featBadge);

          card.appendChild(imgContainer);

          // Card Body
          const cardBody = figma.createFrame();
          cardBody.name = "Card Body";
          cardBody.resize(302, 244);
          cardBody.layoutMode = "VERTICAL";
          cardBody.paddingLeft = 20;
          cardBody.paddingRight = 20;
          cardBody.paddingTop = 18;
          cardBody.paddingBottom = 18;
          cardBody.itemSpacing = 10;
          cardBody.fills = [];

          // SKU
          const skuTxt = createTxt(p.sku, 12.5, "Medium", C.slateMuted, { letterSpacing: 0.5 });
          cardBody.appendChild(skuTxt);

          // Title
          const titleTxt = createTxt(p.title, 15.5, "SemiBold", C.navySlate, { lineHeight: 22 });
          titleTxt.resize(262, 44);
          cardBody.appendChild(titleTxt);

          // Price Row
          const priceBlock = figma.createFrame();
          priceBlock.name = "Pricing";
          priceBlock.layoutMode = "HORIZONTAL";
          priceBlock.counterAxisAlignItems = "BASELINE";
          priceBlock.itemSpacing = 6;
          priceBlock.fills = [];
          priceBlock.appendChild(createTxt(p.price, 17, "Bold", C.navySlate));
          priceBlock.appendChild(createTxt("/ unit", 12.5, "Regular", C.slateMuted));
          cardBody.appendChild(priceBlock);

          // Request Quote CTA Button
          const reqBtn = figma.createFrame();
          reqBtn.name = "Request Quote Button";
          reqBtn.resize(262, 42);
          reqBtn.layoutMode = "HORIZONTAL";
          reqBtn.primaryAxisAlignItems = "CENTER";
          reqBtn.counterAxisAlignItems = "CENTER";
          reqBtn.cornerRadius = 10;
          reqBtn.fills = [{ type: "SOLID", color: C.bgPure }];
          reqBtn.strokes = [{ type: "SOLID", color: C.navySlate }];
          reqBtn.strokeWeight = 1.5;
          reqBtn.appendChild(createTxt("Request quote", 14.5, "SemiBold", C.navySlate));
          cardBody.appendChild(reqBtn);

          card.appendChild(cardBody);
          prodGrid.appendChild(card);
        });

        featSection.appendChild(prodGrid);

        // Bottom Disclaimer Note
        const noteFrame = figma.createFrame();
        noteFrame.name = "Catalog Note";
        noteFrame.resize(1280, 48);
        noteFrame.layoutMode = "HORIZONTAL";
        noteFrame.primaryAxisAlignItems = "CENTER";
        noteFrame.counterAxisAlignItems = "CENTER";
        noteFrame.paddingLeft = 24;
        noteFrame.paddingRight = 24;
        noteFrame.cornerRadius = 10;
        noteFrame.fills = [{ type: "SOLID", color: C.bgPure }];
        noteFrame.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        noteFrame.strokeWeight = 1;

        const noteText = createTxt(
          "Prices for the featured items come from the live site. Other products are image placeholders; connect the product feed for real names, SKUs and tiers.",
          13,
          "Regular",
          C.slateMuted
        );
        noteFrame.appendChild(noteText);
        featSection.appendChild(noteFrame);

        root.appendChild(featSection);

        // ========================================================
        // 6. ASSISTANCE CALLOUT BANNER ("Not sure what to choose?")
        // ========================================================
        currentStep = "6. assistance banner";
        const assistWrap = figma.createFrame();
        assistWrap.name = "Assistance Banner Wrap";
        assistWrap.resize(1440, 200);
        assistWrap.layoutMode = "VERTICAL";
        assistWrap.primaryAxisAlignItems = "CENTER";
        assistWrap.counterAxisAlignItems = "CENTER";
        assistWrap.paddingLeft = 80;
        assistWrap.paddingRight = 80;
        assistWrap.paddingTop = 24;
        assistWrap.paddingBottom = 24;
        assistWrap.fills = [{ type: "SOLID", color: C.bgPure }];

        const assistCard = figma.createFrame();
        assistCard.name = "Assistance Card";
        assistCard.resize(1280, 150);
        assistCard.layoutMode = "HORIZONTAL";
        assistCard.primaryAxisAlignItems = "SPACE_BETWEEN";
        assistCard.counterAxisAlignItems = "CENTER";
        assistCard.paddingLeft = 56;
        assistCard.paddingRight = 56;
        assistCard.cornerRadius = 24;
        assistCard.fills = [{ type: "SOLID", color: C.navySlate }];

        // Left Copy
        const assistText = figma.createFrame();
        assistText.name = "Banner Copy";
        assistText.layoutMode = "VERTICAL";
        assistText.itemSpacing = 8;
        assistText.fills = [];

        const assistEyebrow = createTxt("PERSONAL MERCHANDISE ASSISTANCE", 11, "Bold", C.skyAccent, { letterSpacing: 1 });
        assistText.appendChild(assistEyebrow);

        const assistHead = createTxt("Not sure what to choose?", 28, "Bold", C.bgPure);
        assistText.appendChild(assistHead);

        const assistSub = createTxt("Share your budget, quantity and deadline, and we will suggest options.", 16, "Regular", { r: 0.75, g: 0.8, b: 0.9 });
        assistText.appendChild(assistSub);
        assistCard.appendChild(assistText);

        // Right CTAs
        const assistActions = figma.createFrame();
        assistActions.name = "Actions";
        assistActions.layoutMode = "HORIZONTAL";
        assistActions.counterAxisAlignItems = "CENTER";
        assistActions.itemSpacing = 16;
        assistActions.fills = [];

        const quoteBtn = figma.createFrame();
        quoteBtn.name = "Request a quote Button";
        quoteBtn.layoutMode = "HORIZONTAL";
        quoteBtn.counterAxisAlignItems = "CENTER";
        quoteBtn.paddingTop = 14;
        quoteBtn.paddingBottom = 14;
        quoteBtn.paddingLeft = 26;
        quoteBtn.paddingRight = 26;
        quoteBtn.cornerRadius = 12;
        quoteBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
        quoteBtn.appendChild(createTxt("Request a quote", 15.5, "SemiBold", C.bgPure));
        assistActions.appendChild(quoteBtn);

        const callBtn = figma.createFrame();
        callBtn.name = "Click to call Button";
        callBtn.layoutMode = "HORIZONTAL";
        callBtn.counterAxisAlignItems = "CENTER";
        callBtn.paddingTop = 14;
        callBtn.paddingBottom = 14;
        callBtn.paddingLeft = 24;
        callBtn.paddingRight = 24;
        callBtn.cornerRadius = 12;
        callBtn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
        callBtn.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.25 }];
        callBtn.strokeWeight = 1;
        callBtn.appendChild(createTxt("Click to call", 15.5, "SemiBold", C.bgPure));
        assistActions.appendChild(callBtn);

        assistCard.appendChild(assistActions);
        assistWrap.appendChild(assistCard);
        root.appendChild(assistWrap);

        // ========================================================
        // 7. ORDERING RESOURCES & CREDIBILITY PROOF SECTION
        // ========================================================
        currentStep = "7. ordering resources";
        const resSection = figma.createFrame();
        resSection.name = "Ordering Resources & Credibility";
        resSection.resize(1440, 780);
        resSection.layoutMode = "VERTICAL";
        resSection.paddingLeft = 80;
        resSection.paddingRight = 80;
        resSection.paddingTop = 56;
        resSection.paddingBottom = 56;
        resSection.itemSpacing = 36;
        resSection.fills = [{ type: "SOLID", color: C.bgPure }];

        // Section Title
        const resTitleCol = figma.createFrame();
        resTitleCol.name = "Header";
        resTitleCol.layoutMode = "VERTICAL";
        resTitleCol.itemSpacing = 4;
        resTitleCol.fills = [];
        resTitleCol.appendChild(createTxt("Ordering resources", 32, "Bold", C.navySlate));
        resTitleCol.appendChild(createTxt("Everything you need for seamless quotes, decoration and proofs.", 16, "Regular", C.slateBody));
        resSection.appendChild(resTitleCol);

        // 4 Resource Cards Row
        const resGrid = figma.createFrame();
        resGrid.name = "4 Resource Cards";
        resGrid.resize(1280, 140);
        resGrid.layoutMode = "HORIZONTAL";
        resGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
        resGrid.fills = [];

        const resources = [
          { title: "E-catalog", desc: "Browse the full catalog", tag: "PDF & FLIPBOOK" },
          { title: "E-flyers", desc: "Current promotions", tag: "SPECIAL DEALS" },
          { title: "Decoration price guide", desc: "Imprint options and costs", tag: "CUSTOM PRINT" },
          { title: "How to order", desc: "From quote to delivery", tag: "STEP-BY-STEP" },
        ];

        resources.forEach(r => {
          const card = figma.createFrame();
          card.name = r.title;
          card.resize(302, 136);
          card.layoutMode = "VERTICAL";
          card.paddingLeft = 22;
          card.paddingRight = 22;
          card.paddingTop = 20;
          card.paddingBottom = 20;
          card.itemSpacing = 8;
          card.cornerRadius = 16;
          card.fills = [{ type: "SOLID", color: C.bgCanvas }];
          card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          card.strokeWeight = 1;

          card.appendChild(createTxt(r.tag, 10, "Bold", C.bluePrimary, { letterSpacing: 0.8 }));
          card.appendChild(createTxt(r.title, 17, "Bold", C.navySlate));
          card.appendChild(createTxt(r.desc, 14.5, "Regular", C.slateBody));

          resGrid.appendChild(card);
        });
        resSection.appendChild(resGrid);

        // 3 Credibility Stats Row
        const statGrid = figma.createFrame();
        statGrid.name = "3 Credibility Stats";
        statGrid.resize(1280, 148);
        statGrid.layoutMode = "HORIZONTAL";
        statGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
        statGrid.fills = [];

        const stats = [
          {
            icon: "1",
            title: "Rated #1 in California",
            desc: "Top 10 in the nation for customer satisfaction.",
          },
          {
            icon: "★",
            title: "ASI 5-Star supplier",
            desc: "PRO Supplier and 2018 SAGE Rated Supplier.",
          },
          {
            icon: "$",
            title: "Quantity-based pricing",
            desc: "Shown on every product, so you can compare.",
          },
        ];

        stats.forEach(s => {
          const card = figma.createFrame();
          card.name = s.title;
          card.resize(410, 144);
          card.layoutMode = "HORIZONTAL";
          card.counterAxisAlignItems = "CENTER";
          card.paddingLeft = 24;
          card.paddingRight = 24;
          card.itemSpacing = 18;
          card.cornerRadius = 18;
          card.fills = [{ type: "SOLID", color: C.bgPure }];
          card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          card.strokeWeight = 1;

          // Icon Badge
          const iconCircle = figma.createFrame();
          iconCircle.name = "Stat Icon";
          iconCircle.resize(52, 52);
          iconCircle.cornerRadius = 26;
          iconCircle.layoutMode = "HORIZONTAL";
          iconCircle.primaryAxisAlignItems = "CENTER";
          iconCircle.counterAxisAlignItems = "CENTER";
          iconCircle.fills = [{ type: "SOLID", color: C.blueTint }];
          iconCircle.strokes = [{ type: "SOLID", color: C.blueBorder }];
          iconCircle.strokeWeight = 1;
          iconCircle.appendChild(createTxt(s.icon, 20, "Bold", C.bluePrimary));
          card.appendChild(iconCircle);

          // Stat Copy
          const statCopy = figma.createFrame();
          statCopy.name = "Stat Copy";
          statCopy.layoutMode = "VERTICAL";
          statCopy.itemSpacing = 4;
          statCopy.fills = [];
          statCopy.appendChild(createTxt(s.title, 17, "Bold", C.navySlate));
          const body = createTxt(s.desc, 14, "Regular", C.slateBody, { lineHeight: 20 });
          body.resize(290, 40);
          statCopy.appendChild(body);
          card.appendChild(statCopy);

          statGrid.appendChild(card);
        });
        resSection.appendChild(statGrid);

        // Real Awards Graphic Banner
        const awardsCard = figma.createFrame();
        awardsCard.name = "Official Awards Graphic Card";
        awardsCard.resize(1280, 140);
        awardsCard.layoutMode = "VERTICAL";
        awardsCard.primaryAxisAlignItems = "CENTER";
        awardsCard.counterAxisAlignItems = "CENTER";
        awardsCard.paddingTop = 16;
        awardsCard.paddingBottom = 16;
        awardsCard.paddingLeft = 24;
        awardsCard.paddingRight = 24;
        awardsCard.itemSpacing = 10;
        awardsCard.cornerRadius = 18;
        awardsCard.fills = [{ type: "SOLID", color: C.bgCanvas }];
        awardsCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        awardsCard.strokeWeight = 1;

        const awardsCaption = createTxt("OFFICIAL INDUSTRY RECOGNITION & CERTIFICATIONS", 11, "Bold", C.slateMuted, { letterSpacing: 1 });
        awardsCard.appendChild(awardsCaption);

        const awardsImg = createImgNode(
          "Image (Awards: number 1 in California, SAGE rated supplier, ASI 5-star supplier, PRO supplier)",
          1134,
          85,
          IMAGES.awardsBanner,
          "FIT",
          null,
          0
        );
        awardsCard.appendChild(awardsImg);

        resSection.appendChild(awardsCard);
        root.appendChild(resSection);

        // ========================================================
        // 8. DISTRIBUTOR PORTAL CALLOUT BANNER
        // ========================================================
        currentStep = "8. distributor callout";
        const distWrap = figma.createFrame();
        distWrap.name = "Distributor Callout Wrap";
        distWrap.resize(1440, 200);
        distWrap.layoutMode = "VERTICAL";
        distWrap.primaryAxisAlignItems = "CENTER";
        distWrap.counterAxisAlignItems = "CENTER";
        distWrap.paddingLeft = 80;
        distWrap.paddingRight = 80;
        distWrap.paddingTop = 20;
        distWrap.paddingBottom = 20;
        distWrap.fills = [{ type: "SOLID", color: C.bgCanvas }];

        const distCard = figma.createFrame();
        distCard.name = "Distributor Card";
        distCard.resize(1280, 150);
        distCard.layoutMode = "HORIZONTAL";
        distCard.primaryAxisAlignItems = "SPACE_BETWEEN";
        distCard.counterAxisAlignItems = "CENTER";
        distCard.paddingLeft = 56;
        distCard.paddingRight = 56;
        distCard.cornerRadius = 24;
        distCard.fills = [{ type: "SOLID", color: C.navyDark }];

        // Left Copy
        const distText = figma.createFrame();
        distText.name = "Distributor Copy";
        distText.layoutMode = "VERTICAL";
        distText.itemSpacing = 8;
        distText.fills = [];

        const distEyebrow = createTxt("AUTHORIZED RESELLER & DISTRIBUTOR ACCESS", 11, "Bold", C.skyAccent, { letterSpacing: 1 });
        distText.appendChild(distEyebrow);

        const distHead = createTxt("Are you a distributor?", 28, "Bold", C.bgPure);
        distText.appendChild(distHead);

        const distSub = createTxt("Log in to see your pricing and track orders.", 16, "Regular", { r: 0.75, g: 0.8, b: 0.9 });
        distText.appendChild(distSub);
        distCard.appendChild(distText);

        // Right Actions
        const distActions = figma.createFrame();
        distActions.name = "Distributor Actions";
        distActions.layoutMode = "HORIZONTAL";
        distActions.counterAxisAlignItems = "CENTER";
        distActions.itemSpacing = 16;
        distActions.fills = [];

        const distLoginBtn = figma.createFrame();
        distLoginBtn.name = "Log in Button";
        distLoginBtn.layoutMode = "HORIZONTAL";
        distLoginBtn.counterAxisAlignItems = "CENTER";
        distLoginBtn.paddingTop = 14;
        distLoginBtn.paddingBottom = 14;
        distLoginBtn.paddingLeft = 28;
        distLoginBtn.paddingRight = 28;
        distLoginBtn.cornerRadius = 12;
        distLoginBtn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
        distLoginBtn.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.3 }];
        distLoginBtn.strokeWeight = 1;
        distLoginBtn.appendChild(createTxt("Log in", 15.5, "SemiBold", C.bgPure));
        distActions.appendChild(distLoginBtn);

        const distRegBtn = figma.createFrame();
        distRegBtn.name = "Register Button";
        distRegBtn.layoutMode = "HORIZONTAL";
        distRegBtn.counterAxisAlignItems = "CENTER";
        distRegBtn.paddingTop = 14;
        distRegBtn.paddingBottom = 14;
        distRegBtn.paddingLeft = 30;
        distRegBtn.paddingRight = 30;
        distRegBtn.cornerRadius = 12;
        distRegBtn.fills = [{ type: "SOLID", color: C.bgPure }];
        distRegBtn.appendChild(createTxt("Register", 15.5, "SemiBold", C.navyDark));
        distActions.appendChild(distRegBtn);

        distCard.appendChild(distActions);
        distWrap.appendChild(distCard);
        root.appendChild(distWrap);

        // ========================================================
        // 9. ENTERPRISE FOOTER
        // ========================================================
        currentStep = "9. footer";
        const footer = figma.createFrame();
        footer.name = "Enterprise Footer";
        footer.resize(1440, 420);
        footer.layoutMode = "VERTICAL";
        footer.paddingLeft = 80;
        footer.paddingRight = 80;
        footer.paddingTop = 64;
        footer.paddingBottom = 40;
        footer.itemSpacing = 44;
        footer.fills = [{ type: "SOLID", color: C.darkFooter }];

        // 4 Columns Row
        const footerCols = figma.createFrame();
        footerCols.name = "Footer Columns";
        footerCols.resize(1280, 220);
        footerCols.layoutMode = "HORIZONTAL";
        footerCols.primaryAxisAlignItems = "SPACE_BETWEEN";
        footerCols.fills = [];

        // Col 1: Brand & Mission (340px)
        const fCol1 = figma.createFrame();
        fCol1.name = "Brand Column";
        fCol1.resize(340, 220);
        fCol1.layoutMode = "VERTICAL";
        fCol1.itemSpacing = 16;
        fCol1.fills = [];

        const fBrand = createTxt("Posh Xessories", 18, "Bold", C.bgPure);
        fCol1.appendChild(fBrand);

        const fMission = createTxt(
          "Started with one mission: help people make the best impressions at the best price.",
          14.5,
          "Regular",
          { r: 0.65, g: 0.72, b: 0.82 },
          { lineHeight: 22 }
        );
        fMission.resize(320, 66);
        fCol1.appendChild(fMission);

        const fAddress = createTxt("📍 Chino, CA 91710, USA", 14, "Medium", { r: 0.8, g: 0.85, b: 0.95 });
        fCol1.appendChild(fAddress);
        footerCols.appendChild(fCol1);

        // Col 2: Newsletter (320px)
        const fCol2 = figma.createFrame();
        fCol2.name = "Newsletter Column";
        fCol2.resize(320, 220);
        fCol2.layoutMode = "VERTICAL";
        fCol2.itemSpacing = 16;
        fCol2.fills = [];

        fCol2.appendChild(createTxt("Email for promotions", 15, "Bold", C.bgPure));

        const fNewsDesc = createTxt("Get exclusive distributor specials, clearance alerts and new arrivals.", 13.5, "Regular", { r: 0.65, g: 0.72, b: 0.82 }, { lineHeight: 20 });
        fNewsDesc.resize(300, 40);
        fCol2.appendChild(fNewsDesc);

        // Newsletter Input Bar
        const newsInput = figma.createFrame();
        newsInput.name = "Newsletter Input";
        newsInput.resize(300, 46);
        newsInput.layoutMode = "HORIZONTAL";
        newsInput.primaryAxisAlignItems = "SPACE_BETWEEN";
        newsInput.counterAxisAlignItems = "CENTER";
        newsInput.paddingLeft = 14;
        newsInput.paddingRight = 6;
        newsInput.cornerRadius = 10;
        newsInput.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        newsInput.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.15 }];
        newsInput.strokeWeight = 1;

        const emailPlace = createTxt("Your work email...", 13.5, "Regular", { r: 0.5, g: 0.55, b: 0.65 });
        newsInput.appendChild(emailPlace);

        const signUpBtn = figma.createFrame();
        signUpBtn.name = "Sign up Button";
        signUpBtn.layoutMode = "HORIZONTAL";
        signUpBtn.counterAxisAlignItems = "CENTER";
        signUpBtn.paddingLeft = 16;
        signUpBtn.paddingRight = 16;
        signUpBtn.paddingTop = 8;
        signUpBtn.paddingBottom = 8;
        signUpBtn.cornerRadius = 8;
        signUpBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
        signUpBtn.appendChild(createTxt("Sign up", 13.5, "SemiBold", C.bgPure));
        newsInput.appendChild(signUpBtn);

        fCol2.appendChild(newsInput);
        footerCols.appendChild(fCol2);

        // Col 3: Help Links (160px)
        const fCol3 = figma.createFrame();
        fCol3.name = "Help Links";
        fCol3.resize(160, 220);
        fCol3.layoutMode = "VERTICAL";
        fCol3.itemSpacing = 12;
        fCol3.fills = [];

        fCol3.appendChild(createTxt("Help", 15, "Bold", C.bgPure));

        const helpLinks = ["How to order", "Decoration price guide", "E-catalog", "Privacy policy"];
        helpLinks.forEach(l => {
          fCol3.appendChild(createTxt(l, 14, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        });
        footerCols.appendChild(fCol3);

        // Col 4: Company Links (160px)
        const fCol4 = figma.createFrame();
        fCol4.name = "Company Links";
        fCol4.resize(160, 220);
        fCol4.layoutMode = "VERTICAL";
        fCol4.itemSpacing = 12;
        fCol4.fills = [];

        fCol4.appendChild(createTxt("Company", 15, "Bold", C.bgPure));

        const compLinks = ["Company history", "Reviews", "Awards / media", "Click to call"];
        compLinks.forEach(l => {
          fCol4.appendChild(createTxt(l, 14, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        });
        footerCols.appendChild(fCol4);

        footer.appendChild(footerCols);

        // Footer Divider Line
        const fDivider = figma.createFrame();
        fDivider.name = "Divider";
        fDivider.resize(1280, 1);
        fDivider.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        footer.appendChild(fDivider);

        // Footer Bottom Row (1280px wide)
        const fBottomRow = figma.createFrame();
        fBottomRow.name = "Bottom Legal Bar";
        fBottomRow.resize(1280, 24);
        fBottomRow.layoutMode = "HORIZONTAL";
        fBottomRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        fBottomRow.counterAxisAlignItems = "CENTER";
        fBottomRow.fills = [];

        fBottomRow.appendChild(createTxt("Design prototype, not connected to the live store.", 13, "Regular", { r: 0.45, g: 0.5, b: 0.6 }));
        fBottomRow.appendChild(createTxt("© PoshXessories. All rights reserved.", 13, "Regular", { r: 0.45, g: 0.5, b: 0.6 }));
        footer.appendChild(fBottomRow);

        root.appendChild(footer);

        // Select the newly created frame
        figma.currentPage.selection = [root];
        figma.viewport.scrollAndZoomIntoView([root]);

        return {
          success: true,
          frameId: root.id,
          name: root.name,
          width: root.width,
          height: root.height,
          x: root.x,
          y: root.y,
        };
      } catch (err) {
        return {
          success: false,
          error: String(err && err.message ? err.message : err),
          step: currentStep,
          stack: err && err.stack ? err.stack : undefined,
        };
      }
    })();
  `;

  console.log("Sending redesign creation script to Figma...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 30000,
    }),
  });

  const data = await res.json();
  console.log("Result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
