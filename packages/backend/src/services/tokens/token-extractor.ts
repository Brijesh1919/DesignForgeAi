/**
 * DesignForge AI — Token Extractor (Additive-Only)
 *
 * Extracts color tokens from the node tree and supplements them
 * with pixel-sampled colors from the source image.
 *
 * RULE: Never overwrite fills/colors that the AI already provided.
 * Only fill in EMPTY values via pixel sampling.
 */

import type { UINode, DesignAnalysis, ColorToken } from "@designforge/shared";
import sharp from "sharp";

/**
 * Deduplicates colors by merging similar hex values.
 */
function clusterColors(tokens: ColorToken[]): ColorToken[] {
  const unique: ColorToken[] = [];

  for (const token of tokens) {
    const isDuplicate = unique.some(
      (existing) =>
        colorDistance(existing.value, token.value) < 15 &&
        existing.category === token.category
    );

    if (!isDuplicate) {
      unique.push(token);
    }
  }

  return unique;
}

/**
 * Calculate Euclidean color distance in RGB space.
 */
function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);

  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Main token extraction service. Additive-only: never overwrites AI-provided values.
 */
export async function extractTokens(
  analysis: DesignAnalysis,
  imageBuffer?: Buffer
): Promise<DesignAnalysis> {
  const result = { ...analysis };
  const discoveredColors: ColorToken[] = [];
  const colorSet = new Set<string>();

  function addDiscoveredColor(hex: string, category: ColorToken["category"]) {
    const upper = hex.toUpperCase();
    if (colorSet.has(upper)) return;
    colorSet.add(upper);
    discoveredColors.push({
      name: `${category}-${discoveredColors.length + 1}`,
      value: upper,
      category,
    });
  }

  // 1. Harvest colors already provided by the AI
  function harvestExistingColors(node: UINode) {
    // Collect fills
    for (const fill of node.style.fills) {
      if (fill.type === "SOLID") {
        addDiscoveredColor(fill.color, "surface");
      }
    }
    // Collect strokes
    for (const stroke of node.style.strokes) {
      addDiscoveredColor(stroke.color, "border");
    }
    // Collect text colors
    if (node.text?.color) {
      addDiscoveredColor(node.text.color, "text");
    }

    if (node.children) {
      for (const child of node.children) {
        harvestExistingColors(child);
      }
    }
  }

  harvestExistingColors(result.rootFrame);

  // 2. Only pixel-sample for nodes with EMPTY fills/colors
  if (imageBuffer) {
    try {
      const { data, info } = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });

      function getPixelColor(x: number, y: number): string {
        const clampedX = Math.max(0, Math.min(Math.round(x), info.width - 1));
        const clampedY = Math.max(0, Math.min(Math.round(y), info.height - 1));
        const idx = (clampedY * info.width + clampedX) * info.channels;
        const r = data[idx]!;
        const g = data[idx + 1]!;
        const b = data[idx + 2]!;
        return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
      }

      function enrichMissingColors(node: UINode, parentGlobalX: number, parentGlobalY: number) {
        const globalX = parentGlobalX + node.bounds.x;
        const globalY = parentGlobalY + node.bounds.y;
        const w = node.bounds.width;
        const h = node.bounds.height;

        if (node.type === "TEXT") {
          // Only fill color if AI didn't provide it
          if (!node.text?.color || node.text.color === "#000000") {
            const samples: string[] = [];
            const stepX = Math.max(1, w / 4);
            const stepY = Math.max(1, h / 4);
            for (let ix = 0; ix < 5; ix++) {
              for (let iy = 0; iy < 5; iy++) {
                samples.push(getPixelColor(globalX + ix * stepX, globalY + iy * stepY));
              }
            }
            const colorCounts: Record<string, number> = {};
            for (const c of samples) {
              colorCounts[c] = (colorCounts[c] || 0) + 1;
            }
            let textColor = "#000000";
            let maxCount = 0;
            for (const [color, count] of Object.entries(colorCounts)) {
              if (count > maxCount) {
                maxCount = count;
                textColor = color;
              }
            }
            if (node.text) {
              node.text.color = textColor;
            }
            addDiscoveredColor(textColor, "text");
          }
        } else {
          // Only fill background if AI left fills empty
          if (!node.style.fills || node.style.fills.length === 0) {
            const samplePoints = [
              getPixelColor(globalX + 2, globalY + 2),
              getPixelColor(globalX + w - 3, globalY + 2),
              getPixelColor(globalX + 2, globalY + h - 3),
              getPixelColor(globalX + w - 3, globalY + h - 3),
              getPixelColor(globalX + w / 2, globalY + h / 2),
            ];
            const counts: Record<string, number> = {};
            for (const c of samplePoints) {
              counts[c] = (counts[c] || 0) + 1;
            }
            let dominantColor = samplePoints[0]!;
            let maxCount = 0;
            for (const [color, count] of Object.entries(counts)) {
              if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
              }
            }
            // Only assign if it's not pure white (likely just background)
            if (dominantColor !== "#FFFFFF" && dominantColor !== "#FEFEFE") {
              node.style.fills = [{ type: "SOLID", color: dominantColor, opacity: 1 }];
              addDiscoveredColor(dominantColor, "surface");
            }
          }
        }

        if (node.children) {
          for (const child of node.children) {
            enrichMissingColors(child, globalX, globalY);
          }
        }
      }

      enrichMissingColors(result.rootFrame, 0, 0);
      console.log(`[Token Extractor] Pixel-sampled missing colors. Total discovered: ${discoveredColors.length}`);
    } catch (err) {
      console.error(`[Token Extractor] Error sampling pixels: ${err}`);
    }
  }

  // Cluster and assign tokens
  const clustered = clusterColors(discoveredColors);
  result.colorTokens = clustered.map((token, index) => ({
    ...token,
    name: `${token.category}-${index + 1}`,
  }));

  // Preserve scales
  result.spacingScale = [...new Set(result.spacingScale)].sort((a, b) => a - b);
  result.radiusScale = [...new Set(result.radiusScale)].sort((a, b) => a - b);

  return result;
}
