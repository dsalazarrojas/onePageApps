/**
 * poll_survey_creator_yaml.js
 *
 * WorkerTemplate: YAML-backed poll & survey creator with visual editor.
 * - Author: generated to match WORKER_TEMPLATE_GUIDELINES.md and poll_survey_creator.js
 * - Stores polls and responses in a KV binding named SURVEY_KV
 *
 * Features:
 * - Editor UI that lets users create/edit polls visually and exports YAML (uses js-yaml in-browser)
 * - Save polls (stores both YAML and JSON in KV)
 * - Public survey endpoint to submit responses
 * - Password-protected results viewer and CSV download
 *
 * Notes:
 * - Add `poll_survey_creator_yaml` to `Models.swift` templates list to surface in the app.
 * - Ensure `SURVEY_KV` KV binding exists when publishing to Cloudflare.
 */

addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (path === '/') {
    return serveEditorPage();
  } else if (path === '/saved' && request.method === 'GET') {
    return serveSavedPolls();
  } else if (path === '/save' && request.method === 'POST') {
    return handleSavePoll(request);
  } else if (path === '/survey' && request.method === 'GET') {
    return serveSurveyForm(request);
  } else if (path === '/submit' && request.method === 'POST') {
    return handleSurveySubmission(request);
  } else if (path === '/results' && request.method === 'GET') {
    return serveSurveyResults(request);
  } else if (path === '/results.csv' && request.method === 'GET') {
    return serveResultsCSV(request);
  } else if (path === '/download' && request.method === 'GET') {
    return downloadPollYAML(request);
  } else {
    return new Response('Not Found', { status: 404, headers: textHeaders() });
  }
}

