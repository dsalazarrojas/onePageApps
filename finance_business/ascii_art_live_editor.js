addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:520px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASCII Art Editor</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}input[type=text]{flex:1;min-width:200px;padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}input[type=number]{width:70px;padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:.9rem}select{padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:.88rem}button{padding:8px 16px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.88rem}.copy{background:#059669}#out{background:#1e1e2e;color:#4ade80;padding:16px;border-radius:8px;font-family:monospace;font-size:14px;overflow-x:auto;white-space:pre;min-height:80px;margin-top:10px;user-select:all}</style></head><body>
<h1>⌨️ ASCII Art Live Editor</h1>
<div class="toolbar">
  <input type="text" id="txt" value="HELLO" oninput="gen()">
  <input type="number" id="sz" value="7" min="3" max="12" oninput="gen()">
  <select id="style" onchange="gen()"><option value="block">Block</option><option value="banner">Banner</option><option value="slant">Slant</option></select>
  <button onclick="gen()">Generate</button>
  <button class="copy" onclick="copy()">Copy</button>
</div>
<div id="out"></div>
<script>
var CHARS={
  A:["  # ","#  #","####","#  #","#  #"],
  B:["### ","#  #","### ","#  #","### "],
  C:[" ###","#   ","#   ","#   "," ###"],
  D:["### ","#  #","#  #","#  #","### "],
  E:["####","#   ","### ","#   ","####"],
  F:["####","#   ","### ","#   ","#   "],
  G:[" ###","#   ","# ##","#  #"," ###"],
  H:["#  #","#  #","####","#  #","#  #"],
  I:[" # "," # "," # "," # "," # "],
  J:["  #","  #","  #","# #"," # "],
  K:["#  #","# # ","##  ","# # ","#  #"],
  L:["#   ","#   ","#   ","#   ","####"],
  M:["#   #","## ##","# # #","#   #","#   #"],
  N:["#   #","##  #","# # #","#  ##","#   #"],
  O:[" ### ","#   #","#   #","#   #"," ### "],
  P:["### ","#  #","### ","#   ","#   "],
  Q:[" ### ","#   #","# # #","#  ##"," ####"],
  R:["### ","#  #","### ","# # ","#  #"],
  S:[" ###","#   "," ## ","   #","### "],
  T:["#####","  #  ","  #  ","  #  ","  #  "],
  U:["#  #","#  #","#  #","#  #"," ## "],
  V:["#   #","#   #","#   #"," # # ","  #  "],
  W:["#   #","#   #","# # #","## ##","#   #"],
  X:["#   #"," # # ","  #  "," # # ","#   #"],
  Y:["#   #"," # # ","  #  ","  #  ","  #  "],
  Z:["#####","   # ","  #  "," #   ","#####"],
  " ":["   ","   ","   ","   ","   "],
  "0":[" # ","# #","# #","# #"," # "],
  "1":[" # ","## "," # "," # ","###"],
  "2":[" # ","# #","  #"," # ","###"],
  "!":["#","#","#"," ","#"],
  "?":[" ## ","#  #","  # ","    ","  # "],
};
function gen(){
  var txt=(document.getElementById('txt').value||'').toUpperCase().slice(0,20);
  var style=document.getElementById('style').value;
  if(style==='banner'){genBanner(txt);return;}
  if(style==='slant'){genSlant(txt);return;}
  var lines=['','','','',''];
  txt.split('').forEach(function(c){var ch=CHARS[c]||CHARS['?'];for(var i=0;i<5;i++)lines[i]+=(ch[i]||'   ')+'  ';});
  document.getElementById('out').textContent=lines.join('\\n');
}
function genBanner(txt){
  var lines=['','','','','','',''];
  txt.split('').forEach(function(c){var ch=CHARS[c]||CHARS['?'];var w=(ch[0]||'').length;for(var i=0;i<5;i++){var row=ch[i]||'';var l='';for(var j=0;j<row.length;j++)l+=row[j]==='#'?'##':'  ';lines[i]+=l+'   ';}});
  document.getElementById('out').textContent=lines.slice(0,5).join('\\n');
}
function genSlant(txt){
  var lines=['','','','','',''];
  var off=0;
  txt.split('').forEach(function(c){var ch=CHARS[c]||CHARS['?'];var w=(ch[0]||'').length;for(var i=0;i<5;i++){var pad=' '.repeat(4-i);var row=ch[i]||'';lines[i]+=' '.repeat(off)+pad+row+'   ';}off+=1;});
  document.getElementById('out').textContent=lines.join('\\n');
}
function copy(){navigator.clipboard.writeText(document.getElementById('out').textContent);}
gen();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
