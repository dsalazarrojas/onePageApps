addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() } });
  if (url.pathname === '/widget.js') return new Response(widgetJS(), { headers: jsHeaders() });
  return new Response(pageHTML(), { headers: htmlHeaders() });
}

function widgetJS() {
  return `(function(){
    var s=document.currentScript;
    var base=(s&&s.src||'').replace(/\\/widget\\.js.*$/,'');
    var frame=document.createElement('iframe');
    frame.src=base+'/';
    frame.loading='lazy';
    frame.title='Concept Map Generator Lite';
    frame.style.cssText='width:' + ((s&&s.dataset.width)||'100%') + ';height:' + ((s&&s.dataset.height)||'760px') + ';border:0;border-radius:18px;overflow:hidden;background:#fff;';
    (s&&s.parentNode||document.body).insertBefore(frame, s ? s.nextSibling : null);
  })();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Concept Map Generator Lite</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1200px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; max-width: 780px; color: #475569; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  textarea { width: 100%; min-height: 320px; border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px; font: 14px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; resize: vertical; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  .hint { margin-top: 14px; color: #64748b; font-size: 0.94rem; line-height: 1.6; }
  .canvas { width: 100%; min-height: 620px; border: 1px solid #dbe3f0; border-radius: 16px; background: linear-gradient(180deg, #ffffff, #f8fbff); overflow: auto; }
  .error { display: none; margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: #fff1f2; border: 1px solid #fecdd3; color: #b42318; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page">
  <div class="hero">
    <h1>Concept Map Generator Lite</h1>
    <p>Write concept relationships in a compact edge-list format and instantly turn them into a clean SVG concept map. Great for lesson planning, brainstorming, and lightweight documentation diagrams.</p>
  </div>
  <div class="grid">
    <div class="card">
      <label for="input" style="display:block;font-weight:800;margin-bottom:10px;">Concept relationships</label>
      <textarea id="input"></textarea>
      <div class="actions">
        <button class="primary" id="renderBtn" type="button">Render map</button>
        <button class="secondary" id="sampleBtn" type="button">Load sample</button>
        <button class="secondary" id="copySvgBtn" type="button">Copy SVG</button>
      </div>
      <div class="error" id="errorBox"></div>
      <div class="hint">
        Use one relationship per line in either of these formats:
        <br><code>Source -> Target | Optional label</code>
        <br><code>Source => Target</code>
      </div>
    </div>
    <div class="card">
      <div class="canvas" id="canvas"></div>
    </div>
  </div>
</div>
<script>
(function() {
  const sample = [
    'Product strategy -> Customer interviews | informs',
    'Customer interviews -> Problem statements | shapes',
    'Problem statements -> Prioritization | guides',
    'Prioritization -> Roadmap | feeds',
    'Roadmap -> Release plan | breaks into',
    'Release plan -> Launch review | validates',
    'Metrics -> Product strategy | refines'
  ].join('\\n');

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseEdges(text) {
    const lines = text.split(/\\r?\\n/).map(line => line.trim()).filter(Boolean);
    const edges = [];
    lines.forEach(function(line, index) {
      const parts = line.split('|');
      const relation = parts[0].trim();
      const label = (parts[1] || '').trim();
      const arrow = relation.includes('=>') ? '=>' : '->';
      if (!relation.includes(arrow)) throw new Error('Line ' + (index + 1) + ' is missing an arrow.');
      const pair = relation.split(arrow);
      const source = (pair[0] || '').trim();
      const target = (pair[1] || '').trim();
      if (!source || !target) throw new Error('Line ' + (index + 1) + ' must include both a source and target concept.');
      edges.push({ source, target, label: label || '' });
    });
    return edges;
  }

  function buildLevels(edges) {
    const nodes = new Map();
    edges.forEach(function(edge) {
      if (!nodes.has(edge.source)) nodes.set(edge.source, { id: edge.source, incoming: 0, outgoing: [] });
      if (!nodes.has(edge.target)) nodes.set(edge.target, { id: edge.target, incoming: 0, outgoing: [] });
      nodes.get(edge.source).outgoing.push(edge.target);
      nodes.get(edge.target).incoming += 1;
    });
    const roots = Array.from(nodes.values()).filter(node => node.incoming === 0);
    const queue = roots.length ? roots.map(node => ({ id: node.id, level: 0 })) : Array.from(nodes.values()).map(node => ({ id: node.id, level: 0 }));
    const levels = {};
    const visited = new Map();
    while (queue.length) {
      const current = queue.shift();
      const bestLevel = Math.max(current.level, visited.get(current.id) || 0);
      visited.set(current.id, bestLevel);
      const node = nodes.get(current.id);
      node.outgoing.forEach(function(target) {
        const nextLevel = bestLevel + 1;
        if ((visited.get(target) || -1) < nextLevel) queue.push({ id: target, level: nextLevel });
      });
    }
    Array.from(nodes.keys()).forEach(function(id) {
      const level = visited.get(id) || 0;
      if (!levels[level]) levels[level] = [];
      levels[level].push(id);
    });
    return { nodes, levels };
  }

  function renderMap(edges) {
    const { levels } = buildLevels(edges);
    const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
    const spacingX = 240;
    const spacingY = 120;
    const positions = {};
    let maxRows = 0;
    levelKeys.forEach(function(level) {
      maxRows = Math.max(maxRows, levels[level].length);
    });
    levelKeys.forEach(function(level) {
      const list = levels[level];
      list.forEach(function(id, index) {
        const offset = (maxRows - list.length) * spacingY / 2;
        positions[id] = { x: 80 + level * spacingX, y: 70 + index * spacingY + offset };
      });
    });
    const width = Math.max(700, levelKeys.length * spacingX + 220);
    const height = Math.max(360, maxRows * spacingY + 160);
    const nodeMarkup = Array.from(new Set(edges.flatMap(edge => [edge.source, edge.target]))).map(function(id) {
      const pos = positions[id];
      const widthBox = Math.min(200, Math.max(120, id.length * 9 + 40));
      const x = pos.x;
      const y = pos.y;
      return '<g><rect x="' + x + '" y="' + y + '" width="' + widthBox + '" height="56" rx="18" fill="#ffffff" stroke="#bfd7ff" stroke-width="1.5"></rect><text x="' + (x + 18) + '" y="' + (y + 30) + '" font-size="14" font-weight="700" fill="#0f172a">' + escapeHtml(id) + '</text></g>';
    }).join('');
    const edgeMarkup = edges.map(function(edge) {
      const sourcePos = positions[edge.source];
      const targetPos = positions[edge.target];
      const sourceWidth = Math.min(200, Math.max(120, edge.source.length * 9 + 40));
      const targetWidth = Math.min(200, Math.max(120, edge.target.length * 9 + 40));
      const x1 = sourcePos.x + sourceWidth;
      const y1 = sourcePos.y + 28;
      const x2 = targetPos.x;
      const y2 = targetPos.y + 28;
      const midX = x1 + (x2 - x1) / 2;
      const labelX = midX;
      const labelY = y1 + (y2 - y1) / 2 - 10;
      return '<g><path d="M ' + x1 + ' ' + y1 + ' C ' + midX + ' ' + y1 + ', ' + midX + ' ' + y2 + ', ' + x2 + ' ' + y2 + '" stroke="#2563eb" stroke-width="2.2" fill="none" marker-end="url(#arrow)"></path>' + (edge.label ? '<rect x="' + (labelX - 44) + '" y="' + (labelY - 14) + '" width="88" height="24" rx="12" fill="#ffffff"></rect><text x="' + labelX + '" y="' + labelY + '" text-anchor="middle" font-size="12" font-weight="700" fill="#475569">' + escapeHtml(edge.label) + '</text>' : '') + '</g>';
    }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="' + height + '"><defs><marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="#2563eb"></path></marker></defs><rect width="' + width + '" height="' + height + '" fill="#f8fbff"></rect>' + edgeMarkup + nodeMarkup + '</svg>';
  }

  function showError(message) {
    const box = document.getElementById('errorBox');
    box.style.display = message ? 'block' : 'none';
    box.textContent = message || '';
  }

  function render() {
    try {
      showError('');
      const edges = parseEdges(document.getElementById('input').value);
      document.getElementById('canvas').innerHTML = renderMap(edges);
    } catch (error) {
      document.getElementById('canvas').innerHTML = '';
      showError(error.message);
    }
  }

  document.getElementById('input').value = sample;
  document.getElementById('renderBtn').addEventListener('click', render);
  document.getElementById('sampleBtn').addEventListener('click', function() {
    document.getElementById('input').value = sample;
    render();
  });
  document.getElementById('copySvgBtn').addEventListener('click', function() {
    const svg = document.getElementById('canvas').innerHTML;
    if (navigator.clipboard && svg) {
      navigator.clipboard.writeText(svg);
    }
  });
  render();
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
