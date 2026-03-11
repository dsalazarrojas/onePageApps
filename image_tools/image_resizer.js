addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  if (url.pathname !== '/') {
    return new Response('Not found', { status: 404, headers: textHeaders() });
  }

  if (request.method === 'GET') {
    return serveMainPage();
  }

  if (request.method === 'POST') {
    return new Response(
      JSON.stringify({ ok: true, message: 'Image resizing is handled entirely in the browser. Use GET / to open the app.' }),
      { status: 200, headers: jsonHeaders() }
    );
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders() });
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Resizer</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1120;
      --panel: rgba(15, 23, 42, 0.9);
      --panel-2: rgba(30, 41, 59, 0.88);
      --line: rgba(148, 163, 184, 0.18);
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #6366f1;
      --accent-2: #06b6d4;
      --success: #22c55e;
      --shadow: 0 26px 50px rgba(2, 6, 23, 0.34);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, "Segoe UI", system-ui, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 28%),
        radial-gradient(circle at right, rgba(6, 182, 212, 0.14), transparent 26%),
        linear-gradient(180deg, #020617 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    header {
      background: rgba(2, 6, 23, 0.8);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(12px);
    }
    .hero {
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3rem);
      letter-spacing: -0.04em;
    }
    .hero p {
      margin: 8px 0 0;
      color: var(--muted);
      max-width: 720px;
    }
    .pill {
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(99, 102, 241, 0.35);
      background: rgba(99, 102, 241, 0.14);
      color: #c7d2fe;
      white-space: nowrap;
    }
    .layout {
      max-width: 1180px;
      margin: 0 auto;
      padding: 22px 20px 40px;
      display: grid;
      grid-template-columns: 360px minmax(0, 1fr);
      gap: 20px;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 20px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .panel-head {
      padding: 18px 20px 12px;
      border-bottom: 1px solid var(--line);
    }
    .panel-head h2, .panel-head h3 {
      margin: 0;
      font-size: 1.08rem;
    }
    .panel-head p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 0.92rem;
    }
    .panel-body {
      padding: 18px 20px 20px;
      display: grid;
      gap: 18px;
    }
    .dropzone {
      border: 2px dashed rgba(99, 102, 241, 0.4);
      border-radius: 18px;
      padding: 24px 18px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
      background: rgba(15, 23, 42, 0.9);
    }
    .dropzone:hover, .dropzone.dragover {
      border-color: var(--accent-2);
      background: rgba(14, 116, 144, 0.18);
    }
    .dropzone strong {
      display: block;
      font-size: 1.02rem;
      margin-bottom: 8px;
    }
    .dropzone span {
      color: var(--muted);
      line-height: 1.5;
      font-size: 0.92rem;
    }
    .file-name {
      margin-top: 8px;
      color: #cbd5e1;
      font-size: 0.88rem;
      word-break: break-word;
    }
    input[type="file"] { display: none; }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    label {
      display: grid;
      gap: 8px;
      color: #cbd5e1;
      font-size: 0.9rem;
      font-weight: 600;
    }
    input[type="number"], select, input[type="range"] {
      width: 100%;
    }
    input[type="number"], select {
      appearance: none;
      border: 1px solid rgba(148, 163, 184, 0.24);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.88);
      color: var(--text);
      padding: 12px 14px;
      font-size: 0.98rem;
    }
    input[type="number"]:focus, select:focus {
      outline: none;
      border-color: rgba(99, 102, 241, 0.7);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
    }
    .inline {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .checkbox {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #cbd5e1;
      user-select: none;
    }
    .checkbox input {
      width: 18px;
      height: 18px;
      accent-color: #6366f1;
    }
    .quality-row {
      display: grid;
      gap: 10px;
      padding: 14px;
      border-radius: 14px;
      background: rgba(30, 41, 59, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .quality-row.hidden { display: none; }
    .range-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      color: #cbd5e1;
      font-size: 0.9rem;
      font-weight: 600;
    }
    input[type="range"] {
      accent-color: #06b6d4;
    }
    button {
      appearance: none;
      border: 0;
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    button:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }
    .primary {
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      color: white;
    }
    .secondary {
      background: rgba(148, 163, 184, 0.12);
      color: var(--text);
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .stat {
      padding: 14px;
      border-radius: 14px;
      background: rgba(30, 41, 59, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .stat small {
      display: block;
      margin-bottom: 6px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.76rem;
    }
    .stat strong {
      font-size: 1rem;
      font-variant-numeric: tabular-nums;
    }
    .status {
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 0.92rem;
      line-height: 1.5;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.2);
      color: #c7d2fe;
    }
    .status.error {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(248, 113, 113, 0.28);
      color: #fecaca;
    }
    .workspace {
      display: grid;
      gap: 20px;
    }
    .preview-shell {
      padding: 18px;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9)),
        linear-gradient(45deg, rgba(99, 102, 241, 0.08), transparent);
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .preview-shell canvas {
      width: 100%;
      max-width: 100%;
      display: block;
      border-radius: 14px;
      background:
        linear-gradient(45deg, #ffffff 25%, #f1f5f9 25%, #f1f5f9 50%, #ffffff 50%, #ffffff 75%, #f1f5f9 75%, #f1f5f9 100%);
      background-size: 28px 28px;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
    }
    .preview-note {
      margin-top: 12px;
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .source-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 220px;
      border-radius: 18px;
      border: 1px dashed rgba(148, 163, 184, 0.18);
      background: rgba(2, 6, 23, 0.54);
      overflow: hidden;
    }
    .source-preview img {
      max-width: 100%;
      max-height: 420px;
      display: block;
    }
    .placeholder {
      color: var(--muted);
      font-size: 0.98rem;
      text-align: center;
      padding: 24px;
      line-height: 1.6;
    }
    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 560px) {
      .grid-2, .stats {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="hero">
      <div>
        <h1>Image Resizer</h1>
        <p>Resize local images to exact dimensions, choose PNG, JPEG, or WebP, tune output quality, preview the result, and download instantly.</p>
      </div>
      <div class="pill">Browser canvas only • No uploads</div>
    </div>
  </header>

  <main class="layout">
    <section class="panel">
      <div class="panel-head">
        <h2>Resize settings</h2>
        <p>Load an image, set a target size, and export the resized version from the browser.</p>
      </div>
      <div class="panel-body">
        <label class="dropzone" id="dropzone" for="fileInput">
          <strong>Drop an image here</strong>
          <span>or click to browse. The original file never leaves your device.</span>
          <div class="file-name" id="fileName">No file selected yet.</div>
        </label>
        <input id="fileInput" type="file" accept="image/*">

        <div class="stats">
          <div class="stat">
            <small>Original dimensions</small>
            <strong id="originalDimensions">—</strong>
          </div>
          <div class="stat">
            <small>Estimated output size</small>
            <strong id="outputSize">—</strong>
          </div>
          <div class="stat">
            <small>Target dimensions</small>
            <strong id="targetDimensions">—</strong>
          </div>
          <div class="stat">
            <small>Output format</small>
            <strong id="outputFormatLabel">PNG</strong>
          </div>
        </div>

        <div class="grid-2">
          <label>
            Width (px)
            <input id="widthInput" type="number" min="1" step="1" placeholder="Width">
          </label>
          <label>
            Height (px)
            <input id="heightInput" type="number" min="1" step="1" placeholder="Height">
          </label>
        </div>

        <div class="inline">
          <label class="checkbox">
            <input id="lockAspect" type="checkbox" checked>
            Lock aspect ratio
          </label>
        </div>

        <div class="grid-2">
          <label>
            Output format
            <select id="formatSelect">
              <option value="png" selected>PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
          <label>
            Download action
            <button id="resizeButton" class="primary" type="button" disabled>Resize &amp; Download</button>
          </label>
        </div>

        <div id="qualityRow" class="quality-row hidden">
          <div class="range-header">
            <span>Quality</span>
            <strong id="qualityValue">92%</strong>
          </div>
          <input id="qualityInput" type="range" min="0" max="100" value="92">
        </div>

        <button id="resetButton" class="secondary" type="button" disabled>Reset</button>

        <div id="statusBox" class="status">Choose an image to populate the dimensions and enable the resizer controls.</div>
      </div>
    </section>

    <section class="workspace">
      <section class="panel">
        <div class="panel-head">
          <h3>Original image</h3>
          <p>The source preview is shown here after loading.</p>
        </div>
        <div class="panel-body">
          <div class="source-preview" id="sourcePreview">
            <div class="placeholder">Load an image to see the original preview.</div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h3>Resized preview</h3>
          <p>The canvas below is redrawn at your chosen size before download.</p>
        </div>
        <div class="panel-body">
          <div class="preview-shell">
            <canvas id="outputCanvas" width="640" height="360"></canvas>
            <div class="preview-note" id="previewNote">Resize an image to generate a new preview and a downloadable file.</div>
          </div>
        </div>
      </section>
    </section>
  </main>

  <script>
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const fileName = document.getElementById('fileName');
    const sourcePreview = document.getElementById('sourcePreview');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const lockAspect = document.getElementById('lockAspect');
    const formatSelect = document.getElementById('formatSelect');
    const qualityRow = document.getElementById('qualityRow');
    const qualityInput = document.getElementById('qualityInput');
    const qualityValue = document.getElementById('qualityValue');
    const resizeButton = document.getElementById('resizeButton');
    const resetButton = document.getElementById('resetButton');
    const originalDimensions = document.getElementById('originalDimensions');
    const outputSize = document.getElementById('outputSize');
    const targetDimensions = document.getElementById('targetDimensions');
    const outputFormatLabel = document.getElementById('outputFormatLabel');
    const statusBox = document.getElementById('statusBox');
    const outputCanvas = document.getElementById('outputCanvas');
    const outputCtx = outputCanvas.getContext('2d');
    const previewNote = document.getElementById('previewNote');

    const state = {
      image: null,
      imageName: 'resized-image',
      aspectRatio: 1
    };

    function setStatus(message, isError) {
      statusBox.textContent = message;
      statusBox.classList.toggle('error', Boolean(isError));
    }

    function formatDimensions(width, height) {
      return width + ' × ' + height + ' px';
    }

    function formatBytes(bytes) {
      if (!bytes || bytes < 1) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      let value = bytes;
      let index = 0;
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
      }
      return value.toFixed(value >= 10 || index === 0 ? 0 : 1) + ' ' + units[index];
    }

    function updateQualityVisibility() {
      const format = formatSelect.value;
      const visible = format === 'jpeg' || format === 'webp';
      qualityRow.classList.toggle('hidden', !visible);
      outputFormatLabel.textContent = format.toUpperCase();
    }

    function updateTargetLabel() {
      const width = parseInt(widthInput.value, 10);
      const height = parseInt(heightInput.value, 10);
      if (width > 0 && height > 0) {
        targetDimensions.textContent = formatDimensions(width, height);
      } else {
        targetDimensions.textContent = '—';
      }
    }

    function enableControls(enabled) {
      resizeButton.disabled = !enabled;
      resetButton.disabled = !enabled;
      widthInput.disabled = !enabled;
      heightInput.disabled = !enabled;
      formatSelect.disabled = !enabled;
      qualityInput.disabled = !enabled;
      lockAspect.disabled = !enabled;
    }

    function drawPlaceholder() {
      outputCanvas.width = 640;
      outputCanvas.height = 360;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      const gradient = outputCtx.createLinearGradient(0, 0, outputCanvas.width, outputCanvas.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      outputCtx.fillStyle = gradient;
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      outputCtx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
      outputCtx.setLineDash([10, 10]);
      outputCtx.strokeRect(24, 24, outputCanvas.width - 48, outputCanvas.height - 48);
      outputCtx.setLineDash([]);
      outputCtx.textAlign = 'center';
      outputCtx.fillStyle = '#e2e8f0';
      outputCtx.font = '600 28px Inter, Segoe UI, sans-serif';
      outputCtx.fillText('Resized preview appears here', outputCanvas.width / 2, outputCanvas.height / 2 - 6);
      outputCtx.fillStyle = '#94a3b8';
      outputCtx.font = '16px Inter, Segoe UI, sans-serif';
      outputCtx.fillText('Choose an image and resize settings to generate a result.', outputCanvas.width / 2, outputCanvas.height / 2 + 28);
      outputCtx.textAlign = 'start';
    }

    function updateSourcePreview(dataUrl) {
      sourcePreview.innerHTML = '';
      const image = document.createElement('img');
      image.src = dataUrl;
      image.alt = 'Source preview';
      sourcePreview.appendChild(image);
    }

    function updateAspectFromWidth() {
      if (!state.image || !lockAspect.checked) return;
      const width = Math.max(1, parseInt(widthInput.value, 10) || 1);
      heightInput.value = Math.max(1, Math.round(width / state.aspectRatio));
      updateTargetLabel();
    }

    function updateAspectFromHeight() {
      if (!state.image || !lockAspect.checked) return;
      const height = Math.max(1, parseInt(heightInput.value, 10) || 1);
      widthInput.value = Math.max(1, Math.round(height * state.aspectRatio));
      updateTargetLabel();
    }

    function dataUrlSize(dataUrl) {
      const base64 = dataUrl.split(',')[1] || '';
      const padding = (base64.match(/=+$/) || [''])[0].length;
      return Math.max(0, Math.ceil(base64.length * 3 / 4) - padding);
    }

    function mimeTypeForFormat(format) {
      if (format === 'jpeg') return 'image/jpeg';
      if (format === 'webp') return 'image/webp';
      return 'image/png';
    }

    function makeDownloadName(format) {
      const base = state.imageName || 'resized-image';
      const extension = format === 'jpeg' ? 'jpg' : format;
      return base + '-resized.' + extension;
    }

    function loadFile(file) {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        setStatus('Please choose a valid image file.', true);
        return;
      }

      const reader = new FileReader();
      reader.onload = function(event) {
        const image = new Image();
        image.onload = function() {
          state.image = image;
          state.imageName = (file.name || 'resized-image').replace(/\.[^.]+$/, '');
          state.aspectRatio = image.naturalWidth / image.naturalHeight;

          widthInput.value = image.naturalWidth;
          heightInput.value = image.naturalHeight;
          originalDimensions.textContent = formatDimensions(image.naturalWidth, image.naturalHeight);
          targetDimensions.textContent = formatDimensions(image.naturalWidth, image.naturalHeight);
          fileName.textContent = file.name + ' • ' + formatDimensions(image.naturalWidth, image.naturalHeight);
          outputSize.textContent = '—';
          updateSourcePreview(event.target.result);
          enableControls(true);
          updateQualityVisibility();
          setStatus('Image loaded. Adjust dimensions and click Resize & Download.');
          previewNote.textContent = 'The resized image will appear here after you render it.';
        };
        image.onerror = function() {
          setStatus('The selected file could not be decoded as an image.', true);
        };
        image.src = event.target.result;
      };
      reader.onerror = function() {
        setStatus('The selected file could not be read.', true);
      };
      reader.readAsDataURL(file);
    }

    function resetTool() {
      if (!state.image) return;
      widthInput.value = state.image.naturalWidth;
      heightInput.value = state.image.naturalHeight;
      formatSelect.value = 'png';
      qualityInput.value = 92;
      qualityValue.textContent = '92%';
      outputSize.textContent = '—';
      updateQualityVisibility();
      updateTargetLabel();
      drawPlaceholder();
      previewNote.textContent = 'Settings reset. Click Resize & Download to render the output again.';
      setStatus('Dimensions and format reset to their defaults.');
    }

    function renderAndDownload() {
      if (!state.image) {
        setStatus('Load an image before resizing.', true);
        return;
      }

      const width = Math.max(1, parseInt(widthInput.value, 10) || 0);
      const height = Math.max(1, parseInt(heightInput.value, 10) || 0);
      if (!width || !height) {
        setStatus('Width and height must both be positive integers.', true);
        return;
      }

      const format = formatSelect.value;
      const mime = mimeTypeForFormat(format);
      const quality = parseInt(qualityInput.value, 10) / 100;

      outputCanvas.width = width;
      outputCanvas.height = height;
      outputCtx.clearRect(0, 0, width, height);

      if (format === 'jpeg') {
        outputCtx.fillStyle = '#ffffff';
        outputCtx.fillRect(0, 0, width, height);
      }

      outputCtx.imageSmoothingEnabled = true;
      outputCtx.imageSmoothingQuality = 'high';
      outputCtx.drawImage(state.image, 0, 0, width, height);

      const dataUrl = format === 'png'
        ? outputCanvas.toDataURL(mime)
        : outputCanvas.toDataURL(mime, quality);

      const estimatedBytes = dataUrlSize(dataUrl);
      outputSize.textContent = formatBytes(estimatedBytes);
      targetDimensions.textContent = formatDimensions(width, height);
      previewNote.textContent = 'Rendered at ' + formatDimensions(width, height) + ' as ' + format.toUpperCase() + '.';

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = makeDownloadName(format);
      link.click();

      setStatus('Resized image rendered and download started.');
    }

    dropzone.addEventListener('click', function() {
      fileInput.click();
    });

    dropzone.addEventListener('dragover', function(event) {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', function() {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', function(event) {
      event.preventDefault();
      dropzone.classList.remove('dragover');
      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        loadFile(event.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', function(event) {
      if (event.target.files && event.target.files[0]) {
        loadFile(event.target.files[0]);
      }
    });

    widthInput.addEventListener('input', function() {
      if (lockAspect.checked) updateAspectFromWidth();
      updateTargetLabel();
    });

    heightInput.addEventListener('input', function() {
      if (lockAspect.checked) updateAspectFromHeight();
      updateTargetLabel();
    });

    lockAspect.addEventListener('change', function() {
      if (lockAspect.checked) {
        updateAspectFromWidth();
      }
    });

    formatSelect.addEventListener('change', function() {
      updateQualityVisibility();
    });

    qualityInput.addEventListener('input', function() {
      qualityValue.textContent = qualityInput.value + '%';
    });

    resizeButton.addEventListener('click', renderAndDownload);
    resetButton.addEventListener('click', resetTool);

    enableControls(false);
    updateQualityVisibility();
    updateTargetLabel();
    drawPlaceholder();
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

function textHeaders() {
  return { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
