addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (url.pathname === '/' && request.method === 'GET') {
    return servePage();
  }

  if (url.pathname === '/practice' && request.method === 'POST') {
    return handlePractice(request);
  }

  if (url.pathname === '/speak' && request.method === 'POST') {
    return handleSpeak(request);
  }

  if (url.pathname === '/health' && request.method === 'GET') {
    return jsonResponse({ ok: true, hasAI: Boolean(getStringBinding('OPENAI_API_KEY')) }, 200);
  }

  return new Response('Not Found', { status: 404, headers: htmlHeaders() });
}

async function handlePractice(request) {
  try {
    const apiKey = getStringBinding('OPENAI_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'Missing OPENAI_API_KEY. Add an AI provider before using this worker.' }, 500);
    }

    const body = await request.json();
    const nativeLanguage = clean(body?.nativeLanguage) || getStringBinding('DEFAULT_NATIVE_LANGUAGE', 'English');
    const targetLanguage = clean(body?.targetLanguage) || getStringBinding('DEFAULT_TARGET_LANGUAGE', 'Spanish');
    const topic = clean(body?.topic) || 'travel';
    const level = clean(body?.level) || 'beginner';
    const learnerAnswer = clean(body?.learnerAnswer);
    const baseUrl = getStringBinding('OPENAI_BASE_URL', 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = getStringBinding('MODEL', getStringBinding('OPENAI_MODEL', 'gpt-4o-mini'));

    const prompt = [
      `Create a short ${targetLanguage} speaking exercise for a ${level} learner whose native language is ${nativeLanguage}.`,
      `Topic: ${topic}.`,
      learnerAnswer ? `The learner attempted this response: ${learnerAnswer}. Give kind coaching.` : 'Generate a starter practice card.',
      'Return only JSON with keys: phrase, translation, pronunciation, tip, coachFeedback, followUpQuestion.'
    ].join(' ');

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content: 'You are a supportive language coach. Keep phrases short, practical, and accurate. Return strict JSON only.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      return jsonResponse({ error: `Practice request failed (${upstream.status})`, details: raw.slice(0, 400) }, 502);
    }

    const parsed = extractJSONObject(raw);
    if (!parsed) {
      return jsonResponse({ error: 'AI provider returned invalid practice JSON.', details: raw.slice(0, 400) }, 502);
    }

    return jsonResponse({
      phrase: clean(parsed.phrase),
      translation: clean(parsed.translation),
      pronunciation: clean(parsed.pronunciation),
      tip: clean(parsed.tip),
      coachFeedback: clean(parsed.coachFeedback),
      followUpQuestion: clean(parsed.followUpQuestion),
      model
    }, 200);
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Practice generation failed.' }, 500);
  }
}

