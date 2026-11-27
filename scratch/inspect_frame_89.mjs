async function run() {
  const code = `
    const node = await figma.getNodeByIdAsync('1082:2255');
    if (!node) return { error: 'Node not found' };
    return {
      id: node.id,
      name: node.name,
      x: node.x,
      y: node.y,
      w: node.width,
      h: node.height,
      childrenCount: node.children ? node.children.length : 0,
      children: node.children ? node.children.map(c => ({ id: c.id, name: c.name, type: c.type })) : []
    };
  `;
  try {
    const res = await fetch('http://localhost:3001/api/bridge/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'EVAL_SCRIPT', payload: { code } })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
run();
