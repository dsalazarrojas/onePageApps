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
  <title>Screenshot Annotator</title>
  <style>
    * { box-sizing: border-box; }
    :root {
      color-scheme: dark;
      --bg: #08111d;
      --panel: rgba(9, 18, 33, 0.9);
      --panel-strong: rgba(14, 24, 41, 0.98);
      --border: rgba(148, 163, 184, 0.22);
      --text: #e5eefb;
      --muted: #9fb0c8;
      --brand: #60a5fa;
      --brand-strong: #93c5fd;
      --shadow: 0 28px 74px rgba(2, 8, 23, 0.5);
    }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 28%),
        radial-gradient(circle at top right, rgba(192, 132, 252, 0.12), transparent 24%),
        linear-gradient(160deg, #07111d 0%, #0c1628 46%, #07111d 100%);
      padding: 24px;
    }
    .app {
      max-width: 1480px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(340px, 430px) minmax(0, 1fr);
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
    .upload-wrap {
      display: grid;
      gap: 10px;
    }
    .upload-wrap input[type="file"] {
      width: 100%;
      border: 1px dashed rgba(148, 163, 184, 0.34);
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.52);
      color: var(--muted);
      padding: 12px;
    }
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
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .tool-button {
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 16px;
      background: var(--panel-strong);
      color: var(--text);
      padding: 12px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
    }
    .tool-button:hover { transform: translateY(-1px); }
    .tool-button.active {
      border-color: rgba(96, 165, 250, 0.9);
      background: rgba(96, 165, 250, 0.15);
      color: #eff6ff;
    }
    label.control {
      display: grid;
      gap: 8px;
      font-size: 0.95rem;
      color: #dae8fb;
    }
    input[type="range"] {
      width: 100%;
      accent-color: #60a5fa;
    }
    input[type="text"],
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
      background: rgba(96, 165, 250, 0.14);
      border: 1px solid rgba(96, 165, 250, 0.18);
      color: #e0f2fe;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    button.action {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }
    button.action:hover { transform: translateY(-1px); }
    button.action:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .primary {
      color: #05111d;
      background: linear-gradient(135deg, #93c5fd, #60a5fa);
    }
    .secondary {
      color: var(--text);
      background: rgba(15, 23, 42, 0.78);
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
      gap: 12px;
      align-items: center;
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
      min-height: 680px;
      display: grid;
      place-items: center;
      border-radius: 24px;
      overflow: auto;
      padding: 16px;
      background:
        linear-gradient(45deg, rgba(30, 41, 59, 0.75) 25%, transparent 25%, transparent 75%, rgba(30, 41, 59, 0.75) 75%),
        linear-gradient(45deg, rgba(30, 41, 59, 0.75) 25%, transparent 25%, transparent 75%, rgba(30, 41, 59, 0.75) 75%);
      background-size: 32px 32px;
      background-position: 0 0, 16px 16px;
      border: 1px solid rgba(148, 163, 184, 0.16);
    }
    canvas {
      display: block;
      max-width: 100%;
      max-height: 85vh;
      background: #ffffff;
      box-shadow: 0 24px 70px rgba(2, 8, 23, 0.35);
      cursor: crosshair;
      border-radius: 8px;
    }
    .status {
      min-height: 1.4em;
      color: var(--muted);
      font-size: 0.95rem;
    }
    .hidden { display: none !important; }
    @media (max-width: 1160px) {
      .app { grid-template-columns: 1fr; }
      .controls { position: static; }
    }
    @media (max-width: 720px) {
      body { padding: 16px; }
      .controls, .preview { padding: 18px; }
      .tool-grid { grid-template-columns: 1fr 1fr; }
      .canvas-shell { min-height: 400px; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="panel controls">
      <div>
        <h1>Screenshot Annotator</h1>
        <p class="lead">Upload a screenshot, then mark it up with freehand sketches, shapes, arrows, highlights, and text before exporting a single annotated PNG.</p>
      </div>

      <div class="section upload-wrap">
        <div class="section-title">
          <span>Base image</span>
          <span class="value-pill" id="canvasInfo">1200 × 720</span>
        </div>
        <input id="fileInput" type="file" accept="image/*">
      </div>

      <div class="section">
        <div class="section-title">
          <span>Tools</span>
          <span class="value-pill" id="toolValue">Pen</span>
        </div>
        <div class="tool-grid" id="toolGrid">
          <button class="tool-button active" type="button" data-tool="pen">Freehand pen</button>
          <button class="tool-button" type="button" data-tool="rectangle">Rectangle</button>
          <button class="tool-button" type="button" data-tool="filledRectangle">Filled rectangle</button>
          <button class="tool-button" type="button" data-tool="circle">Circle</button>
          <button class="tool-button" type="button" data-tool="arrow">Arrow</button>
          <button class="tool-button" type="button" data-tool="text">Text</button>
          <button class="tool-button" type="button" data-tool="highlighter">Highlighter</button>
        </div>
      </div>

      <div class="section">
        <label class="control">
          Color
          <input id="colorInput" type="color" value="#ff3b30">
        </label>
      </div>

      <div class="section">
        <div class="section-title">
          <span>Line width</span>
          <span class="value-pill" id="widthValue">4 px</span>
        </div>
        <input id="lineWidthInput" type="range" min="1" max="20" value="4">
      </div>

      <div class="section hidden" id="textControls">
        <label class="control">
          Text content
          <input id="textInput" type="text" maxlength="120" placeholder="Click on the canvas to place this text">
        </label>
      </div>

      <div class="actions">
        <button class="action secondary" id="undoBtn" type="button" disabled>Undo</button>
        <button class="action secondary" id="clearBtn" type="button" disabled>Clear</button>
        <button class="action primary" id="downloadBtn" type="button">Download PNG</button>
      </div>
    </aside>

    <section class="panel preview">
      <div class="preview-head">
        <div>
          <h2>Annotation canvas</h2>
          <p>Drag to draw shapes and arrows, use the pen for freehand notes, and click to place text when the Text tool is active.</p>
        </div>
      </div>
      <div class="canvas-shell">
        <canvas id="annotatorCanvas" width="1200" height="720"></canvas>
      </div>
      <div class="status" id="status">Upload a screenshot or annotate directly on the blank canvas.</div>
    </section>
  </div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const toolGrid = document.getElementById('toolGrid');
    const toolValue = document.getElementById('toolValue');
    const colorInput = document.getElementById('colorInput');
    const lineWidthInput = document.getElementById('lineWidthInput');
    const widthValue = document.getElementById('widthValue');
    const textControls = document.getElementById('textControls');
    const textInput = document.getElementById('textInput');
    const undoBtn = document.getElementById('undoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const canvasInfo = document.getElementById('canvasInfo');
    const statusEl = document.getElementById('status');
    const canvas = document.getElementById('annotatorCanvas');
    const ctx = canvas.getContext('2d');

    let baseImage = null;
    let activeTool = 'pen';
    let isDrawing = false;
    let startPoint = null;
    let draftOperation = null;
    const operations = [];

    updateToolUI();
    updateWidthLabel();
    redrawCanvas();

    fileInput.addEventListener('change', async event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const image = await loadImageFile(file);
        const fitted = fitDimensions(image.width, image.height, 1800);
        baseImage = { image, width: fitted.width, height: fitted.height };
        canvas.width = fitted.width;
        canvas.height = fitted.height;
        operations.length = 0;
        draftOperation = null;
        isDrawing = false;
        redrawCanvas();
        setStatus('Loaded "' + file.name + '". Start drawing annotations on top of it.');
        updateActionButtons();
      } catch (error) {
        setStatus(error.message || 'The image could not be loaded.');
      }
    });

    toolGrid.addEventListener('click', event => {
      const button = event.target.closest('[data-tool]');
      if (!button) return;
      activeTool = button.dataset.tool;
      updateToolUI();
      setStatus(activeTool === 'text'
        ? 'Text mode active. Enter text in the field, then click on the canvas to place it.'
        : 'Ready to draw with the ' + button.textContent.toLowerCase() + ' tool.');
    });

    lineWidthInput.addEventListener('input', updateWidthLabel);
    colorInput.addEventListener('input', () => {
      if (draftOperation) redrawCanvas();
    });

    undoBtn.addEventListener('click', () => {
      if (!operations.length) return;
      operations.pop();
      redrawCanvas();
      updateActionButtons();
      setStatus('Removed the latest annotation.');
    });

    clearBtn.addEventListener('click', () => {
      operations.length = 0;
      draftOperation = null;
      redrawCanvas();
      updateActionButtons();
      setStatus('All annotations were cleared.');
    });

    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'annotated-screenshot.png';
      link.click();
    });

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    function handleMouseDown(event) {
      const point = getCanvasPoint(event);
      startPoint = point;

      if (activeTool === 'text') {
        placeText(point);
        return;
      }

      isDrawing = true;
      if (activeTool === 'pen') {
        draftOperation = {
          type: 'pen',
          color: colorInput.value,
          lineWidth: getLineWidth(),
          points: [point]
        };
      } else {
        draftOperation = createShapeOperation(point, point);
      }
      redrawCanvas();
    }

    function handleMouseMove(event) {
      if (!isDrawing || !draftOperation) return;
      const point = getCanvasPoint(event);

      if (activeTool === 'pen') {
        draftOperation.points.push(point);
      } else {
        draftOperation = createShapeOperation(startPoint, point);
      }

      redrawCanvas();
    }

    function handleMouseUp(event) {
      if (!isDrawing || !draftOperation) return;
      const point = getCanvasPoint(event);

      if (activeTool !== 'pen') {
        draftOperation = createShapeOperation(startPoint, point);
      }

      finalizeDraft();
    }

    function handleMouseLeave() {
      if (!isDrawing || !draftOperation) return;
      finalizeDraft();
    }

    function finalizeDraft() {
      if (!draftOperation) return;
      if (draftOperation.type === 'pen' && draftOperation.points.length < 2) {
        draftOperation.points.push({ ...draftOperation.points[0] });
      }
      operations.push(draftOperation);
      draftOperation = null;
      isDrawing = false;
      redrawCanvas();
      updateActionButtons();
      setStatus('Annotation added.');
    }

    function placeText(point) {
      const text = textInput.value.trim();
      if (!text) {
        setStatus('Enter some text before placing it on the canvas.');
        return;
      }
      operations.push({
        type: 'text',
        x: point.x,
        y: point.y,
        text,
        color: colorInput.value,
        fontSize: Math.max(18, 14 + getLineWidth() * 2)
      });
      redrawCanvas();
      updateActionButtons();
      setStatus('Text annotation placed.');
    }

    function createShapeOperation(start, end) {
      const color = colorInput.value;
      const lineWidth = getLineWidth();
      if (activeTool === 'rectangle') {
        return { type: 'rectangle', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y, color, lineWidth };
      }
      if (activeTool === 'filledRectangle') {
        return { type: 'filledRectangle', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y, color };
      }
      if (activeTool === 'circle') {
        return {
          type: 'circle',
          centerX: (start.x + end.x) / 2,
          centerY: (start.y + end.y) / 2,
          radiusX: Math.abs(end.x - start.x) / 2,
          radiusY: Math.abs(end.y - start.y) / 2,
          color,
          lineWidth
        };
      }
      if (activeTool === 'arrow') {
        return { type: 'arrow', startX: start.x, startY: start.y, endX: end.x, endY: end.y, color, lineWidth };
      }
      if (activeTool === 'highlighter') {
        return { type: 'highlighter', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y };
      }
      return { type: 'rectangle', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y, color, lineWidth };
    }

    function redrawCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (baseImage) {
        ctx.drawImage(baseImage.image, 0, 0, canvas.width, canvas.height);
      } else {
        drawBlankCanvas();
      }

      operations.forEach(drawOperation);
      if (draftOperation) drawOperation(draftOperation);
      canvasInfo.textContent = canvas.width + ' × ' + canvas.height;
    }

    function drawBlankCanvas() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 5;
      ctx.setLineDash([16, 12]);
      ctx.strokeRect(canvas.width * 0.08, canvas.height * 0.08, canvas.width * 0.84, canvas.height * 0.84);
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.font = '700 34px Inter, Arial, sans-serif';
      ctx.fillText('Upload a screenshot or annotate this blank canvas', canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }

    function drawOperation(operation) {
      if (operation.type === 'pen') {
        drawPen(operation);
        return;
      }
      if (operation.type === 'rectangle') {
        const rect = normalizeRect(operation);
        ctx.save();
        ctx.strokeStyle = operation.color;
        ctx.lineWidth = operation.lineWidth;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
        return;
      }
      if (operation.type === 'filledRectangle') {
        const rect = normalizeRect(operation);
        ctx.save();
        ctx.fillStyle = operation.color;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
        return;
      }
      if (operation.type === 'circle') {
        ctx.save();
        ctx.strokeStyle = operation.color;
        ctx.lineWidth = operation.lineWidth;
        ctx.beginPath();
        ctx.ellipse(operation.centerX, operation.centerY, Math.max(1, operation.radiusX), Math.max(1, operation.radiusY), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
      }
      if (operation.type === 'arrow') {
        drawArrow(operation);
        return;
      }
      if (operation.type === 'text') {
        ctx.save();
        ctx.fillStyle = operation.color;
        ctx.textBaseline = 'top';
        ctx.font = '700 ' + operation.fontSize + 'px Inter, Arial, sans-serif';
        wrapAndDrawText(operation.text, operation.x, operation.y, canvas.width * 0.45, operation.fontSize * 1.2);
        ctx.restore();
        return;
      }
      if (operation.type === 'highlighter') {
        const rect = normalizeRect(operation);
        ctx.save();
        ctx.fillStyle = 'rgba(255, 235, 59, 0.35)';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
      }
    }

    function drawPen(operation) {
      if (!operation.points.length) return;
      ctx.save();
      ctx.strokeStyle = operation.color;
      ctx.lineWidth = operation.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(operation.points[0].x, operation.points[0].y);
      for (let index = 1; index < operation.points.length; index += 1) {
        ctx.lineTo(operation.points[index].x, operation.points[index].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawArrow(operation) {
      const headLength = Math.max(14, operation.lineWidth * 4);
      const angle = Math.atan2(operation.endY - operation.startY, operation.endX - operation.startX);
      ctx.save();
      ctx.strokeStyle = operation.color;
      ctx.fillStyle = operation.color;
      ctx.lineWidth = operation.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(operation.startX, operation.startY);
      ctx.lineTo(operation.endX, operation.endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(operation.endX, operation.endY);
      ctx.lineTo(
        operation.endX - headLength * Math.cos(angle - Math.PI / 7),
        operation.endY - headLength * Math.sin(angle - Math.PI / 7)
      );
      ctx.lineTo(
        operation.endX - headLength * Math.cos(angle + Math.PI / 7),
        operation.endY - headLength * Math.sin(angle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function wrapAndDrawText(text, x, y, maxWidth, lineHeight) {
      const words = text.split(/\\s+/).filter(Boolean);
      let line = '';
      let cursorY = y;
      words.forEach((word, index) => {
        const candidate = line ? line + ' ' + word : word;
        if (ctx.measureText(candidate).width <= maxWidth || !line) {
          line = candidate;
        } else {
          ctx.fillText(line, x, cursorY);
          line = word;
          cursorY += lineHeight;
        }
        if (index === words.length - 1 && line) {
          ctx.fillText(line, x, cursorY);
        }
      });
    }

    function normalizeRect(operation) {
      return {
        x: operation.width < 0 ? operation.x + operation.width : operation.x,
        y: operation.height < 0 ? operation.y + operation.height : operation.y,
        width: Math.abs(operation.width),
        height: Math.abs(operation.height)
      };
    }

    function getCanvasPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }

    function getLineWidth() {
      return Number(lineWidthInput.value);
    }

    function updateToolUI() {
      toolGrid.querySelectorAll('[data-tool]').forEach(button => {
        button.classList.toggle('active', button.dataset.tool === activeTool);
      });
      const activeButton = toolGrid.querySelector('[data-tool="' + activeTool + '"]');
      toolValue.textContent = activeButton ? activeButton.textContent.replace(/\\s+/g, ' ') : activeTool;
      textControls.classList.toggle('hidden', activeTool !== 'text');
      canvas.style.cursor = activeTool === 'text' ? 'text' : 'crosshair';
    }

    function updateWidthLabel() {
      widthValue.textContent = lineWidthInput.value + ' px';
    }

    function updateActionButtons() {
      const hasOperations = operations.length > 0;
      undoBtn.disabled = !hasOperations;
      clearBtn.disabled = !hasOperations;
    }

    function loadImageFile(file) {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('Please select an image file.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('The selected image could not be decoded.'));
          image.src = reader.result;
        };
        reader.onerror = () => reject(new Error('The selected file could not be read.'));
        reader.readAsDataURL(file);
      });
    }

    function fitDimensions(width, height, maxDimension) {
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      return {
        width: Math.max(320, Math.round(width * scale)),
        height: Math.max(240, Math.round(height * scale))
      };
    }

    function setStatus(message) {
      statusEl.textContent = message;
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
