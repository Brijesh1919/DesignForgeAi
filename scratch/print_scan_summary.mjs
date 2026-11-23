import fs from "fs";

const data = JSON.parse(fs.readFileSync("scratch/mobile_scan_detailed.json", "utf8"));

console.log("Root:", data.name, `${data.w}x${data.h}`);

data.children?.forEach((sec, idx) => {
  console.log(`\n=== Section [${idx}] "${sec.name}" (${sec.w}x${sec.h}) ===`);
  sec.children?.forEach((c, cIdx) => {
    console.log(`   child [${cIdx}] "${c.name}" (${c.w}x${c.h}, AL: ${c.layoutMode}, Sizing: [${c.sizingH}, ${c.sizingV}], children: ${c.children?.length || 0})`);
    if (c.children) {
      c.children.slice(0, 4).forEach((gc, gcIdx) => {
        console.log(`      gc [${gcIdx}] "${gc.name}" (${gc.w}x${gc.h}, AL: ${gc.layoutMode})`);
      });
      if (c.children.length > 4) {
        console.log(`      ... and ${c.children.length - 4} more`);
      }
    }
  });
});
