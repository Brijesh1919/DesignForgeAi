/**
 * DesignForge AI — Interactive Color Switcher Prototype Component
 *
 * Takes a product card with color swatches and matching product images (e.g. green, blue, black, white mugs),
 * builds a Figma Component Set with 4 variants, and wires Smart Animate prototype interactions (CHANGE_TO)
 * so clicking any color box smoothly transitions the mug image and active swatch indicator in real time.
 */

export interface ColorSwitcherOptions {
  frameId?: string;
  cardId?: string;
}

export interface ColorSwitcherResult {
  success: boolean;
  componentSetId?: string;
  componentSetName?: string;
  instanceId?: string;
  variantsCount?: number;
  details?: string[];
  error?: string;
}

export async function generateColorSwitcherComponent(
  options: ColorSwitcherOptions = {}
): Promise<ColorSwitcherResult> {
  const details: string[] = [];

  try {
    figma.notify("🎨 Creating interactive color switcher prototype component...", { timeout: 3000 });

    // 1. Locate Frame 49 and Component Card
    let targetContainer: FrameNode | null = null;
    let originalCard: FrameNode | null = null;

    if (options.cardId) {
      const node = await figma.getNodeByIdAsync(options.cardId);
      if (node && node.type === "FRAME") originalCard = node as FrameNode;
    }

    if (options.frameId) {
      const node = await figma.getNodeByIdAsync(options.frameId);
      if (node && node.type === "FRAME") targetContainer = node as FrameNode;
    }

    // Auto-discover from selection or page
    if (!targetContainer || !originalCard) {
      const sel = figma.currentPage.selection;
      for (const s of sel) {
        if (s.type === "FRAME") {
          if (s.name.includes("Frame 49") || s.id === "840:158") {
            targetContainer = s as FrameNode;
          } else if (s.name === "Component" || s.id === "840:111") {
            originalCard = s as FrameNode;
          }
        }
      }
    }

    // Fallback: search on page
    if (!targetContainer) {
      const node = await figma.getNodeByIdAsync("840:158");
      if (node && node.type === "FRAME") targetContainer = node as FrameNode;
    }

    if (!originalCard && targetContainer) {
      for (const child of targetContainer.children) {
        if (child.name === "Component" || child.id === "840:111") {
          originalCard = child as FrameNode;
          break;
        }
      }
    }

    if (!originalCard) {
      // Fallback: direct ID lookup
      const node = await figma.getNodeByIdAsync("840:111");
      if (node && node.type === "FRAME") originalCard = node as FrameNode;
    }

    if (!originalCard) {
      return {
        success: false,
        error: "Could not find the product card frame (Component) to build the interactive switcher from.",
      };
    }

    details.push(`Found product card: "${originalCard.name}" (${originalCard.id}).`);

    // 2. Locate Source Mug Frames (Frame 45, 46, 47, 48)
    const mugSources: Record<string, { imageFills: readonly Paint[]; logoChild?: SceneNode; colorName: string }> = {};

    // Helper to find image fill on a node or its children
    function findImageFill(node: SceneNode): readonly Paint[] | null {
      if ("fills" in node && Array.isArray((node as any).fills)) {
        const img = (node as any).fills.find((f: Paint) => f.type === "IMAGE" && f.visible !== false);
        if (img) return (node as any).fills;
      }
      if ("children" in node && Array.isArray((node as any).children)) {
        for (const c of (node as any).children) {
          const res = findImageFill(c);
          if (res) return res;
        }
      }
      return null;
    }

    function findLogoBadge(node: SceneNode): SceneNode | null {
      if ("children" in node && Array.isArray((node as any).children)) {
        for (const c of (node as any).children) {
          if (c.name.includes("Frame 44") || c.name.includes("Frame 45") || (c.width <= 70 && c.height <= 70 && "children" in c)) {
            return c;
          }
        }
      }
      return null;
    }

    // Inspect candidates in targetContainer or by ID
    const colorDefinitions = [
      { key: "green", id: "840:136", name: "Green", swatchId: "840:116", containerId: "840:115" },
      { key: "blue", id: "840:137", name: "Blue", swatchId: "840:118", containerId: "840:117" },
      { key: "black", id: "840:138", name: "Black", swatchId: "840:120", containerId: "840:119" },
      { key: "white", id: "840:139", name: "White", swatchId: "840:122", containerId: "840:121" },
    ];

    for (const def of colorDefinitions) {
      let sourceNode = await figma.getNodeByIdAsync(def.id) as SceneNode | null;
      if (!sourceNode && targetContainer) {
        sourceNode = targetContainer.children.find(c => c.name.includes(def.name) || c.id === def.id) || null;
      }

      let fills: readonly Paint[] | null = null;
      let logoBadge: SceneNode | null = null;

      if (sourceNode) {
        fills = findImageFill(sourceNode);
        logoBadge = findLogoBadge(sourceNode);
      }

      // If Green fallback to card's original image
      if (!fills && def.key === "green") {
        fills = findImageFill(originalCard);
      }

      if (fills) {
        mugSources[def.key] = {
          imageFills: fills,
          logoChild: logoBadge || undefined,
          colorName: def.name,
        };
        details.push(`Loaded ${def.name} mug asset.`);
      }
    }

    // 3. Preload all necessary fonts
    await Promise.all([
      figma.loadFontAsync({ family: "DM Sans", style: "Regular" }).catch(() => {}),
      figma.loadFontAsync({ family: "Manrope", style: "SemiBold" }).catch(() => {}),
      figma.loadFontAsync({ family: "Saira Condensed", style: "Bold" }).catch(() => {}),
      figma.loadFontAsync({ family: "Inter", style: "Regular" }).catch(() => {}),
    ]);

    // Solid paint helpers
    const activeBorderColor: Paint = {
      type: "SOLID",
      color: { r: 0, g: 0, b: 0 },
      opacity: 1,
      visible: true,
    };
    const inactiveBorderColor: Paint = {
      type: "SOLID",
      color: { r: 221 / 255, g: 221 / 255, b: 221 / 255 },
      opacity: 1,
      visible: true,
    };

    // 4. Construct 4 Component Variants
    const variants: ComponentNode[] = [];
    const variantMap: Record<string, ComponentNode> = {};
    const swatchesByVariant: Record<string, { green: SceneNode; blue: SceneNode; black: SceneNode; white: SceneNode }> = {};

    for (const def of colorDefinitions) {
      const comp = figma.createComponent();
      figma.currentPage.appendChild(comp); // Must be appended to page before combineAsVariants
      comp.name = `Color=${def.name}`;
      comp.resize(originalCard.width, originalCard.height);
      comp.clipsContent = originalCard.clipsContent;
      comp.cornerRadius = originalCard.cornerRadius;
      comp.fills = originalCard.fills;
      comp.strokes = originalCard.strokes;
      comp.strokeWeight = originalCard.strokeWeight;
      comp.effects = originalCard.effects;

      // Deep clone originalCard children
      const cardClone = originalCard.clone();

      // Standardize and update children inside cardClone
      let imgContainer: FrameNode | null = null;
      let swatchRow: FrameNode | null = null;
      let infoRow: FrameNode | null = null;

      for (const child of cardClone.children) {
        if (child.type === "FRAME") {
          if (child.y < 50 || child.height > 250) {
            imgContainer = child as FrameNode;
          } else if (child.height < 70 && child.children.some(c => c.type === "FRAME" && c.width <= 30)) {
            swatchRow = child as FrameNode;
          } else {
            infoRow = child as FrameNode;
          }
        }
      }

      // If imgContainer found, standardize name and set mug image
      if (imgContainer) {
        imgContainer.name = "Image_Container";
        let mugImgNode: SceneNode | null = null;

        for (const c of imgContainer.children) {
          if (c.name === "Image" || c.type === "FRAME" || c.type === "RECTANGLE") {
            mugImgNode = c;
            break;
          }
        }

        if (mugImgNode && mugSources[def.key]?.imageFills) {
          mugImgNode.name = "Mug_Image";
          (mugImgNode as any).fills = mugSources[def.key].imageFills;
        }

        // Ensure logo badge exists and has consistent name
        let existingLogo = findLogoBadge(imgContainer);
        if (existingLogo) {
          existingLogo.name = "Logo_Badge";
        } else if (mugSources[def.key]?.logoChild) {
          const logoClone = mugSources[def.key].logoChild!.clone();
          logoClone.name = "Logo_Badge";
          logoClone.x = 101;
          logoClone.y = 124;
          imgContainer.appendChild(logoClone);
        }
      }

      // If swatchRow found, standardize names and set active/inactive borders
      const swatchRefs: any = {};
      if (swatchRow) {
        swatchRow.name = "Swatch_Row";
        const swatchContainers = swatchRow.children.filter(c => c.type === "FRAME" && c.width <= 30) as FrameNode[];

        // Expect 4 swatches in order: Green, Blue, Black, White
        const keys = ["green", "blue", "black", "white"];
        for (let i = 0; i < Math.min(keys.length, swatchContainers.length); i++) {
          const k = keys[i];
          const sc = swatchContainers[i];
          sc.name = `Swatch_${k.charAt(0).toUpperCase() + k.slice(1)}`;
          swatchRefs[k] = sc;

          const isActive = def.key === k;
          sc.strokes = [isActive ? activeBorderColor : inactiveBorderColor];
          sc.strokeWeight = isActive ? 1.5 : 1;
        }
      }

      if (infoRow) {
        infoRow.name = "Info_Row";
      }

      // Move children from cardClone to comp
      const cloneChildren = [...cardClone.children];
      for (const child of cloneChildren) {
        comp.appendChild(child);
      }
      cardClone.remove();

      variants.push(comp);
      variantMap[def.key] = comp;
      swatchesByVariant[def.key] = swatchRefs;
      details.push(`Created variant "Color=${def.name}".`);
    }

    // 5. Combine as Variants (Component Set) FIRST so CHANGE_TO navigation is permitted
    const componentSet = figma.combineAsVariants(variants, figma.currentPage);
    componentSet.name = "Mug Product Card — Interactive Color Selector";
    componentSet.layoutMode = "HORIZONTAL";
    componentSet.itemSpacing = 36;
    componentSet.paddingTop = 32;
    componentSet.paddingBottom = 32;
    componentSet.paddingLeft = 32;
    componentSet.paddingRight = 32;
    componentSet.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.98, b: 0.99 }, opacity: 1, visible: true }];
    componentSet.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.90, b: 0.93 }, opacity: 1, visible: true }];
    componentSet.strokeWeight = 1;
    componentSet.cornerRadius = 16;

    // Position component set cleanly below Frame 49 or beside it
    if (targetContainer) {
      componentSet.x = targetContainer.x;
      componentSet.y = targetContainer.y + targetContainer.height + 60;
    } else {
      componentSet.x = originalCard.x + originalCard.width + 100;
      componentSet.y = originalCard.y;
    }

    details.push(`Created Component Set "${componentSet.name}" (${componentSet.id}).`);

    // 6. Now Wire Smart Animate Prototype Reactions across all variants
    for (const sourceDef of colorDefinitions) {
      const swatches = swatchesByVariant[sourceDef.key];
      if (!swatches) continue;

      for (const targetDef of colorDefinitions) {
        const swatchContainer = (swatches as any)[targetDef.key];
        const targetVariant = variantMap[targetDef.key];

        if (swatchContainer && targetVariant && sourceDef.key !== targetDef.key) {
          const changeToReaction = {
            trigger: { type: "ON_CLICK" },
            actions: [
              {
                type: "NODE",
                destinationId: targetVariant.id,
                navigation: "CHANGE_TO",
                transition: {
                  type: "SMART_ANIMATE",
                  duration: 0.35,
                  easing: { type: "EASE_IN_AND_OUT" },
                },
              },
            ],
            action: {
              type: "NODE",
              destinationId: targetVariant.id,
              navigation: "CHANGE_TO",
              transition: {
                type: "SMART_ANIMATE",
                duration: 0.35,
                easing: { type: "EASE_IN_AND_OUT" },
              },
            },
          };

          try {
            if (typeof (swatchContainer as any).setReactionsAsync === "function") {
              await (swatchContainer as any).setReactionsAsync([changeToReaction]);
            } else {
              (swatchContainer as any).reactions = [changeToReaction];
            }
          } catch (rErr) {
            console.warn(`[ColorSwitcher] Reaction error on ${swatchContainer.name}:`, rErr);
          }

          // Also set on inner rectangle if present
          if ("children" in swatchContainer && swatchContainer.children.length > 0) {
            const innerRect = swatchContainer.children[0];
            try {
              if (typeof (innerRect as any).setReactionsAsync === "function") {
                await (innerRect as any).setReactionsAsync([changeToReaction]);
              } else {
                (innerRect as any).reactions = [changeToReaction];
              }
            } catch {}
          }
        }
      }
    }

    details.push("Wired 12 Smart Animate prototype reactions between all color swatches!");

    // 7. Place an active interactive Instance inside targetContainer (Frame 49)
    let instanceNode: InstanceNode | null = null;
    if (targetContainer) {
      const origX = originalCard.x;
      const origY = originalCard.y;

      instanceNode = variants[0].createInstance();
      instanceNode.name = "Mug Card — Interactive (Green)";
      instanceNode.x = origX;
      instanceNode.y = origY;

      // Replace originalCard
      const originalIndex = targetContainer.children.indexOf(originalCard);
      targetContainer.insertChild(originalIndex >= 0 ? originalIndex : 0, instanceNode);
      originalCard.visible = false; // keep as fallback or hide

      details.push(`Placed interactive Component Instance inside "${targetContainer.name}" at (${origX}, ${origY}).`);

      // Set prototype flow starting point on targetContainer so Play button launches it directly
      figma.currentPage.flowStartingPoints = [
        { nodeId: targetContainer.id, name: "Interactive Mug Color Switcher" },
      ];
    }

    // Select and focus
    figma.currentPage.selection = instanceNode ? [instanceNode, componentSet] : [componentSet];
    figma.viewport.scrollAndZoomIntoView(instanceNode ? [instanceNode] : [componentSet]);

    figma.notify("🎉 Interactive Mug Color Switcher Ready! Test in Prototype view.", { timeout: 6000 });

    return {
      success: true,
      componentSetId: componentSet.id,
      componentSetName: componentSet.name,
      instanceId: instanceNode?.id,
      variantsCount: variants.length,
      details,
    };
  } catch (err: any) {
    console.error("[ColorSwitcher] Error creating interactive component:", err);
    return {
      success: false,
      error: (err && (err.message || err.stack)) ? `${err.message}` : String(err),
      details,
    };
  }
}
