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

        // Color Palette
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
          greenAccent: { r: 0.086, g: 0.639, b: 0.365 },    // #16A34A
          greenTint: { r: 0.941, g: 0.992, b: 0.957 },     // #F0FDF4
          darkFooter: { r: 0.024, g: 0.051, b: 0.102 },     // #060D1A
        };

        // All 13 Verified Image Hashes
        const IMAGES = {
          heroJournal: "8c8fb9aaae781407a4059eb0be5e012c397160e8",
          catDrinkware: "8e82f515726146ddfead18527fcd6420ba87a265",
          catJournals: "df5759a7acead31488843214cd8199120d0ab193",
          catPadfolios: "5c187525ec2185f6dd7e54cc3fed07c4eaf67af4",
          catPower: "247ee3ee397ea5dbbec5854d8cbd7fed166f6b9e",
          catPens: "0e181965f9ce2896f9463e83baa1fbd8818d898e",
          catTotes: "588e9372e5c53e383be47b00f01afa0c10dd1157",
          catCards: "efdd7c0651cb8f54fa76e8f89cc7febde3792525",
          prodTX2107: "483e4e6edfac3f7868b973658cf68bd734d30594",
          prodDW8966: "c691c89ff4de82c8484dc0a5e23a3c14339ea580",
          prodEX8067: "d5cfcb0872c4e1614fde242f0203cb0193497532",
          prodTX916958: "7ddb3dcd4a767fba4450b0ba959fa6867741c083",
          awardsGraphic: "602c2705f1c18bf9081c2d7abd8479e0efca7c75",
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

        // Helper: Create Image Node
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

        // Helper: Append and Fill
        function appendAndFill(parent, child, hugVertical = true) {
          parent.appendChild(child);
          try {
            child.layoutSizingHorizontal = "FILL";
            if (hugVertical) {
              child.layoutSizingVertical = "HUG";
            }
          } catch (e) {
            console.warn("Could not set sizing:", child.name, e);
          }
        }

        // Remove old mobile frame if already exists
        currentStep = "remove old frame";
        const oldFrames = figma.currentPage.children.filter(c => c.name.includes("Posh Xessories | Mobile UI (412)"));
        for (const old of oldFrames) old.remove();

        // Create Root Mobile Frame
        currentStep = "create root mobile frame";
        const root = figma.createFrame();
        root.name = "Posh Xessories | Mobile UI (412)";
        root.resize(412, 4500);
        root.x = 20889; // Placed beside 19529 + 1280 + 80
        root.y = 41965;
        root.layoutMode = "VERTICAL";
        root.primaryAxisSizingMode = "AUTO";
        root.counterAxisSizingMode = "FIXED";
        root.itemSpacing = 0;
        root.fills = [{ type: "SOLID", color: C.bgPure }];

        // ========================================================
        // 0. MOBILE STATUS BAR (Standard 412x36px)
        // ========================================================
        currentStep = "0. mobile status bar";
        const statusBar = figma.createFrame();
        statusBar.name = "Status Bar";
        statusBar.layoutMode = "HORIZONTAL";
        statusBar.primaryAxisAlignItems = "SPACE_BETWEEN";
        statusBar.counterAxisAlignItems = "CENTER";
        statusBar.paddingLeft = 20;
        statusBar.paddingRight = 20;
        statusBar.paddingTop = 10;
        statusBar.paddingBottom = 8;
        statusBar.fills = [{ type: "SOLID", color: C.navyDark }];
        statusBar.appendChild(createTxt("9:41", 12.5, "Bold", C.bgPure));

        const statusIcons = figma.createFrame();
        statusIcons.name = "Icons";
        statusIcons.layoutMode = "HORIZONTAL";
        statusIcons.counterAxisAlignItems = "CENTER";
        statusIcons.itemSpacing = 6;
        statusIcons.fills = [];
        statusIcons.appendChild(createTxt("5G", 11, "Bold", C.bgPure));
        statusIcons.appendChild(createTxt("100%", 11, "Medium", C.bgPure));
        statusBar.appendChild(statusIcons);
        appendAndFill(root, statusBar);

        // ========================================================
        // 1. MOBILE TOP CERTIFICATION STRIP
        // ========================================================
        currentStep = "1. top strip";
        const topStrip = figma.createFrame();
        topStrip.name = "Top Certification Strip";
        topStrip.layoutMode = "HORIZONTAL";
        topStrip.primaryAxisAlignItems = "SPACE_BETWEEN";
        topStrip.counterAxisAlignItems = "CENTER";
        topStrip.paddingLeft = 16;
        topStrip.paddingRight = 16;
        topStrip.paddingTop = 7;
        topStrip.paddingBottom = 7;
        topStrip.fills = [{ type: "SOLID", color: C.navySlate }];

        topStrip.appendChild(createTxt("ASI 79028 | PPAI 206478 | SAGE 64870", 10.5, "Medium", { r: 0.8, g: 0.88, b: 0.98 }));
        topStrip.appendChild(createTxt("(800) 555-POSH", 11, "SemiBold", C.skyAccent));
        appendAndFill(root, topStrip);

        // ========================================================
        // 2. MOBILE APP HEADER BAR (64px)
        // ========================================================
        currentStep = "2. mobile header";
        const header = figma.createFrame();
        header.name = "Mobile App Header";
        header.layoutMode = "HORIZONTAL";
        header.primaryAxisAlignItems = "SPACE_BETWEEN";
        header.counterAxisAlignItems = "CENTER";
        header.paddingLeft = 16;
        header.paddingRight = 16;
        header.paddingTop = 12;
        header.paddingBottom = 12;
        header.fills = [{ type: "SOLID", color: C.bgPure }];
        header.strokes = [{ type: "SOLID", color: C.borderLight }];
        header.strokeWeight = 1;

        // Brand Logo
        const brand = figma.createFrame();
        brand.name = "Brand";
        brand.layoutMode = "HORIZONTAL";
        brand.counterAxisAlignItems = "CENTER";
        brand.itemSpacing = 8;
        brand.fills = [];

        const logoBadge = figma.createFrame();
        logoBadge.name = "PX Badge";
        logoBadge.resize(32, 32);
        logoBadge.cornerRadius = 8;
        logoBadge.layoutMode = "HORIZONTAL";
        logoBadge.primaryAxisAlignItems = "CENTER";
        logoBadge.counterAxisAlignItems = "CENTER";
        logoBadge.fills = [{ type: "SOLID", color: C.navySlate }];
        logoBadge.appendChild(createTxt("PX", 13.5, "Bold", C.bgPure));
        brand.appendChild(logoBadge);

        const brandText = figma.createFrame();
        brandText.name = "Text";
        brandText.layoutMode = "HORIZONTAL";
        brandText.itemSpacing = 3;
        brandText.counterAxisAlignItems = "CENTER";
        brandText.fills = [];
        brandText.appendChild(createTxt("POSH", 16, "Bold", C.navySlate));
        brandText.appendChild(createTxt("XESSORIES", 16, "Bold", C.bluePrimary));
        brand.appendChild(brandText);
        header.appendChild(brand);

        // Right Actions (Search icon, Cart pill, Quote pill)
        const headerRight = figma.createFrame();
        headerRight.name = "Actions";
        headerRight.layoutMode = "HORIZONTAL";
        headerRight.counterAxisAlignItems = "CENTER";
        headerRight.itemSpacing = 8;
        headerRight.fills = [];

        // Cart Indicator
        const cartBadge = figma.createFrame();
        cartBadge.name = "Cart Badge";
        cartBadge.layoutMode = "HORIZONTAL";
        cartBadge.counterAxisAlignItems = "CENTER";
        cartBadge.itemSpacing = 4;
        cartBadge.paddingLeft = 8;
        cartBadge.paddingRight = 8;
        cartBadge.paddingTop = 5;
        cartBadge.paddingBottom = 5;
        cartBadge.cornerRadius = 6;
        cartBadge.fills = [{ type: "SOLID", color: C.bgCanvas }];
        cartBadge.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        cartBadge.strokeWeight = 1;
        cartBadge.appendChild(createTxt("🛒", 12, "Regular", C.navySlate));
        cartBadge.appendChild(createTxt("0", 11, "Bold", C.bluePrimary));
        headerRight.appendChild(cartBadge);

        // Request Quote Pill
        const reqQuotePill = figma.createFrame();
        reqQuotePill.name = "Request Quote Pill";
        reqQuotePill.layoutMode = "HORIZONTAL";
        reqQuotePill.counterAxisAlignItems = "CENTER";
        reqQuotePill.paddingLeft = 12;
        reqQuotePill.paddingRight = 12;
        reqQuotePill.paddingTop = 6;
        reqQuotePill.paddingBottom = 6;
        reqQuotePill.cornerRadius = 8;
        reqQuotePill.fills = [{ type: "SOLID", color: C.bluePrimary }];
        reqQuotePill.appendChild(createTxt("Quote", 12, "SemiBold", C.bgPure));
        headerRight.appendChild(reqQuotePill);

        header.appendChild(headerRight);
        appendAndFill(root, header);

        // Quick Subnav Strip
        const mobileSubnav = figma.createFrame();
        mobileSubnav.name = "Mobile Quick Links";
        mobileSubnav.layoutMode = "HORIZONTAL";
        mobileSubnav.primaryAxisAlignItems = "SPACE_BETWEEN";
        mobileSubnav.counterAxisAlignItems = "CENTER";
        mobileSubnav.paddingLeft = 16;
        mobileSubnav.paddingRight = 16;
        mobileSubnav.paddingTop = 8;
        mobileSubnav.paddingBottom = 8;
        mobileSubnav.fills = [{ type: "SOLID", color: C.bgCanvas }];
        mobileSubnav.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        mobileSubnav.strokeWeight = 1;

        const navLinksList = ["Products", "E-flyers", "How to Order", "My Account", "Login"];
        navLinksList.forEach((lnk, i) => {
          mobileSubnav.appendChild(createTxt(lnk, 12, i === 0 ? "SemiBold" : "Medium", i === 0 ? C.bluePrimary : C.slateBody));
        });
        appendAndFill(root, mobileSubnav);

        // ========================================================
        // 3. SECTION 1: EXECUTIVE HERO & INSTANT DISCOVERY
        // ========================================================
        currentStep = "3. hero section";
        const heroSection = figma.createFrame();
        heroSection.name = "Section 1: Hero & Discovery";
        heroSection.layoutMode = "VERTICAL";
        heroSection.paddingLeft = 16;
        heroSection.paddingRight = 16;
        heroSection.paddingTop = 24;
        heroSection.paddingBottom = 24;
        heroSection.itemSpacing = 16;
        heroSection.fills = [{ type: "SOLID", color: C.bgPure }];

        // Eyebrow Badge
        const heroEyebrow = figma.createFrame();
        heroEyebrow.name = "Eyebrow";
        heroEyebrow.layoutMode = "HORIZONTAL";
        heroEyebrow.paddingLeft = 10;
        heroEyebrow.paddingRight = 10;
        heroEyebrow.paddingTop = 4;
        heroEyebrow.paddingBottom = 4;
        heroEyebrow.cornerRadius = 6;
        heroEyebrow.fills = [{ type: "SOLID", color: C.blueTint }];
        heroEyebrow.strokes = [{ type: "SOLID", color: C.blueBorder }];
        heroEyebrow.strokeWeight = 1;
        heroEyebrow.appendChild(createTxt("★ PREMIUM IMPRINT & SOURCING COLLECTION", 10.5, "Bold", C.blueDark, { letterSpacing: 0.5 }));
        heroSection.appendChild(heroEyebrow);

        // Headline
        const heroTitle = createTxt("Promotional products your clients will keep.", 28, "Bold", C.navySlate, { lineHeight: 34 });
        heroTitle.resize(380, 68);
        heroSection.appendChild(heroTitle);

        // Description
        const heroDesc = createTxt(
          "Search by name or SKU, or start with a category. Precision enterprise sourcing with California's fastest proof turnaround.",
          13.5,
          "Regular",
          C.slateBody,
          { lineHeight: 20 }
        );
        heroDesc.resize(380, 60);
        heroSection.appendChild(heroDesc);

        // Mobile Search Input Bar
        const mobileSearchBar = figma.createFrame();
        mobileSearchBar.name = "Mobile Search Bar";
        mobileSearchBar.resize(380, 48);
        mobileSearchBar.layoutMode = "HORIZONTAL";
        mobileSearchBar.primaryAxisAlignItems = "SPACE_BETWEEN";
        mobileSearchBar.counterAxisAlignItems = "CENTER";
        mobileSearchBar.paddingLeft = 14;
        mobileSearchBar.paddingRight = 6;
        mobileSearchBar.cornerRadius = 10;
        mobileSearchBar.fills = [{ type: "SOLID", color: C.bgCanvas }];
        mobileSearchBar.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        mobileSearchBar.strokeWeight = 1.5;

        mobileSearchBar.appendChild(createTxt("Search by SKU or keyword...", 13, "Regular", C.slateLight));

        const searchBtn = figma.createFrame();
        searchBtn.name = "Search Button";
        searchBtn.layoutMode = "HORIZONTAL";
        searchBtn.counterAxisAlignItems = "CENTER";
        searchBtn.paddingLeft = 14;
        searchBtn.paddingRight = 14;
        searchBtn.paddingTop = 8;
        searchBtn.paddingBottom = 8;
        searchBtn.cornerRadius = 6;
        searchBtn.fills = [{ type: "SOLID", color: C.navySlate }];
        searchBtn.appendChild(createTxt("Search", 12.5, "SemiBold", C.bgPure));
        mobileSearchBar.appendChild(searchBtn);
        heroSection.appendChild(mobileSearchBar);

        // Popular Tags Row
        const popRow = figma.createFrame();
        popRow.name = "Popular Tags";
        popRow.layoutMode = "HORIZONTAL";
        popRow.counterAxisAlignItems = "CENTER";
        popRow.itemSpacing = 8;
        popRow.fills = [];
        popRow.appendChild(createTxt("POPULAR:", 10.5, "Bold", C.slateMuted));

        const popTags = ["Drinkware", "Journals", "Power banks", "Tote bags"];
        popTags.forEach(tag => {
          const pill = figma.createFrame();
          pill.name = tag;
          pill.layoutMode = "HORIZONTAL";
          pill.counterAxisAlignItems = "CENTER";
          pill.paddingLeft = 8;
          pill.paddingRight = 8;
          pill.paddingTop = 4;
          pill.paddingBottom = 4;
          pill.cornerRadius = 6;
          pill.fills = [{ type: "SOLID", color: C.bgCanvas }];
          pill.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          pill.strokeWeight = 1;
          pill.appendChild(createTxt(tag, 11, "Medium", C.navySlate));
          popRow.appendChild(pill);
        });
        heroSection.appendChild(popRow);

        // Hero Main Image Showcase Card
        const heroPhotoCard = figma.createFrame();
        heroPhotoCard.name = "Hero Visual Card";
        heroPhotoCard.resize(380, 240);
        heroPhotoCard.cornerRadius = 16;
        heroPhotoCard.clipsContent = true;
        heroPhotoCard.layoutMode = "NONE";
        heroPhotoCard.fills = [{ type: "SOLID", color: C.bgCanvas }];
        heroPhotoCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        heroPhotoCard.strokeWeight = 1;

        const heroImg = createImgNode("Journal Showcase Photo", 380, 240, IMAGES.heroJournal, "FILL", null, 0);
        heroImg.x = 0;
        heroImg.y = 0;
        heroPhotoCard.appendChild(heroImg);

        // Embedded Spec Badge on Photo
        const heroFloatingSpec = figma.createFrame();
        heroFloatingSpec.name = "Featured SKU Badge";
        heroFloatingSpec.resize(260, 58);
        heroFloatingSpec.x = 12;
        heroFloatingSpec.y = 170;
        heroFloatingSpec.layoutMode = "HORIZONTAL";
        heroFloatingSpec.primaryAxisAlignItems = "SPACE_BETWEEN";
        heroFloatingSpec.counterAxisAlignItems = "CENTER";
        heroFloatingSpec.paddingLeft = 12;
        heroFloatingSpec.paddingRight = 12;
        heroFloatingSpec.paddingTop = 8;
        heroFloatingSpec.paddingBottom = 8;
        heroFloatingSpec.cornerRadius = 12;
        heroFloatingSpec.fills = [{ type: "SOLID", color: C.bgPure, opacity: 0.95 }];
        heroFloatingSpec.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        heroFloatingSpec.strokeWeight = 1;

        const specLeft = figma.createFrame();
        specLeft.name = "Details";
        specLeft.layoutMode = "VERTICAL";
        specLeft.itemSpacing = 2;
        specLeft.fills = [];
        specLeft.appendChild(createTxt("TX-2107 Card Holder", 12.5, "Bold", C.navySlate));
        specLeft.appendChild(createTxt("$8.98 to $11.50 ea", 11, "Medium", C.bluePrimary));
        heroFloatingSpec.appendChild(specLeft);

        const specQuoteBtn = figma.createFrame();
        specQuoteBtn.name = "Quote";
        specQuoteBtn.layoutMode = "HORIZONTAL";
        specQuoteBtn.counterAxisAlignItems = "CENTER";
        specQuoteBtn.paddingLeft = 10;
        specQuoteBtn.paddingRight = 10;
        specQuoteBtn.paddingTop = 5;
        specQuoteBtn.paddingBottom = 5;
        specQuoteBtn.cornerRadius = 6;
        specQuoteBtn.fills = [{ type: "SOLID", color: C.navySlate }];
        specQuoteBtn.appendChild(createTxt("Quote", 11, "SemiBold", C.bgPure));
        heroFloatingSpec.appendChild(specQuoteBtn);

        heroPhotoCard.appendChild(heroFloatingSpec);
        heroSection.appendChild(heroPhotoCard);

        // Dual Action CTAs
        const ctaRow = figma.createFrame();
        ctaRow.name = "Action CTAs";
        ctaRow.layoutMode = "HORIZONTAL";
        ctaRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        ctaRow.counterAxisAlignItems = "CENTER";
        ctaRow.itemSpacing = 10;
        ctaRow.fills = [];

        const catBtn = figma.createFrame();
        catBtn.name = "Explore Catalog Button";
        catBtn.resize(185, 44);
        catBtn.layoutMode = "HORIZONTAL";
        catBtn.primaryAxisAlignItems = "CENTER";
        catBtn.counterAxisAlignItems = "CENTER";
        catBtn.cornerRadius = 10;
        catBtn.fills = [{ type: "SOLID", color: C.navySlate }];
        catBtn.appendChild(createTxt("Explore Catalog", 13.5, "SemiBold", C.bgPure));
        ctaRow.appendChild(catBtn);

        const customQuoteBtn = figma.createFrame();
        customQuoteBtn.name = "Request Custom Quote Button";
        customQuoteBtn.resize(185, 44);
        customQuoteBtn.layoutMode = "HORIZONTAL";
        customQuoteBtn.primaryAxisAlignItems = "CENTER";
        customQuoteBtn.counterAxisAlignItems = "CENTER";
        customQuoteBtn.cornerRadius = 10;
        customQuoteBtn.fills = [{ type: "SOLID", color: C.bgPure }];
        customQuoteBtn.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        customQuoteBtn.strokeWeight = 1.5;
        customQuoteBtn.appendChild(createTxt("Request Quote", 13.5, "SemiBold", C.navySlate));
        ctaRow.appendChild(customQuoteBtn);

        heroSection.appendChild(ctaRow);

        // In-house proofing highlight strip
        const proofStrip = figma.createFrame();
        proofStrip.name = "Proofing Highlight";
        proofStrip.layoutMode = "HORIZONTAL";
        proofStrip.counterAxisAlignItems = "CENTER";
        proofStrip.itemSpacing = 8;
        proofStrip.paddingLeft = 12;
        proofStrip.paddingRight = 12;
        proofStrip.paddingTop = 8;
        proofStrip.paddingBottom = 8;
        proofStrip.cornerRadius = 8;
        proofStrip.fills = [{ type: "SOLID", color: C.bgCanvas }];
        proofStrip.strokes = [{ type: "SOLID", color: C.borderLight }];
        proofStrip.strokeWeight = 1;
        proofStrip.appendChild(createTxt("CALIFORNIA IN-HOUSE:", 10.5, "Bold", C.blueDark));
        proofStrip.appendChild(createTxt("Laser, Screen & Deboss Mastered", 11, "Medium", C.slateBody));
        heroSection.appendChild(proofStrip);

        appendAndFill(root, heroSection);

        // ========================================================
        // 4. SECTION 2: FAST CATEGORY NAVIGATION TILES (8 Cards)
        // ========================================================
        currentStep = "4. category navigation";
        const catSection = figma.createFrame();
        catSection.name = "Section 2: Category Tiles";
        catSection.layoutMode = "VERTICAL";
        catSection.paddingLeft = 16;
        catSection.paddingRight = 16;
        catSection.paddingTop = 24;
        catSection.paddingBottom = 24;
        catSection.itemSpacing = 16;
        catSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        // Section Title & Link
        const catHead = figma.createFrame();
        catHead.name = "Category Header";
        catHead.layoutMode = "VERTICAL";
        catHead.itemSpacing = 4;
        catHead.fills = [];

        catHead.appendChild(createTxt("FAST PROCUREMENT NAVIGATION", 10.5, "Bold", C.bluePrimary, { letterSpacing: 0.8 }));
        catHead.appendChild(createTxt("Explore Core Product Categories", 20, "Bold", C.navySlate));
        catHead.appendChild(createTxt("View All 18 Catalog Categories →", 12.5, "SemiBold", C.blueDark));
        catSection.appendChild(catHead);

        // 8 Categories in 4 Rows of 2 Columns (each card 182px wide)
        const categoriesList = [
          { name: "Drinkware", sub: "Tumblers & Bottles", code: "042", hash: IMAGES.catDrinkware },
          { name: "Journals & Jotters", sub: "Debossed & Custom", code: "052", hash: IMAGES.catJournals },
          { name: "Padfolios", sub: "Executive Organizers", code: "059", hash: IMAGES.catPadfolios },
          { name: "Power Banks", sub: "Fast-Charge Tech", code: "060", hash: IMAGES.catPower },
          { name: "Metal Pens", sub: "Laser Engraved", code: "055", hash: IMAGES.catPens },
          { name: "Tote Bags", sub: "Heavy Canvas & Jute", code: "062", hash: IMAGES.catTotes },
          { name: "Card Cases", sub: "Magnetic & Metal", code: "027", hash: IMAGES.catCards },
          { name: "All Categories", sub: "Complete 18 Tiers", code: "+11 More", hash: null, isAll: true },
        ];

        const catGrid = figma.createFrame();
        catGrid.name = "Category Grid (2 Columns)";
        catGrid.layoutMode = "VERTICAL";
        catGrid.itemSpacing = 12;
        catGrid.fills = [];

        for (let r = 0; r < 4; r++) {
          const catRow = figma.createFrame();
          catRow.name = \`Row \${r + 1}\`;
          catRow.layoutMode = "HORIZONTAL";
          catRow.primaryAxisAlignItems = "SPACE_BETWEEN";
          catRow.counterAxisAlignItems = "CENTER";
          catRow.itemSpacing = 12;
          catRow.fills = [];

          const pair = categoriesList.slice(r * 2, r * 2 + 2);
          pair.forEach(item => {
            const card = figma.createFrame();
            card.name = item.name;
            card.resize(184, 130);
            card.layoutMode = "VERTICAL";
            card.primaryAxisAlignItems = "SPACE_BETWEEN";
            card.counterAxisAlignItems = "CENTER";
            card.paddingTop = 12;
            card.paddingBottom = 12;
            card.paddingLeft = 8;
            card.paddingRight = 8;
            card.cornerRadius = 14;
            card.fills = [{ type: "SOLID", color: C.bgPure }];
            card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
            card.strokeWeight = 1;

            if (item.isAll) {
              const allCircle = figma.createFrame();
              allCircle.name = "All Icon";
              allCircle.resize(60, 60);
              allCircle.cornerRadius = 30;
              allCircle.layoutMode = "HORIZONTAL";
              allCircle.primaryAxisAlignItems = "CENTER";
              allCircle.counterAxisAlignItems = "CENTER";
              allCircle.fills = [{ type: "SOLID", color: C.blueTint }];
              allCircle.appendChild(createTxt("+11", 16, "Bold", C.bluePrimary));
              card.appendChild(allCircle);
            } else {
              const iconBox = createImgNode("Icon", 60, 60, item.hash, "FIT", C.bgCanvas, 10);
              card.appendChild(iconBox);
            }

            const info = figma.createFrame();
            info.name = "Text";
            info.layoutMode = "VERTICAL";
            info.counterAxisAlignItems = "CENTER";
            info.itemSpacing = 2;
            info.fills = [];
            info.appendChild(createTxt(item.name, 12.5, "Bold", C.navySlate, { textAlignHorizontal: "CENTER" }));
            info.appendChild(createTxt(item.sub, 10.5, "Regular", C.slateMuted, { textAlignHorizontal: "CENTER" }));
            card.appendChild(info);

            catRow.appendChild(card);
          });

          catGrid.appendChild(catRow);
        }

        catSection.appendChild(catGrid);
        appendAndFill(root, catSection);

        // ========================================================
        // 5. SECTION 3: LIVE FILTER CONTROLS
        // ========================================================
        currentStep = "5. filter controls";
        const filterSection = figma.createFrame();
        filterSection.name = "Section 3: Filter Chips";
        filterSection.layoutMode = "VERTICAL";
        filterSection.paddingLeft = 16;
        filterSection.paddingRight = 16;
        filterSection.paddingTop = 14;
        filterSection.paddingBottom = 14;
        filterSection.itemSpacing = 10;
        filterSection.fills = [{ type: "SOLID", color: C.bgPure }];
        filterSection.strokes = [{ type: "SOLID", color: C.borderLight }];
        filterSection.strokeWeight = 1;

        const filterSummary = figma.createFrame();
        filterSummary.name = "Summary";
        filterSummary.layoutMode = "HORIZONTAL";
        filterSummary.counterAxisAlignItems = "CENTER";
        filterSummary.itemSpacing = 6;
        filterSummary.fills = [];
        filterSummary.appendChild(createTxt("Showing 4 Featured Distributor Products", 11.5, "SemiBold", C.navySlate));
        filterSummary.appendChild(createTxt("•", 10, "Regular", C.slateLight));
        filterSummary.appendChild(createTxt("Live Tiering", 11, "Medium", C.greenAccent));
        filterSection.appendChild(filterSummary);

        // Scrollable Horizontal Filter Chips
        const chipsRow = figma.createFrame();
        chipsRow.name = "Filter Chips";
        chipsRow.layoutMode = "HORIZONTAL";
        chipsRow.counterAxisAlignItems = "CENTER";
        chipsRow.itemSpacing = 8;
        chipsRow.fills = [];

        const chips = [
          { label: "All Products", active: true },
          { label: "Drinkware", active: false },
          { label: "Journals", active: false },
          { label: "Power & Tech", active: false },
          { label: "Accessories", active: false },
        ];

        chips.forEach(c => {
          const chip = figma.createFrame();
          chip.name = c.label;
          chip.layoutMode = "HORIZONTAL";
          chip.counterAxisAlignItems = "CENTER";
          chip.paddingLeft = 12;
          chip.paddingRight = 12;
          chip.paddingTop = 6;
          chip.paddingBottom = 6;
          chip.cornerRadius = 16;
          if (c.active) {
            chip.fills = [{ type: "SOLID", color: C.navySlate }];
            chip.appendChild(createTxt(c.label, 11.5, "SemiBold", C.bgPure));
          } else {
            chip.fills = [{ type: "SOLID", color: C.bgCanvas }];
            chip.strokes = [{ type: "SOLID", color: C.borderSubtle }];
            chip.strokeWeight = 1;
            chip.appendChild(createTxt(c.label, 11.5, "Medium", C.slateBody));
          }
          chipsRow.appendChild(chip);
        });

        filterSection.appendChild(chipsRow);
        appendAndFill(root, filterSection);

        // ========================================================
        // 6. SECTION 4: FEATURED PRODUCTS SHOWCASE (4 Cards Stacked)
        // ========================================================
        currentStep = "6. featured products";
        const featSection = figma.createFrame();
        featSection.name = "Section 4: Featured Products";
        featSection.layoutMode = "VERTICAL";
        featSection.paddingLeft = 16;
        featSection.paddingRight = 16;
        featSection.paddingTop = 24;
        featSection.paddingBottom = 24;
        featSection.itemSpacing = 20;
        featSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        // Header Row
        const featHead = figma.createFrame();
        featHead.name = "Header";
        featHead.layoutMode = "VERTICAL";
        featHead.itemSpacing = 4;
        featHead.fills = [];
        featHead.appendChild(createTxt("Featured products", 22, "Bold", C.navySlate));
        featHead.appendChild(createTxt("Price per unit. It drops as quantity rises.", 13, "Regular", C.slateBody));
        featHead.appendChild(createTxt("View all products →", 12.5, "SemiBold", C.bluePrimary));
        featSection.appendChild(featHead);

        // 4 Mobile Product Cards
        const productsList = [
          {
            sku: "TX-2107",
            tag: "Fast 3-Day Turnaround",
            title: "Pro Series | Elite TPU Leather Business Card Holder",
            desc: "Premium soft-touch TPU casing with magnetic catch, structured aluminum casing for everyday business impact.",
            price: "$8.98 to $11.50",
            moq: "MOQ: 50 pcs",
            tier: "Tier: $8.98 @ 500+",
            hash: IMAGES.prodTX2107,
          },
          {
            sku: "DW-8966",
            tag: "24hr Cold / 12hr Hot",
            title: "Summit 32oz Double Wall Vacuum Insulated 18/8",
            desc: "Pro-grade 18/8 stainless steel, sweat-free durable powder coat, copper vacuum lining for all-day thermal performance.",
            price: "$10.28 to $12.62",
            moq: "MOQ: 48 pcs",
            tier: "Tier: $10.28 @ 288+",
            hash: IMAGES.prodDW8966,
          },
          {
            sku: "EX-8067",
            tag: "UL Certified Cell",
            title: "Madison 4000 mAh Slim Power Bank",
            desc: "Ultra-slim profile aircraft aluminum battery pack with intelligent surge protector and fast-charge output circuitry.",
            price: "$9.98 to $9.98",
            moq: "MOQ: 25 pcs",
            tier: "Flat Distributor Rate",
            hash: IMAGES.prodEX8067,
          },
          {
            sku: "TX-916958",
            tag: "Realtor & Closing Gift",
            title: "Sweethome Key Chain",
            desc: "Solid zinc alloy house silhouette design with heavy mirror chrome plating and laser-engraved custom finish.",
            price: "$3.88 to $4.97",
            moq: "MOQ: 100 pcs",
            tier: "Tier: $3.88 @ 1000+",
            hash: IMAGES.prodTX916958,
          },
        ];

        productsList.forEach(p => {
          const pCard = figma.createFrame();
          pCard.name = \`Product: \${p.sku}\`;
          pCard.resize(380, 430);
          pCard.layoutMode = "VERTICAL";
          pCard.cornerRadius = 16;
          pCard.clipsContent = true;
          pCard.fills = [{ type: "SOLID", color: C.bgPure }];
          pCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          pCard.strokeWeight = 1;

          // Product Image Container
          const pImgContainer = figma.createFrame();
          pImgContainer.name = "Image Area";
          pImgContainer.resize(380, 200);
          pImgContainer.layoutMode = "NONE";
          pImgContainer.fills = [{ type: "SOLID", color: C.bgCanvas }];

          const pPhoto = createImgNode("Photo", 180, 180, p.hash, "FIT", null, 0);
          pPhoto.x = 100;
          pPhoto.y = 10;
          pImgContainer.appendChild(pPhoto);

          // Top Left Badges
          const pBadges = figma.createFrame();
          pBadges.name = "Badges";
          pBadges.layoutMode = "HORIZONTAL";
          pBadges.itemSpacing = 6;
          pBadges.fills = [];
          pBadges.x = 12;
          pBadges.y = 12;

          const featBadge = figma.createFrame();
          featBadge.name = "Featured";
          featBadge.paddingLeft = 8;
          featBadge.paddingRight = 8;
          featBadge.paddingTop = 4;
          featBadge.paddingBottom = 4;
          featBadge.cornerRadius = 4;
          featBadge.fills = [{ type: "SOLID", color: C.navySlate }];
          featBadge.appendChild(createTxt("FEATURED", 9.5, "Bold", C.bgPure, { letterSpacing: 0.5 }));
          pBadges.appendChild(featBadge);

          const skuBadge = figma.createFrame();
          skuBadge.name = "SKU";
          skuBadge.paddingLeft = 8;
          skuBadge.paddingRight = 8;
          skuBadge.paddingTop = 4;
          skuBadge.paddingBottom = 4;
          skuBadge.cornerRadius = 4;
          skuBadge.fills = [{ type: "SOLID", color: C.bgPure }];
          skuBadge.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          skuBadge.strokeWeight = 1;
          skuBadge.appendChild(createTxt(\`SKU: \${p.sku}\`, 10, "Bold", C.slateBody));
          pBadges.appendChild(skuBadge);

          pImgContainer.appendChild(pBadges);
          pCard.appendChild(pImgContainer);

          // Card Content Body
          const pBody = figma.createFrame();
          pBody.name = "Content";
          pBody.resize(380, 230);
          pBody.layoutMode = "VERTICAL";
          pBody.paddingLeft = 16;
          pBody.paddingRight = 16;
          pBody.paddingTop = 14;
          pBody.paddingBottom = 16;
          pBody.itemSpacing = 10;
          pBody.fills = [];

          // Feature pill
          const tagTxt = createTxt(p.tag, 11, "SemiBold", C.blueDark);
          pBody.appendChild(tagTxt);

          // Title
          const titleTxt = createTxt(p.title, 14.5, "SemiBold", C.navySlate, { lineHeight: 20 });
          titleTxt.resize(348, 40);
          pBody.appendChild(titleTxt);

          // Pricing Row & Tier
          const priceRow = figma.createFrame();
          priceRow.name = "Pricing Row";
          priceRow.layoutMode = "HORIZONTAL";
          priceRow.primaryAxisAlignItems = "SPACE_BETWEEN";
          priceRow.counterAxisAlignItems = "BASELINE";
          priceRow.fills = [];

          const priceLeft = figma.createFrame();
          priceLeft.name = "Price Range";
          priceLeft.layoutMode = "HORIZONTAL";
          priceLeft.itemSpacing = 4;
          priceLeft.counterAxisAlignItems = "BASELINE";
          priceLeft.fills = [];
          priceLeft.appendChild(createTxt("UNIT:", 10, "Bold", C.slateMuted));
          priceLeft.appendChild(createTxt(p.price, 15, "Bold", C.navySlate));
          priceRow.appendChild(priceLeft);

          const tierTxt = createTxt(p.tier, 11, "Medium", C.greenAccent);
          priceRow.appendChild(tierTxt);
          pBody.appendChild(priceRow);

          // Button Row
          const btnRow = figma.createFrame();
          btnRow.name = "Button Row";
          btnRow.layoutMode = "HORIZONTAL";
          btnRow.primaryAxisAlignItems = "SPACE_BETWEEN";
          btnRow.counterAxisAlignItems = "CENTER";
          btnRow.fills = [];

          btnRow.appendChild(createTxt(p.moq, 11.5, "Regular", C.slateMuted));

          const reqBtn = figma.createFrame();
          reqBtn.name = "Request quote";
          reqBtn.layoutMode = "HORIZONTAL";
          reqBtn.counterAxisAlignItems = "CENTER";
          reqBtn.paddingLeft = 18;
          reqBtn.paddingRight = 18;
          reqBtn.paddingTop = 9;
          reqBtn.paddingBottom = 9;
          reqBtn.cornerRadius = 8;
          reqBtn.fills = [{ type: "SOLID", color: C.navySlate }];
          reqBtn.appendChild(createTxt("Request quote", 12.5, "SemiBold", C.bgPure));
          btnRow.appendChild(reqBtn);

          pBody.appendChild(btnRow);
          pCard.appendChild(pBody);
          featSection.appendChild(pCard);
        });

        // Disclaimer Note
        const featNote = figma.createFrame();
        featNote.name = "Disclaimer Note";
        featNote.layoutMode = "HORIZONTAL";
        featNote.paddingLeft = 14;
        featNote.paddingRight = 14;
        featNote.paddingTop = 10;
        featNote.paddingBottom = 10;
        featNote.cornerRadius = 8;
        featNote.fills = [{ type: "SOLID", color: C.bgPure }];
        featNote.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        featNote.strokeWeight = 1;

        const noteText = createTxt(
          "Prices for the featured items come from the live site. Other products are image placeholders; connect the product feed for real names, SKUs and tiers.",
          11,
          "Regular",
          C.slateMuted,
          { lineHeight: 16 }
        );
        noteText.resize(352, 48);
        featNote.appendChild(noteText);
        featSection.appendChild(featNote);

        appendAndFill(root, featSection);

        // ========================================================
        // 7. SECTION 5: DEDICATED SOURCING & ASSISTANCE BANNER
        // ========================================================
        currentStep = "7. assistance banner";
        const assistWrap = figma.createFrame();
        assistWrap.name = "Section 5: Assistance Banner";
        assistWrap.layoutMode = "VERTICAL";
        assistWrap.paddingLeft = 16;
        assistWrap.paddingRight = 16;
        assistWrap.paddingTop = 20;
        assistWrap.paddingBottom = 20;
        assistWrap.fills = [{ type: "SOLID", color: C.bgPure }];

        const assistCard = figma.createFrame();
        assistCard.name = "Assistance Card";
        assistCard.resize(380, 280);
        assistCard.layoutMode = "VERTICAL";
        assistCard.paddingLeft = 20;
        assistCard.paddingRight = 20;
        assistCard.paddingTop = 22;
        assistCard.paddingBottom = 22;
        assistCard.itemSpacing = 14;
        assistCard.cornerRadius = 18;
        assistCard.fills = [{ type: "SOLID", color: C.navySlate }];

        assistCard.appendChild(createTxt("DEDICATED SOURCING DESK", 10.5, "Bold", C.skyAccent, { letterSpacing: 1 }));

        const assistTitle = createTxt(
          "Not sure what to choose? Share your budget, quantity and deadline, and we will suggest options.",
          17,
          "Bold",
          C.bgPure,
          { lineHeight: 24 }
        );
        assistTitle.resize(340, 72);
        assistCard.appendChild(assistTitle);

        const assistDesc = createTxt(
          "Our California product specialists curate tailored presentations with distributor net pricing within 2 business hours.",
          12,
          "Regular",
          { r: 0.75, g: 0.82, b: 0.92 },
          { lineHeight: 18 }
        );
        assistDesc.resize(340, 36);
        assistCard.appendChild(assistDesc);

        // CTAs Row
        const assistActions = figma.createFrame();
        assistActions.name = "Actions";
        assistActions.layoutMode = "HORIZONTAL";
        assistActions.primaryAxisAlignItems = "SPACE_BETWEEN";
        assistActions.counterAxisAlignItems = "CENTER";
        assistActions.itemSpacing = 10;
        assistActions.fills = [];

        const reqQuoteBtn = figma.createFrame();
        reqQuoteBtn.name = "Request quote";
        reqQuoteBtn.resize(165, 42);
        reqQuoteBtn.layoutMode = "HORIZONTAL";
        reqQuoteBtn.primaryAxisAlignItems = "CENTER";
        reqQuoteBtn.counterAxisAlignItems = "CENTER";
        reqQuoteBtn.cornerRadius = 10;
        reqQuoteBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
        reqQuoteBtn.appendChild(createTxt("Request a quote", 13, "SemiBold", C.bgPure));
        assistActions.appendChild(reqQuoteBtn);

        const callBtn = figma.createFrame();
        callBtn.name = "Click to call";
        callBtn.resize(165, 42);
        callBtn.layoutMode = "HORIZONTAL";
        callBtn.primaryAxisAlignItems = "CENTER";
        callBtn.counterAxisAlignItems = "CENTER";
        callBtn.cornerRadius = 10;
        callBtn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
        callBtn.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.25 }];
        callBtn.strokeWeight = 1;
        callBtn.appendChild(createTxt("Click to call", 13, "SemiBold", C.bgPure));
        assistActions.appendChild(callBtn);

        assistCard.appendChild(assistActions);
        assistWrap.appendChild(assistCard);
        appendAndFill(root, assistWrap);

        // ========================================================
        // 8. SECTION 6: ORDERING RESOURCES & TRUST CREDENTIALS HUB
        // ========================================================
        currentStep = "8. ordering resources";
        const resSection = figma.createFrame();
        resSection.name = "Section 6: Resources & Trust";
        resSection.layoutMode = "VERTICAL";
        resSection.paddingLeft = 16;
        resSection.paddingRight = 16;
        resSection.paddingTop = 24;
        resSection.paddingBottom = 24;
        resSection.itemSpacing = 20;
        resSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        const resHead = figma.createFrame();
        resHead.name = "Header";
        resHead.layoutMode = "VERTICAL";
        resHead.itemSpacing = 4;
        resHead.fills = [];
        resHead.appendChild(createTxt("SELF-SERVICE DISTRIBUTOR TOOLS", 10.5, "Bold", C.bluePrimary, { letterSpacing: 0.8 }));
        resHead.appendChild(createTxt("Ordering Resources", 22, "Bold", C.navySlate));
        resSection.appendChild(resHead);

        // 4 Resource Cards (Stacked)
        const resCards = [
          { title: "E-catalog", sub: "Browse the full catalog", tag: "Flip Virtual Pages" },
          { title: "E-flyers", sub: "Current promotions", tag: "Download High-Res PDF" },
          { title: "Decoration price guide", sub: "Imprint options and costs", tag: "View Setup & Run Fees" },
          { title: "How to order", sub: "From quote to delivery", tag: "Workflow & Art Specs" },
        ];

        resCards.forEach(r => {
          const rCard = figma.createFrame();
          rCard.name = r.title;
          rCard.resize(380, 84);
          rCard.layoutMode = "HORIZONTAL";
          rCard.primaryAxisAlignItems = "SPACE_BETWEEN";
          rCard.counterAxisAlignItems = "CENTER";
          rCard.paddingLeft = 16;
          rCard.paddingRight = 16;
          rCard.paddingTop = 14;
          rCard.paddingBottom = 14;
          rCard.cornerRadius = 12;
          rCard.fills = [{ type: "SOLID", color: C.bgPure }];
          rCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          rCard.strokeWeight = 1;

          const rLeft = figma.createFrame();
          rLeft.name = "Text";
          rLeft.layoutMode = "VERTICAL";
          rLeft.itemSpacing = 3;
          rLeft.fills = [];
          rLeft.appendChild(createTxt(r.title, 14, "Bold", C.navySlate));
          rLeft.appendChild(createTxt(r.sub, 12, "Regular", C.slateBody));
          rCard.appendChild(rLeft);

          const rRightTag = figma.createFrame();
          rRightTag.name = "Action Tag";
          rRightTag.layoutMode = "HORIZONTAL";
          rRightTag.paddingLeft = 8;
          rRightTag.paddingRight = 8;
          rRightTag.paddingTop = 4;
          rRightTag.paddingBottom = 4;
          rRightTag.cornerRadius = 6;
          rRightTag.fills = [{ type: "SOLID", color: C.blueTint }];
          rRightTag.appendChild(createTxt(r.tag, 10, "SemiBold", C.blueDark));
          rCard.appendChild(rRightTag);

          resSection.appendChild(rCard);
        });

        // 3 Trust Proof Cards (Rating, ASI 5-Star, Quantity Pricing)
        const statsData = [
          {
            badge: "1",
            title: "Rated #1 in California",
            desc: "Top 10 in the nation for customer satisfaction.",
          },
          {
            badge: "★",
            title: "ASI 5-Star supplier",
            desc: "PRO Supplier and 2018 SAGE Rated Supplier.",
          },
          {
            badge: "$",
            title: "Quantity-based pricing",
            desc: "Shown on every product, so you can compare.",
          },
        ];

        statsData.forEach(s => {
          const sCard = figma.createFrame();
          sCard.name = s.title;
          sCard.resize(380, 78);
          sCard.layoutMode = "HORIZONTAL";
          sCard.counterAxisAlignItems = "CENTER";
          sCard.paddingLeft = 16;
          sCard.paddingRight = 16;
          sCard.itemSpacing = 14;
          sCard.cornerRadius = 14;
          sCard.fills = [{ type: "SOLID", color: C.bgPure }];
          sCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          sCard.strokeWeight = 1;

          const badgeBox = figma.createFrame();
          badgeBox.name = "Badge";
          badgeBox.resize(40, 40);
          badgeBox.cornerRadius = 20;
          badgeBox.layoutMode = "HORIZONTAL";
          badgeBox.primaryAxisAlignItems = "CENTER";
          badgeBox.counterAxisAlignItems = "CENTER";
          badgeBox.fills = [{ type: "SOLID", color: C.blueTint }];
          badgeBox.appendChild(createTxt(s.badge, 16, "Bold", C.bluePrimary));
          sCard.appendChild(badgeBox);

          const sCopy = figma.createFrame();
          sCopy.name = "Copy";
          sCopy.layoutMode = "VERTICAL";
          sCopy.itemSpacing = 2;
          sCopy.fills = [];
          sCopy.appendChild(createTxt(s.title, 13.5, "Bold", C.navySlate));
          sCopy.appendChild(createTxt(s.desc, 11.5, "Regular", C.slateBody));
          sCard.appendChild(sCopy);

          resSection.appendChild(sCard);
        });

        // Real Awards Banner Image Card (380px wide)
        const awardsCard = figma.createFrame();
        awardsCard.name = "Awards Graphic Card";
        awardsCard.resize(380, 80);
        awardsCard.cornerRadius = 12;
        awardsCard.clipsContent = true;
        awardsCard.layoutMode = "VERTICAL";
        awardsCard.primaryAxisAlignItems = "CENTER";
        awardsCard.counterAxisAlignItems = "CENTER";
        awardsCard.paddingLeft = 8;
        awardsCard.paddingRight = 8;
        awardsCard.paddingTop = 8;
        awardsCard.paddingBottom = 8;
        awardsCard.fills = [{ type: "SOLID", color: C.bgPure }];
        awardsCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        awardsCard.strokeWeight = 1;

        const awardsImg = createImgNode("Awards Graphic", 364, 64, IMAGES.awardsGraphic, "FIT", null, 0);
        awardsCard.appendChild(awardsImg);
        resSection.appendChild(awardsCard);

        appendAndFill(root, resSection);

        // ========================================================
        // 9. SECTION 7: DISTRIBUTOR PORTAL CALLOUT
        // ========================================================
        currentStep = "9. distributor portal";
        const portalWrap = figma.createFrame();
        portalWrap.name = "Section 7: Distributor Portal";
        portalWrap.layoutMode = "VERTICAL";
        portalWrap.paddingLeft = 16;
        portalWrap.paddingRight = 16;
        portalWrap.paddingTop = 20;
        portalWrap.paddingBottom = 20;
        portalWrap.fills = [{ type: "SOLID", color: C.bgPure }];

        const portalCard = figma.createFrame();
        portalCard.name = "Distributor Card";
        portalCard.resize(380, 290);
        portalCard.layoutMode = "VERTICAL";
        portalCard.paddingLeft = 20;
        portalCard.paddingRight = 20;
        portalCard.paddingTop = 22;
        portalCard.paddingBottom = 22;
        portalCard.itemSpacing = 14;
        portalCard.cornerRadius = 18;
        portalCard.fills = [{ type: "SOLID", color: C.navyDark }];

        portalCard.appendChild(createTxt("VERIFIED DISTRIBUTOR ACCESS ONLY", 10.5, "Bold", C.skyAccent, { letterSpacing: 1 }));

        const portalTitle = createTxt(
          "Are you a distributor? Log in to see your pricing and track orders.",
          18,
          "Bold",
          C.bgPure,
          { lineHeight: 24 }
        );
        portalTitle.resize(340, 48);
        portalCard.appendChild(portalTitle);

        const portalDesc = createTxt(
          "Unlock confidential EQP pricing tiers, instantaneous online vector art proof approvals, real-time live inventory levels, and California warehouse tracking.",
          12,
          "Regular",
          { r: 0.75, g: 0.82, b: 0.92 },
          { lineHeight: 18 }
        );
        portalDesc.resize(340, 54);
        portalCard.appendChild(portalDesc);

        // Buttons Row
        const portalBtns = figma.createFrame();
        portalBtns.name = "Portal Buttons";
        portalBtns.layoutMode = "HORIZONTAL";
        portalBtns.primaryAxisAlignItems = "SPACE_BETWEEN";
        portalBtns.counterAxisAlignItems = "CENTER";
        portalBtns.itemSpacing = 10;
        portalBtns.fills = [];

        const logInBtn = figma.createFrame();
        logInBtn.name = "Log in";
        logInBtn.resize(165, 42);
        logInBtn.layoutMode = "HORIZONTAL";
        logInBtn.primaryAxisAlignItems = "CENTER";
        logInBtn.counterAxisAlignItems = "CENTER";
        logInBtn.cornerRadius = 10;
        logInBtn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
        logInBtn.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.25 }];
        logInBtn.strokeWeight = 1;
        logInBtn.appendChild(createTxt("Log in", 13.5, "SemiBold", C.bgPure));
        portalBtns.appendChild(logInBtn);

        const registerBtn = figma.createFrame();
        registerBtn.name = "Register";
        registerBtn.resize(165, 42);
        registerBtn.layoutMode = "HORIZONTAL";
        registerBtn.primaryAxisAlignItems = "CENTER";
        registerBtn.counterAxisAlignItems = "CENTER";
        registerBtn.cornerRadius = 10;
        registerBtn.fills = [{ type: "SOLID", color: C.bgPure }];
        registerBtn.appendChild(createTxt("Register", 13.5, "SemiBold", C.navyDark));
        portalBtns.appendChild(registerBtn);

        portalCard.appendChild(portalBtns);
        portalWrap.appendChild(portalCard);
        appendAndFill(root, portalWrap);

        // ========================================================
        // 10. ENTERPRISE MOBILE FOOTER
        // ========================================================
        currentStep = "10. mobile footer";
        const footer = figma.createFrame();
        footer.name = "Enterprise Mobile Footer";
        footer.layoutMode = "VERTICAL";
        footer.paddingLeft = 16;
        footer.paddingRight = 16;
        footer.paddingTop = 32;
        footer.paddingBottom = 32;
        footer.itemSpacing = 24;
        footer.fills = [{ type: "SOLID", color: C.darkFooter }];

        // Newsletter Box
        const newsCard = figma.createFrame();
        newsCard.name = "Newsletter Box";
        newsCard.layoutMode = "VERTICAL";
        newsCard.itemSpacing = 10;
        newsCard.fills = [];

        newsCard.appendChild(createTxt("STAY INFORMED ON TIER BREAKS & OVERSTOCK FLASHES", 10.5, "Bold", C.skyAccent, { letterSpacing: 0.8 }));
        newsCard.appendChild(createTxt("Special distributor offers, straight to your inbox.", 13, "Regular", { r: 0.75, g: 0.82, b: 0.92 }));

        const newsInput = figma.createFrame();
        newsInput.name = "Newsletter Input";
        newsInput.resize(380, 44);
        newsInput.layoutMode = "HORIZONTAL";
        newsInput.primaryAxisAlignItems = "SPACE_BETWEEN";
        newsInput.counterAxisAlignItems = "CENTER";
        newsInput.paddingLeft = 12;
        newsInput.paddingRight = 6;
        newsInput.cornerRadius = 8;
        newsInput.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        newsInput.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.15 }];
        newsInput.strokeWeight = 1;

        newsInput.appendChild(createTxt("distributor.rep@company.com", 12.5, "Regular", { r: 0.5, g: 0.55, b: 0.65 }));

        const subBtn = figma.createFrame();
        subBtn.name = "Subscribe";
        subBtn.layoutMode = "HORIZONTAL";
        subBtn.counterAxisAlignItems = "CENTER";
        subBtn.paddingLeft = 14;
        subBtn.paddingRight = 14;
        subBtn.paddingTop = 8;
        subBtn.paddingBottom = 8;
        subBtn.cornerRadius = 6;
        subBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
        subBtn.appendChild(createTxt("Subscribe", 12, "SemiBold", C.bgPure));
        newsInput.appendChild(subBtn);

        newsCard.appendChild(newsInput);
        footer.appendChild(newsCard);

        // Divider
        const fDiv1 = figma.createFrame();
        fDiv1.name = "Divider";
        fDiv1.resize(380, 1);
        fDiv1.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        footer.appendChild(fDiv1);

        // Brand & Mission
        const brandFooter = figma.createFrame();
        brandFooter.name = "Brand Info";
        brandFooter.layoutMode = "VERTICAL";
        brandFooter.itemSpacing = 8;
        brandFooter.fills = [];

        const fLogo = figma.createFrame();
        fLogo.name = "Logo";
        fLogo.layoutMode = "HORIZONTAL";
        fLogo.itemSpacing = 4;
        fLogo.fills = [];
        fLogo.appendChild(createTxt("POSH", 16, "Bold", C.bgPure));
        fLogo.appendChild(createTxt("XESSORIES", 16, "Bold", C.bluePrimary));
        brandFooter.appendChild(fLogo);

        brandFooter.appendChild(createTxt("ASI 79028 | PPAI 206478 | SAGE 64870 | UPIC POSHX", 10, "Medium", { r: 0.6, g: 0.68, b: 0.78 }));

        const fMission = createTxt(
          "Posh Xessories, Inc. was started with one mission: help people make the best impressions at the best price. Precision wholesale supply chain, in-house master embellishment, and award-winning California delivery speeds.",
          11.5,
          "Regular",
          { r: 0.65, g: 0.72, b: 0.82 },
          { lineHeight: 18 }
        );
        fMission.resize(380, 54);
        brandFooter.appendChild(fMission);

        brandFooter.appendChild(createTxt("📍 14250 Monte Vista Ave, Chino, CA 91710", 11.5, "Medium", { r: 0.8, g: 0.85, b: 0.95 }));
        brandFooter.appendChild(createTxt("Distributor Hotline: (800) 555-POSH", 11.5, "SemiBold", C.skyAccent));
        footer.appendChild(brandFooter);

        // Divider
        const fDiv2 = figma.createFrame();
        fDiv2.name = "Divider";
        fDiv2.resize(380, 1);
        fDiv2.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        footer.appendChild(fDiv2);

        // Links 2-Column Grid
        const linksGrid = figma.createFrame();
        linksGrid.name = "Footer Links Grid";
        linksGrid.layoutMode = "HORIZONTAL";
        linksGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
        linksGrid.fills = [];

        // Col 1: Ordering & Resources
        const col1 = figma.createFrame();
        col1.name = "Ordering & Resources";
        col1.resize(180, 140);
        col1.layoutMode = "VERTICAL";
        col1.itemSpacing = 8;
        col1.fills = [];
        col1.appendChild(createTxt("Ordering & Resources", 12.5, "Bold", C.bgPure));
        const resLinks = [
          "How to Place Wholesale Orders",
          "Decoration & Imprint Matrix",
          "Interactive E-Catalog",
          "Vector Art Specs",
          "Wholesale Terms & Privacy",
        ];
        resLinks.forEach(l => {
          col1.appendChild(createTxt(l, 11, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        });
        linksGrid.appendChild(col1);

        // Col 2: Company & Recognition
        const col2 = figma.createFrame();
        col2.name = "Company & Recognition";
        col2.resize(180, 140);
        col2.layoutMode = "VERTICAL";
        col2.itemSpacing = 8;
        col2.fills = [];
        col2.appendChild(createTxt("Company & Recognition", 12.5, "Bold", C.bgPure));
        const compLinks = [
          "California Embellishment Plant",
          "Distributor Reviews & Cases",
          "Industry Awards & Press",
          "Contact Sourcing Desk",
          "Click to Call",
        ];
        compLinks.forEach(l => {
          col2.appendChild(createTxt(l, 11, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        });
        linksGrid.appendChild(col2);

        footer.appendChild(linksGrid);

        // Divider
        const fDiv3 = figma.createFrame();
        fDiv3.name = "Divider";
        fDiv3.resize(380, 1);
        fDiv3.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        footer.appendChild(fDiv3);

        // Bottom Legal
        const legalRow = figma.createFrame();
        legalRow.name = "Legal Notice";
        legalRow.layoutMode = "VERTICAL";
        legalRow.itemSpacing = 4;
        legalRow.fills = [];
        legalRow.appendChild(createTxt("Design prototype, not connected to the live store.", 11, "Regular", { r: 0.45, g: 0.5, b: 0.6 }));
        legalRow.appendChild(createTxt("© PoshXessories. All rights reserved.", 11, "Regular", { r: 0.45, g: 0.5, b: 0.6 }));
        footer.appendChild(legalRow);

        appendAndFill(root, footer);

        // Select and zoom into the newly created mobile frame
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
          childrenCount: root.children.length,
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

  console.log("Sending Mobile UI Redesign script to Figma...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 40000,
    }),
  });

  const data = await res.json();
  console.log("Result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
