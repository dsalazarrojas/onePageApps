addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { foreground, background } = await request.json();
    if (!foreground || !background) {
      return new Response(JSON.stringify({ error: 'Missing required fields: foreground, background (hex colors)' }), { status: 400, headers: jsonHeaders() });
    }

    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);
    if (!fg || !bg) {
      return new Response(JSON.stringify({ error: 'Invalid hex color. Use #RRGGBB or #RGB format.' }), { status: 400, headers: jsonHeaders() });
    }

    const fgLum = relativeLuminance(fg);
    const bgLum = relativeLuminance(bg);
    const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

    const results = {
      ratio: +ratio.toFixed(2),
      ratioFormatted: ratio.toFixed(2) + ':1',
      wcag: {
        AA_normal:   ratio >= 4.5,
        AA_large:    ratio >= 3.0,
        AAA_normal:  ratio >= 7.0,
        AAA_large:   ratio >= 4.5,
        AA_UI:       ratio >= 3.0,
      },
      foregroundLuminance: +fgLum.toFixed(4),
      backgroundLuminance: +bgLum.toFixed(4),
    };

    return new Response(JSON.stringify(results), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    return { r: parseInt(clean[0]+clean[0],16), g: parseInt(clean[1]+clean[1],16), b: parseInt(clean[2]+clean[2],16) };
  }
  if (clean.length === 6) {
    return { r: parseInt(clean.slice(0,2),16), g: parseInt(clean.slice(2,4),16), b: parseInt(clean.slice(4,6),16) };
  }
  return null;
}

