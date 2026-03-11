addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/donate' && request.method === 'POST') return handleDonate(request);
  if (path === '/stats' && request.method === 'GET') return getStats();
  if (path === '/config' && request.method === 'POST') return setConfig(request);
  if (path === '/widget.js' && request.method === 'GET') return serveWidget(url);
  return new Response('Not Found', { status: 404 });
}

async function getStats() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('donation:stats');
  const cfg = await store.get('donation:config');
  const stats = raw ? JSON.parse(raw) : { raised: 0, donors: 0 };
  const config = cfg ? JSON.parse(cfg) : { goal: 1000, currency: 'USD', title: 'Fundraiser' };
  return jsonResponse({ ...config, ...stats, pct: config.goal > 0 ? Math.min(100, Math.round(stats.raised / config.goal * 100)) : 0 });
}

async function handleDonate(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const amount = Math.max(0, parseFloat(body.amount) || 0);
  if (amount <= 0) return jsonResponse({ error: 'amount must be > 0' }, 400);
  const raw = await store.get('donation:stats');
  const stats = raw ? JSON.parse(raw) : { raised: 0, donors: 0 };
  stats.raised = Math.round((stats.raised + amount) * 100) / 100;
  stats.donors++;
  await store.put('donation:stats', JSON.stringify(stats));
  const cfgRaw = await store.get('donation:config');
  const config = cfgRaw ? JSON.parse(cfgRaw) : { goal: 1000, currency: 'USD', title: 'Fundraiser' };
  const entry = { amount, name: String(body.name || 'Anonymous').slice(0, 60), message: String(body.message || '').slice(0, 200), ts: new Date().toISOString() };
  const histRaw = await store.get('donation:history');
  const hist = histRaw ? JSON.parse(histRaw) : [];
  hist.unshift(entry);
  await store.put('donation:history', JSON.stringify(hist.slice(0, 100)));
  const webhook = getStringBinding('WEBHOOK_URL');
  if (webhook) { try { await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entry, stats }) }); } catch {} }
  return jsonResponse({ ok: true, raised: stats.raised, donors: stats.donors, pct: config.goal > 0 ? Math.min(100, Math.round(stats.raised / config.goal * 100)) : 0 });
}

async function setConfig(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const config = { goal: Math.max(1, parseFloat(body.goal) || 1000), currency: String(body.currency || 'USD').slice(0, 5), title: String(body.title || 'Fundraiser').slice(0, 100) };
  await store.put('donation:config', JSON.stringify(config));
  return jsonResponse({ ok: true, config });
}

function serveWidget(url) {
  const base = url.origin;
  const js = `(function(){
  const el=document.getElementById('donation-widget');
  if(!el)return;
  async function render(){
    const d=await fetch('${base}/stats').then(r=>r.json());
    el.innerHTML='<div style="font-family:system-ui,sans-serif;background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;color:#e2e8f0;max-width:400px">'
      +'<div style="font-weight:700;margin-bottom:8px">'+d.title+'</div>'
      +'<div style="background:#0f172a;border-radius:99px;height:16px;margin-bottom:8px"><div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);height:100%;border-radius:99px;width:'+d.pct+'%;transition:width .6s"></div></div>'
      +'<div style="display:flex;justify-content:space-between;font-size:13px;color:#94a3b8"><span>'+d.raised+' '+d.currency+' raised</span><span>'+d.pct+'% of '+d.goal+'</span></div>'
      +'<div style="font-size:12px;color:#64748b;margin-top:4px">'+d.donors+' donor'+(d.donors!==1?'s':'')+'</div>'
      +'</div>';
  }
  render();
})();`;
  return new Response(js, { status: 200, headers: { 'Content-Type': 'application/javascript', ...corsHeaders() } });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Donation Progress</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:540px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:20px}
.bar-bg{background:#0f172a;border-radius:99px;height:18px;overflow:hidden;margin:10px 0}
.bar-fill{background:linear-gradient(90deg,#6366f1,#8b5cf6);height:100%;border-radius:99px;transition:width .6s}
.stats{display:flex;justify-content:space-between;font-size:14px;color:#94a3b8}
input{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button{width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:11px;font:inherit;font-weight:700;cursor:pointer}
.donor-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.donor{background:#0f172a;border-radius:10px;padding:10px;font-size:13px}
</style></head>
<body><div class="wrap">
<h2>💸 Donation Progress Bar</h2>
<div class="card">
  <div id="title" style="font-size:1.1rem;font-weight:700;margin-bottom:12px">Loading…</div>
  <div class="bar-bg"><div class="bar-fill" id="bar" style="width:0%"></div></div>
  <div class="stats"><span id="raised">—</span><span id="pct">—</span></div>
  <div style="font-size:12px;color:#64748b;margin-top:4px" id="donors">—</div>
</div>
<div class="card"><strong>Make a Donation</strong>
<input id="dname" placeholder="Name (optional)">
<input id="damount" type="number" min="1" step="0.01" placeholder="Amount">
<input id="dmsg" placeholder="Message (optional)">
<button onclick="donate()">Donate</button>
</div>
<div class="card"><strong>Setup</strong>
<input id="cgoal" type="number" placeholder="Goal amount">
<input id="ccurrency" placeholder="Currency (e.g. USD)">
<input id="ctitle" placeholder="Campaign title">
<button onclick="setConfig()">Save Config</button>
</div>
<div class="card" id="history" style="display:none"><strong>Recent Donors</strong><div class="donor-list" id="dlist"></div></div>
</div>
<script>
async function load(){
  const d=await fetch('/stats').then(r=>r.json());
  document.getElementById('title').textContent=d.title||'Fundraiser';
  document.getElementById('bar').style.width=d.pct+'%';
  document.getElementById('raised').textContent=d.raised+' '+(d.currency||'USD')+' raised';
  document.getElementById('pct').textContent=d.pct+'% of '+(d.goal||0);
  document.getElementById('donors').textContent=d.donors+' donor'+(d.donors!==1?'s':'');
}
async function donate(){
  const amount=parseFloat(document.getElementById('damount').value)||0;
  const name=document.getElementById('dname').value.trim();
  const message=document.getElementById('dmsg').value.trim();
  if(amount<=0){alert('Enter a valid amount.');return;}
  const d=await fetch('/donate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,name,message})}).then(r=>r.json());
  if(d.ok){document.getElementById('damount').value='';document.getElementById('dmsg').value='';await load();}
  else alert(d.error||'Error');
}
async function setConfig(){
  const goal=parseFloat(document.getElementById('cgoal').value)||1000;
  const currency=document.getElementById('ccurrency').value.trim()||'USD';
  const title=document.getElementById('ctitle').value.trim()||'Fundraiser';
  await fetch('/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal,currency,title})});
  await load();
}
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
