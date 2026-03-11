addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() } });
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
  frame.style.cssText = 'width:100%;min-height:620px;border:none;border-radius:16px;display:block';
  frame.title = 'Timeline';
  (s && s.parentNode ? s.parentNode : document.body).insertBefore(frame, s || null);
})();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Timeline Builder Embed</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1160px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; max-width: 760px; color: #475569; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input, textarea { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  textarea { min-height: 320px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  pre.output { margin: 0; padding: 16px; background: #0f172a; color: #e2e8f0; border-radius: 14px; white-space: pre-wrap; overflow: auto; }
  .preview { width: 100%; min-height: 640px; border: 1px solid #cbd5e1; border-radius: 16px; background: white; }
  .hidden { display: none !important; }
  .timeline { position: relative; max-width: 860px; margin: 0 auto; padding: 16px 0 16px 28px; }
  .timeline::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 4px; border-radius: 999px; background: var(--accent, #2563eb); }
  .event { position: relative; margin-bottom: 18px; padding: 16px 18px; border: 1px solid #dbe3f0; border-radius: 16px; background: white; box-shadow: 0 14px 30px rgba(15,23,42,.08); }
  .event::before { content: ''; position: absolute; left: -25px; top: 22px; width: 18px; height: 18px; border-radius: 999px; background: var(--accent, #2563eb); border: 4px solid #ffffff; box-shadow: 0 0 0 2px rgba(37,99,235,.2); }
  .date { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #2563eb; }
  .title { margin: 6px 0 8px; font-size: 1.1rem; font-weight: 800; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 8px; }
  .desc { color: #334155; line-height: 1.6; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page" id="builderPage">
  <div class="hero">
    <h1>Timeline Builder Embed</h1>
    <p>Build a vertical timeline from JSON event data and generate a script tag you can embed in docs, release pages, retrospectives, or project hubs.</p>
  </div>
  <div class="grid">
    <div class="card">
      <div class="row">
        <div>
          <label for="title">Timeline title</label>
          <input id="title" value="Product milestones">
        </div>
        <div>
          <label for="accent">Accent color</label>
          <input id="accent" type="color" value="#2563eb">
        </div>
      </div>
      <div style="margin-top:14px;">
        <label for="events">Events JSON</label>
        <textarea id="events"></textarea>
      </div>
      <div class="actions">
        <button class="primary" id="generateBtn" type="button">Generate embed code</button>
        <button class="secondary" id="copyBtn" type="button">Copy code</button>
      </div>
    </div>
    <div style="display:grid;gap:14px;">
      <div class="card">
        <label>Embed snippet</label>
        <pre class="output" id="output"></pre>
      </div>
      <div class="card">
        <label>Live preview</label>
        <iframe id="preview" class="preview" title="Timeline preview"></iframe>
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
    title: 'Product milestones',
    accent: '#2563eb',
    events: [
      { date: '2026-01-10', title: 'Discovery interviews', tag: 'Research', description: 'Interviewed ten customers to validate the problem space.' },
      { date: '2026-02-03', title: 'Prototype review', tag: 'Design', description: 'Validated the interaction model with internal stakeholders.' },
      { date: '2026-03-15', title: 'Beta release', tag: 'Launch', description: 'Invited pilot customers and collected onboarding feedback.' }
    ]
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readConfig() {
    if (!params.get('config')) return JSON.parse(JSON.stringify(defaults));
    try { return Object.assign({}, defaults, JSON.parse(params.get('config')) || {}); }
    catch (error) { return JSON.parse(JSON.stringify(defaults)); }
  }

  function renderTimeline(cfg, target) {
    const events = (cfg.events || []).slice().sort(function(a, b) { return String(a.date).localeCompare(String(b.date)); });
    target.innerHTML = '<div class="timeline" style="--accent:' + escapeHtml(cfg.accent) + '"><h2 style="margin:0 0 20px 0;font-size:1.6rem;">' + escapeHtml(cfg.title) + '</h2>' + events.map(function(event) {
      return '<article class="event"><div class="date">' + escapeHtml(event.date) + '</div><div class="title">' + escapeHtml(event.title) + '</div><div class="meta">' + escapeHtml(event.tag || '') + '</div><div class="desc">' + escapeHtml(event.description || '') + '</div></article>';
    }).join('') + '</div>';
  }

  if (isEmbed) {
    document.body.style.background = 'transparent';
    document.body.style.padding = '16px';
    document.getElementById('builderPage').remove();
    const mount = document.getElementById('embedMount');
    mount.classList.remove('hidden');
    renderTimeline(readConfig(), mount);
    return;
  }

  document.getElementById('events').value = JSON.stringify(defaults.events, null, 2);

  function currentConfig() {
    let events = defaults.events;
    try { events = JSON.parse(document.getElementById('events').value); } catch (error) {}
    return {
      title: document.getElementById('title').value.trim() || defaults.title,
      accent: document.getElementById('accent').value,
      events: events
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
    if (navigator.clipboard && text) navigator.clipboard.writeText(text);
  });
  ['title', 'accent', 'events'].forEach(function(id) { document.getElementById(id).addEventListener('input', update); });
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
