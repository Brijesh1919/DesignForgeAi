/**
 * DesignForge AI — Robust Visual JSON Extractor, Normalizer & Validator
 *
 * Safely extracts, sanitizes, parses, normalizes HTML tag types to schema types,
 * validates geometry, and infers container layouts before deterministic HTML/CSS generation.
 *
 * Pipeline Order:
 * 1. Extract & Repair JSON string (extractAndSanitizeJson / robustParseAndRepairJson)
 * 2. Parse JSON (JSON.parse with progressive truncation repair)
 * 3. Normalize Document & Element Types (normalizeVisualDocument)
 * 4. Geometry Validation & Layout Inference (validateElement)
 *
 * Schema Version: v7-visual-reconstruction
 */

import type { VisualDocument, ContainerLayoutMode } from "./VisualSchema.js";
import { VALID_ELEMENT_TYPES } from "./VisualSchema.js";

export interface VisualJsonValidationResult {
  valid: boolean;
  extracted: boolean;
  parsed: boolean;
  doc: VisualDocument | null;
  errors: string[];
  warnings: string[];
  stats: {
    rawElements: number;
    normalizedElements: number;
    totalElements: number;
    typeConversions: number;
    containersCount: number;
    textElements: number;
    iconElements: number;
    imageElements: number;
    maxDepth: number;
  };
}

const MAX_ALLOWED_DEPTH = 12; // Support deeply nested landing page sections
const MAX_ALLOWED_ELEMENTS = 1000;

/** Valid CSS color pattern */
const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+)$/;
function isValidColor(value: string): boolean {
  return CSS_COLOR_RE.test(value.trim());
}

/**
 * Mapping from common HTML tag names, aliases, and framework wrappers to Schema Element Types.
 */
export const ELEMENT_TYPE_MAP: Record<string, string> = {
  // Generic layout / container wrappers
  div: "container",
  section: "section",
  main: "container",
  article: "container",
  aside: "sidebar",
  sidebar: "sidebar",
  header: "header",
  footer: "footer",
  nav: "navbar",
  navbar: "navbar",
  navigation: "navigation",
  menu: "menu",
  "menu-item": "menu-item",
  menuitem: "menu-item",
  navitem: "menu-item",
  "nav-item": "menu-item",
  card: "card",
  box: "container",
  wrapper: "container",
  frame: "container",
  group: "container",
  row: "row",
  col: "column",
  column: "column",
  grid: "grid",
  stack: "container",
  flex: "container",
  layout: "container",
  panel: "container",
  block: "container",
  figure: "container",
  form: "container",
  fieldset: "container",
  table: "table",
  thead: "container",
  tbody: "container",
  tr: "row",
  td: "container",
  th: "container",
  ul: "list",
  ol: "list",
  li: "container",

  // Text types
  text: "text",
  heading: "heading",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  title: "heading",
  subtitle: "heading",
  p: "paragraph",
  paragraph: "paragraph",
  span: "text",
  label: "label",
  caption: "text",
  typography: "text",
  blockquote: "text",
  code: "text",
  pre: "text",
  b: "text",
  strong: "text",
  i: "text",
  em: "text",
  small: "text",
  a: "link",
  link: "link",

  // Visual / media types
  img: "image",
  image: "image",
  picture: "image",
  photo: "image",
  avatar: "avatar",
  logo: "logo",
  banner: "image",
  illustration: "image",
  thumbnail: "image",
  icon: "icon",
  svg: "icon",
  glyph: "icon",
  symbol: "icon",

  // Interactive controls
  button: "button",
  btn: "button",
  cta: "button",
  input: "input",
  textarea: "input",
  select: "input",
  textfield: "input",
  searchbar: "input",
  "search-input": "input",

  // Dividers & Badges
  divider: "divider",
  hr: "divider",
  separator: "divider",
  line: "line",
  badge: "badge",
  chip: "badge",
  tag: "badge",
  pill: "badge",
  rectangle: "rectangle",
  rect: "rectangle",
};

/**
 * Normalizes a single raw element type into a valid Schema Element Type.
 * Gracefully handles unrecognized types without throwing.
 */
