async function main() {
  const code = `
    const frames = figma.currentPage.children.map(c => ({ id: c.id, name: c.name, x: c.x, y: c.y, width: c.width, height: c.height }));
    return frames;
  `;
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });
  const data = await res.json();
  console.log("Frames on page:", JSON.stringify(data.data?.data, null, 2));
}
main().catch(console.error);
