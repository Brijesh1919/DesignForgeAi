async function main() {
  console.log("Testing EVAL_SCRIPT...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: {
        code: `
          const sel = figma.currentPage.selection;
          return {
            selectedCount: sel.length,
            name: sel[0]?.name,
            id: sel[0]?.id
          };
        `,
      },
      timeoutMs: 10000,
    }),
  });

  const data = await res.json();
  console.log("Eval result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
