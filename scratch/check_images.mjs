const urls = [
  "https://koox.co.uk/cdn/shop/files/Logo_200x.png?v=1707908210",
  "https://koox.co.uk/cdn/shop/files/back.jpg?v=1713775110&width=2000",
  "https://koox.co.uk/cdn/shop/files/cleanse_e6e80502-1373-4864-9b40-57744fa31d46_420x.png?v=1709134249",
  "https://koox.co.uk/cdn/shop/files/juice_box_63421400-1753-47ed-8e78-82830ef4c137_420x.png?v=1709134276",
  "https://koox.co.uk/cdn/shop/files/sub_420x.png?v=1709134306",
  "https://cdn.shopify.com/s/files/1/0813/0579/6946/files/NabilPack_1_High_resolution.jpg?v=1709125502",
  "https://cdn.shopify.com/s/files/1/0813/0579/6946/files/NabiLpack2_1_16x9_-9.jpg?v=1709307609",
  "https://cdn.shopify.com/s/files/1/0813/0579/6946/files/drinkable_skincare__5_page-0001.jpg?v=1780654058",
  "https://cdn.shopify.com/s/files/1/0813/0579/6946/files/sa_organic_gaelic_black.png?v=1713788082"
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      console.log(`${res.status} - ${url.slice(0, 70)}...`);
    } catch (e) {
      console.error(`FAIL: ${url}`);
    }
  }
}
check();
