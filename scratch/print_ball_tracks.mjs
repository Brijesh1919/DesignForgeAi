async function main() {
  const res = await fetch("http://localhost:3001/api/bridge/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "GET_CANVAS_SELECTION",
      payload: { maxDepth: 4, nodeId: "820:7979" },
      timeoutMs: 15000,
    }),
  });
  const data = await res.json();
  const frame = data.data?.selection?.[0];
  const ball = frame?.children?.find(c => c.name === "Ball");
  console.log("=== BALL MANUAL KEYFRAME TRACKS ===");
  console.log("Tracks on Ball:", Object.keys(ball?.nodeManualKeyframeTracks || {}));
  for (const [k, track] of Object.entries(ball?.nodeManualKeyframeTracks || {})) {
    console.log(`\nTrack: ${k} (Keyframes: ${track.keyframes?.length})`);
    track.keyframes?.forEach((kf, idx) => {
      console.log(`  [${idx}] t=${kf.timelinePosition}s, val=${kf.value?.value}, easing=${kf.easing?.type}`);
    });
  }
}

main().catch(console.error);
