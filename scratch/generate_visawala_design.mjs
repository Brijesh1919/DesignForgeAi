import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\brijesh9177\\.gemini\\antigravity-ide\\brain\\8000d952-161e-4a7c-b841-2198aa68e271";

function getBase64(filename) {
  const filePath = path.join(ARTIFACT_DIR, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

console.log("Encoding VisaWala imagery...");
const heroImg = getBase64("visawala_hero_global_1789716069551.jpg");
const ukImg = getBase64("visawala_destination_uk_1789716093061.jpg");
const canadaImg = getBase64("visawala_destination_canada_1789716128200.jpg");
const germanyImg = getBase64("visawala_destination_germany_1789716153438.jpg");
const australiaImg = getBase64("visawala_destination_australia_1789716182540.jpg");
const rohanImg = getBase64("visawala_testimonial_rohan_1789716250700.jpg");
const priyaImg = getBase64("visawala_testimonial_priya_1789716219253.jpg");
const arjunImg = getBase64("visawala_testimonial_arjun_1789716282993.jpg");

console.log("All 8 images encoded to base64 successfully!");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>VisaWala.com — Global Work Visas & Career Mobility</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1440px;
    background-color: #0B1F3A;
    color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* ─────────────────────────────────────────────────────────────
     1. TOP NAVIGATION
  ───────────────────────────────────────────────────────────── */
  .navbar {
    width: 1440px;
    height: 84px;
    background-color: #0B1F3A;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 64px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .nav-brand-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14px;
  }
  .brand-emblem {
    background-color: #155EEF;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    padding: 6px 9px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }
  .brand-title {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .brand-dot-com {
    color: #155EEF;
  }
  .brand-sub {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: #8c93a0;
    text-transform: uppercase;
    border-left: 1px solid rgba(255, 255, 255, 0.16);
    padding-left: 14px;
  }
  .nav-links {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 32px;
  }
  .nav-item-active {
    font-size: 13px;
    font-weight: 700;
    color: #155EEF;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .nav-item {
    font-size: 13px;
    font-weight: 600;
    color: #cfd4de;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .nav-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .status-badge {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 40px;
    padding: 7px 16px;
    font-size: 11px;
    font-weight: 600;
    color: #a0a8b8;
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #12B76A;
  }
  .btn-nav-primary {
    background-color: #155EEF;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    padding: 12px 22px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ─────────────────────────────────────────────────────────────
     2. HERO SECTION
  ───────────────────────────────────────────────────────────── */
  .hero-section {
    width: 1440px;
    background-color: #0B1F3A;
    padding: 56px 64px 80px 64px;
    display: flex;
    flex-direction: column;
    gap: 44px;
  }
  .hero-ticker-strip {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 18px;
  }
  .ticker-cell {
    font-size: 11.5px;
    font-weight: 700;
    color: #7d8596;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .ticker-highlight {
    color: #155EEF;
  }
  .hero-headline-block {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .hero-title {
    font-size: 78px;
    font-weight: 900;
    line-height: 82px;
    letter-spacing: -3.5px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .hero-title-accent {
    color: #155EEF;
  }
  .hero-subtitle-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 64px;
    margin-top: 8px;
  }
  .hero-statement {
    width: 700px;
    font-size: 19px;
    font-weight: 400;
    line-height: 30px;
    color: #a6afc0;
  }
  .hero-statement strong {
    color: #ffffff;
    font-weight: 700;
  }
  .hero-cta-col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: flex-end;
  }
  .hero-btn-group {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }
  .btn-hero-primary {
    background-color: #155EEF;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    padding: 16px 30px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .btn-hero-secondary {
    background-color: transparent;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    padding: 15px 28px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .hero-trust-indicators {
    font-size: 12px;
    font-weight: 600;
    color: #6f788a;
  }

  /* Hero Visual Showcase */
  .hero-canvas-frame {
    width: 1312px;
    height: 640px;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background-color: #0E2748;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 32px;
  }
  .hero-bg-photo {
    width: 1312px;
    height: 640px;
    position: absolute;
    top: 0;
    left: 0;
    object-fit: cover;
  }
  .hero-badges-top {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .floating-pill {
    background-color: rgba(10, 11, 13, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 8px 16px;
    border-radius: 30px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .hero-badges-bottom {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
  .hero-stat-card {
    background-color: rgba(10, 11, 13, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 20px 24px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 460px;
  }
  .hero-stat-title {
    font-size: 16px;
    font-weight: 800;
    color: #ffffff;
  }
  .hero-stat-desc {
    font-size: 12px;
    font-weight: 500;
    color: #a6afc0;
    line-height: 18px;
  }
  .hero-metrics-pill-cluster {
    background-color: rgba(10, 11, 13, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 16px 28px;
    border-radius: 12px;
    display: flex;
    flex-direction: row;
    gap: 36px;
  }
  .metric-box {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .metric-val {
    font-size: 24px;
    font-weight: 900;
    color: #155EEF;
    letter-spacing: -0.5px;
  }
  .metric-lbl {
    font-size: 10px;
    font-weight: 700;
    color: #cfd4de;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     3. DESTINATION EXPLORER (WARM LIGHT SECTION)
  ───────────────────────────────────────────────────────────── */
  .destination-section {
    width: 1440px;
    background-color: #F7F9FC;
    color: #0B1F3A;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .sec-header-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid #DCE5F0;
    padding-bottom: 24px;
  }
  .sec-header-left {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sec-index-tag {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #155EEF;
    text-transform: uppercase;
  }
  .sec-title-dark {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -1.8px;
    color: #0B1F3A;
    text-transform: uppercase;
  }
  .sec-desc-dark {
    font-size: 14px;
    font-weight: 500;
    color: #64748B;
    max-width: 500px;
    line-height: 22px;
  }

  /* Country Grid */
  .country-grid-quad {
    display: flex;
    flex-direction: row;
    gap: 28px;
  }
  .country-card {
    flex: 1;
    background-color: #ffffff;
    border: 1px solid #DCE5F0;
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 520px;
  }
  .country-img-wrap {
    width: 100%;
    height: 240px;
    position: relative;
    background-color: #DCE5F0;
  }
  .country-photo {
    width: 100%;
    height: 240px;
    object-fit: cover;
  }
  .country-badge-float {
    position: absolute;
    top: 16px;
    left: 16px;
    background-color: #0B1F3A;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 6px 12px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .country-info-block {
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 280px;
  }
  .country-info-top {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .country-visa-cat {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    color: #155EEF;
    text-transform: uppercase;
  }
  .country-name {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0B1F3A;
  }
  .country-desc {
    font-size: 13px;
    font-weight: 400;
    line-height: 20px;
    color: #64748B;
  }
  .country-card-action {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #DCE5F0;
    padding-top: 16px;
  }
  .country-action-text {
    font-size: 12px;
    font-weight: 800;
    color: #0B1F3A;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .country-action-arrow {
    color: #155EEF;
    font-weight: 900;
    font-size: 14px;
  }

  /* Additional Countries Strip */
  .more-countries-strip {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #DCE5F0;
    border-radius: 10px;
    padding: 20px 32px;
  }
  .more-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .more-country {
    font-size: 14px;
    font-weight: 800;
    color: #0B1F3A;
  }
  .more-route {
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
  }

  /* ─────────────────────────────────────────────────────────────
     4. WHY VISAWALA.COM (VALUE PROPOSITION)
  ───────────────────────────────────────────────────────────── */
  .why-section {
    width: 1440px;
    background-color: #0B1F3A;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .why-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 24px;
  }
  .why-headline {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -1.8px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .why-headline span {
    color: #155EEF;
  }
  .benefits-pentagon-grid {
    display: flex;
    flex-direction: row;
    gap: 24px;
  }
  .benefit-card {
    flex: 1;
    background-color: #0E2748;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 36px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 330px;
  }
  .benefit-top {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .benefit-number {
    font-size: 14px;
    font-weight: 900;
    color: #155EEF;
    letter-spacing: 1px;
  }
  .benefit-title {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.4px;
    line-height: 26px;
  }
  .benefit-text {
    font-size: 13px;
    font-weight: 400;
    line-height: 21px;
    color: #929bb0;
  }
  .benefit-badge {
    align-self: flex-start;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 5px 12px;
    border-radius: 4px;
  }

  /* ─────────────────────────────────────────────────────────────
     5. HOW IT WORKS (4-STEP PROCESS)
  ───────────────────────────────────────────────────────────── */
  .process-section {
    width: 1440px;
    background-color: #F7F9FC;
    color: #0B1F3A;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .process-quad-grid {
    display: flex;
    flex-direction: row;
    gap: 24px;
  }
  .process-step-box {
    flex: 1;
    background-color: #ffffff;
    border: 1px solid #DCE5F0;
    border-radius: 14px;
    padding: 36px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 350px;
  }
  .step-head {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .step-num-big {
    font-size: 32px;
    font-weight: 900;
    color: #155EEF;
    letter-spacing: -1px;
  }
  .step-name {
    font-size: 22px;
    font-weight: 800;
    color: #0B1F3A;
    letter-spacing: -0.5px;
  }
  .step-text {
    font-size: 13.5px;
    font-weight: 400;
    line-height: 22px;
    color: #64748B;
  }
  .step-deliverable {
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    letter-spacing: 0.5px;
    border-top: 1px solid #DCE5F0;
    padding-top: 16px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     6. WORK VISA CATEGORIES
  ───────────────────────────────────────────────────────────── */
  .categories-section {
    width: 1440px;
    background-color: #0E2748;
    color: #ffffff;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .cat-header {
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 24px;
  }
  .cat-title {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -1.8px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .cat-notice {
    font-size: 12px;
    font-weight: 500;
    color: #8c93a0;
  }
  .cat-list {
    display: flex;
    flex-direction: column;
  }
  .cat-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 28px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .cat-row-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 36px;
  }
  .cat-index {
    font-size: 15px;
    font-weight: 900;
    color: #155EEF;
    width: 30px;
  }
  .cat-heading {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: #ffffff;
  }
  .cat-middle {
    width: 480px;
    font-size: 13.5px;
    font-weight: 400;
    line-height: 21px;
    color: #929bb0;
  }
  .cat-tags {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
  .cat-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 6px 12px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     7. TRUST / SOCIAL PROOF (TESTIMONIALS)
  ───────────────────────────────────────────────────────────── */
  .trust-section {
    width: 1440px;
    background-color: #0B1F3A;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .trust-header-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 24px;
  }
  .trust-title {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -1.8px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .testimonials-triad-grid {
    display: flex;
    flex-direction: row;
    gap: 32px;
  }
  .testimonial-card {
    flex: 1;
    background-color: #0E2748;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 440px;
  }
  .testimonial-top {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .candidate-profile-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .candidate-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #155EEF;
  }
  .candidate-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .candidate-name {
    font-size: 17px;
    font-weight: 800;
    color: #ffffff;
  }
  .candidate-role {
    font-size: 12px;
    font-weight: 500;
    color: #929bb0;
  }
  .candidate-destination {
    font-size: 11px;
    font-weight: 700;
    color: #155EEF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .testimonial-quote {
    font-size: 14px;
    font-weight: 400;
    line-height: 23px;
    color: #cfd4de;
    font-style: normal;
  }
  .testimonial-metrics-footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 20px;
  }
  .test-stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .test-stat-val {
    font-size: 15px;
    font-weight: 800;
    color: #ffffff;
  }
  .test-stat-lbl {
    font-size: 10px;
    font-weight: 600;
    color: #64748B;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     8. VISA ELIGIBILITY CTA SECTION (ELECTRIC SAFFRON)
  ───────────────────────────────────────────────────────────── */
  .eligibility-cta-section {
    width: 1440px;
    background-color: #155EEF;
    color: #ffffff;
    padding: 104px 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 36px;
  }
  .cta-eyebrow {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.85);
    text-transform: uppercase;
  }
  .cta-title-giant {
    font-size: 64px;
    font-weight: 900;
    line-height: 70px;
    letter-spacing: -2.5px;
    color: #ffffff;
    text-transform: uppercase;
    max-width: 960px;
  }
  .cta-desc-white {
    font-size: 17px;
    font-weight: 400;
    line-height: 28px;
    color: rgba(255, 255, 255, 0.9);
    max-width: 680px;
  }
  .cta-buttons-row {
    display: flex;
    flex-direction: row;
    gap: 18px;
  }
  .btn-cta-dark {
    background-color: #0B1F3A;
    color: #ffffff;
    font-size: 14px;
    font-weight: 900;
    padding: 18px 38px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .btn-cta-ghost-white {
    background-color: transparent;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    padding: 17px 34px;
    border-radius: 8px;
    border: 2px solid #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .cta-footnote-strip {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 0.5px;
  }

  /* ─────────────────────────────────────────────────────────────
     9. FREQUENTLY ASKED QUESTIONS (FAQ)
  ───────────────────────────────────────────────────────────── */
  .faq-section {
    width: 1440px;
    background-color: #F7F9FC;
    color: #0B1F3A;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .faq-list-block {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .faq-card-item {
    background-color: #ffffff;
    border: 1px solid #DCE5F0;
    border-radius: 12px;
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .faq-q-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .faq-question {
    font-size: 18px;
    font-weight: 800;
    color: #0B1F3A;
    letter-spacing: -0.3px;
  }
  .faq-toggle-icon {
    font-size: 18px;
    font-weight: 900;
    color: #155EEF;
  }
  .faq-answer {
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: #64748B;
  }

  /* ─────────────────────────────────────────────────────────────
     10. EDITORIAL FOOTER
  ───────────────────────────────────────────────────────────── */
  .footer {
    width: 1440px;
    background-color: #061324;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 72px 64px 48px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .footer-pre-banner {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 32px;
  }
  .footer-cta-text {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
  }
  .footer-btn-small {
    background-color: #155EEF;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    padding: 10px 20px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .footer-columns {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .footer-col-brand {
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .footer-bio {
    font-size: 13px;
    font-weight: 400;
    line-height: 22px;
    color: #8c93a0;
  }
  .footer-licence-badge {
    align-self: flex-start;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 700;
    color: #155EEF;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .footer-nav-col {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .footer-heading {
    font-size: 11px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .footer-link {
    font-size: 13px;
    font-weight: 500;
    color: #8c93a0;
  }
  .footer-bottom-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 28px;
  }
  .footer-copy {
    font-size: 12px;
    font-weight: 500;
    color: #5a6070;
  }
  .footer-coords {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #5a6070;
    text-transform: uppercase;
  }
</style>
</head>
<body>

  <!-- 1. TOP NAVIGATION -->
  <header class="navbar">
    <div class="nav-brand-group">
      <span class="brand-emblem">VW</span>
      <span class="brand-title">VisaWala<span class="brand-dot-com">.com</span></span>
      <span class="brand-sub">Global Work Mobility</span>
    </div>
    <div class="nav-links">
      <span class="nav-item-active">Work Visas</span>
      <span class="nav-item">Countries</span>
      <span class="nav-item">How It Works</span>
      <span class="nav-item">Success Stories</span>
      <span class="nav-item">Resources</span>
      <span class="nav-item">Contact</span>
    </div>
    <div class="nav-actions">
      <div class="status-badge">
        <span class="status-dot"></span>
        <span>2024/25 Visa Quotas Open</span>
      </div>
      <div class="btn-nav-primary">Check Eligibility →</div>
    </div>
  </header>

  <!-- 2. HERO SECTION -->
  <section class="hero-section">
    <div class="hero-ticker-strip">
      <span class="ticker-cell">Awwwards SOTD Contender</span>
      <span class="ticker-cell">Total Candidates Guided: <span class="ticker-highlight">10,000+</span></span>
      <span class="ticker-cell">32 Destination Countries</span>
      <span class="ticker-cell">Consular Success: <span class="ticker-highlight">98.6%</span></span>
    </div>

    <div class="hero-headline-block">
      <h1 class="hero-title">
        Your Next Career<br />
        Has <span class="hero-title-accent">No Borders.</span>
      </h1>

      <div class="hero-subtitle-row">
        <p class="hero-statement">
          Get expert guidance for <strong>legitimate work visas, employer sponsorship, and overseas career relocation</strong> from India to premier global economies.
        </p>
        <div class="hero-cta-col">
          <div class="hero-btn-group">
            <div class="btn-hero-primary">Check Your Eligibility →</div>
            <div class="btn-hero-secondary">Explore Countries ↓</div>
          </div>
          <span class="hero-trust-indicators">✓ Free Profile Assessment • Registered Immigration Advisory • No Hidden Retainers</span>
        </div>
      </div>
    </div>

    <!-- Hero Visual Canvas -->
    <div class="hero-canvas-frame">
      <img class="hero-bg-photo" src="${heroImg}" alt="Global Indian Professional in London & Singapore" />
      <div class="hero-badges-top">
        <div class="floating-pill">UK SKILLED WORKER • FAST TRACK TECH ROUTE</div>
        <div class="floating-pill">CANADA EXPRESS ENTRY • STEM DRAW ACTIVE</div>
      </div>
      <div class="hero-badges-bottom">
        <div class="hero-stat-card">
          <div class="hero-stat-title">Overseas Employment Mobility Platform</div>
          <div class="hero-stat-desc">Connecting top Indian tech leads, doctors, financial analysts, and researchers directly with verified overseas visa streams.</div>
        </div>
        <div class="hero-metrics-pill-cluster">
          <div class="metric-box">
            <span class="metric-val">4,820+</span>
            <span class="metric-lbl">Active Sponsors</span>
          </div>
          <div class="metric-box">
            <span class="metric-val">28 Days</span>
            <span class="metric-lbl">Avg. Tech Stamping</span>
          </div>
          <div class="metric-box">
            <span class="metric-val">100%</span>
            <span class="metric-lbl">Legal Compliance</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. DESTINATION EXPLORER (WARM LIGHT SECTION) -->
  <section class="destination-section">
    <div class="sec-header-row">
      <div class="sec-header-left">
        <span class="sec-index-tag">[ 01 / DESTINATIONS ]</span>
        <h2 class="sec-title-dark">Where Could Your Career Take You?</h2>
      </div>
      <p class="sec-desc-dark">
        High-demand overseas employment markets actively seeking experienced Indian professionals with fast-tracked work permits and permanent residency options.
      </p>
    </div>

    <div class="country-grid-quad">
      <!-- UK -->
      <div class="country-card">
        <div class="country-img-wrap">
          <img class="country-photo" src="${ukImg}" alt="United Kingdom London City" />
          <span class="country-badge-float">Fast Track 3 Weeks</span>
        </div>
        <div class="country-info-block">
          <div class="country-info-top">
            <span class="country-visa-cat">Skilled Worker Visa (Tier 2)</span>
            <h3 class="country-name">United Kingdom</h3>
            <p class="country-desc">
              Surging demand in Software Architecture, AI, NHS Healthcare, and FinTech. Transparent salary thresholds with 5-year direct route to Indefinite Leave to Remain.
            </p>
          </div>
          <div class="country-card-action">
            <span class="country-action-text">Explore UK Pathways</span>
            <span class="country-action-arrow">→</span>
          </div>
        </div>
      </div>

      <!-- Canada -->
      <div class="country-card">
        <div class="country-img-wrap">
          <img class="country-photo" src="${canadaImg}" alt="Toronto Canada Skyline" />
          <span class="country-badge-float">Direct PR Stream</span>
        </div>
        <div class="country-info-block">
          <div class="country-info-top">
            <span class="country-visa-cat">Express Entry & PNP Permits</span>
            <h3 class="country-name">Canada</h3>
            <p class="country-desc">
              Targeted category-based selections in STEM, Healthcare, and Management. Spousal open work permits and universal government healthcare coverage.
            </p>
          </div>
          <div class="country-card-action">
            <span class="country-action-text">Explore Canada Pathways</span>
            <span class="country-action-arrow">→</span>
          </div>
        </div>
      </div>

      <!-- Germany -->
      <div class="country-card">
        <div class="country-img-wrap">
          <img class="country-photo" src="${germanyImg}" alt="Frankfurt Germany Modern Tech" />
          <span class="country-badge-float">Chancenkarte 2024</span>
        </div>
        <div class="country-info-block">
          <div class="country-info-top">
            <span class="country-visa-cat">EU Blue Card & Job Seeker</span>
            <h3 class="country-name">Germany</h3>
            <p class="country-desc">
              Europe’s industrial titan offers points-based job search visas. Thousands of English-speaking tech and engineering positions in Berlin, Frankfurt, and Munich.
            </p>
          </div>
          <div class="country-card-action">
            <span class="country-action-text">Explore Germany Pathways</span>
            <span class="country-action-arrow">→</span>
          </div>
        </div>
      </div>

      <!-- Australia -->
      <div class="country-card">
        <div class="country-img-wrap">
          <img class="country-photo" src="${australiaImg}" alt="Sydney Barangaroo Waterfront" />
          <span class="country-badge-float">Subclass 186 / 482</span>
        </div>
        <div class="country-info-block">
          <div class="country-info-top">
            <span class="country-visa-cat">Employer Nomination Scheme</span>
            <h3 class="country-name">Australia</h3>
            <p class="country-desc">
              World-class quality of life and top global compensation benchmarks. High-priority processing for Cloud Architects, Data Scientists, and Medical Specialists.
            </p>
          </div>
          <div class="country-card-action">
            <span class="country-action-text">Explore Australia Pathways</span>
            <span class="country-action-arrow">→</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Countries Strip -->
    <div class="more-countries-strip">
      <div class="more-item">
        <span class="more-country">🇮🇪 Ireland</span>
        <span class="more-route">Critical Skills Employment Permit (2-yr stamp 4)</span>
      </div>
      <div class="more-item">
        <span class="more-country">🇦🇪 United Arab Emirates</span>
        <span class="more-route">Golden 10-Year & Green Skilled Visa</span>
      </div>
      <div class="more-item">
        <span class="more-country">🇳🇿 New Zealand</span>
        <span class="more-route">Green List Fast-Track Residency</span>
      </div>
      <div class="more-item">
        <span class="more-country">🇺🇸 United States</span>
        <span class="more-route">H-1B Cap-Exempt, L-1 ICT & O-1 Talent</span>
      </div>
    </div>
  </section>

  <!-- 4. WHY VISAWALA.COM (VALUE PROPOSITION) -->
  <section class="why-section">
    <div class="why-header">
      <span class="sec-index-tag">[ 02 / WHY VISAWALA.COM ]</span>
      <h2 class="why-headline">Visa Guidance <span>Without The Guesswork.</span></h2>
    </div>

    <div class="benefits-pentagon-grid">
      <div class="benefit-card">
        <div class="benefit-top">
          <span class="benefit-number">01</span>
          <h3 class="benefit-title">Expert Visa Guidance</h3>
          <p class="benefit-text">
            Consult directly with registered foreign immigration attorneys and senior mobility strategists, never commission-hungry sales agents.
          </p>
        </div>
        <span class="benefit-badge">Regulated Legal Counsel</span>
      </div>

      <div class="benefit-card">
        <div class="benefit-top">
          <span class="benefit-number">02</span>
          <h3 class="benefit-title">Document Assistance</h3>
          <p class="benefit-text">
            Meticulous credential verification (WES, ECCTIS, ACS), work experience reference drafting, police clearances, and consular apostilles.
          </p>
        </div>
        <span class="benefit-badge">Zero Discrepancies</span>
      </div>

      <div class="benefit-card">
        <div class="benefit-top">
          <span class="benefit-number">03</span>
          <h3 class="benefit-title">Application Support</h3>
          <p class="benefit-text">
            Comprehensive petition filing, biometric slot coordination, mock embassy interviews, and real-time consular tracking.
          </p>
        </div>
        <span class="benefit-badge">End-to-End Filing</span>
      </div>

      <div class="benefit-card">
        <div class="benefit-top">
          <span class="benefit-number">04</span>
          <h3 class="benefit-title">Country-Specific Precision</h3>
          <p class="benefit-text">
            Real-time radar tracking of international shortage lists, salary threshold updates, and official immigration draw announcements.
          </p>
        </div>
        <span class="benefit-badge">Real-Time Intelligence</span>
      </div>

      <div class="benefit-card">
        <div class="benefit-top">
          <span class="benefit-number">05</span>
          <h3 class="benefit-title">Transparent Process</h3>
          <p class="benefit-text">
            Fixed transparent advisory fees with milestone deliverables. No hidden retainers, no kickbacks, and no misleading job promises.
          </p>
        </div>
        <span class="benefit-badge">100% Ethical Advisory</span>
      </div>
    </div>
  </section>

  <!-- 5. HOW IT WORKS (4-STEP PROCESS) -->
  <section class="process-section">
    <div class="sec-header-row">
      <div class="sec-header-left">
        <span class="sec-index-tag">[ 03 / THE JOURNEY ]</span>
        <h2 class="sec-title-dark">From Consultation To Boarding Pass.</h2>
      </div>
      <p class="sec-desc-dark">
        A structured, predictable 4-stage relocation roadmap engineered to eliminate visa delays and paperwork rejections.
      </p>
    </div>

    <div class="process-quad-grid">
      <div class="process-step-box">
        <div class="step-head">
          <span class="step-num-big">01</span>
          <h3 class="step-name">Tell Us Your Goal</h3>
          <p class="step-text">
            Share your educational history, career experience, target destination countries, and overseas salary aspirations in our confidential intake.
          </p>
        </div>
        <span class="step-deliverable">5-Min Intake • Profile Review</span>
      </div>

      <div class="process-step-box">
        <div class="step-head">
          <span class="step-num-big">02</span>
          <h3 class="step-name">Check Eligibility</h3>
          <p class="step-text">
            Our legal desk executes a rigorous point-score calculation (CRS, UK Points, Subclass matrix) benchmarked against current official quotas.
          </p>
        </div>
        <span class="step-deliverable">Formal Eligibility Scorecard</span>
      </div>

      <div class="process-step-box">
        <div class="step-head">
          <span class="step-num-big">03</span>
          <h3 class="step-name">Prepare Application</h3>
          <p class="step-text">
            Our documentation team gathers, audits, translates, and formats every credential, reference letter, and sponsor certificate to legal standards.
          </p>
        </div>
        <span class="step-deliverable">Complete Visa Dossier</span>
      </div>

      <div class="process-step-box">
        <div class="step-head">
          <span class="step-num-big">04</span>
          <h3 class="step-name">Start Global Journey</h3>
          <p class="step-text">
            Biometrics coordination, consular submission, visa stamping, followed by pre-departure taxation and international relocation briefings.
          </p>
        </div>
        <span class="step-deliverable">Visa Stamped • Flight Ready</span>
      </div>
    </div>
  </section>

  <!-- 6. WORK VISA CATEGORIES -->
  <section class="categories-section">
    <div class="cat-header">
      <span class="sec-index-tag">[ 04 / VISA PATHWAYS ]</span>
      <h2 class="cat-title">Targeted Pathways For Every Professional Profile</h2>
      <p class="cat-notice">*Actual eligibility, points thresholds, and employer sponsorship obligations vary by country and individual applicant profile.</p>
    </div>

    <div class="cat-list">
      <div class="cat-row">
        <div class="cat-row-left">
          <span class="cat-index">01</span>
          <h3 class="cat-heading">Skilled Worker Visas</h3>
        </div>
        <p class="cat-middle">
          Points-tested work permits designed for software developers, doctors, accountants, and engineers filling verified national shortage occupations.
        </p>
        <div class="cat-tags">
          <span class="cat-tag">UK Skilled Worker</span>
          <span class="cat-tag">Aus Subclass 189</span>
          <span class="cat-tag">Canada STEM</span>
        </div>
      </div>

      <div class="cat-row">
        <div class="cat-row-left">
          <span class="cat-index">02</span>
          <h3 class="cat-heading">Employer-Sponsored Visas</h3>
        </div>
        <p class="cat-middle">
          Work authorization backed directly by overseas companies with verified Certificates of Sponsorship (CoS), LMIA approvals, or TSS nominations.
        </p>
        <div class="cat-tags">
          <span class="cat-tag">TSS 482</span>
          <span class="cat-tag">LMIA Work Permit</span>
          <span class="cat-tag">H-1B Cap</span>
        </div>
      </div>

      <div class="cat-row">
        <div class="cat-row-left">
          <span class="cat-index">03</span>
          <h3 class="cat-heading">Job Seeker & Opportunity Cards</h3>
        </div>
        <p class="cat-middle">
          Permits that grant legal entry to target countries to attend on-site interviews, network with founders, and convert into long-term work permits.
        </p>
        <div class="cat-tags">
          <span class="cat-tag">Chancenkarte</span>
          <span class="cat-tag">Austria Red-White</span>
          <span class="cat-tag">Portugal Job Seeker</span>
        </div>
      </div>

      <div class="cat-row">
        <div class="cat-row-left">
          <span class="cat-index">04</span>
          <h3 class="cat-heading">Highly Skilled & Global Talent</h3>
        </div>
        <p class="cat-middle">
          Prestigious fast-track visas for tech leaders, researchers, and venture-backed founders requiring no employer sponsorship or job offer.
        </p>
        <div class="cat-tags">
          <span class="cat-tag">UK Global Talent</span>
          <span class="cat-tag">US O-1 / EB-1</span>
          <span class="cat-tag">GTI Australia</span>
        </div>
      </div>

      <div class="cat-row">
        <div class="cat-row-left">
          <span class="cat-index">05</span>
          <h3 class="cat-heading">Intra-Company Transfers (ICT)</h3>
        </div>
        <p class="cat-middle">
          Seamless international transfer pathways for employees of multinational IT, consulting, and finance corporations moving to foreign branch offices.
        </p>
        <div class="cat-tags">
          <span class="cat-tag">US L-1A/B</span>
          <span class="cat-tag">UK Senior Specialist</span>
          <span class="cat-tag">Canada ICT</span>
        </div>
      </div>

      <div class="cat-row">
        <div class="cat-row-left">
          <span class="cat-index">06</span>
          <h3 class="cat-heading">Industry-Specific Opportunities</h3>
        </div>
        <p class="cat-middle">
          Specialized visa corridors tailored for healthcare professionals (NHS Health & Care), maritime crew, academic researchers, and clean-tech engineers.
        </p>
        <div class="cat-tags">
          <span class="cat-tag">NHS Healthcare</span>
          <span class="cat-tag">Critical Skills</span>
          <span class="cat-tag">Renewable Energy</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 7. TRUST / SOCIAL PROOF (TESTIMONIALS) -->
  <section class="trust-section">
    <div class="trust-header-row">
      <div class="sec-header-left">
        <span class="sec-index-tag">[ 05 / SUCCESS STORIES ]</span>
        <h2 class="trust-title">Real People. Global Careers.</h2>
      </div>
      <p class="sec-desc-dark" style="color: #8c93a0;">
        Sample verified candidate journeys illustrating real international career transitions unlocked through structured visa strategy.
      </p>
    </div>

    <div class="testimonials-triad-grid">
      <!-- Rohan -->
      <div class="testimonial-card">
        <div class="testimonial-top">
          <div class="candidate-profile-row">
            <img class="candidate-avatar" src="${rohanImg}" alt="Rohan Sharma London Tech" />
            <div class="candidate-meta">
              <span class="candidate-name">Rohan Sharma</span>
              <span class="candidate-role">Senior Backend Architect</span>
              <span class="candidate-destination">🇬🇧 London, United Kingdom</span>
            </div>
          </div>
          <p class="testimonial-quote">
            "VisaWala’s team audited my technical background and identified an exact shortage code I wasn’t aware of. Within 4 weeks of my FinTech offer letter, my passport vignette was stamped without a single query."
          </p>
        </div>
        <div class="testimonial-metrics-footer">
          <div class="test-stat">
            <span class="test-stat-val">26 Days</span>
            <span class="test-stat-lbl">Processing Time</span>
          </div>
          <div class="test-stat">
            <span class="test-stat-val">+180%</span>
            <span class="test-stat-lbl">Salary Uplift</span>
          </div>
          <div class="test-stat">
            <span class="test-stat-val">Skilled Worker</span>
            <span class="test-stat-lbl">Visa Category</span>
          </div>
        </div>
      </div>

      <!-- Priya -->
      <div class="testimonial-card">
        <div class="testimonial-top">
          <div class="candidate-profile-row">
            <img class="candidate-avatar" src="${priyaImg}" alt="Priya Nambiar Toronto Healthcare" />
            <div class="candidate-meta">
              <span class="candidate-name">Priya Nambiar</span>
              <span class="candidate-role">Clinical Healthcare Lead</span>
              <span class="candidate-destination">🇨🇦 Toronto, Canada</span>
            </div>
          </div>
          <p class="testimonial-quote">
            "Relocating from Bangalore to Ontario seemed intimidating until VisaWala structured my NNAS credentials evaluation and provincial nomination. Their document precision saved me six months of delays."
          </p>
        </div>
        <div class="testimonial-metrics-footer">
          <div class="test-stat">
            <span class="test-stat-val">4.5 Months</span>
            <span class="test-stat-lbl">Total Duration</span>
          </div>
          <div class="test-stat">
            <span class="test-stat-val">Permanent Resident</span>
            <span class="test-stat-lbl">Current Status</span>
          </div>
          <div class="test-stat">
            <span class="test-stat-val">Express Entry</span>
            <span class="test-stat-lbl">Target Stream</span>
          </div>
        </div>
      </div>

      <!-- Arjun -->
      <div class="testimonial-card">
        <div class="testimonial-top">
          <div class="candidate-profile-row">
            <img class="candidate-avatar" src="${arjunImg}" alt="Arjun Mehta Sydney Data" />
            <div class="candidate-meta">
              <span class="candidate-name">Arjun Mehta</span>
              <span class="candidate-role">Principal Data Architect</span>
              <span class="candidate-destination">🇦🇺 Sydney, Australia</span>
            </div>
          </div>
          <p class="testimonial-quote">
            "Brutally transparent, meticulous, and professional. They never sold unrealistic shortcuts—they delivered a concrete mathematical roadmap for my ACS assessment, employer nomination, and family relocation."
          </p>
        </div>
        <div class="testimonial-metrics-footer">
          <div class="test-stat">
            <span class="test-stat-val">52 Days</span>
            <span class="test-stat-lbl">Nomination Stamped</span>
          </div>
          <div class="test-stat">
            <span class="test-stat-val">Family Included</span>
            <span class="test-stat-lbl">Dependent Visas</span>
          </div>
          <div class="test-stat">
            <span class="test-stat-val">Subclass 186</span>
            <span class="test-stat-lbl">PR Category</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 8. VISA ELIGIBILITY CTA SECTION (ELECTRIC SAFFRON) -->
  <section class="eligibility-cta-section">
    <span class="cta-eyebrow">TAKE THE FIRST STEP TOWARDS AN INTERNATIONAL CAREER</span>
    <h2 class="cta-title-giant">
      Ready To Take Your Career Global?
    </h2>
    <p class="cta-desc-white">
      Find out which work visa pathways, salary thresholds, and sponsorship quotas are open for your professional profile in 2024–2025. Get a confidential eligibility assessment.
    </p>
    <div class="cta-buttons-row">
      <div class="btn-cta-dark">Check My Eligibility Free →</div>
      <div class="btn-cta-ghost-white">Book 1-on-1 Consultation ☎</div>
    </div>
    <span class="cta-footnote-strip">Takes 3 Minutes • 100% Confidential • Zero Cold Calls Guaranteed</span>
  </section>

  <!-- 9. FREQUENTLY ASKED QUESTIONS (FAQ) -->
  <section class="faq-section">
    <div class="sec-header-row">
      <div class="sec-header-left">
        <span class="sec-index-tag">[ 06 / CLARITY ]</span>
        <h2 class="sec-title-dark">Frequently Asked Questions.</h2>
      </div>
      <p class="sec-desc-dark">
        Clear answers on visa regulations, eligibility benchmarks, timelines, and legal requirements.
      </p>
    </div>

    <div class="faq-list-block">
      <div class="faq-card-item">
        <div class="faq-q-row">
          <span class="faq-question">Who can apply for an overseas work visa from India?</span>
          <span class="faq-toggle-icon">−</span>
        </div>
        <p class="faq-answer">
          Professionals with recognized educational degrees (Bachelor’s, Master’s, or equivalent diplomas) and 2+ years of demonstrable work experience are generally eligible for skilled work visas. Priority sectors include Software/IT, Healthcare, Finance, Data Science, and Engineering.
        </p>
      </div>

      <div class="faq-card-item">
        <div class="faq-q-row">
          <span class="faq-question">Which countries currently offer the fastest work visa processing?</span>
          <span class="faq-toggle-icon">+</span>
        </div>
        <p class="faq-answer">
          The UK Skilled Worker route typically processes within 3 to 4 weeks with priority consular processing. Germany’s new Opportunity Card (Chancenkarte) and UAE’s Green Visa also offer expedited pathways for qualified candidates.
        </p>
      </div>

      <div class="faq-card-item">
        <div class="faq-q-row">
          <span class="faq-question">How long does the entire visa process typically take?</span>
          <span class="faq-toggle-icon">+</span>
        </div>
        <p class="faq-answer">
          Employer-sponsored routes (such as UK Tier 2 or Australia 482) take between 4 to 8 weeks from job offer to visa stamping. Points-based permanent residency routes (like Canada Express Entry or Australia 189/190) range from 4 to 9 months depending on your CRS score.
        </p>
      </div>

      <div class="faq-card-item">
        <div class="faq-q-row">
          <span class="faq-question">What documents are required to begin my visa dossier?</span>
          <span class="faq-toggle-icon">+</span>
        </div>
        <p class="faq-answer">
          Key foundational documents include a valid Indian passport, educational transcripts for credential assessment (WES/ECCTIS), detailed employer experience letters, English proficiency test scores (IELTS/PTE), and police clearance certificates (PCC).
        </p>
      </div>

      <div class="faq-card-item">
        <div class="faq-q-row">
          <span class="faq-question">Can VisaWala.com help me with employer sponsorship and interviews?</span>
          <span class="faq-toggle-icon">+</span>
        </div>
        <p class="faq-answer">
          While VisaWala operates strictly as a licensed visa legal advisory rather than an unregulated recruitment agent, we prepare international CVs, align profiles with active shortage occupation codes, and connect eligible candidates with verified overseas employer registries.
        </p>
      </div>

      <div class="faq-card-item">
        <div class="faq-q-row">
          <span class="faq-question">How do I check my eligibility score?</span>
          <span class="faq-toggle-icon">+</span>
        </div>
        <p class="faq-answer">
          Click the "Check Your Eligibility" button anywhere on this page. Our interactive assessment evaluates your age, qualifications, work history, and language proficiency to calculate your points score against live 2024/25 criteria.
        </p>
      </div>
    </div>
  </section>

  <!-- 10. EDITORIAL FOOTER -->
  <footer class="footer">
    <div class="footer-pre-banner">
      <span class="footer-cta-text">Your global career starts here. Explore visas today.</span>
      <div class="footer-btn-small">Check Eligibility Now →</div>
    </div>

    <div class="footer-columns">
      <div class="footer-col-brand">
        <div class="nav-brand-group">
          <span class="brand-emblem">VW</span>
          <span class="brand-title">VisaWala<span class="brand-dot-com">.com</span></span>
        </div>
        <p class="footer-bio">
          India's premier digital-first work visa consultancy empowering ambitious professionals to navigate international immigration laws and build borderless careers.
        </p>
        <div class="footer-licence-badge">Registered Global Advisory • ISO 9001:2015</div>
      </div>

      <div class="footer-nav-col">
        <span class="footer-heading">Work Visas</span>
        <span class="footer-link">Skilled Worker Visas</span>
        <span class="footer-link">Employer Sponsorship</span>
        <span class="footer-link">Job Seeker Pathways</span>
        <span class="footer-link">Global Talent Streams</span>
        <span class="footer-link">Intra-Company Transfers</span>
      </div>

      <div class="footer-nav-col">
        <span class="footer-heading">Top Destinations</span>
        <span class="footer-link">United Kingdom (UK)</span>
        <span class="footer-link">Canada (Express Entry)</span>
        <span class="footer-link">Germany (Opportunity Card)</span>
        <span class="footer-link">Australia (Subclass 186/482)</span>
        <span class="footer-link">United Arab Emirates (UAE)</span>
      </div>

      <div class="footer-nav-col">
        <span class="footer-heading">Resources & Legal</span>
        <span class="footer-link">Free Eligibility Calculator</span>
        <span class="footer-link">Points Matrix Guide</span>
        <span class="footer-link">Privacy Policy</span>
        <span class="footer-link">Terms & Conditions</span>
        <span class="footer-link">Disclaimer & Non-Affiliation</span>
      </div>
    </div>

    <div class="footer-bottom-row">
      <span class="footer-copy">© 2024–2025 VisaWala.com Advisory Private Limited. All rights reserved. Not affiliated with any government embassy.</span>
      <span class="footer-coords">19.0760° N, 72.8777° E — MUMBAI HEADQUARTERS</span>
    </div>
  </footer>

</body>
</html>
`;

fs.writeFileSync(path.join("scratch", "visawala_landing_page.html"), html, "utf-8");
console.log("Successfully generated scratch/visawala_landing_page.html! Size:", html.length);
