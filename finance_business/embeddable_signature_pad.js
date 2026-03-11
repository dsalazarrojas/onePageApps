addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:340px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signature Pad</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}.toolbar{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center}button{padding:7px 14px;border:none;border-radius:6px;cursor:pointer;font-size:.85rem}.clear{background:#6b7280;color:#fff}.download{background:#1a73e8;color:#fff}canvas{display:block;border:2px solid #d1d5db;border-radius:8px;background:#fff;cursor:crosshair;width:100%;max-width:560px;height:180px}label{font-size:.8rem;color:#555}</style></head><body>
<h1>✍️ Signature Pad</h1>
<div class="toolbar">
  <label>Pen colour: <input type="color" id="clr" value="#000000" style="height:28px;padding:2px;border-radius:4px;border:1px solid #ccc"></label>
  <label>Thickness: <input type="range" id="thick" min="1" max="10" value="2" style="width:80px"></label>
  <button class="clear" onclick="clear()">Clear</button>
  <button class="download" onclick="download()">Download PNG</button>
</div>
<canvas id="pad" width="560" height="180"></canvas>
<script>
var c=document.getElementById('pad');var ctx=c.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';
var drawing=false;var last={x:0,y:0};
function pt(e){var r=c.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:(t.clientX-r.left)*(c.width/r.width),y:(t.clientY-r.top)*(c.height/r.height)};}
c.addEventListener('mousedown',function(e){drawing=true;last=pt(e);});
c.addEventListener('mousemove',function(e){if(!drawing)return;var p=pt(e);ctx.strokeStyle=document.getElementById('clr').value;ctx.lineWidth=document.getElementById('thick').value;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;});
c.addEventListener('mouseup',function(){drawing=false;});
c.addEventListener('touchstart',function(e){e.preventDefault();drawing=true;last=pt(e);},{passive:false});
c.addEventListener('touchmove',function(e){e.preventDefault();if(!drawing)return;var p=pt(e);ctx.strokeStyle=document.getElementById('clr').value;ctx.lineWidth=document.getElementById('thick').value;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;},{passive:false});
c.addEventListener('touchend',function(){drawing=false;});
function clear(){ctx.clearRect(0,0,c.width,c.height);}
function download(){var a=document.createElement('a');a.download='signature.png';a.href=c.toDataURL();a.click();}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
