async function main() {
  const code = `
    const hash = "82661b2c9e1f741c022efd375bd7de85c5f85c0a"; // Hero journal

    // Test on frame
    const f = figma.createFrame();
    f.name = "Test Frame Img";
    f.resize(200, 200);
    f.fills = [{ type: "IMAGE", imageHash: hash, scaleMode: "FIT" }];

    // Test on rectangle
    const r = figma.createRectangle();
    r.name = "Test Rect Img";
    r.resize(200, 200);
    r.fills = [{ type: "IMAGE", imageHash: hash, scaleMode: "FIT" }];

    const res = {
      frameFills: f.fills.map(x => ({ type: x.type, hash: x.imageHash, scale: x.scaleMode })),
      rectFills: r.fills.map(x => ({ type: x.type, hash: x.imageHash, scale: x.scaleMode }))
    };

    f.remove();
    r.remove();
    return res;
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
  console.log("Fill test:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
