async function main() {
  const code = `
    const instance = await figma.getNodeByIdAsync("305:4855");
    const componentSet = await figma.getNodeByIdAsync("305:4852");
    const flows = figma.currentPage.flowStartingPoints;

    const report = {
      instance: instance ? {
        id: instance.id,
        name: instance.name,
        width: instance.width,
        height: instance.height,
        x: instance.x,
        y: instance.y,
        visible: instance.visible,
        parent: instance.parent ? { name: instance.parent.name, id: instance.parent.id } : null,
      } : null,
      componentSet: componentSet ? {
        id: componentSet.id,
        name: componentSet.name,
        variantsCount: componentSet.children.length,
        variants: componentSet.children.map(v => {
          const track = v.children?.find(c => c.name === "Slides Track");
          return {
            id: v.id,
            name: v.name,
            width: v.width,
            height: v.height,
            clipsContent: v.clipsContent,
            track: track ? {
              name: track.name,
              x: track.x,
              y: track.y,
              width: track.width,
              height: track.height,
              cardsCount: track.children?.length,
              firstCardName: track.children?.[0]?.name,
            } : null,
            reactions: (v.reactions || []).map(r => ({
              trigger: r.trigger?.type,
              timeout: r.trigger?.timeout,
              action: r.actions?.[0]?.type,
              navigation: r.actions?.[0]?.navigation,
              destinationName: componentSet.children.find(c => c.id === r.actions?.[0]?.destinationId)?.name,
              transition: r.actions?.[0]?.transition,
            })),
          };
        }),
      } : null,
      prototypeFlows: flows.map(f => ({ name: f.name, nodeId: f.nodeId })),
      currentSelection: figma.currentPage.selection.map(s => ({ id: s.id, name: s.name })),
    };

    return report;
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
  console.log("=== COMPREHENSIVE VERIFICATION REPORT ===");
  console.log(JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
