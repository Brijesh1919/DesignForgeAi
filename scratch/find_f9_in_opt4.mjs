async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 6, nodeId: "767:3265" }, // Option 4
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const opt4 = data.data?.selection?.[0];
  function search(n, path = "") {
    const cp = path ? `${path} > ${n.name}` : n.name;
    if (n.id === "777:4809") console.log("Found 777:4809 in Option 4 at:", cp);
    if (n.children) n.children.forEach(c => search(c, cp));
  }
  search(opt4);
}

main().catch(console.error);
