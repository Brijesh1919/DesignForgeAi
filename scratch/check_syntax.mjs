import fs from 'fs';

const content = fs.readFileSync('scratch/build_motion_3d_circular_carousel.mjs', 'utf-8');
const start = content.indexOf('const script = `') + 16;
const end = content.lastIndexOf('`;\n\nasync function main');
const code = content.substring(start, end);

try {
  new Function(code);
  console.log('Figma script syntax is valid!');
} catch (e) {
  console.error('Syntax error:', e.message);
  // find line
  const lines = code.split('\n');
  console.error('Total lines:', lines.length);
}
