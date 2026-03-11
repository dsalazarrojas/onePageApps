addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/links' && request.method === 'GET') return listLinks();
  if (path === '/links' && request.method === 'POST') return addLink(request);
  if (path === '/links' && request.method === 'DELETE') return deleteLink(request);
  if (path === '/go' && request.method === 'GET') return handleGo(url);
  if (path === '/stats' && request.method === 'GET') return getStats();
  return new Response('Not Found', { status: 404 });
}

async function addLink(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || Date.now().toString(36);
  const destination = String(body.destination || '').trim();
  const label = String(body.label || id).slice(0, 100);
  if (!destination || !/^https?:\/\//i.test(destination)) return jsonResponse({ error: 'Valid https destination required' }, 400);
  const raw = await store.get('aff:links');
  const links = raw ? JSON.parse(raw) : {};
  links[id] = { id, destination, label, created: new Date().toISOString() };
  await store.put('aff:links', JSON.stringify(links));
  return jsonResponse({ ok: true, link: links[id] });
}

async function listLinks() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('aff:links');
  const links = raw ? JSON.parse(raw) : {};
  const statsRaw = await store.get('aff:clicks');
  const stats = statsRaw ? JSON.parse(statsRaw) : {};
  return jsonResponse({ links: Object.values(links).map(l => ({ ...l, clicks: stats[l.id] || 0 })) });
}

async function deleteLink(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');
  const raw = await store.get('aff:links');
  const links = raw ? JSON.parse(raw) : {};
  delete links[id];
  await store.put('aff:links', JSON.stringify(links));
  return jsonResponse({ ok: true });
}

async function handleGo(url) {
  const store = kv();
  const id = url.searchParams.get('id') || '';
  if (store && id) {
    const raw = await store.get('aff:links');
    const links = raw ? JSON.parse(raw) : {};
    if (links[id]) {
      const statsRaw = await store.get('aff:clicks');
      const stats = statsRaw ? JSON.parse(statsRaw) : {};
      stats[id] = (stats[id] || 0) + 1;
      await store.put('aff:clicks', JSON.stringify(stats));
      return Response.redirect(links[id].destination, 302);
    }
  }
  return new Response('Link not found', { status: 404 });
}

async function getStats() {
  const store = kv();
  if (!store) return noKV();
  const statsRaw = await store.get('aff:clicks');
  return jsonResponse({ clicks: statsRaw ? JSON.parse(statsRaw) : {} });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Affiliate Link Tracker</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:680px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{color:#94a3b8;text-align:left;padding:6px 8px;border-bottom:1px solid #334155}
td{padding:8px;border-bottom:1px solid #1e293b}
input{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button.add{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
.del{background:none;border:none;color:#ef4444;cursor:pointer;font-size:13px}
a{color:#a5b4fc}
</style></head>
<body><div class="wrap">
<h2>🔗 Affiliate Link Tracker</h2>
<div class="card">
  <table><thead><tr><th>ID</th><th>Label</th><th>Clicks</th><th>Short URL</th><th></th></tr></thead>
  <tbody id="tbody"><tr><td colspan="5" style="color:#475569">Loading…</td></tr></tbody></table>
</div>
<div class="card"><strong>Add Link</strong>
<input id="lid" placeholder="Short ID (e.g. product1)">
<input id="llabel" placeholder="Label">
<input id="ldest" placeholder="Destination URL (https://…)">
<button class="add" onclick="addLink()">Add Link</button>
</div>
</div>
<script>
async function load(){
  const d=await fetch('/links').then(r=>r.json());
  const base=location.origin;
  document.getElementById('tbody').innerHTML=d.links.map(l=>'<tr><td>'+escH(l.id)+'</td><td>'+escH(l.label)+'</td><td>'+l.clicks+'</td><td><a href="/go?id='+encodeURIComponent(l.id)+'" target="_blank">'+base+'/go?id='+escH(l.id)+'</a></td><td><button class="del" onclick="del(\''+escH(l.id)+'\')">✕</button></td></tr>').join('')||'<tr><td colspan="5" style="color:#475569">No links yet.</td></tr>';
}
async function addLink(){
  const id=document.getElementById('lid').value.trim();
  const label=document.getElementById('llabel').value.trim();
  const destination=document.getElementById('ldest').value.trim();
  if(!destination){alert('Destination required.');return;}
  const d=await fetch('/links',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,label,destination})}).then(r=>r.json());
  if(d.ok){['lid','llabel','ldest'].forEach(i=>document.getElementById(i).value='');await load();}
  else alert(d.error);
}
async function del(id){
  if(!confirm('Delete link '+id+'?'))return;
  await fetch('/links',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
  await load();
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
load();
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
