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
  console.log("Frame:", frame?.name, frame?.width, "x", frame?.height, "id:", frame?.id);
  
  function printNode(node, indent = "  ") {
    console.log(`${indent}- "${node.name}" (${node.type}, id: ${node.id}, x: ${node.x}, y: ${node.y}, w: ${node.width}, h: ${node.height})`);
    if (node.children) {
      for (const c of node.children) {
        printNode(c, indent + "  ");
      }
    }
  }

  if (frame?.children) {
    for (const c of frame.children) {
      printNode(c);
    }
  }
}

main().catch(console.error);
