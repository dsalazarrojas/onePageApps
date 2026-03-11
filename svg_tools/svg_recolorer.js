addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/') {
    return serveMainPage();
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: request.method === 'GET' ? 404 : 405,
    headers: jsonHeaders()
  });
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Recolorer</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, "Segoe UI", sans-serif;
      background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
      color: #0f172a;
      min-height: 100vh;
      padding: 24px;
    }
    .app {
      max-width: 1200px;
      margin: 0 auto;
    }
    .hero {
      margin-bottom: 24px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 3vw, 2.6rem);
    }
    .lead {
      margin: 0;
      color: #475569;
      max-width: 760px;
      line-height: 1.6;
    }
    .grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 980px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: #ffffff;
      border: 1px solid #dbeafe;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
    }
    .card h2 {
      margin: 0 0 14px;
      font-size: 1.15rem;
    }
    .dropzone {
      position: relative;
      border: 2px dashed #93c5fd;
      border-radius: 18px;
      padding: 28px 20px;
      text-align: center;
      background: #eff6ff;
      transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
      cursor: pointer;
    }
    .dropzone.dragover {
      border-color: #2563eb;
      background: #dbeafe;
      transform: translateY(-1px);
    }
    .dropzone input {
      display: none;
    }
    .dropzone strong {
      display: block;
      font-size: 1rem;
      margin-bottom: 6px;
    }
    .muted {
      color: #64748b;
      font-size: 0.94rem;
      line-height: 1.5;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 16px;
    }
    .stat {
      border-radius: 16px;
      background: #f8fafc;
      padding: 14px;
      border: 1px solid #e2e8f0;
    }
    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 1.05rem;
      font-weight: 700;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }
    button {
      border: none;
      border-radius: 999px;
      padding: 12px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }
    .primary {
      background: #2563eb;
      color: #ffffff;
    }
    .secondary {
      background: #e2e8f0;
      color: #0f172a;
    }
    .palette-list {
      display: grid;
      gap: 12px;
      margin-top: 16px;
      max-height: 520px;
      overflow: auto;
      padding-right: 4px;
    }
    .palette-item {
      display: grid;
      grid-template-columns: 18px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .swatch {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      border: 1px solid rgba(15, 23, 42, 0.16);
    }
    .palette-value {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .palette-value strong {
      font-size: 0.95rem;
      letter-spacing: 0.02em;
    }
    .palette-value span {
      font-size: 0.8rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    input[type="color"] {
      width: 52px;
      height: 38px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 0;
      background: #ffffff;
      cursor: pointer;
    }
    .preview-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 18px;
    }
    .preview-box {
      min-height: 380px;
      border-radius: 18px;
      border: 1px solid #dbeafe;
      background:
        linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
      background-size: 18px 18px;
      background-position: 0 0, 0 9px, 9px -9px, -9px 0;
      overflow: auto;
      padding: 18px;
    }
    .sandboxed-preview {
      min-height: 340px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sandboxed-preview svg {
      max-width: 100%;
      max-height: 540px;
      width: auto;
      height: auto;
      display: block;
    }
    textarea {
      width: 100%;
      min-height: 190px;
      resize: vertical;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 14px;
      font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #0f172a;
      background: #f8fafc;
    }
    .status {
      margin-top: 16px;
      min-height: 24px;
      font-size: 0.92rem;
      color: #1d4ed8;
    }
    .status.error {
      color: #b91c1c;
    }
    .empty {
      border-radius: 16px;
      padding: 18px;
      background: #f8fafc;
      color: #64748b;
      border: 1px dashed #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="hero">
      <h1>SVG Recolorer</h1>
      <p class="lead">Upload an SVG, detect every unique fill and stroke color, map each one to a new color with a palette of pickers, preview the updated artwork, then download the recolored SVG — all without leaving the browser.</p>
    </div>

    <div class="grid">
      <section class="card">
        <h2>Upload & palette</h2>
        <label class="dropzone" id="dropzone">
          <input id="fileInput" type="file" accept=".svg,image/svg+xml">
          <strong>Drop an SVG here or click to browse</strong>
          <div class="muted">The app scans <code>fill</code>, <code>stroke</code>, and inline style declarations, then normalizes supported named colors to hex.</div>
        </label>

        <div class="stats">
          <div class="stat">
            <span class="stat-label">Detected colors</span>
            <span class="stat-value" id="colorCount">0</span>
          </div>
          <div class="stat">
            <span class="stat-label">Current file</span>
            <span class="stat-value" id="fileName">—</span>
          </div>
        </div>

        <div class="actions">
          <button class="primary" id="applyButton" disabled>Apply Recoloring</button>
          <button class="secondary" id="resetButton" disabled>Reset Colors</button>
          <button class="secondary" id="downloadButton" disabled>Download SVG</button>
        </div>

        <div class="status" id="statusMessage">Upload an SVG file to begin.</div>

        <div class="palette-list" id="paletteList">
          <div class="empty">Detected colors will appear here with a swatch, the original value, and a replacement color picker.</div>
        </div>
      </section>

      <section class="preview-shell">
        <div class="card">
          <h2>Preview</h2>
          <div class="preview-box">
            <div class="sandboxed-preview" id="svgPreview">
              <div class="empty">The sanitized SVG preview appears here after upload.</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Current SVG source</h2>
          <textarea id="sourcePreview" readonly placeholder="Updated SVG markup will appear here."></textarea>
        </div>
      </section>
    </div>
  </div>

  <script>
    const namedColors = {
      black: '#000000',
      silver: '#c0c0c0',
      gray: '#808080',
      grey: '#808080',
      white: '#ffffff',
      maroon: '#800000',
      red: '#ff0000',
      purple: '#800080',
      fuchsia: '#ff00ff',
      magenta: '#ff00ff',
      green: '#008000',
      lime: '#00ff00',
      olive: '#808000',
      yellow: '#ffff00',
      navy: '#000080',
      blue: '#0000ff',
      teal: '#008080',
      aqua: '#00ffff',
      cyan: '#00ffff',
      orange: '#ffa500',
      brown: '#a52a2a',
      pink: '#ffc0cb',
      gold: '#ffd700',
      indigo: '#4b0082',
      violet: '#ee82ee'
    };

    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const paletteList = document.getElementById('paletteList');
    const svgPreview = document.getElementById('svgPreview');
    const sourcePreview = document.getElementById('sourcePreview');
    const colorCount = document.getElementById('colorCount');
    const fileNameEl = document.getElementById('fileName');
    const statusMessage = document.getElementById('statusMessage');
    const applyButton = document.getElementById('applyButton');
    const resetButton = document.getElementById('resetButton');
    const downloadButton = document.getElementById('downloadButton');

    let originalSource = '';
    let currentSource = '';
    let currentFilename = 'recolored';
    let colorEntries = [];

    dropzone.addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', function (event) {
      const file = event.target.files && event.target.files[0];
      if (file) {
        loadSvgFile(file);
      }
    });

    ['dragenter', 'dragover'].forEach(function (type) {
      dropzone.addEventListener(type, function (event) {
        event.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'dragend'].forEach(function (type) {
      dropzone.addEventListener(type, function () {
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', function (event) {
      event.preventDefault();
      dropzone.classList.remove('dragover');
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) {
        loadSvgFile(file);
      }
    });

    applyButton.addEventListener('click', applyRecoloring);
    resetButton.addEventListener('click', resetColors);
    downloadButton.addEventListener('click', downloadSvg);

    function loadSvgFile(file) {
      if (!/\\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') {
        setStatus('Please choose a valid SVG file.', true);
        return;
      }

      const reader = new FileReader();
      reader.onload = function () {
        try {
          initializeSvg(String(reader.result || ''), file.name);
        } catch (error) {
          setStatus(error.message || 'Could not parse the SVG file.', true);
        } finally {
          fileInput.value = '';
        }
      };
      reader.onerror = function () {
        setStatus('The SVG file could not be read.', true);
      };
      reader.readAsText(file);
    }

    function initializeSvg(svgText, filename) {
      const parsed = parseSvg(svgText);
      const extracted = extractColorEntries(parsed.doc);

      originalSource = svgText;
      currentSource = svgText;
      currentFilename = (filename || 'recolored').replace(/\\.svg$/i, '');
      colorEntries = extracted;

      fileNameEl.textContent = filename || 'uploaded.svg';
      colorCount.textContent = String(colorEntries.length);
      applyButton.disabled = colorEntries.length === 0;
      resetButton.disabled = false;
      downloadButton.disabled = false;

      renderPalette();
      renderPreview(currentSource);
      updateSourcePreview();

      if (colorEntries.length === 0) {
        setStatus('No supported colors were detected. The tool looks for #rrggbb values and a set of named CSS colors in fill/stroke attributes and inline styles.', true);
      } else {
        setStatus('Detected ' + colorEntries.length + ' unique colors. Adjust the pickers, then click Apply Recoloring.');
      }
    }

    function parseSvg(svgText) {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      if (doc.querySelector('parsererror')) {
        throw new Error('This file is not valid SVG markup.');
      }

      const svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') {
        throw new Error('The uploaded file does not contain a root <svg> element.');
      }

      return { doc: doc, svg: svg };
    }

    function extractColorEntries(doc) {
      const map = new Map();

      doc.querySelectorAll('*').forEach(function (element) {
        ['fill', 'stroke'].forEach(function (attrName) {
          const rawValue = element.getAttribute(attrName);
          if (rawValue) {
            scanColorValue(rawValue, map);
          }
        });

        const inlineStyle = element.getAttribute('style');
        if (inlineStyle) {
          const styleRegex = /(?:^|;)\\s*(fill|stroke)\\s*:\\s*([^;]+)/ig;
          let match;
          while ((match = styleRegex.exec(inlineStyle)) !== null) {
            scanColorValue(match[2], map);
          }
        }
      });

      return Array.from(map.values()).sort(function (a, b) {
        return a.hex.localeCompare(b.hex);
      });
    }

    function scanColorValue(rawValue, map) {
      const token = String(rawValue || '').trim();
      const normalized = normalizeColor(token);
      if (!normalized) {
        return;
      }

      if (!map.has(normalized)) {
        map.set(normalized, {
          hex: normalized,
          rawTokens: new Set([token]),
          inputId: 'color-' + map.size
        });
      } else {
        map.get(normalized).rawTokens.add(token);
      }
    }

    function normalizeColor(value) {
      let color = String(value || '').trim().toLowerCase();
      color = color.replace(/\\s*!important\\s*$/, '');

      if (!color || color === 'none' || color === 'transparent' || color === 'currentcolor') {
        return null;
      }
      if (color.startsWith('url(') || color.startsWith('var(')) {
        return null;
      }
      if (/^#[0-9a-f]{6}$/i.test(color)) {
        return color;
      }
      if (namedColors[color]) {
        return namedColors[color];
      }
      return null;
    }

    function renderPalette() {
      if (!colorEntries.length) {
        paletteList.innerHTML = '<div class="empty">No supported SVG colors were detected in this file.</div>';
        return;
      }

      paletteList.innerHTML = colorEntries.map(function (entry, index) {
        const rawVariants = Array.from(entry.rawTokens).sort().join(', ');
        return '<div class="palette-item">' +
          '<div class="swatch" style="background:' + escapeHtml(entry.hex) + ';"></div>' +
          '<div class="palette-value">' +
            '<strong>' + escapeHtml(entry.hex) + '</strong>' +
            '<span title="' + escapeHtml(rawVariants) + '">' + escapeHtml(rawVariants) + '</span>' +
          '</div>' +
          '<input type="color" id="' + entry.inputId + '" value="' + escapeHtml(entry.hex) + '" aria-label="Replacement color ' + (index + 1) + '">' +
        '</div>';
      }).join('');
    }

    function applyRecoloring() {
      if (!originalSource || !colorEntries.length) {
        return;
      }

      let updatedSvg = originalSource;
      colorEntries.forEach(function (entry) {
        const picker = document.getElementById(entry.inputId);
        const newColor = normalizeColor(picker && picker.value ? picker.value : entry.hex) || entry.hex;
        Array.from(entry.rawTokens).forEach(function (token) {
          updatedSvg = replaceColorToken(updatedSvg, token, newColor);
        });
        updatedSvg = replaceColorToken(updatedSvg, entry.hex, newColor);
      });

      currentSource = updatedSvg;
      renderPreview(currentSource);
      updateSourcePreview();
      setStatus('Applied recoloring to ' + colorEntries.length + ' unique colors.');
    }

    function replaceColorToken(svgText, token, replacement) {
      const escaped = escapeRegExp(String(token || '').trim());
      if (!escaped) {
        return svgText;
      }

      let next = svgText;
      const attributePattern = new RegExp('((?:fill|stroke)\\\\s*=\\\\s*["\\'])' + escaped + '(["\\'])', 'ig');
      const stylePattern = new RegExp('((?:fill|stroke)\\\\s*:\\\\s*)' + escaped + '(?=\\\\s*(?:;|["\\']))', 'ig');
      const boundedPattern = new RegExp('(^|[^a-zA-Z0-9_-])(' + escaped + ')(?=[^a-zA-Z0-9_-]|$)', 'ig');

      next = next.replace(attributePattern, '$1' + replacement + '$2');
      next = next.replace(stylePattern, '$1' + replacement);
      next = next.replace(boundedPattern, function (_, prefix) {
        return prefix + replacement;
      });

      return next;
    }

    function resetColors() {
      if (!originalSource) {
        return;
      }

      currentSource = originalSource;
      colorEntries.forEach(function (entry) {
        const picker = document.getElementById(entry.inputId);
        if (picker) {
          picker.value = entry.hex;
        }
      });

      renderPreview(currentSource);
      updateSourcePreview();
      setStatus('Restored the original SVG colors.');
    }

    function renderPreview(svgText) {
      try {
        const sanitized = sanitizeSvgMarkup(svgText);
        svgPreview.innerHTML = sanitized;

        const svg = svgPreview.querySelector('svg');
        if (svg) {
          svg.removeAttribute('width');
          svg.removeAttribute('height');
          svg.style.maxWidth = '100%';
          svg.style.maxHeight = '520px';
          svg.style.width = 'auto';
          svg.style.height = 'auto';
        }
      } catch (error) {
        svgPreview.innerHTML = '<div class="empty">Preview unavailable: ' + escapeHtml(error.message || 'Unknown error') + '</div>';
      }
    }

    function sanitizeSvgMarkup(svgText) {
      const parsed = parseSvg(svgText);
      const doc = parsed.doc;

      doc.querySelectorAll('script, foreignObject, iframe, object, embed, audio, video, link').forEach(function (node) {
        node.remove();
      });

      doc.querySelectorAll('*').forEach(function (element) {
        Array.from(element.attributes).forEach(function (attribute) {
          const name = attribute.name.toLowerCase();
          const value = attribute.value.trim();

          if (name.startsWith('on')) {
            element.removeAttribute(attribute.name);
            return;
          }

          if ((name === 'href' || name === 'xlink:href') && /^(?:javascript:|https?:|data:text\\/html)/i.test(value)) {
            element.removeAttribute(attribute.name);
          }
        });
      });

      return new XMLSerializer().serializeToString(doc.documentElement);
    }

    function updateSourcePreview() {
      sourcePreview.value = currentSource;
    }

    function downloadSvg() {
      if (!currentSource) {
        return;
      }

      const blob = new Blob([currentSource], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentFilename + '-recolored.svg';
      link.click();
      URL.revokeObjectURL(url);
    }

    function escapeRegExp(value) {
      return String(value).replace(/[|\\\\{}()[\\]^$+*?.]/g, '\\\\$&');
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function setStatus(message, isError) {
      statusMessage.textContent = message;
      statusMessage.classList.toggle('error', Boolean(isError));
    }
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function textHeaders() {
  return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}
