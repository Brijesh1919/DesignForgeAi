async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 8, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const target = data.data?.selection?.[0];
  const directChildren = target.children;
  const announcementBar = directChildren.find(c => (c.name || "").toLowerCase().includes("announc") || (c.height <= 45 && c.y < 50));
  const headerBar = directChildren.find(c => c.name.includes("Header"));
  const contentSections = directChildren.filter(c => c !== announcementBar && c !== headerBar);
  const heroSection = contentSections[0];

  function findNode(n, pred) {
    if (pred(n)) return n;
    if (n.children) {
      for (const c of n.children) {
        const f = findNode(c, pred);
        if (f) return f;
      }
    }
    return null;
  }

  contentSections.forEach((c, idx) => {
    const hasQuote = findNode(c, n => n.type === "TEXT" && (n.text || "").toLowerCase().includes("quote"));
    console.log(`contentSections[${idx}] (ID: ${c.id}, Name: ${c.name}): hasQuote = ${Boolean(hasQuote)} (${hasQuote?.text?.slice(0, 30)})`);
  });
}

main().catch(console.error);
