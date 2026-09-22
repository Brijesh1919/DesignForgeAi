async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 8, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];

  function findButtons(n, path = "") {
    const currentPath = path ? `${path} > ${n.name}` : n.name;
    const isBtn = (n.name || "").toLowerCase().includes("btn") ||
                  (n.name || "").toLowerCase().includes("button") ||
                  (n.name || "").toLowerCase().includes("cta") ||
                  (n.children && n.children.some(c => c.text && (c.text.toLowerCase().includes("quote") || c.text.toLowerCase().includes("submit"))));

    if (isBtn) {
      console.log(`[BUTTON] "${n.name}" ID: ${n.id} (${n.width}x${n.height}) Path: ${currentPath}`);
      if (n.children) {
        n.children.forEach(c => {
          if (c.text) console.log(`   text: "${c.text}"`);
        });
      }
    }
    if (n.children) {
      n.children.forEach(c => findButtons(c, currentPath));
    }
  }

  findButtons(root);
}
main().catch(console.error);
