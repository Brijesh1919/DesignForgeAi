/**
 * DesignForge AI — Fidelity Scoring Engine
 *
 * Computes a Fidelity Score (0-100) comparing the final reconstructed
 * layout against the AI-detected layout to quantify reconstruction quality.
 */

import type { UINode, DesignAnalysis } from "@designforge/shared";

export interface FidelityReport {
  overallScore: number;         // 0-100
  positionAccuracy: number;     // 0-100
  sizeAccuracy: number;         // 0-100
  colorRetention: number;       // 0-100
  layoutPreservation: number;   // 0-100
  coveragePercent: number;      // 0-100
  nodeCount: number;
  autoLayoutCount: number;
  absoluteCount: number;
  nodeConfidences: { name: string; confidence: number; type: string }[];
}

/**
 * Recursively collect all nodes with their properties.
 */
function collectNodes(
  node: UINode,
  list: UINode[] = []
): UINode[] {
  list.push(node);
  if (node.children) {
    for (const child of node.children) {
      collectNodes(child, list);
    }
  }
  return list;
}

/**
 * Computes the fidelity report for a design analysis.
 */
export function computeFidelityScore(analysis: DesignAnalysis): FidelityReport {
  const allNodes = collectNodes(analysis.rootFrame);
  const nodeCount = allNodes.length;

  // 1. Position accuracy: how many nodes have non-zero, non-default coordinates
  let nodesWithPositions = 0;
  for (const node of allNodes) {
    if (node.bounds.width > 0 && node.bounds.height > 0) {
      nodesWithPositions++;
    }
  }
  const positionAccuracy = nodeCount > 0
    ? Math.round((nodesWithPositions / nodeCount) * 100)
    : 0;

  // 2. Size accuracy: all nodes should have positive dimensions
  let validSizes = 0;
  for (const node of allNodes) {
    if (node.bounds.width >= 1 && node.bounds.height >= 1) {
      validSizes++;
    }
  }
  const sizeAccuracy = nodeCount > 0
    ? Math.round((validSizes / nodeCount) * 100)
    : 0;

  // 3. Color retention: how many non-TEXT container nodes have fills
  const containerNodes = allNodes.filter(n => n.type !== "TEXT" && n.type !== "LINE");
  let nodesWithFills = 0;
  for (const node of containerNodes) {
    if (node.style.fills && node.style.fills.length > 0) {
      nodesWithFills++;
    }
  }
  const colorRetention = containerNodes.length > 0
    ? Math.round((nodesWithFills / containerNodes.length) * 100)
    : 100;

  // 4. Layout preservation: how many containers kept absolute positioning
  let autoLayoutCount = 0;
  let absoluteCount = 0;
  for (const node of allNodes) {
    if (node.children && node.children.length > 0) {
      if (node.layout.direction !== "NONE") {
        autoLayoutCount++;
      } else {
        absoluteCount++;
      }
    }
  }
  const totalContainers = autoLayoutCount + absoluteCount;
  const layoutPreservation = totalContainers > 0
    ? Math.round((absoluteCount / totalContainers) * 100)
    : 100;

  // 5. Coverage: percentage of screenshot area covered by nodes
  const screenW = analysis.metadata.sourceWidth;
  const screenH = analysis.metadata.sourceHeight;
  const screenArea = screenW * screenH;

  // Sum up area of immediate root children (avoid double-counting)
  let coveredArea = 0;
  const rootChildren = analysis.rootFrame.children || [];
  for (const child of rootChildren) {
    coveredArea += child.bounds.width * child.bounds.height;
  }
  // Cap at 100%
  const coveragePercent = Math.min(100, Math.round((coveredArea / screenArea) * 100));

  // 6. Node confidences
  const nodeConfidences = allNodes.map(n => ({
    name: n.name,
    confidence: n.confidence ?? 1.0,
    type: n.type,
  }));

  // Overall score: weighted average
  const overallScore = Math.round(
    positionAccuracy * 0.25 +
    sizeAccuracy * 0.20 +
    colorRetention * 0.25 +
    layoutPreservation * 0.15 +
    coveragePercent * 0.15
  );

  return {
    overallScore,
    positionAccuracy,
    sizeAccuracy,
    colorRetention,
    layoutPreservation,
    coveragePercent,
    nodeCount,
    autoLayoutCount,
    absoluteCount,
    nodeConfidences,
  };
}
