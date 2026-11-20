import fs from "fs";

const tree = JSON.parse(fs.readFileSync("scratch/inspect_b2b.json", "utf8"));

console.log("Root:", tree.name, { x: tree.x, y: tree.y, width: tree.width, height: tree.height });

// Find all images
const allImages = [];
function findImages(node, path = "") {
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  if (node.fills) {
    for (const f of node.fills) {
      if (f.type === "IMAGE") {
        allImages.push({
          name: node.name,
          id: node.id,
          w: node.width,
          h: node.height,
          hash: f.imageHash,
          scaleMode: f.scaleMode,
          path: currentPath,
        });
      }
    }
  }
  if (node.children) {
    for (const c of node.children) {
      findImages(c, currentPath);
    }
  }
}
findImages(tree);

console.log(`\nFound ${allImages.length} images:`);
allImages.forEach((img, i) => {
  console.log(`[${i+1}] "${img.name}" (${img.w}x${img.h}) | Hash: ${img.hash} | Mode: ${img.scaleMode} | Path: ${img.path}`);
});

// Find all top-level sections
const body = tree.children?.find(c => c.name === "Body");
if (body) {
  console.log("\nBody sections:");
  body.children?.forEach((sec, idx) => {
    console.log(`\n=== Section [${idx}] "${sec.name}" (${sec.width}x${sec.height}, type: ${sec.type}) ===`);
    
    // Print text nodes in this section
    const texts = [];
    function collectTexts(n) {
      if (n.type === "TEXT") {
        texts.push({ text: n.characters, size: n.fontSize, font: n.fontName?.style });
      }
      if (n.children) n.children.forEach(collectTexts);
    }
    collectTexts(sec);
    texts.slice(0, 30).forEach(t => console.log(`  - "${t.text.replace(/\n/g, ' ')}" (${t.size}px ${t.font})`));
    if (texts.length > 30) console.log(`  ... and ${texts.length - 30} more texts`);
  });
}
