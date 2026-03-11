addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:640px;border:none;border-radius:8px;';el.title='Schema Markup Generator';(s&&s.parentNode||document.body).appendChild(el);})()`  ;
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Schema Markup Generator</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}label{display:block;margin-top:10px;font-size:.84rem;color:#555;font-weight:500}input,select,textarea{width:100%;padding:8px;margin-top:4px;border:1px solid #ccc;border-radius:6px;font-size:.9rem;font-family:inherit}button{margin-top:14px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:8px;font-size:.78rem;overflow-x:auto;margin-top:14px;white-space:pre-wrap;display:none}.tabs{display:flex;gap:4px;margin-bottom:16px}.tab{padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:.85rem;background:#e5e7eb;color:#374151}.tab.active{background:#1a73e8;color:#fff}</style></head><body>
<h1>📋 Schema Markup Generator</h1>
<div class="tabs">
  <button class="tab active" onclick="show('article')">Article</button>
  <button class="tab" onclick="show('faq')">FAQ</button>
  <button class="tab" onclick="show('product')">Product</button>
  <button class="tab" onclick="show('local')">Local Business</button>
</div>
<div id="article">
  <label>Headline<input id="a-headline" value="How to Build a Website"></label>
  <label>Author<input id="a-author" value="Jane Doe"></label>
  <label>Date published<input id="a-date" type="date" value="2025-01-01"></label>
  <label>URL<input id="a-url" value="https://example.com/article"></label>
  <label>Image URL<input id="a-img" value="https://example.com/image.jpg"></label>
  <button onclick="genArticle()">Generate JSON-LD</button>
</div>
<div id="faq" style="display:none">
  <label>Questions &amp; Answers (one per line: Q|A)<textarea id="faq-qa" rows="6">What is schema markup?|Schema markup is structured data added to HTML.
Why use structured data?|It helps search engines understand your content.</textarea></label>
  <button onclick="genFAQ()">Generate JSON-LD</button>
</div>
<div id="product" style="display:none">
  <label>Product name<input id="p-name" value="Widget Pro"></label>
  <label>Description<input id="p-desc" value="The best widget for professionals."></label>
  <label>Price<input id="p-price" value="29.99"></label>
  <label>Currency<input id="p-cur" value="USD"></label>
  <label>Availability<select id="p-av"><option value="InStock">In Stock</option><option value="OutOfStock">Out of Stock</option><option value="PreOrder">Pre-order</option></select></label>
  <button onclick="genProduct()">Generate JSON-LD</button>
</div>
<div id="local" style="display:none">
  <label>Business name<input id="l-name" value="Acme Repairs"></label>
  <label>Address<input id="l-addr" value="123 Main St, Springfield, IL 62701"></label>
  <label>Phone<input id="l-phone" value="+1-800-555-0100"></label>
  <label>URL<input id="l-url" value="https://acme-repairs.example.com"></label>
  <button onclick="genLocal()">Generate JSON-LD</button>
</div>
<pre id="code"></pre>
<script>
function show(t){['article','faq','product','local'].forEach(function(s){document.getElementById(s).style.display=s===t?'block':'none';});document.querySelectorAll('.tab').forEach(function(b,i){b.classList.toggle('active',['article','faq','product','local'][i]===t);});}
function out(obj){var p=document.getElementById('code');p.textContent='<script type="application/ld+json">\\n'+JSON.stringify(obj,null,2)+'\\n<\\/script>';p.style.display='block';}
function genArticle(){out({"@context":"https://schema.org","@type":"Article","headline":v('a-headline'),"author":{"@type":"Person","name":v('a-author')},"datePublished":v('a-date'),"url":v('a-url'),"image":v('a-img')});}
function genFAQ(){var pairs=document.getElementById('faq-qa').value.trim().split('\\n').map(function(l){var p=l.split('|');return{"@type":"Question","name":p[0],"acceptedAnswer":{"@type":"Answer","text":p[1]||''}};});out({"@context":"https://schema.org","@type":"FAQPage","mainEntity":pairs});}
function genProduct(){out({"@context":"https://schema.org","@type":"Product","name":v('p-name'),"description":v('p-desc'),"offers":{"@type":"Offer","price":v('p-price'),"priceCurrency":v('p-cur'),"availability":"https://schema.org/"+document.getElementById('p-av').value}});}
function genLocal(){out({"@context":"https://schema.org","@type":"LocalBusiness","name":v('l-name'),"address":{"@type":"PostalAddress","streetAddress":v('l-addr')},"telephone":v('l-phone'),"url":v('l-url')});}
function v(id){return document.getElementById(id).value;}
</script>
</body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
