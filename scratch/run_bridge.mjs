export async function executeFigmaCode(code) {
  const res = await fetch('http://localhost:3001/api/bridge/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'EVAL_SCRIPT', payload: { code } })
  });
  const data = await res.json();
  return data;
}

if (process.argv[2]) {
  import('fs').then(fs => {
    const code = fs.readFileSync(process.argv[2], 'utf-8');
    executeFigmaCode(code).then(d => console.log(JSON.stringify(d, null, 2)));
  });
}
