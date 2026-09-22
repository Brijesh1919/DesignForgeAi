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
  const selection = data.data?.selection || [];
  console.log("=== CURRENT SELECTION ===");
  console.log("Count:", selection.length);
  selection.forEach((s) => {
    console.log(`- "${s.name}" (ID: ${s.id}, ${s.width}x${s.height}, children: ${s.childrenCount})`);
  });

  console.log("\n=== AVAILABLE FRAMES ===");
  (data.data?.availableFrames || []).forEach((f) => {
    if (f.name.includes("Option") || f.name.includes("Mobile") || f.name.includes("Desktop")) {
      console.log(`- "${f.name}" (ID: ${f.id}, ${f.width}x${f.height})`);
    }
  });
}

main().catch(console.error);
