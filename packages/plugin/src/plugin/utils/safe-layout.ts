/**
 * DesignForge AI — Centralized Safe Layout & Semantic Sizing Engine
 *
 * Provides safe layout property setters, semantic classification,
 * and layout validation to ensure ZERO Figma API exceptions during generation.
 */

export type SemanticRole =
  | "PAGE"
  | "SECTION"
  | "CONTENT_CONTAINER"
  | "ROW"
  | "COLUMN"
  | "CARD"
  | "CARD_GRID"
  | "TEXT"
  | "HEADING"
  | "PARAGRAPH"
  | "BUTTON"
  | "BADGE"
  | "PILL"
  | "ICON"
  | "SVG"
  | "IMAGE"
  | "CHART"
  | "ILLUSTRATION"
  | "NAVIGATION"
  | "NAV_ITEM"
  | "SIDEBAR"
  | "DASHBOARD"
  | "DECORATIVE"
  | "FOOTER"
  | "UNKNOWN";

// ─── 1. SAFE LAYOUT HELPERS ──────────────────────────────────

/**
 * Verifies if a node's parent exists and is a valid Auto Layout container.
 */
export function canUseAutoLayoutSizing(node: SceneNode): boolean {
  if (!node || !node.parent) return false;
  const parent = node.parent;
  return (
    (parent.type === "FRAME" ||
      parent.type === "COMPONENT" ||
      parent.type === "COMPONENT_SET" ||
      parent.type === "INSTANCE") &&
    "layoutMode" in parent &&
    parent.layoutMode !== undefined &&
    parent.layoutMode !== "NONE"
  );
}

/**
 * Safely sets layoutSizingHorizontal = "FILL".
 */
export function safeSetFillHorizontal(node: SceneNode): boolean {
  if (!("layoutSizingHorizontal" in node)) return false;
  if (!canUseAutoLayoutSizing(node)) {
    console.warn(
      `[DesignForge][Layout WARNING] Prevented setting horizontal FILL on "${node.name || node.type}" because parent "${
        node.parent?.name || "canvas"
      }" is not Auto Layout.`
    );
    safeSetFixedHorizontal(node);
    return false;
  }
  try {
    (node as any).layoutSizingHorizontal = "FILL";
    return true;
  } catch (error) {
    console.warn(`[DesignForge] Failed to set horizontal FILL on "${node.name}"`, error);
    safeSetFixedHorizontal(node);
    return false;
  }
}

/**
 * Safely sets layoutSizingVertical = "FILL".
 */
export function safeSetFillVertical(node: SceneNode): boolean {
  if (!("layoutSizingVertical" in node)) return false;
  if (!canUseAutoLayoutSizing(node)) {
    console.warn(
      `[DesignForge][Layout WARNING] Prevented setting vertical FILL on "${node.name || node.type}" because parent "${
        node.parent?.name || "canvas"
      }" is not Auto Layout.`
    );
    safeSetFixedVertical(node);
    return false;
  }
  try {
    (node as any).layoutSizingVertical = "FILL";
    return true;
  } catch (error) {
    console.warn(`[DesignForge] Failed to set vertical FILL on "${node.name}"`, error);
    safeSetFixedVertical(node);
    return false;
  }
}

/**
 * Safely sets layoutSizingHorizontal = "HUG".
 */
export function safeSetHugHorizontal(node: SceneNode): boolean {
  if (!("layoutSizingHorizontal" in node)) return false;
  if (!canUseAutoLayoutSizing(node)) {
    safeSetFixedHorizontal(node);
    return false;
  }
  if ("layoutMode" in node && (node as any).layoutMode === "NONE") {
    safeSetFixedHorizontal(node);
    return false;
  }
  try {
    (node as any).layoutSizingHorizontal = "HUG";
    return true;
  } catch (error) {
    safeSetFixedHorizontal(node);
    return false;
  }
}

/**
 * Safely sets layoutSizingVertical = "HUG".
 */
export function safeSetHugVertical(node: SceneNode): boolean {
  if (!("layoutSizingVertical" in node)) return false;
  if (!canUseAutoLayoutSizing(node)) {
    safeSetFixedVertical(node);
    return false;
  }
  if ("layoutMode" in node && (node as any).layoutMode === "NONE") {
    safeSetFixedVertical(node);
    return false;
  }
  try {
    (node as any).layoutSizingVertical = "HUG";
    return true;
  } catch (error) {
    safeSetFixedVertical(node);
    return false;
  }
}

