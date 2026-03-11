addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/log' && request.method === 'POST') return logSession(request);
  if (path === '/stats' && request.method === 'GET') return getStats(url);
  return new Response('Not Found', { status: 404 });
}

async function logSession(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const type = String(body.type || 'work');
  const minutes = Math.max(0, parseInt(body.minutes, 10) || 25);
  const label = String(body.label || '').slice(0, 100);
  const date = new Date().toISOString().slice(0, 10);
  const key = 'pomo:' + date;
  const raw = await store.get(key);
  const data = raw ? JSON.parse(raw) : { sessions: [] };
  data.sessions.push({ type, minutes, label, ts: new Date().toISOString() });
  await store.put(key, JSON.stringify(data), { expirationTtl: 86400 * 90 });
  return jsonResponse({ ok: true, logged: { type, minutes, label } });
}

async function getStats(url) {
  const store = kv();
  if (!store) return noKV();
  const days = Math.min(30, parseInt(url.searchParams.get('days') || '7', 10));
  const results = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const raw = await store.get('pomo:' + date);
    const data = raw ? JSON.parse(raw) : { sessions: [] };
    const workMins = data.sessions.filter(s => s.type === 'work').reduce((a, s) => a + s.minutes, 0);
    results.unshift({ date, sessions: data.sessions.length, workMinutes: workMins });
  }
  return jsonResponse({ stats: results, totalWorkMinutes: results.reduce((a, r) => a + r.workMinutes, 0) });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pomodoro Timer</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:36px;max-width:380px;width:100%;text-align:center}
h2{margin:0 0 20px}
.timer{font-size:4.5rem;font-weight:800;font-variant-numeric:tabular-nums;color:#a5b4fc;margin:20px 0;letter-spacing:2px}
.type{font-size:14px;color:#94a3b8;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px}
.btns{display:flex;gap:10px;justify-content:center;margin-bottom:20px}
.btns button{border:none;border-radius:10px;padding:10px 20px;cursor:pointer;font:inherit;font-weight:700;color:#fff}
.btn-start{background:linear-gradient(135deg,#6366f1,#8b5cf6)}
.btn-stop{background:#475569}
.btn-reset{background:#7f1d1d}
.modes{display:flex;gap:8px;justify-content:center;margin-bottom:20px}
.modes button{background:#334155;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font:inherit;font-size:13px;color:#e2e8f0}
.modes button.active{background:#4f46e5;color:#fff}
input{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px;text-align:center}
.stats{margin-top:16px;font-size:13px;color:#64748b}
</style></head>
<body><div class="card">
<h2>🍅 Pomodoro Timer</h2>
<div class="type" id="type-label">Work Session</div>
<div class="timer" id="timer">25:00</div>
<div class="modes">
  <button class="active" onclick="setMode('work',25)">Work 25m</button>
  <button onclick="setMode('short',5)">Short 5m</button>
  <button onclick="setMode('long',15)">Long 15m</button>
</div>
<input id="session-label" placeholder="What are you working on?">
<div class="btns">
  <button class="btn-start" onclick="startStop()">▶ Start</button>
  <button class="btn-reset" onclick="reset()">↺ Reset</button>
</div>
<div class="stats" id="stats">Loading stats…</div>
</div>
<script>
let mode='work',totalSecs=25*60,remaining=25*60,interval=null,running=false;
function setMode(m,mins){
  if(running)return;
  mode=m;totalSecs=mins*60;remaining=totalSecs;
  document.getElementById('type-label').textContent=m==='work'?'Work Session':m==='short'?'Short Break':'Long Break';
  document.querySelectorAll('.modes button').forEach((b,i)=>b.classList.toggle('active',[('work'),('short'),('long')][i]===m));
  tick();
}
function tick(){const m=Math.floor(remaining/60),s=remaining%60;document.getElementById('timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function startStop(){
  if(running){clearInterval(interval);interval=null;running=false;document.querySelector('.btn-start').textContent='▶ Start';}
  else{running=true;document.querySelector('.btn-start').textContent='⏸ Pause';interval=setInterval(()=>{remaining--;tick();if(remaining<=0){clearInterval(interval);running=false;document.querySelector('.btn-start').textContent='▶ Start';finishSession();}},1000);}
}
function reset(){clearInterval(interval);interval=null;running=false;remaining=totalSecs;document.querySelector('.btn-start').textContent='▶ Start';tick();}
async function finishSession(){
  const label=document.getElementById('session-label').value.trim();
  const minutes=Math.round(totalSecs/60);
  await fetch('/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:mode,minutes,label})});
  loadStats();
  alert((mode==='work'?'Work session':'Break')+' complete! Great job.');
}
async function loadStats(){
  const d=await fetch('/stats?days=7').then(r=>r.json());
  const total=d.totalWorkMinutes;
  document.getElementById('stats').textContent='This week: '+Math.floor(total/60)+'h '+total%60+'m focused';
}
loadStats();
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
