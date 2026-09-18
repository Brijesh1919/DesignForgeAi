async function main() {
  console.log("Sending RECOLOR_THEME command to Figma bridge...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "RECOLOR_THEME",
      payload: {},
      timeoutMs: 30000,
    }),
  });
  const data = await res.json();
  console.log("Recolor result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
