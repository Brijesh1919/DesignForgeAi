async function inspectNode() {
  const node = await figma.getNodeByIdAsync('1082:2908');
  if (!node) return { error: 'Node not found' };
  return {
    id: node.id,
    name: node.name,
    x: node.x,
    y: node.y,
    w: node.width,
    h: node.height,
    childrenCount: node.children ? node.children.length : 0,
    children: node.children ? node.children.map(c => ({ id: c.id, name: c.name, type: c.type, w: c.width, h: c.height })) : []
  };
}
return await inspectNode();