export function normalizeElementType(
  rawType: unknown,
  elem: Record<string, unknown>
): { type: string; converted: boolean; original: string } {
  if (typeof rawType !== "string" || !rawType.trim()) {
    if ((elem["text"] || elem["content"]) && (!Array.isArray(elem["children"]) || elem["children"].length === 0)) {
      return { type: "text", converted: true, original: String(rawType) };
    }
    return { type: "container", converted: true, original: String(rawType) };
  }

  const cleaned = rawType.toLowerCase().trim().replace(/^[.<#]+/, "");
  const mapped = ELEMENT_TYPE_MAP[cleaned];

  if (mapped) {
    const isConverted = mapped !== cleaned;
    return { type: mapped, converted: isConverted, original: cleaned };
  }

  if (VALID_ELEMENT_TYPES.has(cleaned as any)) {
    return { type: cleaned, converted: false, original: cleaned };
  }

  const fallback = (elem["text"] || elem["content"]) && (!Array.isArray(elem["children"]) || elem["children"].length === 0)
    ? "text"
    : "container";

  console.log(`[VisualJSON] Unknown type after normalization: "${rawType}" → fallback: "${fallback}"`);
  return { type: fallback, converted: true, original: cleaned };
}

/**
 * Robustly extracts and sanitizes a JSON string from LLM output.
 * Handles markdown fences, surrounding text, trailing commas, comments, and unclosed brackets.
 */
export function extractAndSanitizeJson(rawText: string): { jsonStr: string; extracted: boolean } {
  if (!rawText || typeof rawText !== "string") {
    return { jsonStr: "", extracted: false };
  }

  let text = rawText.trim();

  // 1. Remove markdown fences (e.g. ```json ... ``` or ``` ... ```)
  text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();

  // 2. Locate first '{'
  const firstBrace = text.indexOf("{");
  if (firstBrace === -1) {
    return { jsonStr: "", extracted: false };
  }

  // 3. Locate last '}'
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace !== -1 && lastBrace >= firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  } else {
    text = text.slice(firstBrace);
  }

  // 4. Strip single-line (// ...) and multi-line (/* ... */) comments
  text = text.replace(/\/\/[^\n\r]*/g, "");
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");

  // 5. Strip trailing commas before closing braces/brackets
  text = text.replace(/,\s*([\}\]])/g, "$1");

  // 6. Handle truncation / unclosed strings and brackets
  let openCurly = 0;
  let openSquare = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\" && !isEscaped) {
        isEscaped = true;
      } else {
        if (ch === '"' && !isEscaped) {
          inString = false;
        }
        isEscaped = false;
      }
    } else {
      if (ch === '"') inString = true;
      else if (ch === "{") openCurly++;
      else if (ch === "}") openCurly--;
      else if (ch === "[") openSquare++;
      else if (ch === "]") openSquare--;
    }
  }

  // If truncated inside an unclosed string
  if (inString) {
    text += '"';
  }

  // Clean trailing dangling comma or colon before bracket closures
  text = text.replace(/,\s*$/, "");
  text = text.replace(/:\s*$/, ': ""');

  // Close unclosed square brackets
  while (openSquare > 0) {
    text += "]";
    openSquare--;
  }

  // Close unclosed curly braces
  while (openCurly > 0) {
    text += "}";
    openCurly--;
  }

  // Clean trailing commas once more after closure
  text = text.replace(/,\s*([\}\]])/g, "$1");

  return { jsonStr: text, extracted: true };
}

/**
 * Advanced multi-strategy JSON parser & repair engine.
 * Handles unescaped control chars, unclosed strings, trailing commas, and mid-stream token truncation.
 */
export function robustParseAndRepairJson(rawText: string): { doc: any | null; error?: string } {
  // 1. Initial extraction & sanitization
  const { jsonStr, extracted } = extractAndSanitizeJson(rawText);
  if (!extracted || !jsonStr) {
    return { doc: null, error: "No JSON object structure found" };
  }

  // 2. Direct parse attempt
  try {
    const doc = JSON.parse(jsonStr);
    return { doc };
  } catch (e1: any) {
    // Continue to repair strategies
  }

  // 3. Strategy A: Fix unescaped control characters inside string literals
  let cleanedStr = jsonStr.replace(/[\u0000-\u001F]+/g, (match) => {
    if (match === "\n") return "\\n";
    if (match === "\r") return "\\r";
    if (match === "\t") return "\\t";
    return "";
  });

  try {
    const doc = JSON.parse(cleanedStr);
    return { doc };
  } catch (e2: any) {
    // Continue to truncation repair
  }

  // 4. Strategy B: Progressive Truncation Repair (for truncated JSON responses at token limits)
  let searchStr = cleanedStr;
  for (let attempt = 0; attempt < 5; attempt++) {
    const lastObjectEnd = searchStr.lastIndexOf("}");
    const lastArrayEnd = searchStr.lastIndexOf("]");
    const cutPos = Math.max(lastObjectEnd, lastArrayEnd);

    if (cutPos <= 20) break; // Not enough content left

    searchStr = searchStr.slice(0, cutPos + 1);

    const resanitized = extractAndSanitizeJson(searchStr);
    if (resanitized.jsonStr) {
      try {
        const doc = JSON.parse(resanitized.jsonStr);
        console.warn(`⚠️ [VisualJSON] Truncation repair pass ${attempt + 1} succeeded! Extracted valid partial document.`);
        return { doc };
      } catch (e3) {
        searchStr = searchStr.slice(0, cutPos);
      }
    }
  }

  return { doc: null, error: "Failed to parse or repair JSON structure" };
}

