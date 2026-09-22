async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId: "762:2376", maxDepth: 6 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const node = data.data?.selection?.[0];

  function printAll(n, indent = "") {
    const txt = n.text ? ` text="${n.text}"` : "";
    console.log(`${indent}- ${n.name} (${n.type}, ${n.width}x${n.height}, AL: ${n.layoutMode})${txt} [${n.id}]`);
    if (n.children) {
      n.children.forEach(c => printAll(c, indent + "  "));
    }
  }

  printAll(node);
}

main().catch(console.error);
