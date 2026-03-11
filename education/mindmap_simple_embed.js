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
  frame.title = 'Mindmap';
  (s && s.parentNode ? s.parentNode : document.body).insertBefore(frame, s || null);
})();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mindmap Simple Embed</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1180px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; color: #475569; max-width: 760px; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; align-items: start; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  .stack { display: grid; gap: 14px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input, textarea { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  textarea { min-height: 320px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  pre.output { margin: 0; padding: 16px; background: #0f172a; color: #e2e8f0; border-radius: 14px; white-space: pre-wrap; overflow: auto; }
  .preview { width: 100%; min-height: 640px; border: 1px solid #cbd5e1; border-radius: 16px; background: white; }
  .hidden { display: none !important; }
  .hint { color: #64748b; line-height: 1.6; font-size: 0.94rem; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page" id="builderPage">
  <div class="hero">
    <h1>Mindmap Simple Embed</h1>
    <p>Paste an indented outline and generate an embeddable SVG mindmap. Great for meeting notes, lesson plans, content briefs, and product thinking.</p>
  </div>
  <div class="grid">
    <div class="card stack">
      <div>
        <label for="title">Map title</label>
        <input id="title" value="Launch plan">
      </div>
      <div>
        <label for="accent">Accent color</label>
        <input id="accent" type="color" value="#2563eb">
      </div>
      <div>
        <label for="outline">Indented outline</label>
        <textarea id="outline"></textarea>
      </div>
      <div class="hint">Use two spaces per level. The first line becomes the root node.</div>
      <div class="actions">
        <button class="primary" id="generateBtn" type="button">Generate embed code</button>
        <button class="secondary" id="copyBtn" type="button">Copy code</button>
      </div>
    </div>
    <div class="stack">
      <div class="card">
        <label>Embed snippet</label>
        <pre class="output" id="output"></pre>
      </div>
      <div class="card">
        <label>Live preview</label>
        <iframe id="preview" class="preview" title="Mindmap preview"></iframe>
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
    title: 'Launch plan',
    accent: '#2563eb',
    outline: [
      'Launch plan',
      '  Messaging',
      '    Positioning',
      '    Release notes',
      '  Activation',
      '    Email campaign',
      '    Webinar',
      '  Measurement',
      '    Signups',
      '    Retention'
    ].join('\\n')
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readConfig() {
    if (!params.get('config')) return { ...defaults };
    try { return Object.assign({}, defaults, JSON.parse(params.get('config')) || {}); }
    catch (error) { return { ...defaults }; }
  }

  function parseOutline(text) {
    const lines = text.split(/\\r?\\n/).filter(function(line) { return line.trim(); });
    if (!lines.length) throw new Error('Add at least one outline line.');
    const root = { label: lines[0].trim(), children: [] };
    const stack = [{ level: -1, node: root }];
    lines.slice(1).forEach(function(line) {
      const indent = line.match(/^\\s*/)[0].replace(/\\t/g, '  ').length;
      const level = Math.floor(indent / 2);
      const node = { label: line.trim(), children: [] };
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack[stack.length - 1].node.children.push(node);
      stack.push({ level, node });
    });
    return root;
  }

  function measure(node) {
    if (!node.children.length) return 1;
    node.branchHeight = node.children.reduce(function(sum, child) { return sum + measure(child); }, 0);
    return node.branchHeight;
  }

  function layout(node, depth, yStart, positions) {
    const boxWidth = Math.min(220, Math.max(120, node.label.length * 8 + 40));
    const heightUnits = node.children.length ? node.children.reduce(function(sum, child) { return sum + (child.branchHeight || 1); }, 0) : 1;
    const centerY = yStart + heightUnits * 56 / 2;
    positions.push({ node, depth, x: 40 + depth * 240, y: centerY, width: boxWidth });
    let cursor = yStart;
    node.children.forEach(function(child) {
      const childHeight = (child.branchHeight || 1) * 56;
      layout(child, depth + 1, cursor, positions);
      cursor += childHeight;
    });
  }

  function renderMap(cfg) {
    const root = parseOutline(cfg.outline);
    measure(root);
    const positions = [];
    layout(root, 0, 30, positions);
    const byLabel = {};
    positions.forEach(function(item) { byLabel[item.node.label + '|' + item.depth] = item; });
    const height = Math.max(360, positions.reduce(function(max, item) { return Math.max(max, item.y + 80); }, 0));
    const width = Math.max(720, positions.reduce(function(max, item) { return Math.max(max, item.x + item.width + 80); }, 0));
    const edges = positions.map(function(item) {
      return item.node.children.map(function(child) {
        const target = positions.find(function(entry) { return entry.node === child; });
        const x1 = item.x + item.width;
        const y1 = item.y;
        const x2 = target.x;
        const y2 = target.y;
        const midX = x1 + (x2 - x1) / 2;
        return '<path d="M ' + x1 + ' ' + y1 + ' C ' + midX + ' ' + y1 + ', ' + midX + ' ' + y2 + ', ' + x2 + ' ' + y2 + '" stroke="' + cfg.accent + '" stroke-width="2.5" fill="none"></path>';
      }).join('');
    }).join('');
    const nodes = positions.map(function(item, index) {
      return '<g><rect x="' + item.x + '" y="' + (item.y - 24) + '" width="' + item.width + '" height="48" rx="16" fill="#ffffff" stroke="' + (index === 0 ? cfg.accent : '#dbeafe') + '" stroke-width="' + (index === 0 ? '2.5' : '1.5') + '"></rect><text x="' + (item.x + 16) + '" y="' + (item.y + 5) + '" font-size="14" font-weight="700" fill="#0f172a">' + escapeHtml(item.node.label) + '</text></g>';
    }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="' + height + '"><rect width="' + width + '" height="' + height + '" fill="#f8fbff"></rect><text x="40" y="28" font-size="20" font-weight="800" fill="#0f172a">' + escapeHtml(cfg.title) + '</text>' + edges + nodes + '</svg>';
  }

  function renderEmbed(cfg) {
    const mount = document.getElementById('embedMount');
    mount.classList.remove('hidden');
    mount.innerHTML = '<div style="padding:16px">' + renderMap(cfg) + '</div>';
  }

  if (isEmbed) {
    document.body.style.background = 'transparent';
    document.getElementById('builderPage').remove();
    renderEmbed(readConfig());
    return;
  }

  document.getElementById('outline').value = defaults.outline;

  function currentConfig() {
    return {
      title: document.getElementById('title').value.trim() || defaults.title,
      accent: document.getElementById('accent').value,
      outline: document.getElementById('outline').value
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
  ['title', 'accent', 'outline'].forEach(function(id) { document.getElementById(id).addEventListener('input', update); });
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
