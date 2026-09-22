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
  const root = selection?.[0];
  console.log("Root fills:", root?.fills);
  const bgMesh = root?.children?.[0];
  console.log("bgMesh children count:", bgMesh?.children?.length);
  bgMesh?.children?.forEach((orb, i) => {
    console.log(`Orb ${i + 1}: ${orb.name} (${orb.id}) x=${orb.x}, y=${orb.y}, ${orb.width}x${orb.height}, fills:`, JSON.stringify(orb.fills));
  });
  const nav = root?.children?.[1];
  console.log("Nav fills:", JSON.stringify(nav?.fills), "effects:", JSON.stringify(nav?.effects));
  const mainCard = root?.children?.[2];
  console.log("Main card fills:", JSON.stringify(mainCard?.fills), "effects:", JSON.stringify(mainCard?.effects));
}

main().catch(console.error);
