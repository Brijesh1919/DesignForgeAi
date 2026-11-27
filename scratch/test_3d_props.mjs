import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function test3DProperties() {
  const node = await figma.getNodeByIdAsync('1099:4072');
  const space = await figma.getNodeByIdAsync('1099:4116');

  const props = [
    'TRANSFORM_3D_TRANSLATION_Z',
    'TRANSFORM_3D_ROTATION_X',
    'TRANSFORM_3D_ROTATION_Y',
    'TRANSFORM_3D_ROTATION_Z',
    'SCENE_3D_PERSPECTIVE'
  ];

  const results = {};
  for (const p of props) {
    try {
      node.applyManualKeyframeTrack(
        { type: 'PROPERTY', name: p },
        {
          baseValue: { type: 'FLOAT', value: p === 'SCENE_3D_PERSPECTIVE' ? 800 : 0 },
          keyframes: [
            { timelinePosition: 0.0, value: { type: 'FLOAT', value: 0 }, easing: { type: 'EASE_IN_AND_OUT' } },
            { timelinePosition: 2.0, value: { type: 'FLOAT', value: p.includes('ROTATION') ? 45 : 100 }, easing: { type: 'EASE_IN_AND_OUT' } }
          ]
        }
      );
      results[p] = true;
    } catch (e) {
      results[p] = e.message;
    }
  }

  return results;
}
return await test3DProperties();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
