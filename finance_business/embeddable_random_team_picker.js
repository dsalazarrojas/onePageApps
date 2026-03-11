addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/pool' && request.method === 'GET') return getPool(url);
  if (path === '/pool' && request.method === 'POST') return savePool(request);
  if (path === '/pick' && request.method === 'POST') return pickTeams(request);
  if (path === '/history' && request.method === 'GET') return getHistory(url);
  return new Response('Not Found', { status: 404 });
}

async function getPool(url) {
  const store = kv();
  if (!store) return noKV();
  const id = url.searchParams.get('id') || 'default';
  const raw = await store.get('pool:' + id);
  return jsonResponse({ id, members: raw ? JSON.parse(raw) : [] });
}

async function savePool(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || 'default').slice(0, 40);
  const members = (Array.isArray(body.members) ? body.members : []).map(m => String(m).trim().slice(0, 60)).filter(Boolean).slice(0, 200);
  await store.put('pool:' + id, JSON.stringify(members));
  return jsonResponse({ ok: true, id, count: members.length });
}

async function pickTeams(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || 'default').slice(0, 40);
  const teamCount = Math.max(2, parseInt(body.teams, 10) || 2);
  const raw = await store.get('pool:' + id);
  const members = raw ? JSON.parse(raw) : [];
  if (!members.length) return jsonResponse({ error: 'Pool is empty' }, 400);
  const shuffled = [...members].sort(() => Math.random() - 0.5);
  const teams = Array.from({ length: teamCount }, () => []);
  shuffled.forEach((m, i) => teams[i % teamCount].push(m));
  const result = { id, teams, ts: new Date().toISOString() };
  const histRaw = await store.get('pool:hist:' + id);
  const hist = histRaw ? JSON.parse(histRaw) : [];
  hist.unshift(result);
  await store.put('pool:hist:' + id, JSON.stringify(hist.slice(0, 20)));
  return jsonResponse({ ok: true, ...result });
}

async function getHistory(url) {
  const store = kv();
  if (!store) return noKV();
  const id = url.searchParams.get('id') || 'default';
  const raw = await store.get('pool:hist:' + id);
  return jsonResponse({ id, history: raw ? JSON.parse(raw) : [] });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Random Team Picker</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:620px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
input,textarea{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button.pick{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:12px;cursor:pointer;font:inherit;font-weight:700;width:100%}
button.save{background:#0f766e;border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
.teams{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:14px}
.team{background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px}
.team-name{font-weight:700;color:#a5b4fc;margin-bottom:8px;font-size:13px}
.member{font-size:14px;padding:4px 0;border-bottom:1px solid #1e293b}
.num-row{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.num-row input{margin:0;width:80px}
</style></head>
<body><div class="wrap">
<h2>🎲 Random Team Picker</h2>
<div class="card"><strong>Members Pool</strong>
<input id="poolid" placeholder="Pool ID (default)">
<textarea id="members" placeholder="One name per line" rows="6"></textarea>
<button class="save" onclick="savePool()">Save Pool</button>
</div>
<div class="card"><strong>Pick Teams</strong>
<div class="num-row"><label>Number of teams:</label><input type="number" id="nteams" value="2" min="2" max="20" style="width:80px;margin:0"></div>
<button class="pick" onclick="pick()">🎲 Pick Teams!</button>
<div class="teams" id="teams"></div>
</div>
</div>
<script>
async function savePool(){
  const id=document.getElementById('poolid').value.trim()||'default';
  const members=document.getElementById('members').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!members.length){alert('Enter at least one member.');return;}
  const d=await fetch('/pool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,members})}).then(r=>r.json());
  if(d.ok)alert('Saved '+d.count+' members in pool "'+id+'".');
  else alert(d.error);
}
async function pick(){
  const id=document.getElementById('poolid').value.trim()||'default';
  const teams=+document.getElementById('nteams').value||2;
  const d=await fetch('/pick',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,teams})}).then(r=>r.json());
  if(!d.ok){alert(d.error);return;}
  const colors=['#6366f1','#059669','#d97706','#dc2626','#0284c7','#7c3aed'];
  document.getElementById('teams').innerHTML=d.teams.map((t,i)=>'<div class="team"><div class="team-name" style="color:'+colors[i%colors.length]+'">Team '+(i+1)+'</div>'+t.map(m=>'<div class="member">'+escH(m)+'</div>').join('')+'</div>').join('');
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
// Load existing pool
(async()=>{const d=await fetch('/pool?id=default').then(r=>r.json());if(d.members.length)document.getElementById('members').value=d.members.join('\n');})();
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
