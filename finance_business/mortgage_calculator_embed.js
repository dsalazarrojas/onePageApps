addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:540px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mortgage Calculator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:9px;border:1px solid #ccc;border-radius:6px;font-size:1rem;margin-top:4px}button{margin-top:14px;width:100%;padding:11px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem;font-weight:600}#res{margin-top:16px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;display:none}.r-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:.9rem}.r-row:last-child{border-bottom:none;font-weight:700;font-size:1.05rem}.big{font-size:1.6rem;font-weight:800;color:#1a73e8;text-align:center;display:block;margin:6px 0 14px}</style></head><body>
<h1>🏠 Mortgage Calculator</h1>
<label>Home price ($)<input id="hp" type="number" value="400000" min="0"></label>
<label>Down payment ($)<input id="dp" type="number" value="80000" min="0"></label>
<label>Annual interest rate (%)<input id="rate" type="number" value="6.5" min="0" step="0.1"></label>
<label>Loan term (years)<input id="term" type="number" value="30" min="1" max="50"></label>
<button onclick="calc()">Calculate</button>
<div id="res">
  <span class="big" id="monthly">$0/mo</span>
  <div class="r-row"><span>Loan amount</span><span id="loan">$0</span></div>
  <div class="r-row"><span>Monthly payment</span><span id="mp">$0</span></div>
  <div class="r-row"><span>Total interest</span><span id="ti">$0</span></div>
  <div class="r-row"><span>Total cost</span><span id="tc">$0</span></div>
</div>
<script>
function calc(){
  var hp=Number(document.getElementById('hp').value)||0;
  var dp=Number(document.getElementById('dp').value)||0;
  var rate=Number(document.getElementById('rate').value)/100/12;
  var n=Number(document.getElementById('term').value)*12;
  var P=hp-dp;
  if(P<=0||n<=0){return;}
  var mp;
  if(rate===0){mp=P/n;}else{mp=P*(rate*Math.pow(1+rate,n))/(Math.pow(1+rate,n)-1);}
  var total=mp*n;
  var interest=total-P;
  var fmt=function(v){return'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});};
  document.getElementById('monthly').textContent=fmt(mp)+'/mo';
  document.getElementById('loan').textContent=fmt(P);
  document.getElementById('mp').textContent=fmt(mp);
  document.getElementById('ti').textContent=fmt(interest);
  document.getElementById('tc').textContent=fmt(total+dp);
  document.getElementById('res').style.display='block';
}
calc();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
