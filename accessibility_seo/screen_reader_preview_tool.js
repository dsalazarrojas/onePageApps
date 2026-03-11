addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:560px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Screen Reader Preview</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}textarea,input{width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:.9rem;margin-top:4px}label{display:block;margin-top:10px;font-size:.85rem;color:#555;font-weight:500}button{margin-top:12px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}#tree{margin-top:20px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:14px;font-family:monospace;font-size:.8rem;overflow-x:auto;display:none}.node{padding:2px 0 2px 16px;border-left:1px dashed #d1d5db;line-height:1.6}.role{color:#7c3aed;font-weight:600}.name{color:#1a73e8}.desc{color:#6b7280}</style></head><body>
<h1>👁️ Screen Reader Preview</h1>
<label>Paste HTML snippet<textarea id="html" rows="8" placeholder="&lt;nav aria-label=&quot;Main&quot;&gt;...&lt;/nav&gt;"></textarea></label>
<button onclick="run()">Build Accessibility Tree</button>
<div id="tree"></div>
<script>
function run(){
  var html=document.getElementById('html').value;
  var div=document.createElement('div');div.innerHTML=html;
  var out='';
  function walk(node,depth){
    if(node.nodeType===3){var t=node.textContent.trim();if(t)out+='<div class="node" style="padding-left:'+(depth*16+4)+'px"><span class="role">text</span> <span class="name">"'+t.replace(/</g,'&lt;').slice(0,80)+'"</span></div>';return;}
    if(node.nodeType!==1)return;
    var tag=node.tagName.toLowerCase();
    var role=node.getAttribute('role')||implicitRole(tag);
    var name=node.getAttribute('aria-label')||node.getAttribute('alt')||node.getAttribute('title')||node.getAttribute('placeholder')||'';
    var state='';
    if(node.hasAttribute('aria-expanded'))state+=' [expanded='+node.getAttribute('aria-expanded')+']';
    if(node.hasAttribute('aria-checked'))state+=' [checked='+node.getAttribute('aria-checked')+']';
    if(node.hasAttribute('aria-hidden')&&node.getAttribute('aria-hidden')==='true'){out+='<div class="node" style="padding-left:'+(depth*16+4)+'px"><span class="desc">hidden: &lt;'+tag+'&gt;</span></div>';return;}
    out+='<div class="node" style="padding-left:'+(depth*16+4)+'px"><span class="role">&lt;'+tag+'&gt; ['+role+']</span>'+(name?' <span class="name">"'+name.replace(/</g,'&lt;').slice(0,60)+'"</span>':'')+(state?'<span class="desc">'+state+'</span>':'')+'</div>';
    Array.from(node.childNodes).forEach(function(c){walk(c,depth+1);});
  }
  Array.from(div.childNodes).forEach(function(c){walk(c,0);});
  var el=document.getElementById('tree');el.innerHTML=out||'<i>Nothing to show</i>';el.style.display='block';
}
function implicitRole(tag){var map={a:'link',button:'button',input:'input',select:'listbox',textarea:'textbox',nav:'navigation',main:'main',header:'banner',footer:'contentinfo',aside:'complementary',section:'region',article:'article',ul:'list',ol:'list',li:'listitem',h1:'heading',h2:'heading',h3:'heading',h4:'heading',h5:'heading',h6:'heading',img:'img',form:'form',table:'table',th:'columnheader',td:'cell'};return map[tag]||'generic';}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
