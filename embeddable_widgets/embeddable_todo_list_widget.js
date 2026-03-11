addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/todos' && request.method === 'GET') return getTodos(url);
  if (path === '/todos' && request.method === 'POST') return addTodo(request);
  if (path === '/todos' && request.method === 'PATCH') return updateTodo(request);
  if (path === '/todos' && request.method === 'DELETE') return deleteTodo(request);
  return new Response('Not Found', { status: 404 });
}

async function getTodos(url) {
  const store = kv();
  if (!store) return noKV();
  const list = String(url.searchParams.get('list') || 'default').slice(0, 60);
  const raw = await store.get('todos:' + list);
  return jsonResponse({ list, todos: raw ? JSON.parse(raw) : [] });
}

async function addTodo(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const list = String(body.list || 'default').slice(0, 60);
  const text = String(body.text || '').trim().slice(0, 300);
  if (!text) return jsonResponse({ error: 'text required' }, 400);
  const raw = await store.get('todos:' + list);
  const todos = raw ? JSON.parse(raw) : [];
  const todo = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text, done: false, created: new Date().toISOString() };
  todos.push(todo);
  await store.put('todos:' + list, JSON.stringify(todos));
  return jsonResponse({ ok: true, todo });
}

async function updateTodo(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const list = String(body.list || 'default').slice(0, 60);
  const id = String(body.id || '');
  const raw = await store.get('todos:' + list);
  const todos = raw ? JSON.parse(raw) : [];
  const idx = todos.findIndex(t => t.id === id);
  if (idx < 0) return jsonResponse({ error: 'not found' }, 404);
  if (body.done !== undefined) todos[idx].done = Boolean(body.done);
  if (body.text) todos[idx].text = String(body.text).trim().slice(0, 300);
  await store.put('todos:' + list, JSON.stringify(todos));
  return jsonResponse({ ok: true, todo: todos[idx] });
}

async function deleteTodo(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const list = String(body.list || 'default').slice(0, 60);
  const id = String(body.id || '');
  const raw = await store.get('todos:' + list);
  const todos = (raw ? JSON.parse(raw) : []).filter(t => t.id !== id);
  await store.put('todos:' + list, JSON.stringify(todos));
  return jsonResponse({ ok: true });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Todo List</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:28px;max-width:440px;width:100%}
h2{margin:0 0 20px}
.row{display:flex;gap:8px;margin-bottom:16px}
input{flex:1;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit}
button.add{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:9px 16px;cursor:pointer;font:inherit;font-weight:700}
.todo{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#0f172a;margin-bottom:8px;cursor:pointer;transition:background .15s}
.todo:hover{background:#1e3a5f}
.todo.done .label{text-decoration:line-through;color:#475569}
.del{background:none;border:none;color:#ef4444;cursor:pointer;margin-left:auto;font-size:13px;padding:0}
.check{width:18px;height:18px;border:2px solid #475569;border-radius:5px;flex-shrink:0;display:grid;place-items:center}
.check.on{background:#6366f1;border-color:#6366f1;color:#fff}
.progress{font-size:12px;color:#64748b;margin-top:12px;text-align:right}
</style></head>
<body><div class="card">
<h2>✅ Todo List</h2>
<div class="row">
  <input id="listName" placeholder="List name" style="max-width:120px" value="default">
  <input id="newTodo" placeholder="Add a task…">
  <button class="add" onclick="addTodo()">+</button>
</div>
<div id="todos"></div>
<div class="progress" id="progress"></div>
</div>
<script>
let list='default',todos=[];
async function load(){
  list=document.getElementById('listName').value.trim()||'default';
  const d=await fetch('/todos?list='+encodeURIComponent(list)).then(r=>r.json());
  todos=d.todos||[];render();
}
function render(){
  const el=document.getElementById('todos');
  if(!todos.length){el.innerHTML='<div style="color:#475569;padding:10px">No tasks yet.</div>';document.getElementById('progress').textContent='';return;}
  el.innerHTML=todos.map(t=>'<div class="todo'+(t.done?' done':'')+'"><div class="check'+(t.done?' on':'')+'" onclick="toggle(\''+t.id+'\')">'+(t.done?'✓':'')+'</div><span class="label">'+escH(t.text)+'</span><button class="del" onclick="del(\''+t.id+'\')">✕</button></div>').join('');
  const done=todos.filter(t=>t.done).length;
  document.getElementById('progress').textContent=done+' / '+todos.length+' done';
}
async function addTodo(){
  const text=document.getElementById('newTodo').value.trim();
  if(!text)return;
  await fetch('/todos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({list,text})});
  document.getElementById('newTodo').value='';await load();
}
async function toggle(id){
  const t=todos.find(x=>x.id===id);if(!t)return;
  await fetch('/todos',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({list,id,done:!t.done})});
  await load();
}
async function del(id){
  await fetch('/todos',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({list,id})});
  await load();
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
document.getElementById('listName').addEventListener('change',load);
document.getElementById('newTodo').addEventListener('keydown',e=>{if(e.key==='Enter')addTodo();});
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
