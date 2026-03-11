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
  <title>HTML Entity Encoder / Decoder</title>
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
    h1, h2 {
      margin-top: 0;
      margin-bottom: 12px;
      color: #111827;
    }
    .subtitle {
      margin: 0 0 22px;
      color: #4b5563;
      line-height: 1.6;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat {
      background: #f8fbff;
      border: 1px solid #dbeafe;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .stat-label {
      display: block;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .stat strong {
      font-size: 20px;
      color: #007bff;
    }
    .editor-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }
    textarea {
      width: 100%;
      min-height: 210px;
      resize: vertical;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 14px;
      font-size: 15px;
      line-height: 1.5;
      color: #111827;
      background: #ffffff;
    }
    textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.15);
    }
    textarea[readonly] {
      background: #f9fafb;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 10px;
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
    button.secondary {
      background: #198754;
    }
    button.secondary:hover {
      background: #146c43;
    }
    button.ghost {
      background: #e5e7eb;
      color: #1f2937;
    }
    button.ghost:hover {
      background: #d1d5db;
    }
    .hint {
      font-size: 13px;
      color: #6b7280;
      margin-top: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 10px;
    }
    th, td {
      padding: 12px 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    th {
      background: #eef6ff;
      color: #1f2937;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
    }
    @media (max-width: 720px) {
      .editor-grid, .stats {
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
      <h1>HTML Entity Encoder / Decoder</h1>
      <p class="subtitle">Encode special characters as HTML entities, decode named or numeric entities back to plain text, and reference common symbols without leaving the browser.</p>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Input character count</span>
          <strong id="inputCount">0</strong>
        </div>
        <div class="stat">
          <span class="stat-label">Output character count</span>
          <strong id="outputCount">0</strong>
        </div>
      </div>
      <div class="editor-grid">
        <div>
          <label for="inputText">Input text</label>
          <textarea id="inputText" placeholder="Type plain text to encode or paste HTML entities to decode.">Tom & Jerry <Cartoon> costs €12.50 — "fun" & friends.</textarea>
        </div>
        <div>
          <label for="outputText">Output</label>
          <textarea id="outputText" readonly placeholder="Your encoded or decoded output appears here."></textarea>
        </div>
      </div>
      <div class="actions">
        <button id="encodeButton">Encode</button>
        <button id="decodeButton" class="secondary">Decode</button>
        <button id="swapButton" class="ghost">Swap</button>
        <button id="clearButton" class="ghost">Clear</button>
      </div>
      <p class="hint">Named entities are used for common symbols, while extended characters fall back to numeric entities such as <code>&amp;#169;</code>.</p>
    </div>

    <div class="card">
      <h2>Common HTML entities reference</h2>
      <table>
        <thead>
          <tr>
            <th>Character</th>
            <th>Named entity</th>
            <th>Numeric entity</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>&amp;</td><td><code>&amp;amp;</code></td><td><code>&amp;#38;</code></td><td>Ampersand</td></tr>
          <tr><td>&lt;</td><td><code>&amp;lt;</code></td><td><code>&amp;#60;</code></td><td>Less-than sign</td></tr>
          <tr><td>&gt;</td><td><code>&amp;gt;</code></td><td><code>&amp;#62;</code></td><td>Greater-than sign</td></tr>
          <tr><td>&quot;</td><td><code>&amp;quot;</code></td><td><code>&amp;#34;</code></td><td>Double quotation mark</td></tr>
          <tr><td>'</td><td><code>&amp;apos;</code></td><td><code>&amp;#39;</code></td><td>Apostrophe</td></tr>
          <tr><td>&nbsp;</td><td><code>&amp;nbsp;</code></td><td><code>&amp;#160;</code></td><td>Non-breaking space</td></tr>
          <tr><td>©</td><td><code>&amp;copy;</code></td><td><code>&amp;#169;</code></td><td>Copyright</td></tr>
          <tr><td>®</td><td><code>&amp;reg;</code></td><td><code>&amp;#174;</code></td><td>Registered trademark</td></tr>
          <tr><td>€</td><td><code>&amp;euro;</code></td><td><code>&amp;#8364;</code></td><td>Euro sign</td></tr>
          <tr><td>£</td><td><code>&amp;pound;</code></td><td><code>&amp;#163;</code></td><td>Pound sign</td></tr>
          <tr><td>¥</td><td><code>&amp;yen;</code></td><td><code>&amp;#165;</code></td><td>Yen sign</td></tr>
          <tr><td>™</td><td><code>&amp;trade;</code></td><td><code>&amp;#8482;</code></td><td>Trademark symbol</td></tr>
          <tr><td>—</td><td><code>&amp;mdash;</code></td><td><code>&amp;#8212;</code></td><td>Em dash</td></tr>
          <tr><td>…</td><td><code>&amp;hellip;</code></td><td><code>&amp;#8230;</code></td><td>Ellipsis</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    var namedEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
      '©': '&copy;',
      '®': '&reg;',
      '€': '&euro;',
      '£': '&pound;',
      '¥': '&yen;',
      '™': '&trade;',
      '—': '&mdash;',
      '…': '&hellip;'
    };

    var reverseEntities = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      nbsp: ' ',
      copy: '©',
      reg: '®',
      euro: '€',
      pound: '£',
      yen: '¥',
      trade: '™',
      mdash: '—',
      hellip: '…'
    };

    var inputText = document.getElementById('inputText');
    var outputText = document.getElementById('outputText');
    var inputCount = document.getElementById('inputCount');
    var outputCount = document.getElementById('outputCount');

    function encodeHtml(text) {
      var result = '';
      for (var i = 0; i < text.length; i += 1) {
        var codePoint = text.codePointAt(i);
        var character = String.fromCodePoint(codePoint);
        if (codePoint > 65535) {
          i += 1;
        }
        if (Object.prototype.hasOwnProperty.call(namedEntities, character)) {
          result += namedEntities[character];
        } else if ((codePoint < 32 && character !== '\n' && character !== '\r' && character !== '\t') || codePoint > 126) {
          result += '&#' + codePoint + ';';
        } else {
          result += character;
        }
      }
      return result;
    }

    function decodeHtml(text) {
      return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, function(match, entityBody) {
        if (!entityBody) {
          return match;
        }
        if (entityBody.charAt(0) === '#') {
          var isHex = entityBody.charAt(1).toLowerCase() === 'x';
          var value = isHex ? parseInt(entityBody.slice(2), 16) : parseInt(entityBody.slice(1), 10);
          if (!isFinite(value)) {
            return match;
          }
          try {
            return String.fromCodePoint(value);
          } catch (error) {
            return match;
          }
        }
        var key = entityBody.toLowerCase();
        return Object.prototype.hasOwnProperty.call(reverseEntities, key) ? reverseEntities[key] : match;
      });
    }

    function updateCounts() {
      inputCount.textContent = inputText.value.length.toLocaleString();
      outputCount.textContent = outputText.value.length.toLocaleString();
    }

    function setOutput(value) {
      outputText.value = value;
      updateCounts();
    }

    document.getElementById('encodeButton').addEventListener('click', function() {
      setOutput(encodeHtml(inputText.value));
    });

    document.getElementById('decodeButton').addEventListener('click', function() {
      setOutput(decodeHtml(inputText.value));
    });

    document.getElementById('swapButton').addEventListener('click', function() {
      inputText.value = outputText.value;
      outputText.value = '';
      updateCounts();
      inputText.focus();
    });

    document.getElementById('clearButton').addEventListener('click', function() {
      inputText.value = '';
      outputText.value = '';
      updateCounts();
      inputText.focus();
    });

    inputText.addEventListener('input', updateCounts);
    updateCounts();
    setOutput(encodeHtml(inputText.value));
  </script>
</body>
</html>`;

  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
