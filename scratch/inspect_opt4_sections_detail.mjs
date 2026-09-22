async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  console.log("Root:", root?.name, root?.id, root?.width, "x", root?.height);
  (root?.children || []).forEach((c, idx) => {
    console.log(`\n[Section ${idx}] "${c.name}" (ID: ${c.id}, ${c.type}, ${c.width}x${c.height})`);
    if (c.children) {
      c.children.forEach((sub, sidx) => {
        let textInfo = sub.text ? ` text="${sub.text.slice(0, 30)}"` : "";
        console.log(`   - [${sub.type}] "${sub.name}" (${sub.width}x${sub.height})${textInfo}`);
        if (sub.children) {
          sub.children.forEach(gc => {
            let gcText = gc.text ? ` text="${gc.text.slice(0, 25)}"` : "";
            console.log(`      * [${gc.type}] "${gc.name}" (${gc.width}x${gc.height})${gcText}`);
          });
        }
      });
    }
  });
}
main().catch(console.error);
