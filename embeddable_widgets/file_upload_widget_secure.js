addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (path === '/' && request.method === 'GET') {
    return servePage();
  }

  if (path === '/health' && request.method === 'GET') {
    return jsonResponse({ ok: true, bindingsReady: hasBinding('FILE_R2') && hasBinding('FILE_KV') }, 200);
  }

  if (path === '/upload' && request.method === 'POST') {
    return handleUpload(request);
  }

  if (path.startsWith('/download/')) {
    return handleDownload(request, path.split('/').pop());
  }

  if (path.startsWith('/api/uploads/') && request.method === 'GET') {
    return handleMetadata(path.split('/').pop());
  }

  return new Response('Not Found', { status: 404, headers: htmlHeaders() });
}

async function handleUpload(request) {
  try {
    const bucket = getBinding('FILE_R2');
    const kv = getBinding('FILE_KV');
    const settings = readSettings();
    const formData = await request.formData();
    const file = formData.get('file');
    const password = String(formData.get('password') || '').trim();
    const requestedHours = Number(formData.get('expiresInHours') || settings.defaultExpiryHours);
    const expiryHours = clampNumber(requestedHours, 1, 168, settings.defaultExpiryHours);

    if (!(file instanceof File)) {
      return jsonResponse({ error: 'Choose a file before uploading.' }, 400);
    }

    if (settings.requirePassword && !password) {
      return jsonResponse({ error: 'A download password is required for this widget.' }, 400);
    }

    if (file.size > settings.maxFileSizeMB * 1024 * 1024) {
      return jsonResponse({ error: `File is too large. Limit is ${settings.maxFileSizeMB} MB.` }, 413);
    }

    if (settings.allowedTypes.length && !isAllowedType(file, settings.allowedTypes)) {
      return jsonResponse({ error: `Allowed file types: ${settings.allowedTypes.join(', ')}` }, 400);
    }

    const uploadID = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + (expiryHours * 60 * 60 * 1000);
    const ttl = Math.max(60, Math.floor((expiresAt - now) / 1000));
    const objectKey = makeObjectKey(uploadID, file.name);
    const bytes = await file.arrayBuffer();
    const safeName = safeFilename(file.name || 'upload.bin');
    const metadata = {
      id: uploadID,
      objectKey,
      fileName: safeName,
      originalFileName: file.name || safeName,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: now,
      expiresAt,
      passwordHash: password ? await sha256Hex(password) : null,
      downloadCount: 0
    };

    await bucket.put(objectKey, bytes, {
      httpMetadata: {
        contentType: metadata.contentType,
        contentDisposition: contentDisposition(safeName)
      },
      customMetadata: {
        uploadID,
        expiresAt: String(expiresAt)
      }
    });
    await kv.put(metadataKey(uploadID), JSON.stringify(metadata), { expirationTtl: ttl });

    return jsonResponse({
      id: uploadID,
      fileName: metadata.fileName,
      size: metadata.size,
      expiresAt: new Date(expiresAt).toISOString(),
      passwordProtected: Boolean(metadata.passwordHash),
      downloadURL: `${new URL(request.url).origin}/download/${uploadID}`
    }, 200);
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Upload failed.' }, 500);
  }
}

async function handleDownload(request, uploadID) {
  try {
    const bucket = getBinding('FILE_R2');
    const kv = getBinding('FILE_KV');
    const metadata = await readMetadata(kv, uploadID);
    if (!metadata) {
      return new Response('File not found or already expired.', { status: 404, headers: htmlHeaders() });
    }

    if (Date.now() >= Number(metadata.expiresAt || 0)) {
      await purgeUpload(bucket, kv, metadata);
      return new Response('This file has expired and was removed.', { status: 410, headers: htmlHeaders() });
    }

    const password = await readPassword(request);
    if (metadata.passwordHash) {
      if (!password) {
        return servePasswordPage(uploadID, metadata.fileName);
      }
      if (await sha256Hex(password) !== metadata.passwordHash) {
        return new Response('Incorrect password.', { status: 401, headers: htmlHeaders() });
      }
    }

    const object = await bucket.get(metadata.objectKey);
    if (!object) {
      await kv.delete(metadataKey(uploadID));
      return new Response('Stored file is missing from R2.', { status: 404, headers: htmlHeaders() });
    }

    metadata.downloadCount = Number(metadata.downloadCount || 0) + 1;
    const remainingTTL = Math.max(60, Math.floor((Number(metadata.expiresAt) - Date.now()) / 1000));
    await kv.put(metadataKey(uploadID), JSON.stringify(metadata), { expirationTtl: remainingTTL });

    const headers = new Headers(corsHeaders());
    headers.set('Cache-Control', 'private, no-store');
    headers.set('Content-Disposition', contentDisposition(metadata.fileName || 'download.bin'));
    if (object.writeHttpMetadata) {
      object.writeHttpMetadata(headers);
    } else {
      headers.set('Content-Type', metadata.contentType || 'application/octet-stream');
    }

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    return new Response(error?.message || 'Download failed.', { status: 500, headers: htmlHeaders() });
  }
}

