async function main() {
  console.log("Triggering CREATE_PRODUCT_LANDING_PAGE on node 806:216...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "CREATE_PRODUCT_LANDING_PAGE",
      payload: {
        nodeId: "806:216",
        startX: 2400,
        startY: 46000,
      },
      timeoutMs: 60000,
    }),
  });

  const data = await res.json();
  console.log("Result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
