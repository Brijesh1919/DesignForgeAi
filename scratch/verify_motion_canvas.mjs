async function main() {
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
  console.log("Selected frame:", data.data?.selection?.[0]?.name, "ID:", data.data?.selection?.[0]?.id);
  console.log("Selected frame timelines:", JSON.stringify(data.data?.selection?.[0]?.nodeTimelines));
  console.log("Selected frame manualKeyframeTracks:", JSON.stringify(data.data?.selection?.[0]?.nodeManualKeyframeTracks));
  
  const frames = (data.data?.availableFrames || []).filter(f => 
    f.name.includes("Anmt") || f.name.includes("01") || f.name.includes("02") || f.name.includes("03")
  );
  console.log("\nMatching Frames on Canvas:");
  frames.forEach(f => console.log(`- "${f.name}" (${f.id})`));
}

main().catch(console.error);
