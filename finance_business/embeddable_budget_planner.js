addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/budget' && request.method === 'GET') return getBudget(url);
  if (path === '/budget' && request.method === 'POST') return saveBudget(request);
  if (path === '/actual' && request.method === 'POST') return recordActual(request);
  return new Response('Not Found', { status: 404 });
}

async function getBudget(url) {
  const store = kv();
  if (!store) return noKV();
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const budgetRaw = await store.get('budget:plan:' + month);
  const actualRaw = await store.get('budget:actual:' + month);
  const plan = budgetRaw ? JSON.parse(budgetRaw) : { income: 0, categories: [] };
  const actual = actualRaw ? JSON.parse(actualRaw) : {};
  const enriched = plan.categories.map(c => ({ ...c, actual: actual[c.name] || 0, remaining: c.budgeted - (actual[c.name] || 0) }));
  return jsonResponse({ month, income: plan.income, categories: enriched, totalBudgeted: enriched.reduce((a,c)=>a+c.budgeted,0), totalActual: enriched.reduce((a,c)=>a+c.actual,0) });
}

async function saveBudget(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const month = String(body.month || new Date().toISOString().slice(0, 7)).slice(0, 7);
  const income = Math.max(0, parseFloat(body.income) || 0);
  const categories = (Array.isArray(body.categories) ? body.categories : []).map(c => ({ name: String(c.name || '').trim().slice(0, 40), budgeted: Math.max(0, parseFloat(c.budgeted) || 0) })).filter(c => c.name).slice(0, 20);
  await store.put('budget:plan:' + month, JSON.stringify({ income, categories }));
  return jsonResponse({ ok: true, month });
}

async function recordActual(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const month = String(body.month || new Date().toISOString().slice(0, 7)).slice(0, 7);
  const category = String(body.category || '').trim().slice(0, 40);
  const amount = Math.max(0, parseFloat(body.amount) || 0);
  if (!category) return jsonResponse({ error: 'category required' }, 400);
  const raw = await store.get('budget:actual:' + month);
  const actual = raw ? JSON.parse(raw) : {};
  actual[category] = (actual[category] || 0) + amount;
  await store.put('budget:actual:' + month, JSON.stringify(actual));
  return jsonResponse({ ok: true, category, total: actual[category] });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Budget Planner</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:680px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
.month-row{display:flex;gap:10px;align-items:center;margin-bottom:16px}
input{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit}
input.full{width:100%;margin-bottom:10px}
button.load{background:#475569;border:none;color:#fff;border-radius:10px;padding:9px 16px;cursor:pointer;font:inherit}
button.save{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%;margin-top:10px}
.cat-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center}
.bar-bg{background:#0f172a;border-radius:99px;height:8px;flex:1}
.bar{border-radius:99px;height:100%;transition:width .5s}
.over{background:#dc2626}.ok{background:#059669}
.summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}
.stat-box{background:#0f172a;border-radius:10px;padding:12px;text-align:center}
.stat-val{font-size:1.4rem;font-weight:800;color:#a5b4fc}
.stat-lbl{font-size:11px;color:#64748b;margin-top:2px}
</style></head>
<body><div class="wrap">
<h2>📊 Budget Planner</h2>
<div class="card">
  <div class="month-row"><input type="month" id="month"><button class="load" onclick="load()">Load</button></div>
  <div class="summary"><div class="stat-box"><div class="stat-val" id="s-income">$0</div><div class="stat-lbl">Income</div></div><div class="stat-box"><div class="stat-val" id="s-budgeted">$0</div><div class="stat-lbl">Budgeted</div></div><div class="stat-box"><div class="stat-val" id="s-actual">$0</div><div class="stat-lbl">Spent</div></div></div>
  <div id="cats-view"></div>
</div>
<div class="card"><strong>Set Budget Plan</strong>
<input class="full" id="pincome" type="number" placeholder="Monthly income" min="0">
<div id="cat-inputs">
  <div class="cat-row"><input placeholder="Category"><input type="number" placeholder="Budgeted $" min="0"><button onclick="removeCat(this)" style="background:#7f1d1d;border:none;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer">✕</button></div>
</div>
<button onclick="addCatInput()" style="background:#334155;border:none;color:#e2e8f0;border-radius:8px;padding:7px 14px;cursor:pointer;font:inherit;margin-bottom:10px">+ Category</button>
<button class="save" onclick="saveBudget()">Save Budget</button>
</div>
<div class="card"><strong>Record Spending</strong>
<div style="display:flex;gap:10px">
  <input id="acat" placeholder="Category" style="flex:1">
  <input id="aamt" type="number" placeholder="Amount" min="0.01" step="0.01" style="width:120px">
  <button onclick="addActual()" style="background:#059669;border:none;color:#fff;border-radius:10px;padding:9px 14px;cursor:pointer;font:inherit;font-weight:700">Add</button>
</div>
</div>
</div>
<script>
document.getElementById('month').value=new Date().toISOString().slice(0,7);
async function load(){
  const month=document.getElementById('month').value;
  const d=await fetch('/budget?month='+month).then(r=>r.json());
  document.getElementById('s-income').textContent='$'+d.income.toFixed(2);
  document.getElementById('s-budgeted').textContent='$'+d.totalBudgeted.toFixed(2);
  document.getElementById('s-actual').textContent='$'+d.totalActual.toFixed(2);
  document.getElementById('cats-view').innerHTML=d.categories.map(c=>{
    const pct=c.budgeted>0?Math.min(100,c.actual/c.budgeted*100):0;
    const over=c.actual>c.budgeted;
    return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:14px"><span>'+escH(c.name)+'</span><span style="color:'+(over?'#fca5a5':'#6ee7b7')+'">$'+c.actual.toFixed(2)+' / $'+c.budgeted.toFixed(2)+'</span></div><div class="bar-bg"><div class="bar '+(over?'over':'ok')+'" style="width:'+pct.toFixed(0)+'%"></div></div></div>';
  }).join('');
}
async function saveBudget(){
  const month=document.getElementById('month').value;
  const income=parseFloat(document.getElementById('pincome').value)||0;
  const rows=document.querySelectorAll('#cat-inputs .cat-row');
  const categories=[];
  rows.forEach(r=>{const inputs=r.querySelectorAll('input');const name=inputs[0].value.trim();const budgeted=parseFloat(inputs[1].value)||0;if(name)categories.push({name,budgeted});});
  await fetch('/budget',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({month,income,categories})});
  await load();
}
async function addActual(){
  const month=document.getElementById('month').value;
  const category=document.getElementById('acat').value.trim();
  const amount=parseFloat(document.getElementById('aamt').value)||0;
  if(!category||!amount){alert('Category and amount required.');return;}
  await fetch('/actual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({month,category,amount})});
  document.getElementById('aamt').value='';await load();
}
function addCatInput(){
  const div=document.createElement('div');div.className='cat-row';
  div.innerHTML='<input placeholder="Category"><input type="number" placeholder="Budgeted $" min="0"><button onclick="removeCat(this)" style="background:#7f1d1d;border:none;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer">✕</button>';
  document.getElementById('cat-inputs').appendChild(div);
}
function removeCat(btn){btn.closest('.cat-row').remove();}
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
