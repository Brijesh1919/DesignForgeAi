async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 2, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const opt4 = data.data?.selection?.[0];
  (opt4?.children || []).forEach(c => {
    console.log(`  - [${c.type}] "${c.name}" y=${c.y} h=${c.height}`);
  });
}
main().catch(console.error);
