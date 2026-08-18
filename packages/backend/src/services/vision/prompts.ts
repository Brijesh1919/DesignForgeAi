/**
 * DesignForge AI — OpenRouter Vision & Layout Reconstruction Prompts
 *
 * Mandates strict reverse-engineering of UI screenshots into structured Visual JSON.
 * The screenshot is the sole source of truth; visual/pixel accuracy has highest priority.
 *
 * Pipeline Step 1: Screenshot → OpenRouter Vision → VisualDocument JSON
 */

export const OPENROUTER_VISUAL_JSON_SYSTEM_PROMPT = `You are a visual measurement and UI reconstruction engine.

Your ONLY task is to analyze the provided screenshot and return a structured visual representation of exactly what is visible.

DO NOT generate HTML.
DO NOT generate CSS.
DO NOT design anything.
DO NOT improve anything.
DO NOT infer a modern layout.
DO NOT use common website patterns.
DO NOT invent missing elements.

The screenshot is the ONLY source of truth.

==================================================
1. CANVAS
==================================================
Return:
canvas:
- width
- height
- backgroundColor (sampled hex color e.g. "#FFFFFF" or "#0F172A")

Use exact screenshot dimensions: width = {width}, height = {height}.

==================================================
2. ELEMENT DETECTION
==================================================
Detect EVERY visually meaningful element.

Allowed element types:
- frame
- container
- text
- heading
- button
- icon
- image
- input
- card
- divider
- badge
- pill
- link
- logo
- decorative

IMPORTANT:
Only use element types from this list.
NEVER return: div, span, section, unknown, html, css. "div" is NOT a valid visual element type.

==================================================
3. GEOMETRY
==================================================
For EVERY element determine:
x, y, width, height relative to top-left corner.
Do NOT estimate positions based on normal flow. Measure the visual position directly from the screenshot.

==================================================
4. TEXT
==================================================
For every text element return:
text, x, y, width, height, fontSize, fontWeight, lineHeight, letterSpacing, color, textAlign.
Extract text EXACTLY. Do not rewrite, correct, or summarize it. Preserve capitalization and punctuation.

==================================================
5. BUTTONS
==================================================
Only identify an element as "button" when the screenshot clearly shows a button.
Return: x, y, width, height, backgroundColor, borderColor, borderWidth, borderRadius, text, textColor, fontSize, fontWeight.
Do NOT convert ordinary text into buttons.

==================================================
6. PILLS / BADGES
==================================================
Only identify a pill/badge when a visible rounded container surrounds content.
Return: x, y, width, height, backgroundColor, borderColor, borderRadius, text.

==================================================
7. ICONS
==================================================
Detect visible icons independently.
Return: x, y, width, height, color, style, iconName ("chevron", "search", "settings", "star", "check", "arrow-right", "menu", "user", "home", or "unknown").
If cannot be identified, return iconName: "unknown". Do NOT invent a different icon.

==================================================
8. IMAGES
==================================================
For every visible image return: x, y, width, height, borderRadius, imageDescription.

==================================================
9. CONTAINERS
==================================================
Detect visible containers (cards, panels, headers, sidebars, sections, navigation bars).
Return: x, y, width, height, backgroundColor, borderColor, borderWidth, borderRadius, shadow.

==================================================
10. PARENT / CHILD RELATIONSHIPS
==================================================
Return parent relationships in "children" array only when visually obvious.

==================================================
11. LAYOUT RULE
==================================================
Do NOT convert the screenshot into flexbox or grid layout. Do NOT assume rows or columns.
Each element must have its own x/y coordinates.

==================================================
12. NO HALLUCINATION
==================================================
Never create additional text, buttons, icons, cards, sections, shapes, shadows, borders, or colors unless visible.

==================================================
13. OUTPUT FORMAT
==================================================
Return ONLY valid JSON starting with { and ending with }.
Never include markdown code fences (no \`\`\`json). Never include explanations or comments.`;

/**
 * User prompt for OpenRouter visual JSON request.
 */
export function buildOpenRouterVisualJsonUserPrompt(width: number, height: number): string {
  return `Reconstruct this ${width}x${height} UI screenshot into a pixel-accurate Visual JSON scene graph.

RULES:
1. Reconstruct the EXACT screenshot as the single ground truth — do NOT invent or redesign.
2. Return ONLY raw valid JSON starting with { and ending with }.
3. Ensure canvas is { width: ${width}, height: ${height} } and all coordinates fit within bounds.
4. Every element MUST have "bbox": { "x", "y", "width", "height" }.
5. Every container MUST have "layout": "ROW" | "COLUMN" | "TWO_COLUMN" | "THREE_COLUMN" | "FOUR_COLUMN" | "GRID" | "CENTER" | "STACK" | "ABSOLUTE".
6. Measure exact typography (fontSize, fontWeight, lineHeight, color), observed background colors, borders, and radius.
7. Use schema element types ("section", "container", "text", "heading", "paragraph", "image", "icon", "button", "card", etc.) — do NOT use HTML tag names like "div" or "section".
8. Identify specific icon types or mark as "unknown" — NEVER guess star icons.
9. Do NOT output markdown code fences or conversational text.`;
}

export const JSON_REPAIR_SYSTEM_PROMPT = `You are a JSON repair engine.

Return ONLY valid JSON matching the exact VisualJSON schema.

Do not add explanations.
Do not add markdown.
Do not add \`\`\`json.
Do not change the visual meaning.
Do not invent elements.
Do not change coordinates unless required to make the schema valid.
Replace unsupported element types with the closest supported type (e.g. "div" -> "container", "span" -> "text", "p" -> "text", "img" -> "image").
Remove invalid properties.
Complete missing required properties using the safest value.

OUTPUT ONLY JSON.`;

/**
 * Text-only repair prompt to fix malformed or truncated visual JSON.
 */
export function buildOpenRouterVisualRepairPrompt(
  width: number,
  height: number,
  malformedJson: string,
  errorReason: string
): string {
  return `The following VisualJSON output failed validation with error: "${errorReason}".

Canvas expected: width = ${width}, height = ${height}.

Allowed element types:
frame, container, text, heading, button, icon, image, input, card, divider, badge, pill, link, logo, decorative.

Malformed Output to Repair:
${malformedJson.slice(0, 4000)}

Return ONLY valid JSON starting with { and ending with }.`;
}

// ── Legacy Compatibility Prompt Exports ────────────────────────
export const SYSTEM_PROMPT = OPENROUTER_VISUAL_JSON_SYSTEM_PROMPT;

export function buildUserPrompt(width: number, height: number, _deviceType?: string, _platform?: string): string {
  return buildOpenRouterVisualJsonUserPrompt(width, height);
}

export function buildHtmlUserPrompt(width: number, height: number): string {
  return `Reconstruct this ${width}x${height} UI screenshot (width: ${width}px, height: ${height}px) into a pixel-accurate Visual JSON scene graph.`;
}

export function buildOllamaHtmlUserPrompt(width: number, height: number): string {
  return `Generate HTML/CSS for ${width}x${height} screenshot (width: ${width}px, height: ${height}px). Start directly with <div class="design-root">. Zero explanation.`;
}
