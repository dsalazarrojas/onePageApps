addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { text, font = 'block', width = 80 } = await request.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing required field: text (string)' }), { status: 400, headers: jsonHeaders() });
    }
    if (text.length > 30) {
      return new Response(JSON.stringify({ error: 'text must be 30 characters or fewer' }), { status: 400, headers: jsonHeaders() });
    }

    const art = renderAscii(text.toUpperCase(), font);
    return new Response(JSON.stringify({ art, font, text, lines: art.split('\n').length }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

// ---- ASCII font renderer ----
// Built-in "block" font (5-tall characters)
const BLOCK_FONT = {
  ' ': ['   ','   ','   ','   ','   '],
  'A': [' █████ ','██   ██','███████','██   ██','██   ██'],
  'B': ['██████ ','██   ██','██████ ','██   ██','██████ '],
  'C': [' ██████','██     ','██     ','██     ',' ██████'],
  'D': ['██████ ','██   ██','██   ██','██   ██','██████ '],
  'E': ['███████','██     ','█████  ','██     ','███████'],
  'F': ['███████','██     ','█████  ','██     ','██     '],
  'G': [' ██████','██     ','██  ███','██   ██',' ██████'],
  'H': ['██   ██','██   ██','███████','██   ██','██   ██'],
  'I': ['███','  ██ ','  ██ ','  ██ ','███'],
  'J': ['    ███','    ██ ','    ██ ','██  ██ ',' █████ '],
  'K': ['██   ██','██  ██ ','█████  ','██  ██ ','██   ██'],
  'L': ['██     ','██     ','██     ','██     ','███████'],
  'M': ['███   ███','████ ████','██  ███  ██','██       ██','██       ██'],
  'N': ['███   ██','████  ██','██ ██ ██','██  ████','██   ███'],
  'O': [' █████ ','██   ██','██   ██','██   ██',' █████ '],
  'P': ['██████ ','██   ██','██████ ','██     ','██     '],
  'Q': [' █████ ','██   ██','██ █ ██','██  ██  ',' ████ ██'],
  'R': ['██████ ','██   ██','██████ ','██  ██ ','██   ██'],
  'S': [' ██████','██     ',' █████ ','     ██','██████ '],
  'T': ['███████','  ██   ','  ██   ','  ██   ','  ██   '],
  'U': ['██   ██','██   ██','██   ██','██   ██',' █████ '],
  'V': ['██   ██','██   ██','██   ██',' ██ ██ ','  ███  '],
  'W': ['██      ██','██      ██','██  ██  ██',' ██████████','  ████  ██'],
  'X': ['██   ██',' ██ ██ ','  ███  ',' ██ ██ ','██   ██'],
  'Y': ['██   ██',' ██ ██ ','  ███  ','  ██   ','  ██   '],
  'Z': ['███████','    ██ ','  ███  ','██     ','███████'],
  '0': [' █████ ','██  ███','██ ██ ██','███  ██',' █████ '],
  '1': [' ███ ','████ ','  ██ ','  ██ ','█████'],
  '2': [' █████ ','██   ██','   ████','  ██   ','███████'],
  '3': [' █████ ','     ██','  ████ ','     ██',' █████ '],
  '4': ['   ████','  ██ ██',' ██  ██','███████','     ██'],
  '5': ['███████','██     ','██████ ','     ██','██████ '],
  '6': [' ████  ','██     ','██████ ','██   ██',' █████ '],
  '7': ['███████','    ██ ','   ██  ','  ██   ','  ██   '],
  '8': [' █████ ','██   ██',' █████ ','██   ██',' █████ '],
  '9': [' █████ ','██   ██',' ██████','     ██',' █████ '],
  '!': ['██','██','██','  ','██'],
  '?': ['█████ ','██  ██','  ███ ','      ','  ██  '],
  '.': ['  ','  ','  ','  ','██'],
  ',': ['  ','  ','  ',' █','█ '],
  '-': ['   ','   ','███','   ','   '],
  '+': ['  ██  ','  ██  ','██████','  ██  ','  ██  '],
  '*': ['██ ██',' ███ ','█████',' ███ ','██ ██'],
  '/': ['    ██','   ██ ','  ██  ',' ██   ','██    '],
  '@': [' █████ ','██   ██','██ ████','██ ███ ',' ████  '],
  '#': [' ██ ██ ','███████',' ██ ██ ','███████',' ██ ██ '],
  '$': [' ████ ','██ ██ ','  ████',' ██ ██',' ████ '],
  '%': ['██   ██','   ██  ','  ██   ',' ██    ','██   ██'],
  '&': [' ████  ','██  ██ ',' ████  ','██  ██ ',' █████ '],
  '(': ['  ██',' ██ ','██  ','██  ',' ██ '],
  ')': ['██  ',' ██ ','  ██','  ██',' ██ '],
  '[': ['███','██ ','██ ','██ ','███'],
  ']': ['███',' ██',' ██',' ██','███'],
};

const SHADOW_FONT = {
  ' ': ['  ','  ','  '],
};
for (const [ch, rows] of Object.entries(BLOCK_FONT)) {
  SHADOW_FONT[ch] = rows.map(r => r.replace(/█/g, '▓').replace(/ /g, '░'));
}

const SLIM_FONT = {
  ' ': ['  ','  ','  '],
};
for (const [ch, rows] of Object.entries(BLOCK_FONT)) {
  SLIM_FONT[ch] = rows.map(r => r.replace(/█/g, '#'));
}

const FONTS = { block: BLOCK_FONT, shadow: SHADOW_FONT, slim: SLIM_FONT };

function renderAscii(text, fontName) {
  const font = FONTS[fontName] || BLOCK_FONT;
  const FALLBACK = ['?','?','?','?','?'];
  const charRows = text.split('').map(ch => font[ch] || FALLBACK);
  const rowCount = Math.max(...charRows.map(r => r.length));
  const lines = [];
  for (let row = 0; row < rowCount; row++) {
    lines.push(charRows.map(cr => (cr[row] || '').padEnd(0)).join(' '));
  }
  return lines.join('\n');
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ASCII Art Generator</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f172a,#1e293b);min-height:100vh;padding:24px;color:#e2e8f0}
  .wrap{max-width:800px;margin:0 auto}
  h1{text-align:center;color:#38bdf8;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#94a3b8;margin-bottom:24px}
  .card{background:#1e293b;border-radius:16px;padding:24px;box-shadow:0 4px 30px rgba(0,0,0,.4);margin-bottom:18px;border:1px solid #334155}
  label{display:block;font-weight:600;margin-bottom:8px;color:#94a3b8;font-size:.9em;text-transform:uppercase;letter-spacing:.05em}
  input[type=text]{width:100%;padding:13px 16px;background:#0f172a;border:2px solid #334155;border-radius:8px;font-size:18px;outline:none;color:#e2e8f0;transition:border-color .2s;letter-spacing:.05em}
  input[type=text]:focus{border-color:#38bdf8}
  .font-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
  .font-btn{padding:8px 18px;border:2px solid #334155;border-radius:8px;background:#0f172a;color:#94a3b8;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}
  .font-btn.active{background:#38bdf8;border-color:#38bdf8;color:#0f172a}
  .fg{margin-bottom:16px}
  button.gen{width:100%;padding:13px;background:#38bdf8;color:#0f172a;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s}
  button.gen:hover{background:#0ea5e9}
  .output{display:none}
  pre{background:#020617;color:#22d3ee;padding:20px;border-radius:10px;overflow-x:auto;font-family:'Courier New',Courier,monospace;font-size:.75em;line-height:1.4;border:1px solid #164e63;white-space:pre}
  .action-row{display:flex;gap:10px;margin-top:12px}
  .action-btn{flex:1;padding:10px;border:2px solid #334155;background:#0f172a;color:#94a3b8;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:all .2s}
  .action-btn:hover{border-color:#38bdf8;color:#38bdf8}
  .char-count{text-align:right;font-size:.8em;color:#94a3b8;margin-top:4px}
</style>
</head>
<body>
<div class="wrap">
  <h1>⌨ ASCII Art Generator</h1>
  <p class="sub">Transform any text into bold ASCII block art</p>

  <div class="card">
    <div class="fg">
      <label>Your Text (max 12 chars for best results)</label>
      <input type="text" id="textInput" maxlength="30" placeholder="HELLO" oninput="updateCount()" value="HELLO">
      <div class="char-count"><span id="charCount">5</span>/30</div>
    </div>

    <label>Style</label>
    <div class="font-row">
      <button class="font-btn active" onclick="setFont('block','Block')">█ Block</button>
      <button class="font-btn" onclick="setFont('shadow','Shadow')">▓ Shadow</button>
      <button class="font-btn" onclick="setFont('slim','Slim')">&#35; Slim</button>
    </div>

    <button class="gen" onclick="generate()">Generate ASCII Art</button>
  </div>

  <div class="card output" id="output">
    <pre id="artPre"></pre>
    <div class="action-row">
      <button class="action-btn" onclick="copyArt()">📋 Copy to Clipboard</button>
      <button class="action-btn" onclick="downloadArt()">⬇ Download .txt</button>
    </div>
  </div>
</div>
<script>
let currentFont='block';
function setFont(f,label){
  currentFont=f;
  document.querySelectorAll('.font-btn').forEach(b=>b.classList.toggle('active',b.textContent.trim().includes(label.split(' ')[1])||b.textContent.trim().includes(label)));
}
function updateCount(){
  document.getElementById('charCount').textContent=document.getElementById('textInput').value.length;
}
async function generate(){
  const text=document.getElementById('textInput').value.toUpperCase()||'HELLO';
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,font:currentFont})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  document.getElementById('artPre').textContent=d.art;
  document.getElementById('output').style.display='block';
}
function copyArt(){
  const art=document.getElementById('artPre').textContent;
  navigator.clipboard.writeText(art).then(()=>alert('Copied!'));
}
function downloadArt(){
  const art=document.getElementById('artPre').textContent;
  const a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(art);
  a.download='ascii_art.txt';
  a.click();
}
// Auto-generate on load
generate();
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() } });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
