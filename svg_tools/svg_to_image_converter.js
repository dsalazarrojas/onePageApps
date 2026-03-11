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
  <title>SVG to Image Converter</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      padding: 24px;
      font-family: Inter, "Segoe UI", sans-serif;
      color: #0f172a;
      background: linear-gradient(180deg, #f5f3ff 0%, #f8fafc 100%);
    }
    .app {
      max-width: 1180px;
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
      max-width: 760px;
      color: #475569;
      line-height: 1.6;
    }
    .layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: #ffffff;
      border: 1px solid #ddd6fe;
      border-radius: 22px;
      padding: 20px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
    }
    .card h2 {
      margin: 0 0 14px;
      font-size: 1.15rem;
    }
    .dropzone {
      border: 2px dashed #a78bfa;
      border-radius: 18px;
      padding: 26px 18px;
      text-align: center;
      background: #f5f3ff;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      cursor: pointer;
    }
    .dropzone.dragover {
      background: #ede9fe;
      border-color: #7c3aed;
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
      margin-bottom: 6px;
      font-size: 0.8rem;
      color: #64748b;
    }
    .stat-value {
      font-size: 1rem;
      font-weight: 700;
    }
    .field-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 18px;
    }
    @media (max-width: 720px) {
      .field-grid {
        grid-template-columns: 1fr;
      }
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label {
      font-size: 0.9rem;
      font-weight: 600;
    }
    input, select {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 11px 12px;
      font: inherit;
      color: #0f172a;
      background: #ffffff;
    }
    input[type="color"] {
      padding: 4px;
      min-height: 46px;
    }
    input[type="range"] {
      padding: 0;
      border: none;
      background: transparent;
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      color: #334155;
      font-size: 0.92rem;
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
      box-shadow: 0 14px 28px rgba(124, 58, 237, 0.18);
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }
    .primary {
      background: #7c3aed;
      color: #ffffff;
    }
    .secondary {
      background: #e2e8f0;
      color: #0f172a;
    }
    .status {
      min-height: 24px;
      margin-top: 16px;
      font-size: 0.92rem;
      color: #6d28d9;
    }
    .status.error {
      color: #b91c1c;
    }
    .preview-card {
      display: grid;
      gap: 18px;
    }
    .preview-box {
      min-height: 360px;
      border: 1px solid #d8b4fe;
      border-radius: 18px;
      padding: 18px;
      background:
        linear-gradient(45deg, #e9d5ff 25%, transparent 25%),
        linear-gradient(-45deg, #e9d5ff 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e9d5ff 75%),
        linear-gradient(-45deg, transparent 75%, #e9d5ff 75%);
      background-size: 18px 18px;
      background-position: 0 0, 0 9px, 9px -9px, -9px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    }
    .preview-box img {
      max-width: 100%;
      max-height: 540px;
      border-radius: 12px;
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
      background: #ffffff;
    }
    .preview-box .empty {
      border: 1px dashed #c4b5fd;
      border-radius: 16px;
      padding: 18px;
      background: rgba(255, 255, 255, 0.8);
      color: #64748b;
    }
    .range-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
    }
    .quality-note {
      font-size: 0.85rem;
      color: #64748b;
    }
    canvas {
      display: none;
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="hero">
      <h1>SVG to Image Converter</h1>
      <p class="lead">Load an SVG, detect its dimensions, choose PNG or JPEG output, set a custom render size, then draw the vector artwork onto a canvas and download a ready-to-share bitmap image.</p>
    </div>

    <div class="layout">
      <section class="card">
        <h2>Upload & settings</h2>
        <label class="dropzone" id="dropzone">
          <input id="fileInput" type="file" accept=".svg,image/svg+xml">
          <strong>Drop an SVG here or click to browse</strong>
          <div class="muted">The converter reads the SVG text with FileReader, loads it into an object URL, then renders it onto a canvas for export.</div>
        </label>

        <div class="stats">
          <div class="stat"><span class="stat-label">Original SVG dimensions</span><span class="stat-value" id="dimensionLabel">800 × 600</span></div>
          <div class="stat"><span class="stat-label">Output file size estimate</span><span class="stat-value" id="sizeEstimate">—</span></div>
          <div class="stat"><span class="stat-label">Current file</span><span class="stat-value" id="fileName">—</span></div>
          <div class="stat"><span class="stat-label">Format</span><span class="stat-value" id="formatLabel">PNG</span></div>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="formatSelect">Output format</label>
            <select id="formatSelect">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>
          <div class="field">
            <label for="backgroundColor">Background color</label>
            <input id="backgroundColor" type="color" value="#ffffff">
          </div>
          <div class="field">
            <label for="widthInput">Output width</label>
            <input id="widthInput" type="number" min="1" step="1" value="800">
          </div>
          <div class="field">
            <label for="heightInput">Output height</label>
            <input id="heightInput" type="number" min="1" step="1" value="600">
          </div>
        </div>

        <label class="checkbox-row">
          <input id="lockAspectRatio" type="checkbox" checked>
          <span>Lock aspect ratio</span>
        </label>

        <div class="field" style="margin-top:18px;">
          <label for="qualitySlider">JPEG quality</label>
          <div class="range-row">
            <input id="qualitySlider" type="range" min="0" max="100" step="1" value="92">
            <strong id="qualityValue">92%</strong>
          </div>
          <div class="quality-note" id="qualityNote">Only used for JPEG exports.</div>
        </div>

        <div class="actions">
          <button class="primary" id="convertButton" disabled>Convert & Download</button>
          <button class="secondary" id="previewButton" disabled>Refresh Preview</button>
        </div>

        <div class="status" id="statusMessage">Upload an SVG file to start converting.</div>
      </section>

      <section class="preview-card">
        <div class="card">
          <h2>Converted result</h2>
          <div class="preview-box" id="previewBox">
            <div class="empty">Your converted PNG or JPEG preview will appear here.</div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <canvas id="renderCanvas"></canvas>

  <script>
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const formatSelect = document.getElementById('formatSelect');
    const backgroundColor = document.getElementById('backgroundColor');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const lockAspectRatio = document.getElementById('lockAspectRatio');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const qualityNote = document.getElementById('qualityNote');
    const convertButton = document.getElementById('convertButton');
    const previewButton = document.getElementById('previewButton');
    const statusMessage = document.getElementById('statusMessage');
    const previewBox = document.getElementById('previewBox');
    const dimensionLabel = document.getElementById('dimensionLabel');
    const sizeEstimate = document.getElementById('sizeEstimate');
    const fileNameEl = document.getElementById('fileName');
    const formatLabel = document.getElementById('formatLabel');
    const canvas = document.getElementById('renderCanvas');
    const context = canvas.getContext('2d');

    let svgText = '';
    let loadedImage = null;
    let currentFilename = 'converted';
    let naturalWidth = 800;
    let naturalHeight = 600;
    let aspectRatio = 800 / 600;
    let currentObjectUrl = null;
    let lastDataUrl = '';

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

    formatSelect.addEventListener('change', function () {
      formatLabel.textContent = formatSelect.value.toUpperCase();
      updateQualityUi();
    });

    qualitySlider.addEventListener('input', function () {
      qualityValue.textContent = qualitySlider.value + '%';
    });

    widthInput.addEventListener('input', function () {
      if (lockAspectRatio.checked) {
        const width = parsePositiveInt(widthInput.value);
        if (width) {
          heightInput.value = String(Math.max(1, Math.round(width / aspectRatio)));
        }
      }
    });

    heightInput.addEventListener('input', function () {
      if (lockAspectRatio.checked) {
        const height = parsePositiveInt(heightInput.value);
        if (height) {
          widthInput.value = String(Math.max(1, Math.round(height * aspectRatio)));
        }
      }
    });

    convertButton.addEventListener('click', function () {
      renderConversion(true);
    });

    previewButton.addEventListener('click', function () {
      renderConversion(false);
    });

    updateQualityUi();

    function loadSvgFile(file) {
      if (!/\\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') {
        setStatus('Please choose a valid SVG file.', true);
        return;
      }

      const reader = new FileReader();
      reader.onload = function () {
        svgText = String(reader.result || '');
        currentFilename = (file.name || 'converted').replace(/\\.svg$/i, '');
        fileNameEl.textContent = file.name || 'uploaded.svg';
        lastDataUrl = '';
        sizeEstimate.textContent = '—';
        loadSvgIntoImage(svgText);
      };
      reader.onerror = function () {
        setStatus('The SVG file could not be read.', true);
      };
      reader.readAsText(file);
    }

    function loadSvgIntoImage(source) {
      revokeCurrentObjectUrl();

      const blob = new Blob([source], { type: 'image/svg+xml' });
      const objectUrl = URL.createObjectURL(blob);
      currentObjectUrl = objectUrl;

      const image = new Image();
      image.onload = function () {
        const detected = detectDimensions(source, image.naturalWidth, image.naturalHeight);
        naturalWidth = detected.width;
        naturalHeight = detected.height;
        aspectRatio = naturalWidth / naturalHeight;
        loadedImage = image;
        widthInput.value = String(naturalWidth);
        heightInput.value = String(naturalHeight);
        dimensionLabel.textContent = naturalWidth + ' × ' + naturalHeight;
        convertButton.disabled = false;
        previewButton.disabled = false;
        setStatus('SVG loaded. Adjust the export options, then convert or refresh the preview.');
        renderConversion(false);
        revokeCurrentObjectUrl();
      };
      image.onerror = function () {
        revokeCurrentObjectUrl();
        loadedImage = null;
        convertButton.disabled = true;
        previewButton.disabled = true;
        setStatus('The SVG could not be rendered as an image. Check for unsupported external references or malformed markup.', true);
      };
      image.src = objectUrl;
    }

    function detectDimensions(source, imageWidth, imageHeight) {
      if (imageWidth > 0 && imageHeight > 0) {
        return { width: imageWidth, height: imageHeight };
      }

      const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
      const svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') {
        return { width: 800, height: 600 };
      }

      const width = parseDimension(svg.getAttribute('width'));
      const height = parseDimension(svg.getAttribute('height'));
      if (width && height) {
        return { width: width, height: height };
      }

      const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[\\s,]+/).map(Number);
      if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
        return { width: Math.round(viewBox[2]), height: Math.round(viewBox[3]) };
      }

      return { width: 800, height: 600 };
    }

    function renderConversion(triggerDownload) {
      if (!loadedImage) {
        return;
      }

      try {
        const width = parsePositiveInt(widthInput.value) || naturalWidth || 800;
        const height = parsePositiveInt(heightInput.value) || naturalHeight || 600;
        const format = formatSelect.value;
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = Math.min(1, Math.max(0, Number(qualitySlider.value) / 100));

        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.fillStyle = backgroundColor.value || '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(loadedImage, 0, 0, width, height);

        const dataUrl = format === 'jpeg'
          ? canvas.toDataURL(mimeType, quality)
          : canvas.toDataURL(mimeType);

        lastDataUrl = dataUrl;
        sizeEstimate.textContent = formatBytes(estimateDataUrlBytes(dataUrl));
        previewBox.innerHTML = '<img alt="Converted preview" src="' + dataUrl + '">';
        setStatus('Preview updated at ' + width + ' × ' + height + ' as ' + format.toUpperCase() + '.');

        if (triggerDownload) {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = currentFilename + '-' + width + 'x' + height + '.' + (format === 'jpeg' ? 'jpg' : 'png');
          link.click();
        }
      } catch (error) {
        setStatus(error.message || 'Conversion failed.', true);
      }
    }

    function estimateDataUrlBytes(dataUrl) {
      const parts = String(dataUrl).split(',');
      if (parts.length < 2) {
        return 0;
      }
      const base64 = parts[1];
      const padding = (base64.match(/=+$/) || [''])[0].length;
      return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
    }

    function parseDimension(value) {
      if (!value) {
        return 0;
      }
      const match = String(value).trim().match(/^([0-9]*\\.?[0-9]+)/);
      return match ? Math.max(0, Math.round(Number(match[1]))) : 0;
    }

    function parsePositiveInt(value) {
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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

    function revokeCurrentObjectUrl() {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }
    }

    function updateQualityUi() {
      const isJpeg = formatSelect.value === 'jpeg';
      qualitySlider.disabled = !isJpeg;
      qualityValue.style.opacity = isJpeg ? '1' : '0.5';
      qualityNote.textContent = isJpeg
        ? 'Used when generating JPEG output.'
        : 'PNG ignores JPEG quality settings.';
      formatLabel.textContent = formatSelect.value.toUpperCase();
    }

    function setStatus(message, isError) {
      statusMessage.textContent = message;
      statusMessage.classList.toggle('error', Boolean(isError));
    }

    window.addEventListener('beforeunload', revokeCurrentObjectUrl);
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
