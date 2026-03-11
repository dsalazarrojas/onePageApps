addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/words' && request.method === 'GET') return getWords(url);
  if (path === '/words' && request.method === 'POST') return addWords(request);
  if (path === '/words' && request.method === 'DELETE') return deleteWord(request);
  if (path === '/progress' && request.method === 'POST') return saveProgress(request);
  if (path === '/progress' && request.method === 'GET') return getProgress(url);
  return new Response('Not Found', { status: 404 });
}

async function getWords(url) {
  const store = kv();
  if (!store) return noKV();
  const lang = String(url.searchParams.get('lang') || 'default').slice(0, 40);
  const raw = await store.get('vocab:' + lang);
  return jsonResponse({ lang, words: raw ? JSON.parse(raw) : [] });
}

async function addWords(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const lang = String(body.lang || 'default').slice(0, 40);
  const newWords = (Array.isArray(body.words) ? body.words : []).map(w => ({
    word: String(w.word || '').trim().slice(0, 100),
    definition: String(w.definition || '').trim().slice(0, 300),
    example: String(w.example || '').trim().slice(0, 300),
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  })).filter(w => w.word && w.definition);
  if (!newWords.length) return jsonResponse({ error: 'At least one word with definition required' }, 400);
  const raw = await store.get('vocab:' + lang);
  const words = raw ? JSON.parse(raw) : [];
  words.push(...newWords);
  await store.put('vocab:' + lang, JSON.stringify(words.slice(-1000)));
  return jsonResponse({ ok: true, added: newWords.length, total: words.length });
}

async function deleteWord(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const lang = String(body.lang || 'default').slice(0, 40);
  const id = String(body.id || '');
  const raw = await store.get('vocab:' + lang);
  const words = (raw ? JSON.parse(raw) : []).filter(w => w.id !== id);
  await store.put('vocab:' + lang, JSON.stringify(words));
  return jsonResponse({ ok: true });
}

async function saveProgress(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const lang = String(body.lang || 'default').slice(0, 40);
  const wordId = String(body.wordId || '');
  const known = Boolean(body.known);
  const key = 'vocab:prog:' + lang;
  const raw = await store.get(key);
  const prog = raw ? JSON.parse(raw) : {};
  prog[wordId] = { known, updated: new Date().toISOString() };
  await store.put(key, JSON.stringify(prog));
  return jsonResponse({ ok: true });
}

async function getProgress(url) {
  const store = kv();
  if (!store) return noKV();
  const lang = String(url.searchParams.get('lang') || 'default').slice(0, 40);
  const raw = await store.get('vocab:prog:' + lang);
  return jsonResponse({ lang, progress: raw ? JSON.parse(raw) : {} });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vocabulary Flashcards</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:560px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:20px}
.flashcard{perspective:800px;height:180px;cursor:pointer;margin-bottom:16px;user-select:none}
.fc-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s}
.fc-inner.flipped{transform:rotateY(180deg)}
.fc-f,.fc-b{position:absolute;inset:0;background:#0f172a;border:1px solid #475569;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;backface-visibility:hidden;text-align:center}
.fc-b{transform:rotateY(180deg);color:#a5b4fc}
.word{font-size:1.4rem;font-weight:700}
.example{font-size:12px;color:#64748b;margin-top:8px}
.nav{display:flex;gap:8px;justify-content:center}
.nav button{border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font:inherit;color:#fff}
.btn-knew{background:#065f46}.btn-dunno{background:#7f1d1d}.btn-skip{background:#334155;color:#e2e8f0}
.stats{font-size:13px;color:#94a3b8;text-align:center;margin-bottom:12px}
input,textarea{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button.add{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
select{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:14px}
</style></head>
<body><div class="wrap">
<h2>📖 Vocabulary Flashcards</h2>
<div class="card">
  <select id="langSel" onchange="loadWords()"><option value="default">Default set</option><option value="spanish">Spanish</option><option value="french">French</option><option value="custom">Custom</option></select>
  <div class="stats" id="stats-txt"></div>
  <div class="flashcard" onclick="flip()">
    <div class="fc-inner" id="fc-inner">
      <div class="fc-f"><div class="word" id="fc-word">Loading…</div><div class="example" id="fc-ex"></div></div>
      <div class="fc-b"><div id="fc-def"></div></div>
    </div>
  </div>
  <div class="nav">
    <button class="btn-dunno" onclick="mark(false)">✗ Don&apos;t know</button>
    <button class="btn-skip" onclick="next()">Skip</button>
    <button class="btn-knew" onclick="mark(true)">✓ Know it</button>
  </div>
</div>
<div class="card"><strong>Add Words</strong>
<input id="wlang" placeholder="Language / set name">
<textarea id="wbulk" placeholder="word | definition | example (one per line)" rows="5"></textarea>
<button class="add" onclick="addWords()">Add Words</button>
</div>
</div>
<script>
let words=[],cur=0,prog={},flipped=false;
async function loadWords(){
  const lang=document.getElementById('langSel').value;
  const [wd,pd]=await Promise.all([fetch('/words?lang='+encodeURIComponent(lang)).then(r=>r.json()),fetch('/progress?lang='+encodeURIComponent(lang)).then(r=>r.json())]);
  words=wd.words||[];prog=pd.progress||[];cur=0;flipped=false;document.getElementById('fc-inner').classList.remove('flipped');
  show();
}
function show(){
  if(!words.length){document.getElementById('fc-word').textContent='No words yet.';document.getElementById('fc-def').textContent='';document.getElementById('stats-txt').textContent='';return;}
  const w=words[cur];
  document.getElementById('fc-word').textContent=w.word;
  document.getElementById('fc-ex').textContent=w.example?'e.g. '+w.example:'';
  document.getElementById('fc-def').textContent=w.definition;
  const known=Object.values(prog).filter(p=>p.known).length;
  document.getElementById('stats-txt').textContent=(cur+1)+' / '+words.length+' · '+known+' known';
}
function flip(){flipped=!flipped;document.getElementById('fc-inner').classList.toggle('flipped',flipped);}
function next(){cur=(cur+1)%words.length;flipped=false;document.getElementById('fc-inner').classList.remove('flipped');show();}
async function mark(known){
  if(!words.length)return;
  const lang=document.getElementById('langSel').value;
  await fetch('/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang,wordId:words[cur].id,known})});
  prog[words[cur].id]={known};
  next();
}
async function addWords(){
  const lang=document.getElementById('wlang').value.trim()||'default';
  const lines=document.getElementById('wbulk').value.split('\n').filter(l=>l.includes('|'));
  const words2=lines.map(l=>{const parts=l.split('|');return{word:parts[0].trim(),definition:parts[1]?parts[1].trim():'',example:parts[2]?parts[2].trim():''};}).filter(w=>w.word&&w.definition);
  if(!words2.length){alert('Format: word | definition | example');return;}
  const d=await fetch('/words',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang,words:words2})}).then(r=>r.json());
  if(d.ok){document.getElementById('wbulk').value='';document.getElementById('langSel').value=lang;await loadWords();}
  else alert(d.error);
}
loadWords();
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
