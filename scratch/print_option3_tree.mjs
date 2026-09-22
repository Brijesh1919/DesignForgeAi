async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId: "762:2011", maxDepth: 10 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];

  function printDetails(node, indent = "") {
    let info = `[${node.type}] "${node.name}" (${node.width}x${node.height})`;
    if (node.layoutMode !== "NONE") info += ` AL:${node.layoutMode}`;
    if (node.text) info += ` text="${node.text.slice(0, 40)}"`;
    console.log(indent + info);

    if (node.children) {
      node.children.forEach(c => printDetails(c, indent + "  "));
    }
  }

  printDetails(root);
}

main().catch(console.error);
