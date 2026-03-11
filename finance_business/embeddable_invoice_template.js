addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:640px;border:none;border-radius:8px;';el.loading='lazy';(s&&s.parentNode||document.body).appendChild(el);})();`;}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Invoice Template</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:20px;background:#f5f7fa}@media print{body{background:#fff;padding:0}#controls{display:none}#invoice{box-shadow:none}}#controls{margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap}#controls input,#controls button{padding:7px 12px;border:1px solid #ccc;border-radius:6px;font-size:.85rem}#controls button{background:#1a73e8;color:#fff;border:none;cursor:pointer}#invoice{background:#fff;padding:40px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.08)}.inv-header{display:flex;justify-content:space-between;margin-bottom:32px}.company{font-size:1.4rem;font-weight:800;color:#1a1a2e}.inv-title{font-size:2rem;font-weight:800;color:#1a73e8}.meta{font-size:.85rem;color:#555;text-align:right;line-height:1.7}.parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}.party h3{font-size:.75rem;text-transform:uppercase;color:#9ca3af;margin:0 0 6px;letter-spacing:.06em}input[type=text],input[type=date],input[type=number]{border:1px solid transparent;border-radius:4px;padding:3px 6px;font-size:.88rem;width:100%;font-family:inherit;transition:border .15s}input:focus,input:hover{border-color:#d1d5db;outline:none}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{text-align:left;padding:8px 10px;font-size:.75rem;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb}td{padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:.88rem}.total-row{display:flex;justify-content:flex-end;gap:80px;font-size:.9rem;padding:4px 10px}.total-row.grand{font-weight:700;font-size:1.05rem;border-top:2px solid #1a1a2e;padding-top:8px;margin-top:4px}.add-row{background:none;border:1px dashed #d1d5db;border-radius:4px;padding:5px 14px;cursor:pointer;font-size:.82rem;color:#6b7280;margin-bottom:12px}</style></head><body>
<div id="controls">
  <input type="text" id="currency" value="$" placeholder="Currency symbol" style="width:60px">
  <button onclick="addItem()">+ Line Item</button>
  <button onclick="window.print()">🖨️ Print / PDF</button>
</div>
<div id="invoice">
  <div class="inv-header">
    <div class="company"><input type="text" value="Your Company Name" style="font-size:1.4rem;font-weight:800;color:#1a1a2e;border:none;padding:0;background:transparent;width:300px"></div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="meta">
        Invoice #: <input type="text" value="INV-001" style="width:80px"><br>
        Date: <input type="date" id="inv-date"><br>
        Due: <input type="date" id="due-date">
      </div>
    </div>
  </div>
  <div class="parties">
    <div class="party"><h3>From</h3><input type="text" value="Your Name" placeholder="Name"><br><input type="text" value="City, Country" placeholder="Address"><br><input type="text" value="email@example.com" placeholder="Email"></div>
    <div class="party"><h3>Bill To</h3><input type="text" value="Client Name" placeholder="Client Name"><br><input type="text" value="Client Address" placeholder="Address"><br><input type="text" value="client@example.com" placeholder="Email"></div>
  </div>
  <table id="items">
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody id="items-body">
      <tr><td><input type="text" value="Service description" style="width:100%"></td><td><input type="number" value="1" oninput="recalc()" style="width:60px"></td><td><input type="number" value="100" oninput="recalc()" style="width:80px"></td><td class="amt">$100.00</td></tr>
    </tbody>
  </table>
  <button class="add-row" onclick="addItem()">+ Add line item</button>
  <div class="total-row"><span>Subtotal</span><span id="subtotal">$100.00</span></div>
  <div class="total-row"><span>Tax (%) <input type="number" id="tax" value="0" min="0" max="100" oninput="recalc()" style="width:44px"></span><span id="tax-amt">$0.00</span></div>
  <div class="total-row grand"><span>Total</span><span id="total">$100.00</span></div>
</div>
<script>
var today=new Date().toISOString().slice(0,10);document.getElementById('inv-date').value=today;var due=new Date(Date.now()+30*86400000).toISOString().slice(0,10);document.getElementById('due-date').value=due;
function addItem(){var tr=document.createElement('tr');tr.innerHTML='<td><input type=text value="Service" style=width:100%></td><td><input type=number value="1" oninput="recalc()" style=width:60px></td><td><input type=number value="0" oninput="recalc()" style=width:80px></td><td class=amt>$0.00</td>';document.getElementById('items-body').appendChild(tr);recalc();}
function recalc(){var c=document.getElementById('currency').value;var rows=document.querySelectorAll('#items-body tr');var sub=0;rows.forEach(function(r){var qty=Number(r.querySelectorAll('input')[1].value)||0;var rate=Number(r.querySelectorAll('input')[2].value)||0;var amt=qty*rate;r.querySelector('.amt').textContent=c+amt.toFixed(2);sub+=amt;});var tax=Number(document.getElementById('tax').value)||0;var ta=sub*tax/100;document.getElementById('subtotal').textContent=c+sub.toFixed(2);document.getElementById('tax-amt').textContent=c+ta.toFixed(2);document.getElementById('total').textContent=c+(sub+ta).toFixed(2);}
recalc();
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
