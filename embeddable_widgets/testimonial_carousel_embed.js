addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/testimonials' && request.method === 'GET') return listTestimonials();
  if (path === '/testimonials' && request.method === 'POST') return addTestimonial(request);
  if (path === '/testimonials' && request.method === 'DELETE') return deleteTestimonial(request);
  return new Response('Not Found', { status: 404 });
}

async function listTestimonials() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('testimonials');
  return jsonResponse({ testimonials: raw ? JSON.parse(raw) : [] });
}

async function addTestimonial(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const author = String(body.author || '').trim().slice(0,80);
  const text = String(body.text || '').trim().slice(0,600);
  const role = String(body.role || '').trim().slice(0,80);
  const avatar = String(body.avatar || '').slice(0,200);
  if (!author || !text) return jsonResponse({ error: 'author and text required' }, 400);
  const raw = await store.get('testimonials');
  const list = raw ? JSON.parse(raw) : [];
  const entry = { id: Date.now().toString(36), author, text, role, avatar, ts: new Date().toISOString() };
  list.push(entry);
  await store.put('testimonials', JSON.stringify(list));
  return jsonResponse({ ok: true, entry });
}

async function deleteTestimonial(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');
  const raw = await store.get('testimonials');
  const list = (raw ? JSON.parse(raw) : []).filter(t => t.id !== id);
  await store.put('testimonials', JSON.stringify(list));
  return jsonResponse({ ok: true });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Testimonial Carousel</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:700px;margin:0 auto;padding:40px 16px}
.carousel{position:relative;background:#1e293b;border-radius:20px;padding:36px;min-height:180px;overflow:hidden;border:1px solid #334155}
.slide{display:none;animation:fade .4s}.slide.active{display:block}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.quote{font-size:1.15rem;line-height:1.6;margin:0 0 20px;color:#cbd5e1}
.author{font-weight:700;color:#a5b4fc}.role{color:#64748b;font-size:13px}
.nav{display:flex;gap:10px;justify-content:center;margin-top:16px}
.nav button{background:#334155;border:none;color:#e2e8f0;border-radius:8px;padding:6px 14px;cursor:pointer}
.nav button:hover{background:#475569}
.dots{display:flex;gap:6px;justify-content:center;margin-top:10px}
.dot{width:8px;height:8px;border-radius:50%;background:#334155;cursor:pointer;transition:background .2s}
.dot.on{background:#6366f1}
h2{margin:0 0 24px;font-size:1.5rem}
.add-form{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:20px;margin-top:24px;display:grid;gap:10px}
.add-form input,.add-form textarea{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;width:100%}
.add-form button{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;font:inherit;cursor:pointer;font-weight:700}
</style></head>
<body><div class="wrap">
<h2>💬 Testimonials</h2>
<div class="carousel" id="carousel"><em style="color:#475569">Loading…</em></div>
<div class="nav"><button onclick="prev()">‹</button><div class="dots" id="dots"></div><button onclick="next()">›</button></div>
<div class="add-form"><strong>Add Testimonial</strong>
<input id="tauthor" placeholder="Author name *">
<input id="trole" placeholder="Role / Company">
<textarea id="ttext" placeholder="Testimonial text *" rows="3"></textarea>
<button onclick="addT()">Add</button></div>
</div>
<script>
let items=[],cur=0;
async function load(){
  const d=await fetch('/testimonials').then(r=>r.json());
  items=d.testimonials||[];
  render();
}
function render(){
  const c=document.getElementById('carousel');
  if(!items.length){c.innerHTML='<em style="color:#475569">No testimonials yet. Add one below.</em>';document.getElementById('dots').innerHTML='';return;}
  if(cur>=items.length)cur=0;
  c.innerHTML=items.map((t,i)=>'<div class="slide'+(i===cur?' active':'')+'" data-i="'+i+'"><p class="quote">&#8220;'+escH(t.text)+'&#8221;</p><div class="author">'+escH(t.author)+'</div><div class="role">'+escH(t.role)+'</div></div>').join('');
  const dots=document.getElementById('dots');
  dots.innerHTML=items.map((_,i)=>'<div class="dot'+(i===cur?' on':'')+'" onclick="goto('+i+')"></div>').join('');
}
function goto(i){cur=i;render();}
function prev(){cur=(cur-1+items.length)%items.length;render();}
function next(){cur=(cur+1)%items.length;render();}
async function addT(){
  const author=document.getElementById('tauthor').value.trim();
  const text=document.getElementById('ttext').value.trim();
  const role=document.getElementById('trole').value.trim();
  if(!author||!text){alert('Author and text required.');return;}
  await fetch('/testimonials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({author,text,role})});
  document.getElementById('tauthor').value='';document.getElementById('ttext').value='';document.getElementById('trole').value='';
  await load();
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
load();setInterval(()=>{if(items.length>1){cur=(cur+1)%items.length;render();}},5000);
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
