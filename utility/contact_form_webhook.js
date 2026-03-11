addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (path === '/' && request.method === 'GET') {
    return serveFormPage();
  }

  if (path === '/submit' && request.method === 'POST') {
    return handleSubmit(request);
  }

  if (path === '/results' && request.method === 'GET') {
    return handleResults(request);
  }

  if (path === '/results.csv' && request.method === 'GET') {
    return handleResultsCsv(request);
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function handleSubmit(request) {
  try {
    const payload = await parsePayload(request);
    const fields = getConfiguredFields();
    const validation = validateFields(fields, payload.values);
    if (!validation.ok) {
      if (payload.type === 'json') return jsonResponse({ error: validation.error }, 400);
      return serveFormPage({ error: validation.error, values: payload.values }, 400);
    }

    const submission = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      fields: normalizeValues(fields, payload.values),
      ipAddress: request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || ''
    };

    const storage = await storeSubmission(submission);
    const webhook = await sendWebhook(submission);
    const email = await sendNotificationEmail(submission);

    if (payload.type === 'json') {
      return jsonResponse({ ok: true, submission, notifications: { storage, webhook, email } }, 200);
    }

    return serveThankYouPage(submission, { storage, webhook, email });
  } catch (e) {
    return jsonResponse({ error: e?.message || 'Unable to submit form' }, 500);
  }
}

async function handleResults(request) {
  const auth = await requirePassword(request, 'RESULTS_PASSWORD_HASH', 'Contact Form Results', '/results');
  if (!auth.authorized) return auth.response;

  const submissions = await listSubmissions();
  const columns = deriveColumns(getConfiguredFields(), submissions);
  const title = escapeHtml(getStringBinding('FORM_TITLE', 'Contact Us'));
  const storageReady = Boolean(getNamespaceBinding('SUBMISSIONS'));
  const hideBranding = getBooleanBinding('HIDE_BRANDING');
  const rows = submissions.map(submission => {
    const cells = columns.map(column => `<td>${escapeHtml(submission.fields?.[column] || '')}</td>`).join('');
    return `<tr><td>${escapeHtml(submission.submittedAt)}</td>${cells}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} Results</title>
  <style>
    body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; padding: 24px 16px; }
    .page { max-width: 1120px; margin: 0 auto; }
    .hero, .table-card { background: white; border-radius: 24px; box-shadow: 0 20px 50px rgba(15,23,42,0.08); }
    .hero { padding: 28px; margin-bottom: 20px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .stat { background: #eef2ff; color: #3730a3; padding: 14px 16px; border-radius: 16px; min-width: 120px; }
    .notice { margin-top: 12px; padding: 14px 16px; border-radius: 16px; background: #fef3c7; color: #92400e; }
    .table-card { overflow: hidden; }
    .toolbar { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
    .button { display: inline-block; text-decoration: none; background: #0f172a; color: white; padding: 12px 16px; border-radius: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    th { background: #f8fafc; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; }
    .empty { padding: 36px 24px; text-align: center; color: #64748b; }
    .branding { text-align: center; padding: 20px; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div>
        <h1>${title} Results</h1>
        <p>Review submissions stored by the Worker and export them as CSV.</p>
        ${storageReady ? '' : '<div class="notice">SUBMISSIONS KV is not configured, so no submissions can be listed yet.</div>'}
      </div>
      <div class="stat"><strong>${submissions.length}</strong><br>Submissions</div>
    </section>
    <section class="table-card">
      <div class="toolbar">
        <strong>Saved submissions</strong>
        <a class="button" href="/results.csv?password=${encodeURIComponent(auth.password)}">Download CSV</a>
      </div>
      ${submissions.length ? `<table><thead><tr><th>Submitted At</th>${columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">No submissions yet.</div>'}
    </section>
    ${hideBranding ? '' : '<div class="branding">Powered by OneTimeUseWebApp</div>'}
  </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: htmlHeaders() });
}

async function handleResultsCsv(request) {
  const auth = await requirePassword(request, 'RESULTS_PASSWORD_HASH', 'Contact Form Results', '/results');
  if (!auth.authorized) return auth.response;

  const submissions = await listSubmissions();
  const columns = deriveColumns(getConfiguredFields(), submissions);
  const header = ['submittedAt', ...columns];
  const rows = submissions.map(submission => [submission.submittedAt, ...columns.map(column => submission.fields?.[column] || '')]);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="contact-form-results.csv"',
      ...corsHeaders()
    }
  });
}

