addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return "(function(){var s=document.currentScript;var msg=(s&&s.dataset.message)||'Welcome!';var bg=(s&&s.dataset.bg)||'#1a73e8';var fg=(s&&s.dataset.fg)||'#fff';var pos=(s&&s.dataset.position)||'top';var dur=Number(s&&s.dataset.duration)||0;var dis=(s&&s.dataset.dismissible)!=='false';if(localStorage.getItem('notif_dismissed_'+msg)) return;var b=document.createElement('div');b.style.cssText='position:fixed;'+(pos==='bottom'?'bottom:0;':'top:0;')+'left:0;right:0;z-index:99999;background:'+bg+';color:'+fg+';padding:12px 16px;font-family:sans-serif;font-size:14px;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.25)';var t=document.createElement('span');t.innerHTML=msg;b.appendChild(t);if(dis){var x=document.createElement('button');x.textContent='\u2715';x.style.cssText='background:none;border:none;color:'+fg+';font-size:18px;cursor:pointer;margin-left:auto;padding:0 4px;line-height:1';x.onclick=function(){b.remove();localStorage.setItem('notif_dismissed_'+msg,'1');};b.appendChild(x);}document.body.prepend(b);if(dur>0)setTimeout(function(){b.remove();},dur);})()" ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Notification Banner Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🔔 Notification Banner Generator</h1>
<label>Message<input id="msg" value="🎉 Welcome! Check out our latest offers."></label>
<label>Background<input id="bg" type="color" value="#1a73e8" style="height:38px"></label>
<label>Text colour<input id="fg" type="color" value="#ffffff" style="height:38px"></label>
<label>Position<select id="pos"><option value="top">Top</option><option value="bottom">Bottom</option></select></label>
<label>Auto-dismiss ms (0=never)<input id="dur" type="number" value="0" min="0"></label>
<label><input id="dis" type="checkbox" checked style="width:auto"> Dismissible</label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var c='<script src="'+base+'/widget.js" data-message="'+document.getElementById('msg').value+'" data-bg="'+document.getElementById('bg').value+'" data-fg="'+document.getElementById('fg').value+'" data-position="'+document.getElementById('pos').value+'" data-duration="'+document.getElementById('dur').value+'" data-dismissible="'+document.getElementById('dis').checked+'"><\\/script>';document.getElementById('code').textContent=c;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
