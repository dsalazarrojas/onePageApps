addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/score' && request.method === 'POST') return saveScore(request);
  if (path === '/leaderboard' && request.method === 'GET') return getLeaderboard();
  if (path === '/texts' && request.method === 'GET') return getTexts();
  if (path === '/texts' && request.method === 'POST') return addText(request);
  return new Response('Not Found', { status: 404 });
}

const DEFAULT_TEXTS = [
  "The quick brown fox jumps over the lazy dog and then runs back to the forest where it lives.",
  "To be or not to be that is the question whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
  "A journey of a thousand miles begins with a single step and every expert was once a beginner who never gave up.",
  "The best way to predict the future is to create it yourself through hard work persistence and creative thinking."
];

async function getTexts() {
  const store = kv();
  if (!store) return jsonResponse({ texts: DEFAULT_TEXTS });
  const raw = await store.get('typing:texts');
  const custom = raw ? JSON.parse(raw) : [];
  return jsonResponse({ texts: [...DEFAULT_TEXTS, ...custom] });
}

async function addText(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const text = String(body.text || '').trim().slice(0, 500);
  if (!text || text.split(' ').length < 5) return jsonResponse({ error: 'Text with at least 5 words required' }, 400);
  const raw = await store.get('typing:texts');
  const custom = raw ? JSON.parse(raw) : [];
  custom.push(text);
  await store.put('typing:texts', JSON.stringify(custom.slice(-50)));
  return jsonResponse({ ok: true });
}

async function saveScore(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const name = String(body.name || 'Anonymous').trim().slice(0, 40);
  const wpm = Math.max(0, parseInt(body.wpm, 10) || 0);
  const accuracy = Math.min(100, Math.max(0, parseInt(body.accuracy, 10) || 0));
  if (!wpm) return jsonResponse({ error: 'wpm required' }, 400);
  const entry = { name, wpm, accuracy, ts: new Date().toISOString() };
  const raw = await store.get('typing:scores');
  const scores = raw ? JSON.parse(raw) : [];
  scores.push(entry);
  scores.sort((a, b) => b.wpm - a.wpm);
  await store.put('typing:scores', JSON.stringify(scores.slice(0, 100)));
  return jsonResponse({ ok: true, rank: scores.findIndex(s => s.ts === entry.ts) + 1 });
}

async function getLeaderboard() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('typing:scores');
  return jsonResponse({ scores: raw ? JSON.parse(raw).slice(0, 20) : [] });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Typing Test</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:700px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:24px;margin-bottom:20px}
