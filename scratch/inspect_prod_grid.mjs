import fs from "fs";

async function main() {
  const code = `
    const root = await figma.getNodeByIdAsync("21:9301");
    const prodSection = root.children.find(c => c.name === "Popular Products Section");
    const prodGrid = prodSection.children.find(c => c.name === "Products Grid (6 Cards)");
    
    return {
      name: prodGrid.name,
      w: prodGrid.width,
      h: prodGrid.height,
      layoutMode: prodGrid.layoutMode,
      layoutSizingH: prodGrid.layoutSizingHorizontal,
      layoutSizingV: prodGrid.layoutSizingVertical,
      rows: prodGrid.children.map(r => ({
        name: r.name,
        w: r.width,
        h: r.height,
        layoutMode: r.layoutMode,
        layoutSizingH: r.layoutSizingHorizontal,
        layoutSizingV: r.layoutSizingVertical,
        cards: r.children.map(c => ({
          name: c.name,
          w: c.width,
          h: c.height,
          children: c.children.map(ch => ({ name: ch.name, w: ch.width, h: ch.height }))
        }))
      }))
    };
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });

  const data = await res.json();
  console.log("ProdGrid inspection:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
