addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:560px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hreflang Tag Helper</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}p{color:#555;font-size:.9rem}.row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end}input,select{padding:8px;border:1px solid #ccc;border-radius:6px;font-size:.88rem;width:100%}button{padding:8px 14px;border:none;border-radius:6px;cursor:pointer;font-size:.88rem}button.add{background:#1a73e8;color:#fff;margin-top:12px}button.del{background:#ef4444;color:#fff}button.gen{background:#059669;color:#fff;margin-top:12px;padding:10px 22px}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🌍 Hreflang Tag Helper</h1>
<p>Add URL + language/region pairs then generate the corresponding link tags.</p>
<div id="rows">
  <div class="row"><input placeholder="https://example.com/"><input placeholder="en" value="en"><button class="del" onclick="delRow(this)">✕</button></div>
  <div class="row"><input placeholder="https://example.com/es/"><input placeholder="es" value="es"><button class="del" onclick="delRow(this)">✕</button></div>
</div>
<button class="add" onclick="addRow()">+ Add Language</button>
<button class="gen" onclick="gen()">Generate Tags</button>
<pre id="code"></pre>
<script>
function addRow(){var d=document.createElement('div');d.className='row';d.innerHTML='<input placeholder="https://example.com/lang/"><input placeholder="en-US"><button class="del" onclick="delRow(this)">✕</button>';document.getElementById('rows').appendChild(d);}
function delRow(btn){var row=btn.closest('.row');if(document.querySelectorAll('.row').length>1)row.remove();}
function gen(){
  var rows=Array.from(document.querySelectorAll('.row'));
  var tags=rows.map(function(r){var inputs=r.querySelectorAll('input');return'<link rel="alternate" hreflang="'+inputs[1].value+'" href="'+inputs[0].value+'">';});
  tags.push('<link rel="alternate" hreflang="x-default" href="'+document.querySelector('.row input').value+'">');
  document.getElementById('code').textContent=tags.join('\\n');document.getElementById('code').style.display='block';
}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
