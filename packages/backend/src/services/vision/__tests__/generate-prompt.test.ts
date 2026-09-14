/**
 * Automated Unit Tests for Generate with AI (Text-to-HTML/CSS) pipeline.
 */

import assert from "assert";
import { buildGenerateDesignUserPrompt, buildGenerateDesignRepairPrompt, GENERATE_DESIGN_SYSTEM_PROMPT } from "../generate-prompt.js";
import { parseHtmlCssFromText, parseDesignResponse } from "../analyzer.js";
import { validateAndNormalizeHtmlCss, validateCssCoverage, parseCssWithAst } from "../../validation/html-validator.js";

function testPromptBuilding() {
  console.log("  - Running: prompt building test...");
  const prompt = "Create a modern landing page for a SaaS app";
  const userPrompt = buildGenerateDesignUserPrompt(prompt);
  assert.ok(userPrompt.includes(prompt), "User prompt should contain the input request");
  assert.ok(GENERATE_DESIGN_SYSTEM_PROMPT.includes("design-root"), "System prompt should require design-root");
  console.log("  ✓ Prompt building passed");
}

function testParsingJsonFormat() {
  console.log("  - Running: parsing JSON format response...");
  const rawResponse = JSON.stringify({
    html: '<div class="hero"><h1>Welcome</h1><button>Get Started</button></div>',
    css: '.hero { padding: 40px; } h1 { color: #111827; }',
  });

  const parsed = parseHtmlCssFromText(rawResponse, 1200, 900);
  assert.ok(parsed.html.includes("Welcome"), "Parsed HTML should contain Welcome");
  assert.ok(parsed.css.includes(".hero"), "Parsed CSS should contain .hero");

  const normalized = validateAndNormalizeHtmlCss(parsed.html, parsed.css, 1200, 900);
  assert.strictEqual(normalized.errors.length, 0, "Normalization should have no errors");
  assert.ok(normalized.html.includes("design-root"), "Normalized HTML should have design-root wrapper");
  assert.ok(normalized.css.includes(".design-root"), "Normalized CSS should have design-root dimensions");
  console.log("  ✓ JSON parsing and normalization passed");
}

function testParsingMarkdownCodeFences() {
  console.log("  - Running: parsing markdown code fences response...");
  const rawResponse = `
Here is the generated design:

\`\`\`html
<div class="design-root">
  <header class="navbar">
    <div class="logo">AppLogo</div>
    <nav><a href="#features">Features</a></nav>
  </header>
  <main class="hero">
    <h1>Supercharge your workflow</h1>
    <p>The ultimate AI platform for teams.</p>
  </main>
</div>
\`\`\`

\`\`\`css
* { box-sizing: border-box; }
.navbar { display: flex; justify-content: space-between; padding: 16px 32px; }
.hero { text-align: center; padding: 80px 20px; }
\`\`\`
`;

  const parsed = parseHtmlCssFromText(rawResponse, 1200, 900);
  assert.ok(parsed.html.includes("Supercharge your workflow"), "Parsed HTML should contain headline");
  assert.ok(parsed.css.includes(".navbar"), "Parsed CSS should contain navbar styles");

  const normalized = validateAndNormalizeHtmlCss(parsed.html, parsed.css, 1200, 900);
  assert.strictEqual(normalized.errors.length, 0, "Normalization should have no errors");
  assert.ok(normalized.html.includes("navbar"), "Normalized HTML should preserve navbar");
  console.log("  ✓ Markdown fences parsing and normalization passed");
}

function testCase1Object() {
  console.log("  - Running: Case 1 - Direct object with html/css...");
  const obj = {
    html: '<div class="card"><h1>Object Title</h1></div>',
    css: ".card { padding: 16px; }",
  };
  const parsed = parseDesignResponse(obj as any, 1200, 900);
  assert.strictEqual(parsed.html, '<div class="card"><h1>Object Title</h1></div>');
  assert.strictEqual(parsed.css, ".card { padding: 16px; }");
  console.log("  ✓ Case 1 passed");
}

function testCase2EscapedJsonString() {
  console.log("  - Running: Case 2 - Escaped JSON string...");
  const jsonStr = '{"html":"<div>Hello World</div>","css":".x { color: red; }"}';
  const parsed = parseDesignResponse(jsonStr, 1200, 900);
  assert.strictEqual(parsed.html, "<div>Hello World</div>");
  assert.strictEqual(parsed.css, ".x { color: red; }");
  console.log("  ✓ Case 2 passed");
}

