async function main() {
  console.log("Waiting for Figma plugin to connect to bridge...");
  for (let i = 0; i < 15; i++) {
    const res = await fetch("http://localhost:3001/api/bridge/status");
    const data = await res.json();
    if (data.data?.connected) {
      console.log("Plugin connected!");
      return;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("Plugin not connected yet.");
}

main().catch(console.error);
