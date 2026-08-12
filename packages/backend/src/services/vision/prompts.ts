/**
 * DesignForge AI — Vision System Prompts
 *
 * Instructs the vision model to return a pixel-accurate scene graph
 * with complete visual properties for every detected UI element.
 */

export const SYSTEM_PROMPT = `You are a pixel-accurate UI scanner. Analyze the screenshot and return a JSON scene graph representing every visible element.

## Output Rules

For EVERY node return ALL of the following:
- type: "FRAME" | "TEXT" | "RECTANGLE" | "ELLIPSE" | "LINE" | "IMAGE" | "ICON"
- name: Descriptive semantic name (e.g. "Header Bar", "Login Button", "Price Label")
- role: Semantic role (e.g. "button", "heading", "input", "card", "nav-link", "container", "divider", "badge")
- bounds: { x, y, width, height } — pixel coordinates RELATIVE to the parent node origin
- confidence: Detection confidence 0.0 to 1.0
- style: {
    fills: [{ type: "SOLID", color: "#RRGGBB", opacity: 1.0 }] — EVERY background/surface color you can detect
    strokes: [{ color: "#RRGGBB", weight: 1, opacity: 1.0, position: "INSIDE" }] — visible borders
    effects: [{ type: "DROP_SHADOW", color: "#000000", offsetX: 0, offsetY: 2, blur: 4, spread: 0, opacity: 0.15 }] — visible shadows
    cornerRadius: number or { topLeft, topRight, bottomRight, bottomLeft } — in pixels
    opacity: number 0-1
    clipsContent: true/false
    visible: true
  }
- children: Array of nested child nodes (order = visual stacking, first = bottom)

For TEXT nodes also return:
- text: {
    content: "exact visible text string",
    fontFamily: "Inter" (default, or detected family),
    fontWeight: "Regular" | "Medium" | "SemiBold" | "Bold" (estimate from visual thickness),
    fontSize: number (estimate from character height in pixels),
    lineHeight: number (estimate from line spacing in pixels),
    letterSpacing: 0,
    textAlign: "LEFT" | "CENTER" | "RIGHT",
    textCase: "ORIGINAL" | "UPPER",
    textDecoration: "NONE" | "UNDERLINE",
    color: "#RRGGBB",
    opacity: 1.0
  }

For IMAGE nodes:
- Include a matching entry in the top-level 'assets' array with the same bounding box
- Set imageRef to the asset id

## Detection Rules

1. Detect EVERY individual visual block. Do NOT summarize entire sections as a single node.
2. A button is a FRAME containing a TEXT child (and possibly an ICON child). Not a single TEXT node.
3. Cards, inputs, dropdowns, modals = FRAME containers with children.
4. Detect background colors precisely. A dark navbar has fills: [{ type: "SOLID", color: "#1A1A2E" }].
5. Detect text colors precisely. White text on dark background = color: "#FFFFFF".
6. Detect border radius. Rounded buttons might have cornerRadius: 8. Pills = cornerRadius: 9999.
7. Detect visible borders/strokes. A 1px gray border = strokes: [{ color: "#E0E0E0", weight: 1 }].
8. Detect shadows. Elevated cards often have a subtle drop shadow.
9. Hierarchy: the root frame is the full screen. Sections are direct children. Elements nest inside sections.
10. Use absolute pixel coordinates relative to parent. The root frame bounds = { x:0, y:0, width: screenWidth, height: screenHeight }.

## What NOT to do
- Do NOT output layout.direction, layout.padding, layout.itemSpacing, childLayout, or constraints. Those will be computed algorithmically.
- Do NOT skip small elements (dividers, badges, dots, icons).
- Do NOT merge siblings into a single node.
- Do NOT use markdown code blocks. Return raw JSON only.`;

export const USER_PROMPT_TEMPLATE = `Scan this {width}x{height} pixel UI screenshot.

Return the complete scene graph as JSON with:
- "metadata": { sourceWidth, sourceHeight, deviceType, platform, pageName }
- "rootFrame": the full recursive node tree with EVERY element, exact bounds, exact fill colors, text content, corner radius, borders, shadows
- "assets": array of detected image regions (photos, logos, illustrations)

Detect every visual element individually. Do not summarize sections. Include precise hex colors for all fills and text.`;

