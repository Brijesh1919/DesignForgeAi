async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 8, nodeId: "767:3423" },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  const formSection = data.data?.selection?.[0];

  function inspectNode(node, depth = 0) {
    const indent = "  ".repeat(depth);
    let extra = "";
    if (node.reactions && node.reactions.length > 0) {
      extra += ` [REACTIONS: ${JSON.stringify(node.reactions)}]`;
    }
    if (node.characters) {
      extra += ` [TEXT: "${node.characters}"]`;
    }
    console.log(`${indent}- [${node.type}] "${node.name}" (ID: ${node.id}, ${node.width}x${node.height})${extra}`);
    if (node.children) {
      node.children.forEach(c => inspectNode(c, depth + 1));
    }
  }

  inspectNode(formSection);
}

main().catch(console.error);
