import fs from "fs";

const tree = JSON.parse(fs.readFileSync("scratch/inspect_mobile_source.json", "utf8"));
const main = tree.children?.find(c => c.name === "Main");
const container = main?.children?.find(c => c.name === "Container");

console.log(`Main > Container has ${container?.children?.length} sections:\n`);

container?.children?.forEach((sec, idx) => {
  console.log(`================================================================`);
  console.log(`SECTION [${idx}] "${sec.name}" (${sec.width}x${sec.height})`);
  
  const texts = [];
  const images = [];
  
  function scan(n) {
    if (n.type === "TEXT") {
      texts.push(n.characters.replace(/\n/g, " "));
    }
    if (n.fills) {
      for (const f of n.fills) {
        if (f.type === "IMAGE") {
          images.push({ name: n.name, hash: f.imageHash, w: n.width, h: n.height });
        }
      }
    }
    if (n.children) n.children.forEach(scan);
  }
  scan(sec);
  
  console.log(`  Texts (${texts.length}):`);
  texts.forEach(t => console.log(`    - "${t}"`));
  console.log(`  Images (${images.length}):`);
  images.forEach(img => console.log(`    * [${img.name}] ${img.w}x${img.h} | Hash: ${img.hash}`));
});
