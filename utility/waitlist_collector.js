addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (path === '/' && request.method === 'GET') {
    return serveLandingPage();
  }

  if (path === '/join' && request.method === 'POST') {
    return handleJoin(request);
  }

  if (path === '/admin' && request.method === 'GET') {
    return handleAdmin(request);
  }

  if (path === '/admin/export.csv' && request.method === 'GET') {
    return handleAdminCsv(request);
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function handleJoin(request) {
  try {
    const payload = await parsePayload(request);
    const collectName = getBooleanBinding('COLLECT_NAME');
    const email = String(payload.values.email || '').trim().toLowerCase();
    const name = String(payload.values.name || '').trim();

    if (!email || !isValidEmail(email)) {
      if (payload.type === 'json') return jsonResponse({ error: 'A valid email address is required.' }, 400);
      return serveLandingPage({ error: 'A valid email address is required.', values: payload.values }, 400);
    }
    if (collectName && !name) {
      if (payload.type === 'json') return jsonResponse({ error: 'Name is required.' }, 400);
      return serveLandingPage({ error: 'Name is required.', values: payload.values }, 400);
    }

    const entry = { email, name, joinedAt: new Date().toISOString() };
    const storage = await saveEntry(entry);
    const emailResult = storage.duplicate
      ? { sent: false, message: 'Signup already exists. Skipped welcome email.' }
      : await sendWelcomeEmail(entry);
    const webhookResult = storage.duplicate
      ? { sent: false, message: 'Signup already exists. Skipped webhook notification.' }
      : await sendWebhook(entry);

    if (payload.type === 'json') {
      return jsonResponse({ ok: true, entry, storage, notifications: { email: emailResult, webhook: webhookResult } }, 200);
    }

    return serveSuccessPage(entry, storage, { email: emailResult, webhook: webhookResult });
  } catch (e) {
    return jsonResponse({ error: e?.message || 'Unable to join waitlist' }, 500);
  }
}

async function handleAdmin(request) {
  const auth = await requirePassword(request, 'ADMIN_PASSWORD_HASH', 'Waitlist Admin', '/admin');
  if (!auth.authorized) return auth.response;

  const entries = await listEntries();
  const collectName = getBooleanBinding('COLLECT_NAME');
  const storageReady = Boolean(getNamespaceBinding('WAITLIST'));
  const hideBranding = getBooleanBinding('HIDE_BRANDING');
  const rows = entries.map(entry => `<tr><td>${escapeHtml(entry.joinedAt)}</td>${collectName ? `<td>${escapeHtml(entry.name || '')}</td>` : ''}<td>${escapeHtml(entry.email)}</td></tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Waitlist Admin</title>
  <style>
    body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; padding: 24px 16px; }
    .page { max-width: 1040px; margin: 0 auto; }
    .hero, .table-card { background: white; border-radius: 24px; box-shadow: 0 20px 50px rgba(15,23,42,0.08); }
    .hero { padding: 28px; margin-bottom: 20px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .stat { background: #eef2ff; color: #3730a3; padding: 14px 16px; border-radius: 16px; min-width: 120px; }
    .notice { margin-top: 12px; padding: 14px 16px; border-radius: 16px; background: #fef3c7; color: #92400e; }
    .table-card { overflow: hidden; }
    .toolbar { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
    .button { display: inline-block; text-decoration: none; background: #0f172a; color: white; padding: 12px 16px; border-radius: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; }
    .empty { padding: 36px 24px; text-align: center; color: #64748b; }
    .branding { text-align: center; padding: 20px; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div>
        <h1>Waitlist Admin</h1>
        <p>Review captured signups and export them as CSV.</p>
        ${storageReady ? '' : '<div class="notice">WAITLIST KV is not configured, so signups cannot be persisted or exported.</div>'}
      </div>
      <div class="stat"><strong>${entries.length}</strong><br>Subscribers</div>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <strong>Saved signups</strong>
        <a class="button" href="/admin/export.csv?password=${encodeURIComponent(auth.password)}">Export CSV</a>
      </div>
      ${entries.length ? `<table><thead><tr><th>Joined At</th>${collectName ? '<th>Name</th>' : ''}<th>Email</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">No signups yet.</div>'}
    </section>
    ${hideBranding ? '' : '<div class="branding">Powered by OneTimeUseWebApp</div>'}
  </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: htmlHeaders() });
}

