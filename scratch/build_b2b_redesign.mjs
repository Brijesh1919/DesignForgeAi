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

        // All 26 Verified Image Hashes
        const IMAGES = {
          heroJournal: "df4bba0a9467ce46cfaf29ff39a3bef993fb82ba",
          heroMiniSpec: "bbdf1340bd6a32fecd172be4550d12a0fc3bb6aa",
          
          // 18 Categories
          catBarware: "04b9f14f9c2527cdf8b50c025e4859c3cd3135f7",
          catSpeakers: "2a98b25ec110b5e02bde670a5b3e02f08a133017",
          catCards: "bbdf1340bd6a32fecd172be4550d12a0fc3bb6aa",
          catCloseout: "79b6c3d2940092833d90707b6d34bc364460ea2f",
          catPackaging: "496b77b83173f70b2b669e5d3703ca8f6d7b377b",
          catDrinkware: "f44f1cdbedc29a6c042df9e1ca4e2bcbf24619b4",
          catElectronics: "488728e78802a2610b9e8d68a0368fa02585dde0",
          catJournals: "177c0a367135133a51bfc5572965f036c86b6d35",
          catJrPadfolios: "0aef375709775d9df03e1cec03cf9d610c822b18",
          catLuggage: "feab3dc1e1c830e0019a4cc1ed88005cae1237df",
          catPens: "3ba2efb65f0c27636ff3889ceff6053540911c78",
          catMobile: "0e2563b1b3a585fc3324ffb6737faa91d6746c77",
          catNovelties: "e2d01f28890179d0491ebd67820465d82fd16dbc",
          catPadfolios: "6431f4bf4699b9c6f00a2d704f66e77818bb8d51",
          catPower: "461b3ab29b75be77c438a1193451cda0d8b9b35f",
          catStylus: "959be2537419aebc8677079edfeab6f4a622f1be",
          catTotes: "fc790411bbc1af8e831c239234a424bc2a8a9d35",
          catTravel: "feab3dc1e1c830e0019a4cc1ed88005cae1237df",

          // 6 Popular Products
          prodTX2107: "bbdf1340bd6a32fecd172be4550d12a0fc3bb6aa",
          prodTX2207: "b1c783a5fd66f6ad350d50a8abd6f868b94a352d",
          prodTX8810: "19f197e33989c4b558be6c7cf9281ea405bd6ba3",
          prodTX916958: "55719ae740899f24d957a7d74a47a9877ad48f8d",
          prodEX8067: "74a1a6ae11ac82b38c12baded0399cdecc427afa",
          prodDW8966: "47851d5b18c67a22347d97e8c9bfabce3ecc1089",

          // Promo Banners
          promoTravel: "c0f3dad7f1df9d2dc0138744e3f116e6bc053d17",
          promoNovelties: "78dbfde2ceacea30742c15a42d9f1018e05988d5",

          // Awards Banner
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
        function appendAndFill(parent, child) {
          parent.appendChild(child);
          try {
            child.layoutSizingHorizontal = "FILL";
          } catch (e) {
            console.warn("Could not set FILL:", child.name, e);
          }
        }

        // Remove old redesign frame or orphan frames if already exist
        currentStep = "remove old frames";
        const oldRedesign = figma.currentPage.children.filter(c => 
          c.name.includes("Posh Xessories | Corporate B2B Redesign") ||
          c.name === "Top Bar Container"
        );
        for (const old of oldRedesign) {
          old.remove();
        }

        // Create Root Page Frame
        currentStep = "create root frame";
        const root = figma.createFrame();
        root.name = "Posh Xessories | Corporate B2B Redesign (1440)";
        root.resize(1440, 5200);
        root.x = 12507;
        root.y = 0;
        root.layoutMode = "VERTICAL";
        root.primaryAxisSizingMode = "AUTO";
        root.counterAxisSizingMode = "FIXED";
        root.itemSpacing = 0;
        root.fills = [{ type: "SOLID", color: C.bgPure }];

        // ========================================================
        // 1. TOP UTILITY & CERTIFICATION STRIP
        // ========================================================
        currentStep = "1. top strip";
        const topStrip = figma.createFrame();
        topStrip.name = "Top Bar Container";
        topStrip.layoutMode = "HORIZONTAL";
        topStrip.primaryAxisAlignItems = "SPACE_BETWEEN";
        topStrip.counterAxisAlignItems = "CENTER";
        topStrip.paddingLeft = 80;
        topStrip.paddingRight = 80;
        topStrip.paddingTop = 8;
        topStrip.paddingBottom = 8;
        topStrip.fills = [{ type: "SOLID", color: C.navyDark }];

        // Left Badges
        const certLeft = figma.createFrame();
        certLeft.name = "Certifications";
        certLeft.layoutMode = "HORIZONTAL";
        certLeft.counterAxisAlignItems = "CENTER";
        certLeft.itemSpacing = 12;
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
            const sep = createTxt("|", 11, "Regular", { r: 0.4, g: 0.45, b: 0.55 });
            certLeft.appendChild(sep);
          }
        });
        topStrip.appendChild(certLeft);

        // Right Utility Links
        const topLinks = figma.createFrame();
        topLinks.name = "Utility Links";
        topLinks.layoutMode = "HORIZONTAL";
        topLinks.counterAxisAlignItems = "CENTER";
        topLinks.itemSpacing = 20;
        topLinks.fills = [];

        topLinks.appendChild(createTxt("Compare product (0)", 12, "Medium", { r: 0.75, g: 0.82, b: 0.92 }));
        topLinks.appendChild(createTxt("•", 10, "Regular", { r: 0.4, g: 0.45, b: 0.55 }));
        topLinks.appendChild(createTxt("Login", 12.5, "SemiBold", C.bgPure));
        topLinks.appendChild(createTxt("•", 10, "Regular", { r: 0.4, g: 0.45, b: 0.55 }));
        topLinks.appendChild(createTxt("Register", 12.5, "SemiBold", C.skyAccent));
        topStrip.appendChild(topLinks);

        appendAndFill(root, topStrip);

        // ========================================================
        // 2. MAIN HEADER & CATEGORY SUBNAV
        // ========================================================
        currentStep = "2. header";
        const headerWrap = figma.createFrame();
        headerWrap.name = "Header & Navigation Wrap";
        headerWrap.layoutMode = "VERTICAL";
        headerWrap.fills = [{ type: "SOLID", color: C.bgPure }];
        headerWrap.strokes = [{ type: "SOLID", color: C.borderLight }];
        headerWrap.strokeWeight = 1;

        // Main Navbar Row (72px)
        const mainNav = figma.createFrame();
        mainNav.name = "Main Nav Row";
        mainNav.layoutMode = "HORIZONTAL";
        mainNav.primaryAxisAlignItems = "SPACE_BETWEEN";
        mainNav.counterAxisAlignItems = "CENTER";
        mainNav.paddingLeft = 80;
        mainNav.paddingRight = 80;
        mainNav.paddingTop = 14;
        mainNav.paddingBottom = 14;
        mainNav.fills = [];

        // Logo
        const brandGroup = figma.createFrame();
        brandGroup.name = "Brand Group";
        brandGroup.layoutMode = "HORIZONTAL";
        brandGroup.counterAxisAlignItems = "CENTER";
        brandGroup.itemSpacing = 12;
        brandGroup.fills = [];

        const logoBadge = figma.createFrame();
        logoBadge.name = "Logo Emblem";
        logoBadge.resize(38, 38);
        logoBadge.cornerRadius = 10;
        logoBadge.layoutMode = "HORIZONTAL";
        logoBadge.primaryAxisAlignItems = "CENTER";
        logoBadge.counterAxisAlignItems = "CENTER";
        logoBadge.fills = [{ type: "SOLID", color: C.navySlate }];
        logoBadge.appendChild(createTxt("PX", 16, "Bold", C.bgPure));
        brandGroup.appendChild(logoBadge);

        const brandTextCol = figma.createFrame();
        brandTextCol.name = "Brand Text";
        brandTextCol.layoutMode = "VERTICAL";
        brandTextCol.itemSpacing = 2;
        brandTextCol.fills = [];

        const wordmark = figma.createFrame();
        wordmark.name = "Wordmark";
        wordmark.layoutMode = "HORIZONTAL";
        wordmark.itemSpacing = 4;
        wordmark.counterAxisAlignItems = "CENTER";
        wordmark.fills = [];
        wordmark.appendChild(createTxt("POSH", 20, "Bold", C.navySlate));
        wordmark.appendChild(createTxt("XESSORIES", 20, "Bold", C.bluePrimary));
        brandTextCol.appendChild(wordmark);

        brandTextCol.appendChild(createTxt("ASI 79028 | PPAI 206478 | SAGE 64870 | UPIC POSHX", 9, "Medium", C.slateMuted));
        brandGroup.appendChild(brandTextCol);
        mainNav.appendChild(brandGroup);

        // Center Unified Search Bar (520px)
        const searchBox = figma.createFrame();
        searchBox.name = "Search Bar Container";
        searchBox.resize(520, 48);
        searchBox.layoutMode = "HORIZONTAL";
        searchBox.primaryAxisAlignItems = "SPACE_BETWEEN";
        searchBox.counterAxisAlignItems = "CENTER";
        searchBox.paddingLeft = 14;
        searchBox.paddingRight = 8;
        searchBox.cornerRadius = 12;
        searchBox.fills = [{ type: "SOLID", color: C.bgCanvas }];
        searchBox.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        searchBox.strokeWeight = 1;

        const searchLeftPart = figma.createFrame();
        searchLeftPart.name = "Search Input Area";
        searchLeftPart.layoutMode = "HORIZONTAL";
        searchLeftPart.counterAxisAlignItems = "CENTER";
        searchLeftPart.itemSpacing = 12;
        searchLeftPart.fills = [];

        const catDropdownPill = figma.createFrame();
        catDropdownPill.name = "Category Dropdown";
        catDropdownPill.layoutMode = "HORIZONTAL";
        catDropdownPill.counterAxisAlignItems = "CENTER";
        catDropdownPill.itemSpacing = 6;
        catDropdownPill.paddingLeft = 8;
        catDropdownPill.paddingRight = 8;
        catDropdownPill.paddingTop = 5;
        catDropdownPill.paddingBottom = 5;
        catDropdownPill.cornerRadius = 6;
        catDropdownPill.fills = [{ type: "SOLID", color: C.bgPure }];
        catDropdownPill.appendChild(createTxt("All products ▾", 13, "SemiBold", C.navySlate));
        searchLeftPart.appendChild(catDropdownPill);

        searchLeftPart.appendChild(createTxt("Search by product name or SKU", 14, "Regular", C.slateLight));
        searchBox.appendChild(searchLeftPart);

        const searchIconBtn = figma.createFrame();
        searchIconBtn.name = "Search Action";
        searchIconBtn.resize(32, 32);
        searchIconBtn.cornerRadius = 8;
        searchIconBtn.layoutMode = "HORIZONTAL";
        searchIconBtn.primaryAxisAlignItems = "CENTER";
        searchIconBtn.counterAxisAlignItems = "CENTER";
        searchIconBtn.fills = [{ type: "SOLID", color: C.navySlate }];
        searchIconBtn.appendChild(createTxt("🔍", 13, "Regular", C.bgPure));
        searchBox.appendChild(searchIconBtn);

        mainNav.appendChild(searchBox);

        // Right CTA (Request a quote)
        const quoteNavBtn = figma.createFrame();
        quoteNavBtn.name = "Request a quote Button";
        quoteNavBtn.layoutMode = "HORIZONTAL";
        quoteNavBtn.counterAxisAlignItems = "CENTER";
        quoteNavBtn.paddingLeft = 22;
        quoteNavBtn.paddingRight = 22;
        quoteNavBtn.paddingTop = 11;
        quoteNavBtn.paddingBottom = 11;
        quoteNavBtn.cornerRadius = 10;
        quoteNavBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
        quoteNavBtn.appendChild(createTxt("Request a quote", 14.5, "SemiBold", C.bgPure));
        mainNav.appendChild(quoteNavBtn);

        appendAndFill(headerWrap, mainNav);

        // Subnav Strip (46px)
        const subNav = figma.createFrame();
        subNav.name = "Subnav Menu";
        subNav.layoutMode = "HORIZONTAL";
        subNav.primaryAxisAlignItems = "SPACE_BETWEEN";
        subNav.counterAxisAlignItems = "CENTER";
        subNav.paddingLeft = 80;
        subNav.paddingRight = 80;
        subNav.paddingTop = 8;
        subNav.paddingBottom = 8;
        subNav.fills = [{ type: "SOLID", color: C.bgCanvas }];
        subNav.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        subNav.strokeWeight = 1;

        const subLinks = [
          { label: "All products", active: true },
          { label: "Featured", active: false },
          { label: "Drinkware", active: false },
          { label: "Journals", active: false },
          { label: "Padfolios", active: false },
          { label: "Power banks", active: false },
          { label: "E-flyers / Promotions", active: false },
          { label: "How to order", active: false },
          { label: "My account", active: false },
        ];

        subLinks.forEach(item => {
          const navPill = figma.createFrame();
          navPill.name = item.label;
          navPill.layoutMode = "HORIZONTAL";
          navPill.counterAxisAlignItems = "CENTER";
          navPill.paddingLeft = 12;
          navPill.paddingRight = 12;
          navPill.paddingTop = 6;
          navPill.paddingBottom = 6;
          navPill.cornerRadius = 6;
          if (item.active) {
            navPill.fills = [{ type: "SOLID", color: C.navySlate }];
          } else {
            navPill.fills = [];
          }
          const t = createTxt(item.label, 13.5, item.active ? "SemiBold" : "Medium", item.active ? C.bgPure : C.slateBody);
          navPill.appendChild(t);
          subNav.appendChild(navPill);
        });

        appendAndFill(headerWrap, subNav);
        appendAndFill(root, headerWrap);

        // ========================================================
        // 3. HERO MERCHANDISING SECTION (Featured Collections)
        // ========================================================
        currentStep = "3. hero section";
        const heroSection = figma.createFrame();
        heroSection.name = "Hero - Featured Collections";
        heroSection.layoutMode = "VERTICAL";
        heroSection.paddingLeft = 80;
        heroSection.paddingRight = 80;
        heroSection.paddingTop = 56;
        heroSection.paddingBottom = 56;
        heroSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        const heroRow = figma.createFrame();
        heroRow.name = "Hero Inner Grid";
        heroRow.layoutMode = "HORIZONTAL";
        heroRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        heroRow.counterAxisAlignItems = "CENTER";
        heroRow.fills = [];

        // Left Copy & CTAs (620px)
        const heroLeft = figma.createFrame();
        heroLeft.name = "Hero Copy Column";
        heroLeft.resize(620, 480);
        heroLeft.layoutMode = "VERTICAL";
        heroLeft.counterAxisAlignItems = "MIN";
        heroLeft.itemSpacing = 24;
        heroLeft.fills = [];

        // Category Tag
        const catBadge = figma.createFrame();
        catBadge.name = "Category Badge";
        catBadge.layoutMode = "HORIZONTAL";
        catBadge.paddingLeft = 12;
        catBadge.paddingRight = 12;
        catBadge.paddingTop = 6;
        catBadge.paddingBottom = 6;
        catBadge.cornerRadius = 6;
        catBadge.fills = [{ type: "SOLID", color: C.blueTint }];
        catBadge.strokes = [{ type: "SOLID", color: C.blueBorder }];
        catBadge.strokeWeight = 1;
        catBadge.appendChild(createTxt("Journals", 12.5, "Bold", C.blueDark, { letterSpacing: 0.5 }));
        heroLeft.appendChild(catBadge);

        // Headline & Subtitle
        const heroHead = createTxt("Branded for ideas that matter.", 54, "Bold", C.navySlate, { lineHeight: 62 });
        heroHead.resize(620, 124);
        heroLeft.appendChild(heroHead);

        const heroSub = createTxt("Soft-touch covers in every colour, ready for your client’s logo.", 18, "Regular", C.slateBody, { lineHeight: 28 });
        heroSub.resize(620, 56);
        heroLeft.appendChild(heroSub);

        // CTAs Row
        const heroCTAs = figma.createFrame();
        heroCTAs.name = "Hero CTAs";
        heroCTAs.layoutMode = "HORIZONTAL";
        heroCTAs.counterAxisAlignItems = "CENTER";
        heroCTAs.itemSpacing = 16;
        heroCTAs.fills = [];

        const shopJournalsBtn = figma.createFrame();
        shopJournalsBtn.name = "Shop journals Button";
        shopJournalsBtn.layoutMode = "HORIZONTAL";
        shopJournalsBtn.counterAxisAlignItems = "CENTER";
        shopJournalsBtn.paddingLeft = 28;
        shopJournalsBtn.paddingRight = 28;
        shopJournalsBtn.paddingTop = 14;
        shopJournalsBtn.paddingBottom = 14;
        shopJournalsBtn.cornerRadius = 10;
        shopJournalsBtn.fills = [{ type: "SOLID", color: C.navySlate }];
        shopJournalsBtn.appendChild(createTxt("Shop journals", 15.5, "SemiBold", C.bgPure));
        heroCTAs.appendChild(shopJournalsBtn);

        const reqQuoteHeroBtn = figma.createFrame();
        reqQuoteHeroBtn.name = "Request a quote Button";
        reqQuoteHeroBtn.layoutMode = "HORIZONTAL";
        reqQuoteHeroBtn.counterAxisAlignItems = "CENTER";
        reqQuoteHeroBtn.paddingLeft = 26;
        reqQuoteHeroBtn.paddingRight = 26;
        reqQuoteHeroBtn.paddingTop = 14;
        reqQuoteHeroBtn.paddingBottom = 14;
        reqQuoteHeroBtn.cornerRadius = 10;
        reqQuoteHeroBtn.fills = [{ type: "SOLID", color: C.bgPure }];
        reqQuoteHeroBtn.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        reqQuoteHeroBtn.strokeWeight = 1.5;
        reqQuoteHeroBtn.appendChild(createTxt("Request a quote", 15.5, "SemiBold", C.navySlate));
        heroCTAs.appendChild(reqQuoteHeroBtn);

        heroLeft.appendChild(heroCTAs);

        // Slider Arrows
        const sliderArrows = figma.createFrame();
        sliderArrows.name = "Slider Controls";
        sliderArrows.layoutMode = "HORIZONTAL";
        sliderArrows.counterAxisAlignItems = "CENTER";
        sliderArrows.itemSpacing = 12;
        sliderArrows.fills = [];

        const arrowLeft = figma.createFrame();
        arrowLeft.name = "←";
        arrowLeft.resize(40, 40);
        arrowLeft.cornerRadius = 20;
        arrowLeft.layoutMode = "HORIZONTAL";
        arrowLeft.primaryAxisAlignItems = "CENTER";
        arrowLeft.counterAxisAlignItems = "CENTER";
        arrowLeft.fills = [{ type: "SOLID", color: C.bgPure }];
        arrowLeft.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        arrowLeft.strokeWeight = 1;
        arrowLeft.appendChild(createTxt("←", 16, "Bold", C.navySlate));
        sliderArrows.appendChild(arrowLeft);

        const arrowRight = figma.createFrame();
        arrowRight.name = "→";
        arrowRight.resize(40, 40);
        arrowRight.cornerRadius = 20;
        arrowRight.layoutMode = "HORIZONTAL";
        arrowRight.primaryAxisAlignItems = "CENTER";
        arrowRight.counterAxisAlignItems = "CENTER";
        arrowRight.fills = [{ type: "SOLID", color: C.bgPure }];
        arrowRight.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        arrowRight.strokeWeight = 1;
        arrowRight.appendChild(createTxt("→", 16, "Bold", C.navySlate));
        sliderArrows.appendChild(arrowRight);

        heroLeft.appendChild(sliderArrows);
        heroRow.appendChild(heroLeft);

        // Right Visual Column (580px)
        const heroRight = figma.createFrame();
        heroRight.name = "Hero Visual Showcase";
        heroRight.resize(580, 480);
        heroRight.layoutMode = "NONE";
        heroRight.fills = [];

        const heroPhoto = createImgNode(
          "Image",
          580,
          440,
          IMAGES.heroJournal,
          "FILL",
          C.bgPure,
          24
        );
        heroPhoto.x = 0;
        heroPhoto.y = 10;
        heroPhoto.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        heroPhoto.strokeWeight = 1;
        heroRight.appendChild(heroPhoto);

        // Floating Mini Product Spec Card
        const specCard = figma.createFrame();
        specCard.name = "Button - Request a quote for TX-2107";
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

        const specThumb = createImgNode("Image", 52, 52, IMAGES.heroMiniSpec, "FIT", C.bgCanvas, 10);
        specCard.appendChild(specThumb);

        const specInfo = figma.createFrame();
        specInfo.name = "Spec Info";
        specInfo.layoutMode = "VERTICAL";
        specInfo.itemSpacing = 4;
        specInfo.fills = [];
        specInfo.appendChild(createTxt("FEATURED ACCESSORY", 9.5, "Bold", C.bluePrimary, { letterSpacing: 0.8 }));
        specInfo.appendChild(createTxt("TX-2107 Card Holder", 14.5, "Bold", C.navySlate));
        specInfo.appendChild(createTxt("$8.98 to $11.50 each", 13, "Medium", C.slateBody));
        specCard.appendChild(specInfo);

        heroRight.appendChild(specCard);
        heroRow.appendChild(heroRight);

        appendAndFill(heroSection, heroRow);
        appendAndFill(root, heroSection);

        // ========================================================
        // 4. TRUST PROOF 4-PILLARS STRIP
        // ========================================================
        currentStep = "4. trust strip";
        const trustSection = figma.createFrame();
        trustSection.name = "Trust Proof 4-Pillars Strip";
        trustSection.layoutMode = "HORIZONTAL";
        trustSection.primaryAxisAlignItems = "SPACE_BETWEEN";
        trustSection.counterAxisAlignItems = "CENTER";
        trustSection.paddingLeft = 80;
        trustSection.paddingRight = 80;
        trustSection.paddingTop = 22;
        trustSection.paddingBottom = 22;
        trustSection.fills = [{ type: "SOLID", color: C.bgPure }];
        trustSection.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        trustSection.strokeWeight = 1;

        const trustPillars = [
          { title: "ASI 5-Star supplier", sub: "PRO Supplier", icon: "★" },
          { title: "Rated #1 in California", sub: "Top 10 in the nation", icon: "🏆" },
          { title: "Quantity-based pricing", sub: "Shown on every product", icon: "$" },
          { title: "Custom decoration", sub: "See the price guide", icon: "🎨" },
        ];

        trustPillars.forEach(p => {
          const item = figma.createFrame();
          item.name = p.title;
          item.resize(295, 52);
          item.layoutMode = "HORIZONTAL";
          item.counterAxisAlignItems = "CENTER";
          item.itemSpacing = 14;
          item.fills = [];

          const iconCircle = figma.createFrame();
          iconCircle.name = "Icon";
          iconCircle.resize(44, 44);
          iconCircle.cornerRadius = 22;
          iconCircle.layoutMode = "HORIZONTAL";
          iconCircle.primaryAxisAlignItems = "CENTER";
          iconCircle.counterAxisAlignItems = "CENTER";
          iconCircle.fills = [{ type: "SOLID", color: C.blueTint }];
          iconCircle.appendChild(createTxt(p.icon, 18, "Bold", C.bluePrimary));
          item.appendChild(iconCircle);

          const copy = figma.createFrame();
          copy.name = "Text";
          copy.layoutMode = "VERTICAL";
          copy.itemSpacing = 2;
          copy.fills = [];
          copy.appendChild(createTxt(p.title, 14.5, "Bold", C.navySlate));
          copy.appendChild(createTxt(p.sub, 13, "Regular", C.slateMuted));
          item.appendChild(copy);

          trustSection.appendChild(item);
        });

        appendAndFill(root, trustSection);

        // ========================================================
        // 5. SHOP BY CATEGORY (18 Categories Grid)
        // ========================================================
        currentStep = "5. categories";
        const catSection = figma.createFrame();
        catSection.name = "Shop By Category Section";
        catSection.layoutMode = "VERTICAL";
        catSection.paddingLeft = 80;
        catSection.paddingRight = 80;
        catSection.paddingTop = 64;
        catSection.paddingBottom = 64;
        catSection.itemSpacing = 36;
        catSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        // Header
        const catHead = figma.createFrame();
        catHead.name = "Category Section Header";
        catHead.layoutMode = "HORIZONTAL";
        catHead.primaryAxisAlignItems = "SPACE_BETWEEN";
        catHead.counterAxisAlignItems = "CENTER";
        catHead.fills = [];

        const catTitleCol = figma.createFrame();
        catTitleCol.name = "Titles";
        catTitleCol.layoutMode = "VERTICAL";
        catTitleCol.itemSpacing = 6;
        catTitleCol.fills = [];
        catTitleCol.appendChild(createTxt("Shop by category", 36, "Bold", C.navySlate));
        catTitleCol.appendChild(createTxt("Everything you need for client gifts, events and giveaways.", 16, "Regular", C.slateBody));
        catHead.appendChild(catTitleCol);

        catHead.appendChild(createTxt("View all products →", 15.5, "SemiBold", C.bluePrimary));
        appendAndFill(catSection, catHead);

        // 18 Categories in 3 Rows of 6 Cards (1280px total width)
        const categoriesData = [
          { name: "Barware", hash: IMAGES.catBarware },
          { name: "Bluetooth Speakers", hash: IMAGES.catSpeakers },
          { name: "Business Card Cases", hash: IMAGES.catCards },
          { name: "Closeout Items", hash: IMAGES.catCloseout },
          { name: "Custom Packaging", hash: IMAGES.catPackaging },
          { name: "Drinkware", hash: IMAGES.catDrinkware },
          { name: "Electronics", hash: IMAGES.catElectronics },
          { name: "Journals & Jotters", hash: IMAGES.catJournals },
          { name: "Jr. Padfolios", hash: IMAGES.catJrPadfolios },
          { name: "Luggage Tags", hash: IMAGES.catLuggage },
          { name: "Metal Pens", hash: IMAGES.catPens },
          { name: "Mobile Xessories", hash: IMAGES.catMobile },
          { name: "Novelties", hash: IMAGES.catNovelties },
          { name: "Padfolios", hash: IMAGES.catPadfolios },
          { name: "Power Banks", hash: IMAGES.catPower },
          { name: "Stylus Pens", hash: IMAGES.catStylus },
          { name: "Tote Bags", hash: IMAGES.catTotes },
          { name: "Travel Xessories", hash: IMAGES.catTravel },
        ];

        const catRowsContainer = figma.createFrame();
        catRowsContainer.name = "Category Rows";
        catRowsContainer.layoutMode = "VERTICAL";
        catRowsContainer.itemSpacing = 20;
        catRowsContainer.fills = [];

        for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
          const rowFrame = figma.createFrame();
          rowFrame.name = \`Category Row \${rowIdx + 1}\`;
          rowFrame.layoutMode = "HORIZONTAL";
          rowFrame.primaryAxisAlignItems = "SPACE_BETWEEN";
          rowFrame.fills = [];

          const rowItems = categoriesData.slice(rowIdx * 6, (rowIdx + 1) * 6);
          rowItems.forEach(c => {
            const card = figma.createFrame();
            card.name = c.name;
            card.resize(196, 170);
            card.layoutMode = "VERTICAL";
            card.primaryAxisAlignItems = "CENTER";
            card.counterAxisAlignItems = "CENTER";
            card.paddingTop = 16;
            card.paddingBottom = 16;
            card.paddingLeft = 10;
            card.paddingRight = 10;
            card.itemSpacing = 12;
            card.cornerRadius = 18;
            card.fills = [{ type: "SOLID", color: C.bgPure }];
            card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
            card.strokeWeight = 1;

            const imgBox = createImgNode("Icon Frame", 96, 96, c.hash, "FIT", C.bgCanvas, 14);
            card.appendChild(imgBox);

            const label = createTxt(c.name, 13.5, "SemiBold", C.navySlate, { textAlignHorizontal: "CENTER", lineHeight: 18 });
            label.resize(176, 36);
            card.appendChild(label);

            rowFrame.appendChild(card);
          });

          appendAndFill(catRowsContainer, rowFrame);
        }

        appendAndFill(catSection, catRowsContainer);
        appendAndFill(root, catSection);

        // ========================================================
        // 6. POPULAR PRODUCTS SECTION (6 Products)
        // ========================================================
        currentStep = "6. popular products";
        const prodSection = figma.createFrame();
        prodSection.name = "Popular Products Section";
        prodSection.layoutMode = "VERTICAL";
        prodSection.paddingLeft = 80;
        prodSection.paddingRight = 80;
        prodSection.paddingTop = 64;
        prodSection.paddingBottom = 64;
        prodSection.itemSpacing = 36;
        prodSection.fills = [{ type: "SOLID", color: C.bgPure }];

        // Header & Filter Tabs
        const prodHead = figma.createFrame();
        prodHead.name = "Section Header & Filters";
        prodHead.layoutMode = "HORIZONTAL";
        prodHead.primaryAxisAlignItems = "SPACE_BETWEEN";
        prodHead.counterAxisAlignItems = "CENTER";
        prodHead.fills = [];

        const prodTitleCol = figma.createFrame();
        prodTitleCol.name = "Titles";
        prodTitleCol.layoutMode = "VERTICAL";
        prodTitleCol.itemSpacing = 6;
        prodTitleCol.fills = [];
        prodTitleCol.appendChild(createTxt("Popular products", 34, "Bold", C.navySlate));
        prodTitleCol.appendChild(createTxt("Per-unit pricing. It drops as quantity rises.", 16, "Regular", C.slateBody));
        prodHead.appendChild(prodTitleCol);

        // Filter Tabs
        const filterTabs = figma.createFrame();
        filterTabs.name = "Filter Tabs";
        filterTabs.layoutMode = "HORIZONTAL";
        filterTabs.counterAxisAlignItems = "CENTER";
        filterTabs.itemSpacing = 10;
        filterTabs.fills = [];

        const tabs = [
          { label: "Featured", active: true },
          { label: "Drinkware", active: false },
          { label: "Journals & padfolios", active: false },
          { label: "Tech", active: false },
        ];

        tabs.forEach(t => {
          const tabPill = figma.createFrame();
          tabPill.name = t.label;
          tabPill.layoutMode = "HORIZONTAL";
          tabPill.counterAxisAlignItems = "CENTER";
          tabPill.paddingLeft = 16;
          tabPill.paddingRight = 16;
          tabPill.paddingTop = 8;
          tabPill.paddingBottom = 8;
          tabPill.cornerRadius = 20;
          if (t.active) {
            tabPill.fills = [{ type: "SOLID", color: C.navySlate }];
            tabPill.appendChild(createTxt(t.label, 13.5, "SemiBold", C.bgPure));
          } else {
            tabPill.fills = [{ type: "SOLID", color: C.bgCanvas }];
            tabPill.strokes = [{ type: "SOLID", color: C.borderSubtle }];
            tabPill.strokeWeight = 1;
            tabPill.appendChild(createTxt(t.label, 13.5, "Medium", C.slateBody));
          }
          filterTabs.appendChild(tabPill);
        });

        prodHead.appendChild(filterTabs);
        appendAndFill(prodSection, prodHead);

        // 6 Products in 2 Rows of 3 Cards (1280px total width)
        const productsData = [
          {
            title: "Pro Series | Elite TPU Leather Business Card Holder",
            sku: "SKU TX-2107",
            price: "$8.98 to $11.50 each",
            sub: "Price drops as quantity rises",
            hash: IMAGES.prodTX2107,
          },
          {
            title: "Elite RFID Card Holder Wallet",
            sku: "SKU TX-2207",
            price: "$8.98 to $11.03 each",
            sub: "Price drops as quantity rises",
            hash: IMAGES.prodTX2207,
          },
          {
            title: "Oceanside Key Chain",
            sku: "SKU TX-8810",
            price: "$4.18 to $5.13 each",
            sub: "Price drops as quantity rises",
            hash: IMAGES.prodTX8810,
          },
          {
            title: "Sweethome Key Chain",
            sku: "SKU TX-916958",
            price: "$3.88 to $4.97 each",
            sub: "Price drops as quantity rises",
            hash: IMAGES.prodTX916958,
          },
          {
            title: "Madison 4000 mAh Slim Power Bank",
            sku: "SKU EX-8067",
            price: "$9.98 to $9.98 each",
            sub: "Price drops as quantity rises",
            hash: IMAGES.prodEX8067,
          },
          {
            title: "Summit 32oz Double Wall Vacuum Insulated 18/8",
            sku: "SKU DW-8966",
            price: "$10.28 to $12.62 each",
            sub: "Price drops as quantity rises",
            hash: IMAGES.prodDW8966,
          },
        ];

        const prodGrid = figma.createFrame();
        prodGrid.name = "Products Grid (6 Cards)";
        prodGrid.layoutMode = "VERTICAL";
        prodGrid.itemSpacing = 24;
        prodGrid.fills = [];

        for (let rowIdx = 0; rowIdx < 2; rowIdx++) {
          const rowFrame = figma.createFrame();
          rowFrame.name = \`Product Row \${rowIdx + 1}\`;
          rowFrame.layoutMode = "HORIZONTAL";
          rowFrame.primaryAxisAlignItems = "SPACE_BETWEEN";
          rowFrame.fills = [];

          const rowItems = productsData.slice(rowIdx * 3, (rowIdx + 1) * 3);
          rowItems.forEach(p => {
            const card = figma.createFrame();
            card.name = p.sku;
            card.resize(410, 480);
            card.layoutMode = "VERTICAL";
            card.cornerRadius = 20;
            card.clipsContent = true;
            card.fills = [{ type: "SOLID", color: C.bgPure }];
            card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
            card.strokeWeight = 1;

            // Image Container
            const imgArea = figma.createFrame();
            imgArea.name = "Image Container";
            imgArea.resize(410, 240);
            imgArea.layoutMode = "NONE";
            imgArea.fills = [{ type: "SOLID", color: C.bgCanvas }];

            const photo = createImgNode("Product Photo", 200, 200, p.hash, "FIT", null, 0);
            photo.x = 105;
            photo.y = 20;
            imgArea.appendChild(photo);

            const badge = figma.createFrame();
            badge.name = "Featured Badge";
            badge.layoutMode = "HORIZONTAL";
            badge.paddingLeft = 10;
            badge.paddingRight = 10;
            badge.paddingTop = 5;
            badge.paddingBottom = 5;
            badge.cornerRadius = 6;
            badge.fills = [{ type: "SOLID", color: C.navySlate }];
            badge.x = 16;
            badge.y = 16;
            badge.appendChild(createTxt("FEATURED", 10.5, "Bold", C.bgPure, { letterSpacing: 0.6 }));
            imgArea.appendChild(badge);

            card.appendChild(imgArea);

            // Card Body
            const body = figma.createFrame();
            body.name = "Card Body";
            body.resize(410, 240);
            body.layoutMode = "VERTICAL";
            body.paddingLeft = 24;
            body.paddingRight = 24;
            body.paddingTop = 18;
            body.paddingBottom = 20;
            body.itemSpacing = 10;
            body.fills = [];

            body.appendChild(createTxt(p.sku, 12.5, "Medium", C.slateMuted, { letterSpacing: 0.5 }));

            const title = createTxt(p.title, 15.5, "SemiBold", C.navySlate, { lineHeight: 22 });
            title.resize(362, 44);
            body.appendChild(title);

            // Price Row
            const priceCol = figma.createFrame();
            priceCol.name = "Price Info";
            priceCol.layoutMode = "VERTICAL";
            priceCol.itemSpacing = 2;
            priceCol.fills = [];
            priceCol.appendChild(createTxt(p.price, 17, "Bold", C.navySlate));
            priceCol.appendChild(createTxt(p.sub, 12, "Medium", C.greenAccent));
            body.appendChild(priceCol);

            // Action Buttons
            const btnRow = figma.createFrame();
            btnRow.name = "Card Buttons";
            btnRow.layoutMode = "HORIZONTAL";
            btnRow.primaryAxisAlignItems = "SPACE_BETWEEN";
            btnRow.counterAxisAlignItems = "CENTER";
            btnRow.itemSpacing = 12;
            btnRow.fills = [];

            const reqBtn = figma.createFrame();
            reqBtn.name = "Request quote";
            reqBtn.resize(230, 42);
            reqBtn.layoutMode = "HORIZONTAL";
            reqBtn.primaryAxisAlignItems = "CENTER";
            reqBtn.counterAxisAlignItems = "CENTER";
            reqBtn.cornerRadius = 10;
            reqBtn.fills = [{ type: "SOLID", color: C.navySlate }];
            reqBtn.appendChild(createTxt("Request quote", 14, "SemiBold", C.bgPure));
            btnRow.appendChild(reqBtn);

            const detailsBtn = figma.createFrame();
            detailsBtn.name = "View details";
            detailsBtn.resize(120, 42);
            detailsBtn.layoutMode = "HORIZONTAL";
            detailsBtn.primaryAxisAlignItems = "CENTER";
            detailsBtn.counterAxisAlignItems = "CENTER";
            detailsBtn.cornerRadius = 10;
            detailsBtn.fills = [{ type: "SOLID", color: C.bgPure }];
            detailsBtn.strokes = [{ type: "SOLID", color: C.borderSubtle }];
            detailsBtn.strokeWeight = 1;
            detailsBtn.appendChild(createTxt("View details", 13.5, "Medium", C.slateBody));
            btnRow.appendChild(detailsBtn);

            body.appendChild(btnRow);
            card.appendChild(body);

            rowFrame.appendChild(card);
          });

          appendAndFill(prodGrid, rowFrame);
        }

        appendAndFill(prodSection, prodGrid);

        // Disclaimer Note Banner
        const noteFrame = figma.createFrame();
        noteFrame.name = "Disclaimer Note";
        noteFrame.layoutMode = "HORIZONTAL";
        noteFrame.primaryAxisAlignItems = "CENTER";
        noteFrame.counterAxisAlignItems = "CENTER";
        noteFrame.paddingLeft = 24;
        noteFrame.paddingRight = 24;
        noteFrame.paddingTop = 14;
        noteFrame.paddingBottom = 14;
        noteFrame.cornerRadius = 12;
        noteFrame.fills = [{ type: "SOLID", color: C.bgCanvas }];
        noteFrame.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        noteFrame.strokeWeight = 1;
        noteFrame.appendChild(createTxt(
          "Prices for featured items come from the live site. Other cards are image placeholders until the product feed is connected.",
          13,
          "Regular",
          C.slateMuted
        ));
        appendAndFill(prodSection, noteFrame);

        appendAndFill(root, prodSection);

        // ========================================================
        // 7. DUAL PROMO BANNER CARDS
        // ========================================================
        currentStep = "7. dual promo banners";
        const promoSection = figma.createFrame();
        promoSection.name = "Dual Promo Banners Section";
        promoSection.layoutMode = "HORIZONTAL";
        promoSection.primaryAxisAlignItems = "SPACE_BETWEEN";
        promoSection.paddingLeft = 80;
        promoSection.paddingRight = 80;
        promoSection.paddingTop = 32;
        promoSection.paddingBottom = 32;
        promoSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        const promoBanners = [
          {
            eyebrow: "TRAVEL ESSENTIALS",
            title: "Travel essentials",
            desc: "Luggage tags, organisers and carry gear that go everywhere with your brand.",
            btn: "Shop travel",
            hash: IMAGES.promoTravel,
          },
          {
            eyebrow: "EVENT GIVEAWAYS",
            title: "Small gifts, big reach",
            desc: "Key chains and novelties at easy price points.",
            btn: "Shop novelties",
            hash: IMAGES.promoNovelties,
          },
        ];

        promoBanners.forEach(b => {
          const banner = figma.createFrame();
          banner.name = b.title;
          banner.resize(628, 320);
          banner.cornerRadius = 22;
          banner.clipsContent = true;
          banner.layoutMode = "NONE";
          banner.fills = [{ type: "SOLID", color: C.bgPure }];
          banner.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          banner.strokeWeight = 1;

          // Background Photo on Right
          const photo = createImgNode("Promo Photo", 360, 320, b.hash, "FILL", null, 0);
          photo.x = 268;
          photo.y = 0;
          banner.appendChild(photo);

          // Left Gradient Content Card
          const content = figma.createFrame();
          content.name = "Banner Copy";
          content.resize(320, 320);
          content.layoutMode = "VERTICAL";
          content.primaryAxisAlignItems = "CENTER";
          content.counterAxisAlignItems = "MIN";
          content.paddingLeft = 36;
          content.paddingRight = 24;
          content.paddingTop = 36;
          content.paddingBottom = 36;
          content.itemSpacing = 16;
          content.fills = [{ type: "SOLID", color: C.bgPure, opacity: 0.95 }];
          content.x = 0;
          content.y = 0;

          content.appendChild(createTxt(b.eyebrow, 11, "Bold", C.bluePrimary, { letterSpacing: 0.8 }));

          const title = createTxt(b.title, 26, "Bold", C.navySlate, { lineHeight: 32 });
          title.resize(260, 32);
          content.appendChild(title);

          const desc = createTxt(b.desc, 14.5, "Regular", C.slateBody, { lineHeight: 22 });
          desc.resize(260, 66);
          content.appendChild(desc);

          const btn = figma.createFrame();
          btn.name = b.btn;
          btn.layoutMode = "HORIZONTAL";
          btn.counterAxisAlignItems = "CENTER";
          btn.paddingLeft = 22;
          btn.paddingRight = 22;
          btn.paddingTop = 10;
          btn.paddingBottom = 10;
          btn.cornerRadius = 8;
          btn.fills = [{ type: "SOLID", color: C.navySlate }];
          btn.appendChild(createTxt(b.btn, 14, "SemiBold", C.bgPure));
          content.appendChild(btn);

          banner.appendChild(content);
          promoSection.appendChild(banner);
        });

        appendAndFill(root, promoSection);

        // ========================================================
        // 8. WHY DISTRIBUTORS CHOOSE POSH XESSORIES
        // ========================================================
        currentStep = "8. why distributors";
        const whySection = figma.createFrame();
        whySection.name = "Why Distributors Choose Posh Xessories";
        whySection.layoutMode = "VERTICAL";
        whySection.paddingLeft = 80;
        whySection.paddingRight = 80;
        whySection.paddingTop = 64;
        whySection.paddingBottom = 64;
        whySection.itemSpacing = 36;
        whySection.fills = [{ type: "SOLID", color: C.bgPure }];

        // Header
        const whyHead = figma.createFrame();
        whyHead.name = "Why Header";
        whyHead.layoutMode = "VERTICAL";
        whyHead.itemSpacing = 6;
        whyHead.fills = [];
        whyHead.appendChild(createTxt("Why distributors choose Posh Xessories", 34, "Bold", C.navySlate));
        whyHead.appendChild(createTxt("A supplier your clients and your team can rely on.", 16, "Regular", C.slateBody));
        whySection.appendChild(whyHead);

        // 4 Value Pillar Cards (1280px wide)
        const pillarGrid = figma.createFrame();
        pillarGrid.name = "4 Value Pillars";
        pillarGrid.layoutMode = "HORIZONTAL";
        pillarGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
        pillarGrid.fills = [];

        const pillarsData = [
          {
            badge: "1",
            title: "Rated #1 in California",
            desc: "And top 10 in the nation for customer satisfaction.",
          },
          {
            badge: "★",
            title: "Trusted by the industry",
            desc: "ASI 5-Star supplier, PRO Supplier, 2018 SAGE Rated Supplier.",
          },
          {
            badge: "$",
            title: "Clear pricing",
            desc: "Quantity-based prices and a published decoration price guide.",
          },
          {
            badge: "📞",
            title: "Help when you need it",
            desc: "Based in Chino, California. Request a quote, a sample or a call.",
          },
        ];

        pillarsData.forEach(p => {
          const card = figma.createFrame();
          card.name = p.title;
          card.resize(302, 170);
          card.layoutMode = "VERTICAL";
          card.paddingLeft = 24;
          card.paddingRight = 24;
          card.paddingTop = 22;
          card.paddingBottom = 22;
          card.itemSpacing = 12;
          card.cornerRadius = 18;
          card.fills = [{ type: "SOLID", color: C.bgCanvas }];
          card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          card.strokeWeight = 1;

          const badgeBox = figma.createFrame();
          badgeBox.name = "Badge Box";
          badgeBox.resize(40, 40);
          badgeBox.cornerRadius = 20;
          badgeBox.layoutMode = "HORIZONTAL";
          badgeBox.primaryAxisAlignItems = "CENTER";
          badgeBox.counterAxisAlignItems = "CENTER";
          badgeBox.fills = [{ type: "SOLID", color: C.blueTint }];
          badgeBox.appendChild(createTxt(p.badge, 16, "Bold", C.bluePrimary));
          card.appendChild(badgeBox);

          const title = createTxt(p.title, 16, "Bold", C.navySlate);
          card.appendChild(title);

          const desc = createTxt(p.desc, 13.5, "Regular", C.slateBody, { lineHeight: 20 });
          desc.resize(254, 40);
          card.appendChild(desc);

          pillarGrid.appendChild(card);
        });

        appendAndFill(whySection, pillarGrid);

        // Real Awards Banner Card
        const awardsCard = figma.createFrame();
        awardsCard.name = "Official Awards Banner Card";
        awardsCard.layoutMode = "VERTICAL";
        awardsCard.primaryAxisAlignItems = "CENTER";
        awardsCard.counterAxisAlignItems = "CENTER";
        awardsCard.paddingTop = 18;
        awardsCard.paddingBottom = 18;
        awardsCard.paddingLeft = 24;
        awardsCard.paddingRight = 24;
        awardsCard.itemSpacing = 12;
        awardsCard.cornerRadius = 18;
        awardsCard.fills = [{ type: "SOLID", color: C.bgCanvas }];
        awardsCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
        awardsCard.strokeWeight = 1;

        awardsCard.appendChild(createTxt("OFFICIAL INDUSTRY RECOGNITION & CERTIFICATIONS", 11, "Bold", C.slateMuted, { letterSpacing: 1 }));

        const awardsImg = createImgNode(
          "Image (Awards: number 1 in California, SAGE rated supplier, ASI 5-star supplier, PRO supplier)",
          1240,
          94,
          IMAGES.awardsGraphic,
          "FIT",
          null,
          0
        );
        awardsCard.appendChild(awardsImg);

        appendAndFill(whySection, awardsCard);
        appendAndFill(root, whySection);

        // ========================================================
        // 9. ORDERING MADE SIMPLE (3-Step Process)
        // ========================================================
        currentStep = "9. ordering steps";
        const stepsSection = figma.createFrame();
        stepsSection.name = "Ordering Made Simple Section";
        stepsSection.layoutMode = "VERTICAL";
        stepsSection.paddingLeft = 80;
        stepsSection.paddingRight = 80;
        stepsSection.paddingTop = 64;
        stepsSection.paddingBottom = 64;
        stepsSection.itemSpacing = 36;
        stepsSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

        const stepsHead = figma.createFrame();
        stepsHead.name = "Steps Header";
        stepsHead.layoutMode = "VERTICAL";
        stepsHead.itemSpacing = 6;
        stepsHead.fills = [];
        stepsHead.appendChild(createTxt("Ordering made simple", 32, "Bold", C.navySlate));
        stepsHead.appendChild(createTxt("Three easy steps from catalog selection to distributor delivery.", 16, "Regular", C.slateBody));
        stepsSection.appendChild(stepsHead);

        // 3 Step Cards (1280px wide)
        const stepGrid = figma.createFrame();
        stepGrid.name = "3 Steps Row";
        stepGrid.layoutMode = "HORIZONTAL";
        stepGrid.primaryAxisAlignItems = "SPACE_BETWEEN";
        stepGrid.fills = [];

        const stepsData = [
          {
            num: "1",
            title: "Find your product",
            desc: "Search by name or SKU, or browse a category.",
          },
          {
            num: "2",
            title: "Check quantity pricing",
            desc: "See the price range and compare options.",
          },
          {
            num: "3",
            title: "Request a quote",
            desc: "Ask for a quote or a sample in one short form.",
          },
        ];

        stepsData.forEach(s => {
          const card = figma.createFrame();
          card.name = s.title;
          card.resize(410, 160);
          card.layoutMode = "HORIZONTAL";
          card.counterAxisAlignItems = "CENTER";
          card.paddingLeft = 28;
          card.paddingRight = 28;
          card.itemSpacing = 20;
          card.cornerRadius = 18;
          card.fills = [{ type: "SOLID", color: C.bgPure }];
          card.strokes = [{ type: "SOLID", color: C.borderSubtle }];
          card.strokeWeight = 1;

          const numCircle = figma.createFrame();
          numCircle.name = "Step Number";
          numCircle.resize(48, 48);
          numCircle.cornerRadius = 24;
          numCircle.layoutMode = "HORIZONTAL";
          numCircle.primaryAxisAlignItems = "CENTER";
          numCircle.counterAxisAlignItems = "CENTER";
          numCircle.fills = [{ type: "SOLID", color: C.navySlate }];
          numCircle.appendChild(createTxt(s.num, 18, "Bold", C.bgPure));
          card.appendChild(numCircle);

          const copy = figma.createFrame();
          copy.name = "Step Copy";
          copy.layoutMode = "VERTICAL";
          copy.itemSpacing = 6;
          copy.fills = [];
          copy.appendChild(createTxt(s.title, 17, "Bold", C.navySlate));
          const desc = createTxt(s.desc, 14, "Regular", C.slateBody, { lineHeight: 20 });
          desc.resize(270, 40);
          copy.appendChild(desc);
          card.appendChild(copy);

          stepGrid.appendChild(card);
        });

        appendAndFill(stepsSection, stepGrid);
        appendAndFill(root, stepsSection);

        // ========================================================
        // 10. DISTRIBUTOR PORTAL CALLOUT BANNER
        // ========================================================
        currentStep = "10. distributor banner";
        const distWrap = figma.createFrame();
        distWrap.name = "Distributor Callout Wrap";
        distWrap.layoutMode = "VERTICAL";
        distWrap.paddingLeft = 80;
        distWrap.paddingRight = 80;
        distWrap.paddingTop = 28;
        distWrap.paddingBottom = 28;
        distWrap.fills = [{ type: "SOLID", color: C.bgPure }];

        const distCard = figma.createFrame();
        distCard.name = "Distributor Card";
        distCard.layoutMode = "HORIZONTAL";
        distCard.primaryAxisAlignItems = "SPACE_BETWEEN";
        distCard.counterAxisAlignItems = "CENTER";
        distCard.paddingLeft = 56;
        distCard.paddingRight = 56;
        distCard.paddingTop = 44;
        distCard.paddingBottom = 44;
        distCard.cornerRadius = 24;
        distCard.fills = [{ type: "SOLID", color: C.navyDark }];

        const distLeft = figma.createFrame();
        distLeft.name = "Copy";
        distLeft.layoutMode = "VERTICAL";
        distLeft.itemSpacing = 10;
        distLeft.fills = [];

        distLeft.appendChild(createTxt("AUTHORIZED DISTRIBUTOR PORTAL", 11, "Bold", C.skyAccent, { letterSpacing: 1 }));
        distLeft.appendChild(createTxt("Distributor? Your account is one login away.", 28, "Bold", C.bgPure));

        const distSub = createTxt(
          "Log in to see your pricing, track orders and reorder faster. New here? Register to get started.",
          15.5,
          "Regular",
          { r: 0.75, g: 0.8, b: 0.9 },
          { lineHeight: 24 }
        );
        distSub.resize(680, 48);
        distLeft.appendChild(distSub);
        distCard.appendChild(distLeft);

        const distBtns = figma.createFrame();
        distBtns.name = "Buttons";
        distBtns.layoutMode = "HORIZONTAL";
        distBtns.counterAxisAlignItems = "CENTER";
        distBtns.itemSpacing = 16;
        distBtns.fills = [];

        const distLogin = figma.createFrame();
        distLogin.name = "Distributor login";
        distLogin.layoutMode = "HORIZONTAL";
        distLogin.counterAxisAlignItems = "CENTER";
        distLogin.paddingLeft = 28;
        distLogin.paddingRight = 28;
        distLogin.paddingTop = 14;
        distLogin.paddingBottom = 14;
        distLogin.cornerRadius = 12;
        distLogin.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
        distLogin.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.25 }];
        distLogin.strokeWeight = 1;
        distLogin.appendChild(createTxt("Distributor login", 15, "SemiBold", C.bgPure));
        distBtns.appendChild(distLogin);

        const distReg = figma.createFrame();
        distReg.name = "Register";
        distReg.layoutMode = "HORIZONTAL";
        distReg.counterAxisAlignItems = "CENTER";
        distReg.paddingLeft = 30;
        distReg.paddingRight = 30;
        distReg.paddingTop = 14;
        distReg.paddingBottom = 14;
        distReg.cornerRadius = 12;
        distReg.fills = [{ type: "SOLID", color: C.bgPure }];
        distReg.appendChild(createTxt("Register", 15, "SemiBold", C.navyDark));
        distBtns.appendChild(distReg);

        distCard.appendChild(distBtns);
        appendAndFill(distWrap, distCard);
        appendAndFill(root, distWrap);

        // ========================================================
        // 11. ENTERPRISE FOOTER
        // ========================================================
        currentStep = "11. footer";
        const footer = figma.createFrame();
        footer.name = "Enterprise Footer";
        footer.layoutMode = "VERTICAL";
        footer.paddingLeft = 80;
        footer.paddingRight = 80;
        footer.paddingTop = 64;
        footer.paddingBottom = 40;
        footer.itemSpacing = 44;
        footer.fills = [{ type: "SOLID", color: C.darkFooter }];

        // Newsletter Bar Row
        const newsRow = figma.createFrame();
        newsRow.name = "Newsletter Row";
        newsRow.layoutMode = "HORIZONTAL";
        newsRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        newsRow.counterAxisAlignItems = "CENTER";
        newsRow.paddingBottom = 36;
        newsRow.fills = [];
        newsRow.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        newsRow.strokeWeight = 1;

        const newsText = figma.createFrame();
        newsText.name = "Newsletter Copy";
        newsText.layoutMode = "VERTICAL";
        newsText.itemSpacing = 4;
        newsText.fills = [];
        newsText.appendChild(createTxt("Promotions and new products", 24, "Bold", C.bgPure));
        newsText.appendChild(createTxt("Special offers, straight to your inbox.", 14.5, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        newsRow.appendChild(newsText);

        const newsForm = figma.createFrame();
        newsForm.name = "Newsletter Form";
        newsForm.resize(400, 48);
        newsForm.layoutMode = "HORIZONTAL";
        newsForm.primaryAxisAlignItems = "SPACE_BETWEEN";
        newsForm.counterAxisAlignItems = "CENTER";
        newsForm.paddingLeft = 16;
        newsForm.paddingRight = 6;
        newsForm.cornerRadius = 10;
        newsForm.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        newsForm.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.15 }];
        newsForm.strokeWeight = 1;

        newsForm.appendChild(createTxt("Work email", 14, "Regular", { r: 0.5, g: 0.55, b: 0.65 }));

        const signUpBtn = figma.createFrame();
        signUpBtn.name = "Sign up Button";
        signUpBtn.layoutMode = "HORIZONTAL";
        signUpBtn.counterAxisAlignItems = "CENTER";
        signUpBtn.paddingLeft = 20;
        signUpBtn.paddingRight = 20;
        signUpBtn.paddingTop = 9;
        signUpBtn.paddingBottom = 9;
        signUpBtn.cornerRadius = 8;
        signUpBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
        signUpBtn.appendChild(createTxt("Sign up", 14, "SemiBold", C.bgPure));
        newsForm.appendChild(signUpBtn);

        newsRow.appendChild(newsForm);
        appendAndFill(footer, newsRow);

        // 4 Columns Row
        const footerCols = figma.createFrame();
        footerCols.name = "Footer 4 Columns";
        footerCols.layoutMode = "HORIZONTAL";
        footerCols.primaryAxisAlignItems = "SPACE_BETWEEN";
        footerCols.fills = [];

        // Col 1: About us (340px)
        const col1 = figma.createFrame();
        col1.name = "About Us Col";
        col1.resize(340, 220);
        col1.layoutMode = "VERTICAL";
        col1.itemSpacing = 16;
        col1.fills = [];
        col1.appendChild(createTxt("About us", 15, "Bold", C.bgPure));
        const aboutBody = createTxt(
          "Posh Xessories, Inc. was started with one mission: help people make the best impressions at the best price.",
          14,
          "Regular",
          { r: 0.65, g: 0.72, b: 0.82 },
          { lineHeight: 22 }
        );
        aboutBody.resize(320, 66);
        col1.appendChild(aboutBody);

        col1.appendChild(createTxt("📍 Chino, CA 91710, USA", 14, "Medium", { r: 0.8, g: 0.85, b: 0.95 }));

        const clickCallBtn = figma.createFrame();
        clickCallBtn.name = "Click to call Button";
        clickCallBtn.layoutMode = "HORIZONTAL";
        clickCallBtn.counterAxisAlignItems = "CENTER";
        clickCallBtn.paddingLeft = 14;
        clickCallBtn.paddingRight = 14;
        clickCallBtn.paddingTop = 6;
        clickCallBtn.paddingBottom = 6;
        clickCallBtn.cornerRadius = 6;
        clickCallBtn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
        clickCallBtn.appendChild(createTxt("Click to call", 13.5, "SemiBold", C.bgPure));
        col1.appendChild(clickCallBtn);
        footerCols.appendChild(col1);

        // Col 2: Common FAQ (200px)
        const col2 = figma.createFrame();
        col2.name = "Common FAQ Col";
        col2.resize(200, 220);
        col2.layoutMode = "VERTICAL";
        col2.itemSpacing = 12;
        col2.fills = [];
        col2.appendChild(createTxt("Common FAQ", 15, "Bold", C.bgPure));
        const faqLinks = ["About us", "Decoration price guide", "Flyers", "E-catalog", "How to order", "Privacy policy"];
        faqLinks.forEach(l => {
          col2.appendChild(createTxt(l, 14, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        });
        footerCols.appendChild(col2);

        // Col 3: Company (180px)
        const col3 = figma.createFrame();
        col3.name = "Company Col";
        col3.resize(180, 220);
        col3.layoutMode = "VERTICAL";
        col3.itemSpacing = 12;
        col3.fills = [];
        col3.appendChild(createTxt("Company", 15, "Bold", C.bgPure));
        const compLinks = ["Company history", "Reviews", "Awards / media"];
        compLinks.forEach(l => {
          col3.appendChild(createTxt(l, 14, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        });
        footerCols.appendChild(col3);

        // Col 4: Connect with us (180px)
        const col4 = figma.createFrame();
        col4.name = "Connect With Us Col";
        col4.resize(180, 220);
        col4.layoutMode = "VERTICAL";
        col4.itemSpacing = 12;
        col4.fills = [];
        col4.appendChild(createTxt("Connect with us", 15, "Bold", C.bgPure));
        const socialLinks = ["Facebook", "Instagram", "YouTube", "Pinterest"];
        socialLinks.forEach(l => {
          col4.appendChild(createTxt(l, 14, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
        });
        footerCols.appendChild(col4);

        appendAndFill(footer, footerCols);

        // Footer Legal Row
        const legalRow = figma.createFrame();
        legalRow.name = "Legal Row";
        legalRow.layoutMode = "HORIZONTAL";
        legalRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        legalRow.counterAxisAlignItems = "CENTER";
        legalRow.paddingTop = 24;
        legalRow.fills = [];
        legalRow.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
        legalRow.strokeWeight = 1;

        legalRow.appendChild(createTxt("Design prototype, not connected to the live store.", 13, "Regular", { r: 0.45, g: 0.5, b: 0.6 }));
        legalRow.appendChild(createTxt("© PoshXessories. All rights reserved.", 13, "Regular", { r: 0.45, g: 0.5, b: 0.6 }));
        appendAndFill(footer, legalRow);

        appendAndFill(root, footer);

        // Select and zoom
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

  console.log("Sending Corporate B2B redesign generation script to Figma...");
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
  console.log("Result:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