.passage{font-size:1.1rem;line-height:1.8;padding:16px;background:#0f172a;border-radius:12px;margin-bottom:14px;min-height:80px;letter-spacing:.3px}
.char.correct{color:#6ee7b7}.char.wrong{color:#fca5a5;background:rgba(239,68,68,.15);border-radius:2px}.char.current{border-bottom:2px solid #6366f1}
textarea{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:12px;font:inherit;font-size:1rem;resize:none;min-height:80px}
.stats{display:flex;gap:20px;margin:14px 0;font-size:14px;color:#94a3b8}
.stat{text-align:center}.stat-val{font-size:1.8rem;font-weight:800;color:#a5b4fc;display:block}
button.start{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px 24px;cursor:pointer;font:inherit;font-weight:700}
input{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{color:#94a3b8;text-align:left;padding:6px;border-bottom:1px solid #334155}
td{padding:6px;border-bottom:1px solid #1e293b}
</style></head>
<body><div class="wrap">
<h2>⌨️ Typing Test</h2>
<div class="card">
  <div class="passage" id="passage">Click Start to begin.</div>
  <textarea id="input" placeholder="Start typing when ready…" disabled rows="3" oninput="onInput()"></textarea>
  <div class="stats">
    <div class="stat"><span class="stat-val" id="wpm">0</span>WPM</div>
    <div class="stat"><span class="stat-val" id="acc">100</span>Accuracy %</div>
    <div class="stat"><span class="stat-val" id="timer">60</span>Seconds</div>
  </div>
  <div style="display:flex;gap:10px;align-items:center">
    <button class="start" id="startBtn" onclick="startTest()">▶ Start</button>
    <span id="status" style="font-size:13px;color:#64748b"></span>
  </div>
</div>
<div class="card" id="result-card" style="display:none"><strong>Test Complete!</strong>
<div class="stats"><div class="stat"><span class="stat-val" id="r-wpm">0</span>WPM</div><div class="stat"><span class="stat-val" id="r-acc">0</span>Accuracy</div></div>
<input id="rname" placeholder="Your name for leaderboard"><button class="start" onclick="submitScore()">Submit Score</button>
</div>
<div class="card"><strong>🏆 Leaderboard</strong><table><thead><tr><th>#</th><th>Name</th><th>WPM</th><th>Accuracy</th></tr></thead><tbody id="lboard"></tbody></table></div>
</div>
<script>
let passage='',startTime=null,interval=null,remaining=60,typed='',texts=[];
async function loadTexts(){
  const d=await fetch('/texts').then(r=>r.json());
  texts=d.texts;
  loadLeaderboard();
}
async function startTest(){
  passage=texts[Math.floor(Math.random()*texts.length)]||'The quick brown fox jumps over the lazy dog.';
  remaining=60;typed='';startTime=null;
  document.getElementById('input').value='';
  document.getElementById('input').disabled=false;
  document.getElementById('input').focus();
  document.getElementById('wpm').textContent='0';document.getElementById('acc').textContent='100';document.getElementById('timer').textContent='60';
  document.getElementById('result-card').style.display='none';
  renderPassage('');
  clearInterval(interval);
  interval=setInterval(()=>{
    if(!startTime)return;
    remaining=Math.max(0,60-Math.floor((Date.now()-startTime)/1000));
    document.getElementById('timer').textContent=remaining;
    if(remaining<=0){clearInterval(interval);finish();}
  },250);
}
function renderPassage(inp){
  const chars=passage.split('').map((c,i)=>{
    const cls=i<inp.length?(inp[i]===c?'correct':'wrong'):(i===inp.length?'current':'');
    return '<span class="char '+cls+'">'+escH(c)+'</span>';
  }).join('');
  document.getElementById('passage').innerHTML=chars;
}
function onInput(){
  const inp=document.getElementById('input').value;
  if(!startTime&&inp.length===1)startTime=Date.now();
  typed=inp;
  renderPassage(inp);
  const correct=inp.split('').filter((c,i)=>c===passage[i]).length;
  const wpm=startTime?Math.round(correct/5/((Date.now()-startTime)/60000)):0;
  const acc=inp.length?Math.round(correct/inp.length*100):100;
  document.getElementById('wpm').textContent=wpm;document.getElementById('acc').textContent=acc;
  if(inp===passage){clearInterval(interval);finish();}
}
function finish(){
  document.getElementById('input').disabled=true;
  const inp=typed;
  const correct=inp.split('').filter((c,i)=>c===passage[i]).length;
  const elapsed=(Date.now()-(startTime||Date.now()))/60000||1;
  const wpm=Math.round(correct/5/elapsed);
  const acc=inp.length?Math.round(correct/inp.length*100):0;
  document.getElementById('r-wpm').textContent=wpm;
  document.getElementById('r-acc').textContent=acc+'%';
  document.getElementById('result-card').style.display='block';
  document.getElementById('result-card').dataset.wpm=wpm;document.getElementById('result-card').dataset.acc=acc;
}
async function submitScore(){
  const name=document.getElementById('rname').value.trim()||'Anonymous';
  const wpm=+document.getElementById('result-card').dataset.wpm||0;
  const accuracy=+document.getElementById('result-card').dataset.acc||0;
  const d=await fetch('/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,wpm,accuracy})}).then(r=>r.json());
  if(d.ok){alert('Score submitted! Rank #'+d.rank);loadLeaderboard();}
}
async function loadLeaderboard(){
  const d=await fetch('/leaderboard').then(r=>r.json());
  document.getElementById('lboard').innerHTML=d.scores.map((s,i)=>'<tr><td>'+(i+1)+'</td><td>'+escH(s.name)+'</td><td>'+s.wpm+'</td><td>'+s.accuracy+'%</td></tr>').join('');
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
loadTexts();
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