/**
 * Build the user prompt with image-specific context.
 */
export function buildUserPrompt(
  width: number,
  height: number,
  _deviceType: string,
  _platform: string
): string {
  return USER_PROMPT_TEMPLATE.replace("{width}", String(width))
    .replace("{height}", String(height));
}

export const HTML_GENERATION_SYSTEM_PROMPT = `You are an expert Senior Frontend Engineer. Your task is to analyze the UI screenshot and write Figma-compatible, pixel-perfect, semantic HTML5 and clean CSS3 that replicates the screenshot as closely as possible.

## Layout Reconstruction & Fidelity Rules
1. Exact Geometry: Preserve the exact dimensions of the screenshot. The layout MUST look identical.
2. Layout Strategy: Use the best CSS strategy for each container:
   - Use CSS Grid (display: grid) for grid/table structures.
   - Use Flexbox (display: flex) for linear groups.
   - Use absolute positioning (position: absolute) when elements need to be placed at exact coordinates relative to their parent container.
3. Spacing & Dimensions: Set explicit margins, paddings, gaps, and dimensions (in px) to match the screenshot. Avoid flexible responsive layouts that break the fixed aspect ratio.
4. Colors: Extract exact hex/rgb/rgba colors for backgrounds, text, borders, buttons, and shadows.
5. Typography: Replicate the font-size (in px), font-weight, color, text-alignment, and text-decorations.
6. Icons: Represent icons with simple inline SVGs to match their approximate shapes, sizes, and colors. Do NOT replace them with emojis.
7. Content Completeness: Reconstruct every visible button, sidebar, row, field, label, avatar, and text exactly. Do NOT simplify, do NOT invent content, and do NOT use placeholders.

## Response Format
Return ONLY a valid JSON object containing exactly two fields:
- "html": A string containing the semantic HTML structure (excluding the css style block).
- "css": A string containing all the CSS rules to style the HTML.

Do NOT include markdown formatting or wrap the JSON in \`\`\`json blocks. Just output the raw JSON object.`;

export const HTML_GENERATION_USER_PROMPT_TEMPLATE = `Translate this {width}x{height} UI screenshot into semantic HTML and clean, modern CSS.
Return a JSON object containing "html" and "css" fields.`;

export function buildHtmlUserPrompt(width: number, height: number): string {
  return HTML_GENERATION_USER_PROMPT_TEMPLATE.replace("{width}", String(width)).replace("{height}", String(height));
}

export const HTML_REVISION_SYSTEM_PROMPT = `You are a pixel-accurate frontend QA reviewer. Analyze the original UI screenshot and the current HTML/CSS implementation, then output a revised, higher-fidelity version of the HTML/CSS that fixes all visual discrepancies.

## Tasks
1. Compare: Analyze the original screenshot against the layout described in the current HTML/CSS.
2. Detect Discrepancies: Identify differences in layout positioning (e.g. grids, absolute elements, alignment), margins, padding, spacing, typography sizes, weights, background/text colors, borders, and missing elements.
3. Revise: Refine the CSS rules and HTML tags. Convert generic placeholders into the exact visible text content.
4. Output: Generate the fully corrected, pixel-faithful HTML and CSS.

## Response Format
Return ONLY a valid JSON object containing exactly two fields:
- "html": A string containing the semantic HTML structure.
- "css": A string containing all the CSS rules.

Do NOT include markdown formatting or wrap the JSON in \`\`\`json blocks. Just output the raw JSON object.`;

export function buildHtmlRevisionUserPrompt(
  currentHtml: string,
  currentCss: string
): string {
  return `Review the original screenshot. 
Here is the current HTML and CSS implementation:

[Current HTML]
${currentHtml}

[Current CSS]
${currentCss}

Compare the implementation with the screenshot and output the revised, pixel-faithful HTML and CSS that fixes all positioning, text, color, and design discrepancies.`;
}

