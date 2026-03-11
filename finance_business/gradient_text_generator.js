addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:460px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gradient Text Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input[type=text],input[type=number],select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.preview{margin:16px 0;padding:20px;background:#1e1e2e;border-radius:10px;text-align:center;word-break:break-word}button{padding:8px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.88rem;margin-top:8px}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px;display:none}</style></head><body>
<h1>🌈 Gradient Text Generator</h1>
<label>Text<input type="text" id="txt" value="Hello, World!" oninput="preview()"></label>
<div class="row2">
  <label>From colour<input type="color" id="c1" value="#667eea" oninput="preview()" style="height:38px"></label>
  <label>To colour<input type="color" id="c2" value="#764ba2" oninput="preview()" style="height:38px"></label>
</div>
<label>Font size (px)<input type="number" id="fs" value="48" min="12" max="200" oninput="preview()"></label>
<label>Font weight<select id="fw" onchange="preview()"><option value="400">Normal</option><option value="600">Semi Bold</option><option value="700" selected>Bold</option><option value="800">Extra Bold</option><option value="900">Black</option></select></label>
<label>Angle (deg)<input type="number" id="angle" value="135" min="0" max="360" oninput="preview()"></label>
<div class="preview" id="pv"></div>
<button onclick="gen()">Copy CSS</button>
<pre id="code"></pre>
<script>
function preview(){
  var txt=document.getElementById('txt').value||'Hello!';
  var c1=document.getElementById('c1').value;
  var c2=document.getElementById('c2').value;
  var fs=document.getElementById('fs').value;
  var fw=document.getElementById('fw').value;
  var angle=document.getElementById('angle').value;
  var el=document.getElementById('pv');
  el.innerHTML='<span style="font-size:'+fs+'px;font-weight:'+fw+';background:linear-gradient('+angle+'deg,'+c1+','+c2+');-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">'+txt+'</span>';
}
function gen(){
  var c1=document.getElementById('c1').value;var c2=document.getElementById('c2').value;
  var fs=document.getElementById('fs').value;var fw=document.getElementById('fw').value;var angle=document.getElementById('angle').value;
  var css='.gradient-text {\\n  font-size: '+fs+'px;\\n  font-weight: '+fw+';\\n  background: linear-gradient('+angle+'deg, '+c1+', '+c2+');\\n  -webkit-background-clip: text;\\n  -webkit-text-fill-color: transparent;\\n  background-clip: text;\\n}';
  navigator.clipboard.writeText(css);
  var el=document.getElementById('code');el.textContent=css;el.style.display='block';
}
preview();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