// Serve the visual editor page. The client uses js-yaml (CDN) to parse/serialize YAML and
// will POST JSON + YAML to /save. The editor supports CRUD for questions and options.
function serveEditorPage() {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Poll Builder (YAML)</title>
  <style>
    body{font-family: Arial,Helvetica,sans-serif;max-width:1000px;margin:24px auto;padding:12px}
    .row{display:flex;gap:12px}
    .col{flex:1}
    textarea{width:100%;min-height:200px}
    .question{border:1px solid #ddd;padding:10px;border-radius:6px;margin-bottom:8px}
    .btn{background:#007bff;color:white;padding:8px 12px;border:none;border-radius:5px;cursor:pointer}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
</head>
<body>
  <h1>Poll Builder — YAML format</h1>
  <p>Create a poll visually, edit YAML directly, save and share. When saving, choose a results password to protect viewing results.</p>

  <div class="row">
    <div class="col" style="min-width:420px">
      <h2>Visual Editor</h2>
      <label>Title<br><input id="title" style="width:100%"/></label><br><br>
      <label>Description<br><textarea id="description"></textarea></label>
      <h3>Questions</h3>
      <div id="questions"></div>
      <button class="btn" id="addQuestion">Add Question</button>
      <hr>
      <label>Results password (required to view results)<br><input id="resultsPassword" type="password" style="width:100%"/></label>
      <div style="margin-top:12px">
        <button class="btn" id="saveBtn">Save Poll</button>
        <button class="btn" id="previewSurvey" style="background:#28a745">Preview Survey</button>
      </div>
    </div>

    <div class="col">
      <h2>YAML</h2>
      <textarea id="yamlArea"></textarea>
      <div style="margin-top:8px">
        <button class="btn" id="toYaml">Generate YAML</button>
        <button class="btn" id="fromYaml" style="background:#6c757d">Load from YAML</button>
      </div>
      <h3 style="margin-top:18px">Saved Polls</h3>
      <div id="savedList"></div>
    </div>
  </div>

  <script>
    // Build question DOM without template interpolation to avoid server-side \${} parsing
    function makeQuestionEl(q, idx){
      const el = document.createElement('div');
      el.className = 'question';
      el.dataset.idx = idx;

      // Text label + input
      const labelText = document.createElement('label');
      labelText.appendChild(document.createTextNode('Text'));
      labelText.appendChild(document.createElement('br'));
      const input = document.createElement('input');
      input.className = 'qtext';
      input.style.width = '100%';
      input.value = q.text || '';
      labelText.appendChild(input);
      el.appendChild(labelText);

      // Type selector
      const labelType = document.createElement('label');
      labelType.appendChild(document.createTextNode('Type'));
      labelType.appendChild(document.createElement('br'));
      const select = document.createElement('select'); select.className = 'qtype';
      const opts = [ ['single','Single choice'], ['multiple','Multiple choice'], ['text','Free text'] ];
      opts.forEach(([val,txt])=>{
        const o = document.createElement('option'); o.value = val; o.textContent = txt; if(q.type === val) o.selected = true; select.appendChild(o);
      });
      labelType.appendChild(select);
      el.appendChild(labelType);

      // Options container
      const optionsDiv = document.createElement('div'); optionsDiv.className = 'options'; optionsDiv.style.marginTop = '8px';
      const strong = document.createElement('strong'); strong.textContent = 'Options'; optionsDiv.appendChild(strong);
      const optsContainer = document.createElement('div'); optsContainer.className = 'opts'; optionsDiv.appendChild(optsContainer);
      const addOptBtn = document.createElement('button'); addOptBtn.className = 'addOpt'; addOptBtn.textContent = 'Add option'; optionsDiv.appendChild(addOptBtn);
      el.appendChild(optionsDiv);

      (q.options || []).forEach(o => {
        const oel = document.createElement('div');
        const optInput = document.createElement('input'); optInput.className = 'optText'; optInput.value = o; oel.appendChild(optInput);
        const delBtn = document.createElement('button'); delBtn.className = 'delOpt'; delBtn.textContent = 'x'; delBtn.addEventListener('click', ()=> oel.remove()); oel.appendChild(delBtn);
        optsContainer.appendChild(oel);
      });

      addOptBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        const oel = document.createElement('div');
        const optInput = document.createElement('input'); optInput.className = 'optText';
        const delBtn = document.createElement('button'); delBtn.className = 'delOpt'; delBtn.textContent = 'x'; delBtn.addEventListener('click', ()=> oel.remove());
        oel.appendChild(optInput); oel.appendChild(delBtn); optsContainer.appendChild(oel);
      });

      const delWrap = document.createElement('div'); delWrap.style.marginTop = '8px';
      const delQbtn = document.createElement('button'); delQbtn.className = 'delQ'; delQbtn.textContent = 'Delete Question'; delQbtn.style.background = '#dc3545'; delQbtn.addEventListener('click', ()=> el.remove());
      delWrap.appendChild(delQbtn); el.appendChild(delWrap);

      return el;
    }

    function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    function loadFromObject(obj){
      document.getElementById('title').value = obj.title || '';
      document.getElementById('description').value = obj.description || '';
      const qRoot = document.getElementById('questions'); qRoot.innerHTML = '';
      (obj.questions||[]).forEach((q, i)=> qRoot.appendChild(makeQuestionEl(q,i)));
    }

    function gatherObject(){
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const qs = Array.from(document.querySelectorAll('.question')).map(qel=>{
        const text = qel.querySelector('.qtext').value;
        const type = qel.querySelector('.qtype').value;
        const options = Array.from(qel.querySelectorAll('.optText')).map(i=>i.value).filter(x=>x);
        return { text, type, options };
      });
      return { title, description, questions: qs };
    }

    document.getElementById('addQuestion').addEventListener('click', ()=>{
      document.getElementById('questions').appendChild(makeQuestionEl({text:'',type:'single',options:[]}, Date.now()));
    });

    document.getElementById('toYaml').addEventListener('click', ()=>{
      const obj = gatherObject();
      document.getElementById('yamlArea').value = jsyaml.dump(obj);
    });

    document.getElementById('fromYaml').addEventListener('click', ()=>{
      try{
        const obj = jsyaml.load(document.getElementById('yamlArea').value);
        loadFromObject(obj||{});
      }catch(e){ alert('YAML parse error: '+e.message); }
    });

    document.getElementById('saveBtn').addEventListener('click', async ()=>{
      const obj = gatherObject();
      const yaml = jsyaml.dump(obj);
      const pw = document.getElementById('resultsPassword').value;
      if(!pw){ alert('Please set a results password'); return; }
      const payload = { yaml, json: obj, title: obj.title||'Untitled', password: pw };
      const res = await fetch('/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const body = await res.json();
      if(res.ok){
        alert('Saved! Share ID: '+body.id+' (or open /survey?id='+body.id+')');
        loadSavedList();
      } else { alert('Save error: '+(body.error||res.status)); }
    });

    document.getElementById('previewSurvey').addEventListener('click', ()=>{
      const obj = gatherObject();
      const s = '<!doctype html><html><body><pre>'+escapeHtml(JSON.stringify(obj, null, 2))+'</pre></body></html>';
      const w = window.open('', '_blank');
      const blob = new Blob([s], { type: 'text/html' });
      if(w) w.location = URL.createObjectURL(blob);
    });

    // List saved polls from KV (if worker exposes /saved)
    async function loadSavedList(){
      try{
        const res = await fetch('/saved');
        if(res.ok){
          const list = await res.json();
          const root = document.getElementById('savedList'); root.innerHTML = '';
          list.forEach(item=>{
            const d = document.createElement('div');
            const strong = document.createElement('strong'); strong.textContent = item.title || item.id; d.appendChild(strong);
            d.appendChild(document.createTextNode(' - '));
            const a1 = document.createElement('a'); a1.href = '/survey?id=' + encodeURIComponent(item.id); a1.target = '_blank'; a1.textContent = 'Open survey'; d.appendChild(a1);
            d.appendChild(document.createTextNode(' | '));
            const a2 = document.createElement('a'); a2.href = '/download?id=' + encodeURIComponent(item.id); a2.textContent = 'Download YAML'; d.appendChild(a2);
            root.appendChild(d);
          });
        }
      }catch(e){ /* ignore */ }
    }

    loadSavedList();
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

// Save poll: expects JSON { yaml, json, title, password, id? }
async function handleSavePoll(request) {
  try {
    const body = await request.json();
    const id = body.id || (`poll_${Date.now()}_${Math.floor(Math.random()*9000)}`);
    if (!body.json) {
      return new Response(JSON.stringify({ error: 'Missing json representation' }), { status: 400, headers: jsonHeaders() });
    }

    const meta = {
      id,
      title: body.title || body.json.title || 'Untitled',
      createdAt: Date.now()
    };

    // hash password
    const pw = body.password || '';
    const pwHash = pw ? await hashPassword(pw) : null;

    await SURVEY_KV.put(`poll_meta_${id}`, JSON.stringify({ ...meta, pwHash }));
    await SURVEY_KV.put(`poll_json_${id}`, JSON.stringify(body.json));
    if (body.yaml) {
      await SURVEY_KV.put(`poll_yaml_${id}`, body.yaml);
    }

    // init counters
    await SURVEY_KV.put(`response_count_${id}`, '0');

    return new Response(JSON.stringify({ success: true, id }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

// List saved polls (metadata) - returns JSON array of { id, title, createdAt }
async function serveSavedPolls() {
  try {
    const listed = await SURVEY_KV.list({ prefix: `poll_meta_`, limit: 100 });
    const items = await Promise.all(listed.keys.map(async k => {
      const raw = await SURVEY_KV.get(k.name);
      try {
        const obj = JSON.parse(raw || '{}');
        return { id: obj.id || k.name.replace('poll_meta_', ''), title: obj.title || '', createdAt: obj.createdAt || null };
      } catch (e) {
        return { id: k.name.replace('poll_meta_', ''), title: '', createdAt: null };
      }
    }));

    return new Response(JSON.stringify(items), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

// Serve survey form for respondents. Query param: id
async function serveSurveyForm(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || 'default';
    const surveyJsonRaw = await SURVEY_KV.get(`poll_json_${id}`);
    if (!surveyJsonRaw) {
      return new Response(`<html><body><h1>Survey Not Found</h1><p>No survey with id ${id}</p></body></html>`, { status: 404, headers: textHeaders() });
    }

    const surveyConfig = JSON.parse(surveyJsonRaw);

    const html = generateSurveyHTML(surveyConfig, id);
    return new Response(html, { status: 200, headers: textHeaders() });
  } catch (e) {
    return new Response('Error loading survey', { status: 500, headers: textHeaders() });
  }
}

function generateSurveyHTML(surveyConfig, id) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(surveyConfig.title || 'Survey')}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:30px auto;padding:18px}
    .question{margin:16px 0;padding:12px;border-radius:6px;background:#fafafa}
    button{background:#007bff;color:white;padding:10px 14px;border:none;border-radius:6px}
  </style>
</head>
<body>
  <h1>${escapeHtml(surveyConfig.title || '')}</h1>
  <p>${escapeHtml(surveyConfig.description||'')}</p>
  <form id="surveyForm">
    ${ (surveyConfig.questions||[]).map((q, qi)=> {
      if(q.type === 'single'){
        return `<div class="question"><h3>${qi+1}. ${escapeHtml(q.text)}</h3>` +
          (q.options||[]).map((opt,oi)=> `<div><label><input type="radio" name="q${qi}" value="${escapeHtml(opt)}"> ${escapeHtml(opt)}</label></div>`).join('') + `</div>`;
      } else if(q.type === 'multiple'){
        return `<div class="question"><h3>${qi+1}. ${escapeHtml(q.text)}</h3>` +
          (q.options||[]).map((opt,oi)=> `<div><label><input type="checkbox" name="q${qi}" value="${escapeHtml(opt)}"> ${escapeHtml(opt)}</label></div>`).join('') + `</div>`;
      } else {
        return `<div class="question"><h3>${qi+1}. ${escapeHtml(q.text)}</h3><textarea name="q${qi}" rows="4" style="width:100%"></textarea></div>`;
      }
    }).join('') }
    <input type="hidden" name="surveyId" value="${id}">
    <button type="submit">Submit</button>
  </form>

  <div id="message" style="display:none;margin-top:12px;padding:12px;background:#d4edda;border-radius:6px">Thank you — your response has been recorded.</div>

  <script>
    document.getElementById('surveyForm').addEventListener('submit', async function(e){
      e.preventDefault();
      const fd = new FormData(this);
      const obj = {};
      for(const [k,v] of fd.entries()){
        if(k === 'surveyId') continue;
        if(k.startsWith('q')){
          const idx = k.slice(1);
          if(this.querySelectorAll(`[name="${k}"]`).length > 1){
            // multiple possible values
            if(!obj[idx]) obj[idx] = [];
            obj[idx].push(v);
          } else {
            obj[idx] = v;
          }
        }
      }
      const surveyId = fd.get('surveyId');
      try{
        const res = await fetch('/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ surveyId, responses: obj }) });
        if(res.ok){ document.getElementById('surveyForm').style.display='none'; document.getElementById('message').style.display='block'; }
      }catch(e){ alert('Error submitting survey'); }
    });
  </script>
</body>
</html>`;
}

async function handleSurveySubmission(request) {
  try {
    const { surveyId, responses } = await request.json();
    const id = surveyId || 'default';

    await SURVEY_KV.put(`response_${id}_${Date.now()}`, JSON.stringify({ responses, timestamp: Date.now() }));

    const responseCountRaw = await SURVEY_KV.get(`response_count_${id}`) || '0';
    await SURVEY_KV.put(`response_count_${id}`, String(parseInt(responseCountRaw || '0') + 1));

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

// Serve results: requires id and pw query params
async function serveSurveyResults(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const pw = url.searchParams.get('pw') || '';
    if (!id) return new Response('Missing id', { status: 400, headers: textHeaders() });

    const metaRaw = await SURVEY_KV.get(`poll_meta_${id}`);
    if (!metaRaw) return new Response('Poll not found', { status: 404, headers: textHeaders() });
    const meta = JSON.parse(metaRaw);

    // verify password
    if (meta.pwHash) {
      const ok = await verifyPassword(pw, meta.pwHash);
      if (!ok) {
        return new Response('<html><body><h1>Protected</h1><p>Wrong password.</p></body></html>', { status: 403, headers: textHeaders() });
      }
    }

    const surveyJsonRaw = await SURVEY_KV.get(`poll_json_${id}`);
    const surveyConfig = JSON.parse(surveyJsonRaw || '{}');

    // list responses
    const listed = await SURVEY_KV.list({ prefix: `response_${id}_` });
    const allResponses = await Promise.all(listed.keys.map(async k => JSON.parse(await SURVEY_KV.get(k.name))));

    // aggregate
    const results = {};
    const total = parseInt(await SURVEY_KV.get(`response_count_${id}`) || '0');
    allResponses.forEach(r => {
      Object.entries(r.responses || {}).forEach(([qidx, val]) => {
        if(!results[qidx]) results[qidx] = {};
        if(Array.isArray(val)){
          val.forEach(v => results[qidx][v] = (results[qidx][v]||0)+1);
        } else {
          results[qidx][val] = (results[qidx][val]||0)+1;
        }
      });
    });

    // render
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Results</title><style>body{font-family:Arial;max-width:900px;margin:20px auto;padding:12px}.q{border:1px solid #ddd;padding:12px;border-radius:6px;margin-bottom:12px}</style></head><body><h1>Results for ${escapeHtml(meta.title||id)}</h1><p>${total} responses</p><p><a href="/results.csv?id=${encodeURIComponent(id)}&pw=${encodeURIComponent(pw)}">Download CSV</a></p>` +
      (surveyConfig.questions||[]).map((q,qi)=>{
        const map = results[qi]||{};
        return `<div class="q"><h3>${qi*1+1}. ${escapeHtml(q.text||'')}</h3>` + Object.entries(map).map(([opt,count])=>{
          const pct = total>0? Math.round((count/total)*100):0;
          return `<div>${escapeHtml(opt)}: ${count} (${pct}%)</div>`;
        }).join('') + `</div>`;
      }).join('') + '</body></html>';

    return new Response(html, { status: 200, headers: textHeaders() });
  } catch (e) {
    return new Response('Error loading results', { status: 500, headers: textHeaders() });
  }
}

// CSV download
async function serveResultsCSV(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const pw = url.searchParams.get('pw') || '';
    if (!id) return new Response('Missing id', { status: 400, headers: textHeaders() });

    const metaRaw = await SURVEY_KV.get(`poll_meta_${id}`);
    if (!metaRaw) return new Response('Poll not found', { status: 404, headers: textHeaders() });
    const meta = JSON.parse(metaRaw);
    if (meta.pwHash) {
      const ok = await verifyPassword(pw, meta.pwHash);
      if (!ok) return new Response('Forbidden', { status: 403, headers: textHeaders() });
    }

    const listed = await SURVEY_KV.list({ prefix: `response_${id}_` });
    const allResponses = await Promise.all(listed.keys.map(async k => JSON.parse(await SURVEY_KV.get(k.name))));
    const surveyJsonRaw = await SURVEY_KV.get(`poll_json_${id}`);
    const surveyConfig = JSON.parse(surveyJsonRaw || '{}');

    // Build CSV with columns: timestamp, respondentId, Q1, Q2,...
    const headers = ['timestamp'].concat((surveyConfig.questions||[]).map((q,i)=>`Q${i+1}: ${q.text}`));
    const rows = [headers.join(',')];
    allResponses.forEach(r => {
      const row = [r.timestamp];
      (surveyConfig.questions||[]).forEach((q,qi)=>{
        const v = r.responses ? r.responses[qi] : '';
        if(Array.isArray(v)) row.push(`"${v.join(';')}"`);
        else row.push(`"${String(v||'')}"`);
      });
      rows.push(row.join(','));
    });

    const csv = rows.join('\n');
    return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="results_${id}.csv"`, ...corsHeaders() } });
  } catch (e) {
    return new Response('Error generating CSV', { status: 500, headers: textHeaders() });
  }
}

// Download YAML for a poll
async function downloadPollYAML(request){
  try{
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if(!id) return new Response('Missing id', { status: 400, headers: textHeaders() });
    const yaml = await SURVEY_KV.get(`poll_yaml_${id}`);
    if(!yaml) return new Response('YAML not found', { status: 404, headers: textHeaders() });
    return new Response(yaml, { status: 200, headers: { 'Content-Type': 'text/yaml', 'Content-Disposition': `attachment; filename="poll_${id}.yaml"`, ...corsHeaders() } });
  }catch(e){
    return new Response('Error', { status: 500, headers: textHeaders() });
  }
}

// Hashing helpers
async function hashPassword(pw){
  const data = new TextEncoder().encode(pw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

async function verifyPassword(pw, hexHash){
  const h = await hashPassword(pw||'');
  return h === hexHash;
}

function bufferToHex(buf){
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b=>b.toString(16).padStart(2,'0')).join('');
}

function jsonHeaders(){ return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders(){ return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() }; }
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' }; }
