async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 10 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data?.selection || [], null, 2));
}

main().catch(console.error);
