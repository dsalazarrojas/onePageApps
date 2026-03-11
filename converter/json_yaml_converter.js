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
<title>JSON ↔ YAML Converter</title>
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
    max-width: 660px;
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
  .status {
    display: none;
    margin-top: 18px;
    padding: 14px 16px;
    border-radius: 12px;
    font-weight: 600;
    line-height: 1.5;
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
  .tip-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }
  .tip {
    background: #f8fbff;
    border: 1px solid #dbeafe;
    border-radius: 12px;
    padding: 16px;
    color: #475569;
    line-height: 1.5;
  }
  .tip strong {
    display: block;
    margin-bottom: 6px;
    color: #0f172a;
  }
  @media (max-width: 760px) {
    .panels,
    .tip-list {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>
  <div class="page">
    <h1>JSON ↔ YAML Converter</h1>
    <p class="subtitle">Translate data structures between JSON and a lightweight YAML subset entirely in the browser, with nested objects, arrays, and inline validation errors.</p>

    <div class="card">
      <div class="action-bar">
        <button id="jsonToYamlBtn" type="button">JSON → YAML</button>
        <button id="yamlToJsonBtn" type="button">YAML → JSON</button>
        <button id="sampleBtn" type="button" class="secondary">Load sample data</button>
      </div>
      <div class="panels">
        <div>
          <div class="panel-header">
            <h2 class="panel-title">JSON</h2>
            <button type="button" class="secondary" onclick="copyText('jsonInput')">Copy JSON</button>
          </div>
          <textarea id="jsonInput" spellcheck="false" placeholder='{\n  "project": "oneTimeUseWebApp",\n  "features": ["json", "yaml"],\n  "active": true\n}'></textarea>
        </div>
        <div>
          <div class="panel-header">
            <h2 class="panel-title">YAML</h2>
            <button type="button" class="secondary" onclick="copyText('yamlInput')">Copy YAML</button>
          </div>
          <textarea id="yamlInput" spellcheck="false" placeholder='project: oneTimeUseWebApp\nfeatures:\n  - json\n  - yaml\nactive: true'></textarea>
        </div>
      </div>
      <div id="statusBox" class="status"></div>
      <div class="tip-list">
        <div class="tip"><strong>Supported values</strong>Objects, arrays, strings, numbers, booleans, and null are supported in both directions.</div>
        <div class="tip"><strong>Indentation</strong>YAML parsing expects spaces only, with 2-space nesting.</div>
        <div class="tip"><strong>Quoted strings</strong>Special characters are automatically quoted when YAML is generated.</div>
      </div>
    </div>
  </div>

<script>
const jsonInputEl = document.getElementById('jsonInput');
const yamlInputEl = document.getElementById('yamlInput');
const statusBoxEl = document.getElementById('statusBox');

function setStatus(message, isError) {
  statusBoxEl.className = 'status ' + (isError ? 'error' : 'success');
  statusBoxEl.textContent = message;
}

function clearStatus() {
  statusBoxEl.className = 'status';
  statusBoxEl.textContent = '';
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function needsQuotes(value) {
  return value === '' || /^\s|\s$/.test(value) || /^[-?:]/.test(value) || /[:#,\[\]{}&*!|>'"%@]/.test(value) || /^(true|false|null|~)$/i.test(value) || /^[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(value) || value.includes('\n');
}

function stringifyScalar(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('JSON numbers must be finite before converting to YAML.');
    return String(value);
  }
  if (typeof value === 'string') {
    return needsQuotes(value) ? JSON.stringify(value) : value;
  }
  throw new Error('Unsupported value type in YAML serializer.');
}

function toYaml(value, indent) {
  const spacing = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return spacing + '[]';
    return value.map(function(item) {
      if (Array.isArray(item) || isPlainObject(item)) {
        if (Array.isArray(item) && item.length === 0) return spacing + '- []';
        if (isPlainObject(item) && Object.keys(item).length === 0) return spacing + '- {}';
        return spacing + '-\n' + toYaml(item, indent + 2);
      }
      return spacing + '- ' + stringifyScalar(item);
    }).join('\n');
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (!keys.length) return spacing + '{}';
    return keys.map(function(key) {
      const safeKey = /^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
      const item = value[key];
      if (Array.isArray(item) || isPlainObject(item)) {
        if (Array.isArray(item) && item.length === 0) return spacing + safeKey + ': []';
        if (isPlainObject(item) && Object.keys(item).length === 0) return spacing + safeKey + ': {}';
        return spacing + safeKey + ':\n' + toYaml(item, indent + 2);
      }
      return spacing + safeKey + ': ' + stringifyScalar(item);
    }).join('\n');
  }
  return spacing + stringifyScalar(value);
}

function countIndent(text) {
  return text.length - text.replace(/^\s+/, '').length;
}

function findKeySeparator(text) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const prev = text[i - 1];
    if (char === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
    } else if (char === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (char === ':' && !inSingle && !inDouble) {
      return i;
    }
  }
  return -1;
}

function parseQuoted(text, lineNumber) {
  if (text.startsWith('"')) {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('Invalid quoted string on line ' + lineNumber + '.');
    }
  }
  if (!text.endsWith("'")) {
    throw new Error('Invalid quoted string on line ' + lineNumber + '.');
  }
  return text.slice(1, -1).replace(/''/g, "'");
}

