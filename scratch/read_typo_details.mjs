import fs from "fs";

const data = JSON.parse(fs.readFileSync("scratch/typo_inspection.json", "utf-8"));
console.log("=== LOCAL TEXT STYLES IN FIGMA ===");
data.localTextStyles.forEach(ts => {
  console.log(`- "${ts.name}": ${ts.fontName?.family} ${ts.fontName?.style} ${ts.fontSize}px`);
});

console.log("\n=== 04 TYPOGRAPHY SECTION STRUCTURE ===");
function printTree(node, indent = "") {
  let extra = "";
  if (node.text) extra = ` -> "${node.text}"`;
  console.log(`${indent}${node.name} (${node.type})${extra}`);
  if (node.children) {
    node.children.forEach(c => printTree(c, indent + "  "));
  }
}
if (data.typoSection) printTree(data.typoSection);

