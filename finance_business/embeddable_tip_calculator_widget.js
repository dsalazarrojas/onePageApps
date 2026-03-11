addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:460px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tip Calculator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:440px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:9px;border:1px solid #ccc;border-radius:6px;font-size:1rem;margin-top:4px}.tips{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.tip-btn{padding:8px 14px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:.88rem;transition:all .15s}.tip-btn.active{background:#1a73e8;color:#fff;border-color:#1a73e8}#res{margin-top:18px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;display:none}.res-row{display:flex;justify-content:space-between;padding:6px 0;font-size:.9rem;border-bottom:1px solid #f3f4f6}.res-row:last-child{border-bottom:none;font-weight:700;font-size:1rem}</style></head><body>
<h1>💰 Tip Calculator</h1>
<label>Bill amount ($)<input id="bill" type="number" value="45.00" min="0" step="0.01" oninput="calc()"></label>
<label>Tip %</label>
<div class="tips">
  <button class="tip-btn" onclick="setTip(this,10)">10%</button>
  <button class="tip-btn active" onclick="setTip(this,15)">15%</button>
  <button class="tip-btn" onclick="setTip(this,18)">18%</button>
  <button class="tip-btn" onclick="setTip(this,20)">20%</button>
  <button class="tip-btn" onclick="setTip(this,25)">25%</button>
</div>
<label>Custom tip %<input id="custom" type="number" value="" min="0" max="100" placeholder="Enter custom %" oninput="customTip()"></label>
<label>Split between<input id="split" type="number" value="1" min="1" oninput="calc()"></label>
<div id="res">
  <div class="res-row"><span>Bill</span><span id="r-bill">$0</span></div>
  <div class="res-row"><span>Tip (<span id="r-pct">15</span>%)</span><span id="r-tip">$0</span></div>
  <div class="res-row"><span>Total</span><span id="r-total">$0</span></div>
  <div class="res-row"><span>Per person</span><span id="r-pp">$0</span></div>
</div>
<script>
var tipPct=15;
function setTip(btn,p){document.querySelectorAll('.tip-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');document.getElementById('custom').value='';tipPct=p;calc();}
function customTip(){var v=Number(document.getElementById('custom').value);if(v>=0){tipPct=v;document.querySelectorAll('.tip-btn').forEach(function(b){b.classList.remove('active');});calc();}}
function calc(){
  var bill=Number(document.getElementById('bill').value)||0;
  var split=Math.max(1,Number(document.getElementById('split').value)||1);
  var tip=bill*tipPct/100;var total=bill+tip;var pp=total/split;
  document.getElementById('r-bill').textContent='$'+bill.toFixed(2);
  document.getElementById('r-pct').textContent=tipPct;
  document.getElementById('r-tip').textContent='$'+tip.toFixed(2);
  document.getElementById('r-total').textContent='$'+total.toFixed(2);
  document.getElementById('r-pp').textContent='$'+pp.toFixed(2);
  document.getElementById('res').style.display='block';
}
calc();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
