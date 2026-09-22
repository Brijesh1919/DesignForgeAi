async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 2, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const target = data.data?.selection?.[0];
  const directChildren = target.children;
  const announcementBar = directChildren.find(c => (c.name || "").toLowerCase().includes("announc") || (c.height <= 45 && c.y < 50));
  const headerBar = directChildren.find(c => c.name.includes("Header"));
  const contentSections = directChildren.filter(c => c !== announcementBar && c !== headerBar);

  console.log("directChildren:", directChildren.length);
  console.log("announcementBar:", announcementBar?.id, announcementBar?.name);
  console.log("headerBar:", headerBar?.id, headerBar?.name);
  console.log("contentSections count:", contentSections.length);
  contentSections.forEach((c, i) => {
    console.log(`  [${i}] ID: ${c.id}, Name: "${c.name}", Height: ${c.height}`);
  });
}

main().catch(console.error);
