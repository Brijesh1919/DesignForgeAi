async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 5, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  const frame = data.data?.selection?.[0];
  console.log("=== OPTION 4 PROTOTYPE PROPERTIES ===");
  console.log("Name:", frame?.name);
  console.log("Dimensions:", `${frame?.width}x${frame?.height}`);
  console.log("Overflow Direction:", frame?.overflowDirection);
  console.log("Number of Fixed Children:", frame?.numberOfFixedChildren);
  console.log("Children Count:", frame?.children?.length);

  console.log("\n=== SECTIONS & DIRECT CHILDREN ===");
  (frame?.children || []).forEach((c, idx) => {
    let rCount = c.reactions?.length || 0;
    console.log(`[${idx}] "${c.name}" (ID: ${c.id}, ${c.width}x${c.height}, reactions: ${rCount})`);
  });

  // Also check canvas for Quote Confirmation Toast
  const toastRes = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 3 },
      timeoutMs: 15000,
    }),
  });
  const toastData = await toastRes.json();
  const available = toastData.data?.availableFrames || [];
  console.log("\n=== AVAILABLE CANVAS NODES ===");
  available.forEach(f => {
    if (f.name.includes("Toast") || f.name.includes("Drawer") || f.name.includes("Option 4")) {
      console.log(`- "${f.name}" (ID: ${f.id}, ${f.width}x${f.height})`);
    }
  });
}

main().catch(console.error);
