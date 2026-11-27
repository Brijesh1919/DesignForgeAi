import { executeFigmaCode } from './run_bridge.mjs';
import fs from 'fs';

const script = `
async function exportMemoryCarousel() {
  const f1 = figma.currentPage.findOne(n => n.name.startsWith('✨ 3D Memory Carousel - Step 1'));
  const f2 = figma.currentPage.findOne(n => n.name.startsWith('✨ 3D Memory Carousel - Step 2'));
  const f3 = figma.currentPage.findOne(n => n.name.startsWith('✨ 3D Memory Carousel - Step 3'));

  if (!f1) return { error: 'Step 1 frame not found' };

  const b1 = await f1.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
  const b2 = f2 ? await f2.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } }) : null;
  const b3 = f3 ? await f3.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } }) : null;

  const stage = f1.findOne(n => n.name === 'Carousel Stage');
  let bStage = null;
  if (stage) {
    bStage = await stage.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
  }

  return {
    f1Base64: figma.base64Encode(b1),
    f2Base64: b2 ? figma.base64Encode(b2) : null,
    f3Base64: b3 ? figma.base64Encode(b3) : null,
    stageBase64: bStage ? figma.base64Encode(bStage) : null
  };
}
return await exportMemoryCarousel();
`;

async function main() {
  console.log('Exporting memory carousel previews...');
  const res = await executeFigmaCode(script);
  if (!res.success || !res.data || !res.data.data) {
    console.error('Export failed:', res);
    return;
  }
  const data = res.data.data;
  
  if (data.f1Base64) {
    fs.writeFileSync('scratch/memory_saver_frame1.png', Buffer.from(data.f1Base64, 'base64'));
    console.log('Saved scratch/memory_saver_frame1.png');
  }
  if (data.f2Base64) {
    fs.writeFileSync('scratch/memory_saver_frame2.png', Buffer.from(data.f2Base64, 'base64'));
    console.log('Saved scratch/memory_saver_frame2.png');
  }
  if (data.f3Base64) {
    fs.writeFileSync('scratch/memory_saver_frame3.png', Buffer.from(data.f3Base64, 'base64'));
    console.log('Saved scratch/memory_saver_frame3.png');
  }
  if (data.stageBase64) {
    fs.writeFileSync('scratch/carousel_stage_closeup.png', Buffer.from(data.stageBase64, 'base64'));
    console.log('Saved scratch/carousel_stage_closeup.png');
  }
}

main();
