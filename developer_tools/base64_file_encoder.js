addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
  return serveMainPage();
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Base64 File Encoder / Decoder</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f0f2f5;
      color: #1f2937;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
      margin-bottom: 20px;
    }
    h1 {
      margin: 0 0 10px;
      color: #007bff;
      font-size: 2rem;
    }
    .lead {
      margin: 0 0 22px;
      color: #4b5563;
      line-height: 1.6;
    }
    .tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: #e5e7eb;
      color: #374151;
      border: none;
      border-radius: 999px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 600;
    }
    .tab-btn.active {
      background: #007bff;
      color: white;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
    }
    textarea, input, button {
      font: inherit;
    }
    textarea, input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      outline: none;
    }
    textarea:focus, input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.12);
    }
    textarea {
      min-height: 180px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px 18px;
      cursor: pointer;
      font-weight: 600;
      transition: background .2s ease;
    }
    button:hover {
      background: #0056b3;
    }
    .secondary {
      background: #6b7280;
    }
    .secondary:hover {
      background: #4b5563;
    }
    .dropzone {
      border: 2px dashed #9ec5fe;
      border-radius: 12px;
      padding: 24px;
      background: #f8fbff;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s ease, background .2s ease;
    }
    .dropzone.active {
      border-color: #007bff;
      background: #eef6ff;
    }
    .button-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 18px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-top: 18px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
    }
    .info-label {
      color: #6b7280;
      font-size: .85rem;
      margin-bottom: 6px;
    }
    .info-value {
      font-weight: 600;
      word-break: break-word;
    }
    .panel {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 18px;
      margin-top: 18px;
    }
    .status {
      display: none;
      margin-top: 18px;
      padding: 14px;
      border-radius: 10px;
    }
    .status.error { display: block; background: #fee2e2; color: #991b1b; }
    .status.success { display: block; background: #dcfce7; color: #166534; }
    .status.info { display: block; background: #dbeafe; color: #1d4ed8; }
    .preview {
      max-width: 100%;
      max-height: 260px;
      display: none;
      margin-top: 14px;
      border-radius: 12px;
      border: 1px solid #d1d5db;
      background: white;
    }
    .hidden { display: none; }
    .muted { color: #6b7280; font-size: .95rem; }
    @media (max-width: 640px) {
      .card { padding: 22px; }
      h1 { font-size: 1.7rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Base64 File Encoder / Decoder</h1>
      <p class="lead">Switch between file-to-base64 encoding and base64-to-file decoding. Everything happens locally in the browser using the FileReader API, <code>Uint8Array</code>, and browser download APIs.</p>

      <div class="tabs">
        <button type="button" class="tab-btn active" data-mode="encode">Encode mode</button>
        <button type="button" class="tab-btn" data-mode="decode">Decode mode</button>
      </div>

      <div id="status" class="status"></div>

      <div id="encodePanel">
        <div id="dropzone" class="dropzone" tabindex="0">
          <p><strong>Drop a file here</strong> or click to choose one</p>
          <p class="muted">The selected file is read locally and converted into base64.</p>
          <div class="button-row" style="justify-content:center; margin-top:14px;">
            <button type="button" id="chooseFileButton">Choose File</button>
            <button type="button" id="encodeButton" class="secondary">Encode File</button>
          </div>
          <input id="fileInput" type="file" hidden>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">File name</div>
            <div class="info-value" id="fileNameValue">No file selected</div>
          </div>
          <div class="info-box">
            <div class="info-label">File size</div>
            <div class="info-value" id="fileSizeValue">0 bytes</div>
          </div>
          <div class="info-box">
            <div class="info-label">MIME type</div>
            <div class="info-value" id="fileTypeValue">—</div>
          </div>
        </div>

        <div class="panel">
          <label for="base64Output">Base64 output</label>
          <textarea id="base64Output" readonly placeholder="Pure base64 output will appear here..."></textarea>
          <div class="button-row">
            <button type="button" id="copyBase64Button">Copy Base64</button>
          </div>
        </div>

        <div class="panel">
          <label for="dataUriOutput">Data URI</label>
          <textarea id="dataUriOutput" readonly placeholder="For example: data:image/png;base64,..."></textarea>
          <p class="muted" id="encodeByteCount">Base64 length: 0 characters</p>
          <img id="imagePreview" class="preview" alt="Image preview">
        </div>
      </div>

      <div id="decodePanel" class="hidden">
        <label for="decodeInput">Base64 input or data URI</label>
        <textarea id="decodeInput" placeholder="Paste raw base64 or a full data URI here..."></textarea>
        <div class="button-row">
          <button type="button" id="decodeButton">Decode</button>
          <button type="button" id="downloadButton" class="secondary">Download</button>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Detected type</div>
            <div class="info-value" id="decodedTypeValue">—</div>
          </div>
          <div class="info-box">
            <div class="info-label">Decoded size</div>
            <div class="info-value" id="decodedSizeValue">0 bytes</div>
          </div>
          <div class="info-box">
            <div class="info-label">Suggested file name</div>
            <div class="info-value" id="decodedNameValue">decoded.bin</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    var state = {
      mode: 'encode',
      selectedFile: null,
      decodedBlob: null,
      decodedName: 'decoded.bin'
    };

    window.addEventListener('DOMContentLoaded', function () {
      Array.from(document.querySelectorAll('.tab-btn')).forEach(function (button) {
        button.addEventListener('click', function () {
          switchMode(button.getAttribute('data-mode'));
        });
      });

      document.getElementById('chooseFileButton').addEventListener('click', function (event) {
        event.stopPropagation();
        document.getElementById('fileInput').click();
      });
      document.getElementById('encodeButton').addEventListener('click', encodeSelectedFile);
      document.getElementById('copyBase64Button').addEventListener('click', copyBase64);
      document.getElementById('decodeButton').addEventListener('click', decodeBase64Input);
      document.getElementById('downloadButton').addEventListener('click', downloadDecoded);

      var dropzone = document.getElementById('dropzone');
      dropzone.addEventListener('click', function () {
        document.getElementById('fileInput').click();
      });
      dropzone.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          document.getElementById('fileInput').click();
        }
      });
      dropzone.addEventListener('dragover', function (event) {
        event.preventDefault();
        dropzone.classList.add('active');
      });
      dropzone.addEventListener('dragleave', function () {
        dropzone.classList.remove('active');
      });
      dropzone.addEventListener('drop', function (event) {
        event.preventDefault();
        dropzone.classList.remove('active');
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
          setSelectedFile(event.dataTransfer.files[0]);
        }
      });

      document.getElementById('fileInput').addEventListener('change', function () {
        if (this.files && this.files[0]) {
          setSelectedFile(this.files[0]);
        }
      });
    });

    function switchMode(mode) {
      state.mode = mode;
      document.getElementById('encodePanel').classList.toggle('hidden', mode !== 'encode');
      document.getElementById('decodePanel').classList.toggle('hidden', mode !== 'decode');
      Array.from(document.querySelectorAll('.tab-btn')).forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-mode') === mode);
      });
      showMessage(mode === 'encode' ? 'Encode mode active.' : 'Decode mode active.', 'info');
    }

    function setSelectedFile(file) {
      state.selectedFile = file;
      document.getElementById('fileNameValue').textContent = file.name;
      document.getElementById('fileSizeValue').textContent = formatBytes(file.size);
      document.getElementById('fileTypeValue').textContent = file.type || 'application/octet-stream';
      showMessage('Selected file: ' + file.name, 'success');
    }

    function encodeSelectedFile() {
      if (!state.selectedFile) {
        showMessage('Choose a file before encoding.', 'error');
        return;
      }

      var reader = new FileReader();
      reader.onload = function (event) {
        var dataUrl = String(event.target.result || '');
        var commaIndex = dataUrl.indexOf(',');
        var base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
        document.getElementById('base64Output').value = base64;
        document.getElementById('dataUriOutput').value = dataUrl;
        document.getElementById('encodeByteCount').textContent = 'Base64 length: ' + base64.length.toLocaleString('en-US') + ' characters';

        var preview = document.getElementById('imagePreview');
        if ((state.selectedFile.type || '').indexOf('image/') === 0) {
          preview.src = dataUrl;
          preview.style.display = 'block';
        } else {
          preview.removeAttribute('src');
          preview.style.display = 'none';
        }

        showMessage('File encoded successfully.', 'success');
      };
      reader.onerror = function () {
        showMessage('Unable to read the selected file.', 'error');
      };
      reader.readAsDataURL(state.selectedFile);
    }

    function copyBase64() {
      var output = document.getElementById('base64Output').value;
      if (!output) {
        showMessage('Encode a file before copying the base64 output.', 'error');
        return;
      }
      navigator.clipboard.writeText(output).then(function () {
        showMessage('Base64 copied to the clipboard.', 'success');
      }).catch(function () {
        showMessage('Copy failed. You can still select the text manually.', 'error');
      });
    }

    function decodeBase64Input() {
      var input = document.getElementById('decodeInput').value.trim();
      if (!input) {
        showMessage('Paste base64 text or a data URI to decode.', 'error');
        return;
      }

      try {
        var extracted = extractBase64Payload(input);
        var binary = atob(extracted.base64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }

        var detected = detectFileType(bytes, extracted.hintedMime);
        state.decodedBlob = new Blob([bytes], { type: detected.mime });
        state.decodedName = 'decoded.' + detected.extension;

        document.getElementById('decodedTypeValue').textContent = detected.mime;
        document.getElementById('decodedSizeValue').textContent = formatBytes(bytes.length);
        document.getElementById('decodedNameValue').textContent = state.decodedName;
        showMessage('Base64 decoded successfully.', 'success');
      } catch (error) {
        state.decodedBlob = null;
        showMessage('Invalid base64 input. Remove extra characters and try again.', 'error');
      }
    }

    function downloadDecoded() {
      if (!state.decodedBlob) {
        showMessage('Decode some base64 before downloading the file.', 'error');
        return;
      }
      var url = URL.createObjectURL(state.decodedBlob);
      var link = document.createElement('a');
      link.href = url;
      link.download = state.decodedName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showMessage('Download started.', 'info');
    }

    function extractBase64Payload(input) {
      var trimmed = input.trim();
      var hintedMime = '';
      var match = trimmed.match(/^data:([^;,]+)?;base64,/i);
      if (match) {
        hintedMime = match[1] || '';
        trimmed = trimmed.slice(trimmed.indexOf(',') + 1);
      }
      return {
        hintedMime: hintedMime,
        base64: trimmed.replace(/\s+/g, '')
      };
    }

    function detectFileType(bytes, hintedMime) {
      if (hintedMime) {
        return mimeToFileInfo(hintedMime);
      }
      if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return { mime: 'image/png', extension: 'png' };
      }
      if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return { mime: 'image/jpeg', extension: 'jpg' };
      }
      if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return { mime: 'image/gif', extension: 'gif' };
      }
      if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return { mime: 'image/webp', extension: 'webp' };
      }
      if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return { mime: 'application/pdf', extension: 'pdf' };
      }
      if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
        return { mime: 'application/zip', extension: 'zip' };
      }
      if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
        return { mime: 'audio/wav', extension: 'wav' };
      }
      if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        return { mime: 'audio/mpeg', extension: 'mp3' };
      }
      if (isLikelyText(bytes)) {
        return { mime: 'text/plain', extension: 'txt' };
      }
      return { mime: 'application/octet-stream', extension: 'bin' };
    }

    function mimeToFileInfo(mime) {
      var map = {
        'image/png': { mime: 'image/png', extension: 'png' },
        'image/jpeg': { mime: 'image/jpeg', extension: 'jpg' },
        'image/gif': { mime: 'image/gif', extension: 'gif' },
        'image/webp': { mime: 'image/webp', extension: 'webp' },
        'application/pdf': { mime: 'application/pdf', extension: 'pdf' },
        'application/zip': { mime: 'application/zip', extension: 'zip' },
        'audio/wav': { mime: 'audio/wav', extension: 'wav' },
        'audio/mpeg': { mime: 'audio/mpeg', extension: 'mp3' },
        'text/plain': { mime: 'text/plain', extension: 'txt' }
      };
      return map[mime] || { mime: mime, extension: 'bin' };
    }

    function isLikelyText(bytes) {
      if (!bytes.length) {
        return false;
      }
      var printable = 0;
      for (var index = 0; index < bytes.length; index += 1) {
        var value = bytes[index];
        if (value === 9 || value === 10 || value === 13 || (value >= 32 && value <= 126)) {
          printable += 1;
        }
      }
      return printable / bytes.length > 0.9;
    }

    function formatBytes(value) {
      return Number(value || 0).toLocaleString('en-US') + ' bytes';
    }

    function showMessage(message, type) {
      var status = document.getElementById('status');
      status.className = 'status ' + type;
      status.textContent = message;
      status.style.display = 'block';
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
