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
  var sep=(s&&s.dataset.separator)||'/';
  var theme=(s&&s.dataset.theme)||'light';
  var auto=(s&&s.dataset.auto)!=='false';
  var nav=document.createElement('nav');
  nav.setAttribute('aria-label','Breadcrumb');
  var ol=document.createElement('ol');
  ol.style.cssText='list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;align-items:center;gap:4px;font-family:sans-serif;font-size:.85rem;';
  nav.appendChild(ol);
  if(s&&s.parentNode)s.parentNode.insertBefore(nav,s);
  else document.body.prepend(nav);
  function addCrumb(label,href,current){
    var li=document.createElement('li');
    if(current){var sp=document.createElement('span');sp.textContent=label;sp.setAttribute('aria-current','page');sp.style.color='#6b7280';li.appendChild(sp);}
    else{var a=document.createElement('a');a.href=href;a.textContent=label;a.style.cssText='color:#1a73e8;text-decoration:none;';a.onmouseenter=function(){this.style.textDecoration='underline';};a.onmouseleave=function(){this.style.textDecoration='none';};li.appendChild(a);}
    if(!current){var s2=document.createElement('span');s2.textContent=' '+sep+' ';s2.setAttribute('aria-hidden','true');s2.style.color='#9ca3af';li.appendChild(s2);}
    ol.appendChild(li);
  }
  if(auto){
    var parts=location.pathname.split('/').filter(Boolean);
    addCrumb('Home','/');
    parts.forEach(function(p,i){var href='/'+parts.slice(0,i+1).join('/');var label=p.replace(/[-_]/g,' ').replace(/\b./g,function(c){return c.toUpperCase();});addCrumb(label,href,i===parts.length-1);});
  }
  window.Breadcrumb={add:addCrumb};
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Breadcrumb Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.35rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:12px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🍞 Breadcrumb Generator</h1>
<label>Separator<input id="sep" value="/"></label>
<label><input id="auto" type="checkbox" checked style="width:auto"> Auto-generate from URL path</label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<p>Or add crumbs manually:</p>
<pre style="display:block;background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:8px;font-size:.78rem">Breadcrumb.add('Products', '/products');
Breadcrumb.add('Current Page', '#', true);</pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-separator="'+document.getElementById('sep').value+'" data-auto="'+document.getElementById('auto').checked+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
