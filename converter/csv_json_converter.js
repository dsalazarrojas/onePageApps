addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method === 'GET') {
    return serveMainPage();
  }
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8', ...corsHeaders() }
  });
}

function serveMainPage() {
  const html = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CSV ↔ JSON Converter</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px 16px 40px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f0f2f5;
    color: #1f2937;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
  }
  .card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
    padding: 24px;
    margin-bottom: 20px;
  }
  h1 {
    margin: 0 0 10px;
    text-align: center;
    font-size: clamp(2rem, 4vw, 2.5rem);
    color: #0f172a;
  }
  .subtitle {
    margin: 0 auto 24px;
    max-width: 650px;
    text-align: center;
    color: #4b5563;
    line-height: 1.6;
  }
  .action-bar {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  button {
    border: none;
    border-radius: 10px;
    padding: 12px 16px;
    background: #007bff;
    color: #ffffff;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }
  button:hover {
    background: #0062cc;
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(0, 123, 255, 0.18);
  }
  button.secondary {
    background: #e8f1ff;
    color: #0056b3;
  }
  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .panel-title {
    margin: 0;
    font-size: 1.1rem;
    color: #0f172a;
  }
  textarea {
    width: 100%;
    min-height: 320px;
    resize: vertical;
    border-radius: 12px;
    border: 1px solid #d1d5db;
    padding: 16px;
    font: 0.96rem/1.55 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    background: #fbfdff;
  }
  textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .stat {
    background: #f8fbff;
    border: 1px solid #dbeafe;
    border-radius: 12px;
    padding: 16px;
  }
  .stat-label {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f172a;
  }
  .status {
    display: none;
    margin-top: 18px;
    padding: 14px 16px;
    border-radius: 12px;
    font-weight: 600;
  }
  .status.error {
    display: block;
    background: #fff1f2;
    color: #b42318;
    border: 1px solid #fecdd3;
  }
  .status.success {
    display: block;
    background: #effaf5;
    color: #067647;
    border: 1px solid #a6f4c5;
  }
  @media (max-width: 760px) {
    .panels {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>
  <div class="page">
    <h1>CSV ↔ JSON Converter</h1>
    <p class="subtitle">Switch structured data between CSV and JSON in your browser, including quoted fields, embedded commas, and header-based object conversion.</p>

    <div class="card">
      <div class="action-bar">
        <button id="csvToJsonBtn" type="button">CSV → JSON</button>
        <button id="jsonToCsvBtn" type="button">JSON → CSV</button>
        <button id="sampleBtn" type="button" class="secondary">Load sample data</button>
      </div>
      <div class="panels">
        <div>
          <div class="panel-header">
            <h2 class="panel-title">CSV</h2>
            <button type="button" class="secondary" onclick="copyText('csvInput')">Copy CSV</button>
          </div>
          <textarea id="csvInput" spellcheck="false" placeholder='name,email,notes\nAlex,alex@example.com,"Loves commas, charts, and quotes"'></textarea>
        </div>
        <div>
          <div class="panel-header">
            <h2 class="panel-title">JSON</h2>
            <button type="button" class="secondary" onclick="copyText('jsonInput')">Copy JSON</button>
          </div>
          <textarea id="jsonInput" spellcheck="false" placeholder='[\n  {\n    "name": "Alex",\n    "email": "alex@example.com"\n  }\n]'></textarea>
        </div>
      </div>
      <div id="statusBox" class="status"></div>
    </div>

    <div class="card">
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Rows</div>
          <div class="stat-value" id="rowCount">0</div>
        </div>
        <div class="stat">
          <div class="stat-label">Columns</div>
          <div class="stat-value" id="columnCount">0</div>
        </div>
      </div>
    </div>
  </div>

<script>
const csvInputEl = document.getElementById('csvInput');
const jsonInputEl = document.getElementById('jsonInput');
const rowCountEl = document.getElementById('rowCount');
const columnCountEl = document.getElementById('columnCount');
const statusBoxEl = document.getElementById('statusBox');

function setStatus(message, isError) {
  statusBoxEl.className = 'status ' + (isError ? 'error' : 'success');
  statusBoxEl.textContent = message;
}

function clearStatus() {
  statusBoxEl.className = 'status';
  statusBoxEl.textContent = '';
}

function updateCounts(rows, columns) {
  rowCountEl.textContent = String(rows);
  columnCountEl.textContent = String(columns);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char === '\r') {
      continue;
    } else {
      value += char;
    }
  }

  if (inQuotes) {
    throw new Error('CSV input has an unclosed quoted field.');
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter(function(currentRow) {
    return currentRow.length > 1 || currentRow[0] !== '';
  });
}

function csvToJson() {
  try {
    const rows = parseCsv(csvInputEl.value);
    if (!rows.length) {
      throw new Error('Paste CSV with a header row before converting.');
    }
    const headers = rows[0].map(function(header, index) {
      const trimmed = header.trim();
      return trimmed || 'column_' + (index + 1);
    });
    const dataRows = rows.slice(1);
    const objects = dataRows.map(function(row) {
      const record = {};
      headers.forEach(function(header, index) {
        record[header] = row[index] !== undefined ? row[index] : '';
      });
      return record;
    });
    jsonInputEl.value = JSON.stringify(objects, null, 2);
    updateCounts(dataRows.length, headers.length);
    setStatus('Converted CSV to JSON successfully.', false);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function normalizeRecords(parsed) {
  if (Array.isArray(parsed)) {
    if (!parsed.length) return [];
    return parsed.map(function(item) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        return item;
      }
      return { value: item };
    });
  }
  if (parsed && typeof parsed === 'object') {
    return [parsed];
  }
  return [{ value: parsed }];
}

function escapeCsvValue(value) {
  const stringValue = value == null ? '' : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
}

function jsonToCsv() {
  try {
    if (!jsonInputEl.value.trim()) {
      throw new Error('Paste JSON before converting to CSV.');
    }
    const parsed = JSON.parse(jsonInputEl.value);
    const records = normalizeRecords(parsed);
    const headerSet = [];

    records.forEach(function(record) {
      Object.keys(record).forEach(function(key) {
        if (!headerSet.includes(key)) {
          headerSet.push(key);
        }
      });
    });

    const lines = [];
    lines.push(headerSet.map(escapeCsvValue).join(','));
    records.forEach(function(record) {
      lines.push(headerSet.map(function(header) {
        const value = record[header];
        if (value && typeof value === 'object') {
          return escapeCsvValue(JSON.stringify(value));
        }
        return escapeCsvValue(value);
      }).join(','));
    });

    csvInputEl.value = lines.join('\n');
    updateCounts(records.length, headerSet.length);
    setStatus('Converted JSON to CSV successfully.', false);
  } catch (error) {
    setStatus('Invalid JSON: ' + error.message, true);
  }
}

async function copyText(id) {
  try {
    await navigator.clipboard.writeText(document.getElementById(id).value);
    setStatus('Copied text from ' + (id === 'csvInput' ? 'CSV' : 'JSON') + ' panel.', false);
  } catch (error) {
    setStatus('Copy failed. Your browser may block clipboard access.', true);
  }
}

function loadSample() {
  csvInputEl.value = 'name,email,notes\nAlex,alex@example.com,"Loves commas, charts, and quotes"\nJordan,jordan@example.com,"Prefers weekly exports"';
  csvToJson();
}

document.getElementById('csvToJsonBtn').addEventListener('click', csvToJson);
document.getElementById('jsonToCsvBtn').addEventListener('click', jsonToCsv);
document.getElementById('sampleBtn').addEventListener('click', loadSample);
csvInputEl.addEventListener('input', clearStatus);
jsonInputEl.addEventListener('input', clearStatus);
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
