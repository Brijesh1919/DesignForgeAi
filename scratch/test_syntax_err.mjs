async function main() {
  const code = `
    let step = "start";
    try {
      step = "delete existing";
      const existing = figma.currentPage.children.find(c => c.name.includes("Modern E-Commerce Redesign"));
      if (existing) existing.remove();

      step = "test b1BtnBtn";
      let b1Btn = figma.createFrame();
      b1Btn.appendChild(b1BtnBtn = b1Btn);
      b1Btn.remove();
      return { success: true };
    } catch (e) {
      return { success: false, step, error: e.message, stack: e.stack };
    }
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  console.log("Error test:", data.data?.data);
}

main().catch(console.error);
