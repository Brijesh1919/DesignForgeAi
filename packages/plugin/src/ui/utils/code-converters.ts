/**
 * DesignForge AI — Code Converters
 *
 * Converts extracted HTML & CSS into multiple frontend targets:
 * - HTML + CSS (standard)
 * - React (JSX/TSX with CSS import)
 * - Next.js (Client Component with 'use client')
 * - Vue (Vue 3 Single File Component with scoped styles)
 * - Tailwind (HTML with utility classes)
 * - React + Tailwind (TSX with utility classes, zero external CSS)
 * - JSON (Structured Design Tree)
 */

export type ExportFormat =
  | "html-css"
  | "react"
  | "nextjs"
  | "vue"
  | "tailwind"
  | "react-tailwind"
  | "json";

export interface FormatOption {
  id: ExportFormat;
  label: string;
  badge: string;
  desc: string;
  fileExt: string;
  editorTab: string;
}

export const EXPORT_FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "html-css",
    label: "HTML + CSS",
    badge: "Standard",
    desc: "Semantic HTML5 markup with separate CSS stylesheet",
    fileExt: ".html",
    editorTab: "index.html",
  },
  {
    id: "react",
    label: "React",
    badge: "TSX",
    desc: "React component with TypeScript props & external CSS",
    fileExt: ".tsx",
    editorTab: "Component.tsx",
  },
  {
    id: "nextjs",
    label: "Next.js",
    badge: "App Router",
    desc: "Next.js component with 'use client' & responsive markup",
    fileExt: ".tsx",
    editorTab: "page.tsx",
  },
  {
    id: "vue",
    label: "Vue",
    badge: "SFC",
    desc: "Vue 3 Single File Component with <template>, <script>, <style scoped>",
    fileExt: ".vue",
    editorTab: "Component.vue",
  },
  {
    id: "tailwind",
    label: "Tailwind",
    badge: "HTML + Utility",
    desc: "Clean HTML markup with inline Tailwind CSS utility classes",
    fileExt: ".html",
    editorTab: "index.html",
  },
  {
    id: "react-tailwind",
    label: "React + Tailwind",
    badge: "Popular",
    desc: "React TSX component styled with Tailwind classes (zero external CSS)",
    fileExt: ".tsx",
    editorTab: "Component.tsx",
  },
  {
    id: "json",
    label: "JSON",
    badge: "Design Data",
    desc: "Structured design token & node hierarchy JSON schema",
    fileExt: ".json",
    editorTab: "design.json",
  },
];

export function sanitizeComponentName(name: string): string {
  const clean = name
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return clean && /^[a-zA-Z]/.test(clean) ? clean : `Component${clean || "Design"}`;
}

/**
 * Extracts inner body HTML from a full HTML document if present
 */
export function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1].trim();
  }
  return html.trim();
}

/**
 * Converts standard HTML markup into JSX-compatible syntax
 */
export function htmlToJsx(html: string): string {
  let jsx = extractBodyContent(html);

  // 1. Replace class with className
  jsx = jsx.replace(/\bclass="/g, 'className="');

  // 2. Replace for with htmlFor (labels)
  jsx = jsx.replace(/\bfor="/g, 'htmlFor="');

  // 3. Self-close void HTML tags
  const voidTags = ["img", "input", "br", "hr", "meta", "link", "area", "base", "col", "embed", "param", "source", "track", "wbr"];
  for (const tag of voidTags) {
    const regex = new RegExp(`<(${tag})\\b([^>]*[^/])>`, "gi");
    jsx = jsx.replace(regex, "<$1$2 />");
  }

  // 4. Self-close SVG tags
  const svgVoidTags = ["path", "circle", "rect", "line", "polygon", "polyline", "ellipse", "stop", "use"];
  for (const tag of svgVoidTags) {
    const regex = new RegExp(`<(${tag})\\b([^>]*[^/])>`, "gi");
    jsx = jsx.replace(regex, "<$1$2 />");
  }

  // 5. Convert SVG hyphenated attributes to camelCase
  const svgAttrs: Record<string, string> = {
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-opacity": "strokeOpacity",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "fill-rule": "fillRule",
    "fill-opacity": "fillOpacity",
    "clip-rule": "clipRule",
    "clip-path": "clipPath",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
  };
  for (const [hyphenated, camel] of Object.entries(svgAttrs)) {
    jsx = jsx.split(hyphenated + "=").join(camel + "=");
  }

  // 6. Convert inline HTML comments to JSX comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, "{/* $1 */}");

  return jsx;
}

/**
 * Converts CSS stylesheet into a mapping from class selector -> Tailwind classes
 */
export function parseCssToTailwindMap(css: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!css) return map;

  // Match each selector block: .class-name { ... }
  const ruleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(css)) !== null) {
    const className = match[1];
    const declarationsStr = match[2];
    const declarations: Record<string, string> = {};

    const declPairs = declarationsStr.split(";");
    for (const pair of declPairs) {
      const idx = pair.indexOf(":");
      if (idx !== -1) {
        const prop = pair.substring(0, idx).trim().toLowerCase();
        const val = pair.substring(idx + 1).trim();
        if (prop && val) {
          declarations[prop] = val;
        }
      }
    }

    const twClasses = convertDeclarationsToTailwind(declarations);
    if (twClasses.length > 0) {
      map.set(className, twClasses.join(" "));
    }
  }

  return map;
}

