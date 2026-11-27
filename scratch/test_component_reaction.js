async function testInteractiveComponent() {
  const comp1 = figma.createComponent();
  comp1.name = 'State=Default';
  comp1.resize(100, 100);
  comp1.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.8 } }];

  const comp2 = figma.createComponent();
  comp2.name = 'State=Hover';
  comp2.resize(100, 100);
  comp2.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.2, b: 0.2 } }];

  const compSet = figma.combineAsVariants([comp1, comp2], figma.currentPage);
  compSet.name = 'Test Card 3D';
  compSet.x = 2068;
  compSet.y = -200;

  await comp1.setReactionsAsync([
    {
      trigger: { type: 'ON_HOVER' },
      actions: [
        {
          type: 'NODE',
          destinationId: comp2.id,
          navigation: 'CHANGE_TO',
          transition: {
            type: 'SMART_ANIMATE',
            duration: 0.35,
            easing: { type: 'EASE_OUT' }
          }
        }
      ]
    }
  ]);

  const res = {
    compSetId: compSet.id,
    reactions: comp1.reactions.map(r => ({ trigger: r.trigger.type, action: r.actions[0].type, dest: r.actions[0].destinationId }))
  };

  compSet.remove();

  return res;
}
return await testInteractiveComponent();
