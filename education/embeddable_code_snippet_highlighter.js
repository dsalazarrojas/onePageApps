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
  frame.referrerPolicy = 'no-referrer';
  frame.style.cssText = 'width:100%;min-height:420px;border:none;border-radius:16px;display:block';
  frame.title = 'Code snippet highlighter';
  (s && s.parentNode ? s.parentNode : document.body).insertBefore(frame, s || null);
})();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Embeddable Code Snippet Highlighter</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1180px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; color: #475569; max-width: 760px; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  .stack { display: grid; gap: 14px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input[type="text"], select, textarea { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  textarea { min-height: 300px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .checks { display: flex; gap: 18px; flex-wrap: wrap; color: #475569; font-size: 0.95rem; }
  .checks label { display: inline-flex; gap: 8px; align-items: center; margin: 0; font-weight: 600; }
  .samples { display: flex; gap: 8px; flex-wrap: wrap; }
  .samples button { border-radius: 999px; padding: 8px 12px; background: #eff6ff; color: #1d4ed8; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  .preview { width: 100%; min-height: 430px; border: 1px solid #cbd5e1; border-radius: 16px; background: #fff; }
  pre.output { margin: 0; padding: 16px; background: #0f172a; color: #e2e8f0; border-radius: 14px; white-space: pre-wrap; overflow: auto; }
  .hidden { display: none !important; }
  .widget-shell { border-radius: 18px; overflow: hidden; box-shadow: 0 18px 40px rgba(15,23,42,.12); }
  .widget-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; }
  .widget-title { font-size: 15px; font-weight: 800; }
  .widget-lang { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
  .copy-btn { border: none; border-radius: 999px; padding: 8px 12px; font: inherit; font-weight: 800; cursor: pointer; }
  .widget-pre { margin: 0; padding: 18px; overflow: auto; font: 13px/1.65 ui-monospace, SFMono-Regular, Menlo, monospace; }
  .line { display: grid; gap: 12px; }
  .line.with-numbers { grid-template-columns: 48px 1fr; }
  .line-no { user-select: none; text-align: right; padding-right: 6px; }
  .muted { color: #64748b; font-size: 0.92rem; line-height: 1.6; }
  .tok-comment { color: #94a3b8; }
  .tok-string { color: #fca5a5; }
  .tok-number { color: #fbbf24; }
  .tok-keyword { color: #93c5fd; font-weight: 700; }
  .tok-attr { color: #c4b5fd; }
  .tok-punc { color: #cbd5e1; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page" id="builderPage">
  <div class="hero">
    <h1>Embeddable Code Snippet Highlighter</h1>
    <p>Configure a reusable snippet viewer with browser-side highlighting, line numbers, wrapping, and a copy button. The generated embed uses a safe URL-encoded JSON payload.</p>
  </div>
  <div class="grid">
    <div class="card stack">
      <div>
        <label for="title">Widget title</label>
        <input id="title" type="text" value="REST API Example">
      </div>
      <div class="row">
        <div>
          <label for="language">Language</label>
          <select id="language">
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="sql">SQL</option>
            <option value="bash">Bash</option>
            <option value="text">Plain text</option>
          </select>
        </div>
        <div>
          <label for="theme">Theme</label>
          <select id="theme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>
      <div>
        <label for="code">Code</label>
        <textarea id="code"></textarea>
      </div>
      <div class="checks">
        <label><input id="lineNumbers" type="checkbox" checked> Show line numbers</label>
        <label><input id="wrap" type="checkbox"> Wrap long lines</label>
      </div>
      <div>
        <div class="muted" style="margin-bottom:10px;">Load a sample:</div>
        <div class="samples">
          <button type="button" data-sample="javascript">JavaScript</button>
          <button type="button" data-sample="html">HTML</button>
          <button type="button" data-sample="css">CSS</button>
          <button type="button" data-sample="json">JSON</button>
        </div>
      </div>
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
        <iframe id="preview" class="preview" title="Widget preview"></iframe>
      </div>
    </div>
  </div>
</div>
<div id="embedMount" class="hidden"></div>
<script>
(function() {
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get('embed') === '1';
  const samples = {
    javascript: 'async function loadUser(id) {\n  const response = await fetch('/api/users/' + id);\n  if (!response.ok) throw new Error("Request failed");\n  return response.json();\n}\n\nloadUser(42).then(console.log);',
    html: '<section class="hero">\n  <h1>Launch checklist</h1>\n  <p>Ship a polished snippet viewer without third-party assets.</p>\n</section>',
    css: '.badge {\n  display: inline-flex;\n  padding: 0.5rem 0.75rem;\n  border-radius: 999px;\n  background: linear-gradient(135deg, #2563eb, #7c3aed);\n  color: white;\n}',
    json: '{\n  "title": "Sprint review",\n  "owner": "Avery",\n  "items": ["Velocity", "Risks", "Decisions"],\n  "published": true\n}'
  };
  const defaults = { title: 'REST API Example', language: 'javascript', theme: 'dark', lineNumbers: true, wrap: false, code: samples.javascript };

  function readConfig() {
    if (!params.get('config')) return { ...defaults };
    try {
      return Object.assign({}, defaults, JSON.parse(params.get('config')) || {});
    } catch (error) {
      return { ...defaults };
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function tokenReplace(text, regex, className, stash) {
    return text.replace(regex, function(match) {
      const key = '%%TOKEN' + stash.length + '%%';
      stash.push('<span class="' + className + '">' + match + '</span>');
      return key;
    });
  }

  function restoreTokens(text, stash) {
    return text.replace(/%%TOKEN(\d+)%%/g, function(_, index) { return stash[Number(index)] || ''; });
  }

  function highlightMarkup(escaped) {
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>');
    return escaped.replace(/(&lt;\/?)([a-zA-Z][\w:-]*)([^&]*?)(&gt;)/g, function(_, open, tag, attrs, close) {
      const renderedAttrs = attrs.replace(/([a-zA-Z:-]+)(=)(&quot;.*?&quot;)/g, '<span class="tok-attr">$1</span>$2<span class="tok-string">$3</span>');
      return '<span class="tok-punc">' + open + '</span><span class="tok-keyword">' + tag + '</span>' + renderedAttrs + '<span class="tok-punc">' + close + '</span>';
    });
  }

  function highlight(code, language) {
    let escaped = escapeHtml(code);
    if (language === 'html') return highlightMarkup(escaped);
    const stash = [];
    if (language === 'javascript' || language === 'typescript') {
      escaped = tokenReplace(escaped, /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, 'tok-comment', stash);
      escaped = tokenReplace(escaped, /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 'tok-string', stash);
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
      escaped = escaped.replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|try|catch|throw|async|await|import|from|export|default|true|false|null|undefined)\b/g, '<span class="tok-keyword">$1</span>');
      return restoreTokens(escaped, stash);
    }
    if (language === 'css') {
      escaped = tokenReplace(escaped, /(\/\*[\s\S]*?\*\/)/g, 'tok-comment', stash);
      escaped = tokenReplace(escaped, /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 'tok-string', stash);
      escaped = escaped.replace(/([.#]?[a-zA-Z_-][\w-]*)(\s*\{)/g, '<span class="tok-keyword">$1</span>$2');
      escaped = escaped.replace(/([a-z-]+)(\s*:)/g, '<span class="tok-attr">$1</span>$2');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%|ms|s)?)\b/g, '<span class="tok-number">$1</span>');
      return restoreTokens(escaped, stash);
    }
    if (language === 'json') {
      escaped = tokenReplace(escaped, /"(?:\\.|[^"\\])*"/g, 'tok-string', stash);
      escaped = escaped.replace(/\b(true|false|null)\b/g, '<span class="tok-keyword">$1</span>');
      escaped = escaped.replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
      return restoreTokens(escaped, stash).replace(/(<span class="tok-string">&quot;.*?&quot;<\/span>)(\s*:)/g, '<span class="tok-attr">$1</span>$2');
    }
    if (language === 'sql') {
      escaped = tokenReplace(escaped, /(--[^\n]*|\/\*[\s\S]*?\*\/)/g, 'tok-comment', stash);
      escaped = tokenReplace(escaped, /'(?:''|[^'])*'/g, 'tok-string', stash);
      escaped = escaped.replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER|BY|GROUP|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|LIMIT|AS|ON|CASE|WHEN|THEN|ELSE|END|DESC|ASC)\b/gi, '<span class="tok-keyword">$1</span>');
      escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
      return restoreTokens(escaped, stash);
    }
    if (language === 'bash') {
      escaped = tokenReplace(escaped, /(#[^\n]*)/g, 'tok-comment', stash);
      escaped = tokenReplace(escaped, /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 'tok-string', stash);
      escaped = escaped.replace(/\b(if|then|else|fi|for|in|do|done|while|case|esac|function|echo|export|grep|sed|awk|cat|curl|find)\b/g, '<span class="tok-keyword">$1</span>');
      return restoreTokens(escaped, stash);
    }
    return escaped;
  }

  function renderWidget(target, cfg) {
    const dark = cfg.theme !== 'light';
    target.innerHTML = '';
    target.className = isEmbed ? '' : 'widget-shell';
    const shell = document.createElement('div');
    shell.className = 'widget-shell';
    shell.style.background = dark ? '#0f172a' : '#ffffff';
    shell.style.color = dark ? '#e2e8f0' : '#0f172a';
    shell.style.border = '1px solid ' + (dark ? '#1e293b' : '#dbe3f0');
    const header = document.createElement('div');
    header.className = 'widget-head';
    header.style.background = dark ? '#111827' : '#f8fafc';
    header.style.borderBottom = '1px solid ' + (dark ? '#1f2937' : '#e5e7eb');
    header.innerHTML = '<div><div class="widget-title">' + escapeHtml(cfg.title) + '</div><div class="widget-lang" style="color:' + (dark ? '#93c5fd' : '#2563eb') + '">' + escapeHtml(cfg.language) + '</div></div>';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.style.background = dark ? '#2563eb' : '#dbeafe';
    copyBtn.style.color = dark ? '#eff6ff' : '#1d4ed8';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', function() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cfg.code).then(function() {
          copyBtn.textContent = 'Copied';
          setTimeout(function() { copyBtn.textContent = 'Copy'; }, 1200);
        });
      }
    });
    header.appendChild(copyBtn);
    const pre = document.createElement('pre');
    pre.className = 'widget-pre';
    pre.style.whiteSpace = cfg.wrap ? 'pre-wrap' : 'pre';
    const highlighted = highlight(cfg.code, String(cfg.language || 'text').toLowerCase()).split('\\n');
    pre.innerHTML = highlighted.map(function(line, index) {
      if (cfg.lineNumbers) {
        return '<span class="line with-numbers"><span class="line-no" style="color:' + (dark ? '#64748b' : '#94a3b8') + ';border-right:1px solid ' + (dark ? '#1f2937' : '#e5e7eb') + '">' + (index + 1) + '</span><span>' + (line || ' ') + '</span></span>';
      }
      return '<span class="line"><span>' + (line || ' ') + '</span></span>';
    }).join('\\n');
    shell.appendChild(header);
    shell.appendChild(pre);
    target.appendChild(shell);
  }

  function currentConfig() {
    return {
      title: document.getElementById('title').value.trim() || defaults.title,
      language: document.getElementById('language').value,
      theme: document.getElementById('theme').value,
      lineNumbers: document.getElementById('lineNumbers').checked,
      wrap: document.getElementById('wrap').checked,
      code: document.getElementById('code').value
    };
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

  document.getElementById('code').value = defaults.code;
  document.querySelectorAll('[data-sample]').forEach(function(button) {
    button.addEventListener('click', function() {
      const key = button.dataset.sample;
      document.getElementById('language').value = key;
      document.getElementById('title').value = key === 'json' ? 'Config payload' : key.toUpperCase() + ' sample';
      document.getElementById('code').value = samples[key] || defaults.code;
      update();
    });
  });

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
  ['title', 'language', 'theme', 'code', 'lineNumbers', 'wrap'].forEach(function(id) {
    const el = document.getElementById(id);
    el.addEventListener(id === 'code' ? 'input' : 'change', update);
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
