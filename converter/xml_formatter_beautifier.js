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
  <title>XML Formatter / Beautifier</title>
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
    h1 {
      margin: 0 0 10px;
      font-size: 2rem;
      color: #0f172a;
    }
    h2 {
      margin: 0 0 14px;
      font-size: 1.2rem;
      color: #0f172a;
    }
    p {
      margin: 0 0 18px;
      line-height: 1.6;
      color: #475569;
    }
    .toolbar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin: 18px 0 20px;
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
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 10px;
      color: #1e293b;
    }
    textarea {
      width: 100%;
      min-height: 220px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 14px;
      font: 0.95rem/1.5 Consolas, Monaco, monospace;
      resize: vertical;
      background: #f8fafc;
    }
    textarea:focus {
      outline: 2px solid rgba(0,123,255,.18);
      border-color: #007bff;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      font-weight: 600;
      margin-bottom: 18px;
      background: #dbeafe;
      color: #1d4ed8;
    }
    .status.error {
      background: #fee2e2;
      color: #b91c1c;
    }
    .status.success {
      background: #dcfce7;
      color: #15803d;
    }
    .preview {
      margin-top: 16px;
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      min-height: 180px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font: 0.92rem/1.6 Consolas, Monaco, monospace;
    }
    .tips {
      margin: 0;
      padding-left: 20px;
      color: #475569;
      line-height: 1.7;
    }
    .tips li + li { margin-top: 8px; }
    @media (min-width: 860px) {
      .grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>XML Formatter / Beautifier</h1>
      <p>Beautify, minify, and validate XML directly in your browser. The worker only serves this page — all XML parsing and formatting runs locally in client-side JavaScript.</p>
      <div id="status" class="status">Ready to format XML</div>
      <div class="toolbar">
        <button id="formatBtn">Format / Beautify</button>
        <button id="minifyBtn">Minify</button>
        <button id="validateBtn">Validate</button>
        <button id="sampleBtn" class="secondary">Load Sample</button>
      </div>
      <div class="grid">
        <div>
          <label for="xmlInput">Input XML</label>
          <textarea id="xmlInput" spellcheck="false" placeholder="Paste XML here..."></textarea>
        </div>
        <div>
          <label for="xmlOutput">Output XML</label>
          <textarea id="xmlOutput" spellcheck="false" readonly placeholder="Formatted or minified XML will appear here..."></textarea>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Formatted Preview</h2>
      <p>A styled preview of the processed XML output for quick scanning.</p>
      <pre id="xmlPreview" class="preview">Output will appear here.</pre>
    </div>

    <div class="card">
      <h2>Parser notes</h2>
      <ul class="tips">
        <li>Uses a lightweight tag-by-tag XML tokenizer with stack-based validation for matching tags.</li>
        <li>Handles opening tags, closing tags, self-closing tags, comments, CDATA sections, and XML declarations.</li>
        <li>Reports malformed XML when tags do not match, a section is left unclosed, or stray text appears outside the root element.</li>
      </ul>
    </div>
  </div>

  <script>
    const sampleXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<catalog>',
      '  <book id="bk101">',
      '    <title>XML Developer Guide</title>',
      '    <genre>Computer</genre>',
      '    <price currency="USD">44.95</price>',
      '    <!-- Bestseller -->',
      '    <notes><![CDATA[Use <angle brackets> safely here.]]></notes>',
      '  </book>',
      '  <book id="bk102" available="true"/>',
      '</catalog>'
    ].join('\n');

    const xmlInput = document.getElementById('xmlInput');
    const xmlOutput = document.getElementById('xmlOutput');
    const xmlPreview = document.getElementById('xmlPreview');
    const statusEl = document.getElementById('status');

    document.getElementById('formatBtn').addEventListener('click', () => runAction('format'));
    document.getElementById('minifyBtn').addEventListener('click', () => runAction('minify'));
    document.getElementById('validateBtn').addEventListener('click', () => runAction('validate'));
    document.getElementById('sampleBtn').addEventListener('click', loadSample);

    function loadSample() {
      xmlInput.value = sampleXml;
      runAction('format');
    }

    function setStatus(message, type) {
      statusEl.textContent = message;
      statusEl.className = 'status' + (type ? ' ' + type : '');
    }

    function setOutput(value) {
      xmlOutput.value = value;
      xmlPreview.textContent = value || 'Output will appear here.';
    }

    function runAction(action) {
      const source = xmlInput.value.trim();
      if (!source) {
        setOutput('');
        setStatus('Paste XML into the input area to begin.', 'error');
        return;
      }

      try {
        const tokens = validateAndTokenize(source);
        if (action === 'format') {
          const formatted = formatTokens(tokens);
          setOutput(formatted);
          setStatus('XML formatted successfully with 2-space indentation.', 'success');
        } else if (action === 'minify') {
          const minified = minifyTokens(tokens);
          setOutput(minified);
          setStatus('XML minified by removing unnecessary whitespace between tags.', 'success');
        } else {
          setOutput(source);
          setStatus('XML is well-formed.', 'success');
        }
      } catch (error) {
        setOutput('');
        setStatus(error.message, 'error');
      }
    }

    function validateAndTokenize(xml) {
      const tokens = tokenizeXml(xml);
      validateStructure(tokens);
      return tokens;
    }

    function tokenizeXml(xml) {
      const tokens = [];
      let index = 0;

      while (index < xml.length) {
        if (xml[index] === '<') {
          if (xml.startsWith('<!--', index)) {
            const end = xml.indexOf('-->', index + 4);
            if (end === -1) throw new Error('Malformed XML: comment is not closed.');
            tokens.push({ type: 'comment', raw: xml.slice(index, end + 3) });
            index = end + 3;
            continue;
          }

          if (xml.startsWith('<![CDATA[', index)) {
            const end = xml.indexOf(']]>', index + 9);
            if (end === -1) throw new Error('Malformed XML: CDATA section is not closed.');
            tokens.push({ type: 'cdata', raw: xml.slice(index, end + 3) });
            index = end + 3;
            continue;
          }

          if (xml.startsWith('<?', index)) {
            const end = xml.indexOf('?>', index + 2);
            if (end === -1) throw new Error('Malformed XML: processing instruction is not closed.');
            tokens.push({ type: 'pi', raw: xml.slice(index, end + 2) });
            index = end + 2;
            continue;
          }

          if (xml.startsWith('</', index)) {
            const end = findTagEnd(xml, index);
            const raw = xml.slice(index, end + 1);
            const match = raw.match(/^<\s*\/\s*([A-Za-z_][\w:.-]*)\s*>$/);
            if (!match) throw new Error('Malformed XML: invalid closing tag near ' + raw);
            tokens.push({ type: 'close', name: match[1], raw: raw });
            index = end + 1;
            continue;
          }

          if (xml.startsWith('<!', index)) {
            const end = findDeclarationEnd(xml, index);
            tokens.push({ type: 'declaration', raw: xml.slice(index, end + 1) });
            index = end + 1;
            continue;
          }

          const end = findTagEnd(xml, index);
          const raw = xml.slice(index, end + 1);
          const match = raw.match(/^<\s*([A-Za-z_][\w:.-]*)\b/);
          if (!match) throw new Error('Malformed XML: invalid opening tag near ' + raw);
          const selfClosing = /\/\s*>$/.test(raw);
          tokens.push({ type: selfClosing ? 'self' : 'open', name: match[1], raw: raw });
          index = end + 1;
        } else {
          const nextTag = xml.indexOf('<', index);
          const end = nextTag === -1 ? xml.length : nextTag;
          tokens.push({ type: 'text', raw: xml.slice(index, end) });
          index = end;
        }
      }

      return tokens;
    }

    function findTagEnd(xml, startIndex) {
      let quote = null;
      for (let i = startIndex + 1; i < xml.length; i++) {
        const char = xml[i];
        if (quote) {
          if (char === quote) quote = null;
          continue;
        }
        if (char === '"' || char === "'") {
          quote = char;
          continue;
        }
        if (char === '>') return i;
      }
      throw new Error('Malformed XML: tag is not closed.');
    }

    function findDeclarationEnd(xml, startIndex) {
      let quote = null;
      let bracketDepth = 0;
      for (let i = startIndex + 2; i < xml.length; i++) {
        const char = xml[i];
        if (quote) {
          if (char === quote) quote = null;
          continue;
        }
        if (char === '"' || char === "'") {
          quote = char;
          continue;
        }
        if (char === '[') {
          bracketDepth += 1;
          continue;
        }
        if (char === ']' && bracketDepth > 0) {
          bracketDepth -= 1;
          continue;
        }
        if (char === '>' && bracketDepth === 0) return i;
      }
      throw new Error('Malformed XML: declaration is not closed.');
    }

    function validateStructure(tokens) {
      const stack = [];
      let sawRoot = false;

      for (const token of tokens) {
        if (token.type === 'text') {
          if (stack.length === 0 && token.raw.trim()) {
            throw new Error('Malformed XML: text content appears outside the root element.');
          }
          continue;
        }

        if (token.type === 'open') {
          if (stack.length === 0) {
            if (sawRoot) throw new Error('Malformed XML: multiple root elements found.');
            sawRoot = true;
          }
          stack.push(token.name);
          continue;
        }

        if (token.type === 'self') {
          if (stack.length === 0) {
            if (sawRoot) throw new Error('Malformed XML: multiple root elements found.');
            sawRoot = true;
          }
          continue;
        }

        if (token.type === 'close') {
          const expected = stack.pop();
          if (!expected) {
            throw new Error('Malformed XML: unexpected closing tag </' + token.name + '>.');
          }
          if (expected !== token.name) {
            throw new Error('Malformed XML: expected </' + expected + '> but found </' + token.name + '>.');
          }
        }
      }

      if (stack.length) {
        throw new Error('Malformed XML: unclosed tag <' + stack[stack.length - 1] + '>.');
      }
      if (!sawRoot) {
        throw new Error('Malformed XML: no root element found.');
      }
    }

    function formatTokens(tokens) {
      const lines = [];
      let indent = 0;

      for (const token of tokens) {
        if (token.type === 'text') {
          const normalized = token.raw.replace(/\s+/g, ' ').trim();
          if (normalized) {
            lines.push('  '.repeat(indent) + normalized);
          }
          continue;
        }

        if (token.type === 'close') {
          indent = Math.max(indent - 1, 0);
          lines.push('  '.repeat(indent) + token.raw.trim());
          continue;
        }

        lines.push('  '.repeat(indent) + token.raw.trim());
        if (token.type === 'open') {
          indent += 1;
        }
      }

      return lines.join('\n');
    }

    function minifyTokens(tokens) {
      return tokens
        .map(token => {
          if (token.type === 'text') {
            return token.raw.trim() ? token.raw : '';
          }
          return token.raw.trim();
        })
        .filter(Boolean)
        .join('');
    }

    loadSample();
  </script>
</body>
</html>`;
  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
