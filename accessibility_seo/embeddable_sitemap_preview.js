addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  if(url.pathname==='/fetch'){
    const target=url.searchParams.get('url');
    if(!target) return new Response(JSON.stringify({error:'Missing url'}),{status:400,headers:jsonH()});
    try{
      const res=await fetch(target,{signal:AbortSignal.timeout(10000)});
      const text=await res.text();
      const urls=(text.match(/<loc>([^<]+)<\/loc>/gi)||[]).map(u=>u.replace(/<\/?loc>/gi,'').trim()).slice(0,100);
      return new Response(JSON.stringify({urls,total:urls.length}),{headers:jsonH()});
    }catch(e){return new Response(JSON.stringify({error:String(e)}),{status:502,headers:jsonH()});}
  }
  return new Response(pageHTML(),{headers:htmlH()});
}
function widgetJS(){
  return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:580px;border:none;border-radius:8px;';el.title='Sitemap Preview';(s&&s.parentNode||document.body).appendChild(el);})()`  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sitemap Preview</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}label{font-size:.85rem;color:#555}input{width:100%;padding:9px;border:1px solid #ccc;border-radius:6px;margin:6px 0;font-size:.9rem}button{padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}#res{margin-top:16px}a.url-link{display:block;padding:6px 10px;background:#fff;border-radius:4px;margin:3px 0;font-size:.82rem;color:#1a73e8;text-decoration:none;border:1px solid #e5e7eb;word-break:break-all}a.url-link:hover{background:#eff6ff}#stats{font-size:.84rem;color:#555;margin:8px 0}</style></head><body>
<h1>🗺️ Sitemap Preview</h1>
<label>Sitemap URL<input id="url" value="https://example.com/sitemap.xml" type="url"></label>
<button onclick="run()">Fetch &amp; Preview</button>
<div id="res"></div>
<script>async function run(){var url=document.getElementById('url').value;var el=document.getElementById('res');el.innerHTML='<p>Fetching…</p>';try{var r=await fetch('/fetch?url='+encodeURIComponent(url));var d=await r.json();if(d.error){el.innerHTML='<p style=color:red>'+d.error+'</p>';return;}el.innerHTML='<div id=stats>Showing '+d.urls.length+' of '+d.total+' URLs</div>'+d.urls.map(function(u){return'<a class=url-link href="'+u+'" target=_blank>'+u+'</a>';}).join('');}catch(e){el.innerHTML='<p style=color:red>'+e.message+'</p>';}}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
