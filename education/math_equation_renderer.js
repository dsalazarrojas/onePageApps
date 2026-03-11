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
    frame.title='Math Equation Renderer';
    frame.style.cssText='width:' + ((s&&s.dataset.width)||'100%') + ';height:' + ((s&&s.dataset.height)||'720px') + ';border:0;border-radius:18px;overflow:hidden;background:#fff;';
    (s&&s.parentNode||document.body).insertBefore(frame, s ? s.nextSibling : null);
  })();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Math Equation Renderer</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1120px; margin: 0 auto; padding: 32px 18px 48px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 24px; max-width: 760px; color: #475569; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; align-items: start; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  .actions, .examples { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 14px; }
  .examples button { padding: 8px 12px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; }
  .preview { min-height: 220px; display: grid; place-items: center; border: 1px solid #dbe3f0; border-radius: 16px; background: linear-gradient(180deg, #ffffff, #f8fbff); padding: 18px; overflow: auto; }
  math { font-size: clamp(1.6rem, 4vw, 2.5rem); }
  pre { margin: 0; padding: 16px; white-space: pre-wrap; background: #0f172a; color: #e2e8f0; border-radius: 14px; overflow: auto; }
  .error { display: none; margin-top: 12px; padding: 12px 14px; border-radius: 12px; background: #fff1f2; border: 1px solid #fecdd3; color: #b42318; }
  .muted { color: #64748b; line-height: 1.6; font-size: 0.95rem; }
  @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="page">
  <div class="hero">
    <h1>Math Equation Renderer</h1>
    <p>Render math expressions as clean MathML directly in the browser. Supports equations, fractions, powers, square roots, trigonometric functions, and simple subscripts.</p>
  </div>
  <div class="grid">
    <div class="card">
      <label for="expression">Expression</label>
      <input id="expression" value="frac(a^2 + b^2, c) = sqrt(x_1^2 + y_1^2)">
      <div class="examples">
        <button type="button" data-expression="frac(a+b, c)">Fraction</button>
        <button type="button" data-expression="sqrt(x^2 + y^2) = r">Square root</button>
        <button type="button" data-expression="sin(theta) = opposite / hypotenuse">Trig</button>
      </div>
      <div class="actions">
        <button class="primary" id="renderBtn" type="button">Render equation</button>
        <button class="secondary" id="copyBtn" type="button">Copy MathML</button>
      </div>
      <div class="muted" style="margin-top:14px;">Use <code>frac(a,b)</code> for stacked fractions, <code>^</code> for exponents, and underscores for subscripts like <code>x_1</code>.</div>
      <div class="error" id="errorBox"></div>
    </div>
    <div style="display:grid;gap:14px;">
      <div class="card">
        <label>Rendered preview</label>
        <div class="preview" id="preview"></div>
      </div>
      <div class="card">
        <label>MathML output</label>
        <pre id="output"></pre>
      </div>
    </div>
  </div>
</div>
<script>
(function() {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function tokenize(expression) {
    const regex = /\s*([A-Za-z_]\w*|\d+(?:\.\d+)?|\.\d+|[()+\-*/^,=])\s*/g;
    const tokens = [];
    let consumed = '';
    let match;
    while ((match = regex.exec(expression))) {
      tokens.push(match[1]);
      consumed += match[0];
    }
    if (consumed.replace(/\s+/g, '') !== expression.replace(/\s+/g, '')) throw new Error('Unsupported character found.');
    return tokens;
  }

  function parseExpression(tokens) {
    let index = 0;
    function peek() { return tokens[index]; }
    function take(expected) {
      const current = tokens[index];
      if (expected && current !== expected) throw new Error('Expected "' + expected + '" but found "' + current + '".');
      index += 1;
      return current;
    }
    function parsePrimary() {
      const token = peek();
      if (token === '(') {
        take('(');
        const expr = parseEquality();
        take(')');
        return expr;
      }
      if (token === '-') {
        take('-');
        return { type: 'unary', op: '-', value: parsePrimary() };
      }
      if (/^\d/.test(token)) {
        take();
        return { type: 'number', value: token };
      }
      if (/^[A-Za-z_]\w*$/.test(token)) {
        const name = take();
        if (peek() === '(') {
          take('(');
          const args = [];
          if (peek() !== ')') {
            do {
              args.push(parseEquality());
              if (peek() !== ',') break;
              take(',');
            } while (peek());
          }
          take(')');
          return { type: 'call', name, args };
        }
        return { type: 'identifier', name };
      }
      throw new Error('Unexpected token "' + token + '".');
    }
    function parsePower() {
      let node = parsePrimary();
      while (peek() === '^') {
        take('^');
        node = { type: 'binary', op: '^', left: node, right: parsePrimary() };
      }
      return node;
    }
    function parseTerm() {
      let node = parsePower();
      while (peek() === '*' || peek() === '/') {
        const op = take();
        node = { type: 'binary', op, left: node, right: parsePower() };
      }
      return node;
    }
    function parseAdditive() {
      let node = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = take();
        node = { type: 'binary', op, left: node, right: parseTerm() };
      }
      return node;
    }
    function parseEquality() {
      let node = parseAdditive();
      while (peek() === '=') {
        take('=');
        node = { type: 'binary', op: '=', left: node, right: parseAdditive() };
      }
      return node;
    }
    const ast = parseEquality();
    if (index !== tokens.length) throw new Error('Could not parse the full expression.');
    return ast;
  }

  function renderIdentifier(name) {
    if (name.includes('_')) {
      const parts = name.split('_');
      return '<msub><mi>' + escapeHtml(parts[0]) + '</mi><mn>' + escapeHtml(parts.slice(1).join('_')) + '</mn></msub>';
    }
    return '<mi>' + escapeHtml(name) + '</mi>';
  }

  function astToMathML(node) {
    if (!node) return '<mi>?</mi>';
    if (node.type === 'number') return '<mn>' + escapeHtml(node.value) + '</mn>';
    if (node.type === 'identifier') return renderIdentifier(node.name);
    if (node.type === 'unary') return '<mrow><mo>-</mo>' + astToMathML(node.value) + '</mrow>';
    if (node.type === 'call') {
      if (node.name === 'frac' && node.args.length === 2) return '<mfrac>' + astToMathML(node.args[0]) + astToMathML(node.args[1]) + '</mfrac>';
      if (node.name === 'sqrt' && node.args.length === 1) return '<msqrt>' + astToMathML(node.args[0]) + '</msqrt>';
      if (node.name === 'abs' && node.args.length === 1) return '<mrow><mo>|</mo>' + astToMathML(node.args[0]) + '<mo>|</mo></mrow>';
      return '<mrow><mi>' + escapeHtml(node.name) + '</mi><mo>(</mo>' + node.args.map(astToMathML).join('<mo>,</mo>') + '<mo>)</mo></mrow>';
    }
    if (node.type === 'binary') {
      if (node.op === '/') return '<mfrac>' + astToMathML(node.left) + astToMathML(node.right) + '</mfrac>';
      if (node.op === '^') return '<msup>' + astToMathML(node.left) + astToMathML(node.right) + '</msup>';
      const op = node.op === '*' ? '×' : node.op;
      return '<mrow>' + astToMathML(node.left) + '<mo>' + escapeHtml(op) + '</mo>' + astToMathML(node.right) + '</mrow>';
    }
    return '<mi>?</mi>';
  }

  function render() {
    try {
      const expression = document.getElementById('expression').value.trim();
      const tokens = tokenize(expression);
      const ast = parseExpression(tokens);
      const mathml = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' + astToMathML(ast) + '</math>';
      document.getElementById('preview').innerHTML = mathml;
      document.getElementById('output').textContent = mathml;
      document.getElementById('errorBox').style.display = 'none';
    } catch (error) {
      document.getElementById('preview').innerHTML = '';
      document.getElementById('output').textContent = '';
      const box = document.getElementById('errorBox');
      box.style.display = 'block';
      box.textContent = error.message;
    }
  }

  document.getElementById('renderBtn').addEventListener('click', render);
  document.getElementById('copyBtn').addEventListener('click', function() {
    const output = document.getElementById('output').textContent;
    if (navigator.clipboard && output) navigator.clipboard.writeText(output);
  });
  document.querySelectorAll('[data-expression]').forEach(function(button) {
    button.addEventListener('click', function() {
      document.getElementById('expression').value = button.dataset.expression;
      render();
    });
  });
  render();
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
