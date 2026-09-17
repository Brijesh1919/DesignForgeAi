import fs from "fs";

const html = fs.readFileSync("c:/Users/brijesh9177/Desktop/Projects/photo-to-design/scratch/koox.html", "utf-8");

// Search for product cards, titles, images, and prices
const cardRegex = /<div[^>]*class="[^"]*card-product[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;

// Or search for product JSON in Shopify scripts
const jsonMatches = [...html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)];
console.log("JSON scripts found:", jsonMatches.length);

// Look for products in HTML
const titles = [...html.matchAll(/class="card-title[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
console.log("Titles found:", titles);

const prices = [...html.matchAll(/class="price-item[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
console.log("Prices found:", [...new Set(prices)]);

// Search for why koox items
const whyKooxMatch = html.match(/WHY KOOX[\s\S]*?<\/section>/i);
if (whyKooxMatch) {
  console.log("WHY KOOX content:", whyKooxMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500));
}
