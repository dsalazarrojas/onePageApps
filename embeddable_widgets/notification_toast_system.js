addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return `(function(){
  var stack=null;
  function ensureStack(){
    if(stack&&document.body.contains(stack))return;
    stack=document.createElement('div');
    stack.id='toast-stack';
    stack.style.cssText='position:fixed;bottom:20px;right:20px;z-index:999999;display:flex;flex-direction:column-reverse;gap:8px;';
    document.body.appendChild(stack);
  }
  window.Toast={
    show:function(msg,opts){
      ensureStack();
      opts=opts||{};
      var type=opts.type||'info';
      var dur=opts.duration||3500;
      var colors={info:'#3b82f6',success:'#22c55e',warning:'#f59e0b',error:'#ef4444'};
      var t=document.createElement('div');
      t.style.cssText='background:'+(colors[type]||colors.info)+';color:#fff;padding:12px 18px;border-radius:8px;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.2);opacity:0;transform:translateX(20px);transition:all .3s;display:flex;align-items:center;gap:10px;max-width:320px;';
      t.textContent=msg;
      if(opts.dismissible!==false){var cl=document.createElement('button');cl.textContent='\u2715';cl.style.cssText='background:none;border:none;color:#fff;cursor:pointer;font-size:14px;padding:0;margin-left:auto;opacity:.8';cl.onclick=function(){dismiss(t);};t.appendChild(cl);}
      stack.appendChild(t);
      setTimeout(function(){t.style.opacity='1';t.style.transform='translateX(0)';},10);
      if(dur>0)setTimeout(function(){dismiss(t);},dur);
    },
    info:function(m,o){this.show(m,Object.assign({type:'info'},o));},
    success:function(m,o){this.show(m,Object.assign({type:'success'},o));},
    warning:function(m,o){this.show(m,Object.assign({type:'warning'},o));},
    error:function(m,o){this.show(m,Object.assign({type:'error'},o));}
  };
  function dismiss(t){t.style.opacity='0';t.style.transform='translateX(20px)';setTimeout(function(){t&&t.remove();},300);}
})()`;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Toast Notification System</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;padding:0 16px;background:#f5f7fa}h1{font-size:1.4rem}p{color:#555;font-size:.9rem}.btns{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}.btn{padding:10px 20px;border:none;border-radius:6px;cursor:pointer;color:#fff;font-size:.9rem;font-weight:500}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;white-space:pre-wrap}</style></head><body>
<h1>🔔 Notification Toast System</h1>
<p>Include the widget script and call <code>Toast.show()</code> anywhere on the page.</p>
<div class="btns">
  <button class="btn" style="background:#3b82f6" onclick="Toast.info('ℹ️ Information message')">Info</button>
  <button class="btn" style="background:#22c55e" onclick="Toast.success('✅ Action completed!')">Success</button>
  <button class="btn" style="background:#f59e0b" onclick="Toast.warning('⚠️ Watch out!')">Warning</button>
  <button class="btn" style="background:#ef4444" onclick="Toast.error('❌ Something went wrong')">Error</button>
</div>
<pre>&lt;script src="https://your-worker.workers.dev/widget.js"&gt;&lt;/script&gt;

// Usage:
Toast.info('Hello!');
Toast.success('Saved!', { duration: 4000 });
Toast.warning('Low storage', { dismissible: true });
Toast.error('Request failed', { duration: 0 }); // no auto-dismiss</pre>
<script src="/widget.js"></script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
