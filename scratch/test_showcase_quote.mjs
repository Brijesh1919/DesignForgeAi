async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 8, nodeId: "767:3286" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];

  function findNode(n, pred) {
    if (pred(n)) return n;
    if (n.children) {
      for (const c of n.children) {
        const f = findNode(c, pred);
        if (f) return f;
      }
    }
    return null;
  }

  const hasQuote = findNode(root, n => n.type === "TEXT" && (n.text || "").toLowerCase().includes("quote"));
  console.log("Does showcaseSection (767:3286) contain quote text?", Boolean(hasQuote), hasQuote?.text);
}

main().catch(console.error);
