addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method === 'GET' && url.pathname === '/') {
    return serveMainPage();
  }
  const status = request.method === 'GET' ? 404 : 405;
  return new Response(status === 404 ? 'Not found' : 'Method not allowed', { status, headers: textHeaders() });
}

function serveMainPage() {
  const html = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SVG Editor</title>
<style>
  :root {
    --bg: #f5f7fb;
    --panel: #ffffff;
    --line: #d8e1ee;
    --ink: #162033;
    --muted: #667085;
    --accent: #2563eb;
    --accent-soft: #e0ecff;
    --success: #047857;
    --shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: linear-gradient(180deg, #eef4ff 0%, var(--bg) 28%, #f8fafc 100%);
    color: var(--ink);
  }
  .shell {
    width: min(1300px, calc(100vw - 28px));
    margin: 24px auto 34px;
    display: grid;
    gap: 18px;
  }
  .panel {
    background: var(--panel);
    border: 1px solid rgba(37, 99, 235, 0.08);
    border-radius: 24px;
    box-shadow: var(--shadow);
    padding: 22px;
  }
  h1 {
    margin: 0 0 10px;
    font-size: clamp(2rem, 4vw, 2.7rem);
  }
  .hero p {
    margin: 0;
    max-width: 800px;
    line-height: 1.65;
    color: var(--muted);
  }
  .layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr) 340px;
    gap: 18px;
    align-items: start;
  }
  .stack {
    display: grid;
    gap: 16px;
  }
  .drop-zone {
    border: 2px dashed #93c5fd;
    border-radius: 18px;
    background: linear-gradient(180deg, #f7fbff 0%, #eef4ff 100%);
    padding: 26px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .drop-zone.dragover {
    border-color: var(--accent);
    background: #e0ecff;
  }
  .drop-zone strong {
    display: block;
    font-size: 1.06rem;
    margin-bottom: 8px;
  }
  .drop-zone span {
    display: block;
    color: var(--muted);
    line-height: 1.5;
  }
  .button-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  button {
    appearance: none;
    border: 0;
    border-radius: 999px;
    padding: 11px 16px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  button.primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
  }
  button.secondary {
    background: #ecfdf5;
    color: var(--success);
    border: 1px solid #a7f3d0;
  }
  button.ghost {
    background: #fff;
    color: var(--ink);
    border: 1px solid var(--line);
  }
  button:hover {
    transform: translateY(-1px);
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .status {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: #f8fafc;
    color: var(--muted);
    line-height: 1.45;
    min-height: 48px;
  }
  .status.error {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
  }
  .meta-list {
    display: grid;
    gap: 10px;
  }
  .meta-item {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
  }
  .meta-item strong {
    display: block;
    font-size: 0.76rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px;
  }
  .preview-stage {
    border: 1px solid var(--line);
    border-radius: 20px;
    min-height: 520px;
    background: linear-gradient(45deg, #eef2f7 25%, transparent 25%, transparent 75%, #eef2f7 75%, #eef2f7), linear-gradient(45deg, #eef2f7 25%, transparent 25%, transparent 75%, #eef2f7 75%, #eef2f7);
    background-position: 0 0, 12px 12px;
    background-size: 24px 24px;
    padding: 18px;
    overflow: auto;
  }
  #preview {
    min-height: 480px;
    display: grid;
    place-items: center;
  }
  #preview svg {
    max-width: 100%;
    max-height: 620px;
    height: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }
  thead th {
    position: sticky;
    top: 0;
    background: #f8fafc;
    z-index: 1;
  }
  th,
  td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid #edf2f7;
    vertical-align: top;
  }
  .element-table {
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    max-height: 560px;
    overflow-y: auto;
  }
  .element-row {
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .element-row:hover {
    background: #f8fbff;
  }
  .element-row.active {
    background: var(--accent-soft);
  }
  .editor-form {
    display: grid;
    gap: 14px;
  }
  .field {
    display: grid;
    gap: 8px;
  }
  .field label {
    font-size: 0.9rem;
    font-weight: 700;
  }
  .field input[type="text"],
  .field input[type="number"] {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 0.96rem;
  }
  .field input[type="range"] {
    width: 100%;
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 0.88rem;
  }
  .hint {
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 0.76rem;
    font-weight: 700;
    background: var(--accent-soft);
    color: #1d4ed8;
  }
  @media (max-width: 1180px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .preview-stage {
      min-height: 360px;
    }
  }
</style>
</head>
<body>
  <div class="shell">
    <section class="panel hero">
      <span class="badge">Browser-only editing</span>
      <h1>SVG Editor</h1>
      <p>Upload an SVG file, inspect the shapes and text nodes found inside it, then edit fill, stroke, stroke width, opacity, or text content directly from the browser. The preview is rendered from a sanitized parsed SVG, and downloads preserve the updated XML.</p>
    </section>

    <section class="layout">
      <aside class="panel stack">
        <div id="dropZone" class="drop-zone" tabindex="0" role="button" aria-label="Upload SVG file">
          <strong>Drag &amp; drop an SVG file</strong>
          <span>or click to browse. Supported editable elements: rect, circle, ellipse, path, text, polygon, line, and polyline.</span>
        </div>
        <input id="fileInput" type="file" accept=".svg,image/svg+xml" hidden>
        <div class="button-row">
          <button id="downloadButton" class="primary" disabled>Download SVG</button>
          <button id="resetButton" class="ghost" disabled>Reset</button>
        </div>
        <div id="statusBox" class="status">Upload an SVG to begin editing.</div>
        <div class="meta-list">
          <div class="meta-item"><strong>Width</strong><span id="svgWidth">—</span></div>
          <div class="meta-item"><strong>Height</strong><span id="svgHeight">—</span></div>
          <div class="meta-item"><strong>viewBox</strong><span id="svgViewBox">—</span></div>
          <div class="meta-item"><strong>Editable elements</strong><span id="svgElementCount">0</span></div>
        </div>
      </aside>

      <section class="panel stack">
        <div class="button-row" style="justify-content:space-between;align-items:center;">
          <h2 style="margin:0;">Preview</h2>
          <span class="badge">Sanitized render</span>
        </div>
        <div class="preview-stage">
          <div id="preview"><div class="hint">Preview appears here after upload.</div></div>
        </div>
      </section>

      <aside class="stack">
        <section class="panel">
          <div class="button-row" style="justify-content:space-between;align-items:center;">
            <h2 style="margin:0;">Elements</h2>
            <span class="badge">Inspector</span>
          </div>
          <div class="element-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Index</th>
                  <th>Fill</th>
                  <th>Stroke</th>
                  <th>Stroke width</th>
                </tr>
              </thead>
              <tbody id="elementBody">
                <tr><td colspan="5" class="hint">No SVG loaded yet.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel">
          <div class="button-row" style="justify-content:space-between;align-items:center;">
            <h2 style="margin:0;">Edit selected element</h2>
            <span id="selectedLabel" class="badge">None</span>
          </div>
          <div id="editorEmpty" class="hint">Select an element from the list to edit its attributes.</div>
          <form id="editorForm" class="editor-form" hidden>
            <div class="field">
              <label for="fillColor">Fill color</label>
              <input id="fillColor" type="color" value="#000000">
              <label class="checkbox-row"><input id="fillNone" type="checkbox"> Use <code>none</code> for fill</label>
            </div>
            <div class="field">
              <label for="strokeColor">Stroke color</label>
              <input id="strokeColor" type="color" value="#000000">
              <label class="checkbox-row"><input id="strokeNone" type="checkbox"> Use <code>none</code> for stroke</label>
            </div>
            <div class="field">
              <label for="strokeWidth">Stroke width</label>
              <input id="strokeWidth" type="number" min="0" step="0.1" value="1">
            </div>
            <div class="field">
              <label for="opacityRange">Opacity <span id="opacityValue">1.00</span></label>
              <input id="opacityRange" type="range" min="0" max="1" step="0.01" value="1">
            </div>
            <div id="textField" class="field" hidden>
              <label for="textContentInput">Text content</label>
              <input id="textContentInput" type="text" value="">
            </div>
            <button id="applyButton" type="submit" class="primary">Apply</button>
          </form>
        </section>
      </aside>
    </section>
  </div>

  <script>
    const EDITABLE_SELECTOR = 'rect,circle,ellipse,path,text,polygon,line,polyline';
    const BLOCKED_ELEMENTS = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'canvas', 'link', 'meta']);

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const statusBox = document.getElementById('statusBox');
    const preview = document.getElementById('preview');
    const elementBody = document.getElementById('elementBody');
    const downloadButton = document.getElementById('downloadButton');
    const resetButton = document.getElementById('resetButton');
    const editorForm = document.getElementById('editorForm');
    const editorEmpty = document.getElementById('editorEmpty');
    const selectedLabel = document.getElementById('selectedLabel');
    const fillColor = document.getElementById('fillColor');
    const fillNone = document.getElementById('fillNone');
    const strokeColor = document.getElementById('strokeColor');
    const strokeNone = document.getElementById('strokeNone');
    const strokeWidth = document.getElementById('strokeWidth');
    const opacityRange = document.getElementById('opacityRange');
    const opacityValue = document.getElementById('opacityValue');
    const textField = document.getElementById('textField');
    const textContentInput = document.getElementById('textContentInput');
    const svgWidth = document.getElementById('svgWidth');
    const svgHeight = document.getElementById('svgHeight');
    const svgViewBox = document.getElementById('svgViewBox');
    const svgElementCount = document.getElementById('svgElementCount');

    const state = {
      fileName: '',
      originalText: '',
      currentText: '',
      selectedIndex: null
    };

    ['dragenter', 'dragover'].forEach(function(type) {
      dropZone.addEventListener(type, function(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function(type) {
      dropZone.addEventListener(type, function(event) {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('click', function() {
      fileInput.click();
    });

    dropZone.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });

    dropZone.addEventListener('drop', function(event) {
      const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
      if (file) {
        loadSvgFile(file);
      }
    });

    fileInput.addEventListener('change', function(event) {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      if (file) {
        loadSvgFile(file);
      }
    });

    opacityRange.addEventListener('input', function() {
      opacityValue.textContent = Number(opacityRange.value).toFixed(2);
    });

    downloadButton.addEventListener('click', function() {
      if (!state.currentText) {
        return;
      }
      const blob = new Blob([state.currentText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = buildDownloadName(state.fileName || 'edited.svg');
      anchor.click();
      URL.revokeObjectURL(url);
    });

    resetButton.addEventListener('click', function() {
      if (!state.originalText) {
        return;
      }
      state.currentText = state.originalText;
      state.selectedIndex = null;
      renderAll();
      setStatus('Reset to the original uploaded SVG.', false);
    });

    editorForm.addEventListener('submit', function(event) {
      event.preventDefault();
      if (state.selectedIndex === null) {
        return;
      }
      try {
        const doc = parseSvg(state.currentText);
        sanitizeSvgDocument(doc);
        const elements = getEditableElements(doc);
        const element = elements[state.selectedIndex];
        if (!element) {
          throw new Error('The selected element could not be found.');
        }
        setPaintAttribute(element, 'fill', fillNone.checked ? 'none' : fillColor.value);
        setPaintAttribute(element, 'stroke', strokeNone.checked ? 'none' : strokeColor.value);
        const widthValue = strokeWidth.value.trim();
        if (widthValue) {
          element.setAttribute('stroke-width', widthValue);
          updateStyleProperty(element, 'stroke-width', widthValue);
        } else {
          element.removeAttribute('stroke-width');
          updateStyleProperty(element, 'stroke-width', null);
        }
        const opacity = Math.max(0, Math.min(1, Number(opacityRange.value)));
        element.setAttribute('opacity', String(opacity));
        updateStyleProperty(element, 'opacity', String(opacity));
        if (element.nodeName.toLowerCase() === 'text') {
          element.textContent = textContentInput.value;
        }
        state.currentText = serializeSvg(doc);
        renderAll();
        setStatus('Updated ' + element.nodeName.toLowerCase() + ' #' + (state.selectedIndex + 1) + '.', false);
      } catch (error) {
        console.error(error);
        setStatus(error && error.message ? error.message : 'Could not update the SVG.', true);
      }
    });

    async function loadSvgFile(file) {
      if (!(file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || ''))) {
        setStatus('Please choose an SVG file.', true);
        return;
      }
      try {
        const rawText = await file.text();
        const sanitizedText = sanitizeSvgText(rawText);
        state.fileName = file.name || 'uploaded.svg';
        state.originalText = sanitizedText;
        state.currentText = sanitizedText;
        state.selectedIndex = null;
        renderAll();
        setStatus('SVG parsed and sanitized locally. Select an element to begin editing.', false);
      } catch (error) {
        console.error(error);
        setStatus(error && error.message ? error.message : 'Could not parse that SVG file.', true);
      }
    }

    function renderAll() {
      if (!state.currentText) {
        return;
      }
      const doc = parseSvg(state.currentText);
      sanitizeSvgDocument(doc);
      state.currentText = serializeSvg(doc);
      renderPreview(state.currentText);
      renderMetadata(doc);
      renderElementList(doc);
      renderEditor(doc);
      downloadButton.disabled = false;
      resetButton.disabled = false;
    }

    function renderPreview(svgText) {
      preview.innerHTML = svgText;
    }

    function renderMetadata(doc) {
      const root = doc.documentElement;
      svgWidth.textContent = root.getAttribute('width') || 'auto';
      svgHeight.textContent = root.getAttribute('height') || 'auto';
      svgViewBox.textContent = root.getAttribute('viewBox') || 'none';
      svgElementCount.textContent = String(getEditableElements(doc).length);
    }

    function renderElementList(doc) {
      const elements = getEditableElements(doc);
      elementBody.innerHTML = '';
      if (!elements.length) {
        elementBody.innerHTML = '<tr><td colspan="5" class="hint">No editable elements found in this SVG.</td></tr>';
        return;
      }
      elements.forEach(function(element, index) {
        const tr = document.createElement('tr');
        tr.className = 'element-row' + (state.selectedIndex === index ? ' active' : '');
        const fill = getPresentationValue(element, 'fill') || 'inherit';
        const stroke = getPresentationValue(element, 'stroke') || 'inherit';
        const strokeWidthValue = getPresentationValue(element, 'stroke-width') || 'inherit';
        tr.innerHTML = [
          '<td>' + escapeHtml(element.nodeName.toLowerCase()) + '</td>',
          '<td>' + (index + 1) + '</td>',
          '<td>' + escapeHtml(fill) + '</td>',
          '<td>' + escapeHtml(stroke) + '</td>',
          '<td>' + escapeHtml(strokeWidthValue) + '</td>'
        ].join('');
        tr.addEventListener('click', function() {
          state.selectedIndex = index;
          renderAll();
        });
        elementBody.appendChild(tr);
      });
    }

    function renderEditor(doc) {
      const elements = getEditableElements(doc);
      const element = state.selectedIndex === null ? null : elements[state.selectedIndex];
      if (!element) {
        selectedLabel.textContent = 'None';
        editorForm.hidden = true;
        editorEmpty.hidden = false;
        textField.hidden = true;
        return;
      }
      selectedLabel.textContent = element.nodeName.toLowerCase() + ' #' + (state.selectedIndex + 1);
      editorForm.hidden = false;
      editorEmpty.hidden = true;

      const fillValue = getPresentationValue(element, 'fill');
      const strokeValue = getPresentationValue(element, 'stroke');
      const strokeWidthValue = getPresentationValue(element, 'stroke-width') || '1';
      const opacity = getPresentationValue(element, 'opacity') || '1';
      const isText = element.nodeName.toLowerCase() === 'text';

      fillNone.checked = fillValue === 'none';
      strokeNone.checked = strokeValue === 'none';
      fillColor.value = toColorInputValue(fillValue);
      strokeColor.value = toColorInputValue(strokeValue);
      strokeWidth.value = /^-?\d/.test(strokeWidthValue) ? strokeWidthValue : '1';
      opacityRange.value = String(Number(opacity) >= 0 ? Number(opacity) : 1);
      opacityValue.textContent = Number(opacityRange.value).toFixed(2);
      textField.hidden = !isText;
      textContentInput.value = isText ? (element.textContent || '') : '';
    }

    function parseSvg(text) {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('The SVG could not be parsed.');
      }
      if (!doc.documentElement || doc.documentElement.nodeName.toLowerCase() !== 'svg') {
        throw new Error('The uploaded file is not an SVG document.');
      }
      return doc;
    }

    function sanitizeSvgText(text) {
      const doc = parseSvg(text);
      sanitizeSvgDocument(doc);
      return serializeSvg(doc);
    }

    function sanitizeSvgDocument(doc) {
      Array.from(doc.querySelectorAll('*')).forEach(function(element) {
        const nodeName = element.nodeName.toLowerCase();
        if (BLOCKED_ELEMENTS.has(nodeName)) {
          element.remove();
          return;
        }
        Array.from(element.attributes).forEach(function(attribute) {
          const name = attribute.name.toLowerCase();
          const value = attribute.value.trim();
          if (name.indexOf('on') === 0) {
            element.removeAttribute(attribute.name);
            return;
          }
          if ((name === 'href' || name === 'xlink:href') && value && value.indexOf('#') !== 0 && value.indexOf('data:') !== 0) {
            element.removeAttribute(attribute.name);
          }
        });
      });
    }

    function getEditableElements(doc) {
      return Array.from(doc.querySelectorAll(EDITABLE_SELECTOR));
    }

    function serializeSvg(doc) {
      return new XMLSerializer().serializeToString(doc.documentElement);
    }

    function getPresentationValue(element, name) {
      const attributeValue = element.getAttribute(name);
      if (attributeValue !== null && attributeValue !== '') {
        return attributeValue;
      }
      const style = parseStyleAttribute(element.getAttribute('style') || '');
      return style[name] || '';
    }

    function setPaintAttribute(element, name, value) {
      element.setAttribute(name, value);
      updateStyleProperty(element, name, value);
    }

    function updateStyleProperty(element, name, value) {
      const style = parseStyleAttribute(element.getAttribute('style') || '');
      if (value === null || value === '') {
        delete style[name];
      } else {
        style[name] = value;
      }
      const styleText = Object.keys(style).map(function(key) {
        return key + ':' + style[key];
      }).join(';');
      if (styleText) {
        element.setAttribute('style', styleText);
      } else {
        element.removeAttribute('style');
      }
    }

    function parseStyleAttribute(styleText) {
      const output = {};
      styleText.split(';').forEach(function(part) {
        const pieces = part.split(':');
        if (pieces.length !== 2) {
          return;
        }
        const key = pieces[0].trim();
        const value = pieces[1].trim();
        if (key) {
          output[key] = value;
        }
      });
      return output;
    }

    function toColorInputValue(value) {
      if (!value || value === 'none' || value === 'transparent' || value === 'inherit') {
        return '#000000';
      }
      const canvas = toColorInputValue.canvas || (toColorInputValue.canvas = document.createElement('canvas'));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillStyle = value;
      const normalized = ctx.fillStyle;
      if (!normalized) {
        return '#000000';
      }
      if (normalized.charAt(0) === '#') {
        if (normalized.length === 4) {
          return '#' + normalized[1] + normalized[1] + normalized[2] + normalized[2] + normalized[3] + normalized[3];
        }
        return normalized.slice(0, 7);
      }
      const match = normalized.match(/^rgba?\(([^)]+)\)$/);
      if (!match) {
        return '#000000';
      }
      const parts = match[1].split(',').slice(0, 3).map(function(part) {
        return Math.max(0, Math.min(255, Number(part.trim())));
      });
      return '#' + parts.map(function(part) {
        return part.toString(16).padStart(2, '0');
      }).join('');
    }

    function buildDownloadName(fileName) {
      const baseName = String(fileName || 'edited').replace(/\.[^.]+$/, '');
      return baseName + '-edited.svg';
    }

    function setStatus(message, isError) {
      statusBox.textContent = message;
      statusBox.className = isError ? 'status error' : 'status';
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function textHeaders() {
  return { 'Content-Type': 'text/plain;charset=UTF-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json;charset=UTF-8', ...corsHeaders() };
}
