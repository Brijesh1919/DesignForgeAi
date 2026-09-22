async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "786:5019" },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  const instance = data.data?.selection?.[0];
  console.log("=== CAROUSEL SQUARE INSTANCE ===");
  console.log("Name:", instance?.name);
  console.log("ID:", instance?.id);
  console.log("Type:", instance?.type);
  console.log("Dimensions:", `${instance?.width}x${instance?.height}`);
  console.log("Clips Content:", instance?.clipsContent);

  // Now inspect the Component Set
  const csetRes = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "786:4978" },
      timeoutMs: 15000,
    }),
  });
  const csetData = await csetRes.json();
  const cset = csetData.data?.selection?.[0];
  console.log("\n=== COMPONENT SET ===");
  console.log("Name:", cset?.name);
  console.log("ID:", cset?.id);
  console.log("Type:", cset?.type);
  console.log("Variants count:", cset?.children?.length);
  (cset?.children || []).forEach((v, i) => {
    console.log(`\nVariant [${i}]: "${v.name}" (${v.width}x${v.height})`);
    if (v.reactions?.length) {
      v.reactions.forEach((r, ri) => {
        const act = r.action || (r.actions && r.actions[0]);
        console.log(`   Reaction #${ri + 1}: Trigger=${r.trigger?.type} (${r.trigger?.timeout || ""}) -> Nav=${act?.navigation}, Dest=${act?.destinationId}, Transition=${act?.transition?.type}, Easing=${act?.transition?.easing?.type}`);
      });
    }
    const track = (v.children || []).find(c => c.name === "Slides Track");
    console.log(`   Track x: ${track?.x}, y: ${track?.y}, width: ${track?.width}`);
  });
}

main().catch(console.error);
