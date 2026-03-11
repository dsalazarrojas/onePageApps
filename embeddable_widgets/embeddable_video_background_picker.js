addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:460px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Video Background Picker</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}p{color:#555;font-size:.9rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input[type=url],input[type=text]{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}button{padding:9px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:12px;font-size:.9rem}#preview{position:relative;width:100%;height:220px;border-radius:10px;overflow:hidden;background:#111;margin:14px 0;display:none}#preview video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}#overlay{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;font-weight:600;font-family:sans-serif}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px;display:none}</style></head><body>
<h1>🎬 Video Background Picker</h1>
<p>Enter a direct MP4/WebM URL to preview and generate a CSS/HTML video background embed.</p>
<label>Video URL<input type="url" id="vurl" value="https://www.w3schools.com/html/mov_bbb.mp4"></label>
<div class="row2">
  <label>Overlay colour<input type="color" id="oc" value="#000000" style="height:36px"></label>
  <label>Overlay opacity (0–1)<input type="range" id="op" min="0" max="1" step="0.05" value="0.4" oninput="updateOverlay()"></label>
</div>
<label>Overlay text<input type="text" id="ot" value="Welcome"></label>
<button onclick="preview()">Preview</button>
<div id="preview"><video id="vid" autoplay muted loop playsinline></video><div id="overlay">Welcome</div></div>
<button onclick="gen()" style="background:#059669">Generate HTML Code</button>
<pre id="code"></pre>
<script>
function preview(){
  var url=document.getElementById('vurl').value;var ot=document.getElementById('ot').value;var oc=document.getElementById('oc').value;var op=document.getElementById('op').value;
  document.getElementById('vid').src=url;document.getElementById('overlay').textContent=ot;document.getElementById('overlay').style.background=hexToRgba(oc,op);
  document.getElementById('preview').style.display='block';
}
function updateOverlay(){var oc=document.getElementById('oc').value;var op=document.getElementById('op').value;document.getElementById('overlay').style.background=hexToRgba(oc,op);}
function hexToRgba(hex,a){var r=parseInt(hex.slice(1,3),16);var g=parseInt(hex.slice(3,5),16);var b=parseInt(hex.slice(5,7),16);return'rgba('+r+','+g+','+b+','+a+')';}
function gen(){
  var url=document.getElementById('vurl').value;var ot=document.getElementById('ot').value;var oc=document.getElementById('oc').value;var op=document.getElementById('op').value;
  var code='<div class="video-bg">\\n  <video autoplay muted loop playsinline>\\n    <source src="'+url+'" type="video/mp4">\\n  </video>\\n  <div class="video-overlay">'+ot+'</div>\\n</div>\\n\\n<style>\\n.video-bg{position:relative;width:100%;height:100vh;overflow:hidden;}\\n.video-bg video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}\\n.video-overlay{position:absolute;inset:0;background:'+hexToRgba(oc,op)+';display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;font-weight:700;font-family:sans-serif;}\\n</style>';
  document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';
}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
