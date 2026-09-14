/**
 * DesignForge AI — Website URL → Figma: Playwright Renderer
 *
 * Uses Playwright to navigate to a URL, wait for full rendering
 * (fonts, images, JS), then run the in-page extraction script.
 */

import { chromium } from "playwright";
import type { WebsiteViewport, WebsiteExtractionResult } from "./WebsiteTypes.js";
import { getWebsiteExtractionScript } from "./WebsiteExtractor.js";

export interface WebsiteRenderOptions {
  viewport:          WebsiteViewport;
  timeoutMs?:        number;
  stabilizationMs?:  number;
}

/**
 * Renders a public URL in a headless Chromium browser, waits for full layout,
 * then extracts computed styles and bounding boxes.
 *
 * @throws Error if the page fails to load or times out
 */
export async function renderAndExtractWebsite(
  url: string,
  options: WebsiteRenderOptions
): Promise<WebsiteExtractionResult> {
  const timeoutMs       = options.timeoutMs       ?? 30_000;
  const stabilizationMs = options.stabilizationMs ?? 800;

  console.log(`[WebsiteToFigma] URL: ${url}`);
  console.log(`[WebsiteToFigma] Viewport: ${options.viewport.width}x${options.viewport.height}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: options.viewport.width, height: options.viewport.height },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    console.log(`[WebsiteToFigma] Opening website...`);
    // Navigate with 'domcontentloaded' so background network traffic doesn't block
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(timeoutMs, 25_000),
    });

    // Best-effort wait for window 'load' (capped at 6s)
    try {
      await page.waitForLoadState("load", { timeout: 6_000 });
    } catch (_) {
      console.log(`[WebsiteToFigma] Window load state wait timed out (continuing)...`);
    }

    // Best-effort wait for network idle (capped at 3s)
    try {
      await page.waitForLoadState("networkidle", { timeout: 3_000 });
    } catch (_) {
      // Non-fatal if long-polling or analytics keep network active
    }

    console.log(`[WebsiteToFigma] Rendering page - waiting for fonts...`);
    // Wait for fonts to be ready with a 4s cap
    await page.evaluate(
      `Promise.race([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise(r => setTimeout(r, 4000))
      ])`
    ).catch(() => {});

    // Trigger lazy-loaded images & IntersectionObservers by scrolling down the entire page
    console.log(`[WebsiteToFigma] Scrolling page to trigger lazy-loaded images...`);
    await page.evaluate(`(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 450;
        const timer = setInterval(() => {
          const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight || totalHeight > 25000) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            setTimeout(resolve, 200);
          }
        }, 40);
      });
    })()`).catch(() => {});

    // Wait for images with a 4s cap so broken/lazy images don't hang
    console.log(`[WebsiteToFigma] Waiting for images...`);
    await page.evaluate(
      `Promise.race([
        Promise.all(Array.from(document.images).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(resolve => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
                setTimeout(resolve, 3000);
              })
        )),
        new Promise(r => setTimeout(r, 4000))
      ])`
    ).catch(() => {});

    // Ensure scroll position is firmly at top before measuring coordinates
    await page.evaluate(`window.scrollTo(0, 0)`).catch(() => {});

    // Short stabilization delay to allow JS-driven layout to settle
    console.log(`[WebsiteToFigma] Analyzing layout...`);
    await page.waitForTimeout(stabilizationMs);

    // Get actual page dimensions (string form to avoid TS DOM type errors)
    const pageDimensions = await page.evaluate<{ width: number; height: number }>(
      `({ width: Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0, window.innerWidth), height: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0) })`
    );

    console.log(`[WebsiteToFigma] Page dimensions: ${pageDimensions.width}x${pageDimensions.height}`);
    console.log(`[WebsiteToFigma] Extracting styles...`);

    // Run the in-page extraction
    const extractionScript = getWebsiteExtractionScript();
    const rawResult = await page.evaluate(extractionScript) as any;

    if (rawResult?.error) {
      throw new Error(`In-page extraction failed: ${rawResult.error}`);
    }

    const result = rawResult as WebsiteExtractionResult;

    // Override page dimensions with the more accurate values from the outer evaluate
    result.pageWidth  = pageDimensions.width;
    result.pageHeight = pageDimensions.height;

    console.log(`[WebsiteToFigma] DOM elements extracted`);
    console.log(`[WebsiteToFigma] Fonts: ${result.fonts?.length ?? 0}`);
    console.log(`[WebsiteToFigma] Images: ${result.assets?.length ?? 0}`);

    return result;
  } finally {
    await browser.close();
  }
}
