addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:480px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Color Picker Pro</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}.preview{width:100%;height:120px;border-radius:10px;border:1px solid #e5e7eb;margin:10px 0;transition:background .1s}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px}.val-box{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center}.val-label{font-size:.7rem;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em}.val-text{font-size:.9rem;font-weight:600;font-family:monospace;color:#1a1a2e;cursor:pointer;user-select:all}.shades{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.shade{width:36px;height:36px;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:border .15s}.shade:hover{border-color:#1a73e8}input[type=color]{width:100%;height:48px;border:1px solid #d1d5db;border-radius:8px;cursor:pointer;padding:2px}</style></head><body>
<h1>🎨 Color Picker Pro</h1>
<input type="color" id="picker" value="#1a73e8" oninput="update()">
<div class="preview" id="preview"></div>
<div class="grid">
  <div class="val-box"><div class="val-label">HEX</div><div class="val-text" id="hex" onclick="copy('hex')">#1a73e8</div></div>
  <div class="val-box"><div class="val-label">RGB</div><div class="val-text" id="rgb" onclick="copy('rgb')">rgb(26,115,232)</div></div>
  <div class="val-box"><div class="val-label">HSL</div><div class="val-text" id="hsl" onclick="copy('hsl')">hsl(217,80%,51%)</div></div>
</div>
<div style="margin-top:12px;font-size:.85rem;color:#555;font-weight:500">Tints &amp; Shades</div>
<div class="shades" id="shades"></div>
<script>
function hexToRgb(hex){var r=parseInt(hex.slice(1,3),16);var g=parseInt(hex.slice(3,5),16);var b=parseInt(hex.slice(5,7),16);return{r,g,b};}
function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;var max=Math.max(r,g,b),min=Math.min(r,g,b);var h,s,l=(max+min)/2;if(max===min){h=s=0;}else{var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}return{h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};}
function mixColor(hex,white,pct){var rgb=hexToRgb(hex);var base=white?255:0;var r=Math.round(rgb.r+(base-rgb.r)*pct);var g=Math.round(rgb.g+(base-rgb.g)*pct);var b=Math.round(rgb.b+(base-rgb.b)*pct);return'#'+[r,g,b].map(function(v){return v.toString(16).padStart(2,'0');}).join('');}
function update(){
  var hex=document.getElementById('picker').value;
  var rgb=hexToRgb(hex);var hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
  document.getElementById('preview').style.background=hex;
  document.getElementById('hex').textContent=hex.toUpperCase();
  document.getElementById('rgb').textContent='rgb('+rgb.r+','+rgb.g+','+rgb.b+')';
  document.getElementById('hsl').textContent='hsl('+hsl.h+','+hsl.s+'%,'+hsl.l+'%)';
  var shades=document.getElementById('shades');
  shades.innerHTML='';
  [-0.7,-0.5,-0.3,-0.15,0,0.15,0.3,0.5,0.7].forEach(function(p){
    var c=p<0?mixColor(hex,false,-p):p===0?hex:mixColor(hex,true,p);
    var d=document.createElement('div');d.className='shade';d.style.background=c;d.title=c.toUpperCase();
    d.onclick=function(){document.getElementById('picker').value=c;update();};
    shades.appendChild(d);
  });
}
function copy(id){var t=document.getElementById(id).textContent;navigator.clipboard.writeText(t).then(function(){var el=document.getElementById(id);var orig=el.textContent;el.textContent='Copied!';setTimeout(function(){el.textContent=orig;},1200);});}
update();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