/**
 * Infers container layout relationship if omitted based on children positions.
 */
export function inferContainerLayout(elem: any): ContainerLayoutMode {
  if (elem.layout && typeof elem.layout === "string") {
    const upper = elem.layout.toUpperCase().trim();
    if (
      upper === "ROW" ||
      upper === "COLUMN" ||
      upper === "GRID" ||
      upper === "TWO_COLUMN" ||
      upper === "THREE_COLUMN" ||
      upper === "FOUR_COLUMN" ||
      upper === "CENTER" ||
      upper === "STACK" ||
      upper === "ABSOLUTE" ||
      upper === "OVERLAY"
    ) {
      return upper as ContainerLayoutMode;
    }
  }

  if (elem.type === "navbar" || elem.type === "header" || elem.type === "navigation" || elem.type === "row") {
    return "ROW";
  }

  if (!Array.isArray(elem.children) || elem.children.length <= 1) {
    return "COLUMN";
  }

  const children = elem.children;
  let isHorizontal = true;
  let isVertical = true;

  for (let i = 0; i < children.length - 1; i++) {
    const c1 = children[i];
    const c2 = children[i + 1];
    const x1 = c1.bbox?.x ?? c1.x ?? 0;
    const y1 = c1.bbox?.y ?? c1.y ?? 0;
    const x2 = c2.bbox?.x ?? c2.x ?? 0;
    const y2 = c2.bbox?.y ?? c2.y ?? 0;

    if (x2 <= x1 + 10) isHorizontal = false;
    if (y2 <= y1 + 10) isVertical = false;
  }

  if (isHorizontal && !isVertical) {
    if (children.length === 2) return "TWO_COLUMN";
    if (children.length === 3) return "THREE_COLUMN";
    if (children.length === 4) return "FOUR_COLUMN";
    return "ROW";
  }

  return "COLUMN";
}

/**
 * Recursively normalizes all element types, geometries, and layouts across the document.
 */
export function normalizeVisualDocument(doc: any): {
  doc: any;
  rawElementsCount: number;
  conversions: number;
  conversionDetails: string[];
} {
  let rawElementsCount = 0;
  let conversions = 0;
  const conversionDetails: string[] = [];

  function normalizeElementRecursive(el: any) {
    if (!el || typeof el !== "object") return;
    rawElementsCount++;

    // 1. Normalize geometry: bbox vs bounds vs flat x,y,width,height
    const bbox = el.bbox || el.bounds;
    if (bbox && typeof bbox === "object") {
      if (el.x === undefined && typeof bbox.x === "number") el.x = bbox.x;
      if (el.y === undefined && typeof bbox.y === "number") el.y = bbox.y;
      if (el.width === undefined && typeof bbox.width === "number") el.width = bbox.width;
      if (el.height === undefined && typeof bbox.height === "number") el.height = bbox.height;
    }

    if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
      if (!el.bbox) {
        el.bbox = { x: el.x, y: el.y, width: el.width, height: el.height };
      }
    }

    // 2. Normalize style if present
    if (el.style && typeof el.style === "object") {
      for (const k of Object.keys(el.style)) {
        if (el[k] === undefined) el[k] = el.style[k];
      }
    }

    // 3. Normalize content alias to text
    if (!el.text && typeof el.content === "string") {
      el.text = el.content;
    }

    // 4. Normalize element type
    const origType = el.type;
    const { type: normType, converted } = normalizeElementType(origType, el);
    el.type = normType;

    if (converted) {
      conversions++;
      const detail = `${origType} → ${normType}`;
      if (!conversionDetails.includes(detail)) {
        conversionDetails.push(detail);
      }
    }

    // 5. Normalize container layout mode
    el.layout = inferContainerLayout(el);

    // 6. Recursively normalize children
    if (Array.isArray(el.children)) {
      for (const child of el.children) {
        normalizeElementRecursive(child);
      }
    }
  }

  if (doc && Array.isArray(doc.elements)) {
    for (const el of doc.elements) {
      normalizeElementRecursive(el);
    }
  }

  return { doc, rawElementsCount, conversions, conversionDetails };
}

