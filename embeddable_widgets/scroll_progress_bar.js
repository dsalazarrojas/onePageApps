addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return '(function(){var s=document.currentScript;var color=(s&&s.dataset.color)||"#1a73e8";var height=Number((s&&s.dataset.height)||4);var bar=document.createElement("div");bar.id="scroll-progress-bar";bar.style.cssText="position:fixed;top:0;left:0;width:0%;height:"+height+"px;background:"+color+";z-index:99997;transition:width .1s linear;pointer-events:none;";document.body.appendChild(bar);function update(){var doc=document.documentElement;var st=window.scrollY||doc.scrollTop;var sh=doc.scrollHeight-doc.clientHeight;bar.style.width=(sh>0?Math.min(100,(st/sh)*100):0)+"%";}window.addEventListener("scroll",update,{passive:true});update();})()'  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Scroll Progress Bar</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}p{font-size:.9rem;color:#555}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>📊 Scroll Progress Bar</h1>
<p>Adds a fixed progress bar at the top of the page that fills as users scroll.</p>
<label>Colour<input id="c" type="color" value="#1a73e8" style="height:38px"></label>
<label>Height (px)<input id="h" type="number" value="4" min="1" max="20"></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-color="'+document.getElementById('c').value+'" data-height="'+document.getElementById('h').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
