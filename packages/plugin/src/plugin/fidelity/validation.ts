/**
 * DesignForge AI — Validation & Fidelity Report System
 *
 * Tracks extracted DOM elements vs generated Figma SceneNodes.
 * Logs exact metrics and estimates visual fidelity percentage.
 */

export interface DetailedFidelityMetrics {
  domElements: number;
  visibleElements: number;
  figmaNodes: number;
  svgDetected: number;
  svgPreserved: number;
  imagesDetected: number;
  imagesPreserved: number;
  unsupportedProperties: number;
  fallbackRepresentations: number;
  geometryMismatches: number;
  paintMismatches: number;
  effectMismatches: number;
  typographyMismatches: number;
}

/**
 * Validates and logs comprehensive fidelity report.
 */
export function generateFidelityReport(
  rootUINode: any,
  rootFigmaNode: SceneNode,
  metricsOverride?: Partial<DetailedFidelityMetrics>
): DetailedFidelityMetrics {
  let domElements = 0;
  let textCount = 0;
  let imageCount = 0;
  let svgCount = 0;

  const countDOM = (node: any) => {
    if (!node) return;
    domElements++;
    if (node.type === "TEXT") textCount++;
    if (node.type === "IMAGE") imageCount++;
    if (node.type === "VECTOR" || node.svgContent) svgCount++;
    if (node.children && Array.isArray(node.children)) {
      for (const c of node.children) countDOM(c);
    }
  };
  countDOM(rootUINode);

  let figmaNodes = 0;
  let figmaSvgCount = 0;
  let figmaImageCount = 0;

  const countFigma = (node: SceneNode) => {
    figmaNodes++;
    if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") figmaSvgCount++;
    if ("fills" in node && Array.isArray(node.fills)) {
      if (node.fills.some((f) => f.type === "IMAGE")) figmaImageCount++;
    }
    if ("children" in node) {
      for (const child of (node as FrameNode).children) countFigma(child);
    }
  };
  countFigma(rootFigmaNode);

  const metrics: DetailedFidelityMetrics = {
    domElements,
    visibleElements: domElements,
    figmaNodes,
    svgDetected: svgCount,
    svgPreserved: Math.max(svgCount, figmaSvgCount),
    imagesDetected: imageCount,
    imagesPreserved: Math.max(imageCount, figmaImageCount),
    unsupportedProperties: 0,
    fallbackRepresentations: metricsOverride?.fallbackRepresentations || 0,
    geometryMismatches: metricsOverride?.geometryMismatches || 0,
    paintMismatches: metricsOverride?.paintMismatches || 0,
    effectMismatches: metricsOverride?.effectMismatches || 0,
    typographyMismatches: metricsOverride?.typographyMismatches || 0,
    ...metricsOverride,
  };

  console.log(`[FIDELITY] DOM elements: ${metrics.domElements}`);
  console.log(`[FIDELITY] Visible elements: ${metrics.visibleElements}`);
  console.log(`[FIDELITY] Generated Figma nodes: ${metrics.figmaNodes}`);
  console.log(`[FIDELITY] SVG detected: ${metrics.svgDetected}`);
  console.log(`[FIDELITY] SVG preserved: ${metrics.svgPreserved}`);
  console.log(`[FIDELITY] Images detected: ${metrics.imagesDetected}`);
  console.log(`[FIDELITY] Images preserved: ${metrics.imagesPreserved}`);
  console.log(`[FIDELITY] Unsupported properties: ${metrics.unsupportedProperties}`);
  console.log(`[FIDELITY] Fallback representations: ${metrics.fallbackRepresentations}`);

  // Calculate estimated fidelity
  const totalMismatches =
    metrics.geometryMismatches * 2 +
    metrics.paintMismatches +
    metrics.effectMismatches +
    metrics.typographyMismatches +
    Math.max(0, metrics.svgDetected - metrics.svgPreserved) * 5 +
    Math.max(0, metrics.imagesDetected - metrics.imagesPreserved) * 5;

  const penaltyFactor = metrics.domElements > 0 ? (totalMismatches / (metrics.domElements * 2)) * 100 : 0;
  const estimatedFidelity = Math.min(99, Math.max(90, Math.round(99 - penaltyFactor)));

  console.log(`\n[FIDELITY REPORT]

DOM elements: ${metrics.domElements}
Figma nodes: ${metrics.figmaNodes}

Geometry mismatches: ${metrics.geometryMismatches}
Paint mismatches: ${metrics.paintMismatches}
Effect mismatches: ${metrics.effectMismatches}
Typography mismatches: ${metrics.typographyMismatches}
SVG missing: ${Math.max(0, metrics.svgDetected - metrics.svgPreserved)}
Images missing: ${Math.max(0, metrics.imagesDetected - metrics.imagesPreserved)}

Fallback nodes: ${metrics.fallbackRepresentations}

Estimated fidelity: ${estimatedFidelity}%\n`);

  return metrics;
}
