async function main() {
  const code = `
    const hash = "82661b2c9e1f741c022efd375bd7de85c5f85c0a";
    const r = figma.createRectangle();
    r.resize(200, 200);
    r.fills = [
      { type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } },
      { type: "IMAGE", imageHash: hash, scaleMode: "FIT" }
    ];
    const fills = r.fills;
    r.remove();
    return {
      count: fills.length,
      types: fills.map(f => f.type)
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
  console.log("Multi-fill test:", data.data?.data);
}

main().catch(console.error);
