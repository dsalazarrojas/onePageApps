addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return '(function(){var s=document.currentScript;var tz=(s&&s.dataset.timezone)||Intl.DateTimeFormat().resolvedOptions().timeZone;var fmt=(s&&s.dataset.format)||"HH:MM:SS";var label=(s&&s.dataset.label)||"";var theme=(s&&s.dataset.theme)||"dark";var bg=theme==="dark"?"#1e1e2e":"#f0f4ff";var clr=theme==="dark"?"#cdd6f4":"#1a1a2e";var el=document.createElement("div");el.style.cssText="display:inline-block;font-family:monospace;font-size:1.8rem;font-weight:700;background:"+bg+";color:"+clr+";border-radius:8px;padding:10px 20px;line-height:1.2";if(label){var lEl=document.createElement("div");lEl.style.cssText="font-family:sans-serif;font-size:.7rem;font-weight:400;opacity:.7;text-align:center;margin-top:4px";lEl.textContent=label;el.appendChild(lEl);}var t=document.createElement("div");t.id="live-clock-txt";el.insertBefore(t,el.firstChild);if(s&&s.parentNode)s.parentNode.insertBefore(el,s.nextSibling);else document.body.appendChild(el);function tick(){var now=new Date();var opts={timeZone:tz,hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"};try{t.textContent=now.toLocaleTimeString("en-GB",opts);}catch(e){t.textContent=now.toLocaleTimeString();}}tick();setInterval(tick,1000);})()'  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Live Clock Widget</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}#preview{margin-top:20px;display:inline-block;font-family:monospace;font-size:1.8rem;font-weight:700;background:#1e1e2e;color:#cdd6f4;border-radius:8px;padding:10px 20px}</style></head><body>
<h1>🕐 Live Clock Widget</h1>
<label>Timezone (IANA)<input id="tz" value="America/New_York" list="tzlist"><datalist id="tzlist"><option value="UTC"><option value="America/New_York"><option value="America/Los_Angeles"><option value="Europe/London"><option value="Europe/Paris"><option value="Asia/Tokyo"><option value="Asia/Shanghai"><option value="Australia/Sydney"></datalist></label>
<label>Label (optional)<input id="lb" value="New York"></label>
<label>Theme<select id="th"><option value="dark">Dark</option><option value="light">Light</option></select></label>
<button onclick="gen()">Generate Embed Code</button>
<div id="preview">--:--:--</div>
<pre id="code"></pre>
<script>setInterval(function(){var tz=document.getElementById('tz').value;try{document.getElementById('preview').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}catch(e){}},1000);function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-timezone="'+document.getElementById('tz').value+'" data-label="'+document.getElementById('lb').value+'" data-theme="'+document.getElementById('th').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
