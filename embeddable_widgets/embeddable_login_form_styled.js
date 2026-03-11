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
  var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');
  var h=Number((s&&s.dataset.height)||480);
  var el=document.createElement('iframe');
  el.src=base+'/';
  el.style.cssText='width:100%;max-width:440px;height:'+h+'px;border:none;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.12);';
  el.title='Login Form';
  (s&&s.parentNode||document.body).appendChild(el);
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login Form</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;margin:0}.card{background:#fff;border-radius:16px;padding:40px 36px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.15)}h2{text-align:center;margin:0 0 28px;color:#1a1a2e;font-size:1.5rem}label{display:block;margin-bottom:16px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:.95rem;margin-top:4px;transition:border .2s}input:focus{outline:none;border-color:#667eea}button[type=submit]{width:100%;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:8px;transition:opacity .2s}button[type=submit]:hover{opacity:.9}.or{text-align:center;color:#9ca3af;font-size:.85rem;margin:16px 0;position:relative}.or::before,.or::after{content:'';position:absolute;top:50%;width:40%;height:1px;background:#e5e7eb;}.or::before{left:0}.or::after{right:0}.foot{text-align:center;margin-top:18px;font-size:.85rem;color:#6b7280}.foot a{color:#667eea;text-decoration:none}</style></head><body>
<div class="card">
  <h2>Welcome back</h2>
  <form onsubmit="return false">
    <label>Email address<input type="email" placeholder="you@example.com" autocomplete="email"></label>
    <label>Password<input type="password" placeholder="••••••••" autocomplete="current-password"></label>
    <button type="submit">Sign in</button>
  </form>
  <div class="or">or</div>
  <div class="foot">Don't have an account? <a href="#">Sign up</a></div>
</div>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
