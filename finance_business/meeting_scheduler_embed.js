addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/slots' && request.method === 'GET') return getSlots(url);
  if (path === '/slots' && request.method === 'POST') return addSlots(request);
  if (path === '/book' && request.method === 'POST') return bookSlot(request);
  if (path === '/bookings' && request.method === 'GET') return getBookings(url);
  if (path === '/cancel' && request.method === 'POST') return cancelBooking(request);
  return new Response('Not Found', { status: 404 });
}

async function getSlots(url) {
  const store = kv();
  if (!store) return noKV();
  const calId = url.searchParams.get('cal') || 'default';
  const raw = await store.get('sched:slots:' + calId);
  const slots = raw ? JSON.parse(raw) : [];
  const bkRaw = await store.get('sched:bookings:' + calId);
  const bkKeys = bkRaw ? Object.keys(JSON.parse(bkRaw)) : [];
  return jsonResponse({ cal: calId, slots: slots.map(s => ({ ...s, booked: bkKeys.includes(s.id) })) });
}

async function addSlots(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const calId = String(body.cal || 'default').slice(0, 40);
  const newSlots = (Array.isArray(body.slots) ? body.slots : []).map(s => ({
    id: String(s.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 5)),
    datetime: String(s.datetime || '').slice(0, 25),
    duration: parseInt(s.duration, 10) || 30,
    label: String(s.label || '').slice(0, 80)
  })).filter(s => s.datetime);
  if (!newSlots.length) return jsonResponse({ error: 'At least one slot with datetime required' }, 400);
  const raw = await store.get('sched:slots:' + calId);
  const existing = raw ? JSON.parse(raw) : [];
  const merged = [...existing, ...newSlots].slice(-500);
  await store.put('sched:slots:' + calId, JSON.stringify(merged));
  return jsonResponse({ ok: true, cal: calId, added: newSlots.length });
}

async function bookSlot(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const calId = String(body.cal || 'default').slice(0, 40);
  const slotId = String(body.slotId || '');
  const name = String(body.name || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().slice(0, 120);
  const note = String(body.note || '').slice(0, 300);
  if (!slotId || !name) return jsonResponse({ error: 'slotId and name required' }, 400);
  const slotsRaw = await store.get('sched:slots:' + calId);
  const slots = slotsRaw ? JSON.parse(slotsRaw) : [];
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return jsonResponse({ error: 'Slot not found' }, 404);
  const bkRaw = await store.get('sched:bookings:' + calId);
  const bookings = bkRaw ? JSON.parse(bkRaw) : {};
  if (bookings[slotId]) return jsonResponse({ error: 'Slot already booked' }, 409);
  bookings[slotId] = { slotId, name, email, note, bookedAt: new Date().toISOString() };
  await store.put('sched:bookings:' + calId, JSON.stringify(bookings));
  const webhook = getStringBinding('WEBHOOK_URL');
  if (webhook) { try { await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot, booking: bookings[slotId] }) }); } catch {} }
  await sendNotificationEmail({
    subject: getStringBinding('BOOKING_NOTIFICATION_SUBJECT', 'New meeting booking'),
    html: `<p>A meeting slot was booked.</p><p><strong>Calendar:</strong> ${escHtml(calId)}</p><p><strong>Slot:</strong> ${escHtml(slot.datetime)}</p><p><strong>Name:</strong> ${escHtml(name)}</p><p><strong>Email:</strong> ${escHtml(email || '—')}</p><p><strong>Note:</strong> ${escHtml(note || '—')}</p>`
  });
  await sendAttendeeEmail(email, slot, bookings[slotId]);
  return jsonResponse({ ok: true, booking: bookings[slotId] });
}

async function getBookings(url) {
  const store = kv();
  if (!store) return noKV();
  const calId = url.searchParams.get('cal') || 'default';
  const raw = await store.get('sched:bookings:' + calId);
  return jsonResponse({ cal: calId, bookings: raw ? Object.values(JSON.parse(raw)) : [] });
}

async function cancelBooking(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const calId = String(body.cal || 'default').slice(0, 40);
  const slotId = String(body.slotId || '');
  const raw = await store.get('sched:bookings:' + calId);
  const bookings = raw ? JSON.parse(raw) : {};
  delete bookings[slotId];
  await store.put('sched:bookings:' + calId, JSON.stringify(bookings));
  return jsonResponse({ ok: true });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Meeting Scheduler</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:680px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px}
