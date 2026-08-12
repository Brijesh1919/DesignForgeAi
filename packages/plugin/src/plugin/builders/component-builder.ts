/**
 * DesignForge AI — Component Builder
 *
 * Creates reusable Figma components from detected
 * repeated UI elements, and manages instances.
 */

import { buildNodeTree } from "./frame-builder";

interface ComponentDef {
  id: string;
  name: string;
  category: string;
  instanceCount: number;
  template: any; // UINode
}

/**
 * Build all component definitions and return a map.
 * Components are placed on a dedicated "Components" page.
 */
export async function buildComponents(
  componentDefs: ComponentDef[],
  imageAssets: Map<string, Uint8Array>,
  debugMode?: boolean
): Promise<Map<string, ComponentNode>> {
  const components = new Map<string, ComponentNode>();

  if (componentDefs.length === 0) return components;

  // Create or find a components page
  let componentsPage = figma.root.children.find(
    (page) => page.name === "🧩 Components"
  );

  if (!componentsPage) {
    componentsPage = figma.createPage();
    componentsPage.name = "🧩 Components";
  }

  // Ensure the components page is loaded before any appendChild calls.
  // A newly-created page or an existing page may not be loaded yet
  // in the modern Figma Plugin API.
  await componentsPage.loadAsync();

  let xOffset = 0;

  for (const def of componentDefs) {
    try {
      // Create a temporary frame on the current page (which is already loaded)
      const tempFrame = figma.createFrame();
      tempFrame.name = `_temp_${def.id}`;

      // Build the component structure
      await buildNodeTree(def.template, tempFrame, {
        components,
        imageAssets,
        depth: 0,
        debugMode,
      });

      // Get the first child (the actual component content)
      if (tempFrame.children.length > 0) {
        const content = tempFrame.children[0]!;

        // Create the component
        const component = figma.createComponent();
        component.name = def.name;
        component.resize(
          Math.max(1, def.template.bounds.width),
          Math.max(1, def.template.bounds.height)
        );

        // Move children from temp frame content to component
        if ("children" in content) {
          const children = [...(content as FrameNode).children];
          for (const child of children) {
            component.appendChild(child);
          }

          // Copy layout properties
          const sourceFrame = content as FrameNode;
          if (sourceFrame.layoutMode !== "NONE") {
            component.layoutMode = sourceFrame.layoutMode;
            component.primaryAxisSizingMode = sourceFrame.primaryAxisSizingMode;
            component.counterAxisSizingMode = sourceFrame.counterAxisSizingMode;
            component.paddingTop = sourceFrame.paddingTop;
            component.paddingRight = sourceFrame.paddingRight;
            component.paddingBottom = sourceFrame.paddingBottom;
            component.paddingLeft = sourceFrame.paddingLeft;
            component.itemSpacing = sourceFrame.itemSpacing;
          }

          // Copy fills
          component.fills = sourceFrame.fills;
          component.cornerRadius = sourceFrame.cornerRadius;
          component.effects = sourceFrame.effects;
          component.strokes = sourceFrame.strokes;
          component.strokeWeight = sourceFrame.strokeWeight;
          component.clipsContent = sourceFrame.clipsContent;
        }

        // Place on components page (page is already loaded above)
        componentsPage.appendChild(component);
        component.x = xOffset;
        component.y = 0;
        xOffset += component.width + 40;

        components.set(def.id, component);

        if (debugMode) {
          console.log(`Creating Component "${def.name}"... ✓`);
        }
      }

      // Clean up temp frame
      tempFrame.remove();
    } catch (err) {
      console.error(`Failed to create component "${def.name}": ${err}`);
      if (debugMode) {
        console.log(`Creating Component "${def.name}"... ❌\nReason: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return components;
}

/**
 * Check if a component ref exists in the components map.
 */
export function isComponentInstance(
  componentRef: string,
  components: Map<string, ComponentNode>
): boolean {
  return components.has(componentRef);
}

/**
 * Create a component instance from a component.
 */
export function createInstance(
  componentRef: string,
  components: Map<string, ComponentNode>
): InstanceNode | null {
  const component = components.get(componentRef);
  if (!component) return null;

  return component.createInstance();
}
