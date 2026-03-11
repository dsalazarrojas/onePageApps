addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { imageData, analysisType }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { imageData, analysisType = 'description' } = await request.json();
    
    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Missing imageData' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    let prompt;
    switch (analysisType) {
      case 'alt-text':
        prompt = 'Provide detailed alt-text for this image, describing it for accessibility purposes.';
        break;
      case 'objects':
        prompt = 'Identify and list all objects, people, and elements visible in this image.';
        break;
      case 'text':
        prompt = 'Extract any text visible in this image and transcribe it exactly.';
        break;
      default:
        prompt = 'Provide a detailed description of this image.';
    }

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ]
        }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    const analysis = data.choices?.[0]?.message?.content || '';
    
    return new Response(JSON.stringify({ analysis }), { status: 200, headers: jsonHeaders() });
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