addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() } });
  }
  if (url.pathname === '/widget.js') return new Response(widgetJS(), { headers: jsHeaders() });
  return new Response(pageHTML(), { headers: htmlHeaders() });
}

function widgetJS() {
  return String.raw`(function(){
  var s = document.currentScript;
  var raw = (s && s.dataset && s.dataset.config) || '';
  var base = (s && s.src || '').replace(/\/widget\.js(?:\?.*)?$/, '');
  var frame = document.createElement('iframe');
  frame.src = base + '/?embed=1&config=' + raw;
  frame.loading = 'lazy';
  frame.style.cssText = 'width:100%;min-height:500px;border:none;border-radius:16px;display:block';
  frame.title = 'Unit converter widget';
  (s && s.parentNode ? s.parentNode : document.body).insertBefore(frame, s || null);
})();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Embeddable Unit Converter Widget</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1120px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; color: #475569; max-width: 760px; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  .stack { display: grid; gap: 14px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input, select { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  pre.output { margin: 0; padding: 16px; background: #0f172a; color: #e2e8f0; border-radius: 14px; white-space: pre-wrap; overflow: auto; }
  .preview { width: 100%; min-height: 500px; border: 1px solid #cbd5e1; border-radius: 16px; background: white; }
  .hidden { display: none !important; }
  .widget { border: 1px solid #dbe3f0; border-radius: 18px; background: white; box-shadow: 0 18px 40px rgba(15,23,42,.12); padding: 18px; max-width: 560px; }
  .converter { display: grid; gap: 12px; }
  .triple { display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: end; }
  .result { padding: 14px; border-radius: 14px; background: #eff6ff; border: 1px solid #dbeafe; font-size: 1.8rem; font-weight: 900; word-break: break-word; }
  .muted { color: #64748b; font-size: 0.95rem; line-height: 1.6; }
  @media (max-width: 920px) { .grid { grid-template-columns: 1fr; } .triple { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page" id="builderPage">
  <div class="hero">
    <h1>Embeddable Unit Converter Widget</h1>
    <p>Generate a compact browser-side converter for common categories including length, mass, temperature, volume, and speed.</p>
  </div>
  <div class="grid">
    <div class="card stack">
      <div>
        <label for="title">Widget title</label>
        <input id="title" value="Operations unit converter">
      </div>
      <div>
        <label for="accent">Accent color</label>
        <input id="accent" type="color" value="#2563eb">
      </div>
      <div>
        <label for="defaultCategory">Default category</label>
        <select id="defaultCategory">
          <option value="length">Length</option>
          <option value="mass">Mass</option>
          <option value="temperature">Temperature</option>
          <option value="volume">Volume</option>
          <option value="speed">Speed</option>
        </select>
      </div>
      <div class="muted">The widget always includes every category; the chosen default controls the starting view when embedded.</div>
      <div class="actions">
        <button class="primary" type="button" id="generateBtn">Generate embed code</button>
        <button class="secondary" type="button" id="copyBtn">Copy code</button>
      </div>
    </div>
    <div class="stack">
      <div class="card">
        <label>Embed snippet</label>
        <pre class="output" id="output"></pre>
      </div>
      <div class="card">
        <label>Live preview</label>
        <iframe id="preview" class="preview" title="Preview"></iframe>
      </div>
    </div>
  </div>
</div>
<div id="embedMount" class="hidden"></div>
<script>
(function() {
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get('embed') === '1';
  const defs = {
    length: { label: 'Length', units: { meter: { label: 'Meters', factor: 1 }, kilometer: { label: 'Kilometers', factor: 1000 }, centimeter: { label: 'Centimeters', factor: 0.01 }, mile: { label: 'Miles', factor: 1609.344 }, yard: { label: 'Yards', factor: 0.9144 }, foot: { label: 'Feet', factor: 0.3048 } } },
    mass: { label: 'Mass', units: { kilogram: { label: 'Kilograms', factor: 1 }, gram: { label: 'Grams', factor: 0.001 }, pound: { label: 'Pounds', factor: 0.45359237 }, ounce: { label: 'Ounces', factor: 0.028349523125 } } },
    temperature: { label: 'Temperature', units: { celsius: { label: 'Celsius' }, fahrenheit: { label: 'Fahrenheit' }, kelvin: { label: 'Kelvin' } } },
    volume: { label: 'Volume', units: { liter: { label: 'Liters', factor: 1 }, milliliter: { label: 'Milliliters', factor: 0.001 }, gallon: { label: 'US gallons', factor: 3.78541 }, cup: { label: 'US cups', factor: 0.236588 } } },
    speed: { label: 'Speed', units: { mps: { label: 'Meters/sec', factor: 1 }, kph: { label: 'Kilometers/hour', factor: 0.2777777778 }, mph: { label: 'Miles/hour', factor: 0.44704 }, knot: { label: 'Knots', factor: 0.514444 } } }
  };
  const defaults = { title: 'Operations unit converter', accent: '#2563eb', defaultCategory: 'length' };

  function readConfig() {
    if (!params.get('config')) return { ...defaults };
    try { return Object.assign({}, defaults, JSON.parse(params.get('config')) || {}); }
    catch (error) { return { ...defaults }; }
  }

  function buildOptions(map) {
    return Object.keys(map).map(function(key) {
      return '<option value="' + key + '">' + map[key].label + '</option>';
    }).join('');
  }

  function convert(categoryKey, amount, fromKey, toKey) {
    if (categoryKey === 'temperature') {
      let celsius = amount;
      if (fromKey === 'fahrenheit') celsius = (amount - 32) * 5 / 9;
      if (fromKey === 'kelvin') celsius = amount - 273.15;
      if (toKey === 'fahrenheit') return celsius * 9 / 5 + 32;
      if (toKey === 'kelvin') return celsius + 273.15;
      return celsius;
    }
    const from = defs[categoryKey].units[fromKey];
    const to = defs[categoryKey].units[toKey];
    return amount * from.factor / to.factor;
  }

  function formatNumber(value) {
    if (!isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs && (abs >= 100000 || abs < 0.001)) return value.toExponential(4);
    return Number(value.toFixed(6)).toString();
  }

  function renderWidget(target, cfg) {
    target.innerHTML = '';
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;align-items:end;margin-bottom:16px"><div><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b">Embeddable widget</div><div style="font-size:24px;font-weight:800">' + cfg.title + '</div></div><div style="width:42px;height:42px;border-radius:12px;background:' + cfg.accent + ';box-shadow:0 8px 18px rgba(37,99,235,.2)"></div></div><div class="converter"><div><label>Category</label><select id="category"></select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label>Value</label><input id="amount" type="number" value="1" step="any"></div><div><label>Result</label><div id="result" class="result"></div></div></div><div class="triple"><div><label>From</label><select id="fromUnit"></select></div><button type="button" id="swapBtn" style="height:46px;background:#eff6ff;color:' + cfg.accent + '">⇄</button><div><label>To</label><select id="toUnit"></select></div></div><div id="meta" class="muted"></div></div>';
    target.appendChild(widget);
    const category = widget.querySelector('#category');
    const amount = widget.querySelector('#amount');
    const fromUnit = widget.querySelector('#fromUnit');
    const toUnit = widget.querySelector('#toUnit');
    const result = widget.querySelector('#result');
    const meta = widget.querySelector('#meta');
    category.innerHTML = buildOptions(Object.keys(defs).reduce(function(acc, key) { acc[key] = { label: defs[key].label }; return acc; }, {}));
    category.value = defs[cfg.defaultCategory] ? cfg.defaultCategory : 'length';
    function syncUnits() {
      const categoryKey = category.value;
      fromUnit.innerHTML = buildOptions(defs[categoryKey].units);
      toUnit.innerHTML = buildOptions(defs[categoryKey].units);
      const keys = Object.keys(defs[categoryKey].units);
      fromUnit.value = keys[0];
      toUnit.value = keys[Math.min(1, keys.length - 1)] || keys[0];
      update();
    }
    function update() {
      const categoryKey = category.value;
      const value = parseFloat(amount.value);
      if (!isFinite(value)) {
        result.textContent = 'Enter a number';
        meta.textContent = 'Conversions happen entirely in the browser.';
        return;
      }
      const converted = convert(categoryKey, value, fromUnit.value, toUnit.value);
      result.style.color = cfg.accent;
      result.textContent = formatNumber(converted);
      meta.textContent = formatNumber(value) + ' ' + defs[categoryKey].units[fromUnit.value].label + ' = ' + formatNumber(converted) + ' ' + defs[categoryKey].units[toUnit.value].label;
    }
    category.addEventListener('change', syncUnits);
    amount.addEventListener('input', update);
    fromUnit.addEventListener('change', update);
    toUnit.addEventListener('change', update);
    widget.querySelector('#swapBtn').addEventListener('click', function() {
      const temp = fromUnit.value;
      fromUnit.value = toUnit.value;
      toUnit.value = temp;
      update();
    });
    syncUnits();
  }

  if (isEmbed) {
    document.body.style.background = 'transparent';
    document.body.style.padding = '16px';
    document.getElementById('builderPage').remove();
    const embedMount = document.getElementById('embedMount');
    embedMount.classList.remove('hidden');
    renderWidget(embedMount, readConfig());
    return;
  }

  function currentConfig() {
    return {
      title: document.getElementById('title').value.trim() || defaults.title,
      accent: document.getElementById('accent').value,
      defaultCategory: document.getElementById('defaultCategory').value
    };
  }

  function update() {
    const cfg = currentConfig();
    const encoded = encodeURIComponent(JSON.stringify(cfg));
    const snippet = '<script src="' + location.origin + '/widget.js" data-config="' + encoded + '"><\\/script>';
    document.getElementById('output').textContent = snippet;
    document.getElementById('preview').src = '/?embed=1&config=' + encoded;
  }

  document.getElementById('generateBtn').addEventListener('click', update);
  document.getElementById('copyBtn').addEventListener('click', function() {
    const text = document.getElementById('output').textContent;
    if (navigator.clipboard && text) {
      navigator.clipboard.writeText(text).then(function() {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied';
        setTimeout(function() { btn.textContent = 'Copy code'; }, 1200);
      });
    }
  });
  ['title', 'accent', 'defaultCategory'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', update);
    document.getElementById(id).addEventListener('change', update);
  });
  update();
})();
</script>
</body>
</html>`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function htmlHeaders() { return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() }; }
function jsHeaders() { return { 'Content-Type': 'application/javascript; charset=utf-8', ...corsHeaders() }; }
