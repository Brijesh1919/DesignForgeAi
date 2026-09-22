async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 1 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const available = data.data?.availableFrames || [];
  console.log("Total frames/components on page:", available.length);
  available.forEach(f => {
    if (f.name.includes("Toast") || f.name.includes("Quote") || f.name.includes("Drawer")) {
      console.log(`- "${f.name}" (ID: ${f.id}, ${f.width}x${f.height})`);
    }
  });
}

main().catch(console.error);
