async function main() {
  const code = `
    const frame = await figma.getNodeByIdAsync("11:2009");
    if (!frame) return { error: "Frame 11:2009 not found" };

    const sectionReport = [];
    for (const sec of frame.children) {
      const imgs = [];
      function findImgs(n) {
        if (n.fills && Array.isArray(n.fills)) {
          for (const f of n.fills) {
            if (f.type === "IMAGE") {
              imgs.push({ name: n.name, w: n.width, h: n.height, hash: f.imageHash?.slice(0, 8) });
            }
          }
        }
        if (n.children) {
          for (const c of n.children) findImgs(c);
        }
      }
      findImgs(sec);
      sectionReport.push({
        section: sec.name,
        imagesCount: imgs.length,
        imgs: imgs
      });
    }

    return sectionReport;
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
  console.log("Section Report:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
