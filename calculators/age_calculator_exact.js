addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { birthdate, targetDate } = await request.json();
    if (!birthdate) {
      return new Response(JSON.stringify({ error: 'Missing required field: birthdate (YYYY-MM-DD)' }), { status: 400, headers: jsonHeaders() });
    }

    const birth = new Date(birthdate);
    const target = targetDate ? new Date(targetDate) : new Date();

    if (isNaN(birth.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid birthdate format. Use YYYY-MM-DD.' }), { status: 400, headers: jsonHeaders() });
    }
    if (birth > target) {
      return new Response(JSON.stringify({ error: 'birthdate must be before targetDate' }), { status: 400, headers: jsonHeaders() });
    }

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const diffMs = target - birth;
    const totalDays = Math.floor(diffMs / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = Math.floor(diffMs / 3600000);
    const totalMinutes = Math.floor(diffMs / 60000);

    // Next birthday
    let nextBirthday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday <= target) nextBirthday.setFullYear(target.getFullYear() + 1);
    const daysToNext = Math.ceil((nextBirthday - target) / 86400000);

    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    return new Response(JSON.stringify({
      years, months, days,
      totalDays, totalWeeks, totalHours, totalMinutes,
      birthDayOfWeek: dayNames[birth.getDay()],
      birthMonth: monthNames[birth.getMonth()],
      nextBirthday: nextBirthday.toISOString().split('T')[0],
      daysToNextBirthday: daysToNext,
      zodiacSign: getZodiac(birth.getMonth() + 1, birth.getDate()),
      chineseZodiac: getChineseZodiac(birth.getFullYear())
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function getZodiac(month, day) {
  const signs = [
    ['Capricorn','♑'], ['Aquarius','♒'], ['Pisces','♓'], ['Aries','♈'],
    ['Taurus','♉'], ['Gemini','♊'], ['Cancer','♋'], ['Leo','♌'],
    ['Virgo','♍'], ['Libra','♎'], ['Scorpio','♏'], ['Sagittarius','♐'], ['Capricorn','♑']
  ];
  const cutoffs = [20, 19, 20, 20, 21, 21, 22, 23, 23, 23, 22, 22];
  const idx = day <= cutoffs[month - 1] ? month - 1 : month;
  return signs[idx][1] + ' ' + signs[idx][0];
}

function getChineseZodiac(year) {
  const animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  return animals[(year - 4) % 12];
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Age Calculator</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#fdf4ff,#fae8ff);min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:500px;margin:0 auto}
  h1{text-align:center;color:#9333ea;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:18px}
  label{display:block;font-weight:600;margin-bottom:6px;color:#374151}
  input[type=date]{width:100%;padding:11px 14px;border:2px solid #e5e7eb;border-radius:8px;font-size:15px;outline:none;transition:border-color .2s;color:#374151}
  input[type=date]:focus{border-color:#9333ea}
  .fg{margin-bottom:16px}
  button{width:100%;padding:13px;background:#9333ea;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s}
  button:hover{background:#7e22ce}
  .results{display:none}
  .big-age{text-align:center;padding:24px 0 16px}
  .age-num{font-size:4em;font-weight:800;color:#9333ea}
  .age-lbl{font-size:.95em;color:#888;margin-top:4px}
  .detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
  @media(max-width:400px){.detail-grid{grid-template-columns:1fr 1fr}}
  .stat{background:#fdf4ff;border-radius:10px;padding:14px;text-align:center}
  .stat-val{font-size:1.25em;font-weight:700;color:#9333ea}
  .stat-lbl{font-size:.75em;color:#666;margin-top:3px}
  .fun-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .fun-stat{background:#fdf4ff;border-radius:10px;padding:14px}
  .fun-val{font-size:1.1em;font-weight:700;color:#7c3aed}
  .fun-lbl{font-size:.75em;color:#888;margin-top:3px}
  .next-bday{background:linear-gradient(135deg,#9333ea,#7c3aed);color:#fff;border-radius:12px;padding:18px;text-align:center;margin-bottom:12px}
  .next-val{font-size:1.8em;font-weight:800}
  .next-lbl{font-size:.85em;opacity:.85;margin-top:4px}
</style>
</head>
<body>
<div class="wrap">
  <h1>🎂 Age Calculator</h1>
  <p class="sub">Exact age in years, months, days and more</p>

  <div class="card">
    <div class="fg">
      <label>Date of Birth</label>
      <input type="date" id="birthdate" max="">
    </div>
    <div class="fg">
      <label>Calculate Age As Of</label>
      <input type="date" id="targetDate">
    </div>
    <button onclick="calculate()">Calculate Age</button>
  </div>

  <div id="results" class="results">
    <div class="card">
      <div class="big-age">
        <div class="age-num" id="r-years">—</div>
        <div class="age-lbl">years old</div>
      </div>
      <div class="detail-grid">
        <div class="stat"><div class="stat-val" id="r-months">—</div><div class="stat-lbl">months</div></div>
        <div class="stat"><div class="stat-val" id="r-days">—</div><div class="stat-lbl">days</div></div>
        <div class="stat"><div class="stat-val" id="r-totaldays">—</div><div class="stat-lbl">total days</div></div>
        <div class="stat"><div class="stat-val" id="r-weeks">—</div><div class="stat-lbl">total weeks</div></div>
        <div class="stat"><div class="stat-val" id="r-hours">—</div><div class="stat-lbl">total hours</div></div>
        <div class="stat"><div class="stat-val" id="r-mins">—</div><div class="stat-lbl">total minutes</div></div>
      </div>
    </div>
    <div class="card">
      <div class="next-bday">
        <div class="next-val" id="r-nextdays">—</div>
        <div class="next-lbl" id="r-nextlbl">days until next birthday</div>
      </div>
      <div class="fun-grid">
        <div class="fun-stat"><div class="fun-val" id="r-dow">—</div><div class="fun-lbl">Born on a</div></div>
        <div class="fun-stat"><div class="fun-val" id="r-zodiac">—</div><div class="fun-lbl">Zodiac Sign</div></div>
        <div class="fun-stat"><div class="fun-val" id="r-chinese">—</div><div class="fun-lbl">Chinese Zodiac</div></div>
        <div class="fun-stat"><div class="fun-val" id="r-nextdate">—</div><div class="fun-lbl">Next Birthday</div></div>
      </div>
    </div>
  </div>
</div>
<script>
const today=new Date().toISOString().split('T')[0];
document.getElementById('birthdate').max=today;
document.getElementById('targetDate').value=today;
document.getElementById('targetDate').max=today;

async function calculate(){
  const birthdate=document.getElementById('birthdate').value;
  const targetDate=document.getElementById('targetDate').value;
  if(!birthdate){alert('Please enter your date of birth.');return;}
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({birthdate,targetDate:targetDate||undefined})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  document.getElementById('r-years').textContent=d.years;
  document.getElementById('r-months').textContent=d.months;
  document.getElementById('r-days').textContent=d.days;
  document.getElementById('r-totaldays').textContent=d.totalDays.toLocaleString();
  document.getElementById('r-weeks').textContent=d.totalWeeks.toLocaleString();
  document.getElementById('r-hours').textContent=d.totalHours.toLocaleString();
  document.getElementById('r-mins').textContent=d.totalMinutes.toLocaleString();
  document.getElementById('r-nextdays').textContent=d.daysToNextBirthday===0?'🎉 Today!':d.daysToNextBirthday;
  document.getElementById('r-nextlbl').textContent=d.daysToNextBirthday===0?'Happy Birthday!':'days until next birthday';
  document.getElementById('r-dow').textContent=d.birthDayOfWeek;
  document.getElementById('r-zodiac').textContent=d.zodiacSign;
  document.getElementById('r-chinese').textContent=d.chineseZodiac;
  document.getElementById('r-nextdate').textContent=d.nextBirthday;
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
