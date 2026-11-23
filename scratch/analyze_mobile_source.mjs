import fs from "fs";

const tree = JSON.parse(fs.readFileSync("scratch/inspect_mobile_source.json", "utf8"));

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

// Check structure of children
console.log("\nChildren of root (count: " + tree.children?.length + "):");
tree.children?.forEach((child, i) => {
  console.log(`[${i}] "${child.name}" (${child.width}x${child.height}, type: ${child.type})`);
  
  function dumpSummary(n, indent = "  ") {
    const texts = [];
    function getTexts(node) {
      if (node.type === "TEXT") texts.push(node.characters.replace(/\n/g, ' '));
      if (node.children) node.children.forEach(getTexts);
    }
    getTexts(n);
    console.log(`${indent}* "${n.name}" (${n.width}x${n.height}, children: ${n.children?.length || 0}) -> ${texts.length} texts:`);
    texts.slice(0, 15).forEach(t => console.log(`${indent}   - "${t}"`));
    if (texts.length > 15) console.log(`${indent}   ... and ${texts.length - 15} more`);
  }

  if (child.children) {
    child.children.forEach(c => dumpSummary(c, "   "));
  }
});
