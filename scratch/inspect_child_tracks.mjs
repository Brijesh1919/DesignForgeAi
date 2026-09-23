async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "820:7979" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const frame = data.data?.selection?.[0];
  console.log("=== ANMT-FRAME CHILDREN & MOTION TRACKS ===");
  if (frame?.children) {
    frame.children.forEach(c => {
      console.log(`- ${c.name} (${c.type}, id:${c.id})`);
      if (c.nodeManualKeyframeTracks) {
        console.log("    manualKeyframeTracks:", JSON.stringify(c.nodeManualKeyframeTracks));
      }
      if (c.children) {
        c.children.forEach(gc => {
          console.log(`   * ${gc.name} (${gc.type}, id:${gc.id})`);
          if (gc.nodeManualKeyframeTracks) {
            console.log("       manualKeyframeTracks:", JSON.stringify(gc.nodeManualKeyframeTracks));
          }
        });
      }
    });
  }
}

main().catch(console.error);
