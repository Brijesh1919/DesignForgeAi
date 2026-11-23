async function main() {
  const hashes = [
    "8c8fb9aaae781407a4059eb0be5e012c397160e8",
    "8e82f515726146ddfead18527fcd6420ba87a265",
    "df5759a7acead31488843214cd8199120d0ab193",
    "5c187525ec2185f6dd7e54cc3fed07c4eaf67af4",
    "247ee3ee397ea5dbbec5854d8cbd7fed166f6b9e",
    "0e181965f9ce2896f9463e83baa1fbd8818d898e",
    "588e9372e5c53e383be47b00f01afa0c10dd1157",
    "efdd7c0651cb8f54fa76e8f89cc7febde3792525",
    "483e4e6edfac3f7868b973658cf68bd734d30594",
    "c691c89ff4de82c8484dc0a5e23a3c14339ea580",
    "d5cfcb0872c4e1614fde242f0203cb0193497532",
    "7ddb3dcd4a767fba4450b0ba959fa6867741c083",
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
  console.log("Image hashes verification:", JSON.stringify(data.data?.data, null, 2));
}

main().catch(console.error);
