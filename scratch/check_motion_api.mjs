import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function checkMotionAPI() {
  const node = await figma.getNodeByIdAsync('1099:4115');
  const space = await figma.getNodeByIdAsync('1099:4116');

  function getMethods(n) {
    if (!n) return null;
    const proto = Object.getPrototypeOf(n);
    const props = Object.getOwnPropertyNames(proto);
    return {
      timelines: n.timelines,
      setTimelineDuration: typeof n.setTimelineDuration,
      applyManualKeyframeTrack: typeof n.applyManualKeyframeTrack,
      applyAnimationStyle: typeof n.applyAnimationStyle,
      motionProps: props.filter(p => p.toLowerCase().includes('motion') || p.toLowerCase().includes('timeline') || p.toLowerCase().includes('animate') || p.toLowerCase().includes('keyframe'))
    };
  }

  return {
    nodeMethods: getMethods(node),
    spaceMethods: getMethods(space)
  };
}
return await checkMotionAPI();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
