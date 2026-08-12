/**
 * DesignForge AI — Effects Fidelity Adapter
 *
 * Handles box-shadow, drop-shadow, blur, backdrop-filter, and multiple shadow effects.
 * Maps browser effect properties to native Figma Effect objects or visual fallbacks.
 */

import { hexToFigmaRGB } from "../utils/color-utils";
import { createVisualFallback } from "./fallback";

export interface EffectItem {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR" | string;
  color?: string;
  opacity?: number;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
  visible?: boolean;
}

/**
 * Converts CSS effect objects into valid Figma native Effect definitions.
 */
export function processEffectsFidelity(
  effectsInput: any[],
  nodeName = "Node"
): Effect[] {
  if (!Array.isArray(effectsInput) || effectsInput.length === 0) {
    return [];
  }

  const boxShadowVal = effectsInput.find(e => e.source === "box-shadow")?.value || "none";
  const backdropFilterVal = effectsInput.find(e => e.source === "backdrop-filter")?.value || "none";
  const filterVal = effectsInput.find(e => e.source === "filter")?.value || "none";

  console.log(`[EFFECT]
node: ${nodeName}
boxShadow: ${boxShadowVal}
backdropFilter: ${backdropFilterVal}
filter: ${filterVal}`);

  const figmaEffects: Effect[] = [];

  for (const eff of effectsInput) {
    const isVisible = eff.visible !== false;

    if (eff.type === "BACKGROUND_BLUR" || eff.type?.toLowerCase().includes("backdrop")) {
      console.log(`[EFFECT] backdrop-filter detected`);
      console.log(`[EFFECT] BACKGROUND_BLUR skipped by fidelity policy`);
      console.log(`[NAVBAR BLUR]
CSS backdrop-filter detected: true
Figma background blur applied: false
Reason: backdrop-filter intentionally not mapped to Figma background blur`);
      continue;
    } else if (eff.type === "LAYER_BLUR" || (eff.type?.toLowerCase().includes("blur") && !eff.type?.toLowerCase().includes("background"))) {
      const radius = eff.radius || eff.blur || 4;
      figmaEffects.push({
        type: "LAYER_BLUR",
        radius,
        visible: isVisible,
      });
      console.log(`[EFFECT] Figma applied: LAYER_BLUR`);
    } else if (eff.type === "DROP_SHADOW" || eff.type === "INNER_SHADOW" || eff.type?.toLowerCase().includes("shadow")) {
      const isInner = eff.type === "INNER_SHADOW";
      const ox = typeof eff.offsetX === "number" ? eff.offsetX : (eff.offset?.x ?? 0);
      const oy = typeof eff.offsetY === "number" ? eff.offsetY : (eff.offset?.y ?? 0);
      const bVal = typeof eff.blur === "number" ? eff.blur : (eff.radius ?? 4);
      const sVal = typeof eff.spread === "number" ? eff.spread : 0;

      const rgb = eff.color ? hexToFigmaRGB(eff.color) : { r: 0, g: 0, b: 0 };
      const alpha = typeof eff.opacity === "number" ? eff.opacity : 0.25;

      const shadowEffect: DropShadowEffect | InnerShadowEffect = {
        type: isInner ? "INNER_SHADOW" : "DROP_SHADOW",
        color: { ...rgb, a: alpha },
        offset: { x: ox, y: oy },
        radius: bVal,
        spread: sVal,
        visible: isVisible,
        blendMode: "NORMAL",
      };

      figmaEffects.push(shadowEffect);
      console.log(`[EFFECT] Figma applied: ${isInner ? "INNER_SHADOW" : "DROP_SHADOW"}`);
    } else {
      console.log(`[EFFECT] Visual fallback: Unsupported effect type "${eff.type}" on "${nodeName}"`);
      console.log(`[EFFECT MISMATCH]`);
    }
  }

  console.log(`[EFFECT TRACE]
element: ${nodeName}
browser boxShadow: ${boxShadowVal}
browser filter: ${filterVal}
browser backdropFilter: ${backdropFilterVal}
analysis effects: ${JSON.stringify(effectsInput)}
figma effects: ${JSON.stringify(figmaEffects)}`);

  return figmaEffects;
}
