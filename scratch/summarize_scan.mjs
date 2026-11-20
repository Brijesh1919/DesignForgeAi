import fs from "fs";

const data = JSON.parse(fs.readFileSync("scratch/redesign_scan.json", "utf8"));

console.log("Root:", data.name, `${data.w}x${data.h}`);

data.children?.forEach((sec, idx) => {
  console.log(`\n[${idx}] "${sec.name}" (${sec.w}x${sec.h}, AL: ${sec.layoutMode}, Sizing: [H: ${sec.layoutSizingH}, V: ${sec.layoutSizingV}])`);
  sec.children?.forEach((c, cIdx) => {
    console.log(`    child [${cIdx}] "${c.name}" (${c.w}x${c.h}, AL: ${c.layoutMode}, Sizing: [H: ${c.layoutSizingH}, V: ${c.layoutSizingV}], children: ${c.children?.length || 0})`);
  });
});
