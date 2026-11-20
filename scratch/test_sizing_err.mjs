async function main() {
  const code = `
    try {
      const parent = figma.createFrame();
      parent.layoutMode = "VERTICAL";
      const child = figma.createFrame();
      parent.appendChild(child);
      child.layoutSizingHorizontal = "FILL";
      return { success: true, w: child.width };
    } catch (e) {
      return { success: false, error: e.message };
    }
  `;
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });
  const data = await res.json();
  console.log("Test:", JSON.stringify(data.data?.data, null, 2));
}
main().catch(console.error);
