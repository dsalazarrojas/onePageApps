addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/events' && request.method === 'GET') return listEvents(url);
  if (path === '/events' && request.method === 'POST') return addEvent(request);
  return new Response('Not Found', { status: 404 });
}

async function listEvents(url) {
  const store = kv();
  if (!store) return noKV();
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '10', 10));
  const list = await store.list({ prefix: 'sp:' });
  const entries = await Promise.all(list.keys.slice(0, 200).map(async k => {
    try { return JSON.parse(await store.get(k.name)); } catch { return null; }
  }));
  const sorted = entries.filter(Boolean).sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, limit);
  return jsonResponse({ events: sorted });
}

async function addEvent(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,5),
    name: String(body.name || 'Someone').slice(0,60),
    action: String(body.action || 'purchased').slice(0,80),
    item: String(body.item || '').slice(0,80),
    location: String(body.location || '').slice(0,60),
    ts: new Date().toISOString()
  };
  await store.put('sp:' + entry.id, JSON.stringify(entry), { expirationTtl: 86400 * 7 });
  return jsonResponse({ ok: true, entry });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Social Proof Popup</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:600px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.popup{position:fixed;bottom:24px;left:24px;background:#1e293b;border:1px solid #334155;border-radius:14px;padding:14px 18px;max-width:300px;display:none;animation:slideIn .4s;box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:9999}
@keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.popup .who{font-weight:700;color:#a5b4fc;font-size:14px}
.popup .what{font-size:13px;color:#cbd5e1;margin-top:2px}
.popup .when{font-size:11px;color:#475569;margin-top:4px}
.form{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;display:grid;gap:10px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
input{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;width:100%}
button{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
.feed{display:flex;flex-direction:column;gap:10px;margin-top:24px}
.feed-item{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px}
</style></head>
<body><div class="wrap">
<h2>🔔 Social Proof Popup</h2>
<div class="form">
  <strong>Add Event</strong>
  <div class="row">
    <input id="ename" placeholder="Name (e.g. Alice)">
    <input id="eaction" placeholder="Action (e.g. purchased)">
  </div>
  <div class="row">
    <input id="eitem" placeholder="Item / product">
    <input id="eloc" placeholder="Location (optional)">
  </div>
  <button onclick="addEv()">Add Event</button>
</div>
<div id="feed" class="feed"></div>
</div>
<div class="popup" id="popup">
  <div class="who" id="pwho"></div>
  <div class="what" id="pwhat"></div>
  <div class="when" id="pwhen"></div>
</div>
<script>
let evs=[],cur=0;
async function load(){
  const d=await fetch('/events?limit=20').then(r=>r.json());
  evs=d.events||[];
  document.getElementById('feed').innerHTML=evs.map(e=>'<div class="feed-item"><strong>'+escH(e.name)+'</strong> '+escH(e.action)+(e.item?' <em>'+escH(e.item)+'</em>':'')+(e.location?' from '+escH(e.location):'')+'<div style="font-size:11px;color:#475569;margin-top:4px">'+escH(e.ts.replace('T',' ').slice(0,19))+'</div></div>').join('');
  cyclePopup();
}
function cyclePopup(){
  if(!evs.length)return;
  const e=evs[cur%evs.length];cur++;
  const popup=document.getElementById('popup');
  document.getElementById('pwho').textContent=e.name;
  document.getElementById('pwhat').textContent=e.action+(e.item?' '+e.item:'')+(e.location?' · '+e.location:'');
  document.getElementById('pwhen').textContent=new Date(e.ts).toLocaleString();
  popup.style.display='block';
  setTimeout(()=>{popup.style.display='none';},4000);
  setTimeout(cyclePopup,7000);
}
async function addEv(){
  const name=document.getElementById('ename').value.trim();
  const action=document.getElementById('eaction').value.trim();
  const item=document.getElementById('eitem').value.trim();
  const location=document.getElementById('eloc').value.trim();
  if(!name||!action){alert('Name and action required.');return;}
  await fetch('/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,action,item,location})});
  ['ename','eaction','eitem','eloc'].forEach(id=>document.getElementById(id).value='');
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
