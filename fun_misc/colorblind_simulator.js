addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { hex, type = 'all' } = await request.json();
    if (!hex) {
      return new Response(JSON.stringify({ error: 'Missing required field: hex (CSS hex color, e.g. #ff6600)' }), { status: 400, headers: jsonHeaders() });
    }

    const rgb = hexToRgb(hex);
    if (!rgb) {
      return new Response(JSON.stringify({ error: 'Invalid hex color. Use format #RRGGBB or #RGB.' }), { status: 400, headers: jsonHeaders() });
    }

    const types = type === 'all'
      ? ['deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia', 'deuteranomaly', 'protanomaly']
      : [type];

    const results = {};
    for (const t of types) {
      const sim = simulateColorblindness(rgb, t);
      results[t] = { rgb: sim, hex: rgbToHex(sim) };
    }

    return new Response(JSON.stringify({ original: { rgb, hex: hex.toUpperCase() }, simulated: results }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    const [r, g, b] = clean.split('').map(c => parseInt(c + c, 16));
    return { r, g, b };
  }
  if (clean.length === 6) {
    return { r: parseInt(clean.slice(0,2),16), g: parseInt(clean.slice(2,4),16), b: parseInt(clean.slice(4,6),16) };
  }
  return null;
}

function rgbToHex({r, g, b}) {
  return '#' + [r,g,b].map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('').toUpperCase();
}

// Colour blindness simulation using LMS-based matrices (Brettel / Viénot)
function simulateColorblindness({ r, g, b }, type) {
  // sRGB to linear
  const lin = [r,g,b].map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  // Daltonisation matrices (simplified Viénot 1999 / Machado 2009 approximations)
  const matrices = {
    deuteranopia:   [[0.625, 0.375, 0],[0.700, 0.300, 0],[0, 0.300, 0.700]],
    protanopia:     [[0.567, 0.433, 0],[0.558, 0.442, 0],[0, 0.242, 0.758]],
    tritanopia:     [[0.950, 0.050, 0],[0, 0.433, 0.567],[0, 0.475, 0.525]],
    achromatopsia:  [[0.299, 0.587, 0.114],[0.299, 0.587, 0.114],[0.299, 0.587, 0.114]],
    deuteranomaly:  [[0.80, 0.20, 0],[0.258, 0.742, 0],[0, 0.142, 0.858]],
    protanomaly:    [[0.817, 0.183, 0],[0.333, 0.667, 0],[0, 0.125, 0.875]],
  };

  const m = matrices[type] || matrices.deuteranopia;
  const [lR, lG, lB] = lin;
  const out = m.map(row => row[0]*lR + row[1]*lG + row[2]*lB);

  // Linear to sRGB
  const toSRGB = v => {
    const c = Math.max(0, Math.min(1, v));
    return Math.round((c <= 0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055) * 255);
  };

  return { r: toSRGB(out[0]), g: toSRGB(out[1]), b: toSRGB(out[2]) };
}