function testCase3FencedJson() {
  console.log("  - Running: Case 3 - Markdown fenced JSON...");
  const fenced = "```json\n{\n  \"html\": \"<div>Fenced JSON Content</div>\",\n  \"css\": \".fenced { color: blue; }\"\n}\n```";
  const parsed = parseDesignResponse(fenced, 1200, 900);
  assert.strictEqual(parsed.html, "<div>Fenced JSON Content</div>");
  assert.strictEqual(parsed.css, ".fenced { color: blue; }");
  console.log("  ✓ Case 3 passed");
}

function testCase4FencedHtml() {
  console.log("  - Running: Case 4 - Markdown fenced HTML only...");
  const fencedHtml = "```html\n<div>Direct HTML</div>\n```";
  const parsed = parseDesignResponse(fencedHtml, 1200, 900);
  assert.strictEqual(parsed.html, "<div>Direct HTML</div>");
  console.log("  ✓ Case 4 passed");
}

function testCase5CleanHtml() {
  console.log("  - Running: Case 5 - Clean HTML directly...");
  const html = "<div>Clean Direct HTML</div>";
  const parsed = parseDesignResponse(html, 1200, 900);
  assert.strictEqual(parsed.html, "<div>Clean Direct HTML</div>");
  console.log("  ✓ Case 5 passed");
}

function testCase6SvgIntegrity() {
  console.log("  - Running: Case 6 - SVG attributes and tags preservation...");
  const rawWithEscapedQuotes = '{"html":"<div class=\\"root\\"><svg viewBox=\\"0 0 24 24\\" width=\\"24\\" height=\\"24\\"><path d=\\"M12 2L2 7l10 5\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"/></svg></div>","css":""}';
  const parsed = parseDesignResponse(rawWithEscapedQuotes, 1200, 900);
  assert.ok(!parsed.html.includes('\\"'), "HTML should not contain escaped quotes");
  assert.ok(parsed.html.includes('viewBox="0 0 24 24"'), 'viewBox should be clean: viewBox="0 0 24 24"');
  assert.ok(parsed.html.includes('d="M12 2L2 7l10 5"'), 'path d should be clean: d="M12 2L2 7l10 5"');
  assert.ok(parsed.html.includes('stroke-width="2"'), 'stroke-width should be clean: stroke-width="2"');
  assert.ok(parsed.html.includes('stroke-linecap="round"'), 'stroke-linecap should be clean: stroke-linecap="round"');
  console.log("  ✓ Case 6 passed");
}

function testCase7ResumeAiExample() {
  console.log("  - Running: Case 7 - ResumeAI full generation payload with SVGs...");
  const resumeAiPayload = `{\n  "html": "<div class=\\"design-root\\">\\n  <header class=\\"navbar\\">\\n    <svg viewBox=\\"0 0 24 24\\" width=\\"24\\" height=\\"24\\">\\n      <path d=\\"M12 2L2 7l10 5 10-5-10-5z\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"/>\\n    </svg>\\n    <span class=\\"brand\\">ResumeAI</span>\\n  </header>\\n  <section class=\\"hero\\">\\n    <h1>AI Resume Builder</h1>\\n    <p>Build job-winning resumes in seconds.</p>\\n    <button class=\\"btn btn-primary\\">Get Started</button>\\n  </section>\\n</div>",\n  "css": ".design-root { padding: 24px; }\\n.navbar { display: flex; align-items: center; gap: 8px; }" \n}`;

  const parsed = parseDesignResponse(resumeAiPayload, 1200, 900);

  // 1. Verify JSON wrapper is not in the HTML content
  assert.ok(!parsed.html.includes('{\n  "html"'), "HTML must not contain JSON wrapper start");
  assert.ok(!parsed.html.includes('"css":'), "HTML must not contain JSON css field");

  // 2. Verify SVG attributes are clean
  assert.ok(parsed.html.includes('viewBox="0 0 24 24"'), 'viewBox should be "0 0 24 24"');
  assert.ok(parsed.html.includes('stroke-width="2"'), 'stroke-width should be "2"');
  assert.ok(parsed.html.includes('stroke-linecap="round"'), 'stroke-linecap should be "round"');
  assert.ok(parsed.html.includes('d="M12 2L2 7l10 5 10-5-10-5z"'), 'path d should be clean');

  // 3. Verify HTML structure
  assert.ok(parsed.html.includes('<header class="navbar">'), "HTML must contain navbar header");
  assert.ok(parsed.html.includes('<h1>AI Resume Builder</h1>'), "HTML must contain h1");

  // 4. Validate through normalization pipeline
  const normalized = validateAndNormalizeHtmlCss(parsed.html, parsed.css, 1200, 900);
  assert.strictEqual(normalized.errors.length, 0, "Validation should pass with 0 errors");
  assert.ok(normalized.html.startsWith('<div class="design-root">'), "Should start with design-root");
  assert.ok(!normalized.html.includes('\\"'), "Normalized HTML should have zero escaped quotes");

  console.log("  ✓ Case 7 passed (ResumeAI payload parsed cleanly with zero JSON residue)");
}

