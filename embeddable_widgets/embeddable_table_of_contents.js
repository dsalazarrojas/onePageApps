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
  var headings=(s&&s.dataset.headings)||'h2,h3';
  var title=(s&&s.dataset.title)||'Contents';
  var collapsible=(s&&s.dataset.collapsible)!=='false';
  var nav=document.createElement('nav');
  nav.id='toc-widget';
  nav.setAttribute('aria-label','Table of contents');
  nav.style.cssText='background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;font-family:sans-serif;font-size:.87rem;max-width:300px;';
  var style=document.createElement('style');
  style.textContent='#toc-widget ul{margin:8px 0 0;padding-left:16px;list-style:none;}#toc-widget li{margin:5px 0;}#toc-widget a{color:#3b82f6;text-decoration:none;}#toc-widget a:hover{text-decoration:underline;}#toc-widget li.toc-h3{padding-left:14px;}';
  document.head.appendChild(style);
  function build(){
    var hEls=Array.from(document.querySelectorAll(headings));
    if(!hEls.length)return;
    var toggle=null;
    if(collapsible){
      toggle=document.createElement('button');
      toggle.style.cssText='background:none;border:none;font-weight:700;font-size:.9rem;cursor:pointer;width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;padding:0;color:#1a1a2e;';
      toggle.innerHTML=title+' <span id="toc-arrow">&#9660;</span>';
    }else{var th=document.createElement('strong');th.textContent=title;nav.appendChild(th);}
    var ul=document.createElement('ul');
    hEls.forEach(function(h,i){
      if(!h.id)h.id='toc-heading-'+i;
      var li=document.createElement('li');
      li.className='toc-'+h.tagName.toLowerCase();
      var a=document.createElement('a');
      a.href='#'+h.id;a.textContent=h.textContent;
      li.appendChild(a);ul.appendChild(li);
    });
    if(collapsible){
      toggle.onclick=function(){var hidden=ul.style.display==='none';ul.style.display=hidden?'':'none';document.getElementById('toc-arrow').innerHTML=hidden?'&#9660;':'&#9654;';};
      nav.appendChild(toggle);
    }
    nav.appendChild(ul);
  }
  if(s&&s.parentNode)s.parentNode.insertBefore(nav,s.nextSibling);else document.body.prepend(nav);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Table of Contents Widget</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>📑 Embeddable Table of Contents</h1>
<label>Heading selector<input id="sel" value="h2,h3"></label>
<label>TOC title<input id="t" value="Contents"></label>
<label><input id="col" type="checkbox" checked style="width:auto"> Collapsible</label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<p>Place the script tag before your article content. The TOC auto-builds from headings found in the document.</p>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-headings="'+document.getElementById('sel').value+'" data-title="'+document.getElementById('t').value+'" data-collapsible="'+document.getElementById('col').checked+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
