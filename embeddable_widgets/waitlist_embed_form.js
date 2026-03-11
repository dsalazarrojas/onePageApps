addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/join' && request.method === 'POST') return handleJoin(request);
  if (path === '/count' && request.method === 'GET') return getCount();
  if (path === '/list' && request.method === 'GET') return getList();
  return new Response('Not Found', { status: 404 });
}

async function handleJoin(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else { const fd = await request.formData(); body = { email: fd.get('email'), name: fd.get('name') }; }
  } catch {}
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim().slice(0, 80);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: 'Valid email required' }, 400);
  const key = 'wl:' + email;
  const existing = await store.get(key);
  if (existing) return jsonResponse({ ok: true, duplicate: true, position: null, message: 'Already on the waitlist!' });
  const countRaw = await store.get('wl:__count__');
  const position = (countRaw ? parseInt(countRaw, 10) : 0) + 1;
  await store.put('wl:__count__', String(position));
  const entry = { email, name, position, ts: new Date().toISOString() };
  await store.put(key, JSON.stringify(entry));
  const webhook = getStringBinding('WEBHOOK_URL');
  if (webhook) { try { await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }); } catch {} }
  await sendNotificationEmail({
    subject: getStringBinding('NOTIFICATION_SUBJECT', 'New waitlist signup'),
    html: `<p>A new waitlist signup was captured.</p><p><strong>Email:</strong> ${escHtml(email)}</p><p><strong>Name:</strong> ${escHtml(name || '—')}</p><p><strong>Position:</strong> ${position}</p>`
  });
  await sendWelcomeEmail(email, getStringBinding('WELCOME_SUBJECT', `You're #${position} on the waitlist`));
  return jsonResponse({ ok: true, duplicate: false, position, message: `You're #${position} on the waitlist!` });
}

async function getCount() {
  const store = kv();
  if (!store) return noKV();
  const raw = await store.get('wl:__count__');
  return jsonResponse({ count: raw ? parseInt(raw, 10) : 0 });
}

async function getList() {
  const store = kv();
  if (!store) return noKV();
  const list = await store.list({ prefix: 'wl:' });
  const entries = await Promise.all(
    list.keys.filter(k => k.name !== 'wl:__count__').map(async k => {
      try { return JSON.parse(await store.get(k.name)); } catch { return null; }
    })
  );
  return jsonResponse({ entries: entries.filter(Boolean).sort((a, b) => a.position - b.position) });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Waitlist</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1e293b;border:1px solid #334155;border-radius:20px;padding:36px;max-width:440px;width:100%;text-align:center}
h1{margin:0 0 8px;font-size:2rem}p{color:#94a3b8;margin:0 0 24px}
.count{font-size:3rem;font-weight:800;color:#a5b4fc;margin:12px 0}
input{width:100%;border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:11px;font:inherit;margin-bottom:10px}
button{width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;padding:12px;font:inherit;font-weight:700;cursor:pointer}
.msg{display:none;margin-top:14px;padding:12px;border-radius:10px;background:#134e4a;color:#6ee7b7;font-weight:600}
.err{background:#450a0a;color:#fca5a5}
</style></head>
<body><div class="card">
<h1>Join the Waitlist</h1>
<p>Be first to know when we launch.</p>
<div class="count" id="cnt">…</div>
<p>people already signed up</p>
<input id="name" placeholder="Your name (optional)">
<input id="email" type="email" placeholder="your@email.com">
<button onclick="join()">Reserve My Spot</button>
<div class="msg" id="msg"></div>
</div>
<script>
fetch('/count').then(r=>r.json()).then(d=>document.getElementById('cnt').textContent=d.count.toLocaleString());
async function join(){
  const email=document.getElementById('email').value.trim();
  const name=document.getElementById('name').value.trim();
  const msg=document.getElementById('msg');
  msg.style.display='none';msg.className='msg';
  const r=await fetch('/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,name})});
  const d=await r.json();
  msg.style.display='block';
  if(d.ok){msg.textContent=d.message;fetch('/count').then(r=>r.json()).then(d=>document.getElementById('cnt').textContent=d.count.toLocaleString());}
  else{msg.classList.add('err');msg.textContent=d.error||'Error';}
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
        from: `${getStringBinding('FROM_NAME', 'Waitlist Embed Form')} <${fromEmail}>`,
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
async function sendWelcomeEmail(email, subject) {
  const apiKey = getStringBinding('RESEND_API_KEY');
  const fromEmail = getStringBinding('FROM_EMAIL');
  if (!apiKey || !fromEmail || !email) return false;
  const html = getStringBinding('WELCOME_BODY_HTML', '<p>Thanks for joining the waitlist. We will keep you posted.</p>');
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${getStringBinding('FROM_NAME', 'Waitlist Embed Form')} <${fromEmail}>`,
        to: [email],
        subject,
        html
      })
    });
    return true;
  } catch {
    return false;
  }
}
