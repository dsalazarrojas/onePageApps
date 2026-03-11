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
<title>JSON Formatter & Validator</title>
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
    font-size: clamp(2rem, 4vw, 2.5rem);
    color: #0f172a;
    text-align: center;
  }
  .subtitle {
    margin: 0 auto 24px;
    max-width: 620px;
    text-align: center;
    color: #4b5563;
    line-height: 1.6;
  }
  textarea {
    width: 100%;
    min-height: 280px;
    resize: vertical;
    border-radius: 12px;
    border: 1px solid #d1d5db;
    padding: 16px;
    font: 0.98rem/1.55 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    background: #fbfdff;
  }
  textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
  .button-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin: 18px 0 0;
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
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
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
    word-break: break-word;
  }
  .error {
    display: none;
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #b42318;
    font-weight: 600;
    line-height: 1.5;
  }
  .output-wrap {
    background: #0f172a;
    border-radius: 12px;
    padding: 18px;
    overflow: auto;
    min-height: 250px;
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font: 0.95rem/1.6 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    color: #e2e8f0;
  }
  .string { color: #86efac; }
  .number { color: #fbbf24; }
  .boolean { color: #93c5fd; }
  .null { color: #fca5a5; }
  .key { color: #c4b5fd; }
  .placeholder {
    color: #94a3b8;
  }
  @media (max-width: 720px) {
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
</head>
<body>
  <div class="page">
    <h1>JSON Formatter & Validator</h1>
    <p class="subtitle">Paste JSON, format it for readability, minify it for transport, validate it instantly, and inspect basic structure statistics.</p>

    <div class="card">
      <textarea id="jsonInput" spellcheck="false" placeholder='Paste JSON here...\n{\n  "user": {\n    "name": "Taylor",\n    "roles": ["admin", "editor"]\n  }\n}'></textarea>
      <div class="button-row">
        <button type="button" id="formatBtn">Format</button>
        <button type="button" id="minifyBtn">Minify</button>
        <button type="button" id="validateBtn">Validate</button>
        <button type="button" id="sampleBtn" class="secondary">Load sample</button>
      </div>
      <div id="errorBox" class="error"></div>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Status</div>
          <div class="stat-value" id="statusValue">Waiting</div>
        </div>
        <div class="stat">
          <div class="stat-label">Key count</div>
          <div class="stat-value" id="keyCount">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Depth</div>
          <div class="stat-value" id="depthValue">—</div>
        </div>
        <div class="stat">
          <div class="stat-label">Size</div>
          <div class="stat-value" id="sizeValue">0 bytes</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="font-weight: 700; margin-bottom: 14px; color: #0f172a;">Formatted preview</div>
      <div class="output-wrap">
        <pre id="output"><span class="placeholder">Formatted JSON will appear here after you validate or transform the input.</span></pre>
      </div>
    </div>
  </div>

<script>
const inputEl = document.getElementById('jsonInput');
const outputEl = document.getElementById('output');
const errorBoxEl = document.getElementById('errorBox');
const statusValueEl = document.getElementById('statusValue');
const keyCountEl = document.getElementById('keyCount');
const depthValueEl = document.getElementById('depthValue');
const sizeValueEl = document.getElementById('sizeValue');

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function syntaxHighlight(jsonText) {
  const escaped = escapeHtml(jsonText);
  return escaped.replace(/("(\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"\s*:|"(\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g, function(match) {
    let className = 'number';
    if (/^".*":$/.test(match)) {
      className = 'key';
    } else if (/^"/.test(match)) {
      className = 'string';
    } else if (/true|false/.test(match)) {
      className = 'boolean';
    } else if (/null/.test(match)) {
      className = 'null';
    }
    return '<span class="' + className + '">' + match + '</span>';
  });
}

function countKeys(value) {
  if (Array.isArray(value)) {
    return value.reduce(function(total, item) { return total + countKeys(item); }, 0);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).length + Object.values(value).reduce(function(total, item) {
      return total + countKeys(item);
    }, 0);
  }
  return 0;
}

function getDepth(value) {
  if (Array.isArray(value)) {
    if (!value.length) return 1;
    return 1 + Math.max.apply(null, value.map(getDepth));
  }
  if (value && typeof value === 'object') {
    const values = Object.values(value);
    if (!values.length) return 1;
    return 1 + Math.max.apply(null, values.map(getDepth));
  }
  return 0;
}

function updateSize(text) {
  sizeValueEl.textContent = new TextEncoder().encode(text).length.toLocaleString() + ' bytes';
}

function showError(message) {
  errorBoxEl.style.display = 'block';
  errorBoxEl.textContent = message;
  statusValueEl.textContent = 'Invalid';
}

function clearError() {
  errorBoxEl.style.display = 'none';
  errorBoxEl.textContent = '';
}

function renderOutput(text) {
  outputEl.innerHTML = syntaxHighlight(text);
}

function updateStats(value, rawText) {
  statusValueEl.textContent = 'Valid';
  keyCountEl.textContent = countKeys(value).toLocaleString();
  depthValueEl.textContent = getDepth(value).toLocaleString();
  updateSize(rawText);
}

function parseInput() {
  const raw = inputEl.value.trim();
  if (!raw) {
    throw new Error('Paste JSON into the editor before formatting or validating.');
  }
  return JSON.parse(raw);
}

function lineAndColumnFromPosition(text, position) {
  const sliced = text.slice(0, position);
  const lines = sliced.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

function formatJson(pretty) {
  const rawText = inputEl.value;
  try {
    const parsed = parseInput();
    clearError();
    const outputText = pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
    inputEl.value = outputText;
    renderOutput(outputText);
    updateStats(parsed, outputText);
  } catch (error) {
    const match = /position (\d+)/i.exec(error.message || '');
    let message = 'Invalid JSON: ' + (error.message || 'Unknown parse error');
    if (match) {
      const details = lineAndColumnFromPosition(rawText, Number(match[1]));
      message += ' (line ' + details.line + ', column ' + details.column + ')';
    }
    showError(message);
  }
}

function validateJson() {
  const rawText = inputEl.value;
  try {
    const parsed = parseInput();
    clearError();
    const previewText = JSON.stringify(parsed, null, 2);
    renderOutput(previewText);
    updateStats(parsed, rawText);
  } catch (error) {
    const match = /position (\d+)/i.exec(error.message || '');
    let message = 'Invalid JSON: ' + (error.message || 'Unknown parse error');
    if (match) {
      const details = lineAndColumnFromPosition(rawText, Number(match[1]));
      message += ' (line ' + details.line + ', column ' + details.column + ')';
    }
    showError(message);
  }
}

function loadSample() {
  inputEl.value = '{\n  "project": "oneTimeUseWebApp",\n  "features": [\n    "format",\n    "minify",\n    "validate"\n  ],\n  "metadata": {\n    "createdBy": "browser",\n    "active": true,\n    "version": 1\n  }\n}';
  validateJson();
}

inputEl.addEventListener('input', function() {
  updateSize(inputEl.value);
  if (!inputEl.value.trim()) {
    clearError();
    statusValueEl.textContent = 'Waiting';
    keyCountEl.textContent = '—';
    depthValueEl.textContent = '—';
    outputEl.innerHTML = '<span class="placeholder">Formatted JSON will appear here after you validate or transform the input.</span>';
  }
});

document.getElementById('formatBtn').addEventListener('click', function() { formatJson(true); });
document.getElementById('minifyBtn').addEventListener('click', function() { formatJson(false); });
document.getElementById('validateBtn').addEventListener('click', validateJson);
document.getElementById('sampleBtn').addEventListener('click', loadSample);
updateSize('');
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
