async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: {},
      timeoutMs: 10000,
    }),
  });
  const data = await res.json();
  const root = data.data.selection[0];
  const mainCard = root.children[2]; // 747:1599
  const row3 = mainCard.children[2]; // 747:1679
  const row4 = mainCard.children[3]; // 747:1740

  console.log("=== ROW 3 (Middle Row) ===");
  console.log("Row 3:", row3.name, row3.width, "x", row3.height, "itemSpacing:", row3.itemSpacing, "children:", row3.childrenCount);
  row3.children?.forEach((c, i) => {
    console.log(`  Card ${i + 1}: ${c.name} (${c.id}) ${c.width}x${c.height}, fills:`, JSON.stringify(c.fills), "strokes:", JSON.stringify(c.strokes), "effects:", JSON.stringify(c.effects), "corners:", c.cornerRadius);
  });

  console.log("\n=== ROW 4 (Bottom Row) ===");
  console.log("Row 4:", row4.name, row4.width, "x", row4.height, "itemSpacing:", row4.itemSpacing, "children:", row4.childrenCount);
  row4.children?.forEach((c, i) => {
    console.log(`  Card ${i + 1}: ${c.name} (${c.id}) ${c.width}x${c.height}, fills:`, JSON.stringify(c.fills), "strokes:", JSON.stringify(c.strokes), "effects:", JSON.stringify(c.effects), "corners:", c.cornerRadius);
  });
}

main().catch(console.error);
