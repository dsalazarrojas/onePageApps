addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  if(url.pathname==='/prices'){
    const ids=url.searchParams.get('ids')||'bitcoin,ethereum,binancecoin,solana,cardano';
    try{
      const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+ids+'&vs_currencies=usd&include_24hr_change=true',{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(8000)});
      const data=await r.text();
      return new Response(data,{headers:jsonH()});
    }catch(e){return new Response(JSON.stringify({error:String(e)}),{status:502,headers:jsonH()});}
  }
  return new Response(pageHTML(),{headers:htmlH()});
}
function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:380px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crypto Ticker</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:14px}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.title{font-size:1rem;font-weight:700;color:#94a3b8}.refresh-btn{background:rgba(255,255,255,.1);border:none;color:#94a3b8;padding:4px 10px;border-radius:4px;font-size:.75rem;cursor:pointer}.coin{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#1e293b;border-radius:8px;margin-bottom:6px}.name{font-size:.88rem;font-weight:600;text-transform:capitalize}.price{font-size:.95rem;font-weight:700}.chg{font-size:.78rem;padding:2px 8px;border-radius:3px;font-weight:600}.up{background:rgba(34,197,94,.15);color:#4ade80}.dn{background:rgba(239,68,68,.15);color:#f87171}.loader{text-align:center;padding:20px;color:#64748b;font-size:.85rem}.error{color:#f87171;text-align:center;padding:14px;font-size:.85rem}</style></head><body>
<div class="header"><span class="title">💰 Crypto Prices</span><button class="refresh-btn" onclick="load()">↺ Refresh</button></div>
<div id="out"><div class="loader">Loading prices…</div></div>
<script>
var IDS=['bitcoin','ethereum','binancecoin','solana','cardano'];
var NAMES={bitcoin:'Bitcoin',ethereum:'Ethereum',binancecoin:'BNB',solana:'Solana',cardano:'Cardano'};
async function load(){
  document.getElementById('out').innerHTML='<div class=loader>Loading…</div>';
  try{
    var r=await fetch('/prices?ids='+IDS.join(','));var d=await r.json();
    if(d.error){document.getElementById('out').innerHTML='<div class=error>'+d.error+'</div>';return;}
    document.getElementById('out').innerHTML=IDS.map(function(id){
      var p=d[id];if(!p)return'';
      var chg=p.usd_24h_change||0;
      return'<div class=coin><span class=name>'+(NAMES[id]||id)+'</span><span class=price>$'+p.usd.toLocaleString()+'</span><span class="chg '+(chg>=0?'up':'dn')+'">'+(chg>=0?'+':'')+chg.toFixed(2)+'%</span></div>';
    }).join('');
  }catch(e){document.getElementById('out').innerHTML='<div class=error>'+e.message+'</div>';}
}
load();setInterval(load,60000);
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
