addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { password } = await request.json();
    if (typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing required field: password (string)' }), { status: 400, headers: jsonHeaders() });
    }

    const checks = {
      length8:       password.length >= 8,
      length12:      password.length >= 12,
      length16:      password.length >= 16,
      hasLower:      /[a-z]/.test(password),
      hasUpper:      /[A-Z]/.test(password),
      hasDigit:      /[0-9]/.test(password),
      hasSymbol:     /[^a-zA-Z0-9]/.test(password),
      noRepeats:     !/(.)\1{2,}/.test(password),
      noCommon:      !isCommon(password),
      noSequential:  !hasSequential(password),
    };

    let score = 0;
    if (checks.length8)      score += 10;
    if (checks.length12)     score += 15;
    if (checks.length16)     score += 15;
    if (checks.hasLower)     score += 10;
    if (checks.hasUpper)     score += 10;
    if (checks.hasDigit)     score += 10;
    if (checks.hasSymbol)    score += 15;
    if (checks.noRepeats)    score += 5;
    if (checks.noCommon)     score += 5;
    if (checks.noSequential) score += 5;

    // Entropy estimate
    let charsetSize = 0;
    if (checks.hasLower)  charsetSize += 26;
    if (checks.hasUpper)  charsetSize += 26;
    if (checks.hasDigit)  charsetSize += 10;
    if (checks.hasSymbol) charsetSize += 32;
    if (charsetSize === 0) charsetSize = 26;
    const entropy = Math.round(password.length * Math.log2(charsetSize));

    // Crack time estimate (guesses at 1 billion/sec)
    const combos = Math.pow(charsetSize, password.length);
    const seconds = combos / 1e9 / 2;
    const crackTime = formatTime(seconds);

    let label, color;
    if (score < 30)      { label = 'Very Weak';  color = '#ef4444'; }
    else if (score < 50) { label = 'Weak';        color = '#f97316'; }
    else if (score < 70) { label = 'Fair';        color = '#eab308'; }
    else if (score < 85) { label = 'Strong';      color = '#22c55e'; }
    else                 { label = 'Very Strong'; color = '#10b981'; }

    return new Response(JSON.stringify({ score, label, color, entropy, crackTime, checks, length: password.length }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

const COMMON_PASSWORDS = new Set(['password','123456','12345678','qwerty','abc123','monkey','1234567','letmein','trustno1','dragon','baseball','iloveyou','master','sunshine','ashley','bailey','passw0rd','shadow','123123','654321','superman','qazwsx','michael','football','password1','password123','welcome','login','admin','solo','princess','azerty','000000','passw0rd','1234567890']);
function isCommon(pw) { return COMMON_PASSWORDS.has(pw.toLowerCase()); }
function hasSequential(pw) {
  const seqs = ['0123456789','abcdefghijklmnopqrstuvwxyz','qwertyuiop','asdfghjkl','zxcvbnm'];
  const p = pw.toLowerCase();
  for (const s of seqs) {
    for (let i = 0; i < s.length - 2; i++) {
      if (p.includes(s.slice(i, i+3))) return true;
    }
  }
  return false;
}
function formatTime(secs) {
  if (secs < 1)         return 'instantly';
  if (secs < 60)        return Math.round(secs) + ' seconds';
  if (secs < 3600)      return Math.round(secs/60) + ' minutes';
  if (secs < 86400)     return Math.round(secs/3600) + ' hours';
  if (secs < 2592000)   return Math.round(secs/86400) + ' days';
  if (secs < 31536000)  return Math.round(secs/2592000) + ' months';
  if (secs < 3.15e10)   return Math.round(secs/31536000) + ' years';
  if (secs < 3.15e13)   return Math.round(secs/3.15e10) + ' thousand years';
  if (secs < 3.15e16)   return Math.round(secs/3.15e13) + ' million years';
  return 'centuries';
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Strength Visualizer</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#0f172a,#1e293b);min-height:100vh;padding:24px;color:#e2e8f0}
  .wrap{max-width:540px;margin:0 auto}
  h1{text-align:center;color:#a78bfa;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#94a3b8;margin-bottom:24px}
  .card{background:#1e293b;border-radius:16px;padding:24px;box-shadow:0 4px 30px rgba(0,0,0,.4);margin-bottom:18px;border:1px solid #334155}
  label{display:block;font-weight:600;margin-bottom:8px;color:#94a3b8}
  .pw-wrap{position:relative;margin-bottom:8px}
  input[type=text],input[type=password]{width:100%;padding:13px 48px 13px 16px;background:#0f172a;border:2px solid #334155;border-radius:8px;font-size:16px;outline:none;color:#e2e8f0;transition:border-color .2s;font-family:monospace;letter-spacing:.08em}
  input:focus{border-color:#a78bfa}
  .eye-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.2em;color:#94a3b8;padding:4px}
  .meter-wrap{margin:16px 0}
  .meter-bg{height:10px;background:#334155;border-radius:5px;overflow:hidden}
  .meter-fill{height:100%;border-radius:5px;transition:width .4s,background .4s;width:0}
  .strength-label{text-align:center;font-size:1.3em;font-weight:700;margin-top:8px;transition:color .3s}
  .stats-row{display:flex;justify-content:space-between;margin:12px 0;font-size:.85em;color:#94a3b8}
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}
  .check{display:flex;align-items:center;gap:8px;font-size:.85em;color:#94a3b8}
  .check.pass{color:#22c55e}
  .check.fail{color:#475569}
  .check-icon{font-size:1em;flex-shrink:0}
  .entropy-bar{margin:12px 0}
  .entropy-label{font-size:.8em;color:#94a3b8;margin-bottom:4px}
  .entropy-row{display:flex;align-items:center;gap:10px}
  .entropy-track{flex:1;height:8px;background:#334155;border-radius:4px;overflow:hidden}
  .entropy-fill{height:100%;background:linear-gradient(to right,#ef4444,#eab308,#22c55e);border-radius:4px;transition:width .4s}
  .entropy-val{font-size:.85em;font-weight:700;color:#a78bfa;min-width:50px;text-align:right}
  .crack-time{text-align:center;background:#0f172a;border-radius:10px;padding:12px;margin-top:12px;border:1px solid #334155}
  .crack-lbl{font-size:.75em;color:#64748b;margin-bottom:4px}
  .crack-val{font-size:1.1em;font-weight:700;color:#a78bfa}
</style>
</head>
<body>
<div class="wrap">
  <h1>🔐 Password Strength</h1>
  <p class="sub">Visualize the strength of any password in real time</p>

  <div class="card">
    <label>Enter Password</label>
    <div class="pw-wrap">
      <input type="password" id="pwInput" placeholder="Type a password…" oninput="analyze()" autocomplete="new-password">
      <button class="eye-btn" onclick="toggleVis()" title="Show/hide">👁</button>
    </div>

    <div class="meter-wrap">
      <div class="meter-bg"><div class="meter-fill" id="meterFill"></div></div>
    </div>
    <div class="strength-label" id="strengthLabel">—</div>

    <div class="stats-row">
      <span>Length: <strong id="pwLen">0</strong></span>
      <span>Score: <strong id="pwScore">0</strong>/100</span>
    </div>

    <div class="entropy-bar">
      <div class="entropy-label">Entropy</div>
      <div class="entropy-row">
        <div class="entropy-track"><div class="entropy-fill" id="entropyFill" style="width:0%"></div></div>
        <div class="entropy-val" id="entropyVal">0 bits</div>
      </div>
    </div>

    <div class="crack-time">
      <div class="crack-lbl">Estimated crack time @ 1 billion guesses/sec</div>
      <div class="crack-val" id="crackTime">—</div>
    </div>

    <div class="checks" id="checks"></div>
  </div>
</div>
<script>
const CHECK_LABELS = {
  length8:'At least 8 characters',length12:'At least 12 characters',length16:'At least 16 characters',
  hasLower:'Lowercase letters',hasUpper:'Uppercase letters',hasDigit:'Numbers',hasSymbol:'Special characters',
  noRepeats:'No repeated chars (3+)',noCommon:'Not a common password',noSequential:'No sequential patterns'
};
let debounce;
function analyze(){
  clearTimeout(debounce);
  debounce=setTimeout(async()=>{
    const pw=document.getElementById('pwInput').value;
    if(!pw){reset();return;}
    const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    const d=await res.json();
    if(d.error)return;
    document.getElementById('meterFill').style.width=d.score+'%';
    document.getElementById('meterFill').style.background=d.color;
    document.getElementById('strengthLabel').textContent=d.label;
    document.getElementById('strengthLabel').style.color=d.color;
    document.getElementById('pwLen').textContent=d.length;
    document.getElementById('pwScore').textContent=d.score;
    document.getElementById('crackTime').textContent=d.crackTime;
    const epct=Math.min(100,Math.round(d.entropy/128*100));
    document.getElementById('entropyFill').style.width=epct+'%';
    document.getElementById('entropyVal').textContent=d.entropy+' bits';
    document.getElementById('checks').innerHTML=Object.entries(d.checks).map(([k,v])=>
      \`<div class="check \${v?'pass':'fail'}"><span class="check-icon">\${v?'✅':'⬜'}</span>\${CHECK_LABELS[k]||k}</div>\`
    ).join('');
  },120);
}
function reset(){
  document.getElementById('meterFill').style.width='0';
  document.getElementById('strengthLabel').textContent='—';
  document.getElementById('strengthLabel').style.color='#94a3b8';
  document.getElementById('pwLen').textContent='0';
  document.getElementById('pwScore').textContent='0';
  document.getElementById('crackTime').textContent='—';
  document.getElementById('entropyFill').style.width='0%';
  document.getElementById('entropyVal').textContent='0 bits';
  document.getElementById('checks').innerHTML='';
}
function toggleVis(){
  const i=document.getElementById('pwInput');
  i.type=i.type==='password'?'text':'password';
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
