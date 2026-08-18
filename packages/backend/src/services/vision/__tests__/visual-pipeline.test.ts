/**
 * DesignForge AI — Visual JSON Pipeline & High-Fidelity Tests
 *
 * Tests for the Visual JSON → Deterministic HTML/CSS pipeline & Fidelity Validation.
 * Runs with: npx tsx src/services/vision/__tests__/visual-pipeline.test.ts
 */

import { validateVisualJson } from "../VisualJsonValidator.js";
import { generateHtmlCssFromVisualDocument, validateGeneratedOutput, getIconSvg } from "../HtmlCssGenerator.js";
import { validateFidelity } from "../../validation/FidelityValidator.js";
import type { VisualDocument } from "../VisualSchema.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function expect(value: unknown) {
  return {
    toBe(expected: unknown) {
      if (value !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
    },
    toBeTrue() {
      if (value !== true) throw new Error(`Expected true, got ${JSON.stringify(value)}`);
    },
    toBeFalse() {
      if (value !== false) throw new Error(`Expected false, got ${JSON.stringify(value)}`);
    },
    toContain(substr: string) {
      if (typeof value !== "string") throw new Error(`Expected string to contain "${substr}", but value is not a string`);
      if (!value.includes(substr)) throw new Error(`Expected "${value.slice(0, 100)}" to contain "${substr}"`);
    },
    toNotContain(substr: string) {
      if (typeof value === "string" && value.includes(substr)) {
        throw new Error(`Expected "${value.slice(0, 100)}" NOT to contain "${substr}"`);
      }
    },
    toBeGreaterThan(n: number) {
      if (typeof value !== "number" || value <= n) throw new Error(`Expected ${value} > ${n}`);
    },
    toEqual(expected: unknown) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
  };
}

test("getIconSvg does not invent a star icon for unknown icons", () => {
  const unknownSvg = getIconSvg("unknown", "#FFFFFF", 16);
  expect(unknownSvg).toNotContain("polygon");
  expect(unknownSvg).toContain("<svg");
});

test("getIconSvg returns specific vector SVGs for recognized icon types", () => {
  const dashSvg = getIconSvg("dashboard", "#FFFFFF", 16);
  expect(dashSvg).toContain("<rect");

  const userSvg = getIconSvg("users", "#FFFFFF", 16);
  expect(userSvg).toContain("<circle");

  const chevronSvg = getIconSvg("chevron-right", "#FFFFFF", 16);
  expect(chevronSvg).toContain("<polyline");
});

test("Menu item with active state generates .active styling", () => {
  const docWithActive: VisualDocument = {
    viewport: { width: 247, height: 613 },
    global: { background: "#1E1E2D" },
    elements: [
      {
        type: "menu-item",
        text: "Dashboard",
        x: 12, y: 80, width: 223, height: 40,
        state: "active",
        color: "#DC3545",
        background: "#2A1F2D",
        fontWeight: 600,
        iconType: "dashboard"
      }
    ]
  };
  const result = generateHtmlCssFromVisualDocument(docWithActive);
  expect(result.html).toContain("active");
  expect(result.html).toContain("Dashboard");
  expect(result.css).toContain(".active");
  expect(result.css).toContain("#DC3545");
});

// ── VisualJsonValidator Tests ─────────────────────────────────

console.log("\n[Test Group] VisualJsonValidator\n");

test("Valid minimal document passes validation", () => {
  const doc = JSON.stringify({
    viewport: { width: 375, height: 812 },
    elements: [
      { type: "container", x: 0, y: 0, width: 375, height: 812, background: "#FFFFFF" }
    ]
  });
  const result = validateVisualJson(doc);
  expect(result.valid).toBeTrue();
  expect(result.doc).toBe(result.doc);
  expect(result.errors.length).toBe(0);
});

test("Valid document with nested visual hierarchy passes validation", () => {
  const doc = JSON.stringify({
    viewport: { width: 375, height: 812 },
    global: { background: "#1A1A2E", color: "#FFFFFF" },
    elements: [
      {
        type: "sidebar", x: 0, y: 0, width: 240, height: 812, background: "#2D2D44",
        children: [
          { type: "heading", text: "Dashboard", x: 16, y: 20, width: 200, height: 24, color: "#FFFFFF", fontSize: 20, fontWeight: 700 },
          { type: "menu-item", text: "User Management", x: 16, y: 60, width: 200, height: 40, fontSize: 14, fontWeight: 400 },
          { type: "menu-item", text: "Marketing Tools", x: 16, y: 110, width: 200, height: 40, fontSize: 14, fontWeight: 400 },
        ]
      },
      { type: "button", x: 260, y: 80, width: 100, height: 40, background: "#6366F1", borderRadius: 8, text: "Action" }
    ]
  });
  const result = validateVisualJson(doc);
  expect(result.valid).toBeTrue();
  expect(result.stats.totalElements).toBeGreaterThan(1);
  expect(result.stats.textElements).toBeGreaterThan(0);
});