/**
 * Converts CSS declarations of a single rule into an array of Tailwind classes
 */
function convertDeclarationsToTailwind(decl: Record<string, string>): string[] {
  const classes: string[] = [];

  // Display
  if (decl["display"]) {
    const d = decl["display"].toLowerCase();
    if (d === "flex") classes.push("flex");
    else if (d === "inline-flex") classes.push("inline-flex");
    else if (d === "block") classes.push("block");
    else if (d === "inline-block") classes.push("inline-block");
    else if (d === "none") classes.push("hidden");
    else if (d === "grid") classes.push("grid");
  }

  // Flex Direction
  if (decl["flex-direction"]) {
    const fd = decl["flex-direction"].toLowerCase();
    if (fd === "column") classes.push("flex-col");
    else if (fd === "row") classes.push("flex-row");
    else if (fd === "column-reverse") classes.push("flex-col-reverse");
    else if (fd === "row-reverse") classes.push("flex-row-reverse");
  }

  // Align Items
  if (decl["align-items"]) {
    const ai = decl["align-items"].toLowerCase();
    if (ai === "center") classes.push("items-center");
    else if (ai === "flex-start") classes.push("items-start");
    else if (ai === "flex-end") classes.push("items-end");
    else if (ai === "stretch") classes.push("items-stretch");
    else if (ai === "baseline") classes.push("items-baseline");
  }

  // Justify Content
  if (decl["justify-content"]) {
    const jc = decl["justify-content"].toLowerCase();
    if (jc === "center") classes.push("justify-center");
    else if (jc === "flex-start") classes.push("justify-start");
    else if (jc === "flex-end") classes.push("justify-end");
    else if (jc === "space-between") classes.push("justify-between");
    else if (jc === "space-around") classes.push("justify-around");
    else if (jc === "space-evenly") classes.push("justify-evenly");
  }

  // Flex wrap
  if (decl["flex-wrap"]) {
    const fw = decl["flex-wrap"].toLowerCase();
    if (fw === "wrap") classes.push("flex-wrap");
    else if (fw === "nowrap") classes.push("flex-nowrap");
  }

  if (decl["flex-shrink"] === "0") classes.push("shrink-0");
  if (decl["flex-grow"] === "1") classes.push("grow");

  // Position
  if (decl["position"]) {
    const p = decl["position"].toLowerCase();
    if (["relative", "absolute", "fixed", "sticky"].includes(p)) {
      classes.push(p);
    }
  }

  // Insets
  if (decl["top"] !== undefined) classes.push(decl["top"] === "0" || decl["top"] === "0px" ? "top-0" : `top-[${decl["top"]}]`);
  if (decl["left"] !== undefined) classes.push(decl["left"] === "0" || decl["left"] === "0px" ? "left-0" : `left-[${decl["left"]}]`);
  if (decl["right"] !== undefined) classes.push(decl["right"] === "0" || decl["right"] === "0px" ? "right-0" : `right-[${decl["right"]}]`);
  if (decl["bottom"] !== undefined) classes.push(decl["bottom"] === "0" || decl["bottom"] === "0px" ? "bottom-0" : `bottom-[${decl["bottom"]}]`);

  // Dimensions
  if (decl["width"]) {
    const w = decl["width"];
    if (w === "100%") classes.push("w-full");
    else if (w === "auto") classes.push("w-auto");
    else if (w === "100vw") classes.push("w-screen");
    else classes.push(`w-[${w}]`);
  }
  if (decl["max-width"]) {
    const mw = decl["max-width"];
    if (mw === "100%") classes.push("max-w-full");
    else classes.push(`max-w-[${mw}]`);
  }
  if (decl["min-width"]) classes.push(`min-w-[${decl["min-width"]}]`);

  if (decl["height"]) {
    const h = decl["height"];
    if (h === "100%") classes.push("h-full");
    else if (h === "auto") classes.push("h-auto");
    else if (h === "100vh") classes.push("h-screen");
    else classes.push(`h-[${h}]`);
  }
  if (decl["max-height"]) classes.push(`max-h-[${decl["max-height"]}]`);
  if (decl["min-height"]) classes.push(`min-h-[${decl["min-height"]}]`);

  // Gap
  if (decl["gap"]) {
    const g = decl["gap"];
    const pxMatch = g.match(/^(\d+)px$/);
    if (pxMatch) {
      const px = parseInt(pxMatch[1], 10);
      const standard: Record<number, string> = { 0: "gap-0", 4: "gap-1", 8: "gap-2", 12: "gap-3", 16: "gap-4", 20: "gap-5", 24: "gap-6", 32: "gap-8" };
      classes.push(standard[px] || `gap-[${g}]`);
    } else {
      classes.push(`gap-[${g}]`);
    }
  }

  // Padding
  if (decl["padding"]) {
    const p = decl["padding"].trim().split(/\s+/);
    if (p.length === 1) {
      classes.push(`p-[${p[0]}]`);
    } else if (p.length === 2) {
      classes.push(`py-[${p[0]}] px-[${p[1]}]`);
    } else if (p.length === 4) {
      classes.push(`pt-[${p[0]}] pr-[${p[1]}] pb-[${p[2]}] pl-[${p[3]}]`);
    } else {
      classes.push(`p-[${decl["padding"]}]`);
    }
  }
  if (decl["padding-top"]) classes.push(`pt-[${decl["padding-top"]}]`);
  if (decl["padding-right"]) classes.push(`pr-[${decl["padding-right"]}]`);
  if (decl["padding-bottom"]) classes.push(`pb-[${decl["padding-bottom"]}]`);
  if (decl["padding-left"]) classes.push(`pl-[${decl["padding-left"]}]`);

  // Margin
  if (decl["margin"]) {
    const m = decl["margin"].trim();
    if (m === "0 auto" || m === "auto") classes.push("mx-auto");
    else classes.push(`m-[${m}]`);
  }

  // Border Radius
  if (decl["border-radius"]) {
    const r = decl["border-radius"];
    const radiusMap: Record<string, string> = {
      "0": "rounded-none",
      "0px": "rounded-none",
      "2px": "rounded-sm",
      "4px": "rounded",
      "6px": "rounded-md",
      "8px": "rounded-lg",
      "12px": "rounded-xl",
      "16px": "rounded-2xl",
      "24px": "rounded-3xl",
      "9999px": "rounded-full",
      "50%": "rounded-full",
    };
    classes.push(radiusMap[r] || `rounded-[${r}]`);
  }

  // Background Color
  if (decl["background-color"]) {
    const bg = decl["background-color"];
    if (bg.toUpperCase() === "#FFFFFF" || bg.toUpperCase() === "#FFF" || bg === "white") classes.push("bg-white");
    else if (bg.toUpperCase() === "#000000" || bg.toUpperCase() === "#000" || bg === "black") classes.push("bg-black");
    else if (bg === "transparent") classes.push("bg-transparent");
    else classes.push(`bg-[${bg}]`);
  }

  // Text Color
  if (decl["color"]) {
    const c = decl["color"];
    if (c.toUpperCase() === "#FFFFFF" || c.toUpperCase() === "#FFF" || c === "white") classes.push("text-white");
    else if (c.toUpperCase() === "#000000" || c.toUpperCase() === "#000" || c === "black") classes.push("text-black");
    else classes.push(`text-[${c}]`);
  }

  // Typography
  if (decl["font-size"]) {
    const fs = decl["font-size"];
    const fontSizes: Record<string, string> = {
      "12px": "text-xs",
      "14px": "text-sm",
      "16px": "text-base",
      "18px": "text-lg",
      "20px": "text-xl",
      "24px": "text-2xl",
      "30px": "text-3xl",
      "36px": "text-4xl",
    };
    classes.push(fontSizes[fs] || `text-[${fs}]`);
  }

  if (decl["font-weight"]) {
    const fw = decl["font-weight"];
    const weightMap: Record<string, string> = {
      "300": "font-light",
      "400": "font-normal",
      "normal": "font-normal",
      "500": "font-medium",
      "600": "font-semibold",
      "700": "font-bold",
      "bold": "font-bold",
      "800": "font-extrabold",
      "900": "font-black",
    };
    classes.push(weightMap[fw] || `font-[${fw}]`);
  }

  if (decl["text-align"]) {
    const ta = decl["text-align"].toLowerCase();
    if (["left", "center", "right", "justify"].includes(ta)) {
      classes.push(`text-${ta}`);
    }
  }

  if (decl["line-height"]) classes.push(`leading-[${decl["line-height"]}]`);
  if (decl["letter-spacing"] && decl["letter-spacing"] !== "0px" && decl["letter-spacing"] !== "normal") {
    classes.push(`tracking-[${decl["letter-spacing"]}]`);
  }

  // Borders
  if (decl["border"]) {
    classes.push(`border-[${decl["border"]}]`);
  } else if (decl["border-width"] || decl["border-color"]) {
    if (decl["border-width"]) classes.push(`border-[${decl["border-width"]}]`);
    if (decl["border-color"]) classes.push(`border-[${decl["border-color"]}]`);
  }

  // Box shadow
  if (decl["box-shadow"]) {
    classes.push(`shadow-[${decl["box-shadow"].replace(/\s+/g, "_")}]`);
  }

  // Opacity & Overflow
  if (decl["opacity"]) classes.push(`opacity-[${decl["opacity"]}]`);
  if (decl["overflow"] === "hidden") classes.push("overflow-hidden");
  if (decl["overflow-x"] === "hidden") classes.push("overflow-x-hidden");
  if (decl["overflow-y"] === "hidden") classes.push("overflow-y-hidden");

  // Cursor
  if (decl["cursor"] === "pointer") classes.push("cursor-pointer");

  return classes;
}

