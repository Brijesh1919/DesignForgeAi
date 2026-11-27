import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function testKeyframeTrack() {
  const node = await figma.getNodeByIdAsync('1099:4072'); // Polaroid_1
  if (!node) return { error: 'Node not found' };

  try {
    const keyframes = [
      { timelinePosition: 0.0, value: { type: 'FLOAT', value: 0 }, easing: { type: 'EASE_IN_AND_OUT' } },
      { timelinePosition: 2.0, value: { type: 'FLOAT', value: 50 }, easing: { type: 'EASE_IN_AND_OUT' } },
      { timelinePosition: 4.0, value: { type: 'FLOAT', value: 0 }, easing: { type: 'EASE_IN_AND_OUT' } }
    ];

    let appliedMethod = null;
    try {
      node.applyManualKeyframeTrack(
        { type: 'PROPERTY', name: 'TRANSLATION_X' },
        {
          baseValue: { type: 'FLOAT', value: 0 },
          keyframes: keyframes
        }
      );
      appliedMethod = 'PROPERTY_OBJ';
    } catch (e1) {
      try {
        node.applyManualKeyframeTrack('TRANSLATION_X', { keyframes });
        appliedMethod = 'STRING_NAME';
      } catch (e2) {
        return { success: false, err1: e1.message, err2: e2.message };
      }
    }

    return {
      success: true,
      appliedMethod,
      tracks: node.manualKeyframeTracks
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
return await testKeyframeTrack();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
