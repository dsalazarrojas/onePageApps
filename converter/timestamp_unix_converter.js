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
  <title>Unix Timestamp Converter</title>
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
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
    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .result-box {
      background: #f8fafc;
      border: 1px solid #dbe4f0;
      border-radius: 12px;
      padding: 16px;
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
    }
    .wide {
      grid-column: 1 / -1;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Unix Timestamp Converter</h1>
      <p>Convert timestamps both ways: seconds or milliseconds to readable dates, and local date/time input back to Unix time. Everything runs in your browser using the built-in Date API.</p>
      <div id="status" class="status">Ready to convert</div>
      <div class="grid">
        <div>
          <label for="timestampInput">Unix timestamp (seconds or milliseconds)</label>
          <input id="timestampInput" type="text" spellcheck="false" placeholder="1700000000 or 1700000000000">
          <div class="actions">
            <button id="convertTimestampBtn">Convert timestamp</button>
            <button id="nowBtn" class="secondary">Now</button>
          </div>
        </div>
        <div>
          <label for="dateInput">Date</label>
          <input id="dateInput" type="date">
          <label for="timeInput" style="margin-top: 16px;">Time</label>
          <input id="timeInput" type="time" step="1">
          <div class="actions">
            <button id="convertDateBtn">Convert date / time</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Converted output</h2>
      <div class="result-grid" id="resultGrid"></div>
    </div>
  </div>

  <script>
    const statusEl = document.getElementById('status');
    const timestampInput = document.getElementById('timestampInput');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    const resultGrid = document.getElementById('resultGrid');
    const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    document.getElementById('convertTimestampBtn').addEventListener('click', convertTimestampInput);
    document.getElementById('convertDateBtn').addEventListener('click', convertDateInput);
    document.getElementById('nowBtn').addEventListener('click', fillNow);

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.className = 'status' + (isError ? ' error' : '');
    }

    function pad(value) {
      return String(value).padStart(2, '0');
    }

    function formatDateField(date) {
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }

    function formatTimeField(date) {
      return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    function formatRfc2822Utc(date) {
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return weekdays[date.getUTCDay()] + ', ' + pad(date.getUTCDate()) + ' ' + months[date.getUTCMonth()] + ' ' + date.getUTCFullYear() + ' ' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) + ' +0000';
    }

    function relativeTimeString(date) {
      const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
      const thresholds = [
        ['year', 31536000],
        ['month', 2592000],
        ['week', 604800],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1]
      ];

      for (const [unit, seconds] of thresholds) {
        if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
          return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
        }
      }
      return 'now';
    }

    function renderResult(label, value, wide) {
      const box = document.createElement('div');
      box.className = 'result-box' + (wide ? ' wide' : '');
      box.innerHTML = '<div class="result-label">' + label + '</div><div class="result-value">' + value + '</div>';
      resultGrid.appendChild(box);
    }

    function renderDate(date) {
      resultGrid.innerHTML = '';
      const milliseconds = date.getTime();
      const seconds = Math.floor(milliseconds / 1000);
      const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
      const localString = date.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
      const utcString = date.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      });

      renderResult('Unix seconds', String(seconds));
      renderResult('Unix milliseconds', String(milliseconds));
      renderResult('ISO 8601', date.toISOString(), true);
      renderResult('RFC 2822', formatRfc2822Utc(date), true);
      renderResult('Relative time', relativeTimeString(date));
      renderResult('UTC', utcString, true);
      renderResult('Local (' + localZone + ')', localString, true);
    }

    function updateInputsFromDate(date) {
      timestampInput.value = String(Math.floor(date.getTime() / 1000));
      dateInput.value = formatDateField(date);
      timeInput.value = formatTimeField(date);
      renderDate(date);
    }

    function convertTimestampInput() {
      const raw = timestampInput.value.trim();
      if (!/^[-+]?\d+(\.\d+)?$/.test(raw)) {
        setStatus('Enter a numeric Unix timestamp in seconds or milliseconds.', true);
        resultGrid.innerHTML = '';
        return;
      }

      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) {
        setStatus('The timestamp is outside the supported numeric range.', true);
        resultGrid.innerHTML = '';
        return;
      }

      const milliseconds = Math.abs(numeric) >= 1e12 ? Math.trunc(numeric) : Math.trunc(numeric * 1000);
      const date = new Date(milliseconds);
      if (Number.isNaN(date.getTime())) {
        setStatus('That timestamp could not be converted into a valid date.', true);
        resultGrid.innerHTML = '';
        return;
      }

      dateInput.value = formatDateField(date);
      timeInput.value = formatTimeField(date);
      renderDate(date);
      setStatus('Converted timestamp successfully.', false);
    }

    function convertDateInput() {
      if (!dateInput.value || !timeInput.value) {
        setStatus('Choose both a date and a time first.', true);
        resultGrid.innerHTML = '';
        return;
      }

      const date = new Date(dateInput.value + 'T' + timeInput.value);
      if (Number.isNaN(date.getTime())) {
        setStatus('The selected date/time could not be parsed.', true);
        resultGrid.innerHTML = '';
        return;
      }

      timestampInput.value = String(Math.floor(date.getTime() / 1000));
      renderDate(date);
      setStatus('Converted date/time successfully.', false);
    }

    function fillNow() {
      const now = new Date();
      updateInputsFromDate(now);
      setStatus('Filled with the current time.', false);
    }

    fillNow();
  </script>
</body>
</html>`;
  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
