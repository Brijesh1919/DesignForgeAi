import fs from "fs";

async function main() {
  const hashes = [
    "df4bba0a9467ce46cfaf29ff39a3bef993fb82ba",
    "bbdf1340bd6a32fecd172be4550d12a0fc3bb6aa",
    "04b9f14f9c2527cdf8b50c025e4859c3cd3135f7",
    "2a98b25ec110b5e02bde670a5b3e02f08a133017",
    "79b6c3d2940092833d90707b6d34bc364460ea2f",
    "496b77b83173f70b2b669e5d3703ca8f6d7b377b",
    "f44f1cdbedc29a6c042df9e1ca4e2bcbf24619b4",
    "488728e78802a2610b9e8d68a0368fa02585dde0",
    "177c0a367135133a51bfc5572965f036c86b6d35",
    "0aef375709775d9df03e1cec03cf9d610c822b18",
    "feab3dc1e1c830e0019a4cc1ed88005cae1237df",
    "3ba2efb65f0c27636ff3889ceff6053540911c78",
    "0e2563b1b3a585fc3324ffb6737faa91d6746c77",
    "e2d01f28890179d0491ebd67820465d82fd16dbc",
    "6431f4bf4699b9c6f00a2d704f66e77818bb8d51",
    "461b3ab29b75be77c438a1193451cda0d8b9b35f",
    "959be2537419aebc8677079edfeab6f4a622f1be",
    "fc790411bbc1af8e831c239234a424bc2a8a9d35",
    "b1c783a5fd66f6ad350d50a8abd6f868b94a352d",
    "19f197e33989c4b558be6c7cf9281ea405bd6ba3",
    "55719ae740899f24d957a7d74a47a9877ad48f8d",
    "74a1a6ae11ac82b38c12baded0399cdecc427afa",
    "47851d5b18c67a22347d97e8c9bfabce3ecc1089",
    "c0f3dad7f1df9d2dc0138744e3f116e6bc053d17",
    "78dbfde2ceacea30742c15a42d9f1018e05988d5",
    "602c2705f1c18bf9081c2d7abd8479e0efca7c75",
  ];

  const code = `
    const list = ${JSON.stringify(hashes)};
    const res = {};
    for (const h of list) {
      res[h] = !!figma.getImageByHash(h);
    }
    return res;
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "EVAL_SCRIPT", payload: { code } }),
  });

  const data = await res.json();
  console.log("Verification of all 26 hashes:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
