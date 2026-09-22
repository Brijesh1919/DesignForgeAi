async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 6, nodeId: "767:3286" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];

  function walk(n, indent = 0) {
    const pad = "  ".repeat(indent);
    let text = n.text ? ` text="${n.text.slice(0, 30)}"` : "";
    console.log(`${pad}- [${n.type}] "${n.name}" ID: ${n.id} (${n.width}x${n.height})${text}`);
    if (n.children) n.children.forEach(c => walk(c, indent + 1));
  }
  walk(root);
}
main().catch(console.error);
