addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:520px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Price Comparison Table</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:820px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.3rem}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}button{padding:8px 16px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.85rem}.del{background:#ef4444}.export{background:#059669}table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)}th{background:#1a1a2e;color:#e5e7eb;padding:12px 14px;text-align:left;font-size:.85rem}td{padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:.88rem}td:nth-child(3){font-weight:600;color:#1a73e8}tr:last-child td{border-bottom:none}tr:hover td{background:#f8faff}input.cell{width:100%;border:none;background:transparent;font-size:.88rem;font-family:inherit;color:inherit;padding:0;cursor:text}input.cell:focus{outline:1px solid #1a73e8;border-radius:3px;padding:0 2px}.best{background:#f0fdf4!important}.best td{color:#15803d}</style></head><body>
<h1>📊 Price Comparison Table</h1>
<div class="toolbar">
  <button onclick="addRow()">+ Add Product</button>
  <button onclick="addCol()">+ Add Feature</button>
  <button class="export" onclick="exportTable()">Export CSV</button>
</div>
<table id="tbl"><thead id="head"></thead><tbody id="body"></tbody></table>
<script>
var headers=['Product','Provider','Price','★ Rating','In Stock'];
var rows=[
  ['Basic Plan','Vendor A','$9/mo','4.2','✅'],
  ['Pro Plan','Vendor B','$19/mo','4.7','✅'],
  ['Enterprise','Vendor C','$49/mo','4.5','✅'],
];
function render(){
  var thead=document.getElementById('head');var tbody=document.getElementById('body');
  thead.innerHTML='<tr>'+headers.map(function(h){return'<th contenteditable>'+h+'</th>';}).join('')+'<th style=width:40px></th></tr>';
  // find lowest price row
  var prices=rows.map(function(r){return parseFloat(r[2].replace(/[^0-9.]/g,''))||Infinity;});
  var minIdx=prices.indexOf(Math.min.apply(null,prices));
  tbody.innerHTML=rows.map(function(r,i){return'<tr class="'+(i===minIdx?'best':'')+'">'+r.map(function(c){return'<td><input class=cell value="'+c+'" onchange="rows['+i+']['+r.indexOf(c)+']=this.value;render()"></td>';}).join('')+'<td><button class=del onclick="rows.splice('+i+',1);render()">✕</button></td></tr>';}).join('');
}
function addRow(){rows.push(Array(headers.length).fill(''));render();}
function addCol(){headers.push('Feature');rows.forEach(function(r){r.push('');});render();}
function exportTable(){var csv=headers.join(',')+'\\n'+rows.map(function(r){return r.join(',');}).join('\\n');var a=document.createElement('a');a.download='comparison.csv';a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.click();}
render();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
