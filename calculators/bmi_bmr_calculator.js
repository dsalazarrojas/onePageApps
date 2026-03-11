addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { weightKg, heightCm, ageYears, sex, activityLevel } = await request.json();
    if (!weightKg || !heightCm || !ageYears || !sex) {
      return new Response(JSON.stringify({ error: 'Missing required fields: weightKg, heightCm, ageYears, sex' }), { status: 400, headers: jsonHeaders() });
    }

    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    let bmiCategory;
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal weight';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';

    // Harris-Benedict Revised (Mifflin-St Jeor)
    let bmr;
    if (sex.toLowerCase() === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }

    const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    const tdee = bmr * multiplier;

    const idealWeightMin = 18.5 * Math.pow(heightCm / 100, 2);
    const idealWeightMax = 24.9 * Math.pow(heightCm / 100, 2);

    return new Response(JSON.stringify({
      bmi: +bmi.toFixed(1),
      bmiCategory,
      bmr: +bmr.toFixed(0),
      tdee: +tdee.toFixed(0),
      activityLevel: activityLevel || 'sedentary',
      idealWeightRange: { min: +idealWeightMin.toFixed(1), max: +idealWeightMax.toFixed(1) }
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
<title>BMI & BMR Calculator</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#f0fdf4,#dcfce7);min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:520px;margin:0 auto}
  h1{text-align:center;color:#16a34a;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:18px}
  label{display:block;font-weight:600;margin-bottom:6px;color:#374151}
  input,select{width:100%;padding:11px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:15px;outline:none;transition:border-color .2s}
  input:focus,select:focus{border-color:#16a34a}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  @media(max-width:480px){.row{grid-template-columns:1fr}}
  .fg{margin-bottom:16px}
  .sex-row{display:flex;gap:12px;margin-bottom:16px}
  .sex-btn{flex:1;padding:10px;border:2px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer;font-size:15px;font-weight:600;transition:all .2s;color:#374151}
  .sex-btn.active{background:#16a34a;border-color:#16a34a;color:#fff}
  button.calc{width:100%;padding:13px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s}
  button.calc:hover{background:#15803d}
  .unit-toggle{display:flex;gap:8px;margin-bottom:16px}
  .unit-btn{padding:6px 16px;border:2px solid #e5e7eb;border-radius:20px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;color:#374151}
  .unit-btn.active{background:#16a34a;border-color:#16a34a;color:#fff}
  .results{display:none}
  .bmi-meter{margin:16px 0}
  .meter-bar{height:16px;border-radius:8px;background:linear-gradient(to right,#60a5fa,#34d399,#fbbf24,#f87171);position:relative}
  .meter-needle{position:absolute;top:-6px;width:4px;height:28px;background:#111;border-radius:2px;transform:translateX(-50%);transition:left .5s}
  .meter-labels{display:flex;justify-content:space-between;font-size:11px;color:#888;margin-top:4px}
  .bmi-val{text-align:center;font-size:3em;font-weight:800;margin:8px 0 2px}
  .bmi-cat{text-align:center;font-size:1.1em;font-weight:600;margin-bottom:12px}
  .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .stat{background:#f0fdf4;border-radius:10px;padding:14px;text-align:center}
  .stat-val{font-size:1.35em;font-weight:700;color:#16a34a}
  .stat-lbl{font-size:.78em;color:#666;margin-top:3px}
  .activity-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
  .act-btn{padding:7px 14px;border:2px solid #e5e7eb;border-radius:20px;background:#fff;cursor:pointer;font-size:12px;font-weight:600;transition:all .2s;color:#374151}
  .act-btn.active{background:#16a34a;border-color:#16a34a;color:#fff}
</style>
</head>
<body>
<div class="wrap">
  <h1>⚖️ BMI & BMR Calculator</h1>
  <p class="sub">Body Mass Index · Basal Metabolic Rate · Daily Calories</p>

  <div class="card">
    <div class="unit-toggle">
      <button class="unit-btn active" onclick="setUnit('metric')">Metric (kg/cm)</button>
      <button class="unit-btn" onclick="setUnit('imperial')">Imperial (lb/in)</button>
    </div>

    <div class="row">
      <div class="fg" id="wrapWeight">
        <label id="lblWeight">Weight (kg)</label>
        <input type="number" id="weight" min="1" step="0.1" placeholder="70">
      </div>
      <div class="fg" id="wrapHeight">
        <label id="lblHeight">Height (cm)</label>
        <input type="number" id="height" min="1" step="0.1" placeholder="170">
      </div>
    </div>

    <div class="row">
      <div class="fg">
        <label>Age (years)</label>
        <input type="number" id="age" min="1" max="120" step="1" placeholder="30">
      </div>
      <div class="fg">
        <label>Sex</label>
        <div class="sex-row">
          <button class="sex-btn active" id="btnMale" onclick="setSex('male')">♂ Male</button>
          <button class="sex-btn" id="btnFemale" onclick="setSex('female')">♀ Female</button>
        </div>
      </div>
    </div>

    <label style="margin-bottom:8px">Activity Level</label>
    <div class="activity-pills">
      <button class="act-btn active" onclick="setActivity('sedentary','Sedentary')">Sedentary</button>
      <button class="act-btn" onclick="setActivity('light','Light')">Light</button>
      <button class="act-btn" onclick="setActivity('moderate','Moderate')">Moderate</button>
      <button class="act-btn" onclick="setActivity('active','Active')">Active</button>
      <button class="act-btn" onclick="setActivity('veryActive','Very Active')">Very Active</button>
    </div>

    <button class="calc" onclick="calculate()">Calculate</button>
  </div>

  <div class="card results" id="results">
    <div class="bmi-val" id="r-bmi">—</div>
    <div class="bmi-cat" id="r-cat">—</div>
    <div class="bmi-meter">
      <div class="meter-bar"><div class="meter-needle" id="needle" style="left:10%"></div></div>
      <div class="meter-labels"><span>Underweight<br>&lt;18.5</span><span>Normal<br>18.5–24.9</span><span>Overweight<br>25–29.9</span><span>Obese<br>≥30</span></div>
    </div>
    <div class="stats-grid" style="margin-top:16px">
      <div class="stat"><div class="stat-val" id="r-bmr">—</div><div class="stat-lbl">BMR (kcal/day)</div></div>
      <div class="stat"><div class="stat-val" id="r-tdee">—</div><div class="stat-lbl">TDEE (kcal/day)</div></div>
      <div class="stat"><div class="stat-val" id="r-ideal">—</div><div class="stat-lbl">Ideal Weight Range (kg)</div></div>
      <div class="stat"><div class="stat-val" id="r-lose">—</div><div class="stat-lbl">Deficit to Lose 0.5 kg/wk</div></div>
    </div>
  </div>
</div>
<script>
let unit='metric', sex='male', activity='sedentary';
function setUnit(u){
  unit=u;
  document.querySelectorAll('.unit-btn').forEach(b=>b.classList.toggle('active',b.textContent.includes(u==='metric'?'Metric':'Imperial')));
  document.getElementById('lblWeight').textContent=u==='metric'?'Weight (kg)':'Weight (lb)';
  document.getElementById('lblHeight').textContent=u==='metric'?'Height (cm)':'Height (in)';
}
function setSex(s){
  sex=s;
  document.getElementById('btnMale').classList.toggle('active',s==='male');
  document.getElementById('btnFemale').classList.toggle('active',s==='female');
}
function setActivity(a){
  activity=a;
  document.querySelectorAll('.act-btn').forEach(b=>b.classList.toggle('active',b.textContent.trim().toLowerCase().replace(' ','')===a.toLowerCase()));
}

async function calculate(){
  let w=parseFloat(document.getElementById('weight').value);
  let h=parseFloat(document.getElementById('height').value);
  const age=parseFloat(document.getElementById('age').value);
  if(!w||!h||!age){alert('Please fill in all fields.');return;}
  if(unit==='imperial'){w=w*0.453592;h=h*2.54;}
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weightKg:w,heightCm:h,ageYears:age,sex,activityLevel:activity})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  const catColors={Underweight:'#60a5fa','Normal weight':'#34d399',Overweight:'#fbbf24',Obese:'#f87171'};
  document.getElementById('r-bmi').textContent=d.bmi;
  document.getElementById('r-bmi').style.color=catColors[d.bmiCategory]||'#16a34a';
  document.getElementById('r-cat').textContent=d.bmiCategory;
  document.getElementById('r-bmr').textContent=d.bmr.toLocaleString();
  document.getElementById('r-tdee').textContent=d.tdee.toLocaleString();
  document.getElementById('r-ideal').textContent=d.idealWeightRange.min+'–'+d.idealWeightRange.max;
  document.getElementById('r-lose').textContent=(d.tdee-500).toFixed(0)+' kcal';
  // Needle: BMI 10=0%, 40=100%
  const pct=Math.min(100,Math.max(0,(d.bmi-10)/30*100));
  document.getElementById('needle').style.left=pct+'%';
  document.getElementById('results').style.display='block';
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