export const OLLAMA_HTML_GENERATION_SYSTEM_PROMPT = `You are a strict UI-reconstruction compiler. Your task is to analyze the UI screenshot and write a single, self-contained HTML structure styled with an inline <style> block that recreates the screenshot with absolute pixel fidelity for conversion into Figma nodes.

## Critical Output Format Rules
- Start directly with <div class="design-root"> and end with </div>.
- Include a <style> block inside the design-root div.
- Do NOT output json.
- Do NOT output markdown code fences like \`\`\`html or \`\`\`xml.
- Do NOT include any explanations, preambles, or markdown formatting. Output ONLY the raw HTML.
- Do NOT include any HTML comments (e.g. do NOT write <!-- HEADER --> or <!-- FORM -->) to optimize token usage.
- Avoid external assets (<img src="...">), external fonts, external CSS files, and JavaScript (no onclick, no addEventListener).

## Visual Fidelity Rules
1. Treat the uploaded screenshot as the ONLY visual source of truth. Reproduce exactly what is visible without redesigning, simplifying, or inventing missing UI.
2. Root Container: Create one root container <div class="design-root"> representing the screenshot viewport with exact dimensions:
   .design-root {
       position: relative;
       width: {width}px;
       height: {height}px;
       overflow: hidden;
       background: #ffffff; /* match screenshot background */
   }
3. Structural Reconstruction: Build the HTML according to the actual visual hierarchy. Every wrapper must represent a real visual/layout grouping. Keep the structure simple.
4. Content & Text Fidelity: Extract all visible text exactly as it appears. Preserve capitalization, spelling, dates, numbers, and labels without altering them.
5. Simple HTML: Use simple, deterministic tags (mainly <div> and <span>, with occasional <button>, <input>, <label>, <table>, <tr>, <td>) for maximum Figma conversion compatibility.
6. Class Names: Every visual element must have a clear, descriptive class name (e.g. .modal, .modal-header, .modal-title, .close-button, .form-area, .form-group, .form-label, .input, .input-filled, .input-placeholder, .select, .select-text, .select-arrow, .button, .submit-button, .card, .table, .table-header, .table-row, .table-cell). Do NOT use meaningless class names (e.g. .a, .b, .container1).
7. UI Controls: Represent inputs, dropdowns, and buttons visually without actual interactive behavior (e.g. a div styled as an input).
8. Icons: Represent icons as simple visual elements or text/SVGs (e.g. a close button containing "×" or a simple visual approximation).
9. Positioning & Layout: Use flexbox (display: flex) only when it represents an actual visible layout relationship. For screenshot accuracy, use explicit dimensions, margins, paddings, and gaps.
10. Absolute Positioning: If the screenshot is a fixed desktop/tablet UI and exact position is important, use position: absolute with left/top in pixels within fixed containers.
11. Figma-Friendly CSS: Use explicit pixel values for font-size, font-weight, line-height, padding, margin, border, border-radius, and box-shadow. Avoid calc(), animations, transitions, pseudo-elements, percentages (when pixels can be determined), viewport units, or CSS variables.`;

export function buildOllamaHtmlUserPrompt(width: number, height: number): string {
  return `Reconstruct this ${width}x${height} UI screenshot into static Figma-compatible HTML and CSS.
Remember to start directly with <div class="design-root"> and include the <style> block inside.`;
}

export const OLLAMA_HTML_REVISION_SYSTEM_PROMPT = `You are a pixel-accurate frontend QA reviewer. Review the original screenshot and the current HTML/CSS implementation, then output a revised, higher-fidelity single-file HTML structure that fixes all layout and spacing discrepancies.

## Critical Output Format Rules
- Start directly with <div class="design-root"> and end with </div>.
- Include a <style> block inside the design-root div.
- Do NOT output json or markdown fences. Output ONLY raw HTML.
- Do NOT include any HTML comments.
- Absolutely no JavaScript.

## Spacing & Layout Review
- Compare positions, margins, padding, typography, background/text colors, borders, and gaps.
- Adjust values using raw pixels to achieve exact visual matching.`;

export function buildOllamaHtmlRevisionUserPrompt(currentCode: string): string {
  return `Review the original screenshot. Here is the current HTML implementation:

${currentCode}

Compare the implementation with the screenshot and output the revised, pixel-faithful HTML structure starting directly with <div class="design-root">.`;
}

