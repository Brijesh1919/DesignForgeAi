import fs from "fs";
import path from "path";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>KOOX — 100% Organic Cold-Pressed Raw Juices &amp; Cleanses London</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1440px;
    background-color: #ffffff;
    color: #111111;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* 1. Announcement Bar */
  .announcement-bar {
    width: 1440px;
    height: 40px;
    background-color: #6B1229;
    color: #ffffff;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 0 32px;
  }
  .announcement-text {
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }

  /* 2. Main Navigation Header */
  .navbar {
    width: 1440px;
    height: 84px;
    background-color: #ffffff;
    border-bottom: 1px solid #EBE7E2;
    padding: 0 56px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .nav-menu {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 28px;
  }
  .nav-link {
    font-size: 13px;
    font-weight: 700;
    color: #111111;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .nav-link-active {
    font-size: 13px;
    font-weight: 700;
    color: #6B1229;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .nav-logo-box {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-logo-img {
    width: 110px;
    height: 38px;
    object-fit: contain;
    display: block;
  }
  .nav-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }
  .nav-action-text {
    font-size: 12.5px;
    font-weight: 600;
    color: #444444;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .btn-header-cta {
    background-color: #6B1229;
    border-radius: 4px;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-header-cta-text {
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  /* 3. Hero Section */
  .hero-section {
    width: 1440px;
    height: 640px;
    background-image: url('https://koox.co.uk/cdn/shop/files/back.jpg?v=1713775110&width=2000');
    background-size: cover;
    background-position: center;
    background-color: #FAF8F5;
    padding: 64px 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
  .hero-card {
    background-color: rgba(255, 255, 255, 0.95);
    border: 1px solid #E8E2D9;
    border-radius: 16px;
    padding: 48px 52px;
    width: 680px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .hero-tagline {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #6B1229;
    text-transform: uppercase;
  }
  .hero-heading {
    font-size: 42px;
    font-weight: 900;
    color: #111111;
    line-height: 1.15;
    letter-spacing: -0.5px;
    text-transform: uppercase;
  }
  .hero-desc {
    font-size: 15px;
    color: #444444;
    line-height: 1.6;
  }
  .hero-rating-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    background-color: #F8F5F0;
    border: 1px solid #EBE4DA;
    border-radius: 8px;
    padding: 8px 14px;
    width: fit-content;
  }
  .rating-stars {
    color: #D25A24;
    font-weight: 800;
    font-size: 13px;
  }
  .rating-text {
    font-size: 12px;
    font-weight: 700;
    color: #222222;
  }
  .hero-btn-group {
    display: flex;
    flex-direction: row;
    gap: 14px;
    margin-top: 6px;
  }
  .btn-hero-primary {
    background-color: #6B1229;
    border-radius: 4px;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-hero-primary-text {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .btn-hero-secondary {
    background-color: #111111;
    border-radius: 4px;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-hero-secondary-text {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .btn-hero-outline {
    background-color: #ffffff;
    border: 1.5px solid #111111;
    border-radius: 4px;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-hero-outline-text {
    color: #111111;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* 4. Social Proof & London Reviews Bar */
  .social-proof-bar {
    width: 1440px;
    background-color: #FAF8F5;
    border-top: 1px solid #EBE6E0;
    border-bottom: 1px solid #EBE6E0;
    padding: 24px 64px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .proof-left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .proof-title {
    font-size: 13.5px;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: #111111;
    text-transform: uppercase;
  }
  .proof-middle {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
  .proof-score {
    font-size: 20px;
    font-weight: 900;
    color: #6B1229;
  }
  .proof-stars {
    font-size: 15px;
    color: #D25A24;
    letter-spacing: 2px;
  }
  .proof-sub {
    font-size: 13px;
    font-weight: 600;
    color: #555555;
  }
  .proof-cta {
    font-size: 12.5px;
    font-weight: 800;
    letter-spacing: 0.8px;
    color: #6B1229;
    text-transform: uppercase;
  }

  /* 5. Purity Matrix (100% vs 0%) */
  .purity-section {
    width: 1440px;
    padding: 56px 80px;
    background-color: #ffffff;
    border-bottom: 1px solid #EBE6E0;
    display: flex;
    flex-direction: row;
    gap: 32px;
  }
  .purity-card {
    flex: 1;
    border-radius: 12px;
    padding: 36px 40px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 32px;
  }
  .purity-card-positive {
    background-color: #F8FBF8;
    border: 1.5px solid #C3E6C8;
  }
  .purity-card-negative {
    background-color: #FDF9F8;
    border: 1.5px solid #F2D0C9;
  }
  .purity-big-stat {
    font-size: 48px;
    font-weight: 900;
    line-height: 1;
  }
  .stat-positive { color: #047857; }
  .stat-negative { color: #6B1229; }
  .purity-pillars {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .purity-pillar-item {
    font-size: 16px;
    font-weight: 800;
    color: #111111;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* 6. Discount Promo Banner */
  .promo-banner {
    width: 1440px;
    height: 48px;
    background-color: #111111;
    color: #ffffff;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .promo-text {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .promo-code {
    background-color: #6B1229;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 4px 10px;
    border-radius: 3px;
  }

  /* 7. 3 Category Cards */
  .category-section {
    width: 1440px;
    padding: 72px 64px;
    background-color: #FAF8F5;
    border-bottom: 1px solid #EBE6E0;
    display: flex;
    flex-direction: row;
    gap: 28px;
  }
  .cat-card {
    flex: 1;
    background-color: #ffffff;
    border: 1px solid #E8E3DC;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .cat-image-box {
    width: 100%;
    height: 240px;
    background-color: #F4EFEA;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .cat-image {
    width: 100%;
    height: 240px;
    object-fit: cover;
    display: block;
  }
  .cat-info {
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cat-title {
    font-size: 20px;
    font-weight: 800;
    color: #111111;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .cat-link {
    font-size: 13px;
    font-weight: 800;
    color: #6B1229;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  /* 8. Cleanses Section */
  .collection-section {
    width: 1440px;
    padding: 80px 64px;
    background-color: #ffffff;
    border-bottom: 1px solid #EBE6E0;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  .section-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }
  .section-subtitle-tag {
    font-size: 11.5px;
    font-weight: 800;
    color: #6B1229;
    letter-spacing: 1.8px;
    text-transform: uppercase;
  }
  .section-main-title {
    font-size: 32px;
    font-weight: 900;
    color: #111111;
    letter-spacing: -0.3px;
    text-transform: uppercase;
  }
  .section-description {
    font-size: 14.5px;
    color: #666666;
    max-width: 680px;
  }

  /* Products Grid */
  .products-grid {
    display: flex;
    flex-direction: row;
    gap: 24px;
  }
  .product-card {
    flex: 1;
    background-color: #FAF8F5;
    border: 1px solid #ECE7E0;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .product-img-box {
    width: 100%;
    height: 280px;
    background-color: #ffffff;
    border-bottom: 1px solid #EBE5DC;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .product-img {
    width: 100%;
    height: 280px;
    object-fit: cover;
    display: block;
  }
  .product-content {
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .product-badge {
    background-color: #6B1229;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 3px 8px;
    border-radius: 3px;
    width: fit-content;
    text-transform: uppercase;
  }
  .product-title {
    font-size: 16px;
    font-weight: 800;
    color: #111111;
    text-transform: uppercase;
    line-height: 1.3;
    min-height: 42px;
  }
  .product-price {
    font-size: 16px;
    font-weight: 800;
    color: #6B1229;
  }
  .btn-add-to-cart {
    background-color: #111111;
    border-radius: 4px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 6px;
  }
  .btn-cart-text {
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  /* 9. Why Koox Section */
  .why-section {
    width: 1440px;
    padding: 88px 64px;
    background-color: #FAF8F5;
    border-bottom: 1px solid #EBE6E0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 48px;
  }
  .why-grid {
    width: 1312px;
    display: flex;
    flex-direction: row;
    gap: 28px;
  }
  .why-card {
    flex: 1;
    background-color: #ffffff;
    border: 1px solid #EBE6E0;
    border-radius: 12px;
    padding: 36px 30px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .why-icon-box {
    width: 48px;
    height: 48px;
    background-color: #6B1229;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .why-icon-text {
    font-size: 22px;
    color: #ffffff;
  }
  .why-title {
    font-size: 18px;
    font-weight: 800;
    color: #111111;
    text-transform: uppercase;
  }
  .why-desc {
    font-size: 14px;
    color: #555555;
    line-height: 1.6;
  }

  /* Certification Bar */
  .cert-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
    background-color: #ffffff;
    border: 1px solid #EBE6E0;
    border-radius: 10px;
    padding: 16px 32px;
  }
  .cert-img {
    height: 50px;
    object-fit: contain;
    display: block;
  }
  .cert-text {
    font-size: 13px;
    font-weight: 700;
    color: #222222;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* 10. Reviews Showcase */
  .reviews-section {
    width: 1440px;
    padding: 80px 64px;
    background-color: #ffffff;
    border-bottom: 1px solid #EBE6E0;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  .reviews-grid {
    display: flex;
    flex-direction: row;
    gap: 24px;
  }
  .review-box {
    flex: 1;
    background-color: #FAF8F5;
    border: 1px solid #ECE6DE;
    border-radius: 12px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
  }
  .review-stars {
    color: #D25A24;
    font-size: 14px;
    letter-spacing: 2px;
  }
  .review-quote {
    font-size: 14.5px;
    color: #222222;
    line-height: 1.6;
    font-style: italic;
  }
  .review-author {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .review-name {
    font-size: 13.5px;
    font-weight: 800;
    color: #111111;
  }
  .review-meta {
    font-size: 11.5px;
    color: #777777;
  }

  /* 11. Newsletter Club */
  .newsletter-section {
    width: 1440px;
    padding: 80px 64px;
    background-color: #6B1229;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
  }
  .news-heading {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .news-sub {
    font-size: 15px;
    color: #F8D7DE;
    max-width: 600px;
    line-height: 1.6;
  }
  .news-form {
    display: flex;
    flex-direction: row;
    gap: 12px;
    width: 520px;
    margin-top: 8px;
  }
  .news-input {
    flex: 1;
    background-color: #ffffff;
    border-radius: 4px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
  }
  .news-input-placeholder {
    color: #888888;
    font-size: 13.5px;
  }
  .btn-news-submit {
    background-color: #111111;
    border-radius: 4px;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-news-text {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* 12. Footer */
  .footer-section {
    width: 1440px;
    padding: 72px 64px 40px;
    background-color: #111111;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .footer-main-grid {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 48px;
    border-bottom: 1px solid #282828;
    padding-bottom: 48px;
  }
  .footer-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .footer-col-brand {
    width: 320px;
  }
  .footer-brand-title {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 1px;
    color: #ffffff;
  }
  .footer-brand-text {
    font-size: 13.5px;
    color: #999999;
    line-height: 1.6;
  }
  .footer-heading {
    font-size: 13px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .footer-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .footer-link {
    font-size: 13px;
    color: #999999;
    text-transform: capitalize;
  }
  .footer-bottom {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .copyright-text {
    font-size: 12px;
    color: #666666;
  }
  .footer-certs {
    display: flex;
    flex-direction: row;
    gap: 20px;
    font-size: 12px;
    color: #888888;
    text-transform: uppercase;
  }
</style>
</head>
<body>

  <!-- 1. Announcement Bar -->
  <div class="announcement-bar">
    <div class="announcement-text">FREE LONDON DELIVERY OVER £50 • 100% ORGANIC • COLD-PRESSED • RAW</div>
  </div>

  <!-- 2. Main Navigation Header -->
  <header class="navbar">
    <nav class="nav-menu">
      <div class="nav-link-active">HOME</div>
      <div class="nav-link">JUICE SHOP</div>
      <div class="nav-link">CLEANSES</div>
      <div class="nav-link">ABOUT US</div>
      <div class="nav-link">STOCKISTS</div>
    </nav>

    <div class="nav-logo-box">
      <img src="https://koox.co.uk/cdn/shop/files/Logo_200x.png?v=1707908210" alt="KOOX London Logo" class="nav-logo-img" />
    </div>

    <div class="nav-actions">
      <div class="nav-action-text">SEARCH</div>
      <div class="nav-action-text">LOGIN</div>
      <div class="btn-header-cta">
        <span class="btn-header-cta-text">BAG (0)</span>
      </div>
    </div>
  </header>

  <!-- 3. Hero Section -->
  <section class="hero-section">
    <div class="hero-card">
      <div class="hero-tagline">✦ 100% RAW &amp; ORGANIC • LONDON</div>
      <h1 class="hero-heading">ORGANIC JUICES &amp; CLEANSES MADE TO ORDER</h1>
      <p class="hero-desc">KOOX Juices are designed to keep vitamins and nutrients at the highest level. 100% Organic, 100% Cold-Pressed, 100% Raw with zero additives, pasteurisation, or HPP.</p>
      
      <div class="hero-rating-box">
        <div class="rating-stars">★★★★★</div>
        <div class="rating-text">4.8 / 5 · +10,000 Reviews on Deliveroo &amp; Uber Eats</div>
      </div>

      <div class="hero-btn-group">
        <div class="btn-hero-primary">
          <span class="btn-hero-primary-text">SHOP CLEANSES</span>
        </div>
        <div class="btn-hero-secondary">
          <span class="btn-hero-secondary-text">JUICE BOX</span>
        </div>
        <div class="btn-hero-outline">
          <span class="btn-hero-outline-text">BECOME A STOCKIST</span>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. Social Proof / London Delivery Rating -->
  <div class="social-proof-bar">
    <div class="proof-left">
      <div class="proof-title">HIGHEST RATED JUICE BRAND IN LONDON</div>
    </div>
    <div class="proof-middle">
      <div class="proof-score">4.8 / 5</div>
      <div class="proof-stars">★★★★★</div>
      <div class="proof-sub">+10,000 Verified Reviews on Deliveroo &amp; Uber Eats (2022 — 2026)</div>
    </div>
    <div class="proof-cta">VIEW ALL REVIEWS →</div>
  </div>

  <!-- 5. Purity Matrix (100% vs 0%) -->
  <section class="purity-section">
    <div class="purity-card purity-card-positive">
      <div class="purity-big-stat stat-positive">100%</div>
      <div class="purity-pillars">
        <div class="purity-pillar-item">CERTIFIED ORGANIC</div>
        <div class="purity-pillar-item">COLD-PRESSED FRESH</div>
        <div class="purity-pillar-item">100% RAW &amp; LIVING</div>
      </div>
    </div>

    <div class="purity-card purity-card-negative">
      <div class="purity-big-stat stat-negative">0%</div>
      <div class="purity-pillars">
        <div class="purity-pillar-item">ZERO ADDITIVES</div>
        <div class="purity-pillar-item">ZERO PASTEURISATION</div>
        <div class="purity-pillar-item">ZERO HPP PRESSURE</div>
      </div>
    </div>
  </section>

  <!-- 6. Discount Promo Banner -->
  <div class="promo-banner">
    <div class="promo-text">GET 15% OFF YOUR FIRST ORDER</div>
    <div class="promo-code">USE CODE: KOOXORGANIC</div>
  </div>

  <!-- 7. 3 Featured Entryway Categories -->
  <section class="category-section">
    <!-- Cat 1 -->
    <div class="cat-card">
      <div class="cat-image-box">
        <img src="https://koox.co.uk/cdn/shop/files/cleanse_e6e80502-1373-4864-9b40-57744fa31d46_420x.png?v=1709134249" alt="Cleanses" class="cat-image" />
      </div>
      <div class="cat-info">
        <div class="cat-title">CLEANSE PROGRAMS</div>
        <div class="cat-link">Explore Cleanses →</div>
      </div>
    </div>

    <!-- Cat 2 -->
    <div class="cat-card">
      <div class="cat-image-box">
        <img src="https://koox.co.uk/cdn/shop/files/juice_box_63421400-1753-47ed-8e78-82830ef4c137_420x.png?v=1709134276" alt="Juice Box" class="cat-image" />
      </div>
      <div class="cat-info">
        <div class="cat-title">CUSTOM JUICE BOX</div>
        <div class="cat-link">Build Your Box →</div>
      </div>
    </div>

    <!-- Cat 3 -->
    <div class="cat-card">
      <div class="cat-image-box">
        <img src="https://koox.co.uk/cdn/shop/files/sub_420x.png?v=1709134306" alt="Subscriptions" class="cat-image" />
      </div>
      <div class="cat-info">
        <div class="cat-title">SUBSCRIBE &amp; SAVE</div>
        <div class="cat-link">Subscribe for 15% Off →</div>
      </div>
    </div>
  </section>

  <!-- 8. Koox Cleanses Collection -->
  <section class="collection-section">
    <div class="section-header">
      <div class="section-subtitle-tag">DOCTOR-FORMULATED NUTRITION</div>
      <h2 class="section-main-title">KOOX CLEANSES</h2>
      <p class="section-description">Reset your metabolism, restore deep digestive balance, and flood your cells with raw vitamins.</p>
    </div>

    <div class="products-grid">
      <!-- Cleanse 1 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/NabilPack_1_High_resolution.jpg?v=1709125502" alt="The Signature Reset Cleanse" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">BESTSELLER</div>
          <div class="product-title">The Signature Reset Cleanse</div>
          <div class="product-price">From £65.00</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">SELECT OPTIONS</span>
          </div>
        </div>
      </div>

      <!-- Cleanse 2 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/NabiLpack2_1_16x9_-9.jpg?v=1709307609" alt="The Green Curve Cleanse" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">DEEP DETOX</div>
          <div class="product-title">The Green Curve Cleanse</div>
          <div class="product-price">From £65.00</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">SELECT OPTIONS</span>
          </div>
        </div>
      </div>

      <!-- Cleanse 3 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/NabiLpack-messed_16x9_-13.jpg?v=1709561922" alt="3-Day Weight Loss Cleanse" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">3-DAY PROGRAM</div>
          <div class="product-title">3-Day Weight Loss Kick off</div>
          <div class="product-price">£155.00</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">ADD TO BAG</span>
          </div>
        </div>
      </div>

      <!-- Cleanse 4 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/NabiLpack-messed_16x9_-14.jpg?v=1709562478" alt="Five:Two Cleanse" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">INTERMITTENT</div>
          <div class="product-title">Five:Two Cleanse Program</div>
          <div class="product-price">£60.00</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">ADD TO BAG</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 9. Juice Shop Collection -->
  <section class="collection-section">
    <div class="section-header">
      <div class="section-subtitle-tag">COLD-PRESSED DAILY</div>
      <h2 class="section-main-title">COLD-PRESSED JUICE SHOP</h2>
      <p class="section-description">100% organic, raw, unpasteurised single juices and elixirs pressed fresh every morning in London.</p>
    </div>

    <div class="products-grid">
      <!-- Juice 1 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/drinkable_skincare__5_page-0001.jpg?v=1780654058" alt="Cold-pressed N°5" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">SKINCARE</div>
          <div class="product-title">Cold-pressed N°5 (Drinkable Skincare)</div>
          <div class="product-price">£9.95</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">ADD TO BAG</span>
          </div>
        </div>
      </div>

      <!-- Juice 2 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/Ultimate_Detox__3_page-0001.jpg?v=1780654459" alt="Cold-Pressed N°3" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">DETOX</div>
          <div class="product-title">Cold-Pressed N°3 (Ultimate Detox)</div>
          <div class="product-price">£9.95</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">ADD TO BAG</span>
          </div>
        </div>
      </div>

      <!-- Juice 3 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/KOOX_COLD_PRESSED_._7pdf_page-0001.jpg?v=1780654345" alt="Cold-pressed N°7" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">IMMUNITY</div>
          <div class="product-title">Cold-pressed N°7 (Immunity Defense)</div>
          <div class="product-price">£9.95</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">ADD TO BAG</span>
          </div>
        </div>
      </div>

      <!-- Juice 4 -->
      <div class="product-card">
        <div class="product-img-box">
          <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/KOOX_COLD_PRESSED__15_page-0001.jpg?v=1780406898" alt="Cold-pressed N°15" class="product-img" />
        </div>
        <div class="product-content">
          <div class="product-badge">ENERGY</div>
          <div class="product-title">Cold-pressed N°15 (Deep Green)</div>
          <div class="product-price">£9.95</div>
          <div class="btn-add-to-cart">
            <span class="btn-cart-text">ADD TO BAG</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 10. Why Koox Section -->
  <section class="why-section">
    <div class="section-header">
      <div class="section-subtitle-tag">OUR PURITY PLEDGE</div>
      <h2 class="section-main-title">WHY KOOX</h2>
      <p class="section-description">We believe raw, unpasteurised organic nutrition has the power to transform human vitality.</p>
    </div>

    <div class="why-grid">
      <div class="why-card">
        <div class="why-icon-box">
          <span class="why-icon-text">🌱</span>
        </div>
        <div class="why-title">100% Certified Organic</div>
        <p class="why-desc">Every fruit, vegetable, and seed is certified by the Soil Association. Zero chemical pesticides or artificial fertilizers.</p>
      </div>

      <div class="why-card">
        <div class="why-icon-box">
          <span class="why-icon-text">❄️</span>
        </div>
        <div class="why-title">Cold-Pressed Fresh</div>
        <p class="why-desc">Hydraulic press extraction without friction heat, preserving up to 5x more micronutrients than centrifugal blenders.</p>
      </div>

      <div class="why-card">
        <div class="why-icon-box">
          <span class="why-icon-text">🛡️</span>
        </div>
        <div class="why-title">Zero HPP or Heat</div>
        <p class="why-desc">Never heated, pasteurised, or exposed to high pressure processing. Pure living enzymes and uncompromised taste.</p>
      </div>

      <div class="why-card">
        <div class="why-icon-box">
          <span class="why-icon-text">🚚</span>
        </div>
        <div class="why-title">Handcrafted in London</div>
        <p class="why-desc">Pressed daily in our London kitchen and hand-delivered directly to your door in eco-insulated recyclable packaging.</p>
      </div>
    </div>

    <div class="cert-box">
      <img src="https://cdn.shopify.com/s/files/1/0813/0579/6946/files/sa_organic_gaelic_black.png?v=1713788082" alt="Soil Association Organic Certification" class="cert-img" />
      <div class="cert-text">Certified Organic by the Soil Association UK • GB-ORG-05</div>
    </div>
  </section>

  <!-- 11. Customer Reviews -->
  <section class="reviews-section">
    <div class="section-header">
      <div class="section-subtitle-tag">TESTIMONIALS</div>
      <h2 class="section-main-title">WHAT LONDON IS SAYING</h2>
    </div>

    <div class="reviews-grid">
      <div class="review-box">
        <div class="review-stars">★★★★★</div>
        <p class="review-quote">"The only juices in London that actually taste raw and living. The Signature Reset Cleanse completely eliminated my brain fog and digestive bloating within 48 hours."</p>
        <div class="review-author">
          <div class="review-name">Charlotte M.</div>
          <div class="review-meta">Verified Customer • Chelsea, London</div>
        </div>
      </div>

      <div class="review-box">
        <div class="review-stars">★★★★★</div>
        <p class="review-quote">"I order the custom juice box every Monday. Knowing they don't use HPP or pasteurisation makes all the difference in the world. Cold-Pressed N°5 is pure liquid gold."</p>
        <div class="review-author">
          <div class="review-name">Edward T.</div>
          <div class="review-meta">Verified Customer • Mayfair, London</div>
        </div>
      </div>

      <div class="review-box">
        <div class="review-stars">★★★★★</div>
        <p class="review-quote">"5 stars across the board. Prompt delivery, elegant glass packaging, and truly the highest quality organic ingredients you can find in the UK."</p>
        <div class="review-author">
          <div class="review-name">Sophia V.</div>
          <div class="review-meta">Verified Customer • Kensington, London</div>
        </div>
      </div>
    </div>
  </section>

  <!-- 12. Newsletter Club -->
  <section class="newsletter-section">
    <h2 class="news-heading">JOIN THE KOOX WELLNESS CLUB</h2>
    <p class="news-sub">Sign up for seasonal cleanse launches, organic nutrition masterclasses, and 15% off your first order.</p>
    
    <div class="news-form">
      <div class="news-input">
        <span class="news-input-placeholder">Enter your work or personal email...</span>
      </div>
      <div class="btn-news-submit">
        <span class="btn-news-text">SUBSCRIBE</span>
      </div>
    </div>
  </section>

  <!-- 13. Footer -->
  <footer class="footer-section">
    <div class="footer-main-grid">
      <div class="footer-col footer-col-brand">
        <div class="footer-brand-title">KOOX LONDON</div>
        <p class="footer-brand-text">100% Organic, Raw, Cold-Pressed Juices and Medical-Grade Cleanse Programs. Handcrafted daily in central London with zero preservatives, additives, or pasteurisation.</p>
      </div>

      <div class="footer-col">
        <div class="footer-heading">SHOP CATEGORIES</div>
        <div class="footer-links">
          <div class="footer-link">Juice Shop</div>
          <div class="footer-link">Organic Cleanses</div>
          <div class="footer-link">Custom Juice Boxes</div>
          <div class="footer-link">Subscriptions (Save 15%)</div>
          <div class="footer-link">Become a Stockist</div>
        </div>
      </div>

      <div class="footer-col">
        <div class="footer-heading">COMPANY &amp; INFO</div>
        <div class="footer-links">
          <div class="footer-link">About Our Kitchen</div>
          <div class="footer-link">Delivery &amp; Courier Zones</div>
          <div class="footer-link">Cleanse FAQs</div>
          <div class="footer-link">Terms &amp; Conditions</div>
          <div class="footer-link">Privacy Policy</div>
        </div>
      </div>

      <div class="footer-col">
        <div class="footer-heading">HEADQUARTERS</div>
        <div class="footer-links">
          <div class="footer-link">London, United Kingdom</div>
          <div class="footer-link">orders@koox.co.uk</div>
          <div class="footer-link">Mon — Fri: 7:00am — 6:00pm</div>
          <div class="footer-link">Deliveroo &amp; Uber Eats Daily</div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="copyright-text">© 2026 KOOX. All rights reserved. Designed &amp; Crafted for Figma.</div>
      <div class="footer-certs">
        <div>Soil Association Organic</div>
        <div>GB-ORG-05</div>
        <div>Zero Waste London</div>
      </div>
    </div>
  </footer>

</body>
</html>`;

fs.writeFileSync("scratch/koox_design.html", html, "utf-8");
console.log("Written scratch/koox_design.html successfully! Length:", html.length);
