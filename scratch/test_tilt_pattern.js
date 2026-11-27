async function testTiltPattern() {
  const comp1 = figma.createComponent();
  comp1.name = 'State=Default';
  comp1.resize(420, 310);
  comp1.clipsContent = false;
  comp1.fills = [];

  const body1 = figma.createFrame();
  body1.name = 'CardBody';
  body1.resize(400, 290);
  body1.x = 10;
  body1.y = 10;
  body1.cornerRadius = 20;
  body1.fills = [{ type: 'SOLID', color: { r: 0.08, g: 0.1, b: 0.16 } }];
  body1.strokes = [{ type: 'SOLID', color: { r: 0.2, g: 0.25, b: 0.35 } }];
  body1.strokeWeight = 1;
  comp1.appendChild(body1);

  const comp2 = figma.createComponent();
  comp2.name = 'State=Hover';
  comp2.resize(420, 310);
  comp2.clipsContent = false;
  comp2.fills = [];

  const body2 = figma.createFrame();
  body2.name = 'CardBody';
  body2.resize(400, 290);
  body2.x = 12;
  body2.y = 6;
  body2.rotation = -5;
  body2.cornerRadius = 20;
  body2.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.12, b: 0.2 } }];
  body2.strokes = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.95 } }];
  body2.strokeWeight = 1.5;
  comp2.appendChild(body2);

  const compSet = figma.combineAsVariants([comp1, comp2], figma.currentPage);
  compSet.name = 'Test Tilt Card';
  compSet.x = 2068;
  compSet.y = -350;

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

  compSet.remove();
  return { success: true };
}
return await testTiltPattern();
