/**
 * DesignForge AI — Typography Engine (Additive-Only)
 *
 * Enriches text nodes with typography properties ONLY when the AI
 * did not provide them. Never overwrites AI-provided values.
 *
 * Builds a deduplicated textStyles palette from all text nodes.
 */

import type { UINode, DesignAnalysis, TextStyleToken } from "@designforge/shared";

/**
 * Normalizes font family declarations with standard web fallbacks.
 */
export function normalizeFontFamily(family?: string): string {
  if (!family) return "Inter";

  const clean = family.trim().toLowerCase();
  if (clean.includes("roboto")) return "Roboto";
  if (clean.includes("mono") || clean.includes("jetbrains")) return "JetBrains Mono";
  if (clean.includes("segoe") || clean.includes("arial") || clean.includes("helvetica")) return "Inter";

  return family;
}

/**
 * Estimates font size from node bounds height and semantic role.
 * Only used when the AI did not provide a fontSize.
 */
function estimateFontSize(height: number, role: string): number {
  if (role === "heading" || role === "title") {
    if (height >= 48) return 36;
    if (height >= 36) return 28;
    if (height >= 28) return 24;
    return 20;
  }
  if (role === "button" || role === "nav-link") {
    return height >= 40 ? 16 : 14;
  }
  if (height >= 24) return 16;
  if (height >= 18) return 14;
  return 12;
}

/**
 * Estimates font weight from semantic role.
 * Only used when the AI did not provide a fontWeight.
 */
function estimateFontWeight(role: string): TextStyleToken["fontWeight"] {
  if (role === "heading" || role === "title") return "Bold";
  if (role === "button" || role === "nav-link") return "SemiBold";
  if (role === "label") return "Medium";
  return "Regular";
}

/**
 * Additive typography enrichment and style palette extraction.
 */
export function extractTypography(analysis: DesignAnalysis): DesignAnalysis {
  const result = { ...analysis };
  const discoveredStyles: TextStyleToken[] = [];

  function processNode(node: UINode) {
    if (node.type === "TEXT") {
      const role = node.role || "body";
      const h = node.bounds.height;

      if (!node.text) {
        // AI provided no text properties at all — create defaults
        node.text = {
          content: "",
          fontFamily: "Inter",
          fontWeight: estimateFontWeight(role),
          fontSize: estimateFontSize(h, role),
          lineHeight: Math.round(estimateFontSize(h, role) * 1.4),
          letterSpacing: 0,
          textAlign: "LEFT",
          textCase: "ORIGINAL",
          textDecoration: "NONE",
          color: "#000000",
          opacity: 1,
        };
      } else {
        // Fill in ONLY missing properties — never overwrite AI values
        node.text.fontFamily = normalizeFontFamily(node.text.fontFamily) || "Inter";

        if (!node.text.fontWeight) {
          node.text.fontWeight = estimateFontWeight(role);
        }
        if (!node.text.fontSize || node.text.fontSize <= 0) {
          node.text.fontSize = estimateFontSize(h, role);
        }
        if (!node.text.lineHeight || node.text.lineHeight <= 0) {
          node.text.lineHeight = Math.round(node.text.fontSize * 1.4);
        }
        if (!node.text.letterSpacing && node.text.letterSpacing !== 0) {
          node.text.letterSpacing = 0;
        }
        if (!node.text.textAlign) {
          node.text.textAlign = "LEFT";
        }
        if (!node.text.color) {
          node.text.color = "#000000";
        }
      }

      // Collect for palette
      discoveredStyles.push({
        name: `${role}-${node.text.fontSize}`,
        fontFamily: node.text.fontFamily || "Inter",
        fontWeight: node.text.fontWeight || "Regular",
        fontSize: node.text.fontSize,
        lineHeight: node.text.lineHeight,
        letterSpacing: node.text.letterSpacing || 0,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        processNode(child);
      }
    }
  }

  processNode(result.rootFrame);

  // Deduplicate styles
  const uniqueStyles: TextStyleToken[] = [];
  for (const style of discoveredStyles) {
    const isDuplicate = uniqueStyles.some(
      (existing) =>
        existing.fontSize === style.fontSize &&
        existing.fontWeight === style.fontWeight
    );
    if (!isDuplicate) {
      uniqueStyles.push(style);
    }
  }

  // Sort and assign semantic names
  result.textStyles = uniqueStyles
    .sort((a, b) => b.fontSize - a.fontSize)
    .map((style) => {
      let prefix = "Body";
      if (style.fontSize >= 36) prefix = "Display";
      else if (style.fontSize >= 28) prefix = "Heading 1";
      else if (style.fontSize >= 22) prefix = "Heading 2";
      else if (style.fontSize >= 18) prefix = "Heading 3";
      else if (style.fontSize <= 12) prefix = "Caption";

      return { ...style, name: `${prefix}/${style.fontWeight}` };
    });

  console.log(`[Typography Engine] Enriched text nodes. ${result.textStyles.length} unique styles.`);
  return result;
}
