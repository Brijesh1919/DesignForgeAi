async function main() {
  const code = `
    const frame = await figma.getNodeByIdAsync("21:9296");
    if (!frame) return { error: "not found" };
    return {
      id: frame.id,
      name: frame.name,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      children: frame.children.map(c => ({ id: c.id, name: c.name, width: c.width, height: c.height }))
    };
  `;
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });
  const data = await res.json();
  console.log("Root children:", JSON.stringify(data.data?.data, null, 2));
}
main().catch(console.error);
