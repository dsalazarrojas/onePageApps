addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return `(function(){
  var s=document.currentScript;
  var placeholder=(s&&s.dataset.placeholder)||'Search…';
  var action=(s&&s.dataset.action)||'https://www.google.com/search';
  var param=(s&&s.dataset.param)||'q';
  var bg=(s&&s.dataset.bg)||'#fff';
  var accent=(s&&s.dataset.accent)||'#1a73e8';
  var wrap=document.createElement('form');
  wrap.action=action;wrap.method='get';
  wrap.style.cssText='display:flex;align-items:center;background:'+bg+';border:2px solid '+accent+';border-radius:50px;padding:6px 16px;gap:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);max-width:500px;';
  var input=document.createElement('input');
  input.name=param;input.placeholder=placeholder;
  input.style.cssText='border:none;outline:none;flex:1;font-size:.95rem;font-family:sans-serif;background:transparent;color:#1a1a2e;';
  var btn=document.createElement('button');btn.type='submit';
  btn.innerHTML="<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/></svg>";
  btn.style.cssText='background:'+accent+';color:#fff;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  wrap.appendChild(input);wrap.appendChild(btn);
  if(s&&s.parentNode)s.parentNode.insertBefore(wrap,s.nextSibling);else document.body.prepend(wrap);
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Embeddable Search Bar</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:580px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input[type=url],input[type=text]{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}button{margin-top:12px;padding:9px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.9rem}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px;display:none}</style></head><body>
<h1>🔍 Embeddable Search Bar</h1>
<label>Action URL<input type="url" id="act" value="https://www.google.com/search"></label>
<label>Query parameter name<input type="text" id="par" value="q"></label>
<label>Placeholder<input type="text" id="ph" value="Search…"></label>
<label>Accent colour<input type="color" id="acc" value="#1a73e8" style="height:36px"></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-action="'+document.getElementById('act').value+'" data-param="'+document.getElementById('par').value+'" data-placeholder="'+document.getElementById('ph').value+'" data-accent="'+document.getElementById('acc').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
