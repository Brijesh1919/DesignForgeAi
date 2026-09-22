async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/status");
  const data = await res.json();
  console.log("Bridge status:", data);
}

main().catch(console.error);
