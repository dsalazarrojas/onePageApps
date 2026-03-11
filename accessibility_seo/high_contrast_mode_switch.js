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
  var cls=(s&&s.dataset.class)||'high-contrast';
  var pos=(s&&s.dataset.position)||'bottom-right';
  var v=pos.includes('bottom')?'bottom:72px;':'top:72px;';
  var h=pos.includes('right')?'right:20px;':'left:20px;';
  var active=localStorage.getItem('high_contrast')==='1';
  var style=document.createElement('style');
  style.textContent='.'+cls+'{filter:contrast(2) grayscale(.3)!important;}';
  document.head.appendChild(style);
  if(active)document.documentElement.classList.add(cls);
  var btn=document.createElement('button');
  btn.title='Toggle high contrast';
  btn.style.cssText='position:fixed;'+v+h+'z-index:99998;background:#1a1a2e;color:#fff;border:none;border-radius:6px;padding:7px 12px;font-size:11px;cursor:pointer;font-family:sans-serif;letter-spacing:.02em;';
  function render(){btn.textContent=active?'◑ Normal':'◑ High Contrast';}render();
  btn.onclick=function(){active=!active;document.documentElement.classList.toggle(cls,active);localStorage.setItem('high_contrast',active?'1':'0');render();};
  document.body.appendChild(btn);
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>High Contrast Mode Switch</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}p{color:#555;font-size:.9rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>◑ High Contrast Mode Switch</h1>
<p>Adds a toggle button that applies a CSS filter for enhanced contrast. Persists preference in <code>localStorage</code>.</p>
<label>CSS class name<input id="cls" value="high-contrast"></label>
<label>Position<select id="pos"><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option></select></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-class="'+document.getElementById('cls').value+'" data-position="'+document.getElementById('pos').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
