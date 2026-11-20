async function main() {
  const code = `
    const root = await figma.getNodeByIdAsync('17:7556');
    const strip = root.children[0];
    const header = root.children[1];
    
    strip.layoutSizingHorizontal = "FILL";
    header.layoutSizingHorizontal = "FILL";
    
    return {
      strip: {
        w: strip.width,
        layoutSizingHorizontal: strip.layoutSizingHorizontal,
      },
      header: {
        w: header.width,
        layoutSizingHorizontal: header.layoutSizingHorizontal,
      }
    };
  `;
  const res = await fetch('http://localhost:3001/api/bridge/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'EVAL_SCRIPT', payload: { code } })
  });
  const data = await res.json();
  console.log("Result:", JSON.stringify(data.data?.data, null, 2));
}
main().catch(console.error);
