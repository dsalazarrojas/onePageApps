addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { text, maxWords, model? }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { text, maxWords, model } = await request.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: jsonHeaders() });
    }
    const apiKey = OPENAI_API_KEY; // bound as secret
    const baseURL = OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const effectiveModel = model || OPENAI_MODEL || 'gpt-4o-mini';
    if (!apiKey || !baseURL) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY or OPENAI_BASE_URL' }), { status: 500, headers: jsonHeaders() });
    }
    const sysPrompt = 'Summarize the following text in concise, plain English.' + (maxWords ? ` Limit to ${maxWords} words.` : '');
    const body = {
      model: effectiveModel,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: text }
      ]
    };
    const aiResp = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      return new Response(JSON.stringify({ error: 'Upstream error', details: errTxt }), { status: 502, headers: jsonHeaders() });
    }
    const data = await aiResp.json();
    const summary = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ summary }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
