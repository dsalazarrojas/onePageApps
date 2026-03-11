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
<title>Unit Converter</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f0f2f5;
    color: #1f2937;
    padding: 24px 16px 40px;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
  }
  .hero {
    text-align: center;
    margin-bottom: 24px;
  }
  .hero h1 {
    margin: 0 0 10px;
    font-size: clamp(2rem, 4vw, 2.6rem);
    color: #0f172a;
  }
  .hero p {
    margin: 0 auto;
    max-width: 620px;
    color: #4b5563;
    line-height: 1.6;
  }
  .card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
    padding: 24px;
    margin-bottom: 20px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .triple {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: end;
  }
  label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #334155;
  }
  select,
  input,
  button {
    width: 100%;
    border-radius: 10px;
    border: 1px solid #d1d5db;
    padding: 12px 14px;
    font-size: 1rem;
    font-family: inherit;
  }
  select:focus,
  input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
  .button-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
  button {
    cursor: pointer;
    border: none;
    background: #007bff;
    color: #ffffff;
    font-weight: 700;
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
    border: 1px solid #bfd7ff;
  }
  button.swap {
    width: 52px;
    height: 48px;
    padding: 0;
    align-self: end;
  }
  .result-box {
    background: linear-gradient(135deg, #eef6ff, #f8fbff);
    border: 1px solid #d9e8ff;
    border-radius: 12px;
    padding: 22px;
  }
  .result-label {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 8px;
  }
  .result-value {
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    color: #007bff;
    font-weight: 800;
    margin-bottom: 8px;
    word-break: break-word;
  }
  .result-meta {
    color: #475569;
    line-height: 1.6;
  }
  .helper-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .helper {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    background: #fafcff;
  }
  .helper h3 {
    margin: 0 0 8px;
    font-size: 1rem;
    color: #0f172a;
  }
  .helper p {
    margin: 0;
    color: #64748b;
    line-height: 1.5;
    font-size: 0.95rem;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #eff6ff;
    color: #0056b3;
    border: 1px solid #dbeafe;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 0.92rem;
    font-weight: 600;
    margin-bottom: 18px;
  }
  .error {
    display: none;
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #fff1f2;
    color: #b42318;
    border: 1px solid #fecdd3;
    font-weight: 600;
  }
  .hint {
    margin-top: 12px;
    color: #64748b;
    font-size: 0.95rem;
  }
  @media (max-width: 700px) {
    .grid,
    .helper-grid,
    .triple {
      grid-template-columns: 1fr;
    }
    button.swap {
      width: 100%;
      height: auto;
    }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <div class="badge">Client-side conversions only • No network calls</div>
      <h1>Universal Unit Converter</h1>
      <p>Switch between common units for length, weight, temperature, volume, area, and speed using fast browser-side calculations.</p>
    </div>

    <div class="card">
      <div class="grid">
        <div>
          <label for="category">Category</label>
          <select id="category"></select>
        </div>
        <div>
          <label for="amount">Value to convert</label>
          <input id="amount" type="number" step="any" placeholder="Enter a number" value="1">
        </div>
      </div>

      <div class="triple" style="margin-top: 16px;">
        <div>
          <label for="fromUnit">From unit</label>
          <select id="fromUnit"></select>
        </div>
        <button class="secondary swap" id="swapBtn" type="button" aria-label="Swap units">⇄</button>
        <div>
          <label for="toUnit">To unit</label>
          <select id="toUnit"></select>
        </div>
      </div>

      <div class="button-row">
        <button id="convertBtn" type="button">Convert</button>
        <button id="resetBtn" class="secondary" type="button">Reset</button>
      </div>
      <div id="errorBox" class="error"></div>
      <div class="hint" id="categoryHint">Choose a category to see the supported units.</div>
    </div>

    <div class="card result-box">
      <div class="result-label">Converted result</div>
      <div class="result-value" id="resultValue">—</div>
      <div class="result-meta" id="resultMeta">Select a category, enter a value, and click Convert.</div>
    </div>

    <div class="helper-grid">
      <div class="helper">
        <h3>Six categories</h3>
        <p>Quickly switch between metric and imperial units for everyday calculations and comparisons.</p>
      </div>
      <div class="helper">
        <h3>Temperature aware</h3>
        <p>Temperature conversions use dedicated formulas for °C, °F, and Kelvin instead of a simple ratio.</p>
      </div>
      <div class="helper">
        <h3>Readable precision</h3>
        <p>Results are rounded for clarity while preserving enough precision for practical use.</p>
      </div>
    </div>
  </div>

<script>
const categories = {
  length: {
    label: 'Length',
    hint: 'Convert distance between metric and imperial units.',
    units: [
      { id: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
      { id: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
      { id: 'm', label: 'Meter (m)', factor: 1 },
      { id: 'km', label: 'Kilometer (km)', factor: 1000 },
      { id: 'in', label: 'Inch (in)', factor: 0.0254 },
      { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
      { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
      { id: 'mi', label: 'Mile (mi)', factor: 1609.344 }
    ]
  },
  weight: {
    label: 'Weight',
    hint: 'Compare small masses, shipping weights, and larger metric loads.',
    units: [
      { id: 'mg', label: 'Milligram (mg)', factor: 0.001 },
      { id: 'g', label: 'Gram (g)', factor: 1 },
      { id: 'kg', label: 'Kilogram (kg)', factor: 1000 },
      { id: 't', label: 'Metric Ton (t)', factor: 1000000 },
      { id: 'oz', label: 'Ounce (oz)', factor: 28.349523125 },
      { id: 'lb', label: 'Pound (lb)', factor: 453.59237 }
    ]
  },
  temperature: {
    label: 'Temperature',
    hint: 'Convert between Celsius, Fahrenheit, and Kelvin using exact formulas.',
    units: [
      { id: 'c', label: 'Celsius (°C)' },
      { id: 'f', label: 'Fahrenheit (°F)' },
      { id: 'k', label: 'Kelvin (K)' }
    ]
  },
  volume: {
    label: 'Volume',
    hint: 'Useful for recipes, packaging, and liquid measurements.',
    units: [
      { id: 'ml', label: 'Milliliter (ml)', factor: 1 },
      { id: 'l', label: 'Liter (L)', factor: 1000 },
      { id: 'floz', label: 'Fluid Ounce (fl oz)', factor: 29.5735295625 },
      { id: 'cup', label: 'Cup', factor: 236.5882365 },
      { id: 'pt', label: 'Pint (pt)', factor: 473.176473 },
      { id: 'qt', label: 'Quart (qt)', factor: 946.352946 },
      { id: 'gal', label: 'Gallon (gal)', factor: 3785.411784 }
    ]
  },
  area: {
    label: 'Area',
    hint: 'Measure everything from small surfaces to property-sized land areas.',
    units: [
      { id: 'mm2', label: 'Square Millimeter (mm²)', factor: 0.000001 },
      { id: 'cm2', label: 'Square Centimeter (cm²)', factor: 0.0001 },
      { id: 'm2', label: 'Square Meter (m²)', factor: 1 },
      { id: 'km2', label: 'Square Kilometer (km²)', factor: 1000000 },
      { id: 'in2', label: 'Square Inch (in²)', factor: 0.00064516 },
      { id: 'ft2', label: 'Square Foot (ft²)', factor: 0.09290304 },
      { id: 'ac', label: 'Acre (ac)', factor: 4046.8564224 }
    ]
  },
  speed: {
    label: 'Speed',
    hint: 'Compare running pace, road speed, and nautical travel units.',
    units: [
      { id: 'ms', label: 'Meters per Second (m/s)', factor: 1 },
      { id: 'kmh', label: 'Kilometers per Hour (km/h)', factor: 0.2777777778 },
      { id: 'mph', label: 'Miles per Hour (mph)', factor: 0.44704 },
      { id: 'knot', label: 'Knot', factor: 0.5144444444 }
    ]
  }
};

const categoryEl = document.getElementById('category');
const fromEl = document.getElementById('fromUnit');
const toEl = document.getElementById('toUnit');
const amountEl = document.getElementById('amount');
const resultValueEl = document.getElementById('resultValue');
const resultMetaEl = document.getElementById('resultMeta');
const hintEl = document.getElementById('categoryHint');
const errorBoxEl = document.getElementById('errorBox');

function init() {
  Object.keys(categories).forEach(function(key) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = categories[key].label;
    categoryEl.appendChild(option);
  });
  categoryEl.value = 'length';
  populateUnits();
  convertUnits();
}

function populateUnits() {
  const currentCategory = categories[categoryEl.value];
  const previousFrom = fromEl.value;
  const previousTo = toEl.value;
  fromEl.innerHTML = '';
  toEl.innerHTML = '';

  currentCategory.units.forEach(function(unit, index) {
    const fromOption = document.createElement('option');
    fromOption.value = unit.id;
    fromOption.textContent = unit.label;
    fromEl.appendChild(fromOption);

    const toOption = document.createElement('option');
    toOption.value = unit.id;
    toOption.textContent = unit.label;
    toEl.appendChild(toOption);

    if (index === 0) {
      fromEl.value = unit.id;
    }
    if (index === 1) {
      toEl.value = unit.id;
    }
  });

  if (previousFrom && currentCategory.units.some(function(unit) { return unit.id === previousFrom; })) {
    fromEl.value = previousFrom;
  }
  if (previousTo && currentCategory.units.some(function(unit) { return unit.id === previousTo; })) {
    toEl.value = previousTo;
  }
  if (fromEl.value === toEl.value && currentCategory.units.length > 1) {
    toEl.selectedIndex = 1;
  }
  hintEl.textContent = currentCategory.hint;
  hideError();
}

function findUnit(categoryKey, unitId) {
  return categories[categoryKey].units.find(function(unit) { return unit.id === unitId; });
}

function toCelsius(value, fromUnit) {
  if (fromUnit === 'c') return value;
  if (fromUnit === 'f') return (value - 32) * 5 / 9;
  return value - 273.15;
}

function fromCelsius(value, toUnit) {
  if (toUnit === 'c') return value;
  if (toUnit === 'f') return (value * 9 / 5) + 32;
  return value + 273.15;
}

function convertValue(inputValue, categoryKey, fromUnitId, toUnitId) {
  if (categoryKey === 'temperature') {
    const celsius = toCelsius(inputValue, fromUnitId);
    return fromCelsius(celsius, toUnitId);
  }
  const fromUnit = findUnit(categoryKey, fromUnitId);
  const toUnit = findUnit(categoryKey, toUnitId);
  const baseValue = inputValue * fromUnit.factor;
  return baseValue / toUnit.factor;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '—';
  const normalized = parseFloat(Number(value).toPrecision(12));
  return normalized.toLocaleString(undefined, { maximumFractionDigits: 10 });
}

function showError(message) {
  errorBoxEl.style.display = 'block';
  errorBoxEl.textContent = message;
}

function hideError() {
  errorBoxEl.style.display = 'none';
  errorBoxEl.textContent = '';
}

function convertUnits() {
  const rawValue = amountEl.value.trim();
  if (rawValue === '') {
    showError('Enter a number to convert.');
    resultValueEl.textContent = '—';
    resultMetaEl.textContent = 'Choose a category, enter a value, and click Convert.';
    return;
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    showError('Please enter a valid numeric value.');
    return;
  }

  const categoryKey = categoryEl.value;
  const fromUnit = fromEl.value;
  const toUnit = toEl.value;
  const converted = convertValue(numericValue, categoryKey, fromUnit, toUnit);
  const fromLabel = findUnit(categoryKey, fromUnit).label;
  const toLabel = findUnit(categoryKey, toUnit).label;
  hideError();
  resultValueEl.textContent = formatNumber(converted) + ' ' + toLabel;
  resultMetaEl.textContent = formatNumber(numericValue) + ' ' + fromLabel + ' = ' + formatNumber(converted) + ' ' + toLabel + '.';
}

categoryEl.addEventListener('change', function() {
  populateUnits();
  convertUnits();
});
fromEl.addEventListener('change', convertUnits);
toEl.addEventListener('change', convertUnits);
amountEl.addEventListener('input', convertUnits);
document.getElementById('convertBtn').addEventListener('click', convertUnits);
document.getElementById('swapBtn').addEventListener('click', function() {
  const current = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value = current;
  convertUnits();
});
document.getElementById('resetBtn').addEventListener('click', function() {
  categoryEl.value = 'length';
  amountEl.value = '1';
  populateUnits();
  convertUnits();
});
amountEl.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    convertUnits();
  }
});

init();
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
