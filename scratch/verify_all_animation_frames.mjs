async function main() {
  const frameIds = [
    "820:8149", // 01
    "820:8177", // 02
    "820:8205", // 03
    "820:8233", // 04
    "820:8261", // 05
    "820:8289", // 06
    "820:8317", // 07
    "820:8345", // 08
    "820:8373", // 09
  ];

  console.log("=== VERIFYING ANIMATION SEQUENCE ===");
  for (let i = 0; i < frameIds.length; i++) {
    const id = frameIds[i];
    const res = await fetch("http://localhost:3001/api/bridge/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "GET_CANVAS_SELECTION",
        payload: { maxDepth: 4, nodeId: id },
        timeoutMs: 15000,
      }),
    });
    const data = await res.json();
    const f = data.data?.selection?.[0];
    const ball = f?.children?.find(c => c.name === "Ball");
    const canopy = f?.children?.find(c => c.name === "Tree")?.children?.find(c => c.name === "Tree_Canopy");
    const cloudL = f?.children?.find(c => c.name === "Cloud_Left");
    const bird1 = f?.children?.find(c => c.name === "Bird_01");
    const r = f?.reactions?.[0];
    const destId = r?.actions?.[0]?.destinationId;
    console.log(`[Frame ${i + 1}] "${f?.name}" (ID: ${id})`);
    console.log(`  -> Ball: [x:${ball?.x}, y:${ball?.y}, w:${ball?.width}, h:${ball?.height}]`);
    console.log(`  -> Canopy x:${canopy?.x}, CloudL x:${cloudL?.x}, Bird1 x:${bird1?.x}`);
    console.log(`  -> Reaction: ${r?.trigger?.type} -> Destination ID: ${destId}`);
  }
}

main().catch(console.error);
