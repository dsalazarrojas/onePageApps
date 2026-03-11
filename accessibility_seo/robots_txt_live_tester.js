addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  if(url.pathname==='/test' && request.method==='POST'){return testRobots(request);}
  return new Response(pageHTML(),{headers:htmlH()});
}
function widgetJS(){
  return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:600px;border:none;border-radius:8px;';el.title='Robots.txt Tester';(s&&s.parentNode||document.body).appendChild(el);})()`  ;
}
async function testRobots(req){
  try{
    const {robotsUrl,testUrl,userAgent}=await req.json();
    const res=await fetch(robotsUrl||'',{signal:AbortSignal.timeout(8000)});
    const text=await res.text();
    const ua=userAgent||'*';
    const result=parseRobots(text,testUrl||'',ua);
    return new Response(JSON.stringify({...result,rawRobots:text.slice(0,2000)}),{headers:jsonH()});
  }catch(e){return new Response(JSON.stringify({error:String(e)}),{status:502,headers:jsonH()});}
}
function parseRobots(txt,testPath,ua){
  const lines=txt.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#'));
  let current=[];
  let rules=[];
  let inBlock=false;
  for(const line of lines){
    const [key,...rest]=line.split(':');
    const val=rest.join(':').trim();
    if(key.toLowerCase()==='user-agent'){
      if(inBlock&&current.length)rules.push([...current]);
      current=[{type:'ua',val}];
      inBlock=true;
    } else if(inBlock&&(key.toLowerCase()==='disallow'||key.toLowerCase()==='allow')){
      current.push({type:key.toLowerCase(),val});
    }
  }
  if(inBlock&&current.length)rules.push([...current]);
  let applicable=[];
  for(const block of rules){
    const uas=block.filter(r=>r.type==='ua').map(r=>r.val.toLowerCase());
    if(uas.includes(ua.toLowerCase())||uas.includes('*')){
      applicable=applicable.concat(block.filter(r=>r.type!=='ua'));
    }
  }
  let allowed=true;
  let matchedRule=null;
  for(const r of applicable){
    if(r.val&&testPath.startsWith(r.val)){
      allowed=r.type==='allow';
      matchedRule=r;
    }
  }
  return{allowed,matchedRule,applicableRules:applicable};
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Robots.txt Live Tester</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}input{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}button{margin-top:14px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}#res{margin-top:18px;padding:14px;border-radius:8px;font-size:.88rem;display:none}.allow{background:#f0fdf4;border-left:4px solid #22c55e;color:#15803d}.deny{background:#fef2f2;border-left:4px solid #ef4444;color:#b91c1c}pre{background:#1e1e2e;color:#cdd6f4;padding:12px;border-radius:6px;font-size:.75rem;overflow-x:auto;white-space:pre-wrap;margin-top:10px}</style></head><body>
<h1>🤖 Robots.txt Live Tester</h1>
<label>Robots.txt URL<input id="ru" value="https://example.com/robots.txt" type="url"></label>
<label>URL path to test<input id="tp" value="/private/page" placeholder="/some/path"></label>
<label>User-agent<input id="ua" value="Googlebot" placeholder="Googlebot"></label>
<button onclick="run()">Test</button>
<div id="res"></div>
<script>
async function run(){
  var el=document.getElementById('res');el.style.display='block';el.className='';el.innerHTML='Testing…';
  var r=await fetch('/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({robotsUrl:document.getElementById('ru').value,testUrl:document.getElementById('tp').value,userAgent:document.getElementById('ua').value})});
  var d=await r.json();
  if(d.error){el.innerHTML='Error: '+d.error;el.className='deny';return;}
  el.className=d.allowed?'allow':'deny';
  el.innerHTML=(d.allowed?'✅ ALLOWED':'❌ DISALLOWED')+(d.matchedRule?'<br><small>Matched: '+d.matchedRule.type+' '+d.matchedRule.val+'</small>':'<br><small>No specific rule; default allow</small>');
  if(d.rawRobots)el.innerHTML+='<pre>'+d.rawRobots.replace(/</g,'&lt;')+'</pre>';
}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
