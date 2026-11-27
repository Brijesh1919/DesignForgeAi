import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function inspectFrame1() {
  const node = await figma.getNodeByIdAsync('1099:4115');
  if (!node) return { error: 'Node not found' };

  function serializeNode(n, depth = 0) {
    if (depth > 5) return { name: n.name, type: n.type };
    const res = {
      id: n.id,
      name: n.name,
      type: n.type,
      x: Math.round(n.x),
      y: Math.round(n.y),
      w: Math.round(n.width),
      h: Math.round(n.height),
      rotation: n.rotation,
      relativeTransform: n.relativeTransform,
      pluginDataKeys: n.getPluginDataKeys ? n.getPluginDataKeys() : [],
      sharedPluginDataKeys: n.getSharedPluginDataKeys ? n.getSharedPluginDataKeys('vector3d') : []
    };

    if (n.children) {
      res.children = n.children.map(c => serializeNode(c, depth + 1));
    }
    return res;
  }

  return {
    frame: serializeNode(node),
    parent: node.parent ? { id: node.parent.id, name: node.parent.name, type: node.parent.type } : null
  };
}
return await inspectFrame1();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
