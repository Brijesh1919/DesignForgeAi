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
  const drawerNode = data.data?.selection?.[0];
  console.log("Drawer Node (767:4399):", drawerNode?.name, drawerNode?.type, drawerNode?.width, "x", drawerNode?.height);
  (drawerNode?.children || []).forEach(c => {
    let extra = "";
    if (c.reactions) extra += ` [REACTIONS: ${JSON.stringify(c.reactions)}]`;
    console.log(`  - [${c.type}] "${c.name}" (${c.width}x${c.height})${extra}`);
  });
}

main().catch(console.error);