/** Recursively validate a VisualElement and its children */
function validateElement(
  el: unknown,
  path: string,
  depth: number,
  canvasW: number,
  canvasH: number,
  stats: {
    totalElements: number;
    containersCount: number;
    textElements: number;
    headingElements: number;
    buttonElements: number;
    iconElements: number;
    imageElements: number;
    maxDepth: number;
  }
): string[] {
  const errors: string[] = [];

  if (depth > MAX_ALLOWED_DEPTH) {
    errors.push(`${path}: Exceeded maximum nesting depth ${MAX_ALLOWED_DEPTH}`);
    return errors;
  }
  stats.maxDepth = Math.max(stats.maxDepth, depth);

  if (!el || typeof el !== "object") {
    errors.push(`${path}: Element must be an object`);
    return errors;
  }

  const elem = el as Record<string, unknown>;

  // Type check (already normalized)
  if (!elem["type"] || typeof elem["type"] !== "string") {
    errors.push(`${path}: Missing or invalid "type" field`);
  } else {
    const normType = (elem["type"] as string).toLowerCase();
    if (!VALID_ELEMENT_TYPES.has(normType)) {
      errors.push(`${path}: Unknown element type "${elem["type"]}"`);
    }
  }

  // Count metrics
  stats.totalElements++;
  const t = elem["type"] as string;
  if (
    t === "section" ||
    t === "sidebar" ||
    t === "header" ||
    t === "navbar" ||
    t === "navigation" ||
    t === "card" ||
    t === "container" ||
    t === "footer" ||
    t === "row" ||
    t === "column" ||
    t === "grid" ||
    t === "table" ||
    t === "menu" ||
    t === "list"
  ) {
    stats.containersCount++;
  }
  if (t === "heading") stats.headingElements++;
  if (t === "button") stats.buttonElements++;
  if (t === "text" || t === "heading" || t === "paragraph" || t === "label" || typeof elem["text"] === "string") stats.textElements++;
  if (elem["isIcon"] === true || t === "icon" || t === "svg" || typeof elem["iconType"] === "string" || typeof elem["iconName"] === "string") stats.iconElements++;
  if (elem["isImage"] === true || t === "image" || t === "logo" || t === "avatar") stats.imageElements++;

  // Numeric geometry checks
  const numericFields = ["x", "y", "width", "height", "fontSize", "fontWeight", "borderRadius", "opacity"];
  for (const field of numericFields) {
    if (field in elem && elem[field] !== undefined && elem[field] !== null) {
      const v = elem[field];
      if (typeof v !== "number" || !isFinite(v) || isNaN(v)) {
        errors.push(`${path}.${field}: Must be a finite number, got ${JSON.stringify(v)}`);
      }
      if ((field === "width" || field === "height") && typeof v === "number" && v < 0) {
        errors.push(`${path}.${field}: Must not be negative, got ${v}`);
      }
    }
  }

  // Colors
  for (const colorField of ["background", "color", "border"]) {
    if (colorField in elem && elem[colorField] !== undefined && elem[colorField] !== null) {
      const cv = elem[colorField];
      if (typeof cv !== "string") {
        errors.push(`${path}.${colorField}: Must be a string, got ${typeof cv}`);
      } else if (colorField !== "border" && !isValidColor(cv)) {
        errors.push(`${path}.${colorField}: "${cv}" is not a valid CSS color`);
      }
    }
  }

  // Validate children recursively
  if ("children" in elem && elem["children"] !== undefined && elem["children"] !== null) {
    if (!Array.isArray(elem["children"])) {
      errors.push(`${path}.children: Must be an array`);
    } else {
      for (let i = 0; i < (elem["children"] as unknown[]).length; i++) {
        const child = (elem["children"] as unknown[])[i];
        const childErrors = validateElement(child, `${path}.children[${i}]`, depth + 1, canvasW, canvasH, stats);
        errors.push(...childErrors);
      }
    }
  }

  return errors;
}

/**
 * Parse, normalize, and validate a Visual JSON string returned by OpenRouter Vision API.
 */
