async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "777:4809" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  console.log("Root:", root.name, root.id, root.width, "x", root.height);
  root.children.forEach((c, i) => {
    console.log(`\nChild [${i}]: "${c.name}" (ID: ${c.id}, ${c.width}x${c.height})`);
    console.log("  fills:", JSON.stringify(c.fills, null, 2));
    console.log("  children count:", c.children?.length);
    if (c.children?.length) {
      c.children.forEach(sub => console.log(`    sub: [${sub.type}] "${sub.name}" (${sub.width}x${sub.height})`));
    }
  });
}

main().catch(console.error);
