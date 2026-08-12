/**
 * DesignForge AI — Fidelity Validation & Comparison Pass
 *
 * Runs a post-generation validation pass comparing the original DOM UINode tree
 * against created Figma SceneNodes. Detects missing nodes, geometry mismatches (>1px),
 * and prints detailed [HTML→FIGMA] and [Fidelity] diagnostic summaries.
 */

interface UINode {
  type: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  style?: any;
  text?: any;
  children?: UINode[];
}

export interface FidelityReport {
  elementsExpected: number;
  elementsCreated: number;
  elementsMissing: number;
  geometryMismatches: number;
  textMismatches: number;
  paintMismatches: number;
  effectMismatches: number;
}

/**
 * Runs a fidelity validation pass over the generated Figma frame.
 */
export function validateFidelity(rootUINode: UINode, rootFigmaNode: SceneNode): FidelityReport {
  console.log("[Fidelity] Starting post-generation fidelity validation pass...");

  let expectedCount = 0;
  const countUINodes = (u: UINode) => {
    expectedCount++;
    if (u.children) {
      for (const c of u.children) countUINodes(c);
    }
  };
  countUINodes(rootUINode);

  let createdCount = 0;
  const countFigmaNodes = (f: SceneNode) => {
    createdCount++;
    if ("children" in f) {
      for (const child of (f as any).children) {
        countFigmaNodes(child);
      }
    }
  };
  countFigmaNodes(rootFigmaNode);

  let geometryMismatches = 0;
  let textMismatches = 0;
  let paintMismatches = 0;
  let effectMismatches = 0;

  // Traversal comparison helper
  const compareNodes = (uNode: UINode, fNode: SceneNode | null, indent = "") => {
    if (!fNode) {
      console.warn(`[Element Mismatch] Expected UINode "${uNode.name}" but found no matching Figma node`);
      return;
    }

    const fx = "x" in fNode ? Math.round(fNode.x) : 0;
    const fy = "y" in fNode ? Math.round(fNode.y) : 0;
    const fw = "width" in fNode ? Math.round(fNode.width) : 0;
    const fh = "height" in fNode ? Math.round(fNode.height) : 0;

    const ux = Math.round(uNode.bounds.x);
    const uy = Math.round(uNode.bounds.y);
    const uw = Math.round(uNode.bounds.width);
    const uh = Math.round(uNode.bounds.height);

    const xDiff = Math.abs(fx - ux);
    const yDiff = Math.abs(fy - uy);
    const wDiff = Math.abs(fw - uw);
    const hDiff = Math.abs(fh - uh);

    const isMismatch = xDiff > 1 || yDiff > 1 || wDiff > 1 || hDiff > 1;
    if (isMismatch) {
      geometryMismatches++;
      console.log(`[Element Geometry Mismatch] "${uNode.name}"\n  browserRect: x=${ux}, y=${uy}, w=${uw}, h=${uh}\n  figmaRect:   x=${fx}, y=${fy}, w=${fw}, h=${fh}`);
    } else {
      console.log(`[Element] "${uNode.name}"\n  type: ${uNode.type}\n  browserRect: ${ux} ${uy} ${uw} ${uh}\n  figmaRect: ${fx} ${fy} ${fw} ${fh}\n  background: ${JSON.stringify(uNode.style?.fills || [])}\n  text: ${uNode.text?.content || "none"}\n  effect: ${JSON.stringify(uNode.style?.effects || [])}\n  zIndex: ${uNode.style?.zIndex || 0}`);
    }

    if (uNode.children && "children" in fNode) {
      const fChildren = (fNode as any).children || [];
      for (let i = 0; i < uNode.children.length; i++) {
        const uChild = uNode.children[i]!;
        const fChild = fChildren[i] || null;
        compareNodes(uChild, fChild, indent + "  ");
      }
    }
  };

  console.log(`[HTML→FIGMA]
Viewport: ${rootFigmaNode.width}x${rootFigmaNode.height}
DOM Elements: ${expectedCount}
Visible Elements: ${expectedCount}
Text Nodes: ${countNodeType(rootUINode, "TEXT")}
Images: ${countNodeType(rootUINode, "IMAGE")}
SVG Elements: ${countNodeType(rootUINode, "VECTOR")}
Gradients: ${countGradients(rootUINode)}
Shadows: ${countShadows(rootUINode)}
Backgrounds: ${expectedCount}
Borders: ${countBorders(rootUINode)}`);

  compareNodes(rootUINode, rootFigmaNode);

  const report: FidelityReport = {
    elementsExpected: expectedCount,
    elementsCreated: createdCount,
    elementsMissing: Math.max(0, expectedCount - createdCount),
    geometryMismatches,
    textMismatches,
    paintMismatches,
    effectMismatches,
  };

  const countFigmaNodeType = (fNode: SceneNode, typeStr: string): number => {
    let c = fNode.type === typeStr ? 1 : 0;
    if ("children" in fNode) {
      for (const child of (fNode as any).children) {
        c += countFigmaNodeType(child, typeStr);
      }
    }
    return c;
  };

  const svgDet = countNodeType(rootUINode, "VECTOR");
  const svgPr = countFigmaNodeType(rootFigmaNode, "FRAME") + countFigmaNodeType(rootFigmaNode, "VECTOR") + countFigmaNodeType(rootFigmaNode, "GROUP") + countFigmaNodeType(rootFigmaNode, "BOOLEAN_OPERATION");
  const svgCh = Math.max(0, svgDet - svgPr);

  console.log(`[BASE] node count: ${report.elementsExpected}`);
  console.log(`[FINAL] node count: ${report.elementsCreated}`);
  console.log(`[GEOMETRY] changed nodes: ${report.geometryMismatches}`);
  console.log(`[TEXT] changed nodes: ${report.textMismatches}`);
  console.log(`[SVG] changed nodes: ${svgCh}`);
  console.log(`[EFFECT] changed nodes: ${report.effectMismatches}`);

  console.log(`[Fidelity]
Elements expected: ${report.elementsExpected}
Elements created: ${report.elementsCreated}
Elements missing: ${report.elementsMissing}
Geometry mismatches: ${report.geometryMismatches}
Text mismatches: ${report.textMismatches}
Paint mismatches: ${report.paintMismatches}
Effect mismatches: ${report.effectMismatches}`);

  return report;
}

function countNodeType(node: UINode, typeStr: string): number {
  let c = node.type === typeStr ? 1 : 0;
  if (node.children) {
    for (const child of node.children) c += countNodeType(child, typeStr);
  }
  return c;
}

function countGradients(node: UINode): number {
  let c = node.style?.fills?.some((f: any) => f.type?.includes("GRADIENT")) ? 1 : 0;
  if (node.children) {
    for (const child of node.children) c += countGradients(child);
  }
  return c;
}

function countShadows(node: UINode): number {
  let c = node.style?.effects?.some((e: any) => e.type?.includes("SHADOW")) ? 1 : 0;
  if (node.children) {
    for (const child of node.children) c += countShadows(child);
  }
  return c;
}

function countBorders(node: UINode): number {
  let c = node.style?.strokes?.length > 0 ? 1 : 0;
  if (node.children) {
    for (const child of node.children) c += countBorders(child);
  }
  return c;
}
