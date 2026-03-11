addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return `(function(){
  var s=document.currentScript;
  var highlight=(s&&s.dataset.highlight)!=='false';
  var outline=(s&&s.dataset.outline)||'2px solid #1a73e8';
  var style=document.createElement('style');
  style.id='kbt-style';
  style.textContent='*:focus-visible{outline:'+outline+'!important;outline-offset:3px!important;}body.kbt-active *:focus{outline:'+outline+'!important;outline-offset:3px!important;}';
  document.head.appendChild(style);
  var usingKeyboard=false;
  document.addEventListener('keydown',function(e){if(e.key==='Tab'||e.key==='ArrowUp'||e.key==='ArrowDown'){usingKeyboard=true;document.body.classList.add('kbt-active');}});
  document.addEventListener('mousedown',function(){usingKeyboard=false;document.body.classList.remove('kbt-active');});
  if(highlight){
    document.addEventListener('focusin',function(e){e.target.setAttribute('data-kbt-focused','1');});
    document.addEventListener('focusout',function(e){e.target.removeAttribute('data-kbt-focused');});
  }
  var badge=document.createElement('div');
  badge.style.cssText='position:fixed;bottom:4px;left:4px;z-index:999999;background:#1a73e8;color:#fff;font-size:10px;font-family:monospace;padding:2px 6px;border-radius:3px;opacity:0;transition:opacity .3s;pointer-events:none;';
  badge.id='kbt-badge';document.body.appendChild(badge);
  document.addEventListener('focusin',function(e){var t=e.target;if(!usingKeyboard)return;badge.style.opacity='1';badge.textContent=(t.tagName.toLowerCase())+(t.id?'#'+t.id:'')+(t.getAttribute('role')?'[role='+t.getAttribute('role')+']':'');});
  document.addEventListener('focusout',function(){badge.style.opacity='0';});
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Keyboard Navigation Tester</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}p{color:#555;font-size:.9rem}label{display:block;margin-top:12px;font-size:.85rem;color:#555}input,select{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px}button{margin-top:18px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>⌨️ Keyboard Navigation Tester</h1>
<p>Enhances focus visibility and shows a badge indicating the focused element when navigating by keyboard (Tab/Arrow keys).</p>
<label>Focus outline CSS<input id="ol" value="2px solid #1a73e8"></label>
<label><input id="hl" type="checkbox" checked style="width:auto"> Show focus badge</label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-outline="'+document.getElementById('ol').value+'" data-highlight="'+document.getElementById('hl').checked+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
