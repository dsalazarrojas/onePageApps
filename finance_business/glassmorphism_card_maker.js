addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:480px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glassmorphism Card Maker</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:7px 10px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.scene{margin:20px 0;min-height:260px;border-radius:12px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;transition:all .2s}.glass{transition:all .2s;padding:28px 32px;font-family:sans-serif;position:relative}.glass-title{font-size:1.1rem;font-weight:600;margin:0 0 8px}.glass-desc{font-size:.85rem;opacity:.85;line-height:1.5}button.gen{padding:9px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:8px}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px;display:none}</style></head><body>
<h1>🔮 Glassmorphism Card Maker</h1>
<div class="row2">
  <label>Background gradient start<input type="color" id="bg1" value="#667eea" oninput="update()" style="height:36px"></label>
  <label>Background gradient end<input type="color" id="bg2" value="#764ba2" oninput="update()" style="height:36px"></label>
</div>
<label>Glass background opacity (0–1)<input type="range" id="opacity" value="0.15" min="0.05" max="0.9" step="0.01" oninput="update()"></label>
<label>Blur (px)<input type="range" id="blur" value="10" min="2" max="40" oninput="update()"></label>
<label>Border opacity (0–1)<input type="range" id="bord" value="0.3" min="0" max="1" step="0.05" oninput="update()"></label>
<label>Border radius (px)<input type="number" id="r" value="16" min="0" max="80" oninput="update()"></label>
<label>Text colour<input type="color" id="tc" value="#ffffff" oninput="update()" style="height:36px"></label>
<div class="scene" id="scene">
  <div class="glass" id="glass">
    <div class="glass-title" id="gt">Glass Card</div>
    <div class="glass-desc" id="gd">A beautiful glassmorphism UI element with frosted glass effect.</div>
  </div>
</div>
<button class="gen" onclick="gen()">Copy CSS</button>
<pre id="code"></pre>
<script>
function update(){
  var bg1=document.getElementById('bg1').value;var bg2=document.getElementById('bg2').value;
  var op=document.getElementById('opacity').value;var blur=document.getElementById('blur').value;
  var bord=document.getElementById('bord').value;var r=document.getElementById('r').value;
  var tc=document.getElementById('tc').value;
  document.getElementById('scene').style.background='linear-gradient(135deg,'+bg1+','+bg2+')';
  var g=document.getElementById('glass');
  g.style.background='rgba(255,255,255,'+op+')';g.style.backdropFilter='blur('+blur+'px)';g.style.webkitBackdropFilter='blur('+blur+'px)';
  g.style.border='1px solid rgba(255,255,255,'+bord+')';g.style.borderRadius=r+'px';g.style.color=tc;
}
function gen(){
  var op=document.getElementById('opacity').value;var blur=document.getElementById('blur').value;var bord=document.getElementById('bord').value;var r=document.getElementById('r').value;var tc=document.getElementById('tc').value;
  var css='.glass-card {\\n  background: rgba(255,255,255,'+op+');\\n  backdrop-filter: blur('+blur+'px);\\n  -webkit-backdrop-filter: blur('+blur+'px);\\n  border: 1px solid rgba(255,255,255,'+bord+');\\n  border-radius: '+r+'px;\\n  color: '+tc+';\\n  padding: 28px 32px;\\n}';
  navigator.clipboard.writeText(css);var el=document.getElementById('code');el.textContent=css;el.style.display='block';
}
update();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