async function handleAdminCsv(request) {
  const auth = await requirePassword(request, 'ADMIN_PASSWORD_HASH', 'Waitlist Admin', '/admin');
  if (!auth.authorized) return auth.response;

  const entries = await listEntries();
  const collectName = getBooleanBinding('COLLECT_NAME');
  const header = collectName ? ['joinedAt', 'name', 'email'] : ['joinedAt', 'email'];
  const rows = entries.map(entry => collectName ? [entry.joinedAt, entry.name || '', entry.email] : [entry.joinedAt, entry.email]);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="waitlist-export.csv"',
      ...corsHeaders()
    }
  });
}

function serveLandingPage(state = {}, status = 200) {
  const headline = escapeHtml(getStringBinding('HEADLINE', 'We\'re launching soon'));
  const subheadline = escapeHtml(getStringBinding('SUBHEADLINE', 'Be the first to know when we go live.'));
  const ctaLabel = escapeHtml(getStringBinding('CTA_LABEL', 'Join Waitlist'));
  const collectName = getBooleanBinding('COLLECT_NAME');
  const hideBranding = getBooleanBinding('HIDE_BRANDING');
  const values = state.values || {};
  const error = state.error ? `<div class="notice error">${escapeHtml(state.error)}</div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${headline}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at top, rgba(99,102,241,.18), transparent 32%), linear-gradient(180deg, #0f172a, #1e293b); color: white; padding: 24px 16px;
    }
    .shell { width: min(760px, 100%); background: rgba(15,23,42,.8); border: 1px solid rgba(148,163,184,.18); border-radius: 30px; box-shadow: 0 26px 60px rgba(2,6,23,.35); overflow: hidden; }
    .hero { padding: 40px 36px 18px; }
    .pill { display: inline-block; padding: 8px 12px; border-radius: 999px; background: rgba(59,130,246,.18); color: #bfdbfe; font-size: 13px; }
    h1 { font-size: clamp(2.4rem, 5vw, 4rem); line-height: 1.02; margin: 16px 0 12px; }
    p { color: #cbd5e1; line-height: 1.7; }
    form { padding: 12px 36px 36px; display: grid; gap: 16px; }
    input { width: 100%; border: 1px solid rgba(148,163,184,.34); border-radius: 18px; padding: 16px; font: inherit; color: white; background: rgba(15,23,42,.56); }
    input::placeholder { color: #94a3b8; }
    input:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,.18); }
    button { border: none; border-radius: 18px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 18px; font: inherit; font-weight: 700; cursor: pointer; }
    .notice { padding: 14px 16px; border-radius: 16px; background: rgba(219,234,254,.16); color: #dbeafe; }
    .notice.error { background: rgba(127,29,29,.44); color: #fecaca; }
    .meta { color: #94a3b8; font-size: 13px; line-height: 1.6; }
    .branding { text-align: center; padding: 0 36px 28px; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="hero">
      <div class="pill">Join the list</div>
      <h1>${headline}</h1>
      <p>${subheadline}</p>
    </div>
    <form method="POST" action="/join">
      ${error}
      ${collectName ? `<input type="text" name="name" value="${escapeHtml(values.name || '')}" placeholder="Your name" required>` : ''}
      <input type="email" name="email" value="${escapeHtml(values.email || '')}" placeholder="you@example.com" required>
      <button type="submit">${ctaLabel}</button>
      <div class="meta">When configured, this Worker stores signups in KV, sends a welcome email through Resend, and notifies your webhook.</div>
    </form>
    ${hideBranding ? '' : '<div class="branding">Powered by OneTimeUseWebApp</div>'}
  </div>
</body>
</html>`;

  return new Response(html, { status, headers: htmlHeaders() });
}

