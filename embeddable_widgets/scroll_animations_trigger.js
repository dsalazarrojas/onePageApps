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
  var sel=(s&&s.dataset.selector)||'[data-animate]';
  var anim=(s&&s.dataset.animation)||'fadeInUp';
  var threshold=Number((s&&s.dataset.threshold)||0.15);
  var style=document.createElement('style');
  style.textContent=[
    '.sa-hidden{opacity:0;transform:translateY(30px);transition:opacity .6s ease,transform .6s ease;}',
    '.sa-fadeInUp{opacity:1!important;transform:translateY(0)!important;}',
    '.sa-fadeIn{opacity:1!important;transform:none!important;}',
    '.sa-slideInLeft{opacity:1!important;transform:translateX(0)!important;}',
    '.sa-slideInRight{opacity:1!important;transform:translateX(0)!important;}'
  ].join('');
  document.head.appendChild(style);
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('sa-'+(e.target.dataset.animation||anim));observer.unobserve(e.target);}});
  },{threshold:threshold});
  function init(){document.querySelectorAll(sel).forEach(function(el){el.classList.add('sa-hidden');observer.observe(el);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scroll Animations Trigger</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}.card{background:#fff;border-radius:8px;padding:20px;margin:12px 0;border:1px solid #e5e7eb}</style></head><body>
<h1>✨ Scroll Animations Trigger</h1>
<label>CSS selector (elements to animate)<input id="sel" value="[data-animate]"></label>
<label>Default animation<select id="anim"><option value="fadeInUp">Fade In Up</option><option value="fadeIn">Fade In</option><option value="slideInLeft">Slide In Left</option><option value="slideInRight">Slide In Right</option></select></label>
<label>Intersection threshold (0–1)<input id="th" type="number" value="0.15" min="0" max="1" step="0.05"></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<p>After embedding, add <code>data-animate</code> to any element:</p>
<pre style="display:block">&lt;div data-animate&gt;This will animate in&lt;/div&gt;
&lt;div data-animate data-animation="slideInLeft"&gt;Custom animation&lt;/div&gt;</pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-selector="'+document.getElementById('sel').value+'" data-animation="'+document.getElementById('anim').value+'" data-threshold="'+document.getElementById('th').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
