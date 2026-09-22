async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "777:4809" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  console.log("Parent info:", data.data?.selection?.[0]?.parent);
}

main().catch(console.error);
