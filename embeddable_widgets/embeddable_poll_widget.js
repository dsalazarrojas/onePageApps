addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/poll' && request.method === 'GET') return getPoll(url);
  if (path === '/poll' && request.method === 'POST') return setPoll(request);
  if (path === '/vote' && request.method === 'POST') return castVote(request);
  if (path === '/results' && request.method === 'GET') return getResults(url);
  return new Response('Not Found', { status: 404 });
}

async function getPoll(url) {
  const store = kv();
  if (!store) return noKV();
  const pollId = url.searchParams.get('id') || 'default';
  const raw = await store.get('poll:' + pollId);
  if (!raw) return jsonResponse({ error: 'Poll not found' }, 404);
  return jsonResponse(JSON.parse(raw));
}

async function setPoll(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const pollId = String(body.id || 'default').slice(0,60);
  const question = String(body.question || '').trim().slice(0,300);
  const options = (Array.isArray(body.options) ? body.options : []).map(o => String(o).trim().slice(0,100)).filter(Boolean).slice(0,10);
  if (!question || options.length < 2) return jsonResponse({ error: 'question and at least 2 options required' }, 400);
  const poll = { id: pollId, question, options, created: new Date().toISOString() };
  await store.put('poll:' + pollId, JSON.stringify(poll));
  const votes = {};
  options.forEach(o => votes[o] = 0);
  const existing = await store.get('votes:' + pollId);
  if (!existing) await store.put('votes:' + pollId, JSON.stringify(votes));
  return jsonResponse({ ok: true, poll });
}

async function castVote(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const pollId = String(body.pollId || 'default').slice(0,60);
  const option = String(body.option || '').trim();
  const pollRaw = await store.get('poll:' + pollId);
  if (!pollRaw) return jsonResponse({ error: 'Poll not found' }, 404);
  const poll = JSON.parse(pollRaw);
  if (!poll.options.includes(option)) return jsonResponse({ error: 'Invalid option' }, 400);
  const votesRaw = await store.get('votes:' + pollId);
  const votes = votesRaw ? JSON.parse(votesRaw) : {};
  votes[option] = (votes[option] || 0) + 1;
  await store.put('votes:' + pollId, JSON.stringify(votes));
  return jsonResponse({ ok: true, votes });
}

async function getResults(url) {
  const store = kv();
  if (!store) return noKV();
  const pollId = url.searchParams.get('id') || 'default';
  const pollRaw = await store.get('poll:' + pollId);
  if (!pollRaw) return jsonResponse({ error: 'Poll not found' }, 404);
  const poll = JSON.parse(pollRaw);
  const votesRaw = await store.get('votes:' + pollId);
  const votes = votesRaw ? JSON.parse(votesRaw) : {};
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const results = poll.options.map(o => ({ option: o, votes: votes[o] || 0, pct: total ? Math.round((votes[o] || 0) / total * 100) : 0 }));
  return jsonResponse({ poll, results, total });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Poll Widget</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:520px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.poll-card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:24px}
.question{font-size:1.1rem;font-weight:600;margin-bottom:16px}
.option-btn{display:flex;align-items:center;gap:10px;width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:10px 14px;margin-bottom:8px;cursor:pointer;font:inherit;text-align:left;transition:border-color .2s}
.option-btn:hover{border-color:#6366f1}
.bar-wrap{flex:1;background:#1e293b;border-radius:99px;height:8px}
.bar{background:#6366f1;height:100%;border-radius:99px;transition:width .6s}
.pct{font-size:12px;color:#94a3b8;min-width:36px;text-align:right}
.setup-form{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-top:24px;display:grid;gap:10px}
input,textarea{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;width:100%}
button.create{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
.note{font-size:13px;color:#64748b}
</style></head>
<body><div class="wrap">
<h2>🗳️ Poll Widget</h2>
<div class="poll-card" id="pollCard"><em style="color:#475569">Loading poll…</em></div>
<div class="setup-form">
  <strong>Create / Update Poll</strong>
  <input id="pqid" placeholder="Poll ID (default)">
  <textarea id="pqtext" placeholder="Question text" rows="2"></textarea>
  <textarea id="popts" placeholder="Options, one per line (min 2)" rows="4"></textarea>
  <button class="create" onclick="createPoll()">Save Poll</button>
</div>
</div>
<script>
const POLL_ID='default';
let voted=false;
async function load(){
  try{
    const [pr,rr]=await Promise.all([fetch('/poll?id='+POLL_ID),fetch('/results?id='+POLL_ID)]);
    if(!pr.ok){document.getElementById('pollCard').innerHTML='<em style="color:#475569">No poll yet. Create one below.</em>';return;}
    const poll=await pr.json();const res=await rr.json();
    renderPoll(poll,res);
  }catch(e){console.error(e);}
}
function renderPoll(poll,res){
  const card=document.getElementById('pollCard');
  if(voted){
    card.innerHTML='<div class="question">'+escH(poll.question)+'</div>'+res.results.map(r=>'<div class="option-btn"><span style="min-width:120px">'+escH(r.option)+'</span><div class="bar-wrap"><div class="bar" style="width:'+r.pct+'%"></div></div><span class="pct">'+r.pct+'%</span></div>').join('')+'<div class="note">'+res.total+' vote'+(res.total!==1?'s':'')+'</div>';
  }else{
    card.innerHTML='<div class="question">'+escH(poll.question)+'</div>'+poll.options.map(o=>'<button class="option-btn" onclick="vote(''+escH(o)+'')"><span>'+escH(o)+'</span></button>').join('');
  }
}
async function vote(option){
  voted=true;
  await fetch('/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId:POLL_ID,option})});
  await load();
}
async function createPoll(){
  const id=document.getElementById('pqid').value.trim()||'default';
  const question=document.getElementById('pqtext').value.trim();
  const options=document.getElementById('popts').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!question||options.length<2){alert('Question and at least 2 options required.');return;}
  await fetch('/poll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,question,options})});
  voted=false;await load();
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
