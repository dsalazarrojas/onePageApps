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
  <title>Roman Numeral Converter</title>
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
    h1, h2 { margin: 0 0 12px; color: #0f172a; }
    p { margin: 0 0 18px; line-height: 1.6; color: #475569; }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #1e293b;
    }
    input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 1rem;
      background: #f8fafc;
    }
    input:focus {
      outline: 2px solid rgba(0,123,255,.18);
      border-color: #007bff;
    }
    .actions {
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
      font-size: 0.95rem;
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
    .result-box {
      background: #f8fafc;
      border: 1px solid #dbe4f0;
      border-radius: 12px;
      padding: 18px;
      margin-top: 18px;
    }
    .result-title {
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .result-value {
      font: 700 1.6rem/1.4 Consolas, Monaco, monospace;
      color: #0f172a;
      word-break: break-word;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      color: #334155;
    }
    ul {
      margin: 12px 0 0;
      padding-left: 20px;
      color: #475569;
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Roman Numeral Converter</h1>
      <p>Convert Arabic integers from 1 to 3999 into Roman numerals, or type a Roman numeral to decode it back to an integer. Input validation uses canonical subtractive notation rules.</p>
      <div id="status" class="status">Ready for live conversion</div>
      <label for="converterInput">Enter a number or Roman numeral</label>
      <input id="converterInput" type="text" spellcheck="false" placeholder="Examples: 1999 or MCMXCIX">
      <div class="actions">
        <button id="convertBtn">Convert</button>
        <button id="sampleNumberBtn" class="secondary">Load 2024</button>
        <button id="sampleRomanBtn" class="secondary">Load MMXXIV</button>
      </div>
      <div class="result-box">
        <div class="result-title" id="resultTitle">Result</div>
        <div class="result-value" id="resultValue">—</div>
      </div>
    </div>

    <div class="card">
      <h2>Roman numeral symbols</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Value</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>I</td><td>1</td><td>One</td></tr>
          <tr><td>V</td><td>5</td><td>Five</td></tr>
          <tr><td>X</td><td>10</td><td>Ten</td></tr>
          <tr><td>L</td><td>50</td><td>Fifty</td></tr>
          <tr><td>C</td><td>100</td><td>One hundred</td></tr>
          <tr><td>D</td><td>500</td><td>Five hundred</td></tr>
          <tr><td>M</td><td>1000</td><td>One thousand</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Subtractive notation rules</h2>
      <ul>
        <li>IV = 4 and IX = 9 because I may precede only V and X.</li>
        <li>XL = 40 and XC = 90 because X may precede only L and C.</li>
        <li>CD = 400 and CM = 900 because C may precede only D and M.</li>
        <li>Canonical Roman numerals avoid repeated V, L, and D, and reject non-standard forms like IIII or VX.</li>
      </ul>
    </div>
  </div>

  <script>
    const romanPairs = [
      ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90],
      ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];
    const romanValues = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    const canonicalRomanPattern = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

    const input = document.getElementById('converterInput');
    const resultTitle = document.getElementById('resultTitle');
    const resultValue = document.getElementById('resultValue');
    const statusEl = document.getElementById('status');

    document.getElementById('convertBtn').addEventListener('click', convertInput);
    document.getElementById('sampleNumberBtn').addEventListener('click', () => {
      input.value = '2024';
      convertInput();
    });
    document.getElementById('sampleRomanBtn').addEventListener('click', () => {
      input.value = 'MMXXIV';
      convertInput();
    });
    input.addEventListener('input', convertInput);

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.className = 'status' + (isError ? ' error' : '');
    }

    function toRoman(number) {
      let remaining = number;
      let output = '';
      for (const [symbol, value] of romanPairs) {
        while (remaining >= value) {
          output += symbol;
          remaining -= value;
        }
      }
      return output;
    }

    function fromRoman(roman) {
      let total = 0;
      let index = 0;
      while (index < roman.length) {
        const twoChar = roman.slice(index, index + 2);
        const pair = romanPairs.find(([symbol]) => symbol === twoChar);
        if (pair) {
          total += pair[1];
          index += 2;
        } else {
          total += romanValues[roman[index]];
          index += 1;
        }
      }
      return total;
    }

    function showResult(title, value) {
      resultTitle.textContent = title;
      resultValue.textContent = value;
    }

    function convertInput() {
      const raw = input.value.trim();
      if (!raw) {
        showResult('Result', '—');
        setStatus('Enter an integer or Roman numeral to convert.', false);
        return;
      }

      if (/^\d+$/.test(raw)) {
        const number = Number(raw);
        if (!Number.isInteger(number) || number < 1 || number > 3999) {
          showResult('Result', '—');
          setStatus('Arabic input must be an integer from 1 to 3999.', true);
          return;
        }
        const roman = toRoman(number);
        showResult('Arabic ' + number, roman);
        setStatus('Converted Arabic number to Roman numeral.', false);
        return;
      }

      if (!/^[ivxlcdm]+$/i.test(raw)) {
        showResult('Result', '—');
        setStatus('Roman input may contain only the letters I, V, X, L, C, D, and M.', true);
        return;
      }

      const roman = raw.toUpperCase();
      if (!canonicalRomanPattern.test(roman) || roman === '') {
        showResult('Result', '—');
        setStatus('Roman numeral format is invalid or non-canonical.', true);
        return;
      }

      const value = fromRoman(roman);
      if (value < 1 || value > 3999) {
        showResult('Result', '—');
        setStatus('Roman numeral must decode to a value from 1 to 3999.', true);
        return;
      }

      showResult('Roman ' + roman, String(value));
      setStatus('Converted Roman numeral to Arabic number.', false);
    }

    input.value = '2024';
    convertInput();
  </script>
</body>
</html>`;
  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
