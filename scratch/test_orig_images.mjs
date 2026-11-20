async function main() {
  const code = `
    const orig = await figma.getNodeByIdAsync("10:2");
    if (!orig) return { error: "Node 10:2 not found" };

    const origImages = [];
    function findImgs(n) {
      if (n.fills && Array.isArray(n.fills)) {
        for (const f of n.fills) {
          if (f.type === "IMAGE") {
            origImages.push({
              nodeName: n.name,
              nodeId: n.id,
              w: Math.round(n.width),
              h: Math.round(n.height),
              hash: f.imageHash,
              scaleMode: f.scaleMode,
              imageObj: !!figma.getImageByHash(f.imageHash)
            });
          }
        }
      }
      if (n.children) {
        for (const c of n.children) findImgs(c);
      }
    }
    findImgs(orig);

    // Test creating a rectangle with one of these hashes
    const testHash = origImages[0]?.hash;
    let testResult = null;
    try {
      const rect = figma.createRectangle();
      rect.resize(100, 100);
      rect.fills = [{
        type: "IMAGE",
        imageHash: testHash,
        scaleMode: "FILL"
      }];
      testResult = {
        success: true,
        fillsCount: rect.fills.length,
        fillType: rect.fills[0]?.type,
        fillHash: rect.fills[0]?.imageHash
      };
      rect.remove();
    } catch (e) {
      testResult = { success: false, error: e.message };
    }

    return {
      origCount: origImages.length,
      origImages: origImages.map(i => ({ name: i.nodeName, w: i.w, h: i.h, hash: i.hash, hasImageObj: i.imageObj })),
      testResult
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
  console.log("Original images test:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
