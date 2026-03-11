addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:560px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Structured Data Tester</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}textarea{width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:.88rem;font-family:monospace;resize:vertical}button{margin-top:10px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}#res{margin-top:14px;font-size:.88rem}.ok{color:#15803d}.err{color:#b91c1c;background:#fef2f2;padding:8px;border-radius:6px;margin:4px 0}.prop{margin:2px 0 2px 16px;color:#374151}.kw{color:#7c3aed;font-weight:600}.schema-type{background:#eff6ff;border-left:3px solid #3b82f6;padding:8px 12px;margin:8px 0;border-radius:0 6px 6px 0}</style></head><body>
<h1>🔍 Structured Data Tester</h1>
<textarea id="code" rows="12" placeholder="Paste your JSON-LD here…">{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Test Article",
  "author": {"@type": "Person", "name": "Jane Doe"},
  "datePublished": "2025-01-01"
}</textarea>
<button onclick="test()">Validate</button>
<div id="res"></div>
<script>
function test(){
  var src=document.getElementById('code').value.trim();
  var el=document.getElementById('res');
  var obj;
  try{obj=JSON.parse(src);}catch(e){el.innerHTML='<div class=err>❌ Invalid JSON: '+e.message+'</div>';return;}
  var errors=[];var warnings=[];
  if(!obj['@context']){errors.push('@context is missing');}
  else if(!obj['@context'].includes('schema.org')){warnings.push('@context does not reference schema.org');}
  if(!obj['@type']){errors.push('@type is missing');}
  var html='';
  if(obj['@type'])html+='<div class=schema-type><b>Type:</b> '+obj['@type']+'<br><small><a href="https://schema.org/'+obj['@type']+'" target="_blank" style="color:#1a73e8">View schema.org/'+obj['@type']+'</a></small></div>';
  if(errors.length)html+=errors.map(function(e){return'<div class=err>❌ '+e+'</div>';}).join('');
  if(warnings.length)html+=warnings.map(function(e){return'<div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:8px;border-radius:0 6px 6px 0;margin:4px 0;font-size:.85rem">⚠️ '+e+'</div>';}).join('');
  if(!errors.length&&!warnings.length)html+='<div class=ok>✅ Looks valid! '+Object.keys(obj).length+' properties found.</div>';
  html+='<hr style="margin:12px 0;border:none;border-top:1px solid #e5e7eb"><b>Properties:</b>';
  Object.keys(obj).forEach(function(k){html+='<div class=prop><span class=kw>'+k+'</span>: '+JSON.stringify(obj[k]).slice(0,120)+'</div>';});
  el.innerHTML=html;
}
test();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
