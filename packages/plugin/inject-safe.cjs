const fs = require('fs');
const file = 'packages/plugin/src/plugin/builders/frame-builder.ts';
let code = fs.readFileSync(file, 'utf8');

const idxStart = code.lastIndexOf('function applyChildLayout(');
const idxEnd = code.indexOf('}', code.indexOf('}', code.indexOf('}', idxStart) + 1) + 1) + 1; // It has a try-catch

if (idxStart === -1) { console.log('applyChildLayout not found'); process.exit(1); }

const newFuncs = `
function determineSemanticRole(child: any, parent: any): string {
  const nameLower = (child.name || '').toLowerCase();
  const roleLower = (child.role || '').toLowerCase();

  if (child.type === 'ICON' || child.iconName || nameLower.includes('icon')) return 'ICON';
  if (roleLower === 'button' || nameLower.includes('button') || nameLower.includes('btn')) return 'BUTTON';
  if (roleLower === 'badge' || nameLower.includes('badge') || nameLower.includes('pill')) return 'BADGE';
  if (roleLower === 'sidebar' || nameLower.includes('sidebar')) return 'SIDEBAR';
  if (child.style?.position === 'absolute' || child.style?.position === 'fixed') return 'OVERLAY';

  return roleLower || 'DEFAULT';
}

function getResponsiveSizing(
  role: string,
  child: any,
  parentDirection: 'HORIZONTAL' | 'VERTICAL',
  flexGrow: number,
  schemaH?: string,
  schemaV?: string
): { horizontal: 'FIXED' | 'HUG' | 'FILL'; vertical: 'FIXED' | 'HUG' | 'FILL'; reason: string } {
  if (role === 'ICON' || role === 'BADGE' || child.type === 'SVG' || child.type === 'VECTOR') {
    return { horizontal: 'FIXED', vertical: 'FIXED', reason: \`\${role} - fixed dimensions\` };
  }
  
  if (role === 'OVERLAY') {
    return { horizontal: 'FIXED', vertical: 'FIXED', reason: 'overlay - absolute/fixed' };
  }

  if (schemaH !== undefined && (schemaH === 'FILL' || schemaH === 'HUG' || schemaH === 'FIXED')) {
    const v = (schemaV === 'FILL' || schemaV === 'HUG' || schemaV === 'FIXED') ? schemaV : 'HUG';
    return { horizontal: schemaH as any, vertical: v as any, reason: 'schema-driven sizing' };
  }

  if (flexGrow > 0) {
    return {
      horizontal: parentDirection === 'HORIZONTAL' ? 'FILL' : 'HUG',
      vertical: parentDirection === 'VERTICAL' ? 'FILL' : 'HUG',
      reason: 'flex-grow -> FILL in primary axis',
    };
  }

  return { horizontal: 'FIXED', vertical: 'FIXED', reason: 'unknown leaf - FIXED to preserve dimensions' };
}

function isAutoLayoutParent(parent: any): boolean {
  if (!parent) return false;
  return (
    (parent.type === 'FRAME' || parent.type === 'COMPONENT' || parent.type === 'COMPONENT_SET' || parent.type === 'INSTANCE') &&
    'layoutMode' in parent &&
    parent.layoutMode !== undefined &&
    parent.layoutMode !== 'NONE'
  );
}

function safeSetHorizontalSizing(node: any, sizing: 'FIXED' | 'HUG' | 'FILL'): void {
  if (!('layoutSizingHorizontal' in node)) return;

  const parent = node.parent;
  const parentIsAL = isAutoLayoutParent(parent);

  try {
    if (sizing === 'FILL') {
      if (parentIsAL) {
        node.layoutSizingHorizontal = 'FILL';
      } else {
        node.layoutSizingHorizontal = 'FIXED';
      }
    } else if (sizing === 'HUG') {
      node.layoutSizingHorizontal = 'HUG';
    } else {
      node.layoutSizingHorizontal = 'FIXED';
    }
  } catch (err) {
    try { node.layoutSizingHorizontal = 'FIXED'; } catch {}
  }
}

function safeSetVerticalSizing(node: any, sizing: 'FIXED' | 'HUG' | 'FILL'): void {
  if (!('layoutSizingVertical' in node)) return;

  const parent = node.parent;
  const parentIsAL = isAutoLayoutParent(parent);

  try {
    if (sizing === 'FILL') {
      if (parentIsAL) {
        node.layoutSizingVertical = 'FILL';
      } else {
        node.layoutSizingVertical = 'FIXED';
      }
    } else if (sizing === 'HUG') {
      node.layoutSizingVertical = 'HUG';
    } else {
      node.layoutSizingVertical = 'FIXED';
    }
  } catch (err) {
    try { node.layoutSizingVertical = 'FIXED'; } catch {}
  }
}

function safeSetLayoutPositioning(node: any, positioning: 'AUTO' | 'ABSOLUTE'): void {
  if (!('layoutPositioning' in node)) return;

  const parent = node.parent;
  const parentIsAL = isAutoLayoutParent(parent);

  try {
    if (positioning === 'ABSOLUTE') {
      if (parentIsAL) {
        node.layoutPositioning = 'ABSOLUTE';
      } else {
        node.layoutPositioning = 'AUTO';
      }
    } else {
      node.layoutPositioning = 'AUTO';
    }
  } catch (err) {
    try { node.layoutPositioning = 'AUTO'; } catch {}
  }
}

function applyChildLayout(
  node: any,
  child: any,
  parent: any
): void {
  const parentLayoutMode = parent.layoutMode;
  if (!parentLayoutMode || parentLayoutMode === 'NONE') {
    return;
  }

  const parentDirection = parentLayoutMode;
  const flexGrow = child.childLayout?.layoutGrow ?? 0;
  const isText = child.type === 'TEXT';

  let childHorizontalSizing: string | undefined;
  let childVerticalSizing: string | undefined;

  if (child.layout?.direction === 'VERTICAL') {
    childHorizontalSizing = child.layout.counterAxisSizing;
    childVerticalSizing = child.layout.primaryAxisSizing;
  } else {
    childHorizontalSizing = child.layout?.primaryAxisSizing;
    childVerticalSizing = child.layout?.counterAxisSizing;
  }

  const role = determineSemanticRole(child, parent);
  const sizing = getResponsiveSizing(
    role,
    child,
    parentDirection,
    flexGrow,
    childHorizontalSizing,
    childVerticalSizing
  );

  const resolvedHorizontal = sizing.horizontal;
  const resolvedVertical = sizing.vertical;

  const supportsV2Sizing = 'layoutSizingHorizontal' in node && 'layoutSizingVertical' in node;

  try {
    if (supportsV2Sizing) {
      safeSetHorizontalSizing(node, resolvedHorizontal);
      safeSetVerticalSizing(node, resolvedVertical);
    } else {
      if (parentDirection === 'VERTICAL') {
        if (resolvedHorizontal === 'FILL') node.layoutAlign = 'STRETCH';
        if (resolvedVertical === 'FILL') node.layoutGrow = 1;
      } else {
        if (resolvedHorizontal === 'FILL') node.layoutGrow = 1;
        if (resolvedVertical === 'FILL') node.layoutAlign = 'STRETCH';
      }
    }

    if (isText && 'textAutoResize' in node) {
      node.textAutoResize = resolvedHorizontal === 'FILL' ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
    }
  } catch (err) {
    try {
      safeSetHorizontalSizing(node, 'FIXED');
      safeSetVerticalSizing(node, 'FIXED');
    } catch {}
  }
}
`;

code = code.substring(0, idxStart) + newFuncs + code.substring(idxEnd);

// Also need to fix the caller to applyChildLayout in frame-builder.ts
// It previously called: applyChildLayout(childNode, child, parentNode.layoutMode); or something similar.
// Actually, earlier the caller was: applyChildLayout(figmaNode, child, parentDirection);
// We need to find all calls and replace them. Let's just do a regex replace if needed, 
// but wait, since applyChildLayout takes (node, child, parent), we'll do it later if there's a build error.

fs.writeFileSync(file, code);
console.log('Successfully injected code!');
