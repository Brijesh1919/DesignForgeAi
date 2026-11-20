async function main() {
  const code = `
    const hashes = [
      "df4bba0a9467ce46cfaf29ff39a3bef993fb82ba",
      "bbdf1340bd6a32fecd172be4550d12a0fc3bb6aa",
      "51f15da5298768c124a2099fc777514829a78a60",
      "0cebb3a95ee925b7f4534a82d25507f75a2f7b10",
      "8dcb3836316be569d7871ce2926229c5ad34d3ae",
      "36ffd210e4eca8bc44652ea9ff70d791aaf76d1f",
      "604cec058a98d1aa20fecefe76f6a579bccd98d7",
      "e4651da1f8634c00f79c5460903d77c235b4f285",
      "f5f268cb593f8e3f81b0986bdb024f774790e8c5",
      "47851d5b18c67a22347d97e8c9bfabce3ecc1089",
      "74a1a6ae11ac82b38c12baded0399cdecc427afa",
      "19f197e33989c4b558be6c7cf9281ea405bd6ba3",
      "602c2705f1c18bf9081c2d7abd8479e0efca7c75"
    ];

    const results = {};
    for (const h of hashes) {
      results[h] = !!figma.getImageByHash(h);
    }
    return results;
  `;

  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "EVAL_SCRIPT",
      payload: { code },
      timeoutMs: 15000,
    }),
  });

  const data = await res.json();
  console.log("Image hashes verification:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
