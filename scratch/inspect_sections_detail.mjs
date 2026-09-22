async function inspectNode(nodeId, title) {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId, maxDepth: 4 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const node = data.data?.selection?.[0];
  if (!node) {
    console.log(`[${title}] Node not found`);
    return;
  }
  console.log(`\n================== ${title} ==================`);
  console.log(`Name: "${node.name}" | ID: ${node.id} | Size: ${node.width}x${node.height} | AL: ${node.layoutMode}`);
  console.log(`Direct Children Count: ${node.children?.length || 0}`);
  
  if (node.children) {
    node.children.forEach((c, idx) => {
      const textSample = c.text ? ` text="${c.text.slice(0, 30)}"` : "";
      console.log(`  [Section ${idx + 1}] "${c.name}" (${c.type}, ${c.width}x${c.height}, AL: ${c.layoutMode}, items: ${c.children?.length || 0})${textSample}`);
      if (c.children && c.children.length > 0) {
        c.children.slice(0, 8).forEach((sub, sidx) => {
          const subText = sub.text ? ` text="${sub.text.slice(0, 25)}"` : "";
          console.log(`     (${sidx + 1}) "${sub.name}" (${sub.type}, ${sub.width}x${sub.height}, AL: ${sub.layoutMode})${subText}`);
        });
        if (c.children.length > 8) {
          console.log(`     ... and ${c.children.length - 8} more items`);
        }
      }
    });
  }
}

async function main() {
  await inspectNode("762:2011", "Option 3 (Current Selection)");
  await inspectNode("760:1536", "Option 2 — Mobile (760:1536)");
}

main().catch(console.error);
