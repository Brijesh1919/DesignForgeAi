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

    // Test 1: duration 30s
    try {
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
      testResults.duration30 = "OK";
    } catch (e) {
      testResults.duration30 = e.message;
    }

    // Test 2: duration 10s, timeout 0.001
    try {
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
                duration: 10,
                easing: { type: "LINEAR" },
              },
            },
          ],
        },
      ]);
      testResults.duration10_timeout0001 = "OK";
    } catch (e) {
      testResults.duration10_timeout0001 = e.message;
    }

    // Test 3: duration 8s, timeout 0.05
    try {
      await c1.setReactionsAsync([
        {
          trigger: { type: "AFTER_TIMEOUT", timeout: 0.05 },
          actions: [
            {
              type: "NODE",
              destinationId: c2.id,
              navigation: "CHANGE_TO",
              transition: {
                type: "SMART_ANIMATE",
                duration: 8,
                easing: { type: "LINEAR" },
              },
            },
          ],
        },
      ]);
      testResults.duration8_timeout005 = "OK";
    } catch (e) {
      testResults.duration8_timeout005 = e.message;
    }

    // Clean up test component set
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
  console.log("Test reactions result:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
