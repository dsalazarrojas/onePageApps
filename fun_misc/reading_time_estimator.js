addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { text, wordsPerMinute = 238, charsPerMinute = 987 } = await request.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing required field: text (string)' }), { status: 400, headers: jsonHeaders() });
    }

    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = text.length;
    const charCountNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))).size;

    const readSeconds = Math.round((wordCount / wordsPerMinute) * 60);
    const speakSeconds = Math.round((wordCount / 125) * 60);
    const typeSeconds = Math.round((charCountNoSpaces / charsPerMinute) * 60);

    const topWords = getTopWords(words, 10);
    const avgWordLength = wordCount > 0 ? +(charCountNoSpaces / wordCount).toFixed(1) : 0;
    const avgSentenceLength = sentences > 0 ? +(wordCount / sentences).toFixed(1) : 0;

    return new Response(JSON.stringify({
      wordCount,
      charCount,
      charCountNoSpaces,
      sentences,
      paragraphs,
      uniqueWords,
      avgWordLength,
      avgSentenceLength,
      readingTime: { seconds: readSeconds, formatted: formatDuration(readSeconds) },
      speakingTime: { seconds: speakSeconds, formatted: formatDuration(speakSeconds) },
      typingTime: { seconds: typeSeconds, formatted: formatDuration(typeSeconds) },
      topWords,
      wordsPerMinute,
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function formatDuration(secs) {
  if (secs < 60) return secs + ' sec';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ' min' + (s > 0 ? ' ' + s + ' sec' : '');
}

function getTopWords(words, n) {
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','is','was','are','were','be','been','has','have','had','will','would','could','should','do','did','not','that','this','it','its','as','by','from','up','out','about','into','than','then','so','if','they','their','them','we','our','he','his','she','her','you','your','i','my','me','us','all','can','also','just','more','some','no','there','when','what','which','who']);
  const freq = {};
  for (const w of words) {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length > 2 && !stopWords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1;
    }
  }
  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,n).map(([word,count]) => ({ word, count }));
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reading Time Estimator</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:700px;margin:0 auto}
  h1{text-align:center;color:#0369a1;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:18px}
  label{display:block;font-weight:600;margin-bottom:8px;color:#374151}
  textarea{width:100%;padding:14px;border:2px solid #e5e7eb;border-radius:8px;font-size:15px;outline:none;resize:vertical;min-height:180px;line-height:1.6;transition:border-color .2s}
  textarea:focus{border-color:#0369a1}
  .options-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
  .option{display:flex;align-items:center;gap:6px;font-size:.9em;color:#374151}
  .option input[type=number]{width:70px;padding:7px 10px;border:2px solid #e5e7eb;border-radius:6px;font-size:14px;outline:none}
  .option input[type=number]:focus{border-color:#0369a1}
  button{padding:12px 28px;background:#0369a1;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s}
  button:hover{background:#0284c7}
  .char-count{text-align:right;font-size:.8em;color:#888;margin-top:4px}
  .results{display:none}
  .time-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
  @media(max-width:480px){.time-grid{grid-template-columns:1fr}}
  .time-card{border-radius:12px;padding:16px;text-align:center}
  .time-read{background:#e0f2fe}
  .time-speak{background:#ede9fe}
  .time-type{background:#dcfce7}
  .time-val{font-size:1.5em;font-weight:800;color:#0f172a}
  .time-lbl{font-size:.8em;color:#666;margin-top:4px}
  .time-icon{font-size:1.8em;margin-bottom:6px}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
  @media(max-width:500px){.stats-grid{grid-template-columns:1fr 1fr}}
  .stat{background:#f8fafc;border-radius:10px;padding:12px;text-align:center}
  .stat-val{font-size:1.3em;font-weight:700;color:#0369a1}
  .stat-lbl{font-size:.75em;color:#888;margin-top:3px}
  .top-words{margin-top:4px}
  .word-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  .word-chip{background:#e0f2fe;border-radius:20px;padding:5px 12px;font-size:.82em;font-weight:600;color:#0369a1}
  .word-count-badge{font-size:.72em;background:#0369a1;color:#fff;border-radius:10px;padding:2px 7px;margin-left:4px}
</style>
</head>
<body>
<div class="wrap">
  <h1>📖 Reading Time Estimator</h1>
  <p class="sub">Paste any text to get reading time, stats, and top words</p>

  <div class="card">
    <label>Your text</label>
    <textarea id="textArea" placeholder="Paste or type your article, blog post, or any text here…" oninput="updateCount()"></textarea>
    <div class="char-count" id="charCount">0 words · 0 characters</div>
    <div class="options-row" style="margin-top:12px">
      <div class="option"><label>Reading WPM:</label><input type="number" id="wpm" value="238" min="50" max="1000"></div>
    </div>
    <button onclick="estimate()">Estimate</button>
  </div>

  <div class="card results" id="results">
    <div class="time-grid">
      <div class="time-card time-read">
        <div class="time-icon">👁</div>
        <div class="time-val" id="r-read">—</div>
        <div class="time-lbl">Reading</div>
      </div>
      <div class="time-card time-speak">
        <div class="time-icon">🎙</div>
        <div class="time-val" id="r-speak">—</div>
        <div class="time-lbl">Speaking</div>
      </div>
      <div class="time-card time-type">
        <div class="time-icon">⌨</div>
        <div class="time-val" id="r-type">—</div>
        <div class="time-lbl">Typing</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat"><div class="stat-val" id="r-words">—</div><div class="stat-lbl">Words</div></div>
      <div class="stat"><div class="stat-val" id="r-chars">—</div><div class="stat-lbl">Characters</div></div>
      <div class="stat"><div class="stat-val" id="r-sentences">—</div><div class="stat-lbl">Sentences</div></div>
      <div class="stat"><div class="stat-val" id="r-paras">—</div><div class="stat-lbl">Paragraphs</div></div>
      <div class="stat"><div class="stat-val" id="r-unique">—</div><div class="stat-lbl">Unique Words</div></div>
      <div class="stat"><div class="stat-val" id="r-avgword">—</div><div class="stat-lbl">Avg Word Len</div></div>
      <div class="stat"><div class="stat-val" id="r-avgsen">—</div><div class="stat-lbl">Avg Sent Len</div></div>
      <div class="stat"><div class="stat-val" id="r-wpm">—</div><div class="stat-lbl">WPM used</div></div>
    </div>

    <div class="top-words">
      <strong style="color:#374151">Top Keywords</strong>
      <div class="word-list" id="r-topwords"></div>
    </div>
  </div>
</div>
<script>
function updateCount(){
  const t=document.getElementById('textArea').value;
  const wc=t.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('charCount').textContent=wc.toLocaleString()+' words · '+t.length.toLocaleString()+' characters';
}
async function estimate(){
  const text=document.getElementById('textArea').value;
  const wpm=parseInt(document.getElementById('wpm').value)||238;
  if(!text.trim()){alert('Please enter some text.');return;}
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,wordsPerMinute:wpm})});
  const d=await res.json();
  if(d.error){alert(d.error);return;}
  document.getElementById('r-read').textContent=d.readingTime.formatted;
  document.getElementById('r-speak').textContent=d.speakingTime.formatted;
  document.getElementById('r-type').textContent=d.typingTime.formatted;
  document.getElementById('r-words').textContent=d.wordCount.toLocaleString();
  document.getElementById('r-chars').textContent=d.charCount.toLocaleString();
  document.getElementById('r-sentences').textContent=d.sentences.toLocaleString();
  document.getElementById('r-paras').textContent=d.paragraphs.toLocaleString();
  document.getElementById('r-unique').textContent=d.uniqueWords.toLocaleString();
  document.getElementById('r-avgword').textContent=d.avgWordLength;
  document.getElementById('r-avgsen').textContent=d.avgSentenceLength;
  document.getElementById('r-wpm').textContent=d.wordsPerMinute;
  document.getElementById('r-topwords').innerHTML=d.topWords.map(w=>\`<span class="word-chip">\${w.word}<span class="word-count-badge">\${w.count}</span></span>\`).join('');
  document.getElementById('results').style.display='block';
}
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() } });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
