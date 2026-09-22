import fs from "fs";

async function main() {
  const html = fs.readFileSync("scratch/hire_plus_dashboard.html", "utf-8");
  console.log(`Read HTML file: ${html.length} chars`);

  console.log("Sending EXECUTE_HTML_CSS to DesignForge bridge on http://localhost:3001...");
  const startTime = Date.now();
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EXECUTE_HTML_CSS",
      payload: {
        html,
        autoLayout: true,
      },
      timeoutMs: 90000,
    }),
  });

  const result = await res.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Bridge response in ${elapsed}s:`, JSON.stringify(result, null, 2));
}

main().catch(console.error);
