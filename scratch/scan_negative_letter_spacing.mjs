async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 8 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const frames = data.data?.availableFrames || [];
  console.log("All frames:", frames.map(f => f.name));

  const selection = data.data?.selection || [];
  selection.forEach(s => {
    console.log("\nSelection:", s.name, s.id);
    let negCount = 0;
    let headingCount = 0;
    function scan(n) {
      if (n.text) {
        if (typeof n.letterSpacing === "number" && n.letterSpacing < 0) {
          console.log(`  [NEGATIVE LS ${n.letterSpacing}] "${n.text.slice(0, 40)}" (font: ${n.fontSize}px) in "${n.name}"`);
          negCount++;
        }
        if (n.fontSize >= 18) {
          headingCount++;
        }
      }
      if (n.children) n.children.forEach(scan);
    }
    scan(s);
    console.log(`Total negative letter spacing found: ${negCount}, Headings: ${headingCount}`);
  });
}

main().catch(console.error);
