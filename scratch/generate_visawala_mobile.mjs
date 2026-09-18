import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\brijesh9177\\.gemini\\antigravity-ide\\brain\\8000d952-161e-4a7c-b841-2198aa68e271";

function getBase64(filename) {
  const filePath = path.join(ARTIFACT_DIR, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

console.log("Encoding VisaWala mobile imagery...");
const heroImg = getBase64("visawala_hero_global_1789716069551.jpg");
const ukImg = getBase64("visawala_destination_uk_1789716093061.jpg");
const canadaImg = getBase64("visawala_destination_canada_1789716128200.jpg");
const germanyImg = getBase64("visawala_destination_germany_1789716153438.jpg");
const australiaImg = getBase64("visawala_destination_australia_1789716182540.jpg");
const rohanImg = getBase64("visawala_testimonial_rohan_1789716250700.jpg");
const priyaImg = getBase64("visawala_testimonial_priya_1789716219253.jpg");
const arjunImg = getBase64("visawala_testimonial_arjun_1789716282993.jpg");

const mobileHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>VisaWala.com — Mobile Experience (390px)</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 390px;
    background-color: #0B1F3A;
    color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* ─────────────────────────────────────────────────────────────
     1. MOBILE NAVIGATION
  ───────────────────────────────────────────────────────────── */
  .mob-nav {
    width: 390px;
    height: 64px;
    background-color: #0B1F3A;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .mob-brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
  .mob-emblem {
    background-color: #155EEF;
    color: #ffffff;
    font-size: 11px;
    font-weight: 900;
    padding: 4px 7px;
    border-radius: 4px;
  }
  .mob-title {
    font-size: 16px;
    font-weight: 900;
    letter-spacing: -0.4px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .mob-title span {
    color: #155EEF;
  }
  .mob-nav-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
  .btn-mob-cta {
    background-color: #155EEF;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    padding: 8px 14px;
    border-radius: 5px;
    text-transform: uppercase;
  }
  .hamburger-btn {
    width: 34px;
    height: 34px;
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 8px;
  }
  .ham-bar {
    width: 18px;
    height: 2px;
    background-color: #ffffff;
    border-radius: 2px;
  }

  /* ─────────────────────────────────────────────────────────────
     2. MOBILE HERO
  ───────────────────────────────────────────────────────────── */
  .mob-hero {
    width: 390px;
    padding: 32px 20px 48px 20px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    background-color: #0B1F3A;
  }
  .mob-ticker-pill {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 10.5px;
    font-weight: 700;
    color: #a0a8b8;
    align-self: flex-start;
  }
  .mob-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #12B76A;
  }
  .mob-hero-heading {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .mob-hero-title {
    font-size: 40px;
    font-weight: 900;
    line-height: 44px;
    letter-spacing: -1.8px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .mob-hero-title span {
    color: #155EEF;
  }
  .mob-hero-sub {
    font-size: 15px;
    font-weight: 400;
    line-height: 23px;
    color: #929bb0;
  }
  .mob-hero-btn-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .btn-mob-primary {
    width: 100%;
    height: 48px;
    background-color: #155EEF;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .btn-mob-secondary {
    width: 100%;
    height: 48px;
    background-color: transparent;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    text-transform: uppercase;
  }
  .mob-hero-visual {
    width: 350px;
    height: 380px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background-color: #0E2748;
  }
  .mob-hero-img {
    width: 350px;
    height: 380px;
    object-fit: cover;
  }
  .mob-float-tag {
    position: absolute;
    top: 14px;
    left: 14px;
    background-color: rgba(10, 11, 13, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 9.5px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.5px;
  }
  .mob-float-metrics {
    position: absolute;
    bottom: 14px;
    left: 14px;
    right: 14px;
    background-color: rgba(10, 11, 13, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .mob-metric-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .mob-metric-num {
    font-size: 18px;
    font-weight: 900;
    color: #155EEF;
  }
  .mob-metric-tag {
    font-size: 9px;
    font-weight: 700;
    color: #cfd4de;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     3. MOBILE DESTINATIONS (STACKED)
  ───────────────────────────────────────────────────────────── */
  .mob-dest-section {
    width: 390px;
    background-color: #F7F9FC;
    color: #0B1F3A;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .mob-sec-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mob-sec-tag {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #155EEF;
    text-transform: uppercase;
  }
  .mob-sec-title {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #0B1F3A;
    line-height: 32px;
    text-transform: uppercase;
  }
  .mob-dest-stack {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .mob-country-card {
    width: 350px;
    background-color: #ffffff;
    border: 1px solid #DCE5F0;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .mob-country-img {
    width: 350px;
    height: 180px;
    object-fit: cover;
  }
  .mob-country-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mob-country-route {
    font-size: 10.5px;
    font-weight: 800;
    color: #155EEF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .mob-country-name {
    font-size: 20px;
    font-weight: 900;
    color: #0B1F3A;
    letter-spacing: -0.3px;
  }
  .mob-country-desc {
    font-size: 12.5px;
    font-weight: 400;
    line-height: 19px;
    color: #64748B;
  }
  .mob-card-btn {
    border-top: 1px solid #DCE5F0;
    padding-top: 12px;
    margin-top: 4px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-size: 11.5px;
    font-weight: 800;
    color: #0B1F3A;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     4. MOBILE WHY VISAWALA
  ───────────────────────────────────────────────────────────── */
  .mob-why-section {
    width: 390px;
    background-color: #0B1F3A;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .mob-why-title {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #ffffff;
    text-transform: uppercase;
    line-height: 32px;
  }
  .mob-why-title span {
    color: #155EEF;
  }
  .mob-benefits-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .mob-benefit-box {
    background-color: #0E2748;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .mob-benefit-num {
    font-size: 13px;
    font-weight: 900;
    color: #155EEF;
  }
  .mob-benefit-name {
    font-size: 17px;
    font-weight: 800;
    color: #ffffff;
  }
  .mob-benefit-desc {
    font-size: 12.5px;
    font-weight: 400;
    line-height: 19px;
    color: #929bb0;
  }

  /* ─────────────────────────────────────────────────────────────
     5. MOBILE 4-STEP PROCESS
  ───────────────────────────────────────────────────────────── */
  .mob-process-section {
    width: 390px;
    background-color: #F7F9FC;
    color: #0B1F3A;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .mob-step-card {
    background-color: #ffffff;
    border: 1px solid #DCE5F0;
    border-radius: 12px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .mob-step-index {
    font-size: 24px;
    font-weight: 900;
    color: #155EEF;
    letter-spacing: -0.5px;
  }
  .mob-step-title {
    font-size: 17px;
    font-weight: 800;
    color: #0B1F3A;
  }
  .mob-step-desc {
    font-size: 12.5px;
    font-weight: 400;
    line-height: 19px;
    color: #64748B;
  }

  /* ─────────────────────────────────────────────────────────────
     6. MOBILE TESTIMONIALS
  ───────────────────────────────────────────────────────────── */
  .mob-trust-section {
    width: 390px;
    background-color: #0B1F3A;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .mob-test-card {
    background-color: #0E2748;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .mob-cand-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
  .mob-cand-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #155EEF;
  }
  .mob-cand-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .mob-cand-name {
    font-size: 15px;
    font-weight: 800;
    color: #ffffff;
  }
  .mob-cand-role {
    font-size: 11px;
    font-weight: 500;
    color: #929bb0;
  }
  .mob-cand-dest {
    font-size: 10px;
    font-weight: 700;
    color: #155EEF;
    text-transform: uppercase;
  }
  .mob-test-quote {
    font-size: 12.5px;
    font-weight: 400;
    line-height: 20px;
    color: #cfd4de;
  }

  /* ─────────────────────────────────────────────────────────────
     7. MOBILE CTA & FOOTER
  ───────────────────────────────────────────────────────────── */
  .mob-cta-section {
    width: 390px;
    background-color: #155EEF;
    color: #ffffff;
    padding: 56px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }
  .mob-cta-title {
    font-size: 34px;
    font-weight: 900;
    line-height: 38px;
    letter-spacing: -1px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .mob-cta-desc {
    font-size: 13.5px;
    line-height: 21px;
    color: rgba(255, 255, 255, 0.9);
  }
  .btn-mob-cta-white {
    width: 100%;
    height: 48px;
    background-color: #0B1F3A;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    text-transform: uppercase;
  }
  .mob-footer {
    width: 390px;
    background-color: #061324;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 40px 20px 32px 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .mob-footer-copy {
    font-size: 11px;
    color: #5a6070;
    line-height: 18px;
  }
</style>
</head>
<body>

  <!-- 1. MOBILE NAV -->
  <header class="mob-nav">
    <div class="mob-brand">
      <span class="mob-emblem">VW</span>
      <span class="mob-title">VisaWala<span>.com</span></span>
    </div>
    <div class="mob-nav-right">
      <div class="btn-mob-cta">Eligibility →</div>
      <div class="hamburger-btn">
        <span class="ham-bar"></span>
        <span class="ham-bar"></span>
        <span class="ham-bar"></span>
      </div>
    </div>
  </header>

  <!-- 2. MOBILE HERO -->
  <section class="mob-hero">
    <div class="mob-ticker-pill">
      <span class="mob-live-dot"></span>
      <span>10,000+ Candidates Guided • 32 Countries</span>
    </div>

    <div class="mob-hero-heading">
      <h1 class="mob-hero-title">
        Your Next Career Has <span>No Borders.</span>
      </h1>
      <p class="mob-hero-sub">
        Expert guidance for legitimate work visas and overseas career relocation from India to the UK, Canada, Germany, and Australia.
      </p>
    </div>

    <div class="mob-hero-btn-stack">
      <div class="btn-mob-primary">Check Your Eligibility →</div>
      <div class="btn-mob-secondary">Explore Countries ↓</div>
    </div>

    <!-- Mobile Hero Visual -->
    <div class="mob-hero-visual">
      <img class="mob-hero-img" src="${heroImg}" alt="Global Indian Professional" />
      <div class="mob-float-tag">UK & CANADA WORK VISAS</div>
      <div class="mob-float-metrics">
        <div class="mob-metric-cell">
          <span class="mob-metric-num">4,820+</span>
          <span class="mob-metric-tag">Sponsors</span>
        </div>
        <div class="mob-metric-cell">
          <span class="mob-metric-num">98.6%</span>
          <span class="mob-metric-tag">Approval</span>
        </div>
        <div class="mob-metric-cell">
          <span class="mob-metric-num">28 Days</span>
          <span class="mob-metric-tag">Avg Stamping</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. MOBILE DESTINATIONS -->
  <section class="mob-dest-section">
    <div class="mob-sec-header">
      <span class="mob-sec-tag">[ 01 / DESTINATIONS ]</span>
      <h2 class="mob-sec-title">Where Could Your Career Take You?</h2>
    </div>

    <div class="mob-dest-stack">
      <!-- UK -->
      <div class="mob-country-card">
        <img class="mob-country-img" src="${ukImg}" alt="United Kingdom London" />
        <div class="mob-country-body">
          <span class="mob-country-route">Skilled Worker Visa (Tier 2)</span>
          <h3 class="mob-country-name">United Kingdom</h3>
          <p class="mob-country-desc">High demand in Tech, NHS Healthcare, and FinTech. 5-year direct route to Indefinite Leave to Remain (PR).</p>
          <div class="mob-card-btn">
            <span>Explore UK Visa</span>
            <span>→</span>
          </div>
        </div>
      </div>

      <!-- Canada -->
      <div class="mob-country-card">
        <img class="mob-country-img" src="${canadaImg}" alt="Canada Toronto" />
        <div class="mob-country-body">
          <span class="mob-country-route">Express Entry & PNP</span>
          <h3 class="mob-country-name">Canada</h3>
          <p class="mob-country-desc">Category-based draws in STEM, Healthcare, and Trades with spousal open work permits.</p>
          <div class="mob-card-btn">
            <span>Explore Canada Visa</span>
            <span>→</span>
          </div>
        </div>
      </div>

      <!-- Germany -->
      <div class="mob-country-card">
        <img class="mob-country-img" src="${germanyImg}" alt="Germany Frankfurt" />
        <div class="mob-country-body">
          <span class="mob-country-route">EU Blue Card & Chancenkarte</span>
          <h3 class="mob-country-name">Germany</h3>
          <p class="mob-country-desc">Points-based job search visas with English-speaking tech roles in Berlin and Munich.</p>
          <div class="mob-card-btn">
            <span>Explore Germany Visa</span>
            <span>→</span>
          </div>
        </div>
      </div>

      <!-- Australia -->
      <div class="mob-country-card">
        <img class="mob-country-img" src="${australiaImg}" alt="Australia Sydney" />
        <div class="mob-country-body">
          <span class="mob-country-route">Subclass 186 / 482</span>
          <h3 class="mob-country-name">Australia</h3>
          <p class="mob-country-desc">Direct employer nomination pathways for Cloud Architects, Data Scientists, and Medical Specialists.</p>
          <div class="mob-card-btn">
            <span>Explore Australia Visa</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. MOBILE WHY VISAWALA -->
  <section class="mob-why-section">
    <div class="mob-sec-header">
      <span class="mob-sec-tag" style="color:#155EEF;">[ 02 / WHY VISAWALA ]</span>
      <h2 class="mob-why-title">Visa Guidance <span>Without Guesswork.</span></h2>
    </div>

    <div class="mob-benefits-stack">
      <div class="mob-benefit-box">
        <span class="mob-benefit-num">01 / LEGAL</span>
        <h3 class="mob-benefit-name">Expert Visa Guidance</h3>
        <p class="mob-benefit-desc">Consult directly with licensed immigration attorneys, never unregulated sales agents.</p>
      </div>

      <div class="mob-benefit-box">
        <span class="mob-benefit-num">02 / DOSSIER</span>
        <h3 class="mob-benefit-name">Document Assistance</h3>
        <p class="mob-benefit-desc">Full credential verification (WES, ACS, ECCTIS), experience letters, and consular apostilles.</p>
      </div>

      <div class="mob-benefit-box">
        <span class="mob-benefit-num">03 / TRACKING</span>
        <h3 class="mob-benefit-name">100% Transparent Process</h3>
        <p class="mob-benefit-desc">Fixed milestone-based fees with zero hidden retainers or unrealistic job guarantees.</p>
      </div>
    </div>
  </section>

  <!-- 5. MOBILE 4-STEP PROCESS -->
  <section class="mob-process-section">
    <div class="mob-sec-header">
      <span class="mob-sec-tag">[ 03 / THE ROADMAP ]</span>
      <h2 class="mob-sec-title">From Consultation To Boarding Pass.</h2>
    </div>

    <div class="mob-dest-stack">
      <div class="mob-step-card">
        <span class="mob-step-index">01</span>
        <h3 class="mob-step-title">Tell Us Your Goal</h3>
        <p class="mob-step-desc">Share qualifications, target nations, and salary goals in our 5-minute profile intake.</p>
      </div>

      <div class="mob-step-card">
        <span class="mob-step-index">02</span>
        <h3 class="mob-step-title">Check Eligibility</h3>
        <p class="mob-step-desc">Rigorous points-matrix calculation benchmarked against current foreign quotas.</p>
      </div>

      <div class="mob-step-card">
        <span class="mob-step-index">03</span>
        <h3 class="mob-step-title">Prepare Dossier</h3>
        <p class="mob-step-desc">Airtight legal documentation, credential audits, and biometric booking.</p>
      </div>

      <div class="mob-step-card">
        <span class="mob-step-index">04</span>
        <h3 class="mob-step-title">Start Global Journey</h3>
        <p class="mob-step-desc">Passport stamping, pre-departure briefing, and international relocation orientation.</p>
      </div>
    </div>
  </section>

  <!-- 6. MOBILE TESTIMONIALS -->
  <section class="mob-trust-section">
    <div class="mob-sec-header">
      <span class="mob-sec-tag" style="color:#155EEF;">[ 04 / SUCCESS STORIES ]</span>
      <h2 class="mob-why-title" style="font-size: 26px;">Real People. Global Careers.</h2>
    </div>

    <div class="mob-dest-stack">
      <div class="mob-test-card">
        <div class="mob-cand-row">
          <img class="mob-cand-avatar" src="${rohanImg}" alt="Rohan Sharma" />
          <div class="mob-cand-info">
            <span class="mob-cand-name">Rohan Sharma</span>
            <span class="mob-cand-role">Senior Backend Architect</span>
            <span class="mob-cand-dest">🇬🇧 London, UK</span>
          </div>
        </div>
        <p class="mob-test-quote">"VisaWala identified a shortage code I wasn’t aware of. Within 4 weeks of my FinTech offer letter, my vignette was stamped."</p>
      </div>

      <div class="mob-test-card">
        <div class="mob-cand-row">
          <img class="mob-cand-avatar" src="${priyaImg}" alt="Priya Nambiar" />
          <div class="mob-cand-info">
            <span class="mob-cand-name">Priya Nambiar</span>
            <span class="mob-cand-role">Clinical Healthcare Lead</span>
            <span class="mob-cand-dest">🇨🇦 Toronto, Canada</span>
          </div>
        </div>
        <p class="mob-test-quote">"Transitioning from Bangalore to Ontario seemed intimidating until VisaWala structured my NNAS credentials and PR paperwork."</p>
      </div>
    </div>
  </section>

  <!-- 7. MOBILE CTA & FOOTER -->
  <section class="mob-cta-section">
    <h2 class="mob-cta-title">Ready To Take Your Career Global?</h2>
    <p class="mob-cta-desc">Get a confidential eligibility assessment for 2024–2025 work visa quotas across top economies.</p>
    <div class="btn-mob-cta-white">Check Eligibility Free →</div>
  </section>

  <footer class="mob-footer">
    <div class="mob-brand">
      <span class="mob-emblem">VW</span>
      <span class="mob-title">VisaWala<span>.com</span></span>
    </div>
    <p class="mob-footer-copy">© 2024–2025 VisaWala.com Advisory Private Limited. All rights reserved. Registered Global Work Mobility Consultancy.</p>
  </footer>

</body>
</html>
`;

fs.writeFileSync(path.join("scratch", "visawala_mobile_page.html"), mobileHtml, "utf-8");
console.log("Successfully generated scratch/visawala_mobile_page.html! Size:", mobileHtml.length);
