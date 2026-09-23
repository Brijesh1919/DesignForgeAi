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
  const styles = data.data?.selection?.[0]?.animationStyles || [];
  console.log("All style IDs:", styles.map(s => s.styleId));
  const moveStyle = styles.find(s => s.styleId === "Move");
  console.log("Move Style:", JSON.stringify(moveStyle, null, 2));
}

main().catch(console.error);
