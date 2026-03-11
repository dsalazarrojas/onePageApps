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
  if (url.pathname === '/status') {
    return checkStatus(url.searchParams.get('url'));
  }
  return new Response(pageHTML(), { headers: htmlH() });
}

async function checkStatus(target) {
  const value = String(target || '').trim();
  if (!/^https?:\/\//i.test(value)) {
    return new Response(JSON.stringify({ error: 'Provide a full http(s) URL.' }), { status: 400, headers: jsonH() });
  }
  const started = Date.now();
  try {
    let response = await fetch(value, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!response.ok && (response.status === 405 || response.status === 403)) {
      response = await fetch(value, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000) });
    }
    const duration = Date.now() - started;
    return new Response(JSON.stringify({
      ok: response.ok,
      status: response.status,
      duration,
      label: response.ok ? 'Operational' : 'Issue detected',
      target: value
    }), { headers: jsonH() });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, status: 0, duration: Date.now() - started, label: 'Offline', target: value, error: String(error) }), { headers: jsonH() });
  }
}

function widgetJS() {
  return `(function(){
    var s=document.currentScript;
    var base=(s&&s.src||'').replace(/\/widget\.js.*$/,'');
    var url=(s&&s.dataset.url)||'https://example.com';
    var label=(s&&s.dataset.label)||'Website status';
    var refresh=Math.max(15, Number((s&&s.dataset.refresh)||60)) * 1000;
    var card=document.createElement('div');
    card.style.cssText='display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;border:1px solid #dbe4f0;background:#fff;color:#0f172a;font-family:Inter,system-ui,sans-serif;box-shadow:0 12px 30px rgba(15,23,42,.08);max-width:420px';
    var dot=document.createElement('span');
    dot.style.cssText='width:12px;height:12px;border-radius:999px;background:#94a3b8;display:inline-block;flex:none';
    var copy=document.createElement('div');
    copy.innerHTML='<strong style="display:block">'+label.replace(/</g,'&lt;')+'</strong><div style="font-size:13px;color:#475569">Checking '+url.replace(/</g,'&lt;')+'…</div>';
    card.appendChild(dot);card.appendChild(copy);
    (s&&s.parentNode||document.body).insertBefore(card, s ? s.nextSibling : null);
    function paint(state){
      var healthy=state.ok;
      dot.style.background=healthy?'#16a34a':'#dc2626';
      copy.innerHTML='<strong style="display:block">'+label.replace(/</g,'&lt;')+'</strong><div style="font-size:13px;color:#475569">'+(state.label||'Unknown')+' · HTTP '+(state.status||'—')+' · '+(state.duration||0)+'ms</div>';
    }
    async function load(){
      try{
        var res=await fetch(base+'/status?url='+encodeURIComponent(url));
        var data=await res.json();
        paint(data);
      }catch(error){ paint({ok:false,label:'Offline',status:'—',duration:0}); }
    }
    load();
    setInterval(load, refresh);
  })();`;
}

function pageHTML() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Uptime Status Widget</title>
<style>*{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;max-width:760px;margin:0 auto;padding:24px 16px;background:#f8fafc;color:#0f172a}.card{background:#fff;border:1px solid #dbe4f0;border-radius:18px;padding:20px;box-shadow:0 14px 40px rgba(15,23,42,.06)}h1{margin:0 0 8px;font-size:1.65rem}p{color:#475569;line-height:1.6}label{display:block;margin:12px 0 6px;font-weight:600}input{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:12px}button{border:none;border-radius:999px;background:#2563eb;color:#fff;padding:10px 16px;font-weight:700;cursor:pointer;margin-top:14px}pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:14px;white-space:pre-wrap;overflow:auto;font-size:12px}#preview{margin-top:16px;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;border:1px solid #dbe4f0;background:#fff}#dot{width:12px;height:12px;border-radius:999px;background:#94a3b8;display:inline-block}small{color:#64748b}</style></head><body>
<div class="card">
  <h1>🟢 Uptime Status Widget</h1>
  <p>Ping a public URL on load and render a compact live status badge. Use the script embed for direct host-page injection.</p>
  <label for="target">URL to monitor</label>
  <input id="target" type="url" value="https://example.com" placeholder="https://example.com/health">
  <label for="label">Badge label</label>
  <input id="label" value="Website status" placeholder="API status">
  <button type="button" id="run">Check now + generate embed</button>
  <div id="preview"><span id="dot"></span><div id="statusCopy"><strong>Website status</strong><div><small>Waiting for a check…</small></div></div></div>
  <div style="height:16px"></div>
  <pre id="code">&lt;script src="${'${location.origin}'}/widget.js" data-url="https://example.com" data-label="Website status"&gt;&lt;/script&gt;</pre>
</div>
<script>
async function run(){
  const url=document.getElementById('target').value.trim();
  const label=document.getElementById('label').value.trim() || 'Website status';
  const dot=document.getElementById('dot');
  const copy=document.getElementById('statusCopy');
  copy.innerHTML='<strong>'+label.replace(/</g,'&lt;')+'</strong><div><small>Checking '+url.replace(/</g,'&lt;')+'…</small></div>';
  dot.style.background='#94a3b8';
  const res=await fetch('/status?url='+encodeURIComponent(url));
  const data=await res.json();
  dot.style.background=data.ok?'#16a34a':'#dc2626';
  copy.innerHTML='<strong>'+label.replace(/</g,'&lt;')+'</strong><div><small>'+(data.label||'Unknown')+' · HTTP '+(data.status||'—')+' · '+(data.duration||0)+'ms</small></div>';
  document.getElementById('code').textContent='<script src="'+location.origin+'/widget.js" data-url="'+url.replace(/"/g,'&quot;')+'" data-label="'+label.replace(/"/g,'&quot;')+'"><\\/script>';
}
document.getElementById('run').addEventListener('click', run);run();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json;charset=UTF-8'};}
function textH(){return{...corsHeaders(),'Content-Type':'text/plain;charset=UTF-8'};}
