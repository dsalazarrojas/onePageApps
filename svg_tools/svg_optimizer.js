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
  <title>SVG Optimizer</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      padding: 24px;
      font-family: Inter, "Segoe UI", sans-serif;
      color: #0f172a;
      background: linear-gradient(180deg, #ecfeff 0%, #f8fafc 100%);
    }
    .app {
      max-width: 1240px;
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
      max-width: 780px;
      color: #475569;
      line-height: 1.6;
    }
    .layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 1040px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 22px;
      padding: 20px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
    }
    .card h2 {
      margin: 0 0 14px;
      font-size: 1.15rem;
    }
    .dropzone {
      border: 2px dashed #67e8f9;
      border-radius: 18px;
      background: #ecfeff;
      padding: 26px 18px;
      text-align: center;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      cursor: pointer;
    }
    .dropzone.dragover {
      background: #cffafe;
      border-color: #0891b2;
      transform: translateY(-1px);
    }
    .dropzone input {
      display: none;
    }
    .dropzone strong {
      display: block;
      margin-bottom: 6px;
    }
    .muted {
      color: #64748b;
      font-size: 0.93rem;
      line-height: 1.5;
    }
    .options {
      display: grid;
      gap: 10px;
      margin-top: 18px;
    }
    .option {
      display: flex;
      gap: 10px;
      align-items: start;
      padding: 10px 12px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .option input {
      margin-top: 3px;
    }
    .option strong {
      display: block;
      font-size: 0.94rem;
    }
    .option span {
      display: block;
      margin-top: 2px;
      font-size: 0.82rem;
      color: #64748b;
      line-height: 1.45;
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
      box-shadow: 0 14px 28px rgba(8, 145, 178, 0.16);
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }
    .primary {
      background: #0891b2;
      color: #ffffff;
    }
    .secondary {
      background: #e2e8f0;
      color: #0f172a;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }
    .stat {
      padding: 14px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 6px;
    }
    .stat-value {
      font-weight: 700;
      font-size: 1rem;
    }
    .panel-grid {
      display: grid;
      gap: 18px;
    }
    .code-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    @media (max-width: 900px) {
      .code-grid {
        grid-template-columns: 1fr;
      }
    }
    textarea {
      width: 100%;
      min-height: 230px;
      resize: vertical;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 14px;
      background: #f8fafc;
      color: #0f172a;
      font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .preview-box {
      min-height: 320px;
      border-radius: 18px;
      border: 1px solid #cbd5e1;
      padding: 18px;
      background:
        linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
      background-size: 18px 18px;
      background-position: 0 0, 0 9px, 9px -9px, -9px 0;
      overflow: auto;
    }
    .preview-box svg {
      max-width: 100%;
      max-height: 520px;
      display: block;
      margin: 0 auto;
    }
    .status {
      min-height: 24px;
      margin-top: 16px;
      font-size: 0.92rem;
      color: #0f766e;
    }
    .status.error {
      color: #b91c1c;
    }
    .inline-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
    }
    .show-toggle {
      padding: 8px 12px;
      font-size: 0.85rem;
      background: #ecfeff;
      color: #155e75;
      box-shadow: none;
    }
    .empty {
      border: 1px dashed #cbd5e1;
      border-radius: 16px;
      padding: 18px;
      background: #f8fafc;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="hero">
      <h1>SVG Optimizer</h1>
      <p class="lead">Trim bloated SVG files in the browser by removing comments, metadata, editor-specific markup, empty attributes, and other unnecessary text while keeping the visual result intact.</p>
    </div>

    <div class="layout">
      <section class="card">
        <h2>Upload & options</h2>
        <label class="dropzone" id="dropzone">
          <input id="fileInput" type="file" accept=".svg,image/svg+xml">
          <strong>Drop an SVG here or click to select one</strong>
          <div class="muted">Illustrator and Inkscape exports often shrink the most because they include extra namespaces, metadata, and whitespace.</div>
        </label>

        <div class="options">
          <label class="option"><input type="checkbox" id="removeComments" checked><div><strong>Remove XML comments</strong><span>Strips <code>&lt;!-- ... --&gt;</code> blocks.</span></div></label>
          <label class="option"><input type="checkbox" id="removeMetadata" checked><div><strong>Remove metadata, title, and desc elements</strong><span>Deletes <code>&lt;metadata&gt;</code>, <code>&lt;title&gt;</code>, and <code>&lt;desc&gt;</code> nodes.</span></div></label>
          <label class="option"><input type="checkbox" id="removeEditorData" checked><div><strong>Remove editor namespaces and attributes</strong><span>Clears <code>inkscape:*</code>, <code>sodipodi:*</code>, <code>dc:*</code>, <code>cc:*</code>, and <code>rdf:*</code> markup.</span></div></label>
          <label class="option"><input type="checkbox" id="collapseWhitespace" checked><div><strong>Collapse whitespace</strong><span>Removes newlines and tabs between tags and trims repeated spaces.</span></div></label>
          <label class="option"><input type="checkbox" id="removeEmptyAttributes" checked><div><strong>Remove empty attributes</strong><span>Deletes blank attributes such as <code>fill=""</code> but keeps meaningful values like <code>fill="none"</code>.</span></div></label>
          <label class="option"><input type="checkbox" id="removeDefaults" checked><div><strong>Remove default values</strong><span>Removes attributes such as <code>opacity="1"</code> and <code>stroke-width="1"</code>.</span></div></label>
          <label class="option"><input type="checkbox" id="removeXmlDeclaration" checked><div><strong>Remove XML declaration line</strong><span>Strips the initial <code>&lt;?xml ... ?&gt;</code> line.</span></div></label>
          <label class="option"><input type="checkbox" id="removeDoctype" checked><div><strong>Remove DOCTYPE</strong><span>Deletes the SVG DOCTYPE if present.</span></div></label>
        </div>

        <div class="actions">
          <button class="primary" id="optimizeButton" disabled>Optimize</button>
          <button class="secondary" id="downloadButton" disabled>Download Optimized SVG</button>
        </div>

        <div class="stats">
          <div class="stat"><span class="stat-label">Original size</span><span class="stat-value" id="originalSize">—</span></div>
          <div class="stat"><span class="stat-label">Optimized size</span><span class="stat-value" id="optimizedSize">—</span></div>
          <div class="stat"><span class="stat-label">Bytes saved</span><span class="stat-value" id="bytesSaved">—</span></div>
          <div class="stat"><span class="stat-label">Reduction</span><span class="stat-value" id="reduction">—</span></div>
        </div>

        <div class="status" id="statusMessage">Upload an SVG file to inspect and optimize it.</div>
      </section>

      <section class="panel-grid">
        <div class="card">
          <h2>Preview</h2>
          <div class="preview-box" id="previewBox">
            <div class="empty">The optimized preview appears here after upload.</div>
          </div>
        </div>

        <div class="code-grid">
          <div class="card">
            <div class="inline-actions">
              <h2 style="margin:0;">Original SVG source</h2>
              <button class="show-toggle" id="showMoreButton" style="display:none;">Show more</button>
            </div>
            <textarea id="originalSource" readonly placeholder="The uploaded SVG source will appear here."></textarea>
          </div>

          <div class="card">
            <h2>Optimized SVG source</h2>
            <textarea id="optimizedSource" readonly placeholder="Click Optimize to generate the cleaned SVG output."></textarea>
          </div>
        </div>
      </section>
    </div>
  </div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const optimizeButton = document.getElementById('optimizeButton');
    const downloadButton = document.getElementById('downloadButton');
    const statusMessage = document.getElementById('statusMessage');
    const previewBox = document.getElementById('previewBox');
    const originalSourceField = document.getElementById('originalSource');
    const optimizedSourceField = document.getElementById('optimizedSource');
    const originalSizeEl = document.getElementById('originalSize');
    const optimizedSizeEl = document.getElementById('optimizedSize');
    const bytesSavedEl = document.getElementById('bytesSaved');
    const reductionEl = document.getElementById('reduction');
    const showMoreButton = document.getElementById('showMoreButton');

    let originalSource = '';
    let optimizedSource = '';
    let currentFilename = 'optimized';
    let showFullOriginal = false;

    const optionIds = [
      'removeComments',
      'removeMetadata',
      'removeEditorData',
      'collapseWhitespace',
      'removeEmptyAttributes',
      'removeDefaults',
      'removeXmlDeclaration',
      'removeDoctype'
    ];

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

    optimizeButton.addEventListener('click', optimizeSvg);
    downloadButton.addEventListener('click', downloadOptimizedSvg);
    showMoreButton.addEventListener('click', function () {
      showFullOriginal = !showFullOriginal;
      renderOriginalSource();
    });

    function loadSvgFile(file) {
      if (!/\\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') {
        setStatus('Please choose a valid SVG file.', true);
        return;
      }

      const reader = new FileReader();
      reader.onload = function () {
        try {
          const text = String(reader.result || '');
          validateSvg(text);
          originalSource = text;
          optimizedSource = '';
          currentFilename = (file.name || 'optimized').replace(/\\.svg$/i, '');
          showFullOriginal = false;

          optimizeButton.disabled = false;
          downloadButton.disabled = true;
          optimizedSourceField.value = '';
          renderOriginalSource();
          renderPreview(originalSource);
          updateStats(originalSource, '');
          setStatus('SVG loaded. Review the options, then click Optimize.');
        } catch (error) {
          setStatus(error.message || 'The uploaded file is not valid SVG.', true);
        } finally {
          fileInput.value = '';
        }
      };
      reader.onerror = function () {
        setStatus('The SVG file could not be read.', true);
      };
      reader.readAsText(file);
    }

    function optimizeSvg() {
      if (!originalSource) {
        return;
      }

      try {
        let next = originalSource;

        if (isChecked('removeXmlDeclaration')) {
          next = next.replace(/^\\s*<\\?xml[\\s\\S]*?\\?>\\s*/i, '');
        }
        if (isChecked('removeDoctype')) {
          next = removeDoctype(next);
        }
        if (isChecked('removeComments')) {
          next = next.replace(/<!--[\\s\\S]*?-->/g, '');
        }
        if (isChecked('removeMetadata')) {
          next = next
            .replace(/<metadata\\b[\\s\\S]*?<\\/metadata>/gi, '')
            .replace(/<title\\b[\\s\\S]*?<\\/title>/gi, '')
            .replace(/<desc\\b[\\s\\S]*?<\\/desc>/gi, '');
        }
        if (isChecked('removeEditorData')) {
          next = removeEditorSpecificMarkup(next);
        }
        if (isChecked('removeEmptyAttributes')) {
          next = next.replace(/\\s+[A-Za-z_:][\\w:.-]*=(["'])\\s*\\1/g, '');
        }
        if (isChecked('removeDefaults')) {
          next = removeDefaultPresentationValues(next);
        }
        if (isChecked('collapseWhitespace')) {
          next = next
            .replace(/>\\s+</g, '><')
            .replace(/[\\r\\n\\t]+/g, ' ')
            .replace(/\\s{2,}/g, ' ')
            .trim();
        }

        validateSvg(next);
        optimizedSource = next;
        optimizedSourceField.value = optimizedSource;
        renderPreview(optimizedSource);
        updateStats(originalSource, optimizedSource);
        downloadButton.disabled = false;
        setStatus('Optimization complete. Review the size savings and download the result.');
      } catch (error) {
        setStatus(error.message || 'Optimization failed.', true);
      }
    }

    function removeDoctype(svgText) {
      return svgText
        .replace(/<!DOCTYPE[\\s\\S]*?\\]>\\s*/i, '')
        .replace(/<!DOCTYPE[\\s\\S]*?>\\s*/i, '');
    }

    function removeEditorSpecificMarkup(svgText) {
      let output = svgText;
      ['inkscape', 'sodipodi', 'dc', 'cc', 'rdf'].forEach(function (prefix) {
        const namespacePattern = new RegExp('\\\\s+xmlns:' + prefix + '=(["\\']).*?\\\\1', 'gi');
        const attributePattern = new RegExp('\\\\s+' + prefix + ':[\\\\w.-]+=(["\\']).*?\\\\1', 'gi');
        const pairedElementPattern = new RegExp('<' + prefix + ':[\\\\w.-]+\\\\b[^>]*>[\\\\s\\\\S]*?<\\\\/' + prefix + ':[\\\\w.-]+\\\\s*>', 'gi');
        const selfClosingPattern = new RegExp('<' + prefix + ':[\\\\w.-]+\\\\b[^>]*/\\\\s*>', 'gi');
        output = output
          .replace(namespacePattern, '')
          .replace(attributePattern, '')
          .replace(pairedElementPattern, '')
          .replace(selfClosingPattern, '');
      });
      return output;
    }

    function removeDefaultPresentationValues(svgText) {
      const defaults = [
        ['opacity', '1'],
        ['fill-opacity', '1'],
        ['stroke-opacity', '1'],
        ['stroke-width', '1'],
        ['visibility', 'visible']
      ];

      let output = svgText;
      defaults.forEach(function (entry) {
        const pattern = new RegExp('\\\\s+' + entry[0] + '=(["\\'])\\\\s*' + escapeRegExp(entry[1]) + '\\\\s*\\\\1', 'gi');
        output = output.replace(pattern, '');
      });
      return output;
    }

    function validateSvg(svgText) {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      if (doc.querySelector('parsererror') || !doc.documentElement || doc.documentElement.nodeName.toLowerCase() !== 'svg') {
        throw new Error('The current output is not valid SVG. Try disabling one or more optimization steps.');
      }
    }

    function renderPreview(svgText) {
      try {
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        doc.querySelectorAll('script, foreignObject, iframe, object, embed, audio, video').forEach(function (node) {
          node.remove();
        });
        doc.querySelectorAll('*').forEach(function (element) {
          Array.from(element.attributes).forEach(function (attribute) {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim();
            if (name.startsWith('on')) {
              element.removeAttribute(attribute.name);
            }
            if ((name === 'href' || name === 'xlink:href') && /^(?:javascript:|https?:)/i.test(value)) {
              element.removeAttribute(attribute.name);
            }
          });
        });
        previewBox.innerHTML = new XMLSerializer().serializeToString(doc.documentElement);
      } catch (error) {
        previewBox.innerHTML = '<div class="empty">Preview unavailable: ' + escapeHtml(error.message || 'Unknown error') + '</div>';
      }
    }

    function renderOriginalSource() {
      if (!originalSource) {
        originalSourceField.value = '';
        showMoreButton.style.display = 'none';
        return;
      }

      const needsToggle = originalSource.length > 2000;
      showMoreButton.style.display = needsToggle ? 'inline-flex' : 'none';
      showMoreButton.textContent = showFullOriginal ? 'Show less' : 'Show more';
      originalSourceField.value = showFullOriginal || !needsToggle
        ? originalSource
        : originalSource.slice(0, 2000) + '\\n\\n… truncated. Click "Show more" to see the full SVG source.';
    }

    function updateStats(originalText, optimizedText) {
      const originalBytes = originalText ? byteLength(originalText) : 0;
      const optimizedBytes = optimizedText ? byteLength(optimizedText) : 0;
      const savedBytes = optimizedText ? Math.max(0, originalBytes - optimizedBytes) : 0;
      const reduction = optimizedText && originalBytes > 0 ? ((savedBytes / originalBytes) * 100).toFixed(1) + '%' : '—';

      originalSizeEl.textContent = originalText ? formatBytes(originalBytes) : '—';
      optimizedSizeEl.textContent = optimizedText ? formatBytes(optimizedBytes) : '—';
      bytesSavedEl.textContent = optimizedText ? formatBytes(savedBytes) : '—';
      reductionEl.textContent = reduction;
    }

    function downloadOptimizedSvg() {
      if (!optimizedSource) {
        return;
      }

      const blob = new Blob([optimizedSource], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentFilename + '-optimized.svg';
      link.click();
      URL.revokeObjectURL(url);
    }

    function byteLength(text) {
      return new TextEncoder().encode(text).length;
    }

    function formatBytes(bytes) {
      if (bytes < 1024) {
        return bytes + ' B';
      }
      if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
      }
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function isChecked(id) {
      const element = document.getElementById(id);
      return Boolean(element && element.checked);
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
