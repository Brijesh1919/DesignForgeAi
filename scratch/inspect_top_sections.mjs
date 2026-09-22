async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId: "762:2011", maxDepth: 2 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  console.log("Root:", root.name, `${root.width}x${root.height}`);
  root.children?.forEach((c, idx) => {
    console.log(`[${idx + 1}] "${c.name}" (${c.type}, ${c.width}x${c.height}, AL: ${c.layoutMode}, items: ${c.children?.length || 0}) id=${c.id}`);
  });
}

main().catch(console.error);
