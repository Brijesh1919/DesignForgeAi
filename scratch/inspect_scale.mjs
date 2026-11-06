async function main() {
  const code = `
    const sel = await figma.getNodeByIdAsync("99:1033");
    const typoSection = sel.children.find(c => c.name.includes("Typography") || c.name.includes("04"));
    const scaleFrame = typoSection.children.find(c => c.name === "Scale");

    const stylesInfo = [];

    for (const item of scaleFrame.children) {
      const metaFrame = item.children?.find(c => c.name === "Meta");
      const nameText = metaFrame?.children?.[0]?.characters;
      const specText = metaFrame?.children?.[1]?.characters;
      const sampleNode = item.children?.find(c => c.type === "TEXT" && c.name !== "Meta");

      stylesInfo.push({
        layerName: item.name,
        styleName: nameText,
        specString: specText,
        sampleText: sampleNode ? sampleNode.characters : null,
        fontName: sampleNode ? sampleNode.fontName : null,
        fontSize: sampleNode ? sampleNode.fontSize : null,
        lineHeight: sampleNode ? sampleNode.lineHeight : null,
        letterSpacing: sampleNode ? sampleNode.letterSpacing : null,
        textCase: sampleNode ? sampleNode.textCase : null,
        fills: sampleNode ? sampleNode.fills : null
      });
    }

    return { stylesInfo };
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
  const fs = await import("fs");
  fs.writeFileSync("scratch/scale_styles.json", JSON.stringify(data.data?.data, null, 2));
  console.log("Scale styles extracted:", data.data?.data?.stylesInfo?.length);
}

main().catch(console.error);

