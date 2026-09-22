async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "767:3501" },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  const btn = data.data?.selection?.[0];
  console.log("Submit button (767:3501):", btn?.name, btn?.width, "x", btn?.height);
  (btn?.children || []).forEach(c => {
    console.log(`  child: [${c.type}] "${c.characters}" (name: ${c.name})`);
  });
}

main().catch(console.error);
