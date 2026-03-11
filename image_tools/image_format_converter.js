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
  <title>Image Format Converter</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #020617;
      --panel: rgba(15, 23, 42, 0.82);
      --panel-soft: rgba(30, 41, 59, 0.85);
      --line: rgba(148, 163, 184, 0.22);
      --text: #f8fafc;
      --soft: #cbd5e1;
      --accent: #22d3ee;
      --accent-2: #818cf8;
      --good: #4ade80;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(34, 211, 238, 0.18), transparent 28%),
        radial-gradient(circle at top right, rgba(129, 140, 248, 0.18), transparent 26%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
    }

    .app {
      max-width: 1380px;
      margin: 0 auto;
      padding: 24px;
    }

    .hero,
    .panel {
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--panel);
      backdrop-filter: blur(10px);
      box-shadow: 0 18px 42px rgba(2, 6, 23, 0.28);
    }

    .hero {
      padding: 22px 24px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .hero h1 {
      margin: 0 0 6px;
      font-size: clamp(1.9rem, 3vw, 2.6rem);
    }

    .hero p {
      margin: 0;
      color: var(--soft);
      max-width: 760px;
      line-height: 1.5;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(320px, 380px) minmax(0, 1fr);
      gap: 20px;
    }

    .controls {
      padding: 20px;
      display: grid;
      gap: 18px;
      align-content: start;
    }

    .drop-zone {
      border: 2px dashed rgba(34, 211, 238, 0.45);
      border-radius: 18px;
      padding: 20px;
      text-align: center;
      background: rgba(15, 23, 42, 0.72);
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }

    .drop-zone:hover,
    .drop-zone.dragover {
      transform: translateY(-2px);
      border-color: var(--accent);
      background: rgba(30, 41, 59, 0.96);
    }

    .drop-zone strong {
      display: block;
      font-size: 1.05rem;
      margin-bottom: 8px;
    }

    .subtle {
      color: var(--soft);
      font-size: 0.94rem;
      line-height: 1.45;
    }

    .control-group {
      display: grid;
      gap: 10px;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 6px;
    }

    select,
    button,
    input[type="range"] {
      font: inherit;
    }

    select {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, 0.24);
      background: rgba(15, 23, 42, 0.96);
      color: var(--text);
      border-radius: 12px;
      padding: 12px 14px;
    }

    .radio-group {
      display: grid;
      gap: 10px;
    }

    .radio-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.7);
    }

    .value-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      color: var(--soft);
      font-size: 0.92rem;
    }

    button {
      border: none;
      border-radius: 14px;
      padding: 14px 16px;
      font-weight: bold;
      cursor: pointer;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: #082f49;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }

    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .content {
      padding: 20px;
      display: grid;
      gap: 16px;
      align-content: start;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .card {
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 18px;
      background: var(--panel-soft);
      padding: 16px;
    }

    .card h2 {
      margin: 0 0 10px;
      font-size: 1rem;
    }

    .info-list {
      display: grid;
      gap: 10px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-row span:last-child {
      color: var(--soft);
      text-align: right;
      overflow-wrap: anywhere;
    }

    .preview-shell {
      min-height: 480px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background:
        linear-gradient(45deg, rgba(51, 65, 85, 0.42) 25%, transparent 25%, transparent 75%, rgba(51, 65, 85, 0.42) 75%, rgba(51, 65, 85, 0.42)),
        linear-gradient(45deg, rgba(15, 23, 42, 0.82) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.82) 75%, rgba(15, 23, 42, 0.82));
      background-position: 0 0, 12px 12px;
      background-size: 24px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      position: relative;
    }

    .preview-shell img {
      display: block;
      max-width: 100%;
      max-height: 72vh;
      box-shadow: 0 18px 34px rgba(2, 6, 23, 0.42);
      border-radius: 12px;
      background: #fff;
    }

    .placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      gap: 10px;
      text-align: center;
      color: var(--soft);
      pointer-events: none;
    }

    .placeholder strong {
      color: var(--text);
      font-size: 1.08rem;
    }

    .status {
      min-height: 24px;
      color: #bae6fd;
      font-size: 0.95rem;
    }

    .status.error {
      color: #fecdd3;
    }

    .good {
      color: #bbf7d0;
      font-weight: bold;
    }

    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .cards {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <section class="hero">
      <div>
        <h1>Image Format Converter</h1>
        <p>Load a local image, inspect the original details, choose PNG, JPEG, or WebP output, preview the converted result, and download it instantly — all inside your browser.</p>
      </div>
      <div class="good">Client-side conversion only</div>
    </section>

    <div class="layout">
      <aside class="panel controls">
        <div id="dropZone" class="drop-zone" role="button" tabindex="0" aria-label="Upload image">
          <strong>Drop an image here</strong>
          <div class="subtle">or click to browse your computer</div>
          <div class="subtle" id="fileHint" style="margin-top: 10px;">Supported inputs: PNG, JPEG, WebP, GIF, SVG, and most browser-readable formats.</div>
        </div>
        <input id="fileInput" type="file" accept="image/*,.svg" hidden>

        <div class="control-group">
          <label>Output format</label>
          <div class="radio-group">
            <label class="radio-item"><input type="radio" name="outputFormat" value="png"> PNG</label>
            <label class="radio-item"><input type="radio" name="outputFormat" value="jpeg" checked> JPEG</label>
            <label class="radio-item"><input type="radio" name="outputFormat" value="webp"> WebP</label>
          </div>
        </div>

        <div id="qualityWrap" class="control-group">
          <div class="value-row">
            <label for="quality">Quality</label>
            <span id="qualityValue">92%</span>
          </div>
          <input id="quality" type="range" min="0" max="100" value="92">
          <div class="subtle">JPEG and WebP exports use this quality setting. PNG keeps lossless output.</div>
        </div>

        <button id="convertButton" type="button" disabled>Convert &amp; Download</button>
        <div class="status" id="statusMessage"></div>
      </aside>

      <section class="panel content">
        <div class="cards">
          <div class="card">
            <h2>Original file</h2>
            <div class="info-list">
              <div class="info-row"><span>Name</span><span id="originalName">—</span></div>
              <div class="info-row"><span>Format</span><span id="originalFormat">—</span></div>
              <div class="info-row"><span>Size</span><span id="originalSize">—</span></div>
              <div class="info-row"><span>Dimensions</span><span id="originalDimensions">—</span></div>
            </div>
          </div>

          <div class="card">
            <h2>Converted output</h2>
            <div class="info-list">
              <div class="info-row"><span>Format</span><span id="outputFormatLabel">JPEG</span></div>
              <div class="info-row"><span>Estimated size</span><span id="outputSize">—</span></div>
              <div class="info-row"><span>Difference</span><span id="sizeComparison">—</span></div>
              <div class="info-row"><span>Ready to download</span><span id="downloadName">—</span></div>
            </div>
          </div>
        </div>

        <div class="preview-shell">
          <img id="previewImage" alt="Converted preview" hidden>
          <div id="placeholder" class="placeholder">
            <strong>No converted preview yet</strong>
            <span>Upload an image and the converted preview will appear here.</span>
          </div>
        </div>
      </section>
    </div>
  </div>

  <script>
    (function () {
      const state = {
        file: null,
        image: null,
        convertedDataUrl: '',
        convertedBytes: 0
      };

      const elements = {
        fileInput: document.getElementById('fileInput'),
        dropZone: document.getElementById('dropZone'),
        fileHint: document.getElementById('fileHint'),
        qualityWrap: document.getElementById('qualityWrap'),
        quality: document.getElementById('quality'),
        qualityValue: document.getElementById('qualityValue'),
        convertButton: document.getElementById('convertButton'),
        statusMessage: document.getElementById('statusMessage'),
        originalName: document.getElementById('originalName'),
        originalFormat: document.getElementById('originalFormat'),
        originalSize: document.getElementById('originalSize'),
        originalDimensions: document.getElementById('originalDimensions'),
        outputFormatLabel: document.getElementById('outputFormatLabel'),
        outputSize: document.getElementById('outputSize'),
        sizeComparison: document.getElementById('sizeComparison'),
        downloadName: document.getElementById('downloadName'),
        previewImage: document.getElementById('previewImage'),
        placeholder: document.getElementById('placeholder')
      };

      function setStatus(message, isError) {
        elements.statusMessage.textContent = message || '';
        elements.statusMessage.className = isError ? 'status error' : 'status';
      }

      function formatBytes(bytes) {
        if (!Number.isFinite(bytes)) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
      }

      function getSelectedFormat() {
        const selected = document.querySelector('input[name="outputFormat"]:checked');
        return selected ? selected.value : 'jpeg';
      }

      function getMimeType(format) {
        if (format === 'png') return 'image/png';
        if (format === 'webp') return 'image/webp';
        return 'image/jpeg';
      }

      function getExtension(format) {
        if (format === 'jpeg') return 'jpg';
        return format;
      }

      function replaceExtension(fileName, extension) {
        const base = fileName ? fileName.replace(/\\.[^.]+$/, '') : 'converted-image';
        return base + '.' + extension;
      }

      function estimateBytesFromDataUrl(dataUrl) {
        const parts = dataUrl.split(',');
        if (parts.length < 2) return 0;
        const base64 = parts[1];
        const paddingMatch = base64.match(/=+$/);
        const padding = paddingMatch ? paddingMatch[0].length : 0;
        return Math.max(0, Math.floor(base64.length * 3 / 4) - padding);
      }

      function updateQualityUI() {
        const format = getSelectedFormat();
        elements.outputFormatLabel.textContent = format.toUpperCase();
        elements.qualityValue.textContent = elements.quality.value + '%';
        elements.qualityWrap.style.display = format === 'png' ? 'none' : 'grid';
        if (state.file && state.image) {
          convertImage(false);
        } else {
          elements.downloadName.textContent = replaceExtension('converted-image', getExtension(format));
        }
      }

      function updateOriginalInfo(file, image) {
        elements.originalName.textContent = file.name || '—';
        elements.originalFormat.textContent = file.type || 'Unknown';
        elements.originalSize.textContent = formatBytes(file.size);
        elements.originalDimensions.textContent = (image.naturalWidth || image.width) + ' × ' + (image.naturalHeight || image.height);
      }

      function updateOutputInfo(format, estimatedBytes) {
        elements.outputFormatLabel.textContent = format.toUpperCase();
        elements.outputSize.textContent = estimatedBytes ? formatBytes(estimatedBytes) : '—';
        elements.downloadName.textContent = state.file ? replaceExtension(state.file.name, getExtension(format)) : '—';

        if (state.file && estimatedBytes) {
          const difference = estimatedBytes - state.file.size;
          const direction = difference === 0 ? 'no change' : (difference < 0 ? 'smaller' : 'larger');
          const percent = state.file.size ? Math.abs(difference) / state.file.size * 100 : 0;
          const signedAmount = (difference > 0 ? '+' : '') + formatBytes(difference);
          elements.sizeComparison.textContent = signedAmount + ' (' + percent.toFixed(1) + '% ' + direction + ')';
        } else {
          elements.sizeComparison.textContent = '—';
        }
      }

      function buildCanvasFromImage(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
      }

      function convertImage(triggerDownload) {
        if (!state.image || !state.file) return;

        const format = getSelectedFormat();
        const mimeType = getMimeType(format);
        const quality = Number(elements.quality.value) / 100;
        const canvas = buildCanvasFromImage(state.image);
        const dataUrl = format === 'png'
          ? canvas.toDataURL(mimeType)
          : canvas.toDataURL(mimeType, quality);

        state.convertedDataUrl = dataUrl;
        state.convertedBytes = estimateBytesFromDataUrl(dataUrl);

        elements.previewImage.src = dataUrl;
        elements.previewImage.hidden = false;
        elements.placeholder.style.display = 'none';
        updateOutputInfo(format, state.convertedBytes);
        setStatus('Converted preview updated.', false);

        if (triggerDownload) {
          const downloadLink = document.createElement('a');
          downloadLink.href = dataUrl;
          downloadLink.download = replaceExtension(state.file.name, getExtension(format));
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setStatus('Converted file downloaded.', false);
        }
      }

      function loadFile(file) {
        if (!file || (!file.type.startsWith('image/') && !/\\.(png|jpe?g|webp|gif|svg)$/i.test(file.name))) {
          setStatus('Please select a supported image file.', true);
          return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
          const image = new Image();
          image.onload = function () {
            state.file = file;
            state.image = image;
            elements.convertButton.disabled = false;
            elements.fileHint.textContent = 'Loaded: ' + file.name + ' (' + formatBytes(file.size) + ')';
            updateOriginalInfo(file, image);
            convertImage(false);
            setStatus('Image loaded. Change the output settings or download immediately.', false);
          };
          image.onerror = function () {
            setStatus('That file could not be decoded as an image.', true);
          };
          image.src = event.target.result;
        };
        reader.onerror = function () {
          setStatus('The selected file could not be read.', true);
        };
        reader.readAsDataURL(file);
      }

      function handleFiles(fileList) {
        if (!fileList || !fileList.length) return;
        loadFile(fileList[0]);
      }

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
        handleFiles(event.target.files);
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
        handleFiles(event.dataTransfer.files);
      });

      document.querySelectorAll('input[name="outputFormat"]').forEach(function (radio) {
        radio.addEventListener('change', updateQualityUI);
      });

      elements.quality.addEventListener('input', updateQualityUI);
      elements.convertButton.addEventListener('click', function () {
        convertImage(true);
      });

      updateQualityUI();
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
