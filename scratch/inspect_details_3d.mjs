import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function inspectDetailed() {
  const f1 = await figma.getNodeByIdAsync('1099:4115');
  const space = await figma.getNodeByIdAsync('1099:4116');

  function getPluginInfo(n) {
    const keys = n.getPluginDataKeys ? n.getPluginDataKeys() : [];
    const pData = {};
    for (const k of keys) {
      pData[k] = n.getPluginData(k);
    }
    return {
      keys,
      pData,
      isAsset: n.isAsset,
      exportSettings: n.exportSettings
    };
  }

  const res = {
    f1: {
      id: f1.id,
      name: f1.name,
      x: f1.x,
      y: f1.y,
      w: f1.width,
      h: f1.height,
      fills: f1.fills,
      strokes: f1.strokes,
      effects: f1.effects,
      pluginInfo: getPluginInfo(f1)
    },
    space: space ? {
      id: space.id,
      name: space.name,
      x: space.x,
      y: space.y,
      w: space.width,
      h: space.height,
      fills: space.fills,
      strokes: space.strokes,
      effects: space.effects,
      pluginInfo: getPluginInfo(space),
      children: space.children.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height,
        rotation: c.rotation,
        relativeTransform: c.relativeTransform,
        fills: c.fills,
        strokes: c.strokes,
        effects: c.effects,
        pluginInfo: getPluginInfo(c)
      }))
    } : null
  };
  return res;
}
return await inspectDetailed();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
