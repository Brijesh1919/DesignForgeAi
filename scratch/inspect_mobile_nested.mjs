import fs from "fs";

async function main() {
  const code = `
    const root = await figma.getNodeByIdAsync("1051:14145");
    if (!root) return { error: "not found" };

    function scan(n, depth = 0) {
      const obj = {
        name: n.name,
        type: n.type,
        w: Math.round(n.width),
        h: Math.round(n.height),
        layoutMode: n.layoutMode,
        sizingH: n.layoutSizingHorizontal,
        sizingV: n.layoutSizingVertical,
      };
      if (depth < 3 && n.children) {
        obj.children = n.children.map(c => scan(c, depth + 1));
      }
      return obj;
    }

    return scan(root);
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });

  const data = await res.json();
  fs.writeFileSync("scratch/mobile_scan_detailed.json", JSON.stringify(data.data?.data, null, 2));
  console.log("Written to scratch/mobile_scan_detailed.json");
}

main().catch(console.error);
