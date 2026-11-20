import fs from "fs";

async function main() {
  const code = `
    const node = await figma.getNodeByIdAsync("17:8701");
    if (!node) return { error: "Node 17:8701 not found" };

    function serializeNode(n, depth = 0) {
      if (depth > 12) return { id: n.id, name: n.name, type: n.type };
      const obj = {
        id: n.id,
        name: n.name,
        type: n.type,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
      };

      if (n.layoutMode) obj.layoutMode = n.layoutMode;
      if (n.primaryAxisAlignItems) obj.primaryAxisAlignItems = n.primaryAxisAlignItems;
      if (n.counterAxisAlignItems) obj.counterAxisAlignItems = n.counterAxisAlignItems;
      if (n.itemSpacing !== undefined) obj.itemSpacing = n.itemSpacing;
      if (n.paddingTop !== undefined) {
        obj.padding = {
          top: n.paddingTop,
          right: n.paddingRight,
          bottom: n.paddingBottom,
          left: n.paddingLeft,
        };
      }

      if (n.type === "TEXT") {
        obj.characters = n.characters;
        obj.fontSize = typeof n.fontSize === "number" ? n.fontSize : 14;
        if (n.fontName && typeof n.fontName === "object" && typeof n.fontName !== "symbol") {
          obj.fontName = {
            family: n.fontName.family,
            style: n.fontName.style,
          };
        }
      }

      if (n.fills && Array.isArray(n.fills)) {
        obj.fills = n.fills.map(f => {
          if (f.type === "IMAGE") {
            return {
              type: "IMAGE",
              imageHash: f.imageHash,
              scaleMode: f.scaleMode,
            };
          }
          if (f.type === "SOLID") {
            return {
              type: "SOLID",
              color: f.color ? { r: f.color.r, g: f.color.g, b: f.color.b } : undefined,
              opacity: f.opacity !== undefined ? f.opacity : 1,
            };
          }
          return { type: f.type };
        });
      }

      if ("children" in n && n.children) {
        obj.children = n.children.map(c => serializeNode(c, depth + 1));
      }

      return obj;
    }

    const tree = serializeNode(node);
    return JSON.parse(JSON.stringify(tree, (k, v) => (typeof v === "symbol" ? v.toString() : v)));
  `;

  console.log("Inspecting node 17:8701...");
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 30000,
    }),
  });

  const data = await res.json();
  console.log("Response:", JSON.stringify(data).slice(0, 300));
  const tree = data.data?.data || data.data || data;
  fs.writeFileSync("scratch/inspect_b2b.json", JSON.stringify(tree, null, 2));
  console.log("Saved tree to scratch/inspect_b2b.json. Root info:", {
    name: tree?.name,
    x: tree?.x,
    y: tree?.y,
    width: tree?.width,
    height: tree?.height,
    childrenCount: tree?.children?.length,
  });
}

main().catch(console.error);
