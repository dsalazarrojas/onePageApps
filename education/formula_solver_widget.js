addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() } });
  if (url.pathname === '/widget.js') return new Response(widgetJS(), { headers: jsHeaders() });
  return new Response(pageHTML(), { headers: htmlHeaders() });
}

function widgetJS() {
  return `(function(){
    var s=document.currentScript;
    var base=(s&&s.src||'').replace(/\\/widget\\.js.*$/,'');
    var frame=document.createElement('iframe');
    frame.src=base+'/';
    frame.loading='lazy';
    frame.title='Formula Solver Widget';
    frame.style.cssText='width:' + ((s&&s.dataset.width)||'100%') + ';height:' + ((s&&s.dataset.height)||'760px') + ';border:0;border-radius:18px;overflow:hidden;background:#fff;';
    (s&&s.parentNode||document.body).insertBefore(frame, s ? s.nextSibling : null);
  })();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Formula Solver Widget</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1120px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; max-width: 780px; color: #475569; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; align-items: start; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input, select { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  .stack { display: grid; gap: 14px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .examples { display: flex; gap: 8px; flex-wrap: wrap; }
  .examples button { padding: 8px 12px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; }
  .result { display: none; padding: 18px; border-radius: 16px; background: linear-gradient(135deg, #eff6ff, #f5f3ff); border: 1px solid #dbeafe; }
  .result-value { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; color: #2563eb; }
  .muted { color: #64748b; line-height: 1.6; font-size: 0.95rem; }
  .error { display: none; padding: 12px 14px; border-radius: 12px; background: #fff1f2; border: 1px solid #fecdd3; color: #b42318; }
  .tokens { display: flex; gap: 8px; flex-wrap: wrap; }
  .token { padding: 8px 10px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-weight: 700; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page">
  <div class="hero">
    <h1>Formula Solver Widget</h1>
    <p>Enter an equation, choose the variable to solve for, and provide the remaining values. The solver performs safe client-side evaluation and numerical root-finding for many common algebraic formulas.</p>
  </div>
  <div class="grid">
    <div class="card stack">
      <div>
        <label for="equation">Equation</label>
        <input id="equation" value="distance = speed * time">
      </div>
      <div class="row">
        <div>
          <label for="target">Solve for</label>
          <select id="target"></select>
        </div>
        <div>
          <label>Detected variables</label>
          <div class="tokens" id="varTokens"></div>
        </div>
      </div>
      <div id="knowns" class="stack"></div>
      <div class="examples">
        <button type="button" data-equation="distance = speed * time">Distance</button>
        <button type="button" data-equation="pressure * volume = n * 8.314 * temperature">Gas law</button>
        <button type="button" data-equation="payment = principal * rate / (1 - (1 + rate)^(-periods))">Loan payment</button>
      </div>
      <div class="actions">
        <button class="primary" id="solveBtn" type="button">Solve equation</button>
      </div>
      <div class="muted">Supported functions: <code>sqrt</code>, <code>sin</code>, <code>cos</code>, <code>tan</code>, <code>log</code>, <code>ln</code>, <code>abs</code>, <code>pow</code>. Constants: <code>pi</code>, <code>e</code>.</div>
      <div class="error" id="errorBox"></div>
    </div>
    <div class="stack">
      <div class="card result" id="resultBox">
        <div class="muted">Solved value</div>
        <div class="result-value" id="resultValue">—</div>
        <div class="muted" id="resultMeta"></div>
      </div>
      <div class="card">
        <h3 style="margin-top:0;">How it works</h3>
        <p class="muted">The widget converts your equation into a safe token stream, evaluates both sides numerically, and searches for a root where left side minus right side becomes zero.</p>
      </div>
    </div>
  </div>
</div>
<script>
(function() {
  const allowedFunctions = {
    sqrt: Math.sqrt,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log10 ? Math.log10.bind(Math) : function(value) { return Math.log(value) / Math.LN10; },
    ln: Math.log,
    abs: Math.abs,
    pow: Math.pow
  };
  const constants = { pi: Math.PI, e: Math.E };

  function tokenize(expression) {
    const tokens = [];
    const regex = /\s*([A-Za-z_]\w*|\d+(?:\.\d+)?|\.\d+|[()+\-*/^,=])\s*/g;
    let match;
    let consumed = '';
    while ((match = regex.exec(expression))) {
      tokens.push(match[1]);
      consumed += match[0];
    }
    if (consumed.replace(/\s+/g, '') !== expression.replace(/\s+/g, '')) {
      throw new Error('The equation contains unsupported characters.');
    }
    return tokens;
  }

  function identifiersFromEquation(equation) {
    const found = tokenize(equation).filter(function(token) {
      return /^[A-Za-z_]\w*$/.test(token) && !allowedFunctions[token] && !constants[token];
    });
    return Array.from(new Set(found));
  }

  function compileExpression(expression) {
    const tokens = tokenize(expression);
    const js = tokens.map(function(token) {
      if (/^\d/.test(token) || token === '.0') return token;
      if (token === '^') return '**';
      if (/^[()+\-*/,]$/.test(token)) return token;
      if (allowedFunctions[token]) return 'F.' + token;
      if (constants[token]) return 'C.' + token;
      if (/^[A-Za-z_]\w*$/.test(token)) return '(V["' + token + '"])';
      throw new Error('Unsupported token: ' + token);
    }).join('');
    return new Function('V', 'F', 'C', 'return ' + js + ';');
  }

  function compileEquation(equation) {
    const parts = equation.split('=');
    if (parts.length !== 2) throw new Error('Use exactly one equals sign.');
    const left = compileExpression(parts[0]);
    const right = compileExpression(parts[1]);
    return function(scope) {
      return left(scope, allowedFunctions, constants) - right(scope, allowedFunctions, constants);
    };
  }

  function formatNumber(value) {
    if (!isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs && (abs >= 1e6 || abs < 1e-5)) return value.toExponential(6);
    return Number(value.toFixed(8)).toString();
  }

  function solveNumerically(fn, target, values) {
    function evaluate(x) {
      return fn(Object.assign({}, values, { [target]: x }));
    }
    const points = [-1e6, -1e5, -1e4, -1e3, -1e2, -10, -1, -0.1, 0, 0.1, 1, 10, 1e2, 1e3, 1e4, 1e5, 1e6];
    let prevX = points[0];
    let prevY = evaluate(prevX);
    if (isFinite(prevY) && Math.abs(prevY) < 1e-9) return prevX;
    for (let i = 1; i < points.length; i += 1) {
      const x = points[i];
      const y = evaluate(x);
      if (!isFinite(y)) { prevX = x; prevY = y; continue; }
      if (Math.abs(y) < 1e-9) return x;
      if (isFinite(prevY) && prevY * y < 0) {
        let left = prevX;
        let right = x;
        let leftY = prevY;
        for (let step = 0; step < 80; step += 1) {
          const mid = (left + right) / 2;
          const midY = evaluate(mid);
          if (!isFinite(midY)) break;
          if (Math.abs(midY) < 1e-10) return mid;
          if (leftY * midY <= 0) {
            right = mid;
          } else {
            left = mid;
            leftY = midY;
          }
        }
        return (left + right) / 2;
      }
      prevX = x;
      prevY = y;
    }
    const guesses = [0, 1, -1, 10, -10, 100, -100];
    for (let i = 0; i < guesses.length; i += 1) {
      let current = guesses[i];
      for (let step = 0; step < 25; step += 1) {
        const y = evaluate(current);
        const derivative = (evaluate(current + 1e-6) - y) / 1e-6;
        if (!isFinite(y) || !isFinite(derivative) || Math.abs(derivative) < 1e-12) break;
        const next = current - y / derivative;
        if (!isFinite(next)) break;
        if (Math.abs(next - current) < 1e-10 && Math.abs(y) < 1e-8) return next;
        current = next;
      }
      const residual = evaluate(current);
      if (isFinite(residual) && Math.abs(residual) < 1e-6) return current;
    }
    throw new Error('No stable numeric solution was found for the selected variable.');
  }

  function showError(message) {
    const box = document.getElementById('errorBox');
    box.style.display = message ? 'block' : 'none';
    box.textContent = message || '';
  }

  function syncVariableInputs() {
    const equation = document.getElementById('equation').value.trim();
    const variables = identifiersFromEquation(equation);
    const target = document.getElementById('target');
    target.innerHTML = variables.map(function(name) { return '<option value="' + name + '">' + name + '</option>'; }).join('');
    document.getElementById('varTokens').innerHTML = variables.map(function(name) { return '<div class="token">' + name + '</div>'; }).join('');
    const knowns = variables.filter(function(name) { return name !== target.value; });
    const container = document.getElementById('knowns');
    function draw() {
      const selected = target.value;
      container.innerHTML = variables.filter(function(name) { return name !== selected; }).map(function(name) {
        return '<div><label for="var_' + name + '">' + name + '</label><input id="var_' + name + '" type="number" step="any" placeholder="Enter ' + name + '"></div>';
      }).join('');
    }
    target.onchange = draw;
    draw();
  }

  function solve() {
    try {
      showError('');
      const equation = document.getElementById('equation').value.trim();
      const variables = identifiersFromEquation(equation);
      if (!variables.length) throw new Error('Add at least one variable to solve.');
      const target = document.getElementById('target').value;
      const knownValues = {};
      variables.forEach(function(name) {
        if (name === target) return;
        const raw = document.getElementById('var_' + name).value;
        const value = parseFloat(raw);
        if (!isFinite(value)) throw new Error('Enter a numeric value for ' + name + '.');
        knownValues[name] = value;
      });
      const compiled = compileEquation(equation);
      const solution = solveNumerically(compiled, target, knownValues);
      const residual = compiled(Object.assign({}, knownValues, { [target]: solution }));
      document.getElementById('resultBox').style.display = 'block';
      document.getElementById('resultValue').textContent = target + ' = ' + formatNumber(solution);
      document.getElementById('resultMeta').textContent = 'Residual: ' + formatNumber(residual) + ' • Equation: ' + equation;
    } catch (error) {
      document.getElementById('resultBox').style.display = 'none';
      showError(error.message);
    }
  }

  document.querySelectorAll('[data-equation]').forEach(function(button) {
    button.addEventListener('click', function() {
      document.getElementById('equation').value = button.dataset.equation;
      syncVariableInputs();
      showError('');
    });
  });
  document.getElementById('equation').addEventListener('input', function() {
    try {
      syncVariableInputs();
      showError('');
    } catch (error) {
      showError(error.message);
    }
  });
  document.getElementById('solveBtn').addEventListener('click', solve);
  syncVariableInputs();
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
