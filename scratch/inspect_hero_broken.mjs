async function run() {
  const code = `
    const heroSec = (await figma.getNodeByIdAsync('1051:16225')).findOne(c => c.name.includes('SECTION 1'));
    return {
      name: heroSec.name,
      layout: heroSec.layoutMode,
      w: heroSec.width,
      h: heroSec.height,
      children: heroSec.children.map(c => ({
        name: c.name,
        type: c.type,
        w: c.width,
        h: c.height,
        x: c.x,
        y: c.y,
        layout: c.layoutMode,
        children: c.children ? c.children.map(ch => ({ name: ch.name, type: ch.type, x: ch.x, y: ch.y, w: ch.width, h: ch.height, chars: ch.characters || undefined })) : []
      }))
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
