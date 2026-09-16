import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\brijesh9177\\.gemini\\antigravity-ide\\brain\\8000d952-161e-4a7c-b841-2198aa68e271";

function getBase64(filename) {
  const filePath = path.join(ARTIFACT_DIR, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

const heroBg = getBase64("hero_studio_bg_1789552153610.jpg");
const stripeUi = getBase64("stripe_billing_ui_1789552081166.jpg");
const linearUi = getBase64("linear_mobile_ui_1789552100524.jpg");
const raycastUi = getBase64("raycast_ai_ui_1789552115798.jpg");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Alexander Chen — Staff UI/UX Product Designer</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1440px;
    background-color: #ffffff;
    color: #0f172a;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* Sticky Navigation */
  .navbar {
    width: 1440px;
    height: 76px;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 64px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .nav-brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
  .brand-monogram {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background-color: #4f46e5;
    color: #ffffff;
    font-weight: 700;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .brand-name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.2px;
  }
  .brand-subtitle {
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
  }
  .nav-menu {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 32px;
  }
  .nav-item-active {
    font-size: 13.5px;
    font-weight: 600;
    color: #4f46e5;
  }
  .nav-item {
    font-size: 13.5px;
    font-weight: 500;
    color: #475569;
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
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 11.5px;
    font-weight: 600;
    color: #047857;
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 4px;
    background-color: #10b981;
  }
  .btn-nav-cta {
    background-color: #4f46e5;
    color: #ffffff;
    font-size: 12.5px;
    font-weight: 600;
    padding: 10px 18px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 1. Full-Width Hero Section with Real Studio Background Image */
  .hero-section {
    width: 1440px;
    padding: 72px 64px;
    background-image: url('${heroBg}');
    background-size: cover;
    background-position: center;
    background-color: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
  }
  .hero-content-box {
    background-color: rgba(255, 255, 255, 0.94);
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 48px 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 1180px;
  }
  .hero-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 20px;
    padding: 7px 18px;
    font-size: 12px;
    font-weight: 700;
    color: #4338ca;
  }
  .hero-title {
    width: 1020px;
    font-size: 44px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.22;
    letter-spacing: -0.8px;
  }
  .hero-description {
    width: 860px;
    font-size: 16px;
    font-weight: 500;
    color: #475569;
    line-height: 1.6;
  }
  .hero-cta-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    margin-top: 6px;
  }
  .btn-primary-hero {
    background-color: #4f46e5;
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    padding: 13px 26px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-secondary-hero {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
    padding: 13px 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Brands / Trust Bar */
  .trust-bar {
    width: 1180px;
    padding: 22px 32px;
    background-color: rgba(255, 255, 255, 0.94);
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .trust-label {
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.8px;
    color: #64748b;
  }
  .brands-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 48px;
  }
  .brand-logo-text {
    font-size: 15px;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.4px;
  }

  /* 2. Selected Case Studies with Real Project UI Mockups */
  .case-studies-section {
    width: 1440px;
    padding: 80px 64px;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  .section-intro {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
  .section-titles {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .section-eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #4f46e5;
  }
  .section-heading {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.4px;
  }
  .section-desc {
    font-size: 14px;
    color: #64748b;
  }

  /* Case Study Cards Stack */
  .cases-stack {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .case-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 36px 40px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
  }
  .case-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
  }
  .case-header-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
  .case-tag {
    background-color: #eef2ff;
    color: #4338ca;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
  }
  .case-title {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
  }
  .case-summary {
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
  }
  .case-metrics-row {
    display: flex;
    flex-direction: row;
    gap: 16px;
    margin-top: 4px;
  }
  .metric-badge-box {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .metric-stat {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
  }
  .metric-stat-label {
    font-size: 10.5px;
    font-weight: 600;
    color: #64748b;
  }
  .case-footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
    margin-top: 8px;
  }
  .case-role {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }
  .btn-case-link {
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
  }

  /* Right Visual Panel inside Case Card */
  .case-visual-preview {
    width: 380px;
    height: 240px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
  }
  .case-image {
    width: 380px;
    height: 240px;
    border-radius: 12px;
    display: block;
    object-fit: cover;
  }

  /* 3. Highlighted How It Works / Philosophy Section */
  .philosophy-section {
    width: 1440px;
    padding: 88px 64px;
    background-color: #eef2ff;
    border-top: 1px solid #c7d2fe;
    border-bottom: 1px solid #c7d2fe;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .philosophy-grid {
    display: flex;
    flex-direction: row;
    gap: 28px;
  }
  .phil-card {
    flex: 1;
    background-color: #ffffff;
    border: 1px solid #c7d2fe;
    border-radius: 16px;
    padding: 36px 30px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .phil-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: #4f46e5;
    color: #ffffff;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
  .phil-title {
    font-size: 19px;
    font-weight: 700;
    color: #0f172a;
  }
  .phil-body {
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
  }

  /* Career Journey Section */
  .experience-section {
    width: 1440px;
    padding: 80px 64px;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 36px;
  }
  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .timeline-item {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px 28px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .timeline-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }
  .timeline-period {
    font-size: 12.5px;
    font-weight: 700;
    color: #4f46e5;
    width: 140px;
  }
  .timeline-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .timeline-role {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }
  .timeline-company {
    font-size: 12px;
    color: #64748b;
  }
  .timeline-tag {
    background-color: #f1f5f9;
    color: #334155;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
  }

  /* 4. Recommendations with Profile Photos */
  .testimonials-section {
    width: 1440px;
    padding: 80px 64px;
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 36px;
  }
  .testimonials-grid {
    display: flex;
    flex-direction: row;
    gap: 24px;
  }
  .testimonial-card {
    flex: 1;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 24px;
  }
  .testimonial-quote {
    font-size: 15px;
    color: #1e293b;
    line-height: 1.65;
    font-style: italic;
  }
  .testimonial-author {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14px;
  }
  .author-photo {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    display: block;
    object-fit: cover;
  }
  .author-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .author-name {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }
  .author-role {
    font-size: 11.5px;
    color: #64748b;
  }

  /* 5. Book a Call Section with Functional Highlighted CTA Button */
  .booking-section {
    width: 1440px;
    padding: 80px 64px;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .booking-card {
    width: 1312px;
    background-color: #ffffff;
    border: 1px solid #c7d2fe;
    border-radius: 20px;
    padding: 56px 64px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 64px;
  }
  .booking-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .booking-tag {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #4f46e5;
  }
  .booking-heading {
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.25;
  }
  .booking-desc {
    font-size: 15px;
    color: #475569;
    line-height: 1.6;
  }
  .booking-perks {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }
  .perk-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
  .perk-bullet {
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background-color: #e0e7ff;
    color: #4338ca;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .perk-text {
    font-size: 13.5px;
    font-weight: 500;
    color: #334155;
  }
  .booking-form-box {
    width: 460px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .form-title {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-label {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
  }
  .form-input {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .input-placeholder {
    font-size: 13px;
    color: #94a3b8;
  }
  .btn-submit-booking {
    background-color: #4f46e5;
    border-radius: 8px;
    padding: 14px 24px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
  }
  .btn-submit-text {
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
  }
  .form-subtext {
    font-size: 11px;
    color: #64748b;
    text-align: center;
  }

  /* Footer Section */
  .footer-cta-section {
    width: 1440px;
    padding: 80px 64px 48px;
    background-color: #0f172a;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .footer-cta-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 48px;
    border-bottom: 1px solid #1e293b;
  }
  .footer-cta-text {
    width: 760px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .footer-cta-title {
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
  }
  .footer-cta-sub {
    font-size: 14.5px;
    color: #94a3b8;
  }
  .footer-cta-btns {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14px;
  }
  .btn-footer-primary {
    background-color: #6366f1;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    padding: 12px 22px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-footer-email {
    background-color: #1e293b;
    border: 1px solid #334155;
    color: #f1f5f9;
    font-size: 13px;
    font-weight: 600;
    padding: 12px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .footer-bottom-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .copyright-text {
    font-size: 12px;
    color: #64748b;
  }
  .footer-socials {
    display: flex;
    flex-direction: row;
    gap: 20px;
  }
  .social-item {
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
  }
</style>
</head>
<body>

  <!-- Sticky Navbar -->
  <header class="navbar">
    <div class="nav-brand">
      <div class="brand-monogram">AC</div>
      <div class="brand-text">
        <div class="brand-name">ALEXANDER CHEN</div>
        <div class="brand-subtitle">Staff UI/UX Designer &amp; Design Technologist</div>
      </div>
    </div>

    <nav class="nav-menu">
      <div class="nav-item-active">Selected Work</div>
      <div class="nav-item">Philosophy</div>
      <div class="nav-item">Experience</div>
      <div class="nav-item">Testimonials</div>
    </nav>

    <div class="nav-actions">
      <div class="status-badge">
        <div class="status-dot"></div>
        <div>Available for Q4 / Q1 Projects</div>
      </div>
      <div class="btn-nav-cta">Book a Call</div>
    </div>
  </header>

  <!-- 1. Full-Width Hero Section with Real Studio Background Image -->
  <section class="hero-section">
    <div class="hero-content-box">
      <div class="hero-pill">✦ STAFF PRODUCT DESIGNER • 8+ YEARS EXPERIENCE</div>
      <h1 class="hero-title">Crafting scalable design systems and intuitive interfaces for top global tech products.</h1>
      <p class="hero-description">Over 8 years shaping mission-critical platforms, B2B SaaS workflows, and AI-enabled interaction paradigms. Currently leading product design initiatives for next-generation developer &amp; fintech platforms. Previously at Stripe, Linear, and Spotify.</p>
      <div class="hero-cta-group">
        <div class="btn-primary-hero">Explore Selected Work ↓</div>
        <div class="btn-secondary-hero">View Experience &amp; Resume</div>
      </div>
    </div>

    <!-- Proof / Brands -->
    <div class="trust-bar">
      <div class="trust-label">PROUD TO HAVE CONTRIBUTED TO INDUSTRY-LEADING PRODUCTS</div>
      <div class="brands-row">
        <div class="brand-logo-text">STRIPE</div>
        <div class="brand-logo-text">LINEAR</div>
        <div class="brand-logo-text">FIGMA</div>
        <div class="brand-logo-text">VERCEL</div>
        <div class="brand-logo-text">SPOTIFY</div>
        <div class="brand-logo-text">RAYCAST</div>
      </div>
    </div>
  </section>

  <!-- 2. Selected Case Studies with Real Project UI Mockups -->
  <section class="case-studies-section">
    <div class="section-intro">
      <div class="section-titles">
        <div class="section-eyebrow">FEATURED PORTFOLIO</div>
        <h2 class="section-heading">Selected Case Studies (2022 — 2026)</h2>
        <p class="section-desc">Deep dives into complex systems, interaction ergonomics, and measurable business outcomes.</p>
      </div>
    </div>

    <div class="cases-stack">
      <!-- Case 1: Stripe Billing -->
      <div class="case-card">
        <div class="case-content">
          <div class="case-header-row">
            <div class="case-tag">FINTECH</div>
            <div class="case-tag">ENTERPRISE SAAS</div>
            <div class="case-tag">DESIGN SYSTEMS</div>
          </div>
          <h3 class="case-title">Stripe Billing — Next-Gen Enterprise Revenue Architecture</h3>
          <p class="case-summary">Redesigned the multi-currency subscription and invoicing engine for Stripe's top 1,000 enterprise customers, collapsing invoice onboarding time from 14 days to 4 hours with an intuitive visual rule builder.</p>
          <div class="case-metrics-row">
            <div class="metric-badge-box">
              <div class="metric-stat">+$4.2B</div>
              <div class="metric-stat-label">Annual Volume Processed</div>
            </div>
            <div class="metric-badge-box">
              <div class="metric-stat">+38%</div>
              <div class="metric-stat-label">Config Speedup</div>
            </div>
            <div class="metric-badge-box">
              <div class="metric-stat">0.02%</div>
              <div class="metric-stat-label">Dispute Rate</div>
            </div>
          </div>
          <div class="case-footer">
            <div class="case-role">Role: Lead Product Designer • Web Platform • Design Tokens</div>
            <div class="btn-case-link">Read Full Case Study →</div>
          </div>
        </div>

        <div class="case-visual-preview">
          <img src="${stripeUi}" alt="Stripe Enterprise Revenue Dashboard" class="case-image" />
        </div>
      </div>

      <!-- Case 2: Linear Mobile -->
      <div class="case-card">
        <div class="case-content">
          <div class="case-header-row">
            <div class="case-tag">MOBILE UX</div>
            <div class="case-tag">GESTURE ARCHITECTURE</div>
            <div class="case-tag">IOS &amp; ANDROID</div>
          </div>
          <h3 class="case-title">Linear Mobile — Native Gesture Interaction Engine</h3>
          <p class="case-summary">Engineered an offline-first issue triage and roadmap tracking experience tailored for rapid thumb-reach ergonomics, haptic feedback, and fluid swipe transitions across native platforms.</p>
          <div class="case-metrics-row">
            <div class="metric-badge-box">
              <div class="metric-stat">4.9 ★</div>
              <div class="metric-stat-label">App Store Rating</div>
            </div>
            <div class="metric-badge-box">
              <div class="metric-stat">280k+</div>
              <div class="metric-stat-label">Active Engineers</div>
            </div>
            <div class="metric-badge-box">
              <div class="metric-stat">60 FPS</div>
              <div class="metric-stat-label">Gesture Transitions</div>
            </div>
          </div>
          <div class="case-footer">
            <div class="case-role">Role: Senior Interaction Designer • Mobile Architecture • 2023</div>
            <div class="btn-case-link">Read Full Case Study →</div>
          </div>
        </div>

        <div class="case-visual-preview">
          <img src="${linearUi}" alt="Linear Mobile Gesture Engine" class="case-image" />
        </div>
      </div>

      <!-- Case 3: Raycast AI -->
      <div class="case-card">
        <div class="case-content">
          <div class="case-header-row">
            <div class="case-tag">AI/ML WORKSPACE</div>
            <div class="case-tag">KEYBOARD-FIRST</div>
            <div class="case-tag">DESKTOP</div>
          </div>
          <h3 class="case-title">Raycast AI Canvas — Multi-Modal Ambient Pair Studio</h3>
          <p class="case-summary">Pioneered an unobtrusive keyboard-driven generative canvas combining contextual AST code analysis, live diffing, and seamless multi-model switching without breaking flow state.</p>
          <div class="case-metrics-row">
            <div class="metric-badge-box">
              <div class="metric-stat">3.4x</div>
              <div class="metric-stat-label">Task Acceleration</div>
            </div>
            <div class="metric-badge-box">
              <div class="metric-stat">50k+</div>
              <div class="metric-stat-label">Community Workflows</div>
            </div>
            <div class="metric-badge-box">
              <div class="metric-stat">99.4%</div>
              <div class="metric-stat-label">Shortcut Retention</div>
            </div>
          </div>
          <div class="case-footer">
            <div class="case-role">Role: Principal UX Designer • Desktop macOS • 2024</div>
            <div class="btn-case-link">Read Full Case Study →</div>
          </div>
        </div>

        <div class="case-visual-preview">
          <img src="${raycastUi}" alt="Raycast Multi-Modal AI Canvas" class="case-image" />
        </div>
      </div>
    </div>
  </section>

  <!-- 3. Highlighted How It Works / Philosophy Section -->
  <section class="philosophy-section">
    <div class="section-titles">
      <div class="section-eyebrow">HOW I WORK</div>
      <h2 class="section-heading">Core Design Principles &amp; Methodology</h2>
      <p class="section-desc">Balancing aesthetic perfection with systematic rigor and engineering pragmatism.</p>
    </div>

    <div class="philosophy-grid">
      <div class="phil-card">
        <div class="phil-icon">📐</div>
        <h3 class="phil-title">Systematic Rigor</h3>
        <p class="phil-body">Design systems are living software contracts. I engineer tokenized architectures that bridge Figma primitives directly to React/Tailwind/CSS tokens without ambiguity.</p>
      </div>

      <div class="phil-card">
        <div class="phil-icon">⚡</div>
        <h3 class="phil-title">Cognitive Ergonomics</h3>
        <p class="phil-body">Every millisecond of layout shift and redundant interaction costs user attention. I prioritize keyboard accessibility, low-latency micro-interactions, and visual hierarchy.</p>
      </div>

      <div class="phil-card">
        <div class="phil-icon">🎯</div>
        <h3 class="phil-title">Measurable Velocity</h3>
        <p class="phil-body">Design excellence is proven through telemetry. I validate hypotheses with rapid interactive prototypes, usability testing, and quantitative business KPIs.</p>
      </div>
    </div>
  </section>

  <!-- Career Journey / Timeline -->
  <section class="experience-section">
    <div class="section-titles">
      <div class="section-eyebrow">CAREER MILESTONES</div>
      <h2 class="section-heading">Experience &amp; Leadership Track</h2>
      <p class="section-desc">8+ years driving UX quality and design architecture across Silicon Valley companies.</p>
    </div>

    <div class="timeline-list">
      <div class="timeline-item">
        <div class="timeline-left">
          <div class="timeline-period">2022 — PRESENT</div>
          <div class="timeline-details">
            <div class="timeline-role">Staff Product Designer &amp; Design Technologist</div>
            <div class="timeline-company">Stripe • San Francisco, CA</div>
          </div>
        </div>
        <div class="timeline-tag">FINTECH CORE</div>
      </div>

      <div class="timeline-item">
        <div class="timeline-left">
          <div class="timeline-period">2020 — 2022</div>
          <div class="timeline-details">
            <div class="timeline-role">Senior Interaction Designer</div>
            <div class="timeline-company">Linear • Remote</div>
          </div>
        </div>
        <div class="timeline-tag">MOBILE &amp; GESTURE</div>
      </div>

      <div class="timeline-item">
        <div class="timeline-left">
          <div class="timeline-period">2018 — 2020</div>
          <div class="timeline-details">
            <div class="timeline-role">Product Designer</div>
            <div class="timeline-company">Spotify • Stockholm / New York</div>
          </div>
        </div>
        <div class="timeline-tag">CREATOR PLATFORMS</div>
      </div>

      <div class="timeline-item">
        <div class="timeline-left">
          <div class="timeline-period">2016 — 2018</div>
          <div class="timeline-details">
            <div class="timeline-role">Associate UX/UI Designer</div>
            <div class="timeline-company">Huge Inc. • New York, NY</div>
          </div>
        </div>
        <div class="timeline-tag">AGENCY &amp; RESEARCH</div>
      </div>
    </div>
  </section>

  <!-- 4. Recommendations with Profile Photos -->
  <section class="testimonials-section">
    <div class="section-titles">
      <div class="section-eyebrow">RECOMMENDATIONS</div>
      <h2 class="section-heading">Words from Collaborators &amp; Leaders</h2>
    </div>

    <div class="testimonials-grid">
      <div class="testimonial-card">
        <p class="testimonial-quote">"Alexander possesses that rare superpower of seeing the entire product roadmap from 10,000 feet while executing the smallest micro-interaction with obsessive craft."</p>
        <div class="testimonial-author">
          <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&q=80" alt="Sarah Jenkins" class="author-photo" />
          <div class="author-meta">
            <div class="author-name">Sarah Jenkins</div>
            <div class="author-role">VP of Product • Stripe</div>
          </div>
        </div>
      </div>

      <div class="testimonial-card">
        <p class="testimonial-quote">"One of the most technically gifted design partners I've worked with. His design systems thinking fundamentally elevated our engineering velocity."</p>
        <div class="testimonial-author">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80" alt="Marcus Vance" class="author-photo" />
          <div class="author-meta">
            <div class="author-name">Marcus Vance</div>
            <div class="author-role">Head of Engineering • Linear</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. Book a Call Section with Functional Highlighted CTA Button -->
  <section class="booking-section">
    <div class="booking-card">
      <div class="booking-info">
        <div class="booking-tag">✦ WORK TOGETHER</div>
        <h2 class="booking-heading">Book a 30-Minute Discovery Call</h2>
        <p class="booking-desc">Have an upcoming product launch, redesign, or design systems challenge? Let's discuss your scope, deliverables, and timeline directly.</p>
        <div class="booking-perks">
          <div class="perk-item">
            <div class="perk-bullet">✓</div>
            <div class="perk-text">Direct 1-on-1 strategic product audit</div>
          </div>
          <div class="perk-item">
            <div class="perk-bullet">✓</div>
            <div class="perk-text">Immediate scope &amp; feasibility feedback</div>
          </div>
          <div class="perk-item">
            <div class="perk-bullet">✓</div>
            <div class="perk-text">NDA-backed confidential discussion</div>
          </div>
        </div>
      </div>

      <div class="booking-form-box">
        <div class="form-title">Schedule Your Session</div>
        <div class="form-group">
          <div class="form-label">Full Name</div>
          <div class="form-input">
            <div class="input-placeholder">Sarah Connor</div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label">Work Email</div>
          <div class="form-input">
            <div class="input-placeholder">sarah@company.com</div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label">Project Scope</div>
          <div class="form-input">
            <div class="input-placeholder">B2B SaaS / Design System / Mobile UX</div>
          </div>
        </div>
        <!-- High-Impact CTA Button with Explicit Text Element -->
        <div class="btn-submit-booking">
          <span class="btn-submit-text">Book Discovery Call →</span>
        </div>
        <div class="form-subtext">No spam ever. 100% confidential. Replies within 24 hours.</div>
      </div>
    </div>
  </section>

  <!-- Footer Section -->
  <footer class="footer-cta-section">
    <div class="footer-cta-box">
      <div class="footer-cta-text">
        <h2 class="footer-cta-title">Have a vision for your next digital product? Let's build something extraordinary.</h2>
        <p class="footer-cta-sub">Currently open to select advisory roles, staff product leadership, and full-scale product design collaborations for Q4 / Q1.</p>
      </div>
      <div class="footer-cta-btns">
        <div class="btn-footer-primary">Book 30-Min Discovery Call</div>
        <div class="btn-footer-email">alexander.chen@designforge.io</div>
      </div>
    </div>

    <div class="footer-bottom-row">
      <div class="copyright-text">© 2026 Alexander Chen. All rights reserved. Designed &amp; built with DesignForge AI.</div>
      <div class="footer-socials">
        <div class="social-item">Figma Community</div>
        <div class="social-item">Dribbble</div>
        <div class="social-item">LinkedIn</div>
        <div class="social-item">GitHub</div>
        <div class="social-item">Twitter / X</div>
      </div>
    </div>
  </footer>

</body>
</html>`;

fs.writeFileSync(path.join("scratch", "portfolio_final.html"), html, "utf-8");
console.log("Written scratch/portfolio_final.html successfully! File size:", html.length);
