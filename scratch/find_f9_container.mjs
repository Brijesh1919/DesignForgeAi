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
  const pageChildren = data.data?.currentPageChildren || [];
  console.log("Total children on page:", pageChildren.length);
  const found = pageChildren.find(c => c.id === "777:4809");
  console.log("Is 777:4809 a direct child of currentPage?", Boolean(found));

  // If not direct child, let's check which frame has y around 43575
  const frames = data.data?.availableFrames || [];
  const nearby = frames.filter(f => Math.abs(f.y - 43575) < 5000);
  console.log("Frames near y=43575:", nearby);
}

main().catch(console.error);
