async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "ADJUST_MOBILE_LAYOUT",
      payload: {
        viewportWidth: 390,
        horizontalPadding: 20,
        sectionSpacing: 32,
      },
      timeoutMs: 30000,
    }),
  });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
