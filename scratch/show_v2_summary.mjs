import fs from "fs";

const data = JSON.parse(fs.readFileSync("scratch/inspect_v2.json", "utf-8"));
console.log("Name:", data.name);
console.log("Position:", { x: data.x, y: data.y, w: data.w, h: data.h });
console.log("Body sections:", data.bodySections);
console.log("\nMain sections (count: " + data.mainSections.length + "):");
data.mainSections.forEach((s, idx) => {
  console.log(`[${idx}] ${s.name} (${s.id}, ${s.w}x${s.h}, children: ${s.childrenCount}):`, s.childrenNames);
});

console.log("\nAll images (count: " + data.allImagesCount + "):");
data.allImages.forEach((img, idx) => {
  console.log(`  [${idx + 1}] "${img.nodeName}" (${img.w}x${img.h}) | Hash: ${img.hash} | Mode: ${img.scaleMode}`);
});
