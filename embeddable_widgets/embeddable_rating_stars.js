addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/rate' && request.method === 'POST') return handleRate(request);
  if (path === '/stats' && request.method === 'GET') return getStats(url);
  if (path === '/widget.js' && request.method === 'GET') return serveWidgetJs(url);
  return new Response('Not Found', { status: 404 });
}

async function handleRate(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const item = String(body.item || 'default').slice(0, 100);
  const star = parseInt(body.stars, 10);
  if (!star || star < 1 || star > 5) return jsonResponse({ error: 'stars 1-5 required' }, 400);
  const key = 'rating:' + item;
  const raw = await store.get(key);
  const data = raw ? JSON.parse(raw) : { count: 0, total: 0 };
  data.count++;
  data.total += star;
  data.avg = Math.round((data.total / data.count) * 10) / 10;
  await store.put(key, JSON.stringify(data));
  return jsonResponse({ ok: true, item, avg: data.avg, count: data.count });
}

async function getStats(url) {
  const store = kv();
  if (!store) return noKV();
  const item = url.searchParams.get('item') || 'default';
  const raw = await store.get('rating:' + item);
  if (!raw) return jsonResponse({ item, avg: 0, count: 0 });
  const data = JSON.parse(raw);
  return jsonResponse({ item, avg: data.avg || 0, count: data.count || 0 });
}

function serveWidgetJs(url) {
  const base = url.origin;
  const js = `(function(cfg){
  const item=cfg.item||'default';
  const el=document.getElementById(cfg.target||'rating-widget');
  if(!el)return;
  function star(n){return '<span data-v="'+n+'" style="cursor:pointer;font-size:1.5rem;color:#fbbf24;">★</span>';}
  el.innerHTML='<div id="rw-stars">'+[1,2,3,4,5].map(star).join('')+'</div><div id="rw-msg" style="font-size:13px;color:#94a3b8;margin-top:4px"></div>';
  el.querySelectorAll('[data-v]').forEach(s=>{
    s.addEventListener('click',async()=>{
      const r=await fetch('${base}/rate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({item,stars:+s.dataset.v})});
      const d=await r.json();
      document.getElementById('rw-msg').textContent=d.avg+' avg ('+d.count+' ratings)';
      el.querySelectorAll('[data-v]').forEach(x=>x.style.color=+x.dataset.v<=+s.dataset.v?'#f59e0b':'#94a3b8');
    });
  });
  fetch('${base}/stats?item='+encodeURIComponent(item)).then(r=>r.json()).then(d=>{
    if(d.count)document.getElementById('rw-msg').textContent=d.avg+' avg ('+d.count+' ratings)';
  });
})(window.RatingWidget||{});`;
  return new Response(js, { status: 200, headers: { 'Content-Type': 'application/javascript', ...corsHeaders() } });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rating Stars Widget</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:520px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:24px;margin-bottom:20px}
.stars{display:flex;gap:6px;font-size:2.4rem;cursor:pointer}
.star{color:#475569;transition:color .15s}
.star.on{color:#fbbf24}
button{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px 20px;cursor:pointer;font:inherit;font-weight:700;margin-top:14px}
code{background:#0f172a;padding:2px 6px;border-radius:6px;font-size:13px}
.stats{font-size:14px;color:#94a3b8;margin-top:12px}
</style></head>
<body><div class="wrap">
<h2>⭐ Rating Stars Widget</h2>
<div class="card">
<div id="item-demo">Item: <strong>demo-product</strong></div>
<div class="stars" id="stars">
  <span class="star" data-v="1">★</span><span class="star" data-v="2">★</span><span class="star" data-v="3">★</span><span class="star" data-v="4">★</span><span class="star" data-v="5">★</span>
</div>
<div class="stats" id="stats">Loading…</div>
</div>
<div class="card"><strong>Embed script:</strong><br>
<code id="snippet">&lt;div id="rating-widget"&gt;&lt;/div&gt;<br>&lt;script&gt;window.RatingWidget={item:'my-item'}&lt;/script&gt;<br>&lt;script src="https://YOUR_WORKER.workers.dev/widget.js"&gt;&lt;/script&gt;</code>
</div>
</div>
<script>
let sel=0;
document.querySelectorAll('.star').forEach(s=>{
  s.addEventListener('mouseover',()=>document.querySelectorAll('.star').forEach(x=>x.classList.toggle('on',+x.dataset.v<=+s.dataset.v)));
  s.addEventListener('mouseout',()=>document.querySelectorAll('.star').forEach(x=>x.classList.toggle('on',+x.dataset.v<=sel)));
  s.addEventListener('click',async()=>{
    sel=+s.dataset.v;
    const d=await fetch('/rate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({item:'demo-product',stars:sel})}).then(r=>r.json());
    document.getElementById('stats').textContent=d.avg+' avg ('+d.count+' ratings)';
  });
});
fetch('/stats?item=demo-product').then(r=>r.json()).then(d=>{
  document.getElementById('stats').textContent=d.count?d.avg+' avg ('+d.count+' ratings)':'No ratings yet.';
});
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
