async function main() {
  const code = `
    const sel = await figma.getNodeByIdAsync("17:7216");
    if (!sel) return { error: "Node 17:7216 not found" };

    const colors = new Set();
    const fonts = new Set();

    function walk(n) {
      if (n.type === "TEXT") {
        if (n.fontName && typeof n.fontName === "object") {
          fonts.add(n.fontName.family + " " + n.fontName.style);
        }
      }
      if (n.fills && Array.isArray(n.fills)) {
        for (const f of n.fills) {
          if (f.type === "SOLID") {
            const r = Math.round(f.color.r * 255);
            const g = Math.round(f.color.g * 255);
            const b = Math.round(f.color.b * 255);
            colors.add(\`rgb(\${r},\${g},\${b})\`);
          }
        }
      }
      if (n.children) {
        for (const c of n.children) walk(c);
      }
    }

    walk(sel);
    return {
      colors: Array.from(colors),
      fonts: Array.from(fonts)
    };
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  console.log("Colors & Fonts in v2:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
