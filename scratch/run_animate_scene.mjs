async function main() {
  console.log("Dispatching ANIMATE_SCENE over Bridge to Figma...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "ANIMATE_SCENE",
      payload: {
        nodeId: "820:7979",
      },
      timeoutMs: 30000,
    }),
  });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
