async function testAfterTimeout() {
  const f1 = figma.createFrame();
  f1.name = 'Test Frame 1';
  f1.resize(100, 100);
  
  const f2 = figma.createFrame();
  f2.name = 'Test Frame 2';
  f2.resize(100, 100);

  try {
    await f1.setReactionsAsync([
      {
        trigger: { type: 'AFTER_TIMEOUT', timeout: 2 },
        actions: [
          {
            type: 'NODE',
            destinationId: f2.id,
            navigation: 'NAVIGATE',
            transition: {
              type: 'SMART_ANIMATE',
              duration: 0.8,
              easing: { type: 'EASE_IN_AND_OUT' }
            }
          }
        ]
      }
    ]);
    const r = f1.reactions;
    f1.remove();
    f2.remove();
    return { success: true, reactions: r };
  } catch (e) {
    f1.remove();
    f2.remove();
    return { success: false, error: e.message || String(e) };
  }
}
return await testAfterTimeout();
