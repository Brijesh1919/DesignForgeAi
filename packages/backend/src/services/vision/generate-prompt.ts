/**
 * DesignForge AI — AI Design Generator Prompts & Schemas
 *
 * Strict JSON schema contract and prompts for generating visually complete HTML & CSS.
 */

export const AI_DESIGN_RESPONSE_SCHEMA = {
  type: "object",
  required: ["html", "css"],
  additionalProperties: false,
  properties: {
    html: {
      type: "string",
      description: "Complete semantic HTML markup for the web interface wrapped in <div class=\"design-root\">.",
    },
    css: {
      type: "string",
      description: "Complete CSS stylesheet containing comprehensive visual styling for every class used in the HTML.",
    },
  },
};

export const AI_CSS_REPAIR_SCHEMA = {
  type: "object",
  required: ["css"],
  additionalProperties: false,
  properties: {
    css: {
      type: "string",
      description: "Complete CSS stylesheet rules specifically styling all missing HTML classes and visual sections.",
    },
  },
};

export const GENERATE_DESIGN_SYSTEM_PROMPT = `You are an expert frontend UI designer and HTML/CSS engineer.

Generate a complete, visually polished web interface with BOTH HTML and CSS in ONE response.

Return ONLY valid JSON with exactly two properties:
{
  "html": "complete HTML markup",
  "css": "complete CSS stylesheet"
}

CSS IS MANDATORY:
- Generate the COMPLETE HTML and COMPLETE CSS together in ONE response.
- Never stop CSS generation early.
- Every visual element and class represented in HTML must have corresponding CSS styling rules.
- Do NOT omit CSS. Do NOT return empty or placeholder CSS.
- Do NOT wrap JSON in markdown fences (no \`\`\`json). Output pure JSON.

COMPACT AND HIGH-DENSITY GUIDELINES:
- Keep HTML semantic, clean, and concise (approx 2,500–3,500 characters). Avoid overly repetitive or deeply nested DOM trees.
- Write compact, high-impact CSS (approx 2,500–3,500 characters) that thoroughly styles the entire page.
- Do not repeat identical CSS rules. Use shared classes (e.g. .btn, .btn-primary) or grouped selectors where appropriate.
- For icons, use clean inline SVG with viewBox, width, height, stroke, and fill.
- For images, use valid high-quality Unsplash URLs (e.g. https://images.unsplash.com/photo-... with ?w=400 or ?w=800).

STRUCTURE REQUIREMENTS:
1. Wrap the entire HTML design inside: <div class="design-root">...</div>.
2. In CSS, include global rules: * { box-sizing: border-box; margin: 0; padding: 0; } and .design-root { position: relative; width: 1200px; min-height: 900px; background: #ffffff; }
3. Ensure every major section (header, navigation, hero, features grid, pricing cards, testimonials, footer) has real visual styling.
4. Output ONLY the JSON object with "html" and "css" fields.`;

export function buildGenerateDesignUserPrompt(userPrompt: string): string {
  return `Generate a complete, visually polished HTML and CSS web design for the following request:

"${userPrompt}"

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON with exactly two properties: "html" and "css".
2. Both "html" and "css" fields are MANDATORY and must be non-empty strings.
3. The "html" field must contain semantic, modern structure wrapped in <div class="design-root">.
4. The "css" field MUST contain complete visual styling for all classes and sections used in the HTML.
5. Generate BOTH fields completely in this single response. Do not truncate CSS.`;
}

export function buildGenerateDesignRetryPrompt(userPrompt: string): string {
  return `Your previous response generated incomplete CSS.

Generate the SAME design concept again with:
1. Complete HTML
2. Complete CSS

Return both fields in pure JSON:
{
  "html": "...",
  "css": "..."
}

Do not omit CSS. Do not shorten CSS. Every visual element in HTML must have real CSS rules.

Design request:
"${userPrompt}"`;
}

export function buildGenerateDesignRepairPrompt(
  html: string,
  existingCss: string,
  missingClasses: string[]
): string {
  return `Your previous response generated HTML but the CSS is incomplete and missing rules for several elements.

HTML excerpt:
${html.slice(0, 1500)}...

CSS currently covers:
${existingCss.slice(0, 300)}...

Missing or unstyled HTML classes that need CSS styling:
${missingClasses.join(", ")}

Generate ONLY the COMPLETE CSS stylesheet required to fully style all missing and unstyled HTML classes and sections above.
- Do not modify the HTML.
- Do not remove classes.
- Return ONLY valid JSON:
{
  "css": "complete CSS rules for all unstyled classes"
}`;
}
