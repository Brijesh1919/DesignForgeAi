async function main() {
  const code = `
    (async () => {
      // 1. Preload fonts
      const fontsToLoad = [
        { family: "Manrope", style: "ExtraBold" },
        { family: "Manrope", style: "Bold" },
        { family: "Manrope", style: "SemiBold" },
        { family: "Manrope", style: "Medium" },
        { family: "Manrope", style: "Regular" },
        { family: "Inter", style: "Regular" },
        { family: "Inter", style: "Medium" },
        { family: "Inter", style: "Bold" },
      ];
      for (const f of fontsToLoad) {
        try {
          await figma.loadFontAsync(f);
        } catch (e) {
          console.warn("Could not load font", f, e);
        }
      }

      // 2. Define the 11 official Quinn Flags Typography Styles
      const textStyleDefs = [
        {
          name: "Heading/H1",
          fontName: { family: "Manrope", style: "ExtraBold" },
          fontSize: 48,
          lineHeight: { value: 52, unit: "PIXELS" },
          letterSpacing: { value: -1, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "48 / 52 · ExtraBold · −1% — Hero & main display headings",
          sample: "Make every brand impossible to miss",
          token: "--font-heading-h1",
          weightLabel: "ExtraBold (800)",
        },
        {
          name: "Heading/H2",
          fontName: { family: "Manrope", style: "ExtraBold" },
          fontSize: 30,
          lineHeight: { value: 36, unit: "PIXELS" },
          letterSpacing: { value: -0.5, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "30 / 36 · ExtraBold · −0.5% — Section headings",
          sample: "Top-selling products",
          token: "--font-heading-h2",
          weightLabel: "ExtraBold (800)",
        },
        {
          name: "Heading/H3",
          fontName: { family: "Manrope", style: "ExtraBold" },
          fontSize: 18,
          lineHeight: { value: 24, unit: "PIXELS" },
          letterSpacing: { value: 0, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "18 / 24 · ExtraBold — Card titles & subheaders",
          sample: "Christmas stocking",
          token: "--font-heading-h3",
          weightLabel: "ExtraBold (800)",
        },
        {
          name: "Body/Large",
          fontName: { family: "Manrope", style: "Regular" },
          fontSize: 16,
          lineHeight: { value: 24, unit: "PIXELS" },
          letterSpacing: { value: 0, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "16 / 24 · Regular — Lead paragraphs & hero intros",
          sample: "Custom flags, banners, tents and trade show displays",
          token: "--font-body-large",
          weightLabel: "Regular (400)",
        },
        {
          name: "Body/Title",
          fontName: { family: "Manrope", style: "Bold" },
          fontSize: 15,
          lineHeight: { value: 21, unit: "PIXELS" },
          letterSpacing: { value: 0, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "15 / 21 · Bold — Product card titles & strong body",
          sample: "6' digitally printed stretch table cover",
          token: "--font-body-title",
          weightLabel: "Bold (700)",
        },
        {
          name: "Body/Default",
          fontName: { family: "Manrope", style: "Medium" },
          fontSize: 14,
          lineHeight: { value: 22, unit: "PIXELS" },
          letterSpacing: { value: 0, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "14 / 22 · Medium — Default copy & general descriptions",
          sample: "Quantity-based pricing on every item.",
          token: "--font-body-default",
          weightLabel: "Medium (500)",
        },
        {
          name: "Body/Small",
          fontName: { family: "Manrope", style: "Medium" },
          fontSize: 12,
          lineHeight: { value: 18, unit: "PIXELS" },
          letterSpacing: { value: 0, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "12 / 18 · Medium — Metadata, tags, product codes",
          sample: "Item code DTCS-6 · 25+ qty price",
          token: "--font-body-small",
          weightLabel: "Medium (500)",
        },
        {
          name: "Label/Button",
          fontName: { family: "Manrope", style: "Bold" },
          fontSize: 14,
          lineHeight: { value: 20, unit: "PIXELS" },
          letterSpacing: { value: 0, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "14 / 20 · Bold — Action buttons & CTAs",
          sample: "View details",
          token: "--font-label-button",
          weightLabel: "Bold (700)",
        },
        {
          name: "Label/Eyebrow",
          fontName: { family: "Manrope", style: "ExtraBold" },
          fontSize: 11,
          lineHeight: { value: 16, unit: "PIXELS" },
          letterSpacing: { value: 12, unit: "PERCENT" },
          textCase: "UPPER",
          description: "11 / 16 · ExtraBold · +12% · UPPERCASE — Category tags & section eyebrows",
          sample: "BEST SELLERS",
          token: "--font-label-eyebrow",
          weightLabel: "ExtraBold (800)",
        },
        {
          name: "Label/Tier",
          fontName: { family: "Manrope", style: "Bold" },
          fontSize: 10,
          lineHeight: { value: 14, unit: "PIXELS" },
          letterSpacing: { value: 0, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "10 / 14 · Bold — Quantity tier pricing labels",
          sample: "$255  $230  $200.50",
          token: "--font-label-tier",
          weightLabel: "Bold (700)",
        },
        {
          name: "Price/Large",
          fontName: { family: "Manrope", style: "ExtraBold" },
          fontSize: 22,
          lineHeight: { value: 26, unit: "PIXELS" },
          letterSpacing: { value: -0.5, unit: "PERCENT" },
          textCase: "ORIGINAL",
          description: "22 / 26 · ExtraBold · −0.5% — Hero & card price callouts",
          sample: "$140.00",
          token: "--font-price-large",
          weightLabel: "ExtraBold (800)",
        },
      ];

      // 3. Register or update each TextStyle in Figma
      const existingStyles = await figma.getLocalTextStylesAsync();
      const styleMap = new Map();

      for (const def of textStyleDefs) {
        let style = existingStyles.find(s => s.name === def.name);
        if (!style) {
          style = figma.createTextStyle();
          style.name = def.name;
        }
        style.fontName = def.fontName;
        style.fontSize = def.fontSize;
        style.lineHeight = def.lineHeight;
        style.letterSpacing = def.letterSpacing;
        if (def.textCase && "textCase" in style) {
          style.textCase = def.textCase;
        }
        style.description = def.description;
        styleMap.set(def.name, style);
      }

      // 4. Bind sample nodes in the selected frame (Quinn Flags / Brand Guidelines v1.0)
      let boundCount = 0;
      const sel = figma.currentPage.selection[0];
      if (sel) {
        // find 04 Typography -> Scale
        const typoSection = sel.findAll(n => n.name === "04 Typography")[0];
        if (typoSection) {
          const scaleFrame = typoSection.findAll(n => n.name === "Scale")[0];
          if (scaleFrame) {
            for (const child of scaleFrame.children) {
              // name is like "Type / Heading/H1"
              const styleName = child.name.replace(/^Type \\/ /, "").trim();
              const style = styleMap.get(styleName);
              if (style) {
                // sample is child.children where name !== "Meta"
                const sampleText = child.children?.find(c => c.name !== "Meta" && c.type === "TEXT");
                if (sampleText) {
                  await figma.loadFontAsync(sampleText.fontName);
                  sampleText.textStyleId = style.id;
                  boundCount++;
                }
              }
            }
          }
        }
      }

      // 5. Create Standalone White Visual Frame: "Text Styles — Design System"
      // Remove any previously created frame with same name
      const prevFrame = figma.currentPage.children.find(c => c.name === "Text Styles — Design System");
      if (prevFrame) {
        prevFrame.remove();
      }

      const frame = figma.createFrame();
      frame.name = "Text Styles — Design System";
      frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // pure white
      frame.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.91, b: 0.94 } }]; // #E2E8F0
      frame.strokeWeight = 1;
      frame.cornerRadius = 16;
      frame.layoutMode = "VERTICAL";
      frame.primaryAxisSizingMode = "AUTO";
      frame.counterAxisSizingMode = "FIXED";
      frame.resize(1152, 100);
      frame.paddingTop = 48;
      frame.paddingBottom = 48;
      frame.paddingLeft = 48;
      frame.paddingRight = 48;
      frame.itemSpacing = 24;

      // Position frame to right of current selection or at x=1600
      if (sel) {
        frame.x = sel.x + sel.width + 100;
        frame.y = sel.y;
      } else {
        frame.x = 1600;
        frame.y = 0;
      }

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

      // Header block
      const headerFrame = figma.createFrame();
      headerFrame.name = "Header";
      headerFrame.layoutMode = "VERTICAL";
      headerFrame.primaryAxisSizingMode = "AUTO";
      headerFrame.counterAxisSizingMode = "AUTO";
      headerFrame.layoutAlign = "STRETCH";
      headerFrame.itemSpacing = 8;
      headerFrame.fills = [];

      // Eyebrow tag
      const eyebrowTag = figma.createFrame();
      eyebrowTag.layoutMode = "HORIZONTAL";
      eyebrowTag.primaryAxisSizingMode = "AUTO";
      eyebrowTag.counterAxisSizingMode = "AUTO";
      eyebrowTag.paddingTop = 4;
      eyebrowTag.paddingBottom = 4;
      eyebrowTag.paddingLeft = 10;
      eyebrowTag.paddingRight = 10;
      eyebrowTag.cornerRadius = 999;
      eyebrowTag.fills = [{ type: "SOLID", color: { r: 0.94, g: 0.96, b: 0.98 } }];
      const eyebrowTxt = await createText(
        "DESIGN SYSTEM · TYPOGRAPHY",
        { family: "Manrope", style: "ExtraBold" },
        11,
        { r: 0.04, g: 0.09, b: 0.16 },
        { letterSpacing: { value: 10, unit: "PERCENT" }, textCase: "UPPER" }
      );
      eyebrowTag.appendChild(eyebrowTxt);
      headerFrame.appendChild(eyebrowTag);

      // Title
      const titleTxt = await createText(
        "Typography & Text Styles System",
        { family: "Manrope", style: "ExtraBold" },
        36,
        { r: 0.04, g: 0.09, b: 0.16 },
        { lineHeight: { value: 42, unit: "PIXELS" }, letterSpacing: { value: -1, unit: "PERCENT" } }
      );
      headerFrame.appendChild(titleTxt);

      // Subtitle
      const subTxt = await createText(
        "11 official Figma Local Text Styles generated from brand guidelines. Primary font: Manrope (Variable). Linked to design tokens and ready for component usage.",
        { family: "Manrope", style: "Regular" },
        15,
        { r: 0.39, g: 0.45, b: 0.55 },
        { lineHeight: { value: 22, unit: "PIXELS" } }
      );
      subTxt.layoutAlign = "STRETCH";
      headerFrame.appendChild(subTxt);

      // Stat badges row
      const statsRow = figma.createFrame();
      statsRow.name = "Stats Row";
      statsRow.layoutMode = "HORIZONTAL";
      statsRow.primaryAxisSizingMode = "AUTO";
      statsRow.counterAxisSizingMode = "AUTO";
      statsRow.itemSpacing = 16;
      statsRow.fills = [];

      const stats = [
        { label: "Total Styles", val: "11 Styles" },
        { label: "Font Family", val: "Manrope" },
        { label: "Weights", val: "400 · 500 · 700 · 800" },
        { label: "Status", val: "✓ Registered in Figma" },
      ];

      for (const st of stats) {
        const badge = figma.createFrame();
        badge.layoutMode = "HORIZONTAL";
        badge.primaryAxisSizingMode = "AUTO";
        badge.counterAxisSizingMode = "AUTO";
        badge.paddingTop = 6;
        badge.paddingBottom = 6;
        badge.paddingLeft = 12;
        badge.paddingRight = 12;
        badge.cornerRadius = 6;
        badge.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.98 } }];
        badge.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.91, b: 0.94 } }];
        badge.strokeWeight = 1;

        const badgeLabel = await createText(st.label + ": ", { family: "Manrope", style: "Medium" }, 12, { r: 0.39, g: 0.45, b: 0.55 });
        const badgeVal = await createText(st.val, { family: "Manrope", style: "Bold" }, 12, { r: 0.04, g: 0.09, b: 0.16 });
        badge.appendChild(badgeLabel);
        badge.appendChild(badgeVal);
        statsRow.appendChild(badge);
      }
      headerFrame.appendChild(statsRow);
      frame.appendChild(headerFrame);

      // Divider
      const div1 = figma.createLine();
      div1.name = "Divider";
      div1.layoutAlign = "STRETCH";
      div1.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.91, b: 0.94 } }];
      div1.strokeWeight = 1;
      frame.appendChild(div1);

      // Table Header row
      const thRow = figma.createFrame();
      thRow.name = "Table Header";
      thRow.layoutMode = "HORIZONTAL";
      thRow.primaryAxisSizingMode = "FIXED";
      thRow.counterAxisSizingMode = "AUTO";
      thRow.layoutAlign = "STRETCH";
      thRow.paddingTop = 10;
      thRow.paddingBottom = 10;
      thRow.paddingLeft = 16;
      thRow.paddingRight = 16;
      thRow.cornerRadius = 8;
      thRow.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.98 } }];

      const th1 = await createText("STYLE NAME & TOKEN", { family: "Manrope", style: "ExtraBold" }, 11, { r: 0.28, g: 0.33, b: 0.41 });
      th1.resize(260, th1.height);
      const th2 = await createText("SPECS (SIZE / LH / TRACKING)", { family: "Manrope", style: "ExtraBold" }, 11, { r: 0.28, g: 0.33, b: 0.41 });
      th2.resize(240, th2.height);
      const th3 = await createText("LIVE SPECIMEN (BOUND TO FIGMA STYLE)", { family: "Manrope", style: "ExtraBold" }, 11, { r: 0.28, g: 0.33, b: 0.41 });
      th3.layoutGrow = 1;

      thRow.appendChild(th1);
      thRow.appendChild(th2);
      thRow.appendChild(th3);
      frame.appendChild(thRow);

      // Styles rows container
      const rowsContainer = figma.createFrame();
      rowsContainer.name = "Styles List";
      rowsContainer.layoutMode = "VERTICAL";
      rowsContainer.primaryAxisSizingMode = "AUTO";
      rowsContainer.counterAxisSizingMode = "AUTO";
      rowsContainer.layoutAlign = "STRETCH";
      rowsContainer.itemSpacing = 8;
      rowsContainer.fills = [];

      for (const def of textStyleDefs) {
        const style = styleMap.get(def.name);

        const row = figma.createFrame();
        row.name = "Row / " + def.name;
        row.layoutMode = "HORIZONTAL";
        row.primaryAxisSizingMode = "FIXED";
        row.counterAxisSizingMode = "AUTO";
        row.layoutAlign = "STRETCH";
        row.counterAxisAlignItems = "CENTER";
        row.paddingTop = 16;
        row.paddingBottom = 16;
        row.paddingLeft = 16;
        row.paddingRight = 16;
        row.cornerRadius = 10;
        row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        row.strokes = [{ type: "SOLID", color: { r: 0.92, g: 0.94, b: 0.96 } }];
        row.strokeWeight = 1;

        // Col 1: Style name & Token
        const col1 = figma.createFrame();
        col1.name = "Style Info";
        col1.layoutMode = "VERTICAL";
        col1.primaryAxisSizingMode = "AUTO";
        col1.counterAxisSizingMode = "AUTO";
        col1.resize(260, 48);
        col1.itemSpacing = 4;
        col1.fills = [];

        // Pill badge with style name
        const namePill = figma.createFrame();
        namePill.layoutMode = "HORIZONTAL";
        namePill.primaryAxisSizingMode = "AUTO";
        namePill.counterAxisSizingMode = "AUTO";
        namePill.paddingTop = 2;
        namePill.paddingBottom = 2;
        namePill.paddingLeft = 8;
        namePill.paddingRight = 8;
        namePill.cornerRadius = 4;
        namePill.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.95, b: 0.98 } }];

        const nameTxt = await createText(def.name, { family: "Manrope", style: "Bold" }, 13, { r: 0.04, g: 0.22, b: 0.44 });
        namePill.appendChild(nameTxt);
        col1.appendChild(namePill);

        const tokenTxt = await createText(def.token, { family: "Manrope", style: "Medium" }, 11, { r: 0.48, g: 0.54, b: 0.63 });
        col1.appendChild(tokenTxt);
        row.appendChild(col1);

        // Col 2: Specs
        const col2 = figma.createFrame();
        col2.name = "Specs";
        col2.layoutMode = "VERTICAL";
        col2.primaryAxisSizingMode = "AUTO";
        col2.counterAxisSizingMode = "AUTO";
        col2.resize(240, 48);
        col2.itemSpacing = 4;
        col2.fills = [];

        const specMain = await createText(
          \`\${def.fontSize}px / \${def.lineHeight.value}px · \${def.weightLabel}\`,
          { family: "Manrope", style: "SemiBold" },
          12,
          { r: 0.12, g: 0.16, b: 0.22 }
        );
        col2.appendChild(specMain);

        const trackText = def.letterSpacing.value === 0 ? "Tracking: 0%" : \`Tracking: \${def.letterSpacing.value > 0 ? "+" : ""}\${def.letterSpacing.value}%\`;
        const caseText = def.textCase === "UPPER" ? " · UPPERCASE" : "";
        const specSub = await createText(
          trackText + caseText,
          { family: "Manrope", style: "Regular" },
          11,
          { r: 0.48, g: 0.54, b: 0.63 }
        );
        col2.appendChild(specSub);
        row.appendChild(col2);

        // Col 3: Live Specimen (bound to style!)
        const col3 = figma.createFrame();
        col3.name = "Live Specimen";
        col3.layoutMode = "HORIZONTAL";
        col3.primaryAxisSizingMode = "AUTO";
        col3.counterAxisSizingMode = "AUTO";
        col3.counterAxisAlignItems = "CENTER";
        col3.layoutGrow = 1;
        col3.fills = [];

        await figma.loadFontAsync(def.fontName);
        const specimenNode = figma.createText();
        specimenNode.name = "Sample / " + def.name;
        specimenNode.characters = def.sample;
        specimenNode.fills = [{ type: "SOLID", color: { r: 0.04, g: 0.09, b: 0.16 } }]; // Navy #0A1628
        // Bind to text style!
        specimenNode.textStyleId = style.id;
        col3.appendChild(specimenNode);

        row.appendChild(col3);
        rowsContainer.appendChild(row);
      }

      frame.appendChild(rowsContainer);

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

      const footLeft = await createText(
        "✓ 11 Local Text Styles configured with Manrope variable family. Bind via Text Styles panel in Figma.",
        { family: "Manrope", style: "Medium" },
        12,
        { r: 0.12, g: 0.58, b: 0.35 }
      );
      footer.appendChild(footLeft);

      const footRight = await createText(
        "Quinn Flags Design System v1.0",
        { family: "Manrope", style: "Bold" },
        12,
        { r: 0.39, g: 0.45, b: 0.55 }
      );
      footer.appendChild(footRight);
      frame.appendChild(footer);

      // Select and scroll to new frame
      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);

      return {
        success: true,
        stylesCreated: textStyleDefs.map(d => ({
          name: d.name,
          fontSize: d.fontSize,
          lineHeight: d.lineHeight.value,
          letterSpacing: d.letterSpacing.value,
          styleId: styleMap.get(d.name)?.id
        })),
        boundExistingNodesCount: boundCount,
        frameId: frame.id,
        framePosition: { x: frame.x, y: frame.y, width: frame.width, height: frame.height }
      };
    })()
  `;

  console.log("Sending EVAL_SCRIPT to bridge...");
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
  console.log("Execution Result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);

