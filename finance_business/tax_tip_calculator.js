addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:440px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tax + Tip Calculator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:9px;border:1px solid #ccc;border-radius:6px;font-size:1rem;margin-top:4px}.res{margin-top:16px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:14px}.r{display:flex;justify-content:space-between;padding:6px 0;font-size:.9rem;border-bottom:1px solid #f3f4f6}.r:last-child{border-bottom:none;font-weight:700;font-size:1rem}</style></head><body>
<h1>🧾 Tax + Tip Calculator</h1>
<label>Subtotal ($)<input id="st" type="number" value="50.00" min="0" step="0.01" oninput="calc()"></label>
<label>Tax rate (%)<input id="tax" type="number" value="8.5" min="0" step="0.1" oninput="calc()"></label>
<label>Tip (%)<input id="tip" type="number" value="18" min="0" step="0.5" oninput="calc()"></label>
<label>Split<input id="split" type="number" value="1" min="1" oninput="calc()"></label>
<div class="res">
  <div class="r"><span>Subtotal</span><span id="r-st"></span></div>
  <div class="r"><span>Tax</span><span id="r-tax"></span></div>
  <div class="r"><span>Tip</span><span id="r-tip"></span></div>
  <div class="r"><span>Total</span><span id="r-total"></span></div>
  <div class="r"><span>Per person</span><span id="r-pp"></span></div>
</div>
<script>
function fmt(v){return'$'+v.toFixed(2);}
function calc(){
  var st=Number(document.getElementById('st').value)||0;
  var tax=st*(Number(document.getElementById('tax').value)||0)/100;
  var tip=st*(Number(document.getElementById('tip').value)||0)/100;
  var total=st+tax+tip;
  var split=Math.max(1,Number(document.getElementById('split').value)||1);
  document.getElementById('r-st').textContent=fmt(st);
  document.getElementById('r-tax').textContent=fmt(tax);
  document.getElementById('r-tip').textContent=fmt(tip);
  document.getElementById('r-total').textContent=fmt(total);
  document.getElementById('r-pp').textContent=fmt(total/split);
}
calc();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
