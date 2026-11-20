import fs from "fs";

async function main() {
  const code = `
    const sel = figma.currentPage.selection[0];
    const frame = figma.currentPage.children.find(c => c.name.includes("Modern E-Commerce Redesign"));
    return {
      sel: sel ? { id: sel.id, name: sel.name } : null,
      frame: frame ? {
        id: frame.id,
        name: frame.name,
        w: frame.width,
        h: frame.height,
        childrenCount: frame.children.length
      } : null
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
  console.log("Check response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
