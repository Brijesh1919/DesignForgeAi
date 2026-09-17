import fs from "fs";

const html = fs.readFileSync("c:/Users/brijesh9177/Desktop/Projects/photo-to-design/scratch/koox.html", "utf-8");

// Map product card HTML blocks to title and image
const productCardBlocks = [...html.matchAll(/class="product-item[^"]*"[\s\S]*?(?=class="product-item|$)/gi)];
console.log("Product item blocks:", productCardBlocks.length);

const products = [];
for (const block of productCardBlocks) {
  const text = block[0];
  const titleM = text.match(/class="card-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
  if (!titleM || titleM[1].includes("Example product")) continue;
  
  const title = titleM[1].replace(/<[^>]+>/g, '').trim();
  const priceM = text.match(/class="price-item[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  const price = priceM ? priceM[1].replace(/<[^>]+>/g, '').trim() : "£9.95";
  
  const imgM = text.match(/(?:srcset|src|data-src)=["']([^"']+\.(?:jpg|png|webp)[^"']*)["']/i);
  let img = imgM ? imgM[1] : "";
  if (img.startsWith("//")) img = "https:" + img;
  else if (img.startsWith("/")) img = "https://koox.co.uk" + img;
  
  products.push({ title, price, img });
}

console.log("Extracted products:", JSON.stringify(products, null, 2));
