addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_ITEM_LENGTH = 240;
const MAX_ITEMS = 200;
const STORAGE_PREFIX = 'checklist:';
const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KEY_ADJECTIVES = ['amber', 'bright', 'calm', 'clever', 'fresh', 'golden', 'lively', 'maple', 'neat', 'rapid', 'silver', 'steady'];
const KEY_NOUNS = ['anchor', 'breeze', 'check', 'compass', 'harbor', 'lantern', 'meadow', 'orbit', 'path', 'ridge', 'signal', 'trail'];

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (path === '/' && request.method === 'GET') {
    return serveAppPage(request);
  }

  const sharedMatch = path.match(/^\/c\/([a-z0-9-]+)$/);
  if (sharedMatch && request.method === 'GET') {
    return serveSharedChecklistPage(request, sharedMatch[1]);
  }

  if (path === '/api/checklists' && request.method === 'POST') {
    return handleCreateChecklist(request);
  }

  const apiMatch = path.match(/^\/api\/checklists\/([a-z0-9-]+)$/);
  if (apiMatch && request.method === 'GET') {
    return handleGetChecklist(request, apiMatch[1]);
  }
  if (apiMatch && request.method === 'POST') {
    return handleUpdateChecklist(request, apiMatch[1]);
  }

  if (path === '/health' && request.method === 'GET') {
    return jsonResponse({ ok: true, storageReady: Boolean(getDataNamespace()) }, 200);
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function serveAppPage(request) {
  if (!getDataNamespace()) {
    return configurationError('The DATA KV binding is required for this template. Bind your KV namespace as DATA and redeploy.', 'Checklist Maker');
  }
  return new Response(renderAppHtml({
    request,
    checklist: null,
    shareUrl: '',
    notice: '',
    status: 200
  }), { status: 200, headers: htmlHeaders() });
}

async function serveSharedChecklistPage(request, key) {
  if (!isValidKey(key)) {
    return new Response('Checklist not found', { status: 404, headers: textHeaders() });
  }
  if (!getDataNamespace()) {
    return configurationError('The DATA KV binding is required for this template. Bind your KV namespace as DATA and redeploy.', 'Checklist Maker');
  }

  const checklist = await loadChecklist(key);
  const status = checklist ? 200 : 404;
  const notice = checklist ? '' : `We couldn't find a checklist for “${key}”. Create a new one below.`;

  return new Response(renderAppHtml({
    request,
    checklist,
    shareUrl: checklist ? absoluteUrl(request, `/c/${key}`) : '',
    notice,
    status
  }), { status, headers: htmlHeaders() });
}

async function handleCreateChecklist(request) {
  const kv = getDataNamespace();
  if (!kv) return storageRequiredResponse();

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  try {
    const title = normalizeTitle(payload?.title);
    const description = normalizeDescription(payload?.description);
    const items = sanitizeItems(payload?.items);
    const key = await allocateChecklistKey(title, kv);
    const now = new Date().toISOString();
    const checklist = {
      version: 1,
      key,
      title,
      description,
      createdAt: now,
      updatedAt: now,
      items
    };

    await saveChecklist(kv, checklist);
    return jsonResponse({
      ok: true,
      checklist,
      shareUrl: absoluteUrl(request, `/c/${key}`)
    }, 201);
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Unable to create checklist.' }, 400);
  }
}

async function handleGetChecklist(request, key) {
  if (!isValidKey(key)) {
    return jsonResponse({ error: 'Invalid checklist key.' }, 400);
  }
  const kv = getDataNamespace();
  if (!kv) return storageRequiredResponse();

  const checklist = await loadChecklist(key);
  if (!checklist) {
    return jsonResponse({ error: 'Checklist not found.' }, 404);
  }

  return jsonResponse({
    ok: true,
    checklist,
    shareUrl: absoluteUrl(request, `/c/${key}`)
  }, 200);
}

async function handleUpdateChecklist(request, key) {
  if (!isValidKey(key)) {
    return jsonResponse({ error: 'Invalid checklist key.' }, 400);
  }
  const kv = getDataNamespace();
  if (!kv) return storageRequiredResponse();

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const checklist = await loadChecklist(key);
  if (!checklist) {
    return jsonResponse({ error: 'Checklist not found.' }, 404);
  }

  try {
    const action = String(payload?.action || 'replace').trim();
    const now = new Date().toISOString();

    switch (action) {
      case 'details':
        checklist.title = normalizeTitle(payload?.title, checklist.title);
        checklist.description = normalizeDescription(payload?.description);
        break;
      case 'addItem': {
        if (checklist.items.length >= MAX_ITEMS) {
          return jsonResponse({ error: `Checklists are limited to ${MAX_ITEMS} items.` }, 400);
        }
        const text = normalizeItemText(payload?.text);
        if (!text) {
          return jsonResponse({ error: 'Item text is required.' }, 400);
        }
        checklist.items.push({
          id: crypto.randomUUID(),
          text,
          checked: false,
          updatedAt: now
        });
        break;
      }
      case 'updateItem': {
        const item = findChecklistItem(checklist, payload?.itemId);
        if (!item) return jsonResponse({ error: 'Checklist item not found.' }, 404);
        const text = normalizeItemText(payload?.text);
        if (!text) {
          return jsonResponse({ error: 'Item text is required.' }, 400);
        }
        item.text = text;
        item.updatedAt = now;
        break;
      }
      case 'toggleItem': {
        const item = findChecklistItem(checklist, payload?.itemId);
        if (!item) return jsonResponse({ error: 'Checklist item not found.' }, 404);
        item.checked = Boolean(payload?.checked);
        item.updatedAt = now;
        break;
      }
      case 'deleteItem': {
        const originalLength = checklist.items.length;
        checklist.items = checklist.items.filter(item => item.id !== String(payload?.itemId || ''));
        if (checklist.items.length === originalLength) {
          return jsonResponse({ error: 'Checklist item not found.' }, 404);
        }
        break;
      }
      case 'clearCompleted':
        checklist.items = checklist.items.filter(item => !item.checked);
        break;
      case 'replace':
        checklist.title = normalizeTitle(payload?.title, checklist.title);
        checklist.description = normalizeDescription(payload?.description);
        checklist.items = sanitizeItems(payload?.items);
        break;
      default:
        return jsonResponse({ error: 'Unsupported action.' }, 400);
    }

    checklist.updatedAt = now;
    await saveChecklist(kv, checklist);

    return jsonResponse({
      ok: true,
      checklist,
      shareUrl: absoluteUrl(request, `/c/${key}`)
    }, 200);
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Unable to update checklist.' }, 400);
  }
}

function renderAppHtml({ request, checklist, shareUrl, notice, status }) {
  const title = checklist ? `${escapeHtml(checklist.title)} · Checklist Maker` : 'Checklist Maker';
  const payload = serializeForScript(checklist);
  const escapedShareUrl = escapeHtml(shareUrl || '');
  const escapedNotice = escapeHtml(notice || '');
  const homeUrl = escapeHtml(absoluteUrl(request, '/'));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    :root {
      color-scheme: light;
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #dbe3ef;
      --text: #0f172a;
      --muted: #475569;
      --brand: #2563eb;
      --brand-2: #7c3aed;
      --good: #047857;
      --danger: #b91c1c;
      --shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
    }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(37,99,235,.12), transparent 34%),
        radial-gradient(circle at top right, rgba(124,58,237,.12), transparent 28%),
        var(--bg);
    }
    .page { max-width: 1120px; margin: 0 auto; padding: 40px 18px 60px; }
    .hero {
      display: grid;
      gap: 14px;
      padding: 30px;
      border-radius: 28px;
      background: linear-gradient(135deg, rgba(37,99,235,.98), rgba(124,58,237,.96));
      color: white;
      box-shadow: var(--shadow);
    }
    .eyebrow {
      width: fit-content;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.16);
      font-size: 13px;
      letter-spacing: .04em;
      text-transform: uppercase;
      font-weight: 700;
    }
    h1 { margin: 0; font-size: clamp(2rem, 3vw, 3.25rem); line-height: 1.02; }
    .hero p { margin: 0; max-width: 760px; line-height: 1.7; color: rgba(255,255,255,.88); }
    .notice, .status {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    .notice { background: #fff7ed; color: #9a3412; border: 1px solid #fdba74; }
    .status { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; display: none; }
    .status.error { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
      gap: 22px;
      margin-top: 22px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 26px;
      padding: 24px;
      box-shadow: var(--shadow);
    }
    .card h2 { margin: 0 0 6px; font-size: 1.2rem; }
    .card p.help { margin: 0 0 20px; color: var(--muted); line-height: 1.6; }
    label {
      display: block;
      margin-top: 16px;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 700;
      color: var(--muted);
    }
    input[type="text"], textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      color: var(--text);
      background: #fff;
      resize: vertical;
    }
    input[type="text"]:focus, textarea:focus {
      outline: none;
      border-color: #93c5fd;
      box-shadow: 0 0 0 4px rgba(37,99,235,.12);
    }
    textarea { min-height: 120px; }
    .toolbar, .share-panel, .summary-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .toolbar { margin-top: 18px; }
    .share-panel {
      display: none;
      margin-top: 18px;
      padding: 16px;
      border-radius: 18px;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
    }
    .share-url {
      display: block;
      width: 100%;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      color: #1d4ed8;
      word-break: break-all;
    }
    .button-row { display: flex; gap: 10px; flex-wrap: wrap; }
    button {
      border: none;
      border-radius: 14px;
      padding: 12px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform .12s ease, opacity .12s ease, background .12s ease;
    }
    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: .55; cursor: wait; transform: none; }
    .primary { background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: white; }
    .secondary { background: #e2e8f0; color: var(--text); }
    .danger { background: #fee2e2; color: var(--danger); }
    .summary-bar {
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 18px;
      color: var(--muted);
      font-size: 14px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 12px;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
    }
    .empty {
      padding: 28px 18px;
      border: 1px dashed var(--border);
      border-radius: 20px;
      text-align: center;
      color: var(--muted);
      line-height: 1.7;
    }
    ul.checklist {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 12px;
    }
    .item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: #fff;
    }
    .item input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-top: 10px;
      accent-color: var(--brand);
    }
    .item input[type="text"] {
      border-radius: 14px;
      padding: 12px 14px;
      min-width: 0;
    }
    .item.done {
      background: #f8fafc;
      border-color: #d1fae5;
    }
    .item.done input[type="text"] {
      color: #64748b;
      text-decoration: line-through;
    }
    .inline-actions { display: flex; gap: 8px; }
    .inline-actions button { padding: 10px 12px; }
    .add-form {
      display: none;
      gap: 12px;
      margin-top: 18px;
    }
    .add-form.active {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
    .meta {
      display: grid;
      gap: 6px;
      margin-top: 18px;
      color: var(--muted);
      font-size: 13px;
    }
    .footer {
      margin-top: 18px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.6;
    }
    a.inline-link { color: #1d4ed8; text-decoration: none; font-weight: 700; }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
      .add-form.active { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="eyebrow">Stateful checklist worker</div>
      <h1>Create it once, share one live checklist URL.</h1>
      <p>Build a checklist, send the link, and let the latest item state live in Cloudflare KV. Open the shared URL anytime to view and update the same checklist.</p>
    </section>

    ${escapedNotice ? `<div class="notice">${escapedNotice}</div>` : ''}
    <div id="statusMessage" class="status" role="status" aria-live="polite"></div>

    <section class="grid">
      <div class="card">
        <h2>Checklist details</h2>
        <p class="help">Create a checklist from scratch or update the title and notes for an existing shared list.</p>

        <label for="titleInput">Title</label>
        <input id="titleInput" type="text" maxlength="${MAX_TITLE_LENGTH}" placeholder="Weekend trip packing list">

        <label for="descriptionInput">Notes or description</label>
        <textarea id="descriptionInput" maxlength="${MAX_DESCRIPTION_LENGTH}" placeholder="Optional instructions, deadlines, or context."></textarea>

        <div id="createFields">
          <label for="seedItemsInput">Starter items</label>
          <textarea id="seedItemsInput" placeholder="One item per line&#10;Book hotel&#10;Pack chargers&#10;Share itinerary"></textarea>
          <div class="toolbar">
            <button id="createButton" class="primary" type="button">Create checklist</button>
          </div>
        </div>

        <div id="editToolbar" class="toolbar" style="display:none;">
          <div class="button-row">
            <button id="saveDetailsButton" class="primary" type="button">Save details</button>
            <button id="clearCompletedButton" class="secondary" type="button">Clear completed</button>
          </div>
        </div>

        <div id="sharePanel" class="share-panel">
          <div>
            <strong>Share this checklist</strong>
            <span id="shareUrlText" class="share-url">${escapedShareUrl}</span>
          </div>
          <div class="button-row">
            <button id="copyShareButton" class="secondary" type="button">Copy link</button>
            <button id="openShareButton" class="primary" type="button">Open shared view</button>
          </div>
        </div>

        <div class="meta">
          <div><strong>Home:</strong> <a class="inline-link" href="${homeUrl}">${homeUrl}</a></div>
          <div><strong>Storage:</strong> DATA KV binding</div>
        </div>
      </div>

      <div class="card">
        <div class="summary-bar">
          <div class="pill" id="progressPill">No checklist yet</div>
          <div id="updatedAtText">Create a checklist to get a shareable URL.</div>
        </div>

        <div id="emptyState" class="empty">
          Add starter items on the left, then create your checklist. Once saved, everyone with the shared URL sees the same live checklist state.
        </div>

        <ul id="itemList" class="checklist" aria-live="polite"></ul>

        <form id="addItemForm" class="add-form">
          <input id="newItemInput" type="text" maxlength="${MAX_ITEM_LENGTH}" placeholder="Add a new checklist item">
          <button id="addItemButton" class="primary" type="submit">Add item</button>
        </form>

        <div class="footer">
          Shared URLs are readable and persistent. Anyone with the checklist URL can mark items complete and keep the latest state in sync.
        </div>
      </div>
    </section>
  </main>

  <script>
    const INITIAL_CHECKLIST = ${payload};
    const INITIAL_SHARE_URL = ${JSON.stringify(shareUrl || '').replace(/</g, '\\u003c')};
    const INITIAL_STATUS = ${status};

    const state = {
      checklist: INITIAL_CHECKLIST,
      shareUrl: INITIAL_SHARE_URL,
      busy: false
    };

    const elements = {
      titleInput: document.getElementById('titleInput'),
      descriptionInput: document.getElementById('descriptionInput'),
      seedItemsInput: document.getElementById('seedItemsInput'),
      createFields: document.getElementById('createFields'),
      editToolbar: document.getElementById('editToolbar'),
      createButton: document.getElementById('createButton'),
      saveDetailsButton: document.getElementById('saveDetailsButton'),
      clearCompletedButton: document.getElementById('clearCompletedButton'),
      sharePanel: document.getElementById('sharePanel'),
      shareUrlText: document.getElementById('shareUrlText'),
      copyShareButton: document.getElementById('copyShareButton'),
      openShareButton: document.getElementById('openShareButton'),
      progressPill: document.getElementById('progressPill'),
      updatedAtText: document.getElementById('updatedAtText'),
      emptyState: document.getElementById('emptyState'),
      itemList: document.getElementById('itemList'),
      addItemForm: document.getElementById('addItemForm'),
      newItemInput: document.getElementById('newItemInput'),
      addItemButton: document.getElementById('addItemButton'),
      statusMessage: document.getElementById('statusMessage')
    };

    function setBusy(value) {
      state.busy = value;
      elements.titleInput.disabled = value;
      elements.descriptionInput.disabled = value;
      elements.seedItemsInput.disabled = value;
      elements.newItemInput.disabled = value;
      elements.createButton.disabled = value;
      elements.saveDetailsButton.disabled = value;
      elements.clearCompletedButton.disabled = value;
      elements.copyShareButton.disabled = value;
      elements.openShareButton.disabled = value;
      elements.addItemButton.disabled = value;
      document.querySelectorAll('.item input[type="checkbox"], .item input[type="text"], .item button').forEach(node => {
        node.disabled = value;
      });
    }

    function showStatus(message, isError = false) {
      if (!message) {
        elements.statusMessage.style.display = 'none';
        elements.statusMessage.textContent = '';
        elements.statusMessage.classList.remove('error');
        return;
      }
      elements.statusMessage.textContent = message;
      elements.statusMessage.style.display = 'block';
      elements.statusMessage.classList.toggle('error', isError);
    }

    function relativeSharePath() {
      return state.checklist ? '/c/' + encodeURIComponent(state.checklist.key) : '/';
    }

    function applyChecklist(checklist, shareUrl) {
      state.checklist = checklist;
      state.shareUrl = shareUrl || (checklist ? window.location.origin + '/c/' + checklist.key : '');
      if (state.checklist) {
        elements.titleInput.value = state.checklist.title || '';
        elements.descriptionInput.value = state.checklist.description || '';
        elements.shareUrlText.textContent = state.shareUrl;
        elements.sharePanel.style.display = 'flex';
        elements.editToolbar.style.display = 'flex';
        elements.createFields.style.display = 'none';
        elements.addItemForm.classList.add('active');
        window.history.replaceState({}, '', relativeSharePath());
      } else {
        elements.shareUrlText.textContent = '';
        elements.sharePanel.style.display = 'none';
        elements.editToolbar.style.display = 'none';
        elements.createFields.style.display = 'block';
        elements.addItemForm.classList.remove('active');
      }
      renderChecklist();
    }

    function renderChecklist() {
      const checklist = state.checklist;
      const hasChecklist = Boolean(checklist);

      if (!hasChecklist) {
        elements.progressPill.textContent = 'No checklist yet';
        elements.updatedAtText.textContent = INITIAL_STATUS === 404 ? 'This share URL is missing. Create a new checklist instead.' : 'Create a checklist to get a shareable URL.';
        elements.emptyState.style.display = 'block';
        elements.itemList.innerHTML = '';
        elements.addItemForm.classList.remove('active');
        return;
      }

      const total = checklist.items.length;
      const completed = checklist.items.filter(item => item.checked).length;
      elements.progressPill.textContent = total ? completed + ' of ' + total + ' done' : '0 items';
      elements.updatedAtText.textContent = 'Updated ' + formatTimestamp(checklist.updatedAt);
      elements.emptyState.style.display = total ? 'none' : 'block';
      elements.emptyState.textContent = 'This checklist is empty. Add the first item below.';
      elements.shareUrlText.textContent = state.shareUrl;
      elements.sharePanel.style.display = 'flex';
      elements.editToolbar.style.display = 'flex';
      elements.createFields.style.display = 'none';
      elements.addItemForm.classList.add('active');

      elements.itemList.innerHTML = checklist.items.map(item => {
        const safeText = escapeHtml(item.text || '');
        const itemId = encodeURIComponent(item.id);
        return '<li class="item' + (item.checked ? ' done' : '') + '" data-item-id="' + itemId + '">' +
          '<input type="checkbox" ' + (item.checked ? 'checked' : '') + ' aria-label="Toggle item">' +
          '<input type="text" maxlength="${MAX_ITEM_LENGTH}" value="' + safeText + '" aria-label="Checklist item">' +
          '<div class="inline-actions"><button class="danger" type="button">Delete</button></div>' +
        '</li>';
      }).join('');

      wireChecklistItemEvents();
    }

    function wireChecklistItemEvents() {
      elements.itemList.querySelectorAll('.item').forEach(itemNode => {
        const itemId = decodeURIComponent(itemNode.dataset.itemId || '');
        const checkbox = itemNode.querySelector('input[type="checkbox"]');
        const textInput = itemNode.querySelector('input[type="text"]');
        const deleteButton = itemNode.querySelector('button');

        checkbox.addEventListener('change', async () => {
          await updateChecklist({ action: 'toggleItem', itemId, checked: checkbox.checked }, checkbox.checked ? 'Item completed.' : 'Item marked incomplete.');
        });

        textInput.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            textInput.blur();
          }
        });

        textInput.addEventListener('blur', async () => {
          const sourceItem = (state.checklist?.items || []).find(entry => entry.id === itemId);
          const nextValue = textInput.value.trim();
          if (!sourceItem || nextValue === sourceItem.text) return;
          if (!nextValue) {
            textInput.value = sourceItem.text;
            showStatus('Checklist items cannot be blank.', true);
            return;
          }
          await updateChecklist({ action: 'updateItem', itemId, text: nextValue }, 'Item updated.');
        });

        deleteButton.addEventListener('click', async () => {
          await updateChecklist({ action: 'deleteItem', itemId }, 'Item removed.');
        });
      });
    }

    async function createChecklist() {
      const lines = elements.seedItemsInput.value.split(/\\r?\\n/).map(line => line.trim()).filter(Boolean);
      const payload = {
        title: elements.titleInput.value,
        description: elements.descriptionInput.value,
        items: lines.map(text => ({ text, checked: false }))
      };

      setBusy(true);
      showStatus('Creating checklist...');
      try {
        const response = await fetch('/api/checklists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to create checklist.');
        elements.seedItemsInput.value = '';
        applyChecklist(data.checklist, data.shareUrl);
        showStatus('Checklist created. Share the link to collaborate.');
      } catch (error) {
        showStatus(error.message || 'Unable to create checklist.', true);
      } finally {
        setBusy(false);
      }
    }

    async function updateChecklist(payload, successMessage) {
      if (!state.checklist) return;
      setBusy(true);
      showStatus('Saving changes...');
      try {
        const response = await fetch('/api/checklists/' + encodeURIComponent(state.checklist.key), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to save checklist.');
        applyChecklist(data.checklist, data.shareUrl);
        showStatus(successMessage);
      } catch (error) {
        showStatus(error.message || 'Unable to save checklist.', true);
      } finally {
        setBusy(false);
      }
    }

    async function copyShareUrl() {
      if (!state.shareUrl) return;
      try {
        await navigator.clipboard.writeText(state.shareUrl);
        showStatus('Share URL copied to the clipboard.');
      } catch {
        showStatus('Clipboard access failed. Copy the link manually.', true);
      }
    }

    function formatTimestamp(value) {
      if (!value) return 'just now';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'just now';
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    elements.createButton.addEventListener('click', createChecklist);
    elements.saveDetailsButton.addEventListener('click', async () => {
      await updateChecklist({
        action: 'details',
        title: elements.titleInput.value,
        description: elements.descriptionInput.value
      }, 'Checklist details saved.');
    });
    elements.clearCompletedButton.addEventListener('click', async () => {
      await updateChecklist({ action: 'clearCompleted' }, 'Completed items cleared.');
    });
    elements.copyShareButton.addEventListener('click', copyShareUrl);
    elements.openShareButton.addEventListener('click', () => {
      if (state.shareUrl) window.open(state.shareUrl, '_blank', 'noopener');
    });
    elements.addItemForm.addEventListener('submit', async event => {
      event.preventDefault();
      const text = elements.newItemInput.value.trim();
      if (!text) {
        showStatus('Enter an item before adding it.', true);
        return;
      }
      await updateChecklist({ action: 'addItem', text }, 'Item added.');
      elements.newItemInput.value = '';
      elements.newItemInput.focus();
    });

    applyChecklist(state.checklist, state.shareUrl);
  </script>
</body>
</html>`;
}

async function allocateChecklistKey(title, kv) {
  const base = slugify(title).slice(0, 32) || 'checklist';

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = normalizeGeneratedKey([base, randomListItem(KEY_ADJECTIVES), randomListItem(KEY_NOUNS), randomDigits(2)].join('-'));
    if (!candidate) continue;
    const existing = await kv.get(storageKey(candidate));
    if (!existing) return candidate;
  }

  return normalizeGeneratedKey(`${base}-${crypto.randomUUID().slice(0, 8)}`);
}

async function loadChecklist(key) {
  const kv = getDataNamespace();
  if (!kv) return null;

  const raw = await kv.get(storageKey(key));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return normalizeStoredChecklist(key, parsed);
  } catch {
    return null;
  }
}

async function saveChecklist(kv, checklist) {
  await kv.put(storageKey(checklist.key), JSON.stringify(checklist));
}

function normalizeStoredChecklist(key, value) {
  const createdAt = typeof value?.createdAt === 'string' ? value.createdAt : new Date().toISOString();
  const updatedAt = typeof value?.updatedAt === 'string' ? value.updatedAt : createdAt;

  return {
    version: 1,
    key,
    title: normalizeTitle(value?.title),
    description: normalizeDescription(value?.description),
    createdAt,
    updatedAt,
    items: sanitizeItems(value?.items)
  };
}

function sanitizeItems(input) {
  const source = Array.isArray(input) ? input : [];
  const items = [];

  for (const rawItem of source.slice(0, MAX_ITEMS)) {
    const text = normalizeItemText(typeof rawItem === 'string' ? rawItem : rawItem?.text);
    if (!text) continue;
    items.push({
      id: isValidItemId(rawItem?.id) ? rawItem.id : crypto.randomUUID(),
      text,
      checked: Boolean(typeof rawItem === 'string' ? false : rawItem?.checked),
      updatedAt: typeof rawItem?.updatedAt === 'string' ? rawItem.updatedAt : new Date().toISOString()
    });
  }

  return items;
}

function normalizeTitle(value, fallback = 'Untitled checklist') {
  const cleaned = String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE_LENGTH);
  return cleaned || fallback;
}

function normalizeDescription(value) {
  return String(value == null ? '' : value)
    .replace(/\r/g, '')
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH);
}

function normalizeItemText(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ITEM_LENGTH);
}

function findChecklistItem(checklist, itemId) {
  return checklist.items.find(item => item.id === String(itemId || '')) || null;
}

function storageKey(key) {
  return `${STORAGE_PREFIX}${key}`;
}

function getDataNamespace() {
  return getNamespaceBinding('DATA');
}

function getNamespaceBinding(name) {
  return typeof globalThis[name] === 'undefined' ? null : globalThis[name];
}

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeGeneratedKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function isValidKey(value) {
  return KEY_PATTERN.test(String(value || '')) && String(value).length <= 64;
}

function isValidItemId(value) {
  return /^[a-z0-9-]{6,}$/.test(String(value || ''));
}

function randomListItem(items) {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0];
  return items[randomValue % items.length];
}

function randomDigits(length) {
  const digits = [];
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  for (const value of randomValues) digits.push(String(value % 10));
  return digits.join('');
}

function absoluteUrl(request, path) {
  const url = new URL(request.url);
  return `${url.origin}${path}`;
}

function serializeForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function configurationError(message, title) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title><style>body{font-family:Inter,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;padding:24px}.card{max-width:640px;margin:48px auto;background:#fff;border-radius:24px;padding:32px;box-shadow:0 20px 50px rgba(15,23,42,.08)}.banner{margin-top:14px;padding:14px 16px;border-radius:16px;background:#fee2e2;color:#991b1b}</style></head><body><div class="card"><h1>${escapeHtml(title)}</h1><div class="banner">${escapeHtml(message)}</div></div></body></html>`;
  return new Response(html, { status: 503, headers: htmlHeaders() });
}

function storageRequiredResponse() {
  return jsonResponse({ error: 'The DATA KV binding is required for this template.' }, 503);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
