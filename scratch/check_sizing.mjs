async function main() {
  const code = `
    const root = await figma.getNodeByIdAsync('17:7556');
    const strip = root.children[0];
    const header = root.children[1];
    return {
      strip: {
        name: strip.name,
        w: strip.width,
        primaryAxisSizingMode: strip.primaryAxisSizingMode,
        counterAxisSizingMode: strip.counterAxisSizingMode,
        layoutSizingHorizontal: strip.layoutSizingHorizontal,
        layoutSizingVertical: strip.layoutSizingVertical,
      },
      header: {
        name: header.name,
        w: header.width,
        primaryAxisSizingMode: header.primaryAxisSizingMode,
        counterAxisSizingMode: header.counterAxisSizingMode,
        layoutSizingHorizontal: header.layoutSizingHorizontal,
        layoutSizingVertical: header.layoutSizingVertical,
      }
    };
  `;
  const res = await fetch('http://localhost:3001/api/bridge/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'EVAL_SCRIPT', payload: { code } })
  });
  const data = await res.json();
  console.log("Full data:", JSON.stringify(data, null, 2));
}
main().catch(console.error);
