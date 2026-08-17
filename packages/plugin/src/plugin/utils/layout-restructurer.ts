/**
 * DesignForge AI — Layout Restructuring Engine
 *
 * Traverses a parsed DOM UINode tree recursively (bottom-up) and groups
 * sibling nodes based on their geometric positions and overlaps.
 * Constructs clean, nested Auto Layout containers (horizontal rows and vertical columns)
 * to convert flat coordinate arrays into responsive designs.
 */

export interface UINode {
  type: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  layout: {
    direction: "HORIZONTAL" | "VERTICAL" | "NONE";
    primaryAxisSizing: "FIXED" | "AUTO" | "HUG" | "FILL";
    counterAxisSizing: "FIXED" | "AUTO" | "HUG" | "FILL";
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    itemSpacing: number;
    alignment: string;
    wrap: boolean;
  };
  childLayout: {
    layoutAlign: string;
    layoutGrow: number;
  };
  constraints: {
    horizontal: string;
    vertical: string;
  };
  style: {
    fills: any[];
    strokes: any[];
    effects: any[];
    cornerRadius: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
    opacity: number;
    clipsContent: boolean;
    visible: boolean;
    position?: string;
    zIndex?: number;
  };
  text?: any;
  componentRef?: string;
  imageRef?: string;
  svgContent?: string;
  iconName?: string;
  children?: UINode[];
}

/**
 * Restructures absolute layout coordinates into structured vertical and horizontal Auto Layout.
 */
