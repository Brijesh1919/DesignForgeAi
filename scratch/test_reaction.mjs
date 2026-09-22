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
  const root = data.data?.selection?.[0];
  console.log("Root:", root?.name, root?.id);

  function findNode(n, name) {
    if (n.name.includes(name)) return n;
    if (n.children) {
      for (const c of n.children) {
        const found = findNode(c, name);
        if (found) return found;
      }
    }
    return null;
  }

  const menu = findNode(root, "Menu");
  console.log("Found menu:", menu);
}

main().catch(console.error);
