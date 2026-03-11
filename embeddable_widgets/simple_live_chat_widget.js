addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/messages' && request.method === 'GET') return getMessages(url);
  if (path === '/messages' && request.method === 'POST') return postMessage(request, url);
  if (path === '/clear' && request.method === 'POST') return clearRoom(request);
  return new Response('Not Found', { status: 404 });
}

async function getMessages(url) {
  const store = kv();
  if (!store) return noKV();
  const room = sanitizeRoom(url.searchParams.get('room'));
  const raw = await store.get('chat:' + room);
  const msgs = raw ? JSON.parse(raw) : [];
  return jsonResponse({ room, messages: msgs.slice(-100) });
}

async function postMessage(request, url) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const room = sanitizeRoom(body.room || url.searchParams.get('room'));
  const author = String(body.author || 'Anonymous').slice(0, 40);
  const text = String(body.text || '').trim().slice(0, 500);
  if (!text) return jsonResponse({ error: 'text is required' }, 400);
  const raw = await store.get('chat:' + room);
  const msgs = raw ? JSON.parse(raw) : [];
  const msg = { id: Date.now() + '-' + Math.random().toString(36).slice(2,8), author, text, ts: new Date().toISOString() };
  msgs.push(msg);
  await store.put('chat:' + room, JSON.stringify(msgs.slice(-200)));
  return jsonResponse({ ok: true, message: msg });
}

async function clearRoom(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const room = sanitizeRoom(body.room);
  await store.put('chat:' + room, JSON.stringify([]));
  return jsonResponse({ ok: true, cleared: room });
}

function sanitizeRoom(v) { return String(v || 'general').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40) || 'general'; }

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live Chat Widget</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.chat{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:20px;width:380px;display:flex;flex-direction:column;gap:10px}
h2{margin:0;font-size:1.2rem}
.msgs{height:300px;overflow-y:auto;background:#0f172a;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}
.msg{background:#1e3a5f;border-radius:10px;padding:8px 12px;font-size:14px}
.msg .who{font-weight:700;color:#93c5fd;font-size:12px}
.row{display:flex;gap:8px}
input{flex:1;background:#0f172a;border:1px solid #475569;border-radius:10px;padding:9px;color:#e2e8f0;font:inherit}
button{background:#6366f1;border:none;color:#fff;border-radius:10px;padding:9px 16px;cursor:pointer;font:inherit;white-space:nowrap}
.room-row{display:flex;gap:8px;align-items:center;font-size:13px;color:#94a3b8}
</style></head>
<body><div class="chat">
<h2>💬 Live Chat</h2>
<div class="room-row">Room: <input id="room" value="general" style="width:100px;padding:4px 8px"></div>
<div class="msgs" id="msgs"><em style="color:#475569">Loading…</em></div>
<div class="row">
  <input id="author" placeholder="Name" style="max-width:90px">
  <input id="text" placeholder="Message…">
  <button onclick="send()">Send</button>
</div>
</div>
<script>
let lastLen=0;
async function load(){
  const room=document.getElementById('room').value.trim()||'general';
  const d=await fetch('/messages?room='+encodeURIComponent(room)).then(r=>r.json());
  if(d.messages.length===lastLen)return;
  lastLen=d.messages.length;
  const el=document.getElementById('msgs');
  el.innerHTML=d.messages.map(m=>'<div class="msg"><div class="who">'+escH(m.author)+'</div>'+escH(m.text)+'</div>').join('');
  el.scrollTop=el.scrollHeight;
}
async function send(){
  const room=document.getElementById('room').value.trim()||'general';
  const author=document.getElementById('author').value.trim()||'Anonymous';
  const text=document.getElementById('text').value.trim();
  if(!text)return;
  await fetch('/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room,author,text})});
  document.getElementById('text').value='';
  lastLen=0; await load();
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
document.getElementById('text').addEventListener('keydown',e=>{if(e.key==='Enter')send();});
load(); setInterval(load,3000);
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