function serveSuccessPage(entry, storage, notifications) {
  const headline = escapeHtml(getStringBinding('HEADLINE', 'We\'re launching soon'));
  const hideBranding = getBooleanBinding('HIDE_BRANDING');
  const notes = [];
  if (storage.duplicate) notes.push(storage.message);
  if (!storage.saved) notes.push(storage.message);
  if (!notifications.email.sent && notifications.email.message) notes.push(notifications.email.message);
  if (!notifications.webhook.sent && notifications.webhook.message) notes.push(notifications.webhook.message);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${headline}</title>
  <style>
    body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; padding: 24px 16px; }
    .card { max-width: 720px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15,23,42,.08); }
    .hero { padding: 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    .content { padding: 30px 36px 36px; }
    .notice { margin-top: 12px; padding: 14px 16px; border-radius: 16px; background: #fef3c7; color: #92400e; }
    .button { display: inline-block; margin-top: 20px; text-decoration: none; background: #0f172a; color: white; padding: 12px 16px; border-radius: 14px; }
    .branding { text-align: center; padding: 0 36px 30px; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="hero"><h1>${storage.duplicate ? 'You\'re already on the list' : 'You\'re on the list!'}</h1><p>${storage.duplicate ? 'We already have this email saved.' : 'Thanks for signing up. We\'ll keep you posted.'}</p></div>
    <div class="content">
      <p><strong>Email:</strong> ${escapeHtml(entry.email)}</p>
      ${entry.name ? `<p><strong>Name:</strong> ${escapeHtml(entry.name)}</p>` : ''}
      <p><strong>Joined at:</strong> ${escapeHtml(entry.joinedAt)}</p>
      ${notes.map(note => `<div class="notice">${escapeHtml(note)}</div>`).join('')}
      <a class="button" href="/">Back to landing page</a>
    </div>
    ${hideBranding ? '' : '<div class="branding">Powered by OneTimeUseWebApp</div>'}
  </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: htmlHeaders() });
}

async function parsePayload(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { type: 'json', values: (await request.json()) || {} };
  }
  const formData = await request.formData();
  const values = {};
  for (const [key, value] of formData.entries()) {
    values[key] = typeof value === 'string' ? value : value?.name || '';
  }
  return { type: 'form', values };
}

async function saveEntry(entry) {
  const kv = getNamespaceBinding('WAITLIST');
  if (!kv) return { saved: false, duplicate: false, message: 'WAITLIST KV is not configured, so this signup was not stored.' };
  const key = waitlistKey(entry.email);
  const existing = await kv.get(key);
  if (existing) return { saved: true, duplicate: true, message: 'This email is already subscribed.' };
  await kv.put(key, JSON.stringify(entry));
  return { saved: true, duplicate: false, message: 'Signup stored.' };
}

async function sendWelcomeEmail(entry) {
  const apiKey = getStringBinding('RESEND_API_KEY');
  const fromEmail = getStringBinding('FROM_EMAIL');
  if (!apiKey || !fromEmail) {
    return { sent: false, message: 'Welcome email skipped because RESEND_API_KEY or FROM_EMAIL is missing.' };
  }
  const fromName = getStringBinding('FROM_NAME', 'Team');
  const subject = getStringBinding('WELCOME_SUBJECT', 'You\'re on the list!');
  const html = getStringBinding('WELCOME_BODY_HTML', '<p>Thanks for joining the waitlist. We\'ll be in touch soon.</p>');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [entry.email],
      subject,
      html
    })
  });
  return response.ok ? { sent: true, message: 'Welcome email sent.' } : { sent: false, message: `Resend returned HTTP ${response.status}.` };
}

