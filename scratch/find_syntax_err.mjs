import fs from 'fs';

const content = fs.readFileSync('scratch/build_motion_3d_circular_carousel.mjs', 'utf-8');
const start = content.indexOf('const script = `') + 16;
const end = content.lastIndexOf('`;\n\nasync function main');
const code = content.substring(start, end);

const lines = code.split('\n');
let acc = '';
for (let i = 0; i < lines.length; i++) {
  acc += lines[i] + '\n';
  try {
    new Function(acc + '\n}');
  } catch (e) {
    if (!e.message.includes('Unexpected end of input') && !e.message.includes('Unexpected token')) {
      console.log('Error around line ' + (i + 1) + ': ' + lines[i]);
      console.log(e.message);
      break;
    }
  }
}

// Let's also check for unescaped backticks
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('`')) {
    console.log('Line ' + (i + 1) + ' has backtick: ' + lines[i]);
  }
}
