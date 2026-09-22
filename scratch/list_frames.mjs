async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 6 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const frames = data.data?.availableFrames || [];
  console.log("Frames found:", frames.map(f => `${f.name} (${f.id})`).join(", "));
}
main().catch(console.error);
