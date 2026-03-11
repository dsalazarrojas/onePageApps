addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:400px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Particle Background Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:7px 10px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}canvas{width:100%;display:block;border-radius:10px;margin:14px 0}button.gen{padding:9px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:4px}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px;display:none}</style></head><body>
<h1>✨ Particle Background Generator</h1>
<div class="row3">
  <label>Background<input type="color" id="bg" value="#0f172a" oninput="restart()" style="height:36px"></label>
  <label>Particle colour<input type="color" id="pc" value="#3b82f6" oninput="restart()" style="height:36px"></label>
  <label>Count<input type="number" id="cnt" value="80" min="10" max="300" oninput="restart()"></label>
</div>
<div class="row3">
  <label>Min size<input type="number" id="mn" value="1" min="1" max="10" oninput="restart()"></label>
  <label>Max size<input type="number" id="mx" value="4" min="1" max="20" oninput="restart()"></label>
  <label>Speed<input type="range" id="spd" min="0.1" max="3" step="0.1" value="0.5" oninput="restart()"></label>
</div>
<canvas id="c" height="240"></canvas>
<button class="gen" onclick="gen()">Export JS snippet</button>
<pre id="code"></pre>
<script>
var raf,parts=[];
function start(){
  var c=document.getElementById('c');var ctx=c.getContext('2d');
  c.width=c.offsetWidth;c.height=240;
  var bg=document.getElementById('bg').value;var pc=document.getElementById('pc').value;
  var cnt=Math.min(300,Number(document.getElementById('cnt').value)||80);
  var mn=Number(document.getElementById('mn').value)||1;var mx=Number(document.getElementById('mx').value)||4;
  var spd=Number(document.getElementById('spd').value)||0.5;
  parts=Array.from({length:cnt},function(){return{x:Math.random()*c.width,y:Math.random()*c.height,r:mn+Math.random()*(mx-mn),vx:(Math.random()-0.5)*spd*2,vy:(Math.random()-0.5)*spd*2,a:0.3+Math.random()*0.7};});
  function draw(){
    ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
    parts.forEach(function(p){
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=pc+''+Math.round(p.a*255).toString(16).padStart(2,'0');ctx.fill();
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>c.width)p.vx=-p.vx;if(p.y<0||p.y>c.height)p.vy=-p.vy;
    });
    raf=requestAnimationFrame(draw);
  }
  if(raf)cancelAnimationFrame(raf);draw();
}
function restart(){start();}
function gen(){
  var bg=document.getElementById('bg').value;var pc=document.getElementById('pc').value;var cnt=document.getElementById('cnt').value;var spd=document.getElementById('spd').value;
  var code="/* Add to your page */\\nconst canvas=document.getElementById('particles');\\nconst ctx=canvas.getContext('2d');\\n/* bg:"+bg+", color:"+pc+", count:"+cnt+", speed:"+spd+" */\\n/* Full implementation: see particle_background_generator worker */";
  document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';
}
start();window.addEventListener('resize',restart);
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
