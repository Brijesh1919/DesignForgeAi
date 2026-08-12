/**
 * DesignForge AI — Component Detection Engine
 *
 * Scans node trees to identify repeated UI subtrees (buttons, list items, cards),
 * groups them into a single ComponentDefinition, and replaces nodes with instances.
 */

import type { UINode, DesignAnalysis, ComponentDefinition } from "@designforge/shared";
import { v4 as uuidv4 } from "uuid";

/**
 * Computes a structural signature/hash for a UI node.
 * Similar nodes (e.g. identical buttons) will share the exact same signature.
 */
function getStructuralSignature(node: UINode): string {
  // Primitives to compare
  const type = node.type;
  const childCount = node.children?.length || 0;

  // Node width/height proportions
  const widthRatio = Math.round(node.bounds.width);
  const heightRatio = Math.round(node.bounds.height);

  // Background colors hash
  const fillsHash = node.style.fills
    .filter((f) => f.type === "SOLID")
    .map((f) => f.color)
    .sort()
    .join(",");

  const strokeHash = node.style.strokes
    .map((s) => s.color)
    .sort()
    .join(",");

  // Text signature
  const textProps = node.text
    ? `${node.text.fontSize}_${node.text.fontWeight}_${node.text.color}`
    : "no_text";

  // Children names signature
  const childrenSig = node.children
    ? node.children.map((c) => c.type).join(">")
    : "";

  return `${type}|c:${childCount}|w:${widthRatio}|h:${heightRatio}|f:${fillsHash}|s:${strokeHash}|t:${textProps}|ch:${childrenSig}`;
}

/**
 * Traverses layout tree and clusters instances by structural signature.
 */
function findComponentGroups(
  node: UINode,
  signatureGroups: Map<string, UINode[]>
): void {
  // Only target potential components (frames, rectangles, text boxes)
  // We ignore rootFrame node (depth 0) to avoid converting the entire screen into a component.
  const sig = getStructuralSignature(node);

  if (node.type === "FRAME" || node.type === "RECTANGLE" || node.type === "GROUP") {
    const list = signatureGroups.get(sig) || [];
    list.push(node);
    signatureGroups.set(sig, list);
  }

  if (node.children) {
    for (const child of node.children) {
      findComponentGroups(child, signatureGroups);
    }
  }
}

/**
 * Replaces matching nodes in the tree with component references.
 */
function replaceNodesWithInstances(
  node: UINode,
  signatureMap: Map<string, string> // Map signature -> componentRef id
): UINode {
  const updated = { ...node };
  const sig = getStructuralSignature(updated);

  if (signatureMap.has(sig)) {
    updated.componentRef = signatureMap.get(sig);
    updated.type = "COMPONENT_INSTANCE";
    // We clear children for instances since they inherit children structure from the component definition template
    delete updated.children;
    return updated;
  }

  if (updated.children) {
    updated.children = updated.children.map((c) =>
      replaceNodesWithInstances(c, signatureMap)
    );
  }

  return updated;
}

/**
 * Scans layout tree to automatically extract reusable component templates.
 */
export function detectComponents(analysis: DesignAnalysis): DesignAnalysis {
  const result = { ...analysis };
  const signatureGroups = new Map<string, UINode[]>();

  // 1. Gather all candidates
  findComponentGroups(result.rootFrame, signatureGroups);

  const componentDefs: ComponentDefinition[] = [];
  const signatureMap = new Map<string, string>(); // maps signature -> componentId

  // 2. Identify groups with multiple occurrences
  for (const [sig, nodes] of signatureGroups.entries()) {
    if (nodes.length >= 2) {
      // Find template candidate (the first one)
      const templateNode = nodes[0]!;
      const componentId = `comp_${uuidv4().substring(0, 8)}`;

      // Infer categorization
      let category: ComponentDefinition["category"] = "other";
      if (templateNode.name.toLowerCase().includes("button")) {
        category = "button";
      } else if (templateNode.name.toLowerCase().includes("card")) {
        category = "card";
      } else if (templateNode.name.toLowerCase().includes("input")) {
        category = "input";
      } else if (templateNode.name.toLowerCase().includes("nav")) {
        category = "navigation";
      }

      const componentDef: ComponentDefinition = {
        id: componentId,
        name: templateNode.name,
        category,
        instanceCount: nodes.length,
        template: { ...templateNode },
      };

      componentDefs.push(componentDef);
      signatureMap.set(sig, componentId);
    }
  }

  // 3. Update the layout tree with instances
  if (componentDefs.length > 0) {
    result.rootFrame = replaceNodesWithInstances(result.rootFrame, signatureMap);
    result.components = [...result.components, ...componentDefs];
    console.log(`[Component Detector] Detected ${componentDefs.length} unique reusable component classes.`);
  }

  return result;
}
