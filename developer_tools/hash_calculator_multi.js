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
  <title>Multi-Algorithm Hash Calculator</title>
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
      margin: 0 0 24px;
      color: #4b5563;
      line-height: 1.6;
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
    textarea {
      width: 100%;
      min-height: 180px;
      padding: 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      resize: vertical;
      outline: none;
    }
    textarea:focus, .file-button:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.12);
    }
    .dropzone {
      border: 2px dashed #9ec5fe;
      border-radius: 12px;
      padding: 24px;
      background: #f8fbff;
      text-align: center;
      transition: border-color .2s ease, background .2s ease;
      cursor: pointer;
    }
    .dropzone.active {
      border-color: #007bff;
      background: #eef6ff;
    }
    .dropzone strong {
      color: #007bff;
    }
    .button-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
    button, .file-button {
      background: #007bff;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px 18px;
      cursor: pointer;
      font-weight: 600;
      transition: background .2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    button:hover, .file-button:hover {
      background: #0056b3;
    }
    .secondary {
      background: #6b7280;
    }
    .secondary:hover {
      background: #4b5563;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 18px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
    }
    .meta-label {
      font-size: .85rem;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .meta-value {
      font-weight: 600;
      word-break: break-word;
    }
    .status {
      display: none;
      margin-top: 18px;
      padding: 14px;
      border-radius: 10px;
    }
    .status.error {
      display: block;
      background: #fee2e2;
      color: #991b1b;
    }
    .status.success {
      display: block;
      background: #dcfce7;
      color: #166534;
    }
    .status.info {
      display: block;
      background: #dbeafe;
      color: #1d4ed8;
    }
    .table-wrap {
      overflow-x: auto;
      margin-top: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: #374151;
      background: #f8fafc;
      font-size: .95rem;
    }
    code.hash-output {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      word-break: break-all;
      font-size: .9rem;
      color: #111827;
      background: #f8fafc;
      padding: 6px 8px;
      border-radius: 8px;
      display: inline-block;
      min-width: 100%;
    }
    .mini-btn {
      padding: 8px 12px;
      font-size: .9rem;
      border-radius: 8px;
    }
    .muted {
      color: #6b7280;
      font-size: .95rem;
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 18px 0;
      color: #6b7280;
      font-weight: 600;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #d1d5db;
    }
    @media (max-width: 640px) {
      .card { padding: 22px; }
      h1 { font-size: 1.7rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Multi-Algorithm Hash Calculator</h1>
      <p class="lead">Hash pasted text or a local file entirely in your browser. MD5 is calculated with a pure JavaScript RFC 1321 implementation, while SHA-1, SHA-256, SHA-384, and SHA-512 use the browser's Web Crypto API.</p>

      <label for="textInput">Text input</label>
      <textarea id="textInput" placeholder="Paste or type text here. If you also choose a file, the file will be hashed instead of the text."></textarea>

      <div class="divider">or</div>

      <div id="dropzone" class="dropzone" tabindex="0">
        <p><strong>Drop a file here</strong> or click to browse</p>
        <p class="muted">Supports drag-and-drop and the file picker.</p>
        <div class="button-row" style="justify-content:center; margin-top:14px;">
          <button type="button" id="chooseFileButton" class="file-button">Choose File</button>
          <button type="button" id="clearFileButton" class="secondary">Clear File</button>
        </div>
        <input id="fileInput" type="file" hidden>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">Selected source</div>
          <div class="meta-value" id="sourceValue">Text input</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Input size</div>
          <div class="meta-value" id="sizeValue">0 bytes</div>
        </div>
      </div>

      <div class="button-row">
        <button type="button" id="calculateButton">Calculate Hashes</button>
      </div>

      <div id="status" class="status"></div>
    </div>

    <div class="card" id="resultsCard" style="display:none;">
      <h2 style="margin:0 0 10px; color:#111827;">Hash results</h2>
      <p class="muted" style="margin:0 0 8px;">All values below are computed locally in the page without sending your content anywhere.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:140px;">Algorithm</th>
              <th>Digest</th>
              <th style="width:100px;">Action</th>
            </tr>
          </thead>
          <tbody id="resultsBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    var state = { selectedFile: null };
    var md5S = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    var md5K = [];
    for (var kIndex = 0; kIndex < 64; kIndex += 1) {
      md5K[kIndex] = Math.floor(Math.abs(Math.sin(kIndex + 1)) * 4294967296) >>> 0;
    }

    window.addEventListener('DOMContentLoaded', function () {
      var dropzone = document.getElementById('dropzone');
      var fileInput = document.getElementById('fileInput');
      var chooseFileButton = document.getElementById('chooseFileButton');
      var clearFileButton = document.getElementById('clearFileButton');
      var calculateButton = document.getElementById('calculateButton');
      var resultsBody = document.getElementById('resultsBody');
      var textInput = document.getElementById('textInput');

      chooseFileButton.addEventListener('click', function (event) {
        event.stopPropagation();
        fileInput.click();
      });

      clearFileButton.addEventListener('click', function (event) {
        event.stopPropagation();
        clearSelectedFile();
      });

      dropzone.addEventListener('click', function () {
        fileInput.click();
      });

      dropzone.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          fileInput.click();
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

      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files[0]) {
          setSelectedFile(fileInput.files[0]);
        }
      });

      calculateButton.addEventListener('click', calculateHashes);
      textInput.addEventListener('input', function () {
        if (!state.selectedFile) {
          document.getElementById('sizeValue').textContent = formatBytes(new TextEncoder().encode(textInput.value).length);
        }
      });

      resultsBody.addEventListener('click', function (event) {
        if (event.target.matches('button[data-copy]')) {
          copyText(event.target.getAttribute('data-copy'));
        }
      });
    });

    function setSelectedFile(file) {
      state.selectedFile = file || null;
      document.getElementById('sourceValue').textContent = state.selectedFile ? ('File: ' + state.selectedFile.name) : 'Text input';
      document.getElementById('sizeValue').textContent = state.selectedFile ? formatBytes(state.selectedFile.size) : formatBytes(new TextEncoder().encode(document.getElementById('textInput').value).length);
      showMessage(state.selectedFile ? ('Selected file: ' + state.selectedFile.name) : 'File cleared. Text input is active again.', 'success');
    }

    function clearSelectedFile() {
      state.selectedFile = null;
      document.getElementById('fileInput').value = '';
      document.getElementById('sourceValue').textContent = 'Text input';
      document.getElementById('sizeValue').textContent = formatBytes(new TextEncoder().encode(document.getElementById('textInput').value).length);
      showMessage('File cleared. Text input is active again.', 'info');
    }

    async function calculateHashes() {
      var textValue = document.getElementById('textInput').value;
      var bytes;
      var sourceLabel;

      if (state.selectedFile) {
        sourceLabel = 'File: ' + state.selectedFile.name;
        bytes = new Uint8Array(await state.selectedFile.arrayBuffer());
      } else {
        if (!textValue) {
          showMessage('Enter some text or choose a file before calculating hashes.', 'error');
          return;
        }
        sourceLabel = 'Text input';
        bytes = new TextEncoder().encode(textValue);
      }

      document.getElementById('sourceValue').textContent = sourceLabel;
      document.getElementById('sizeValue').textContent = formatBytes(bytes.length);
      showMessage('Calculating hashes locally in your browser...', 'info');

      try {
        var results = await Promise.all([
          Promise.resolve({ label: 'MD5', value: md5Bytes(bytes) }),
          digestHex(bytes, 'SHA-1').then(function (value) { return { label: 'SHA-1', value: value }; }),
          digestHex(bytes, 'SHA-256').then(function (value) { return { label: 'SHA-256', value: value }; }),
          digestHex(bytes, 'SHA-384').then(function (value) { return { label: 'SHA-384', value: value }; }),
          digestHex(bytes, 'SHA-512').then(function (value) { return { label: 'SHA-512', value: value }; })
        ]);

        var resultsBody = document.getElementById('resultsBody');
        resultsBody.innerHTML = results.map(function (item) {
          return '<tr>' +
            '<td><strong>' + escapeHtml(item.label) + '</strong></td>' +
            '<td><code class="hash-output">' + escapeHtml(item.value) + '</code></td>' +
            '<td><button type="button" class="mini-btn" data-copy="' + item.value + '">Copy</button></td>' +
          '</tr>';
        }).join('');

        document.getElementById('resultsCard').style.display = 'block';
        showMessage('Hashes calculated successfully.', 'success');
      } catch (error) {
        showMessage(error && error.message ? error.message : 'Unable to calculate hashes.', 'error');
      }
    }

    async function digestHex(bytes, algorithm) {
      var buffer = await crypto.subtle.digest(algorithm, bytes);
      return toHex(buffer);
    }

    function toHex(buffer) {
      return Array.from(new Uint8Array(buffer)).map(function (byte) {
        return byte.toString(16).padStart(2, '0');
      }).join('');
    }

    function md5Bytes(inputBytes) {
      var bytes = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes);
      var originalLength = bytes.length;
      var paddedLength = Math.ceil((originalLength + 9) / 64) * 64;
      var padded = new Uint8Array(paddedLength);
      padded.set(bytes);
      padded[originalLength] = 128;

      var bitLength = originalLength * 8;
      var view = new DataView(padded.buffer);
      view.setUint32(paddedLength - 8, bitLength >>> 0, true);
      view.setUint32(paddedLength - 4, Math.floor(bitLength / 4294967296) >>> 0, true);

      var a0 = 0x67452301;
      var b0 = 0xefcdab89;
      var c0 = 0x98badcfe;
      var d0 = 0x10325476;

      for (var offset = 0; offset < paddedLength; offset += 64) {
        var M = new Array(16);
        for (var i = 0; i < 16; i += 1) {
          M[i] = view.getUint32(offset + i * 4, true);
        }

        var A = a0;
        var B = b0;
        var C = c0;
        var D = d0;

        for (var round = 0; round < 64; round += 1) {
          var F;
          var g;

          if (round < 16) {
            F = (B & C) | ((~B) & D);
            g = round;
          } else if (round < 32) {
            F = (D & B) | ((~D) & C);
            g = (5 * round + 1) % 16;
          } else if (round < 48) {
            F = B ^ C ^ D;
            g = (3 * round + 5) % 16;
          } else {
            F = C ^ (B | (~D));
            g = (7 * round) % 16;
          }

          var tempD = D;
          D = C;
          C = B;
          B = addUnsigned(B, rotateLeft(addUnsigned(A, F, md5K[round], M[g]), md5S[round]));
          A = tempD;
        }

        a0 = addUnsigned(a0, A);
        b0 = addUnsigned(b0, B);
        c0 = addUnsigned(c0, C);
        d0 = addUnsigned(d0, D);
      }

      return wordToHex(a0) + wordToHex(b0) + wordToHex(c0) + wordToHex(d0);
    }

    function addUnsigned() {
      var sum = 0;
      for (var i = 0; i < arguments.length; i += 1) {
        sum = (sum + (arguments[i] >>> 0)) >>> 0;
      }
      return sum >>> 0;
    }

    function rotateLeft(value, shift) {
      return ((value << shift) | (value >>> (32 - shift))) >>> 0;
    }

    function wordToHex(word) {
      var hex = '';
      for (var i = 0; i < 4; i += 1) {
        hex += ((word >>> (i * 8)) & 255).toString(16).padStart(2, '0');
      }
      return hex;
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

    function copyText(value) {
      navigator.clipboard.writeText(value).then(function () {
        showMessage('Copied to clipboard.', 'success');
      }).catch(function () {
        showMessage('Copy failed. You can still select and copy the text manually.', 'error');
      });
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

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
