async function main() {
  console.log("Verifying 8 landing page frames on Figma canvas...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4 },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  const allFrames = data.data?.availableFrames || [];
  const landingFrames = allFrames.filter(f => /0[1-8]\s*—/.test(f.name));
  
  console.log(`Found ${landingFrames.length} landing frames:`);
  for (const f of landingFrames) {
    console.log(`- Frame "${f.name}" (ID: ${f.id}, ${f.width}x${f.height})`);
  }

  // Inspect each frame in detail
  for (const f of landingFrames) {
    const detailRes = await fetch("http://localhost:3001/api/bridge/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "GET_CANVAS_SELECTION",
        payload: { nodeId: f.id, maxDepth: 2 },
        timeoutMs: 15000,
      }),
    });
    const detailData = await detailRes.json();
    const frameNode = detailData.data?.selection?.[0];
    const productChild = (frameNode?.children || []).find(c => c.name === "Product Asset");
    console.log(`\nFrame: ${f.name}`);
    console.log(`  Reactions: ${JSON.stringify(frameNode?.reactions)}`);
    console.log(`  Product Asset: ${productChild ? `YES (pos: ${productChild.x}, ${productChild.y}, size: ${productChild.width}x${productChild.height})` : 'MISSING'}`);
  }
}

main().catch(console.error);