/**
 * Replaces class names in HTML with Tailwind CSS utility classes
 */
export function htmlToTailwind(html: string, css: string): string {
  const classMap = parseCssToTailwindMap(css);
  let body = extractBodyContent(html);

  // Replace each class="..." attribute with mapped Tailwind classes
  body = body.replace(/class="([^"]+)"/g, (match, classesStr: string) => {
    const classes = classesStr.trim().split(/\s+/);
    const twList: string[] = [];

    for (const c of classes) {
      if (classMap.has(c)) {
        twList.push(classMap.get(c)!);
      } else {
        twList.push(c); // retain if no utility mapped
      }
    }

    const merged = twList.join(" ").replace(/\s+/g, " ").trim();
    return `class="${merged}"`;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-transparent m-0 p-0 antialiased">
${body}
</body>
</html>`;
}

/**
 * Converts HTML + CSS into a React Component
 */
export function htmlToReact(html: string, frameName: string): string {
  const compName = sanitizeComponentName(frameName);
  const jsx = htmlToJsx(html);

  return `import React from 'react';
import './style.css';

export interface ${compName}Props {
  className?: string;
  style?: React.CSSProperties;
}

export const ${compName}: React.FC<${compName}Props> = ({
  className = '',
  style,
}) => {
  return (
${indentText(jsx, "    ")}
  );
};

