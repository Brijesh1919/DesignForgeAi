async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 5, nodeId: "767:4399" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const drawer = data.data?.selection?.[0];
  function inspect(n) {
    if (n.reactions?.length) {
      console.log(`[${n.id}] "${n.name}":`, JSON.stringify(n.reactions));
    }
    if (n.children) n.children.forEach(inspect);
  }
  inspect(drawer);
}

main().catch(console.error);
