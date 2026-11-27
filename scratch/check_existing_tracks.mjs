import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function checkExistingTracks() {
  const f1 = await figma.getNodeByIdAsync('1099:4115');
  const space = await figma.getNodeByIdAsync('1099:4116');

  function inspectNodeTracks(n) {
    return {
      id: n.id,
      name: n.name,
      manualKeyframeTracks: n.manualKeyframeTracks,
      children: n.children ? n.children.map(inspectNodeTracks) : []
    };
  }

  return {
    f1: inspectNodeTracks(f1)
  };
}
return await checkExistingTracks();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