function serveFormPage(state = {}, status = 200) {
  const title = escapeHtml(getStringBinding('FORM_TITLE', 'Contact Us'));
  const button = escapeHtml(getStringBinding('SUBMIT_BUTTON_LABEL', 'Send Message'));
  const thanks = escapeHtml(getStringBinding('THANK_YOU_MESSAGE', 'Thanks! We\'ll be in touch soon.'));
  const fields = getConfiguredFields();
  const values = state.values || {};
  const error = state.error ? `<div class="banner error">${escapeHtml(state.error)}</div>` : '';
  const hideBranding = getBooleanBinding('HIDE_BRANDING');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: linear-gradient(180deg, #f8fafc, #eef2ff); color: #0f172a; padding: 28px 16px; }
    .shell { max-width: 760px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15,23,42,0.1); }
    .hero { padding: 36px; background: linear-gradient(135deg, #312e81, #4f46e5); color: white; }
    .hero p { color: rgba(255,255,255,.86); line-height: 1.6; }
    form { padding: 28px 36px 36px; }
    .field { margin-bottom: 18px; }
    label { display: block; font-weight: 700; margin-bottom: 8px; }
    input, textarea, select { width: 100%; border: 1px solid #cbd5e1; border-radius: 16px; padding: 14px 16px; font: inherit; }
    textarea { min-height: 140px; resize: vertical; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.12); }
    .banner { margin-bottom: 18px; padding: 14px 16px; border-radius: 16px; }
    .banner.error { background: #fee2e2; color: #991b1b; }
    button { width: 100%; border: none; border-radius: 18px; background: #0f172a; color: white; padding: 16px; font: inherit; font-weight: 700; cursor: pointer; }
    .meta { margin-top: 16px; color: #64748b; font-size: 13px; line-height: 1.6; }
    .branding { text-align: center; padding: 0 36px 28px; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="hero">
      <h1>${title}</h1>
      <p>Deploy a configurable contact form that stores submissions in KV, forwards to webhooks, and sends email notifications when secrets are configured.</p>
    </div>
    <form method="POST" action="/submit">
      ${error}
      ${fields.map(field => renderField(field, values[field.name] || '')).join('')}
      <button type="submit">${button}</button>
      <div class="meta">Thank-you message preview: ${thanks}</div>
    </form>
    ${hideBranding ? '' : '<div class="branding">Powered by OneTimeUseWebApp</div>'}
  </div>
</body>
</html>`;

  return new Response(html, { status, headers: htmlHeaders() });
}

function serveThankYouPage(submission, notifications) {
  const title = escapeHtml(getStringBinding('FORM_TITLE', 'Contact Us'));
  const thanks = escapeHtml(getStringBinding('THANK_YOU_MESSAGE', 'Thanks! We\'ll be in touch soon.'));
  const hideBranding = getBooleanBinding('HIDE_BRANDING');
  const notes = [];
  if (!notifications.storage.saved) notes.push(notifications.storage.message);
  if (!notifications.webhook.sent && notifications.webhook.message) notes.push(notifications.webhook.message);
  if (!notifications.email.sent && notifications.email.message) notes.push(notifications.email.message);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>
  <style>
    body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; padding: 24px 16px; }
    .card { max-width: 720px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15,23,42,0.1); }
    .hero { padding: 36px; background: linear-gradient(135deg, #0f172a, #334155); color: white; }
    .content { padding: 30px 36px 36px; }
    .notice { margin-top: 12px; padding: 14px 16px; border-radius: 16px; background: #fef3c7; color: #92400e; }
    .button { display: inline-block; margin-top: 20px; text-decoration: none; background: #0f172a; color: white; padding: 12px 16px; border-radius: 14px; }
    .branding { text-align: center; padding: 0 36px 30px; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="hero"><h1>Thanks for reaching out</h1><p>${thanks}</p></div>
    <div class="content">
      <p><strong>Submission ID:</strong> ${escapeHtml(submission.id)}</p>
      <p><strong>Submitted at:</strong> ${escapeHtml(submission.submittedAt)}</p>
      ${notes.map(note => `<div class="notice">${escapeHtml(note)}</div>`).join('')}
      <a class="button" href="/">Back to form</a>
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

function getConfiguredFields() {
  const raw = getStringBinding('FIELDS_JSON', '');
  if (!raw) return defaultFields();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return defaultFields();
    const normalized = parsed
      .filter(field => field && field.name && field.label)
      .map(field => ({
        name: String(field.name),
        label: String(field.label),
        type: normalizeFieldType(field.type),
        required: Boolean(field.required),
        options: Array.isArray(field.options) ? field.options.map(option => String(option)) : []
      }));
    return normalized.length ? normalized : defaultFields();
  } catch {
    return defaultFields();
  }
}

function defaultFields() {
  return [
    { name: 'name', label: 'Name', type: 'text', required: true, options: [] },
    { name: 'email', label: 'Email', type: 'email', required: true, options: [] },
    { name: 'message', label: 'Message', type: 'textarea', required: true, options: [] }
  ];
}

function normalizeFieldType(type) {
  return ['text', 'email', 'tel', 'url', 'textarea', 'select'].includes(type) ? type : 'text';
}

function validateFields(fields, values) {
  for (const field of fields) {
    const value = String(values[field.name] || '').trim();
    if (field.required && !value) return { ok: false, error: `${field.label} is required.` };
    if (field.type === 'email' && value && !isValidEmail(value)) return { ok: false, error: `Please enter a valid email for ${field.label}.` };
  }
  return { ok: true };
}

function normalizeValues(fields, values) {
  const output = {};
  fields.forEach(field => {
    output[field.name] = String(values[field.name] || '').trim();
  });
  return output;
}

async function storeSubmission(submission) {
  const kv = getNamespaceBinding('SUBMISSIONS');
  if (!kv) return { saved: false, message: 'SUBMISSIONS KV is not configured, so this submission was not stored.' };
  await kv.put(`submission:${submission.submittedAt}:${submission.id}`, JSON.stringify(submission));
  return { saved: true, message: 'Submission stored.' };
}

async function sendWebhook(submission) {
  const url = getStringBinding('WEBHOOK_URL');
  if (!url) return { sent: false, message: 'WEBHOOK_URL not configured. Skipped webhook forwarding.' };

  const type = getStringBinding('WEBHOOK_TYPE', 'generic').toLowerCase();
  const summary = Object.entries(submission.fields).map(([key, value]) => `${key}: ${value}`).join('\n');
  const payload = type === 'slack'
    ? { text: `New contact form submission\n${summary}` }
    : type === 'discord'
      ? { content: `New contact form submission\n${summary}` }
      : { type: 'contact_form_submission', submission };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.ok
    ? { sent: true, message: 'Webhook delivered.' }
    : { sent: false, message: `Webhook returned HTTP ${response.status}.` };
}

async function sendNotificationEmail(submission) {
  const apiKey = getStringBinding('RESEND_API_KEY');
  const fromEmail = getStringBinding('FROM_EMAIL');
  const notifyEmail = getStringBinding('NOTIFICATION_EMAIL');
  if (!apiKey || !fromEmail || !notifyEmail) {
    return { sent: false, message: 'Email forwarding is not fully configured. Set RESEND_API_KEY, FROM_EMAIL, and NOTIFICATION_EMAIL.' };
  }

  const html = `<h2>New contact form submission</h2><table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">${Object.entries(submission.fields).map(([key, value]) => `<tr><th align="left">${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</table>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notifyEmail],
      subject: `New submission: ${getStringBinding('FORM_TITLE', 'Contact Form')}`,
      html
    })
  });

  return response.ok
    ? { sent: true, message: 'Email sent.' }
    : { sent: false, message: `Resend returned HTTP ${response.status}.` };
}

async function listSubmissions() {
  const kv = getNamespaceBinding('SUBMISSIONS');
  if (!kv) return [];
  return (await readAllRecords(kv, 'submission:')).sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
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

function deriveColumns(fields, submissions) {
  const seen = new Set(fields.map(field => field.name));
  submissions.forEach(submission => Object.keys(submission.fields || {}).forEach(key => seen.add(key)));
  return Array.from(seen);
}

function renderField(field, value) {
  const required = field.required ? 'required' : '';
  const label = `${escapeHtml(field.label)}${field.required ? ' *' : ''}`;
  const name = escapeHtml(field.name);
  const current = escapeHtml(value || '');
  if (field.type === 'textarea') {
    return `<div class="field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" ${required}>${current}</textarea></div>`;
  }
  if (field.type === 'select') {
    const options = field.options.map(option => `<option value="${escapeHtml(option)}" ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('');
    return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}" ${required}><option value="">Select an option</option>${options}</select></div>`;
  }
  return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${escapeHtml(field.type)}" value="${current}" ${required}></div>`;
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
