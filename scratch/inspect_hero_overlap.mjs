async function run() {
  const code = `
    const heroSec = (await figma.getNodeByIdAsync('1051:16225')).findOne(c => c.name.includes('SECTION 1'));
    const allDescendants = [];
    function walk(n) {
      if (n.type === 'FRAME' || n.type === 'RECTANGLE' || n.type === 'TEXT') {
        allDescendants.push({
          name: n.name,
          type: n.type,
          w: Math.round(n.width),
          h: Math.round(n.height),
          x: Math.round(n.absoluteTransform[0][2]),
          y: Math.round(n.absoluteTransform[1][2]),
          fills: n.fills ? n.fills.map(f => f.type + (f.color ? ' #' + Math.round(f.color.r*255).toString(16) + Math.round(f.color.g*255).toString(16) + Math.round(f.color.b*255).toString(16) : '')) : []
        });
      }
      if (n.children) {
        for (const ch of n.children) walk(ch);
      }
    }
    walk(heroSec);
    return allDescendants.filter(d => d.y < heroSec.absoluteTransform[1][2] + 300);
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
