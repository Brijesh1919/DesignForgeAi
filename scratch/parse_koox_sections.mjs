import fs from "fs";

const html = fs.readFileSync("c:/Users/brijesh9177/Desktop/Projects/photo-to-design/scratch/koox_main_content.html", "utf-8");

// Print all text blocks, headings, buttons, and image URLs inside each section
const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>|<div[^>]*class="[^"]*shopify-section[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;

let index = 1;
for (const match of html.matchAll(sectionRegex)) {
  const content = match[1] || match[2];
  if (!content || content.length < 50) continue;
  
  const headings = [...content.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  
  const imgs = [...content.matchAll(/(?:src|data-src)=["']([^"']+)["']/gi)]
    .map(m => m[1])
    .filter(s => s.includes('cdn/shop') || s.includes('cdn.shopify.com'));

  const textSnippets = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);

  console.log(`\n=== Section ${index++} ===`);
  console.log("Headings:", headings);
  console.log("Images:", [...new Set(imgs)].slice(0, 5));
  console.log("Snippet:", textSnippets);
}
