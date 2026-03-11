addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/') {
    return serveMainPage();
  }
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {status:405});
  }
  return new Response('Not Found', {status:404});
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Number Base Converter</title>
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
    h1, h2 {
      margin: 0 0 12px;
      color: #0f172a;
    }
    p {
      margin: 0 0 18px;
      line-height: 1.6;
      color: #475569;
    }
    .controls {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #1e293b;
    }
    input, select {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 1rem;
      background: #f8fafc;
    }
    input:focus, select:focus {
      outline: 2px solid rgba(0,123,255,.18);
      border-color: #007bff;
    }
    .quick-bases {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    button:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }
    button.secondary {
      background: #e2e8f0;
      color: #1e293b;
    }
    button.secondary:hover {
      background: #cbd5e1;
    }
    .status {
      display: inline-flex;
      padding: 10px 14px;
      border-radius: 999px;
      font-weight: 600;
      background: #dbeafe;
      color: #1d4ed8;
      margin-bottom: 18px;
    }
    .status.error {
      background: #fee2e2;
      color: #b91c1c;
    }
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .result-box {
      border: 1px solid #dbe4f0;
      border-radius: 12px;
      padding: 16px;
      background: #f8fafc;
    }
    .result-label {
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .result-value {
      font: 600 1rem/1.5 Consolas, Monaco, monospace;
      color: #0f172a;
      word-break: break-word;
      min-height: 48px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 0.95rem;
    }
    th, td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    th {
      color: #334155;
      background: #f8fafc;
    }
    .mono { font-family: Consolas, Monaco, monospace; }
    .hint {
      font-size: 0.92rem;
      color: #64748b;
      margin-top: 10px;
    }
    @media (max-width: 720px) {
      .controls { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Number Base Converter</h1>
      <p>Convert integers between base 2, 8, 10, 16, 32, and 64 using client-side BigInt math. Base 64 here means a numeric alphabet, not MIME/Base64 text encoding.</p>
      <div id="status" class="status">Ready for live conversion</div>
      <div class="controls">
        <div>
          <label for="numberInput">Number</label>
          <input id="numberInput" type="text" spellcheck="false" placeholder="Enter a number, such as FF or 11110000">
          <div class="quick-bases">
            <button type="button" class="secondary" data-base="2">Base 2</button>
            <button type="button" class="secondary" data-base="8">Base 8</button>
            <button type="button" class="secondary" data-base="10">Base 10</button>
            <button type="button" class="secondary" data-base="16">Base 16</button>
            <button type="button" class="secondary" data-base="32">Base 32</button>
            <button type="button" class="secondary" data-base="64">Base 64</button>
          </div>
        </div>
        <div>
          <label for="baseInput">Current base</label>
          <input id="baseInput" type="number" min="2" max="64" value="16">
          <div class="hint">Supported alphabet: 0-9, A-Z, a-z, +, /</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Converted values</h2>
      <div class="results-grid" id="resultsGrid"></div>
    </div>

    <div class="card">
      <h2>Signed / unsigned interpretations</h2>
      <p>These values show how the lower 8, 16, or 32 bits would be interpreted in two's complement.</p>
      <table>
        <thead>
          <tr>
            <th>Width</th>
            <th>Unsigned</th>
            <th>Signed</th>
            <th>Bit pattern</th>
          </tr>
        </thead>
        <tbody id="bitTable"></tbody>
      </table>
    </div>
  </div>

  <script>
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
    const commonBases = [2, 8, 10, 16, 32, 64];
    const formatRules = { 2: 4, 8: 3, 10: 3, 16: 4, 32: 4, 64: 4 };

    const numberInput = document.getElementById('numberInput');
    const baseInput = document.getElementById('baseInput');
    const resultsGrid = document.getElementById('resultsGrid');
    const bitTable = document.getElementById('bitTable');
    const statusEl = document.getElementById('status');

    document.querySelectorAll('[data-base]').forEach(button => {
      button.addEventListener('click', () => {
        baseInput.value = button.dataset.base;
        updateConversion();
      });
    });

    numberInput.addEventListener('input', updateConversion);
    baseInput.addEventListener('input', updateConversion);

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.className = 'status' + (isError ? ' error' : '');
    }

    function groupDigits(value, size) {
      const sign = value.startsWith('-') ? '-' : '';
      const digits = sign ? value.slice(1) : value;
      if (!digits) return value;
      const chunks = [];
      for (let i = digits.length; i > 0; i -= size) {
        chunks.unshift(digits.slice(Math.max(0, i - size), i));
      }
      return sign + chunks.join(' ');
    }

    function formatDecimal(value) {
      const sign = value.startsWith('-') ? '-' : '';
      const digits = sign ? value.slice(1) : value;
      return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function normalizeInput(input) {
      return input.replace(/[,_\s]/g, '');
    }

    function parseValue(input, base) {
      if (!Number.isInteger(base) || base < 2 || base > 64) {
        throw new Error('Base must be an integer from 2 to 64.');
      }

      const normalized = normalizeInput(input);
      if (!normalized) {
        throw new Error('Enter a number to convert.');
      }

      const sign = normalized.startsWith('-') ? -1n : 1n;
      const digits = normalized.startsWith('-') ? normalized.slice(1) : normalized;
      if (!digits) {
        throw new Error('Enter at least one digit.');
      }

      let value = 0n;
      for (const rawChar of digits) {
        const char = base <= 36 ? rawChar.toUpperCase() : rawChar;
        const digit = alphabet.indexOf(char);
        if (digit === -1 || digit >= base) {
          throw new Error('Digit "' + rawChar + '" is not valid for base ' + base + '.');
        }
        value = value * BigInt(base) + BigInt(digit);
      }

      return sign * value;
    }

    function toBase(value, base) {
      if (value === 0n) return '0';
      const sign = value < 0n ? '-' : '';
      let remaining = value < 0n ? -value : value;
      const digits = [];
      while (remaining > 0n) {
        const remainder = remaining % BigInt(base);
        digits.push(alphabet[Number(remainder)]);
        remaining = remaining / BigInt(base);
      }
      return sign + digits.reverse().join('');
    }

    function formatForBase(rawValue, base) {
      if (base === 10) return formatDecimal(rawValue);
      return groupDigits(rawValue, formatRules[base] || 4);
    }

    function renderResults(value) {
      resultsGrid.innerHTML = '';
      for (const base of commonBases) {
        const rawValue = toBase(value, base);
        const box = document.createElement('div');
        box.className = 'result-box';
        box.innerHTML = '<div class="result-label">Base ' + base + '</div><div class="result-value">' + formatForBase(rawValue, base) + '</div>';
        resultsGrid.appendChild(box);
      }
    }

    function interpretationForBits(value, bits) {
      const width = BigInt(bits);
      const modulo = 1n << width;
      const unsigned = ((value % modulo) + modulo) % modulo;
      const signedThreshold = 1n << BigInt(bits - 1);
      const signed = unsigned >= signedThreshold ? unsigned - modulo : unsigned;
      const bitPattern = unsigned.toString(2).padStart(bits, '0').replace(/(.{4})(?=.)/g, '$1 ');
      return {
        unsigned: unsigned.toString(10),
        signed: signed.toString(10),
        bitPattern: bitPattern
      };
    }

    function renderInterpretations(value) {
      bitTable.innerHTML = '';
      [8, 16, 32].forEach(bits => {
        const info = interpretationForBits(value, bits);
        const row = document.createElement('tr');
        row.innerHTML = [
          '<td><strong>' + bits + '-bit</strong></td>',
          '<td class="mono">' + formatDecimal(info.unsigned) + '</td>',
          '<td class="mono">' + formatDecimal(info.signed) + '</td>',
          '<td class="mono">' + info.bitPattern + '</td>'
        ].join('');
        bitTable.appendChild(row);
      });
    }

    function clearResults() {
      resultsGrid.innerHTML = '';
      bitTable.innerHTML = '';
    }

    function updateConversion() {
      try {
        const base = Number(baseInput.value);
        const value = parseValue(numberInput.value, base);
        renderResults(value);
        renderInterpretations(value);
        setStatus('Converted successfully from base ' + base + '.', false);
      } catch (error) {
        clearResults();
        setStatus(error.message, true);
      }
    }

    numberInput.value = 'FF';
    updateConversion();
  </script>
</body>
</html>`;
  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
