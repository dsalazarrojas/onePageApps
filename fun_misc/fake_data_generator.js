addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { types = ['name', 'email', 'phone', 'address'], count = 5, locale = 'en' } = await request.json();
    if (count < 1 || count > 100) {
      return new Response(JSON.stringify({ error: 'count must be between 1 and 100' }), { status: 400, headers: jsonHeaders() });
    }

    const records = [];
    for (let i = 0; i < count; i++) {
      const record = {};
      for (const type of types) {
        switch (type) {
          case 'name': record.name = fakeName(); break;
          case 'firstName': record.firstName = fakeFirstName(); break;
          case 'lastName': record.lastName = fakeLastName(); break;
          case 'email': record.email = fakeEmail(); break;
          case 'phone': record.phone = fakePhone(); break;
          case 'address': record.address = fakeAddress(); break;
          case 'city': record.city = fakeCity(); break;
          case 'country': record.country = fakeCountry(); break;
          case 'company': record.company = fakeCompany(); break;
          case 'jobTitle': record.jobTitle = fakeJobTitle(); break;
          case 'username': record.username = fakeUsername(); break;
          case 'password': record.password = fakePassword(); break;
          case 'uuid': record.uuid = fakeUUID(); break;
          case 'ipv4': record.ipv4 = fakeIPv4(); break;
          case 'url': record.url = fakeURL(); break;
          case 'color': record.color = fakeColor(); break;
          case 'date': record.date = fakeDate(); break;
          case 'age': record.age = Math.floor(Math.random() * 63) + 18; break;
          case 'creditCard': record.creditCard = fakeCreditCard(); break;
          case 'lorem': record.lorem = fakeLorem(); break;
          default: record[type] = null;
        }
      }
      records.push(record);
    }

    return new Response(JSON.stringify({ records, count: records.length, types }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

// ---- Data generators ----
const firstNames = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Barbara','David','Susan','Richard','Jessica','Joseph','Sarah','Thomas','Karen','Charles','Lisa','Christopher','Nancy','Daniel','Betty','Matthew','Margaret','Anthony','Sandra','Mark','Ashley','Donald','Dorothy','Steven','Kimberly','Paul','Emily','Andrew','Donna','Joshua','Michelle','Kenneth','Carol','Kevin','Amanda','Brian','Melissa','George','Deborah','Timothy','Stephanie'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts'];
const cities = ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte','Indianapolis','San Francisco','Seattle','Denver','Nashville','Oklahoma City','Boston','Miami','Portland','Las Vegas'];
const countries = ['United States','Canada','United Kingdom','Australia','Germany','France','Japan','Brazil','India','Mexico'];
const companies = ['Tech Solutions','Global Ventures','Alpha Industries','Bright Future LLC','Nexus Corp','Omega Systems','BlueSky Innovations','ClearPath Ltd','Summit Group','Apex Dynamics'];
const jobTitles = ['Software Engineer','Product Manager','Data Analyst','UX Designer','Marketing Manager','Sales Representative','DevOps Engineer','Business Analyst','Project Manager','Full Stack Developer','Content Strategist','HR Manager','Financial Analyst','Operations Manager','Customer Success Manager'];
const streets = ['Main St','Oak Ave','Maple Dr','Cedar Ln','Pine Rd','Elm St','Washington Blvd','Park Ave','Lake Dr','River Rd','Hill Ct','Valley Way','Forest Path','Sunset Blvd','Harbor View'];
const adjectives = ['quick','lazy','happy','bright','bold','calm','clever','fancy','gentle','jolly'];
const animals = ['fox','bear','wolf','hawk','owl','deer','lion','tiger','eagle','shark'];
const domains = ['gmail.com','yahoo.com','outlook.com','hotmail.com','proton.me','icloud.com','example.com'];
const tlds = ['.com','.net','.org','.io','.co'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fakeFirstName() { return rand(firstNames); }
function fakeLastName() { return rand(lastNames); }
function fakeName() { return fakeFirstName() + ' ' + fakeLastName(); }
function fakeEmail() { const fn = fakeFirstName().toLowerCase(); const ln = fakeLastName().toLowerCase(); return fn + '.' + ln + randInt(1,999) + '@' + rand(domains); }
function fakePhone() { return '+1-' + randInt(200,999) + '-' + randInt(200,999) + '-' + randInt(1000,9999); }
function fakeCity() { return rand(cities); }
function fakeCountry() { return rand(countries); }
function fakeAddress() { return randInt(100,9999) + ' ' + rand(streets) + ', ' + fakeCity() + ', ' + rand(['CA','NY','TX','FL','IL','WA','CO','OR']) + ' ' + randInt(10000,99999); }
function fakeCompany() { return rand(companies); }
function fakeJobTitle() { return rand(jobTitles); }
function fakeUsername() { return rand(adjectives) + '_' + rand(animals) + randInt(10,999); }
function fakePassword() { const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'; let p=''; for(let i=0;i<14;i++) p+=chars[randInt(0,chars.length-1)]; return p; }
function fakeUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r=randInt(0,15); return (c==='x'?r:(r&0x3|0x8)).toString(16); }); }
function fakeIPv4() { return [randInt(1,254),randInt(0,255),randInt(0,255),randInt(1,254)].join('.'); }
function fakeURL() { return 'https://' + rand(adjectives) + rand(animals) + tlds[randInt(0,tlds.length-1)]; }
function fakeColor() { return '#' + randInt(0,16777215).toString(16).padStart(6,'0').toUpperCase(); }
function fakeDate() { const d=new Date(Date.now() - randInt(0, 30)*365*86400000); return d.toISOString().split('T')[0]; }
function fakeCreditCard() { const prefix=rand(['4','5','3']); let num=prefix; while(num.length<16) num+=randInt(0,9); return num.replace(/(.{4})/g,'$1 ').trim(); }
function fakeLorem() { const words=['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','ut','enim','ad','minim','veniam']; let s=''; for(let i=0;i<randInt(12,25);i++) s+=(i?(' '+words[randInt(0,words.length-1)]):words[randInt(0,words.length-1)].charAt(0).toUpperCase()+words[randInt(0,words.length-1)].slice(1)); return s+'.'; }

