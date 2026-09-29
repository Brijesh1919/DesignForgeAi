async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "305:3408" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const f78 = data.data?.selection?.[0];
  console.log("Frame 78 info:", {
    id: f78.id,
    name: f78.name,
    type: f78.type,
    width: f78.width,
    height: f78.height,
    itemSpacing: f78.itemSpacing,
    padding: f78.padding,
    childrenCount: f78.children?.length,
  });
  f78.children?.slice(0, 3).forEach((c, i) => {
    console.log(`Child [${i}]:`, {
      id: c.id,
      name: c.name,
      type: c.type,
      width: c.width,
      height: c.height,
      layoutMode: c.layoutMode,
      childrenCount: c.children?.length,
    });
  });
}

main().catch(console.error);
