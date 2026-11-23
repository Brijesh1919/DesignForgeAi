async function run() {
  const code = `
    const pluginContainer = (await figma.getNodeByIdAsync('1051:16225')).findOne(c => c.name === 'Container');
    return pluginContainer.children.map(c => ({
      name: c.name,
      type: c.type,
      w: Math.round(c.width),
      h: Math.round(c.height),
      layout: c.layoutMode,
      children: c.children ? c.children.map(ch => ({ name: ch.name, type: ch.type, w: Math.round(ch.width), h: Math.round(ch.height), layout: ch.layoutMode, x: Math.round(ch.x), y: Math.round(ch.y) })) : []
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
