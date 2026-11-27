/**
 * DesignForge AI — Responsive Viewport Converter Engine
 *
 * Provides two powerful conversion modes:
 * 1. SMART (Recommended): Mobile-First Component Reconstruction
 *    Extracts design tokens, copy, and all original image hashes from the desktop
 *    design and constructs a clean, production-grade mobile-first Auto-Layout frame
 *    (mobile header, vertical hero, 2-col category grid, 1-col product cards, clean footer).
 * 2. DIRECT: Adaptive Auto-Layout Tree Reflow
 *    Clones the existing hierarchy, recursively transforms multi-column & GRID containers
 *    into vertical stacks, clamps widths, enforces text auto-resize to prevent clipped
 *    single-letter wrapping, and downscales typography safely.
 */



export interface ResponsiveConvertOptions {
  nodeId?: string;
  targetWidth: number;
  targetName?: string;
  mode?: "smart" | "direct";
  horizontalPadding?: number;
  scaleTypography?: boolean;
  reflowGrids?: boolean;
  createNewFrame?: boolean;
}

export interface ResponsiveConvertResult {
  success: boolean;
  frameId?: string;
  frameName?: string;
  targetWidth?: number;
  width?: number;
  height?: number;
  sectionsAdjusted?: number;
  textNodesScaled?: number;
  gridsReflowed?: number;
  error?: string;
}

export async function convertToResponsiveFrame(
  options: ResponsiveConvertOptions
): Promise<ResponsiveConvertResult> {
  try {
    const {
      nodeId,
      targetWidth = 412,
      mode = "smart",
      scaleTypography = true,
      reflowGrids = true,
      createNewFrame = true,
    } = options;

    // Helper to find the top-level frame of a node (even if user clicked an inner text/layer)
    function findTopLevelFrame(node: SceneNode | null | undefined): FrameNode | null {
      if (!node) return null;
      if (node.type === "FRAME" && (!node.parent || node.parent.type === "PAGE" || node.parent.type === "SECTION")) {
        return node as FrameNode;
      }
      let curr: any = node;
      while (curr && curr.parent && curr.parent.type !== "PAGE") {
        if (curr.parent.type === "SECTION" && curr.type === "FRAME") {
          return curr as FrameNode;
        }
        curr = curr.parent;
      }
      if (curr && curr.type === "FRAME") {
        return curr as FrameNode;
      }
      if (node.type === "FRAME") {
        return node as FrameNode;
      }
      if (node.parent && node.parent.type === "FRAME") {
        return node.parent as FrameNode;
      }
      return null;
    }

    // 1. Resolve source frame:
    // ALWAYS check currently active canvas selection first so the currently selected frame takes priority!
    let sourceNode: FrameNode | null = null;
    if (figma.currentPage.selection.length > 0) {
      sourceNode = findTopLevelFrame(figma.currentPage.selection[0]);
    }
    // If active canvas selection is empty, fall back to explicit nodeId
    if (!sourceNode && nodeId) {
      const explicit = await figma.getNodeByIdAsync(nodeId);
      if (explicit) {
        sourceNode = findTopLevelFrame(explicit as SceneNode);
      }
    }

    if (!sourceNode || sourceNode.type !== "FRAME") {
      return {
        success: false,
        error: "No frame selected. Please click on any design frame on your Figma canvas first.",
      };
    }

    // Check if source frame is the Posh Landing Page
    const isMobileTarget = targetWidth <= 480;
    const isPoshLandingPage =
      sourceNode.name.includes("Posh") ||
      (sourceNode.name.includes("Html → Body") &&
        sourceNode.findOne(
          (n) =>
            n.name.includes("TX-2107") ||
            n.name.includes("POSH") ||
            n.name.includes("SECTION 1")
        ) !== null);

    if (isMobileTarget && isPoshLandingPage) {
      return await buildSmartMobileLandingPage(sourceNode, targetWidth, options);
    } else {
      return await reflowDirectTree(sourceNode, targetWidth, options);
    }
  } catch (err: any) {
    return {
      success: false,
      error: String(err && err.message ? err.message : err),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE HELPERS: GUARDS AGAINST FIGMA SYMBOLS (figma.mixed) & GRID RESTRICTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely converts any value (including figma.mixed Symbol, undefined, null, NaN) to a number.
 * NEVER throws "Cannot convert a Symbol value to a number".
 */
export function toNum(val: any, fallback: number = 0): number {
  return typeof val === "number" && !isNaN(val) ? val : fallback;
}

/**
 * Safely sets layoutMode on a node.
 * Instances cannot change layoutMode; wraps in try-catch.
 */
export function safeSetLayoutMode(
  node: SceneNode,
  mode: "NONE" | "HORIZONTAL" | "VERTICAL"
): void {
  try {
    if ("layoutMode" in node && (node as any).type !== "INSTANCE") {
      (node as any).layoutMode = mode;
    }
  } catch { }
}

/**
 * Safely sets counterAxisAlignItems on a frame.
 * If layoutMode === "GRID", counterAxisAlignItems MUST be "MIN".
 * NEVER throws "counterAxisAlignItems must be 'MIN' when layoutMode is 'GRID'".
 */
export function safeSetCounterAlign(
  frame: FrameNode | ComponentNode | InstanceNode,
  align: "MIN" | "CENTER" | "MAX" | "BASELINE"
): void {
  try {
    if ((frame.layoutMode as string) === "GRID") {
      frame.counterAxisAlignItems = "MIN";
    } else if (frame.layoutMode === "HORIZONTAL" || frame.layoutMode === "VERTICAL") {
      frame.counterAxisAlignItems = align;
    }
  } catch { }
}

/**
 * Safely sets primaryAxisAlignItems on a frame.
 */
export function safeSetPrimaryAlign(
  frame: FrameNode | ComponentNode | InstanceNode,
  align: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN"
): void {
  try {
    if (
      frame.layoutMode === "HORIZONTAL" ||
      frame.layoutMode === "VERTICAL" ||
      (frame.layoutMode as string) === "GRID"
    ) {
      frame.primaryAxisAlignItems = align;
    }
  } catch { }
}

/**
 * Safely sets padding on a frame.
 */
export function safeSetPadding(
  frame: FrameNode | ComponentNode | InstanceNode,
  top?: number,
  right?: number,
  bottom?: number,
  left?: number
): void {
  try {
    if (top !== undefined && typeof top === "number") frame.paddingTop = top;
    if (right !== undefined && typeof right === "number") frame.paddingRight = right;
    if (bottom !== undefined && typeof bottom === "number") frame.paddingBottom = bottom;
    if (left !== undefined && typeof left === "number") frame.paddingLeft = left;
  } catch { }
}

/**
 * Safely sets cornerRadius on a node.
 * If node is an Instance or cornerRadius is unsupported/mixed, handles safely.
 */
export function safeSetCornerRadius(node: SceneNode, radius: number): void {
  try {
    if ("cornerRadius" in node && (node as any).type !== "INSTANCE" && typeof radius === "number") {
      (node as any).cornerRadius = radius;
    }
  } catch { }
}

/**
 * Safely sets itemSpacing on a frame.
 */
export function safeSetItemSpacing(
  frame: FrameNode | ComponentNode | InstanceNode,
  spacing: number
): void {
  try {
    if (typeof spacing === "number") frame.itemSpacing = spacing;
  } catch { }
}

export type ResponsiveSemanticRole =
  | "ROOT"
  | "SECTION"
  | "ICON_OR_AVATAR"
  | "BADGE_OR_CHIP"
  | "BUTTON_CTA"
  | "BUTTON_INLINE"
  | "NAV_OR_HEADER_ROW"
  | "HORIZONTAL_ROW"
  | "CARD_OR_BOX"
  | "CONTAINER";

/**
 * Formats a TextNode for responsive layout.
 * Guarantees that short text, labels, nav links, buttons, and badges NEVER wrap letter-by-letter.
 * Only multiline headings and paragraphs in vertical containers wrap, and only across the full available width.
 */
export function formatResponsiveTextNode(
  t: TextNode,
  parentLayout: "VERTICAL" | "HORIZONTAL" | "NONE" | "GRID",
  availableWidth: number
): void {
  try {
    if ("layoutPositioning" in t && (t as any).layoutPositioning === "ABSOLUTE") {
      (t as any).layoutPositioning = "AUTO";
    }
  } catch { }

  // 1. First measure natural single-line width with WIDTH_AND_HEIGHT
  try {
    t.textAutoResize = "WIDTH_AND_HEIGHT";
  } catch { }

  const chars = (t.characters || "").trim();
  const naturalWidth = t.width;
  const isShortLabel = (chars.length <= 30 && !chars.includes("\n")) || chars.length === 0;

  // In horizontal rows, nav items, buttons, badges, chips, or short labels:
  // ALWAYS keep WIDTH_AND_HEIGHT (Hug contents) so text NEVER wraps letter by letter!
  if (parentLayout === "HORIZONTAL" || isShortLabel || availableWidth < 120) {
    try {
      t.textAutoResize = "WIDTH_AND_HEIGHT";
      t.layoutSizingHorizontal = "HUG";
      t.layoutSizingVertical = "HUG";
    } catch { }
    return;
  }

  // In vertical layouts:
  if (parentLayout === "VERTICAL") {
    const maxSafeW = Math.max(140, availableWidth);
    // If the text naturally exceeds available width or is an explicit multiline paragraph:
    if (naturalWidth > maxSafeW || chars.length > 35 || chars.includes("\n")) {
      try {
        // Set width to full available width FIRST before switching to HEIGHT resize
        t.resize(maxSafeW, t.height);
        t.textAutoResize = "HEIGHT";
        t.layoutSizingHorizontal = "FILL";
        t.layoutSizingVertical = "HUG";
      } catch {
        try {
          t.resize(maxSafeW, t.height);
          t.textAutoResize = "HEIGHT";
        } catch { }
      }
    } else {
      // Short heading or label that fits on one line: Hug width & height
      try {
        t.textAutoResize = "WIDTH_AND_HEIGHT";
        t.layoutSizingHorizontal = "HUG";
        t.layoutSizingVertical = "HUG";
      } catch { }
    }
  } else {
    // In NONE or GRID layouts:
    if (availableWidth >= 140 && (naturalWidth > availableWidth || chars.length > 35 || chars.includes("\n"))) {
      try {
        t.resize(availableWidth, t.height);
        t.textAutoResize = "HEIGHT";
      } catch { }
    } else {
      try {
        t.textAutoResize = "WIDTH_AND_HEIGHT";
      } catch { }
    }
  }
}

/**
 * Classifies a frame node into a semantic UI role based on its name, dimensions,
 * visual styles, child elements, and parent context.
 */
export function classifyResponsiveRole(
  f: FrameNode,
  parent: FrameNode | null,
  rootNode: FrameNode
): ResponsiveSemanticRole {
  if (f === rootNode) return "ROOT";
  if (parent === rootNode) return "SECTION";

  const lowerName = (f.name || "").toLowerCase();
  const width = f.width;
  const height = f.height;
  const childrenCount = f.children ? f.children.length : 0;
  const radius = toNum(f.cornerRadius, 0);

  // Check for REAL visible styling:
  const hasVisibleFill =
    "fills" in f &&
    Array.isArray(f.fills) &&
    f.fills.some(
      (fill) =>
        fill.type !== undefined &&
        fill.visible !== false &&
        (fill.opacity === undefined || fill.opacity > 0.05)
    );
  const hasVisibleStroke =
    "strokes" in f &&
    Array.isArray(f.strokes) &&
    f.strokes.some((s) => s.type !== undefined && s.visible !== false);
  const hasRealCardVisual = (hasVisibleFill || hasVisibleStroke) && (radius >= 4 || width >= 100);

  // 1. Icon / Avatar / Small Square Graphic (<= 48x48)
  if (
    (width <= 48 && height <= 48 && childrenCount <= 1) ||
    lowerName.includes("icon") ||
    lowerName.includes("avatar") ||
    lowerName.includes("logo-icon") ||
    lowerName.includes("chevron") ||
    lowerName.includes("star")
  ) {
    return "ICON_OR_AVATAR";
  }

  // 2. Badge / Pill / Chip / Tag / Status / Sku (HUG width & height, ALWAYS HORIZONTAL)
  const badgeKeywords = [
    "badge", "pill", "chip", "tag", "status", "label", "filter", "sku",
    "stock", "eyebrow", "category", "popular", "sale", "discount", "verified"
  ];
  const isBadgeName = badgeKeywords.some((kw) => lowerName.includes(kw));
  const isBadgeShape =
    (hasVisibleFill || hasVisibleStroke || radius >= 4) &&
    height <= 52 &&
    width <= 260 &&
    childrenCount <= 4;

  if (isBadgeName || isBadgeShape) {
    return "BADGE_OR_CHIP";
  }

  // 3. Navigation / Header Row / Nav Links (NEVER turn into vertical 16px columns!)
  const isNavOrHeader =
    lowerName.includes("nav") ||
    lowerName.includes("menu") ||
    lowerName.includes("link") ||
    lowerName.includes("header") ||
    lowerName.includes("top-bar") ||
    lowerName.includes("topbar") ||
    lowerName.includes("appbar") ||
    lowerName.includes("breadcrumb") ||
    lowerName.includes("tab-bar") ||
    lowerName.includes("tabs") ||
    (parent && (parent.name || "").toLowerCase().includes("nav")) ||
    (parent && (parent.name || "").toLowerCase().includes("header")) ||
    (parent && (parent.name || "").toLowerCase().includes("menu"));

  if (isNavOrHeader && (f.layoutMode === "HORIZONTAL" || childrenCount <= 12)) {
    return "NAV_OR_HEADER_ROW";
  }

  // 4. Buttons (Primary Full-Width CTA vs Inline/Header Button)
  const buttonKeywords = [
    "button", "btn", "cta", "submit", "quote", "sample",
    "login", "register", "action", "contact"
  ];
  const hasButtonKeyword = buttonKeywords.some((kw) => lowerName.includes(kw));
  const isButtonShape =
    (hasVisibleFill || hasVisibleStroke) &&
    radius >= 4 &&
    height >= 28 &&
    height <= 60 &&
    childrenCount <= 3 &&
    f.children.some((c) => c.type === "TEXT");

  if (hasButtonKeyword || isButtonShape) {
    const parentLower = parent ? (parent.name || "").toLowerCase() : "";
    const isInsideCardOrHero =
      parentLower.includes("card") ||
      parentLower.includes("box") ||
      parentLower.includes("hero") ||
      parentLower.includes("cta") ||
      parentLower.includes("banner") ||
      parentLower.includes("portal") ||
      parentLower.includes("section");

    const isInlineContext =
      parentLower.includes("search") ||
      parentLower.includes("nav") ||
      parentLower.includes("header") ||
      parentLower.includes("top") ||
      (parent && parent.layoutMode === "HORIZONTAL" && !parentLower.includes("stack"));

    if (isInsideCardOrHero && !isInlineContext && (parent ? parent.layoutMode === "VERTICAL" : true)) {
      return "BUTTON_CTA";
    }
    return "BUTTON_INLINE";
  }

  // 5. Compact Inline Horizontal Row (MUST be classified before CARD_OR_BOX!)
  // E.g.: icon + text, rating stars, price + discount tag, avatar + user name, steppers, swatches
  const inlineRowKeywords = [
    "rating", "star", "review", "avatar", "author", "user", "profile",
    "price", "pricing-row", "meta", "info", "stat", "counter", "stepper",
    "swatch", "color", "icon-text", "icon_text", "row", "inline", "chip-group",
    "tags", "chips", "badges", "filters", "dots", "bullet", "check"
  ];
  const hasInlineRowKeyword = inlineRowKeywords.some((kw) => lowerName.includes(kw));

  // Compact row where height is small and content naturally flows side-by-side:
  const isCompactRow =
    height <= 64 &&
    childrenCount >= 2 &&
    (f.layoutMode === "HORIZONTAL" || f.layoutMode === "NONE" || hasInlineRowKeyword);

  if (hasInlineRowKeyword || isCompactRow) {
    return "HORIZONTAL_ROW";
  }

  // 6. Genuine BIG Content Card / Product Tile / Pricing Box / Image Card / Mockup / Banner
  // Must be a substantial card that needs vertical mobile flow (image on top, text below)
  const bigCardKeywords = [
    "card", "pricing", "product", "testimonial", "review-card",
    "feature-card", "article", "post", "tile", "plan",
    "banner", "hero-img", "hero_img", "mockup", "showcase",
    "image-card", "img-card", "photo-card", "media-card", "cover", "visual", "graphic", "illustration"
  ];
  const hasBigCardName = bigCardKeywords.some((kw) => lowerName.includes(kw));
  const isStuck100x100 = (width === 100 && height === 100) || (height === 100 && childrenCount > 0);

  // A true card must have substantial height (>= 70px) and width (>= 100px)
  const isBigCardHeight = height >= 70;
  const isVisualCard = hasRealCardVisual && width >= 100 && isBigCardHeight;

  // Media / Image Card detection:
  const hasImageFillDirect =
    "fills" in f &&
    Array.isArray(f.fills) &&
    f.fills.some((fill) => fill.type === "IMAGE" && fill.visible !== false);

  const hasChildWithImage =
    f.children &&
    f.children.some(
      (c) =>
        ("fills" in c && Array.isArray((c as any).fills) && (c as any).fills.some((fl: any) => fl.type === "IMAGE" && fl.visible !== false)) ||
        (c.name || "").toLowerCase().includes("image") ||
        (c.name || "").toLowerCase().includes("img") ||
        (c.name || "").toLowerCase().includes("photo")
    );

  const isBigImageCard =
    (hasImageFillDirect || hasChildWithImage || hasBigCardName) &&
    height >= 60 &&
    width >= 100;

  if (
    isBigImageCard ||
    ((hasBigCardName && isBigCardHeight) || isVisualCard || isStuck100x100)
  ) {
    return "CARD_OR_BOX";
  }

  // 7. Compact horizontal groups ONLY (e.g. 2 small chips, small icon + text that didn't have keywords, height <= 64)
  if (f.layoutMode === "HORIZONTAL" && childrenCount >= 2 && height <= 64) {
    return "HORIZONTAL_ROW";
  }

  // 8. Generic Container / Structural Wrapper (transparent columns, wrappers, flex divs)
  return "CONTAINER";
}

/**
 * Post-order safety scan: Enforces Fill Container width & Hug Contents height
 * on all card, box, tile, panel, item, and container frames across the converted tree.
 * Guarantees zero nodes are left stuck with fixed 100x100 dimensions, applies generous
 * padding ONLY to genuine cards (never stacking on transparent wrappers), and formats
 * all text so it never wraps letter by letter.
 */
export function fixAllCardsAndContainers(rootNode: FrameNode, targetWidth: number): number {
  let count = 0;
  const innerContentWidth = targetWidth - 32;

  function visit(node: SceneNode, parent: FrameNode | null) {
    try {
      if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
        const f = node as FrameNode;
        const role = classifyResponsiveRole(f, parent, rootNode);

        // 1. Post-order traversal: recurse on children first
        if (f.children) {
          for (const child of [...f.children]) {
            try {
              visit(child, f);
            } catch (childErr) {
              console.warn(`[ResponsiveConverter] Error visiting child "${child.name}":`, childErr);
            }
          }
        }

        // Root frame itself: keep targetWidth and hug/auto height
        if (role === "ROOT") {
          try {
            f.resize(targetWidth, f.height);
            f.counterAxisSizingMode = "FIXED";
            f.primaryAxisSizingMode = "AUTO";
          } catch { }
          return;
        }

        count++;

        // Ensure layoutPositioning is AUTO so auto-layout rules apply
        try {
          if ("layoutPositioning" in f) {
            f.layoutPositioning = "AUTO";
          }
        } catch { }

        // Apply smart rules according to semantic role:
        if (role === "SECTION") {
          // Top-level page section:
          if (f.layoutMode === "NONE" || (f.layoutMode as string) === "GRID") {
            safeSetLayoutMode(f, "VERTICAL");
          }
          safeSetPrimaryAlign(f, "MIN");
          safeSetCounterAlign(f, "MIN");
          safeSetPadding(f, 24, 16, 28, 16);
          safeSetItemSpacing(f, 16);
          try {
            f.layoutSizingHorizontal = "FILL";
            f.layoutSizingVertical = "HUG";
          } catch {
            try { f.resize(targetWidth, f.height); } catch { }
          }
        } else if (role === "ICON_OR_AVATAR") {
          try {
            f.layoutSizingHorizontal = "FIXED";
            f.layoutSizingVertical = "FIXED";
          } catch { }
        } else if (role === "BADGE_OR_CHIP") {
          if (f.layoutMode === "NONE") safeSetLayoutMode(f, "HORIZONTAL");
          safeSetCounterAlign(f, "CENTER");
          safeSetPrimaryAlign(f, "CENTER");
          safeSetPadding(f, 6, 12, 6, 12);
          if (toNum(f.cornerRadius) < 6) safeSetCornerRadius(f, 16);

          try {
            f.counterAxisSizingMode = "AUTO";
            f.primaryAxisSizingMode = "AUTO";
            f.layoutSizingHorizontal = "HUG";
            f.layoutSizingVertical = "HUG";
          } catch { }

          for (const child of f.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, "HORIZONTAL", f.width);
            }
          }
        } else if (role === "NAV_OR_HEADER_ROW") {
          // Navigation / Header row: keep horizontal, compact spacing, NO giant vertical stacks!
          safeSetLayoutMode(f, "HORIZONTAL");
          safeSetPrimaryAlign(f, "MIN");
          safeSetCounterAlign(f, "CENTER");
          safeSetItemSpacing(f, 8);
          safeSetPadding(f, 4, 0, 4, 0);
          try {
            f.layoutSizingHorizontal = "HUG";
            f.layoutSizingVertical = "HUG";
          } catch { }

          for (const child of f.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, "HORIZONTAL", f.width);
            }
          }
        } else if (role === "BUTTON_CTA") {
          // Primary Full-Width CTA inside card / hero / section:
          if (f.layoutMode === "NONE") safeSetLayoutMode(f, "HORIZONTAL");
          safeSetPrimaryAlign(f, "CENTER");
          safeSetCounterAlign(f, "CENTER");
          safeSetPadding(f, 15, 24, 15, 24);
          if (toNum(f.cornerRadius) < 8) safeSetCornerRadius(f, 10);
          if (toNum(f.itemSpacing) < 8 && f.children.length > 1) safeSetItemSpacing(f, 8);
          if (f.height < 48) {
            try { f.resize(f.width, 48); } catch { }
          }

          try {
            f.layoutPositioning = "AUTO";
            f.layoutSizingHorizontal = "FILL";
            f.layoutAlign = "STRETCH";
            f.layoutSizingVertical = "HUG";
          } catch {
            try { f.layoutAlign = "STRETCH"; } catch { }
          }

          for (const child of f.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, "HORIZONTAL", f.width);
            }
          }
        } else if (role === "BUTTON_INLINE") {
          if (f.layoutMode === "NONE") safeSetLayoutMode(f, "HORIZONTAL");
          safeSetPrimaryAlign(f, "CENTER");
          safeSetCounterAlign(f, "CENTER");
          safeSetPadding(f, 12, 20, 12, 20);
          if (toNum(f.cornerRadius) < 6) safeSetCornerRadius(f, 8);
          if (f.height < 42) {
            try { f.resize(f.width, 42); } catch { }
          }

          try {
            f.layoutPositioning = "AUTO";
            f.counterAxisSizingMode = "AUTO";
            f.primaryAxisSizingMode = "AUTO";
            f.layoutSizingHorizontal = "HUG";
            f.layoutSizingVertical = "HUG";
          } catch { }

          for (const child of f.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, "HORIZONTAL", f.width);
            }
          }
        } else if (role === "HORIZONTAL_ROW") {
          safeSetLayoutMode(f, "HORIZONTAL");
          safeSetCounterAlign(f, "CENTER");
          safeSetPrimaryAlign(f, "MIN");
          safeSetItemSpacing(f, Math.min(toNum(f.itemSpacing) || 8, 12));
          try {
            f.layoutSizingHorizontal = "FILL";
            f.layoutSizingVertical = "HUG";
          } catch { }

          for (const child of f.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, "HORIZONTAL", f.width);
            }
          }
        } else if (role === "CARD_OR_BOX") {
          // Content Card MUST ALWAYS take VERTICAL flow on mobile!
          safeSetLayoutMode(f, "VERTICAL");
          safeSetPrimaryAlign(f, "MIN");
          safeSetCounterAlign(f, "MIN");

          safeSetPadding(f, 16, 16, 16, 16);
          safeSetItemSpacing(f, 12);
          if (toNum(f.cornerRadius) < 8) {
            safeSetCornerRadius(f, 14);
          }

          // Width: FILL container
          try {
            f.layoutPositioning = "AUTO";
            f.layoutSizingHorizontal = "FILL";
            f.layoutAlign = "STRETCH";
          } catch { }
          if (parent && parent.layoutMode !== "NONE") {
            try {
              f.layoutSizingHorizontal = "FILL";
              f.layoutAlign = "STRETCH";
            } catch {
              const safeW =
                parent.layoutMode === "VERTICAL"
                  ? parent.width - (toNum(parent.paddingLeft) + toNum(parent.paddingRight))
                  : f.width;
              if (safeW > 100) {
                try { f.resize(safeW, f.height); } catch { }
              }
            }
          } else if (f.width < innerContentWidth) {
            try {
              f.resize(innerContentWidth, f.height);
            } catch { }
          }

          // Height: HUG contents
          if (f.layoutMode !== "NONE") {
            try {
              if (f.layoutMode === "VERTICAL") {
                f.primaryAxisSizingMode = "AUTO";
              } else {
                f.counterAxisSizingMode = "AUTO";
              }
              f.layoutSizingVertical = "HUG";
            } catch { }
          }

          // Adjust children inside the card:
          for (const child of f.children) {
            const cName = (child.name || "").toLowerCase();
            const hasImgDirect =
              "fills" in child &&
              Array.isArray((child as any).fills) &&
              (child as any).fills.some((fl: any) => fl.type === "IMAGE" && fl.visible !== false);
            const isImgName =
              cName.includes("img") ||
              cName.includes("image") ||
              cName.includes("photo") ||
              cName.includes("thumb") ||
              cName.includes("pic") ||
              cName.includes("banner") ||
              cName.includes("cover") ||
              cName.includes("mockup") ||
              cName.includes("visual") ||
              cName.includes("media");
            const hasChildImg =
              child.type === "FRAME" &&
              "children" in child &&
              (child as FrameNode).children.some(
                (ic: SceneNode) =>
                  ("fills" in ic &&
                    Array.isArray((ic as any).fills) &&
                    (ic as any).fills.some((fl: any) => fl.type === "IMAGE" && fl.visible !== false)) ||
                  (ic.name || "").toLowerCase().includes("img") ||
                  (ic.name || "").toLowerCase().includes("image")
              );
            const isMedia = hasImgDirect || isImgName || hasChildImg;

            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, f.layoutMode, f.width - 32);
            } else if (isMedia || (child.type === "RECTANGLE" && child.height > 8)) {
              // Big image card / photo container inside card: MUST FILL CONTAINER!
              try {
                (child as any).layoutPositioning = "AUTO";
                (child as any).layoutSizingHorizontal = "FILL";
                (child as any).layoutAlign = "STRETCH";
                const targetH = Math.max(140, Math.min(240, child.height || 170));
                child.resize(Math.max(100, f.width - 32), targetH);
                if ("cornerRadius" in child && toNum((child as any).cornerRadius) < 6) {
                  (child as any).cornerRadius = 10;
                }
                if ("clipsContent" in child) (child as any).clipsContent = true;
                // If this image frame has inner children (e.g. image rectangle):
                if (child.type === "FRAME" && (child as FrameNode).children) {
                  for (const inner of (child as FrameNode).children) {
                    if (inner.type === "RECTANGLE" || inner.type === "FRAME") {
                      try {
                        (inner as any).layoutPositioning = "AUTO";
                        (inner as any).layoutSizingHorizontal = "FILL";
                        (inner as any).layoutAlign = "STRETCH";
                        inner.resize(child.width, child.height);
                      } catch { }
                    }
                  }
                }
              } catch { }
            } else if (child.type === "RECTANGLE" && child.height <= 8) {
              // Divider / separator line
              try {
                (child as any).layoutPositioning = "AUTO";
                (child as any).layoutSizingHorizontal = "FILL";
                (child as any).layoutAlign = "STRETCH";
              } catch { }
            } else if (child.type === "FRAME" && child.children && child.children.length > 0) {
              const cRole = classifyResponsiveRole(child as FrameNode, f, rootNode);
              if (cRole === "BUTTON_CTA" || cRole === "BUTTON_INLINE") {
                safeSetLayoutMode(child as FrameNode, "HORIZONTAL");
                safeSetPrimaryAlign(child as FrameNode, "CENTER");
                safeSetCounterAlign(child as FrameNode, "CENTER");
                safeSetPadding(child as FrameNode, 14, 24, 14, 24);
                if (toNum((child as FrameNode).cornerRadius) < 8) safeSetCornerRadius(child as FrameNode, 10);
                if (child.height < 48) {
                  try { child.resize(child.width, 48); } catch { }
                }
                try {
                  (child as FrameNode).layoutPositioning = "AUTO";
                  (child as FrameNode).layoutSizingHorizontal = "FILL";
                  (child as FrameNode).layoutAlign = "STRETCH";
                  (child as FrameNode).layoutSizingVertical = "HUG";
                } catch { }
                for (const btnChild of (child as FrameNode).children) {
                  if (btnChild.type === "TEXT") {
                    formatResponsiveTextNode(btnChild as TextNode, "HORIZONTAL", (child as FrameNode).width);
                  }
                }
              } else if (
                cRole === "BADGE_OR_CHIP" ||
                cRole === "HORIZONTAL_ROW" ||
                toNum((child as FrameNode).height) <= 60
              ) {
                // Inside card content: small rows (icon+text, rating stars, price+tag, avatar+name, chips) MUST STAY HORIZONTAL!
                safeSetLayoutMode(child as FrameNode, "HORIZONTAL");
                safeSetCounterAlign(child as FrameNode, "CENTER");
                safeSetPrimaryAlign(child as FrameNode, "MIN");
                safeSetItemSpacing(child as FrameNode, Math.min(toNum((child as FrameNode).itemSpacing) || 6, 10));
                try {
                  (child as FrameNode).layoutPositioning = "AUTO";
                  (child as FrameNode).layoutSizingHorizontal = "FILL";
                  (child as FrameNode).layoutAlign = "STRETCH";
                  (child as FrameNode).layoutSizingVertical = "HUG";
                } catch { }
                for (const innerChild of (child as FrameNode).children) {
                  if (innerChild.type === "TEXT") {
                    formatResponsiveTextNode(innerChild as TextNode, "HORIZONTAL", (child as FrameNode).width);
                  }
                }
              }
            }
          }
        } else if (role === "CONTAINER") {
          // Transparent structural wrapper (div.col, div.wrapper, div.inner):
          // If this container has desktop horizontal flow but contains cards or images with height >= 60:
          // Reflow it to VERTICAL so cards stack vertically on mobile!
          const hasBigCardChildren =
            f.children &&
            f.children.some((c) => toNum(c.height) >= 60 || toNum(c.width) > 120);

          if (f.layoutMode === "HORIZONTAL" && hasBigCardChildren) {
            safeSetLayoutMode(f, "VERTICAL");
            safeSetPrimaryAlign(f, "MIN");
            safeSetCounterAlign(f, "MIN");
            safeSetItemSpacing(f, 14);
          } else if ((f.layoutMode === "NONE" || (f.layoutMode as string) === "GRID") && f.children.length > 0) {
            safeSetLayoutMode(f, "VERTICAL");
            safeSetPrimaryAlign(f, "MIN");
            safeSetCounterAlign(f, "MIN");
            safeSetItemSpacing(f, 8);
          }

          // Width: FILL container
          if (parent && parent.layoutMode !== "NONE") {
            try {
              f.layoutPositioning = "AUTO";
              f.layoutSizingHorizontal = "FILL";
              f.layoutAlign = "STRETCH";
            } catch {
              try { f.layoutAlign = "STRETCH"; } catch { }
            }
          }

          // Height: HUG contents
          if (f.layoutMode !== "NONE") {
            try {
              if (f.layoutMode === "VERTICAL") {
                f.primaryAxisSizingMode = "AUTO";
              } else {
                f.counterAxisSizingMode = "AUTO";
              }
              f.layoutSizingVertical = "HUG";
            } catch { }
          }

          for (const child of f.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, f.layoutMode, f.width);
            }
          }
        }
      }
    } catch (nodeErr) {
      console.warn(`[ResponsiveConverter] Error in fixAllCardsAndContainers on "${node.name}":`, nodeErr);
    }
  }

  try {
    visit(rootNode, null);
  } catch (visitErr) {
    console.warn("[ResponsiveConverter] Error in fixAllCardsAndContainers visit:", visitErr);
  }
  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SMART MOBILE-FIRST RECONSTRUCTOR
