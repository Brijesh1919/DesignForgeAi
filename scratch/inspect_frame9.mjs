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

  function findNode(n, targetName) {
    if (n.name === targetName) {
      console.log("Found:", n.name, n.id, n.type, `${n.width}x${n.height}`, "AL:", n.layoutMode, "children:", n.children?.length);
      if (n.children) {
        n.children.forEach(c => console.log("  child:", c.name, c.id, c.type, `${c.width}x${c.height}`));
      }
    }
    if (n.children) {
      n.children.forEach(c => findNode(c, targetName));
    }
  }

  findNode(root, "Component 1");
  findNode(root, "Frame 9");
}

main().catch(console.error);
