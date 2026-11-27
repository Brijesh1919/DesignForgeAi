import { executeFigmaCode } from './run_bridge.mjs';

const script = `
async function testFullTracks() {
  const node = await figma.getNodeByIdAsync('1099:4072');
  if (!node) return { error: 'Node not found' };

  const duration = 8.0;
  const k = 0; // Card 0
  const theta0 = 0; // Front

  const times = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
  const R = 150;

  const xKeyframes = [];
  const yKeyframes = [];
  const zKeyframes = [];
  const rotYKeyframes = [];
  const scaleKeyframes = [];
  const opacityKeyframes = [];

  for (const t of times) {
    const theta = theta0 + (2 * Math.PI * t) / duration;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    const xVal = Math.round(R * sinT);
    const yVal = Math.round(-R * cosT * 0.22);
    const zVal = Math.round(R * cosT);
    const rotYVal = Math.round(-theta * (180 / Math.PI));
    const scaleVal = parseFloat((0.8 + 0.24 * ((cosT + 1) / 2)).toFixed(2));
    const opVal = parseFloat((0.72 + 0.28 * ((cosT + 1) / 2)).toFixed(2));

    const easing = { type: 'EASE_IN_AND_OUT' };

    xKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: xVal }, easing });
    yKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: yVal }, easing });
    zKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: zVal }, easing });
    rotYKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: rotYVal }, easing });
    scaleKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: scaleVal }, easing });
    opacityKeyframes.push({ timelinePosition: t, value: { type: 'FLOAT', value: opVal }, easing });
  }

  function applyTrack(name, baseVal, keyframes) {
    node.applyManualKeyframeTrack(
      { type: 'PROPERTY', name },
      {
        baseValue: { type: 'FLOAT', value: baseVal },
        keyframes
      }
    );
  }

  applyTrack('TRANSLATION_X', 0, xKeyframes);
  applyTrack('TRANSLATION_Y', -Math.round(R * 0.22), yKeyframes);
  applyTrack('TRANSFORM_3D_TRANSLATION_Z', R, zKeyframes);
  applyTrack('TRANSFORM_3D_ROTATION_Y', 0, rotYKeyframes);
  applyTrack('SCALE_X', 1.04, scaleKeyframes);
  applyTrack('SCALE_Y', 1.04, scaleKeyframes);
  applyTrack('OPACITY', 1.0, opacityKeyframes);

  return {
    success: true,
    trackNames: Object.keys(node.manualKeyframeTracks),
    tracksCount: Object.keys(node.manualKeyframeTracks).length
  };
}
return await testFullTracks();
`;

async function main() {
  const res = await executeFigmaCode(script);
  console.log(JSON.stringify(res, null, 2));
}

main();
