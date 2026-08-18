/**
 * DesignForge AI — Photo to HTML/CSS Conversion Pipeline Tests
 *
 * Tests multi-strategy parsing, validation, normalization, dimensions handling,
 * and layout fidelity across diverse UI archetypes (dashboards, cards, mobile, landing pages, tables, forms).
 */

import { parseHtmlCssFromText, checkOutputIntegrity } from "../analyzer.js";
import { validateAndNormalizeHtmlCss } from "../../validation/html-validator.js";
import { buildHtmlUserPrompt, buildOllamaHtmlUserPrompt } from "../prompts.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("=================================================");
  console.log("  Running Photo -> HTML/CSS Pipeline Test Suite  ");
  console.log("=================================================\n");

  // ─── Test 1: Parser with standard JSON ───────────────────────
  console.log("[Test 1] parseHtmlCssFromText: Standard JSON payload");
  const jsonInput = JSON.stringify({
    html: '<div class="design-root"><header class="navbar"><h1>Logo</h1></header></div>',
    css: '.design-root { width: 1440px; height: 900px; } .navbar { display: flex; }',
  });
  const parsed1 = parseHtmlCssFromText(jsonInput, 1440, 900);
  assert(parsed1.html.includes("design-root"), "HTML must contain design-root");
  assert(parsed1.css.includes(".navbar"), "CSS must contain .navbar");
  console.log("  ✓ Standard JSON parsed successfully\n");

  // ─── Test 2: Parser with Markdown JSON fence ─────────────────
  console.log("[Test 2] parseHtmlCssFromText: Markdown ```json code fence");
  const fencedJsonInput = `\`\`\`json\n${JSON.stringify({
    html: '<div class="design-root"><div class="sidebar"></div><main class="content"></main></div>',
    css: '.design-root { display: flex; width: 1280px; height: 800px; }',
  })}\n\`\`\``;
  const parsed2 = parseHtmlCssFromText(fencedJsonInput, 1280, 800);
  assert(parsed2.html.includes("sidebar"), "HTML must contain sidebar");
  assert(parsed2.css.includes("display: flex"), "CSS must contain display: flex");
  console.log("  ✓ Fenced JSON parsed successfully\n");

  // ─── Test 3: Parser with separate ```html and ```css blocks ───
  console.log("[Test 3] parseHtmlCssFromText: Separate ```html and ```css code blocks");
  const separateBlocks = `Here is the reconstructed UI:
\`\`\`html
<div class="design-root">
  <div class="card-grid">
    <div class="card"><h3>Analytics</h3><span class="badge">+24%</span></div>
    <div class="card"><h3>Revenue</h3><span class="badge">$45.2k</span></div>
  </div>
</div>
\`\`\`

\`\`\`css
.design-root { width: 1024px; height: 768px; }
.card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.card { padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; }
.badge { display: inline-flex; border-radius: 9999px; padding: 2px 8px; font-size: 12px; }
\`\`\``;
  const parsed3 = parseHtmlCssFromText(separateBlocks, 1024, 768);
  assert(parsed3.html.includes("card-grid"), "HTML must contain card-grid");
  assert(parsed3.css.includes("grid-template-columns"), "CSS must contain grid-template-columns");
  assert(parsed3.css.includes(".badge"), "CSS must contain .badge");
  console.log("  ✓ Separate code blocks parsed successfully\n");

  // ─── Test 4: Parser with unified HTML and inline <style> ─────
  console.log("[Test 4] parseHtmlCssFromText: Unified HTML with <style> block");
  const unifiedHtml = `<div class="design-root">
  <style>
    * { box-sizing: border-box; }
    .design-root { width: 390px; height: 844px; display: flex; flex-direction: column; }
    .status-bar { height: 44px; display: flex; justify-content: space-between; }
    .tab-bar { height: 60px; display: flex; justify-content: space-around; }
  </style>
  <div class="status-bar"><span>9:41</span></div>
  <div class="content"><div class="feed-item">Post</div></div>
  <nav class="tab-bar"><button>Home</button><button>Profile</button></nav>
</div>`;
  const parsed4 = parseHtmlCssFromText(unifiedHtml, 390, 844);
  assert(parsed4.html.includes("status-bar"), "HTML must contain status-bar");
  assert(!parsed4.html.includes("<style>"), "HTML should have style block extracted");
  assert(parsed4.css.includes(".tab-bar"), "CSS must contain .tab-bar");
  console.log("  ✓ Unified HTML with inline style parsed successfully\n");

  // ─── Test 5: Validator Auto-Repair for missing design-root ────
  console.log("[Test 5] validateAndNormalizeHtmlCss: Auto-wraps missing .design-root");
  const unwrappedHtml = `<div class="dashboard"><div class="metrics">Metric 1</div></div>`;
  const unwrappedCss = `.dashboard { padding: 24px; }`;
  const normalized5 = validateAndNormalizeHtmlCss(unwrappedHtml, unwrappedCss, 1440, 900);
  assert(normalized5.html.includes("design-root"), "Validator must auto-wrap with design-root");
  assert(normalized5.css.includes(".design-root"), "Validator must inject .design-root in CSS");
  assert(normalized5.css.includes("width: 1440px"), "Validator must inject expected width");
  assert(normalized5.css.includes("min-height: 900px"), "Validator must inject expected height");
  assert(normalized5.errors.length === 0, `Validator should have 0 errors, got: ${normalized5.errors.join(", ")}`);
  console.log("  ✓ Auto-wrapped missing design-root container and injected geometry\n");

  // ─── Test 6: Validator Viewport Scaling with Mobile Screen ───
  console.log("[Test 6] validateAndNormalizeHtmlCss: Correctly scales vw/vh units for mobile (390x844)");
  const mobileHtml = `<div class="design-root"><div class="full-hero">Hero</div></div>`;
  const mobileCss = `.design-root { width: 390px; min-height: 844px; } .full-hero { width: 100vw; height: 50vh; }`;
  const normalized6 = validateAndNormalizeHtmlCss(mobileHtml, mobileCss, 390, 844);
  assert(normalized6.css.includes("390px"), "100vw must scale to 390px");
  assert(normalized6.css.includes("422px"), "50vh must scale to 422px");
  console.log("  ✓ Scaled viewport units correctly to mobile dimensions\n");

  // ─── Test 7: Graceful Sanitization of External Stylesheets & Links
  console.log("[Test 7] validateAndNormalizeHtmlCss: Gracefully sanitizes @import Google fonts without crashing");
  const importedHtml = `<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter"><div class="design-root"><h1>Hello</h1></div>`;
  const importedCss = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');\n.design-root { width: 800px; height: 600px; } h1 { font-family: Inter; }`;
  const normalized7 = validateAndNormalizeHtmlCss(importedHtml, importedCss, 800, 600);
  assert(!normalized7.css.includes("@import"), "Must strip @import");
  assert(!normalized7.html.includes("<link"), "Must strip external <link>");
  assert(normalized7.errors.length === 0, "Must not throw fatal validation errors on @import");
  console.log("  ✓ Gracefully sanitized @import and external links without fatal errors\n");

  // ─── Test 8: Complex UI Archetypes Validation ────────────────
  console.log("[Test 8] Complex SaaS Dashboard Structure Validation");
  const dashboardHtml = `<div class="design-root">
  <aside class="sidebar">
    <div class="logo">Acme SaaS</div>
    <nav class="nav-menu">
      <a href="#" class="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24"></svg> Dashboard</a>
      <a href="#" class="nav-item"><svg width="16" height="16" viewBox="0 0 24 24"></svg> Customers</a>
    </nav>
    <div class="user-profile"><div class="avatar">JD</div> John Doe</div>
  </aside>
  <main class="main-content">
    <header class="topbar">
      <input type="search" placeholder="Search..." class="search-input" />
      <button class="btn btn-primary"><svg width="16" height="16"></svg> New Project</button>
    </header>
    <section class="kpi-grid">
      <div class="kpi-card"><span class="kpi-title">Total Revenue</span><h2 class="kpi-value">$128,430</h2><span class="badge badge-success">+12.5%</span></div>
      <div class="kpi-card"><span class="kpi-title">Active Users</span><h2 class="kpi-value">8,924</h2><span class="badge badge-success">+4.2%</span></div>
    </section>
    <section class="table-card">
      <table>
        <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead>
        <tbody><tr><td>#INV-001</td><td>Acme Corp</td><td><span class="chip">Paid</span></td><td>$1,200</td></tr></tbody>
      </table>
    </section>
  </main>
</div>`;

  const dashboardCss = `* { box-sizing: border-box; }
.design-root { display: flex; flex-direction: row; width: 1440px; min-height: 900px; background: #F9FAFB; font-family: Inter, sans-serif; }
.sidebar { width: 240px; background: #FFFFFF; border-right: 1px solid #E5E7EB; padding: 24px 16px; display: flex; flex-direction: column; }
.nav-menu { display: flex; flex-direction: column; gap: 8px; margin-top: 24px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; color: #4B5563; font-weight: 500; text-decoration: none; }
.nav-item.active { background: #EEF2FF; color: #4F46E5; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: #6366F1; color: white; display: flex; align-items: center; justify-content: center; }
.main-content { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 24px; }
.topbar { display: flex; justify-content: space-between; align-items: center; }
.search-input { width: 320px; height: 40px; padding: 8px 16px; border-radius: 8px; border: 1px solid #D1D5DB; }
.btn { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-primary { background: #4F46E5; color: #FFFFFF; border: none; }
.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.kpi-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
.badge-success { background: #DCFCE7; color: #15803D; }
.table-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #F3F4F6; }`;

  const normalized8 = validateAndNormalizeHtmlCss(dashboardHtml, dashboardCss, 1440, 900);
  assert(normalized8.errors.length === 0, "Dashboard validation must pass with zero errors");
  assert(normalized8.html.includes("sidebar"), "Dashboard must contain sidebar");
  assert(normalized8.html.includes("kpi-grid"), "Dashboard must contain kpi-grid");
  assert(normalized8.css.includes(".kpi-grid"), "Dashboard CSS must contain .kpi-grid");
  console.log("  ✓ Complex SaaS Dashboard validated with 0 errors\n");

  // ─── Test 9: Prompt Dimension Interpolation ──────────────────
  console.log("[Test 9] Prompt Dimension Interpolation");
  const userPrompt = buildHtmlUserPrompt(1920, 1080);
  assert(userPrompt.includes("1920x1080"), "User prompt must contain 1920x1080");
  assert(userPrompt.includes("width: 1920px"), "User prompt must mention 1920px width");

  // ─── Test 10: 249x716 Vertical Image Layout & Dimension Handling ──
  console.log("[Test 10] 249x716 Vertical UI Structure Normalization");
  const verticalHtml = `<div class="design-root">
  <div class="header">
    <div class="user-badge"><span class="name">Profile</span></div>
  </div>
  <div class="menu-list">
    <button class="menu-item"><svg width="16" height="16"></svg> Settings</button>
    <button class="menu-item"><svg width="16" height="16"></svg> Notifications</button>
    <button class="menu-item"><svg width="16" height="16"></svg> Logout</button>
  </div>
</div>`;
  const verticalCss = `* { box-sizing: border-box; }
.design-root { width: 249px; min-height: 716px; display: flex; flex-direction: column; background: #1E1E2E; color: #CDD6F4; }
.header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.menu-list { display: flex; flex-direction: column; gap: 8px; padding: 16px 12px; }
.menu-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 6px; background: transparent; color: #BAC2DE; border: none; font-size: 13px; cursor: pointer; }`;

  const normalized10 = validateAndNormalizeHtmlCss(verticalHtml, verticalCss, 249, 716);
  assert(normalized10.errors.length === 0, "249x716 vertical UI must validate with zero errors");
  assert(normalized10.css.includes("249px"), "CSS must contain 249px width");
  assert(normalized10.css.includes("716px"), "CSS must contain 716px height");
  console.log("  ✓ 249x716 vertical UI normalized and validated successfully\n");

  // ─── Test 11: Ollama Prompt Negative Constraints ─────────────
  console.log("[Test 11] Ollama Prompt Constraints: No fences, no explanations, direct design-root");
  const ollamaUserP = buildOllamaHtmlUserPrompt(249, 716);
  assert(ollamaUserP.includes("249x716"), "Prompt must have exact 249x716 dimensions");
  assert(ollamaUserP.includes("design-root"), "Prompt must instruct design-root");
  assert(ollamaUserP.includes("Zero explanation"), "Prompt must instruct zero explanations");
  console.log("  ✓ Ollama prompt strict constraints verified\n");

  // ─── Test 12: Output Integrity & Anti-Repetition Detection ────
  console.log("[Test 12] Output Integrity: Truncation & Recursive Selector Detection");
  const corruptCss = `.sidebar.active .sidebar-content .sidebar-content { color: red; }`;
  const integrity1 = checkOutputIntegrity("some raw text", "<div></div>", corruptCss, 500, 2048);
  assert(integrity1.isCorrupt, "Must flag recursive selector .sidebar-content .sidebar-content as corrupt");

  const hitTokenLimit = checkOutputIntegrity("some text", "<div></div>", ".sidebar { width: 100px; }", 2048, 2048);
  assert(hitTokenLimit.isCorrupt, "Must flag outputTokens >= numPredict as corrupt");

  const validIntegrity = checkOutputIntegrity("some text", "<div class=\"design-root\">Hello</div>", ".sidebar { width: 249px; }", 400, 2048);
  assert(!validIntegrity.isCorrupt, "Clean output must pass integrity check");
  console.log("  ✓ Output integrity & anti-repetition detection verified\n");

  console.log("=================================================");
  console.log("  🎉 All 12 Pipeline Tests Passed Successfully!  ");
  console.log("=================================================\n");
}

try {
  runTests();
  process.exit(0);
} catch (err: any) {
  console.error("❌ Test failed:", err);
  process.exit(1);
}
