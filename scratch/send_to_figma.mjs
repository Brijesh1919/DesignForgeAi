import fs from "fs";
import path from "path";

async function main() {
  const htmlPath = path.join("scratch", "portfolio_final.html");
  const html = fs.readFileSync(htmlPath, "utf-8");

  console.log(`Sending HTML (${html.length} bytes) to Figma bridge...`);

  const response = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EXECUTE_HTML_CSS",
      payload: { html, css: "", autoLayout: true },
      timeoutMs: 120000,
    }),
  });

  const result = await response.json();
  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
