async function main() {
  console.log("Sending ADD_PROTOTYPE_EFFECTS for Option 4 (767:3265)...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "ADD_PROTOTYPE_EFFECTS",
      payload: {
        nodeId: "767:3265",
      },
      timeoutMs: 35000,
    }),
  });

  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