test("Missing viewport fails validation", () => {
  const doc = JSON.stringify({
    elements: [{ type: "container", x: 0, y: 0, width: 100, height: 100 }]
  });
  const result = validateVisualJson(doc);
  expect(result.valid).toBeFalse();
  expect(result.errors.some(e => e.includes("viewport"))).toBeTrue();
});

test("Empty elements array fails validation", () => {
  const doc = JSON.stringify({
    viewport: { width: 375, height: 812 },
    elements: []
  });
  const result = validateVisualJson(doc);
  expect(result.valid).toBeFalse();
  expect(result.errors.some(e => e.includes("empty"))).toBeTrue();
});

test("HTML tag types (div, section, p, h1, img) are normalized to valid schema types", () => {
  const doc = JSON.stringify({
    canvas: { width: 1440, height: 2594 },
    elements: [
      {
        type: "div",
        x: 0, y: 0, width: 1440, height: 600,
        children: [
          { type: "section", x: 0, y: 0, width: 1440, height: 300, children: [
            { type: "h1", text: "Welcome to Platform", x: 100, y: 50, width: 800, height: 60 },
            { type: "p", text: "The fastest way to build", x: 100, y: 120, width: 600, height: 30 },
            { type: "img", x: 100, y: 160, width: 200, height: 100 }
          ]}
        ]
      }
    ]
  });
  const result = validateVisualJson(doc);
  expect(result.valid).toBeTrue();
  expect(result.stats.typeConversions).toBeGreaterThan(0);
  expect(result.stats.totalElements).toBe(5);
  expect(result.doc?.elements[0]?.type).toBe("container");
  expect(result.doc?.elements[0]?.children?.[0]?.type).toBe("section");
  expect(result.doc?.elements[0]?.children?.[0]?.children?.[0]?.type).toBe("heading");
  expect(result.doc?.elements[0]?.children?.[0]?.children?.[1]?.type).toBe("paragraph");
  expect(result.doc?.elements[0]?.children?.[0]?.children?.[2]?.type).toBe("image");
});

test("Markdown-fenced JSON with surrounding text is stripped and parsed", () => {
  const raw = 'Here is the analysis:\n```json\n' + JSON.stringify({
    canvas: { width: 375, height: 812 },
    elements: [{ type: "text", text: "Hello", x: 0, y: 0, width: 100, height: 20 }]
  }) + '\n```\nHope this helps!';
  const result = validateVisualJson(raw);
  expect(result.valid).toBeTrue();
  expect(result.extracted).toBeTrue();
  expect(result.parsed).toBeTrue();
  expect(result.stats.totalElements).toBe(1);
});

test("JSON with trailing commas and comments parses successfully", () => {
  const raw = `
  // Screenshot layout
  {
    "canvas": { "width": 375, "height": 812, },
    "elements": [
      { "type": "text", "text": "Dashboard", "x": 10, "y": 10, "width": 100, "height": 30, /* heading */ },
    ],
  }`;
  const result = validateVisualJson(raw);
  expect(result.valid).toBeTrue();
  expect(result.stats.totalElements).toBe(1);
});

test("Mid-stream truncated JSON (e.g. token limit at position 13350) is progressively repaired", () => {
  const truncatedRaw = `{
    "canvas": { "width": 249, "height": 716 },
    "elements": [
      { "type": "container", "x": 0, "y": 0, "width": 249, "height": 60 },
      { "type": "text", "text": "Profile", "x": 16, "y": 20, "width": 100, "height": 20 },
      { "type": "menu-item", "text": "Settings", "x": 16, "y": 80, "width": 200, "height": 40 },
      { "type": "menu-item", "text": "Notifications", "x": 16, "y": 130, "width": 200, "height": 40
  `; // Mid-object truncation right here!
  const result = validateVisualJson(truncatedRaw, 249, 716);
  expect(result.valid).toBeTrue();
  expect(result.stats.totalElements).toBe(3); // Extracted 3 complete elements
});

