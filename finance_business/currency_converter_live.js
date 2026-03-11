addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  if(url.pathname==='/convert'){
    const from=url.searchParams.get('from')||'USD';
    const to=url.searchParams.get('to')||'EUR';
    const amount=Number(url.searchParams.get('amount')||1);
    return convertCurrency(from,to,amount);
  }
  return new Response(pageHTML(),{headers:htmlH()});
}
function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:440px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
async function convertCurrency(from,to,amount){
  try{
    const res=await fetch('https://api.exchangerate-api.com/v4/latest/'+from);
    if(!res.ok) throw new Error('API error '+res.status);
    const data=await res.json();
    const rate=data.rates[to];
    if(!rate) return new Response(JSON.stringify({error:'Unknown currency: '+to}),{status:400,headers:jsonH()});
    return new Response(JSON.stringify({from,to,amount,rate,result:amount*rate,date:data.date}),{headers:jsonH()});
  }catch(e){
    return new Response(JSON.stringify({error:String(e)}),{status:502,headers:jsonH()});
  }
}
function pageHTML(){
  const CURRENCIES=['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','MXN','BRL','SGD','NZD','HKD','SEK','NOK','DKK','TRY','ZAR','KRW'];
  const opts=CURRENCIES.map(c=>'<option value="'+c+'">'+c+'</option>').join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Currency Converter</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:440px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input,select{width:100%;padding:9px;border:1px solid #ccc;border-radius:6px;font-size:1rem;margin-top:4px}button{margin-top:14px;width:100%;padding:11px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem}#res{margin-top:14px;font-size:1.3rem;font-weight:700;text-align:center;color:#1a73e8;min-height:32px}#rate{font-size:.8rem;color:#6b7280;text-align:center}#err{color:#dc2626;text-align:center;font-size:.9rem}</style></head><body>
<h1>💱 Currency Converter</h1>
<label>Amount<input id="amt" type="number" value="100" min="0" step="any"></label>
<label>From<select id="from">${opts.replace('<option value="USD">','<option value="USD" selected>')}</select></label>
<label>To<select id="to">${opts.replace('<option value="EUR">','<option value="EUR" selected>')}</select></label>
<button onclick="convert()">Convert</button>
<div id="res"></div><div id="rate"></div><div id="err"></div>
<script>
async function convert(){
  document.getElementById('res').textContent='Converting…';document.getElementById('err').textContent='';
  var r=await fetch('/convert?from='+document.getElementById('from').value+'&to='+document.getElementById('to').value+'&amount='+document.getElementById('amt').value);
  var d=await r.json();
  if(d.error){document.getElementById('res').textContent='';document.getElementById('err').textContent=d.error;return;}
  document.getElementById('res').textContent=d.amount+' '+d.from+' = '+d.result.toFixed(4)+' '+d.to;
  document.getElementById('rate').textContent='Rate: 1 '+d.from+' = '+d.rate.toFixed(6)+' '+d.to+(d.date?' ('+d.date+')':'');
}
convert();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
