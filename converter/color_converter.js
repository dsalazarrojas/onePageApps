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
<title>Color Converter</title>
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
    max-width: 620px;
    text-align: center;
    line-height: 1.6;
    color: #4b5563;
  }
  .top-grid {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 18px;
    align-items: stretch;
  }
  .swatch-card {
    background: linear-gradient(135deg, #f8fbff, #eff6ff);
    border: 1px solid #dbeafe;
    border-radius: 12px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .swatch {
    flex: 1;
    min-height: 180px;
    border-radius: 12px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: #007bff;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
  }
  .picker-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  input[type="color"] {
    width: 100%;
    height: 52px;
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
  }
  .field-grid {
    display: grid;
    gap: 14px;
  }
  .field-row {
    display: grid;
    grid-template-columns: 110px 1fr auto;
    gap: 10px;
    align-items: center;
  }
  .label {
    font-weight: 700;
    color: #334155;
  }
  input[type="text"] {
    width: 100%;
    border-radius: 10px;
    border: 1px solid #d1d5db;
    padding: 12px 14px;
    font-size: 0.98rem;
    font-family: inherit;
  }
  input[type="text"]:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
  button {
    border: none;
    border-radius: 10px;
    padding: 12px 14px;
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
  .css-row {
    margin-top: 18px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }
  .css-row .label {
    display: block;
    margin-bottom: 8px;
  }
  .css-value {
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #0f172a;
    word-break: break-word;
  }
  .status {
    margin-top: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    display: none;
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
    .top-grid {
      grid-template-columns: 1fr;
    }
    .field-row {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>
  <div class="page">
    <h1>Color Converter</h1>
    <p class="subtitle">Convert colors between HEX, RGB, HSL, and HSV with precise browser-side formulas, a live preview swatch, and one-click copy actions.</p>

    <div class="card">
      <div class="top-grid">
        <div class="swatch-card">
          <div id="swatch" class="swatch"></div>
          <div class="picker-row">
            <label class="label" for="colorPicker">Color picker</label>
            <input id="colorPicker" type="color" value="#007bff">
          </div>
        </div>

        <div>
          <div class="field-grid">
            <div class="field-row">
              <div class="label">HEX</div>
              <input id="hexInput" type="text" value="#007BFF" spellcheck="false">
              <button type="button" data-copy="hexInput">Copy</button>
            </div>
            <div class="field-row">
              <div class="label">RGB</div>
              <input id="rgbInput" type="text" value="rgb(0, 123, 255)" spellcheck="false">
              <button type="button" data-copy="rgbInput">Copy</button>
            </div>
            <div class="field-row">
              <div class="label">HSL</div>
              <input id="hslInput" type="text" value="hsl(211.06, 100%, 50%)" spellcheck="false">
              <button type="button" data-copy="hslInput">Copy</button>
            </div>
            <div class="field-row">
              <div class="label">HSV</div>
              <input id="hsvInput" type="text" value="hsv(211.06, 100%, 100%)" spellcheck="false">
              <button type="button" data-copy="hsvInput">Copy</button>
            </div>
          </div>
          <div class="css-row">
            <span class="label">CSS color string</span>
            <div id="cssValue" class="css-value">rgb(0, 123, 255)</div>
          </div>
          <div id="statusBox" class="status"></div>
        </div>
      </div>
    </div>
  </div>

<script>
const fields = {
  hex: document.getElementById('hexInput'),
  rgb: document.getElementById('rgbInput'),
  hsl: document.getElementById('hslInput'),
  hsv: document.getElementById('hsvInput')
};
const swatchEl = document.getElementById('swatch');
const colorPickerEl = document.getElementById('colorPicker');
const cssValueEl = document.getElementById('cssValue');
const statusBoxEl = document.getElementById('statusBox');
let syncing = false;
let currentRgb = { r: 0, g: 123, b: 255 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function setStatus(message, isError) {
  statusBoxEl.className = 'status ' + (isError ? 'error' : 'success');
  statusBoxEl.textContent = message;
}

function normalizeHue(hue) {
  const result = hue % 360;
  return result < 0 ? result + 360 : result;
}

function rgbToHex(rgb) {
  return '#' + [rgb.r, rgb.g, rgb.b].map(function(value) {
    return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  }).join('');
}

function hexToRgb(input) {
  const clean = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(clean)) {
    throw new Error('HEX values must be 3 or 6 hexadecimal characters.');
  }
  const normalized = clean.length === 3 ? clean.split('').map(function(char) { return char + char; }).join('') : clean;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHsl(rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * (((b - r) / delta) + 2);
    else h = 60 * (((r - g) / delta) + 4);
  }

  return {
    h: round(normalizeHue(h)),
    s: round(s * 100),
    l: round(l * 100)
  };
}

function hslToRgb(hsl) {
  const h = normalizeHue(hsl.h);
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function rgbToHsv(rgb) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * (((b - r) / delta) + 2);
    else h = 60 * (((r - g) / delta) + 4);
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return {
    h: round(normalizeHue(h)),
    s: round(s * 100),
    v: round(v * 100)
  };
}

function hsvToRgb(hsv) {
  const h = normalizeHue(hsv.h);
  const s = clamp(hsv.s, 0, 100) / 100;
  const v = clamp(hsv.v, 0, 100) / 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function parseRgb(input) {
  const match = input.trim().match(/^rgb\s*\(?\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)?$/i) || input.trim().match(/^([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)$/);
  if (!match) {
    throw new Error('RGB values must look like rgb(255, 255, 255).');
  }
  const rgb = {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3])
  };
  if ([rgb.r, rgb.g, rgb.b].some(function(value) { return !Number.isFinite(value) || value < 0 || value > 255; })) {
    throw new Error('RGB channels must stay between 0 and 255.');
  }
  return { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b) };
}

function parseHsl(input) {
  const match = input.trim().match(/^hsl\s*\(?\s*([-\d.]+)\s*,\s*([-\d.]+)%\s*,\s*([-\d.]+)%\s*\)?$/i) || input.trim().match(/^([-\d.]+)\s*,\s*([-\d.]+)%\s*,\s*([-\d.]+)%$/);
  if (!match) {
    throw new Error('HSL values must look like hsl(210, 100%, 50%).');
  }
  const h = Number(match[1]);
  const s = Number(match[2]);
  const l = Number(match[3]);
  if (![h, s, l].every(Number.isFinite) || s < 0 || s > 100 || l < 0 || l > 100) {
    throw new Error('HSL saturation and lightness must stay between 0% and 100%.');
  }
  return { h: h, s: s, l: l };
}

function parseHsv(input) {
  const match = input.trim().match(/^hsv\s*\(?\s*([-\d.]+)\s*,\s*([-\d.]+)%\s*,\s*([-\d.]+)%\s*\)?$/i) || input.trim().match(/^([-\d.]+)\s*,\s*([-\d.]+)%\s*,\s*([-\d.]+)%$/);
  if (!match) {
    throw new Error('HSV values must look like hsv(210, 100%, 100%).');
  }
  const h = Number(match[1]);
  const s = Number(match[2]);
  const v = Number(match[3]);
  if (![h, s, v].every(Number.isFinite) || s < 0 || s > 100 || v < 0 || v > 100) {
    throw new Error('HSV saturation and value must stay between 0% and 100%.');
  }
  return { h: h, s: s, v: v };
}

function formatRgb(rgb) {
  return 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
}

function formatHsl(hsl) {
  return 'hsl(' + round(hsl.h) + ', ' + round(hsl.s) + '%, ' + round(hsl.l) + '%)';
}

function formatHsv(hsv) {
  return 'hsv(' + round(hsv.h) + ', ' + round(hsv.s) + '%, ' + round(hsv.v) + '%)';
}

function syncUi() {
  syncing = true;
  const hex = rgbToHex(currentRgb);
  const hsl = rgbToHsl(currentRgb);
  const hsv = rgbToHsv(currentRgb);
  fields.hex.value = hex;
  fields.rgb.value = formatRgb(currentRgb);
  fields.hsl.value = formatHsl(hsl);
  fields.hsv.value = formatHsv(hsv);
  colorPickerEl.value = hex;
  swatchEl.style.background = hex;
  cssValueEl.textContent = formatRgb(currentRgb);
  syncing = false;
}

function updateFromSource(source) {
  if (syncing) return;
  try {
    let nextRgb;
    if (source === 'hex') nextRgb = hexToRgb(fields.hex.value);
    if (source === 'rgb') nextRgb = parseRgb(fields.rgb.value);
    if (source === 'hsl') nextRgb = hslToRgb(parseHsl(fields.hsl.value));
    if (source === 'hsv') nextRgb = hsvToRgb(parseHsv(fields.hsv.value));
    if (source === 'picker') nextRgb = hexToRgb(colorPickerEl.value);
    currentRgb = nextRgb;
    syncUi();
    setStatus('Updated from ' + source.toUpperCase() + ' input.', false);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function copyField(fieldId) {
  try {
    const value = document.getElementById(fieldId).value;
    await navigator.clipboard.writeText(value);
    setStatus('Copied ' + value + ' to the clipboard.', false);
  } catch (error) {
    setStatus('Copy failed. Your browser may block clipboard access.', true);
  }
}

fields.hex.addEventListener('input', function() { updateFromSource('hex'); });
fields.rgb.addEventListener('input', function() { updateFromSource('rgb'); });
fields.hsl.addEventListener('input', function() { updateFromSource('hsl'); });
fields.hsv.addEventListener('input', function() { updateFromSource('hsv'); });
colorPickerEl.addEventListener('input', function() { updateFromSource('picker'); });
document.querySelectorAll('[data-copy]').forEach(function(button) {
  button.addEventListener('click', function() {
    copyField(button.getAttribute('data-copy'));
  });
});

syncUi();
setStatus('Ready to convert colors live as you type.', false);
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
