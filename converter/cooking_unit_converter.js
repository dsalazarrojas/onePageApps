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
  <title>Cooking Unit Converter</title>
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
      margin: 0 0 12px;
    }
    .subtitle {
      margin: 0 0 22px;
      color: #4b5563;
      line-height: 1.6;
    }
    .tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 22px;
    }
    .tab {
      background: #e9f2ff;
      color: #007bff;
      border: 1px solid #cfe2ff;
      padding: 10px 16px;
      border-radius: 999px;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s ease;
    }
    .tab.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }
    .grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 16px;
      align-items: end;
      margin-bottom: 18px;
    }
    .field label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }
    input, select {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      background: white;
      color: #111827;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.15);
    }
    .button-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 18px;
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
    .result-box {
      background: linear-gradient(135deg, #eef6ff, #f9fcff);
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 22px;
    }
    .result-label {
      display: block;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .result-value {
      font-size: 32px;
      font-weight: 800;
      color: #007bff;
      margin-bottom: 8px;
      word-break: break-word;
    }
    .result-detail {
      color: #4b5563;
      line-height: 1.5;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }
    .chip {
      padding: 10px 14px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #374151;
      font-size: 14px;
      border: 1px solid #e5e7eb;
    }
    .note {
      color: #6b7280;
      font-size: 14px;
      margin-top: 8px;
    }
    @media (max-width: 760px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .container {
        padding: 14px;
      }
      .card {
        padding: 22px;
      }
      .result-value {
        font-size: 26px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Cooking Unit Converter</h1>
      <p class="subtitle">Convert kitchen volume, weight, and temperature values instantly. Switch categories, pick your units, and keep quick-reference kitchen ratios close at hand.</p>
      <div class="tabs" id="categoryTabs">
        <button class="tab active" data-category="volume">Volume</button>
        <button class="tab" data-category="weight">Weight</button>
        <button class="tab" data-category="temperature">Temperature</button>
      </div>

      <div class="grid">
        <div class="field">
          <label for="amount">Amount</label>
          <input id="amount" type="number" step="any" value="1" placeholder="Enter an amount">
        </div>
        <div class="field">
          <label for="fromUnit">From</label>
          <select id="fromUnit"></select>
        </div>
        <div class="field">
          <label for="toUnit">To</label>
          <select id="toUnit"></select>
        </div>
      </div>

      <div class="button-row">
        <button id="convertButton">Convert</button>
        <button id="swapButton">Swap Units</button>
      </div>

      <div class="result-box">
        <span class="result-label">Converted result</span>
        <div class="result-value" id="resultValue">1 cup = 16 Tablespoon (tbsp)</div>
        <div class="result-detail" id="resultDetail">Use the converter for recipe scaling, ingredient swaps, and oven temperature checks.</div>
      </div>

      <h2>Quick-reference kitchen conversions</h2>
      <div class="chips" id="referenceChips"></div>
      <p class="note" id="categoryNote">Volume conversions use metric milliliters as the shared base for accurate kitchen math.</p>
    </div>
  </div>

  <script>
    var categories = {
      volume: {
        note: 'Volume conversions use metric milliliters as the shared base for accurate kitchen math.',
        units: [
          { value: 'tsp', label: 'Teaspoon (tsp)' },
          { value: 'tbsp', label: 'Tablespoon (tbsp)' },
          { value: 'floz', label: 'Fluid Ounce (fl oz)' },
          { value: 'cup', label: 'Cup' },
          { value: 'pt', label: 'Pint (pt)' },
          { value: 'qt', label: 'Quart (qt)' },
          { value: 'gal', label: 'Gallon (gal)' },
          { value: 'ml', label: 'Milliliter (ml)' },
          { value: 'l', label: 'Liter (L)' }
        ],
        factors: {
          tsp: 4.92892159375,
          tbsp: 14.78676478125,
          floz: 29.5735295625,
          cup: 236.5882365,
          pt: 473.176473,
          qt: 946.352946,
          gal: 3785.411784,
          ml: 1,
          l: 1000
        },
        defaults: { from: 'cup', to: 'tbsp' },
        chips: ['1 cup = 16 tbsp', '1 tbsp = 3 tsp', '1 fl oz = 2 tbsp', '1 pt = 2 cups', '1 qt = 4 cups']
      },
      weight: {
        note: 'Weight conversions use grams as the base. Ingredient density still matters when changing between weight and volume.',
        units: [
          { value: 'g', label: 'Gram (g)' },
          { value: 'kg', label: 'Kilogram (kg)' },
          { value: 'oz', label: 'Ounce (oz)' },
          { value: 'lb', label: 'Pound (lb)' }
        ],
        factors: {
          g: 1,
          kg: 1000,
          oz: 28.349523125,
          lb: 453.59237
        },
        defaults: { from: 'g', to: 'oz' },
        chips: ['1 kg = 1000 g', '1 lb = 16 oz', '1 oz ≈ 28.35 g', '500 g ≈ 1.10 lb', '250 g ≈ 8.82 oz']
      },
      temperature: {
        note: 'Temperature conversion uses exact formula rules instead of base factors, which is handy for oven and candy-making ranges.',
        units: [
          { value: 'c', label: 'Celsius (°C)' },
          { value: 'f', label: 'Fahrenheit (°F)' }
        ],
        defaults: { from: 'c', to: 'f' },
        chips: ['0°C = 32°F', '180°C = 356°F', '200°C = 392°F', '350°F = 176.7°C', '425°F = 218.3°C']
      }
    };

    var activeCategory = 'volume';
    var amountInput = document.getElementById('amount');
    var fromUnit = document.getElementById('fromUnit');
    var toUnit = document.getElementById('toUnit');
    var resultValue = document.getElementById('resultValue');
    var resultDetail = document.getElementById('resultDetail');
    var referenceChips = document.getElementById('referenceChips');
    var categoryNote = document.getElementById('categoryNote');

    function formatNumber(value) {
      if (!isFinite(value)) {
        return '—';
      }
      var absValue = Math.abs(value);
      var precision = absValue >= 100 ? 2 : absValue >= 1 ? 4 : 6;
      return Number(value.toFixed(precision)).toLocaleString('en-US', { maximumFractionDigits: precision });
    }

    function getUnitLabel(category, unitValue) {
      var list = categories[category].units;
      for (var i = 0; i < list.length; i += 1) {
        if (list[i].value === unitValue) {
          return list[i].label;
        }
      }
      return unitValue;
    }

    function populateUnits() {
      var category = categories[activeCategory];
      fromUnit.innerHTML = '';
      toUnit.innerHTML = '';
      category.units.forEach(function(unit) {
        var fromOption = document.createElement('option');
        fromOption.value = unit.value;
        fromOption.textContent = unit.label;
        fromUnit.appendChild(fromOption);

        var toOption = document.createElement('option');
        toOption.value = unit.value;
        toOption.textContent = unit.label;
        toUnit.appendChild(toOption);
      });
      fromUnit.value = category.defaults.from;
      toUnit.value = category.defaults.to;
      categoryNote.textContent = category.note;
      renderChips();
    }

    function renderChips() {
      referenceChips.innerHTML = '';
      categories[activeCategory].chips.forEach(function(chipText) {
        var chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = chipText;
        referenceChips.appendChild(chip);
      });
    }

    function convertTemperature(amount, from, to) {
      if (from === to) {
        return amount;
      }
      if (from === 'c' && to === 'f') {
        return (amount * 9 / 5) + 32;
      }
      return (amount - 32) * 5 / 9;
    }

    function convertUnits() {
      var amount = parseFloat(amountInput.value);
      if (!isFinite(amount)) {
        resultValue.textContent = 'Enter a valid amount';
        resultDetail.textContent = 'Use any whole number or decimal value before converting.';
        return;
      }

      var from = fromUnit.value;
      var to = toUnit.value;
      var converted;

      if (activeCategory === 'temperature') {
        converted = convertTemperature(amount, from, to);
      } else {
        var factors = categories[activeCategory].factors;
        converted = amount * factors[from] / factors[to];
      }

      var fromLabel = getUnitLabel(activeCategory, from);
      var toLabel = getUnitLabel(activeCategory, to);
      resultValue.textContent = formatNumber(amount) + ' ' + fromLabel + ' = ' + formatNumber(converted) + ' ' + toLabel;
      resultDetail.textContent = 'Converted using the ' + activeCategory + ' category. Great for recipe scaling, prep planning, and fast kitchen checks.';
    }

    function setCategory(nextCategory) {
      activeCategory = nextCategory;
      var tabs = document.querySelectorAll('.tab');
      tabs.forEach(function(tab) {
        tab.classList.toggle('active', tab.getAttribute('data-category') === nextCategory);
      });
      populateUnits();
      convertUnits();
    }

    document.getElementById('categoryTabs').addEventListener('click', function(event) {
      if (event.target.classList.contains('tab')) {
        setCategory(event.target.getAttribute('data-category'));
      }
    });

    document.getElementById('convertButton').addEventListener('click', convertUnits);

    document.getElementById('swapButton').addEventListener('click', function() {
      var currentFrom = fromUnit.value;
      fromUnit.value = toUnit.value;
      toUnit.value = currentFrom;
      convertUnits();
    });

    [amountInput, fromUnit, toUnit].forEach(function(element) {
      element.addEventListener('input', convertUnits);
      element.addEventListener('change', convertUnits);
    });

    populateUnits();
    convertUnits();
  </script>
</body>
</html>`;

  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