function serveMainPage() {
  const types = ['deuteranopia','protanopia','tritanopia','achromatopsia','deuteranomaly','protanomaly'];
  const typeLabels = {
    deuteranopia: 'Deuteranopia (no green)',
    protanopia: 'Protanopia (no red)',
    tritanopia: 'Tritanopia (no blue)',
    achromatopsia: 'Achromatopsia (monochrome)',
    deuteranomaly: 'Deuteranomaly (weak green)',
    protanomaly: 'Protanomaly (weak red)'
  };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Colorblind Simulator</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:#f8fafc;min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:700px;margin:0 auto}
  h1{text-align:center;color:#0f172a;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:18px}
  label{display:block;font-weight:600;margin-bottom:8px;color:#374151}
  .color-pick-row{display:flex;align-items:center;gap:14px;margin-bottom:20px}
  input[type=color]{width:64px;height:48px;border:none;cursor:pointer;border-radius:8px;padding:2px}
  input[type=text]{flex:1;padding:11px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:15px;outline:none;transition:border-color .2s;font-family:monospace}
  input[type=text]:focus{border-color:#6366f1}
  button{width:100%;padding:13px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s}
  button:hover{background:#4f46e5}
  .results{display:none}
  .swatches{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:500px){.swatches{grid-template-columns:1fr}}
  .swatch-card{border-radius:12px;overflow:hidden;border:1px solid #e5e7eb}
  .swatch-color{height:80px;transition:background-color .3s}
  .swatch-info{padding:10px 12px;background:#fff}
  .swatch-name{font-weight:700;font-size:.9em;color:#374151}
  .swatch-hex{font-size:.8em;color:#888;font-family:monospace;margin-top:2px}
  .original-swatch{grid-column:1/-1}
  .original-swatch .swatch-color{height:100px}
  .canvas-wrap{margin-top:20px}
  canvas{width:100%;border-radius:12px;border:1px solid #e5e7eb;cursor:crosshair}
  .canvas-label{font-weight:600;margin-bottom:8px;color:#374151}
  .img-controls{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}
  .img-btn{padding:8px 14px;border:2px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;color:#374151}
  .img-btn.active{background:#6366f1;border-color:#6366f1;color:#fff}
  .dropzone{border:3px dashed #e5e7eb;border-radius:12px;padding:30px;text-align:center;color:#888;cursor:pointer;transition:border-color .2s;margin-bottom:16px}
  .dropzone:hover,.dropzone.over{border-color:#6366f1;color:#6366f1}
</style>
</head>
<body>
<div class="wrap">
  <h1>👁 Colorblind Simulator</h1>
  <p class="sub">Preview how colors appear to people with different types of color vision deficiency</p>

  <div class="card">
    <label>Pick a colour</label>
    <div class="color-pick-row">
      <input type="color" id="colorPicker" value="#3b82f6" oninput="syncHex(this.value)">
      <input type="text" id="hexInput" placeholder="#3b82f6" value="#3b82f6" maxlength="7" oninput="syncPicker(this.value)">
    </div>
    <button onclick="simulate()">Simulate</button>
  </div>

  <div class="card results" id="results">
    <div class="swatches" id="swatches"></div>
  </div>

  <div class="card">
    <div class="canvas-label">Image preview (optional)</div>
    <div class="dropzone" id="dropzone" onclick="document.getElementById('imgInput').click()">
      Drop an image here or click to upload
      <input type="file" id="imgInput" accept="image/*" style="display:none" onchange="loadImage(event)">
    </div>
    <div class="img-controls" id="imgControls" style="display:none">
      <button class="img-btn active" onclick="applyFilter('none','Normal')">Normal</button>
      ${types.map(t => `<button class="img-btn" onclick="applyFilter('${t}','${t.charAt(0).toUpperCase()+t.slice(1)}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
    </div>
    <canvas id="imgCanvas" style="display:none"></canvas>
  </div>
</div>
<script>
const TYPE_LABELS = ${JSON.stringify(typeLabels)};
let originalImageData = null;

function syncHex(v){document.getElementById('hexInput').value=v;}
function syncPicker(v){if(/^#[0-9a-fA-F]{6}$/.test(v))document.getElementById('colorPicker').value=v;}

async function simulate(){
  const hex=document.getElementById('hexInput').value.trim()||document.getElementById('colorPicker').value;
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hex,type:'all'})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  const container=document.getElementById('swatches');
  let html=\`<div class="swatch-card original-swatch"><div class="swatch-color" style="background:\${d.original.hex}"></div><div class="swatch-info"><div class="swatch-name">Original</div><div class="swatch-hex">\${d.original.hex}</div></div></div>\`;
  for(const [type,val] of Object.entries(d.simulated)){
    html+=\`<div class="swatch-card"><div class="swatch-color" style="background:\${val.hex}"></div><div class="swatch-info"><div class="swatch-name">\${TYPE_LABELS[type]||type}</div><div class="swatch-hex">\${val.hex}</div></div></div>\`;
  }
  container.innerHTML=html;
  document.getElementById('results').style.display='block';
}

// Image simulation
function loadImage(e){
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.getElementById('imgCanvas');
      canvas.width=Math.min(img.width,700);
      canvas.height=Math.round(img.height*(canvas.width/img.width));
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      originalImageData=ctx.getImageData(0,0,canvas.width,canvas.height);
      canvas.style.display='block';
      document.getElementById('imgControls').style.display='flex';
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

const SIM_MATRICES = {
  deuteranopia:  [[0.625,0.375,0],[0.700,0.300,0],[0,0.300,0.700]],
  protanopia:    [[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]],
  tritanopia:    [[0.950,0.050,0],[0,0.433,0.567],[0,0.475,0.525]],
  achromatopsia: [[0.299,0.587,0.114],[0.299,0.587,0.114],[0.299,0.587,0.114]],
  deuteranomaly: [[0.80,0.20,0],[0.258,0.742,0],[0,0.142,0.858]],
  protanomaly:   [[0.817,0.183,0],[0.333,0.667,0],[0,0.125,0.875]],
};

function applyFilter(type,label){
  document.querySelectorAll('.img-btn').forEach(b=>b.classList.toggle('active',b.textContent===label));
  if(!originalImageData)return;
  const canvas=document.getElementById('imgCanvas');
  const ctx=canvas.getContext('2d');
  if(type==='none'){ctx.putImageData(originalImageData,0,0);return;}
  const src=originalImageData.data;
  const out=ctx.createImageData(canvas.width,canvas.height);
  const m=SIM_MATRICES[type];
  for(let i=0;i<src.length;i+=4){
    const r=src[i]/255,g=src[i+1]/255,b=src[i+2]/255;
    out.data[i]  =Math.round((m[0][0]*r+m[0][1]*g+m[0][2]*b)*255);
    out.data[i+1]=Math.round((m[1][0]*r+m[1][1]*g+m[1][2]*b)*255);
    out.data[i+2]=Math.round((m[2][0]*r+m[2][1]*g+m[2][2]*b)*255);
    out.data[i+3]=src[i+3];
  }
  ctx.putImageData(out,0,0);
}

// Dropzone drag-over
const dz=document.getElementById('dropzone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over');});
dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');const f=e.dataTransfer.files[0];if(f){document.getElementById('imgInput').files=e.dataTransfer.files;loadImage({target:{files:e.dataTransfer.files}});}});
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() } });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
