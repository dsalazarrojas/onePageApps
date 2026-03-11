addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return '(function(){var s=document.currentScript;var icon=(s&&s.dataset.icon)||"\u2191";var bg=(s&&s.dataset.bg)||"#1a73e8";var fg=(s&&s.dataset.fg)||"#fff";var size=Number((s&&s.dataset.size)||48);var thresh=Number((s&&s.dataset.threshold)||300);var btn=document.createElement("button");btn.innerHTML=icon;btn.style.cssText="position:fixed;bottom:24px;right:24px;z-index:99998;width:"+size+"px;height:"+size+"px;border-radius:50%;background:"+bg+";color:"+fg+";border:none;font-size:"+(size*0.45)+"px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .3s,transform .2s;display:flex;align-items:center;justify-content:center";btn.title="Back to top";btn.onclick=function(){window.scrollTo({top:0,behavior:"smooth"});};document.body.appendChild(btn);window.addEventListener("scroll",function(){var show=window.scrollY>thresh;btn.style.opacity=show?"1":"0";btn.style.pointerEvents=show?"auto":"none";},{passive:true});})()'  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Back to Top Button</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button.gen{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>⬆️ Back to Top Button</h1>
<label>Icon<input id="ic" value="↑"></label>
<label>Background<input id="bg" type="color" value="#1a73e8" style="height:38px"></label>
<label>Icon colour<input id="fg" type="color" value="#ffffff" style="height:38px"></label>
<label>Size (px)<input id="sz" type="number" value="48"></label>
<label>Scroll threshold (px)<input id="th" type="number" value="300"></label>
<button class="gen" onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-icon="'+document.getElementById('ic').value+'" data-bg="'+document.getElementById('bg').value+'" data-fg="'+document.getElementById('fg').value+'" data-size="'+document.getElementById('sz').value+'" data-threshold="'+document.getElementById('th').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
