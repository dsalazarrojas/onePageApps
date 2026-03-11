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
  var min=Number((s&&s.dataset.min)||80);
  var max=Number((s&&s.dataset.max)||140);
  var step=Number((s&&s.dataset.step)||10);
  var pos=(s&&s.dataset.position)||'bottom-right';
  var def=Number((s&&s.dataset.default)||100);
  var root=document.documentElement;
  var current=Number(localStorage.getItem('font_size_pct')||def);
  root.style.fontSize=current+'%';
  var wrap=document.createElement('div');
  var v=pos.includes('bottom')?'bottom:16px;':'top:16px;';
  var h=pos.includes('right')?'right:16px;':'left:16px;';
  wrap.style.cssText='position:fixed;'+v+h+'z-index:99998;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:4px 8px;display:flex;align-items:center;gap:4px;box-shadow:0 2px 10px rgba(0,0,0,.1);font-family:sans-serif;';
  function mkB(t,cb){var b=document.createElement('button');b.textContent=t;b.style.cssText='background:none;border:none;cursor:pointer;font-size:16px;padding:4px 6px;border-radius:50%;line-height:1;transition:background .15s;';b.onmouseenter=function(){this.style.background='#f3f4f6';};b.onmouseleave=function(){this.style.background='none';};b.onclick=cb;return b;}
  var lbl=document.createElement('span');lbl.style.cssText='font-size:12px;color:#6b7280;min-width:36px;text-align:center;';
  function update(){lbl.textContent=current+'%';root.style.fontSize=current+'%';localStorage.setItem('font_size_pct',current);}
  update();
  var dec=mkB('A-',function(){if(current>min){current-=step;update();}});
  var inc=mkB('A+',function(){if(current<max){current+=step;update();}});
  var rst=mkB('↺',function(){current=def;update();});
  rst.title='Reset';
  wrap.appendChild(dec);wrap.appendChild(lbl);wrap.appendChild(inc);wrap.appendChild(rst);
  document.body.appendChild(wrap);
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Font Size Adjuster Widget</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🔡 Font Size Adjuster Widget</h1>
<label>Min % <input id="mn" type="number" value="80"></label>
<label>Max % <input id="mx" type="number" value="140"></label>
<label>Step <input id="st" type="number" value="10"></label>
<label>Default % <input id="df" type="number" value="100"></label>
<label>Position<select id="pos"><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option></select></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-min="'+document.getElementById('mn').value+'" data-max="'+document.getElementById('mx').value+'" data-step="'+document.getElementById('st').value+'" data-default="'+document.getElementById('df').value+'" data-position="'+document.getElementById('pos').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
