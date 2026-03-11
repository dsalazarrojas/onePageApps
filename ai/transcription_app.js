addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { audioData, format }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { audioData, format = 'mp3' } = await request.json();
    
    if (!audioData) {
      return new Response(JSON.stringify({ error: 'Missing audioData' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    // Convert base64 audio to blob for OpenAI Whisper API
    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), `audio.${format}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    const aiResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    });

    if (!aiResp.ok) {
      const error = await aiResp.text();
      return new Response(JSON.stringify({ error: `Transcription failed: ${error}` }), { status: 500, headers: jsonHeaders() });
    }

    const transcription = await aiResp.text();
    
    return new Response(JSON.stringify({ transcription }), { status: 200, headers: jsonHeaders() });
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