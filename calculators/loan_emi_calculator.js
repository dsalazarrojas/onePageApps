addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { principal, annualRate, tenureMonths } = await request.json();

    if (!principal || !annualRate || !tenureMonths) {
      return new Response(JSON.stringify({ error: 'Missing required fields: principal, annualRate, tenureMonths' }), { status: 400, headers: jsonHeaders() });
    }
    if (principal <= 0 || annualRate < 0 || tenureMonths <= 0) {
      return new Response(JSON.stringify({ error: 'All values must be positive; annualRate can be 0.' }), { status: 400, headers: jsonHeaders() });
    }

    const r = annualRate / 12 / 100;
    const n = tenureMonths;
    let emi;
    if (r === 0) {
      emi = principal / n;
    } else {
      emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalPayment = emi * n;
    const totalInterest = totalPayment - principal;

    const schedule = [];
    let balance = principal;
    for (let i = 1; i <= n; i++) {
      const interestPart = balance * r;
      const principalPart = emi - interestPart;
      balance -= principalPart;
      schedule.push({
        month: i,
        emi: +emi.toFixed(2),
        principal: +principalPart.toFixed(2),
        interest: +interestPart.toFixed(2),
        balance: +Math.max(0, balance).toFixed(2)
      });
    }

    return new Response(JSON.stringify({ emi: +emi.toFixed(2), totalPayment: +totalPayment.toFixed(2), totalInterest: +totalInterest.toFixed(2), schedule }), { status: 200, headers: jsonHeaders() });
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
<title>Loan EMI Calculator</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:#f0f4ff;color:#222;min-height:100vh;padding:24px}
  .wrap{max-width:760px;margin:0 auto}
  h1{text-align:center;color:#1a56db;margin-bottom:8px;font-size:1.9em}
  .sub{text-align:center;color:#666;margin-bottom:24px;font-size:.95em}
  .card{background:#fff;border-radius:14px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,.08);margin-bottom:20px}
  label{display:block;font-weight:600;margin-bottom:6px;color:#374151}
  input,select{width:100%;padding:11px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:15px;outline:none;transition:border-color .2s}
  input:focus{border-color:#1a56db}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  @media(max-width:500px){.row{grid-template-columns:1fr}}
  .fg{margin-bottom:16px}
  button{width:100%;padding:13px;background:#1a56db;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;transition:background .2s}
  button:hover{background:#1448b8}
  .results{display:none}
  .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
  @media(max-width:500px){.summary{grid-template-columns:1fr}}
  .stat{background:#f0f4ff;border-radius:10px;padding:16px;text-align:center}
  .stat-val{font-size:1.4em;font-weight:700;color:#1a56db}
  .stat-lbl{font-size:.8em;color:#666;margin-top:4px}
  .chart-wrap{margin-bottom:20px}
  canvas{width:100%;max-height:220px}
  table{width:100%;border-collapse:collapse;font-size:.85em}
  th{background:#1a56db;color:#fff;padding:9px 10px;text-align:right}
  th:first-child{text-align:center}
  td{padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right}
  td:first-child{text-align:center;font-weight:600}
  tr:nth-child(even){background:#f8f9ff}
  .tbl-wrap{max-height:340px;overflow-y:auto;border-radius:8px;border:1px solid #e5e7eb}
</style>
</head>
<body>
<div class="wrap">
  <h1>💰 Loan EMI Calculator</h1>
  <p class="sub">Calculate monthly payments and full amortization schedule</p>
  <div class="card">
    <div class="row">
      <div class="fg">
        <label>Loan Amount</label>
        <input type="number" id="principal" min="1" placeholder="e.g. 500000" value="500000">
      </div>
      <div class="fg">
        <label>Currency Symbol</label>
        <input type="text" id="currency" maxlength="5" placeholder="$" value="$">
      </div>
    </div>
    <div class="row">
      <div class="fg">
        <label>Annual Interest Rate (%)</label>
        <input type="number" id="rate" min="0" step="0.01" placeholder="e.g. 8.5" value="8.5">
      </div>
      <div class="fg">
        <label>Loan Tenure</label>
        <div style="display:flex;gap:8px">
          <input type="number" id="tenure" min="1" placeholder="e.g. 20" value="20" style="flex:1">
          <select id="tenureUnit" style="width:90px">
            <option value="years">Years</option>
            <option value="months">Months</option>
          </select>
        </div>
      </div>
    </div>
    <button onclick="calculate()">Calculate EMI</button>
  </div>

  <div class="card results" id="results">
    <div class="summary">
      <div class="stat"><div class="stat-val" id="s-emi">—</div><div class="stat-lbl">Monthly EMI</div></div>
      <div class="stat"><div class="stat-val" id="s-total">—</div><div class="stat-lbl">Total Payment</div></div>
      <div class="stat"><div class="stat-val" id="s-interest">—</div><div class="stat-lbl">Total Interest</div></div>
    </div>
    <div class="chart-wrap">
      <canvas id="pieChart" width="300" height="200"></canvas>
    </div>
    <h3 style="margin-bottom:10px;color:#374151">Amortization Schedule</h3>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>#</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
        <tbody id="schedule"></tbody>
      </table>
    </div>
  </div>
</div>
<script>
function fmt(n,sym){return sym+(+n).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}

async function calculate(){
  const principal=parseFloat(document.getElementById('principal').value);
  const rate=parseFloat(document.getElementById('rate').value);
  const tenureRaw=parseFloat(document.getElementById('tenure').value);
  const unit=document.getElementById('tenureUnit').value;
  const sym=document.getElementById('currency').value||'$';
  const tenureMonths=unit==='years'?tenureRaw*12:tenureRaw;
  if(!principal||isNaN(rate)||!tenureMonths){alert('Please fill in all fields.');return;}
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({principal,annualRate:rate,tenureMonths})});
  const data=await res.json();
  if(data.error){alert(data.error);return;}
  document.getElementById('s-emi').textContent=fmt(data.emi,sym);
  document.getElementById('s-total').textContent=fmt(data.totalPayment,sym);
  document.getElementById('s-interest').textContent=fmt(data.totalInterest,sym);
  const tbody=document.getElementById('schedule');
  tbody.innerHTML=data.schedule.map(r=>\`<tr><td>\${r.month}</td><td>\${fmt(r.emi,sym)}</td><td>\${fmt(r.principal,sym)}</td><td>\${fmt(r.interest,sym)}</td><td>\${fmt(r.balance,sym)}</td></tr>\`).join('');
  drawPie(principal,data.totalInterest,sym);
  document.getElementById('results').style.display='block';
}

function drawPie(principal,interest,sym){
  const canvas=document.getElementById('pieChart');
  const ctx=canvas.getContext('2d');
  canvas.width=300;canvas.height=200;
  ctx.clearRect(0,0,300,200);
  const total=principal+interest;
  const pAngle=(principal/total)*2*Math.PI;
  const cx=100,cy=100,r=80;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+pAngle);ctx.closePath();ctx.fillStyle='#1a56db';ctx.fill();
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,-Math.PI/2+pAngle,-Math.PI/2+2*Math.PI);ctx.closePath();ctx.fillStyle='#f87171';ctx.fill();
  ctx.font='bold 13px Segoe UI';ctx.fillStyle='#222';
  ctx.fillText('Principal: '+sym+(+principal).toLocaleString(),210,90);
  ctx.fillStyle='#1a56db';ctx.fillRect(200,78,10,10);
  ctx.fillText('Interest: '+sym+(+interest.toFixed(0)).toLocaleString(),210,116);
  ctx.fillStyle='#f87171';ctx.fillRect(200,104,10,10);
  ctx.fillStyle='#222';
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