/**
 * Safely sets layoutSizingHorizontal = "FIXED".
 */
export function safeSetFixedHorizontal(node: SceneNode): boolean {
  if (!("layoutSizingHorizontal" in node)) return false;
  try {
    (node as any).layoutSizingHorizontal = "FIXED";
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safely sets layoutSizingVertical = "FIXED".
 */
export function safeSetFixedVertical(node: SceneNode): boolean {
  if (!("layoutSizingVertical" in node)) return false;
  try {
    (node as any).layoutSizingVertical = "FIXED";
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safely sets layoutWrap = "WRAP" or "NO_WRAP" on a frame.
 * In Figma API, layoutWrap can ONLY be set to "WRAP" when layoutMode === "HORIZONTAL".
 */
export function safeSetLayoutWrap(frame: FrameNode | ComponentNode, wrap: boolean): boolean {
  if (!frame || !("layoutWrap" in frame)) return false;
  if (!wrap) {
    try {
      (frame as any).layoutWrap = "NO_WRAP";
      return true;
    } catch (_) {
      return false;
    }
  }
  if (frame.layoutMode !== "HORIZONTAL") {
    // Figma throws: "Can only set layoutWrap = WRAP on nodes with layoutMode === HORIZONTAL"
    return false;
  }
  try {
    frame.layoutWrap = "WRAP";
    return true;
  } catch (error) {
    console.warn(`[DesignForge] Failed to set layoutWrap on "${frame.name}"`, error);
    return false;
  }
}

/**
 * Safely sets layoutPositioning = "ABSOLUTE".
 */
export function safeSetAbsolute(node: SceneNode): boolean {
  if (!("layoutPositioning" in node)) return false;
  if (!canUseAutoLayoutSizing(node)) {
    console.warn(
      `[DesignForge][Layout WARNING] Prevented setting layoutPositioning ABSOLUTE on "${
        node.name || node.type
      }" because parent "${node.parent?.name || "canvas"}" is not Auto Layout.`
    );
    safeSetAutoPositioning(node);
    return false;
  }
  try {
    (node as any).layoutPositioning = "ABSOLUTE";
    return true;
  } catch (error) {
    console.warn(`[DesignForge] Failed to set ABSOLUTE on "${node.name}"`, error);
    safeSetAutoPositioning(node);
    return false;
  }
}

/**
 * Safely sets layoutPositioning = "AUTO".
 */
export function safeSetAutoPositioning(node: SceneNode): boolean {
  if (!("layoutPositioning" in node)) return false;
  try {
    (node as any).layoutPositioning = "AUTO";
    return true;
  } catch (error) {
    return false;
  }
}

// ─── 2. SEMANTIC NODE CLASSIFICATION ─────────────────────────

export type AutoLayoutClassification =
  | "AUTO_LAYOUT_CONTAINER"
  | "FILL_CHILD"
  | "HUG_CHILD"
  | "FIXED_CHILD"
  | "ABSOLUTE_CHILD"
  | "TEXT"
  | "DECORATIVE";

export function classifyElement(node: any, parent: any): AutoLayoutClassification {
  if (!node) return "DECORATIVE";

  const typeLower = (node.type || "").toLowerCase();
  const nameLower = (node.name || "").toLowerCase();
  const roleLower = (node.role || "").toLowerCase();
  const position = node.style?.position || "";

  // 1. ABSOLUTE_CHILD
  if (position === "absolute" || position === "fixed" || nameLower.includes("glow") || nameLower.includes("decorative") || nameLower.includes("blob")) {
    return "ABSOLUTE_CHILD";
  }

  // 2. TEXT
  if (typeLower === "text") {
    return "TEXT";
  }

  // 3. DECORATIVE / VECTOR / ICON (FIXED)
  if (
    typeLower === "icon" ||
    node.iconName ||
    nameLower.includes("icon") ||
    typeLower === "svg" ||
    typeLower === "vector" ||
    typeLower === "ellipse" ||
    typeLower === "line" ||
    nameLower.includes("avatar") ||
    nameLower.includes("logo-icon") ||
    nameLower.includes("logomark") ||
    nameLower.includes("illustration") ||
    nameLower.includes("chart") ||
    nameLower.includes("graph") ||
    nameLower.includes("metric") ||
    nameLower.includes("divider") ||
    nameLower.includes("glow") ||
    nameLower.includes("blob") ||
    typeLower === "image" ||
    nameLower.includes("photo")
  ) {
    return "DECORATIVE";
  }

  // 4. HUG_CHILD (Content-driven items: pills, badges, buttons, links, tags)
  const isPillOrBadge =
    roleLower === "badge" ||
    roleLower === "pill" ||
    nameLower.includes("badge") ||
    nameLower.includes("pill") ||
    nameLower.includes("capsule") ||
    nameLower.includes("chip") ||
    nameLower.includes("tag") ||
    (node.style?.cornerRadius > 12 && node.bounds?.height < 36 && (node.bounds?.width || 0) < 200);

  const isButton =
    roleLower === "button" ||
    nameLower.includes("button") ||
    nameLower.includes("btn");

  const isNavLink =
    nameLower.includes("nav-item") ||
    nameLower.includes("nav-link") ||
    nameLower.includes("menu-item") ||
    nameLower.includes("logo");

  if (isPillOrBadge || isButton || isNavLink) {
    return "HUG_CHILD";
  }

  // 5. AUTO_LAYOUT_CONTAINER
  const hasChildren = node.children && node.children.length > 0;
  const isFlex = node.layout?.direction && node.layout?.direction !== "NONE";
  if (hasChildren && isFlex) {
    return "AUTO_LAYOUT_CONTAINER";
  }

  // 6. FILL_CHILD (Containers, main contents, sections, grid columns)
  const isContainer =
    nameLower.includes("container") ||
    nameLower.includes("wrapper") ||
    nameLower.includes("inner") ||
    nameLower.includes("content") ||
    nameLower.includes("section") ||
    nameLower.includes("hero") ||
    nameLower.includes("footer") ||
    nameLower.includes("main") ||
    nameLower.includes("preview-content") ||
    nameLower.includes("card") ||
    nameLower.includes("body");

  if (isContainer) {
    return "FILL_CHILD";
  }

  // Default fallback
  return "HUG_CHILD";
}

export function determineSizingBehavior(
  element: any,
  parent: any,
  computedStyle: any,
  children?: any[]
): {
  horizontal: "FILL" | "HUG" | "FIXED";
  vertical: "FILL" | "HUG" | "FIXED";
  reason: string;
} {
  const classification = classifyElement(element, parent);
  const parentLayoutMode = parent?.layout?.direction || "NONE";
  const parentIsAutoLayout = parentLayoutMode !== "NONE";

  const flexGrow = element.childLayout?.layoutGrow ?? (computedStyle?.flexGrow ?? 0);
  const cssWidth = computedStyle?.width || element.style?.width || "";
  const cssHeight = computedStyle?.height || element.style?.height || "";
  const nameLower = String(element.name || "").toLowerCase();

  const sourceWidth = element.bounds?.width || 0;
  const sourceHeight = element.bounds?.height || 0;
  const parentWidth = parent?.bounds?.width || 1440;
  const widthRatio = parentWidth > 0 ? sourceWidth / parentWidth : 1.0;

  const typeLower = (element.type || "").toLowerCase();
  const isVectorOrChart =
    typeLower === "vector" ||
    typeLower === "svg" ||
    typeLower === "image" ||
    element.svgContent !== undefined ||
    classification === "DECORATIVE";

  const cornerRadiusVal =
    typeof element.style?.cornerRadius === "number"
      ? element.style.cornerRadius
      : typeof element.style?.cornerRadius?.topLeft === "number"
      ? element.style.cornerRadius.topLeft
      : 0;

  const isCapsuleOrPillShape =
    cornerRadiusVal >= 12 || (sourceHeight > 0 && cornerRadiusVal >= sourceHeight / 2 - 4);
  const isSmallContainer =
    sourceWidth > 0 && sourceHeight > 0 && (sourceWidth <= 64 || (sourceWidth <= 120 && sourceHeight <= 120));

  let horizontal: "FILL" | "HUG" | "FIXED" = "FIXED";
  let vertical: "FILL" | "HUG" | "FIXED" = "HUG";
  let reason = "";

  // Sizing Horizontally:
  if (classification === "ABSOLUTE_CHILD") {
    horizontal = "FIXED";
    reason = "Absolute positioning child -> FIXED";
  } else if (isVectorOrChart) {
    if (cssWidth === "100%" && widthRatio > 0.85) {
      horizontal = "FILL";
      reason = "Vector/Chart with explicit 100% width -> FILL";
    } else {
      horizontal = "FIXED";
      reason = "Vector / SVG / Chart / Image -> FIXED (preserve internal geometry)";
    }
  } else if (cssWidth && cssWidth !== "auto" && !cssWidth.includes("%") && cssWidth !== "initial") {
    horizontal = "FIXED";
    reason = `Explicit CSS fixed width: ${cssWidth}`;
  } else if (parentIsAutoLayout) {
    const layoutAlign = element.childLayout?.layoutAlign;
    const isStretch = layoutAlign === "STRETCH" || element.style?.alignSelf === "stretch";
    const hasFlexGrow = flexGrow > 0 || (element.childLayout?.layoutGrow ?? 0) > 0;
    const parentIsWrapping = parent?.layout?.wrap === true;

    if (element.layout?.wrap === true) {
      // A wrapping container in Figma MUST have a FIXED width to define its wrap boundary.
      horizontal = "FIXED";
      reason = "Wrapping container -> FIXED width to enforce wrapping boundary";
    } else if (parentIsWrapping && parentLayoutMode === "HORIZONTAL") {
      // In Figma, children along the primary axis of a WRAP container CANNOT be FILL
      horizontal = sourceWidth > 0 ? "FIXED" : "HUG";
      reason = "Wrapping HORIZONTAL parent -> FIXED/HUG width to allow wrapping";
    } else if (sourceWidth >= 1000 && parentLayoutMode === "VERTICAL") {
      // Major desktop containers (e.g. mx-auto 1200px) in a VERTICAL section
      horizontal = widthRatio >= 0.85 ? "FILL" : "FIXED";
      reason = `Major content container (${sourceWidth}px) in VERTICAL parent -> ${horizontal}`;
    } else if (cssWidth === "100%") {
      horizontal = "FILL";
      reason = "Explicit CSS width: 100% inside Auto Layout";
    } else if (isStretch && parentLayoutMode === "VERTICAL") {
      horizontal = "FILL";
      reason = "layoutAlign STRETCH in VERTICAL parent -> FILL";
    } else if (nameLower.includes("card") || nameLower.includes("step") || nameLower.includes("feature-item") || nameLower.includes("tool")) {
      // In a horizontal row of cards (e.g. 3-step cards, tools grid), fill or keep fixed width
      if (parentLayoutMode === "HORIZONTAL" && !parentIsWrapping && (hasFlexGrow || (parent?.children?.length || 1) >= 2)) {
        horizontal = "FILL";
        reason = "Multi-column card row -> FILL";
      } else {
        horizontal = sourceWidth > 0 ? "FIXED" : "HUG";
        reason = "Card with explicit width -> FIXED";
      }
    } else if (hasFlexGrow && parentLayoutMode === "HORIZONTAL") {
      horizontal = "FILL";
      reason = "flex-grow > 0 in HORIZONTAL parent -> FILL";
    } else if (classification === "FILL_CHILD") {
      if (parentLayoutMode === "VERTICAL") {
        horizontal = "FILL";
        reason = "FILL_CHILD container in VERTICAL parent -> FILL";
      } else if (hasFlexGrow || widthRatio > 0.3) {
        horizontal = "FILL";
        reason = "FILL_CHILD in HORIZONTAL parent -> FILL";
      } else {
        horizontal = "HUG";
        reason = "FILL_CHILD fallback -> HUG";
      }
    } else if (hasFlexGrow && widthRatio > 0.2) {
      horizontal = "FILL";
      reason = "flex-grow > 0 with parent width ratio -> FILL";
    } else if (isCapsuleOrPillShape && widthRatio < 0.85) {
      horizontal = "HUG";
      reason = "Capsule / Pill shape with content-driven width -> HUG";
    } else if (isSmallContainer) {
      const hasBgOrBorder = (element.style?.fills?.length || 0) > 0 || (element.style?.strokes?.length || 0) > 0;
      if (hasBgOrBorder && Math.abs(sourceWidth - sourceHeight) <= 4) {
        horizontal = "FIXED";
        reason = "Square icon container with background/border -> FIXED to preserve shape";
      } else {
        horizontal = "HUG";
        reason = "Small compact container / icon group -> HUG";
      }
    } else if (widthRatio >= 0.85) {
      horizontal = "FILL";
      reason = `Full-width container (widthRatio: ${widthRatio.toFixed(2)} >= 0.85) -> FILL`;
    } else if (classification === "TEXT") {
      const content = String(element.text?.content || element.name || "");
      const isShortLabel = content.length < 25 && sourceHeight <= 30 && !nameLower.includes("p") && !nameLower.includes("desc");
      const isButtonOrBadgeChild = parent?.name?.toLowerCase().includes("btn") || parent?.name?.toLowerCase().includes("button") || parent?.name?.toLowerCase().includes("badge") || parent?.name?.toLowerCase().includes("pill");

      if (isButtonOrBadgeChild || (isShortLabel && widthRatio < 0.5 && !isStretch)) {
        horizontal = "HUG";
        reason = "Short content-sized label / button text -> HUG width";
      } else if (parentLayoutMode === "VERTICAL") {
        // In vertical Auto Layout, text must FILL container width so it wraps naturally!
        horizontal = "FILL";
        reason = "Text in VERTICAL container -> FILL width + auto wrap";
      } else if (hasFlexGrow || widthRatio >= 0.7) {
        horizontal = "FILL";
        reason = "Text with flex-grow or wide ratio in row -> FILL width";
      } else if (sourceWidth > 100 && (content.length > 25 || sourceHeight > 28)) {
        horizontal = "FIXED";
        reason = `Wrapped text with fixed width (${Math.round(sourceWidth)}px) -> FIXED width`;
      } else {
        horizontal = "HUG";
        reason = "Content-sized text -> HUG width";
      }
    } else if (widthRatio < 0.60) {
      horizontal = "HUG";
      reason = `Intrinsic content-sized element (widthRatio: ${widthRatio.toFixed(2)} < 0.60) -> HUG`;
    } else {
      horizontal = "HUG";
      reason = "Default to HUG for Auto Layout child";
    }
  } else {
    horizontal = "FIXED";
    reason = "Parent is not Auto Layout";
  }

  // Sizing Vertically:
  if (sourceHeight <= 4) {
    vertical = "FIXED";
  } else if (classification === "TEXT") {
    vertical = "HUG";
  } else if (classification === "ABSOLUTE_CHILD") {
    vertical = "FIXED";
  } else if (isVectorOrChart) {
    vertical = "FIXED";
  } else if (isSmallContainer && ((element.style?.fills?.length || 0) > 0 || (element.style?.strokes?.length || 0) > 0) && Math.abs(sourceWidth - sourceHeight) <= 4) {
    vertical = "FIXED";
  } else if (cssHeight && cssHeight !== "auto" && !cssHeight.includes("%") && cssHeight !== "initial") {
    vertical = "FIXED";
  } else if (parentIsAutoLayout) {
    const isStretchV = element.childLayout?.layoutAlign === "STRETCH" || element.style?.alignSelf === "stretch";
    const hasFlexGrowV = flexGrow > 0 || (element.childLayout?.layoutGrow ?? 0) > 0;
    // Full-width website sections (≥1200px) in a VERTICAL auto layout container should be FIXED height
    // so their browser-measured pixel heights are preserved. Without this they HUG and collapse.
    const isFullWidthWebSection = sourceWidth >= 1200 && parentLayoutMode === "VERTICAL";
    if (element.layout?.wrap === true) {
      // Wrapping containers dynamically grow to fit their wrapped rows
      vertical = "HUG";
    } else if (isStretchV && parentLayoutMode === "HORIZONTAL") {
      vertical = "FILL";
    } else if (hasFlexGrowV && parentLayoutMode === "VERTICAL" && (cssHeight === "100%" || cssHeight === "auto")) {
      vertical = "FILL";
    } else if (isFullWidthWebSection && sourceHeight > 50) {
      // For tall full-width sections, use FIXED to preserve their measured height
      vertical = "FIXED";
    } else {
      vertical = "HUG";
    }
  } else {
    vertical = "FIXED";
  }

  // Sizing safety validator pass before returning
  if (horizontal === "FILL" && (!parentIsAutoLayout || isVectorOrChart || classification === "ABSOLUTE_CHILD")) {
    if (!cssWidth.includes("%")) {
      horizontal = "FIXED";
    }
  }
  if (horizontal === "FILL" && parent?.layout?.wrap === true && parentLayoutMode === "HORIZONTAL") {
    horizontal = sourceWidth > 0 ? "FIXED" : "HUG";
  }
  if (vertical === "FILL" && (!parentIsAutoLayout || isVectorOrChart || classification === "ABSOLUTE_CHILD")) {
    vertical = "FIXED";
  }

  // Safety check for non-Auto Layout containers: a frame with layoutMode === "NONE" CANNOT HUG!
  const isSelfAutoLayout = classification === "TEXT" || (element.layout?.direction && element.layout.direction !== "NONE");
  if (!isSelfAutoLayout) {
    if (horizontal === "HUG") {
      horizontal = (parentIsAutoLayout && parentLayoutMode === "VERTICAL" && widthRatio >= 0.85) ? "FILL" : "FIXED";
    }
    if (vertical === "HUG") {
      vertical = "FIXED";
    }
  }

  const hAlign = (element.layout?.justifyContent || element.style?.textAlign || "MIN").toString().toUpperCase();
  const vAlign = (element.layout?.alignItems || "MIN").toString().toUpperCase();

  console.log(`[Layout Decision]
Node: ${element.name || element.type}
SourceWidth: ${sourceWidth}
SourceHeight: ${sourceHeight}
ParentWidth: ${parentWidth}
WidthRatio: ${widthRatio.toFixed(2)}
Sizing: ${horizontal}/${vertical}
HorizontalAlign: ${hAlign}
VerticalAlign: ${vAlign}
Reason: ${reason}`);

  return { horizontal, vertical, reason };
}

export function classifyNode(node: any): SemanticRole {
  if (!node) return "UNKNOWN";

  const nameLower = (node.name || "").toLowerCase();
  const roleLower = (node.role || "").toLowerCase();
  const typeLower = (node.type || "").toLowerCase();

  if (typeLower === "icon" || node.iconName || nameLower.includes("icon")) return "ICON";
  if (typeLower === "svg" || typeLower === "vector") return "SVG";

  const isPillOrBadge =
    roleLower === "badge" ||
    roleLower === "pill" ||
    nameLower.includes("badge") ||
    nameLower.includes("pill") ||
    nameLower.includes("capsule") ||
    nameLower.includes("chip") ||
    (node.style?.cornerRadius > 12 && node.bounds?.height < 36 && (node.bounds?.width || 0) < 200);
  if (isPillOrBadge) return "PILL";

  if (roleLower === "button" || nameLower.includes("button") || nameLower.includes("btn")) return "BUTTON";

  if (
    roleLower === "sidebar" ||
    nameLower.includes("sidebar") ||
    nameLower.includes("aside") ||
    nameLower.includes("nav-drawer")
  )
    return "SIDEBAR";

  if (nameLower.includes("dashboard") || nameLower.includes("preview-window")) return "DASHBOARD";

  if (
    roleLower === "header" ||
    roleLower === "nav" ||
    nameLower.includes("header") ||
    nameLower.includes("navbar") ||
    nameLower.includes("navigation")
  )
    return "NAVIGATION";
  if (nameLower.includes("nav-item") || nameLower.includes("nav-link") || nameLower.includes("menu-item"))
    return "NAV_ITEM";
  if (roleLower === "footer" || nameLower.includes("footer")) return "FOOTER";

  if (typeLower === "text") {
    if (
      nameLower.includes("h1") ||
      nameLower.includes("h2") ||
      nameLower.includes("h3") ||
      nameLower.includes("heading") ||
      nameLower.includes("title")
    )
      return "HEADING";
    return "TEXT";
  }

  if (
    nameLower.includes("card") ||
    nameLower.includes("feature-item") ||
    nameLower.includes("stat-item") ||
    nameLower.includes("testimonial")
  )
    return "CARD";
  if (nameLower.includes("grid") || nameLower.includes("cards-container") || nameLower.includes("features-grid"))
    return "CARD_GRID";

  if (typeLower === "image" || nameLower.includes("avatar") || nameLower.includes("photo")) return "IMAGE";
  if (nameLower.includes("chart") || nameLower.includes("graph") || nameLower.includes("metric")) return "CHART";

  if (roleLower === "root" || nameLower === "page" || nameLower === "document") return "PAGE";
  if (
    nameLower.includes("section") ||
    nameLower.includes("hero") ||
    nameLower.includes("cta") ||
    nameLower.includes("trusted")
  )
    return "SECTION";

  if (
    nameLower.includes("container") ||
    nameLower.includes("wrapper") ||
    nameLower.includes("inner") ||
    nameLower.includes("content")
  )
    return "CONTENT_CONTAINER";
  if (nameLower.includes("row")) return "ROW";
  if (nameLower.includes("column") || nameLower.includes("col")) return "COLUMN";

  return "UNKNOWN";
}

export function getResponsiveSizing(
  role: SemanticRole,
  node: any,
  parentDirection: "HORIZONTAL" | "VERTICAL",
  flexGrow: number,
  schemaH?: string,
  schemaV?: string
): { horizontal: "FIXED" | "HUG" | "FILL"; vertical: "FIXED" | "HUG" | "FILL"; reason: string } {
  if (role === "ICON" || role === "SVG" || role === "DECORATIVE") {
    return { horizontal: "FIXED", vertical: "FIXED", reason: "icon/svg -> FIXED" };
  }

  if (role === "SIDEBAR") {
    return { horizontal: "FIXED", vertical: "FILL", reason: "sidebar -> FIXED width, FILL height" };
  }

  if (role === "PILL" || role === "BADGE") {
    return { horizontal: "HUG", vertical: "HUG", reason: "pill/badge -> HUG width & height" };
  }

  if (role === "BUTTON") {
    return { horizontal: "HUG", vertical: "HUG", reason: "button -> HUG content + padding" };
  }

  if (role === "TEXT" || role === "HEADING" || role === "PARAGRAPH" || role === "NAV_ITEM") {
    return {
      horizontal: flexGrow > 0 && parentDirection === "HORIZONTAL" ? "FILL" : "HUG",
      vertical: "HUG",
      reason: "text -> HUG width (or FILL if flex-grow) & HUG height",
    };
  }

  if (role === "IMAGE") {
    if (schemaH === "FILL") {
      return { horizontal: "FILL", vertical: "FIXED", reason: "responsive image -> FILL width, FIXED height" };
    }
    return { horizontal: "FIXED", vertical: "FIXED", reason: "image -> FIXED preserve aspect ratio" };
  }

  if (role === "PAGE") {
    return { horizontal: "FILL", vertical: "HUG", reason: "page -> FILL width, HUG height" };
  }

  if (role === "SECTION" || role === "CONTENT_CONTAINER" || role === "CARD_GRID") {
    return { horizontal: "FILL", vertical: "HUG", reason: "section/container -> FILL width, HUG height" };
  }

  if (role === "CARD") {
    return { horizontal: "FILL", vertical: "HUG", reason: "card -> FILL width, HUG height" };
  }

  if (role === "ROW") {
    return { horizontal: "FILL", vertical: "HUG", reason: "row -> FILL width, HUG height" };
  }

  if (schemaH === "FILL" || schemaH === "HUG" || schemaH === "FILL") {
    const v = schemaV === "FILL" || schemaV === "HUG" || schemaV === "FIXED" ? (schemaV as any) : "HUG";
    return { horizontal: schemaH as any, vertical: v, reason: "schema-driven sizing" };
  }

  if (flexGrow > 0) {
    return {
      horizontal: parentDirection === "HORIZONTAL" ? "FILL" : "HUG",
      vertical: parentDirection === "VERTICAL" ? "FILL" : "HUG",
      reason: "flex-grow -> FILL in primary axis",
    };
  }

  return { horizontal: "FIXED", vertical: "FIXED", reason: "leaf element -> FIXED" };
}

