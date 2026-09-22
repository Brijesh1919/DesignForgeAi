async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 6 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  if (!root) {
    console.log("No selection");
    return;
  }
  console.log("Root:", root.name, root.id, root.width, "x", root.height);

  function walk(node, indent = 0) {
    const pad = "  ".repeat(indent);
    let extra = "";
    if (node.reactions && node.reactions.length) {
      extra += ` [REACTIONS: ${JSON.stringify(node.reactions)}]`;
    }
    if (node.text) {
      extra += ` [TEXT: "${node.text}" font: ${node.fontSize}px ls: ${node.letterSpacing} align: ${node.textAlignHorizontal}]`;
    }
    console.log(`${pad}- [${node.type}] "${node.name}" (${node.width}x${node.height})${extra}`);
    if (node.children) {
      node.children.forEach((c) => walk(c, indent + 1));
    }
  }

  walk(root);
}

main().catch(console.error);