function testCase8ImagePreservationAndFallback() {
  console.log("  - Running: Case 8 - Image URL preservation & empty src fallback...");
  const htmlWithImages = `<div class="design-root">
    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" alt="Avatar" />
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Data URI" />
    <img src="" alt="Empty Src" />
    <img alt="Missing Src" />
  </div>`;
  const css = ".design-root { padding: 20px; }";

  const normalized = validateAndNormalizeHtmlCss(htmlWithImages, css, 1200, 900);

  // 1. Verify Unsplash URL is preserved
  assert.ok(
    normalized.html.includes("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"),
    "Valid HTTPS image URL must be preserved intact"
  );
  assert.ok(!normalized.html.includes('data-external-src="sanitized"'), "Must not add data-external-src=sanitized");

  // 2. Verify Data URI is preserved
  assert.ok(normalized.html.includes("data:image/png;base64,"), "Valid data URI must be preserved");

  // 3. Verify empty src and missing src are replaced with safe fallback data URI
  assert.ok(!normalized.html.includes('src=""'), "Must not have empty src");
  assert.ok(normalized.html.includes("data:image/svg+xml"), "Empty/missing src must have fallback placeholder");

  console.log("  ✓ Case 8 passed (Image URLs preserved and empty src given fallback)");
}

function testTask14AstTests() {
  console.log("  - Running: TASK 14 Tests 1 to 7 (CSS AST Parser & Usability Validation)...");

  // Test 1: .navbar { display: flex; } -> Expected: navbar
  const stats1 = parseCssWithAst(".navbar { display: flex; }");
  assert.deepStrictEqual(stats1.classSelectors, ["navbar"], "Test 1: should extract 'navbar'");
  console.log("  ✓ Task 14 Test 1 passed (.navbar extracted)");

  // Test 2: .navbar .nav-link:hover { color: red; } -> Expected: navbar, nav-link
  const stats2 = parseCssWithAst(".navbar .nav-link:hover { color: red; }");
  assert.ok(stats2.classSelectors.includes("navbar"), "Test 2: should include navbar");
  assert.ok(stats2.classSelectors.includes("nav-link"), "Test 2: should include nav-link");
  console.log("  ✓ Task 14 Test 2 passed (.navbar .nav-link:hover extracted)");

  // Test 3: h1, h2, h3 { font-weight: 700; } -> Expected: No fake classes (0 class selectors).
  const stats3 = parseCssWithAst("h1, h2, h3 { font-weight: 700; } line-height: 1.6; color: #333;");
  assert.strictEqual(stats3.classSelectors.length, 0, "Test 3: should have 0 class selectors");
  assert.deepStrictEqual(stats3.elementSelectors, ["h1", "h2", "h3"], "Test 3: should extract h1, h2, h3");
  console.log("  ✓ Task 14 Test 3 passed (No fake classes from decimals 1.6 or element tags)");

  // Test 4: .feature-card, .pricing-card { padding: 20px; } -> Expected: feature-card, pricing-card
  const stats4 = parseCssWithAst(".feature-card,\n.pricing-card {\n  padding: 20px;\n}");
  assert.ok(stats4.classSelectors.includes("feature-card"), "Test 4: should include feature-card");
  assert.ok(stats4.classSelectors.includes("pricing-card"), "Test 4: should include pricing-card");
  console.log("  ✓ Task 14 Test 4 passed (Grouped selectors extracted)");

  // Test 5: @media (max-width: 768px) { .navbar { flex-direction: column; } } -> Expected: navbar
  const stats5 = parseCssWithAst("@media (max-width: 768px) {\n  .navbar {\n    flex-direction: column;\n  }\n}");
  assert.ok(stats5.classSelectors.includes("navbar"), "Test 5: should extract navbar inside media query");
  console.log("  ✓ Task 14 Test 5 passed (Media query selector extracted)");

  // Test 6: * { box-sizing: border-box; } -> Expected: Valid CSS, 0 classes. Must NOT cause validation failure.
  const coverage6 = validateCssCoverage("<div>Clean HTML</div>", "* { box-sizing: border-box; }");
  assert.strictEqual(coverage6.isUsable, true, "Test 6: global reset must be usable");
  console.log("  ✓ Task 14 Test 6 passed (* { box-sizing: border-box; } is valid & usable)");

  // Test 7: HTML: <div class="card"><h2 class="title">Hello</h2></div>, CSS: .card h2 { font-size: 24px; }
  // Validation must NOT fail because .title has no direct selector.
  const coverage7 = validateCssCoverage(
    '<div class="card"><h2 class="title">Hello</h2></div>',
    ".card h2 { font-size: 24px; color: #111827; }"
  );
  assert.strictEqual(coverage7.isUsable, true, "Test 7: must pass when children are styled via descendant selectors");
  console.log("  ✓ Task 14 Test 7 passed (Descendant styling does not fail validation)");
}

