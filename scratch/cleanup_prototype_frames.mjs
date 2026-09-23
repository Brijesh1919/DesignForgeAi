/**
 * Remove temporary prototype frames so only Anmt-frame remains
 */
async function main() {
  const code = `
    const toRemove = [];
    for (const child of figma.currentPage.children) {
      if (
        child.type === "FRAME" &&
        (
          child.name.includes("01 — Opening") ||
          child.name.includes("02 — Fall") ||
          child.name.includes("03 — Impact") ||
          child.name.includes("04 — Rebound") ||
          child.name.includes("05 — Impact") ||
          child.name.includes("06 — Rebound") ||
          child.name.includes("07 — Impact") ||
          child.name.includes("08 — Rest") ||
          child.name.includes("09 — Return")
        )
      ) {
        toRemove.push(child);
      }
    }
    const count = toRemove.length;
    for (const node of toRemove) {
      node.remove();
    }
    // Clear flow starting points
    figma.currentPage.flowStartingPoints = [];
    
    // Select Anmt-frame
    const anmt = figma.currentPage.findOne(n => n.name === "Anmt-frame");
    if (anmt) {
      figma.currentPage.selection = [anmt];
      figma.viewport.scrollAndZoomIntoView([anmt]);
    }
    return { removedCount: count, selectedFrame: anmt?.name };
  `;

  // We can execute this via a quick bridge command
}
