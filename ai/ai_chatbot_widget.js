addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (path === '/' && request.method === 'GET') {
    return servePage();
  }

  if (path === '/chat' && request.method === 'POST') {
    return handleChat(request);
  }

  if (path === '/reset' && request.method === 'GET') {
    return handleReset(request);
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function handleChat(request) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const sessionId = String(body?.sessionId || '').trim() || crypto.randomUUID();
    if (!message) {
      return jsonResponse({ error: 'Missing message', sessionId }, 400);
    }

    const apiKey = getStringBinding('OPENAI_API_KEY');
    const baseUrl = getStringBinding('OPENAI_BASE_URL', 'https://api.openai.com/v1');
    const model = getStringBinding('MODEL', 'gpt-4o-mini');
    const systemPrompt = getStringBinding('SYSTEM_PROMPT', 'You are a helpful website assistant. Keep responses clear, concise, and friendly.');
    const kv = getNamespaceBinding('CHAT_HISTORY');

    if (!apiKey) {
      return jsonResponse({ error: 'Chatbot not configured: missing OPENAI_API_KEY', sessionId, persisted: Boolean(kv) }, 500);
    }

    let history = sanitizeHistory(Array.isArray(body?.history) ? body.history : []);
    if (kv) {
      const stored = await kv.get(historyKey(sessionId));
      if (stored) {
        try {
          history = sanitizeHistory(JSON.parse(stored));
        } catch (_) {}
      }
    }

    history = history.slice(-10);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ]
      })
    });

    const raw = await response.text();
    if (!response.ok) {
      return jsonResponse({ error: `AI request failed (${response.status})`, details: raw.slice(0, 300), sessionId }, 502);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return jsonResponse({ error: 'AI service returned invalid JSON', sessionId }, 502);
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return jsonResponse({ error: 'AI service returned an empty reply', sessionId }, 502);
    }

    const updatedHistory = [...history, { role: 'user', content: message }, { role: 'assistant', content: reply }].slice(-12);
    if (kv) {
      await kv.put(historyKey(sessionId), JSON.stringify(updatedHistory), { expirationTtl: 86400 });
    }

    return jsonResponse({ reply, sessionId, history: updatedHistory, persisted: Boolean(kv), model }, 200);
  } catch (e) {
    return jsonResponse({ error: e?.message || 'Chat request failed' }, 500);
  }
}

async function handleReset(request) {
  const url = new URL(request.url);
  const sessionId = String(url.searchParams.get('sessionId') || '').trim();
  if (!sessionId) {
    return jsonResponse({ error: 'Missing sessionId' }, 400);
  }

  const kv = getNamespaceBinding('CHAT_HISTORY');
  if (kv) {
    await kv.delete(historyKey(sessionId));
  }

  return jsonResponse({ ok: true, message: kv ? 'Chat history cleared.' : 'No CHAT_HISTORY binding configured. Browser-side history can still be cleared.' }, 200);
}

