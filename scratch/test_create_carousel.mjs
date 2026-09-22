async function main() {
  console.log("Executing CREATE_CAROUSEL_COMPONENT on Frame 9 (777:4809)...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "CREATE_CAROUSEL_COMPONENT",
      payload: {
        nodeId: "777:4809",
        squareSize: 320,
      },
      timeoutMs: 35000,
    }),
  });

  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
