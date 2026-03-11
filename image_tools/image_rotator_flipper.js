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
      JSON.stringify({ ok: true, message: 'All rotation and flip operations run in the browser. Open GET / to use the tool.' }),
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
  <title>Image Rotator & Flipper</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1020;
      --panel: rgba(15, 23, 42, 0.9);
      --line: rgba(148, 163, 184, 0.18);
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #14b8a6;
      --accent-2: #22c55e;
      --shadow: 0 26px 50px rgba(2, 6, 23, 0.34);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, "Segoe UI", system-ui, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 28%),
        radial-gradient(circle at right, rgba(34, 197, 94, 0.14), transparent 26%),
        linear-gradient(180deg, #020617 0%, var(--bg) 100%);
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
      border: 1px solid rgba(20, 184, 166, 0.35);
      background: rgba(20, 184, 166, 0.12);
      color: #99f6e4;
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
      border: 2px dashed rgba(20, 184, 166, 0.42);
      border-radius: 18px;
      padding: 24px 18px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
      background: rgba(15, 23, 42, 0.9);
    }
    .dropzone:hover, .dropzone.dragover {
      border-color: var(--accent-2);
      background: rgba(6, 95, 70, 0.18);
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
    .button-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    button, select {
      appearance: none;
      border-radius: 14px;
      font-size: 0.96rem;
      font-weight: 700;
    }
    button {
      border: 0;
      padding: 12px 14px;
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
    .action {
      background: linear-gradient(135deg, #14b8a6 0%, #22c55e 100%);
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
    label {
      display: grid;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    select {
      border: 1px solid rgba(148, 163, 184, 0.24);
      background: rgba(15, 23, 42, 0.88);
      color: var(--text);
      padding: 12px 14px;
    }
    select:focus {
      outline: none;
      border-color: rgba(20, 184, 166, 0.64);
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.16);
    }
    .status {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(20, 184, 166, 0.12);
      border: 1px solid rgba(20, 184, 166, 0.2);
      color: #99f6e4;
      font-size: 0.92rem;
      line-height: 1.5;
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
    .canvas-shell {
      padding: 18px;
      border-radius: 18px;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9)),
        linear-gradient(45deg, rgba(20, 184, 166, 0.08), transparent);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }
    canvas {
      width: 100%;
      max-width: 100%;
      display: block;
      border-radius: 14px;
      background:
        linear-gradient(45deg, #ffffff 25%, #f1f5f9 25%, #f1f5f9 50%, #ffffff 50%, #ffffff 75%, #f1f5f9 75%, #f1f5f9 100%);
      background-size: 28px 28px;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
    }
    .note {
      margin-top: 12px;
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }
    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 560px) {
      .button-grid, .stats {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="hero">
      <div>
        <h1>Image Rotator &amp; Flipper</h1>
        <p>Load a local image, apply cumulative rotate and flip operations, preview the transformed canvas, and download the final result as PNG or JPEG.</p>
      </div>
      <div class="pill">Local canvas transforms • No uploads</div>
    </div>
  </header>

  <main class="layout">
    <section class="panel">
      <div class="panel-head">
        <h2>Transform controls</h2>
        <p>Each button updates the current canvas state cumulatively.</p>
      </div>
      <div class="panel-body">
        <label class="dropzone" id="dropzone" for="fileInput">
          <strong>Drop an image here</strong>
          <span>or click to browse. The worker only serves this page; all edits stay in your browser.</span>
          <div class="file-name" id="fileName">No file selected yet.</div>
        </label>
        <input id="fileInput" type="file" accept="image/*">

        <div class="stats">
          <div class="stat">
            <small>Current rotation</small>
            <strong id="rotationInfo">0°</strong>
          </div>
          <div class="stat">
            <small>Flip state</small>
            <strong id="flipInfo">None</strong>
          </div>
          <div class="stat">
            <small>Original dimensions</small>
            <strong id="originalDimensions">—</strong>
          </div>
          <div class="stat">
            <small>Current canvas</small>
            <strong id="currentDimensions">—</strong>
          </div>
        </div>

        <div class="button-grid">
          <button class="action" id="rotateCwButton" type="button" disabled>Rotate 90° CW</button>
          <button class="action" id="rotateCcwButton" type="button" disabled>Rotate 90° CCW</button>
          <button class="action" id="rotate180Button" type="button" disabled>Rotate 180°</button>
          <button class="action" id="flipHorizontalButton" type="button" disabled>Flip Horizontal</button>
          <button class="action" id="flipVerticalButton" type="button" disabled>Flip Vertical</button>
          <button class="secondary" id="resetButton" type="button" disabled>Reset</button>
        </div>

        <label>
          Download format
          <select id="formatSelect" disabled>
            <option value="png" selected>PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
        </label>

        <button class="secondary" id="downloadButton" type="button" disabled>Download</button>

        <div id="statusBox" class="status">Load an image to activate the transformation controls.</div>
      </div>
    </section>

    <section class="workspace">
      <section class="panel">
        <div class="panel-head">
          <h3>Transformed canvas</h3>
          <p>The preview re-renders after every rotate or flip action.</p>
        </div>
        <div class="panel-body">
          <div class="canvas-shell">
            <canvas id="previewCanvas" width="640" height="420"></canvas>
            <div class="note" id="canvasNote">After loading an image, each transformation updates the preview immediately.</div>
          </div>
        </div>
      </section>
    </section>
  </main>

  <script>
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const fileName = document.getElementById('fileName');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const rotationInfo = document.getElementById('rotationInfo');
    const flipInfo = document.getElementById('flipInfo');
    const originalDimensions = document.getElementById('originalDimensions');
    const currentDimensions = document.getElementById('currentDimensions');
    const statusBox = document.getElementById('statusBox');
    const canvasNote = document.getElementById('canvasNote');
    const formatSelect = document.getElementById('formatSelect');
    const downloadButton = document.getElementById('downloadButton');
    const resetButton = document.getElementById('resetButton');
    const rotateCwButton = document.getElementById('rotateCwButton');
    const rotateCcwButton = document.getElementById('rotateCcwButton');
    const rotate180Button = document.getElementById('rotate180Button');
    const flipHorizontalButton = document.getElementById('flipHorizontalButton');
    const flipVerticalButton = document.getElementById('flipVerticalButton');

    const MAX_PREVIEW_WIDTH = 960;
    const MAX_PREVIEW_HEIGHT = 560;

    const state = {
      originalImage: null,
      imageName: 'transformed-image',
      workingCanvas: null,
      matrix: [[1, 0], [0, 1]]
    };

    function setStatus(message, isError) {
      statusBox.textContent = message;
      statusBox.classList.toggle('error', Boolean(isError));
    }

    function makeCanvas(width, height) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }

    function multiplyMatrices(left, right) {
      return [
        [
          left[0][0] * right[0][0] + left[0][1] * right[1][0],
          left[0][0] * right[0][1] + left[0][1] * right[1][1]
        ],
        [
          left[1][0] * right[0][0] + left[1][1] * right[1][0],
          left[1][0] * right[0][1] + left[1][1] * right[1][1]
        ]
      ];
    }

    function matrixEquals(a, b) {
      return a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1][0] === b[1][0] && a[1][1] === b[1][1];
    }

    function rotationMatrix(angle) {
      if (angle === 90) return [[0, 1], [-1, 0]];
      if (angle === 180) return [[-1, 0], [0, -1]];
      if (angle === 270) return [[0, -1], [1, 0]];
      return [[1, 0], [0, 1]];
    }

    function composeDisplayMatrix(angle, flipHorizontal, flipVertical) {
      const scale = [[flipHorizontal ? -1 : 1, 0], [0, flipVertical ? -1 : 1]];
      return multiplyMatrices(scale, rotationMatrix(angle));
    }

    function describeMatrix(matrix) {
      const candidates = [];
      const angles = [0, 90, 180, 270];
      for (let i = 0; i < angles.length; i += 1) {
        const angle = angles[i];
        [false, true].forEach(function(flipHorizontal) {
          [false, true].forEach(function(flipVertical) {
            const candidateMatrix = composeDisplayMatrix(angle, flipHorizontal, flipVertical);
            if (matrixEquals(candidateMatrix, matrix)) {
              candidates.push({ angle, flipHorizontal, flipVertical });
            }
          });
        });
      }

      if (!candidates.length) {
        return { angle: 0, flipHorizontal: false, flipVertical: false };
      }

      candidates.sort(function(a, b) {
        const flipsA = (a.flipHorizontal ? 1 : 0) + (a.flipVertical ? 1 : 0);
        const flipsB = (b.flipHorizontal ? 1 : 0) + (b.flipVertical ? 1 : 0);
        if (flipsA !== flipsB) return flipsA - flipsB;
        return a.angle - b.angle;
      });

      return candidates[0];
    }

    function formatDimensions(width, height) {
      return width + ' × ' + height + ' px';
    }

    function enableControls(enabled) {
      rotateCwButton.disabled = !enabled;
      rotateCcwButton.disabled = !enabled;
      rotate180Button.disabled = !enabled;
      flipHorizontalButton.disabled = !enabled;
      flipVerticalButton.disabled = !enabled;
      resetButton.disabled = !enabled;
      downloadButton.disabled = !enabled;
      formatSelect.disabled = !enabled;
    }

    function drawPlaceholder() {
      previewCanvas.width = 640;
      previewCanvas.height = 420;
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      const gradient = previewCtx.createLinearGradient(0, 0, previewCanvas.width, previewCanvas.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      previewCtx.fillStyle = gradient;
      previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCtx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
      previewCtx.setLineDash([10, 10]);
      previewCtx.strokeRect(24, 24, previewCanvas.width - 48, previewCanvas.height - 48);
      previewCtx.setLineDash([]);
      previewCtx.textAlign = 'center';
      previewCtx.fillStyle = '#e2e8f0';
      previewCtx.font = '600 28px Inter, Segoe UI, sans-serif';
      previewCtx.fillText('Transform preview appears here', previewCanvas.width / 2, previewCanvas.height / 2 - 6);
      previewCtx.fillStyle = '#94a3b8';
      previewCtx.font = '16px Inter, Segoe UI, sans-serif';
      previewCtx.fillText('Rotate or flip an image to update the canvas.', previewCanvas.width / 2, previewCanvas.height / 2 + 28);
      previewCtx.textAlign = 'start';
    }

    function renderPreview() {
      if (!state.workingCanvas) {
        drawPlaceholder();
        return;
      }

      const width = state.workingCanvas.width;
      const height = state.workingCanvas.height;
      const scale = Math.min(MAX_PREVIEW_WIDTH / width, MAX_PREVIEW_HEIGHT / height, 1);
      previewCanvas.width = Math.max(1, Math.round(width * scale));
      previewCanvas.height = Math.max(1, Math.round(height * scale));
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCtx.imageSmoothingEnabled = true;
      previewCtx.imageSmoothingQuality = 'high';
      previewCtx.drawImage(state.workingCanvas, 0, 0, previewCanvas.width, previewCanvas.height);

      currentDimensions.textContent = formatDimensions(width, height);
    }

    function updateStateSummary() {
      const summary = describeMatrix(state.matrix);
      rotationInfo.textContent = summary.angle + '°';
      const flips = [];
      if (summary.flipHorizontal) flips.push('Horizontal');
      if (summary.flipVertical) flips.push('Vertical');
      flipInfo.textContent = flips.length ? flips.join(' + ') : 'None';
    }

    function resetWorkingState() {
      if (!state.originalImage) return;
      state.workingCanvas = makeCanvas(state.originalImage.naturalWidth, state.originalImage.naturalHeight);
      const ctx = state.workingCanvas.getContext('2d');
      ctx.clearRect(0, 0, state.workingCanvas.width, state.workingCanvas.height);
      ctx.drawImage(state.originalImage, 0, 0);
      state.matrix = [[1, 0], [0, 1]];
      renderPreview();
      updateStateSummary();
      currentDimensions.textContent = formatDimensions(state.workingCanvas.width, state.workingCanvas.height);
      canvasNote.textContent = 'Reset to the original orientation. Apply new transformations as needed.';
    }

    function applyCanvasTransform(kind) {
      if (!state.workingCanvas) return;

      const source = state.workingCanvas;
      let target;
      let ctx;
      let opMatrix = [[1, 0], [0, 1]];

      if (kind === 'rotateCW') {
        target = makeCanvas(source.height, source.width);
        ctx = target.getContext('2d');
        ctx.translate(target.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(source, 0, 0);
        opMatrix = [[0, 1], [-1, 0]];
      } else if (kind === 'rotateCCW') {
        target = makeCanvas(source.height, source.width);
        ctx = target.getContext('2d');
        ctx.translate(0, target.height);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(source, 0, 0);
        opMatrix = [[0, -1], [1, 0]];
      } else if (kind === 'rotate180') {
        target = makeCanvas(source.width, source.height);
        ctx = target.getContext('2d');
        ctx.translate(target.width, target.height);
        ctx.rotate(Math.PI);
        ctx.drawImage(source, 0, 0);
        opMatrix = [[-1, 0], [0, -1]];
      } else if (kind === 'flipHorizontal') {
        target = makeCanvas(source.width, source.height);
        ctx = target.getContext('2d');
        ctx.translate(target.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(source, 0, 0);
        opMatrix = [[-1, 0], [0, 1]];
      } else if (kind === 'flipVertical') {
        target = makeCanvas(source.width, source.height);
        ctx = target.getContext('2d');
        ctx.translate(0, target.height);
        ctx.scale(1, -1);
        ctx.drawImage(source, 0, 0);
        opMatrix = [[1, 0], [0, -1]];
      }

      if (!target) return;

      state.workingCanvas = target;
      state.matrix = multiplyMatrices(opMatrix, state.matrix);
      renderPreview();
      updateStateSummary();
      canvasNote.textContent = 'Preview updated after the latest transform.';
      setStatus('Transformation applied. You can keep stacking rotate and flip operations.');
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
          state.originalImage = image;
          state.imageName = (file.name || 'transformed-image').replace(/\.[^.]+$/, '');
          originalDimensions.textContent = formatDimensions(image.naturalWidth, image.naturalHeight);
          fileName.textContent = file.name + ' • ' + formatDimensions(image.naturalWidth, image.naturalHeight);
          enableControls(true);
          resetWorkingState();
          setStatus('Image loaded. Use the controls to rotate or flip it.');
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

    function downloadImage() {
      if (!state.workingCanvas) {
        setStatus('Load and transform an image before downloading.', true);
        return;
      }

      const format = formatSelect.value;
      const exportCanvas = makeCanvas(state.workingCanvas.width, state.workingCanvas.height);
      const exportCtx = exportCanvas.getContext('2d');

      if (format === 'jpeg') {
        exportCtx.fillStyle = '#ffffff';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      exportCtx.drawImage(state.workingCanvas, 0, 0);

      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = format === 'jpeg'
        ? exportCanvas.toDataURL(mime, 0.92)
        : exportCanvas.toDataURL(mime);

      const extension = format === 'jpeg' ? 'jpg' : 'png';
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = state.imageName + '-transformed.' + extension;
      link.click();

      setStatus('Download started for the transformed image.');
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

    rotateCwButton.addEventListener('click', function() { applyCanvasTransform('rotateCW'); });
    rotateCcwButton.addEventListener('click', function() { applyCanvasTransform('rotateCCW'); });
    rotate180Button.addEventListener('click', function() { applyCanvasTransform('rotate180'); });
    flipHorizontalButton.addEventListener('click', function() { applyCanvasTransform('flipHorizontal'); });
    flipVerticalButton.addEventListener('click', function() { applyCanvasTransform('flipVertical'); });
    resetButton.addEventListener('click', function() {
      resetWorkingState();
      setStatus('Transform state reset to the original image.');
    });
    downloadButton.addEventListener('click', downloadImage);

    enableControls(false);
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
