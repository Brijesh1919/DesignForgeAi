async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId: "756:1507", maxDepth: 6 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const node = data.data?.selection?.[0];
  console.log("=== MOBILE NAV COMPONENT (756:1507) ===");
  console.log(JSON.stringify(node, null, 2));
}

main().catch(console.error);
