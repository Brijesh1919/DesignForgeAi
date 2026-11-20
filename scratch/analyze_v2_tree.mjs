import fs from "fs";

const raw = JSON.parse(fs.readFileSync("scratch/v2_full_tree.json", "utf-8"));

function printSectionDetails(node, path = "") {
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  const texts = [];
  const images = [];

  function collect(n) {
    if (n.text) {
      texts.push({ text: n.text.trim().replace(/\s+/g, " "), size: n.fontSize, font: n.fontName?.style });
    }
    if (n.imageHash) {
      images.push({ name: n.name, hash: n.imageHash, w: n.w, h: n.h });
    }
    if (n.children) {
      for (const c of n.children) collect(c);
    }
  }

  collect(node);
  return { currentPath, texts, images };
}

const body = raw.children.find(c => c.name === "Body");
console.log("=== HEADER ===");
const header = printSectionDetails(body.children.find(c => c.name === "Header"));
header.texts.forEach(t => console.log(`  - "${t.text}" (${t.size}px ${t.font})`));
header.images.forEach(i => console.log(`  * IMG: ${i.name} (${i.w}x${i.h}, ${i.hash.slice(0, 10)})`));

const mainContent = body.children.find(c => c.name === "Main Content");
mainContent.children.forEach((sec, idx) => {
  console.log(`\n=== MAIN CONTENT [${idx}] ${sec.name} ===`);
  const details = printSectionDetails(sec);
  details.texts.forEach(t => console.log(`  - "${t.text}" (${t.size}px ${t.font})`));
  details.images.forEach(i => console.log(`  * IMG: ${i.name} (${i.w}x${i.h}, ${i.hash.slice(0, 10)})`));
});

console.log("\n=== FOOTER ===");
const footer = printSectionDetails(body.children.find(c => c.name === "Footer:margin"));
footer.texts.forEach(t => console.log(`  - "${t.text}" (${t.size}px ${t.font})`));
footer.images.forEach(i => console.log(`  * IMG: ${i.name} (${i.w}x${i.h}, ${i.hash.slice(0, 10)})`));