function testIntelligentCssRepairFlow() {
  console.log("  - Running: Intelligent CSS Repair Merging & Coverage Score Test...");
  const html = `<div class="design-root">
    <header class="site-header"><div class="logo">Logo</div><nav class="main-nav"></nav></header>
    <section class="hero-section"><h1 class="hero-title">Title</h1><div class="hero-actions"><button class="btn btn-primary">Start</button></div></section>
    <section class="features-section"><div class="feature-card"><h3 class="feature-title">Fast</h3></div></section>
    <section class="pricing-section"><div class="pricing-card"><span class="price">$19</span></div></section>
    <footer class="site-footer"><div class="footer-links"></div></footer>
  </div>`;

  // Initial truncated CSS (only covers header and logo)
  const initialTruncatedCss = `
  * { box-sizing: border-box; }
  .design-root { width: 1200px; min-height: 900px; }
  .site-header { display: flex; padding: 20px; }
  .logo { font-size: 24px; font-weight: bold; }
  `;

  const initialCoverage = validateCssCoverage(html, initialTruncatedCss);
  assert.strictEqual(initialCoverage.isValid, false, "Initial truncated CSS should fail validation");
  assert.ok(initialCoverage.missingClasses.length > 5, "Should identify missing classes");

  const repairPrompt = buildGenerateDesignRepairPrompt(html, initialTruncatedCss, initialCoverage.missingClasses);
  assert.ok(repairPrompt.includes("Missing or unstyled HTML classes"), "Repair prompt should list missing classes");

  // Simulated repair CSS covering the missing sections
  const repairCss = `
  .main-nav { display: flex; gap: 16px; }
  .hero-section { padding: 60px 20px; text-align: center; }
  .hero-title { font-size: 40px; }
  .hero-actions { display: flex; justify-content: center; }
  .btn { padding: 10px 20px; border-radius: 8px; }
  .btn-primary { background: #4f46e5; color: #fff; }
  .features-section { padding: 40px 20px; }
  .feature-card { background: #fff; padding: 20px; }
  .feature-title { font-size: 20px; }
  .pricing-section { padding: 40px 20px; }
  .pricing-card { border: 1px solid #e2e8f0; padding: 24px; }
  .price { font-size: 32px; font-weight: bold; }
  .site-footer { padding: 30px; background: #0f172a; }
  .footer-links { display: flex; gap: 12px; }
  `;

  // Merge repaired CSS
  const mergedCss = initialTruncatedCss + "\n\n/* Repaired Section Styles */\n" + repairCss;
  const repairedCoverage = validateCssCoverage(html, mergedCss);

  assert.strictEqual(repairedCoverage.isValid, true, "Merged repaired CSS should pass validation");
  assert.strictEqual(repairedCoverage.coveragePercent, 100, "Coverage should now be 100%");
  console.log("  ✓ Intelligent CSS Repair merging & validation test passed (Coverage reached 100%)");
}

function testExplicitRequiredTest1ValidHtmlCss() {
  console.log("  - Running: REQUIRED TEST 1 - AI returns valid HTML + CSS -> both preserved...");
  const raw = JSON.stringify({
    html: '<div class="design-root"><header class="navbar"><div class="logo">App</div></header></div>',
    css: '.design-root { width: 1200px; } .navbar { display: flex; padding: 20px; } .logo { font-weight: 700; }',
  });
  const parsed = parseDesignResponse(raw, 1200, 900);
  assert.ok(parsed.html.includes("navbar"), "HTML must contain navbar");
  assert.ok(parsed.css.includes(".navbar"), "CSS must contain .navbar");
  assert.ok(parsed.css.includes(".logo"), "CSS must contain .logo");
  console.log("  ✓ TEST 1 passed");
}

