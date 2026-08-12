/**
 * DesignForge AI — BASE_RENDER Baseline Logger & Recorder
 *
 * Freezes and records the exact BASE_RENDER output snapshot for 90% renderer validation.
 * Logs root dimensions, layer hierarchy, x/y/width/height, fills, strokes, gradients,
 * effects, typography, and SVG/vector nodes.
 */

export interface BaseRenderSnapshot {
  rootWidth: number;
  rootHeight: number;
  hierarchyCount: number;
  visualNodes: number;
  textNodes: number;
  imageNodes: number;
  svgVectorNodes: number;
  fillsCount: number;
  strokesCount: number;
  gradientsCount: number;
  effectsCount: number;
  typographyCount: number;
}

/**
 * Records and logs the exact BASE_RENDER snapshot of the generated Figma tree.
 */
export function recordBaseRenderBaseline(rootFigmaNode: SceneNode): BaseRenderSnapshot {
  console.log("==================================================");
  console.log(" [BASE_RENDER] FREEZE & BASELINE SNAPSHOT RECORD ");
  console.log("==================================================");

  let hierarchyCount = 0;
  let visualNodes = 0;
  let textNodes = 0;
  let imageNodes = 0;
  let svgVectorNodes = 0;
  let fillsCount = 0;
  let strokesCount = 0;
  let gradientsCount = 0;
  let effectsCount = 0;
  let typographyCount = 0;

  const traverseNode = (node: SceneNode, indent = "") => {
    hierarchyCount++;

    const nx = "x" in node ? Math.round(node.x) : 0;
    const ny = "y" in node ? Math.round(node.y) : 0;
    const nw = "width" in node ? Math.round(node.width) : 0;
    const nh = "height" in node ? Math.round(node.height) : 0;

    let nodeFills: any[] = [];
    if ("fills" in node && Array.isArray(node.fills)) {
      nodeFills = node.fills;
      if (nodeFills.length > 0) fillsCount += nodeFills.length;
      for (const fill of nodeFills) {
        if (fill.type && fill.type.includes("GRADIENT")) gradientsCount++;
      }
    }

    let nodeStrokes: any[] = [];
    if ("strokes" in node && Array.isArray(node.strokes)) {
      nodeStrokes = node.strokes;
      if (nodeStrokes.length > 0) strokesCount += nodeStrokes.length;
    }

    let nodeEffects: any[] = [];
    if ("effects" in node && Array.isArray(node.effects)) {
      nodeEffects = node.effects;
      if (nodeEffects.length > 0) effectsCount += nodeEffects.length;
    }

    let typographyInfo = "none";
    if (node.type === "TEXT") {
      textNodes++;
      typographyCount++;
      const textNode = node as TextNode;
      const fontName = typeof textNode.fontName === "object" ? `${textNode.fontName.family} ${textNode.fontName.style}` : "mixed";
      typographyInfo = `fontSize=${textNode.fontSize}, font=${fontName}, align=${textNode.textAlignHorizontal}`;
    } else if (node.type === "FRAME" || node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "LINE") {
      visualNodes++;
    } else if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "STAR" || node.type === "POLYGON") {
      svgVectorNodes++;
    } else if (node.type === "GROUP") {
      visualNodes++;
    }

    // Log node baseline record
    console.log(`[BASE_RENDER Node]\n  name: "${node.name}"\n  type: ${node.type}\n  bounds: x=${nx}, y=${ny}, w=${nw}, h=${nh}\n  fills: ${nodeFills.length} (${nodeFills.map((f) => f.type).join(", ") || "none"})\n  strokes: ${nodeStrokes.length}\n  effects: ${nodeEffects.length}\n  typography: ${typographyInfo}`);

    if ("children" in node) {
      for (const child of (node as FrameNode).children) {
        traverseNode(child, indent + "  ");
      }
    }
  };

  traverseNode(rootFigmaNode);

  const snapshot: BaseRenderSnapshot = {
    rootWidth: "width" in rootFigmaNode ? Math.round(rootFigmaNode.width) : 1440,
    rootHeight: "height" in rootFigmaNode ? Math.round(rootFigmaNode.height) : 900,
    hierarchyCount,
    visualNodes,
    textNodes,
    imageNodes,
    svgVectorNodes,
    fillsCount,
    strokesCount,
    gradientsCount,
    effectsCount,
    typographyCount,
  };

  console.log(`[BASE_RENDER]
Root Dimensions: ${snapshot.rootWidth}x${snapshot.rootHeight}
Hierarchy Count: ${snapshot.hierarchyCount} nodes
Visual Nodes: ${snapshot.visualNodes}
Text Nodes: ${snapshot.textNodes}
Image Nodes: ${snapshot.imageNodes}
SVG Vector Nodes: ${snapshot.svgVectorNodes}
Fills: ${snapshot.fillsCount}
Strokes: ${snapshot.strokesCount}
Gradients: ${snapshot.gradientsCount}
Effects: ${snapshot.effectsCount}
Typography Nodes: ${snapshot.typographyCount}`);
  console.log("==================================================");

  return snapshot;
}
