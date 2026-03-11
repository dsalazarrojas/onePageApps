addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return '(function(){if(sessionStorage.getItem("exit_intent_shown"))return;var s=document.currentScript;var title=(s&&s.dataset.title)||"Wait! Before you go\u2026";var msg=(s&&s.dataset.message)||"Subscribe for exclusive deals.";var cta=(s&&s.dataset.cta)||"Subscribe";var ctaUrl=(s&&s.dataset.ctaUrl)||"#";var delay=Number((s&&s.dataset.delay)||500);var shown=false;function show(){if(shown)return;shown=true;sessionStorage.setItem("exit_intent_shown","1");var ov=document.createElement("div");ov.style.cssText="position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center";var box=document.createElement("div");box.style.cssText="background:#fff;border-radius:12px;padding:32px 36px;max-width:420px;width:90%;text-align:center;position:relative;font-family:sans-serif";var cl=document.createElement("button");cl.textContent="\u2715";cl.style.cssText="position:absolute;top:10px;right:14px;background:none;border:none;font-size:18px;cursor:pointer;color:#666";cl.onclick=function(){ov.remove();};var h=document.createElement("h2");h.style.cssText="margin:0 0 12px;font-size:1.4rem;color:#1a1a2e";h.textContent=title;var p=document.createElement("p");p.style.cssText="color:#555;margin:0 0 20px;line-height:1.5";p.textContent=msg;var a=document.createElement("a");a.href=ctaUrl;a.textContent=cta;a.style.cssText="display:inline-block;padding:12px 28px;background:#e53e3e;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:.95rem";box.appendChild(cl);box.appendChild(h);box.appendChild(p);box.appendChild(a);ov.appendChild(box);document.body.appendChild(ov);ov.addEventListener("click",function(e){if(e.target===ov)ov.remove();});}document.addEventListener("mouseleave",function(e){if(e.clientY<10)setTimeout(show,delay);});})()'  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Exit Intent Popup Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#e53e3e;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🚪 Exit Intent Popup Generator</h1>
<label>Headline<input id="t" value="Wait! Before you go…"></label>
<label>Message<input id="m" value="Subscribe for exclusive deals."></label>
<label>CTA text<input id="c" value="Subscribe"></label>
<label>CTA URL<input id="cu" value="#"></label>
<label>Trigger delay (ms)<input id="d" type="number" value="500"></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-title="'+document.getElementById('t').value+'" data-message="'+document.getElementById('m').value+'" data-cta="'+document.getElementById('c').value+'" data-cta-url="'+document.getElementById('cu').value+'" data-delay="'+document.getElementById('d').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
