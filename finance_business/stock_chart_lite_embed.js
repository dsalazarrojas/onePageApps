addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: textH() });
  }
  if (url.pathname === '/widget.js') {
    return new Response(widgetJS(), { headers: jsH() });
  }
  if (url.pathname === '/prices') {
    return new Response(JSON.stringify(await loadPrices(url.searchParams.get('symbol') || 'AAPL')), { headers: jsonH() });
  }
  return new Response(pageHTML(), { headers: htmlH() });
}

function widgetJS() {
  return `(function(){
    var s=document.currentScript;
    var base=(s&&s.src||'').replace(/\/widget\.js.*$/,'');
    var symbol=(s&&s.dataset.symbol)||'AAPL';
    var frame=document.createElement('iframe');
    frame.src=base+'/?symbol='+encodeURIComponent(symbol);
    frame.loading='lazy';
    frame.style.cssText='width:' + ((s&&s.dataset.width)||'100%') + ';height:' + ((s&&s.dataset.height)||'420px') + ';border:0;border-radius:14px;overflow:hidden;background:#0f172a;';
    (s&&s.parentNode||document.body).insertBefore(frame, s ? s.nextSibling : null);
  })();`;
}

async function loadPrices(symbol) {
  const normalized = normalizeSymbol(symbol);
  try {
    const response = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(normalized)}&i=d`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    const csv = await response.text();
    const lines = csv.trim().split(/\r?\n/).slice(1).filter(Boolean);
    const points = lines.map(line => {
      const [date,,, ,close] = line.split(',');
      return { date, close: Number(close) };
    }).filter(point => Number.isFinite(point.close)).slice(-90);
    if (!points.length) throw new Error('No price rows returned');
    return { symbol: displaySymbol(normalized), source: 'Stooq', live: true, points };
  } catch (error) {
    return { symbol: displaySymbol(normalized), source: 'Fallback simulation', live: false, warning: String(error), points: simulatePrices(displaySymbol(normalized), 90) };
  }
}

function normalizeSymbol(symbol) {
  const cleaned = String(symbol || 'AAPL').trim().toLowerCase();
  if (!cleaned) return 'aapl.us';
  if (cleaned.includes('.')) return cleaned;
  return `${cleaned}.us`;
}

function displaySymbol(symbol) {
  return String(symbol || '').replace(/\.us$/i, '').toUpperCase();
}

function simulatePrices(symbol, days) {
  let seed = String(symbol || 'DEMO').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) || 100;
  let price = 60 + (seed % 160);
  const points = [];
  for (let index = 0; index < days; index += 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const random = seed / 233280;
    price = Math.max(5, price + ((random - 0.47) * price * 0.028));
    const date = new Date(Date.now() - (days - index) * 86400000).toISOString().slice(0, 10);
    points.push({ date, close: Math.round(price * 100) / 100 });
  }
  return points;
}

function pageHTML() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stock Chart Lite Embed</title>
<style>*{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:18px}.toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.title{font-size:1.05rem;font-weight:800;color:#cbd5e1}input{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:9px 12px;border-radius:12px;font-size:.95rem;width:120px}button{padding:9px 14px;background:#3b82f6;color:#fff;border:none;border-radius:999px;cursor:pointer;font-weight:700}canvas{display:block;width:100%;border-radius:12px;background:#020617}small{color:#94a3b8}pre{background:#020617;color:#e2e8f0;border-radius:14px;padding:14px;white-space:pre-wrap;font-size:12px;overflow:auto}</style></head><body>
<div class="toolbar"><div><div class="title">📈 Stock Chart Lite</div><small id="meta">Loading…</small></div><div style="display:flex;gap:8px"><input id="symbol" maxlength="12" value="AAPL"><button id="load">Load</button></div></div>
<canvas id="chart" height="260"></canvas>
<div style="height:14px"></div>
<pre id="code"></pre>
<script>
const initial=new URL(location.href).searchParams.get('symbol')||'AAPL';
document.getElementById('symbol').value=initial;
async function load(){
  const symbol=(document.getElementById('symbol').value||'AAPL').toUpperCase();
  const res=await fetch('/prices?symbol='+encodeURIComponent(symbol));
  const data=await res.json();
  const points=(data.points||[]).map(item=>Number(item.close)).filter(Number.isFinite);
  draw(points, data.symbol || symbol, data.source, data.live);
  document.getElementById('code').textContent='<script src="'+location.origin+'/widget.js" data-symbol="'+symbol+'"><\\/script>';
}
function draw(prices,symbol,source,live){
  const canvas=document.getElementById('chart');
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth; canvas.height=260;
  const min=Math.min.apply(null,prices), max=Math.max.apply(null,prices), range=(max-min)||1;
  const w=canvas.width, h=220, up=prices[prices.length-1] >= prices[0], color=up?'#4ade80':'#f87171';
  ctx.clearRect(0,0,w,canvas.height);
  ctx.fillStyle='#020617'; ctx.fillRect(0,0,w,canvas.height);
  ctx.strokeStyle='rgba(148,163,184,.16)'; ctx.lineWidth=1;
  for(let i=0;i<5;i++){const y=18 + i*(h/4); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();}
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=3;
  prices.forEach((price,index)=>{const x=index/Math.max(1,prices.length-1)*w; const y=18 + h - ((price-min)/range)*h; if(index===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);}); ctx.stroke();
  ctx.lineTo(w,238); ctx.lineTo(0,238); ctx.closePath(); ctx.fillStyle=(up?'rgba(74,222,128,.12)':'rgba(248,113,113,.12)'); ctx.fill();
  ctx.fillStyle='#e2e8f0'; ctx.font='700 14px system-ui'; ctx.fillText(symbol, 12, 20);
  const change=((prices[prices.length-1]-prices[0])/prices[0]*100).toFixed(2);
  ctx.fillStyle=color; ctx.textAlign='right'; ctx.fillText((change>=0?'+':'')+change+'%', w-12, 20);
  document.getElementById('meta').textContent=(live?'Live':'Fallback')+' source: '+source+' · Last close $'+prices[prices.length-1].toFixed(2);
}
document.getElementById('load').addEventListener('click', load); load();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json;charset=UTF-8'};}
function textH(){return{...corsHeaders(),'Content-Type':'text/plain;charset=UTF-8'};}
