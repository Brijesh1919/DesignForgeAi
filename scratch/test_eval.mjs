async function main() {
  const code = `
    const desktopNode = await figma.getNodeByIdAsync("18:131");
    if (!desktopNode) return { error: "Desktop node not found" };
    return {
      name: desktopNode.name,
      sections: desktopNode.children.map(c => ({ id: c.id, name: c.name, type: c.type, w: c.width, h: c.height }))
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
  console.log("Raw response keys:", Object.keys(data));
  console.log("data:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
