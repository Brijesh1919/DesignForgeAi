async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId: "762:2011", maxDepth: 5 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  if (!root) return;

  console.log("=================================================");
  console.log(`FRAME: "${root.name}" (${root.width}x${root.height})`);
  console.log(`Layout Mode: ${root.layoutMode} | Sizing: [H:${root.layoutSizingHorizontal}, V:${root.layoutSizingVertical}]`);
  console.log("=================================================");

  root.children?.forEach((sec, i) => {
    console.log(`\n--- Section ${i + 1}: "${sec.name}" (${sec.type}, ${sec.width}x${sec.height}, AL: ${sec.layoutMode}) ---`);
    if (sec.children) {
      sec.children.forEach((child, ci) => {
        const txt = child.text ? ` -> "${child.text.replace(/\n/g, ' ').slice(0, 45)}"` : "";
        console.log(`  [${ci + 1}] "${child.name}" (${child.type}, ${child.width}x${child.height}, AL: ${child.layoutMode})${txt}`);
        if (child.children && child.children.length > 0) {
          child.children.slice(0, 5).forEach((gc, gi) => {
            const gtxt = gc.text ? ` -> "${gc.text.replace(/\n/g, ' ').slice(0, 30)}"` : "";
            console.log(`      (${gi + 1}) "${gc.name}" (${gc.type}, ${gc.width}x${gc.height}, AL: ${gc.layoutMode})${gtxt}`);
          });
          if (child.children.length > 5) {
            console.log(`      ... and ${child.children.length - 5} more elements`);
          }
        }
      });
    }
  });
}

main().catch(console.error);
