async function main() {
  const code = `
    const root = await figma.getNodeByIdAsync("1051:14145");
    if (!root) return { error: "not found" };

    function fixSizing(node) {
      if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
        // If parent has auto layout, configure fill / hug
        if (node.parent && (node.parent.layoutMode === "HORIZONTAL" || node.parent.layoutMode === "VERTICAL")) {
          // If parent is VERTICAL:
          if (node.parent.layoutMode === "VERTICAL") {
            // Default to FILL horizontally unless it's a small badge
            const isBadge = node.name.includes("Badge") || node.name.includes("Pill") || node.name.includes("Button") || node.name === "Divider";
            if (!isBadge) {
              try { node.layoutSizingHorizontal = "FILL"; } catch (e) {}
            }
            try { node.layoutSizingVertical = "HUG"; } catch (e) {}
          }
          // If parent is HORIZONTAL:
          if (node.parent.layoutMode === "HORIZONTAL") {
            try { node.layoutSizingVertical = "HUG"; } catch (e) {}
          }
        }
      }

      if (node.children) {
        for (const c of node.children) {
          fixSizing(c);
        }
      }
    }

    fixSizing(root);

    return {
      name: root.name,
      w: root.width,
      h: root.height,
      children: root.children.map(c => ({
        name: c.name,
        w: c.width,
        h: c.height,
        sizingH: c.layoutSizingHorizontal,
        sizingV: c.layoutSizingVertical,
      }))
    };
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });

  const data = await res.json();
  console.log("Fix Sizing Result:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
