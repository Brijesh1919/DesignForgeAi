async function run() {
  const code = `
    const h1 = (await figma.getNodeByIdAsync('1051:16225')).findOne(c => c.name === 'Heading 1:margin');
    return {
      h1: { name: h1.name, w: h1.width, h: h1.height, layout: h1.layoutMode },
      children: h1.children.map(c => ({ name: c.name, type: c.type, w: c.width, h: c.height, layout: c.layoutMode, chars: c.characters || undefined, textAutoResize: c.textAutoResize, fontSize: c.fontSize }))
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
