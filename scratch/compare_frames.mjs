async function run() {
  const code = `
    const source = await figma.getNodeByIdAsync('1049:1111');
    const goodMobile = await figma.getNodeByIdAsync('1051:14145');
    const pluginMobile = await figma.getNodeByIdAsync('1051:16225');
    return {
      source: { name: source.name, w: source.width, h: source.height, children: source.children.map(c => ({ name: c.name, type: c.type, w: Math.round(c.width), h: Math.round(c.height), layout: c.layoutMode })) },
      goodMobile: { name: goodMobile.name, w: goodMobile.width, h: goodMobile.height, children: goodMobile.children.map(c => ({ name: c.name, type: c.type, w: Math.round(c.width), h: Math.round(c.height), layout: c.layoutMode })) },
      pluginMobile: { name: pluginMobile.name, w: pluginMobile.width, h: pluginMobile.height, children: pluginMobile.children.map(c => ({ name: c.name, type: c.type, w: Math.round(c.width), h: Math.round(c.height), layout: c.layoutMode })) }
    };
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
