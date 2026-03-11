addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:540px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fake Data Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}select,input{padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:.88rem}input.count{width:70px}button{padding:8px 16px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.88rem}.copy-btn{background:#059669}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;max-height:340px;margin-top:0;white-space:pre-wrap}</style></head><body>
<h1>🎲 Fake Data Generator</h1>
<div class="toolbar">
  <select id="type">
    <option value="users">Users</option>
    <option value="emails">Email addresses</option>
    <option value="addresses">Addresses</option>
    <option value="uuids">UUIDs</option>
    <option value="colors">Hex colors</option>
    <option value="ips">IP addresses</option>
    <option value="dates">ISO dates</option>
    <option value="sentences">Sentences (Lorem)</option>
  </select>
  <input class="count" type="number" id="count" value="10" min="1" max="100">
  <select id="format"><option value="json">JSON</option><option value="csv">CSV</option><option value="list">List</option></select>
  <button onclick="gen()">Generate</button>
  <button class="copy-btn" onclick="copy()">Copy</button>
</div>
<pre id="out">Click Generate to create data.</pre>
<script>
var FIRST=['Alice','Bob','Carol','David','Emma','Frank','Grace','Henry','Iris','Jack','Kate','Liam','Mia','Noah','Olivia','Paul','Quinn','Rachel','Sam','Tina'];
var LAST=['Smith','Jones','Brown','Garcia','Miller','Davis','Wilson','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Lee','King','Wright','Scott','Green'];
var DOMAINS=['gmail.com','yahoo.com','outlook.com','example.com','company.io','mail.net'];
var STREETS=['Main St','Oak Ave','Maple Dr','Cedar Ln','Elm St','Pine Rd','Lake Blvd','Park Ave'];
var CITIES=['New York','Los Angeles','Chicago','Houston','Phoenix','Seattle','Boston','Austin','Denver','Miami'];
var STATES=['NY','CA','IL','TX','AZ','WA','MA','TX','CO','FL'];
var LOREM=['Lorem ipsum dolor sit amet','Consectetur adipiscing elit','Sed do eiusmod tempor incididunt','Ut labore et dolore magna aliqua','Ut enim ad minim veniam','Quis nostrud exercitation ullamco','Laboris nisi ut aliquip ex ea','Commodo consequat duis aute irure','Dolor in reprehenderit in voluptate','Velit esse cillum dolore eu fugiat'];
function rnd(arr){return arr[Math.floor(Math.random()*arr.length)];}
function rndInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function uuid(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:r&0x3|0x8).toString(16);});}
function gen(){
  var type=document.getElementById('type').value;
  var count=Math.min(100,Math.max(1,Number(document.getElementById('count').value)||10));
  var fmt=document.getElementById('format').value;
  var rows=[];
  for(var i=0;i<count;i++){
    var first=rnd(FIRST);var last=rnd(LAST);
    if(type==='users')rows.push({id:i+1,name:first+' '+last,email:first.toLowerCase()+'.'+last.toLowerCase()+'@'+rnd(DOMAINS),age:rndInt(18,75)});
    else if(type==='emails')rows.push(first.toLowerCase()+'.'+last.toLowerCase()+rndInt(1,999)+'@'+rnd(DOMAINS));
    else if(type==='addresses')rows.push({street:rndInt(1,9999)+' '+rnd(STREETS),city:rnd(CITIES),state:rnd(STATES),zip:String(rndInt(10000,99999))});
    else if(type==='uuids')rows.push(uuid());
    else if(type==='colors')rows.push('#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0'));
    else if(type==='ips')rows.push(rndInt(1,254)+'.'+rndInt(0,255)+'.'+rndInt(0,255)+'.'+rndInt(1,254));
    else if(type==='dates'){var d=new Date(Date.now()-rndInt(0,365*5)*86400000);rows.push(d.toISOString().slice(0,10));}
    else if(type==='sentences')rows.push(rnd(LOREM)+', '+rnd(LOREM).toLowerCase()+'.');
  }
  var out;
  if(fmt==='json')out=JSON.stringify(rows,null,2);
  else if(fmt==='csv'){
    if(typeof rows[0]==='object'){var keys=Object.keys(rows[0]);out=keys.join(',')+rows.map(function(r){return keys.map(function(k){return r[k];}).join(',');}).join('\\n');}
    else out=rows.join('\\n');
  }else out=rows.map(function(r){return typeof r==='object'?JSON.stringify(r):r;}).join('\\n');
  document.getElementById('out').textContent=out;
}
function copy(){navigator.clipboard.writeText(document.getElementById('out').textContent);}
gen();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
