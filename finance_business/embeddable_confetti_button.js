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
  var sel=(s&&s.dataset.selector)||'[data-confetti]';
  var colors=(s&&s.dataset.colors||'#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#ff922b').split(',');
  var count=Number((s&&s.dataset.count)||80);
  function burst(cx,cy){
    var canvas=document.createElement('canvas');
    canvas.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;';
    canvas.width=window.innerWidth;canvas.height=window.innerHeight;
    document.body.appendChild(canvas);
    var ctx=canvas.getContext('2d');
    var pieces=Array.from({length:count},function(){return{x:cx,y:cy,vx:(Math.random()-0.5)*12,vy:(Math.random()-1)*12,color:colors[Math.floor(Math.random()*colors.length)],w:8+Math.random()*8,h:4+Math.random()*4,rot:Math.random()*360,vrot:(Math.random()-0.5)*20,g:0.5+Math.random()*0.5,life:1};});
    var raf;
    function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);var alive=false;pieces.forEach(function(p){if(p.life<=0)return;alive=true;p.x+=p.vx;p.vy+=p.g;p.y+=p.vy;p.rot+=p.vrot;p.life-=0.015;ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});if(alive)raf=requestAnimationFrame(draw);else{cancelAnimationFrame(raf);canvas.remove();}}
    draw();
  }
  function attach(el){el.addEventListener('click',function(e){burst(e.clientX,e.clientY);});}
  function init(){document.querySelectorAll(sel).forEach(attach);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.Confetti={burst:burst,attach:attach};
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confetti Button</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:580px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.3rem}p{color:#555;font-size:.9rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input[type=text],input[type=number]{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}.demo-btn{margin:20px 0;padding:14px 32px;background:linear-gradient(135deg,#ff6b6b,#ffd93d);color:#fff;border:none;border-radius:10px;font-size:1.1rem;font-weight:700;cursor:pointer;border-color:transparent}button.gen{padding:9px 20px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:8px}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px;display:none}</style></head><body>
<h1>🎉 Confetti Button</h1>
<p>Click the button to see the effect. Add <code>data-confetti</code> to any element on your page.</p>
<button class="demo-btn" data-confetti>🎊 Click Me!</button>
<label>CSS selector<input type="text" id="sel" value="[data-confetti]"></label>
<label>Colours (comma-separated hex)<input type="text" id="clrs" value="#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#ff922b"></label>
<label>Particle count<input type="number" id="cnt" value="80" min="20" max="200"></label>
<button class="gen" onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script src="/widget.js"></script>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-selector="'+document.getElementById('sel').value+'" data-colors="'+document.getElementById('clrs').value+'" data-count="'+document.getElementById('cnt').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
