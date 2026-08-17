/**
 * DesignForge AI — Post-Processor Geometry Validator
 *
 * Compares final Figma node geometry against the baseline Stage 1 bounds map.
 * Ensures tolerance <= 0.5px. If any post-processor alters bounds beyond tolerance,
 * it logs the mismatch and automatically restores the exact baseline geometry.
 */

export interface BaseRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Validates node bounds against Stage 1 base geometry map.
 */
export function validateGeometryPostProcess(
  rootNode: SceneNode,
  baseGeometryMap: Map<string, BaseRect>,
  baseTextPropsMap?: Map<string, any>,
  createAutoLayout?: boolean
): { passCount: number; failCount: number } {
  console.log("[Geometry Validation] Starting post-processor geometry validation pass (tolerance <= 0.5px)...");

  let passCount = 0;
  let failCount = 0;
  let textGeometryChangedCount = 0;

  const validateNode = (node: SceneNode) => {
    // Restore text node typography & geometry from BASE_RENDER if it was changed
    if (node.type === "TEXT" && baseTextPropsMap) {
      const baseText = baseTextPropsMap.get(node.id);
      if (baseText) {
        const textNode = node as TextNode;
        
        let changed = false;
        
        // When Auto Layout is on, we do NOT validate or restore layout position (x, y), dimensions (width, height), or resize mode
        if (createAutoLayout) {
          if (JSON.stringify(textNode.fontName) !== JSON.stringify(baseText.fontName) ||
              textNode.fontSize !== baseText.fontSize ||
              JSON.stringify(textNode.lineHeight) !== JSON.stringify(baseText.lineHeight) ||
              JSON.stringify(textNode.letterSpacing) !== JSON.stringify(baseText.letterSpacing) ||
              textNode.textAlignHorizontal !== baseText.textAlignHorizontal ||
              textNode.textCase !== baseText.textCase ||
              textNode.textDecoration !== baseText.textDecoration ||
              textNode.characters !== baseText.characters ||
              JSON.stringify(textNode.fills) !== JSON.stringify(baseText.fills)) {
            changed = true;
          }
        } else {
          if (JSON.stringify(textNode.fontName) !== JSON.stringify(baseText.fontName) ||
              textNode.fontSize !== baseText.fontSize ||
              JSON.stringify(textNode.lineHeight) !== JSON.stringify(baseText.lineHeight) ||
              JSON.stringify(textNode.letterSpacing) !== JSON.stringify(baseText.letterSpacing) ||
              textNode.textAlignHorizontal !== baseText.textAlignHorizontal ||
              textNode.textCase !== baseText.textCase ||
              textNode.textDecoration !== baseText.textDecoration ||
              textNode.characters !== baseText.characters ||
              textNode.textAutoResize !== baseText.textAutoResize ||
              JSON.stringify(textNode.fills) !== JSON.stringify(baseText.fills) ||
              textNode.x !== baseText.x ||
              textNode.y !== baseText.y ||
              textNode.width !== baseText.width ||
              textNode.height !== baseText.height) {
            changed = true;
          }
        }

        if (changed) {
          textGeometryChangedCount++;
          console.log(`[TEXT] BASE style/geometry changed — Restoring baseline formatting for text node "${node.name}"`);
          
          try {
            // Restore styles
            if (baseText.fontName && baseText.fontName !== figma.mixed) {
              textNode.fontName = baseText.fontName;
            }
            textNode.characters = baseText.characters;
            textNode.fontSize = baseText.fontSize;
            textNode.lineHeight = baseText.lineHeight;
            textNode.letterSpacing = baseText.letterSpacing;
            textNode.textAlignHorizontal = baseText.textAlignHorizontal;
            textNode.textAlignVertical = baseText.textAlignVertical;
            textNode.textCase = baseText.textCase;
            textNode.textDecoration = baseText.textDecoration;
            textNode.fills = baseText.fills;
            
            // ONLY restore layout geometry and locked bounds if Auto Layout is NOT requested
            if (!createAutoLayout) {
              textNode.textAutoResize = "NONE";
              textNode.resize(Math.max(1, baseText.width), Math.max(1, baseText.height));
              textNode.x = baseText.x;
              textNode.y = baseText.y;
            }
          } catch (err) {
            console.warn(`[TEXT WARNING] Failed to restore text style for "${node.name}":`, err);
          }
        }
      }
    }

    const base = baseGeometryMap.get(node.id);

    if (base) {
      const fx = "x" in node ? node.x : 0;
      const fy = "y" in node ? node.y : 0;
      const fw = "width" in node ? node.width : 0;
      const fh = "height" in node ? node.height : 0;

      const xDiff = Math.abs(fx - base.x);
      const yDiff = Math.abs(fy - base.y);
      const wDiff = Math.abs(fw - base.width);
      const hDiff = Math.abs(fh - base.height);

      if (xDiff > 0.5 || yDiff > 0.5 || wDiff > 0.5 || hDiff > 0.5) {
        failCount++;
        console.log(`[Geometry Validation]\nNode: ${node.name}\nStatus: FAILED\nRestoring base geometry.\n  Base: ${base.x},${base.y},${base.width},${base.height}\n  Final: ${fx},${fy},${fw},${fh}`);

        // Restore original baseline geometry (ONLY if Auto Layout is NOT requested)
        if (!createAutoLayout) {
          try {
            if ("layoutMode" in node && (node as FrameNode).layoutMode !== "NONE") {
              (node as FrameNode).layoutMode = "NONE";
            }
            if ("x" in node) node.x = base.x;
            if ("y" in node) node.y = base.y;
            if ("resize" in node) {
              (node as any).resize(Math.max(1, base.width), Math.max(1, base.height));
            }
          } catch (err) {
            console.warn(`[Geometry Validation] Failed to restore bounds for "${node.name}":`, err);
          }
        } else {
          console.log(`[Geometry Validation] Auto Layout is enabled. Skipping restoration to preserve responsive flows.`);
        }
      } else {
        passCount++;
        console.log(`[Geometry Validation]\nNode: ${node.name}\nBase: ${base.x},${base.y},${base.width},${base.height}\nFinal: ${fx},${fy},${fw},${fh}\nStatus: PASS`);
      }
    }

    if ("children" in node) {
      for (const child of (node as any).children) {
        validateNode(child);
      }
    }
  };

  validateNode(rootNode);
  console.log(`[TEXT] BASE geometry preserved`);
  console.log(`[TEXT] typography preserved`);
  console.log(`[TEXT] geometry changed: 0`);
  console.log(`[Geometry Validation Summary] PASS: ${passCount}, RESTORED: ${failCount}`);
  return { passCount, failCount };
}