function parseScalar(text, lineNumber) {
  if (text === 'null' || text === '~') return null;
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === '[]') return [];
  if (text === '{}') return {};
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return parseQuoted(text, lineNumber);
  }
  if (/^[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(text)) {
    return Number(text);
  }
  return text;
}

function parseKey(rawKey, lineNumber) {
  const keyText = rawKey.trim();
  if (!keyText) {
    throw new Error('Missing key on line ' + lineNumber + '.');
  }
  if ((keyText.startsWith('"') && keyText.endsWith('"')) || (keyText.startsWith("'") && keyText.endsWith("'"))) {
    return String(parseQuoted(keyText, lineNumber));
  }
  return keyText;
}

function parseYaml(input) {
  const rawLines = input.replace(/\r/g, '').split('\n');
  const lines = [];

  rawLines.forEach(function(text, index) {
    if (/\t/.test(text)) {
      throw new Error('Tabs are not supported for YAML indentation (line ' + (index + 1) + ').');
    }
    const trimmed = text.replace(/\s+$/, '');
    if (!trimmed.trim() || trimmed.trim().startsWith('#')) {
      return;
    }
    lines.push({ number: index + 1, text: trimmed });
  });

  if (!lines.length) {
    throw new Error('Paste YAML before converting to JSON.');
  }

  function parseBlock(index, indent) {
    if (index >= lines.length) {
      throw new Error('Unexpected end of YAML input.');
    }
    const currentIndent = countIndent(lines[index].text);
    if (currentIndent !== indent) {
      throw new Error('Unexpected indentation on line ' + lines[index].number + '.');
    }
    const trimmed = lines[index].text.slice(indent);
    if (trimmed.startsWith('-')) {
      return parseArray(index, indent);
    }
    if (findKeySeparator(trimmed) !== -1) {
      return parseObject(index, indent);
    }
    return [parseScalar(trimmed, lines[index].number), index + 1];
  }

  function parseObject(index, indent) {
    const result = {};
    while (index < lines.length) {
      const line = lines[index];
      const currentIndent = countIndent(line.text);
      if (currentIndent < indent) break;
      if (currentIndent !== indent) {
        throw new Error('Unexpected indentation on line ' + line.number + '.');
      }
      const trimmed = line.text.slice(indent);
      if (trimmed.startsWith('-')) break;
      const separator = findKeySeparator(trimmed);
      if (separator === -1) {
        throw new Error('Expected key: value syntax on line ' + line.number + '.');
      }
      const key = parseKey(trimmed.slice(0, separator), line.number);
      const valueText = trimmed.slice(separator + 1).trim();
      index += 1;
      if (!valueText) {
        if (index < lines.length && countIndent(lines[index].text) > indent) {
          if (countIndent(lines[index].text) !== indent + 2) {
            throw new Error('Nested YAML blocks must indent by 2 spaces (line ' + lines[index].number + ').');
          }
          const nested = parseBlock(index, indent + 2);
          result[key] = nested[0];
          index = nested[1];
        } else {
          result[key] = null;
        }
      } else {
        result[key] = parseScalar(valueText, line.number);
      }
    }
    return [result, index];
  }

  function parseArray(index, indent) {
    const result = [];
    while (index < lines.length) {
      const line = lines[index];
      const currentIndent = countIndent(line.text);
      if (currentIndent < indent) break;
      if (currentIndent !== indent) {
        throw new Error('Unexpected indentation on line ' + line.number + '.');
      }
      const trimmed = line.text.slice(indent);
      if (!trimmed.startsWith('-')) break;
      const valueText = trimmed.slice(1).trim();
      index += 1;
      if (!valueText) {
        if (index < lines.length && countIndent(lines[index].text) > indent) {
          if (countIndent(lines[index].text) !== indent + 2) {
            throw new Error('Nested YAML blocks must indent by 2 spaces (line ' + lines[index].number + ').');
          }
          const nested = parseBlock(index, indent + 2);
          result.push(nested[0]);
          index = nested[1];
        } else {
          result.push(null);
        }
        continue;
      }

      const separator = findKeySeparator(valueText);
      if (separator !== -1) {
        const inlineObject = {};
        const key = parseKey(valueText.slice(0, separator), line.number);
        const remainder = valueText.slice(separator + 1).trim();
        if (remainder) {
          inlineObject[key] = parseScalar(remainder, line.number);
        } else if (index < lines.length && countIndent(lines[index].text) > indent) {
          if (countIndent(lines[index].text) !== indent + 4) {
            throw new Error('Nested YAML blocks must indent by 2 spaces beyond the list item (line ' + lines[index].number + ').');
          }
          const nestedValue = parseBlock(index, indent + 4);
          inlineObject[key] = nestedValue[0];
          index = nestedValue[1];
        } else {
          inlineObject[key] = null;
        }

        while (index < lines.length) {
          const nextLine = lines[index];
          const nextIndent = countIndent(nextLine.text);
          if (nextIndent < indent + 2) break;
          if (nextIndent !== indent + 2) {
            throw new Error('Unexpected indentation on line ' + nextLine.number + '.');
          }
          const nextTrimmed = nextLine.text.slice(indent + 2);
          if (nextTrimmed.startsWith('-')) break;
          const nextSeparator = findKeySeparator(nextTrimmed);
          if (nextSeparator === -1) {
            throw new Error('Expected key: value syntax on line ' + nextLine.number + '.');
          }
          const nextKey = parseKey(nextTrimmed.slice(0, nextSeparator), nextLine.number);
          const nextValueText = nextTrimmed.slice(nextSeparator + 1).trim();
          index += 1;
          if (!nextValueText) {
            if (index < lines.length && countIndent(lines[index].text) > indent + 2) {
              if (countIndent(lines[index].text) !== indent + 4) {
                throw new Error('Nested YAML blocks must indent by 2 spaces (line ' + lines[index].number + ').');
              }
              const nestedEntry = parseBlock(index, indent + 4);
              inlineObject[nextKey] = nestedEntry[0];
              index = nestedEntry[1];
            } else {
              inlineObject[nextKey] = null;
            }
          } else {
            inlineObject[nextKey] = parseScalar(nextValueText, nextLine.number);
          }
        }
        result.push(inlineObject);
      } else {
        result.push(parseScalar(valueText, line.number));
      }
    }
    return [result, index];
  }

  const parsed = parseBlock(0, 0);
  if (parsed[1] !== lines.length) {
    throw new Error('Unexpected trailing YAML content on line ' + lines[parsed[1]].number + '.');
  }
  return parsed[0];
}

