async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "777:4809" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  console.log("Selected Node:", root?.name, root?.id, root?.type, root?.width, "x", root?.height);
  console.log("Parent:", root?.parentType);
  console.log("Children count:", root?.children?.length);
  (root?.children || []).forEach((c, i) => {
    console.log(`[${i}] "${c.name}" (${c.type}, ID: ${c.id}, ${c.width}x${c.height}, fills: ${c.fills?.length})`);
    if (c.fills) console.log("   fills:", JSON.stringify(c.fills));
  });
}

main().catch(console.error);