export default ${compName};
`;
}

/**
 * Converts HTML + CSS into a Next.js Component
 */
export function htmlToNext(html: string, frameName: string): string {
  const compName = sanitizeComponentName(frameName);
  const jsx = htmlToJsx(html);

  return `'use client';

import React from 'react';
import './style.css';

export interface ${compName}Props {
  className?: string;
}

export default function ${compName}({ className = '' }: ${compName}Props) {
  return (
${indentText(jsx, "    ")}
  );
}
`;
}

/**
 * Converts HTML + CSS into a Vue 3 SFC
 */
export function htmlToVue(html: string, css: string, frameName: string): string {
  const compName = sanitizeComponentName(frameName);
  const body = extractBodyContent(html);

  // Clean CSS for scoped block (remove global html/body resets)
  const scopedCss = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\*\s*\{[^}]*\}/g, "")
    .replace(/body\s*\{[^}]*\}/g, "")
    .replace(/img\s*\{[^}]*\}/g, "")
    .trim();

  return `<template>
${indentText(body, "  ")}
</template>

<script setup lang="ts">
/**
 * ${compName} — Exported from Figma via DesignForge AI
 */
defineProps<{
  customClass?: string;
}>();
</script>

<style scoped>
${scopedCss}
</style>
`;
}

/**
 * Converts HTML + CSS into a React Component with Tailwind classes (zero external CSS)
 */
export function htmlToReactTailwind(html: string, css: string, frameName: string): string {
  const compName = sanitizeComponentName(frameName);
  const classMap = parseCssToTailwindMap(css);
  let body = extractBodyContent(html);

  // Replace class="..." with Tailwind classes
  body = body.replace(/class="([^"]+)"/g, (match, classesStr: string) => {
    const classes = classesStr.trim().split(/\s+/);
    const twList: string[] = [];

    for (const c of classes) {
      if (classMap.has(c)) {
        twList.push(classMap.get(c)!);
      } else {
        twList.push(c);
      }
    }

    const merged = twList.join(" ").replace(/\s+/g, " ").trim();
    return `class="${merged}"`;
  });

  const jsx = htmlToJsx(body);

  return `import React from 'react';

export interface ${compName}Props {
  className?: string;
  style?: React.CSSProperties;
}

export const ${compName}: React.FC<${compName}Props> = ({
  className = '',
  style,
}) => {
  return (
${indentText(jsx, "    ")}
  );
};

export default ${compName};
`;
}

function indentText(text: string, indent: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? indent + line : line))
    .join("\n");
}
