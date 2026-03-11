addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:560px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Colorblind Filter Preview</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:820px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}p{color:#555;font-size:.9rem}label{font-size:.85rem;color:#555;font-weight:500}input[type=url]{width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:.9rem;margin:6px 0 10px}select{padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:.9rem;margin:0 8px 10px 0}button{padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-top:16px}.card{background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;text-align:center}.card-label{font-size:.78rem;color:#555;padding:8px 0;border-top:1px solid #f3f4f6}.thumb{width:100%;height:120px;object-fit:cover;display:block}svg{display:none}#svg-filters{position:absolute;width:0;height:0}</style></head><body>
<h1>🎨 Colorblind Filter Preview</h1>
<p>Preview any image URL through common colour vision deficiency simulations.</p>
<svg id="svg-filters" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/></filter>
    <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/></filter>
    <filter id="tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/></filter>
    <filter id="achromatopsia"><feColorMatrix type="saturate" values="0"/></filter>
  </defs>
</svg>
<label>Image URL</label>
<input type="url" id="img-url" value="https://picsum.photos/seed/colorblind/400/200">
<button onclick="render()">Preview</button>
<div class="grid" id="grid"></div>
<script>
var filters=[{id:'none',label:'Normal Vision'},{id:'protanopia',label:'Protanopia (no red)'},{id:'deuteranopia',label:'Deuteranopia (no green)'},{id:'tritanopia',label:'Tritanopia (no blue)'},{id:'achromatopsia',label:'Achromatopsia (no colour)'}];
function render(){
  var url=document.getElementById('img-url').value;
  var grid=document.getElementById('grid');
  grid.innerHTML=filters.map(function(f){return'<div class="card"><img class="thumb" src="'+url+'" style="'+(f.id!=='none'?'filter:url(#'+f.id+')':'')+'" loading="lazy"><div class="card-label">'+f.label+'</div></div>';}).join('');
}
render();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
