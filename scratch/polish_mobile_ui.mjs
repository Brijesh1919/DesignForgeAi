async function main() {
  const code = `
    const root = await figma.getNodeByIdAsync("1051:14145");
    if (!root) return { error: "not found" };

    // 1. Hero CTAs: make both buttons FILL half the row
    const heroSec = root.children.find(c => c.name.includes("Hero & Discovery"));
    const heroCtas = heroSec.children.find(c => c.name === "Action CTAs");
    if (heroCtas) {
      heroCtas.itemSpacing = 12;
      for (const btn of heroCtas.children) {
        btn.layoutSizingHorizontal = "FILL";
        btn.paddingTop = 12;
        btn.paddingBottom = 12;
        btn.cornerRadius = 10;
        btn.primaryAxisAlignItems = "CENTER";
        btn.counterAxisAlignItems = "CENTER";
      }
    }

    // 2. Assistance Banner buttons
    const assistSec = root.children.find(c => c.name.includes("Assistance Banner"));
    const assistCard = assistSec.children.find(c => c.name === "Assistance Card");
    const assistActions = assistCard.children.find(c => c.name === "Actions");
    if (assistActions) {
      assistActions.layoutSizingHorizontal = "FILL";
      assistActions.itemSpacing = 12;
      for (const btn of assistActions.children) {
        btn.layoutSizingHorizontal = "FILL";
        btn.paddingTop = 12;
        btn.paddingBottom = 12;
        btn.cornerRadius = 10;
        btn.primaryAxisAlignItems = "CENTER";
        btn.counterAxisAlignItems = "CENTER";
      }
    }

    // 3. Distributor Portal buttons
    const portalSec = root.children.find(c => c.name.includes("Distributor Portal"));
    const portalCard = portalSec.children.find(c => c.name === "Distributor Card");
    const portalBtns = portalCard.children.find(c => c.name === "Portal Buttons");
    if (portalBtns) {
      portalBtns.layoutSizingHorizontal = "FILL";
      portalBtns.itemSpacing = 12;
      for (const btn of portalBtns.children) {
        btn.layoutSizingHorizontal = "FILL";
        btn.paddingTop = 12;
        btn.paddingBottom = 12;
        btn.cornerRadius = 10;
        btn.primaryAxisAlignItems = "CENTER";
        btn.counterAxisAlignItems = "CENTER";
      }
    }

    // 4. Section 6 Stats: ensure nice circular badges
    const resSec = root.children.find(c => c.name.includes("Resources & Trust"));
    const statNames = ["Rated #1 in California", "ASI 5-Star supplier", "Quantity-based pricing"];
    for (const sName of statNames) {
      const sCard = resSec.children.find(c => c.name === sName);
      if (sCard) {
        sCard.paddingTop = 12;
        sCard.paddingBottom = 12;
        sCard.paddingLeft = 14;
        sCard.paddingRight = 14;
        const badge = sCard.children.find(c => c.name === "Badge");
        if (badge) {
          badge.resize(36, 36);
          badge.cornerRadius = 18;
          badge.primaryAxisAlignItems = "CENTER";
          badge.counterAxisAlignItems = "CENTER";
        }
      }
    }

    // Select and zoom into the polished frame
    figma.currentPage.selection = [root];
    figma.viewport.scrollAndZoomIntoView([root]);

    return {
      success: true,
      w: root.width,
      h: root.height,
    };
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });

  const data = await res.json();
  console.log("Polish Result:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
