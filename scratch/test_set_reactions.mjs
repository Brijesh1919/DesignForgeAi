async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const drawerFrame = (data.data?.availableFrames || []).find(f => f.name.includes("Mobile Navigation Drawer"));
  console.log("Drawer frame on canvas:", drawerFrame);
}

main().catch(console.error);
