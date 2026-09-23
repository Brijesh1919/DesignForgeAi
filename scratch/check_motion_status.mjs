async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 2, nodeId: "820:7979" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const node = data.data?.selection?.[0];
  console.log("animationStyles:", JSON.stringify(node?.animationStyles, null, 2));
  console.log("animationStylesError:", node?.animationStylesError);
  console.log("nodeTimelines:", JSON.stringify(node?.nodeTimelines, null, 2));
  console.log("nodeManualKeyframeTracks:", JSON.stringify(node?.nodeManualKeyframeTracks, null, 2));
  console.log("nodeAnimations:", JSON.stringify(node?.nodeAnimations, null, 2));
}

main().catch(console.error);
