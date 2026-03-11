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
  var sel=(s&&s.dataset.selector)||'header,nav,[role=banner]';
  var stickyClass=(s&&s.dataset.stickyClass)||'is-sticky';
  var scrolledClass=(s&&s.dataset.scrolledClass)||'scrolled';
  var threshold=Number((s&&s.dataset.threshold)||80);
  var shadow=(s&&s.dataset.shadow)!=='false';
  var style=document.createElement('style');
  style.textContent='.'+stickyClass+'{position:sticky!important;top:0!important;z-index:1000!important;}'+
    (shadow?'.'+scrolledClass+'{box-shadow:0 2px 12px rgba(0,0,0,.15)!important;transition:box-shadow .3s;}':'');
  document.head.appendChild(style);
  var els=Array.from(document.querySelectorAll(sel));
  els.forEach(function(el){el.classList.add(stickyClass);});
  window.addEventListener('scroll',function(){
    var scrolled=window.scrollY>threshold;
    els.forEach(function(el){el.classList.toggle(scrolledClass,scrolled);});
  },{passive:true});
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sticky Header Customizer</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}p{color:#555;font-size:.9rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>📌 Sticky Header Customizer</h1>
<p>Makes any matching element sticky and adds a shadow class on scroll.</p>
<label>CSS selector(s)<input id="sel" value="header, nav"></label>
<label>Sticky CSS class<input id="sc" value="is-sticky"></label>
<label>Scrolled CSS class (for shadow etc.)<input id="rc" value="scrolled"></label>
<label>Scroll threshold (px)<input id="th" type="number" value="80"></label>
<label><input id="sh" type="checkbox" checked style="width:auto"> Add drop shadow when scrolled</label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-selector="'+document.getElementById('sel').value+'" data-sticky-class="'+document.getElementById('sc').value+'" data-scrolled-class="'+document.getElementById('rc').value+'" data-threshold="'+document.getElementById('th').value+'" data-shadow="'+document.getElementById('sh').checked+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