async function handleMetadata(uploadID) {
  const kv = getBinding('FILE_KV');
  const metadata = await readMetadata(kv, uploadID);
  if (!metadata) {
    return jsonResponse({ error: 'Upload not found.' }, 404);
  }

  return jsonResponse({
    id: metadata.id,
    fileName: metadata.fileName,
    size: metadata.size,
    expiresAt: new Date(metadata.expiresAt).toISOString(),
    passwordProtected: Boolean(metadata.passwordHash),
    downloadCount: Number(metadata.downloadCount || 0)
  }, 200);
}

function servePage() {
  const settings = readSettings();
  const bindingWarning = hasBinding('FILE_R2') && hasBinding('FILE_KV')
    ? ''
    : '<div class="notice warning">This preview is live, but deployments need both <code>FILE_R2</code> and <code>FILE_KV</code> bindings before uploads can be stored.</div>';
  const allowLabel = settings.allowedTypes.length ? settings.allowedTypes.join(', ') : 'Any file type';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(settings.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    .page { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .card { width: min(720px, 100%); background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 28px; padding: 28px; box-shadow: 0 30px 70px rgba(2, 6, 23, 0.45); }
    h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
    p { color: #cbd5e1; line-height: 1.65; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 0 22px; }
    .pill { padding: 8px 12px; border-radius: 999px; background: rgba(59, 130, 246, 0.16); color: #bfdbfe; font-size: 13px; }
    .dropzone { border: 1.5px dashed rgba(96, 165, 250, 0.45); border-radius: 24px; padding: 28px; text-align: center; background: rgba(30, 41, 59, 0.65); }
    .dropzone.drag { border-color: #60a5fa; background: rgba(30, 41, 59, 0.95); }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-top: 18px; }
    label { display: grid; gap: 8px; font-size: 14px; color: #cbd5e1; }
    input, select, button { width: 100%; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.28); font: inherit; padding: 12px 14px; }
    input, select { background: rgba(15, 23, 42, 0.9); color: #e2e8f0; }
    button { border: none; background: linear-gradient(135deg, #2563eb, #14b8a6); color: white; font-weight: 700; cursor: pointer; }
    button:disabled { opacity: 0.65; cursor: wait; }
    .notice { margin-top: 16px; padding: 14px 16px; border-radius: 18px; background: rgba(30, 41, 59, 0.8); }
    .warning { background: rgba(127, 29, 29, 0.35); color: #fecaca; }
    .result { display: none; margin-top: 18px; padding: 18px; border-radius: 18px; background: rgba(15, 118, 110, 0.18); }
    .result.error { background: rgba(127, 29, 29, 0.3); color: #fecaca; }
    .link-row { display: grid; gap: 10px; grid-template-columns: 1fr auto; }
    .link-row input { background: rgba(255,255,255,0.95); color: #0f172a; }
    code { color: #bfdbfe; }
  </style>
</head>
<body>
  <main class="page">
    <section class="card">
      <h1>${escapeHtml(settings.title)}</h1>
      <p>Upload a file, choose an expiry window, and optionally add a download password. The binary goes to R2 while metadata and expiry tracking stay in KV.</p>
      <div class="meta">
        <div class="pill">Max size: ${settings.maxFileSizeMB} MB</div>
        <div class="pill">Allowed types: ${escapeHtml(allowLabel)}</div>
        <div class="pill">Default expiry: ${settings.defaultExpiryHours} hours</div>
      </div>
      ${bindingWarning}
      <form id="uploadForm">
        <div class="dropzone" id="dropzone">
          <input id="file" name="file" type="file" required>
          <p id="fileSummary">Drag a file here or use the picker above.</p>
        </div>
        <div class="grid">
          <label>Expires in hours
            <select id="expiresInHours" name="expiresInHours">
              <option value="1">1 hour</option>
              <option value="6">6 hours</option>
              <option value="24" selected>24 hours</option>
              <option value="72">72 hours</option>
              <option value="168">7 days</option>
            </select>
          </label>
          <label>Optional password
            <input id="password" name="password" type="password" placeholder="Protect downloads with a password">
          </label>
        </div>
        <div class="grid">
          <button id="submitButton" type="submit">Upload securely</button>
        </div>
      </form>
      <div class="result" id="successBox">
        <strong>Upload complete.</strong>
        <p id="summary"></p>
        <div class="link-row">
          <input id="downloadURL" readonly>
          <button id="copyButton" type="button">Copy</button>
        </div>
      </div>
      <div class="result error" id="errorBox"></div>
    </section>
  </main>
  <script>
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file');
    const dropzone = document.getElementById('dropzone');
    const fileSummary = document.getElementById('fileSummary');
    const successBox = document.getElementById('successBox');
    const errorBox = document.getElementById('errorBox');
    const summary = document.getElementById('summary');
    const downloadURL = document.getElementById('downloadURL');
    const submitButton = document.getElementById('submitButton');

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      fileSummary.textContent = file ? (file.name + ' • ' + (file.size / 1024 / 1024).toFixed(2) + ' MB') : 'Drag a file here or use the picker above.';
    });

    ['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.classList.add('drag');
    }));
    ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.classList.remove('drag');
    }));
    dropzone.addEventListener('drop', event => {
      const [file] = event.dataTransfer.files;
      if (!file) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
      fileInput.dispatchEvent(new Event('change'));
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      successBox.style.display = 'none';
      errorBox.style.display = 'none';
      submitButton.disabled = true;
      try {
        const payload = new FormData(form);
        const response = await fetch('/upload', { method: 'POST', body: payload });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        summary.textContent = (data.fileName || 'Your file') + ' is ready until ' + new Date(data.expiresAt).toLocaleString() + '.';
        downloadURL.value = data.downloadURL;
        successBox.style.display = 'block';
      } catch (error) {
        errorBox.textContent = error.message || 'Upload failed';
        errorBox.style.display = 'block';
      } finally {
        submitButton.disabled = false;
      }
    });

    document.getElementById('copyButton').addEventListener('click', async () => {
      if (!downloadURL.value) return;
      await navigator.clipboard.writeText(downloadURL.value);
    });
  </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: htmlHeaders() });
}

function servePasswordPage(uploadID, fileName) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password required</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    .card { width: min(420px, 100%); background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 24px; padding: 24px; }
    h1 { margin-top: 0; }
    input, button { width: 100%; border-radius: 14px; padding: 12px 14px; font: inherit; margin-top: 12px; }
    input { border: 1px solid rgba(148, 163, 184, 0.28); background: rgba(15, 23, 42, 0.9); color: #e2e8f0; }
    button { border: none; background: #2563eb; color: white; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <form class="card" method="POST" action="/download/${encodeURIComponent(uploadID)}">
    <h1>Protected download</h1>
    <p>${escapeHtml(fileName || 'This file')} requires a password before it can be downloaded.</p>
    <input type="password" name="password" placeholder="Enter password" required>
    <button type="submit">Download file</button>
  </form>
</body>
</html>`;
  return new Response(html, { status: 200, headers: htmlHeaders() });
}

async function readMetadata(kv, uploadID) {
  if (!uploadID) return null;
  const raw = await kv.get(metadataKey(uploadID));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function purgeUpload(bucket, kv, metadata) {
  await Promise.allSettled([
    metadata?.objectKey ? bucket.delete(metadata.objectKey) : Promise.resolve(),
    metadata?.id ? kv.delete(metadataKey(metadata.id)) : Promise.resolve()
  ]);
}

async function readPassword(request) {
  if (request.method === 'POST') {
    const formData = await request.formData();
    return String(formData.get('password') || '').trim();
  }
  return String(new URL(request.url).searchParams.get('password') || '').trim();
}

function readSettings() {
  return {
    title: getStringBinding('UPLOAD_TITLE', 'Secure file upload widget'),
    maxFileSizeMB: clampNumber(Number(getStringBinding('MAX_FILE_SIZE_MB', '25')), 1, 250, 25),
    defaultExpiryHours: clampNumber(Number(getStringBinding('DEFAULT_EXPIRY_HOURS', '24')), 1, 168, 24),
    requirePassword: parseBoolean(getStringBinding('REQUIRE_PASSWORD', 'false')),
    allowedTypes: parseList(getStringBinding('ALLOWED_FILE_TYPES', ''))
  };
}

function metadataKey(uploadID) {
  return `upload:${uploadID}`;
}

function makeObjectKey(uploadID, fileName) {
  return `uploads/${uploadID}/${safeFilename(fileName || 'upload.bin')}`;
}

function contentDisposition(fileName) {
  return `attachment; filename="${String(fileName || 'download.bin').replace(/"/g, '')}"`;
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseBoolean(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isAllowedType(file, allowedTypes) {
  const fileName = String(file.name || '').toLowerCase();
  const mime = String(file.type || '').toLowerCase();
  return allowedTypes.some(type => {
    const normalized = type.toLowerCase();
    if (normalized.startsWith('.')) return fileName.endsWith(normalized);
    if (normalized.endsWith('/*')) return mime.startsWith(normalized.slice(0, -1));
    return mime === normalized;
  });
}

function safeFilename(value) {
  const cleaned = String(value || 'upload.bin')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'upload.bin';
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function getBinding(name) {
  const binding = globalThis[name];
  if (!binding) {
    throw new Error(`Missing required binding: ${name}`);
  }
  return binding;
}

function hasBinding(name) {
  return Boolean(globalThis[name]);
}

function getStringBinding(name, fallback = '') {
  const value = globalThis[name];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...corsHeaders()
  };
}

function htmlHeaders() {
  return {
    'Content-Type': 'text/html; charset=UTF-8',
    'Cache-Control': 'no-store',
    ...corsHeaders()
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
