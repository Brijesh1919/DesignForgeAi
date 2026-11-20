import fs from "fs";

const tree = JSON.parse(fs.readFileSync("scratch/inspect_b2b.json", "utf8"));
const body = tree.children?.find(c => c.name === "Body");
const mainContent = body?.children?.find(c => c.name === "Main Content");

console.log(`Main Content has ${mainContent?.children?.length} sections:\n`);

mainContent?.children?.forEach((sec, idx) => {
  console.log(`--------------------------------------------------`);
  console.log(`[${idx}] "${sec.name}" (${sec.width}x${sec.height})`);
  
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
  texts.forEach(t => console.log(`    - ${t}`));
  console.log(`  Images (${images.length}):`);
  images.forEach(img => console.log(`    * [${img.name}] ${img.w}x${img.h} | Hash: ${img.hash}`));
});
