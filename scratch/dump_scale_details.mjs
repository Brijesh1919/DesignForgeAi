import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch/typo_inspection.json', 'utf8'));
const scale = data.typoSection.children.find(c => c.name === 'Scale');
console.log('Scale children count:', scale.children.length);

for (let i = 0; i < scale.children.length; i++) {
  const c = scale.children[i];
  const meta = c.children?.find(x => x.name === 'Meta');
  const sample = c.children?.find(x => x.name !== 'Meta');
  const metaTitle = meta?.children?.[0]?.text;
  const metaSub = meta?.children?.[1]?.text;
  console.log(`[${i + 1}] ${c.name} | Title: ${metaTitle} | Sub: ${metaSub}`);
  console.log(`    Sample: "${sample?.text?.slice(0, 40)}"`);
  console.log(`    Font: ${sample?.fontName?.family} ${sample?.fontName?.style} (${sample?.fontSize}px)`);
  console.log(`    LineHeight:`, sample?.lineHeight, `LetterSpacing:`, sample?.letterSpacing);
  console.log(`    TextCase:`, sample?.textCase);
}

