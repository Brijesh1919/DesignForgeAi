async function main() {
  const code = `
    (async () => {
      // 1. Preload fonts
      const fonts = [
        { family: "Manrope", style: "ExtraBold" },
        { family: "Manrope", style: "Bold" },
        { family: "Manrope", style: "SemiBold" },
        { family: "Manrope", style: "Medium" },
        { family: "Manrope", style: "Regular" },
        { family: "Inter", style: "Regular" },
        { family: "Inter", style: "Medium" },
        { family: "Inter", style: "Bold" },
      ];
      for (const f of fonts) {
        try {
          await figma.loadFontAsync(f);
        } catch (e) {
          console.warn(e);
        }
      }

      // 2. Fetch all local text styles
      const localStyles = await figma.getLocalTextStylesAsync();
      const styleMap = new Map();
      localStyles.forEach(s => styleMap.set(s.name, s));

      const textStyleDefs = [
        {
          name: "Heading/H1",
          sample: "Make every brand impossible to miss",
          specs: "48px / 52px · ExtraBold (800)",
          tracking: "Tracking: −1%",
          token: "--font-heading-h1",
          role: "Hero & main page display headings"
        },
        {
          name: "Heading/H2",
          sample: "Top-selling products",
          specs: "30px / 36px · ExtraBold (800)",
          tracking: "Tracking: −0.5%",
          token: "--font-heading-h2",
          role: "Major section headers & feature titles"
        },
        {
          name: "Heading/H3",
          sample: "Christmas stocking",
          specs: "18px / 24px · ExtraBold (800)",
          tracking: "Tracking: 0%",
          token: "--font-heading-h3",
          role: "Card titles, drawer subheads & dialogs"
        },
        {
          name: "Body/Large",
          sample: "Custom flags, banners, tents and trade show displays for distributors.",
          specs: "16px / 24px · Regular (400)",
          tracking: "Tracking: 0%",
          token: "--font-body-large",
          role: "Lead paragraphs & hero introductions"
        },
        {
          name: "Body/Title",
          sample: "6' digitally printed stretch table covers",
          specs: "15px / 21px · Bold (700)",
          tracking: "Tracking: 0%",
          token: "--font-body-title",
          role: "Product grid titles & prominent lists"
        },
        {
          name: "Body/Default",
          sample: "Quantity-based pricing on every item. High quality prints with fast turnaround.",
          specs: "14px / 22px · Medium (500)",
          tracking: "Tracking: 0%",
          token: "--font-body-default",
          role: "Default body copy, articles & form fields"
        },
        {
          name: "Body/Small",
          sample: "Item code DTCS-6 · 25+ qty price · Free proofing included",
          specs: "12px / 18px · Medium (500)",
          tracking: "Tracking: 0%",
          token: "--font-body-small",
          role: "Metadata, skus, help text & table captions"
        },
        {
          name: "Label/Button",
          sample: "View details",
          specs: "14px / 20px · Bold (700)",
          tracking: "Tracking: 0%",
          token: "--font-label-button",
          role: "Buttons, interactive tabs & primary CTAs"
        },
        {
          name: "Label/Eyebrow",
          sample: "BEST SELLERS",
          specs: "11px / 16px · ExtraBold (800)",
          tracking: "Tracking: +12% · UPPERCASE",
          token: "--font-label-eyebrow",
          role: "Category tags, eyebrows & status pills"
        },
        {
          name: "Label/Tier",
          sample: "$255   $230   $200.50",
          specs: "10px / 14px · Bold (700)",
          tracking: "Tracking: 0%",
          token: "--font-label-tier",
          role: "Volume discount pricing tables & minicards"
        },
        {
          name: "Price/Large",
          sample: "$140.00",
          specs: "22px / 26px · ExtraBold (800)",
          tracking: "Tracking: −0.5%",
          token: "--font-price-large",
          role: "Primary price callouts on PDP & hero"
        },
      ];

      // Remove existing visual frame if present
      const oldFrame = figma.currentPage.children.find(c => c.name === "Text Styles — Design System");
      if (oldFrame) {
        oldFrame.remove();
      }

      // Find selected frame to align alongside it
      const sel = figma.currentPage.selection[0];
      const targetX = sel ? (sel.x + sel.width + 120) : 1600;
      const targetY = sel ? sel.y : 0;

      // 3. Create Main Board Frame
      const board = figma.createFrame();
      board.name = "Text Styles — Design System";
      board.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // Pure White #FFFFFF
      board.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.91, b: 0.94 } }]; // #E2E8F0
      board.strokeWeight = 1;
      board.cornerRadius = 20;
      board.effects = [
        {
          type: "DROP_SHADOW",
          color: { r: 0.04, g: 0.09, b: 0.16, a: 0.06 },
          offset: { x: 0, y: 12 },
          radius: 32,
          spread: 0,
          visible: true,
          blendMode: "NORMAL"
        }
      ];

      board.layoutMode = "VERTICAL";
      board.primaryAxisSizingMode = "AUTO";
      board.counterAxisSizingMode = "FIXED";
      board.resize(1180, 100);
      board.paddingTop = 48;
      board.paddingBottom = 48;
      board.paddingLeft = 48;
      board.paddingRight = 48;
      board.itemSpacing = 28;
      board.x = targetX;
      board.y = targetY;

      // Helper text creator
      const createText = async (text, font, size, color, opts = {}) => {
        await figma.loadFontAsync(font);
        const t = figma.createText();
        t.fontName = font;
        t.fontSize = size;
        t.characters = text;
        t.fills = [{ type: "SOLID", color }];
        if (opts.lineHeight) t.lineHeight = opts.lineHeight;
        if (opts.letterSpacing) t.letterSpacing = opts.letterSpacing;
        if (opts.textCase) t.textCase = opts.textCase;
        return t;
      };

      // Header Container
      const header = figma.createFrame();
      header.name = "Header";
      header.layoutMode = "VERTICAL";
      header.primaryAxisSizingMode = "AUTO";
      header.counterAxisSizingMode = "AUTO";
      header.layoutAlign = "STRETCH";
      header.itemSpacing = 12;
      header.fills = [];

      // Eyebrow pill
      const eyebrowPill = figma.createFrame();
      eyebrowPill.name = "Eyebrow";
      eyebrowPill.layoutMode = "HORIZONTAL";
      eyebrowPill.primaryAxisSizingMode = "AUTO";
      eyebrowPill.counterAxisSizingMode = "AUTO";
      eyebrowPill.counterAxisAlignItems = "CENTER";
      eyebrowPill.itemSpacing = 8;
      eyebrowPill.paddingTop = 6;
      eyebrowPill.paddingBottom = 6;
      eyebrowPill.paddingLeft = 12;
      eyebrowPill.paddingRight = 12;
      eyebrowPill.cornerRadius = 999;
      eyebrowPill.fills = [{ type: "SOLID", color: { r: 0.94, g: 0.96, b: 0.98 } }];

      // Red dot icon
      const dot = figma.createEllipse();
      dot.resize(8, 8);
      dot.fills = [{ type: "SOLID", color: { r: 0.90, g: 0.14, b: 0.16 } }]; // Red #E5252A
      eyebrowPill.appendChild(dot);

      const eyebrowTxt = await createText(
        "QUINN FLAGS · DESIGN SYSTEM v1.0",
        { family: "Manrope", style: "ExtraBold" },
        11,
        { r: 0.04, g: 0.09, b: 0.16 },
        { letterSpacing: { value: 10, unit: "PERCENT" }, textCase: "UPPER" }
      );
      eyebrowPill.appendChild(eyebrowTxt);
      header.appendChild(eyebrowPill);

      // Title
      const titleTxt = await createText(
        "Typography & Text Styles System",
        { family: "Manrope", style: "ExtraBold" },
        36,
        { r: 0.04, g: 0.09, b: 0.16 },
        { lineHeight: { value: 44, unit: "PIXELS" }, letterSpacing: { value: -1, unit: "PERCENT" } }
      );
      header.appendChild(titleTxt);

      // Description
      const descTxt = await createText(
        "All 11 official typographic styles have been registered as Figma Local Text Styles and bound to the Manrope variable font family. Each layer below is linked directly to its respective Figma TextStyle token for seamless design and development.",
        { family: "Manrope", style: "Regular" },
        15,
        { r: 0.39, g: 0.45, b: 0.55 },
        { lineHeight: { value: 24, unit: "PIXELS" } }
      );
      descTxt.layoutAlign = "STRETCH";
      header.appendChild(descTxt);

      // Stats Bar
      const statsBar = figma.createFrame();
      statsBar.name = "Stats Bar";
      statsBar.layoutMode = "HORIZONTAL";
      statsBar.primaryAxisSizingMode = "AUTO";
      statsBar.counterAxisSizingMode = "AUTO";
      statsBar.itemSpacing = 12;
      statsBar.fills = [];

      const statsData = [
        { label: "Registered Styles", val: "11 Local Styles" },
        { label: "Font Family", val: "Manrope (Google Fonts)" },
        { label: "Weights Active", val: "400 · 500 · 700 · 800" },
        { label: "Token System", val: "Active & Bound" },
      ];

      for (const item of statsData) {
        const chip = figma.createFrame();
        chip.layoutMode = "HORIZONTAL";
        chip.primaryAxisSizingMode = "AUTO";
        chip.counterAxisSizingMode = "AUTO";
        chip.paddingTop = 6;
        chip.paddingBottom = 6;
        chip.paddingLeft = 12;
        chip.paddingRight = 12;
        chip.cornerRadius = 6;
        chip.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.99 } }];
        chip.strokes = [{ type: "SOLID", color: { r: 0.89, g: 0.91, b: 0.94 } }];
        chip.strokeWeight = 1;

        const l = await createText(item.label + ": ", { family: "Manrope", style: "Medium" }, 12, { r: 0.45, g: 0.51, b: 0.60 });
        const v = await createText(item.val, { family: "Manrope", style: "Bold" }, 12, { r: 0.04, g: 0.09, b: 0.16 });
        chip.appendChild(l);
        chip.appendChild(v);
        statsBar.appendChild(chip);
      }
      header.appendChild(statsBar);
      board.appendChild(header);

      // Divider Line
      const divLine = figma.createFrame();
      divLine.name = "Divider";
      divLine.layoutAlign = "STRETCH";
      divLine.resize(1084, 1);
      divLine.fills = [{ type: "SOLID", color: { r: 0.89, g: 0.91, b: 0.94 } }];
      board.appendChild(divLine);

      // Table Column Header Row
      const tableHead = figma.createFrame();
      tableHead.name = "Table Header";
      tableHead.layoutMode = "HORIZONTAL";
      tableHead.primaryAxisSizingMode = "FIXED";
      tableHead.counterAxisSizingMode = "AUTO";
      tableHead.layoutAlign = "STRETCH";
      tableHead.counterAxisAlignItems = "CENTER";
      tableHead.paddingTop = 10;
      tableHead.paddingBottom = 10;
      tableHead.paddingLeft = 20;
      tableHead.paddingRight = 20;
      tableHead.cornerRadius = 8;
      tableHead.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.96, b: 0.98 } }];

      const hCol1 = await createText("STYLE NAME & CSS TOKEN", { family: "Manrope", style: "ExtraBold" }, 11, { r: 0.35, g: 0.41, b: 0.50 });
      hCol1.resize(260, hCol1.height);
      const hCol2 = await createText("SPECIFICATIONS", { family: "Manrope", style: "ExtraBold" }, 11, { r: 0.35, g: 0.41, b: 0.50 });
      hCol2.resize(240, hCol2.height);
      const hCol3 = await createText("LIVE SPECIMEN (BOUND TO FIGMA TEXT STYLE)", { family: "Manrope", style: "ExtraBold" }, 11, { r: 0.35, g: 0.41, b: 0.50 });
      hCol3.layoutGrow = 1;

      tableHead.appendChild(hCol1);
      tableHead.appendChild(hCol2);
      tableHead.appendChild(hCol3);
      board.appendChild(tableHead);

      // Rows List Container
      const listContainer = figma.createFrame();
      listContainer.name = "Styles List";
      listContainer.layoutMode = "VERTICAL";
      listContainer.primaryAxisSizingMode = "AUTO";
      listContainer.counterAxisSizingMode = "AUTO";
      listContainer.layoutAlign = "STRETCH";
      listContainer.itemSpacing = 10;
      listContainer.fills = [];

      for (const def of textStyleDefs) {
        const style = styleMap.get(def.name);

        const card = figma.createFrame();
        card.name = "Card / " + def.name;
        card.layoutMode = "HORIZONTAL";
        card.primaryAxisSizingMode = "FIXED";
        card.counterAxisSizingMode = "AUTO";
        card.layoutAlign = "STRETCH";
        card.counterAxisAlignItems = "CENTER";
        card.paddingTop = 18;
        card.paddingBottom = 18;
        card.paddingLeft = 20;
        card.paddingRight = 20;
        card.cornerRadius = 12;
        card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        card.strokes = [{ type: "SOLID", color: { r: 0.91, g: 0.93, b: 0.96 } }];
        card.strokeWeight = 1;

        // Left Col: Style Name & Token
        const col1 = figma.createFrame();
        col1.name = "Col / Info";
        col1.layoutMode = "VERTICAL";
        col1.primaryAxisSizingMode = "AUTO";
        col1.counterAxisSizingMode = "AUTO";
        col1.resize(260, 48);
        col1.itemSpacing = 6;
        col1.fills = [];

        // Pill with style name
        const pill = figma.createFrame();
        pill.layoutMode = "HORIZONTAL";
        pill.primaryAxisSizingMode = "AUTO";
        pill.counterAxisSizingMode = "AUTO";
        pill.paddingTop = 3;
        pill.paddingBottom = 3;
        pill.paddingLeft = 10;
        pill.paddingRight = 10;
        pill.cornerRadius = 6;
        pill.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.95, b: 0.99 } }];

        const pillText = await createText(def.name, { family: "Manrope", style: "Bold" }, 13, { r: 0.04, g: 0.22, b: 0.44 });
        pill.appendChild(pillText);
        col1.appendChild(pill);

        const tokenText = await createText(def.token, { family: "Manrope", style: "Medium" }, 11, { r: 0.48, g: 0.54, b: 0.63 });
        col1.appendChild(tokenText);
        card.appendChild(col1);

        // Middle Col: Specs
        const col2 = figma.createFrame();
        col2.name = "Col / Specs";
        col2.layoutMode = "VERTICAL";
        col2.primaryAxisSizingMode = "AUTO";
        col2.counterAxisSizingMode = "AUTO";
        col2.resize(240, 48);
        col2.itemSpacing = 4;
        col2.fills = [];

        const spec1 = await createText(def.specs, { family: "Manrope", style: "SemiBold" }, 12, { r: 0.12, g: 0.16, b: 0.24 });
        col2.appendChild(spec1);

        const spec2 = await createText(def.tracking + " · " + def.role, { family: "Manrope", style: "Regular" }, 11, { r: 0.48, g: 0.54, b: 0.63 });
        col2.appendChild(spec2);
        card.appendChild(col2);

        // Right Col: Live Specimen Bound to Style!
        const col3 = figma.createFrame();
        col3.name = "Col / Specimen";
        col3.layoutMode = "HORIZONTAL";
        col3.primaryAxisSizingMode = "AUTO";
        col3.counterAxisSizingMode = "AUTO";
        col3.counterAxisAlignItems = "CENTER";
        col3.layoutGrow = 1;
        col3.fills = [];

        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        const specimen = figma.createText();
        specimen.name = "Specimen / " + def.name;
        specimen.characters = def.sample;
        specimen.fills = [{ type: "SOLID", color: { r: 0.04, g: 0.09, b: 0.16 } }]; // #0A1628

        if (style) {
          await specimen.setTextStyleIdAsync(style.id);
        }
        col3.appendChild(specimen);
        card.appendChild(col3);

        listContainer.appendChild(card);
      }
      board.appendChild(listContainer);

      // Footer
      const footer = figma.createFrame();
      footer.name = "Footer";
      footer.layoutMode = "HORIZONTAL";
      footer.primaryAxisSizingMode = "FIXED";
      footer.counterAxisSizingMode = "AUTO";
      footer.layoutAlign = "STRETCH";
      footer.primaryAxisAlignItems = "SPACE_BETWEEN";
      footer.counterAxisAlignItems = "CENTER";
      footer.paddingTop = 16;
      footer.fills = [];

      const fLeft = await createText(
        "✓ All 11 styles registered in Figma Local Styles. Use 'Text' section in the right sidebar to apply.",
        { family: "Manrope", style: "Medium" },
        12,
        { r: 0.12, g: 0.58, b: 0.35 } // Green #1F9459
      );
      footer.appendChild(fLeft);

      const fRight = await createText(
        "Design System Typography Specification",
        { family: "Manrope", style: "Bold" },
        12,
        { r: 0.39, g: 0.45, b: 0.55 }
      );
      footer.appendChild(fRight);
      board.appendChild(footer);

      // Select board and zoom into view
      figma.currentPage.selection = [board];
      figma.viewport.scrollAndZoomIntoView([board]);

      return {
        success: true,
        boardId: board.id,
        boardName: board.name,
        stylesCount: textStyleDefs.length,
        x: board.x,
        y: board.y,
        width: board.width,
        height: board.height
      };
    })()
  `;

  console.log("Generating Visual Text Styles System Frame...");
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

