async function main() {
  console.log("Waiting for Figma plugin to reconnect...");
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("http://localhost:3001/api/bridge/status");
      const data = await res.json();
      if (data.data?.connected) {
        console.log("Plugin connected! Client count:", data.data.clientCount);
        return;
      }
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("Still not connected after 20s.");
}

main();