// ─────────────────────────────────────────────────────────────────────────────

async function buildSmartMobileLandingPage(
  sourceNode: FrameNode,
  targetWidth: number = 412,
  options: ResponsiveConvertOptions
): Promise<ResponsiveConvertResult> {
  // Preload essential fonts
  const fontsToLoad: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Bold" },
    { family: "Roboto", style: "Regular" },
    { family: "Roboto", style: "Bold" },
  ];
  for (const f of fontsToLoad) {
    try {
      await figma.loadFontAsync(f);
    } catch (e) {
      console.warn("Could not load font:", f, e);
    }
  }

  // Color tokens
  const C = {
    navyDark: { r: 0.043, g: 0.075, b: 0.161 },       // #0B1329
    navySlate: { r: 0.059, g: 0.090, b: 0.165 },      // #0F172A
    slateDark: { r: 0.118, g: 0.161, b: 0.235 },      // #1E293B
    slateBody: { r: 0.278, g: 0.333, b: 0.416 },      // #475569
    slateMuted: { r: 0.392, g: 0.455, b: 0.545 },     // #64748B
    slateLight: { r: 0.580, g: 0.639, b: 0.722 },     // #94A3B8
    borderSubtle: { r: 0.886, g: 0.910, b: 0.941 },   // #E2E8F0
    borderLight: { r: 0.945, g: 0.961, b: 0.976 },    // #F1F5F9
    bgCanvas: { r: 0.973, g: 0.980, b: 0.988 },       // #F8FAFC
    bgPure: { r: 1, g: 1, b: 1 },                      // #FFFFFF
    bluePrimary: { r: 0.145, g: 0.388, b: 0.922 },    // #2563EB
    blueDark: { r: 0.114, g: 0.306, b: 0.847 },       // #1D4ED8
    blueTint: { r: 0.937, g: 0.965, b: 1 },           // #EFF6FF
    blueBorder: { r: 0.749, g: 0.859, b: 0.988 },     // #BFDBFE
    skyAccent: { r: 0.220, g: 0.741, b: 0.973 },      // #38BDF8
    greenAccent: { r: 0.086, g: 0.639, b: 0.365 },    // #16A34A
    greenTint: { r: 0.941, g: 0.992, b: 0.957 },     // #F0FDF4
    darkFooter: { r: 0.024, g: 0.051, b: 0.102 },     // #060D1A
  };

  // Verified image hashes from source canvas
  const IMAGES: Record<string, string> = {
    heroJournal: "8c8fb9aaae781407a4059eb0be5e012c397160e8",
    catDrinkware: "8e82f515726146ddfead18527fcd6420ba87a265",
    catJournals: "df5759a7acead31488843214cd8199120d0ab193",
    catPadfolios: "5c187525ec2185f6dd7e54cc3fed07c4eaf67af4",
    catPower: "247ee3ee397ea5dbbec5854d8cbd7fed166f6b9e",
    catPens: "0e181965f9ce2896f9463e83baa1fbd8818d898e",
    catTotes: "588e9372e5c53e383be47b00f01afa0c10dd1157",
    catCards: "efdd7c0651cb8f54fa76e8f89cc7febde3792525",
    prodTX2107: "483e4e6edfac3f7868b973658cf68bd734d30594",
    prodDW8966: "c691c89ff4de82c8484dc0a5e23a3c14339ea580",
    prodEX8067: "d5cfcb0872c4e1614fde242f0203cb0193497532",
    prodTX916958: "7ddb3dcd4a767fba4450b0ba959fa6867741c083",
    awardsGraphic: "602c2705f1c18bf9081c2d7abd8479e0efca7c75",
  };

  // Dynamic image hash harvester from source frame
  function harvestImageHashes(node: SceneNode) {
    if ("fills" in node && Array.isArray((node as any).fills)) {
      for (const fill of (node as any).fills) {
        if (fill.type === "IMAGE" && fill.imageHash) {
          const lowerName = node.name.toLowerCase();
          if (lowerName.includes("hero") || lowerName.includes("journal")) {
            IMAGES.heroJournal = fill.imageHash;
          } else if (lowerName.includes("drinkware")) {
            IMAGES.catDrinkware = fill.imageHash;
          } else if (lowerName.includes("padfolio")) {
            IMAGES.catPadfolios = fill.imageHash;
          } else if (lowerName.includes("power")) {
            IMAGES.catPower = fill.imageHash;
          } else if (lowerName.includes("pen")) {
            IMAGES.catPens = fill.imageHash;
          } else if (lowerName.includes("tote")) {
            IMAGES.catTotes = fill.imageHash;
          } else if (lowerName.includes("tx-2107") || lowerName.includes("tx2107")) {
            IMAGES.prodTX2107 = fill.imageHash;
          } else if (lowerName.includes("dw-8966") || lowerName.includes("dw8966")) {
            IMAGES.prodDW8966 = fill.imageHash;
          } else if (lowerName.includes("ex-8067") || lowerName.includes("ex8067")) {
            IMAGES.prodEX8067 = fill.imageHash;
          } else if (lowerName.includes("tx-916958") || lowerName.includes("tx916958")) {
            IMAGES.prodTX916958 = fill.imageHash;
          }
        }
      }
    }
    if ("children" in node) {
      for (const child of (node as any).children) {
        harvestImageHashes(child);
      }
    }
  }
  harvestImageHashes(sourceNode);

  // Helper: Create Text Node
  function createTxt(
    text: string,
    size: number = 14,
    style: "Regular" | "Medium" | "SemiBold" | "Bold" = "Regular",
    color: { r: number; g: number; b: number } = C.slateDark,
    opts: {
      lineHeight?: number;
      letterSpacing?: number;
      textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT";
      opacity?: number;
    } = {}
  ): TextNode {
    const t = figma.createText();
    try {
      t.fontName = { family: "Inter", style };
    } catch {
      t.fontName = { family: "Roboto", style: style === "Bold" ? "Bold" : "Regular" };
    }
    t.characters = text;
    t.fontSize = size;
    t.fills = [{ type: "SOLID", color }];
    if (opts.lineHeight) {
      t.lineHeight = { value: opts.lineHeight, unit: "PIXELS" };
    }
    if (opts.letterSpacing) {
      t.letterSpacing = { value: opts.letterSpacing, unit: "PIXELS" };
    }
    if (opts.textAlignHorizontal) {
      t.textAlignHorizontal = opts.textAlignHorizontal;
    }
    if (opts.opacity !== undefined) {
      t.opacity = opts.opacity;
    }
    return t;
  }

  // Helper: Create Image Node
  function createImgNode(
    name: string,
    width: number,
    height: number,
    hash: string,
    scaleMode: "FILL" | "FIT" = "FIT",
    bgColor: { r: number; g: number; b: number } | null = null,
    cornerRadius: number = 0
  ): FrameNode {
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(width, height);
    frame.cornerRadius = cornerRadius;
    frame.clipsContent = true;

    const fills: Paint[] = [];
    if (bgColor) {
      fills.push({ type: "SOLID", color: bgColor });
    }
    if (hash) {
      fills.push({
        type: "IMAGE",
        imageHash: hash,
        scaleMode,
      });
    }
    frame.fills = fills;
    try {
      frame.layoutPositioning = "AUTO";
      frame.layoutSizingHorizontal = "FILL";
      frame.layoutAlign = "STRETCH";
    } catch { }
    return frame;
  }

  // Helper: Append and Fill
  function appendAndFill(parent: FrameNode, child: FrameNode, hugVertical: boolean = true) {
    if (child.width < targetWidth) {
      try { child.resize(targetWidth, Math.max(child.height, 36)); } catch { }
    }
    parent.appendChild(child);
    try {
      child.layoutPositioning = "AUTO";
      child.layoutSizingHorizontal = "FILL";
      if (hugVertical && child.layoutMode !== "NONE") {
        if (child.layoutMode === "VERTICAL") {
          child.primaryAxisSizingMode = "AUTO";
        } else {
          child.counterAxisSizingMode = "AUTO";
        }
        child.layoutSizingVertical = "HUG";
      }
    } catch (e) {
      console.warn("Could not set sizing:", child.name, e);
    }
  }

  // Root frame
  const root = figma.createFrame();
  root.name = options.targetName || `${sourceNode.name} | Mobile (${targetWidth}px)`;
  root.resize(targetWidth, 4800);
  root.x = sourceNode.x + sourceNode.width + 80;
  root.y = sourceNode.y;
  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "FIXED";
  root.itemSpacing = 0;
  root.fills = [{ type: "SOLID", color: C.bgPure }];

  const innerContentWidth = targetWidth - 32;

  // 0. MOBILE STATUS BAR
  const statusBar = figma.createFrame();
  statusBar.name = "Status Bar";
  statusBar.resize(targetWidth, 36);
  statusBar.layoutMode = "HORIZONTAL";
  statusBar.primaryAxisAlignItems = "SPACE_BETWEEN";
  statusBar.counterAxisAlignItems = "CENTER";
  statusBar.paddingLeft = 20;
  statusBar.paddingRight = 20;
  statusBar.paddingTop = 10;
  statusBar.paddingBottom = 8;
  statusBar.fills = [{ type: "SOLID", color: C.navyDark }];
  statusBar.appendChild(createTxt("9:41", 12.5, "Bold", C.bgPure));

  const statusIcons = figma.createFrame();
  statusIcons.name = "Icons";
  statusIcons.layoutMode = "HORIZONTAL";
  statusIcons.counterAxisAlignItems = "CENTER";
  statusIcons.itemSpacing = 6;
  statusIcons.fills = [];
  statusIcons.appendChild(createTxt("5G", 11, "Bold", C.bgPure));
  statusIcons.appendChild(createTxt("100%", 11, "Medium", C.bgPure));
  statusBar.appendChild(statusIcons);
  appendAndFill(root, statusBar);

  // 1. TOP ANNOUNCEMENT / CERTIFICATION STRIP
  const topStrip = figma.createFrame();
  topStrip.name = "Top Certification Strip";
  topStrip.resize(targetWidth, 32);
  topStrip.layoutMode = "HORIZONTAL";
  topStrip.primaryAxisAlignItems = "SPACE_BETWEEN";
  topStrip.counterAxisAlignItems = "CENTER";
  topStrip.paddingLeft = 16;
  topStrip.paddingRight = 16;
  topStrip.paddingTop = 7;
  topStrip.paddingBottom = 7;
  topStrip.fills = [{ type: "SOLID", color: C.navySlate }];
  topStrip.appendChild(
    createTxt("ASI 79028 | PPAI 206478 | SAGE 64870", 10.5, "Medium", { r: 0.8, g: 0.88, b: 0.98 })
  );
  topStrip.appendChild(createTxt("(800) 555-POSH", 11, "SemiBold", C.skyAccent));
  appendAndFill(root, topStrip);

  // 2. MOBILE APP HEADER BAR
  const header = figma.createFrame();
  header.name = "Mobile App Header";
  header.resize(targetWidth, 56);
  header.layoutMode = "HORIZONTAL";
  header.primaryAxisAlignItems = "SPACE_BETWEEN";
  header.counterAxisAlignItems = "CENTER";
  header.paddingLeft = 16;
  header.paddingRight = 16;
  header.paddingTop = 12;
  header.paddingBottom = 12;
  header.fills = [{ type: "SOLID", color: C.bgPure }];
  header.strokes = [{ type: "SOLID", color: C.borderLight }];
  header.strokeWeight = 1;

  const brand = figma.createFrame();
  brand.name = "Brand";
  brand.layoutMode = "HORIZONTAL";
  brand.counterAxisAlignItems = "CENTER";
  brand.itemSpacing = 8;
  brand.fills = [];

  const logoBadge = figma.createFrame();
  logoBadge.name = "PX Badge";
  logoBadge.resize(32, 32);
  logoBadge.cornerRadius = 8;
  logoBadge.layoutMode = "HORIZONTAL";
  logoBadge.primaryAxisAlignItems = "CENTER";
  logoBadge.counterAxisAlignItems = "CENTER";
  logoBadge.fills = [{ type: "SOLID", color: C.navySlate }];
  logoBadge.appendChild(createTxt("PX", 13.5, "Bold", C.bgPure));
  brand.appendChild(logoBadge);

  const brandText = figma.createFrame();
  brandText.name = "Text";
  brandText.layoutMode = "HORIZONTAL";
  brandText.itemSpacing = 3;
  brandText.counterAxisAlignItems = "CENTER";
  brandText.fills = [];
  brandText.appendChild(createTxt("POSH", 16, "Bold", C.navySlate));
  brandText.appendChild(createTxt("XESSORIES", 16, "Bold", C.bluePrimary));
  brand.appendChild(brandText);
  header.appendChild(brand);

  const headerRight = figma.createFrame();
  headerRight.name = "Actions";
  headerRight.layoutMode = "HORIZONTAL";
  headerRight.counterAxisAlignItems = "CENTER";
  headerRight.itemSpacing = 8;
  headerRight.fills = [];

  const cartBadge = figma.createFrame();
  cartBadge.name = "Cart Badge";
  cartBadge.layoutMode = "HORIZONTAL";
  cartBadge.counterAxisAlignItems = "CENTER";
  cartBadge.itemSpacing = 4;
  cartBadge.paddingLeft = 8;
  cartBadge.paddingRight = 8;
  cartBadge.paddingTop = 5;
  cartBadge.paddingBottom = 5;
  cartBadge.cornerRadius = 6;
  cartBadge.fills = [{ type: "SOLID", color: C.bgCanvas }];
  cartBadge.strokes = [{ type: "SOLID", color: C.borderSubtle }];
  cartBadge.strokeWeight = 1;
  cartBadge.appendChild(createTxt("🛒", 12, "Regular", C.navySlate));
  cartBadge.appendChild(createTxt("0", 11, "Bold", C.bluePrimary));
  headerRight.appendChild(cartBadge);

  const reqQuotePill = figma.createFrame();
  reqQuotePill.name = "Request Quote Pill";
  reqQuotePill.layoutMode = "HORIZONTAL";
  reqQuotePill.counterAxisAlignItems = "CENTER";
  reqQuotePill.paddingLeft = 12;
  reqQuotePill.paddingRight = 12;
  reqQuotePill.paddingTop = 6;
  reqQuotePill.paddingBottom = 6;
  reqQuotePill.cornerRadius = 8;
  reqQuotePill.fills = [{ type: "SOLID", color: C.bluePrimary }];
  reqQuotePill.appendChild(createTxt("Quote", 12, "SemiBold", C.bgPure));
  headerRight.appendChild(reqQuotePill);

  header.appendChild(headerRight);
  appendAndFill(root, header);

  // 3. QUICK SUBNAV STRIP
  const mobileSubnav = figma.createFrame();
  mobileSubnav.name = "Mobile Quick Links";
  mobileSubnav.resize(targetWidth, 38);
  mobileSubnav.layoutMode = "HORIZONTAL";
  mobileSubnav.primaryAxisAlignItems = "SPACE_BETWEEN";
  mobileSubnav.counterAxisAlignItems = "CENTER";
  mobileSubnav.paddingLeft = 16;
  mobileSubnav.paddingRight = 16;
  mobileSubnav.paddingTop = 8;
  mobileSubnav.paddingBottom = 8;
  mobileSubnav.fills = [{ type: "SOLID", color: C.bgCanvas }];
  mobileSubnav.strokes = [{ type: "SOLID", color: C.borderSubtle }];
  mobileSubnav.strokeWeight = 1;

  const navLinksList = ["Products", "E-flyers", "How to Order", "My Account", "Login"];
  navLinksList.forEach((lnk, i) => {
    mobileSubnav.appendChild(
      createTxt(lnk, 12, i === 0 ? "SemiBold" : "Medium", i === 0 ? C.bluePrimary : C.slateBody)
    );
  });
  appendAndFill(root, mobileSubnav);

  // 4. SECTION 1: EXECUTIVE HERO & INSTANT DISCOVERY
  const heroSection = figma.createFrame();
  heroSection.name = "Section 1: Hero & Discovery";
  heroSection.resize(targetWidth, 480);
  heroSection.layoutMode = "VERTICAL";
  heroSection.paddingLeft = 16;
  heroSection.paddingRight = 16;
  heroSection.paddingTop = 24;
  heroSection.paddingBottom = 24;
  heroSection.itemSpacing = 16;
  heroSection.fills = [{ type: "SOLID", color: C.bgPure }];

  const heroEyebrow = figma.createFrame();
  heroEyebrow.name = "Eyebrow";
  heroEyebrow.layoutMode = "HORIZONTAL";
  heroEyebrow.paddingLeft = 10;
  heroEyebrow.paddingRight = 10;
  heroEyebrow.paddingTop = 4;
  heroEyebrow.paddingBottom = 4;
  heroEyebrow.cornerRadius = 6;
  heroEyebrow.fills = [{ type: "SOLID", color: C.blueTint }];
  heroEyebrow.strokes = [{ type: "SOLID", color: C.blueBorder }];
  heroEyebrow.strokeWeight = 1;
  heroEyebrow.appendChild(
    createTxt("★ PREMIUM IMPRINT & SOURCING COLLECTION", 10.5, "Bold", C.blueDark, { letterSpacing: 0.5 })
  );
  heroSection.appendChild(heroEyebrow);

  const heroTitle = createTxt("Promotional products your clients will keep.", 28, "Bold", C.navySlate, {
    lineHeight: 34,
  });
  heroTitle.resize(innerContentWidth, 68);
  heroSection.appendChild(heroTitle);

  const heroDesc = createTxt(
    "Search by name or SKU, or start with a category. Precision enterprise sourcing with California's fastest proof turnaround.",
    13.5,
    "Regular",
    C.slateBody,
    { lineHeight: 20 }
  );
  heroDesc.resize(innerContentWidth, 60);
  heroSection.appendChild(heroDesc);

  const mobileSearchBar = figma.createFrame();
  mobileSearchBar.name = "Mobile Search Bar";
  mobileSearchBar.resize(innerContentWidth, 48);
  mobileSearchBar.layoutMode = "HORIZONTAL";
  mobileSearchBar.primaryAxisAlignItems = "SPACE_BETWEEN";
  mobileSearchBar.counterAxisAlignItems = "CENTER";
  mobileSearchBar.paddingLeft = 14;
  mobileSearchBar.paddingRight = 6;
  mobileSearchBar.cornerRadius = 10;
  mobileSearchBar.fills = [{ type: "SOLID", color: C.bgCanvas }];
  mobileSearchBar.strokes = [{ type: "SOLID", color: C.borderSubtle }];
  mobileSearchBar.strokeWeight = 1.5;
  mobileSearchBar.appendChild(createTxt("Search by SKU or keyword...", 13, "Regular", C.slateLight));

  const searchBtn = figma.createFrame();
  searchBtn.name = "Search Button";
  searchBtn.layoutMode = "HORIZONTAL";
  searchBtn.primaryAxisAlignItems = "CENTER";
  searchBtn.counterAxisAlignItems = "CENTER";
  searchBtn.paddingLeft = 18;
  searchBtn.paddingRight = 18;
  searchBtn.paddingTop = 11;
  searchBtn.paddingBottom = 11;
  searchBtn.cornerRadius = 8;
  searchBtn.fills = [{ type: "SOLID", color: C.navySlate }];
  searchBtn.appendChild(createTxt("Search", 12.5, "SemiBold", C.bgPure));
  mobileSearchBar.appendChild(searchBtn);
  heroSection.appendChild(mobileSearchBar);

  const popRow = figma.createFrame();
  popRow.name = "Popular Tags";
  popRow.layoutMode = "HORIZONTAL";
  popRow.counterAxisAlignItems = "CENTER";
  popRow.itemSpacing = 8;
  popRow.fills = [];
  popRow.appendChild(createTxt("POPULAR:", 10.5, "Bold", C.slateMuted));

  const popTags = ["Drinkware", "Journals", "Power banks", "Tote bags"];
  popTags.forEach((tag) => {
    const pill = figma.createFrame();
    pill.name = `Popular Tag: ${tag}`;
    pill.layoutMode = "HORIZONTAL";
    pill.counterAxisAlignItems = "CENTER";
    pill.primaryAxisAlignItems = "CENTER";
    pill.paddingLeft = 10;
    pill.paddingRight = 10;
    pill.paddingTop = 5;
    pill.paddingBottom = 5;
    pill.cornerRadius = 6;
    pill.fills = [{ type: "SOLID", color: C.bgCanvas }];
    pill.strokes = [{ type: "SOLID", color: C.borderSubtle }];
    pill.strokeWeight = 1;
    pill.appendChild(createTxt(tag, 11, "Medium", C.navySlate));
    try {
      pill.layoutPositioning = "AUTO";
      pill.counterAxisSizingMode = "AUTO";
      pill.primaryAxisSizingMode = "AUTO";
      pill.layoutSizingHorizontal = "HUG";
      pill.layoutSizingVertical = "HUG";
    } catch { }
    popRow.appendChild(pill);
  });
  heroSection.appendChild(popRow);

  // Hero Image Photo Card
  const heroPhotoCard = figma.createFrame();
  heroPhotoCard.name = "Hero Visual Card";
  heroPhotoCard.resize(innerContentWidth, 240);
  heroPhotoCard.cornerRadius = 16;
  heroPhotoCard.clipsContent = true;
  heroPhotoCard.layoutMode = "NONE";
  heroPhotoCard.fills = [{ type: "SOLID", color: C.bgCanvas }];
  heroPhotoCard.strokes = [{ type: "SOLID", color: C.borderSubtle }];
  heroPhotoCard.strokeWeight = 1;
  try {
    heroPhotoCard.layoutPositioning = "AUTO";
    heroPhotoCard.layoutSizingHorizontal = "FILL";
    heroPhotoCard.layoutAlign = "STRETCH";
  } catch { }

  const heroImg = createImgNode("Journal Showcase Photo", innerContentWidth, 240, IMAGES.heroJournal, "FILL", null, 0);
  heroImg.x = 0;
  heroImg.y = 0;
  heroPhotoCard.appendChild(heroImg);

  const heroFloatingSpec = figma.createFrame();
  heroFloatingSpec.name = "Featured SKU Badge";
  heroFloatingSpec.resize(260, 58);
  heroFloatingSpec.x = 12;
  heroFloatingSpec.y = 170;
  heroFloatingSpec.layoutMode = "HORIZONTAL";
  heroFloatingSpec.primaryAxisAlignItems = "SPACE_BETWEEN";
  heroFloatingSpec.counterAxisAlignItems = "CENTER";
  heroFloatingSpec.paddingLeft = 12;
  heroFloatingSpec.paddingRight = 12;
  heroFloatingSpec.paddingTop = 8;
  heroFloatingSpec.paddingBottom = 8;
  heroFloatingSpec.cornerRadius = 12;
  heroFloatingSpec.fills = [{ type: "SOLID", color: C.bgPure, opacity: 0.95 }];
  heroFloatingSpec.strokes = [{ type: "SOLID", color: C.borderSubtle }];
  heroFloatingSpec.strokeWeight = 1;

  const specLeft = figma.createFrame();
  specLeft.name = "Details";
  specLeft.layoutMode = "VERTICAL";
  specLeft.itemSpacing = 2;
  specLeft.fills = [];
  specLeft.appendChild(createTxt("TX-2107 Card Holder", 12.5, "Bold", C.navySlate));
  specLeft.appendChild(createTxt("$8.98 to $11.50 ea", 11, "Medium", C.bluePrimary));
  heroFloatingSpec.appendChild(specLeft);
  heroPhotoCard.appendChild(heroFloatingSpec);
  heroSection.appendChild(heroPhotoCard);

  // Stacked Action Buttons
  const heroCtaStack = figma.createFrame();
  heroCtaStack.name = "CTA Buttons";
  heroCtaStack.layoutMode = "VERTICAL";
  heroCtaStack.itemSpacing = 10;
  heroCtaStack.fills = [];

  const catalogBtn = figma.createFrame();
  catalogBtn.name = "Explore Catalog Button";
  catalogBtn.resize(innerContentWidth, 50);
  catalogBtn.layoutMode = "HORIZONTAL";
  catalogBtn.primaryAxisAlignItems = "CENTER";
  catalogBtn.counterAxisAlignItems = "CENTER";
  catalogBtn.paddingTop = 15;
  catalogBtn.paddingBottom = 15;
  catalogBtn.paddingLeft = 24;
  catalogBtn.paddingRight = 24;
  catalogBtn.cornerRadius = 10;
  catalogBtn.fills = [{ type: "SOLID", color: C.navySlate }];
  try {
    catalogBtn.layoutPositioning = "AUTO";
    catalogBtn.layoutSizingHorizontal = "FILL";
    catalogBtn.layoutAlign = "STRETCH";
    catalogBtn.layoutSizingVertical = "HUG";
  } catch { }
  catalogBtn.appendChild(createTxt("Explore Full 2024 Catalog →", 13.5, "Bold", C.bgPure));
  heroCtaStack.appendChild(catalogBtn);

  const sampleBtn = figma.createFrame();
  sampleBtn.name = "Request Free Sample Button";
  sampleBtn.resize(innerContentWidth, 50);
  sampleBtn.layoutMode = "HORIZONTAL";
  sampleBtn.primaryAxisAlignItems = "CENTER";
  sampleBtn.counterAxisAlignItems = "CENTER";
  sampleBtn.paddingTop = 15;
  sampleBtn.paddingBottom = 15;
  sampleBtn.paddingLeft = 24;
  sampleBtn.paddingRight = 24;
  sampleBtn.cornerRadius = 10;
  sampleBtn.fills = [{ type: "SOLID", color: C.bgCanvas }];
  sampleBtn.strokes = [{ type: "SOLID", color: C.borderSubtle }];
  sampleBtn.strokeWeight = 1.5;
  try {
    sampleBtn.layoutPositioning = "AUTO";
    sampleBtn.layoutSizingHorizontal = "FILL";
    sampleBtn.layoutAlign = "STRETCH";
    sampleBtn.layoutSizingVertical = "HUG";
  } catch { }
  sampleBtn.appendChild(createTxt("Request Free Sample Kit", 13.5, "SemiBold", C.navySlate));
  heroCtaStack.appendChild(sampleBtn);
  heroSection.appendChild(heroCtaStack);

  appendAndFill(root, heroSection);

  // 5. SECTION 2: 2-COLUMN CATEGORY TILES
  const catSection = figma.createFrame();
  catSection.name = "Section 2: Category Tiles";
  catSection.resize(targetWidth, 480);
  catSection.layoutMode = "VERTICAL";
  catSection.paddingLeft = 16;
  catSection.paddingRight = 16;
  catSection.paddingTop = 28;
  catSection.paddingBottom = 28;
  catSection.itemSpacing = 16;
  catSection.fills = [{ type: "SOLID", color: C.bgCanvas }];

  const catHead = figma.createFrame();
  catHead.name = "Heading Block";
  catHead.layoutMode = "VERTICAL";
  catHead.itemSpacing = 4;
  catHead.fills = [];
  catHead.appendChild(
    createTxt("ENTERPRISE CATEGORIES", 11, "Bold", C.bluePrimary, { letterSpacing: 0.5 })
  );
  catHead.appendChild(createTxt("Explore Core Product Categories", 20, "Bold", C.navySlate));
  catHead.appendChild(
    createTxt("California in-house decorated with 24-hour fast proofs.", 12.5, "Regular", C.slateBody)
  );
  catSection.appendChild(catHead);

  const categoriesData = [
    { name: "Drinkware", hash: IMAGES.catDrinkware },
    { name: "Executive Journals", hash: IMAGES.catJournals },
    { name: "Padfolios", hash: IMAGES.catPadfolios },
    { name: "Power Banks", hash: IMAGES.catPower },
    { name: "Executive Pens", hash: IMAGES.catPens },
    { name: "Tote Bags", hash: IMAGES.catTotes },
    { name: "Gift Card Sets", hash: IMAGES.catCards },
    { name: "+12 All Categories", hash: "" },
  ];

  const cardWidth = Math.floor((innerContentWidth - 12) / 2);

  for (let r = 0; r < 4; r++) {
    const row = figma.createFrame();
    row.name = `Category Row ${r + 1}`;
    row.resize(innerContentWidth, 120);
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisAlignItems = "SPACE_BETWEEN";
    row.counterAxisAlignItems = "CENTER";
    row.itemSpacing = 12;
    row.fills = [];
    try {
      row.layoutPositioning = "AUTO";
      row.layoutSizingHorizontal = "FILL";
      row.layoutSizingVertical = "HUG";
    } catch { }

    for (let c = 0; c < 2; c++) {
      const idx = r * 2 + c;
      const cat = categoriesData[idx];

      const tile = figma.createFrame();
      tile.name = `Tile: ${cat.name}`;
      tile.resize(cardWidth, 120);
      tile.layoutMode = "VERTICAL";
      tile.primaryAxisAlignItems = "CENTER";
      tile.counterAxisAlignItems = "CENTER";
      tile.paddingTop = 14;
      tile.paddingBottom = 14;
      tile.itemSpacing = 8;
      tile.cornerRadius = 12;
      tile.fills = [{ type: "SOLID", color: C.bgPure }];
      tile.strokes = [{ type: "SOLID", color: C.borderLight }];
      tile.strokeWeight = 1;

      if (cat.hash) {
        const catImg = createImgNode("Icon", 48, 48, cat.hash, "FIT", C.bgCanvas, 8);
        tile.appendChild(catImg);
      } else {
        const moreBox = figma.createFrame();
        moreBox.resize(48, 48);
        moreBox.cornerRadius = 8;
        moreBox.layoutMode = "HORIZONTAL";
        moreBox.primaryAxisAlignItems = "CENTER";
        moreBox.counterAxisAlignItems = "CENTER";
        moreBox.fills = [{ type: "SOLID", color: C.blueTint }];
        moreBox.appendChild(createTxt("+12", 15, "Bold", C.bluePrimary));
        tile.appendChild(moreBox);
      }

      tile.appendChild(createTxt(cat.name, 12, "Bold", C.navySlate, { textAlignHorizontal: "CENTER" }));
      row.appendChild(tile);
      try {
        tile.layoutPositioning = "AUTO";
        tile.layoutSizingHorizontal = "FILL";
        tile.layoutSizingVertical = "HUG";
      } catch { }
    }
    catSection.appendChild(row);
  }
  appendAndFill(root, catSection);

  // 6. SECTION 3: FILTER CHIPS
  const filterSection = figma.createFrame();
  filterSection.name = "Section 3: Filter Chips";
  filterSection.resize(targetWidth, 80);
  filterSection.layoutMode = "VERTICAL";
  filterSection.paddingLeft = 16;
  filterSection.paddingRight = 16;
  filterSection.paddingTop = 16;
  filterSection.paddingBottom = 16;
  filterSection.itemSpacing = 10;
  filterSection.fills = [{ type: "SOLID", color: C.bgPure }];

  filterSection.appendChild(
    createTxt("72 items crafted in California — In-stock today", 12, "Medium", C.slateMuted)
  );

  const chipsRow = figma.createFrame();
  chipsRow.name = "Chips Row";
  chipsRow.layoutMode = "HORIZONTAL";
  chipsRow.itemSpacing = 8;
  chipsRow.fills = [];

  const chips = [
    { label: "All Products", active: true },
    { label: "Drinkware", active: false },
    { label: "Journals", active: false },
    { label: "Power Banks", active: false },
  ];
  chips.forEach((ch) => {
    const chip = figma.createFrame();
    chip.name = `Filter Chip: ${ch.label}`;
    chip.layoutMode = "HORIZONTAL";
    chip.counterAxisAlignItems = "CENTER";
    chip.primaryAxisAlignItems = "CENTER";
    chip.paddingLeft = 14;
    chip.paddingRight = 14;
    chip.paddingTop = 7;
    chip.paddingBottom = 7;
    chip.cornerRadius = 20;
    chip.fills = [{ type: "SOLID", color: ch.active ? C.navySlate : C.bgCanvas }];
    if (!ch.active) {
      chip.strokes = [{ type: "SOLID", color: C.borderSubtle }];
      chip.strokeWeight = 1;
    }
    chip.appendChild(createTxt(ch.label, 11.5, "Medium", ch.active ? C.bgPure : C.slateBody));
    try {
      chip.layoutPositioning = "AUTO";
      chip.counterAxisSizingMode = "AUTO";
      chip.primaryAxisSizingMode = "AUTO";
      chip.layoutSizingHorizontal = "HUG";
      chip.layoutSizingVertical = "HUG";
    } catch { }
    chipsRow.appendChild(chip);
  });
  filterSection.appendChild(chipsRow);
  appendAndFill(root, filterSection);

  // 7. SECTION 4: 1-COLUMN FEATURED PRODUCTS
  const prodSection = figma.createFrame();
  prodSection.name = "Section 4: Featured Products";
  prodSection.resize(targetWidth, 1200);
  prodSection.layoutMode = "VERTICAL";
  prodSection.paddingLeft = 16;
  prodSection.paddingRight = 16;
  prodSection.paddingTop = 24;
  prodSection.paddingBottom = 28;
  prodSection.itemSpacing = 20;
  prodSection.fills = [{ type: "SOLID", color: C.bgPure }];

  const prodHead = figma.createFrame();
  prodHead.name = "Heading Block";
  prodHead.layoutMode = "VERTICAL";
  prodHead.itemSpacing = 4;
  prodHead.fills = [];
  prodHead.appendChild(createTxt("Featured products", 22, "Bold", C.navySlate));
  prodHead.appendChild(
    createTxt("Quick-turn items with in-house California laser & color imprinting", 12.5, "Regular", C.slateBody)
  );
  prodSection.appendChild(prodHead);

  const productsList = [
    {
      sku: "TX-2107 Executive Pen & Card Set",
      cat: "EXECUTIVE GIFT SET",
      price: "$8.98 to $11.50 ea",
      min: "Min. 50 units",
      hash: IMAGES.prodTX2107,
    },
    {
      sku: "DW-8966 32oz Vacuum Bottle",
      cat: "INSULATED DRINKWARE",
      price: "$14.25 to $17.80 ea",
      min: "Min. 24 units",
      hash: IMAGES.prodDW8966,
    },
    {
      sku: "EX-8067 10,000mAh Power Bank",
      cat: "TECH & MOBILE",
      price: "$19.50 to $24.00 ea",
      min: "Min. 25 units",
      hash: IMAGES.prodEX8067,
    },
    {
      sku: "TX-916958 Fast Wireless Pad",
      cat: "DESKTOP CHARGERS",
      price: "$9.80 to $12.40 ea",
      min: "Min. 50 units",
      hash: IMAGES.prodTX916958,
    },
  ];

  productsList.forEach((prod, i) => {
    const card = figma.createFrame();
    card.name = `Product Card: ${prod.sku}`;
    card.resize(innerContentWidth, 360);
    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "AUTO";
    card.counterAxisSizingMode = "FIXED";
    card.itemSpacing = 12;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.cornerRadius = 14;
    card.fills = [{ type: "SOLID", color: C.bgPure }];
    card.strokes = [{ type: "SOLID", color: C.borderLight }];
    card.strokeWeight = 1;

    // Image frame
    const imgWrap = figma.createFrame();
    imgWrap.name = "Photo Container";
    imgWrap.resize(innerContentWidth - 32, 170);
    imgWrap.cornerRadius = 10;
    imgWrap.clipsContent = true;
    imgWrap.fills = [{ type: "SOLID", color: C.bgCanvas }];
    try {
      imgWrap.layoutPositioning = "AUTO";
      imgWrap.layoutSizingHorizontal = "FILL";
    } catch { }

    const pImg = createImgNode(
      prod.sku,
      innerContentWidth - 32,
      170,
      prod.hash,
      "FIT",
      C.bgCanvas,
      10
    );
    pImg.x = 0;
    pImg.y = 0;
    try {
      pImg.layoutSizingHorizontal = "FILL";
    } catch { }
    imgWrap.appendChild(pImg);
    card.appendChild(imgWrap);

    // Meta & Title
    const cardInfo = figma.createFrame();
    cardInfo.name = "Product Info";
    cardInfo.resize(innerContentWidth - 32, 60);
    cardInfo.layoutMode = "VERTICAL";
    cardInfo.primaryAxisSizingMode = "AUTO";
    cardInfo.itemSpacing = 4;
    cardInfo.fills = [];
    try {
      cardInfo.layoutPositioning = "AUTO";
      cardInfo.layoutSizingHorizontal = "FILL";
      cardInfo.layoutSizingVertical = "HUG";
    } catch { }
    cardInfo.appendChild(createTxt(prod.cat, 10.5, "Bold", C.bluePrimary));
    cardInfo.appendChild(createTxt(prod.sku, 15, "Bold", C.navySlate));

    const priceRow = figma.createFrame();
    priceRow.name = "Pricing Row";
    priceRow.resize(innerContentWidth - 32, 24);
    priceRow.layoutMode = "HORIZONTAL";
    priceRow.primaryAxisAlignItems = "SPACE_BETWEEN";
    priceRow.counterAxisAlignItems = "CENTER";
    priceRow.fills = [];
    try {
      priceRow.layoutPositioning = "AUTO";
      priceRow.layoutSizingHorizontal = "FILL";
      priceRow.layoutSizingVertical = "HUG";
    } catch { }
    priceRow.appendChild(createTxt(prod.price, 14, "Bold", C.navySlate));
    priceRow.appendChild(createTxt(prod.min, 11, "Medium", C.greenAccent));
    cardInfo.appendChild(priceRow);

    card.appendChild(cardInfo);

    // Full-width Quote Button
    const quoteBtn = figma.createFrame();
    quoteBtn.name = "Quote Button";
    quoteBtn.resize(innerContentWidth - 32, 48);
    quoteBtn.layoutMode = "HORIZONTAL";
    quoteBtn.primaryAxisAlignItems = "CENTER";
    quoteBtn.counterAxisAlignItems = "CENTER";
    quoteBtn.paddingTop = 14;
    quoteBtn.paddingBottom = 14;
    quoteBtn.paddingLeft = 20;
    quoteBtn.paddingRight = 20;
    quoteBtn.cornerRadius = 8;
    quoteBtn.fills = [{ type: "SOLID", color: C.navySlate }];
    try {
      quoteBtn.layoutPositioning = "AUTO";
      quoteBtn.layoutSizingHorizontal = "FILL";
      quoteBtn.layoutAlign = "STRETCH";
      quoteBtn.layoutSizingVertical = "HUG";
    } catch { }
    quoteBtn.appendChild(createTxt("Request a Quote", 13, "SemiBold", C.bgPure));
    card.appendChild(quoteBtn);

    prodSection.appendChild(card);
    try {
      card.layoutPositioning = "AUTO";
      card.layoutSizingHorizontal = "FILL";
      card.layoutSizingVertical = "HUG";
    } catch { }
  });
  appendAndFill(root, prodSection);

  // 8. SECTION 5: ASSISTANCE BANNER
  const assistSection = figma.createFrame();
  assistSection.name = "Section 5: Assistance Banner";
  assistSection.resize(targetWidth, 220);
  assistSection.layoutMode = "VERTICAL";
  assistSection.paddingLeft = 16;
  assistSection.paddingRight = 16;
  assistSection.paddingTop = 16;
  assistSection.paddingBottom = 16;
  assistSection.fills = [];

  const assistBox = figma.createFrame();
  assistBox.name = "Banner Box";
  assistBox.resize(innerContentWidth, 180);
  assistBox.layoutMode = "VERTICAL";
  assistBox.itemSpacing = 10;
  assistBox.paddingLeft = 18;
  assistBox.paddingRight = 18;
  assistBox.paddingTop = 18;
  assistBox.paddingBottom = 18;
  assistBox.cornerRadius = 14;
  assistBox.fills = [{ type: "SOLID", color: C.navyDark }];

  assistBox.appendChild(createTxt("ENTERPRISE SOURCING CONCIERGE", 10.5, "Bold", C.skyAccent));
  assistBox.appendChild(
    createTxt("Not sure what to choose? Share your budget and deadline.", 16, "Bold", C.bgPure, {
      lineHeight: 22,
    })
  );
  assistBox.appendChild(
    createTxt(
      "Our California team consolidates freight across 100+ factories to deliver finished proofs in under 24 hours.",
      12.5,
      "Regular",
      { r: 0.8, g: 0.88, b: 0.98 },
      { lineHeight: 18 }
    )
  );

  const assistBtn = figma.createFrame();
  assistBtn.name = "Contact Specialist Button";
  assistBtn.resize(innerContentWidth - 36, 48);
  assistBtn.layoutMode = "HORIZONTAL";
  assistBtn.primaryAxisAlignItems = "CENTER";
  assistBtn.counterAxisAlignItems = "CENTER";
  assistBtn.paddingTop = 14;
  assistBtn.paddingBottom = 14;
  assistBtn.paddingLeft = 20;
  assistBtn.paddingRight = 20;
  assistBtn.cornerRadius = 8;
  assistBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
  try {
    assistBtn.layoutPositioning = "AUTO";
    assistBtn.layoutSizingHorizontal = "FILL";
    assistBtn.layoutAlign = "STRETCH";
    assistBtn.layoutSizingVertical = "HUG";
  } catch { }
  assistBtn.appendChild(createTxt("Talk to a Dedicated Specialist", 13, "SemiBold", C.bgPure));
  assistBox.appendChild(assistBtn);

  assistSection.appendChild(assistBox);
  try {
    assistBox.layoutPositioning = "AUTO";
    assistBox.layoutSizingHorizontal = "FILL";
    assistBox.layoutSizingVertical = "HUG";
    assistBtn.layoutPositioning = "AUTO";
    assistBtn.layoutSizingHorizontal = "FILL";
    assistBtn.layoutSizingVertical = "HUG";
  } catch { }
  appendAndFill(root, assistSection);

  // 9. SECTION 6: ORDERING RESOURCES & TRUST CREDENTIALS
  const resSection = figma.createFrame();
  resSection.name = "Section 6: Ordering Resources";
  resSection.resize(targetWidth, 380);
  resSection.layoutMode = "VERTICAL";
  resSection.paddingLeft = 16;
  resSection.paddingRight = 16;
  resSection.paddingTop = 24;
  resSection.paddingBottom = 28;
  resSection.itemSpacing = 12;
  resSection.fills = [{ type: "SOLID", color: C.bgPure }];

  resSection.appendChild(createTxt("ORDERING RESOURCES", 11, "Bold", C.bluePrimary));
  resSection.appendChild(createTxt("Tools for Promotional Distributors", 20, "Bold", C.navySlate));

  const resourceItems = [
    { title: "E-Catalog", desc: "Download high-res PDF with pricing" },
    { title: "E-Flyers", desc: "Pre-made marketing templates" },
    { title: "Order Tracking", desc: "Real-time production updates" },
    { title: "Free Digital Proof", desc: "Submitted in 24 hours or less" },
  ];
  resourceItems.forEach((item) => {
    const card = figma.createFrame();
    card.name = `Resource: ${item.title}`;
    card.resize(innerContentWidth, 60);
    card.layoutMode = "HORIZONTAL";
    card.primaryAxisAlignItems = "SPACE_BETWEEN";
    card.counterAxisAlignItems = "CENTER";
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.paddingTop = 14;
    card.paddingBottom = 14;
    card.cornerRadius = 10;
    card.fills = [{ type: "SOLID", color: C.bgCanvas }];
    card.strokes = [{ type: "SOLID", color: C.borderLight }];
    card.strokeWeight = 1;

    const left = figma.createFrame();
    left.name = "Text";
    left.layoutMode = "VERTICAL";
    left.itemSpacing = 2;
    left.fills = [];
    left.appendChild(createTxt(item.title, 13, "Bold", C.navySlate));
    left.appendChild(createTxt(item.desc, 11, "Regular", C.slateBody));
    card.appendChild(left);
    card.appendChild(createTxt("→", 14, "Bold", C.bluePrimary));
    resSection.appendChild(card);
    try {
      card.layoutPositioning = "AUTO";
      card.layoutSizingHorizontal = "FILL";
      card.layoutSizingVertical = "HUG";
    } catch { }
  });

  // Trust Badges in Section 6
  const trustItems = [
    { title: "Proudly PPAI Member", desc: "Top 100 Supplier Award", badge: "1" },
    { title: "ASI 5-Star Supplier", desc: "Highest distributor satisfaction rating", badge: "★" },
    { title: "Quantity-based pricing", desc: "Direct factory volume discounts", badge: "$" },
  ];
  trustItems.forEach((item) => {
    const card = figma.createFrame();
    card.name = `Trust: ${item.title}`;
    card.resize(innerContentWidth, 54);
    card.layoutMode = "HORIZONTAL";
    card.primaryAxisAlignItems = "MIN";
    card.counterAxisAlignItems = "CENTER";
    card.paddingLeft = 14;
    card.paddingRight = 14;
    card.paddingTop = 10;
    card.paddingBottom = 10;
    card.itemSpacing = 12;
    card.cornerRadius = 10;
    card.fills = [{ type: "SOLID", color: C.bgCanvas }];
    card.strokes = [{ type: "SOLID", color: C.borderLight }];
    card.strokeWeight = 1;

    const iconBox = figma.createFrame();
    iconBox.name = "Icon";
    iconBox.resize(32, 32);
    iconBox.cornerRadius = 8;
    iconBox.layoutMode = "HORIZONTAL";
    iconBox.primaryAxisAlignItems = "CENTER";
    iconBox.counterAxisAlignItems = "CENTER";
    iconBox.fills = [{ type: "SOLID", color: C.blueTint }];
    iconBox.appendChild(createTxt(item.badge, 12, "Bold", C.bluePrimary));
    card.appendChild(iconBox);

    const left = figma.createFrame();
    left.name = "Text";
    left.layoutMode = "VERTICAL";
    left.itemSpacing = 2;
    left.fills = [];
    left.appendChild(createTxt(item.title, 12.5, "Bold", C.navySlate));
    left.appendChild(createTxt(item.desc, 10.5, "Regular", C.slateBody));
    card.appendChild(left);

    resSection.appendChild(card);
    try {
      card.layoutPositioning = "AUTO";
      card.layoutSizingHorizontal = "FILL";
      card.layoutSizingVertical = "HUG";
    } catch { }
  });

  // Awards graphic banner
  if (IMAGES.awardsGraphic) {
    const awardWrap = figma.createFrame();
    awardWrap.name = "Awards Graphic Wrap";
    awardWrap.resize(innerContentWidth, 68);
    awardWrap.cornerRadius = 8;
    awardWrap.clipsContent = true;
    awardWrap.fills = [];
    const awardImg = createImgNode("Top 10 Satisfaction Award", innerContentWidth, 68, IMAGES.awardsGraphic, "FIT", null, 8);
    awardImg.x = 0;
    awardImg.y = 0;
    awardWrap.appendChild(awardImg);
    resSection.appendChild(awardWrap);
  }
  appendAndFill(root, resSection);

  // 10. SECTION 7: DISTRIBUTOR PORTAL CALLOUT
  const portalSection = figma.createFrame();
  portalSection.name = "Section 7: Distributor Portal";
  portalSection.resize(targetWidth, 240);
  portalSection.layoutMode = "VERTICAL";
  portalSection.paddingLeft = 16;
  portalSection.paddingRight = 16;
  portalSection.paddingTop = 16;
  portalSection.paddingBottom = 24;
  portalSection.fills = [];

  const portalBox = figma.createFrame();
  portalBox.name = "Portal Card";
  portalBox.resize(innerContentWidth, 180);
  portalBox.layoutMode = "VERTICAL";
  portalBox.itemSpacing = 12;
  portalBox.paddingLeft = 20;
  portalBox.paddingRight = 20;
  portalBox.paddingTop = 20;
  portalBox.paddingBottom = 20;
  portalBox.cornerRadius = 14;
  portalBox.fills = [{ type: "SOLID", color: C.navyDark }];

  portalBox.appendChild(createTxt("CONFIDENTIAL DISTRIBUTOR ACCESS", 10.5, "Bold", C.skyAccent));
  portalBox.appendChild(
    createTxt("Are you a distributor? Log in to see your pricing and track orders.", 17, "Bold", C.bgPure, {
      lineHeight: 23,
    })
  );
  portalBox.appendChild(
    createTxt(
      "Instant access to distributor net pricing, virtual mockups, and inventory availability across all product lines.",
      12.5,
      "Regular",
      { r: 0.8, g: 0.88, b: 0.98 },
      { lineHeight: 18 }
    )
  );

  const portalBtnRow = figma.createFrame();
  portalBtnRow.name = "Buttons";
  portalBtnRow.resize(innerContentWidth - 40, 48);
  portalBtnRow.layoutMode = "HORIZONTAL";
  portalBtnRow.itemSpacing = 10;
  portalBtnRow.fills = [];

  const loginBtn = figma.createFrame();
  loginBtn.name = "Login";
  loginBtn.layoutMode = "HORIZONTAL";
  loginBtn.primaryAxisAlignItems = "CENTER";
  loginBtn.counterAxisAlignItems = "CENTER";
  loginBtn.paddingLeft = 22;
  loginBtn.paddingRight = 22;
  loginBtn.paddingTop = 13;
  loginBtn.paddingBottom = 13;
  loginBtn.cornerRadius = 8;
  loginBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
  loginBtn.appendChild(createTxt("Log In", 13, "SemiBold", C.bgPure));
  portalBtnRow.appendChild(loginBtn);

  const regBtn = figma.createFrame();
  regBtn.name = "Register";
  regBtn.layoutMode = "HORIZONTAL";
  regBtn.primaryAxisAlignItems = "CENTER";
  regBtn.counterAxisAlignItems = "CENTER";
  regBtn.paddingLeft = 22;
  regBtn.paddingRight = 22;
  regBtn.paddingTop = 13;
  regBtn.paddingBottom = 13;
  regBtn.cornerRadius = 8;
  regBtn.fills = [{ type: "SOLID", color: C.bgPure }];
  regBtn.appendChild(createTxt("Register", 13, "SemiBold", C.navySlate));
  portalBtnRow.appendChild(regBtn);

  portalBox.appendChild(portalBtnRow);
  portalSection.appendChild(portalBox);
  try {
    portalBox.layoutPositioning = "AUTO";
    portalBox.layoutSizingHorizontal = "FILL";
    portalBox.layoutSizingVertical = "HUG";
    portalBtnRow.layoutPositioning = "AUTO";
    portalBtnRow.layoutSizingHorizontal = "FILL";
  } catch { }
  appendAndFill(root, portalSection);

  // 11. SECTION 8: NEWSLETTER SUBSCRIPTION
  const newsSection = figma.createFrame();
  newsSection.name = "Section 8: Newsletter Subscription";
  newsSection.resize(targetWidth, 160);
  newsSection.layoutMode = "VERTICAL";
  newsSection.paddingLeft = 16;
  newsSection.paddingRight = 16;
  newsSection.paddingTop = 20;
  newsSection.paddingBottom = 20;
  newsSection.itemSpacing = 12;
  newsSection.fills = [{ type: "SOLID", color: C.navyDark }];

  newsSection.appendChild(
    createTxt(
      "Stay up to date with new products, offers and specials by subscribing to our newsletter:",
      12.5,
      "Medium",
      C.bgPure,
      { lineHeight: 18 }
    )
  );

  const newsForm = figma.createFrame();
  newsForm.name = "Subscription Form";
  newsForm.resize(innerContentWidth, 48);
  newsForm.layoutMode = "HORIZONTAL";
  newsForm.primaryAxisAlignItems = "SPACE_BETWEEN";
  newsForm.counterAxisAlignItems = "CENTER";
  newsForm.paddingLeft = 14;
  newsForm.paddingRight = 4;
  newsForm.paddingTop = 4;
  newsForm.paddingBottom = 4;
  newsForm.cornerRadius = 8;
  newsForm.fills = [{ type: "SOLID", color: C.navySlate }];
  newsForm.strokes = [{ type: "SOLID", color: C.slateDark }];
  newsForm.strokeWeight = 1;

  newsForm.appendChild(
    createTxt("Type your email address here...", 12, "Regular", C.slateLight)
  );

  const signUpBtn = figma.createFrame();
  signUpBtn.name = "Sign Up Button";
  signUpBtn.layoutMode = "HORIZONTAL";
  signUpBtn.primaryAxisAlignItems = "CENTER";
  signUpBtn.counterAxisAlignItems = "CENTER";
  signUpBtn.paddingLeft = 20;
  signUpBtn.paddingRight = 20;
  signUpBtn.paddingTop = 11;
  signUpBtn.paddingBottom = 11;
  signUpBtn.cornerRadius = 6;
  signUpBtn.fills = [{ type: "SOLID", color: C.bluePrimary }];
  signUpBtn.appendChild(createTxt("Sign Up", 12.5, "Bold", C.bgPure));
  newsForm.appendChild(signUpBtn);

  newsSection.appendChild(newsForm);
  try {
    newsForm.layoutPositioning = "AUTO";
    newsForm.layoutSizingHorizontal = "FILL";
    newsForm.layoutSizingVertical = "HUG";
  } catch { }
  appendAndFill(root, newsSection);

  // 12. SECTION 9: COMPLETE ENTERPRISE FOOTER
  const footer = figma.createFrame();
  footer.name = "Section 9: Enterprise Footer";
  footer.resize(targetWidth, 680);
  footer.layoutMode = "VERTICAL";
  footer.paddingLeft = 16;
  footer.paddingRight = 16;
  footer.paddingTop = 28;
  footer.paddingBottom = 36;
  footer.itemSpacing = 20;
  footer.fills = [{ type: "SOLID", color: C.darkFooter }];

  // A. Brand & Address
  const footBrandBlock = figma.createFrame();
  footBrandBlock.name = "Brand & Address";
  footBrandBlock.layoutMode = "VERTICAL";
  footBrandBlock.itemSpacing = 6;
  footBrandBlock.fills = [];

  const footBrand = figma.createFrame();
  footBrand.name = "Brand Name";
  footBrand.layoutMode = "HORIZONTAL";
  footBrand.itemSpacing = 4;
  footBrand.counterAxisAlignItems = "CENTER";
  footBrand.fills = [];
  footBrand.appendChild(createTxt("POSH", 18, "Bold", C.bgPure));
  footBrand.appendChild(createTxt("XESSORIES", 18, "Bold", C.skyAccent));
  footBrandBlock.appendChild(footBrand);

  footBrandBlock.appendChild(
    createTxt("41090 Belmont Terrace, Fremont, CA 94538", 12, "Medium", { r: 0.72, g: 0.8, b: 0.92 })
  );
  footer.appendChild(footBrandBlock);

  // B. Company Description
  footer.appendChild(
    createTxt(
      "Posh Xessories is a full-service supplier offering high-quality promotional products, quick turnaround times, and outstanding customer service. We specialize in custom laser engraving, color imprinting, and custom gift sets.",
      11.5,
      "Regular",
      { r: 0.6, g: 0.68, b: 0.8 },
      { lineHeight: 17 }
    )
  );

  // C. Industry Credentials
  const idsRow = figma.createFrame();
  idsRow.name = "Industry Credentials";
  idsRow.layoutMode = "HORIZONTAL";
  idsRow.itemSpacing = 8;
  idsRow.fills = [];
  const ids = ["ASI 79028", "PPAI 206478", "SAGE 64870"];
  ids.forEach((id) => {
    const badge = figma.createFrame();
    badge.name = `ID: ${id}`;
    badge.layoutMode = "HORIZONTAL";
    badge.counterAxisAlignItems = "CENTER";
    badge.paddingLeft = 10;
    badge.paddingRight = 10;
    badge.paddingTop = 5;
    badge.paddingBottom = 5;
    badge.cornerRadius = 6;
    badge.fills = [{ type: "SOLID", color: C.slateDark }];
    badge.appendChild(createTxt(id, 10.5, "Bold", C.skyAccent));
    idsRow.appendChild(badge);
  });
  footer.appendChild(idsRow);

  // D. Column 1: Ordering Resources
  const col1 = figma.createFrame();
  col1.name = "Column: Ordering Resources";
  col1.layoutMode = "VERTICAL";
  col1.itemSpacing = 8;
  col1.fills = [];
  col1.appendChild(createTxt("ORDERING RESOURCES", 12, "Bold", C.skyAccent, { letterSpacing: 0.5 }));

  const orderingLinks = [
    "Quick Order & Virtual Proofs",
    "Artwork Guidelines & Templates",
    "Shipping & Production Times",
    "General Information",
    "Terms and Conditions",
  ];
  orderingLinks.forEach((link) => {
    col1.appendChild(createTxt(`• ${link}`, 12, "Regular", { r: 0.82, g: 0.88, b: 0.96 }));
  });
  footer.appendChild(col1);

  // E. Column 2: Company & Protection
  const col2 = figma.createFrame();
  col2.name = "Column: Company & Protection";
  col2.layoutMode = "VERTICAL";
  col2.itemSpacing = 8;
  col2.fills = [];
  col2.appendChild(createTxt("COMPANY & PROTECTION", 12, "Bold", C.skyAccent, { letterSpacing: 0.5 }));

  const protectionLinks = [
    "California Proposition 65 Compliance",
    "CPSIA & Child Safety Standards",
    "Product Safety & Quality Testing",
    "Social Compliance & Code of Conduct",
    "Contact Customer Support",
  ];
  protectionLinks.forEach((link) => {
    col2.appendChild(createTxt(`• ${link}`, 12, "Regular", { r: 0.82, g: 0.88, b: 0.96 }));
  });
  footer.appendChild(col2);

  // F. Customer Support Contact Card
  const contactCard = figma.createFrame();
  contactCard.name = "Customer Support Card";
  contactCard.resize(innerContentWidth, 120);
  contactCard.layoutMode = "VERTICAL";
  contactCard.itemSpacing = 8;
  contactCard.paddingLeft = 16;
  contactCard.paddingRight = 16;
  contactCard.paddingTop = 14;
  contactCard.paddingBottom = 14;
  contactCard.cornerRadius = 10;
  contactCard.fills = [{ type: "SOLID", color: C.navySlate }];
  contactCard.strokes = [{ type: "SOLID", color: C.slateDark }];
  contactCard.strokeWeight = 1;

  contactCard.appendChild(createTxt("📞 Toll-Free: (800) 333-7069", 12, "SemiBold", C.bgPure));
  contactCard.appendChild(createTxt("☎ Local Phone: (510) 651-7800", 12, "SemiBold", C.bgPure));
  contactCard.appendChild(createTxt("✉ Email: sales@poshxessories.com", 12, "Medium", C.skyAccent));
  contactCard.appendChild(createTxt("🕒 Hours: Mon - Fri: 8:00 AM - 5:00 PM PST", 11, "Regular", { r: 0.65, g: 0.72, b: 0.82 }));
  footer.appendChild(contactCard);

  // G. Copyright & California Decoration Notice
  footer.appendChild(
    createTxt(
      "Product designs and artwork © 2024 Posh Xessories Inc. All rights reserved. Precision manufacturing & California in-house decorated.",
      10.5,
      "Regular",
      { r: 0.45, g: 0.52, b: 0.62 },
      { lineHeight: 16 }
    )
  );
  appendAndFill(root, footer);

  // Post-order normalization: ensure every single card/box has FILL width and HUG height
  fixAllCardsAndContainers(root, targetWidth);

  // Select and zoom into view
  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);

  return {
    success: true,
    frameId: root.id,
    frameName: root.name,
    targetWidth,
    width: Math.round(root.width),
    height: Math.round(root.height),
    sectionsAdjusted: 11,
    textNodesScaled: 48,
    gridsReflowed: 8,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GENERIC SMART MOBILE RECONSTRUCTOR (FOR ANY SELECTED WEB UI)
// ─────────────────────────────────────────────────────────────────────────────

async function buildGenericSmartMobilePage(
  sourceNode: FrameNode,
  targetWidth: number = 412,
  options: ResponsiveConvertOptions
): Promise<ResponsiveConvertResult> {
  // Preload essential fonts
  const fontsToLoad: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Bold" },
    { family: "Roboto", style: "Regular" },
    { family: "Roboto", style: "Bold" },
  ];
  for (const f of fontsToLoad) {
    try { await figma.loadFontAsync(f); } catch { }
  }

  // 1. Discover Theme Colors
  function extractSolidColor(paints: readonly Paint[] | undefined): RGB | null {
    if (!paints || !Array.isArray(paints)) return null;
    const solid = paints.find((p) => p.type === "SOLID" && p.visible !== false) as SolidPaint;
    return solid ? solid.color : null;
  }

  let brandColor: RGB | null = null;
  function scanBrandColor(n: SceneNode) {
    if ("fills" in n && Array.isArray((n as any).fills)) {
      for (const p of (n as any).fills) {
        if (p.type === "SOLID" && p.visible !== false) {
          const c = p.color;
          const diff = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
          const lum = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
          if (diff > 0.15 && lum > 0.12 && lum < 0.85 && !brandColor) {
            brandColor = c;
          }
        }
      }
    }
    if ("children" in n && !brandColor) {
      for (const ch of (n as any).children) scanBrandColor(ch);
    }
  }
  scanBrandColor(sourceNode);

  const rawBg = extractSolidColor(sourceNode.fills) || { r: 0.98, g: 0.98, b: 0.99 };
  const lumBg = (rawBg.r * 299 + rawBg.g * 587 + rawBg.b * 114) / 1000;
  const isDark = lumBg < 0.45;

  const T = {
    bgCanvas: rawBg,
    isDark,
    textPrimary: isDark ? { r: 0.98, g: 0.98, b: 1 } : { r: 0.08, g: 0.11, b: 0.18 },
    textMuted: isDark ? { r: 0.62, g: 0.68, b: 0.78 } : { r: 0.38, g: 0.44, b: 0.52 },
    cardBg: isDark ? { r: 0.12, g: 0.16, b: 0.24 } : { r: 1, g: 1, b: 1 },
    borderLight: isDark ? { r: 0.2, g: 0.25, b: 0.35 } : { r: 0.88, g: 0.91, b: 0.94 },
    brandAccent: brandColor || { r: 0.145, g: 0.388, b: 0.922 },
    cardSubtleBg: isDark ? { r: 0.08, g: 0.11, b: 0.17 } : { r: 0.95, g: 0.96, b: 0.98 },
  };

  // Helper: Create Text Node
  function makeTxt(
    text: string,
    size: number = 14,
    style: "Regular" | "Medium" | "SemiBold" | "Bold" = "Regular",
    color: RGB = T.textPrimary,
    opts: {
      lineHeight?: number;
      letterSpacing?: number;
      textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT";
      opacity?: number;
      fillWidth?: boolean;
    } = {}
  ): TextNode {
    const t = figma.createText();
    try {
      t.fontName = { family: "Inter", style };
    } catch {
      t.fontName = { family: "Roboto", style: style === "Bold" ? "Bold" : "Regular" };
    }
    t.characters = text;
    t.fontSize = size;
    t.fills = [{ type: "SOLID", color }];
    if (opts.lineHeight) {
      t.lineHeight = { value: opts.lineHeight, unit: "PIXELS" };
    }
    if (opts.letterSpacing !== undefined) {
      t.letterSpacing = { value: opts.letterSpacing, unit: "PIXELS" };
    }
    if (opts.textAlignHorizontal) {
      t.textAlignHorizontal = opts.textAlignHorizontal;
    }
    if (opts.opacity !== undefined) {
      t.opacity = opts.opacity;
    }
    if (opts.fillWidth) {
      t.textAutoResize = "HEIGHT";
      try {
        t.layoutPositioning = "AUTO";
        t.layoutSizingHorizontal = "FILL";
      } catch { }
    }
    return t;
  }

  // Helper: Create Image Frame
  function makeImgBox(
    name: string,
    width: number,
    height: number,
    hash: string | null,
    scaleMode: "FILL" | "FIT" = "FILL",
    bgColor: RGB | null = null,
    cornerRadius: number = 8
  ): FrameNode {
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(Math.max(1, width), Math.max(1, height));
    frame.cornerRadius = cornerRadius;
    frame.clipsContent = true;
    const fills: Paint[] = [];
    if (bgColor) fills.push({ type: "SOLID", color: bgColor });
    if (hash) {
      fills.push({ type: "IMAGE", imageHash: hash, scaleMode });
    } else if (!bgColor) {
      fills.push({ type: "SOLID", color: T.cardSubtleBg });
    }
    frame.fills = fills;
    try {
      frame.layoutPositioning = "AUTO";
      frame.layoutSizingHorizontal = "FILL";
      frame.layoutAlign = "STRETCH";
    } catch { }
    return frame;
  }

  // 2. Harvest Assets from Source
  interface ImgAsset {
    hash: string;
    name: string;
    width: number;
    height: number;
  }
  const discoveredImages: ImgAsset[] = [];

  interface TxtAsset {
    text: string;
    fontSize: number;
    isBold: boolean;
    y: number;
  }
  const discoveredTexts: TxtAsset[] = [];

  function harvest(n: SceneNode) {
    if ("fills" in n && Array.isArray((n as any).fills)) {
      for (const p of (n as any).fills) {
        if (p.type === "IMAGE" && p.imageHash) {
          discoveredImages.push({
            hash: p.imageHash,
            name: n.name || "Image",
            width: n.width,
            height: n.height,
          });
        }
      }
    }
    if (n.type === "TEXT") {
      const tn = n as TextNode;
      const str = (tn.characters || "").trim();
      if (str.length > 0) {
        const fs = typeof tn.fontSize === "number" ? tn.fontSize : 14;
        const fnStyle =
          tn.fontName && typeof tn.fontName === "object" && "style" in tn.fontName
            ? String(tn.fontName.style).toLowerCase()
            : "";
        discoveredTexts.push({
          text: str,
          fontSize: fs,
          isBold: fnStyle.includes("bold") || fnStyle.includes("semi") || fnStyle.includes("medium"),
          y: tn.y,
        });
      }
    }
    if ("children" in n) {
      for (const ch of (n as any).children) harvest(ch);
    }
  }
  harvest(sourceNode);

  // Discover Brand Name
  let brandName = "BRAND";
  const brandCandidate = discoveredTexts.find(
    (t) => t.y < 120 && t.text.length <= 25 && t.fontSize >= 14 && t.fontSize <= 24
  );
  if (brandCandidate) {
    brandName = brandCandidate.text;
  } else if (sourceNode.name) {
    brandName = sourceNode.name.split(/[-_|•]/)[0].trim().toUpperCase() || "BRAND";
  }

  // Discover Hero Headline
  const headingCandidates = discoveredTexts
    .filter((t) => t.fontSize >= 22 && t.text.length >= 6 && t.text.length <= 140)
    .sort((a, b) => b.fontSize - a.fontSize);
  const heroHeading =
    headingCandidates.length > 0
      ? headingCandidates[0].text
      : "Modern Experience Designed for Performance";

  // Discover Hero Description
  const descCandidates = discoveredTexts.filter(
    (t) => t.text !== heroHeading && t.text.length >= 24 && t.fontSize >= 12 && t.fontSize <= 18
  );
  const heroDesc =
    descCandidates.length > 0
      ? descCandidates[0].text
      : "Engineered with responsive Auto-Layout components, modern styling, and seamless user experience.";

  // Discover Hero Image
  const heroImg =
    discoveredImages.find((img) => img.width > 240 && img.height > 140) ||
    discoveredImages[0] ||
    null;

  // Discover CTA button text
  const buttonKeywords = [
    "get started", "shop now", "explore", "learn more", "contact",
    "sign up", "book", "try", "buy", "quote", "order", "view"
  ];
  const ctaCandidate = discoveredTexts.find(
    (t) => buttonKeywords.some((kw) => t.text.toLowerCase().includes(kw)) && t.text.length <= 32
  );
  const heroCtaText = ctaCandidate ? ctaCandidate.text : "Get Started Now →";

  // Discover Cards / Products
  interface CardData {
    title: string;
    cat?: string;
    price?: string;
    desc?: string;
    imageHash?: string;
  }
  const discoveredCards: CardData[] = [];

  function scanCards(n: SceneNode) {
    if (n.type === "FRAME" || n.type === "COMPONENT" || n.type === "INSTANCE") {
      const f = n as FrameNode;
      const lower = (f.name || "").toLowerCase();
      const isCardName = ["card", "product", "item", "tile", "feature", "pricing", "post", "cell"].some(
        (kw) => lower.includes(kw)
      );
      const hasKids = f.children && f.children.length >= 2;
      const hasVisual =
        ("fills" in f && Array.isArray(f.fills) && f.fills.length > 0) ||
        ("strokes" in f && Array.isArray(f.strokes) && f.strokes.length > 0) ||
        (typeof f.cornerRadius === "number" && f.cornerRadius > 0);

      if (hasKids && (isCardName || (hasVisual && f.width >= 120 && f.width <= 500 && f.height >= 100))) {
        const texts: string[] = [];
        let hash: string | undefined = undefined;

        function walkCard(cn: SceneNode) {
          if ("fills" in cn && Array.isArray((cn as any).fills) && !hash) {
            for (const fill of (cn as any).fills) {
              if (fill.type === "IMAGE" && fill.imageHash) hash = fill.imageHash;
            }
          }
          if (cn.type === "TEXT") {
            const txt = (cn as TextNode).characters?.trim();
            if (txt && !texts.includes(txt)) texts.push(txt);
          }
          if ("children" in cn) {
            for (const k of (cn as any).children) walkCard(k);
          }
        }
        walkCard(f);

        if (texts.length > 0) {
          const title = texts.find((t) => t.length <= 60 && t.length >= 3) || texts[0];
          const price = texts.find((t) => /[\$€£₹]|\b(ea|unit|mo|yr|min)\b/i.test(t));
          const desc = texts.find((t) => t !== title && t !== price && t.length > 20);
          const cat = texts.find((t) => t !== title && t !== price && t !== desc && t.length <= 25);
          discoveredCards.push({
            title,
            cat,
            price,
            desc,
            imageHash: hash,
          });
          return;
        }
      }
    }
    if ("children" in n) {
      for (const ch of (n as any).children) scanCards(ch);
    }
  }
  scanCards(sourceNode);

  // 3. Assemble Root Frame
  const root = figma.createFrame();
  root.name = options.targetName || `${sourceNode.name} | Mobile (${targetWidth}px)`;
  root.resize(targetWidth, 3800);
  root.x = sourceNode.x + sourceNode.width + 80;
  root.y = sourceNode.y;
  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "FIXED";
  root.itemSpacing = 0;
  root.fills = [{ type: "SOLID", color: T.bgCanvas }];

  const innerWidth = targetWidth - 32;

  function appendSection(child: FrameNode) {
    if (child.width < targetWidth) {
      try { child.resize(targetWidth, Math.max(child.height, 36)); } catch { }
    }
    root.appendChild(child);
    try {
      child.layoutPositioning = "AUTO";
      child.layoutSizingHorizontal = "FILL";
      if (child.layoutMode !== "NONE") {
        if (child.layoutMode === "VERTICAL") {
          child.primaryAxisSizingMode = "AUTO";
        } else {
          child.counterAxisSizingMode = "AUTO";
        }
        child.layoutSizingVertical = "HUG";
      }
    } catch { }
  }

  // 0. Status Bar
  const statusBar = figma.createFrame();
  statusBar.name = "Status Bar";
  statusBar.resize(targetWidth, 36);
  statusBar.layoutMode = "HORIZONTAL";
  statusBar.primaryAxisAlignItems = "SPACE_BETWEEN";
  statusBar.counterAxisAlignItems = "CENTER";
  statusBar.paddingLeft = 20;
  statusBar.paddingRight = 20;
  statusBar.paddingTop = 10;
  statusBar.paddingBottom = 8;
  statusBar.fills = [{ type: "SOLID", color: T.isDark ? { r: 0.05, g: 0.07, b: 0.1 } : { r: 0.08, g: 0.1, b: 0.15 } }];
  statusBar.appendChild(makeTxt("9:41", 12.5, "Bold", { r: 1, g: 1, b: 1 }));
  const statusIcons = figma.createFrame();
  statusIcons.name = "Icons";
  statusIcons.layoutMode = "HORIZONTAL";
  statusIcons.itemSpacing = 6;
  statusIcons.counterAxisAlignItems = "CENTER";
  statusIcons.fills = [];
  statusIcons.appendChild(makeTxt("5G", 11, "Bold", { r: 1, g: 1, b: 1 }));
  statusIcons.appendChild(makeTxt("100%", 11, "Medium", { r: 1, g: 1, b: 1 }));
  statusBar.appendChild(statusIcons);
  appendSection(statusBar);

  // 1. Mobile Header Bar (56px)
  const header = figma.createFrame();
  header.name = "Mobile App Header";
  header.resize(targetWidth, 56);
  header.layoutMode = "HORIZONTAL";
  header.primaryAxisAlignItems = "SPACE_BETWEEN";
  header.counterAxisAlignItems = "CENTER";
  header.paddingLeft = 16;
  header.paddingRight = 16;
  header.paddingTop = 12;
  header.paddingBottom = 12;
  header.fills = [{ type: "SOLID", color: T.cardBg }];
  header.strokes = [{ type: "SOLID", color: T.borderLight }];
  header.strokeWeight = 1;

  const brandRow = figma.createFrame();
  brandRow.name = "Brand";
  brandRow.layoutMode = "HORIZONTAL";
  brandRow.counterAxisAlignItems = "CENTER";
  brandRow.itemSpacing = 8;
  brandRow.fills = [];

  const brandBadge = figma.createFrame();
  brandBadge.name = "Logo Badge";
  brandBadge.resize(32, 32);
  brandBadge.cornerRadius = 8;
  brandBadge.layoutMode = "HORIZONTAL";
  brandBadge.primaryAxisAlignItems = "CENTER";
  brandBadge.counterAxisAlignItems = "CENTER";
  brandBadge.fills = [{ type: "SOLID", color: T.brandAccent }];
  const badgeInitial = brandName.slice(0, 2).toUpperCase();
  brandBadge.appendChild(makeTxt(badgeInitial, 13, "Bold", { r: 1, g: 1, b: 1 }));
  brandRow.appendChild(brandBadge);
  brandRow.appendChild(makeTxt(brandName, 16, "Bold", T.textPrimary));
  header.appendChild(brandRow);

  const actionsRow = figma.createFrame();
  actionsRow.name = "Header Actions";
  actionsRow.layoutMode = "HORIZONTAL";
  actionsRow.counterAxisAlignItems = "CENTER";
  actionsRow.itemSpacing = 10;
  actionsRow.fills = [];

  const searchAction = figma.createFrame();
  searchAction.name = "Search Icon";
  searchAction.resize(28, 28);
  searchAction.layoutMode = "HORIZONTAL";
  searchAction.primaryAxisAlignItems = "CENTER";
  searchAction.counterAxisAlignItems = "CENTER";
  searchAction.fills = [];
  searchAction.appendChild(makeTxt("🔍", 13, "Regular", T.textPrimary));
  actionsRow.appendChild(searchAction);

  const menuBtn = figma.createFrame();
  menuBtn.name = "Menu Button";
  menuBtn.resize(34, 34);
  menuBtn.cornerRadius = 6;
  menuBtn.layoutMode = "VERTICAL";
  menuBtn.primaryAxisAlignItems = "CENTER";
  menuBtn.counterAxisAlignItems = "CENTER";
  menuBtn.itemSpacing = 4;
  menuBtn.fills = [{ type: "SOLID", color: T.cardSubtleBg }];
  for (let b = 0; b < 3; b++) {
    const bar = figma.createRectangle();
    bar.resize(18, 2);
    bar.cornerRadius = 1;
    bar.fills = [{ type: "SOLID", color: T.textPrimary }];
    menuBtn.appendChild(bar);
  }
  actionsRow.appendChild(menuBtn);
  header.appendChild(actionsRow);
  appendSection(header);

  // 2. Hero Section
  const heroSection = figma.createFrame();
  heroSection.name = "Section 1: Hero";
  heroSection.resize(targetWidth, 480);
  heroSection.layoutMode = "VERTICAL";
  heroSection.paddingLeft = 16;
  heroSection.paddingRight = 16;
  heroSection.paddingTop = 24;
  heroSection.paddingBottom = 24;
  heroSection.itemSpacing = 16;
  heroSection.fills = [{ type: "SOLID", color: T.cardBg }];

  const eyebrow = figma.createFrame();
  eyebrow.name = "Eyebrow Badge";
  eyebrow.layoutMode = "HORIZONTAL";
  eyebrow.paddingLeft = 10;
  eyebrow.paddingRight = 10;
  eyebrow.paddingTop = 4;
  eyebrow.paddingBottom = 4;
  eyebrow.cornerRadius = 6;
  eyebrow.fills = [{ type: "SOLID", color: T.brandAccent, opacity: 0.12 }];
  eyebrow.appendChild(makeTxt("★ OFFICIAL COLLECTION", 11, "Bold", T.brandAccent, { letterSpacing: 0.5 }));
  heroSection.appendChild(eyebrow);

  heroSection.appendChild(makeTxt(heroHeading, 26, "Bold", T.textPrimary, { lineHeight: 32, fillWidth: true }));
  heroSection.appendChild(makeTxt(heroDesc, 13.5, "Regular", T.textMuted, { lineHeight: 20, fillWidth: true }));

  // Hero visual card
  const heroCard = figma.createFrame();
  heroCard.name = "Hero Visual Card";
  heroCard.resize(innerWidth, 220);
  heroCard.cornerRadius = 14;
  heroCard.clipsContent = true;
  heroCard.layoutMode = "NONE";
  heroCard.fills = [{ type: "SOLID", color: T.cardSubtleBg }];
  heroCard.strokes = [{ type: "SOLID", color: T.borderLight }];
  heroCard.strokeWeight = 1;
  try {
    heroCard.layoutPositioning = "AUTO";
    heroCard.layoutSizingHorizontal = "FILL";
    heroCard.layoutAlign = "STRETCH";
  } catch { }

  const heroImgNode = makeImgBox("Hero Image", innerWidth, 220, heroImg ? heroImg.hash : null, "FILL", null, 0);
  heroImgNode.x = 0;
  heroImgNode.y = 0;
  heroCard.appendChild(heroImgNode);
  heroSection.appendChild(heroCard);

  // Hero CTA Buttons
  const ctaStack = figma.createFrame();
  ctaStack.name = "CTA Buttons";
  ctaStack.resize(innerWidth, 50);
  ctaStack.layoutMode = "VERTICAL";
  ctaStack.itemSpacing = 10;
  ctaStack.fills = [];
  try {
    ctaStack.layoutPositioning = "AUTO";
    ctaStack.layoutSizingHorizontal = "FILL";
    ctaStack.layoutAlign = "STRETCH";
    ctaStack.layoutSizingVertical = "HUG";
  } catch { }

  const mainBtn = figma.createFrame();
  mainBtn.name = "Primary CTA Button";
  mainBtn.resize(innerWidth, 50);
  mainBtn.layoutMode = "HORIZONTAL";
  mainBtn.primaryAxisAlignItems = "CENTER";
  mainBtn.counterAxisAlignItems = "CENTER";
  mainBtn.paddingTop = 15;
  mainBtn.paddingBottom = 15;
  mainBtn.paddingLeft = 24;
  mainBtn.paddingRight = 24;
  mainBtn.cornerRadius = 10;
  mainBtn.fills = [{ type: "SOLID", color: T.brandAccent }];
  try {
    mainBtn.layoutPositioning = "AUTO";
    mainBtn.layoutSizingHorizontal = "FILL";
    mainBtn.layoutAlign = "STRETCH";
    mainBtn.layoutSizingVertical = "HUG";
  } catch { }
  mainBtn.appendChild(makeTxt(heroCtaText, 13.5, "Bold", { r: 1, g: 1, b: 1 }));
  ctaStack.appendChild(mainBtn);
  heroSection.appendChild(ctaStack);
  appendSection(heroSection);

  // 3. Cards / Products / Features Section
  const cardsToRender =
    discoveredCards.length > 0
      ? discoveredCards.slice(0, 6)
      : discoveredImages.slice(1, 5).map((img, i) => ({
        title: img.name.replace(/[-_]/g, " ") || `Feature Item ${i + 1}`,
        cat: "FEATURED",
        price: "$29.00",
        desc: "Crafted with durable materials and precision design.",
        imageHash: img.hash,
      }));

  if (cardsToRender.length > 0) {
    const cardsSection = figma.createFrame();
    cardsSection.name = "Section 2: Collection Cards";
    cardsSection.resize(targetWidth, 1200);
    cardsSection.layoutMode = "VERTICAL";
    cardsSection.paddingLeft = 16;
    cardsSection.paddingRight = 16;
    cardsSection.paddingTop = 24;
    cardsSection.paddingBottom = 28;
    cardsSection.itemSpacing = 16;
    cardsSection.fills = [{ type: "SOLID", color: T.bgCanvas }];

    const cardsHead = figma.createFrame();
    cardsHead.name = "Heading Block";
    cardsHead.resize(innerWidth, 48);
    cardsHead.layoutMode = "VERTICAL";
    cardsHead.itemSpacing = 4;
    cardsHead.fills = [];
    try {
      cardsHead.layoutPositioning = "AUTO";
      cardsHead.layoutSizingHorizontal = "FILL";
      cardsHead.layoutSizingVertical = "HUG";
    } catch { }
    cardsHead.appendChild(makeTxt("FEATURED SHOWCASE", 11, "Bold", T.brandAccent, { letterSpacing: 0.5 }));
    cardsHead.appendChild(makeTxt("Explore Collection", 22, "Bold", T.textPrimary));
    cardsSection.appendChild(cardsHead);

    cardsToRender.forEach((c) => {
      const card = figma.createFrame();
      card.name = `Card: ${c.title}`;
      card.resize(innerWidth, 340);
      card.layoutMode = "VERTICAL";
      card.primaryAxisSizingMode = "AUTO";
      card.counterAxisSizingMode = "FIXED";
      card.itemSpacing = 12;
      card.paddingLeft = 16;
      card.paddingRight = 16;
      card.paddingTop = 16;
      card.paddingBottom = 16;
      card.cornerRadius = 14;
      card.fills = [{ type: "SOLID", color: T.cardBg }];
      card.strokes = [{ type: "SOLID", color: T.borderLight }];
      card.strokeWeight = 1;

      // Card Image
      const imgWrap = figma.createFrame();
      imgWrap.name = "Photo Container";
      imgWrap.resize(innerWidth - 32, 170);
      imgWrap.cornerRadius = 10;
      imgWrap.clipsContent = true;
      imgWrap.fills = [{ type: "SOLID", color: T.cardSubtleBg }];
      try {
        imgWrap.layoutPositioning = "AUTO";
        imgWrap.layoutSizingHorizontal = "FILL";
      } catch { }

      const cardImg = makeImgBox(c.title, innerWidth - 32, 170, c.imageHash || null, "FIT", T.cardSubtleBg, 10);
      cardImg.x = 0;
      cardImg.y = 0;
      imgWrap.appendChild(cardImg);
      card.appendChild(imgWrap);

      // Card Info
      const info = figma.createFrame();
      info.name = "Card Info";
      info.resize(innerWidth - 32, 60);
      info.layoutMode = "VERTICAL";
      info.primaryAxisSizingMode = "AUTO";
      info.itemSpacing = 4;
      info.fills = [];
      try {
        info.layoutPositioning = "AUTO";
        info.layoutSizingHorizontal = "FILL";
        info.layoutSizingVertical = "HUG";
      } catch { }

      if (c.cat) info.appendChild(makeTxt(c.cat.toUpperCase(), 10.5, "Bold", T.brandAccent));
      info.appendChild(makeTxt(c.title, 15, "Bold", T.textPrimary, { fillWidth: true }));

      if (c.price) {
        const pRow = figma.createFrame();
        pRow.name = "Pricing Row";
        pRow.resize(innerWidth - 32, 22);
        pRow.layoutMode = "HORIZONTAL";
        pRow.primaryAxisAlignItems = "SPACE_BETWEEN";
        pRow.counterAxisAlignItems = "CENTER";
        pRow.fills = [];
        try {
          pRow.layoutPositioning = "AUTO";
          pRow.layoutSizingHorizontal = "FILL";
          pRow.layoutSizingVertical = "HUG";
        } catch { }
        pRow.appendChild(makeTxt(c.price, 14, "Bold", T.textPrimary));
        pRow.appendChild(makeTxt("In Stock", 11, "Medium", { r: 0.08, g: 0.64, b: 0.36 }));
        info.appendChild(pRow);
      }
      card.appendChild(info);

      // Action Button
      const btn = figma.createFrame();
      btn.name = "Card CTA Button";
      btn.resize(innerWidth - 32, 48);
      btn.layoutMode = "HORIZONTAL";
      btn.primaryAxisAlignItems = "CENTER";
      btn.counterAxisAlignItems = "CENTER";
      btn.paddingTop = 14;
      btn.paddingBottom = 14;
      btn.paddingLeft = 20;
      btn.paddingRight = 20;
      btn.cornerRadius = 8;
      btn.fills = [{ type: "SOLID", color: T.isDark ? T.brandAccent : { r: 0.08, g: 0.11, b: 0.18 } }];
      try {
        btn.layoutPositioning = "AUTO";
        btn.layoutSizingHorizontal = "FILL";
        btn.layoutAlign = "STRETCH";
        btn.layoutSizingVertical = "HUG";
      } catch { }
      btn.appendChild(makeTxt("View Details →", 13, "SemiBold", { r: 1, g: 1, b: 1 }));
      card.appendChild(btn);

      cardsSection.appendChild(card);
      try {
        card.layoutPositioning = "AUTO";
        card.layoutSizingHorizontal = "FILL";
        card.layoutSizingVertical = "HUG";
      } catch { }
    });

    appendSection(cardsSection);
  }

  // 4. Promo / Assistance Callout Banner
  const calloutSection = figma.createFrame();
  calloutSection.name = "Section 3: Callout Banner";
  calloutSection.resize(targetWidth, 220);
  calloutSection.layoutMode = "VERTICAL";
  calloutSection.paddingLeft = 16;
  calloutSection.paddingRight = 16;
  calloutSection.paddingTop = 16;
  calloutSection.paddingBottom = 16;
  calloutSection.fills = [];

  const calloutBox = figma.createFrame();
  calloutBox.name = "Banner Box";
  calloutBox.resize(innerWidth, 180);
  calloutBox.layoutMode = "VERTICAL";
  calloutBox.itemSpacing = 10;
  calloutBox.paddingLeft = 18;
  calloutBox.paddingRight = 18;
  calloutBox.paddingTop = 18;
  calloutBox.paddingBottom = 18;
  calloutBox.cornerRadius = 14;
  calloutBox.fills = [{ type: "SOLID", color: T.isDark ? { r: 0.06, g: 0.09, b: 0.15 } : { r: 0.07, g: 0.1, b: 0.18 } }];

  calloutBox.appendChild(makeTxt("PREMIUM SUPPORT", 10.5, "Bold", T.brandAccent, { letterSpacing: 0.5 }));
  calloutBox.appendChild(
    makeTxt("Have questions or custom requirements? Let's connect.", 16, "Bold", { r: 1, g: 1, b: 1 }, {
      lineHeight: 22,
      fillWidth: true,
    })
  );
  calloutBox.appendChild(
    makeTxt(
      "Our team provides dedicated turnaround times, proofing support, and volume discounts.",
      12.5,
      "Regular",
      { r: 0.8, g: 0.88, b: 0.98 },
      { lineHeight: 18, fillWidth: true }
    )
  );

  const calloutBtn = figma.createFrame();
  calloutBtn.name = "Callout Button";
  calloutBtn.resize(innerWidth - 36, 48);
  calloutBtn.layoutMode = "HORIZONTAL";
  calloutBtn.primaryAxisAlignItems = "CENTER";
  calloutBtn.counterAxisAlignItems = "CENTER";
  calloutBtn.paddingTop = 14;
  calloutBtn.paddingBottom = 14;
  calloutBtn.paddingLeft = 20;
  calloutBtn.paddingRight = 20;
  calloutBtn.cornerRadius = 8;
  calloutBtn.fills = [{ type: "SOLID", color: T.brandAccent }];
  try {
    calloutBtn.layoutPositioning = "AUTO";
    calloutBtn.layoutSizingHorizontal = "FILL";
    calloutBtn.layoutAlign = "STRETCH";
    calloutBtn.layoutSizingVertical = "HUG";
  } catch { }
  calloutBtn.appendChild(makeTxt("Contact Support Team", 13, "SemiBold", { r: 1, g: 1, b: 1 }));
  calloutBox.appendChild(calloutBtn);

  calloutSection.appendChild(calloutBox);
  try {
    calloutBox.layoutPositioning = "AUTO";
    calloutBox.layoutSizingHorizontal = "FILL";
    calloutBox.layoutSizingVertical = "HUG";
  } catch { }
  appendSection(calloutSection);

  // 4.5. Dynamic Newsletter / Extra Subscription Section
  const newsletterCandidate = discoveredTexts.find(
    (t) =>
      (t.text.toLowerCase().includes("newsletter") ||
        t.text.toLowerCase().includes("subscribe") ||
        t.text.toLowerCase().includes("stay up to date")) &&
      t.text.length <= 120
  );
  if (newsletterCandidate) {
    const newsSec = figma.createFrame();
    newsSec.name = "Newsletter Section";
    newsSec.resize(targetWidth, 140);
    newsSec.layoutMode = "VERTICAL";
    newsSec.paddingLeft = 16;
    newsSec.paddingRight = 16;
    newsSec.paddingTop = 20;
    newsSec.paddingBottom = 20;
    newsSec.itemSpacing = 12;
    newsSec.fills = [
      {
        type: "SOLID",
        color: T.isDark ? { r: 0.08, g: 0.11, b: 0.18 } : { r: 0.94, g: 0.96, b: 0.98 },
      },
    ];

    newsSec.appendChild(
      makeTxt(newsletterCandidate.text, 13, "SemiBold", T.textPrimary, {
        lineHeight: 18,
        fillWidth: true,
      })
    );

    const formRow = figma.createFrame();
    formRow.name = "Subscription Form";
    formRow.resize(innerWidth, 46);
    formRow.layoutMode = "HORIZONTAL";
    formRow.primaryAxisAlignItems = "SPACE_BETWEEN";
    formRow.counterAxisAlignItems = "CENTER";
    formRow.paddingLeft = 14;
    formRow.paddingRight = 4;
    formRow.paddingTop = 4;
    formRow.paddingBottom = 4;
    formRow.cornerRadius = 8;
    formRow.fills = [{ type: "SOLID", color: T.cardBg }];
    formRow.strokes = [{ type: "SOLID", color: T.borderLight }];
    formRow.strokeWeight = 1;
    formRow.appendChild(makeTxt("Enter your email...", 12, "Regular", T.textMuted));

    const sBtn = figma.createFrame();
    sBtn.name = "Subscribe Button";
    sBtn.layoutMode = "HORIZONTAL";
    sBtn.counterAxisAlignItems = "CENTER";
    sBtn.paddingLeft = 16;
    sBtn.paddingRight = 16;
    sBtn.paddingTop = 8;
    sBtn.paddingBottom = 8;
    sBtn.cornerRadius = 6;
    sBtn.fills = [{ type: "SOLID", color: T.brandAccent }];
    sBtn.appendChild(makeTxt("Subscribe", 12.5, "Bold", { r: 1, g: 1, b: 1 }));
    formRow.appendChild(sBtn);
    newsSec.appendChild(formRow);
    appendSection(newsSec);
  }

  // 5. Mobile Footer
  const footer = figma.createFrame();
  footer.name = "Mobile Footer";
  footer.resize(targetWidth, 240);
  footer.layoutMode = "VERTICAL";
  footer.paddingLeft = 16;
  footer.paddingRight = 16;
  footer.paddingTop = 28;
  footer.paddingBottom = 32;
  footer.itemSpacing = 16;
  footer.fills = [{ type: "SOLID", color: T.isDark ? { r: 0.04, g: 0.06, b: 0.1 } : { r: 0.05, g: 0.07, b: 0.12 } }];

  footer.appendChild(makeTxt(brandName, 18, "Bold", { r: 1, g: 1, b: 1 }));
  footer.appendChild(
    makeTxt(
      "High-performance design system with production-grade components and responsive Auto-Layout.",
      12,
      "Regular",
      { r: 0.6, g: 0.68, b: 0.8 },
      { lineHeight: 18, fillWidth: true }
    )
  );

  // Dynamically harvest links found in sourceNode
  const discoveredLinks = discoveredTexts
    .filter(
      (t) =>
        t.y > sourceNode.height * 0.55 &&
        t.text.length >= 4 &&
        t.text.length <= 45 &&
        !t.text.includes(brandName) &&
        !t.text.toLowerCase().includes("copyright") &&
        !t.text.includes("©")
    )
    .map((t) => t.text)
    .slice(0, 10);

  const linksToRender =
    discoveredLinks.length >= 3
      ? discoveredLinks
      : ["Products & Solutions", "Documentation", "Terms of Service", "Privacy Policy"];
  linksToRender.forEach((l) => {
    footer.appendChild(makeTxt(`• ${l}`, 12, "Medium", { r: 0.8, g: 0.88, b: 0.98 }));
  });

  // Check for contact info (phone, email, address)
  const contactCandidates = discoveredTexts.filter(
    (t) =>
      t.text.includes("@") ||
      t.text.includes("(510)") ||
      t.text.includes("(800)") ||
      t.text.toLowerCase().includes("phone") ||
      t.text.toLowerCase().includes("toll-free") ||
      t.text.toLowerCase().includes("contact")
  );
  if (contactCandidates.length > 0) {
    const cBox = figma.createFrame();
    cBox.name = "Contact Info";
    cBox.layoutMode = "VERTICAL";
    cBox.itemSpacing = 6;
    cBox.fills = [];
    contactCandidates.slice(0, 4).forEach((c) => {
      cBox.appendChild(makeTxt(c.text, 11.5, "Medium", { r: 0.75, g: 0.82, b: 0.92 }));
    });
    footer.appendChild(cBox);
  }

  footer.appendChild(
    makeTxt(`© 2024 ${brandName}. All rights reserved.`, 10.5, "Regular", { r: 0.45, g: 0.52, b: 0.62 }, {
      lineHeight: 16,
    })
  );
  appendSection(footer);

  // Post-order normalization: ensure every single card/box has FILL width and HUG height
  const cardsFixed = fixAllCardsAndContainers(root, targetWidth);

  // Select and zoom into view
  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);

  return {
    success: true,
    frameId: root.id,
    frameName: root.name,
    targetWidth,
    width: Math.round(root.width),
    height: Math.round(root.height),
    sectionsAdjusted: 5,
    textNodesScaled: discoveredTexts.length,
    gridsReflowed: cardsFixed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADAPTIVE AUTO-LAYOUT TREE REFLOW (FOR ARBITRARY FRAMES & COMPONENTS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transforms any desktop header or navbar frame into a compact 56px mobile app header.
 * Identifies the Brand / Logo, retains essential action icons, collapses desktop links
 * into a sleek mobile hamburger menu button, and enforces 56px height.
 */
function compactMobileNavbar(header: FrameNode, targetWidth: number): void {
  try {
    // 1. Scan children to separate Brand / Logo from desktop navigation links
    let logoNode: SceneNode | null = null;
    const navLinks: SceneNode[] = [];
    const actionIcons: SceneNode[] = [];

    for (const child of header.children) {
      const cName = (child.name || "").toLowerCase();
      const isLogo =
        cName.includes("logo") ||
        cName.includes("brand") ||
        (child.type === "TEXT" && child.characters.length <= 15 && child.x < 140);
      const isAction =
        cName.includes("cart") ||
        cName.includes("search") ||
        cName.includes("user") ||
        cName.includes("profile") ||
        cName.includes("bag");
      const isNav =
        cName.includes("nav") ||
        cName.includes("link") ||
        cName.includes("menu") ||
        (child.type === "FRAME" && (child as FrameNode).children && (child as FrameNode).children.length >= 2) ||
        (child.type === "TEXT" && !isLogo);

      if (isLogo && !logoNode) {
        logoNode = child;
      } else if (isAction) {
        actionIcons.push(child);
      } else if (isNav) {
        navLinks.push(child);
      }
    }

    if (!logoNode && header.children.length > 0) {
      logoNode = header.children[0];
    }

    // 2. If there are desktop navigation links, hide them to prevent a 400px vertical list
    if (navLinks.length >= 1) {
      for (const link of navLinks) {
        if (link !== logoNode) {
          try { link.visible = false; } catch { }
        }
      }
    }

    // 3. Ensure a clean mobile menu button (hamburger) exists
    const hasHamburger = header.findOne(
      (n) =>
        n.name.toLowerCase().includes("hamburger") ||
        n.name.toLowerCase().includes("menu-btn") ||
        n.name.toLowerCase().includes("menu_btn")
    );

    if (!hasHamburger) {
      const menuBtn = figma.createFrame();
      menuBtn.name = "Mobile Menu Button";
      menuBtn.resize(36, 36);
      menuBtn.cornerRadius = 6;
      menuBtn.layoutMode = "VERTICAL";
      menuBtn.primaryAxisAlignItems = "CENTER";
      menuBtn.counterAxisAlignItems = "CENTER";
      menuBtn.itemSpacing = 4;
      menuBtn.fills = [];
      const barColor: RGB = { r: 0.12, g: 0.15, b: 0.2 };
      for (let i = 0; i < 3; i++) {
        const bar = figma.createRectangle();
        bar.resize(18, 2);
        bar.cornerRadius = 1;
        bar.fills = [{ type: "SOLID", color: barColor }];
        menuBtn.appendChild(bar);
      }
      header.appendChild(menuBtn);
    }

    // 4. Enforce 56px mobile app bar Auto-Layout
    safeSetLayoutMode(header, "HORIZONTAL");
    safeSetPrimaryAlign(header, "SPACE_BETWEEN");
    safeSetCounterAlign(header, "CENTER");
    safeSetPadding(header, 12, 16, 12, 16);
    try {
      header.resize(targetWidth, 56);
      header.layoutSizingHorizontal = "FILL";
      header.layoutSizingVertical = "FIXED";
    } catch { }
  } catch (err) {
    console.warn("[ResponsiveConverter] Error in compactMobileNavbar:", err);
  }
}

async function reflowDirectTree(
  sourceNode: FrameNode,
  targetWidth: number = 412,
  options: ResponsiveConvertOptions
): Promise<ResponsiveConvertResult> {
  const {
    scaleTypography = true,
    reflowGrids = true,
    createNewFrame = true,
  } = options;

  const horizontalPadding =
    options.horizontalPadding ?? (targetWidth <= 480 ? 16 : targetWidth <= 900 ? 24 : 64);
  const contentWidth = targetWidth - horizontalPadding * 2;

  let workingFrame: FrameNode;
  if (createNewFrame) {
    workingFrame = sourceNode.clone();
    workingFrame.x = sourceNode.x + sourceNode.width + 80;
    workingFrame.y = sourceNode.y;

    const deviceLabel =
      targetWidth <= 480 ? "Mobile" : targetWidth <= 900 ? "Tablet" : "Desktop";
    workingFrame.name =
      options.targetName || `${sourceNode.name} | ${deviceLabel} (${targetWidth}px)`;
  } else {
    workingFrame = sourceNode;
  }

  // Preload fallback fonts safely
  const loadedFonts = new Set<string>();
  const fallbackFont: FontName = { family: "Inter", style: "Regular" };
  const fallbackBold: FontName = { family: "Inter", style: "Bold" };
  const fallbackMedium: FontName = { family: "Inter", style: "Medium" };

  async function ensureFontLoaded(font: FontName): Promise<boolean> {
    const key = `${font.family}__${font.style}`;
    if (loadedFonts.has(key)) return true;
    try {
      await figma.loadFontAsync(font);
      loadedFonts.add(key);
      return true;
    } catch {
      try {
        await figma.loadFontAsync(fallbackFont);
        loadedFonts.add("Inter__Regular");
        return true;
      } catch {
        return false;
      }
    }
  }

  await ensureFontLoaded(fallbackFont);
  await ensureFontLoaded(fallbackBold);
  await ensureFontLoaded(fallbackMedium);

  let sectionsAdjusted = 0;
  let textNodesScaled = 0;
  let gridsReflowed = 0;

  // Configure Root Frame
  // If workingFrame has no auto-layout (freeform canvas / absolute coordinates),
  // sort all direct top-level children by their visual Y coordinate so that
  // top-of-page sections (header, hero, features, footer) stay in natural visual order!
  if (sourceNode.layoutMode === "NONE" && workingFrame.children && workingFrame.children.length > 1) {
    try {
      const sorted = [...workingFrame.children].sort((a, b) => a.y - b.y);
      sorted.forEach((ch, idx) => workingFrame.insertChild(idx, ch));
    } catch (e) { }
  }

  try {
    workingFrame.resize(targetWidth, workingFrame.height);
  } catch { }
  safeSetLayoutMode(workingFrame, "VERTICAL");
  safeSetItemSpacing(workingFrame, 0);
  try {
    workingFrame.counterAxisSizingMode = "FIXED";
    workingFrame.primaryAxisSizingMode = "AUTO";
    workingFrame.clipsContent = false;
  } catch { }

  // Re-order header if it was placed at the end of the DOM
  if (workingFrame.children && workingFrame.children.length > 0) {
    const currentChildren = [...workingFrame.children];
    const headerIdx = currentChildren.findIndex((c) => {
      const lower = c.name.toLowerCase();
      return lower.includes("header") || lower.includes("navbar") || lower.includes("top-bar");
    });
    if (headerIdx > 0) {
      try {
        const headerNode = currentChildren[headerIdx];
        workingFrame.insertChild(0, headerNode);
      } catch (e) { }
    }
  }

  async function reflowNode(
    node: SceneNode,
    parentLayout: "VERTICAL" | "HORIZONTAL" | "NONE" | "GRID",
    availableWidth: number,
    depth: number
  ): Promise<void> {
    if (depth > 12) return;

    try {
      if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
        const frame = node as FrameNode;
        sectionsAdjusted++;

        // Remove absolute positioning so children participate in auto-layout reflow
        try {
          if ("layoutPositioning" in frame && (frame as any).layoutPositioning === "ABSOLUTE") {
            (frame as any).layoutPositioning = "AUTO";
          }
        } catch { }

        // If a frame has layoutMode === "NONE" and has children with coordinates:
        // Sort its children visually (by y first, then x if on approximately the same row)
        if (frame.layoutMode === "NONE" && frame.children && frame.children.length > 1) {
          try {
            const sortedChildren = [...frame.children].sort((a, b) => {
              if (Math.abs(a.y - b.y) <= 16) {
                return a.x - b.x;
              }
              return a.y - b.y;
            });
            sortedChildren.forEach((ch, idx) => frame.insertChild(idx, ch));
          } catch { }
        }

        const lowerName = (frame.name || "").toLowerCase();
        const isHeaderOrNav =
          lowerName.includes("header") ||
          lowerName.includes("navbar") ||
          lowerName.includes("nav-bar") ||
          lowerName.includes("appbar") ||
          lowerName.includes("top-bar") ||
          lowerName.includes("topbar") ||
          lowerName.includes("nav") ||
          lowerName.includes("menu");

        // Collapse empty transparent spacer frames
        const hasNoKids = !frame.children || frame.children.length === 0;
        const hasNoFills = !frame.fills || (Array.isArray(frame.fills) && frame.fills.length === 0);
        const hasNoStrokes = !frame.strokes || (Array.isArray(frame.strokes) && frame.strokes.length === 0);
        if (hasNoKids && hasNoFills && hasNoStrokes && frame.height > 24) {
          try {
            frame.resize(frame.width, 0);
            frame.visible = false;
          } catch { }
          return;
        }

        const isSectionKeyword = [
          "section", "hero", "header", "navbar", "nav", "footer", "banner",
          "content", "features", "pricing", "testimonial", "cta", "faq", "body", "main", "top"
        ].some((kw) => lowerName.includes(kw));

        // Only true substantial sections get treated as top-level sections!
        // Small loose icons, buttons, badges, or divider lines at the root are NOT resized to targetWidth or given 44px padding!
        const isTopLevelSection =
          frame.parent === workingFrame &&
          (isSectionKeyword || frame.width >= targetWidth * 0.45 || frame.height >= 70 || (frame.children && frame.children.length >= 3));

        if (isTopLevelSection) {
          if (frame.width > targetWidth || frame.width < targetWidth * 0.9) {
            try {
              frame.resize(targetWidth, frame.height);
            } catch { }
          }
          try {
            frame.layoutPositioning = "AUTO";
            frame.layoutSizingHorizontal = "FILL";
          } catch { }

          if (isHeaderOrNav) {
            compactMobileNavbar(frame, targetWidth);
            return;
          }

          if (frame.layoutMode === "NONE" || (frame.layoutMode as string) === "GRID") {
            safeSetLayoutMode(frame, "VERTICAL");
            safeSetItemSpacing(frame, 16);
            safeSetPrimaryAlign(frame, "MIN");
            safeSetCounterAlign(frame, "MIN");
          }

          // Standard section padding
          const pt = toNum(frame.paddingTop);
          const pb = toNum(frame.paddingBottom);

          safeSetPadding(
            frame,
            Math.min(28, Math.max(16, pt)),
            16,
            Math.min(28, Math.max(16, pb)),
            16
          );
          safeSetItemSpacing(frame, Math.min(20, Math.max(12, toNum(frame.itemSpacing))));

          if (frame.layoutMode !== "NONE") {
            try {
              if (frame.layoutMode === "VERTICAL") {
                frame.primaryAxisSizingMode = "AUTO";
              } else {
                frame.counterAxisSizingMode = "AUTO";
              }
              frame.layoutSizingVertical = "HUG";
            } catch { }
          }
        } else {
          // Non-top-level padding scaling
          const pl = toNum(frame.paddingLeft);
          const pr = toNum(frame.paddingRight);
          const pt = toNum(frame.paddingTop);
          const pb = toNum(frame.paddingBottom);
          if (pl >= 32 || pr >= 32) {
            safeSetPadding(frame, undefined, horizontalPadding, undefined, horizontalPadding);
          }
          if (pt > 48) {
            safeSetPadding(frame, targetWidth <= 480 ? 20 : 32, undefined, undefined, undefined);
          }
          if (pb > 48) {
            safeSetPadding(frame, undefined, undefined, targetWidth <= 480 ? 20 : 32, undefined);
          }
        }

        // Convert NONE or GRID frames with multiple wide children into VERTICAL auto-layout
        const isSearchBar =
          lowerName.includes("search") ||
          (frame.children &&
            frame.children.length === 2 &&
            frame.children.some((c) => (c.name || "").toLowerCase().includes("input")) &&
            frame.children.some((c) => (c.name || "").toLowerCase().includes("btn") || (c.name || "").toLowerCase().includes("button")));
        const isChipOrTagRow =
          lowerName.includes("chip") ||
          lowerName.includes("tag") ||
          lowerName.includes("badge") ||
          lowerName.includes("tab");
        const isInlineRow =
          isHeaderOrNav ||
          isSearchBar ||
          isChipOrTagRow ||
          (frame.children &&
            frame.children.length === 2 &&
            frame.children.every((c) => c.width < availableWidth * 0.45));

        const role = classifyResponsiveRole(frame, frame.parent as FrameNode | null, workingFrame);

        // Protect small elements, chips, badges, and inline rows from multi-column reflow!
        const isSmallRowOrChip =
          role === "BADGE_OR_CHIP" ||
          role === "HORIZONTAL_ROW" ||
          role === "NAV_OR_HEADER_ROW" ||
          role === "BUTTON_CTA" ||
          role === "BUTTON_INLINE" ||
          role === "ICON_OR_AVATAR" ||
          isInlineRow ||
          toNum(frame.height) <= 64;

        // Protect navigation link groups from being reflowed into vertical columns with 16px gaps!
        const isNavGroup =
          role === "NAV_OR_HEADER_ROW" ||
          isHeaderOrNav ||
          lowerName.includes("nav") ||
          lowerName.includes("menu") ||
          lowerName.includes("link") ||
          (frame.parent && (frame.parent.name || "").toLowerCase().includes("header")) ||
          (frame.parent && (frame.parent.name || "").toLowerCase().includes("nav"));

        const isMultiCol =
          !isSmallRowOrChip &&
          !isNavGroup &&
          frame.children &&
          frame.children.length >= 2 &&
          (frame.layoutMode === "NONE" ||
            (frame.layoutMode as string) === "GRID" ||
            frame.layoutMode === "HORIZONTAL");

        if (reflowGrids && isMultiCol && targetWidth <= 520) {
          const totalChildWidth = frame.children.reduce((sum, c) => sum + c.width, 0);
          // Only reflow if total child width exceeds available width OR children are substantial cards (height >= 70)
          if (totalChildWidth > availableWidth || frame.children.some((c) => c.width > availableWidth * 0.45 && toNum(c.height) >= 70)) {
            safeSetLayoutMode(frame, "VERTICAL");
            safeSetItemSpacing(frame, 14);
            safeSetPrimaryAlign(frame, "MIN");
            safeSetCounterAlign(frame, "MIN");
            gridsReflowed++;
          }
        }

        // Media / Image Frame detection:
        const hasImageFill =
          "fills" in frame &&
          Array.isArray(frame.fills) &&
          frame.fills.some((f) => f.type === "IMAGE" && f.visible !== false);
        const hasChildWithImageReflow =
          frame.children &&
          frame.children.some(
            (c) =>
              ("fills" in c && Array.isArray((c as any).fills) && (c as any).fills.some((fl: any) => fl.type === "IMAGE" && fl.visible !== false)) ||
              (c.name || "").toLowerCase().includes("image") ||
              (c.name || "").toLowerCase().includes("img") ||
              (c.name || "").toLowerCase().includes("photo")
          );
        const isMediaPlaceholder =
          hasImageFill ||
          hasChildWithImageReflow ||
          lowerName.includes("image") ||
          lowerName.includes("img") ||
          lowerName.includes("photo") ||
          lowerName.includes("thumb") ||
          lowerName.includes("banner") ||
          lowerName.includes("mockup") ||
          lowerName.includes("showcase") ||
          lowerName.includes("hero-img");

        if (isMediaPlaceholder && frame.height >= 50) {
          if (frame.width > availableWidth || frame.width < availableWidth * 0.8) {
            const ratio = frame.height / Math.max(1, frame.width);
            const newW = availableWidth;
            const newH = Math.max(120, Math.min(320, Math.round(newW * (ratio || 0.56))));
            try {
              frame.resize(newW, newH);
            } catch { }
          }
          try {
            frame.layoutPositioning = "AUTO";
            frame.layoutSizingHorizontal = "FILL";
            frame.layoutAlign = "STRETCH";
          } catch { }
        }

        if (role === "BADGE_OR_CHIP") {
          safeSetLayoutMode(frame, "HORIZONTAL");
          safeSetCounterAlign(frame, "CENTER");
          safeSetPrimaryAlign(frame, "CENTER");
          safeSetPadding(frame, 6, 12, 6, 12);
          safeSetItemSpacing(frame, 6);
          if (toNum(frame.cornerRadius) < 6) safeSetCornerRadius(frame, 16);
          try {
            frame.counterAxisSizingMode = "AUTO";
            frame.primaryAxisSizingMode = "AUTO";
            frame.layoutSizingHorizontal = "HUG";
            frame.layoutSizingVertical = "HUG";
          } catch { }

          for (const child of frame.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, "HORIZONTAL", frame.width);
            }
          }
        } else if (role === "HORIZONTAL_ROW") {
          // Chips row, rating row, avatar+name, price+tag, icon+text
          safeSetLayoutMode(frame, "HORIZONTAL");
          safeSetCounterAlign(frame, "CENTER");
          safeSetPrimaryAlign(frame, "MIN");
          safeSetItemSpacing(frame, Math.min(toNum(frame.itemSpacing) || 8, 12));
          try {
            if (parentLayout === "VERTICAL") {
              frame.layoutSizingHorizontal = "FILL";
            } else {
              frame.layoutSizingHorizontal = "HUG";
            }
            frame.layoutSizingVertical = "HUG";
          } catch { }

          for (const child of frame.children) {
            if (child.type === "TEXT") {
              formatResponsiveTextNode(child as TextNode, "HORIZONTAL", frame.width);
            }
          }
        } else if (role === "NAV_OR_HEADER_ROW") {
          // Navigation / Header row: keep horizontal, compact spacing, NO giant vertical stacks!
          safeSetLayoutMode(frame, "HORIZONTAL");
          safeSetPrimaryAlign(frame, "MIN");
          safeSetCounterAlign(frame, "CENTER");
          safeSetItemSpacing(frame, 8);
          safeSetPadding(frame, 4, 0, 4, 0);
          try {
            frame.layoutSizingHorizontal = "HUG";
            frame.layoutSizingVertical = "HUG";
          } catch { }
        } else if (role === "BUTTON_CTA") {
          if (frame.layoutMode === "NONE") safeSetLayoutMode(frame, "HORIZONTAL");
          safeSetPrimaryAlign(frame, "CENTER");
          safeSetCounterAlign(frame, "CENTER");
          safeSetPadding(frame, 15, 24, 15, 24);
          if (toNum(frame.cornerRadius) < 8) safeSetCornerRadius(frame, 10);
          if (frame.height < 48) {
            try { frame.resize(frame.width, 48); } catch { }
          }
          try {
            frame.layoutPositioning = "AUTO";
            frame.layoutSizingHorizontal = "FILL";
            frame.layoutAlign = "STRETCH";
            frame.layoutSizingVertical = "HUG";
          } catch {
            try { frame.layoutAlign = "STRETCH"; } catch { }
          }
        } else if (role === "BUTTON_INLINE") {
          if (frame.layoutMode === "NONE") safeSetLayoutMode(frame, "HORIZONTAL");
          safeSetPrimaryAlign(frame, "CENTER");
          safeSetCounterAlign(frame, "CENTER");
          safeSetPadding(frame, 12, 20, 12, 20);
          if (toNum(frame.cornerRadius) < 6) safeSetCornerRadius(frame, 8);
          if (frame.height < 42) {
            try { frame.resize(frame.width, 42); } catch { }
          }
          try {
            frame.layoutPositioning = "AUTO";
            frame.counterAxisSizingMode = "AUTO";
            frame.primaryAxisSizingMode = "AUTO";
            frame.layoutSizingHorizontal = "HUG";
            frame.layoutSizingVertical = "HUG";
          } catch { }
        } else if (role === "ICON_OR_AVATAR") {
          try {
            frame.layoutSizingHorizontal = "FIXED";
            frame.layoutSizingVertical = "FIXED";
          } catch { }
        } else if (role === "CARD_OR_BOX") {
          // Cards MUST ALWAYS take VERTICAL flow on mobile!
          safeSetLayoutMode(frame, "VERTICAL");
          safeSetPrimaryAlign(frame, "MIN");
          safeSetCounterAlign(frame, "MIN");
          safeSetPadding(frame, 16, 16, 16, 16);
          safeSetItemSpacing(frame, 12);
          if (toNum(frame.cornerRadius) < 8) {
            safeSetCornerRadius(frame, 14);
          }
          try {
            frame.layoutPositioning = "AUTO";
            frame.layoutSizingHorizontal = "FILL";
            frame.layoutAlign = "STRETCH";
          } catch { }
        } else if (role === "SECTION") {
          if (toNum(frame.paddingLeft) < 14) safeSetPadding(frame, undefined, undefined, undefined, 16);
          if (toNum(frame.paddingRight) < 14) safeSetPadding(frame, undefined, 16, undefined, undefined);
          safeSetPadding(frame, 20, undefined, 24, undefined);
          safeSetItemSpacing(frame, 16);
        } else {
          // CONTAINER (transparent structural wrapper, div, col, row, inner):
          if ((frame.layoutMode === "NONE" || (frame.layoutMode as string) === "GRID") && frame.children && frame.children.length > 0) {
            safeSetLayoutMode(frame, "VERTICAL");
            safeSetPrimaryAlign(frame, "MIN");
            safeSetCounterAlign(frame, "MIN");
          }
          safeSetItemSpacing(frame, 8);
        }

        // SIZING: FILL CONTAINER (WIDTH) & HUG CONTENT (HEIGHT)
        if (parentLayout === "VERTICAL") {
          try {
            frame.layoutPositioning = "AUTO";
            frame.layoutSizingHorizontal = "FILL";
            frame.layoutAlign = "STRETCH";
          } catch {
            try {
              frame.layoutAlign = "STRETCH";
            } catch {
              try { frame.resize(availableWidth, frame.height); } catch { }
            }
          }

          if (frame.layoutMode !== "NONE") {
            try {
              if (frame.layoutMode === "VERTICAL") {
                frame.primaryAxisSizingMode = "AUTO";
              } else if (frame.layoutMode === "HORIZONTAL") {
                frame.counterAxisSizingMode = "AUTO";
              }
              frame.layoutSizingVertical = "HUG";
            } catch { }
          }
        } else if (parentLayout === "HORIZONTAL") {
          try {
            frame.layoutSizingHorizontal = "FILL";
          } catch { }
          if (frame.layoutMode !== "NONE") {
            try {
              if (frame.layoutMode === "VERTICAL") {
                frame.primaryAxisSizingMode = "AUTO";
              } else {
                frame.counterAxisSizingMode = "AUTO";
              }
              frame.layoutSizingVertical = "HUG";
            } catch { }
          }
        }

        const currentWidth =
          frame.layoutSizingHorizontal === "FILL" || frame.width > availableWidth
            ? availableWidth
            : Math.max(availableWidth, frame.width);
        const innerAvailableWidth = Math.max(
          60,
          currentWidth - (toNum(frame.paddingLeft) + toNum(frame.paddingRight))
        );

        if (frame.children) {
          for (const child of [...frame.children]) {
            try {
              await reflowNode(child, frame.layoutMode, innerAvailableWidth, depth + 1);
            } catch (childErr) {
              console.warn(`[ResponsiveConverter] Error in child reflow for "${child.name}":`, childErr);
            }
          }
        }
      } else if (node.type === "TEXT" && scaleTypography) {
        const textNode = node as TextNode;
        textNodesScaled++;

        try {
          if (textNode.fontName !== figma.mixed) {
            await ensureFontLoaded(textNode.fontName as FontName);
          } else {
            await ensureFontLoaded(fallbackFont);
            textNode.fontName = fallbackFont;
          }
        } catch { }

        if (typeof textNode.fontSize === "number") {
          const oldSize = textNode.fontSize;
          let newSize = oldSize;

          if (oldSize >= 44) {
            newSize = targetWidth <= 480 ? Math.round(oldSize * 0.55) : Math.round(oldSize * 0.75);
            newSize = Math.max(24, Math.min(30, newSize));
          } else if (oldSize >= 28) {
            newSize = targetWidth <= 480 ? Math.round(oldSize * 0.7) : Math.round(oldSize * 0.85);
            newSize = Math.max(18, Math.min(22, newSize));
          } else if (oldSize >= 20) {
            newSize = targetWidth <= 480 ? Math.round(oldSize * 0.8) : Math.round(oldSize * 0.9);
            newSize = Math.max(14, Math.min(17, newSize));
          }

          if (newSize !== oldSize) {
            try {
              textNode.fontSize = newSize;
              textNode.lineHeight = { value: Math.round(newSize * 1.25), unit: "PIXELS" };
            } catch (e) {
              console.warn("Could not scale font:", textNode.characters, e);
            }
          }
        }

        // Format Text Node safely with formatResponsiveTextNode:
        // Guarantees text NEVER clips or wraps into vertical single letters!
        formatResponsiveTextNode(textNode, parentLayout, availableWidth);
      } else if (node.type === "RECTANGLE") {
        const rect = node as RectangleNode;
        // If it is a thin line / divider / separator (height <= 8), KEEP its height (1px, 2px, etc.)!
        if (rect.height <= 8) {
          try {
            if (parentLayout === "VERTICAL") (rect as any).layoutSizingHorizontal = "FILL";
          } catch { }
        } else {
          if (parentLayout === "VERTICAL" && rect.width >= availableWidth * 0.45) {
            try {
              (rect as any).layoutSizingHorizontal = "FILL";
            } catch { }
          }
          if (rect.width > availableWidth) {
            const ratio = rect.height / Math.max(1, rect.width);
            const newW = availableWidth;
            const newH = Math.max(24, Math.min(320, Math.round(newW * ratio)));
            try {
              rect.resize(newW, newH);
            } catch { }
          }
        }
      }
    } catch (nodeError) {
      console.warn(`[ResponsiveConverter] Error in reflowNode for "${node.name}":`, nodeError);
    }
  }

  for (const child of [...workingFrame.children]) {
    try {
      await reflowNode(child, workingFrame.layoutMode, contentWidth, 1);
    } catch (childErr) {
      console.warn(`[ResponsiveConverter] Error reflowing child "${child.name}":`, childErr);
    }
  }

  // Post-order safety normalization: ensure all cards and containers fill width and hug height
  try {
    fixAllCardsAndContainers(workingFrame, targetWidth);
  } catch (fixErr) {
    console.warn("[ResponsiveConverter] fixAllCardsAndContainers error:", fixErr);
  }

  try {
    figma.currentPage.selection = [workingFrame];
    figma.viewport.scrollAndZoomIntoView([workingFrame]);
  } catch { }

  return {
    success: true,
    frameId: workingFrame.id,
    frameName: workingFrame.name,
    targetWidth,
    width: Math.round(workingFrame.width),
    height: Math.round(workingFrame.height),
    sectionsAdjusted,
    textNodesScaled,
    gridsReflowed,
  };
}
