async function run() {
  const code = `
    const sel = figma.currentPage.selection;
    const all = figma.currentPage.children.slice(-10);
    return {
      selection: sel.map(s => ({ id: s.id, name: s.name, w: Math.round(s.width), h: Math.round(s.height), layout: s.layoutMode })),
      recentFrames: all.map(s => ({ id: s.id, name: s.name, w: Math.round(s.width), h: Math.round(s.height), layout: s.layoutMode }))
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
