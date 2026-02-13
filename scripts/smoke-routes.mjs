const base = process.env.BASE_URL ?? 'http://127.0.0.1:5173';

async function must(path, init) {
  const res = await fetch(`${base}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

const health = await must('/api/health');
const created = await must('/api/lists', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ title: 'Smoke Test List' })
});
const token = created.list.shareToken;

const details = await must(`/api/lists/${token}`);
const noteId = details.notes[0]?.id;
await must(`/api/lists/${token}/notes/${noteId}/items`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ rawText: '2 bananas' })
});
const analyzed = await must(`/api/lists/${token}/items/analyze`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ items: ['milk', 'dragonfruit'] })
});

console.log(JSON.stringify({ health, tokenLength: token.length, analyzedCount: analyzed.results.length }, null, 2));
