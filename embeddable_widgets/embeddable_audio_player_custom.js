addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:120px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  const url = new URL("dummy://host");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Audio Player</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#1e1e2e;color:#cdd6f4;margin:0;padding:12px;display:flex;flex-direction:column;gap:10px}.player{display:flex;align-items:center;gap:12px;background:#2a2a3e;border-radius:10px;padding:12px 14px}.title{font-size:.88rem;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#cdd6f4}button.play{background:#3b82f6;color:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.progress{flex:1;height:4px;background:#374151;border-radius:2px;cursor:pointer;position:relative}.progress-fill{height:100%;background:#3b82f6;border-radius:2px;width:0%;transition:width .1s}.time{font-size:.72rem;color:#6b7280;min-width:40px;text-align:right}input[type=range]{width:70px;accent-color:#3b82f6}.track-form{display:none;background:#2a2a3e;border-radius:10px;padding:12px;gap:8px;flex-direction:column}input[type=url],input[type=text]{padding:7px 10px;border:1px solid #374151;border-radius:6px;font-size:.85rem;background:#111827;color:#e5e7eb;width:100%}button.add{background:#059669;color:#fff;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:.85rem}button.open-form{background:none;border:none;color:#6b7280;cursor:pointer;font-size:.85rem;padding:2px 6px}</style></head><body>
<div class="player">
  <button class="play" id="play-btn" onclick="toggle()">▶</button>
  <div style="flex:1;min-width:0">
    <div class="title" id="title">No track loaded</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
      <div class="progress" id="progress" onclick="seek(event)"><div class="progress-fill" id="pf"></div></div>
      <span class="time" id="time">0:00</span>
    </div>
  </div>
  <input type="range" id="vol" min="0" max="1" step="0.05" value="0.8" oninput="setVol()">
  <button class="open-form" onclick="document.getElementById('track-form').style.display='flex'">+</button>
</div>
<div class="track-form" id="track-form">
  <input type="text" id="t-name" placeholder="Track title" value="My Track">
  <input type="url" id="t-url" placeholder="https://example.com/audio.mp3">
  <button class="add" onclick="loadTrack()">Load Track</button>
</div>
<audio id="audio"></audio>
<script>
var audio=document.getElementById('audio');
audio.addEventListener('timeupdate',function(){var d=audio.duration||0;var c=audio.currentTime;document.getElementById('pf').style.width=(d?(c/d*100):0)+'%';var m=Math.floor(c/60);var s=Math.floor(c%60);document.getElementById('time').textContent=m+':'+(s<10?'0':'')+s;});
audio.addEventListener('ended',function(){document.getElementById('play-btn').textContent='▶';});
function toggle(){if(audio.paused){audio.play();document.getElementById('play-btn').textContent='⏸';}else{audio.pause();document.getElementById('play-btn').textContent='▶';}}
function seek(e){var p=document.getElementById('progress');var r=p.getBoundingClientRect();var pct=(e.clientX-r.left)/r.width;audio.currentTime=audio.duration*pct;}
function setVol(){audio.volume=document.getElementById('vol').value;}
function loadTrack(){var url=document.getElementById('t-url').value;var name=document.getElementById('t-name').value;if(!url)return;audio.src=url;audio.volume=document.getElementById('vol').value;document.getElementById('title').textContent=name||url.split('/').pop();document.getElementById('track-form').style.display='none';audio.play();document.getElementById('play-btn').textContent='⏸';}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
