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
  const posStyle = styles.find(s => s.styleId === "Position");
  console.log("Position Style:", JSON.stringify(posStyle, null, 2));
}

main().catch(console.error);