test("Empty elements array is rejected (Elements detected: 0)", () => {
  const raw = JSON.stringify({
    canvas: { width: 375, height: 812 },
    elements: []
  });
  const result = validateVisualJson(raw);
  expect(result.valid).toBeFalse();
  expect(result.stats.totalElements).toBe(0);
});

// ── HtmlCssGenerator Tests ────────────────────────────────────

console.log("\n[Test Group] HtmlCssGenerator High-Fidelity\n");

const sampleDoc: VisualDocument = {
  viewport: { width: 375, height: 812 },
  global: { background: "#1A1A2E", color: "#FFFFFF", layoutDirection: "column" },
  elements: [
    {
      type: "sidebar",
      x: 0, y: 0, width: 240, height: 812,
      background: "#2D2D44",
      children: [
        { type: "heading", text: "DesignForge", x: 16, y: 20, width: 180, height: 28, color: "#FFFFFF", fontSize: 22, fontWeight: 700 },
        { type: "icon", x: 16, y: 60, width: 20, height: 20, isIcon: true, iconName: "search", color: "#AAAAAA" },
        { type: "menu-item", text: "Dashboard", x: 44, y: 60, width: 160, height: 20, color: "#E0E0E0", fontSize: 14, fontWeight: 400 },
        { type: "menu-item", text: "User Management", x: 44, y: 95, width: 160, height: 20, color: "#AAAAAA", fontSize: 14, fontWeight: 400 },
      ]
    },
    {
      type: "header",
      x: 240, y: 0, width: 135, height: 64,
      background: "#1F1F35",
      children: [
        { type: "text", text: "Overview", x: 16, y: 20, width: 100, height: 24, color: "#FFFFFF", fontSize: 16, fontWeight: 600 },
      ]
    },
    {
      type: "card",
      x: 250, y: 80, width: 115, height: 100,
      background: "#2D2D44",
      borderRadius: 8,
      children: [
        { type: "heading", text: "Revenue", x: 12, y: 12, width: 90, height: 16, color: "#AAAAAA", fontSize: 12, fontWeight: 600 },
        { type: "text", text: "$42.5k", x: 12, y: 36, width: 90, height: 24, color: "#6366F1", fontSize: 20, fontWeight: 700 },
      ]
    },
  ]
};

test("HTML contains semantic <aside> for sidebar", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  expect(result.html).toContain("<aside");
});

test("HTML contains semantic <header>", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  expect(result.html).toContain("<header");
});

test("HTML contains vector SVG icon element", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  expect(result.html).toContain("<svg");
});

test("HTML contains distinct heading and text elements", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  expect(result.html).toContain("<h1");
  expect(result.html).toContain("DesignForge");
  expect(result.html).toContain("User Management");
  expect(result.html).toContain("$42.5k");
});

test("CSS contains distinct font sizes per text level (Rule 4)", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  expect(result.css).toContain("font-size: 22px");
  expect(result.css).toContain("font-size: 14px");
  expect(result.css).toContain("font-size: 20px");
});

test("CSS root contains NO overflow: hidden (Rule 6)", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  expect(/\.design-root\s*{[^}]*overflow\s*:\s*hidden/i.test(result.css)).toBeFalse();
});

