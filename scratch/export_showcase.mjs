import { executeFigmaCode } from './run_bridge.mjs';
import fs from 'fs';
import path from 'path';

const script = `
async function exportPreviews() {
  const targetFrame = await figma.getNodeByIdAsync('1082:2255');
  if (!targetFrame) return { error: 'Target frame not found' };

  // Export targetFrame
  const bytes = await targetFrame.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } });
  
  // Find component sets container
  const compSetsNode = figma.currentPage.findOne(n => n.name === '📦 3D Tilt Component Sets (Master Components)');
  let compBytes = null;
  if (compSetsNode) {
    compBytes = await compSetsNode.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } });
  }

  // Also export one Feature Card Default & Hover for close-up inspection
  let featCardBytes = null;
  const featCompSet = figma.currentPage.findOne(n => n.name === 'Feature Card 1 (Left Tilt -5.8°)');
  if (featCompSet) {
    featCardBytes = await featCompSet.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
  }

  return {
    framePngBase64: figma.base64Encode(bytes),
    compSetsPngBase64: compBytes ? figma.base64Encode(compBytes) : null,
    featCardPngBase64: featCardBytes ? figma.base64Encode(featCardBytes) : null
  };
}
return await exportPreviews();
`;

async function main() {
  console.log('Exporting previews from Figma...');
  const res = await executeFigmaCode(script);
  if (!res.success || !res.data || !res.data.data) {
    console.error('Export failed:', res);
    return;
  }
  const data = res.data.data;
  
  if (data.framePngBase64) {
    const buffer = Buffer.from(data.framePngBase64, 'base64');
    fs.writeFileSync('scratch/tactile_3d_screen.png', buffer);
    console.log('Saved scratch/tactile_3d_screen.png (' + buffer.length + ' bytes)');
  }

  if (data.compSetsPngBase64) {
    const buffer = Buffer.from(data.compSetsPngBase64, 'base64');
    fs.writeFileSync('scratch/tilt_component_sets.png', buffer);
    console.log('Saved scratch/tilt_component_sets.png (' + buffer.length + ' bytes)');
  }

  if (data.featCardPngBase64) {
    const buffer = Buffer.from(data.featCardPngBase64, 'base64');
    fs.writeFileSync('scratch/feat_card_variants.png', buffer);
    console.log('Saved scratch/feat_card_variants.png (' + buffer.length + ' bytes)');
  }
}

main();
