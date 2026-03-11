addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  const path = url.pathname;
  if (path === '/' && request.method === 'GET') return servePage();
  if (path === '/quiz' && request.method === 'GET') return getQuiz(url);
  if (path === '/quiz' && request.method === 'POST') return saveQuiz(request);
  if (path === '/submit' && request.method === 'POST') return submitQuiz(request);
  if (path === '/results' && request.method === 'GET') return getResults(url);
  return new Response('Not Found', { status: 404 });
}

async function getQuiz(url) {
  const store = kv();
  if (!store) return noKV();
  const id = url.searchParams.get('id') || 'default';
  const raw = await store.get('quiz:' + id);
  if (!raw) return jsonResponse({ error: 'Quiz not found' }, 404);
  const quiz = JSON.parse(raw);
  const publicQuiz = { ...quiz, questions: quiz.questions.map(q => ({ ...q, correct: undefined })) };
  return jsonResponse(publicQuiz);
}

async function saveQuiz(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default';
  const title = String(body.title || 'Quiz').slice(0, 100);
  const questions = (Array.isArray(body.questions) ? body.questions : []).map(q => ({
    text: String(q.text || '').slice(0, 300),
    options: (Array.isArray(q.options) ? q.options : []).map(o => String(o).slice(0, 100)).filter(Boolean).slice(0, 6),
    correct: String(q.correct || '').slice(0, 100)
  })).filter(q => q.text && q.options.length >= 2).slice(0, 50);
  if (!questions.length) return jsonResponse({ error: 'At least 1 question with >= 2 options required' }, 400);
  await store.put('quiz:' + id, JSON.stringify({ id, title, questions, updated: new Date().toISOString() }));
  return jsonResponse({ ok: true, id, questionCount: questions.length });
}

async function submitQuiz(request) {
  const store = kv();
  if (!store) return noKV();
  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.quizId || 'default');
  const answers = body.answers || {};
  const raw = await store.get('quiz:' + id);
  if (!raw) return jsonResponse({ error: 'Quiz not found' }, 404);
  const quiz = JSON.parse(raw);
  let score = 0;
  const details = quiz.questions.map((q, i) => {
    const given = String(answers[i] || '');
    const correct = given === q.correct;
    if (correct) score++;
    return { question: q.text, given, correct: q.correct, isCorrect: correct };
  });
  const statsRaw = await store.get('quiz:stats:' + id);
  const stats = statsRaw ? JSON.parse(statsRaw) : { attempts: 0, totalScore: 0 };
  stats.attempts++;
  stats.totalScore += score;
  await store.put('quiz:stats:' + id, JSON.stringify(stats));
  return jsonResponse({ score, total: quiz.questions.length, pct: Math.round(score / quiz.questions.length * 100), details });
}

async function getResults(url) {
  const store = kv();
  if (!store) return noKV();
  const id = url.searchParams.get('id') || 'default';
  const raw = await store.get('quiz:stats:' + id);
  const stats = raw ? JSON.parse(raw) : { attempts: 0, totalScore: 0 };
  return jsonResponse({ ...stats, avgScore: stats.attempts ? Math.round(stats.totalScore / stats.attempts * 10) / 10 : 0 });
}

function servePage() {
  const html = String.raw`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quiz Builder</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:620px;margin:0 auto;padding:40px 16px}
h2{margin:0 0 20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:24px;margin-bottom:20px}
.question{margin-bottom:18px;padding:16px;background:#0f172a;border-radius:12px}
.q-text{font-weight:600;margin-bottom:12px}
.option{display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;cursor:pointer;transition:background .15s}
.option:hover{background:#1e293b}
.option input{width:16px;height:16px}
button.submit{width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:12px;cursor:pointer;font:inherit;font-weight:700}
.score{font-size:2rem;font-weight:800;color:#a5b4fc;text-align:center;margin:12px 0}
.result-row{padding:8px;border-radius:8px;margin-bottom:6px;font-size:13px}
.correct{background:#064e3b;color:#6ee7b7}.wrong{background:#450a0a;color:#fca5a5}
input,textarea{width:100%;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:10px;padding:9px;font:inherit;margin-bottom:10px}
button.save{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:10px;padding:10px;cursor:pointer;font:inherit;font-weight:700;width:100%}
.qid-row{display:flex;gap:8px;margin-bottom:16px;align-items:center}
.qid-row input{margin:0;flex:1}
.qid-row button{background:#475569;border:none;color:#fff;border-radius:10px;padding:9px 14px;cursor:pointer;font:inherit;white-space:nowrap}
</style></head>
<body><div class="wrap">
<h2>🧠 Quiz Builder</h2>
<div class="card">
  <div class="qid-row"><input id="loadId" placeholder="Quiz ID"><button onclick="loadQuiz()">Load Quiz</button></div>
  <div id="quiz-body"><em style="color:#475569">Load a quiz to take it.</em></div>
</div>
<div class="card"><strong>Create / Update Quiz</strong>
<input id="qid" placeholder="Quiz ID (e.g. my-quiz)">
<input id="qtitle" placeholder="Quiz title">
<textarea id="qjson" placeholder='JSON: [{"text":"Q?","options":["A","B"],"correct":"A"}]' rows="8"></textarea>
<button class="save" onclick="saveQuiz()">Save Quiz</button>
</div>
</div>
<script>
let quiz=null,answers={};
async function loadQuiz(){
  const id=document.getElementById('loadId').value.trim()||'default';
  const r=await fetch('/quiz?id='+encodeURIComponent(id));
  if(!r.ok){document.getElementById('quiz-body').innerHTML='<em style="color:#fca5a5">Quiz not found.</em>';return;}
  quiz=await r.json();answers={};
  document.getElementById('quiz-body').innerHTML='<div style="font-weight:700;margin-bottom:16px">'+escH(quiz.title)+'</div>'+quiz.questions.map((q,i)=>'<div class="question"><div class="q-text">'+(i+1)+'. '+escH(q.text)+'</div>'+q.options.map(o=>'<label class="option"><input type="radio" name="q'+i+'" value="'+escH(o)+'" onchange="answers['+i+']=this.value">'+escH(o)+'</label>').join('')+'</div>').join('')+'<button class="submit" onclick="submit()">Submit Quiz</button>';
}
async function submit(){
  if(!quiz)return;
  const d=await fetch('/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quizId:quiz.id,answers})}).then(r=>r.json());
  document.getElementById('quiz-body').innerHTML='<div class="score">'+d.score+' / '+d.total+' ('+d.pct+'%)</div>'+d.details.map(r=>'<div class="result-row '+(r.isCorrect?'correct':'wrong')+'">'+escH(r.question)+'<br>Your answer: '+escH(r.given)||'(none)+'  Correct: '+escH(r.correct)+'</div>').join('');
}
async function saveQuiz(){
  const id=document.getElementById('qid').value.trim()||'default';
  const title=document.getElementById('qtitle').value.trim()||'Quiz';
  let questions=[];
  try{questions=JSON.parse(document.getElementById('qjson').value);}catch(e){alert('Invalid JSON: '+e.message);return;}
  const d=await fetch('/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,title,questions})}).then(r=>r.json());
  if(d.ok)alert('Saved! '+d.questionCount+' questions. Load with ID: '+id);
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
