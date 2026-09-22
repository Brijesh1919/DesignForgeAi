async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { nodeId: "762:2011", maxDepth: 8 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];
  if (!root) return console.log("Not found");

  function scanIssues(node, path = "") {
    const p = path ? `${path} > ${node.name}` : node.name;
    // Check width overflow
    if (node.width > 390) {
      console.log(`[OVERFLOW] ${p}: width=${node.width}px > 390px (AL: ${node.layoutMode}, sizing: ${node.layoutSizingHorizontal})`);
    }
    // Check text auto-resize or wrapping
    if (node.type === "TEXT") {
      if (node.width > 360) {
        console.log(`[WIDE TEXT] ${p}: width=${node.width}px, text="${node.text?.slice(0, 35)}"`);
      }
    }
    if (node.children) {
      node.children.forEach((c) => scanIssues(c, p));
    }
  }

  console.log("=== SCANNING FOR OVERFLOWS & ISSUES IN OPTION 3 ===");
  scanIssues(root);
}

main().catch(console.error);
