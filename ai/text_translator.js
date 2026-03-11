addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { text, targetLanguage, sourceLanguage? }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { text, targetLanguage, sourceLanguage = 'auto' } = await request.json();
    
    if (!text || !targetLanguage) {
      return new Response(JSON.stringify({ error: 'Missing text or targetLanguage' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Translate the following text to ${targetLanguage}. Keep the translation accurate and natural. ${sourceLanguage !== 'auto' ? `The source language is ${sourceLanguage}.` : ''}`;
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: text }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    const translatedText = data.choices?.[0]?.message?.content || '';
    
    return new Response(JSON.stringify({ translatedText }), { status: 200, headers: jsonHeaders() });
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