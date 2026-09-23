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
  console.log("=== SELECTION ===");
  console.log(data.data?.selection?.[0]?.name, "ID:", data.data?.selection?.[0]?.id);

  console.log("\n=== AVAILABLE FRAMES ON PAGE ===");
  const frames = (data.data?.availableFrames || []).filter(f => 
    f.name.includes("01") || f.name.includes("02") || f.name.includes("03") || 
    f.name.includes("04") || f.name.includes("05") || f.name.includes("06") || 
    f.name.includes("07") || f.name.includes("08") || f.name.includes("09") ||
    f.name.includes("Anmt")
  );
  frames.forEach((f) => {
    console.log(`- "${f.name}" (ID: ${f.id}, ${f.width}x${f.height})`);
  });
}

main().catch(console.error);
