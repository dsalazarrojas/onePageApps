addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return '(function(){var s=document.currentScript;var pos=(s&&s.dataset.position)||"bottom-right";var dc=(s&&s.dataset.darkClass)||"dark-mode";var li=(s&&s.dataset.lightIcon)||"\u2600\uFE0F";var di=(s&&s.dataset.darkIcon)||"\uD83C\uDF19";var size=Number((s&&s.dataset.size)||44);var stored=localStorage.getItem("dm_pref");var isDark=stored?stored==="dark":(window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches);if(isDark)document.documentElement.classList.add(dc);var btn=document.createElement("button");btn.id="dm-toggle";var v=pos.includes("bottom")?"bottom:20px;":"top:20px;";var h=pos.includes("right")?"right:20px;":"left:20px;";btn.style.cssText="position:fixed;"+v+h+"z-index:99998;width:"+size+"px;height:"+size+"px;border-radius:50%;background:rgba(128,128,128,.2);backdrop-filter:blur(4px);border:1px solid rgba(128,128,128,.3);cursor:pointer;font-size:"+(size*0.5)+"px;display:flex;align-items:center;justify-content:center;transition:transform .2s";btn.title="Toggle dark mode";function render(){btn.textContent=isDark?li:di;}render();btn.onclick=function(){isDark=!isDark;document.documentElement.classList.toggle(dc,isDark);localStorage.setItem("dm_pref",isDark?"dark":"light");render();};document.body.appendChild(btn);})()'  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Dark Mode Toggle Widget</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}p{font-size:.9rem;color:#555}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button.gen{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🌙 Dark Mode Toggle Widget</h1>
<p>Toggles a CSS class on <code>&lt;html&gt;</code> and persists preference in <code>localStorage</code>.</p>
<label>Dark-mode CSS class<input id="dc" value="dark-mode"></label>
<label>Light icon (shown when dark)<input id="li" value="☀️"></label>
<label>Dark icon (shown when light)<input id="di" value="🌙"></label>
<label>Position<select id="pos"><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option><option value="top-right">Top Right</option><option value="top-left">Top Left</option></select></label>
<label>Size (px)<input id="sz" type="number" value="44"></label>
<button class="gen" onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-dark-class="'+document.getElementById('dc').value+'" data-light-icon="'+document.getElementById('li').value+'" data-dark-icon="'+document.getElementById('di').value+'" data-position="'+document.getElementById('pos').value+'" data-size="'+document.getElementById('sz').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
