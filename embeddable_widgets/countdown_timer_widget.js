addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return '(function(){var s=document.currentScript;var target=s&&s.dataset.target;var label=s&&s.dataset.label||"";var theme=(s&&s.dataset.theme)||"dark";if(!target){return;}var bg=theme==="dark"?"#1e1e2e":"#f0f4ff";var clr=theme==="dark"?"#cdd6f4":"#1a1a2e";var el=document.createElement("div");el.style.cssText="display:inline-flex;gap:16px;font-family:monospace;background:"+bg+";color:"+clr+";border-radius:10px;padding:16px 24px;";function unit(id){var d=document.createElement("div");d.style.cssText="text-align:center";var n=document.createElement("div");n.style.cssText="font-size:2rem;font-weight:700";n.id="cd-"+id;var l=document.createElement("div");l.style.cssText="font-size:.7rem;opacity:.7";l.textContent=id;d.appendChild(n);d.appendChild(l);el.appendChild(d);return n;}var dEl=unit("days"),hEl=unit("hours"),mEl=unit("mins"),sEl=unit("secs");if(s&&s.parentNode)s.parentNode.insertBefore(el,s.nextSibling);else document.body.appendChild(el);if(label){var lEl=document.createElement("p");lEl.style.cssText="text-align:center;font-family:sans-serif;margin:6px 0;font-size:.9rem;";lEl.textContent=label;el.parentNode&&el.parentNode.insertBefore(lEl,el);}function tick(){var diff=new Date(target)-new Date();if(diff<=0){dEl.textContent=hEl.textContent=mEl.textContent=sEl.textContent="00";return;}function pad(n){return String(Math.floor(n)).padStart(2,"0");}dEl.textContent=pad(diff/86400000);hEl.textContent=pad((diff%86400000)/3600000);mEl.textContent=pad((diff%3600000)/60000);sEl.textContent=pad((diff%60000)/1000);}tick();setInterval(tick,1000);})()'  ;
}
function pageHTML(){
  var d=new Date(Date.now()+7*86400000).toISOString().slice(0,16);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Countdown Timer Widget</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#111827;color:#e5e7eb;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:40px 16px}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#9ca3af;width:100%;max-width:440px}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #374151;border-radius:6px;background:#1f2937;color:#e5e7eb;font-size:.9rem}button{margin-top:18px;padding:10px 22px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.95rem}#cd{margin-top:24px;display:flex;gap:16px;font-family:monospace;background:#1e1e2e;color:#cdd6f4;border-radius:10px;padding:16px 24px}#cd .u{text-align:center}.n{font-size:2.5rem;font-weight:700}.l{font-size:.7rem;opacity:.7}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;max-width:520px;width:100%;overflow-x:auto;margin-top:16px;display:none;white-space:pre-wrap}</style></head><body>
<h1>⏳ Countdown Timer Widget</h1>
<label>Target date/time<input id="t" type="datetime-local" value="${d}"></label>
<label>Label (optional)<input id="lb" value="Event Countdown"></label>
<label>Theme<select id="th"><option value="dark">Dark</option><option value="light">Light</option></select></label>
<button onclick="gen()">Preview &amp; Generate</button>
<div id="cd"><div class="u"><div class="n" id="dd">--</div><div class="l">days</div></div><div class="u"><div class="n" id="hh">--</div><div class="l">hours</div></div><div class="u"><div class="n" id="mm">--</div><div class="l">mins</div></div><div class="u"><div class="n" id="ss">--</div><div class="l">secs</div></div></div>
<pre id="code"></pre>
<script>var iv;function gen(){var t=document.getElementById('t').value;if(!t)return;var lb=document.getElementById('lb').value;var th=document.getElementById('th').value;if(iv)clearInterval(iv);function tick(){var d=new Date(t)-new Date();if(d<=0){['dd','hh','mm','ss'].forEach(function(id){document.getElementById(id).textContent='00';});return;}document.getElementById('dd').textContent=String(Math.floor(d/86400000)).padStart(2,'0');document.getElementById('hh').textContent=String(Math.floor((d%86400000)/3600000)).padStart(2,'0');document.getElementById('mm').textContent=String(Math.floor((d%3600000)/60000)).padStart(2,'0');document.getElementById('ss').textContent=String(Math.floor((d%60000)/1000)).padStart(2,'0');}tick();iv=setInterval(tick,1000);var code='<script src="'+location.origin+'/widget.js" data-target="'+new Date(t).toISOString()+'" data-label="'+lb+'" data-theme="'+th+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}gen();</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
