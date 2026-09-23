async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 10 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const frame = data.data?.selection?.[0];
  console.log("Frame fills:", JSON.stringify(frame?.fills));
  
  function dump(node, depth = 0) {
    const pad = "  ".repeat(depth);
    console.log(`${pad}${node.name} (${node.type}) bounds: [x=${node.x}, y=${node.y}, w=${node.width}, h=${node.height}] fills=${JSON.stringify(node.fills)} strokes=${node.strokeWeight}`);
    if (node.children) {
      for (const c of node.children) dump(c, depth + 1);
    }
  }

  dump(frame);
}

main().catch(console.error);
