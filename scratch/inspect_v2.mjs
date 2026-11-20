async function main() {
  const code = `
    const sel = await figma.getNodeByIdAsync("17:7216");
    if (!sel) return { error: "Node 17:7216 not found" };

    function summarizeNode(node, depth = 0) {
      if (depth > 6) return { id: node.id, name: node.name, type: node.type };

      const obj = {
        id: node.id,
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
        const img = node.fills.find(f => f.type === "IMAGE");
        if (img) {
          obj.imageHash = img.imageHash;
          obj.scaleMode = img.scaleMode;
        }
      }

      if (node.children && node.children.length > 0) {
        obj.children = node.children.map(c => summarizeNode(c, depth + 1));
      }

      return obj;
    }

    const body = sel.children ? sel.children.find(n => n.name === "Body") : null;
    const bodySections = [];
    if (body && body.children) {
      for (const child of body.children) {
        bodySections.push({
          name: child.name,
          id: child.id,
          w: Math.round(child.width),
          h: Math.round(child.height),
          childrenCount: child.children ? child.children.length : 0,
          childrenNames: child.children ? child.children.map(c => c.name) : []
        });
      }
    }

    const mainContent = body && body.children ? body.children.find(n => n.name === "Main Content") : null;
    const mainSections = [];
    if (mainContent && mainContent.children) {
      for (const section of mainContent.children) {
        mainSections.push({
          name: section.name,
          id: section.id,
          w: Math.round(section.width),
          h: Math.round(section.height),
          type: section.type,
          childrenCount: section.children ? section.children.length : 0,
          childrenNames: section.children ? section.children.map(c => c.name) : []
        });
      }
    }

    // Collect all images in 17:7216
    const allImages = [];
    function findImgs(n) {
      if (n.fills && Array.isArray(n.fills)) {
        for (const f of n.fills) {
          if (f.type === "IMAGE" && f.imageHash) {
            allImages.push({
              nodeName: n.name,
              nodeId: n.id,
              w: Math.round(n.width),
              h: Math.round(n.height),
              hash: f.imageHash,
              scaleMode: f.scaleMode
            });
          }
        }
      }
      if (n.children) {
        for (const c of n.children) findImgs(c);
      }
    }
    findImgs(sel);

    return {
      name: sel.name,
      id: sel.id,
      x: sel.x,
      y: sel.y,
      w: sel.width,
      h: sel.height,
      bodySections,
      mainSections,
      allImagesCount: allImages.length,
      allImages
    };
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
  fs.writeFileSync("scratch/inspect_v2.json", JSON.stringify(data.data?.data, null, 2));
  console.log("Dumped inspection to scratch/inspect_v2.json. Images count:", data.data?.data?.allImagesCount);
}

main().catch(console.error);
