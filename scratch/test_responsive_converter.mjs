async function run() {
  const code = `
    const sourceNode = await figma.getNodeByIdAsync('1049:1111');
    if (!sourceNode) throw new Error("Source frame 1049:1111 not found");
    
    // Test our convertToResponsiveFrame logic on sourceNode
    figma.currentPage.selection = [sourceNode];
    return {
      sourceId: sourceNode.id,
      sourceName: sourceNode.name,
      sourceWidth: sourceNode.width,
      sourceHeight: sourceNode.height
    };
  `;
  const res = await fetch('http://localhost:3001/api/bridge/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'EVAL_SCRIPT', payload: { code } })
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data, null, 2));
}
run().catch(console.error);
