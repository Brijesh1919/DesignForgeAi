async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "767:3501" },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  const btn = data.data?.selection?.[0];
  console.log("Submit button full:", JSON.stringify(btn, null, 2));
}

main().catch(console.error);