export function restructureUINodeLayout(node: UINode): UINode {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  // 1. Process children first (bottom-up traversal)
  node.children = node.children.map(restructureUINodeLayout);

  // Prune redundant single-child visual wrapper frames to reduce depth
  if (node.children.length === 1 && node.type === "FRAME") {
    const hasFills = node.style?.fills && node.style.fills.length > 0;
    const hasStrokes = node.style?.strokes && node.style.strokes.length > 0;
    if (!hasFills && !hasStrokes) {
      const singleChild = node.children[0]!;
      if (singleChild.type === "FRAME") {
        singleChild.bounds.x += node.bounds.x;
        singleChild.bounds.y += node.bounds.y;
        return singleChild;
      }
    }
  }

  // 2. Separate flow children from absolute/overlay children
  const absoluteChildren: UINode[] = [];
  const flowChildren: UINode[] = [];

  for (const child of node.children) {
    const isAbsolute =
      child.style?.position === "absolute" ||
      // Classify as absolute overlay if it overlaps parent boundary significantly and is background/decorative
      (child.bounds.width >= node.bounds.width * 0.95 &&
        child.bounds.height >= node.bounds.height * 0.95 &&
        (child.type === "RECTANGLE" ||
          child.type === "VECTOR" ||
          child.type === "IMAGE" ||
          child.name?.toLowerCase().includes("bg") ||
          child.name?.toLowerCase().includes("background")));

    if (isAbsolute) {
      if (!child.style) child.style = {} as any;
      child.style.position = "absolute";
      absoluteChildren.push(child);
    } else {
      flowChildren.push(child);
    }
  }

  if (flowChildren.length === 0) {
    node.layout.direction = "NONE";
    return node;
  }

  if (flowChildren.length === 1) {
    const singleChild = flowChildren[0]!;
    // Set padding and let node stack vertically
    node.layout.direction = "VERTICAL";
    node.layout.itemSpacing = 0;
    node.layout.paddingTop = Math.max(0, singleChild.bounds.y);
    node.layout.paddingLeft = Math.max(0, singleChild.bounds.x);
    node.layout.paddingBottom = Math.max(0, node.bounds.height - (singleChild.bounds.y + singleChild.bounds.height));
    node.layout.paddingRight = Math.max(0, node.bounds.width - (singleChild.bounds.x + singleChild.bounds.width));

    // Child is relative to parent padding
    singleChild.bounds.x = 0;
    singleChild.bounds.y = 0;
    singleChild.childLayout.layoutAlign = "STRETCH";
    singleChild.childLayout.layoutGrow = 1;

    node.children = [...absoluteChildren, singleChild];
    return node;
  }

  // 3. Group flow children into horizontal rows based on vertical overlap
  // Sort by Y first, then X
  const sortedFlow = [...flowChildren].sort((a, b) => {
    if (Math.abs(a.bounds.y - b.bounds.y) < 4) {
      return a.bounds.x - b.bounds.x;
    }
    return a.bounds.y - b.bounds.y;
  });

  const rows: UINode[][] = [];
  for (const child of sortedFlow) {
    let added = false;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1]!;
      // Overlaps if there is shared Y range of at least 30% of height
      const overlaps = lastRow.some((item) => {
        const overlapY =
          Math.min(item.bounds.y + item.bounds.height, child.bounds.y + child.bounds.height) -
          Math.max(item.bounds.y, child.bounds.y);
        const minHeight = Math.min(item.bounds.height, child.bounds.height);
        return overlapY > 2 && overlapY / minHeight > 0.3;
      });
      if (overlaps) {
        lastRow.push(child);
        added = true;
      }
    }
    if (!added) {
      rows.push([child]);
    }
  }

  // 4. Transform multi-item rows into RowGroup frames
  const rowNodes: UINode[] = [];
  for (const rowItems of rows) {
    if (rowItems.length === 1) {
      rowNodes.push(rowItems[0]!);
    } else {
      rowItems.sort((a, b) => a.bounds.x - b.bounds.x);

      const minX = Math.min(...rowItems.map((item) => item.bounds.x));
      const maxX = Math.max(...rowItems.map((item) => item.bounds.x + item.bounds.width));
      const minY = Math.min(...rowItems.map((item) => item.bounds.y));
      const maxY = Math.max(...rowItems.map((item) => item.bounds.y + item.bounds.height));

      // Compute gaps between elements
      const gaps: number[] = [];
      for (let i = 1; i < rowItems.length; i++) {
        const gap = rowItems[i]!.bounds.x - (rowItems[i - 1]!.bounds.x + rowItems[i - 1]!.bounds.width);
        gaps.push(Math.max(0, gap));
      }
      const avgGap = gaps.length > 0 ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length : 0;

      // Translate child bounds relative to the new row container
      for (const item of rowItems) {
        item.bounds.x -= minX;
        item.bounds.y -= minY;
        // Make items hug height or fill as needed
        item.childLayout.layoutAlign = "CENTER";
      }

      const rowFrame: UINode = {
        type: "FRAME",
        name: "RowGroup",
        bounds: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
        layout: {
          direction: "HORIZONTAL",
          primaryAxisSizing: "FILL",
          counterAxisSizing: "HUG",
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          itemSpacing: Math.round(avgGap),
          alignment: "CENTER_LEFT",
          wrap: false,
        },
        childLayout: {
          layoutAlign: "STRETCH",
          layoutGrow: 1,
        },
        constraints: {
          horizontal: "LEFT_RIGHT",
          vertical: "TOP",
        },
        style: {
          fills: [],
          strokes: [],
          effects: [],
          cornerRadius: 0,
          opacity: 1,
          clipsContent: false,
          visible: true,
          position: "static",
        },
        children: rowItems,
      };

      rowNodes.push(rowFrame);
    }
  }

  // 5. Parent frame becomes a VERTICAL column container of the row nodes
  rowNodes.sort((a, b) => a.bounds.y - b.bounds.y);

  const minX = Math.min(...rowNodes.map((r) => r.bounds.x));
  const maxX = Math.max(...rowNodes.map((r) => r.bounds.x + r.bounds.width));
  const minY = Math.min(...rowNodes.map((r) => r.bounds.y));
  const maxY = Math.max(...rowNodes.map((r) => r.bounds.y + r.bounds.height));

  const paddingTop = Math.max(0, minY);
  const paddingLeft = Math.max(0, minX);
  const paddingBottom = Math.max(0, node.bounds.height - maxY);
  const paddingRight = Math.max(0, node.bounds.width - maxX);

  // Compute gaps between rows
  const rowGaps: number[] = [];
  for (let i = 1; i < rowNodes.length; i++) {
    const gap = rowNodes[i]!.bounds.y - (rowNodes[i - 1]!.bounds.y + rowNodes[i - 1]!.bounds.height);
    rowGaps.push(Math.max(0, gap));
  }
  const avgRowGap = rowGaps.length > 0 ? rowGaps.reduce((sum, g) => sum + g, 0) / rowGaps.length : 0;

  // Make row bounds relative to parent padding box
  for (const r of rowNodes) {
    r.bounds.x = 0;
    r.bounds.y -= minY;
    // Set flow properties for children
    r.childLayout.layoutAlign = "STRETCH";
    r.childLayout.layoutGrow = 1;
  }

  node.layout = {
    direction: "VERTICAL",
    primaryAxisSizing: "HUG", // vertical = HUG
    counterAxisSizing: "FILL", // horizontal = FILL
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    itemSpacing: Math.round(avgRowGap),
    alignment: "TOP_LEFT",
    wrap: false,
  };

  node.children = [...absoluteChildren, ...rowNodes];

  return node;
}
