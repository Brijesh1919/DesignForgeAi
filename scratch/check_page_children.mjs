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
  const children = data.data?.currentPageChildren || [];
  console.log("Total children on page:", children.length);
  children.forEach(c => {
    if (c.name.includes("Toast") || c.name.includes("Quote") || c.name.includes("Drawer") || c.name.includes("Option 4")) {
      console.log(`- [${c.type}] "${c.name}" (ID: ${c.id})`);
    }
  });
}

main().catch(console.error);
