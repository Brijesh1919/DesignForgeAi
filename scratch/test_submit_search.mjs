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

  const btn = findNode(root, n => {
    if (n.type === "FRAME" && n.height >= 40 && n.height <= 64) {
      const txt = findNode(n, cn => cn.type === "TEXT" && ((cn.text || "").toLowerCase().includes("request") || (cn.text || "").toLowerCase().includes("submit")));
      return Boolean(txt);
    }
    return false;
  });

  console.log("Found submit btn:", btn?.name, btn?.id, btn?.width, "x", btn?.height);
}

main().catch(console.error);
