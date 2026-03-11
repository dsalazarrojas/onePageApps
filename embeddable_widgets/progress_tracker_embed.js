addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/goals' && request.method === 'GET') return listGoals();
  if (path === '/goals' && request.method === 'POST') return upsertGoal(request);
  if (path === '/goals' && request.method === 'DELETE') return deleteGoal(request);
  return new Response('Not Found', { status: 404 });
}

async function listGoals() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('goals');
  return jsonResponse({ goals: raw ? JSON.parse(raw) : [] });
}

async function upsertGoal(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const raw = await store.get('goals');
  const goals = raw ? JSON.parse(raw) : [];
  const id = body.id || (Date.now().toString(36) + Math.random().toString(36).slice(2,5));
  const idx = goals.findIndex(g => g.id === id);
  const goal = { id, label: String(body.label || 'Goal').slice(0,100), current: Math.max(0, Number(body.current) || 0), target: Math.max(1, Number(body.target) || 100), unit: String(body.unit || '').slice(0,20), color: String(body.color || '#6366f1').slice(0,20), updated: new Date().toISOString() };
  if (idx >= 0) goals[idx] = goal; else goals.push(goal);
  await store.put('goals', JSON.stringify(goals));
  return jsonResponse({ ok: true, goal });
}

async function deleteGoal(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const raw = await store.get('goals');
  const goals = (raw ? JSON.parse(raw) : []).filter(g => g.id !== String(body.id || ''));
  await store.put('goals', JSON.stringify(goals));
  return jsonResponse({ ok: true });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Progress Tracker</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:600px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 24px}
.goal{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:16px;margin-bottom:14px}
.goal-label{display:flex;justify-content:space-between;margin-bottom:8px}
.bar-bg{background:#0f172a;border-radius:99px;height:14px;overflow:hidden}
.bar-fill{height:100%;border-radius:99px;transition:width .6s}
.pct{font-size:12px;color:#94a3b8;margin-top:4px;text-align:right}
.del{background:none;border:none;color:#ef4444;cursor:pointer;font-size:13px;padding:0}
.form{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;display:grid;gap:10px;margin-top:20px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
input{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;width:100%}
button.add{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
</style></head>
<body><div class="wrap">
<h2>📊 Progress Tracker</h2>
<div id="goals"></div>
<div class="form">
  <strong>Add / Update Goal</strong>
  <input id="glabel" placeholder="Goal label">
  <div class="row">
    <input id="gcurrent" type="number" placeholder="Current value" min="0">
    <input id="gtarget" type="number" placeholder="Target value" min="1">
  </div>
  <div class="row">
    <input id="gunit" placeholder="Unit (e.g. km, pages)">
    <input id="gcolor" type="color" value="#6366f1" style="padding:4px">
  </div>
  <button class="add" onclick="addGoal()">Save Goal</button>
</div>
</div>
<script>
let goals=[];
async function load(){
  const d=await fetch('/goals').then(r=>r.json());
  goals=d.goals||[];render();
}
function render(){
  const el=document.getElementById('goals');
  if(!goals.length){el.innerHTML='<p style="color:#475569">No goals yet.</p>';return;}
  el.innerHTML=goals.map(g=>{
    const pct=Math.min(100,Math.round(g.current/g.target*100));
    return '<div class="goal"><div class="goal-label"><span>'+escH(g.label)+(g.unit?' ('+escH(g.unit)+')':'')+'</span><button class="del" onclick="del(''+g.id+'')">✕</button></div><div class="bar-bg"><div class="bar-fill" style="width:'+pct+'%;background:'+escH(g.color)+'"></div></div><div class="pct">'+g.current+' / '+g.target+' — '+pct+'%</div></div>';
  }).join('');
}
async function addGoal(){
  const label=document.getElementById('glabel').value.trim();
  const current=+document.getElementById('gcurrent').value||0;
  const target=+document.getElementById('gtarget').value||100;
  const unit=document.getElementById('gunit').value.trim();
  const color=document.getElementById('gcolor').value;
  if(!label){alert('Label required.');return;}
  await fetch('/goals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label,current,target,unit,color})});
  ['glabel','gcurrent','gtarget','gunit'].forEach(id=>document.getElementById(id).value='');
  await load();
}
async function del(id){
  if(!confirm('Delete this goal?'))return;
  await fetch('/goals',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
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
