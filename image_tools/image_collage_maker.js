addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === 'GET' && url.pathname === '/') {
    return new Response(renderApp(), { status: 200, headers: htmlHeaders() });
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

function renderApp() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Collage Maker</title>
  <style>
    * { box-sizing: border-box; }
    :root {
      color-scheme: dark;
      --bg: #06111f;
      --panel: rgba(9, 18, 33, 0.9);
      --panel-strong: rgba(16, 26, 45, 0.98);
      --border: rgba(148, 163, 184, 0.2);
      --text: #e5eefb;
      --muted: #9fb0c8;
      --brand: #38bdf8;
      --accent: #818cf8;
      --shadow: 0 26px 70px rgba(2, 8, 23, 0.46);
    }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 30%),
        radial-gradient(circle at bottom right, rgba(129, 140, 248, 0.18), transparent 28%),
        linear-gradient(155deg, #08111d 0%, #0d1729 50%, #07111d 100%);
      padding: 24px;
    }
    .app {
      max-width: 1380px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(330px, 430px) minmax(0, 1fr);
      gap: 24px;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }
    .controls {
      padding: 24px;
      position: sticky;
      top: 24px;
      display: grid;
      gap: 22px;
      align-content: start;
    }
    h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 3.6vw, 2.7rem);
      line-height: 1.05;
    }
    .lead {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
    }
    .dropzone {
      border: 2px dashed rgba(125, 211, 252, 0.3);
      border-radius: 20px;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)),
        radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 55%);
      padding: 24px 18px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.18s ease, transform 0.18s ease, background-color 0.18s ease;
    }
    .dropzone.dragover {
      border-color: rgba(56, 189, 248, 0.9);
      transform: translateY(-2px);
      background-color: rgba(56, 189, 248, 0.08);
    }
    .dropzone strong {
      display: block;
      font-size: 1.05rem;
      margin-bottom: 6px;
    }
    .dropzone span {
      color: var(--muted);
      font-size: 0.95rem;
    }
    input[type="file"] { display: none; }
    .section {
      padding-top: 22px;
      border-top: 1px solid rgba(148, 163, 184, 0.14);
    }
    .section:first-of-type {
      padding-top: 0;
      border-top: 0;
    }
    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #dae8fb;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .layout-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .layout-option {
      position: relative;
    }
    .layout-option input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .layout-option span {
      display: grid;
      place-items: center;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: var(--panel-strong);
      font-weight: 700;
      cursor: pointer;
      transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
    }
    .layout-option input:checked + span {
      border-color: rgba(56, 189, 248, 0.9);
      background: rgba(56, 189, 248, 0.16);
      transform: translateY(-1px);
    }
    label.control {
      display: grid;
      gap: 8px;
      color: #dae8fb;
      font-size: 0.95rem;
    }
    input[type="range"] {
      width: 100%;
      accent-color: #38bdf8;
    }
    input[type="number"],
    input[type="color"] {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 14px;
      background: var(--panel-strong);
      color: var(--text);
      padding: 12px 14px;
      font: inherit;
    }
    input[type="color"] {
      min-height: 48px;
      padding: 6px;
      cursor: pointer;
    }
    .value-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 56px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.85rem;
      background: rgba(56, 189, 248, 0.14);
      border: 1px solid rgba(56, 189, 248, 0.18);
      color: #e0f2fe;
    }
    .thumb-list {
      display: grid;
      gap: 12px;
      max-height: 320px;
      overflow: auto;
      padding-right: 4px;
    }
    .thumb-card {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 10px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(15, 23, 42, 0.55);
    }
    .thumb-card img {
      width: 92px;
      height: 92px;
      object-fit: cover;
      border-radius: 14px;
      display: block;
    }
    .thumb-meta {
      min-width: 0;
    }
    .thumb-name {
      margin: 0 0 6px;
      font-weight: 700;
      word-break: break-word;
    }
    .thumb-size {
      margin: 0;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .thumb-remove {
      background: rgba(239, 68, 68, 0.12);
      color: #fecaca;
      border: 1px solid rgba(239, 68, 68, 0.28);
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }
    button:hover { transform: translateY(-1px); }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .primary {
      color: #04111e;
      background: linear-gradient(135deg, #7dd3fc, #38bdf8);
    }
    .secondary {
      color: var(--text);
      background: rgba(15, 23, 42, 0.76);
      border: 1px solid rgba(148, 163, 184, 0.24);
    }
    .preview {
      padding: 24px;
      display: grid;
      gap: 16px;
    }
    .preview-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .preview-head h2 {
      margin: 0;
      font-size: 1.3rem;
    }
    .preview-head p {
      margin: 4px 0 0;
      color: var(--muted);
    }
    .canvas-shell {
      min-height: 620px;
      display: grid;
      place-items: center;
      border-radius: 24px;
      overflow: hidden;
      background:
        linear-gradient(45deg, rgba(30, 41, 59, 0.75) 25%, transparent 25%, transparent 75%, rgba(30, 41, 59, 0.75) 75%),
        linear-gradient(45deg, rgba(30, 41, 59, 0.75) 25%, transparent 25%, transparent 75%, rgba(30, 41, 59, 0.75) 75%);
      background-size: 32px 32px;
      background-position: 0 0, 16px 16px;
      border: 1px solid rgba(148, 163, 184, 0.16);
    }
    canvas {
      max-width: 100%;
      max-height: 80vh;
      display: block;
      background: #111827;
    }
    .status {
      min-height: 1.4em;
      color: var(--muted);
      font-size: 0.95rem;
    }
    @media (max-width: 1120px) {
      .app { grid-template-columns: 1fr; }
      .controls { position: static; }
    }
    @media (max-width: 720px) {
      body { padding: 16px; }
      .controls, .preview { padding: 18px; }
      .layout-grid { grid-template-columns: 1fr 1fr; }
      .thumb-card { grid-template-columns: 72px minmax(0, 1fr); }
      .thumb-card img { width: 72px; height: 72px; }
      .thumb-remove { grid-column: 1 / -1; justify-self: start; }
      .canvas-shell { min-height: 380px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="panel controls">
      <div>
        <h1>Image Collage Maker</h1>
        <p class="lead">Drop in up to 9 images, pick a preset grid, tweak spacing and background color, then render a download-ready collage entirely in the browser.</p>
      </div>

      <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Upload images">
        <strong>Drop images here or click to browse</strong>
        <span>Supports multiple image files. The newest uploads fill the next collage cells.</span>
      </div>
      <input id="fileInput" type="file" accept="image/*" multiple>

      <div class="section">
        <div class="section-title">
          <span>Grid layout</span>
          <span class="value-pill" id="layoutValue">2 × 2</span>
        </div>
        <div class="layout-grid" id="layoutGrid">
          <label class="layout-option"><input type="radio" name="layout" value="1x2"><span>1 × 2</span></label>
          <label class="layout-option"><input type="radio" name="layout" value="2x1"><span>2 × 1</span></label>
          <label class="layout-option"><input type="radio" name="layout" value="2x2" checked><span>2 × 2</span></label>
          <label class="layout-option"><input type="radio" name="layout" value="2x3"><span>2 × 3</span></label>
          <label class="layout-option"><input type="radio" name="layout" value="3x2"><span>3 × 2</span></label>
          <label class="layout-option"><input type="radio" name="layout" value="3x3"><span>3 × 3</span></label>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span>Gap & padding</span>
          <span class="value-pill" id="gapValue">8 px</span>
        </div>
        <input id="gapInput" type="range" min="0" max="20" value="8">
      </div>

      <div class="section">
        <label class="control">
          Background color
          <input id="bgColorInput" type="color" value="#0f172a">
        </label>
      </div>

      <div class="section">
        <label class="control">
          Canvas width
          <input id="widthInput" type="number" min="320" max="2400" step="10" value="800">
        </label>
      </div>

      <div class="actions">
        <button class="primary" id="buildBtn" type="button">Build Collage</button>
        <button class="secondary" id="downloadBtn" type="button" disabled>Download PNG</button>
      </div>

      <div class="section">
        <div class="section-title">
          <span>Uploaded images</span>
          <span class="value-pill" id="countValue">0 / 9</span>
        </div>
        <div class="thumb-list" id="thumbList"></div>
      </div>
    </aside>

    <section class="panel preview">
      <div class="preview-head">
        <div>
          <h2>Collage output</h2>
          <p>Images are center-cropped into square cells using object-fit cover logic for a clean, even grid.</p>
        </div>
        <div class="value-pill" id="canvasInfo">800 × 800</div>
      </div>
      <div class="canvas-shell">
        <canvas id="collageCanvas" width="800" height="800"></canvas>
      </div>
      <div class="status" id="status">Upload a few images to build your collage.</div>
    </section>
  </div>

  <script>
    const MAX_IMAGES = 9;
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const thumbList = document.getElementById('thumbList');
    const gapInput = document.getElementById('gapInput');
    const gapValue = document.getElementById('gapValue');
    const bgColorInput = document.getElementById('bgColorInput');
    const widthInput = document.getElementById('widthInput');
    const layoutValue = document.getElementById('layoutValue');
    const countValue = document.getElementById('countValue');
    const buildBtn = document.getElementById('buildBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusEl = document.getElementById('status');
    const canvasInfo = document.getElementById('canvasInfo');
    const canvas = document.getElementById('collageCanvas');
    const ctx = canvas.getContext('2d');

    const images = [];

    updateControls();
    renderPlaceholder();

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(type => {
      dropzone.addEventListener(type, event => {
        event.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach(type => {
      dropzone.addEventListener(type, event => {
        event.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', event => {
      handleFiles(event.dataTransfer && event.dataTransfer.files);
    });

    fileInput.addEventListener('change', event => {
      handleFiles(event.target.files);
      fileInput.value = '';
    });

    document.getElementById('layoutGrid').addEventListener('change', updateControls);
    gapInput.addEventListener('input', updateControls);
    widthInput.addEventListener('input', updateControls);
    bgColorInput.addEventListener('input', () => {
      if (images.length) renderCollage();
    });

    buildBtn.addEventListener('click', () => {
      renderCollage();
    });

    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'image-collage.png';
      link.click();
    });

    thumbList.addEventListener('click', event => {
      const button = event.target.closest('[data-remove-id]');
      if (!button) return;
      const index = images.findIndex(item => item.id === button.dataset.removeId);
      if (index >= 0) {
        images.splice(index, 1);
        renderThumbs();
        updateControls();
        if (images.length) {
          renderCollage();
        } else {
          renderPlaceholder();
        }
      }
    });

    async function handleFiles(fileList) {
      const files = Array.from(fileList || []).filter(file => file.type.startsWith('image/'));
      if (!files.length) {
        setStatus('Please choose one or more image files.');
        return;
      }

      const availableSlots = Math.max(0, MAX_IMAGES - images.length);
      const filesToLoad = files.slice(0, availableSlots);
      if (!filesToLoad.length) {
        setStatus('You already have 9 images loaded. Remove one before adding more.');
        return;
      }

      try {
        const loaded = await Promise.all(filesToLoad.map(loadImageFile));
        loaded.forEach(entry => images.push(entry));
        renderThumbs();
        updateControls();
        renderCollage();
        if (files.length > filesToLoad.length) {
          setStatus('Added ' + filesToLoad.length + ' images. Extra files were ignored because the collage is limited to 9 images.');
        } else {
          setStatus('Added ' + filesToLoad.length + ' image' + (filesToLoad.length === 1 ? '' : 's') + '.');
        }
      } catch (error) {
        setStatus(error.message || 'Some images could not be loaded.');
      }
    }

    function loadImageFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const image = new Image();
          image.onload = () => {
            resolve({
              id: crypto.randomUUID(),
              name: file.name,
              size: file.size,
              previewUrl: reader.result,
              image
            });
          };
          image.onerror = () => reject(new Error('An uploaded image could not be decoded.'));
          image.src = reader.result;
        };
        reader.onerror = () => reject(new Error('An uploaded file could not be read.'));
        reader.readAsDataURL(file);
      });
    }

    function renderThumbs() {
      thumbList.innerHTML = images.map(item => {
        return '<div class="thumb-card">' +
          '<img src="' + item.previewUrl + '" alt="Uploaded image preview">' +
          '<div class="thumb-meta">' +
            '<p class="thumb-name">' + escapeHtml(item.name) + '</p>' +
            '<p class="thumb-size">' + formatFileSize(item.size) + ' · ' + item.image.width + ' × ' + item.image.height + '</p>' +
          '</div>' +
          '<button class="thumb-remove" type="button" data-remove-id="' + item.id + '">Remove</button>' +
        '</div>';
      }).join('');
      countValue.textContent = images.length + ' / ' + MAX_IMAGES;
    }

    function updateControls() {
      const layout = getSelectedLayout();
      layoutValue.textContent = layout.rows + ' × ' + layout.cols;
      gapValue.textContent = gapInput.value + ' px';
      countValue.textContent = images.length + ' / ' + MAX_IMAGES;
      buildBtn.disabled = images.length === 0;
      if (!images.length) downloadBtn.disabled = true;
    }

    function renderCollage() {
      if (!images.length) {
        renderPlaceholder();
        return;
      }

      const { rows, cols } = getSelectedLayout();
      const gap = Number(gapInput.value);
      const requestedWidth = Math.min(2400, Math.max(320, Number(widthInput.value) || 800));
      widthInput.value = String(requestedWidth);
      const cellSize = (requestedWidth - gap * (cols + 1)) / cols;
      const canvasHeight = Math.max(320, Math.round(gap * (rows + 1) + cellSize * rows));

      canvas.width = requestedWidth;
      canvas.height = canvasHeight;
      ctx.fillStyle = bgColorInput.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const capacity = rows * cols;
      const renderCount = Math.min(images.length, capacity);
      for (let index = 0; index < renderCount; index += 1) {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = gap + col * (cellSize + gap);
        const y = gap + row * (cellSize + gap);
        drawCover(images[index].image, x, y, cellSize, cellSize);
      }

      canvasInfo.textContent = canvas.width + ' × ' + canvas.height;
      downloadBtn.disabled = false;

      if (images.length > capacity) {
        setStatus('Collage built with the first ' + capacity + ' images. Switch to a larger layout to include the rest.');
      } else {
        setStatus('Collage built successfully with ' + renderCount + ' image' + (renderCount === 1 ? '' : 's') + '.');
      }
    }

    function renderPlaceholder() {
      canvas.width = 800;
      canvas.height = 800;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#1f2937');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 6;
      ctx.setLineDash([18, 14]);
      ctx.strokeRect(canvas.width * 0.12, canvas.height * 0.12, canvas.width * 0.76, canvas.height * 0.76);
      ctx.setLineDash([]);
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.font = '700 34px Inter, Arial, sans-serif';
      ctx.fillText('Upload images to start', canvas.width / 2, canvas.height / 2);
      canvasInfo.textContent = canvas.width + ' × ' + canvas.height;
      setStatus('Upload a few images to build your collage.');
    }

    function drawCover(image, x, y, width, height) {
      const imageRatio = image.width / image.height;
      const frameRatio = width / height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.width;
      let sourceHeight = image.height;

      if (imageRatio > frameRatio) {
        sourceWidth = image.height * frameRatio;
        sourceX = (image.width - sourceWidth) / 2;
      } else {
        sourceHeight = image.width / frameRatio;
        sourceY = (image.height - sourceHeight) / 2;
      }

      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    }

    function getSelectedLayout() {
      const checked = document.querySelector('input[name="layout"]:checked');
      const value = checked ? checked.value : '2x2';
      const parts = value.split('x').map(Number);
      return { rows: parts[0], cols: parts[1] };
    }

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function setStatus(message) {
      statusEl.textContent = message;
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
}

function htmlHeaders() {
  return { 'Content-Type': 'text/html; charset=UTF-8', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function textHeaders() {
  return { 'Content-Type': 'text/plain; charset=UTF-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json; charset=UTF-8', ...corsHeaders() };
}
