import fs from "fs";

const data = JSON.parse(fs.readFileSync("scratch/scale_styles.json", "utf-8"));
data.stylesInfo.forEach((s, i) => {
  console.log(`${i+1}. Style Name: "${s.styleName}" (Layer: ${s.layerName})`);
  console.log(`   Spec: ${s.specString}`);
  console.log(`   Sample: "${s.sampleText}"`);
  console.log(`   Font: ${s.fontName?.family} ${s.fontName?.style}, Size: ${s.fontSize}px`);
  console.log(`   LineHeight:`, s.lineHeight);
  console.log(`   LetterSpacing:`, s.letterSpacing);
  console.log(`   TextCase:`, s.textCase);
  console.log();
});

