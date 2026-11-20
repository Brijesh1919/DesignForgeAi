async function main() {
  const code = `
    const frame = await figma.getNodeByIdAsync("11:1340");
    if (!frame) return { error: "Frame 11:1340 not found" };

    const nodesWithImages = [];
    const emptyImageNodes = [];

    function checkNode(node) {
      if (node.fills && Array.isArray(node.fills)) {
        const imgFills = node.fills.filter(f => f.type === "IMAGE");
        if (imgFills.length > 0) {
          nodesWithImages.push({
            id: node.id,
            name: node.name,
            w: Math.round(node.width),
            h: Math.round(node.height),
            parent: node.parent?.name,
            imgFills: imgFills.map(f => ({
              imageHash: f.imageHash,
              scaleMode: f.scaleMode,
              visible: f.visible !== false
            }))
          });
        } else if (node.name.toLowerCase().includes("img") || node.name.toLowerCase().includes("thumb") || node.name.toLowerCase().includes("banner")) {
          emptyImageNodes.push({
            id: node.id,
            name: node.name,
            w: Math.round(node.width),
            h: Math.round(node.height),
            fills: node.fills
          });
        }
      }

      if ("children" in node && node.children) {
        for (const c of node.children) checkNode(c);
      }
    }

    checkNode(frame);

    return {
      totalImageNodesFound: nodesWithImages.length,
      sampleImageNodes: nodesWithImages.slice(0, 10),
      emptyImageNodesFound: emptyImageNodes.length,
      emptyImageNodes: emptyImageNodes
    };
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  console.log("Inspection:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