async function handleSpeak(request) {
  try {
    const apiKey = getStringBinding('OPENAI_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'Missing OPENAI_API_KEY. Add an AI provider before using text-to-speech.' }, 500);
    }

    const body = await request.json();
    const text = clean(body?.text);
    if (!text) {
      return jsonResponse({ error: 'Missing text to speak.' }, 400);
    }

    const baseUrl = getStringBinding('OPENAI_BASE_URL', 'https://api.openai.com/v1').replace(/\/$/, '');
    const voice = normalizeVoice(clean(body?.voice) || getStringBinding('TTS_VOICE', 'alloy'));
    const ttsModel = getStringBinding('TTS_MODEL', 'tts-1');
    const upstream = await fetch(`${baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ttsModel,
        voice,
        input: text,
        format: 'mp3'
      })
    });

    if (!upstream.ok) {
      const details = await upstream.text();
      return jsonResponse({
        error: `Speech request failed (${upstream.status}). Your configured provider may not support the OpenAI /audio/speech endpoint.`,
        details: details.slice(0, 400)
      }, 502);
    }

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        ...corsHeaders()
      }
    });
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Speech generation failed.' }, 500);
  }
}

function servePage() {
  const defaultTarget = escapeHtml(getStringBinding('DEFAULT_TARGET_LANGUAGE', 'Spanish'));
  const defaultNative = escapeHtml(getStringBinding('DEFAULT_NATIVE_LANGUAGE', 'English'));
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Language Practice Widget</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: linear-gradient(180deg, #eff6ff, #eef2ff); color: #0f172a; }
    .page { max-width: 1040px; margin: 0 auto; padding: 32px 18px 56px; }
    .hero { display: grid; gap: 24px; grid-template-columns: 1.1fr .9fr; align-items: start; }
    .card { background: rgba(255,255,255,.94); border: 1px solid rgba(148,163,184,.22); border-radius: 28px; padding: 28px; box-shadow: 0 24px 50px rgba(30,41,59,.08); }
    h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.05; }
    p { color: #475569; line-height: 1.7; }
    label { display: grid; gap: 8px; margin-top: 14px; font-size: 14px; color: #334155; }
    input, textarea, select, button { width: 100%; border-radius: 16px; padding: 12px 14px; font: inherit; }
    input, textarea, select { border: 1px solid rgba(148,163,184,.34); background: white; color: #0f172a; }
    textarea { min-height: 90px; resize: vertical; }
    button { border: none; background: linear-gradient(135deg, #2563eb, #8b5cf6); color: white; font-weight: 700; cursor: pointer; margin-top: 16px; }
    .result, .error { display: none; margin-top: 18px; padding: 18px; border-radius: 20px; }
    .result { background: #f8fafc; border: 1px solid rgba(148,163,184,.22); }
    .error { background: #fee2e2; color: #991b1b; }
    .phrase { font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0; }
    .mini { color: #64748b; font-size: 13px; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    .actions button { margin-top: 0; width: auto; }
    @media (max-width: 860px) { .hero { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <article class="card">
        <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(37,99,235,.12);color:#1d4ed8;font-size:13px;">AI + text to speech</div>
        <h1>Practice one useful phrase at a time.</h1>
        <p>Generate a small speaking exercise, listen to the phrase with OpenAI-compatible text-to-speech, and ask the model to coach your answer. This widget stays lightweight enough to embed in a course page or LMS block.</p>
        <label>Target language
          <input id="targetLanguage" value="${defaultTarget}">
        </label>
        <label>Native language
          <input id="nativeLanguage" value="${defaultNative}">
        </label>
        <label>Topic
          <input id="topic" placeholder="travel, meetings, classroom" value="travel">
        </label>
        <label>Level
          <select id="level">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label>Your answer (optional, for feedback)
          <textarea id="learnerAnswer" placeholder="Type your attempt here if you want coaching feedback."></textarea>
        </label>
        <button id="generateButton" type="button">Generate exercise</button>
        <div id="error" class="error"></div>
      </article>
      <aside class="card">
        <div id="result" class="result">
          <p class="mini">Practice phrase</p>
          <h2 class="phrase" id="phrase"></h2>
          <p class="mini">Translation</p>
          <p id="translation"></p>
          <p class="mini">Pronunciation</p>
          <p id="pronunciation"></p>
          <p class="mini">Coach tip</p>
          <p id="tip"></p>
          <p class="mini">Feedback</p>
          <p id="coachFeedback"></p>
          <p class="mini">Follow-up question</p>
          <p id="followUpQuestion"></p>
          <div class="actions">
            <button id="listenButton" type="button">Listen</button>
            <button id="copyButton" type="button">Copy phrase</button>
          </div>
        </div>
      </aside>
    </section>
  </main>
  <script>
    const errorBox = document.getElementById('error');
    const resultBox = document.getElementById('result');
    const generateButton = document.getElementById('generateButton');
    let currentPhrase = '';
    let currentAudioUrl = null;

    async function generateExercise() {
      errorBox.style.display = 'none';
      resultBox.style.display = 'none';
      generateButton.disabled = true;
      try {
        const response = await fetch('/practice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLanguage: document.getElementById('targetLanguage').value,
            nativeLanguage: document.getElementById('nativeLanguage').value,
            topic: document.getElementById('topic').value,
            level: document.getElementById('level').value,
            learnerAnswer: document.getElementById('learnerAnswer').value
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Practice request failed');
        currentPhrase = data.phrase || '';
        document.getElementById('phrase').textContent = data.phrase || '';
        document.getElementById('translation').textContent = data.translation || '';
        document.getElementById('pronunciation').textContent = data.pronunciation || '';
        document.getElementById('tip').textContent = data.tip || '';
        document.getElementById('coachFeedback').textContent = data.coachFeedback || '';
        document.getElementById('followUpQuestion').textContent = data.followUpQuestion || '';
        resultBox.style.display = 'block';
      } catch (err) {
        errorBox.textContent = err.message || 'Practice request failed';
        errorBox.style.display = 'block';
      } finally {
        generateButton.disabled = false;
      }
    }

    async function listenToPhrase() {
      if (!currentPhrase) return;
      const response = await fetch('/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentPhrase })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Speech request failed' }));
        errorBox.textContent = data.error || 'Speech request failed';
        errorBox.style.display = 'block';
        return;
      }
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(currentAudioUrl);
      audio.play();
    }

    generateButton.addEventListener('click', generateExercise);
    document.getElementById('listenButton').addEventListener('click', listenToPhrase);
    document.getElementById('copyButton').addEventListener('click', async () => {
      if (!currentPhrase) return;
      await navigator.clipboard.writeText(currentPhrase);
    });
  </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: htmlHeaders() });
}

function extractJSONObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {}
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clean(value) {
  const trimmed = String(value || '').trim();
  return trimmed || '';
}

function normalizeVoice(value) {
  const allowed = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];
  return allowed.includes(value) ? value : 'alloy';
}

function getStringBinding(name, fallback = '') {
  const value = globalThis[name];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() };
}

function htmlHeaders() {
  return { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
