async function main() {
  console.log("Dispatching FIGMA_MOTION_ANIMATION to Figma via Bridge...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "FIGMA_MOTION_ANIMATION",
      payload: {
        nodeId: "820:7979",
        duration: 9.0,
      },
      timeoutMs: 30000,
    }),
  });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
