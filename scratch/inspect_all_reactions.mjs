async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 6, nodeId: "767:3265" },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  const frame = data.data?.selection?.[0];

  function inspectReactions(node, path = "") {
    const currentPath = path ? `${path} > ${node.name}` : node.name;
    if (node.reactions && node.reactions.length > 0) {
      console.log(`\nReaction at [${node.id}] "${currentPath}":`);
      node.reactions.forEach((r, i) => {
        console.log(`  #${i + 1} Trigger: ${r.trigger?.type}`);
        const act = r.action || (r.actions && r.actions[0]);
        console.log(`     Action: type=${act?.type}, nav=${act?.navigation}, dest=${act?.destinationId}, transition=${act?.transition?.type}`);
      });
    }
    if (node.children) {
      node.children.forEach(c => inspectReactions(c, currentPath));
    }
  }

  inspectReactions(frame);
}

main().catch(console.error);
