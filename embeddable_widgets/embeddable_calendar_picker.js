addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/events' && request.method === 'GET') return listEvents(url);
  if (path === '/events' && request.method === 'POST') return addEvent(request);
  if (path === '/events' && request.method === 'DELETE') return deleteEvent(request);
  return new Response('Not Found', { status: 404 });
}

async function listEvents(url) {
  const store = kv();
  if (!store) return noKV();
  const month = url.searchParams.get('month') || '';
  const list = await store.list({ prefix: month ? 'cal:' + month : 'cal:' });
  const events = await Promise.all(list.keys.map(async k => {
    try { return JSON.parse(await store.get(k.name)); } catch { return null; }
  }));
  return jsonResponse({ events: events.filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)) });
}

async function addEvent(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const date = String(body.date || '').slice(0, 10);
  const title = String(body.title || '').trim().slice(0, 100);
  if (!date || !title) return jsonResponse({ error: 'date (YYYY-MM-DD) and title required' }, 400);
  const id = date + '-' + Math.random().toString(36).slice(2, 7);
  const entry = { id, date, title, note: String(body.note || '').slice(0, 300), color: String(body.color || '#6366f1').slice(0, 20) };
  await store.put('cal:' + id, JSON.stringify(entry));
  return jsonResponse({ ok: true, entry });
}

async function deleteEvent(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');
  if (!id) return jsonResponse({ error: 'id required' }, 400);
  await store.delete('cal:' + id);
  return jsonResponse({ ok: true });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Calendar Picker</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:660px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.cal{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:20px}
.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.cal-header button{background:none;border:none;color:#a5b4fc;cursor:pointer;font-size:1.2rem;padding:4px 10px}
.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.day-label{text-align:center;font-size:11px;color:#64748b;padding:4px}
.day{text-align:center;padding:8px 2px;border-radius:8px;cursor:pointer;font-size:13px;min-height:36px;position:relative}
.day:hover{background:#334155}
.day.today{background:#312e81;color:#a5b4fc;font-weight:700}
.day.has-event::after{content:'';display:block;width:5px;height:5px;border-radius:50%;background:#6366f1;margin:2px auto 0}
.day.other-month{color:#475569}
.day.selected{background:#4f46e5;color:#fff}
.form{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-top:20px;display:grid;gap:10px}
input{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;width:100%}
button.add{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700}
.events-list{margin-top:20px}
.ev-item{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px}
.ev-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.del-btn{background:none;border:none;color:#ef4444;cursor:pointer;margin-left:auto;font-size:13px}
</style></head>
<body><div class="wrap">
<h2>📅 Calendar Picker</h2>
<div class="cal">
  <div class="cal-header"><button id="prev">‹</button><span id="month-label"></span><button id="next">›</button></div>
  <div class="grid" id="grid"></div>
</div>
<div id="events-list" class="events-list"></div>
<div class="form">
  <strong>Add Event</strong>
  <input type="date" id="edate">
  <input id="etitle" placeholder="Event title">
  <input id="enote" placeholder="Note (optional)">
  <input type="color" id="ecolor" value="#6366f1" style="padding:4px;height:38px">
  <button class="add" onclick="addEv()">Save Event</button>
</div>
</div>
<script>
let year=new Date().getFullYear(),month=new Date().getMonth();
let events={};
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
async function load(){
  const ym=String(year)+'-'+String(month+1).padStart(2,'0');
  const d=await fetch('/events?month='+ym).then(r=>r.json());
  events={};
  d.events.forEach(e=>{events[e.date]=(events[e.date]||[]);events[e.date].push(e);});
  render();
  renderList(d.events);
}
function render(){
  document.getElementById('month-label').textContent=new Date(year,month,1).toLocaleString('default',{month:'long',year:'numeric'});
  const grid=document.getElementById('grid');
  grid.innerHTML=DAYS.map(d=>'<div class="day-label">'+d+'</div>').join('');
  const first=new Date(year,month,1).getDay();
  const last=new Date(year,month+1,0).getDate();
  const today=new Date();
  for(let i=0;i<first;i++) grid.innerHTML+='<div class="day other-month"></div>';
  for(let d=1;d<=last;d++){
    const ds=String(year)+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const isToday=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;
    grid.innerHTML+='<div class="day'+(isToday?' today':'')+(events[ds]?' has-event':'')+'">'+d+'</div>';
  }
}
function renderList(evs){
  const el=document.getElementById('events-list');
  if(!evs.length){el.innerHTML='';return;}
  el.innerHTML='<strong>Events this month</strong><br><br>'+evs.map(e=>'<div class="ev-item"><div class="ev-dot" style="background:'+escH(e.color)+'"></div><div><strong>'+escH(e.date)+'</strong> '+escH(e.title)+(e.note?'<br><span style="font-size:12px;color:#94a3b8">'+escH(e.note)+'</span>':'')+'</div><button class="del-btn" onclick="delEv(\''+e.id+'\')">✕</button></div>').join('');
}
async function addEv(){
  const date=document.getElementById('edate').value;
  const title=document.getElementById('etitle').value.trim();
  const note=document.getElementById('enote').value.trim();
  const color=document.getElementById('ecolor').value;
  if(!date||!title){alert('Date and title required.');return;}
  await fetch('/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,title,note,color})});
  document.getElementById('etitle').value='';document.getElementById('enote').value='';
  await load();
}
async function delEv(id){
  await fetch('/events',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
  await load();
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
document.getElementById('prev').onclick=()=>{month--;if(month<0){month=11;year--;}load();};
document.getElementById('next').onclick=()=>{month++;if(month>11){month=0;year++;}load();};
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
