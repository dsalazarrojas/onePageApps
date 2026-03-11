addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:520px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Loan Calculator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:9px;border:1px solid #ccc;border-radius:6px;font-size:1rem;margin-top:4px}button{margin-top:14px;width:100%;padding:11px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem}#res{margin-top:16px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:14px;display:none}.r{display:flex;justify-content:space-between;padding:7px 0;font-size:.9rem;border-bottom:1px solid #f3f4f6}.r:last-child{border-bottom:none;font-weight:700}canvas{width:100%;margin-top:14px}</style></head><body>
<h1>💳 Loan Calculator</h1>
<label>Loan amount ($)<input id="L" type="number" value="20000" min="0"></label>
<label>Annual interest rate (%)<input id="R" type="number" value="7" min="0" step="0.1"></label>
<label>Loan term (months)<input id="N" type="number" value="60" min="1"></label>
<button onclick="calc()">Calculate</button>
<div id="res">
  <div class="r"><span>Monthly payment</span><span id="mp">$0</span></div>
  <div class="r"><span>Total payment</span><span id="tp">$0</span></div>
  <div class="r"><span>Total interest</span><span id="ti">$0</span></div>
</div>
<canvas id="chart" width="480" height="200"></canvas>
<script>
function calc(){
  var L=Number(document.getElementById('L').value);
  var r=Number(document.getElementById('R').value)/100/12;
  var n=Number(document.getElementById('N').value);
  var mp;
  if(r===0){mp=L/n;}else{mp=L*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);}
  var total=mp*n;var interest=total-L;
  var fmt=function(v){return'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});};
  document.getElementById('mp').textContent=fmt(mp);
  document.getElementById('tp').textContent=fmt(total);
  document.getElementById('ti').textContent=fmt(interest);
  document.getElementById('res').style.display='block';
  drawChart(L,mp,r,n);
}
function drawChart(L,mp,r,n){
  var c=document.getElementById('chart');var ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  var balances=[L];var interests=[];var principals=[];
  var bal=L;
  for(var i=0;i<n;i++){var int=bal*r;var pri=mp-int;bal-=pri;interests.push(int);principals.push(pri);balances.push(Math.max(0,bal));}
  var maxB=L;var w=c.width;var h=c.height-20;
  ctx.strokeStyle='#1a73e8';ctx.lineWidth=2;ctx.beginPath();
  balances.forEach(function(b,i){var x=i/(balances.length-1)*w;var y=h-(b/maxB)*h;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
  ctx.stroke();
  ctx.fillStyle='rgba(26,115,232,.1)';ctx.beginPath();ctx.moveTo(0,h);balances.forEach(function(b,i){var x=i/(balances.length-1)*w;var y=h-(b/maxB)*h;ctx.lineTo(x,y);});ctx.lineTo(w,h);ctx.closePath();ctx.fill();
  ctx.fillStyle='#374151';ctx.font='11px sans-serif';ctx.fillText('Balance over '+n+' months',8,14);
}
calc();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
