addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:520px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Meme Maker</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}.toolbar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}input[type=text],input[type=url],input[type=number]{padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:.88rem;width:100%}input[type=file]{font-size:.85rem}button{padding:8px 16px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.88rem}.dl{background:#059669}canvas{display:block;max-width:100%;border-radius:8px;border:1px solid #e5e7eb;margin:12px auto}label{display:block;margin-top:8px;font-size:.85rem;color:#555;font-weight:500}.row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}</style></head><body>
<h1>😂 Meme Maker</h1>
<label>Image URL (or upload)<input type="url" id="iurl" placeholder="https://example.com/image.jpg" oninput="loadUrl()"></label>
<label>Or upload<input type="file" id="ifile" accept="image/*" onchange="loadFile()"></label>
<div class="row2">
  <label>Top text<input type="text" id="top" value="ONE DOES NOT SIMPLY" oninput="draw()"></label>
  <label>Bottom text<input type="text" id="bot" value="MAKE A MEME" oninput="draw()"></label>
</div>
<div class="row2">
  <label>Font size<input type="number" id="fs" value="40" min="10" max="120" oninput="draw()"></label>
  <label>Text colour<input type="color" id="tc" value="#ffffff" oninput="draw()" style="height:36px"></label>
</div>
<canvas id="c"></canvas>
<div style="text-align:center"><button onclick="dl()" class="dl">⬇ Download Meme</button></div>
<script>
var img=null;
var c=document.getElementById('c');var ctx=c.getContext('2d');
function loadUrl(){var url=document.getElementById('iurl').value;if(!url)return;var i=new Image();i.crossOrigin='anonymous';i.onload=function(){img=i;draw();};i.src=url;}
function loadFile(){var f=document.getElementById('ifile').files[0];if(!f)return;var r=new FileReader();r.onload=function(e){var i=new Image();i.onload=function(){img=i;draw();};i.src=e.target.result;};r.readAsDataURL(f);}
function draw(){
  if(!img){ctx.clearRect(0,0,c.width,c.height);c.width=480;c.height=360;ctx.fillStyle='#1e1e2e';ctx.fillRect(0,0,480,360);ctx.fillStyle='#6b7280';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('Load an image to start',240,180);return;}
  c.width=img.naturalWidth;c.height=img.naturalHeight;ctx.drawImage(img,0,0);
  var fs=Number(document.getElementById('fs').value)||40;
  var tc=document.getElementById('tc').value;
  ctx.font='bold '+fs+'px Impact,Arial Black,sans-serif';ctx.textAlign='center';ctx.lineWidth=fs*0.08;ctx.strokeStyle='#000';
  ctx.fillStyle=tc;
  var top=document.getElementById('top').value.toUpperCase();var bot=document.getElementById('bot').value.toUpperCase();
  ctx.strokeText(top,c.width/2,fs+10);ctx.fillText(top,c.width/2,fs+10);
  ctx.strokeText(bot,c.width/2,c.height-14);ctx.fillText(bot,c.width/2,c.height-14);
}
function dl(){var a=document.createElement('a');a.download='meme.png';a.href=c.toDataURL();a.click();}
draw();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
