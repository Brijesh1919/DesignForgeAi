import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function inspect3DSpace() {
  const node = await figma.getNodeByIdAsync('1099:4116');
  if (!node) return { error: '3D space not found' };

  return {
    id: node.id,
    name: node.name,
    w: node.width,
    h: node.height,
    children: node.children.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      x: Math.round(c.x),
      y: Math.round(c.y),
      w: Math.round(c.width),
      h: Math.round(c.height),
      rotation: c.rotation,
      relativeTransform: c.relativeTransform,
      pluginData: c.getPluginDataKeys ? c.getPluginDataKeys().map(k => ({ key: k, val: c.getPluginData(k) })) : []
    }))
  };
}
return await inspect3DSpace();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
