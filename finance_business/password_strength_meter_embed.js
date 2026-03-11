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
  var inputSel=(s&&s.dataset.input)||'input[type=password]';
  var style=document.createElement('style');
  style.textContent='.pw-meter{height:4px;border-radius:2px;margin-top:4px;transition:width .3s,background .3s;width:0%}.pw-hint{font-size:.75rem;font-family:sans-serif;margin-top:3px;color:#6b7280}';
  document.head.appendChild(style);
  function attach(input){
    var bar=document.createElement('div');bar.className='pw-meter';
    var hint=document.createElement('div');hint.className='pw-hint';
    if(input.parentNode){input.insertAdjacentElement('afterend',hint);input.insertAdjacentElement('afterend',bar);}
    input.addEventListener('input',function(){
      var v=this.value;var score=0;
      if(v.length>=8)score++;if(v.length>=12)score++;
      if(/[A-Z]/.test(v))score++;if(/[a-z]/.test(v))score++;
      if(/[0-9]/.test(v))score++;if(/[^A-Za-z0-9]/.test(v))score++;
      var pct=Math.round(score/6*100);
      var colors=['#ef4444','#f97316','#eab308','#22c55e','#22c55e'];
      var labels=['Very Weak','Weak','Fair','Strong','Very Strong'];
      var idx=Math.min(4,Math.floor(score/1.5));
      bar.style.width=pct+'%';bar.style.background=colors[idx];
      hint.textContent=v.length?labels[idx]:'';
    });
  }
  function init(){document.querySelectorAll(inputSel).forEach(attach);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.PasswordMeter={attach:attach};
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Password Strength Meter</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.3rem}p{font-size:.9rem;color:#555}label{display:block;margin-top:12px;font-size:.85rem;color:#555;font-weight:500}input.pw{width:100%;padding:9px;border:1px solid #ccc;border-radius:6px;font-size:1rem;margin-top:4px}input[type=text]{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}button{margin-top:14px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;display:none;white-space:pre-wrap}</style></head><body>
<h1>🔐 Password Strength Meter</h1>
<p>Injects a visual strength meter below any password input on the host page.</p>
<label>Live demo<input class="pw" type="password" placeholder="Type a password…"></label>
<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb">
<label>Target CSS selector<input id="sel" type="text" value="input[type=password]"></label>
<button onclick="gen()">Generate Embed Code</button>
<pre id="code"></pre>
<script src="/widget.js" data-input="input.pw"></script>
<script>function gen(){var base=location.origin;var code='<script src="'+base+'/widget.js" data-input="'+document.getElementById('sel').value+'"><\\/script>';document.getElementById('code').textContent=code;document.getElementById('code').style.display='block';}</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
