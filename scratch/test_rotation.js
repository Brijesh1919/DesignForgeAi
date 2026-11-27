async function testRotation() {
  const comp = figma.createComponent();
  comp.resize(200, 200);
  comp.rotation = -6; // degrees
  const angle = comp.rotation;
  comp.remove();
  return { rotation: angle };
}
return await testRotation();