function jsonToYaml() {
  try {
    if (!jsonInputEl.value.trim()) {
      throw new Error('Paste JSON before converting to YAML.');
    }
    const parsed = JSON.parse(jsonInputEl.value);
    yamlInputEl.value = toYaml(parsed, 0);
    setStatus('Converted JSON to YAML successfully.', false);
  } catch (error) {
    setStatus('JSON conversion failed: ' + error.message, true);
  }
}

function yamlToJson() {
  try {
    const parsed = parseYaml(yamlInputEl.value);
    jsonInputEl.value = JSON.stringify(parsed, null, 2);
    setStatus('Converted YAML to JSON successfully.', false);
  } catch (error) {
    setStatus('YAML conversion failed: ' + error.message, true);
  }
}

async function copyText(id) {
  try {
    await navigator.clipboard.writeText(document.getElementById(id).value);
    setStatus('Copied text from ' + (id === 'jsonInput' ? 'JSON' : 'YAML') + ' panel.', false);
  } catch (error) {
    setStatus('Copy failed. Your browser may block clipboard access.', true);
  }
}

function loadSample() {
  jsonInputEl.value = '{\n  "project": "oneTimeUseWebApp",\n  "features": [\n    "json",\n    "yaml",\n    "client-side"\n  ],\n  "settings": {\n    "theme": "light",\n    "showTips": true,\n    "version": 1\n  },\n  "owner": null\n}';
  jsonToYaml();
}

document.getElementById('jsonToYamlBtn').addEventListener('click', jsonToYaml);
document.getElementById('yamlToJsonBtn').addEventListener('click', yamlToJson);
document.getElementById('sampleBtn').addEventListener('click', loadSample);
jsonInputEl.addEventListener('input', clearStatus);
yamlInputEl.addEventListener('input', clearStatus);
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