export function validateVisualJson(
  rawText: string,
  expectedWidth = 375,
  expectedHeight = 812
): VisualJsonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats = {
    rawElements: 0,
    normalizedElements: 0,
    totalElements: 0,
    typeConversions: 0,
    containersCount: 0,
    textElements: 0,
    headingElements: 0,
    buttonElements: 0,
    iconElements: 0,
    imageElements: 0,
    maxDepth: 0,
    isTruncated: false,
  };

  // 1. Multi-strategy parse & progressive truncation repair
  const parseResult = robustParseAndRepairJson(rawText);

  if (!parseResult.doc) {
    errors.push(parseResult.error || "No valid JSON structure found in vision response");
    return { valid: false, extracted: false, parsed: false, doc: null, errors, warnings, stats };
  }

  const rawDoc = parseResult.doc;

  if (!rawDoc || typeof rawDoc !== "object") {
    errors.push("Root must be a JSON object");
    return { valid: false, extracted: true, parsed: false, doc: null, errors, warnings, stats };
  }

  // 2. Normalization layer
  const { doc, rawElementsCount, conversions, conversionDetails } = normalizeVisualDocument(rawDoc);
  stats.rawElements = rawElementsCount;
  stats.typeConversions = conversions;

  for (const detail of conversionDetails) {
    console.log(`[VisualJSON] Type normalized: ${detail}`);
  }

  // 3. Normalize canvas / viewport
  if (!doc.viewport && doc.canvas) {
    doc.viewport = {
      width: doc.canvas.width || expectedWidth,
      height: doc.canvas.height || expectedHeight,
    };
    if (doc.canvas.background && !doc.global?.background) {
      if (!doc.global) doc.global = {};
      doc.global.background = doc.canvas.background;
    }
  }
  if (!doc.viewport || typeof doc.viewport !== "object") {
    errors.push("Missing required field: canvas or viewport object");
  } else {
    if (typeof doc.viewport.width !== "number" || doc.viewport.width <= 0) {
      doc.viewport.width = expectedWidth;
    }
    if (typeof doc.viewport.height !== "number" || doc.viewport.height <= 0) {
      doc.viewport.height = expectedHeight;
    }
  }

  const canvasW = doc.viewport?.width || expectedWidth;
  const canvasH = doc.viewport?.height || expectedHeight;

  // 4. Validate elements array
  if (!Array.isArray(doc.elements)) {
    errors.push("Missing required field: elements (must be an array)");
    return { valid: false, extracted: true, parsed: true, doc: null, errors, warnings, stats };
  }

  if (doc.elements.length === 0) {
    errors.push("elements array is empty — no visual elements identified");
  }

  // 5. Validate individual elements
  for (let i = 0; i < doc.elements.length; i++) {
    const elemErrors = validateElement(doc.elements[i], `elements[${i}]`, 0, canvasW, canvasH, stats);
    errors.push(...elemErrors);
  }

  stats.normalizedElements = stats.totalElements;

  if (stats.totalElements > MAX_ALLOWED_ELEMENTS) {
    errors.push(`Total element count (${stats.totalElements}) exceeds maximum allowed (${MAX_ALLOWED_ELEMENTS})`);
  }

  const valid = errors.length === 0 && stats.totalElements > 0;

  // Formatted Structured Logging per specification (Section 21)
  console.log(`\n[VisualJSON] Canvas: ${canvasW}x${canvasH}`);
  console.log(`[VisualJSON] Elements: ${stats.totalElements}`);
  console.log(`[VisualJSON] Containers: ${stats.containersCount}`);
  console.log(`[VisualJSON] Text: ${stats.textElements}`);
  console.log(`[VisualJSON] Headings: ${stats.headingElements}`);
  console.log(`[VisualJSON] Buttons: ${stats.buttonElements}`);
  console.log(`[VisualJSON] Images: ${stats.imageElements}`);
  console.log(`[VisualJSON] Icons: ${stats.iconElements}`);
  console.log(`[VisualJSON] Invalid types: ${stats.typeConversions}`);
  console.log(`[VisualJSON] Schema valid: ${valid}`);
  console.log(`[VisualJSON] Repair required: ${!valid}`);
  console.log(`[VisualJSON] Output truncated: ${stats.isTruncated}`);

  if (valid) {
    console.log(`[VisualJSON] ✓ JSON parse successful`);
    console.log(`[VisualJSON] ✓ Schema validation passed`);
    console.log(`[VisualJSON] ✓ Geometry validation passed`);
  }

  return {
    valid,
    extracted: true,
    parsed: true,
    doc: valid ? (doc as VisualDocument) : null,
    errors,
    warnings,
    stats,
  };
}
