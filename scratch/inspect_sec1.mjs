async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId: "762:2011", maxDepth: 4 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  const sec1 = root?.children?.[0];
  console.log("=== SECTION 1 DETAILS ===");
  console.log(JSON.stringify(sec1, null, 2));
}

main().catch(console.error);
