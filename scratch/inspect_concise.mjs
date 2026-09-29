async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 3, nodeId: "305:3407" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  console.log("Root:", {
    id: root.id,
    name: root.name,
    type: root.type,
    width: root.width,
    height: root.height,
    x: root.x,
    y: root.y,
    clipsContent: root.clipsContent,
    layoutMode: root.layoutMode,
  });

  const child0 = root.children?.[0];
  if (child0) {
    console.log("Child 0:", {
      id: child0.id,
      name: child0.name,
      type: child0.type,
      width: child0.width,
      height: child0.height,
      x: child0.x,
      y: child0.y,
      layoutMode: child0.layoutMode,
      itemSpacing: child0.itemSpacing,
      padding: child0.padding,
      childrenCount: child0.children?.length,
    });

    console.log("Grandchildren:");
    child0.children?.forEach((gc, idx) => {
      console.log(`  [${idx}] "${gc.name}" (${gc.id}) ${gc.width}x${gc.height}`);
    });
  }
}

main().catch(console.error);
