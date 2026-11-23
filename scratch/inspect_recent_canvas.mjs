async function run() {
  const code = `
    const lastFrames = figma.currentPage.children.slice(-6).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      w: Math.round(c.width),
      h: Math.round(c.height),
      x: Math.round(c.x),
      y: Math.round(c.y)
    }));
    return { lastFrames };
  `;
  const res = await fetch('http://localhost:3001/api/bridge/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'EVAL_SCRIPT', payload: { code } })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run().catch(console.error);
