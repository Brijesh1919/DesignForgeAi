async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 10, nodeId: "820:8149" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const f1 = data.data?.selection?.[0];
  console.log("=== FRAME 01 DETAILS ===");
  console.log("Name:", f1?.name);
  console.log("Reactions:", JSON.stringify(f1?.reactions, null, 2));
  
  if (f1?.children) {
    f1.children.forEach(c => {
      console.log(`- ${c.name} (${c.type}) x:${c.x}, y:${c.y}, w:${c.width}, h:${c.height}`);
      if (c.children) {
        c.children.forEach(gc => {
          console.log(`   * ${gc.name} (${gc.type}) x:${gc.x}, y:${gc.y}, w:${gc.width}, h:${gc.height}`);
        });
      }
    });
  }
}

main().catch(console.error);
