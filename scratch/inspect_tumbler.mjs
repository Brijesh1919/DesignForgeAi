async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 2, nodeId: "806:216" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const node = data.data?.selection?.[0];
  console.log("Tumbler node details:", JSON.stringify({
    id: node?.id,
    name: node?.name,
    type: node?.type,
    width: node?.width,
    height: node?.height,
    x: node?.x,
    y: node?.y,
    fills: node?.fills
  }, null, 2));
}

main().catch(console.error);
