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
  var targetSel=(s&&s.dataset.target)||null;
  var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');
  var iframe=document.createElement('iframe');
  iframe.src=base+'/';
  iframe.style.cssText='width:320px;height:400px;border:none;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);display:none;position:fixed;z-index:99999;';
  document.body.appendChild(iframe);
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='emoji-pick'){
      var emoji=e.data.emoji;
      if(targetSel){var t=document.querySelector(targetSel);if(t){t.value=(t.value||'')+emoji;t.focus();}}
      document.dispatchEvent(new CustomEvent('emojiPicked',{detail:{emoji:emoji}}));
      iframe.style.display='none';
    }
  });
  window.EmojiPicker={
    open:function(x,y){iframe.style.left=Math.min(x,window.innerWidth-330)+'px';iframe.style.top=Math.min(y,window.innerHeight-410)+'px';iframe.style.display='block';},
    close:function(){iframe.style.display='none';},
    toggle:function(x,y){iframe.style.display=iframe.style.display==='none'?'block':'none';if(iframe.style.display==='block')this.open(x,y);}
  };
  if(targetSel){
    var targetEl=document.querySelector(targetSel);
    if(targetEl){
      var btn=document.createElement('button');btn.textContent='😊';btn.style.cssText='background:none;border:none;font-size:18px;cursor:pointer;padding:4px;';
      btn.onclick=function(e){e.stopPropagation();var r=targetEl.getBoundingClientRect();EmojiPicker.open(r.right,r.bottom+4);};
      if(targetEl.parentNode)targetEl.parentNode.insertBefore(btn,targetEl.nextSibling);
    }
  }
  document.addEventListener('click',function(e){if(!iframe.contains(e.target))iframe.style.display='none';});
})()`;
}
function pageHTML(){
  const EMOJIS = [
    ['😀','😂','😍','🥰','😎','🤔','😴','🥺','😭','🤩','😤','🙄','😱','🥳','��'],
    ['👍','👎','👋','🤝','🙏','💪','🎉','❤️','💔','💯','✅','❌','⭐','🔥','💥'],
    ['🎂','🍕','🍔','🍣','🍦','☕','🍺','🍎','🍋','🎵','🎮','⚽','🏆','🚀','🌍'],
    ['😺','🐶','🦁','🐸','🦋','🌸','🌊','🌈','☀️','⚡','💎','🔑','📱','💻','🎨'],
  ];
  const emojiRows = EMOJIS.map(row => row.map(e => 
    `<button class="e" onclick="pick('${e}')" title="${e}">${e}</button>`
  ).join('')).join('\\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Emoji Picker</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#fff;padding:10px;margin:0}input#q{width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:.9rem;margin-bottom:8px}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:2px}button.e{background:none;border:none;font-size:1.3rem;cursor:pointer;padding:4px;border-radius:4px;transition:background .1s;line-height:1.2}button.e:hover{background:#f3f4f6}.recent{margin-bottom:8px}.rec-label{font-size:.7rem;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}#recent-grid{display:flex;flex-wrap:wrap;gap:2px;min-height:28px}</style></head><body>
<input id="q" placeholder="Search emoji…" oninput="search()">
<div class="recent"><div class="rec-label">Recently used</div><div id="recent-grid"></div></div>
<div class="grid" id="grid">${emojiRows}</div>
<script>
var ALL=[${EMOJIS.flat().map(e=>`'${e}'`).join(',')}];
var recent=JSON.parse(localStorage.getItem('emoji_recent')||'[]');
function renderRecent(){document.getElementById('recent-grid').innerHTML=recent.slice(0,8).map(function(e){return'<button class=e onclick="pick(\\''+e+'\\')" >'+e+'</button>';}).join('');}
renderRecent();
function pick(e){recent=([e].concat(recent.filter(function(x){return x!==e;}))).slice(0,20);localStorage.setItem('emoji_recent',JSON.stringify(recent));renderRecent();if(window.parent!==window)window.parent.postMessage({type:'emoji-pick',emoji:e},'*');}
function search(){var q=document.getElementById('q').value;var grid=document.getElementById('grid');if(!q){grid.innerHTML=ALL.map(function(e){return'<button class=e onclick="pick(\\''+e+'\\')">'+e+'</button>';}).join('');return;}var filtered=ALL.filter(function(e){return true;});grid.innerHTML=filtered.map(function(e){return'<button class=e onclick="pick(\\''+e+'\\')">'+e+'</button>';}).join('');}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