function relativeLuminance({ r, g, b }) {
  return [r, g, b].reduce((lum, c, i) => {
    const s = c / 255;
    const lin = s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    return lum + lin * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contrast Checker</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:#f8fafc;min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:620px;margin:0 auto}
  h1{text-align:center;color:#0f172a;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:18px}
  label{display:block;font-weight:600;margin-bottom:8px;color:#374151}
  .color-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  @media(max-width:480px){.color-row{grid-template-columns:1fr}}
  .color-field{display:flex;flex-direction:column;gap:6px}
  .color-pick-wrap{display:flex;gap:8px;align-items:center}
  input[type=color]{width:52px;height:42px;border:none;cursor:pointer;border-radius:6px;padding:2px;flex-shrink:0}
  input[type=text]{flex:1;padding:10px 12px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none;font-family:monospace;transition:border-color .2s}
  input[type=text]:focus{border-color:#6366f1}
  button.check{width:100%;padding:13px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s}
  button.check:hover{background:#4f46e5}
  .results{display:none}
  .preview{border-radius:12px;padding:28px;text-align:center;margin-bottom:18px;transition:all .3s}
  .preview-text-lg{font-size:2em;font-weight:700;margin-bottom:8px}
  .preview-text-sm{font-size:1em;margin-bottom:8px}
  .preview-text-ui{display:inline-block;border:2px solid;border-radius:6px;padding:8px 20px;font-weight:600;font-size:.9em}
  .ratio-display{text-align:center;margin-bottom:20px}
  .ratio-val{font-size:3.5em;font-weight:800;color:#0f172a}
  .ratio-lbl{color:#888;font-size:.9em;margin-top:4px}
  .wcag-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
  @media(max-width:420px){.wcag-grid{grid-template-columns:1fr 1fr}}
  .wcag-card{border-radius:10px;padding:14px;text-align:center;border:2px solid transparent}
  .wcag-pass{background:#f0fdf4;border-color:#22c55e}
  .wcag-fail{background:#fff1f2;border-color:#f87171}
  .wcag-icon{font-size:1.5em}
  .wcag-name{font-size:.78em;font-weight:700;margin-top:4px;color:#374151}
  .wcag-req{font-size:.72em;color:#888;margin-top:2px}
  .swapper{background:none;border:none;cursor:pointer;font-size:1.4em;color:#6366f1;align-self:center;margin-top:18px}
</style>
</head>
<body>
<div class="wrap">
  <h1>♿ Contrast Checker</h1>
  <p class="sub">WCAG 2.1 color contrast ratio for accessibility</p>

  <div class="card">
    <div class="color-row">
      <div class="color-field">
        <label>Foreground (text)</label>
        <div class="color-pick-wrap">
          <input type="color" id="fgPicker" value="#1e293b" oninput="syncFgHex(this.value)">
          <input type="text" id="fgHex" value="#1e293b" maxlength="7" placeholder="#000000" oninput="syncFgPicker(this.value)">
        </div>
      </div>
      <div class="color-field">
        <label>Background</label>
        <div class="color-pick-wrap">
          <input type="color" id="bgPicker" value="#ffffff" oninput="syncBgHex(this.value)">
          <input type="text" id="bgHex" value="#ffffff" maxlength="7" placeholder="#ffffff" oninput="syncBgPicker(this.value)">
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="check" onclick="checkContrast()" style="flex:1">Check Contrast</button>
      <button class="swapper" onclick="swapColors()" title="Swap colors">⇄</button>
    </div>
  </div>

  <div id="results" class="results">
    <div class="card" id="previewCard">
      <div class="preview" id="previewBox">
        <div class="preview-text-lg" id="prevLg">Large Text Sample</div>
        <div class="preview-text-sm" id="prevSm">Normal body text at 16px. The quick brown fox jumps over the lazy dog.</div>
        <br>
        <div class="preview-text-ui" id="prevUi">UI Component</div>
      </div>
    </div>

    <div class="card">
      <div class="ratio-display">
        <div class="ratio-val" id="ratioVal">—</div>
        <div class="ratio-lbl">Contrast Ratio</div>
      </div>
      <div class="wcag-grid" id="wcagGrid"></div>
    </div>
  </div>
</div>
<script>
function syncFgHex(v){document.getElementById('fgHex').value=v;livePreview();}
function syncFgPicker(v){if(/^#[0-9a-fA-F]{6}$/.test(v)){document.getElementById('fgPicker').value=v;livePreview();}}
function syncBgHex(v){document.getElementById('bgHex').value=v;livePreview();}
function syncBgPicker(v){if(/^#[0-9a-fA-F]{6}$/.test(v)){document.getElementById('bgPicker').value=v;livePreview();}}
function swapColors(){
  const fg=document.getElementById('fgHex').value;
  const bg=document.getElementById('bgHex').value;
  document.getElementById('fgHex').value=bg;
  document.getElementById('fgPicker').value=bg;
  document.getElementById('bgHex').value=fg;
  document.getElementById('bgPicker').value=fg;
  livePreview();
}
function livePreview(){
  const fg=document.getElementById('fgHex').value;
  const bg=document.getElementById('bgHex').value;
  if(/^#[0-9a-fA-F]{6}$/.test(fg)&&/^#[0-9a-fA-F]{6}$/.test(bg)){
    document.getElementById('previewBox').style.background=bg;
    document.getElementById('prevLg').style.color=fg;
    document.getElementById('prevSm').style.color=fg;
    document.getElementById('prevUi').style.color=fg;
    document.getElementById('prevUi').style.borderColor=fg;
  }
}
const WCAG_CHECKS=[
  {key:'AA_normal',label:'AA Normal',desc:'4.5:1 — body text'},
  {key:'AA_large',label:'AA Large',desc:'3:1 — 18pt+ text'},
  {key:'AAA_normal',label:'AAA Normal',desc:'7:1 — body text'},
  {key:'AAA_large',label:'AAA Large',desc:'4.5:1 — 18pt+'},
  {key:'AA_UI',label:'AA UI',desc:'3:1 — UI elements'},
];
async function checkContrast(){
  const fg=document.getElementById('fgHex').value.trim();
  const bg=document.getElementById('bgHex').value.trim();
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({foreground:fg,background:bg})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  document.getElementById('ratioVal').textContent=d.ratioFormatted;
  document.getElementById('previewBox').style.background=bg;
  ['prevLg','prevSm','prevUi'].forEach(id=>{document.getElementById(id).style.color=fg;});
  document.getElementById('prevUi').style.borderColor=fg;
  document.getElementById('wcagGrid').innerHTML=WCAG_CHECKS.map(c=>{
    const pass=d.wcag[c.key];
    return \`<div class="wcag-card \${pass?'wcag-pass':'wcag-fail'}">
      <div class="wcag-icon">\${pass?'✅':'❌'}</div>
      <div class="wcag-name">\${c.label}</div>
      <div class="wcag-req">\${c.desc}</div>
    </div>\`;
  }).join('');
  document.getElementById('results').style.display='block';
}
livePreview();
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() } });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
