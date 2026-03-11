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
  <title>Live Regex Tester</title>
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
    h1, h2, h3 {
      margin-top: 0;
    }
    .subtitle {
      margin: 0 0 22px;
      color: #4b5563;
      line-height: 1.6;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }
    input[type="text"], textarea {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      background: white;
      color: #111827;
    }
    input[type="text"]:focus, textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.15);
    }
    textarea {
      min-height: 180px;
      resize: vertical;
      line-height: 1.5;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 18px;
      margin-bottom: 18px;
    }
    .flags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      padding-top: 30px;
    }
    .flag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 14px;
    }
    .error {
      display: none;
      background: #fff1f2;
      color: #b42318;
      border: 1px solid #fecdd3;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 18px;
      white-space: pre-wrap;
    }
    .stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }
    .stat {
      background: #eef6ff;
      border: 1px solid #dbeafe;
      border-radius: 10px;
      padding: 12px 14px;
      min-width: 160px;
    }
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: #6b7280;
      display: block;
      margin-bottom: 6px;
    }
    .stat strong {
      color: #007bff;
      font-size: 22px;
    }
    .preview {
      min-height: 180px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 14px;
      white-space: pre-wrap;
      background: #fbfdff;
      line-height: 1.5;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      overflow-wrap: anywhere;
    }
    mark {
      background: #ffe082;
      color: #111827;
      padding: 1px 0;
      border-radius: 4px;
    }
    mark.zero-width {
      background: #fbbf24;
      padding: 1px 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border-bottom: 1px solid #e5e7eb;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #eef6ff;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
    }
    details {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px 16px;
      background: #fafafa;
    }
    summary {
      cursor: pointer;
      font-weight: 700;
      color: #1f2937;
    }
    .cheat-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }
    .cheat-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px;
    }
    .cheat-item strong {
      display: block;
      margin-bottom: 6px;
      color: #111827;
    }
    .muted {
      color: #6b7280;
    }
    @media (max-width: 760px) {
      .row, .cheat-grid {
        grid-template-columns: 1fr;
      }
      .flags {
        padding-top: 0;
      }
      .container {
        padding: 14px;
      }
      .card {
        padding: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Live Regex Tester</h1>
      <p class="subtitle">Experiment with patterns in real time, see every match highlighted, inspect capture groups, and catch syntax errors before a regex reaches production.</p>

      <div class="row">
        <div>
          <label for="pattern">Pattern</label>
          <input id="pattern" type="text" value="(\\b[a-zA-Z]{4}\\b)" spellcheck="false" placeholder="Enter a regular expression pattern">
        </div>
        <div>
          <label>Flags</label>
          <div class="flags">
            <label class="flag"><input type="checkbox" value="g" checked> g</label>
            <label class="flag"><input type="checkbox" value="i"> i</label>
            <label class="flag"><input type="checkbox" value="m" checked> m</label>
            <label class="flag"><input type="checkbox" value="s"> s</label>
            <label class="flag"><input type="checkbox" value="u"> u</label>
          </div>
        </div>
      </div>

      <label for="testString">Test string</label>
      <textarea id="testString" spellcheck="false">This line has four word pairs.
Regex tools should find each four-letter word.
Here are more: code, test, live, demo.</textarea>

      <div class="error" id="errorBox"></div>

      <div class="stats">
        <div class="stat">
          <span class="stat-label">Match count</span>
          <strong id="matchCount">0</strong>
        </div>
        <div class="stat">
          <span class="stat-label">Active flags</span>
          <strong id="activeFlags">gm</strong>
        </div>
      </div>

      <h2>Highlighted matches</h2>
      <div class="preview" id="previewOutput"></div>

      <h2 style="margin-top:24px;">Capture groups</h2>
      <table>
        <thead>
          <tr>
            <th>Match #</th>
            <th>Index</th>
            <th>Full match</th>
            <th>Groups</th>
          </tr>
        </thead>
        <tbody id="groupsBody"></tbody>
      </table>
    </div>

    <div class="card">
      <details>
        <summary>Regex cheat sheet</summary>
        <div class="cheat-grid">
          <div class="cheat-item"><strong><code>\\d+</code></strong><span class="muted">One or more digits</span></div>
          <div class="cheat-item"><strong><code>\\w+</code></strong><span class="muted">Word characters</span></div>
          <div class="cheat-item"><strong><code>^start</code></strong><span class="muted">Match at the start of a line</span></div>
          <div class="cheat-item"><strong><code>end$</code></strong><span class="muted">Match at the end of a line</span></div>
          <div class="cheat-item"><strong><code>(foo|bar)</code></strong><span class="muted">Alternation with a capture group</span></div>
          <div class="cheat-item"><strong><code>[A-Z]{2,5}</code></strong><span class="muted">Two to five uppercase letters</span></div>
          <div class="cheat-item"><strong><code>\\bword\\b</code></strong><span class="muted">Whole-word match</span></div>
          <div class="cheat-item"><strong><code>(?&lt;name&gt;...)</code></strong><span class="muted">Named capture group</span></div>
        </div>
      </details>
    </div>
  </div>

  <script>
    var patternInput = document.getElementById('pattern');
    var testString = document.getElementById('testString');
    var previewOutput = document.getElementById('previewOutput');
    var groupsBody = document.getElementById('groupsBody');
    var errorBox = document.getElementById('errorBox');
    var matchCount = document.getElementById('matchCount');
    var activeFlags = document.getElementById('activeFlags');
    var debounceTimer = null;

    function escapeHtml(value) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function selectedFlags() {
      return Array.prototype.slice.call(document.querySelectorAll('.flag input:checked')).map(function(input) {
        return input.value;
      }).join('');
    }

    function collectMatches(pattern, flags, text) {
      var safeFlags = flags.indexOf('g') === -1 ? flags + 'g' : flags;
      var regex = new RegExp(pattern, safeFlags);
      var matches = [];
      var result;
      var guard = 0;
      while ((result = regex.exec(text)) !== null && guard < 5000) {
        matches.push({
          index: result.index,
          text: result[0],
          groups: Array.prototype.slice.call(result, 1),
          namedGroups: result.groups || null
        });
        if (result[0] === '') {
          regex.lastIndex += 1;
        }
        guard += 1;
      }
      return matches;
    }

    function renderHighlight(text, matches) {
      if (!text) {
        return '<span class="muted">Type or paste sample text to test your regex.</span>';
      }
      if (!matches.length) {
        return escapeHtml(text);
      }
      var html = '';
      var cursor = 0;
      matches.forEach(function(match) {
        var start = Math.max(match.index, cursor);
        var end = match.index + match.text.length;
        if (start > cursor) {
          html += escapeHtml(text.slice(cursor, start));
        }
        if (match.text.length === 0) {
          html += '<mark class="zero-width">∅</mark>';
          cursor = start;
        } else {
          html += '<mark>' + escapeHtml(text.slice(match.index, end)) + '</mark>';
          cursor = end;
        }
      });
      if (cursor < text.length) {
        html += escapeHtml(text.slice(cursor));
      }
      return html;
    }

    function renderGroups(matches) {
      if (!matches.length) {
        groupsBody.innerHTML = '<tr><td colspan="4" class="muted">No matches yet.</td></tr>';
        return;
      }
      groupsBody.innerHTML = matches.map(function(match, index) {
        var groupLines = [];
        if (match.groups.length) {
          match.groups.forEach(function(groupValue, groupIndex) {
            groupLines.push((groupIndex + 1) + ': ' + (groupValue === undefined ? 'undefined' : groupValue));
          });
        } else {
          groupLines.push('No capture groups');
        }
        if (match.namedGroups) {
          Object.keys(match.namedGroups).forEach(function(key) {
            groupLines.push(key + ': ' + match.namedGroups[key]);
          });
        }
        return '<tr>' +
          '<td>' + (index + 1) + '</td>' +
          '<td>' + match.index + '</td>' +
          '<td><code>' + escapeHtml(match.text || '(empty match)') + '</code></td>' +
          '<td>' + escapeHtml(groupLines.join('\n')).replace(/\n/g, '<br>') + '</td>' +
          '</tr>';
      }).join('');
    }

    function updateTester() {
      var pattern = patternInput.value;
      var flags = selectedFlags();
      var text = testString.value;
      activeFlags.textContent = flags || '—';

      if (!pattern) {
        errorBox.style.display = 'none';
        matchCount.textContent = '0';
        previewOutput.innerHTML = text ? escapeHtml(text) : '<span class="muted">Type or paste sample text to test your regex.</span>';
        groupsBody.innerHTML = '<tr><td colspan="4" class="muted">Add a regex pattern to inspect matches and groups.</td></tr>';
        return;
      }

      try {
        new RegExp(pattern, flags);
        errorBox.style.display = 'none';
        var matches = collectMatches(pattern, flags, text);
        matchCount.textContent = matches.length.toLocaleString();
        previewOutput.innerHTML = renderHighlight(text, matches);
        renderGroups(matches);
      } catch (error) {
        matchCount.textContent = '0';
        previewOutput.innerHTML = text ? escapeHtml(text) : '<span class="muted">Type or paste sample text to test your regex.</span>';
        groupsBody.innerHTML = '<tr><td colspan="4" class="muted">Fix the regex error to inspect capture groups.</td></tr>';
        errorBox.textContent = error.message;
        errorBox.style.display = 'block';
      }
    }

    function scheduleUpdate() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateTester, 200);
    }

    patternInput.addEventListener('input', scheduleUpdate);
    testString.addEventListener('input', scheduleUpdate);
    Array.prototype.slice.call(document.querySelectorAll('.flag input')).forEach(function(input) {
      input.addEventListener('change', scheduleUpdate);
    });

    updateTester();
  </script>
</body>
</html>`;

  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
