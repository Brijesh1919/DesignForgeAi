async function main() {
  const code = `
    const orig = await figma.getNodeByIdAsync("10:2");
    if (!orig) return { error: "Node 10:2 not found" };

    const images = [];

    function findImages(node) {
      if (node.fills && Array.isArray(node.fills)) {
        for (const f of node.fills) {
          if (f.type === "IMAGE" && f.imageHash) {
            let parentName = node.parent ? node.parent.name : null;
            let grandParentName = node.parent && node.parent.parent ? node.parent.parent.name : null;
            
            // Also find nearest article or container text
            let label = "";
            let curr = node;
            while (curr && curr.id !== "10:2") {
              if (curr.name === "Article" || curr.name.startsWith("Container") || curr.name.startsWith("Section")) {
                const textNodes = curr.findAll ? curr.findAll(n => n.type === "TEXT") : [];
                if (textNodes.length > 0) {
                  label = textNodes.slice(0, 3).map(t => t.characters.trim()).join(" / ");
                  break;
                }
              }
              curr = curr.parent;
            }

            images.push({
              nodeId: node.id,
              nodeName: node.name,
              parentName,
              grandParentName,
              label,
              w: Math.round(node.width),
              h: Math.round(node.height),
              hash: f.imageHash,
              scaleMode: f.scaleMode
            });
          }
        }
      }

      if (node.children) {
        for (const c of node.children) findImages(c);
      }
    }

    findImages(orig);
    return images;
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
  fs.writeFileSync("scratch/exact_images_map.json", JSON.stringify(data.data?.data, null, 2));
  console.log("Saved exact images map. Total images:", data.data?.data?.length);
}

main().catch(console.error);
