async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 8, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const root = data.data?.selection?.[0];

  function findNodes(n, fn, acc = []) {
    if (fn(n)) acc.push(n);
    if (n.children) {
      for (const c of n.children) findNodes(c, fn, acc);
    }
    return acc;
  }

  const menuItems = findNodes(root, n => (n.name || "").includes("Menu") || (n.name || "").includes("Header Actions"));
  console.log("=== HEADER / MENU NODES ===");
  menuItems.forEach(m => {
    console.log(`- "${m.name}" (${m.type}, ${m.width}x${m.height})`);
    if (m.reactions) {
      console.log(`  Reactions:`, JSON.stringify(m.reactions, null, 2));
    }
  });

  const headings = findNodes(root, n => n.type === "TEXT" && n.fontSize >= 18);
  console.log("\n=== HEADINGS ALIGNMENT & LETTER SPACING ===");
  headings.forEach(h => {
    console.log(`- "${h.text.slice(0, 35)}" Font: ${h.fontSize}px, LS: ${h.letterSpacing}, Align: ${h.textAlignHorizontal}`);
  });

  const formNodes = findNodes(root, n => (n.name || "").toLowerCase().includes("input") || (n.name || "").toLowerCase().includes("field"));
  console.log("\n=== FORM FIELDS ALIGNMENT ===");
  formNodes.slice(0, 5).forEach(f => {
    console.log(`- "${f.name}" (${f.width}x${f.height})`);
    if (f.children) {
      f.children.forEach(fc => {
        if (fc.type === "TEXT") {
          console.log(`    child text: "${fc.text.slice(0, 30)}" align: ${fc.textAlignHorizontal}`);
        }
      });
    }
  });

  const drawer = (data.data?.availableFrames || []).find(f => f.name.includes("Mobile Navigation Drawer"));
  console.log("\n=== STANDALONE DRAWER COMPONENT ON CANVAS ===");
  console.log(drawer);
}

main().catch(console.error);
