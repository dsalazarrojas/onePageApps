addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

const QUOTES=[["The only way to do great work is to love what you do.", "Steve Jobs"], ["In the middle of every difficulty lies opportunity.", "Albert Einstein"], ["It does not matter how slowly you go as long as you do not stop.", "Confucius"], ["Life is what happens when you're busy making other plans.", "John Lennon"], ["The future belongs to those who believe in the beauty of their dreams.", "Eleanor Roosevelt"], ["Spread love everywhere you go.", "Mother Teresa"], ["When you reach the end of your rope, tie a knot in it and hang on.", "Franklin D. Roosevelt"], ["Always remember that you are absolutely unique. Just like everyone else.", "Margaret Mead"], ["Do not go where the path may lead, go instead where there is no path and leave a trail.", "Ralph Waldo Emerson"], ["You will face many defeats in life, but never let yourself be defeated.", "Maya Angelou"]];
function widgetJS(){
  return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;max-width:640px;height:160px;border:none;border-radius:10px;';el.title='Quote of the Day';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})()`  ;
}
function pageHTML(){
  const idx=Math.floor(Date.now()/86400000)%QUOTES.length;
  const [q,a]=QUOTES[idx];
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quote of the Day</title>
<style>*{box-sizing:border-box}body{font-family:Georgia,serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;margin:0}blockquote{background:rgba(255,255,255,.15);backdrop-filter:blur(10px);border-radius:12px;padding:28px 32px;max-width:580px;color:#fff;margin:0;border-left:4px solid rgba(255,255,255,.5)}p{font-size:1.15rem;line-height:1.6;margin:0 0 12px;font-style:italic}cite{font-size:.9rem;opacity:.85;font-style:normal;font-weight:600}footer{margin-top:10px;font-family:sans-serif;font-size:.72rem;color:rgba(255,255,255,.6)}</style></head><body>
<blockquote><p>&ldquo;${q}&rdquo;</p><cite>&mdash; ${a}</cite></blockquote>
<footer>Embed: &lt;script src="${'https://your-worker.workers.dev/widget.js'}"&gt;&lt;/script&gt;</footer>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
