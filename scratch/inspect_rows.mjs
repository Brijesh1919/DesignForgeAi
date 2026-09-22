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
  const mainCard = root?.children?.[2]; // 747:1196
  console.log("Main card children count:", mainCard?.children?.length);
  mainCard?.children?.forEach((row, i) => {
    console.log(`Row ${i + 1}: ${row.name} (${row.id}) ${row.width}x${row.height}, AL: ${row.layoutMode}`);
    row.children?.forEach((col, j) => {
      console.log(`  Col ${j + 1}: ${col.name} (${col.id}) ${col.width}x${col.height}, AL: ${col.layoutMode}, corners: ${col.cornerRadius}, effects: ${JSON.stringify(col.effects)}`);
    });
  });
}

main().catch(console.error);
