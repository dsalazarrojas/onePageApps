addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:480px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Neumorphism Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:7px 10px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}.preview-wrap{margin:20px 0;display:flex;align-items:center;justify-content:center;min-height:200px;border-radius:10px;transition:background .2s}#card{transition:all .2s;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9rem;color:#606060;font-weight:600;user-select:none}button.gen{padding:9px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:8px}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px;display:none}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}</style></head><body>
<h1>🌑 Neumorphism Generator</h1>
<label>Background colour<input type="color" id="bg" value="#e0e5ec" oninput="update()" style="height:38px"></label>
<div class="row3">
  <label>Width (px)<input type="number" id="w" value="200" min="40" max="600" oninput="update()"></label>
  <label>Height (px)<input type="number" id="h" value="200" min="40" max="600" oninput="update()"></label>
  <label>Radius (px)<input type="number" id="r" value="30" min="0" max="300" oninput="update()"></label>
</div>
<label>Blur (px)<input type="range" id="blur" value="20" min="1" max="60" oninput="update()"></label>
<label>Distance (px)<input type="range" id="dist" value="10" min="1" max="40" oninput="update()"></label>
<label>Intensity (0–1)<input type="range" id="int" value="0.25" min="0.05" max="0.5" step="0.01" oninput="update()"></label>
<div class="preview-wrap" id="wrap">
  <div id="card">Card</div>
</div>
<button class="gen" onclick="copy()">Copy CSS</button>
<pre id="code"></pre>
<script>
function adjustColor(hex,delta){var n=parseInt(hex.slice(1),16);var r=Math.min(255,Math.max(0,((n>>16)&255)+delta));var g=Math.min(255,Math.max(0,((n>>8)&255)+delta));var b=Math.min(255,Math.max(0,(n&255)+delta));return'#'+[r,g,b].map(function(v){return v.toString(16).padStart(2,'0');}).join('');}
function update(){
  var bg=document.getElementById('bg').value;
  var w=document.getElementById('w').value;var h=document.getElementById('h').value;var r=document.getElementById('r').value;
  var blur=document.getElementById('blur').value;var dist=document.getElementById('dist').value;var intens=parseFloat(document.getElementById('int').value);
  var dark=adjustColor(bg,-Math.round(intens*220));var light=adjustColor(bg,Math.round(intens*220));
  var shadow=dist+'px '+dist+'px '+blur+'px '+dark+', -'+dist+'px -'+dist+'px '+blur+'px '+light;
  document.getElementById('wrap').style.background=bg;
  var card=document.getElementById('card');
  card.style.cssText='width:'+w+'px;height:'+h+'px;border-radius:'+r+'px;background:'+bg+';box-shadow:'+shadow+';display:flex;align-items:center;justify-content:center;font-size:.9rem;color:#606060;font-weight:600;transition:all .2s';
}
function copy(){
  var bg=document.getElementById('bg').value;var w=document.getElementById('w').value;var h=document.getElementById('h').value;var r=document.getElementById('r').value;var blur=document.getElementById('blur').value;var dist=document.getElementById('dist').value;var intens=parseFloat(document.getElementById('int').value);
  var dark=adjustColor(bg,-Math.round(intens*220));var light=adjustColor(bg,Math.round(intens*220));
  var shadow=dist+'px '+dist+'px '+blur+'px '+dark+', -'+dist+'px -'+dist+'px '+blur+'px '+light;
  var css='.neumorphic {\\n  width: '+w+'px;\\n  height: '+h+'px;\\n  border-radius: '+r+'px;\\n  background: '+bg+';\\n  box-shadow: '+shadow+';\\n}';
  navigator.clipboard.writeText(css);
  var el=document.getElementById('code');el.textContent=css;el.style.display='block';
}
update();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
