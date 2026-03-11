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
  <title>Bulk UUID v4 Generator</title>
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
    }
    input, select, textarea, button {
      font: inherit;
    }
    input, select, textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      outline: none;
    }
    input:focus, select:focus, textarea:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.12);
    }
    textarea {
      min-height: 280px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .button-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 22px;
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
    .meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 18px;
    }
    .pill {
      background: #eff6ff;
      color: #1d4ed8;
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 600;
    }
    .hint {
      color: #6b7280;
      font-size: .95rem;
      margin-top: 10px;
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
    @media (max-width: 640px) {
      .card { padding: 22px; }
      h1 { font-size: 1.7rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Bulk UUID v4 Generator</h1>
      <p class="lead">Generate up to 1,000 UUID v4 values at once using <code>crypto.getRandomValues()</code>. Customize the format, then optionally wrap every UUID with a prefix and suffix before copying or downloading the list.</p>

      <div class="grid">
        <div>
          <label for="countInput">How many UUIDs?</label>
          <input id="countInput" type="number" min="1" max="1000" value="25">
        </div>
        <div>
          <label for="formatSelect">Format</label>
          <select id="formatSelect">
            <option value="standard">Standard (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)</option>
            <option value="uppercase">Uppercase</option>
            <option value="nodashes">No dashes</option>
            <option value="braces">Wrapped in braces {uuid}</option>
          </select>
        </div>
        <div>
          <label for="prefixInput">Prefix</label>
          <input id="prefixInput" type="text" placeholder="Optional prefix, e.g. user_">
        </div>
        <div>
          <label for="suffixInput">Suffix</label>
          <input id="suffixInput" type="text" placeholder="Optional suffix, e.g. _prod">
        </div>
      </div>

      <div class="button-row">
        <button type="button" id="generateButton">Generate</button>
        <button type="button" id="copyButton" class="secondary">Copy All</button>
        <button type="button" id="downloadButton" class="secondary">Download as .txt</button>
      </div>

      <div class="meta">
        <div class="pill" id="generatedCount">0 UUIDs generated</div>
        <div class="pill" id="formatSummary">Format: standard</div>
      </div>
      <p class="hint">UUIDs are generated completely inside the page and never leave your browser.</p>

      <div style="margin-top:22px;">
        <label for="outputArea">Generated UUIDs</label>
        <textarea id="outputArea" readonly placeholder="Your generated UUIDs will appear here..."></textarea>
      </div>

      <div id="status" class="status"></div>
    </div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function () {
      document.getElementById('generateButton').addEventListener('click', generateUuids);
      document.getElementById('copyButton').addEventListener('click', copyAll);
      document.getElementById('downloadButton').addEventListener('click', downloadAll);
      document.getElementById('formatSelect').addEventListener('change', function () {
        document.getElementById('formatSummary').textContent = 'Format: ' + this.value;
      });
      generateUuids();
    });

    function generateUuids() {
      var count = parseInt(document.getElementById('countInput').value, 10);
      var format = document.getElementById('formatSelect').value;
      var prefix = document.getElementById('prefixInput').value || '';
      var suffix = document.getElementById('suffixInput').value || '';

      if (isNaN(count) || count < 1 || count > 1000) {
        showMessage('Enter a count between 1 and 1000.', 'error');
        return;
      }

      var list = [];
      for (var index = 0; index < count; index += 1) {
        list.push(prefix + formatUuid(uuidV4(), format) + suffix);
      }

      document.getElementById('outputArea').value = list.join('\n');
      document.getElementById('generatedCount').textContent = count.toLocaleString('en-US') + ' UUID' + (count === 1 ? '' : 's') + ' generated';
      document.getElementById('formatSummary').textContent = 'Format: ' + format;
      showMessage('Generated ' + count + ' UUID' + (count === 1 ? '' : 's') + ' locally in your browser.', 'success');
    }

    function uuidV4() {
      var bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;

      var hex = Array.from(bytes).map(function (byte) {
        return byte.toString(16).padStart(2, '0');
      }).join('');

      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20)
      ].join('-');
    }

    function formatUuid(uuid, format) {
      if (format === 'uppercase') {
        return uuid.toUpperCase();
      }
      if (format === 'nodashes') {
        return uuid.replace(/-/g, '');
      }
      if (format === 'braces') {
        return '{' + uuid + '}';
      }
      return uuid;
    }

    function copyAll() {
      var output = document.getElementById('outputArea').value;
      if (!output) {
        showMessage('Generate some UUIDs before copying.', 'error');
        return;
      }
      navigator.clipboard.writeText(output).then(function () {
        showMessage('All UUIDs copied to the clipboard.', 'success');
      }).catch(function () {
        showMessage('Copy failed. You can still select the text manually.', 'error');
      });
    }

    function downloadAll() {
      var output = document.getElementById('outputArea').value;
      if (!output) {
        showMessage('Generate some UUIDs before downloading.', 'error');
        return;
      }
      var blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'uuids.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showMessage('Download started.', 'info');
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
