async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: {
        nodeId: "760:1536",
        maxDepth: 5,
      },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  if (!root) {
    console.log("No root returned:", data);
    return;
  }

  function printNode(n, indent = "") {
    const txt = n.text ? ` text="${n.text.replace(/\n/g, ' ').slice(0, 50)}"` : "";
    const al = n.layoutMode !== "NONE" ? ` AL:${n.layoutMode}` : "";
    const sz = `[H:${n.layoutSizingHorizontal || '?'}, V:${n.layoutSizingVertical || '?'}]`;
    console.log(`${indent}- ${n.name} (${n.type}, ${n.width}x${n.height}${al}, ${sz})${txt} [${n.id}]`);
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(c => printNode(c, indent + "  "));
    }
  }

  console.log("=== FULL TREE OF OPTION 2 - MOBILE ===");
  printNode(root);
}

main().catch(console.error);