input{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button.primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
.slot{display:flex;align-items:center;gap:10px;padding:10px;background:#0f172a;border:1px solid #334155;border-radius:10px;margin-bottom:8px}
.slot.booked{opacity:.5}
.slot-info{flex:1}
.slot-dt{font-weight:700;font-size:14px}
.slot-meta{font-size:12px;color:#64748b}
.book-btn{background:#059669;border:none;color:#fff;border-radius:8px;padding:7px 14px;cursor:pointer;font:inherit;font-size:13px}
.booked-badge{background:#334155;color:#94a3b8;border-radius:8px;padding:6px 12px;font-size:12px}
.row{display:flex;gap:10px}
.row input{margin-bottom:0}
</style></head>
<body><div class="wrap">
<h2>📅 Meeting Scheduler</h2>
<div class="card"><strong>Calendar ID</strong>
<div class="row" style="margin-bottom:0"><input id="calid" placeholder="Calendar ID (default)" style="margin:0"><button onclick="loadSlots()" style="background:#475569;border:none;color:#fff;border-radius:10px;padding:9px 16px;cursor:pointer;font:inherit;white-space:nowrap">Load</button></div>
</div>
<div class="card"><strong>Available Slots</strong><div id="slots-list"><em style="color:#475569">Load a calendar to see slots.</em></div></div>
<div class="card" id="book-form" style="display:none"><strong>Book Slot: <span id="book-slot-label"></span></strong>
<input id="bname" placeholder="Your name *">
<input id="bemail" type="email" placeholder="Email (optional)">
<input id="bnote" placeholder="Note (optional)">
<button class="primary" onclick="confirmBook()">Confirm Booking</button>
<button onclick="document.getElementById('book-form').style.display='none'" style="background:#334155;border:none;color:#fff;border-radius:10px;padding:9px;cursor:pointer;font:inherit;width:100%;margin-top:8px">Cancel</button>
</div>
<div class="card"><strong>Add Slots (admin)</strong>
<textarea id="slots-json" placeholder='[{"datetime":"2025-06-20T10:00","duration":30,"label":"30-min call"}]' rows="4" style="width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px;resize:vertical"></textarea>
<button class="primary" onclick="addSlots()">Add Slots</button>
</div>
</div>
<script>
let selectedSlotId=null;
async function loadSlots(){
  const cal=document.getElementById('calid').value.trim()||'default';
  const d=await fetch('/slots?cal='+encodeURIComponent(cal)).then(r=>r.json());
  if(!d.slots.length){document.getElementById('slots-list').innerHTML='<em style="color:#475569">No slots available.</em>';return;}
  document.getElementById('slots-list').innerHTML=d.slots.sort((a,b)=>a.datetime.localeCompare(b.datetime)).map(s=>
    '<div class="slot'+(s.booked?' booked':'')+'"><div class="slot-info"><div class="slot-dt">'+escH(new Date(s.datetime).toLocaleString())+'</div><div class="slot-meta">'+s.duration+'min'+(s.label?' · '+escH(s.label):'')+'</div></div>'+(s.booked?'<span class="booked-badge">Booked</span>':'<button class="book-btn" onclick="startBook(\''+s.id+'\',\''+escH(s.datetime)+'\')">Book</button>')+'</div>'
  ).join('');
}
function startBook(id,dt){selectedSlotId=id;document.getElementById('book-slot-label').textContent=new Date(dt).toLocaleString();document.getElementById('book-form').style.display='block';document.getElementById('bname').focus();}
async function confirmBook(){
  const cal=document.getElementById('calid').value.trim()||'default';
  const name=document.getElementById('bname').value.trim();
  const email=document.getElementById('bemail').value.trim();
  const note=document.getElementById('bnote').value.trim();
  if(!name){alert('Name required.');return;}
  const d=await fetch('/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cal,slotId:selectedSlotId,name,email,note})}).then(r=>r.json());
  if(d.ok){document.getElementById('book-form').style.display='none';alert('Booking confirmed!');loadSlots();}
  else alert(d.error);
}
async function addSlots(){
  const cal=document.getElementById('calid').value.trim()||'default';
  let slots;
  try{slots=JSON.parse(document.getElementById('slots-json').value);}catch(e){alert('Invalid JSON: '+e.message);return;}
  const d=await fetch('/slots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cal,slots})}).then(r=>r.json());
  if(d.ok){document.getElementById('slots-json').value='';alert('Added '+d.added+' slot(s).');loadSlots();}
  else alert(d.error);
}
function escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
</script></body></html>`;
  return new Response(html, { status: 200, headers: htmlHeaders() });
}

// ── helpers ──────────────────────────────────────────────────────────────────
function kv() { return typeof globalThis['DATA'] === 'undefined' ? null : globalThis['DATA']; }
function getStringBinding(name, fallback = '') {
  const v = globalThis[name]; return (typeof v === 'string' && v.trim()) ? v.trim() : fallback;
}
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}
function htmlHeaders() { return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() }; }
function jsonHeaders() { return { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
function noKV() { return jsonResponse({ error: 'DATA KV namespace binding is required. Bind your KV namespace as DATA and redeploy.' }, 503); }
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
async function sendNotificationEmail({ subject, html }) {
  const apiKey = getStringBinding('RESEND_API_KEY');
  const fromEmail = getStringBinding('FROM_EMAIL');
  const toEmail = getStringBinding('NOTIFICATION_EMAIL');
  if (!apiKey || !fromEmail || !toEmail) return false;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${getStringBinding('FROM_NAME', 'Meeting Scheduler Embed')} <${fromEmail}>`,
        to: [toEmail],
        subject,
        html
      })
    });
    return true;
  } catch {
    return false;
  }
}
async function sendAttendeeEmail(email, slot, booking) {
  const apiKey = getStringBinding('RESEND_API_KEY');
  const fromEmail = getStringBinding('FROM_EMAIL');
  if (!apiKey || !fromEmail || !email) return false;
  const subject = getStringBinding('BOOKING_CONFIRMATION_SUBJECT', 'Your meeting is booked');
  const html = getStringBinding(
    'BOOKING_CONFIRMATION_BODY_HTML',
    `<p>Your meeting is confirmed.</p><p><strong>When:</strong> ${escHtml(slot.datetime)}</p><p><strong>Duration:</strong> ${slot.duration} minutes</p><p><strong>Label:</strong> ${escHtml(slot.label || 'Meeting')}</p><p><strong>Name:</strong> ${escHtml(booking.name)}</p>`
  );
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${getStringBinding('FROM_NAME', 'Meeting Scheduler Embed')} <${fromEmail}>`,
        to: [email],
        subject,
        html
      })
    });
    return true;
  } catch {
    return false;
  }
}
