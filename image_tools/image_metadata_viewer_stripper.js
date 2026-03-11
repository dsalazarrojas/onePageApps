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
<title>Image Metadata Viewer & Stripper</title>
<style>
  :root {
    color-scheme: light;
    --bg: #f6f8fc;
    --panel: #ffffff;
    --ink: #142033;
    --muted: #667085;
    --line: #d9e2f0;
    --accent: #2563eb;
    --accent-soft: #dbeafe;
    --warning: #f59e0b;
    --warning-soft: #fff3d6;
    --success: #0f766e;
    --danger: #c2410c;
    --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
    background: linear-gradient(180deg, #eff6ff 0%, var(--bg) 28%, #eef2ff 100%);
    min-height: 100vh;
  }
  .shell {
    width: min(1180px, calc(100vw - 32px));
    margin: 28px auto;
    display: grid;
    gap: 18px;
  }
  .hero,
  .panel {
    background: var(--panel);
    border: 1px solid rgba(37, 99, 235, 0.08);
    border-radius: 22px;
    box-shadow: var(--shadow);
  }
  .hero {
    padding: 28px;
  }
  .hero h1 {
    margin: 0 0 10px;
    font-size: clamp(2rem, 4vw, 2.8rem);
  }
  .hero p {
    margin: 0;
    max-width: 760px;
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.6;
  }
  .layout {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 18px;
  }
  .panel {
    padding: 22px;
  }
  .drop-zone {
    border: 2px dashed #93c5fd;
    border-radius: 18px;
    background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
    padding: 26px 20px;
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .drop-zone.dragover {
    border-color: var(--accent);
    background: #e0ecff;
    transform: translateY(-1px);
  }
  .drop-zone strong {
    display: block;
    font-size: 1.05rem;
    margin-bottom: 8px;
  }
  .drop-zone span {
    display: block;
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .button,
  button {
    appearance: none;
    border: 0;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    padding: 12px 18px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
  }
  button:hover,
  .button:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px rgba(37, 99, 235, 0.2);
  }
  button.secondary {
    background: #0f766e;
    box-shadow: 0 10px 20px rgba(15, 118, 110, 0.18);
    width: 100%;
    margin-top: 14px;
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .status {
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid var(--line);
    color: var(--muted);
    min-height: 48px;
    line-height: 1.45;
  }
  .status.error {
    background: #fff7ed;
    border-color: #fdba74;
    color: var(--danger);
  }
  .stack {
    display: grid;
    gap: 16px;
  }
  .card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .card-title h2,
  .card-title h3 {
    margin: 0;
    font-size: 1.05rem;
  }
  .muted {
    color: var(--muted);
    font-size: 0.93rem;
  }
  .preview-wrap {
    background: #f8fafc;
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 18px;
  }
  #previewCanvas {
    width: 100%;
    max-height: 420px;
    background: repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%) 50% / 24px 24px;
    border-radius: 16px;
    display: block;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.94rem;
  }
  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 10px 12px;
    border-bottom: 1px solid #ebf0f7;
  }
  th {
    width: 38%;
    color: var(--muted);
    font-weight: 600;
  }
  tr.warning-row th,
  tr.warning-row td {
    background: var(--warning-soft);
    color: #9a5b00;
  }
  .table-shell {
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: #fff;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-soft);
    color: #1d4ed8;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 0.78rem;
    font-weight: 700;
  }
  .badge.warning {
    background: var(--warning-soft);
    color: #9a5b00;
  }
  .empty {
    padding: 18px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px dashed var(--line);
    color: var(--muted);
    line-height: 1.55;
  }
  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .meta-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <h1>Image Metadata Viewer &amp; Stripper</h1>
      <p>Drop in a JPEG, PNG, or any browser-supported image to inspect file properties, canvas dimensions, and basic JPEG EXIF fields. When you are ready, re-encode the image through canvas to strip embedded metadata and download a fresh PNG copy.</p>
    </section>

    <section class="layout">
      <aside class="panel stack">
        <div>
          <div class="card-title">
            <h2>Upload image</h2>
            <span class="badge">Local only</span>
          </div>
          <div id="dropZone" class="drop-zone" tabindex="0" role="button" aria-label="Upload image">
            <strong>Drag &amp; drop an image</strong>
            <span>or click to browse. JPEG files can expose EXIF camera and GPS information.</span>
            <span class="button">Choose image</span>
          </div>
          <input id="fileInput" type="file" accept="image/*" hidden>
          <button id="stripButton" class="secondary" disabled>Strip Metadata &amp; Download</button>
          <div id="statusBox" class="status">Choose an image to begin. Nothing is uploaded anywhere.</div>
        </div>

        <div>
          <div class="card-title">
            <h3>File details</h3>
            <span class="badge">Browser read</span>
          </div>
          <div class="table-shell">
            <table>
              <tbody id="fileInfoBody">
                <tr><th>Name</th><td>—</td></tr>
                <tr><th>File size</th><td>—</td></tr>
                <tr><th>MIME type</th><td>—</td></tr>
                <tr><th>Last modified</th><td>—</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </aside>

      <main class="stack">
        <section class="panel">
          <div class="card-title">
            <h2>Preview</h2>
            <span id="privacyBadge" class="badge">No GPS detected</span>
          </div>
          <div class="preview-wrap">
            <canvas id="previewCanvas" width="720" height="420"></canvas>
          </div>
        </section>

        <section class="meta-grid">
          <div class="panel">
            <div class="card-title">
              <h3>Image properties</h3>
              <span class="badge">Canvas</span>
            </div>
            <div class="table-shell">
              <table>
                <tbody id="imageInfoBody">
                  <tr><th>Width</th><td>—</td></tr>
                  <tr><th>Height</th><td>—</td></tr>
                  <tr><th>Color space</th><td>—</td></tr>
                  <tr><th>Estimated stripped PNG size</th><td>—</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="card-title">
              <h3>JPEG EXIF</h3>
              <span class="badge warning">Privacy aware</span>
            </div>
            <div id="exifEmpty" class="empty">JPEG EXIF fields appear here after you load a file. Non-JPEG images will report that no EXIF data was found.</div>
            <div id="exifTableShell" class="table-shell" hidden>
              <table>
                <tbody id="exifBody"></tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </section>
  </div>

  <canvas id="workingCanvas" hidden></canvas>

  <script>
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const stripButton = document.getElementById('stripButton');
    const statusBox = document.getElementById('statusBox');
    const previewCanvas = document.getElementById('previewCanvas');
    const workingCanvas = document.getElementById('workingCanvas');
    const fileInfoBody = document.getElementById('fileInfoBody');
    const imageInfoBody = document.getElementById('imageInfoBody');
    const exifBody = document.getElementById('exifBody');
    const exifEmpty = document.getElementById('exifEmpty');
    const exifTableShell = document.getElementById('exifTableShell');
    const privacyBadge = document.getElementById('privacyBadge');
    const previewCtx = previewCanvas.getContext('2d');
    const workingCtx = workingCanvas.getContext('2d', { willReadFrequently: true });

    const state = {
      file: null,
      image: null,
      arrayBuffer: null,
      strippedSizeText: '—'
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
        handleSelectedFile(file);
      }
    });

    fileInput.addEventListener('change', function(event) {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      if (file) {
        handleSelectedFile(file);
      }
    });

    stripButton.addEventListener('click', function() {
      if (!state.file || !state.image) {
        return;
      }
      const pngDataUrl = workingCanvas.toDataURL('image/png');
      const byteSize = estimateDataUrlBytes(pngDataUrl);
      state.strippedSizeText = formatBytes(byteSize) + ' (generated PNG)';
      renderImageInfo(state.image, state.lastExif || { colorSpace: '' });
      const anchor = document.createElement('a');
      anchor.href = pngDataUrl;
      anchor.download = buildDownloadName(state.file.name);
      anchor.click();
      setStatus('Metadata stripped. Downloaded a new PNG estimated at ' + formatBytes(byteSize) + '.', false);
    });

    async function handleSelectedFile(file) {
      if (!file.type.startsWith('image/')) {
        setStatus('Please choose a browser-supported image file.', true);
        return;
      }
      try {
        setStatus('Reading image locally…', false);
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const dataUrl = await readFileAsDataURL(file);
        const image = await loadImage(dataUrl);
        state.file = file;
        state.image = image;
        state.arrayBuffer = arrayBuffer;
        state.strippedSizeText = '—';
        drawCanvases(image);
        renderFileInfo(file);
        const exif = isJpegFile(file) ? parseJpegExif(arrayBuffer) : { found: false, tags: {}, gpsPresent: false, colorSpace: '' };
        state.lastExif = exif;
        renderImageInfo(image, exif);
        renderExifInfo(file, exif);
        stripButton.disabled = false;
        setStatus('Image loaded. Review the metadata below or download a stripped PNG copy.', false);
      } catch (error) {
        console.error(error);
        stripButton.disabled = true;
        setStatus(error && error.message ? error.message : 'Unable to read that file.', true);
      }
    }

    function drawCanvases(image) {
      workingCanvas.width = image.naturalWidth;
      workingCanvas.height = image.naturalHeight;
      workingCtx.clearRect(0, 0, workingCanvas.width, workingCanvas.height);
      workingCtx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

      const maxWidth = 720;
      const maxHeight = 420;
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
      const drawWidth = Math.max(1, Math.round(image.naturalWidth * scale));
      const drawHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      previewCanvas.width = drawWidth;
      previewCanvas.height = drawHeight;
      previewCtx.clearRect(0, 0, drawWidth, drawHeight);
      previewCtx.drawImage(image, 0, 0, drawWidth, drawHeight);
    }

    function renderFileInfo(file) {
      renderRows(fileInfoBody, [
        ['Name', file.name || '—'],
        ['File size', formatBytes(file.size || 0)],
        ['MIME type', file.type || 'Unknown'],
        ['Last modified', file.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown']
      ]);
    }

    function renderImageInfo(image, exif) {
      const colorSpace = exif.colorSpace || getCanvasColorSpace() || 'sRGB (canvas default)';
      const estimatedSize = state.strippedSizeText === '—'
        ? formatBytes(estimateDataUrlBytes(workingCanvas.toDataURL('image/png')))
        : state.strippedSizeText;
      renderRows(imageInfoBody, [
        ['Width', image.naturalWidth + ' px'],
        ['Height', image.naturalHeight + ' px'],
        ['Color space', colorSpace],
        ['Estimated stripped PNG size', estimatedSize]
      ]);
    }

    function renderExifInfo(file, exif) {
      const rows = [];
      if (!isJpegFile(file)) {
        exifTableShell.hidden = true;
        exifEmpty.hidden = false;
        exifEmpty.textContent = 'No EXIF data found. This file is not a JPEG image.';
        privacyBadge.textContent = 'No GPS detected';
        privacyBadge.className = 'badge';
        return;
      }
      if (!exif.found) {
        exifTableShell.hidden = true;
        exifEmpty.hidden = false;
        exifEmpty.textContent = 'No EXIF data found in this JPEG file.';
        privacyBadge.textContent = 'No GPS detected';
        privacyBadge.className = 'badge';
        return;
      }

      rows.push(['Make', exif.tags.Make || '—']);
      rows.push(['Model', exif.tags.Model || '—']);
      rows.push(['DateTime', exif.tags.DateTime || '—']);
      rows.push(['Orientation', exif.tags.Orientation || '—']);
      rows.push(['Software', exif.tags.Software || '—']);
      rows.push(['ExifVersion', exif.tags.ExifVersion || '—']);
      rows.push(['ImageWidth', exif.tags.ImageWidth ? exif.tags.ImageWidth + ' px' : '—']);
      rows.push(['ImageHeight', exif.tags.ImageHeight ? exif.tags.ImageHeight + ' px' : '—']);
      rows.push(['GPSInfo present', exif.gpsPresent ? 'Yes — remove this for privacy before sharing.' : 'No']);

      exifBody.innerHTML = '';
      rows.forEach(function(row) {
        const tr = document.createElement('tr');
        if (row[0].indexOf('GPS') === 0 && exif.gpsPresent) {
          tr.className = 'warning-row';
        }
        const th = document.createElement('th');
        th.textContent = row[0];
        const td = document.createElement('td');
        td.textContent = row[1];
        tr.appendChild(th);
        tr.appendChild(td);
        exifBody.appendChild(tr);
      });
      exifEmpty.hidden = true;
      exifTableShell.hidden = false;
      if (exif.gpsPresent) {
        privacyBadge.textContent = 'GPS metadata found';
        privacyBadge.className = 'badge warning';
      } else {
        privacyBadge.textContent = 'No GPS detected';
        privacyBadge.className = 'badge';
      }
    }

    function renderRows(target, rows) {
      target.innerHTML = '';
      rows.forEach(function(pair) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        const td = document.createElement('td');
        th.textContent = pair[0];
        td.textContent = pair[1];
        tr.appendChild(th);
        tr.appendChild(td);
        target.appendChild(tr);
      });
    }

    function setStatus(message, isError) {
      statusBox.textContent = message;
      statusBox.className = isError ? 'status error' : 'status';
    }

    function readFileAsArrayBuffer(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function() { reject(new Error('Could not read the image file.')); };
        reader.readAsArrayBuffer(file);
      });
    }

    function readFileAsDataURL(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function() { reject(new Error('Could not decode the image file.')); };
        reader.readAsDataURL(file);
      });
    }

    function loadImage(dataUrl) {
      return new Promise(function(resolve, reject) {
        const image = new Image();
        image.onload = function() { resolve(image); };
        image.onerror = function() { reject(new Error('The browser could not render this image.')); };
        image.src = dataUrl;
      });
    }

    function isJpegFile(file) {
      return file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name || '');
    }

    function buildDownloadName(fileName) {
      const baseName = (fileName || 'image').replace(/\.[^.]+$/, '');
      return baseName + '-stripped.png';
    }

    function getCanvasColorSpace() {
      if (typeof previewCtx.getContextAttributes === 'function') {
        const attributes = previewCtx.getContextAttributes();
        if (attributes && attributes.colorSpace) {
          return attributes.colorSpace;
        }
      }
      return '';
    }

    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) {
        return '0 B';
      }
      const units = ['B', 'KB', 'MB', 'GB'];
      let value = bytes;
      let index = 0;
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
      }
      return value.toFixed(value >= 100 || index === 0 ? 0 : value >= 10 ? 1 : 2) + ' ' + units[index];
    }

    function estimateDataUrlBytes(dataUrl) {
      const payload = String(dataUrl || '').split(',')[1] || '';
      const paddingMatch = payload.match(/=+$/);
      const padding = paddingMatch ? paddingMatch[0].length : 0;
      return Math.max(0, Math.floor(payload.length * 3 / 4) - padding);
    }

    function parseJpegExif(arrayBuffer) {
      const view = new DataView(arrayBuffer);
      if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) {
        return { found: false, tags: {}, gpsPresent: false, colorSpace: '' };
      }
      let offset = 2;
      while (offset + 4 <= view.byteLength) {
        if (view.getUint8(offset) !== 0xFF) {
          offset += 1;
          continue;
        }
        const marker = view.getUint8(offset + 1);
        offset += 2;
        if (marker === 0xD9 || marker === 0xDA) {
          break;
        }
        if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
          continue;
        }
        if (offset + 2 > view.byteLength) {
          break;
        }
        const segmentLength = view.getUint16(offset, false);
        if (segmentLength < 2 || offset + segmentLength > view.byteLength) {
          break;
        }
        if (marker === 0xE1 && segmentLength >= 8 && readAscii(view, offset + 2, 6) === 'Exif\u0000\u0000') {
          return parseExifSegment(view, offset + 8);
        }
        offset += segmentLength;
      }
      return { found: false, tags: {}, gpsPresent: false, colorSpace: '' };
    }

    function parseExifSegment(view, tiffStart) {
      const byteOrder = readAscii(view, tiffStart, 2);
      if (byteOrder !== 'II' && byteOrder !== 'MM') {
        return { found: false, tags: {}, gpsPresent: false, colorSpace: '' };
      }
      const littleEndian = byteOrder === 'II';
      if (view.getUint16(tiffStart + 2, littleEndian) !== 0x002A) {
        return { found: false, tags: {}, gpsPresent: false, colorSpace: '' };
      }
      const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
      const primaryIfd = readIfd(view, tiffStart, firstIfdOffset, littleEndian);
      const exifPointer = getNumericTag(primaryIfd, 0x8769);
      const gpsPointer = getNumericTag(primaryIfd, 0x8825);
      const exifIfd = exifPointer ? readIfd(view, tiffStart, exifPointer, littleEndian) : new Map();

      const width = getNumericTag(primaryIfd, 0x0100) || getNumericTag(exifIfd, 0xA002);
      const height = getNumericTag(primaryIfd, 0x0101) || getNumericTag(exifIfd, 0xA003);
      const colorSpaceValue = getNumericTag(exifIfd, 0xA001);

      return {
        found: true,
        gpsPresent: Boolean(gpsPointer),
        colorSpace: formatColorSpace(colorSpaceValue),
        tags: {
          Make: getTextTag(primaryIfd, 0x010F),
          Model: getTextTag(primaryIfd, 0x0110),
          DateTime: getTextTag(primaryIfd, 0x0132),
          Orientation: formatOrientation(getNumericTag(primaryIfd, 0x0112)),
          Software: getTextTag(primaryIfd, 0x0131),
          ExifVersion: formatExifVersion(exifIfd.get(0x9000)),
          ImageWidth: width,
          ImageHeight: height
        }
      };
    }

    function readIfd(view, tiffStart, ifdOffset, littleEndian) {
      const tags = new Map();
      const directoryStart = tiffStart + ifdOffset;
      if (directoryStart + 2 > view.byteLength) {
        return tags;
      }
      const entryCount = view.getUint16(directoryStart, littleEndian);
      for (let index = 0; index < entryCount; index += 1) {
        const entryOffset = directoryStart + 2 + index * 12;
        if (entryOffset + 12 > view.byteLength) {
          break;
        }
        const tag = view.getUint16(entryOffset, littleEndian);
        const type = view.getUint16(entryOffset + 2, littleEndian);
        const count = view.getUint32(entryOffset + 4, littleEndian);
        const value = readTagValue(view, tiffStart, entryOffset, type, count, littleEndian);
        if (value !== undefined) {
          tags.set(tag, value);
        }
      }
      return tags;
    }

    function readTagValue(view, tiffStart, entryOffset, type, count, littleEndian) {
      const typeSizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
      const typeSize = typeSizes[type];
      if (!typeSize || count === 0) {
        return undefined;
      }
      const byteCount = typeSize * count;
      let valueOffset = entryOffset + 8;
      if (byteCount > 4) {
        const pointer = view.getUint32(entryOffset + 8, littleEndian);
        valueOffset = tiffStart + pointer;
      }
      if (valueOffset < 0 || valueOffset + byteCount > view.byteLength) {
        return undefined;
      }
      switch (type) {
        case 1:
          return readNumberArray(view, valueOffset, count, 1, littleEndian, false);
        case 2:
          return readAscii(view, valueOffset, count).replace(/\u0000+$/g, '').trim();
        case 3:
          return readNumberArray(view, valueOffset, count, 2, littleEndian, false);
        case 4:
          return readNumberArray(view, valueOffset, count, 4, littleEndian, false);
        case 5:
          return readRationals(view, valueOffset, count, littleEndian, false);
        case 7:
          return readByteArray(view, valueOffset, count);
        case 9:
          return readNumberArray(view, valueOffset, count, 4, littleEndian, true);
        case 10:
          return readRationals(view, valueOffset, count, littleEndian, true);
        default:
          return undefined;
      }
    }

    function readNumberArray(view, offset, count, size, littleEndian, signed) {
      const values = [];
      for (let index = 0; index < count; index += 1) {
        const position = offset + index * size;
        let value;
        if (size === 1) {
          value = signed ? view.getInt8(position) : view.getUint8(position);
        } else if (size === 2) {
          value = signed ? view.getInt16(position, littleEndian) : view.getUint16(position, littleEndian);
        } else {
          value = signed ? view.getInt32(position, littleEndian) : view.getUint32(position, littleEndian);
        }
        values.push(value);
      }
      return values.length === 1 ? values[0] : values;
    }

    function readRationals(view, offset, count, littleEndian, signed) {
      const values = [];
      for (let index = 0; index < count; index += 1) {
        const position = offset + index * 8;
        const numerator = signed ? view.getInt32(position, littleEndian) : view.getUint32(position, littleEndian);
        const denominator = signed ? view.getInt32(position + 4, littleEndian) : view.getUint32(position + 4, littleEndian);
        values.push(denominator ? numerator / denominator : 0);
      }
      return values.length === 1 ? values[0] : values;
    }

    function readByteArray(view, offset, count) {
      const values = [];
      for (let index = 0; index < count; index += 1) {
        values.push(view.getUint8(offset + index));
      }
      return values;
    }

    function readAscii(view, offset, count) {
      let output = '';
      for (let index = 0; index < count && offset + index < view.byteLength; index += 1) {
        output += String.fromCharCode(view.getUint8(offset + index));
      }
      return output;
    }

    function getTextTag(map, tagId) {
      const value = map.get(tagId);
      return typeof value === 'string' && value ? value : '';
    }

    function getNumericTag(map, tagId) {
      const value = map.get(tagId);
      if (Array.isArray(value)) {
        return value.length ? Number(value[0]) : null;
      }
      if (typeof value === 'number') {
        return Number(value);
      }
      return null;
    }

    function formatExifVersion(value) {
      if (!value) {
        return '';
      }
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map(function(code) {
          return code >= 32 && code <= 126 ? String.fromCharCode(code) : '';
        }).join('').trim();
      }
      return String(value);
    }

    function formatOrientation(value) {
      const map = {
        1: '1 — Normal',
        2: '2 — Mirrored horizontal',
        3: '3 — Rotated 180°',
        4: '4 — Mirrored vertical',
        5: '5 — Mirrored horizontal then rotated 270° CW',
        6: '6 — Rotated 90° CW',
        7: '7 — Mirrored horizontal then rotated 90° CW',
        8: '8 — Rotated 270° CW'
      };
      return value ? (map[value] || String(value)) : '';
    }

    function formatColorSpace(value) {
      if (!value) {
        return '';
      }
      if (value === 1) {
        return 'sRGB';
      }
      if (value === 65535) {
        return 'Uncalibrated';
      }
      return 'EXIF ' + value;
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
