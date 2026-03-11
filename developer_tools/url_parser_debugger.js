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
  <title>URL Parser & Debugger</title>
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
      min-height: 110px;
      resize: vertical;
    }
    .button-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 18px;
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
    .status {
      display: none;
      margin-top: 18px;
      padding: 14px;
      border-radius: 10px;
    }
    .status.error { display: block; background: #fee2e2; color: #991b1b; }
    .status.success { display: block; background: #dcfce7; color: #166534; }
    .status.info { display: block; background: #dbeafe; color: #1d4ed8; }
    .table-wrap {
      overflow-x: auto;
      margin-top: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #374151;
      font-size: .95rem;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      word-break: break-all;
    }
    .split-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 18px;
    }
    .panel {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
    }
    .query-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .remove-btn {
      background: #ef4444;
      padding: 8px 12px;
      border-radius: 8px;
    }
    .remove-btn:hover {
      background: #dc2626;
    }
    .small {
      font-size: .92rem;
      color: #6b7280;
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
      <h1>URL Parser & Debugger</h1>
      <p class="lead">Inspect a full absolute URL, review every major component, edit query parameters, and rebuild the final URL without leaving your browser.</p>

      <label for="urlInput">URL to parse</label>
      <textarea id="urlInput" placeholder="Paste a full URL, for example: https://example.com:8443/path/to/page?name=Alice%20Smith&debug=true#section">https://example.com:8443/path/to/page?name=Alice%20Smith&debug=true#section</textarea>

      <div class="button-row">
        <button type="button" id="parseButton">Parse</button>
        <button type="button" id="rebuildButton" class="secondary">Rebuild URL</button>
      </div>

      <div id="status" class="status"></div>
    </div>

    <div class="card" id="resultsCard" style="display:none;">
      <h2 style="margin:0 0 10px; color:#111827;">URL components</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:140px;">Component</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody id="componentsBody"></tbody>
        </table>
      </div>

      <h2 style="margin:24px 0 10px; color:#111827;">Query parameters</h2>
      <p class="small">The <strong>Value</strong> column keeps the raw value text, while <strong>Decoded value</strong> shows how it resolves after URL decoding.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:26%;">Param name</th>
              <th style="width:30%;">Value</th>
              <th>Decoded value</th>
              <th style="width:90px;">Action</th>
            </tr>
          </thead>
          <tbody id="paramsBody"></tbody>
        </table>
      </div>
      <div class="query-actions">
        <button type="button" id="addParamButton">Add param</button>
        <button type="button" id="rebuildButtonSecondary" class="secondary">Rebuild URL</button>
      </div>

      <div class="split-grid">
        <div class="panel">
          <label for="encodedUrl">Encoded full URL</label>
          <textarea id="encodedUrl" class="mono" readonly></textarea>
        </div>
        <div class="panel">
          <label for="decodedUrl">Decoded full URL</label>
          <textarea id="decodedUrl" class="mono" readonly></textarea>
        </div>
      </div>
    </div>
  </div>

  <script>
    var state = { currentUrl: null };

    window.addEventListener('DOMContentLoaded', function () {
      document.getElementById('parseButton').addEventListener('click', parseUrlInput);
      document.getElementById('rebuildButton').addEventListener('click', rebuildUrl);
      document.getElementById('rebuildButtonSecondary').addEventListener('click', rebuildUrl);
      document.getElementById('addParamButton').addEventListener('click', function () {
        addParamRow('', '');
      });
      document.getElementById('paramsBody').addEventListener('input', function (event) {
        var row = event.target.closest('tr');
        if (row) {
          updateDecodedCell(row);
        }
      });
      document.getElementById('paramsBody').addEventListener('click', function (event) {
        if (event.target.matches('.remove-btn')) {
          event.target.closest('tr').remove();
        }
      });
      parseUrlInput();
    });

    function parseUrlInput() {
      var rawUrl = document.getElementById('urlInput').value.trim();
      if (!rawUrl) {
        showMessage('Paste a full URL to inspect.', 'error');
        return;
      }

      try {
        var parsed = new URL(rawUrl);
        state.currentUrl = parsed;
        renderComponents(parsed);
        renderQueryParams(parsed);
        renderEncodedDecoded(rawUrl);
        document.getElementById('resultsCard').style.display = 'block';
        showMessage('URL parsed successfully.', 'success');
      } catch (error) {
        document.getElementById('resultsCard').style.display = 'none';
        showMessage('Enter a full absolute URL including the protocol, such as https://example.com.', 'error');
      }
    }

    function renderComponents(parsed) {
      var components = [
        ['protocol', parsed.protocol],
        ['host', parsed.host],
        ['hostname', parsed.hostname],
        ['port', parsed.port || '(default)'],
        ['pathname', parsed.pathname],
        ['search', parsed.search || '(none)'],
        ['hash', parsed.hash || '(none)'],
        ['origin', parsed.origin]
      ];

      document.getElementById('componentsBody').innerHTML = components.map(function (entry) {
        return '<tr><td><strong>' + escapeHtml(entry[0]) + '</strong></td><td class="mono">' + escapeHtml(entry[1]) + '</td></tr>';
      }).join('');
    }

    function renderQueryParams(parsed) {
      var paramsBody = document.getElementById('paramsBody');
      paramsBody.innerHTML = '';
      var query = parsed.search ? parsed.search.slice(1) : '';
      if (!query) {
        addParamRow('', '');
        return;
      }

      query.split('&').forEach(function (segment) {
        var separator = segment.indexOf('=');
        var rawName = separator >= 0 ? segment.slice(0, separator) : segment;
        var rawValue = separator >= 0 ? segment.slice(separator + 1) : '';
        addParamRow(safeDecode(rawName), rawValue);
      });
    }

    function addParamRow(name, rawValue) {
      var row = document.createElement('tr');
      row.innerHTML = '' +
        '<td><input type="text" class="param-name" value="' + escapeHtml(name) + '" placeholder="name"></td>' +
        '<td><input type="text" class="param-value mono" value="' + escapeHtml(rawValue) + '" placeholder="value"></td>' +
        '<td class="param-decoded mono"></td>' +
        '<td><button type="button" class="remove-btn">Remove</button></td>';
      document.getElementById('paramsBody').appendChild(row);
      updateDecodedCell(row);
    }

    function updateDecodedCell(row) {
      var rawValue = row.querySelector('.param-value').value;
      row.querySelector('.param-decoded').textContent = rawValue ? safeDecode(rawValue) : '';
    }

    function rebuildUrl() {
      if (!state.currentUrl) {
        parseUrlInput();
        if (!state.currentUrl) {
          return;
        }
      }

      try {
        var rebuilt = new URL(state.currentUrl.toString());
        rebuilt.search = '';
        Array.from(document.querySelectorAll('#paramsBody tr')).forEach(function (row) {
          var name = row.querySelector('.param-name').value.trim();
          var rawValue = row.querySelector('.param-value').value;
          if (!name) {
            return;
          }
          rebuilt.searchParams.append(name, decodeForRebuild(rawValue));
        });
        document.getElementById('urlInput').value = rebuilt.toString();
        parseUrlInput();
        showMessage('URL rebuilt from the editable parameter table.', 'success');
      } catch (error) {
        showMessage('Unable to rebuild the URL from the current values.', 'error');
      }
    }

    function renderEncodedDecoded(rawUrl) {
      document.getElementById('encodedUrl').value = encodeURI(rawUrl);
      document.getElementById('decodedUrl').value = safeDecodeUri(rawUrl);
    }

    function safeDecode(value) {
      try {
        return decodeURIComponent(String(value).replace(/\+/g, '%20'));
      } catch (error) {
        return '(invalid encoding) ' + value;
      }
    }

    function safeDecodeUri(value) {
      try {
        return decodeURI(value);
      } catch (error) {
        return '(invalid encoded URL) ' + value;
      }
    }

    function decodeForRebuild(rawValue) {
      if (!rawValue) {
        return '';
      }
      try {
        return decodeURIComponent(rawValue.replace(/\+/g, '%20'));
      } catch (error) {
        return rawValue;
      }
    }

    function showMessage(message, type) {
      var status = document.getElementById('status');
      status.className = 'status ' + type;
      status.textContent = message;
      status.style.display = 'block';
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
