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
      JSON.stringify({ ok: true, message: 'This tool runs entirely in the browser. Load GET / to use the UI.' }),
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
  <title>Image Cropper</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0f172a;
      --panel: #111827;
      --panel-alt: #1f2937;
      --line: rgba(148, 163, 184, 0.18);
      --text: #e5eefb;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-2: #22c55e;
      --danger: #f97316;
      --shadow: 0 24px 48px rgba(2, 8, 23, 0.32);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, "Segoe UI", system-ui, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 28%),
        radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 30%),
        linear-gradient(180deg, #020617 0%, var(--bg) 100%);
      color: var(--text);
      min-height: 100vh;
    }
    .hero {
      background: rgba(2, 6, 23, 0.78);
      border-bottom: 1px solid var(--line);
      padding: 28px 20px;
      backdrop-filter: blur(12px);
    }
    .hero-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
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
    .badge {
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #bae6fd;
      background: rgba(14, 165, 233, 0.12);
      font-size: 0.9rem;
      white-space: nowrap;
    }
    .app {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px 40px;
      display: grid;
      grid-template-columns: 360px minmax(0, 1fr);
      gap: 20px;
    }
    .panel {
      background: rgba(15, 23, 42, 0.88);
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
    }
    .stack {
      display: grid;
      gap: 18px;
    }
    .dropzone {
      border: 2px dashed rgba(56, 189, 248, 0.38);
      border-radius: 18px;
      padding: 24px 18px;
      background: rgba(15, 23, 42, 0.95);
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
    }
    .dropzone:hover, .dropzone.dragover {
      border-color: var(--accent);
      background: rgba(12, 74, 110, 0.22);
      transform: translateY(-1px);
    }
    .dropzone strong {
      display: block;
      font-size: 1.02rem;
      margin-bottom: 8px;
    }
    .dropzone span {
      display: block;
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }
    input[type="file"] { display: none; }
    .button-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    button {
      appearance: none;
      border: 0;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 0.96rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.26);
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
    .primary {
      background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
      color: white;
      flex: 1 1 180px;
    }
    .secondary {
      background: rgba(148, 163, 184, 0.14);
      color: var(--text);
      border: 1px solid rgba(148, 163, 184, 0.18);
      flex: 1 1 140px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .meta-card {
      padding: 14px;
      background: rgba(30, 41, 59, 0.72);
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    .meta-card small {
      display: block;
      color: var(--muted);
      margin-bottom: 6px;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meta-card strong {
      font-size: 1rem;
      font-variant-numeric: tabular-nums;
    }
    .status {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: #bae6fd;
      font-size: 0.92rem;
      line-height: 1.5;
    }
    .status.error {
      color: #fed7aa;
      border-color: rgba(249, 115, 22, 0.35);
      background: rgba(194, 65, 12, 0.14);
    }
    .tips {
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.6;
      font-size: 0.92rem;
    }
    .tips li + li { margin-top: 8px; }
    .workspace {
      display: grid;
      gap: 20px;
    }
    .canvas-shell {
      padding: 18px;
      background:
        linear-gradient(135deg, rgba(51, 65, 85, 0.36), rgba(15, 23, 42, 0.92)),
        linear-gradient(45deg, rgba(56, 189, 248, 0.06), transparent);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 18px;
    }
    canvas {
      width: 100%;
      max-width: 100%;
      display: block;
      border-radius: 14px;
      background: #020617;
    }
    #imageCanvas {
      touch-action: none;
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.08);
      cursor: crosshair;
    }
    .canvas-note {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 12px;
      color: var(--muted);
      font-size: 0.9rem;
      flex-wrap: wrap;
    }
    .output-card[hidden] { display: none; }
    .output-wrap {
      overflow: auto;
    }
    #outputCanvas {
      max-height: 360px;
      width: auto;
      max-width: 100%;
      background: white;
      border-radius: 14px;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
    }
    .file-name {
      color: var(--muted);
      font-size: 0.9rem;
      margin-top: 6px;
      word-break: break-word;
    }
    @media (max-width: 980px) {
      .app {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <div>
        <h1>Image Cropper</h1>
        <p>Drop in a local image, drag to define the crop area, fine-tune with corner handles, and download a PNG instantly.</p>
      </div>
      <div class="badge">Client-side only • No uploads</div>
    </div>
  </header>

  <main class="app">
    <section class="panel">
      <div class="panel-head">
        <h2>Controls</h2>
        <p>Load an image, adjust the crop rectangle, then export the selected area.</p>
      </div>
      <div class="panel-body">
        <div class="stack">
          <label class="dropzone" id="dropzone" for="fileInput">
            <strong>Drop an image here</strong>
            <span>or click to browse your device. PNG, JPEG, WebP, GIF, BMP, and SVG files supported.</span>
            <div class="file-name" id="fileName">No file selected yet.</div>
          </label>
          <input id="fileInput" type="file" accept="image/*">

          <div class="button-row">
            <button id="cropButton" class="primary" disabled>Crop &amp; Download</button>
            <button id="resetButton" class="secondary" disabled>Reset</button>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <small>Original image</small>
              <strong id="originalInfo">—</strong>
            </div>
            <div class="meta-card">
              <small>Selected crop</small>
              <strong id="selectionInfo">—</strong>
            </div>
            <div class="meta-card">
              <small>Crop coordinates</small>
              <strong id="coordsInfo">—</strong>
            </div>
            <div class="meta-card">
              <small>Drag hint</small>
              <strong id="dragInfo">Load an image to begin.</strong>
            </div>
          </div>

          <div id="statusBox" class="status">All cropping happens in your browser. Nothing is uploaded or sent back to the worker.</div>

          <ul class="tips">
            <li>Drag inside the highlighted rectangle to move it.</li>
            <li>Drag the corner handles to resize the crop area precisely.</li>
            <li>Click anywhere outside the current crop to start a new selection.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="workspace">
      <section class="panel">
        <div class="panel-head">
          <h3>Interactive canvas</h3>
          <p>Use mouse, trackpad, or touch to position the crop.</p>
        </div>
        <div class="panel-body">
          <div class="canvas-shell">
            <canvas id="imageCanvas" width="960" height="540"></canvas>
            <div class="canvas-note">
              <span id="canvasHint">The selection overlay updates in real time as you drag.</span>
              <span>Corner handles: top-left, top-right, bottom-left, bottom-right</span>
            </div>
          </div>
        </div>
      </section>

      <section class="panel output-card" id="outputCard" hidden>
        <div class="panel-head">
          <h3>Cropped output</h3>
          <p>The PNG preview below is generated from a second canvas just before download.</p>
        </div>
        <div class="panel-body output-wrap">
          <canvas id="outputCanvas"></canvas>
        </div>
      </section>
    </section>
  </main>

  <script>
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const fileName = document.getElementById('fileName');
    const cropButton = document.getElementById('cropButton');
    const resetButton = document.getElementById('resetButton');
    const statusBox = document.getElementById('statusBox');
    const originalInfo = document.getElementById('originalInfo');
    const selectionInfo = document.getElementById('selectionInfo');
    const coordsInfo = document.getElementById('coordsInfo');
    const dragInfo = document.getElementById('dragInfo');
    const canvasHint = document.getElementById('canvasHint');
    const outputCard = document.getElementById('outputCard');
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const outputCanvas = document.getElementById('outputCanvas');
    const outputCtx = outputCanvas.getContext('2d');

    const MAX_PREVIEW_WIDTH = 960;
    const MAX_PREVIEW_HEIGHT = 540;
    const MIN_SELECTION_SIZE = 24;
    const HANDLE_SIZE = 12;
    const HANDLE_HIT_SIZE = 18;

    const state = {
      image: null,
      imageName: 'cropped-image',
      displayScale: 1,
      selection: null,
      dragMode: null,
      resizeHandle: '',
      startPoint: null,
      startRect: null,
      previousSelection: null,
      pointerOffset: { x: 0, y: 0 }
    };

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function setStatus(message, isError) {
      statusBox.textContent = message;
      statusBox.classList.toggle('error', Boolean(isError));
    }

    function formatDimensions(width, height) {
      return width + ' × ' + height + ' px';
    }

    function placeholderCanvas() {
      canvas.width = 960;
      canvas.height = 540;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
      ctx.setLineDash([]);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 28px Inter, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drop an image to start cropping', canvas.width / 2, canvas.height / 2 - 6);
      ctx.font = '16px Inter, Segoe UI, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Your crop selection will appear here with live coordinates.', canvas.width / 2, canvas.height / 2 + 28);
      ctx.textAlign = 'start';
    }

    function updateButtons() {
      const enabled = Boolean(state.image);
      cropButton.disabled = !enabled || !state.selection;
      resetButton.disabled = !enabled;
    }

    function updateInfo() {
      if (!state.image) {
        originalInfo.textContent = '—';
        selectionInfo.textContent = '—';
        coordsInfo.textContent = '—';
        dragInfo.textContent = 'Load an image to begin.';
        return;
      }

      originalInfo.textContent = formatDimensions(state.image.naturalWidth, state.image.naturalHeight);

      if (!state.selection) {
        selectionInfo.textContent = 'No crop selected';
        coordsInfo.textContent = 'X: —  Y: —  W: —  H: —';
      } else {
        const cropRect = selectionToImageRect();
        selectionInfo.textContent = formatDimensions(cropRect.w, cropRect.h);
        coordsInfo.textContent = 'X: ' + cropRect.x + '  Y: ' + cropRect.y + '  W: ' + cropRect.w + '  H: ' + cropRect.h;
      }
    }

    function defaultSelection() {
      const insetX = Math.round(canvas.width * 0.12);
      const insetY = Math.round(canvas.height * 0.12);
      return {
        x: insetX,
        y: insetY,
        w: Math.max(MIN_SELECTION_SIZE, canvas.width - insetX * 2),
        h: Math.max(MIN_SELECTION_SIZE, canvas.height - insetY * 2)
      };
    }

    function selectionToImageRect() {
      const scaleX = state.image.naturalWidth / canvas.width;
      const scaleY = state.image.naturalHeight / canvas.height;
      const rect = state.selection || { x: 0, y: 0, w: 0, h: 0 };
      const x = clamp(Math.round(rect.x * scaleX), 0, state.image.naturalWidth - 1);
      const y = clamp(Math.round(rect.y * scaleY), 0, state.image.naturalHeight - 1);
      const w = Math.max(1, clamp(Math.round(rect.w * scaleX), 1, state.image.naturalWidth - x));
      const h = Math.max(1, clamp(Math.round(rect.h * scaleY), 1, state.image.naturalHeight - y));
      return { x, y, w, h };
    }

    function drawSelectionOverlay() {
      const selection = state.selection;
      if (!selection) return;

      ctx.fillStyle = 'rgba(2, 8, 23, 0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const src = selectionToImageRect();
      ctx.drawImage(state.image, src.x, src.y, src.w, src.h, selection.x, selection.y, selection.w, selection.h);

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(selection.x + selection.w / 3, selection.y);
      ctx.lineTo(selection.x + selection.w / 3, selection.y + selection.h);
      ctx.moveTo(selection.x + selection.w * 2 / 3, selection.y);
      ctx.lineTo(selection.x + selection.w * 2 / 3, selection.y + selection.h);
      ctx.moveTo(selection.x, selection.y + selection.h / 3);
      ctx.lineTo(selection.x + selection.w, selection.y + selection.h / 3);
      ctx.moveTo(selection.x, selection.y + selection.h * 2 / 3);
      ctx.lineTo(selection.x + selection.w, selection.y + selection.h * 2 / 3);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      const handles = getHandles(selection);
      Object.keys(handles).forEach(function(key) {
        const point = handles[key];
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(point.x - HANDLE_SIZE / 2, point.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.fill();
        ctx.stroke();
      });
    }

    function render() {
      if (!state.image) {
        placeholderCanvas();
        updateButtons();
        updateInfo();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height);
      drawSelectionOverlay();
      updateButtons();
      updateInfo();
    }

    function getHandles(rect) {
      return {
        nw: { x: rect.x, y: rect.y },
        ne: { x: rect.x + rect.w, y: rect.y },
        sw: { x: rect.x, y: rect.y + rect.h },
        se: { x: rect.x + rect.w, y: rect.y + rect.h }
      };
    }

    function getPointerPosition(event) {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: clamp((event.clientX - bounds.left) * (canvas.width / bounds.width), 0, canvas.width),
        y: clamp((event.clientY - bounds.top) * (canvas.height / bounds.height), 0, canvas.height)
      };
    }

    function detectHandle(point) {
      if (!state.selection) return '';
      const handles = getHandles(state.selection);
      const keys = Object.keys(handles);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        const handle = handles[key];
        if (Math.abs(point.x - handle.x) <= HANDLE_HIT_SIZE && Math.abs(point.y - handle.y) <= HANDLE_HIT_SIZE) {
          return key;
        }
      }
      return '';
    }

    function pointInsideSelection(point) {
      if (!state.selection) return false;
      return (
        point.x >= state.selection.x &&
        point.x <= state.selection.x + state.selection.w &&
        point.y >= state.selection.y &&
        point.y <= state.selection.y + state.selection.h
      );
    }

    function normalizeRect(startX, startY, endX, endY) {
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      return {
        x: clamp(x, 0, canvas.width),
        y: clamp(y, 0, canvas.height),
        w: Math.abs(endX - startX),
        h: Math.abs(endY - startY)
      };
    }

    function resizeSelection(point) {
      const source = state.startRect;
      let left = source.x;
      let right = source.x + source.w;
      let top = source.y;
      let bottom = source.y + source.h;

      if (state.resizeHandle === 'nw') {
        left = clamp(point.x, 0, right - MIN_SELECTION_SIZE);
        top = clamp(point.y, 0, bottom - MIN_SELECTION_SIZE);
      } else if (state.resizeHandle === 'ne') {
        right = clamp(point.x, left + MIN_SELECTION_SIZE, canvas.width);
        top = clamp(point.y, 0, bottom - MIN_SELECTION_SIZE);
      } else if (state.resizeHandle === 'sw') {
        left = clamp(point.x, 0, right - MIN_SELECTION_SIZE);
        bottom = clamp(point.y, top + MIN_SELECTION_SIZE, canvas.height);
      } else if (state.resizeHandle === 'se') {
        right = clamp(point.x, left + MIN_SELECTION_SIZE, canvas.width);
        bottom = clamp(point.y, top + MIN_SELECTION_SIZE, canvas.height);
      }

      state.selection = { x: left, y: top, w: right - left, h: bottom - top };
    }

    function updateCursorAndHint(point) {
      const handle = detectHandle(point);
      if (handle) {
        const cursorMap = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' };
        const labelMap = {
          nw: 'top-left handle',
          ne: 'top-right handle',
          sw: 'bottom-left handle',
          se: 'bottom-right handle'
        };
        canvas.style.cursor = cursorMap[handle];
        dragInfo.textContent = 'Hovering over the ' + labelMap[handle] + '. Drag to resize the crop.';
        return;
      }

      if (pointInsideSelection(point)) {
        canvas.style.cursor = 'move';
        dragInfo.textContent = 'Drag inside the crop area to move it.';
      } else {
        canvas.style.cursor = 'crosshair';
        dragInfo.textContent = 'Click and drag to draw a new crop rectangle.';
      }
    }

    function resetSelection() {
      if (!state.image) {
        return;
      }
      state.selection = defaultSelection();
      state.dragMode = null;
      state.resizeHandle = '';
      outputCard.hidden = true;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      dragInfo.textContent = 'Selection reset. Drag it or resize with the corner handles.';
      canvasHint.textContent = 'The selection overlay updates in real time as you drag.';
      setStatus('Selection reset to the default crop area.');
      render();
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
          state.imageName = (file.name || 'cropped-image').replace(/\.[^.]+$/, '');
          state.displayScale = Math.min(MAX_PREVIEW_WIDTH / image.naturalWidth, MAX_PREVIEW_HEIGHT / image.naturalHeight, 1);
          canvas.width = Math.max(1, Math.round(image.naturalWidth * state.displayScale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * state.displayScale));
          state.selection = defaultSelection();
          state.dragMode = null;
          state.resizeHandle = '';
          state.startPoint = null;
          state.startRect = null;
          state.previousSelection = null;
          fileName.textContent = file.name + ' • ' + formatDimensions(image.naturalWidth, image.naturalHeight);
          outputCard.hidden = true;
          outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
          canvasHint.textContent = 'Drag the crop, pull the handles, or draw a brand-new selection.';
          setStatus('Image loaded. Adjust the crop rectangle, then click Crop & Download.');
          render();
        };
        image.onerror = function() {
          setStatus('The selected file could not be decoded as an image.', true);
        };
        image.src = event.target.result;
      };
      reader.onerror = function() {
        setStatus('The file could not be read in the browser.', true);
      };
      reader.readAsDataURL(file);
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

    canvas.addEventListener('pointerdown', function(event) {
      if (!state.image) return;
      const point = getPointerPosition(event);
      const handle = detectHandle(point);

      canvas.setPointerCapture(event.pointerId);
      state.startPoint = point;
      state.startRect = state.selection ? { x: state.selection.x, y: state.selection.y, w: state.selection.w, h: state.selection.h } : null;

      if (handle) {
        state.dragMode = 'resize';
        state.resizeHandle = handle;
        dragInfo.textContent = 'Resizing from the ' + handle.toUpperCase() + ' corner handle.';
      } else if (pointInsideSelection(point)) {
        state.dragMode = 'move';
        state.pointerOffset = { x: point.x - state.selection.x, y: point.y - state.selection.y };
        dragInfo.textContent = 'Moving the crop selection.';
      } else {
        state.dragMode = 'create';
        state.resizeHandle = '';
        state.previousSelection = state.selection ? { x: state.selection.x, y: state.selection.y, w: state.selection.w, h: state.selection.h } : null;
        state.selection = { x: point.x, y: point.y, w: 0, h: 0 };
        dragInfo.textContent = 'Drawing a new crop selection.';
      }

      render();
    });

    canvas.addEventListener('pointermove', function(event) {
      if (!state.image) return;
      const point = getPointerPosition(event);

      if (!state.dragMode) {
        updateCursorAndHint(point);
        return;
      }

      if (state.dragMode === 'create') {
        state.selection = normalizeRect(state.startPoint.x, state.startPoint.y, point.x, point.y);
        canvasHint.textContent = 'Release to keep the new crop selection.';
      } else if (state.dragMode === 'move') {
        state.selection.x = clamp(point.x - state.pointerOffset.x, 0, canvas.width - state.selection.w);
        state.selection.y = clamp(point.y - state.pointerOffset.y, 0, canvas.height - state.selection.h);
        canvasHint.textContent = 'Moving the crop rectangle within the image bounds.';
      } else if (state.dragMode === 'resize') {
        resizeSelection(point);
        canvasHint.textContent = 'Resizing the crop from the active corner handle.';
      }

      render();
    });

    function finishPointerInteraction(event) {
      if (event && state.image) {
        const point = getPointerPosition(event);
        if (state.dragMode === 'create' && state.selection && (state.selection.w < MIN_SELECTION_SIZE || state.selection.h < MIN_SELECTION_SIZE)) {
          state.selection = state.previousSelection;
          setStatus('The new selection was too small, so the previous crop area was kept.');
        } else if (state.dragMode) {
          setStatus('Crop updated. Coordinates and dimensions refreshed in real time.');
        }
        updateCursorAndHint(point);
      }

      state.dragMode = null;
      state.resizeHandle = '';
      state.startPoint = null;
      state.startRect = null;
      state.previousSelection = null;
      render();
    }

    canvas.addEventListener('pointerup', finishPointerInteraction);
    canvas.addEventListener('pointercancel', finishPointerInteraction);
    canvas.addEventListener('pointerleave', function(event) {
      if (!state.dragMode) return;
      finishPointerInteraction(event);
    });

    cropButton.addEventListener('click', function() {
      if (!state.image || !state.selection) {
        setStatus('Load an image and define a crop before downloading.', true);
        return;
      }

      const cropRect = selectionToImageRect();
      outputCanvas.width = cropRect.w;
      outputCanvas.height = cropRect.h;
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      outputCtx.drawImage(
        state.image,
        cropRect.x,
        cropRect.y,
        cropRect.w,
        cropRect.h,
        0,
        0,
        cropRect.w,
        cropRect.h
      );

      outputCard.hidden = false;

      const link = document.createElement('a');
      link.href = outputCanvas.toDataURL('image/png');
      link.download = state.imageName + '-crop.png';
      link.click();

      setStatus('Cropped PNG prepared and download started.');
    });

    resetButton.addEventListener('click', resetSelection);

    placeholderCanvas();
    updateButtons();
    updateInfo();
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
