import fs from "fs";

async function run() {
  const res = await fetch("https://koox.co.uk/");
  const html = await res.text();
  fs.writeFileSync("scratch/koox.html", html, "utf-8");

  console.log("Downloaded koox.html. Size:", html.length);

  // Extract all text sections, products, headings, images
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  console.log("Title:", titleMatch ? titleMatch[1].trim() : "");

  // Headings
  const headings = [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  console.log("Headings:", headings);

  // Imgs
  const imgs = [...html.matchAll(/(?:src|data-src)=["']([^"']+\.(?:jpg|png|webp|svg)[^"']*)["']/gi)]
    .map(m => m[1])
    .filter(s => s.includes("cdn/shop") || s.includes("files"))
    .map(s => s.startsWith("//") ? "https:" + s : (s.startsWith("http") ? s : "https://koox.co.uk" + s));
  
  const uniqueImgs = [...new Set(imgs)];
  console.log("Unique image count:", uniqueImgs.length);
  console.log("First 20 images:", uniqueImgs.slice(0, 20));

  // Navigation
  const navLinks = [...html.matchAll(/<a[^>]+href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ text: m[2].replace(/<[^>]+>/g, '').trim(), href: m[1] }))
    .filter(l => l.text.length > 2 && l.text.length < 30);
  console.log("Nav Links:", navLinks.slice(0, 15));
}

run().catch(console.error);