function testExplicitRequiredTest2FullCssCoverage() {
  console.log("  - Running: REQUIRED TEST 2 - AI returns HTML with 10 classes & CSS has all 10 -> PASS...");
  const html = `<div class="design-root">
    <header class="navbar container logo">
      <section class="hero hero-content hero-image">
        <div class="features features-grid feature-card badge"></div>
      </section>
    </header>
  </div>`;
  const css = `
    .navbar { display: flex; }
    .container { max-width: 1200px; }
    .logo { font-size: 24px; }
    .hero { padding: 80px 0; }
    .hero-content { flex: 1; }
    .hero-image { width: 500px; }
    .features { padding: 60px 0; }
    .features-grid { display: grid; }
    .feature-card { border-radius: 12px; }
    .badge { background: #e0e7ff; }
  `;
  const coverage = validateCssCoverage(html, css);
  assert.strictEqual(coverage.missingClasses.length, 0, "All 10 classes should be covered");
  assert.strictEqual(coverage.isUsable, true, "CSS validation should PASS");
  assert.strictEqual(coverage.coveragePercent, 100, "Coverage should be 100%");
  console.log("  ✓ TEST 2 passed");
}

function testExplicitRequiredTest3MissingCssValidation() {
  console.log("  - Running: REQUIRED TEST 3 - AI returns HTML with classes but empty CSS -> detects failure...");
  const html = `<div class="design-root">
    <div class="navbar container hero features pricing testimonials btn badge"></div>
  </div>`;
  const emptyCss = "";
  const coverage = validateCssCoverage(html, emptyCss);
  assert.strictEqual(coverage.isUsable, false, "CSS validation should FAIL when CSS is empty");
  console.log("  ✓ TEST 3 passed");
}

function testExplicitRequiredTest4MalformedJsonRecovery() {
  console.log("  - Running: REQUIRED TEST 4 - AI returns malformed JSON -> recovery handles it...");
  const malformed = `
  {
    "html": "<div class=\\"design-root\\"><div class=\\"card\\">Recovered Content</div></div>",
    "css": ".design-root { width: 1200px; } .card { padding: 24px; background: #ffffff; }
  `; // Unterminated JSON without closing quote or brace
  const parsed = parseDesignResponse(malformed, 1200, 900);
  assert.ok(parsed.html.includes("Recovered Content"), "Should recover HTML from malformed JSON");
  assert.ok(parsed.css.includes(".card"), "Should recover CSS from truncated JSON");
  assert.ok(parsed.css.includes("padding: 24px"), "Should preserve CSS declarations");
  console.log("  ✓ TEST 4 passed");
}

function testExplicitRequiredTest5StyleTagExtraction() {
  console.log("  - Running: REQUIRED TEST 5 - HTML with inline <style> -> extracted into CSS...");
  const htmlWithStyle = `
  <div class="design-root">
    <style>
      .hero { background: #4f46e5; color: #ffffff; padding: 60px; }
      .btn-primary { border-radius: 8px; font-weight: bold; }
    </style>
    <div class="hero"><h1>Title</h1><button class="btn-primary">Click</button></div>
  </div>`;
  const parsed = parseDesignResponse(htmlWithStyle, 1200, 900);
  assert.ok(parsed.css.includes(".hero"), "CSS must contain .hero extracted from style tag");
  assert.ok(parsed.css.includes(".btn-primary"), "CSS must contain .btn-primary");
  assert.ok(!parsed.html.includes("<style>"), "HTML must have <style> stripped");
  console.log("  ✓ TEST 5 passed");
}

function testExplicitRequiredTest6PipelineRejectionOnMissingCss() {
  console.log("  - Running: REQUIRED TEST 6 - Pipeline rejects HTML when CSS is missing...");
  const html = `<div class="design-root">
    <div class="navbar"><div class="hero"><button class="btn-primary">Click</button></div></div>
  </div>`;
  const emptyCss = "";
  const normalized = validateAndNormalizeHtmlCss(html, emptyCss, 1200, 900);
  assert.ok(
    normalized.errors.some((e) => e.includes("CSS generation failed: AI returned HTML without usable CSS.")),
    "Should return clear error when CSS is missing"
  );
  console.log("  ✓ TEST 6 passed (Missing CSS correctly rejected with pipeline error)");
}

