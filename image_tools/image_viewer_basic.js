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
  <title>Image Viewer</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #020617;
      --panel: rgba(15, 23, 42, 0.82);
      --panel-soft: rgba(30, 41, 59, 0.86);
      --line: rgba(148, 163, 184, 0.18);
      --text: #f8fafc;
      --soft: #cbd5e1;
      --accent: #38bdf8;
      --accent-2: #818cf8;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 26%),
        radial-gradient(circle at top right, rgba(129, 140, 248, 0.16), transparent 24%),
        linear-gradient(180deg, #020617 0%, #0f172a 100%);
    }

    .app {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 18px;
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--panel);
      backdrop-filter: blur(10px);
      box-shadow: 0 18px 42px rgba(2, 6, 23, 0.28);
    }

    .toolbar {
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .toolbar h1 {
      margin: 0 0 4px;
      font-size: clamp(1.9rem, 3vw, 2.5rem);
    }

    .toolbar p {
      margin: 0;
      color: var(--soft);
      line-height: 1.45;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    button {
      border: none;
      border-radius: 14px;
      padding: 12px 16px;
      font: inherit;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }

    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .primary {
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: #082f49;
    }

    .secondary {
      background: rgba(51, 65, 85, 0.96);
      color: var(--text);
    }

    .zoom-label {
      min-width: 84px;
      text-align: center;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.18);
      color: var(--soft);
      font-weight: bold;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 18px;
    }

    .viewer-panel {
      padding: 18px;
      display: grid;
      gap: 14px;
    }

    .status {
      min-height: 24px;
      color: #bae6fd;
      font-size: 0.95rem;
    }

    .status.error {
      color: #fecdd3;
    }

    .stage {
      position: relative;
      min-height: 620px;
      border-radius: 20px;
      border: 1px solid var(--line);
      background:
        linear-gradient(45deg, rgba(51, 65, 85, 0.42) 25%, transparent 25%, transparent 75%, rgba(51, 65, 85, 0.42) 75%, rgba(51, 65, 85, 0.42)),
        linear-gradient(45deg, rgba(15, 23, 42, 0.82) 25%, transparent 25%, transparent 75%, rgba(15, 23, 42, 0.82) 75%, rgba(15, 23, 42, 0.82));
      background-position: 0 0, 12px 12px;
      background-size: 24px 24px;
      overflow: hidden;
      user-select: none;
    }

    .stage.dragover {
      outline: 2px dashed rgba(56, 189, 248, 0.72);
      outline-offset: -12px;
    }

    .image-layer {
      position: absolute;
      inset: 0;
      overflow: hidden;
      cursor: grab;
    }

    .image-layer.dragging {
      cursor: grabbing;
    }

    .image-layer img {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: top left;
      will-change: transform;
      max-width: none;
      max-height: none;
      image-rendering: auto;
      user-select: none;
      -webkit-user-drag: none;
      box-shadow: 0 20px 38px rgba(2, 6, 23, 0.4);
      background: #fff;
    }

    .empty-state {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
      color: var(--soft);
      pointer-events: none;
    }

    .empty-state strong {
      color: var(--text);
      font-size: 1.08rem;
    }

    .info-panel {
      padding: 18px;
      display: grid;
      gap: 14px;
      align-content: start;
    }

    .info-card,
    .thumb-strip {
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 18px;
      background: var(--panel-soft);
    }

    .info-card {
      padding: 16px;
    }

    .info-card h2 {
      margin: 0 0 12px;
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

    .thumb-strip {
      padding: 12px;
      display: flex;
      gap: 12px;
      overflow-x: auto;
      min-height: 116px;
    }

    .thumb {
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.9);
      color: var(--text);
      border-radius: 16px;
      padding: 8px;
      width: 110px;
      flex: 0 0 auto;
      display: grid;
      gap: 8px;
      cursor: pointer;
      text-align: left;
    }

    .thumb.active {
      border-color: rgba(56, 189, 248, 0.78);
      box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.45);
    }

    .thumb img {
      width: 100%;
      height: 62px;
      object-fit: cover;
      border-radius: 10px;
      background: #0f172a;
    }

    .thumb-name {
      font-size: 0.78rem;
      line-height: 1.3;
      color: var(--soft);
      overflow-wrap: anywhere;
    }

    .hidden {
      display: none !important;
    }

    @media (max-width: 1080px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .stage {
        min-height: 500px;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <section class="panel toolbar">
      <div>
        <h1>Image Viewer</h1>
        <p>Open multiple local images, switch from the thumbnail strip, zoom in or out, fit the image to the stage, and pan by dragging when zoomed in.</p>
      </div>
      <div class="toolbar-actions">
        <button id="openButton" class="primary" type="button">Open Images</button>
        <button id="zoomOutButton" class="secondary" type="button" disabled>−</button>
        <button id="fitButton" class="secondary" type="button" disabled>Fit to window</button>
        <button id="zoomInButton" class="secondary" type="button" disabled>+</button>
        <div id="zoomLabel" class="zoom-label">100%</div>
      </div>
    </section>

    <div class="layout">
      <section class="panel viewer-panel">
        <div id="statusMessage" class="status">Keyboard shortcuts: + zoom in, - zoom out, 0 fit, and left/right arrows switch images.</div>
        <div id="stage" class="stage">
          <div id="imageLayer" class="image-layer">
            <img id="viewerImage" alt="Selected image" hidden draggable="false">
          </div>
          <div id="emptyState" class="empty-state">
            <strong>No images loaded yet</strong>
            <span>Drop one or more images here, or use the Open Images button to browse.</span>
          </div>
        </div>
        <div id="thumbStrip" class="thumb-strip"></div>
      </section>

      <aside class="panel info-panel">
        <div class="info-card">
          <h2>File information</h2>
          <div class="info-list">
            <div class="info-row"><span>Filename</span><span id="infoName">—</span></div>
            <div class="info-row"><span>Size</span><span id="infoSize">—</span></div>
            <div class="info-row"><span>Dimensions</span><span id="infoDimensions">—</span></div>
            <div class="info-row"><span>Type</span><span id="infoType">—</span></div>
            <div class="info-row"><span>Last modified</span><span id="infoModified">—</span></div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <input id="fileInput" type="file" accept="image/*,.svg" multiple hidden>

  <script>
    (function () {
      const state = {
        items: [],
        activeIndex: -1,
        scale: 1,
        fitScale: 1,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragOriginX: 0,
        dragOriginY: 0
      };

      const elements = {
        fileInput: document.getElementById('fileInput'),
        openButton: document.getElementById('openButton'),
        zoomOutButton: document.getElementById('zoomOutButton'),
        zoomInButton: document.getElementById('zoomInButton'),
        fitButton: document.getElementById('fitButton'),
        zoomLabel: document.getElementById('zoomLabel'),
        statusMessage: document.getElementById('statusMessage'),
        stage: document.getElementById('stage'),
        imageLayer: document.getElementById('imageLayer'),
        viewerImage: document.getElementById('viewerImage'),
        emptyState: document.getElementById('emptyState'),
        thumbStrip: document.getElementById('thumbStrip'),
        infoName: document.getElementById('infoName'),
        infoSize: document.getElementById('infoSize'),
        infoDimensions: document.getElementById('infoDimensions'),
        infoType: document.getElementById('infoType'),
        infoModified: document.getElementById('infoModified')
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

      function formatDate(timestamp) {
        if (!timestamp) return '—';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString();
      }

      function getActiveItem() {
        return state.activeIndex >= 0 ? state.items[state.activeIndex] : null;
      }

      function updateControls() {
        const hasImage = !!getActiveItem();
        elements.zoomOutButton.disabled = !hasImage;
        elements.zoomInButton.disabled = !hasImage;
        elements.fitButton.disabled = !hasImage;
        elements.viewerImage.hidden = !hasImage;
        elements.emptyState.style.display = hasImage ? 'none' : 'flex';
      }

      function updateInfoPanel(item) {
        if (!item) {
          elements.infoName.textContent = '—';
          elements.infoSize.textContent = '—';
          elements.infoDimensions.textContent = '—';
          elements.infoType.textContent = '—';
          elements.infoModified.textContent = '—';
          return;
        }

        elements.infoName.textContent = item.name;
        elements.infoSize.textContent = formatBytes(item.size);
        elements.infoDimensions.textContent = item.width + ' × ' + item.height;
        elements.infoType.textContent = item.type || 'Unknown';
        elements.infoModified.textContent = formatDate(item.lastModified);
      }

      function clampPan() {
        const item = getActiveItem();
        if (!item) return;

        const rect = elements.stage.getBoundingClientRect();
        const scaledWidth = item.width * state.scale;
        const scaledHeight = item.height * state.scale;

        if (scaledWidth <= rect.width) {
          state.offsetX = (rect.width - scaledWidth) / 2;
        } else {
          const minX = rect.width - scaledWidth;
          state.offsetX = Math.min(0, Math.max(minX, state.offsetX));
        }

        if (scaledHeight <= rect.height) {
          state.offsetY = (rect.height - scaledHeight) / 2;
        } else {
          const minY = rect.height - scaledHeight;
          state.offsetY = Math.min(0, Math.max(minY, state.offsetY));
        }
      }

      function applyTransform() {
        elements.viewerImage.style.transform =
          'translate(' + state.offsetX + 'px, ' + state.offsetY + 'px) scale(' + state.scale + ')';
        elements.zoomLabel.textContent = Math.round(state.scale * 100) + '%';
      }

      function setScale(newScale, anchorX, anchorY) {
        const item = getActiveItem();
        if (!item) return;

        const rect = elements.stage.getBoundingClientRect();
        const minScale = Math.min(state.fitScale, 1);
        const scale = Math.min(Math.max(newScale, minScale * 0.5), Math.max(8, minScale));
        const x = typeof anchorX === 'number' ? anchorX : rect.width / 2;
        const y = typeof anchorY === 'number' ? anchorY : rect.height / 2;
        const imageX = (x - state.offsetX) / state.scale;
        const imageY = (y - state.offsetY) / state.scale;

        state.scale = scale;
        state.offsetX = x - imageX * state.scale;
        state.offsetY = y - imageY * state.scale;
        clampPan();
        applyTransform();
      }

      function fitToWindow() {
        const item = getActiveItem();
        if (!item) return;

        const rect = elements.stage.getBoundingClientRect();
        const padding = 24;
        const availableWidth = Math.max(1, rect.width - padding * 2);
        const availableHeight = Math.max(1, rect.height - padding * 2);
        state.fitScale = Math.min(availableWidth / item.width, availableHeight / item.height, 1);
        state.scale = state.fitScale;
        state.offsetX = (rect.width - item.width * state.scale) / 2;
        state.offsetY = (rect.height - item.height * state.scale) / 2;
        clampPan();
        applyTransform();
      }

      function renderThumbnails() {
        elements.thumbStrip.innerHTML = '';

        if (!state.items.length) {
          const placeholder = document.createElement('div');
          placeholder.className = 'subtle';
          placeholder.style.color = '#cbd5e1';
          placeholder.style.padding = '10px';
          placeholder.textContent = 'Thumbnails will appear here after you load images.';
          elements.thumbStrip.appendChild(placeholder);
          return;
        }

        state.items.forEach(function (item, index) {
          const thumbButton = document.createElement('button');
          thumbButton.type = 'button';
          thumbButton.className = 'thumb' + (index === state.activeIndex ? ' active' : '');

          const image = document.createElement('img');
          image.src = item.url;
          image.alt = item.name;

          const name = document.createElement('div');
          name.className = 'thumb-name';
          name.textContent = item.name;

          thumbButton.appendChild(image);
          thumbButton.appendChild(name);
          thumbButton.addEventListener('click', function () {
            selectIndex(index);
          });

          elements.thumbStrip.appendChild(thumbButton);
        });
      }

      function selectIndex(index) {
        if (index < 0 || index >= state.items.length) return;

        state.activeIndex = index;
        const item = getActiveItem();
        elements.viewerImage.src = item.url;
        elements.viewerImage.hidden = false;
        updateInfoPanel(item);
        updateControls();
        renderThumbnails();
        requestAnimationFrame(function () {
          fitToWindow();
        });
        setStatus('Viewing ' + item.name + '. Drag to pan when zoomed in.', false);
      }

      function canPan() {
        const item = getActiveItem();
        if (!item) return false;
        const rect = elements.stage.getBoundingClientRect();
        return item.width * state.scale > rect.width + 2 || item.height * state.scale > rect.height + 2;
      }

      function zoomBy(multiplier) {
        if (!getActiveItem()) return;
        const rect = elements.stage.getBoundingClientRect();
        setScale(state.scale * multiplier, rect.width / 2, rect.height / 2);
      }

      function createItem(file) {
        return new Promise(function (resolve, reject) {
          const url = URL.createObjectURL(file);
          const image = new Image();
          image.onload = function () {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              width: image.naturalWidth || image.width,
              height: image.naturalHeight || image.height,
              url: url
            });
          };
          image.onerror = function () {
            URL.revokeObjectURL(url);
            reject(new Error('Unable to open ' + file.name));
          };
          image.src = url;
        });
      }

      function loadFiles(fileList) {
        const files = Array.prototype.slice.call(fileList || []).filter(function (file) {
          return file.type.indexOf('image/') === 0 || /\\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
        });

        if (!files.length) {
          setStatus('Please drop or choose one or more supported image files.', true);
          return;
        }

        Promise.all(files.map(createItem))
          .then(function (items) {
            const startingIndex = state.items.length;
            state.items = state.items.concat(items);
            renderThumbnails();
            updateControls();
            selectIndex(state.activeIndex >= 0 ? state.activeIndex : startingIndex);
            setStatus('Loaded ' + items.length + ' image' + (items.length === 1 ? '' : 's') + '.', false);
          })
          .catch(function (error) {
            setStatus(error.message || 'Some files could not be loaded.', true);
          });
      }

      function navigate(delta) {
        if (!state.items.length) return;
        let next = state.activeIndex + delta;
        if (next < 0) next = state.items.length - 1;
        if (next >= state.items.length) next = 0;
        selectIndex(next);
      }

      elements.openButton.addEventListener('click', function () {
        elements.fileInput.click();
      });

      elements.fileInput.addEventListener('change', function (event) {
        loadFiles(event.target.files);
      });

      elements.zoomInButton.addEventListener('click', function () {
        zoomBy(1.2);
      });

      elements.zoomOutButton.addEventListener('click', function () {
        zoomBy(1 / 1.2);
      });

      elements.fitButton.addEventListener('click', function () {
        fitToWindow();
      });

      ['dragenter', 'dragover'].forEach(function (eventName) {
        elements.stage.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          elements.stage.classList.add('dragover');
        });
      });

      ['dragleave', 'dragend', 'drop'].forEach(function (eventName) {
        elements.stage.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          elements.stage.classList.remove('dragover');
        });
      });

      elements.stage.addEventListener('drop', function (event) {
        loadFiles(event.dataTransfer.files);
      });

      elements.imageLayer.addEventListener('mousedown', function (event) {
        if (!getActiveItem() || !canPan()) return;
        state.isDragging = true;
        state.dragStartX = event.clientX;
        state.dragStartY = event.clientY;
        state.dragOriginX = state.offsetX;
        state.dragOriginY = state.offsetY;
        elements.imageLayer.classList.add('dragging');
      });

      window.addEventListener('mousemove', function (event) {
        if (!state.isDragging) return;
        state.offsetX = state.dragOriginX + (event.clientX - state.dragStartX);
        state.offsetY = state.dragOriginY + (event.clientY - state.dragStartY);
        clampPan();
        applyTransform();
      });

      window.addEventListener('mouseup', function () {
        state.isDragging = false;
        elements.imageLayer.classList.remove('dragging');
      });

      window.addEventListener('resize', function () {
        if (getActiveItem()) {
          fitToWindow();
        }
      });

      window.addEventListener('keydown', function (event) {
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          zoomBy(1.2);
        } else if (event.key === '-' || event.key === '_') {
          event.preventDefault();
          zoomBy(1 / 1.2);
        } else if (event.key === '0') {
          event.preventDefault();
          fitToWindow();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          navigate(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          navigate(-1);
        }
      });

      window.addEventListener('beforeunload', function () {
        state.items.forEach(function (item) {
          URL.revokeObjectURL(item.url);
        });
      });

      updateControls();
      renderThumbnails();
      updateInfoPanel(null);
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
