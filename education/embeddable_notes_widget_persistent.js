addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/notes' && request.method === 'GET') return listNotes(url);
  if (path === '/notes' && request.method === 'POST') return saveNote(request);
  if (path === '/notes' && request.method === 'DELETE') return deleteNote(request);
  return new Response('Not Found', { status: 404 });
}

async function listNotes(url) {
  const store = kv();
  if (!store) return noKV();
  const tag = url.searchParams.get('tag') || '';
  const list = await store.list({ prefix: 'note:' });
  const notes = await Promise.all(list.keys.map(async k => { try { return JSON.parse(await store.get(k.name)); } catch { return null; } }));
  let result = notes.filter(Boolean).sort((a, b) => b.updated.localeCompare(a.updated));
  if (tag) result = result.filter(n => (n.tags || []).includes(tag));
  return jsonResponse({ notes: result.slice(0, 200) });
}

async function saveNote(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 5));
  const title = String(body.title || '').trim().slice(0, 150);
  const content = String(body.content || '').slice(0, 10000);
  const tags = (Array.isArray(body.tags) ? body.tags : []).map(t => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 10);
  if (!title && !content) return jsonResponse({ error: 'title or content required' }, 400);
  const note = { id, title, content, tags, updated: new Date().toISOString() };
  await store.put('note:' + id, JSON.stringify(note));
  return jsonResponse({ ok: true, note });
}

async function deleteNote(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');
  if (!id) return jsonResponse({ error: 'id required' }, 400);
  await store.delete('note:' + id);
  return jsonResponse({ ok: true });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notes Widget</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:800px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.layout{display:grid;grid-template-columns:260px 1fr;gap:20px}
@media(max-width:640px){.layout{grid-template-columns:1fr}}
.sidebar{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:16px;height:fit-content}
.note-item{padding:10px;border-radius:10px;cursor:pointer;margin-bottom:6px;border:1px solid transparent}
.note-item:hover{background:#0f172a;border-color:#475569}
.note-item.active{background:#1e3a5f;border-color:#6366f1}
.note-title{font-weight:600;font-size:14px}
.note-date{font-size:11px;color:#64748b;margin-top:2px}
.editor{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px}
input{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
textarea{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:10px;font:inherit;resize:vertical;min-height:300px}
.toolbar{display:flex;gap:8px;margin-bottom:10px}
.toolbar button{border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font:inherit;font-size:13px;font-weight:600;color:#fff}
.btn-new{background:#6366f1}.btn-save{background:#059669}.btn-del{background:#dc2626}
.tags{font-size:12px;color:#64748b;margin-top:8px}
.tag{display:inline-block;background:#1e3a5f;color:#93c5fd;border-radius:6px;padding:2px 8px;margin:2px;font-size:11px;cursor:pointer}
</style></head>
<body><div class="wrap">
<h2>📝 Notes</h2>
<div class="layout">
  <div class="sidebar">
    <button class="toolbar btn-new" style="width:100%;margin-bottom:10px" onclick="newNote()">+ New Note</button>
    <div id="note-list"><em style="color:#475569;font-size:13px">Loading…</em></div>
  </div>
  <div class="editor">
    <div class="toolbar">
      <button class="btn-save" onclick="saveNote()">💾 Save</button>
      <button class="btn-del" onclick="deleteNote()">🗑 Delete</button>
    </div>
    <input id="ntitle" placeholder="Note title">
    <input id="ntags" placeholder="Tags (comma-separated)">
    <textarea id="ncontent" placeholder="Write your note here…"></textarea>
  </div>
</div>
</div>
<script>
let notes=[],currentId=null;
async function load(){
  const d=await fetch('/notes').then(r=>r.json());
  notes=d.notes||[];
  const list=document.getElementById('note-list');
  list.innerHTML=notes.map(n=>'<div class="note-item'+(n.id===currentId?' active':'')+'" onclick="open(\''+n.id+'\')"><div class="note-title">'+escH(n.title||'Untitled')+'</div><div class="note-date">'+n.updated.slice(0,10)+'</div></div>').join('');
}
function open(id){
  const n=notes.find(x=>x.id===id);if(!n)return;
  currentId=id;
  document.getElementById('ntitle').value=n.title||'';
  document.getElementById('ncontent').value=n.content||'';
  document.getElementById('ntags').value=(n.tags||[]).join(', ');
  document.querySelectorAll('.note-item').forEach(el=>el.classList.toggle('active',el.textContent.includes(n.title||'Untitled')));
  load();
}
function newNote(){currentId=null;document.getElementById('ntitle').value='';document.getElementById('ncontent').value='';document.getElementById('ntags').value='';}
async function saveNote(){
  const title=document.getElementById('ntitle').value.trim();
  const content=document.getElementById('ncontent').value;
  const tags=document.getElementById('ntags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const body={title,content,tags};
  if(currentId)body.id=currentId;
  const d=await fetch('/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
  if(d.ok){currentId=d.note.id;await load();}
  else alert(d.error);
}
async function deleteNote(){
  if(!currentId){alert('No note selected.');return;}
  if(!confirm('Delete this note?'))return;
  await fetch('/notes',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:currentId})});
  currentId=null;newNote();await load();
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
