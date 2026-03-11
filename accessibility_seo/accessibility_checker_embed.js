addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: textH() });
  }
  if (url.pathname === '/widget.js') {
    return new Response(widgetJS(), { headers: jsH() });
  }
  return new Response(pageHTML(), { headers: htmlH() });
}

function widgetJS() {
  return `(function(){
    var s=document.currentScript;
    var base=(s&&s.src||'').replace(/\/widget\.js.*$/,'');
    var frame=document.createElement('iframe');
    frame.src=base+'/';
    frame.title='Accessibility Checker';
    frame.loading='lazy';
    frame.style.cssText='width:' + ((s&&s.dataset.width)||'100%') + ';height:' + ((s&&s.dataset.height)||'620px') + ';border:0;border-radius:14px;overflow:hidden;background:#fff;';
    (s&&s.parentNode||document.body).insertBefore(frame, s ? s.nextSibling : null);
  })();`;
}

function pageHTML() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accessibility Checker Embed</title>
<style>
*{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;max-width:980px;margin:0 auto;padding:24px 16px;background:#f8fafc;color:#0f172a}
.wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:20px}.card{background:#fff;border:1px solid #dbe4f0;border-radius:18px;padding:18px;box-shadow:0 14px 40px rgba(15,23,42,.06)}
h1{margin:0 0 8px;font-size:1.65rem}p{color:#475569;line-height:1.6}label{display:block;margin:10px 0 6px;font-size:.9rem;font-weight:600}textarea{width:100%;min-height:360px;border:1px solid #cbd5e1;border-radius:14px;padding:12px;font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}button{border:none;border-radius:999px;background:#2563eb;color:#fff;padding:10px 16px;font-weight:700;cursor:pointer}pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:14px;white-space:pre-wrap;overflow:auto;font-size:12px}ul{margin:0;padding-left:18px}.issue{border-left:4px solid #dc2626;padding:10px 12px;border-radius:10px;background:#fff5f5;margin:10px 0}.warn{border-color:#f59e0b;background:#fff9eb}.pass{border-color:#16a34a;background:#f0fdf4}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.metric{border:1px solid #dbe4f0;border-radius:14px;padding:12px;background:#f8fafc;text-align:center}.metric strong{display:block;font-size:1.4rem}
@media(max-width:900px){.wrap{grid-template-columns:1fr}}
</style></head><body>
<div class="card" style="margin-bottom:18px"><h1>♿ Accessibility Checker</h1><p>Paste HTML to scan for missing alt text, unlabeled fields, empty buttons/links, heading order problems, and missing language/title metadata.</p><pre>&lt;script src="${'${location.origin}'}/widget.js"&gt;&lt;/script&gt;</pre></div>
<div class="wrap">
  <section class="card">
    <label for="markup">HTML snippet</label>
    <textarea id="markup"><!doctype html>
<html>
  <body>
    <img src="/hero.jpg">
    <a href="#"></a>
    <form>
      <input type="email" placeholder="Email address">
      <button></button>
    </form>
    <h1>Welcome</h1>
    <h3>Skipped heading</h3>
  </body>
</html></textarea>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button type="button" id="analyze">Analyze HTML</button><button type="button" id="loadSample" style="background:#0f172a">Load sample</button></div>
  </section>
  <section class="card">
    <div class="summary" id="summary"></div>
    <div id="results"></div>
  </section>
</div>
<script>
const sample = document.getElementById('markup').value;
function textOf(node){return (node.textContent||'').replace(/\s+/g,' ').trim();}
function analyze(){
  const input=document.getElementById('markup').value.trim();
  const summary=document.getElementById('summary');
  const results=document.getElementById('results');
  if(!input){summary.innerHTML='';results.innerHTML='<div class="issue">Paste some HTML first.</div>';return;}
  const doc=new DOMParser().parseFromString(input,'text/html');
  const issues=[];
  const passes=[];
  const warns=[];

  const html=doc.querySelector('html');
  if(html && html.getAttribute('lang')) passes.push('HTML lang attribute present.');
  else issues.push('Missing <html lang="…"> attribute.');

  const title=doc.querySelector('title');
  if(title && textOf(title)) passes.push('Document title is present.');
  else warns.push('Missing <title>; screen reader/browser context will be weaker.');

  const imgs=[...doc.querySelectorAll('img')];
  const imgsMissingAlt=imgs.filter(img=>!img.hasAttribute('alt'));
  if(imgs.length && !imgsMissingAlt.length) passes.push('All images have alt attributes.');
  if(imgsMissingAlt.length) issues.push(imgsMissingAlt.length + ' image(s) missing alt text.');

  const controls=[...doc.querySelectorAll('input, select, textarea')];
  const unlabeled=controls.filter(control=>{
    if(control.type==='hidden') return false;
    const id=control.getAttribute('id');
    const label=id && doc.querySelector('label[for="'+CSS.escape(id)+'"]');
    return !label && !control.closest('label') && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby');
  });
  if(controls.length && !unlabeled.length) passes.push('All form fields have accessible names.');
  if(unlabeled.length) issues.push(unlabeled.length + ' form field(s) are missing a visible or ARIA label.');

  const interactive=[...doc.querySelectorAll('a, button')];
  const emptyInteractive=interactive.filter(node=>!textOf(node) && !node.getAttribute('aria-label') && !node.getAttribute('title'));
  if(interactive.length && !emptyInteractive.length) passes.push('Links and buttons have accessible text.');
  if(emptyInteractive.length) issues.push(emptyInteractive.length + ' link/button element(s) have no accessible text.');

  const headings=[...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(node=>Number(node.tagName[1]));
  let headingJump=false;
  for(let i=1;i<headings.length;i++){ if(headings[i]-headings[i-1] > 1){ headingJump=true; break; } }
  if(headings.includes(1)) passes.push('At least one H1 heading exists.');
  else warns.push('No H1 heading detected.');
  if(headingJump) warns.push('Heading levels jump by more than one step.');
  else if(headings.length) passes.push('Heading order looks consistent.');

  const landmarks=doc.querySelector('main, header, nav, footer, aside');
  if(landmarks) passes.push('Landmark regions detected.');
  else warns.push('Consider adding semantic landmarks like <main>, <nav>, or <footer>.');

  summary.innerHTML=[
    ['Errors', issues.length, '#dc2626'],
    ['Warnings', warns.length, '#f59e0b'],
    ['Passes', passes.length, '#16a34a']
  ].map(item=>'<div class="metric"><strong style="color:'+item[2]+'">'+item[1]+'</strong><span>'+item[0]+'</span></div>').join('');

  const blocks=[];
  issues.forEach(text=>blocks.push('<div class="issue"><strong>Error</strong><div>'+text+'</div></div>'));
  warns.forEach(text=>blocks.push('<div class="issue warn"><strong>Warning</strong><div>'+text+'</div></div>'));
  passes.forEach(text=>blocks.push('<div class="issue pass"><strong>Pass</strong><div>'+text+'</div></div>'));
  results.innerHTML=blocks.join('') || '<div class="issue pass"><strong>Pass</strong><div>No obvious issues detected.</div></div>';
}
document.getElementById('analyze').addEventListener('click', analyze);
document.getElementById('loadSample').addEventListener('click', function(){document.getElementById('markup').value=sample;analyze();});
analyze();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function textH(){return{...corsHeaders(),'Content-Type':'text/plain;charset=UTF-8'};}
