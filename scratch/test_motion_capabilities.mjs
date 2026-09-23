/**
 * Check figma.motion, plugin data, shared plugin data, and node properties
 */
async function main() {
  const code = `
    const sel = figma.currentPage.selection[0];
    const info = {
      hasMotionAPI: typeof (figma as any).motion !== "undefined",
      motionKeys: typeof (figma as any).motion !== "undefined" ? Object.keys((figma as any).motion) : [],
      nodeProps: sel ? Object.keys(sel).filter(k => k.toLowerCase().includes("motion") || k.toLowerCase().includes("anim") || k.toLowerCase().includes("track")) : [],
      pluginDataKeys: sel ? sel.getPluginDataKeys() : [],
      sharedPluginDataKeys: sel ? sel.getSharedPluginDataKeys("motion") : [],
      allSharedNamespaces: sel ? (typeof (sel as any).getSharedPluginDataKeys === "function" ? ["motion", "figma", "figmotion"].map(ns => ({ ns, keys: (sel as any).getSharedPluginDataKeys(ns) })) : []) : [],
    };
    return info;
  `;

  // We can send this to the plugin or check via bridge
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "INSPECT_MOTION_CAPABILITIES",
      payload: { code },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
