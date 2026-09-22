async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "767:4399" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const drawer = data.data?.selection?.[0];
  console.log("Drawer (767:4399):", drawer?.name);
  (drawer?.children || []).forEach(c => {
    let r = c.reactions?.length ? ` [REACTIONS: ${c.reactions.length}]` : "";
    console.log(`  child: [${c.type}] "${c.name}"${r}`);
  });
}

main().catch(console.error);
