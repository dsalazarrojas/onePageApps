addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'GET') {
    return serveMainPage();
  }
  return new Response('Method Not Allowed', {status:405});
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JWT Decoder / Validator</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f0f2f5;
      color: #1f2937;
      padding: 20px;
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
      margin-bottom: 22px;
    }
    h1, h2, h3 {
      margin-top: 0;
    }
    .subtitle {
      margin: 0 0 22px;
      color: #4b5563;
      line-height: 1.6;
    }
    textarea {
      width: 100%;
      min-height: 140px;
      resize: vertical;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      line-height: 1.5;
      color: #111827;
    }
    textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.15);
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 18px 0 22px;
      align-items: center;
    }
    button {
      border: none;
      background: #007bff;
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background .2s ease, transform .15s ease;
    }
    button:hover {
      background: #0056b3;
    }
    button:active {
      transform: translateY(1px);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      font-weight: 700;
      background: #eef6ff;
      color: #007bff;
    }
    .badge.expired {
      background: #fff4e5;
      color: #b45309;
    }
    .badge.invalid {
      background: #fff1f2;
      color: #b42318;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px;
      font-size: 13px;
      line-height: 1.5;
      min-height: 220px;
    }
    .panel-note {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th, td {
      border-bottom: 1px solid #e5e7eb;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #eef6ff;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .muted {
      color: #6b7280;
    }
    @media (max-width: 760px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .container {
        padding: 14px;
      }
      .card {
        padding: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>JWT Decoder / Validator</h1>
      <p class="subtitle">Decode JWT header and payload segments locally in the browser, inspect common claims, and check whether an <code>exp</code> claim has already expired.</p>
      <label for="tokenInput"><strong>JWT token</strong></label>
      <textarea id="tokenInput" spellcheck="false" placeholder="Paste a JWT like header.payload.signature"></textarea>
      <div class="toolbar">
        <button id="decodeButton">Decode</button>
        <span class="badge" id="statusBadge">Valid structure</span>
        <span class="panel-note" id="statusNote">Client-side decoding only — signature verification is not performed.</span>
      </div>
      <div class="grid">
        <div>
          <h2>Header</h2>
          <pre id="headerOutput">{
  "alg": "—",
  "typ": "JWT"
}</pre>
        </div>
        <div>
          <h2>Payload</h2>
          <pre id="payloadOutput">{
  "sub": "—"
}</pre>
        </div>
        <div>
          <h2>Signature info</h2>
          <pre id="signatureOutput">Paste a token to inspect signature segment details.</pre>
        </div>
      </div>
      <h2 style="margin-top:24px;">Common claims</h2>
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Label</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody id="claimsBody">
          <tr><td colspan="3" class="muted">Decode a JWT to inspect claim details.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    var tokenInput = document.getElementById('tokenInput');
    var headerOutput = document.getElementById('headerOutput');
    var payloadOutput = document.getElementById('payloadOutput');
    var signatureOutput = document.getElementById('signatureOutput');
    var claimsBody = document.getElementById('claimsBody');
    var statusBadge = document.getElementById('statusBadge');
    var statusNote = document.getElementById('statusNote');

    function setBadge(text, type) {
      statusBadge.textContent = text;
      statusBadge.className = 'badge';
      if (type) {
        statusBadge.classList.add(type);
      }
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function base64UrlToBytes(input) {
      var normalized = input.replace(/-/g, '+').replace(/_/g, '/');
      while (normalized.length % 4) {
        normalized += '=';
      }
      var binary = atob(normalized);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    function decodeBase64UrlText(segment) {
      var bytes = base64UrlToBytes(segment);
      return new TextDecoder().decode(bytes);
    }

    function formatJson(value) {
      return JSON.stringify(value, null, 2);
    }

    function formatDate(seconds) {
      if (typeof seconds !== 'number' || !isFinite(seconds)) {
        return '—';
      }
      var date = new Date(seconds * 1000);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    function formatRelative(seconds) {
      if (typeof seconds !== 'number' || !isFinite(seconds)) {
        return '—';
      }
      var diff = (seconds * 1000) - Date.now();
      var past = diff < 0;
      var absolute = Math.abs(diff);
      var units = [
        { label: 'day', ms: 86400000 },
        { label: 'hour', ms: 3600000 },
        { label: 'minute', ms: 60000 },
        { label: 'second', ms: 1000 }
      ];
      for (var i = 0; i < units.length; i += 1) {
        var amount = Math.floor(absolute / units[i].ms);
        if (amount >= 1) {
          return past ? 'expired ' + amount + ' ' + units[i].label + (amount === 1 ? '' : 's') + ' ago' : 'in ' + amount + ' ' + units[i].label + (amount === 1 ? '' : 's');
        }
      }
      return past ? 'expired just now' : 'in moments';
    }

    function humanizeClaim(claim, value) {
      if (claim === 'exp') {
        return formatDate(value) + ' (' + formatRelative(value) + ')';
      }
      if (claim === 'iat' || claim === 'nbf') {
        return formatDate(value);
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      if (value === undefined || value === null || value === '') {
        return '—';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    }

    function renderClaims(payload) {
      var labels = {
        iss: 'Issuer',
        sub: 'Subject',
        aud: 'Audience',
        exp: 'Expires',
        iat: 'Issued At',
        nbf: 'Not Before',
        jti: 'JWT ID'
      };
      var keys = ['iss', 'sub', 'aud', 'exp', 'iat', 'nbf', 'jti'];
      claimsBody.innerHTML = keys.map(function(key) {
        return '<tr>' +
          '<td>' + key + '</td>' +
          '<td>' + labels[key] + '</td>' +
          '<td>' + escapeHtml(humanizeClaim(key, payload[key])) + '</td>' +
          '</tr>';
      }).join('');
    }

    function decodeToken() {
      var token = tokenInput.value.trim();
      if (!token) {
        headerOutput.textContent = '{\n  "alg": "—",\n  "typ": "JWT"\n}';
        payloadOutput.textContent = '{\n  "sub": "—"\n}';
        signatureOutput.textContent = 'Paste a token to inspect signature segment details.';
        claimsBody.innerHTML = '<tr><td colspan="3" class="muted">Decode a JWT to inspect claim details.</td></tr>';
        setBadge('Valid structure');
        statusNote.textContent = 'Client-side decoding only — signature verification is not performed.';
        return;
      }

      try {
        var parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('JWT must contain exactly three dot-separated segments.');
        }

        var header = JSON.parse(decodeBase64UrlText(parts[0]));
        var payload = JSON.parse(decodeBase64UrlText(parts[1]));
        var signatureBytes = parts[2] ? base64UrlToBytes(parts[2]) : new Uint8Array(0);
        var expired = typeof payload.exp === 'number' && (payload.exp * 1000) < Date.now();

        headerOutput.textContent = formatJson(header);
        payloadOutput.textContent = formatJson(payload);
        signatureOutput.textContent = formatJson({
          algorithm: header.alg || 'Unknown',
          hasSignatureSegment: parts[2].length > 0,
          signatureCharacters: parts[2].length,
          decodedSignatureBytes: signatureBytes.length,
          verification: 'Not verified client-side'
        });
        renderClaims(payload);

        if (expired) {
          setBadge('Expired', 'expired');
        } else {
          setBadge('Valid structure');
        }
        statusNote.textContent = 'Algorithm: ' + (header.alg || 'Unknown') + ' • Client-side decoding only — signature verification is not performed.';
      } catch (error) {
        headerOutput.textContent = 'Invalid JWT';
        payloadOutput.textContent = error.message;
        signatureOutput.textContent = 'Unable to decode signature details because the token is malformed.';
        claimsBody.innerHTML = '<tr><td colspan="3" class="muted">No claims available.</td></tr>';
        setBadge('Invalid token', 'invalid');
        statusNote.textContent = error.message;
      }
    }

    document.getElementById('decodeButton').addEventListener('click', decodeToken);
    tokenInput.addEventListener('input', function() {
      if (!tokenInput.value.trim()) {
        decodeToken();
      }
    });
  </script>
</body>
</html>`;

  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
