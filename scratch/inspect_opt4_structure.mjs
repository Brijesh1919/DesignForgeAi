async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 3, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const opt4 = data.data?.selection?.[0];
  console.log("Option 4 info:", opt4?.name, opt4?.id, opt4?.width, "x", opt4?.height, "children:", opt4?.childrenCount);
  (opt4?.children || []).forEach(c => {
    console.log(`  - [${c.type}] "${c.name}" (${c.width}x${c.height}, children: ${c.childrenCount})`);
  });
}
main().catch(console.error);
