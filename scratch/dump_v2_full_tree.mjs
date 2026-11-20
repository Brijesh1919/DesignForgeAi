async function main() {
  const code = `
    const sel = await figma.getNodeByIdAsync("17:7216");
    if (!sel) return { error: "Node 17:7216 not found" };

    function getFullTree(node, depth = 0) {
      if (depth > 12) return null;

      const obj = {
        name: node.name,
        type: node.type,
        w: Math.round(node.width),
        h: Math.round(node.height),
      };

      if (node.type === "TEXT") {
        obj.text = node.characters;
        obj.fontSize = typeof node.fontSize === "number" ? node.fontSize : 14;
        obj.fontName = typeof node.fontName === "object" ? node.fontName : null;
      }

      if (node.fills && Array.isArray(node.fills)) {
        for (const f of node.fills) {
          if (f.type === "IMAGE") {
            obj.imageHash = f.imageHash;
            obj.scaleMode = f.scaleMode;
          }
        }
      }

      if (node.children) {
        obj.children = node.children.map(c => getFullTree(c, depth + 1)).filter(Boolean);
      }

      return obj;
    }

    const tree = getFullTree(sel);
    return tree;
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 30000,
    }),
  });

  const data = await res.json();
  const fs = await import("fs");
  fs.writeFileSync("scratch/v2_full_tree.json", JSON.stringify(data.data?.data, null, 2));
  console.log("Saved full tree to scratch/v2_full_tree.json");
}

main().catch(console.error);
