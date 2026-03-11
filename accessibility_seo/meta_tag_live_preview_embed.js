addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:600px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Meta Tag Preview</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:600px){.grid{grid-template-columns:1fr}}label{display:block;margin-top:10px;font-size:.84rem;color:#555;font-weight:500}input,textarea{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.88rem}button{margin-top:14px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}h2{font-size:1rem;margin:16px 0 8px;color:#374151}.preview-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:14px}.pc-header{background:#f8f8f8;padding:8px 12px;font-size:.75rem;color:#666;border-bottom:1px solid #e5e7eb}.pc-body{padding:12px 14px}.google-title{color:#1a0dab;font-size:1rem;font-weight:400;line-height:1.3;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.google-url{color:#006621;font-size:.8rem;margin:2px 0}.google-desc{color:#545454;font-size:.85rem;line-height:1.4}.og-img{width:100%;height:160px;object-fit:cover;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:.85rem;color:#9ca3af}.og-domain{font-size:.72rem;color:#9ca3af;text-transform:uppercase;padding:8px 12px 0}.og-title{font-size:.95rem;font-weight:700;padding:4px 12px;color:#1a1a2e}.og-desc{font-size:.82rem;color:#555;padding:0 12px 10px;line-height:1.4}.meta-code{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.75rem;overflow-x:auto;white-space:pre;margin-top:12px}</style></head><body>
<h1>🏷️ Meta Tag Live Preview</h1>
<div class="grid">
<div>
<label>Title (≤60 chars)<input id="title" value="My Awesome Page" oninput="update()"></label>
<label>Description (≤160 chars)<textarea id="desc" rows="2" oninput="update()">A brief description of my page for search engines and social media.</textarea></label>
<label>Canonical URL<input id="url" value="https://example.com/my-page" oninput="update()"></label>
<label>OG Image URL<input id="img" value="https://picsum.photos/1200/630" oninput="update()"></label>
<label>Site name<input id="site" value="Example Site" oninput="update()"></label>
</div>
<div>
<h2>Google Search Preview</h2>
<div class="preview-card"><div class="pc-header">Google Search</div><div class="pc-body">
<a id="g-title" class="google-title" href="#"></a>
<div id="g-url" class="google-url"></div>
<div id="g-desc" class="google-desc"></div>
</div></div>
<h2>Open Graph / Social Preview</h2>
<div class="preview-card">
<div id="og-img-wrap" class="og-img">No image</div>
<div id="og-domain" class="og-domain"></div>
<div id="og-title" class="og-title"></div>
<div id="og-desc" class="og-desc"></div>
</div>
</div>
</div>
<h2>Generated Meta Tags</h2>
<pre id="code" class="meta-code"></pre>
<script>
function update(){
  var title=document.getElementById('title').value;
  var desc=document.getElementById('desc').value;
  var url=document.getElementById('url').value;
  var img=document.getElementById('img').value;
  var site=document.getElementById('site').value;
  document.getElementById('g-title').textContent=title.slice(0,60);
  document.getElementById('g-url').textContent=url;
  document.getElementById('g-desc').textContent=desc.slice(0,160);
  document.getElementById('og-title').textContent=title;
  document.getElementById('og-desc').textContent=desc.slice(0,200);
  try{document.getElementById('og-domain').textContent=new URL(url).hostname;}catch(e){}
  if(img){document.getElementById('og-img-wrap').innerHTML='<img src="'+img+'" style="width:100%;height:160px;object-fit:cover">';}
  var meta=['<title>'+title+'</title>','<meta name="description" content="'+desc+'">','<link rel="canonical" href="'+url+'">','<meta property="og:title" content="'+title+'">','<meta property="og:description" content="'+desc+'">','<meta property="og:url" content="'+url+'">','<meta property="og:image" content="'+img+'">','<meta property="og:site_name" content="'+site+'">','<meta property="og:type" content="website">','<meta name="twitter:card" content="summary_large_image">','<meta name="twitter:title" content="'+title+'">','<meta name="twitter:description" content="'+desc+'">','<meta name="twitter:image" content="'+img+'">'];
  document.getElementById('code').textContent=meta.join('\\n');
}
update();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
