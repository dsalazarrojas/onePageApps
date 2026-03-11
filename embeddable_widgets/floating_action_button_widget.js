addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return '(function(){var s=document.currentScript;var icon=(s&&s.dataset.icon)||"\u{1F4AC}";var bg=(s&&s.dataset.bg)||"#1a73e8";var href=(s&&s.dataset.href)||"#";var pos=(s&&s.dataset.position)||"bottom-right";var size=Number((s&&s.dataset.size)||56);var tip=(s&&s.dataset.tooltip)||"";var btn=document.createElement("a");btn.href=href;btn.innerHTML=icon;btn.title=tip;var v=pos.includes("bottom")?"bottom:24px;":"top:24px;";var h=pos.includes("right")?"right:24px;":"left:24px;";btn.style.cssText="position:fixed;"+v+h+"z-index:99998;width:"+size+"px;height:"+size+"px;border-radius:50%;background:"+bg+";color:#fff;display:flex;align-items:center;justify-content:center;font-size:"+(size*0.45)+"px;box-shadow:0 4px 14px rgba(0,0,0,.3);text-decoration:none;transition:transform .2s;";btn.onmouseenter=function(){this.style.transform="scale(1.12)";};btn.onmouseleave=function(){this.style.transform="scale(1)";};document.body.appendChild(btn);})()'  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Floating Action Button Widget</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🔵 Floating Action Button Widget</h1>
<label>Icon / Emoji<input id="ic" value="💬"></label>
<label>Link URL<input id="hr" value="#"></label>
<label>Tooltip<input id="tt" value="Chat with us"></label>
<label>Background<input id="bg" type="color" value="#1a73e8" style="height:38px"></label>
<label>Position<select id="pos"><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="top-right">Top Right</option><option value="top-left">Top Left</option></select></label>
<label>Size (px)<input id="sz" type="number" value="56"></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var c='<script src="'+base+'/widget.js" data-icon="'+document.getElementById('ic').value+'" data-href="'+document.getElementById('hr').value+'" data-tooltip="'+document.getElementById('tt').value+'" data-bg="'+document.getElementById('bg').value+'" data-position="'+document.getElementById('pos').value+'" data-size="'+document.getElementById('sz').value+'"><\\/script>';document.getElementById('code').textContent=c;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
