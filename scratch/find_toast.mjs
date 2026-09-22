async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 2 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const frames = data.data?.availableFrames || [];
  const toast = frames.find(f => f.name.toLowerCase().includes("toast"));
  console.log("Found toast in availableFrames?", toast);
}

main().catch(console.error);
