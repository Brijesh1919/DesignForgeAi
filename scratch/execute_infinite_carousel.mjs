async function main() {
  console.log("Triggering CREATE_CAROUSEL_COMPONENT for Component 14 (305:3407)...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "CREATE_CAROUSEL_COMPONENT",
      payload: {
        nodeId: "305:3407",
        mode: "infinite_marquee",
        viewportWidth: 1319,
        viewportHeight: 394,
        duration: 32,
        infinite: true,
      },
      timeoutMs: 40000,
    }),
  });

  const data = await res.json();
  console.log("Result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
