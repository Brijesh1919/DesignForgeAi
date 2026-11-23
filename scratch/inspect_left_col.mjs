async function run() {
  const code = `
    const leftCol = (await figma.getNodeByIdAsync('1051:16225')).findOne(c => c.name === 'Left Content Column');
    return leftCol.children.map(c => ({
      name: c.name,
      type: c.type,
      w: c.width,
      h: c.height,
      x: c.x,
      y: c.y,
      layout: c.layoutMode,
      chars: c.characters || undefined,
      fontSize: c.fontSize || undefined
    }));
  `;
  const res = await fetch('http://localhost:3001/api/bridge/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'EVAL_SCRIPT', payload: { code } })
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data.data, null, 2));
}
run().catch(console.error);
