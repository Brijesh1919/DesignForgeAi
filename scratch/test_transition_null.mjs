async function main() {
  const code = `
    const c1 = figma.createComponent();
    c1.name = "Test=1";
    c1.resize(100, 100);
    const c2 = figma.createComponent();
    c2.name = "Test=2";
    c2.resize(100, 100);
    figma.currentPage.appendChild(c1);
    figma.currentPage.appendChild(c2);

    const cset = figma.combineAsVariants([c1, c2], figma.currentPage);

    let testResults = {};

    try {
      await c2.setReactionsAsync([
        {
          trigger: { type: "AFTER_TIMEOUT", timeout: 0.001 },
          actions: [
            {
              type: "NODE",
              destinationId: c1.id,
              navigation: "CHANGE_TO",
              transition: null,
            },
          ],
        },
      ]);
      testResults.transitionNull = "OK";
    } catch (e) {
      testResults.transitionNull = e.message;
    }

    cset.remove();
    return testResults;
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
  console.log("Test transition: null result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
