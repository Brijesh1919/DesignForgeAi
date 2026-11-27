import { executeFigmaCode } from './run_bridge.mjs';
import fs from 'fs';

const script = `
async function exportFrame1() {
  const f1 = await figma.getNodeByIdAsync('1099:4115');
  if (!f1) return { error: 'Frame 1 not found' };

  const bytes = await f1.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
  return {
    pngBase64: figma.base64Encode(bytes)
  };
}
return await exportFrame1();
`;

async function main() {
  const res = await executeFigmaCode(script);
  if (res.data && res.data.data && res.data.data.pngBase64) {
    fs.writeFileSync('scratch/figma_motion_3d_frame.png', Buffer.from(res.data.data.pngBase64, 'base64'));
    console.log('Saved scratch/figma_motion_3d_frame.png');
  } else {
    console.error('Export failed:', res);
  }
}

main();
