addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() } });
  }
  if (url.pathname === '/widget.js') return new Response(widgetJS(), { headers: jsHeaders() });
  return new Response(pageHTML(), { headers: htmlHeaders() });
}

function widgetJS() {
  return String.raw`(function(){
  var s = document.currentScript;
  var raw = (s && s.dataset && s.dataset.config) || '';
  var base = (s && s.src || '').replace(/\/widget\.js(?:\?.*)?$/, '');
  var frame = document.createElement('iframe');
  frame.src = base + '/?embed=1&config=' + raw;
  frame.loading = 'lazy';
  frame.style.cssText = 'width:100%;min-height:520px;border:none;border-radius:16px;display:block';
  frame.title = 'Keyboard shortcuts cheat sheet';
  (s && s.parentNode ? s.parentNode : document.body).insertBefore(frame, s || null);
})();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Embeddable Keyboard Shortcuts Cheat Sheet</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1160px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; color: #475569; max-width: 780px; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 420px 1fr; gap: 20px; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  .stack { display: grid; gap: 14px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input, textarea { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  textarea { min-height: 280px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  pre.output { margin: 0; padding: 16px; background: #0f172a; color: #e2e8f0; border-radius: 14px; white-space: pre-wrap; overflow: auto; }
  .preview { width: 100%; min-height: 530px; border: 1px solid #cbd5e1; border-radius: 16px; background: white; }
  .hint { color: #64748b; font-size: 0.92rem; line-height: 1.6; }
  .hidden { display: none !important; }
  .widget { border: 1px solid #dbe3f0; border-radius: 18px; overflow: hidden; background: white; box-shadow: 0 18px 40px rgba(15,23,42,.12); }
  .widget-head { padding: 18px; color: white; }
  .widget-title { font-size: 24px; font-weight: 800; margin: 6px 0 0; }
  .toolbar { padding: 16px; border-bottom: 1px solid #e2e8f0; }
  .toolbar input { border-radius: 12px; }
  .groups { padding: 18px; display: grid; gap: 16px; }
  .group-title { font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #475569; }
  .shortcut { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: start; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
  .shortcut-action { font-weight: 700; }
  .shortcut-note { font-size: 13px; color: #64748b; margin-top: 4px; }
  kbd { display: inline-block; padding: 8px 10px; border-radius: 10px; border: 1px solid #cbd5e1; background: white; font: 700 13px ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page" id="builderPage">
  <div class="hero">
    <h1>Embeddable Keyboard Shortcuts Cheat Sheet</h1>
    <p>Turn grouped JSON data into a searchable, browser-only cheat sheet for onboarding, docs, internal tools, or customer education pages.</p>
  </div>
  <div class="grid">
    <div class="card stack">
      <div>
        <label for="title">Widget title</label>
        <input id="title" value="Productivity shortcuts">
      </div>
      <div class="row">
        <div>
          <label for="platform">Platform label</label>
          <input id="platform" value="macOS + Windows">
        </div>
        <div>
          <label for="accent">Accent color</label>
          <input id="accent" type="color" value="#2563eb">
        </div>
      </div>
      <div>
        <label for="groups">Shortcut groups JSON</label>
        <textarea id="groups"></textarea>
      </div>
      <div class="hint">Each group should have a <code>title</code> and <code>items</code>. Items support <code>action</code>, <code>shortcut</code>, and <code>note</code>.</div>
      <div class="actions">
        <button class="primary" type="button" id="generateBtn">Generate embed code</button>
        <button class="secondary" type="button" id="copyBtn">Copy code</button>
      </div>
    </div>
    <div class="stack">
      <div class="card">
        <label>Embed snippet</label>
        <pre class="output" id="output"></pre>
      </div>
      <div class="card">
        <label>Live preview</label>
        <iframe id="preview" class="preview" title="Preview"></iframe>
      </div>
    </div>
  </div>
</div>
<div id="embedMount" class="hidden"></div>
<script>
(function() {
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get('embed') === '1';
  const defaults = {
    title: 'Productivity shortcuts',
    platform: 'macOS + Windows',
    accent: '#2563eb',
    groups: [
      {
        title: 'Navigation',
        items: [
          { action: 'Command palette', shortcut: '⌘ K / Ctrl K', note: 'Open global actions.' },
          { action: 'Quick open', shortcut: '⌘ P / Ctrl P', note: 'Jump to a file or resource.' }
        ]
      },
      {
        title: 'Editing',
        items: [
          { action: 'Rename symbol', shortcut: 'F2', note: 'Rename across the current project.' },
          { action: 'Duplicate line', shortcut: '⌥ Shift ↓ / Alt Shift ↓', note: 'Copy the current line below.' }
        ]
      }
    ]
  };

  function readConfig() {
    if (!params.get('config')) return JSON.parse(JSON.stringify(defaults));
    try {
      return Object.assign({}, defaults, JSON.parse(params.get('config')) || {});
    } catch (error) {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderWidget(target, cfg) {
    target.innerHTML = '';
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.innerHTML = '<div class="widget-head" style="background:linear-gradient(135deg,' + escapeHtml(cfg.accent) + ',#0f172a)"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85">Shortcut cheat sheet</div><div class="widget-title">' + escapeHtml(cfg.title) + '</div><div style="margin-top:6px;font-size:14px;opacity:.9">Optimized for ' + escapeHtml(cfg.platform) + '</div></div><div class="toolbar"><input id="filterInput" type="search" placeholder="Filter shortcuts…"></div><div class="groups" id="groupsHost"></div>';
    target.appendChild(widget);
    const filterInput = widget.querySelector('#filterInput');
    const groupsHost = widget.querySelector('#groupsHost');
    function draw() {
      const query = filterInput.value.trim().toLowerCase();
      const groups = (cfg.groups || []).map(function(group) {
        return {
          title: group.title,
          items: (group.items || []).filter(function(item) {
            if (!query) return true;
            return [group.title, item.action, item.shortcut, item.note].join(' ').toLowerCase().indexOf(query) >= 0;
          })
        };
      }).filter(function(group) { return group.items.length; });
      if (!groups.length) {
        groupsHost.innerHTML = '<div class="hint">No shortcuts match this filter.</div>';
        return;
      }
      groupsHost.innerHTML = groups.map(function(group) {
        return '<section style="display:grid;gap:10px"><div class="group-title">' + escapeHtml(group.title) + '</div>' + group.items.map(function(item) {
          return '<article class="shortcut"><div><div class="shortcut-action">' + escapeHtml(item.action) + '</div><div class="shortcut-note">' + escapeHtml(item.note || '') + '</div></div><kbd>' + escapeHtml(item.shortcut) + '</kbd></article>';
        }).join('') + '</section>';
      }).join('');
    }
    filterInput.addEventListener('input', draw);
    draw();
  }

  if (isEmbed) {
    document.body.style.background = 'transparent';
    document.body.style.padding = '16px';
    document.getElementById('builderPage').remove();
    const embedMount = document.getElementById('embedMount');
    embedMount.classList.remove('hidden');
    renderWidget(embedMount, readConfig());
    return;
  }

  document.getElementById('groups').value = JSON.stringify(defaults.groups, null, 2);

  function currentConfig() {
    let groups = defaults.groups;
    try { groups = JSON.parse(document.getElementById('groups').value); } catch (error) {}
    return {
      title: document.getElementById('title').value.trim() || defaults.title,
      platform: document.getElementById('platform').value.trim() || defaults.platform,
      accent: document.getElementById('accent').value,
      groups: groups
    };
  }

  function update() {
    const cfg = currentConfig();
    const encoded = encodeURIComponent(JSON.stringify(cfg));
    const snippet = '<script src="' + location.origin + '/widget.js" data-config="' + encoded + '"><\\/script>';
    document.getElementById('output').textContent = snippet;
    document.getElementById('preview').src = '/?embed=1&config=' + encoded;
  }

  document.getElementById('generateBtn').addEventListener('click', update);
  document.getElementById('copyBtn').addEventListener('click', function() {
    const text = document.getElementById('output').textContent;
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text).then(function() {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied';
        setTimeout(function() { btn.textContent = 'Copy code'; }, 1200);
      });
    }
  });
  ['title', 'platform', 'accent', 'groups'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', update);
  });
  update();
})();
</script>
</body>
</html>`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function htmlHeaders() { return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() }; }
function jsHeaders() { return { 'Content-Type': 'application/javascript; charset=utf-8', ...corsHeaders() }; }
