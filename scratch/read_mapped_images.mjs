import fs from "fs";

const imgs = JSON.parse(fs.readFileSync("scratch/exact_images_map.json", "utf-8"));
console.log("Total entries:", imgs.length);

imgs.forEach((img, idx) => {
  console.log(`[${idx + 1}] "${img.nodeName}" (${img.w}x${img.h}) | Hash: ${img.hash} | Label: "${img.label}"`);
});
