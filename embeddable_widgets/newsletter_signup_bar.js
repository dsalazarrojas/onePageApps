addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/subscribe' && request.method === 'POST') return handleSubscribe(request);
  if (path === '/subscribers' && request.method === 'GET') return listSubscribers();
  if (path === '/embed.js' && request.method === 'GET') return serveEmbedScript(url);
  return new Response('Not Found', { status: 404 });
}

async function handleSubscribe(request) {
  const store = kv();
  if (!store) return noKV();
  let email = '';
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { email = String((await request.json()).email || '').trim().toLowerCase(); } catch {}
  } else {
    try { const fd = await request.formData(); email = String(fd.get('email') || '').trim().toLowerCase(); } catch {}
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: 'Valid email required' }, 400);
  const existing = await store.get('nl:' + email);
  if (existing) return jsonResponse({ ok: true, duplicate: true, message: 'Already subscribed.' });
  const entry = { email, ts: new Date().toISOString() };
  await store.put('nl:' + email, JSON.stringify(entry));
  const webhook = getStringBinding('WEBHOOK_URL');
  if (webhook) { try { await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }); } catch {} }
  await sendNotificationEmail({
    subject: getStringBinding('NOTIFICATION_SUBJECT', 'New newsletter signup'),
    html: `<p>A new newsletter subscriber joined.</p><p><strong>Email:</strong> ${escHtml(email)}</p><p><strong>Joined:</strong> ${escHtml(entry.ts)}</p>`
  });
  await sendWelcomeEmail(email, getStringBinding('WELCOME_SUBJECT', 'Thanks for subscribing'));
  return jsonResponse({ ok: true, duplicate: false, message: 'Subscribed!' });
}

async function listSubscribers() {
  const store = kv();
  if (!store) return noKV();
  const list = await store.list({ prefix: 'nl:' });
  const entries = await Promise.all(list.keys.map(async k => { try { return JSON.parse(await store.get(k.name)); } catch { return null; } }));
  return jsonResponse({ count: entries.filter(Boolean).length, subscribers: entries.filter(Boolean).sort((a,b)=>b.ts.localeCompare(a.ts)) });
}

function serveEmbedScript(url) {
  const base = url.origin;
  const js = `(function(){
  const bar=document.createElement('div');
  bar.id='nl-bar';
  bar.style='position:fixed;bottom:0;left:0;right:0;background:#1e293b;border-top:1px solid #334155;padding:12px 20px;display:flex;align-items:center;gap:12px;z-index:9999;font-family:system-ui,sans-serif;color:#e2e8f0;';
  bar.innerHTML='<span style="flex:1;font-size:14px;font-weight:600">📬 Stay in the loop — subscribe to our newsletter</span><input id="nl-email" type="email" placeholder="your@email.com" style="border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:8px;padding:8px 12px;font:inherit;width:220px"><button id="nl-btn" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:8px;padding:8px 16px;cursor:pointer;font:inherit;font-weight:700">Subscribe</button><button id="nl-close" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;padding:0 4px">✕</button>';
  document.body.appendChild(bar);
  document.getElementById('nl-close').onclick=()=>bar.remove();
  document.getElementById('nl-btn').onclick=async()=>{
    const email=document.getElementById('nl-email').value.trim();
    if(!email){alert('Enter your email.');return;}
    const r=await fetch('${base}/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    const d=await r.json();
    if(d.ok){bar.innerHTML='<span style="color:#6ee7b7;font-weight:700;padding:8px">✓ '+d.message+'</span>';setTimeout(()=>bar.remove(),3000);}
    else alert(d.error||'Error');
  };
})();`;
  return new Response(js, { status: 200, headers: { 'Content-Type': 'application/javascript', ...corsHeaders() } });
}

function servePage() {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Newsletter Signup Bar</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding-bottom:80px}
.wrap{max-width:600px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
code{background:#0f172a;padding:2px 6px;border-radius:6px;font-size:13px}
</style></head>
<body><div class="wrap">
<h2>📬 Newsletter Signup Bar</h2>
<div class="card"><p>A sticky signup bar that can be embedded on any page. Add the script below to any site:</p>
<code>&lt;script src="https://YOUR_WORKER.workers.dev/embed.js"&gt;&lt;/script&gt;</code>
<p style="margin-top:12px;color:#94a3b8">The bar appears at the bottom of the page and posts the email to this worker's <code>/subscribe</code> endpoint. Subscriptions are stored in KV (DATA binding).</p>
</div>
<div class="card">
<strong>Live preview — scroll to bottom to see the bar</strong>
<p>Subscribers: <span id="count">loading…</span></p>
</div>
</div>
<script src="/embed.js"></script>
<script>fetch('/subscribers').then(r=>r.json()).then(d=>{document.getElementById('count').textContent=d.count;});</script>
</body></html>`;
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
        from: `${getStringBinding('FROM_NAME', 'Newsletter Signup Bar')} <${fromEmail}>`,
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
  const html = getStringBinding('WELCOME_BODY_HTML', '<p>Thanks for subscribing. We will be in touch soon.</p>');
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${getStringBinding('FROM_NAME', 'Newsletter Signup Bar')} <${fromEmail}>`,
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
