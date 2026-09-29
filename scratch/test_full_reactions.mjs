async function main() {
  const code = `
    const c1 = figma.createComponent();
    c1.name = "State=Start";
    c1.resize(200, 100);
    const c2 = figma.createComponent();
    c2.name = "State=Loop";
    c2.resize(200, 100);
    figma.currentPage.appendChild(c1);
    figma.currentPage.appendChild(c2);

    const cset = figma.combineAsVariants([c1, c2], figma.currentPage);

    // 1. Start -> Loop with SMART_ANIMATE LINEAR (duration: 30s)
    await c1.setReactionsAsync([
      {
        trigger: { type: "AFTER_TIMEOUT", timeout: 0.001 },
        actions: [
          {
            type: "NODE",
            destinationId: c2.id,
            navigation: "CHANGE_TO",
            transition: {
              type: "SMART_ANIMATE",
              duration: 30,
              easing: { type: "LINEAR" },
            },
          },
        ],
      },
    ]);

    // 2. Loop -> Start with INSTANT (transition: null)
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

    const inst = c1.createInstance();
    figma.currentPage.appendChild(inst);
    inst.x = 0;
    inst.y = 0;

    const r1 = c1.reactions;
    const r2 = c2.reactions;

    // Clean up
    inst.remove();
    cset.remove();

    return {
      c1ReactionsCount: r1.length,
      c2ReactionsCount: r2.length,
      c1Trigger: r1[0]?.trigger?.type,
      c1Transition: r1[0]?.actions?.[0]?.transition?.type,
      c2Trigger: r2[0]?.trigger?.type,
      c2Transition: r2[0]?.actions?.[0]?.transition,
    };
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
  console.log("End-to-end prototype reaction test result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
