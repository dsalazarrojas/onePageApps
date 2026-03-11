addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/expenses' && request.method === 'GET') return listExpenses(url);
  if (path === '/expenses' && request.method === 'POST') return addExpense(request);
  if (path === '/expenses' && request.method === 'DELETE') return deleteExpense(request);
  if (path === '/summary' && request.method === 'GET') return getSummary(url);
  return new Response('Not Found', { status: 404 });
}

async function listExpenses(url) {
  const store = kv();
  if (!store) return noKV();
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const raw = await store.get('exp:' + month);
  return jsonResponse({ month, expenses: raw ? JSON.parse(raw) : [] });
}

async function addExpense(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const amount = parseFloat(body.amount);
  if (!amount || amount <= 0) return jsonResponse({ error: 'amount > 0 required' }, 400);
  const date = String(body.date || new Date().toISOString().slice(0, 10));
  const month = date.slice(0, 7);
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    date, amount: Math.round(amount * 100) / 100,
    category: String(body.category || 'Other').slice(0, 40),
    description: String(body.description || '').slice(0, 200)
  };
  const raw = await store.get('exp:' + month);
  const expenses = raw ? JSON.parse(raw) : [];
  expenses.push(entry);
  await store.put('exp:' + month, JSON.stringify(expenses));
  return jsonResponse({ ok: true, entry });
}

async function deleteExpense(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');
  const month = String(body.month || new Date().toISOString().slice(0, 7));
  const raw = await store.get('exp:' + month);
  const expenses = (raw ? JSON.parse(raw) : []).filter(e => e.id !== id);
  await store.put('exp:' + month, JSON.stringify(expenses));
  return jsonResponse({ ok: true });
}

async function getSummary(url) {
  const store = kv();
  if (!store) return noKV();
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const raw = await store.get('exp:' + month);
  const expenses = raw ? JSON.parse(raw) : [];
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const byCategory = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  return jsonResponse({ month, total: Math.round(total * 100) / 100, byCategory, count: expenses.length });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Expense Tracker</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:620px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
.month-row{display:flex;gap:10px;align-items:center;margin-bottom:16px}
input[type=month]{flex:1}
input{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
button.add{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
table{width:100%;border-collapse:collapse;font-size:14px}
th{color:#94a3b8;text-align:left;padding:6px 8px;border-bottom:1px solid #334155}
td{padding:8px;border-bottom:1px solid #1e293b}
.del{background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px}
.total{font-size:1.5rem;font-weight:800;color:#a5b4fc}
.cat-bar{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px}
.cat-fill{height:8px;border-radius:99px;background:#6366f1;min-width:4px}
</style></head>
<body><div class="wrap">
<h2>💰 Expense Tracker</h2>
<div class="card">
  <div class="month-row"><input type="month" id="month" onchange="load()"><button style="background:#475569;border:none;color:#fff;border-radius:8px;padding:8px 14px;cursor:pointer;font:inherit" onclick="load()">Load</button></div>
  <div class="total" id="total">$0.00</div>
  <div style="font-size:13px;color:#64748b;margin-bottom:12px" id="count">No expenses</div>
  <div id="cats"></div>
</div>
<div class="card"><strong>Add Expense</strong>
<div class="row">
  <input type="date" id="edate">
  <input type="number" id="eamt" placeholder="Amount" min="0.01" step="0.01">
</div>
<div class="row">
  <input id="ecat" placeholder="Category">
  <input id="edesc" placeholder="Description">
</div>
<button class="add" onclick="addExp()">Add Expense</button>
</div>
<div class="card"><strong>Expenses</strong>
<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
<tbody id="tbody"></tbody></table>
</div>
</div>
<script>
document.getElementById('month').value=new Date().toISOString().slice(0,7);
document.getElementById('edate').value=new Date().toISOString().slice(0,10);
async function load(){
  const month=document.getElementById('month').value;
  const [d,s]=await Promise.all([fetch('/expenses?month='+month).then(r=>r.json()),fetch('/summary?month='+month).then(r=>r.json())]);
  document.getElementById('total').textContent='$'+s.total.toFixed(2);
  document.getElementById('count').textContent=s.count+' expense'+(s.count!==1?'s':'');
  const entries=Object.entries(s.byCategory).sort((a,b)=>b[1]-a[1]);
  document.getElementById('cats').innerHTML=entries.map(([c,v])=>'<div class="cat-bar"><span style="min-width:100px">'+escH(c)+'</span><div class="cat-fill" style="width:'+Math.min(200,(v/s.total*200||0)).toFixed(0)+'px"></div><span>$'+v.toFixed(2)+'</span></div>').join('');
  document.getElementById('tbody').innerHTML=d.expenses.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>'<tr><td>'+escH(e.date)+'</td><td>'+escH(e.category)+'</td><td>'+escH(e.description)+'</td><td>$'+e.amount.toFixed(2)+'</td><td><button class="del" onclick="del(\''+e.id+'\')">✕</button></td></tr>').join('');
}
async function addExp(){
  const amount=parseFloat(document.getElementById('eamt').value);
  const date=document.getElementById('edate').value;
  const category=document.getElementById('ecat').value.trim()||'Other';
  const description=document.getElementById('edesc').value.trim();
  if(!amount||!date){alert('Date and amount required.');return;}
  await fetch('/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,date,category,description})});
  document.getElementById('eamt').value='';document.getElementById('edesc').value='';
  await load();
}
async function del(id){
  const month=document.getElementById('month').value;
  await fetch('/expenses',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,month})});
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
