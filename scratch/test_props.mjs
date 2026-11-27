import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function testProperties() {
  const node = await figma.getNodeByIdAsync('1099:4072');
  const props = ['TRANSLATION_X', 'TRANSLATION_Y', 'ROTATION', 'SCALE_X', 'SCALE_Y', 'OPACITY', 'Z_INDEX'];
  const results = {};

  for (const p of props) {
    try {
      node.applyManualKeyframeTrack(
        { type: 'PROPERTY', name: p },
        {
          baseValue: { type: 'FLOAT', value: p.startsWith('SCALE') || p === 'OPACITY' ? 1 : 0 },
          keyframes: [
            { timelinePosition: 0.0, value: { type: 'FLOAT', value: p.startsWith('SCALE') || p === 'OPACITY' ? 1 : 0 }, easing: { type: 'EASE_IN_AND_OUT' } },
            { timelinePosition: 2.0, value: { type: 'FLOAT', value: p.startsWith('SCALE') ? 1.2 : p === 'OPACITY' ? 0.8 : 10 }, easing: { type: 'EASE_IN_AND_OUT' } }
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
return await testProperties();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
