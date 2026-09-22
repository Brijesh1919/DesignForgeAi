async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 2, nodeId: "777:4809" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const f9 = data.data?.selection?.[0];
  console.log("f9 x, y:", f9?.x, f9?.y);
  console.log("f9 parentType:", f9?.parentType);
  console.log("f9 full:", JSON.stringify(f9, null, 2));
}

main().catch(console.error);