function testExplicitRequiredTest7SeparatedMarkdownOutput() {
  console.log("  - Running: REQUIRED TEST 7 - AI returns two clearly separated outputs (```html and ```css)...");
  const separatedAiResponse = `
Here is the generated design:

\`\`\`html
<div class="design-root">
  <header class="navbar">
    <div class="navbar-logo">DesignForge</div>
    <nav class="navbar-links">
      <a href="#features" class="nav-link">Features</a>
    </nav>
    <div class="navbar-actions">
      <button class="btn btn-primary">Get Started</button>
    </div>
  </header>
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">Build Faster</h1>
      <p class="hero-subtitle">Convert designs seamlessly.</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-large">Try Free</button>
        <button class="btn btn-secondary btn-large">Learn More</button>
      </div>
    </div>
  </section>
  <section class="features">
    <div class="feature-card">
      <h3 class="feature-title">Fast Conversion</h3>
      <p class="feature-desc">Pixel accurate fidelity.</p>
    </div>
  </section>
</div>
\`\`\`

\`\`\`css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; background: #f8fafc; }
.design-root { width: 1200px; min-height: 900px; background: #ffffff; }
.navbar { display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; height: 72px; background: #ffffff; }
.navbar-logo { font-size: 20px; font-weight: 700; color: #0f172a; }
.navbar-links { display: flex; gap: 24px; }
.nav-link { color: #64748b; font-size: 15px; }
.navbar-actions { display: flex; }
.hero { padding: 80px 48px; text-align: center; background: #f8fafc; }
.hero-content { max-width: 800px; margin: 0 auto; }
.hero-title { font-size: 48px; font-weight: 800; color: #0f172a; }
.hero-subtitle { font-size: 18px; color: #64748b; }
.hero-actions { display: flex; gap: 16px; justify-content: center; }
.features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 60px 48px; }
.feature-card { padding: 32px; background: #ffffff; border-radius: 12px; }
.feature-title { font-size: 20px; font-weight: 600; }
.feature-desc { font-size: 14px; color: #64748b; }
.btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 600; }
.btn-primary { background: #4f46e5; color: #ffffff; padding: 10px 20px; }
.btn-secondary { background: #f1f5f9; color: #334155; padding: 10px 20px; }
.btn-large { padding: 14px 28px; font-size: 16px; }
\`\`\`
`;

  const parsed = parseDesignResponse(separatedAiResponse, 1200, 900);
  assert.ok(parsed.html.includes(".navbar-logo") || parsed.html.includes("DesignForge"), "HTML must contain navbar content");
  assert.ok(parsed.css.includes(".navbar"), "CSS must contain .navbar");
  assert.ok(parsed.css.includes(".hero"), "CSS must contain .hero");
  assert.ok(parsed.css.includes(".feature-card"), "CSS must contain .feature-card");
  assert.ok(parsed.css.includes(".btn-primary"), "CSS must contain .btn-primary");

  const normalized = validateAndNormalizeHtmlCss(parsed.html, parsed.css, 1200, 900);
  assert.strictEqual(normalized.errors.length, 0, "Validation should pass with 0 errors for full separated output");
  assert.ok(normalized.css.includes(".btn-primary { background: #4f46e5"), "CSS background should be preserved");
  console.log("  ✓ TEST 7 passed (Separated ```html and ```css output parsed and validated with 100% fidelity)");
}

function runAllTests() {
  console.log("\n==========================================");
  console.log("🧪 Running AI Design Generator Unit Tests");
  console.log("==========================================");
  testPromptBuilding();
  testParsingJsonFormat();
  testParsingMarkdownCodeFences();
  testCase1Object();
  testCase2EscapedJsonString();
  testCase3FencedJson();
  testCase4FencedHtml();
  testCase5CleanHtml();
  testCase6SvgIntegrity();
  testCase7ResumeAiExample();
  testCase8ImagePreservationAndFallback();
  testTask14AstTests();
  testIntelligentCssRepairFlow();
  testExplicitRequiredTest1ValidHtmlCss();
  testExplicitRequiredTest2FullCssCoverage();
  testExplicitRequiredTest3MissingCssValidation();
  testExplicitRequiredTest4MalformedJsonRecovery();
  testExplicitRequiredTest5StyleTagExtraction();
  testExplicitRequiredTest6PipelineRejectionOnMissingCss();
  testExplicitRequiredTest7SeparatedMarkdownOutput();
  console.log("\n✅ All AI Design Generator tests passed successfully!\n");
}

runAllTests();
