addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/click' && request.method === 'POST') return recordClick(request);
  if (path === '/data' && request.method === 'GET') return getData(url);
  if (path === '/reset' && request.method === 'POST') return resetData(request);
  if (path === '/embed.js' && request.method === 'GET') return serveEmbedJs(url);
  return new Response('Not Found', { status: 404 });
}

async function recordClick(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const page = String(body.page || '/').slice(0, 200);
  const x = Math.round(Number(body.x) || 0);
  const y = Math.round(Number(body.y) || 0);
  const vw = Math.round(Number(body.vw) || 1920);
  const vh = Math.round(Number(body.vh) || 1080);
  if (x < 0 || y < 0) return jsonResponse({ error: 'invalid coords' }, 400);
  const key = 'hm:' + page;
  const raw = await store.get(key);
  const data = raw ? JSON.parse(raw) : { clicks: [], vw, vh };
  data.clicks.push({ x, y, t: Date.now() });
  if (data.clicks.length > 5000) data.clicks = data.clicks.slice(-5000);
  await store.put(key, JSON.stringify(data));
  return jsonResponse({ ok: true, total: data.clicks.length });
}

async function getData(url) {
  const store = kv();
  if (!store) return noKV();
  const page = url.searchParams.get('page') || '/';
  const raw = await store.get('hm:' + page);
  return jsonResponse(raw ? JSON.parse(raw) : { clicks: [], vw: 1920, vh: 1080 });
}

async function resetData(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const page = String(body.page || '/').slice(0, 200);
  await store.put('hm:' + page, JSON.stringify({ clicks: [], vw: 1920, vh: 1080 }));
  return jsonResponse({ ok: true });
}

function serveEmbedJs(url) {
  const base = url.origin;
  const js = `(function(){
  const page=location.pathname;
  document.addEventListener('click',function(e){
    fetch('${base}/click',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({page,x:e.pageX,y:e.pageY,vw:document.documentElement.scrollWidth,vh:document.documentElement.scrollHeight}),keepalive:true});
  },{passive:true});
})();`;
  return new Response(js, { status: 200, headers: { 'Content-Type': 'application/javascript', ...corsHeaders() } });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Heatmap Lite</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:720px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
canvas{width:100%;border-radius:10px;background:#0f172a;cursor:crosshair;display:block}
.row{display:flex;gap:10px;align-items:center;margin-bottom:14px}
input{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:8px;font:inherit}
button{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:9px 16px;cursor:pointer;font:inherit;font-weight:700}
code{background:#0f172a;padding:2px 6px;border-radius:6px;font-size:13px}
</style></head>
<body><div class="wrap">
<h2>🔥 Heatmap Lite</h2>
<div class="card"><div class="row">
  <input id="hpage" value="/" placeholder="/page-path" style="flex:1">
  <button onclick="loadHeatmap()">Load Heatmap</button>
  <button onclick="resetH()" style="background:#475569">Reset</button>
</div>
<canvas id="canvas" width="960" height="540"></canvas>
<div id="info" style="margin-top:8px;font-size:13px;color:#94a3b8"></div>
</div>
<div class="card"><strong>Embed tracker on your site:</strong><br>
<code>&lt;script src="https://YOUR_WORKER.workers.dev/embed.js"&gt;&lt;/script&gt;</code>
</div>
</div>
<script>
const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
async function loadHeatmap(){
  const page=document.getElementById('hpage').value.trim()||'/';
  const d=await fetch('/data?page='+encodeURIComponent(page)).then(r=>r.json());
  renderHeatmap(d);
  document.getElementById('info').textContent='Clicks: '+d.clicks.length;
}
function renderHeatmap(d){
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0f172a';ctx.fillRect(0,0,W,H);
  const scaleX=d.vw>0?W/d.vw:1,scaleY=d.vh>0?H/d.vh:1;
  d.clicks.forEach(c=>{
    const grd=ctx.createRadialGradient(c.x*scaleX,c.y*scaleY,0,c.x*scaleX,c.y*scaleY,20);
    grd.addColorStop(0,'rgba(239,68,68,0.5)');grd.addColorStop(1,'rgba(239,68,68,0)');
    ctx.fillStyle=grd;ctx.fillRect(c.x*scaleX-20,c.y*scaleY-20,40,40);
  });
}
async function resetH(){
  const page=document.getElementById('hpage').value.trim()||'/';
  if(!confirm('Reset heatmap for '+page+'?'))return;
  await fetch('/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page})});
  loadHeatmap();
}
loadHeatmap();
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
