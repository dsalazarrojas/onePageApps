addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === 'GET' && url.pathname === '/') {
    return serveMainPage();
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Text Overlay</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #0f172a;
      --panel: rgba(15, 23, 42, 0.78);
      --panel-solid: #111827;
      --line: rgba(148, 163, 184, 0.25);
      --soft: #cbd5e1;
      --text: #f8fafc;
      --accent: #38bdf8;
      --accent-2: #818cf8;
      --danger: #fb7185;
      --success: #4ade80;
      --canvas-bg: #020617;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 28%),
        radial-gradient(circle at top right, rgba(129, 140, 248, 0.16), transparent 24%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: var(--text);
    }

    .app {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 20px 24px;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(10px);
    }

    .hero h1 {
      margin: 0 0 6px;
      font-size: clamp(1.9rem, 3vw, 2.7rem);
    }

    .hero p {
      margin: 0;
      color: var(--soft);
      max-width: 760px;
      line-height: 1.5;
    }

    .stat-pill {
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.16);
      color: #bae6fd;
      font-weight: bold;
      white-space: nowrap;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(320px, 380px) minmax(0, 1fr);
      gap: 20px;
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: var(--panel);
      backdrop-filter: blur(10px);
      box-shadow: 0 20px 45px rgba(2, 6, 23, 0.28);
    }

    .controls {
      padding: 20px;
      display: grid;
      gap: 18px;
      align-content: start;
    }

    .drop-zone {
      border: 2px dashed rgba(125, 211, 252, 0.45);
      border-radius: 18px;
      padding: 20px;
      background: rgba(15, 23, 42, 0.72);
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
    }

    .drop-zone:hover,
    .drop-zone.dragover {
      border-color: var(--accent);
      transform: translateY(-2px);
      background: rgba(30, 41, 59, 0.92);
    }

    .drop-zone strong {
      display: block;
      font-size: 1.05rem;
      margin-bottom: 6px;
    }

    .drop-zone span,
    .help-text,
    .subtle {
      color: var(--soft);
      font-size: 0.94rem;
      line-height: 1.45;
    }

    .control-group {
      display: grid;
      gap: 10px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 6px;
      color: #e2e8f0;
    }

    input[type="text"],
    select,
    button {
      font: inherit;
    }

    input[type="text"],
    select {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.96);
      color: var(--text);
      border-radius: 12px;
      padding: 12px 14px;
    }

    input[type="range"] {
      width: 100%;
    }

    input[type="color"] {
      width: 100%;
      height: 44px;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.96);
      border-radius: 12px;
      padding: 4px;
      cursor: pointer;
    }

    .value-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      color: var(--soft);
      font-size: 0.9rem;
    }

    .actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    button {
      border: none;
      border-radius: 12px;
      padding: 12px 14px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease, background 0.18s ease;
    }

    button:hover { transform: translateY(-1px); }
    button:active { transform: translateY(0); }

    .primary { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #082f49; }
    .secondary { background: rgba(51, 65, 85, 0.95); color: var(--text); }
    .success { background: linear-gradient(135deg, #22c55e, #4ade80); color: #052e16; }

    .canvas-panel {
      padding: 18px;
      display: grid;
      gap: 14px;
    }

    .canvas-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .status {
      min-height: 24px;
      color: #bfdbfe;
      font-size: 0.95rem;
    }

    .status.error {
      color: #fecdd3;
    }

    .canvas-shell {
      position: relative;
      min-height: 520px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background:
        linear-gradient(45deg, rgba(51, 65, 85, 0.4) 25%, transparent 25%, transparent 75%, rgba(51, 65, 85, 0.4) 75%, rgba(51, 65, 85, 0.4)),
        linear-gradient(45deg, rgba(15, 23, 42, 0.8) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.8) 75%, rgba(15, 23, 42, 0.8));
      background-position: 0 0, 12px 12px;
      background-size: 24px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    }

    canvas {
      display: block;
      max-width: 100%;
      max-height: 72vh;
      background: var(--canvas-bg);
      box-shadow: 0 18px 35px rgba(2, 6, 23, 0.42);
    }

    .placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 24px;
      text-align: center;
      color: var(--soft);
      pointer-events: none;
    }

    .placeholder strong {
      color: var(--text);
      font-size: 1.1rem;
    }

    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .actions {
        grid-template-columns: 1fr;
      }

      .hero {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <section class="hero panel">
      <div>
        <h1>Image Text Overlay</h1>
        <p>Upload a local image, preview each text layer live, stack multiple overlays, undo the last layer, and download the finished PNG without sending your image anywhere.</p>
      </div>
      <div class="stat-pill">Layers: <span id="layerCount">0</span></div>
    </section>

    <div class="layout">
      <aside class="panel controls">
        <div id="dropZone" class="drop-zone" role="button" tabindex="0" aria-label="Upload image">
          <strong>Drop an image here</strong>
          <span>or click to browse from your device</span>
          <div class="help-text" id="fileSummary" style="margin-top: 10px;">PNG, JPEG, WebP, GIF, and other browser-supported formats work.</div>
        </div>
        <input id="fileInput" type="file" accept="image/*" hidden>

        <div class="control-group">
          <label for="overlayText">Overlay text</label>
          <input id="overlayText" type="text" placeholder="Type your caption or headline">
        </div>

        <div class="grid-2">
          <div class="control-group">
            <label for="fontFamily">Font family</label>
            <select id="fontFamily">
              <option value="Arial" selected>Arial</option>
              <option value="Impact">Impact</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
          <div class="control-group">
            <label for="textAlign">Text alignment</label>
            <select id="textAlign">
              <option value="left">Left</option>
              <option value="center" selected>Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>

        <div class="control-group">
          <div class="value-row">
            <label for="fontSize">Font size</label>
            <span id="fontSizeValue">64 px</span>
          </div>
          <input id="fontSize" type="range" min="10" max="200" value="64">
        </div>

        <div class="grid-2">
          <div class="control-group">
            <label for="textColor">Text color</label>
            <input id="textColor" type="color" value="#ffffff">
          </div>
          <div class="control-group">
            <label for="strokeColor">Stroke color</label>
            <input id="strokeColor" type="color" value="#000000">
          </div>
        </div>

        <div class="control-group">
          <div class="value-row">
            <label for="strokeWidth">Stroke width</label>
            <span id="strokeWidthValue">4 px</span>
          </div>
          <input id="strokeWidth" type="range" min="0" max="10" step="0.5" value="4">
        </div>

        <div class="control-group">
          <div class="value-row">
            <label for="xPosition">X position</label>
            <span id="xPositionValue">50%</span>
          </div>
          <input id="xPosition" type="range" min="0" max="100" value="50">
        </div>

        <div class="control-group">
          <div class="value-row">
            <label for="yPosition">Y position</label>
            <span id="yPositionValue">82%</span>
          </div>
          <input id="yPosition" type="range" min="0" max="100" value="82">
        </div>

        <div class="control-group">
          <div class="value-row">
            <label for="opacity">Opacity</label>
            <span id="opacityValue">100%</span>
          </div>
          <input id="opacity" type="range" min="0" max="100" value="100">
        </div>

        <div class="actions">
          <button id="addTextButton" class="primary" type="button">Add Text</button>
          <button id="undoButton" class="secondary" type="button">Undo Last</button>
          <button id="downloadButton" class="success" type="button">Download PNG</button>
        </div>

        <div class="subtle">Live preview shows where the next text layer will land before you commit it.</div>
      </aside>

      <section class="panel canvas-panel">
        <div class="canvas-meta">
          <div>
            <div style="font-weight: bold;">Canvas Preview</div>
            <div id="imageMeta" class="subtle">Load an image to begin.</div>
          </div>
          <div class="status" id="statusMessage"></div>
        </div>
        <div class="canvas-shell" id="canvasShell">
          <canvas id="editorCanvas" width="1280" height="720"></canvas>
          <div class="placeholder" id="placeholder">
            <strong>No image loaded yet</strong>
            <span>Drop an image or click the upload area to start adding text overlays.</span>
          </div>
        </div>
      </section>
    </div>
  </div>

  <script>
    (function () {
      const state = {
        image: null,
        imageName: 'image',
        imageType: 'image/png',
        layers: []
      };

      const elements = {
        fileInput: document.getElementById('fileInput'),
        dropZone: document.getElementById('dropZone'),
        fileSummary: document.getElementById('fileSummary'),
        overlayText: document.getElementById('overlayText'),
        fontFamily: document.getElementById('fontFamily'),
        fontSize: document.getElementById('fontSize'),
        fontSizeValue: document.getElementById('fontSizeValue'),
        textColor: document.getElementById('textColor'),
        strokeColor: document.getElementById('strokeColor'),
        strokeWidth: document.getElementById('strokeWidth'),
        strokeWidthValue: document.getElementById('strokeWidthValue'),
        xPosition: document.getElementById('xPosition'),
        xPositionValue: document.getElementById('xPositionValue'),
        yPosition: document.getElementById('yPosition'),
        yPositionValue: document.getElementById('yPositionValue'),
        textAlign: document.getElementById('textAlign'),
        opacity: document.getElementById('opacity'),
        opacityValue: document.getElementById('opacityValue'),
        addTextButton: document.getElementById('addTextButton'),
        undoButton: document.getElementById('undoButton'),
        downloadButton: document.getElementById('downloadButton'),
        layerCount: document.getElementById('layerCount'),
        statusMessage: document.getElementById('statusMessage'),
        imageMeta: document.getElementById('imageMeta'),
        canvas: document.getElementById('editorCanvas'),
        placeholder: document.getElementById('placeholder')
      };

      const ctx = elements.canvas.getContext('2d');

      function setStatus(message, isError) {
        elements.statusMessage.textContent = message || '';
        elements.statusMessage.className = isError ? 'status error' : 'status';
      }

      function formatBytes(bytes) {
        if (!Number.isFinite(bytes)) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
      }

      function updateReadouts() {
        elements.fontSizeValue.textContent = elements.fontSize.value + ' px';
        elements.strokeWidthValue.textContent = elements.strokeWidth.value + ' px';
        elements.xPositionValue.textContent = elements.xPosition.value + '%';
        elements.yPositionValue.textContent = elements.yPosition.value + '%';
        elements.opacityValue.textContent = elements.opacity.value + '%';
        elements.layerCount.textContent = String(state.layers.length);
      }

      function getPendingLayer() {
        return {
          text: elements.overlayText.value.trim(),
          fontFamily: elements.fontFamily.value,
          fontSize: Number(elements.fontSize.value),
          textColor: elements.textColor.value,
          strokeColor: elements.strokeColor.value,
          strokeWidth: Number(elements.strokeWidth.value),
          x: Number(elements.xPosition.value) / 100,
          y: Number(elements.yPosition.value) / 100,
          textAlign: elements.textAlign.value,
          opacity: Number(elements.opacity.value) / 100
        };
      }

      function drawTextLayer(targetCtx, layer) {
        const canvas = targetCtx.canvas;
        const x = canvas.width * layer.x;
        const y = canvas.height * layer.y;

        targetCtx.save();
        targetCtx.font = layer.fontSize + 'px ' + layer.fontFamily;
        targetCtx.textAlign = layer.textAlign;
        targetCtx.textBaseline = 'middle';
        targetCtx.lineJoin = 'round';
        targetCtx.miterLimit = 2;
        targetCtx.globalAlpha = layer.opacity;

        if (layer.strokeWidth > 0) {
          targetCtx.lineWidth = layer.strokeWidth;
          targetCtx.strokeStyle = layer.strokeColor;
          targetCtx.strokeText(layer.text, x, y);
        }

        targetCtx.fillStyle = layer.textColor;
        targetCtx.fillText(layer.text, x, y);
        targetCtx.restore();
      }

      function drawPreviewGuides(targetCtx, layer) {
        const canvas = targetCtx.canvas;
        const x = canvas.width * layer.x;
        const y = canvas.height * layer.y;

        targetCtx.save();
        targetCtx.setLineDash([8, 8]);
        targetCtx.strokeStyle = 'rgba(125, 211, 252, 0.95)';
        targetCtx.lineWidth = 2;
        targetCtx.beginPath();
        targetCtx.moveTo(x, 0);
        targetCtx.lineTo(x, canvas.height);
        targetCtx.moveTo(0, y);
        targetCtx.lineTo(canvas.width, y);
        targetCtx.stroke();
        targetCtx.setLineDash([]);
        targetCtx.fillStyle = 'rgba(125, 211, 252, 0.95)';
        targetCtx.beginPath();
        targetCtx.arc(x, y, 5, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.restore();
      }

      function renderCanvas(includePreview) {
        if (!state.image) {
          ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
          elements.placeholder.style.display = 'flex';
          return;
        }

        const width = state.image.naturalWidth || state.image.width;
        const height = state.image.naturalHeight || state.image.height;

        if (elements.canvas.width !== width || elements.canvas.height !== height) {
          elements.canvas.width = width;
          elements.canvas.height = height;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(state.image, 0, 0, width, height);
        state.layers.forEach(layer => drawTextLayer(ctx, layer));

        const pending = getPendingLayer();
        if (includePreview && pending.text) {
          const previewLayer = Object.assign({}, pending, {
            opacity: Math.max(0.22, Math.min(pending.opacity, 0.82))
          });
          drawTextLayer(ctx, previewLayer);
          drawPreviewGuides(ctx, pending);
        }

        elements.placeholder.style.display = 'none';
      }

      function updateImageMeta(file) {
        const parts = [];
        if (file && file.name) parts.push(file.name);
        if (file && file.size) parts.push(formatBytes(file.size));
        if (state.image) {
          parts.push((state.image.naturalWidth || state.image.width) + ' × ' + (state.image.naturalHeight || state.image.height));
        }
        elements.imageMeta.textContent = parts.join(' • ') || 'Load an image to begin.';
      }

      function loadImageFile(file) {
        if (!file || !file.type || file.type.indexOf('image/') !== 0) {
          setStatus('Please choose a valid image file.', true);
          return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
          const image = new Image();
          image.onload = function () {
            state.image = image;
            state.imageName = file.name.replace(/\\.[^.]+$/, '') || 'image';
            state.imageType = file.type || 'image/png';
            state.layers = [];
            updateReadouts();
            updateImageMeta(file);
            elements.fileSummary.textContent = 'Loaded: ' + file.name + ' (' + formatBytes(file.size) + ')';
            renderCanvas(true);
            setStatus('Image loaded. Adjust the controls to preview your next text layer.', false);
          };
          image.onerror = function () {
            setStatus('Unable to read that image file.', true);
          };
          image.src = event.target.result;
        };
        reader.onerror = function () {
          setStatus('The file could not be read.', true);
        };
        reader.readAsDataURL(file);
      }

      function handleSelectedFiles(fileList) {
        if (!fileList || !fileList.length) return;
        loadImageFile(fileList[0]);
      }

      function addCurrentLayer() {
        if (!state.image) {
          setStatus('Upload an image before adding text.', true);
          return;
        }

        const layer = getPendingLayer();
        if (!layer.text) {
          setStatus('Enter some overlay text first.', true);
          return;
        }

        state.layers.push(layer);
        updateReadouts();
        renderCanvas(true);
        setStatus('Added text layer #' + state.layers.length + '.', false);
      }

      function undoLastLayer() {
        if (!state.layers.length) {
          setStatus('There are no committed text layers to remove.', true);
          return;
        }

        state.layers.pop();
        updateReadouts();
        renderCanvas(true);
        setStatus('Removed the last text layer.', false);
      }

      function downloadComposite() {
        if (!state.image) {
          setStatus('Upload an image before downloading.', true);
          return;
        }

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = state.image.naturalWidth || state.image.width;
        exportCanvas.height = state.image.naturalHeight || state.image.height;
        const exportCtx = exportCanvas.getContext('2d');
        exportCtx.drawImage(state.image, 0, 0, exportCanvas.width, exportCanvas.height);
        state.layers.forEach(layer => drawTextLayer(exportCtx, layer));

        const link = document.createElement('a');
        link.href = exportCanvas.toDataURL('image/png');
        link.download = state.imageName + '-text-overlay.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('PNG downloaded.', false);
      }

      [
        elements.overlayText,
        elements.fontFamily,
        elements.fontSize,
        elements.textColor,
        elements.strokeColor,
        elements.strokeWidth,
        elements.xPosition,
        elements.yPosition,
        elements.textAlign,
        elements.opacity
      ].forEach(function (control) {
        control.addEventListener('input', function () {
          updateReadouts();
          renderCanvas(true);
        });
        control.addEventListener('change', function () {
          updateReadouts();
          renderCanvas(true);
        });
      });

      elements.dropZone.addEventListener('click', function () {
        elements.fileInput.click();
      });

      elements.dropZone.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          elements.fileInput.click();
        }
      });

      elements.fileInput.addEventListener('change', function (event) {
        handleSelectedFiles(event.target.files);
      });

      ['dragenter', 'dragover'].forEach(function (eventName) {
        elements.dropZone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          elements.dropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'dragend', 'drop'].forEach(function (eventName) {
        elements.dropZone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          elements.dropZone.classList.remove('dragover');
        });
      });

      elements.dropZone.addEventListener('drop', function (event) {
        handleSelectedFiles(event.dataTransfer.files);
      });

      elements.addTextButton.addEventListener('click', addCurrentLayer);
      elements.undoButton.addEventListener('click', undoLastLayer);
      elements.downloadButton.addEventListener('click', downloadComposite);

      updateReadouts();
      renderCanvas(true);
    }());
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
