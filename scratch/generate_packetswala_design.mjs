import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\brijesh9177\\.gemini\\antigravity-ide\\brain\\8000d952-161e-4a7c-b841-2198aa68e271";

function getBase64(filename) {
  const filePath = path.join(ARTIFACT_DIR, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

const heroImg = getBase64("hero_packets_showcase_1789650913780.jpg");
const snackImg = getBase64("project_snack_pouch_1789650930928.jpg");
const teaImg = getBase64("project_tea_canister_1789650948099.jpg");
const spiceImg = getBase64("project_spice_carton_1789650964129.jpg");
const craftDetailImg = getBase64("print_craft_detail_1789650986986.jpg");

console.log("Images loaded successfully!");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>PacketsWala.Com — High-End Food Packaging Design Agency</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1440px;
    background-color: #0c0b0a;
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
    background-color: #0c0b0a;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 0 64px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .nav-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }
  .brand-logo-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
  .brand-badge {
    background-color: #ff4621;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    padding: 4px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
  .brand-wordmark {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .brand-dot-com {
    color: #ff4621;
  }
  .brand-descriptor {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: #8c867a;
    text-transform: uppercase;
    border-left: 1px solid rgba(255, 255, 255, 0.16);
    padding-left: 16px;
  }
  .nav-center {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 36px;
  }
  .nav-link {
    font-size: 13px;
    font-weight: 600;
    color: #cfcac0;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .nav-link-active {
    font-size: 13px;
    font-weight: 700;
    color: #ff4621;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .nav-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 18px;
  }
  .status-pill {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 40px;
    padding: 7px 16px;
    font-size: 11px;
    font-weight: 600;
    color: #a8a296;
    letter-spacing: 0.5px;
  }
  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #22c55e;
  }
  .btn-primary {
    background-color: #ff4621;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    padding: 12px 24px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  /* ─────────────────────────────────────────────────────────────
     2. HERO SECTION
  ───────────────────────────────────────────────────────────── */
  .hero-section {
    width: 1440px;
    background-color: #0c0b0a;
    padding: 56px 64px 80px 64px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .hero-meta-ticker {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding-bottom: 20px;
  }
  .ticker-item {
    font-size: 11.5px;
    font-weight: 700;
    color: #8c867a;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .ticker-highlight {
    color: #ff4621;
  }
  .hero-heading-block {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .hero-title {
    font-size: 82px;
    font-weight: 900;
    line-height: 86px;
    letter-spacing: -3.5px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .hero-title-accent {
    color: #ff4621;
  }
  .hero-lead-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 64px;
    margin-top: 12px;
  }
  .hero-statement {
    width: 680px;
    font-size: 20px;
    font-weight: 400;
    line-height: 32px;
    color: #bbb4a8;
  }
  .hero-statement strong {
    color: #ffffff;
    font-weight: 700;
  }
  .hero-actions-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: flex-end;
  }
  .hero-cta-group {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }
  .btn-hero-primary {
    background-color: #ff4621;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    padding: 16px 32px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
  .btn-hero-secondary {
    background-color: transparent;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    padding: 15px 30px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .hero-proof-text {
    font-size: 12px;
    font-weight: 600;
    color: #7d776c;
    letter-spacing: 0.5px;
  }

  /* Hero Showcase Canvas */
  .hero-visual-card {
    width: 1312px;
    height: 660px;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background-color: #141311;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 32px;
  }
  .hero-img-bg {
    width: 1312px;
    height: 660px;
    position: absolute;
    top: 0;
    left: 0;
    object-fit: cover;
  }
  .hero-overlay-top {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .tag-pill-dark {
    background-color: rgba(12, 11, 10, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 8px 16px;
    border-radius: 30px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .hero-overlay-bottom {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
  .caption-plate {
    background-color: rgba(12, 11, 10, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 20px 24px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 480px;
  }
  .caption-title {
    font-size: 16px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.2px;
  }
  .caption-subtitle {
    font-size: 12px;
    font-weight: 500;
    color: #a8a296;
    line-height: 18px;
  }
  .metrics-badge-cluster {
    background-color: rgba(12, 11, 10, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 18px 28px;
    border-radius: 12px;
    display: flex;
    flex-direction: row;
    gap: 36px;
  }
  .metric-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .metric-number {
    font-size: 26px;
    font-weight: 900;
    color: #ff4621;
    letter-spacing: -0.5px;
  }
  .metric-label {
    font-size: 10px;
    font-weight: 700;
    color: #cfcac0;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     3. THE SHELF REALITY (LIGHT SECTION)
  ───────────────────────────────────────────────────────────── */
  .statement-section {
    width: 1440px;
    background-color: #f7f4ee;
    color: #0c0b0a;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 64px;
  }
  .section-header-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #d8d3c7;
    padding-bottom: 20px;
  }
  .section-index {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #ff4621;
    text-transform: uppercase;
  }
  .section-category {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #767064;
    text-transform: uppercase;
  }
  .statement-hero-text {
    font-size: 54px;
    font-weight: 900;
    line-height: 62px;
    letter-spacing: -2px;
    color: #0c0b0a;
    max-width: 1180px;
  }
  .statement-hero-text span {
    color: #ff4621;
  }
  .pillars-grid {
    display: flex;
    flex-direction: row;
    gap: 28px;
  }
  .pillar-card {
    flex: 1;
    background-color: #ffffff;
    border: 1px solid #e2ddd3;
    border-radius: 12px;
    padding: 40px 32px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 320px;
  }
  .pillar-top {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pillar-num {
    font-size: 13px;
    font-weight: 900;
    color: #ff4621;
    letter-spacing: 1px;
  }
  .pillar-title {
    font-size: 22px;
    font-weight: 800;
    line-height: 28px;
    color: #0c0b0a;
    letter-spacing: -0.5px;
  }
  .pillar-desc {
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: #5c574c;
  }
  .pillar-badge {
    align-self: flex-start;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #0c0b0a;
    border: 1px solid #0c0b0a;
    padding: 4px 10px;
    border-radius: 4px;
  }

  /* ─────────────────────────────────────────────────────────────
     4. SELECTED WORK (PORTFOLIO SHOWCASE)
  ───────────────────────────────────────────────────────────── */
  .work-section {
    width: 1440px;
    background-color: #0c0b0a;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 64px;
  }
  .work-header-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding-bottom: 24px;
  }
  .work-headline-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .work-headline {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -2px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .work-view-all {
    font-size: 13px;
    font-weight: 800;
    color: #ff4621;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Project Card 1: Giant Showcase */
  .project-featured-card {
    width: 1312px;
    background-color: #141311;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    height: 580px;
  }
  .project-featured-visual {
    width: 760px;
    height: 580px;
    position: relative;
    background-color: #1a1816;
  }
  .project-featured-img {
    width: 760px;
    height: 580px;
    object-fit: cover;
  }
  .project-featured-info {
    width: 552px;
    padding: 56px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #12110f;
  }
  .project-tags-row {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
  .tag-spec {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #ff4621;
    border: 1px solid rgba(255, 70, 33, 0.4);
    padding: 5px 12px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .tag-dark {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #bbb4a8;
    background-color: rgba(255, 255, 255, 0.06);
    padding: 5px 12px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .project-meta-block {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .project-client-name {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #ffffff;
    line-height: 42px;
  }
  .project-brief-desc {
    font-size: 15px;
    font-weight: 400;
    line-height: 24px;
    color: #9e978a;
  }
  .project-stats-footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 24px;
  }
  .project-stat-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .project-stat-val {
    font-size: 18px;
    font-weight: 800;
    color: #ffffff;
  }
  .project-stat-lbl {
    font-size: 10px;
    font-weight: 600;
    color: #7d776c;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Projects 2 & 3: Dual Editorial Grid */
  .projects-dual-grid {
    display: flex;
    flex-direction: row;
    gap: 32px;
  }
  .project-card-half {
    width: 640px;
    background-color: #141311;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .project-half-visual {
    width: 640px;
    height: 440px;
    position: relative;
    background-color: #1a1816;
  }
  .project-half-img {
    width: 640px;
    height: 440px;
    object-fit: cover;
  }
  .project-half-info {
    padding: 36px 36px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background-color: #12110f;
  }
  .project-half-title {
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #ffffff;
  }
  .project-half-desc {
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: #9e978a;
  }

  /* ─────────────────────────────────────────────────────────────
     5. SERVICES SPECTRUM (DEEP FOREST ACCENT)
  ───────────────────────────────────────────────────────────── */
  .services-section {
    width: 1440px;
    background-color: #101c15;
    color: #ffffff;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .services-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding-bottom: 28px;
  }
  .services-title {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -2px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .services-list {
    display: flex;
    flex-direction: column;
  }
  .service-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 32px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .service-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 48px;
  }
  .service-index {
    font-size: 16px;
    font-weight: 900;
    color: #ff4621;
    letter-spacing: 1px;
    width: 40px;
  }
  .service-name {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #ffffff;
  }
  .service-center {
    width: 440px;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: #a3b8aa;
  }
  .service-tags {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
  .service-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 6px 12px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     6. WHY PACKETSWALA / CRAFT & MATERIALITY
  ───────────────────────────────────────────────────────────── */
  .why-section {
    width: 1440px;
    background-color: #0c0b0a;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .why-split-grid {
    display: flex;
    flex-direction: row;
    gap: 48px;
    align-items: stretch;
  }
  .why-visual-col {
    width: 632px;
    background-color: #141311;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .why-img {
    width: 632px;
    height: 440px;
    object-fit: cover;
  }
  .why-visual-caption {
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: #12110f;
  }
  .why-caption-title {
    font-size: 15px;
    font-weight: 800;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .why-caption-sub {
    font-size: 13px;
    font-weight: 400;
    color: #8c867a;
    line-height: 20px;
  }
  .why-narrative-col {
    width: 632px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px 0;
  }
  .why-headline {
    font-size: 42px;
    font-weight: 900;
    line-height: 48px;
    letter-spacing: -1.5px;
    color: #ffffff;
    text-transform: uppercase;
  }
  .why-headline span {
    color: #ff4621;
  }
  .why-reasons-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .reason-box {
    background-color: #141311;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .reason-title {
    font-size: 16px;
    font-weight: 800;
    color: #ffffff;
  }
  .reason-text {
    font-size: 13px;
    font-weight: 400;
    line-height: 20px;
    color: #9e978a;
  }

  /* ─────────────────────────────────────────────────────────────
     7. THE 4-STEP PROCESS (LIGHT SECTION)
  ───────────────────────────────────────────────────────────── */
  .process-section {
    width: 1440px;
    background-color: #f7f4ee;
    color: #0c0b0a;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .process-grid {
    display: flex;
    flex-direction: row;
    gap: 24px;
  }
  .process-step-card {
    flex: 1;
    background-color: #ffffff;
    border: 1px solid #e2ddd3;
    border-radius: 12px;
    padding: 36px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 340px;
  }
  .step-top {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .step-phase-badge {
    font-size: 11px;
    font-weight: 900;
    color: #ff4621;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .step-title {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0c0b0a;
  }
  .step-desc {
    font-size: 13.5px;
    font-weight: 400;
    line-height: 22px;
    color: #5c574c;
  }
  .step-deliverables {
    font-size: 11px;
    font-weight: 700;
    color: #767064;
    letter-spacing: 0.5px;
    border-top: 1px solid #ede8de;
    padding-top: 16px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     8. DRAMATIC BRAND MANIFESTO (ELECTRIC SAFFRON)
  ───────────────────────────────────────────────────────────── */
  .manifesto-section {
    width: 1440px;
    background-color: #ff4621;
    color: #ffffff;
    padding: 96px 64px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .manifesto-tag {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 2.5px;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
  }
  .manifesto-quote {
    font-size: 58px;
    font-weight: 900;
    line-height: 64px;
    letter-spacing: -2px;
    color: #ffffff;
    text-transform: uppercase;
    max-width: 1240px;
  }
  .manifesto-signoff {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.25);
    padding-top: 24px;
  }
  .manifesto-author {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .manifesto-pill {
    background-color: #ffffff;
    color: #ff4621;
    font-size: 11px;
    font-weight: 900;
    padding: 6px 14px;
    border-radius: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* ─────────────────────────────────────────────────────────────
     9. FINAL CONVERSION CTA
  ───────────────────────────────────────────────────────────── */
  .cta-section {
    width: 1440px;
    background-color: #0c0b0a;
    padding: 112px 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 40px;
  }
  .cta-badge {
    background-color: rgba(255, 70, 33, 0.12);
    border: 1px solid rgba(255, 70, 33, 0.3);
    color: #ff4621;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 18px;
    border-radius: 30px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .cta-headline {
    font-size: 68px;
    font-weight: 900;
    line-height: 74px;
    letter-spacing: -3px;
    color: #ffffff;
    text-transform: uppercase;
    max-width: 980px;
  }
  .cta-subtitle {
    font-size: 18px;
    font-weight: 400;
    line-height: 28px;
    color: #a8a296;
    max-width: 680px;
  }
  .cta-button-group {
    display: flex;
    flex-direction: row;
    gap: 20px;
  }
  .btn-cta-large {
    background-color: #ff4621;
    color: #ffffff;
    font-size: 15px;
    font-weight: 900;
    padding: 18px 40px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .btn-cta-outline {
    background-color: transparent;
    color: #ffffff;
    font-size: 15px;
    font-weight: 800;
    padding: 17px 36px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .cta-contacts-strip {
    display: flex;
    flex-direction: row;
    gap: 48px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 36px;
    margin-top: 16px;
  }
  .contact-detail-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
  }
  .contact-detail-title {
    font-size: 11px;
    font-weight: 700;
    color: #767064;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .contact-detail-val {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
  }

  /* ─────────────────────────────────────────────────────────────
     10. EDITORIAL FOOTER
  ───────────────────────────────────────────────────────────── */
  .footer {
    width: 1440px;
    background-color: #060505;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding: 72px 64px 48px 64px;
    display: flex;
    flex-direction: column;
    gap: 56px;
  }
  .footer-columns-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .footer-col-brand {
    width: 380px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .footer-desc {
    font-size: 13px;
    font-weight: 400;
    line-height: 22px;
    color: #8c867a;
  }
  .footer-award-badge {
    align-self: flex-start;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    color: #ff4621;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .footer-col-links {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .footer-link-heading {
    font-size: 11px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .footer-link-item {
    font-size: 13px;
    font-weight: 500;
    color: #8c867a;
  }
  .footer-bottom-bar {
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
    color: #635f56;
  }
  .footer-coords {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #635f56;
    text-transform: uppercase;
  }
</style>
</head>
<body>

  <!-- 1. TOP NAVIGATION -->
  <header class="navbar">
    <div class="nav-left">
      <div class="brand-logo-group">
        <span class="brand-badge">PW</span>
        <span class="brand-wordmark">PacketsWala<span class="brand-dot-com">.Com</span></span>
      </div>
      <span class="brand-descriptor">Food Packaging Atelier</span>
    </div>
    <div class="nav-center">
      <span class="nav-link-active">Work</span>
      <span class="nav-link">Services</span>
      <span class="nav-link">Philosophy</span>
      <span class="nav-link">Process</span>
      <span class="nav-link">Journal</span>
    </div>
    <div class="nav-right">
      <div class="status-pill">
        <span class="live-dot"></span>
        <span>Accepting Q4 Projects</span>
      </div>
      <div class="btn-primary">Start a Project →</div>
    </div>
  </header>

  <!-- 2. HERO SECTION -->
  <section class="hero-section">
    <div class="hero-meta-ticker">
      <span class="ticker-item">Awwwards SOTD Nominee</span>
      <span class="ticker-item">Shelf Recall Rate: <span class="ticker-highlight">98.4%</span></span>
      <span class="ticker-item">Mumbai • London • Dubai</span>
      <span class="ticker-item">Edition 2024 / 2025</span>
    </div>

    <div class="hero-heading-block">
      <h1 class="hero-title">
        Packaging That Makes<br />
        Food <span class="hero-title-accent">Impossible</span> To Ignore.
      </h1>

      <div class="hero-lead-row">
        <p class="hero-statement">
          We craft shelf-dominating <strong>pouches, boxes, and wrappers</strong> for ambitious food & beverage brands who refuse to blend into supermarket background noise.
        </p>
        <div class="hero-actions-col">
          <div class="hero-cta-group">
            <div class="btn-hero-primary">Start a Project →</div>
            <div class="btn-hero-secondary">Explore Our Work ↓</div>
          </div>
          <span class="hero-proof-text">140+ Food Brands Launched • 38 Design Awards</span>
        </div>
      </div>
    </div>

    <!-- Hero Visual Showcase -->
    <div class="hero-visual-card">
      <img class="hero-img-bg" src="${heroImg}" alt="PacketsWala Food Packaging Showcase" />
      <div class="hero-overlay-top">
        <div class="tag-pill-dark">FEATURED ARCHIVE / VOL. 04</div>
        <div class="tag-pill-dark">TACTILE PRINT & STRUCTURE</div>
      </div>
      <div class="hero-overlay-bottom">
        <div class="caption-plate">
          <div class="caption-title">Aether Dark Roast & Roots Organic Cacao</div>
          <div class="caption-subtitle">Custom Matte Black Degassing Doypack & Textured Kraft Resealable Pouches with Copper Foil Embossing.</div>
        </div>
        <div class="metrics-badge-cluster">
          <div class="metric-item">
            <span class="metric-number">+310%</span>
            <span class="metric-label">Shelf Recall</span>
          </div>
          <div class="metric-item">
            <span class="metric-number">100%</span>
            <span class="metric-label">Recyclable Substrate</span>
          </div>
          <div class="metric-item">
            <span class="metric-number">3.2s</span>
            <span class="metric-label">Grab Decision</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. THE SHELF REALITY (LIGHT SECTION) -->
  <section class="statement-section">
    <div class="section-header-row">
      <span class="section-index">[ 01 / THE PHILOSOPHY ]</span>
      <span class="section-category">Behavioral Packaging Science</span>
    </div>

    <h2 class="statement-hero-text">
      "In retail, you don’t get 30 seconds of brand storytelling. <span>You get 3 seconds at eye level</span>. If your packet doesn’t trigger desire instantly, your product dies on the shelf."
    </h2>

    <div class="pillars-grid">
      <div class="pillar-card">
        <div class="pillar-top">
          <span class="pillar-num">01 / RETINAL CONTRAST</span>
          <h3 class="pillar-title">Shelf Heatmap Dominance</h3>
          <p class="pillar-desc">
            We engineer silhouette contrast and pigment saturation calibrated against surrounding category competitors so your packet immediately captures peripheral vision.
          </p>
        </div>
        <span class="pillar-badge">Visual Science</span>
      </div>

      <div class="pillar-card">
        <div class="pillar-top">
          <span class="pillar-num">02 / HAPTIC SENSATION</span>
          <h3 class="pillar-title">Tactile Touch Desire</h3>
          <p class="pillar-desc">
            Soft-touch velvet laminations, embossed micro-textures, and premium cold foils that create an irresistible physical connection the moment a shopper picks it up.
          </p>
        </div>
        <span class="pillar-badge">Print Finishes</span>
      </div>

      <div class="pillar-card">
        <div class="pillar-top">
          <span class="pillar-num">03 / SENSORY APPETITE</span>
          <h3 class="pillar-title">Flavour Anticipation</h3>
          <p class="pillar-desc">
            Visual flavor mapping that communicates crunch, spice, richness, or aroma before the consumer ever pulls the tear notch or breaks the seal.
          </p>
        </div>
        <span class="pillar-badge">Neuro-Design</span>
      </div>
    </div>
  </section>

  <!-- 4. SELECTED WORK (EDITORIAL SHOWCASE) -->
  <section class="work-section">
    <div class="work-header-row">
      <div class="work-headline-group">
        <span class="section-index">[ 02 / SELECTED WORK ]</span>
        <h2 class="work-headline">PACKAGING ARCHIVE</h2>
      </div>
      <span class="work-view-all">View All 42 Projects →</span>
    </div>

    <!-- Project 1: Featured Giant Showcase -->
    <div class="project-featured-card">
      <div class="project-featured-visual">
        <img class="project-featured-img" src="${snackImg}" alt="Krunch Craft Gourmet Snack Packaging" />
      </div>
      <div class="project-featured-info">
        <div class="project-tags-row">
          <span class="tag-spec">STAND-UP DOYPACK</span>
          <span class="tag-dark">GOURMET SNACKS</span>
          <span class="tag-dark">MATTE & GLOSS SPOT UV</span>
        </div>
        <div class="project-meta-block">
          <h3 class="project-client-name">KRUNCH CRAFT GOURMET</h3>
          <p class="project-brief-desc">
            Disrupting the artisanal snack aisle with high-energy geometric facets, electric saffron orange color blocking, and tactile matte soft-touch finish engineered for supermarket dominance.
          </p>
        </div>
        <div class="project-stats-footer">
          <div class="project-stat-col">
            <span class="project-stat-val">+420%</span>
            <span class="project-stat-lbl">Q1 Retail Velocity</span>
          </div>
          <div class="project-stat-col">
            <span class="project-stat-val">Rotogravure</span>
            <span class="project-stat-lbl">9-Color Print Spec</span>
          </div>
          <div class="project-stat-col">
            <span class="project-stat-val">Best in Show</span>
            <span class="project-stat-lbl">Packaging Design 2024</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Projects 2 & 3: Dual Grid -->
    <div class="projects-dual-grid">
      <div class="project-card-half">
        <div class="project-half-visual">
          <img class="project-half-img" src="${teaImg}" alt="Koto Organics Luxury Botanical Tea" />
        </div>
        <div class="project-half-info">
          <div class="project-tags-row">
            <span class="tag-spec">TEA POUCH & TIN</span>
            <span class="tag-dark">HOT FOIL EMBOSS</span>
          </div>
          <h3 class="project-half-title">KOTO ORGANICS BOTANICALS</h3>
          <p class="project-half-desc">
            A serene Japanese-inspired packaging architecture combining deep forest green barrier pouches with hot-stamped gold botanical illustrations and matching cylindrical tin canisters.
          </p>
        </div>
      </div>

      <div class="project-card-half">
        <div class="project-half-visual">
          <img class="project-half-img" src="${spiceImg}" alt="Spice Stories Artisan Collection" />
        </div>
        <div class="project-half-info">
          <div class="project-tags-row">
            <span class="tag-spec">RIGID SLIDE BOX</span>
            <span class="tag-dark">HERITAGE SPICES</span>
          </div>
          <h3 class="project-half-title">SPICE STORIES ROYAL COLLECTION</h3>
          <p class="project-half-desc">
            Transforming Indian heirloom spices into a luxury unboxing experience. Terracotta kraft slide-out rigid boxes housing individual airtight foil sachets with intricate gold ornamentation.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. SERVICES SPECTRUM (DEEP FOREST ACCENT) -->
  <section class="services-section">
    <div class="services-header">
      <span class="section-index">[ 03 / CAPABILITIES ]</span>
      <h2 class="services-title">WHAT WE CRAFT FOR SHELF PROMINENCE</h2>
    </div>

    <div class="services-list">
      <div class="service-row">
        <div class="service-left">
          <span class="service-index">01</span>
          <h3 class="service-name">Food Packaging Design</h3>
        </div>
        <p class="service-center">
          Stand-up doypacks, zipper pouches, pillow packets, vacuum pouches, flow wraps, rigid food cartons, and unboxing systems.
        </p>
        <div class="service-tags">
          <span class="service-tag">Pouches</span>
          <span class="service-tag">Flow-Wraps</span>
          <span class="service-tag">Cartons</span>
        </div>
      </div>

      <div class="service-row">
        <div class="service-left">
          <span class="service-index">02</span>
          <h3 class="service-name">Brand Identity & Shelf Architecture</h3>
        </div>
        <p class="service-center">
          Custom wordmarks, typography systems, color zoning, category hierarchies, and retail visual architecture for growing food portfolios.
        </p>
        <div class="service-tags">
          <span class="service-tag">Wordmarks</span>
          <span class="service-tag">Color Systems</span>
        </div>
      </div>

      <div class="service-row">
        <div class="service-left">
          <span class="service-index">03</span>
          <h3 class="service-name">Pouch & Packet Engineering</h3>
        </div>
        <p class="service-center">
          Substrate selection, EVOH barrier films, tear-notch positioning, degas valve specs, press-to-close zippers, and sustainable compostable foils.
        </p>
        <div class="service-tags">
          <span class="service-tag">Barrier Films</span>
          <span class="service-tag">Dielines</span>
        </div>
      </div>

      <div class="service-row">
        <div class="service-left">
          <span class="service-index">04</span>
          <h3 class="service-name">Label & High-End Finishes</h3>
        </div>
        <p class="service-center">
          Cold/hot foil stamping, tactile debossing, micro-embossing, spot UV varnishes, holographic security seals, and premium uncoated papers.
        </p>
        <div class="service-tags">
          <span class="service-tag">Foil Stamping</span>
          <span class="service-tag">Spot UV</span>
        </div>
      </div>

      <div class="service-row">
        <div class="service-left">
          <span class="service-index">05</span>
          <h3 class="service-name">Structural Box & Carton Design</h3>
        </div>
        <p class="service-center">
          Bespoke dieline prototyping, rigid gift boxes, corrugated shipper displays, shelf-ready packaging (SRP), and retail display trays.
        </p>
        <div class="service-tags">
          <span class="service-tag">Rigid Boxes</span>
          <span class="service-tag">SRP Display</span>
        </div>
      </div>

      <div class="service-row">
        <div class="service-left">
          <span class="service-index">06</span>
          <h3 class="service-name">Packaging Strategy & Shelf Audits</h3>
        </div>
        <p class="service-center">
          In-store competitor benchmarking, eye-tracking simulation, FSSAI/FDA nutritional compliance review, and commercial print supervision.
        </p>
        <div class="service-tags">
          <span class="service-tag">Retail Audits</span>
          <span class="service-tag">Compliance</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 6. WHY PACKETSWALA / CRAFT & MATERIALITY -->
  <section class="why-section">
    <div class="section-header-row" style="border-bottom-color: rgba(255,255,255,0.12);">
      <span class="section-index">[ 04 / WHY PACKETSWALA.COM ]</span>
      <span class="section-category" style="color: #bbb4a8;">Zero Generic Templates</span>
    </div>

    <div class="why-split-grid">
      <div class="why-visual-col">
        <img class="why-img" src="${craftDetailImg}" alt="Micro-level packaging print craft and foil stamping" />
        <div class="why-visual-caption">
          <span class="why-caption-title">MICRON-LEVEL DIELINE ACCURACY & FINISH CONTROL</span>
          <span class="why-caption-sub">Every fold, emboss depth, and varnish boundary is calibrated with factory pre-press precision.</span>
        </div>
      </div>

      <div class="why-narrative-col">
        <h2 class="why-headline">WE DON'T JUST DESIGN.<br /><span>WE REVOLUTIONIZE</span> YOUR SHELF PRESENCE.</h2>
        <div class="why-reasons-list">
          <div class="reason-box">
            <span class="reason-title">01 / Retail Heatmap Science</span>
            <span class="reason-text">Our designs are tested under fluorescent supermarket lighting to ensure maximum focal point prominence from 6 feet away.</span>
          </div>
          <div class="reason-box">
            <span class="reason-title">02 / Factory-Grade Pre-Press Dielines</span>
            <span class="reason-text">Zero print delays. We deliver production-certified dielines that converters, pouch makers, and flexo printers approve on first submission.</span>
          </div>
          <div class="reason-box">
            <span class="reason-title">03 / Appetite-Inducing Materiality</span>
            <span class="reason-text">We specify tactile substrates that feel substantial and luxurious in the hand, reinforcing the gourmet quality inside the pack.</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 7. THE 4-STEP PROCESS (LIGHT SECTION) -->
  <section class="process-section">
    <div class="section-header-row">
      <span class="section-index">[ 05 / THE ROADMAP ]</span>
      <span class="section-category">From Brief to Retail Shelf</span>
    </div>

    <div class="process-grid">
      <div class="process-step-card">
        <div class="step-top">
          <span class="step-phase-badge">STAGE 01</span>
          <h3 class="step-title">Discover</h3>
          <p class="step-desc">
            Deep dive into your product formulation, target consumer psychology, retail channel dynamics, and competitor shelf gap analysis.
          </p>
        </div>
        <span class="step-deliverables">Audits • Strategy Deck</span>
      </div>

      <div class="process-step-card">
        <div class="step-top">
          <span class="step-phase-badge">STAGE 02</span>
          <h3 class="step-title">Concept</h3>
          <p class="step-desc">
            We present 3 radically distinct creative routes exploring visual contrast, storytelling, typography hierarchy, and substrate materiality.
          </p>
        </div>
        <span class="step-deliverables">3 Creative Directions</span>
      </div>

      <div class="process-step-card">
        <div class="step-top">
          <span class="step-phase-badge">STAGE 03</span>
          <h3 class="step-title">Design</h3>
          <p class="step-desc">
            Comprehensive 3D packaging visualizations, Pantone spot-color calibration, mandatory legal/nutritional layout, and tactile finish specifications.
          </p>
        </div>
        <span class="step-deliverables">3D Renders • Color Proofs</span>
      </div>

      <div class="process-step-card">
        <div class="step-top">
          <span class="step-phase-badge">STAGE 04</span>
          <h3 class="step-title">Launch</h3>
          <p class="step-desc">
            Preparation of production-ready vector dielines, coordination with your print vendor, press-check supervision, and retail hero mockups.
          </p>
        </div>
        <span class="step-deliverables">Production Files • Print Sign-Off</span>
      </div>
    </div>
  </section>

  <!-- 8. DRAMATIC BRAND MANIFESTO (ELECTRIC SAFFRON) -->
  <section class="manifesto-section">
    <span class="manifesto-tag">THE PACKETSWALA MANIFESTO</span>
    <h2 class="manifesto-quote">
      "WE DON'T JUST WRAP FOOD.<br />
      WE ENGINEER THE SENSATION OF HUNGER BEFORE THE PACKET IS EVEN OPENED."
    </h2>
    <div class="manifesto-signoff">
      <span class="manifesto-author">PacketsWala.Com Creative Atelier • Est. 2024</span>
      <span class="manifesto-pill">Shelf Dominance Guaranteed</span>
    </div>
  </section>

  <!-- 9. FINAL CONVERSION CTA -->
  <section class="cta-section">
    <div class="cta-badge">LET'S BUILD YOUR NEXT SHELF HERO</div>
    <h2 class="cta-headline">
      Ready To Make Your Packaging Stand Out?
    </h2>
    <p class="cta-subtitle">
      Book a 30-minute creative consultation with our packaging directors. We'll audit your current packaging and outline a roadmap for retail dominance.
    </p>
    <div class="cta-button-group">
      <div class="btn-cta-large">Start Your Project →</div>
      <div class="btn-cta-outline">Schedule a Call ☎</div>
    </div>
    <div class="cta-contacts-strip">
      <div class="contact-detail-col">
        <span class="contact-detail-title">Direct Studio Email</span>
        <span class="contact-detail-val">hello@packetswala.com</span>
      </div>
      <div class="contact-detail-col">
        <span class="contact-detail-title">Studio Hotline</span>
        <span class="contact-detail-val">+91 98200 PACKETS</span>
      </div>
      <div class="contact-detail-col">
        <span class="contact-detail-title">Studio Locations</span>
        <span class="contact-detail-val">Mumbai • London • Dubai</span>
      </div>
    </div>
  </section>

  <!-- 10. EDITORIAL FOOTER -->
  <footer class="footer">
    <div class="footer-columns-row">
      <div class="footer-col-brand">
        <div class="brand-logo-group">
          <span class="brand-badge">PW</span>
          <span class="brand-wordmark">PacketsWala<span class="brand-dot-com">.Com</span></span>
        </div>
        <p class="footer-desc">
          High-end creative food packaging design agency crafting shelf-dominating pouches, boxes, wrappers, and visual identities for visionary food & beverage brands globally.
        </p>
        <div class="footer-award-badge">★ Awwwards SOTD Nominee 2024</div>
      </div>

      <div class="footer-col-links">
        <span class="footer-link-heading">Navigation</span>
        <span class="footer-link-item">Selected Work</span>
        <span class="footer-link-item">Capabilities</span>
        <span class="footer-link-item">The Philosophy</span>
        <span class="footer-link-item">Process Roadmap</span>
        <span class="footer-link-item">Journal & Insights</span>
      </div>

      <div class="footer-col-links">
        <span class="footer-link-heading">Packaging Disciplines</span>
        <span class="footer-link-item">Stand-Up Pouches (Doypacks)</span>
        <span class="footer-link-item">Gourmet Snack Packaging</span>
        <span class="footer-link-item">Coffee & Tea Packet Systems</span>
        <span class="footer-link-item">Rigid Gift Box Dielines</span>
        <span class="footer-link-item">Eco-Friendly Barrier Foils</span>
      </div>

      <div class="footer-col-links">
        <span class="footer-link-heading">Connect</span>
        <span class="footer-link-item">Instagram (@packetswala)</span>
        <span class="footer-link-item">Behance Portfolio</span>
        <span class="footer-link-item">LinkedIn Atelier</span>
        <span class="footer-link-item">Dribbble Pro</span>
      </div>
    </div>

    <div class="footer-bottom-bar">
      <span class="footer-copy">© 2024 PacketsWala.Com Studio. All rights reserved. Registered Food Packaging Agency.</span>
      <span class="footer-coords">19.0760° N, 72.8777° E — MUMBAI ATELIER</span>
    </div>
  </footer>

</body>
</html>
`;

fs.writeFileSync(path.join("scratch", "packetswala_landing_page.html"), html, "utf-8");
console.log("Generated scratch/packetswala_landing_page.html successfully! Size:", html.length);
