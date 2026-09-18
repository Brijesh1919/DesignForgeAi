async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: {},
      timeoutMs: 10000,
    }),
  });
  const data = await res.json();
  const selection = data.data?.selection || data.selection;
  const root = selection?.find((n) => n.width === 1440) || selection?.[0];
  if (!root) {
    console.log("No selection found");
    return;
  }

  console.log(`ROOT: ${root.name} (${root.id}) - ${root.width}x${root.height}, AL: ${root.layoutMode}`);
  console.log(`Total Direct Sections: ${root.children?.length || 0}\n`);

  root.children?.forEach((sec, i) => {
    console.log(`--- Section ${i + 1}: ${sec.name} (${sec.id}) ---`);
    console.log(`  Dimensions: ${sec.width}x${sec.height} | Layout: ${sec.layoutMode} | Sizing: [H:${sec.layoutSizingHorizontal}, V:${sec.layoutSizingVertical}]`);
    console.log(`  Children Count: ${sec.childrenCount}`);
    if (sec.children) {
      sec.children.forEach((c, ci) => {
        const textInfo = c.text ? ` | Text: "${c.text.slice(0, 45)}..."` : "";
        console.log(`    [${ci + 1}] ${c.name} (${c.type}, ${c.width}x${c.height}, AL: ${c.layoutMode}${textInfo}) [children: ${c.childrenCount || 0}]`);
      });
    }
  });
}

main().catch(console.error);
