/**
 * DesignForge AI — Variable Generator
 *
 * Creates Figma variables from extracted design tokens:
 * - Color variables (semantic palette)
 * - Number variables (spacing scale)
 * - Number variables (radius scale)
 */

import { hexToFigmaRGB } from "../utils/color-utils";

interface ColorToken {
  name: string;
  value: string;
  category: string;
}

/**
 * Generate Figma variables from design tokens.
 * Returns total count of variables created.
 */
export async function generateVariables(
  colorTokens: ColorToken[],
  spacingScale: number[],
  radiusScale: number[],
  debugMode?: boolean
): Promise<number> {
  let totalCreated = 0;

  try {
    // ─── Color Variables ──────────────────────────────────────

    if (colorTokens.length > 0) {
      let colorCollection: VariableCollection;
      try {
        colorCollection = figma.variables.createVariableCollection(
          "DesignForge Colors"
        );
        if (debugMode) {
          console.log(`Creating Variable Collection "DesignForge Colors"... ✓`);
        }
      } catch (err) {
        console.error(`Failed to create variable collection "DesignForge Colors": ${err}`);
        if (debugMode) {
          console.log(`Creating Variable Collection "DesignForge Colors"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        throw err;
      }

      // Rename the default mode
      const defaultModeId = colorCollection.modes[0]!.modeId;
      colorCollection.renameMode(defaultModeId, "Default");

      for (const token of colorTokens) {
        const varName = `color/${token.category}/${token.name}`;
        try {
          const variable = figma.variables.createVariable(
            varName,
            colorCollection,
            "COLOR"
          );

          const rgb = hexToFigmaRGB(token.value);
          variable.setValueForMode(defaultModeId, {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            a: 1,
          });

          totalCreated++;
          if (debugMode) {
            console.log(`Creating Color Variable "${varName}"... ✓`);
          }
        } catch (err) {
          console.error(`Failed to create color variable "${token.name}": ${err}`);
          if (debugMode) {
            console.log(`Creating Color Variable "${varName}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }

    // ─── Spacing Variables ────────────────────────────────────

    if (spacingScale.length > 0) {
      let spacingCollection: VariableCollection;
      try {
        spacingCollection = figma.variables.createVariableCollection(
          "DesignForge Spacing"
        );
        if (debugMode) {
          console.log(`Creating Variable Collection "DesignForge Spacing"... ✓`);
        }
      } catch (err) {
        console.error(`Failed to create variable collection "DesignForge Spacing": ${err}`);
        if (debugMode) {
          console.log(`Creating Variable Collection "DesignForge Spacing"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        throw err;
      }

      const defaultModeId = spacingCollection.modes[0]!.modeId;
      spacingCollection.renameMode(defaultModeId, "Default");

      for (const value of spacingScale) {
        const varName = `spacing/${value}`;
        try {
          const variable = figma.variables.createVariable(
            varName,
            spacingCollection,
            "FLOAT"
          );

          variable.setValueForMode(defaultModeId, value);
          totalCreated++;
          if (debugMode) {
            console.log(`Creating Spacing Variable "${varName}"... ✓`);
          }
        } catch (err) {
          console.error(`Failed to create spacing variable ${value}: ${err}`);
          if (debugMode) {
            console.log(`Creating Spacing Variable "${varName}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }

    // ─── Radius Variables ─────────────────────────────────────

    if (radiusScale.length > 0) {
      let radiusCollection: VariableCollection;
      try {
        radiusCollection = figma.variables.createVariableCollection(
          "DesignForge Radius"
        );
        if (debugMode) {
          console.log(`Creating Variable Collection "DesignForge Radius"... ✓`);
        }
      } catch (err) {
        console.error(`Failed to create variable collection "DesignForge Radius": ${err}`);
        if (debugMode) {
          console.log(`Creating Variable Collection "DesignForge Radius"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
        }
        throw err;
      }

      const defaultModeId = radiusCollection.modes[0]!.modeId;
      radiusCollection.renameMode(defaultModeId, "Default");

      for (const value of radiusScale) {
        const name = value === 9999 ? "radius/full" : `radius/${value}`;
        try {
          const variable = figma.variables.createVariable(
            name,
            radiusCollection,
            "FLOAT"
          );

          variable.setValueForMode(defaultModeId, value);
          totalCreated++;
          if (debugMode) {
            console.log(`Creating Radius Variable "${name}"... ✓`);
          }
        } catch (err) {
          console.error(`Failed to create radius variable ${value}: ${err}`);
          if (debugMode) {
            console.log(`Creating Radius Variable "${name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Failed to create variable collections: ${err}`);
  }

  console.log(`[Variables] Created ${totalCreated} variables`);
  return totalCreated;
}
