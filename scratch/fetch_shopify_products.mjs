async function run() {
  const res = await fetch("https://koox.co.uk/products.json");
  const data = await res.json();
  console.log("Total products from Shopify API:", data.products.length);
  for (const p of data.products.slice(0, 10)) {
    console.log(`- ${p.title} (${p.variants[0]?.price}): ${p.images[0]?.src}`);
  }
}
run().catch(console.error);
