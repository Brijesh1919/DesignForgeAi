async function run() {
  const code = `
    const sourceMain = (await figma.getNodeByIdAsync('1049:1111')).children.find(c => c.name === 'Main');
    const pluginMain = (await figma.getNodeByIdAsync('1051:16225')).children.find(c => c.name === 'Main');
    return {
      sourceSections: sourceMain.children.map(c => ({ name: c.name, type: c.type, w: Math.round(c.width), h: Math.round(c.height), layout: c.layoutMode, childrenCount: c.children ? c.children.length : 0 })),
      pluginSections: pluginMain.children.map(c => ({ name: c.name, type: c.type, w: Math.round(c.width), h: Math.round(c.height), layout: c.layoutMode, childrenCount: c.children ? c.children.length : 0 }))
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
