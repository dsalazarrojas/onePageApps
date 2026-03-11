addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/decks' && request.method === 'GET') return listDecks();
  if (path === '/deck' && request.method === 'GET') return getDeck(url);
  if (path === '/deck' && request.method === 'POST') return saveDeck(request);
  if (path === '/deck' && request.method === 'DELETE') return deleteDeck(request);
  if (path === '/progress' && request.method === 'POST') return saveProgress(request);
  if (path === '/progress' && request.method === 'GET') return getProgress(url);
  return new Response('Not Found', { status: 404 });
}

async function listDecks() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('fc:index');
  return jsonResponse({ decks: raw ? JSON.parse(raw) : [] });
}

async function getDeck(url) {
  const store = kv();
  if (!store) return noKV();
  const id = url.searchParams.get('id') || '';
  const raw = await store.get('fc:deck:' + id);
  if (!raw) return jsonResponse({ error: 'Deck not found' }, 404);
  return jsonResponse(JSON.parse(raw));
}

async function saveDeck(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || Date.now().toString(36)).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  const name = String(body.name || 'Deck').slice(0, 100);
  const cards = (Array.isArray(body.cards) ? body.cards : []).map(c => ({ front: String(c.front || '').slice(0, 300), back: String(c.back || '').slice(0, 300) })).filter(c => c.front).slice(0, 500);
  if (!cards.length) return jsonResponse({ error: 'At least 1 card required' }, 400);
  const deck = { id, name, cards, updated: new Date().toISOString() };
  await store.put('fc:deck:' + id, JSON.stringify(deck));
  const idxRaw = await store.get('fc:index');
  const idx = idxRaw ? JSON.parse(idxRaw) : [];
  const existing = idx.findIndex(d => d.id === id);
  const meta = { id, name, count: cards.length };
  if (existing >= 0) idx[existing] = meta; else idx.push(meta);
  await store.put('fc:index', JSON.stringify(idx));
  return jsonResponse({ ok: true, deck: { id, name, count: cards.length } });
}

async function deleteDeck(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');
  await store.delete('fc:deck:' + id);
  const idxRaw = await store.get('fc:index');
  const idx = (idxRaw ? JSON.parse(idxRaw) : []).filter(d => d.id !== id);
  await store.put('fc:index', JSON.stringify(idx));
  return jsonResponse({ ok: true });
}

async function saveProgress(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const deckId = String(body.deckId || '');
  const cardIdx = parseInt(body.cardIdx, 10);
  const result = String(body.result || 'skip');
  if (!deckId) return jsonResponse({ error: 'deckId required' }, 400);
  const key = 'fc:progress:' + deckId;
  const raw = await store.get(key);
  const prog = raw ? JSON.parse(raw) : {};
  prog[cardIdx] = result;
  await store.put(key, JSON.stringify(prog));
  return jsonResponse({ ok: true });
}

async function getProgress(url) {
  const store = kv();
  if (!store) return noKV();
  const deckId = url.searchParams.get('deckId') || '';
  const raw = await store.get('fc:progress:' + deckId);
  return jsonResponse({ progress: raw ? JSON.parse(raw) : {} });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Flashcard Widget</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:600px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:20px}
.flashcard{perspective:800px;height:200px;cursor:pointer;margin-bottom:16px}
.fc-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s}
.fc-inner.flipped{transform:rotateY(180deg)}
.fc-front,.fc-back{position:absolute;inset:0;background:#0f172a;border:1px solid #475569;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;text-align:center;padding:20px;backface-visibility:hidden}
.fc-back{transform:rotateY(180deg);color:#a5b4fc}
.nav{display:flex;gap:10px;justify-content:center}
.nav button{background:#334155;border:none;color:#e2e8f0;border-radius:8px;padding:8px 16px;cursor:pointer;font:inherit}
.knew{background:#065f46 !important;color:#6ee7b7 !important}
.dunno{background:#450a0a !important;color:#fca5a5 !important}
input,textarea{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button.add{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
select{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
.progress-txt{font-size:13px;color:#94a3b8;text-align:center;margin-bottom:10px}
</style></head>
<body><div class="wrap">
<h2>🃏 Flashcard Widget</h2>
<div class="card">
  <select id="deckSel" onchange="loadDeck()"><option value="">— Select a deck —</option></select>
  <div class="progress-txt" id="prog-txt"></div>
  <div class="flashcard" id="fc" onclick="flip()"><div class="fc-inner" id="fc-inner"><div class="fc-front" id="fc-front">Select a deck</div><div class="fc-back" id="fc-back"></div></div></div>
  <div class="nav">
    <button onclick="prev()">‹ Prev</button>
    <button class="dunno" onclick="mark('dunno')">✗ Dunno</button>
    <button class="knew" onclick="mark('knew')">✓ Knew it</button>
    <button onclick="next()">Next ›</button>
  </div>
</div>
<div class="card"><strong>Create / Update Deck</strong>
<input id="dname" placeholder="Deck name">
<input id="did" placeholder="Deck ID (optional)">
<textarea id="dcards" placeholder="front|back&#10;Cat|A small furry animal&#10;Dog|Man's best friend" rows="6"></textarea>
<button class="add" onclick="saveDeck()">Save Deck</button>
</div>
</div>
<script>
let deck=null,cur=0,flipped=false;
async function loadDecks(){
  const d=await fetch('/decks').then(r=>r.json());
  const sel=document.getElementById('deckSel');
  sel.innerHTML='<option value="">— Select a deck —</option>'+d.decks.map(d=>'<option value="'+escH(d.id)+'">'+escH(d.name)+' ('+d.count+')</option>').join('');
}
async function loadDeck(){
  const id=document.getElementById('deckSel').value;
  if(!id){deck=null;setFront('Select a deck','');return;}
  const d=await fetch('/deck?id='+encodeURIComponent(id)).then(r=>r.json());
  deck=d;cur=0;flipped=false;document.getElementById('fc-inner').classList.remove('flipped');
  show();
}
function show(){
  if(!deck||!deck.cards.length)return;
  const c=deck.cards[cur];
  setFront(c.front,c.back);
  document.getElementById('prog-txt').textContent=(cur+1)+' / '+deck.cards.length;
}
function setFront(f,b){document.getElementById('fc-front').textContent=f;document.getElementById('fc-back').textContent=b;}
function flip(){flipped=!flipped;document.getElementById('fc-inner').classList.toggle('flipped',flipped);}
function prev(){if(!deck)return;cur=(cur-1+deck.cards.length)%deck.cards.length;flipped=false;document.getElementById('fc-inner').classList.remove('flipped');show();}
function next(){if(!deck)return;cur=(cur+1)%deck.cards.length;flipped=false;document.getElementById('fc-inner').classList.remove('flipped');show();}
async function mark(result){
  if(!deck)return;
  await fetch('/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deckId:deck.id,cardIdx:cur,result})});
  next();
}
async function saveDeck(){
  const name=document.getElementById('dname').value.trim()||'My Deck';
  const id=document.getElementById('did').value.trim();
  const lines=document.getElementById('dcards').value.split('\n').filter(l=>l.includes('|'));
  const cards=lines.map(l=>{const [front,...rest]=l.split('|');return{front:front.trim(),back:rest.join('|').trim()};}).filter(c=>c.front);
  if(!cards.length){alert('Add cards in "front|back" format.');return;}
  const d=await fetch('/deck',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name,cards})}).then(r=>r.json());
  if(d.ok){document.getElementById('dname').value='';document.getElementById('dcards').value='';await loadDecks();}
  else alert(d.error);
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
loadDecks();
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
