import fs from "fs";

const html = fs.readFileSync("c:/Users/brijesh9177/Desktop/Projects/photo-to-design/scratch/koox.html", "utf-8");

// Look for shopify section IDs or main content blocks
const sections = [...html.matchAll(/class="shopify-section[^"]*"[^>]*id="shopify-section-([^"]*)"/gi)];
console.log("Section IDs:", sections.map(s => s[1]));

// Look for banner images and main content
const backgroundImages = [...html.matchAll(/background(?:-image)?:\s*url\(['"]?([^'"\)]+)['"]?\)/gi)];
console.log("CSS background images:", backgroundImages.map(b => b[1]));

// Look for all img src or data-srcset
const allImgs = [...html.matchAll(/(?:srcset|src|data-src|data-srcset)=["']([^"']+)["']/gi)]
  .map(m => m[1])
  .filter(s => s.includes("cdn/shop/files") || s.includes("cdn.shopify.com"))
  .flatMap(s => s.split(',').map(part => part.trim().split(' ')[0]))
  .filter(s => s.includes('.jpg') || s.includes('.png') || s.includes('.webp'));

console.log("All Shopify CDN images count:", new Set(allImgs).size);
console.log("All unique images:", [...new Set(allImgs)]);
