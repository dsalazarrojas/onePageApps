addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/track' && request.method === 'POST') return trackShare(request);
  if (path === '/stats' && request.method === 'GET') return getStats();
  if (path === '/widget.js' && request.method === 'GET') return serveWidget(url);
  return new Response('Not Found', { status: 404 });
}

async function trackShare(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const network = String(body.network || 'unknown').replace(/[^a-z]/gi, '').slice(0, 30).toLowerCase();
  const page = String(body.page || '/').slice(0, 200);
  const key = 'share:' + page + ':' + network;
  const raw = await store.get(key);
  const count = (raw ? parseInt(raw, 10) : 0) + 1;
  await store.put(key, String(count));
  return jsonResponse({ ok: true, network, count });
}

async function getStats() {
  const store = kv();
  if (!store) return noKV();
  const list = await store.list({ prefix: 'share:' });
  const stats = {};
  await Promise.all(list.keys.map(async k => {
    const parts = k.name.split(':');
    const network = parts[parts.length - 1];
    const raw = await store.get(k.name);
    stats[network] = (stats[network] || 0) + (raw ? parseInt(raw, 10) : 0);
  }));
  return jsonResponse({ stats });
}

function serveWidget(url) {
  const base = url.origin;
  const js = `(function(cfg){
  const el=document.getElementById(cfg.target||'share-buttons');
  if(!el)return;
  const pageUrl=encodeURIComponent(cfg.url||location.href);
  const pageTitle=encodeURIComponent(cfg.title||document.title);
  const networks={
    twitter:{label:'X / Twitter',color:'#1d9bf0',href:'https://twitter.com/intent/tweet?url='+pageUrl+'&text='+pageTitle},
    facebook:{label:'Facebook',color:'#1877f2',href:'https://www.facebook.com/sharer/sharer.php?u='+pageUrl},
    linkedin:{label:'LinkedIn',color:'#0a66c2',href:'https://www.linkedin.com/sharing/share-offsite/?url='+pageUrl},
    email:{label:'Email',color:'#64748b',href:'mailto:?subject='+pageTitle+'&body='+pageUrl},
    copy:{label:'Copy Link',color:'#6366f1',href:null}
  };
  el.style='display:flex;gap:8px;flex-wrap:wrap';
  Object.entries(networks).forEach(([id,n])=>{
    const btn=document.createElement('button');
    btn.textContent=n.label;
    btn.style='background:'+n.color+';color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font:inherit;font-size:13px;font-weight:600';
    btn.addEventListener('click',async()=>{
      await fetch('${base}/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({network:id,page:location.pathname})});
      if(id==='copy'){await navigator.clipboard.writeText(decodeURIComponent(pageUrl));btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy Link',1500);}
      else window.open(n.href,'_blank','noopener,width=600,height=400');
    });
    el.appendChild(btn);
  });
})(window.ShareButtons||{});`;
  return new Response(js, { status: 200, headers: { 'Content-Type': 'application/javascript', ...corsHeaders() } });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Share Buttons</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:600px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:24px;margin-bottom:20px}
code{background:#0f172a;padding:2px 6px;border-radius:6px;font-size:13px}
.stat-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #334155;font-size:14px}
</style></head>
<body><div class="wrap">
<h2>🔗 Share Buttons</h2>
<div class="card"><strong>Live preview</strong><br><br><div id="share-buttons"></div></div>
<div class="card"><strong>Embed on your site:</strong>
<pre style="background:#0f172a;border-radius:10px;padding:14px;overflow-x:auto;font-size:12px">&lt;div id="share-buttons"&gt;&lt;/div&gt;
&lt;script&gt;window.ShareButtons = { url: 'https://example.com/page', title: 'Check this out!' };&lt;/script&gt;
&lt;script src="https://YOUR_WORKER.workers.dev/widget.js"&gt;&lt;/script&gt;</pre>
</div>
<div class="card" id="stats-card"><strong>Share stats</strong><div id="stats" style="margin-top:12px;color:#475569">Loading…</div></div>
</div>
<script>
window.ShareButtons={url:location.href,title:'Test Share'};
</script>
<script src="/widget.js"></script>
<script>
fetch('/stats').then(r=>r.json()).then(d=>{
  const el=document.getElementById('stats');
  const entries=Object.entries(d.stats||{});
  el.innerHTML=entries.length?entries.map(([n,c])=>'<div class="stat-row"><span>'+n+'</span><span>'+c+'</span></div>').join(''):'<span style="color:#475569">No shares yet.</span>';
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
