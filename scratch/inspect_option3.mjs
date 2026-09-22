async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: {},
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const selection = data.data?.selection || data.selection;
  console.log("Returned selection length:", selection?.length);
  if (selection && selection.length > 0) {
    const root = selection[0];
    console.log("Root frame:", root.name, `(${root.width}x${root.height})`, "children:", root.children?.length);
    if (root.children) {
      root.children.forEach((c, idx) => {
        console.log(`Section ${idx + 1}: "${c.name}" (${c.type}, ${c.width}x${c.height}, AL: ${c.layoutMode}, items: ${c.children?.length || 0})`);
      });
    }
  } else {
    console.log("Full data:", JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
