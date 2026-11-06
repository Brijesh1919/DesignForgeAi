async function main() {
  const code = `
    const sel = await figma.getNodeByIdAsync("99:1033");
    if (!sel) return { error: "Node 99:1033 not found" };

    const typoSection = sel.children.find(c => c.name.includes("Typography") || c.name.includes("04"));
    
    function dumpNode(node, depth = 0) {
      if (depth > 4) return { name: node.name, type: node.type };
      const obj = {
        name: node.name,
        type: node.type,
        w: Math.round(node.width),
        h: Math.round(node.height)
      };
      if (node.type === "TEXT") {
        obj.text = node.characters.slice(0, 50);
        obj.fontSize = node.fontSize;
        obj.fontName = node.fontName;
        obj.lineHeight = node.lineHeight;
        obj.letterSpacing = node.letterSpacing;
      }
      if (node.children) {
        obj.children = node.children.map(c => dumpNode(c, depth + 1));
      }
      return obj;
    }

    // Also check what local text styles exist in the document currently
    const localTextStyles = (await figma.getLocalTextStylesAsync()).map(ts => ({
      id: ts.id,
      name: ts.name,
      fontSize: ts.fontSize,
      fontName: ts.fontName,
      lineHeight: ts.lineHeight,
      letterSpacing: ts.letterSpacing
    }));

    return {
      typoSection: typoSection ? dumpNode(typoSection) : null,
      localTextStyles
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
  const fs = await import("fs");
  fs.writeFileSync("scratch/typo_inspection.json", JSON.stringify(data.data?.data, null, 2));
  console.log("Local text styles count:", data.data?.data?.localTextStyles?.length);
  console.log("Typo section inspected!");
}

main().catch(console.error);