async function sendWebhook(entry) {
  const url = getStringBinding('WEBHOOK_URL');
  if (!url) return { sent: false, message: 'WEBHOOK_URL not configured. Skipped webhook notification.' };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'waitlist_signup', entry })
  });
  return response.ok ? { sent: true, message: 'Webhook delivered.' } : { sent: false, message: `Webhook returned HTTP ${response.status}.` };
}

async function listEntries() {
  const kv = getNamespaceBinding('WAITLIST');
  if (!kv) return [];
  return (await readAllRecords(kv, 'waitlist:')).sort((a, b) => String(b.joinedAt).localeCompare(String(a.joinedAt)));
}

async function readAllRecords(kv, prefix) {
  const records = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    const values = await Promise.all(page.keys.map(async key => {
      const raw = await kv.get(key.name);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    }));
    records.push(...values.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return records;
}

function waitlistKey(email) {
  return `waitlist:${encodeURIComponent(String(email || '').trim().toLowerCase())}`;
}

async function requirePassword(request, bindingName, title, actionPath) {
  const hash = normalizeHash(getStringBinding(bindingName));
  if (!hash) {
    return { authorized: false, response: configurationError(`${bindingName} is not configured. Set a SHA-256 hash before exposing ${title.toLowerCase()}.`, title) };
  }
  const url = new URL(request.url);
  const password = url.searchParams.get('password') || '';
  if (!password) return { authorized: false, response: passwordPage(title, actionPath) };
  const digest = await sha256Hex(password);
  if (digest !== hash) return { authorized: false, response: passwordPage(title, actionPath, 'Incorrect password.') };
  return { authorized: true, password };
}

function configurationError(message, title) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title><style>body{font-family:Inter,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;padding:24px}.card{max-width:640px;margin:48px auto;background:#fff;border-radius:24px;padding:32px;box-shadow:0 20px 50px rgba(15,23,42,.08)}.banner{margin-top:14px;padding:14px 16px;border-radius:16px;background:#fee2e2;color:#991b1b}</style></head><body><div class="card"><h1>${escapeHtml(title)}</h1><div class="banner">${escapeHtml(message)}</div></div></body></html>`;
  return new Response(html, { status: 503, headers: htmlHeaders() });
}

function passwordPage(title, actionPath, error = '') {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title><style>body{font-family:Inter,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;padding:24px}.card{max-width:480px;margin:48px auto;background:#fff;border-radius:24px;padding:32px;box-shadow:0 20px 50px rgba(15,23,42,.08)}input{width:100%;margin-top:12px;border:1px solid #cbd5e1;border-radius:14px;padding:14px 16px;font:inherit}button{width:100%;margin-top:16px;border:none;border-radius:14px;padding:14px;font:inherit;font-weight:700;background:#0f172a;color:#fff}.error{margin-top:12px;padding:12px 14px;border-radius:14px;background:#fee2e2;color:#991b1b}</style></head><body><div class="card"><h1>${escapeHtml(title)}</h1><p>Enter the password to continue.</p><form method="GET" action="${escapeHtml(actionPath)}"><input type="password" name="password" placeholder="Password" required><button type="submit">Continue</button>${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}</form></div></body></html>`;
  return new Response(html, { status: 401, headers: htmlHeaders() });
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeHash(value) {
  return String(value || '').trim().toLowerCase();
}

function csvEscape(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStringBinding(name, fallback = '') {
  const value = typeof globalThis[name] === 'undefined' ? fallback : globalThis[name];
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function getNamespaceBinding(name) {
  return typeof globalThis[name] === 'undefined' ? null : globalThis[name];
}

function getBooleanBinding(name) {
  return ['1', 'true', 'yes', 'on'].includes(getStringBinding(name, 'false').trim().toLowerCase());
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}

function htmlHeaders() {
  return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
