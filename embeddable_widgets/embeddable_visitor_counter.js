addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/count' && request.method === 'POST') return handleCount(request);
  if (path === '/stats' && request.method === 'GET') return handleStats(request);
  return new Response('Not Found', { status: 404 });
}

async function handleCount(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const pageKey = 'vc:' + String(body.page || 'default').slice(0, 200);
  const raw = await store.get(pageKey);
  const count = raw ? parseInt(raw, 10) + 1 : 1;
  await store.put(pageKey, String(count));
  return jsonResponse({ page: body.page || 'default', count });
}

async function handleStats(request) {
  const store = kv();
  if (!store) return noKV();
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || 'default';
  const raw = await store.get('vc:' + page);
  return jsonResponse({ page, count: raw ? parseInt(raw, 10) : 0 });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visitor Counter</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:36px;max-width:420px;width:100%;text-align:center}
h1{margin:0 0 8px;font-size:2rem}p{color:#94a3b8;margin:0 0 24px}
input{width:100%;border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:10px;font:inherit;margin-bottom:12px}
button{width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;padding:12px;font:inherit;font-weight:700;cursor:pointer}
.count{font-size:4rem;font-weight:800;margin:16px 0;color:#a5b4fc}</style></head>
<body><div class="card"><h1>Visitor Counter</h1><p>Track page views with KV-backed persistence.</p>
<input id="page" placeholder="Page name (default)" value="home">
<button onclick="count()">Record Visit &amp; Show Count</button>
<div class="count" id="out">—</div></div>
<script>
async function count(){
  const page=document.getElementById('page').value.trim()||'default';
  const r=await fetch('/count',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page})});
  const d=await r.json();
  document.getElementById('out').textContent=d.count!=null?d.count.toLocaleString():d.error;
}
</script></body></html>`;
  return new Response(html, { status: 200, headers: htmlHeaders() });
}

// ── helpers ──────────────────────────────────────────────────────────────────
function kv() { return typeof globalThis['DATA'] === 'undefined' ? null : globalThis['DATA']; }
function getStringBinding(name, fallback = '') {
  const v = globalThis[name]; return (typeof v === 'string' && v.trim()) ? v.trim() : fallback;
}
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}
function htmlHeaders() { return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() }; }
function jsonHeaders() { return { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
function noKV() { return jsonResponse({ error: 'DATA KV namespace binding is required. Bind your KV namespace as DATA and redeploy.' }, 503); }
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
