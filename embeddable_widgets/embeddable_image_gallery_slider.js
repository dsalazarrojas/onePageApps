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
  var images=JSON.parse((s&&s.dataset.images)||'[]');
  var auto=Number((s&&s.dataset.auto)||0);
  var height=Number((s&&s.dataset.height)||320);
  if(!images.length){console.warn('gallery widget: no images, add data-images attribute');return;}
  var idx=0;
  var wrap=document.createElement('div');
  wrap.style.cssText='position:relative;overflow:hidden;border-radius:10px;height:'+height+'px;background:#111;user-select:none;';
  var img=document.createElement('img');
  img.style.cssText='width:100%;height:100%;object-fit:cover;transition:opacity .4s;';
  img.src=images[0];
  wrap.appendChild(img);
  function mkBtn(txt,cb){var b=document.createElement('button');b.innerHTML=txt;b.style.cssText='position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;padding:10px 14px;font-size:18px;cursor:pointer;border-radius:4px;z-index:2;transition:background .2s;';b.onmouseenter=function(){this.style.background='rgba(0,0,0,.8)';};b.onmouseleave=function(){this.style.background='rgba(0,0,0,.5)';};b.onclick=cb;return b;}
  var prev=mkBtn('&#8249;',function(){go(idx-1);});prev.style.left='8px';
  var next=mkBtn('&#8250;',function(){go(idx+1);});next.style.right='8px';
  var dots=document.createElement('div');dots.style.cssText='position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:2;';
  var dotEls=images.map(function(_,i){var d=document.createElement('button');d.style.cssText='width:8px;height:8px;border-radius:50%;border:none;background:'+(i===0?'#fff':'rgba(255,255,255,.5)')+';padding:0;cursor:pointer;';d.onclick=function(){go(i);};return d;});
  dotEls.forEach(function(d){dots.appendChild(d);});
  wrap.appendChild(prev);wrap.appendChild(next);wrap.appendChild(dots);
  if(s&&s.parentNode)s.parentNode.insertBefore(wrap,s.nextSibling);else document.body.appendChild(wrap);
  function go(i){idx=(i+images.length)%images.length;img.style.opacity='0';setTimeout(function(){img.src=images[idx];img.style.opacity='1';},200);dotEls.forEach(function(d,j){d.style.background=j===idx?'#fff':'rgba(255,255,255,.5)';});}
  if(auto>0)setInterval(function(){go(idx+1);},auto);
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Image Gallery Slider</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}textarea,input{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-family:monospace;font-size:.85rem}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🖼️ Image Gallery Slider</h1>
<label>Image URLs (JSON array)<textarea id="imgs" rows="5">["https://picsum.photos/seed/1/800/400","https://picsum.photos/seed/2/800/400","https://picsum.photos/seed/3/800/400"]</textarea></label>
<label>Height (px)<input id="h" type="number" value="320"></label>
<label>Auto-advance (ms, 0=off)<input id="a" type="number" value="3000"></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var imgs=document.getElementById('imgs').value.replace(/\s+/g,'');var code='<script src="'+base+'/widget.js" data-images="'+imgs+'" data-height="'+document.getElementById('h').value+'" data-auto="'+document.getElementById('a').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
