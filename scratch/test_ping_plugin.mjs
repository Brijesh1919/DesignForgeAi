async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: {},
      timeoutMs: 5000,
    }),
  });
  const data = await res.json();
  console.log("Ping selection response:", data.success, "count:", data.data?.selection?.length);
}

main().catch(console.error);
