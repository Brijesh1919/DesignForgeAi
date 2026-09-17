import fs from "fs";

const html = fs.readFileSync("c:/Users/brijesh9177/Desktop/Projects/photo-to-design/scratch/koox.html", "utf-8");

// Extract all images
const allImgs = [...html.matchAll(/(?:srcset|src|data-src|data-srcset)=["']([^"']+)["']/gi)]
  .map(m => m[1])
  .filter(s => s.includes("cdn/shop/files") || s.includes("cdn.shopify.com"))
  .flatMap(s => s.split(',').map(part => part.trim().split(' ')[0]))
  .filter(s => s.includes('.jpg') || s.includes('.png') || s.includes('.webp'))
  .map(s => s.startsWith('//') ? 'https:' + s : (s.startsWith('http') ? s : 'https://koox.co.uk' + s));

console.log("Unique Image URLs:", [...new Set(allImgs)]);

// Let's inspect the sections on the page
const sectionMatches = [...html.matchAll(/<!--\s*BEGIN content_for_index\s*-->([\s\S]*?)<!--\s*END content_for_index\s*-->/gi)];
if (sectionMatches.length > 0) {
  console.log("Found content_for_index!");
  fs.writeFileSync("scratch/koox_main_content.html", sectionMatches[0][1], "utf-8");
} else {
  // Let's look for <main
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    fs.writeFileSync("scratch/koox_main_content.html", mainMatch[1], "utf-8");
    console.log("Saved <main> to scratch/koox_main_content.html");
  }
}
