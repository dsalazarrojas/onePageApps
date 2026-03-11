addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/submit' && request.method === 'POST') return handleSubmit(request);
  if (path === '/responses' && request.method === 'GET') return handleList(request);
  return new Response('Not Found', { status: 404 });
}

async function handleSubmit(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const rating = parseInt(body.rating, 10);
  if (!rating || rating < 1 || rating > 5) return jsonResponse({ error: 'rating 1-5 required' }, 400);
  const entry = { id: Date.now() + '-' + Math.random().toString(36).slice(2,7), rating, comment: String(body.comment || '').trim().slice(0,1000), page: String(body.page || '').slice(0,200), ts: new Date().toISOString() };
  await store.put('fb:' + entry.id, JSON.stringify(entry));
  const webhook = getStringBinding('WEBHOOK_URL');
  if (webhook) { try { await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }); } catch {} }
  await sendNotificationEmail({
    subject: getStringBinding('NOTIFICATION_SUBJECT', 'New feedback submission'),
    html: `<p>A new feedback response was submitted.</p><p><strong>Rating:</strong> ${rating}/5</p><p><strong>Page:</strong> ${escHtml(entry.page || '—')}</p><p><strong>Comment:</strong> ${escHtml(entry.comment || '—')}</p>`
  });
  return jsonResponse({ ok: true, entry });
}

async function handleList(request) {
  const store = kv();
  if (!store) return noKV();
  const list = await store.list({ prefix: 'fb:' });
  const entries = await Promise.all(list.keys.map(async k => { try { return JSON.parse(await store.get(k.name)); } catch { return null; } }));
  return jsonResponse({ responses: entries.filter(Boolean).sort((a,b)=>b.ts.localeCompare(a.ts)).slice(0,200) });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Feedback Form</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:32px;max-width:480px;width:100%}
h2{margin:0 0 20px}
.stars{font-size:2rem;cursor:pointer;letter-spacing:4px}
.star{color:#475569;transition:color .15s}
.star.on{color:#fbbf24}
textarea{width:100%;border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:10px;font:inherit;min-height:100px;resize:vertical;margin-top:14px}
button{width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;padding:12px;font:inherit;font-weight:700;cursor:pointer;margin-top:12px}
.msg{margin-top:14px;padding:12px;border-radius:10px;background:#134e4a;color:#6ee7b7;display:none}
</style></head>
<body><div class="card"><h2>✉️ Share Your Feedback</h2>
<div class="stars" id="stars">
  <span class="star" data-v="1">★</span><span class="star" data-v="2">★</span><span class="star" data-v="3">★</span><span class="star" data-v="4">★</span><span class="star" data-v="5">★</span>
</div>
<textarea id="comment" placeholder="Tell us more… (optional)"></textarea>
<button onclick="submit()">Submit Feedback</button>
<div class="msg" id="msg">Thank you for your feedback!</div>
</div>
<script>
let rating=0;
document.querySelectorAll('.star').forEach(s=>{
  s.addEventListener('click',()=>{rating=+s.dataset.v;document.querySelectorAll('.star').forEach(x=>x.classList.toggle('on',+x.dataset.v<=rating));});
});
async function submit(){
  if(!rating){alert('Please select a rating.');return;}
  await fetch('/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating,comment:document.getElementById('comment').value,page:location.href})});
  document.getElementById('msg').style.display='block';
  document.getElementById('comment').value='';rating=0;document.querySelectorAll('.star').forEach(s=>s.classList.remove('on'));
}
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
async function sendNotificationEmail({ subject, html }) {
  const apiKey = getStringBinding('RESEND_API_KEY');
  const fromEmail = getStringBinding('FROM_EMAIL');
  const toEmail = getStringBinding('NOTIFICATION_EMAIL');
  if (!apiKey || !fromEmail || !toEmail) return false;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${getStringBinding('FROM_NAME', 'Embeddable Feedback Form')} <${fromEmail}>`,
        to: [toEmail],
        subject,
        html
      })
    });
    return true;
  } catch {
    return false;
  }
}
