addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { billAmount, tipPercent, people, roundUp } = await request.json();
    if (billAmount == null || tipPercent == null || people == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields: billAmount, tipPercent, people' }), { status: 400, headers: jsonHeaders() });
    }
    if (billAmount < 0 || tipPercent < 0 || people < 1) {
      return new Response(JSON.stringify({ error: 'billAmount and tipPercent must be ≥ 0; people must be ≥ 1' }), { status: 400, headers: jsonHeaders() });
    }

    const tipAmount = billAmount * tipPercent / 100;
    const total = billAmount + tipAmount;
    let perPerson = total / people;
    if (roundUp) perPerson = Math.ceil(perPerson * 100) / 100;

    return new Response(JSON.stringify({
      billAmount: +billAmount.toFixed(2),
      tipPercent,
      tipAmount: +tipAmount.toFixed(2),
      total: +total.toFixed(2),
      people,
      perPerson: +perPerson.toFixed(2)
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tip Calculator & Bill Splitter</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#fff7ed,#fef3c7);min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:480px;margin:0 auto}
  h1{text-align:center;color:#d97706;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,.09);margin-bottom:18px}
  label{display:block;font-weight:600;margin-bottom:6px;color:#374151}
  input[type=number],input[type=text]{width:100%;padding:11px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:16px;outline:none;transition:border-color .2s}
  input:focus{border-color:#d97706}
  .fg{margin-bottom:16px}
  .tips-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
  .tip-btn{padding:8px 16px;border:2px solid #e5e7eb;border-radius:20px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;transition:all .2s;color:#374151}
  .tip-btn.active{background:#d97706;border-color:#d97706;color:#fff}
  .range-wrap{margin-bottom:16px}
  input[type=range]{width:100%;accent-color:#d97706}
  .range-val{text-align:center;font-size:1.5em;font-weight:700;color:#d97706;margin-top:4px}
  .toggle-row{display:flex;align-items:center;gap:10px;margin-bottom:20px}
  .toggle{position:relative;display:inline-block;width:44px;height:24px}
  .toggle input{opacity:0;width:0;height:0}
  .slider{position:absolute;inset:0;background:#ccc;border-radius:12px;cursor:pointer;transition:.3s}
  .slider:before{content:'';position:absolute;width:18px;height:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s}
  input:checked+.slider{background:#d97706}
  input:checked+.slider:before{transform:translateX(20px)}
  button.calc{width:100%;padding:14px;background:#d97706;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s}
  button.calc:hover{background:#b45309}
  .results{display:none}
  .res-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
  .stat{background:#fff7ed;border-radius:10px;padding:16px;text-align:center}
  .stat-val{font-size:1.5em;font-weight:700;color:#d97706}
  .stat-lbl{font-size:.8em;color:#888;margin-top:4px}
  .big-stat{background:#d97706;border-radius:12px;padding:20px;text-align:center;color:#fff}
  .big-val{font-size:2.4em;font-weight:800}
  .big-lbl{font-size:.9em;opacity:.85;margin-top:4px}
  .people-inputs{display:none}
  .people-input-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  .people-input-row input{flex:1;padding:8px 12px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;outline:none}
  .people-input-row .share{background:#fff7ed;border-radius:6px;padding:6px 12px;font-weight:700;color:#d97706;min-width:90px;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <h1>🧾 Tip Calculator</h1>
  <p class="sub">Split the bill fairly every time</p>

  <div class="card">
    <div class="fg">
      <label>Bill Amount</label>
      <input type="number" id="bill" min="0" step="0.01" placeholder="0.00" value="" oninput="updateLive()">
    </div>

    <label>Tip %</label>
    <div class="tips-row" id="quickTips">
      <button class="tip-btn" onclick="setTip(10)">10%</button>
      <button class="tip-btn active" onclick="setTip(15)">15%</button>
      <button class="tip-btn" onclick="setTip(18)">18%</button>
      <button class="tip-btn" onclick="setTip(20)">20%</button>
      <button class="tip-btn" onclick="setTip(25)">25%</button>
    </div>
    <div class="range-wrap">
      <input type="range" id="tipRange" min="0" max="50" value="15" oninput="onRange(this.value)">
      <div class="range-val" id="tipDisplay">15%</div>
    </div>

    <div class="fg">
      <label>Number of People</label>
      <input type="number" id="people" min="1" step="1" value="2" oninput="updateLive()">
    </div>

    <div class="toggle-row">
      <label class="toggle"><input type="checkbox" id="roundUp" onchange="updateLive()"><span class="slider"></span></label>
      <span style="font-weight:600">Round up per-person amount</span>
    </div>

    <button class="calc" onclick="calculate()">Calculate</button>
  </div>

  <div class="card results" id="results">
    <div class="res-grid">
      <div class="stat"><div class="stat-val" id="r-tip">—</div><div class="stat-lbl">Tip Amount</div></div>
      <div class="stat"><div class="stat-val" id="r-total">—</div><div class="stat-lbl">Total Bill</div></div>
    </div>
    <div class="big-stat">
      <div class="big-val" id="r-per">—</div>
      <div class="big-lbl" id="r-per-lbl">Per Person</div>
    </div>
  </div>
</div>
<script>
let currentTip=15;
function setTip(v){
  currentTip=v;
  document.getElementById('tipRange').value=v;
  document.getElementById('tipDisplay').textContent=v+'%';
  document.querySelectorAll('.tip-btn').forEach(b=>b.classList.toggle('active',parseInt(b.textContent)===v));
  updateLive();
}
function onRange(v){
  currentTip=parseInt(v);
  document.getElementById('tipDisplay').textContent=v+'%';
  document.querySelectorAll('.tip-btn').forEach(b=>b.classList.toggle('active',parseInt(b.textContent)===currentTip));
  updateLive();
}
function fmt(n){return '$'+parseFloat(n).toFixed(2)}
async function calculate(){
  const bill=parseFloat(document.getElementById('bill').value)||0;
  const people=parseInt(document.getElementById('people').value)||1;
  const roundUp=document.getElementById('roundUp').checked;
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({billAmount:bill,tipPercent:currentTip,people,roundUp})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  document.getElementById('r-tip').textContent=fmt(d.tipAmount);
  document.getElementById('r-total').textContent=fmt(d.total);
  document.getElementById('r-per').textContent=fmt(d.perPerson);
  document.getElementById('r-per-lbl').textContent='Each of '+people+(people===1?' person':' people')+' pays';
  document.getElementById('results').style.display='block';
}
function updateLive(){
  const bill=parseFloat(document.getElementById('bill').value)||0;
  if(bill>0) calculate();
}
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() } });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
