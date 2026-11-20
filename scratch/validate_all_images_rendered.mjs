async function main() {
  const code = `
    const frame = figma.currentPage.children.find(c => c.name.includes("Modern E-Commerce Redesign"));
    if (!frame) return { error: "Frame not found on current page" };

    const imagesFound = [];
    function checkNode(node) {
      if (node.fills && Array.isArray(node.fills)) {
        const imgFills = node.fills.filter(f => f.type === "IMAGE");
        if (imgFills.length > 0) {
          imagesFound.push({
            name: node.name,
            w: Math.round(node.width),
            h: Math.round(node.height),
            hash: imgFills[0].imageHash ? imgFills[0].imageHash.substring(0, 10) : null,
            scaleMode: imgFills[0].scaleMode
          });
        }
      }
      if (node.children) {
        for (const c of node.children) checkNode(c);
      }
    }

    checkNode(frame);

    // Also re-select the frame and zoom into it
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    return {
      name: frame.name,
      id: frame.id,
      w: Math.round(frame.width),
      h: Math.round(frame.height),
      sectionsCount: frame.children.length,
      totalImagesRendered: imagesFound.length,
      allImagesList: imagesFound.map(i => i.name + " (" + i.w + "x" + i.h + ", mode: " + i.scaleMode + ")")
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
  console.log("Validation result:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