function serveMainPage() {
  const allTypes = ['name','firstName','lastName','email','phone','address','city','country','company','jobTitle','username','password','uuid','ipv4','url','color','date','age','creditCard','lorem'];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fake Data Generator</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#fff1f2,#ffe4e6);min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:800px;margin:0 auto}
  h1{text-align:center;color:#e11d48;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:18px}
  .types-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
  .type-chip{padding:7px 15px;border:2px solid #e5e7eb;border-radius:20px;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;background:#fff;color:#374151;user-select:none}
  .type-chip.active{background:#e11d48;border-color:#e11d48;color:#fff}
  .row{display:flex;align-items:center;gap:14px;margin-bottom:20px}
  label{font-weight:600;color:#374151;white-space:nowrap}
  input[type=number]{width:90px;padding:9px 12px;border:2px solid #e5e7eb;border-radius:8px;font-size:15px;outline:none}
  input[type=number]:focus{border-color:#e11d48}
  .btn-row{display:flex;gap:10px}
  button{flex:1;padding:12px;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s}
  .btn-gen{background:#e11d48;color:#fff}
  .btn-gen:hover{background:#be123c}
  .btn-copy{background:#f1f5f9;color:#374151}
  .btn-copy:hover{background:#e2e8f0}
  .btn-csv{background:#f1f5f9;color:#374151}
  .results{display:none;overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:.85em}
  th{background:#e11d48;color:#fff;padding:9px 12px;text-align:left;white-space:nowrap}
  td{padding:8px 12px;border-bottom:1px solid #f0f0f0;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}
  tr:nth-child(even){background:#fff1f2}
  .top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .count-badge{background:#e11d48;color:#fff;border-radius:20px;padding:3px 12px;font-size:.85em;font-weight:700}
</style>
</head>
<body>
<div class="wrap">
  <h1>🎭 Fake Data Generator</h1>
  <p class="sub">Generate realistic test data instantly — no real people involved</p>
  <div class="card">
    <p style="font-weight:600;margin-bottom:10px;color:#374151">Select fields to generate:</p>
    <div class="types-grid" id="typesGrid"></div>
    <div class="row">
      <label>Rows:</label>
      <input type="number" id="count" min="1" max="100" value="10">
    </div>
    <div class="btn-row">
      <button class="btn-gen" onclick="generate()">⚡ Generate</button>
      <button class="btn-copy" onclick="copyJSON()">📋 Copy JSON</button>
      <button class="btn-csv" onclick="downloadCSV()">⬇ CSV</button>
    </div>
  </div>
  <div class="card results" id="results">
    <div class="top-bar"><span style="font-weight:700;color:#374151">Results</span><span class="count-badge" id="r-count">0 rows</span></div>
    <div style="overflow-x:auto"><table id="dataTable"><thead id="thead"></thead><tbody id="tbody"></tbody></table></div>
  </div>
</div>
<script>
const allTypes=${JSON.stringify(allTypes)};
let selectedTypes=['name','email','phone','address'];
let lastData=null;

function initChips(){
  const grid=document.getElementById('typesGrid');
  grid.innerHTML='';
  allTypes.forEach(t=>{
    const chip=document.createElement('div');
    chip.className='type-chip'+(selectedTypes.includes(t)?' active':'');
    chip.textContent=t;
    chip.onclick=()=>{
      if(selectedTypes.includes(t)) selectedTypes=selectedTypes.filter(x=>x!==t);
      else selectedTypes.push(t);
      chip.classList.toggle('active',selectedTypes.includes(t));
    };
    grid.appendChild(chip);
  });
}
initChips();

async function generate(){
  if(!selectedTypes.length){alert('Select at least one field.');return;}
  const count=parseInt(document.getElementById('count').value)||10;
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({types:selectedTypes,count})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  lastData=d.records;
  renderTable(d.records,selectedTypes);
  document.getElementById('r-count').textContent=d.count+' rows';
  document.getElementById('results').style.display='block';
}

function renderTable(records,types){
  document.getElementById('thead').innerHTML='<tr>'+['#',...types].map(h=>\`<th>\${h}</th>\`).join('')+'</tr>';
  document.getElementById('tbody').innerHTML=records.map((r,i)=>'<tr><td>'+(i+1)+'</td>'+types.map(t=>\`<td title="\${r[t]||''}">\${r[t]||''}</td>\`).join('')+'</tr>').join('');
}

function copyJSON(){
  if(!lastData){alert('Generate data first.');return;}
  navigator.clipboard.writeText(JSON.stringify(lastData,null,2)).then(()=>alert('Copied to clipboard!'));
}

function downloadCSV(){
  if(!lastData){alert('Generate data first.');return;}
  const types=selectedTypes;
  let csv=types.join(',')+'\n';
  lastData.forEach(r=>{csv+=types.map(t=>'"'+(r[t]||'').toString().replace(/"/g,'""')+'"').join(',')+'\n';});
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='fake_data.csv';
  a.click();
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
