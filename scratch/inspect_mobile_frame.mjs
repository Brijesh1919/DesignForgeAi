async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: {},
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const selection = data.data?.selection || data.selection;
  const root = selection?.[0];
  if (!root) {
    console.log("No selection found");
    return;
  }

  function printTree(node, indent = "") {
    const textInfo = node.text ? ` text="${node.text.slice(0, 40)}"` : "";
    const layout = node.layoutMode !== "NONE" ? ` AL:${node.layoutMode}(pad:${node.padding},gap:${node.itemSpacing})` : "";
    console.log(`${indent}- [${node.type}] "${node.name}" (${node.width}x${node.height} at ${node.x},${node.y})${layout}${textInfo} id=${node.id}`);
    if (node.children) {
      node.children.forEach(c => printTree(c, indent + "  "));
    }
  }

  console.log("=== ROOT SELECTION ===");
  printTree(root);
}

main().catch(console.error);
