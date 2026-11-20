import fs from "fs";

async function main() {
  const code = `
    const root = await figma.getNodeByIdAsync("21:9301");
    if (!root) return { error: "not found" };

    function scan(n, depth = 0) {
      const info = {
        name: n.name,
        type: n.type,
        w: Math.round(n.width),
        h: Math.round(n.height),
        layoutMode: n.layoutMode,
        layoutSizingH: n.layoutSizingHorizontal,
        layoutSizingV: n.layoutSizingVertical,
      };
      if (n.fills && Array.isArray(n.fills)) {
        for (const f of n.fills) {
          if (f.type === "IMAGE") {
            info.imageHash = f.imageHash;
            info.scaleMode = f.scaleMode;
          }
        }
      }
      if (depth < 4 && n.children) {
        info.children = n.children.map(c => scan(c, depth + 1));
      }
      return info;
    }

    return scan(root);
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });

  const data = await res.json();
  fs.writeFileSync("scratch/redesign_scan.json", JSON.stringify(data.data?.data, null, 2));
  console.log("Scan written to scratch/redesign_scan.json");
}

main().catch(console.error);
