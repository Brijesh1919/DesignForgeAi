import fs from "fs";

async function run() {
  const res = await fetch("https://koox.co.uk/products.json");
  const data = await res.json();
  fs.writeFileSync("scratch/koox_all_products.json", JSON.stringify(data.products, null, 2));
  console.log("Saved all 17 products to scratch/koox_all_products.json");
  data.products.forEach(p => {
    console.log(`- ${p.title} | ${p.product_type} | £${p.variants[0]?.price} | ${p.images[0]?.src}`);
  });
}
run().catch(console.error);
