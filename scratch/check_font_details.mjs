async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 8 },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const selection = data.data?.selection || [];
  selection.forEach(s => {
    function scan(n) {
      if (n.text && n.letterSpacing < 0) {
        console.log(`Text: "${n.text.slice(0, 30)}" LS: ${n.letterSpacing} Font: ${n.fontSize}px Align: ${n.textAlignHorizontal}`);
      }
      if (n.children) n.children.forEach(scan);
    }
    scan(s);
  });
}
main().catch(console.error);
