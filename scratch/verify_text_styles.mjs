async function main() {
  const code = `
    const styles = await figma.getLocalTextStylesAsync();
    const tsFrame = figma.currentPage.children.find(c => c.name === "Text Styles — Design System");
    return {
      stylesCount: styles.length,
      styles: styles.map(s => ({ name: s.name, id: s.id, fontSize: s.fontSize })),
      tsFrame: tsFrame ? {
        id: tsFrame.id,
        name: tsFrame.name,
        x: tsFrame.x,
        y: tsFrame.y,
        w: tsFrame.width,
        h: tsFrame.height,
        childrenCount: tsFrame.children.length
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
  console.log("Status:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);

