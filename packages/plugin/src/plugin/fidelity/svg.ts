/**
 * DesignForge AI — SVG & Vector Fidelity Adapter
 *
 * High priority vector preservation module.
 * Detects SVG elements, parses paths/shapes, converts to Figma vector representations,
 * or cleanly falls back to visual raster rendering without dropping visual content.
 */

import { createVisualFallback } from "./fallback";

export interface SVGConversionOptions {
  nodeName?: string;
  bounds: { x: number; y: number; width: number; height: number };
  svgContent?: string;
}

/**
 * Renders an SVG or vector node preserving all paths, viewBox, fills, strokes, and transforms.
 */
export async function renderSVGNode(
  parent: BaseNode & ChildrenMixin,
  options: SVGConversionOptions
): Promise<SceneNode> {
  const name = options.nodeName || "SVG Vector";
  const svgStr = options.svgContent || "";

  const viewBoxMatch = svgStr.match(/viewBox=["']([^"']*)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "";
  const pathMatches = svgStr.match(/<path[\s/>]/gi) || [];
  const gradientMatches = svgStr.match(/<(linearGradient|radialGradient)[\s/>]/gi) || [];

  const fillMatch = svgStr.match(/fill=["']([^"']*)["']/i);
  const strokeMatch = svgStr.match(/stroke=["']([^"']*)["']/i);
  const strokeWidthMatch = svgStr.match(/stroke-width=["']([^"']*)["']/i);

  const fill = fillMatch ? fillMatch[1] : "none";
  const stroke = strokeMatch ? strokeMatch[1] : "none";
  const strokeWidth = strokeWidthMatch ? strokeWidthMatch[1] : "none";

  // Find all gradient IDs
  const gradIdRegex = /<(linearGradient|radialGradient)[^>]*id=["']([^"']*)["']/gi;
  const gradientIds: string[] = [];
  let m;
  while ((m = gradIdRegex.exec(svgStr)) !== null) {
    if (m[2]) gradientIds.push(m[2]);
  }

  const fillOpacityMatch = svgStr.match(/fill-opacity=["']([^"']*)["']/i);
  const strokeOpacityMatch = svgStr.match(/stroke-opacity=["']([^"']*)["']/i);
  
  const fillOpacity = fillOpacityMatch ? fillOpacityMatch[1] : "1";
  const strokeOpacity = strokeOpacityMatch ? strokeOpacityMatch[1] : "1";
  const gradientVal = gradientIds.length > 0 ? gradientIds.join(", ") : "none";

  console.log(`[SVG]
node: ${name}
fill: ${fill}
fillOpacity: ${fillOpacity}
stroke: ${stroke}
strokeOpacity: ${strokeOpacity}
strokeWidth: ${strokeWidth}
gradient: ${gradientVal}`);

  // Find stop details inside each gradient to log [SVG GRADIENT]
  const gradientBlockRegex = /<(linearGradient|radialGradient)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let gBlock;
  while ((gBlock = gradientBlockRegex.exec(svgStr)) !== null) {
    const type = gBlock[1].toUpperCase();
    const attrs = gBlock[2];
    const inner = gBlock[3];
    
    const idM = attrs.match(/id=["']([^"']*)["']/i);
    const id = idM ? idM[1] : "unknown";

    // Extract stops
    const stopRegex = /<stop[^>]*offset=["']([^"']*)["'][^>]*>/gi;
    const stops: string[] = [];
    const colors: string[] = [];
    const opacities: string[] = [];

    let stopMatch;
    while ((stopMatch = stopRegex.exec(inner)) !== null) {
      const stopHtml = stopMatch[0];
      const offsetAttr = stopMatch[1];
      stops.push(offsetAttr);

      const colAttr = stopHtml.match(/stop-color=["']([^"']*)["']/i);
      colors.push(colAttr ? colAttr[1] : "#000000");

      const opAttr = stopHtml.match(/stop-opacity=["']([^"']*)["']/i);
      opacities.push(opAttr ? opAttr[1] : "1");
    }

    console.log(`[SVG GRADIENT]`);
    console.log(`id: ${id}`);
    console.log(`type: ${type}`);
    console.log(`stops: ${stops.join(", ")}`);
    console.log(`stop colors: ${colors.join(", ")}`);
    console.log(`stop opacity: ${opacities.join(", ")}`);
  }

  console.log(`[SVG] Extracted`);
  console.log(`[SVG] Conversion attempted`);

  if (svgStr && svgStr.trim().length > 0) {
    try {
      // Attempt native Figma vector node creation from SVG string
      const figmaVector = figma.createNodeFromSvg(svgStr);
      figmaVector.name = name;

      // Position & scale according to browser bounds
      figmaVector.x = options.bounds.x;
      figmaVector.y = options.bounds.y;
      
      const bw = Math.max(1, options.bounds.width);
      const bh = Math.max(1, options.bounds.height);

      if (figmaVector.width > 0 && figmaVector.height > 0) {
        figmaVector.resize(bw, bh);
      }

      parent.appendChild(figmaVector);
      console.log(`[SVG] Conversion SUCCESS`);

      const pathCount = pathMatches.length;
      const gradientCount = gradientMatches.length;
      const strokeCount = (svgStr.match(/stroke=/gi) || []).length;
      const fillCount = (svgStr.match(/fill=/gi) || []).length;

      console.log(`[SVG TRACE]
sourceBounds: x=${options.bounds.x} y=${options.bounds.y} w=${options.bounds.width} h=${options.bounds.height}
viewBox: ${viewBox}
pathCount: ${pathCount}
gradientCount: ${gradientCount}
strokeCount: ${strokeCount}
fillCount: ${fillCount}
finalFigmaType: ${figmaVector.type}`);

      // Check if imported vector paths have solid black fill while source has gradient references
      const hasBlackFill = (node: SceneNode): boolean => {
        if ("fills" in node && Array.isArray(node.fills)) {
          for (const f of node.fills) {
            if (f.type === "SOLID" && f.color.r === 0 && f.color.g === 0 && f.color.b === 0) {
              return true;
            }
          }
        }
        if ("children" in node) {
          for (const ch of (node as any).children) {
            if (hasBlackFill(ch)) return true;
          }
        }
        return false;
      };

      if (gradientIds.length > 0 && hasBlackFill(figmaVector)) {
        console.warn(`[SVG WARNING]`);
        console.warn(`Source SVG paint != Figma imported paint`);
      }

      return figmaVector;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.log(`[SVG] Conversion FAILED
reason: ${reason}`);
    }
  } else {
    console.log(`[SVG] Conversion FAILED
reason: No raw svgContent provided`);
  }

  // Fallback to visual representation (never drop content!)
  console.log(`[SVG] Using visual fallback for "${name}"`);
  const fallbackNode = createVisualFallback(parent, {
    reason: `SVG vector parsing failed for ${name}`,
    bounds: options.bounds,
    nodeName: `${name} (SVG Fallback)`,
  });
  console.log(`[SVG] Preserved "${name}" (via Visual Fallback)`);

  const strokeCount = (svgStr.match(/stroke=/gi) || []).length;
  const fillCount = (svgStr.match(/fill=/gi) || []).length;

  console.log(`[SVG TRACE]
sourceBounds: x=${options.bounds.x} y=${options.bounds.y} w=${options.bounds.width} h=${options.bounds.height}
viewBox: ${viewBox}
pathCount: ${pathMatches.length}
gradientCount: ${gradientMatches.length}
strokeCount: ${strokeCount}
fillCount: ${fillCount}
finalFigmaType: ${fallbackNode.type}`);

  return fallbackNode;
}
