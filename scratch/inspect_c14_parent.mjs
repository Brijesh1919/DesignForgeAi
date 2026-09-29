async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 1, nodeId: "305:3407" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  console.log("Component 14 details:", data.data?.selection?.[0]);
}

main().catch(console.error);