function servePage() {
  const title = escapeHtml(getStringBinding('WIDGET_TITLE', 'Ask me anything'));
  const accent = normalizeHex(getStringBinding('WIDGET_ACCENT_COLOR', '#6366F1'));
  const hasApi = Boolean(getStringBinding('OPENAI_API_KEY'));
  const hasKv = Boolean(getNamespaceBinding('CHAT_HISTORY'));
  const note = hasApi
    ? (hasKv ? 'Live replies enabled with 24-hour KV-backed history.' : 'Live replies enabled. History stays in the browser unless CHAT_HISTORY is bound.')
    : 'Add OPENAI_API_KEY to enable live replies.';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(99,102,241,.16), transparent 32%), #0f172a;
      color: #e2e8f0;
      padding: 32px 16px 120px;
    }
    .page { max-width: 1080px; margin: 0 auto; }
    .hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 24px; align-items: start; }
    .card {
      background: rgba(15,23,42,.82);
      border: 1px solid rgba(148,163,184,.16);
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(2,6,23,.36);
      backdrop-filter: blur(12px);
    }
    .copy { padding: 32px; }
    .pill { display: inline-block; padding: 8px 12px; border-radius: 999px; background: rgba(79,70,229,.16); color: #c7d2fe; font-size: 13px; }
    h1 { font-size: clamp(2.4rem, 5vw, 4rem); line-height: 1.02; margin: 16px 0 12px; }
    p { color: #cbd5e1; line-height: 1.7; }
    .note { margin-top: 18px; padding: 14px 16px; border-radius: 16px; background: rgba(30,41,59,.7); }
    .preview { padding: 24px; }
    .window { background: linear-gradient(180deg, rgba(30,41,59,.96), rgba(15,23,42,.96)); border-radius: 20px; overflow: hidden; border: 1px solid rgba(148,163,184,.14); }
    .window-header { padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,.12); display: flex; justify-content: space-between; align-items: center; }
    .window-body { padding: 18px; display: grid; gap: 12px; }
    .sample { padding: 12px 14px; border-radius: 18px; max-width: 80%; line-height: 1.5; font-size: 14px; }
    .sample.assistant { background: rgba(51,65,85,.95); border-bottom-left-radius: 6px; }
    .sample.user { background: ${accent}; color: white; justify-self: end; border-bottom-right-radius: 6px; }
    .launcher { position: fixed; right: 20px; bottom: 20px; width: 68px; height: 68px; border: none; border-radius: 999px; background: ${accent}; color: white; font-size: 28px; cursor: pointer; box-shadow: 0 18px 36px rgba(2,6,23,.35); z-index: 20; }
    .chat { position: fixed; right: 20px; bottom: 100px; width: min(380px, calc(100vw - 24px)); max-height: 78vh; display: flex; flex-direction: column; overflow: hidden; transition: opacity .2s ease, transform .2s ease; transform-origin: bottom right; z-index: 19; }
    .chat.closed { opacity: 0; pointer-events: none; transform: scale(.95) translateY(12px); }
    .chat-header { padding: 16px; background: linear-gradient(135deg, ${accent}, rgba(15,23,42,.95)); color: white; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .chat-header button { border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.12); color: white; border-radius: 999px; padding: 8px 12px; cursor: pointer; font: inherit; font-size: 12px; }
    .messages { background: #f8fafc; color: #0f172a; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-height: 340px; }
    .message { max-width: 86%; padding: 12px 14px; border-radius: 18px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .message.user { align-self: flex-end; background: ${accent}; color: white; border-bottom-right-radius: 6px; }
    .message.assistant { align-self: flex-start; background: white; border: 1px solid rgba(148,163,184,.2); border-bottom-left-radius: 6px; }
    .empty { text-align: center; padding: 18px; border: 1px dashed rgba(148,163,184,.42); border-radius: 18px; color: #64748b; background: rgba(255,255,255,.7); }
    .typing { display: none; align-self: flex-start; gap: 6px; background: white; border: 1px solid rgba(148,163,184,.2); padding: 12px 14px; border-radius: 18px; border-bottom-left-radius: 6px; }
    .typing.visible { display: inline-flex; }
    .typing span { width: 8px; height: 8px; border-radius: 50%; background: #64748b; animation: bounce 1s infinite ease-in-out; }
    .typing span:nth-child(2) { animation-delay: .12s; }
    .typing span:nth-child(3) { animation-delay: .24s; }
    @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-4px); opacity: 1; } }
    form { background: white; padding: 16px; border-top: 1px solid rgba(148,163,184,.16); display: grid; gap: 12px; }
    textarea { width: 100%; min-height: 92px; resize: vertical; border-radius: 16px; border: 1px solid rgba(148,163,184,.34); padding: 14px 16px; font: inherit; }
    textarea:focus { outline: none; border-color: ${accent}; box-shadow: 0 0 0 3px rgba(99,102,241,.16); }
    .composer { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .meta { color: #64748b; font-size: 12px; }
    .send { border: none; border-radius: 999px; background: ${accent}; color: white; padding: 12px 18px; cursor: pointer; font: inherit; font-weight: 700; }
    .error { display: none; padding: 12px 14px; border-radius: 14px; background: #fee2e2; color: #991b1b; font-size: 13px; }
    @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .chat { left: 12px; right: 12px; width: auto; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <section class="card copy">
        <div class="pill">Embeddable AI assistant</div>
        <h1>${title}</h1>
        <p>Serve a full-page preview with a floating chat bubble, message history, a typing indicator, and a reset route. Visitors can keep chatting in the browser, while KV-backed storage becomes automatic when a <code>CHAT_HISTORY</code> binding exists.</p>
        <div class="note">${escapeHtml(note)}</div>
      </section>
      <aside class="card preview">
        <div class="window">
          <div class="window-header"><strong>${title}</strong><span>POST /chat</span></div>
          <div class="window-body">
            <div class="sample assistant">Hi! I can answer questions, summarize content, and guide visitors.</div>
            <div class="sample user">What happens if KV is not bound?</div>
            <div class="sample assistant">The widget still works using browser-side history, and <code>/reset</code> clears the local conversation in the page.</div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <button class="launcher" id="launcher" aria-label="Open chat">💬</button>
  <div class="chat card" id="chatPanel">
    <div class="chat-header">
      <div>
        <strong>${title}</strong><br>
        <small>${hasApi ? 'Ready for live replies' : 'Configuration required'}</small>
      </div>
      <div>
        <button id="clearButton" type="button">Clear</button>
        <button id="closeButton" type="button">Close</button>
      </div>
    </div>
    <div class="messages" id="messages">
      <div class="empty" id="emptyState">Start a conversation below. The widget uses <code>POST /chat</code> and clears persisted sessions via <code>GET /reset</code>.</div>
      <div class="typing" id="typing"><span></span><span></span><span></span></div>
    </div>
    <form id="chatForm">
      <div class="error" id="errorBox"></div>
      <textarea id="messageInput" placeholder="Send a message..." required></textarea>
      <div class="composer">
        <div class="meta">Model: ${escapeHtml(getStringBinding('MODEL', 'gpt-4o-mini'))}</div>
        <button class="send" id="sendButton" type="submit">Send</button>
      </div>
    </form>
  </div>

  <script>
    const panel = document.getElementById('chatPanel');
    const launcher = document.getElementById('launcher');
    const closeButton = document.getElementById('closeButton');
    const clearButton = document.getElementById('clearButton');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messages = document.getElementById('messages');
    const typing = document.getElementById('typing');
    const errorBox = document.getElementById('errorBox');
    const emptyState = document.getElementById('emptyState');
    const sessionKey = 'otuwa-chatbot-session';
    const historyKeyName = 'otuwa-chatbot-history';
    let sessionId = localStorage.getItem(sessionKey);
    let history = [];

    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
      localStorage.setItem(sessionKey, sessionId);
    }

    try {
      const stored = JSON.parse(localStorage.getItem(historyKeyName) || '[]');
      if (Array.isArray(stored)) history = stored;
    } catch (_) {}

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function render() {
      messages.querySelectorAll('.message').forEach(node => node.remove());
      emptyState.style.display = history.length ? 'none' : 'block';
      history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'message ' + (item.role === 'assistant' ? 'assistant' : 'user');
        div.innerHTML = escapeHtml(item.content).replace(/\n/g, '<br>');
        messages.insertBefore(div, typing);
      });
      localStorage.setItem(historyKeyName, JSON.stringify(history));
      messages.scrollTop = messages.scrollHeight;
    }

    function setOpen(isOpen) {
      panel.classList.toggle('closed', !isOpen);
    }

    function showError(message) {
      errorBox.textContent = message;
      errorBox.style.display = 'block';
    }

    function clearError() {
      errorBox.textContent = '';
      errorBox.style.display = 'none';
    }

    launcher.addEventListener('click', () => setOpen(panel.classList.contains('closed')));
    closeButton.addEventListener('click', () => setOpen(false));
    clearButton.addEventListener('click', async () => {
      history = [];
      render();
      localStorage.removeItem(historyKeyName);
      clearError();
      try {
        await fetch('/reset?sessionId=' + encodeURIComponent(sessionId));
      } catch (_) {}
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      clearError();
      history.push({ role: 'user', content: text });
      render();
      input.value = '';
      typing.classList.add('visible');
      sendButton.disabled = true;
      try {
        const response = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId, history })
        });
        const data = await response.json();
        if (!response.ok) {
          history = history.filter((item, index) => !(index === history.length - 1 && item.role === 'user' && item.content === text));
          render();
          throw new Error(data.error || 'Chat request failed');
        }
        history = Array.isArray(data.history) ? data.history : [...history, { role: 'assistant', content: data.reply || '' }];
        render();
      } catch (error) {
        showError(error.message || 'Unable to send message.');
      } finally {
        typing.classList.remove('visible');
        sendButton.disabled = false;
      }
    });

    render();
    setOpen(window.innerWidth > 720);
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: htmlHeaders() });
}

function sanitizeHistory(history) {
  return history
    .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map(item => ({ role: item.role, content: item.content.slice(0, 4000) }));
}

function historyKey(sessionId) {
  return `session:${sessionId}`;
}

function getStringBinding(name, fallback = '') {
  const value = typeof globalThis[name] === 'undefined' ? fallback : globalThis[name];
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function getNamespaceBinding(name) {
  return typeof globalThis[name] === 'undefined' ? null : globalThis[name];
}

function normalizeHex(value) {
  const candidate = String(value || '').trim();
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(candidate) ? candidate : '#6366F1';
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}

function htmlHeaders() {
  return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
