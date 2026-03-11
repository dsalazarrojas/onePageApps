addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/survey' && request.method === 'GET') return getSurvey();
  if (path === '/survey' && request.method === 'POST') return setSurvey(request);
  if (path === '/respond' && request.method === 'POST') return handleResponse(request);
  if (path === '/results' && request.method === 'GET') return getResults();
  if (path === '/popup.js' && request.method === 'GET') return servePopupJs(url);
  return new Response('Not Found', { status: 404 });
}

async function getSurvey() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('survey:config');
  if (!raw) return jsonResponse({ error: 'Survey not configured' }, 404);
  return jsonResponse(JSON.parse(raw));
}

async function setSurvey(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const title = String(body.title || 'Quick Survey').slice(0, 100);
  const question = String(body.question || '').trim().slice(0, 300);
  const options = (Array.isArray(body.options) ? body.options : []).map(o => String(o).trim().slice(0, 100)).filter(Boolean).slice(0, 8);
  if (!question || options.length < 2) return jsonResponse({ error: 'question and >= 2 options required' }, 400);
  const survey = { title, question, options, updated: new Date().toISOString() };
  await store.put('survey:config', JSON.stringify(survey));
  return jsonResponse({ ok: true, survey });
}

async function handleResponse(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const option = String(body.option || '').trim();
  const surveyRaw = await store.get('survey:config');
  if (!surveyRaw) return jsonResponse({ error: 'Survey not configured' }, 404);
  const survey = JSON.parse(surveyRaw);
  if (!survey.options.includes(option)) return jsonResponse({ error: 'Invalid option' }, 400);
  const tallyRaw = await store.get('survey:tally');
  const tally = tallyRaw ? JSON.parse(tallyRaw) : {};
  tally[option] = (tally[option] || 0) + 1;
  await store.put('survey:tally', JSON.stringify(tally));
  return jsonResponse({ ok: true });
}

async function getResults() {
  const store = kv();
  if (!store) return noKV();
  const surveyRaw = await store.get('survey:config');
  if (!surveyRaw) return jsonResponse({ error: 'Survey not configured' }, 404);
  const survey = JSON.parse(surveyRaw);
  const tallyRaw = await store.get('survey:tally');
  const tally = tallyRaw ? JSON.parse(tallyRaw) : {};
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  return jsonResponse({ survey, results: survey.options.map(o => ({ option: o, count: tally[o] || 0, pct: total ? Math.round((tally[o] || 0) / total * 100) : 0 })), total });
}

function servePopupJs(url) {
  const base = url.origin;
  const js = `(function(cfg){
  if(sessionStorage.getItem('survey-done'))return;
  const delay=(cfg.delay||3)*1000;
  setTimeout(async function(){
    const r=await fetch('${base}/survey');
    if(!r.ok)return;
    const s=await r.json();
    const div=document.createElement('div');
    div.style='position:fixed;bottom:24px;right:24px;background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;max-width:320px;z-index:9999;font-family:system-ui,sans-serif;color:#e2e8f0;box-shadow:0 8px 32px rgba(0,0,0,.5)';
    div.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong>'+s.title+'</strong><button onclick="this.closest(\'div[style]\').remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:16px">✕</button></div><p style="margin:0 0 14px;font-size:14px;color:#cbd5e1">'+s.question+'</p>'+s.options.map(o=>'<button onclick="vote(\''+o.replace(/'/g,'').replace(/"/g,'')+'\',this.closest(\'div[style]\'))" style="display:block;width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:8px;padding:8px 12px;margin-bottom:6px;cursor:pointer;font:inherit;text-align:left">'+o+'</button>').join('');
    document.body.appendChild(div);
  },delay);
  window.vote=async function(option,container){
    await fetch('${base}/respond',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({option})});
    container.innerHTML='<div style="color:#6ee7b7;font-weight:700;padding:8px">Thanks for your feedback!</div>';
    sessionStorage.setItem('survey-done','1');
    setTimeout(()=>container.remove(),2000);
  };
})(window.SurveyPopup||{});`;
  return new Response(js, { status: 200, headers: { 'Content-Type': 'application/javascript', ...corsHeaders() } });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Survey Popup</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:560px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
input,textarea{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button.save{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
.bar-bg{background:#0f172a;border-radius:99px;height:10px;flex:1}
.bar{background:#6366f1;height:100%;border-radius:99px}
.result-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:14px}
code{background:#0f172a;padding:2px 6px;border-radius:6px;font-size:12px}
</style></head>
<body><div class="wrap">
<h2>📋 Survey Popup</h2>
<div class="card"><strong>Setup Survey</strong>
<input id="stitle" placeholder="Survey title">
<textarea id="squestion" placeholder="Question" rows="2"></textarea>
<textarea id="sopts" placeholder="Options, one per line" rows="4"></textarea>
<button class="save" onclick="saveSurvey()">Save Survey</button>
</div>
<div class="card" id="results-card" style="display:none"><strong>Results</strong><div id="results"></div></div>
<div class="card"><strong>Embed on your site:</strong><br>
<code id="embed-snippet">&lt;script src="https://YOUR_WORKER.workers.dev/popup.js"&gt;&lt;/script&gt;</code>
</div>
</div>
<script>
async function saveSurvey(){
  const title=document.getElementById('stitle').value.trim()||'Quick Survey';
  const question=document.getElementById('squestion').value.trim();
  const options=document.getElementById('sopts').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!question||options.length<2){alert('Question and >=2 options required.');return;}
  const d=await fetch('/survey',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,question,options})}).then(r=>r.json());
  if(d.ok)loadResults();else alert(d.error);
}
async function loadResults(){
  const r=await fetch('/results');
  if(!r.ok)return;
  const d=await r.json();
  const el=document.getElementById('results');
  el.innerHTML='<p style="color:#94a3b8">'+d.survey.question+'</p>'+d.results.map(r=>'<div class="result-row"><span style="min-width:120px">'+escH(r.option)+'</span><div class="bar-bg"><div class="bar" style="width:'+r.pct+'%"></div></div><span style="min-width:40px">'+r.pct+'%</span></div>').join('')+'<div style="font-size:12px;color:#64748b">Total: '+d.total+'</div>';
  document.getElementById('results-card').style.display='block';
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
loadResults();
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