test("Landing page generates multi-section layout with TWO_COLUMN hero and THREE_COLUMN cards", () => {
  const landingDoc: VisualDocument = {
    canvas: { width: 1440, height: 2594, background: "#0F172A" },
    elements: [
      {
        id: "nav",
        type: "navbar",
        bbox: { x: 0, y: 0, width: 1440, height: 72 },
        layout: "ROW",
        background: "#1E293B",
        children: [
          { type: "logo", text: "Acme Corp", bbox: { x: 32, y: 20, width: 120, height: 32 }, fontSize: 20, fontWeight: 700, color: "#FFFFFF" },
          { type: "navigation", bbox: { x: 400, y: 24, width: 400, height: 24 }, layout: "ROW", children: [
            { type: "link", text: "Features", bbox: { x: 400, y: 24, width: 80, height: 24 }, color: "#94A3B8" },
            { type: "link", text: "Pricing", bbox: { x: 500, y: 24, width: 80, height: 24 }, color: "#94A3B8" },
          ]},
          { type: "button", text: "Get Started", bbox: { x: 1280, y: 16, width: 128, height: 40 }, background: "#3B82F6", color: "#FFFFFF", borderRadius: 6 }
        ]
      },
      {
        id: "hero",
        type: "section",
        bbox: { x: 0, y: 72, width: 1440, height: 600 },
        layout: "TWO_COLUMN",
        children: [
          {
            type: "container",
            layout: "COLUMN",
            bbox: { x: 32, y: 120, width: 640, height: 400 },
            children: [
              { type: "heading", text: "Next-Gen AI Platform", bbox: { x: 32, y: 120, width: 600, height: 100 }, fontSize: 48, fontWeight: 800, color: "#FFFFFF", letterSpacing: -1 },
              { type: "paragraph", text: "Build and scale faster than ever.", bbox: { x: 32, y: 230, width: 500, height: 40 }, fontSize: 18, color: "#94A3B8" }
            ]
          },
          {
            type: "image",
            bbox: { x: 720, y: 100, width: 680, height: 440 },
            objectFit: "cover"
          }
        ]
      },
      {
        id: "features",
        type: "section",
        bbox: { x: 0, y: 672, width: 1440, height: 500 },
        layout: "THREE_COLUMN",
        children: [
          { type: "card", bbox: { x: 32, y: 700, width: 420, height: 280 }, background: "#1E293B", borderRadius: 12, children: [
            { type: "heading", text: "Speed", bbox: { x: 56, y: 724, width: 372, height: 28 }, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }
          ]},
          { type: "card", bbox: { x: 510, y: 700, width: 420, height: 280 }, background: "#1E293B", borderRadius: 12, children: [
            { type: "heading", text: "Security", bbox: { x: 534, y: 724, width: 372, height: 28 }, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }
          ]},
          { type: "card", bbox: { x: 988, y: 700, width: 420, height: 280 }, background: "#1E293B", borderRadius: 12, children: [
            { type: "heading", text: "Scale", bbox: { x: 1012, y: 724, width: 372, height: 28 }, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }
          ]},
        ]
      }
    ]
  };

  const result = generateHtmlCssFromVisualDocument(landingDoc);
  expect(result.html).toContain("<nav");
  expect(result.html).toContain("<section");
  expect(result.html).toContain("Next-Gen AI Platform");
  expect(result.html).toContain("Speed");
  expect(result.html).toContain("Security");
  expect(result.html).toContain("Scale");
  expect(result.css).toContain("grid-template-columns: 1fr 1fr");
  expect(result.css).toContain("grid-template-columns: repeat(3, 1fr)");
  expect(result.css).toContain("font-size: 48px");
});

test("Generated CSS contains NO recursive selectors", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  const recursiveRegex = /\.([a-zA-Z0-9_-]+)(?:\s+\.\1)+/g;
  expect(recursiveRegex.test(result.css)).toBeFalse();
});

test("Generated CSS contains NO duplicate selectors", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  const selectorMatches = result.css.match(/^\.[\w-]+ \{/gm) || [];
  const counts: Record<string, number> = {};
  for (const sel of selectorMatches) {
    counts[sel] = (counts[sel] || 0) + 1;
  }
  const duplicates = Object.entries(counts).filter(([, v]) => v > 1).map(([k]) => k);
  expect(duplicates.length).toBe(0);
});

// ── FidelityValidator & Rule 23 Contract Tests ───────────────

console.log("\n[Test Group] FidelityValidator & Rule 23 Contract\n");

test("validateGeneratedOutput passes for valid high-fidelity document", () => {
  const result = generateHtmlCssFromVisualDocument(sampleDoc);
  const errors = validateGeneratedOutput(result.html, result.css, {
    elementCount: result.elementCount,
    textNodeCount: result.textNodeCount,
  });
  expect(errors.length).toBe(0);
});

test("FidelityValidator generates complete metadata and fidelity reports", () => {
  const generated = generateHtmlCssFromVisualDocument(sampleDoc);
  const validation = validateFidelity(sampleDoc, generated);

  expect(validation.passed).toBeTrue();
  expect(validation.metadata.width).toBe(375);
  expect(validation.metadata.height).toBe(812);
  expect(validation.metadata.textCount).toBeGreaterThan(0);
  expect(validation.metadata.sectionCount).toBeGreaterThan(0);
  expect(validation.fidelity.contentComplete).toBeTrue();
  expect(validation.fidelity.geometryValidated).toBeTrue();
  expect(validation.fidelity.renderValidated).toBeTrue();
  expect(validation.fidelity.missingElements.length).toBe(0);
});

// ── Summary ───────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
