async function main() {
  try {
    const res = await fetch("http://localhost:3001/api/bridge/status");
    const data = await res.json();
    console.log("Bridge status:", data);
  } catch (e) {
    console.log("Bridge offline:", e.message);
  }
}
main();
