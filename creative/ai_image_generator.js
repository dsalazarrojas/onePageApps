addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { prompt, style? }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { prompt, style = 'photorealistic' } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = FAL_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing FAL_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const body = {
      prompt: `${prompt}, ${style} style`,
      model: "fal-ai/flux",
      image_size: "landscape_4_3"
    };

    const aiResp = await fetch('https://fal.run/fal-ai/flux', {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!aiResp.ok) {
      const error = await aiResp.text();
      return new Response(JSON.stringify({ error: `Image generation failed: ${error}` }), { status: 500, headers: jsonHeaders() });
    }

    const data = await aiResp.json();
    return new Response(JSON.stringify({ imageUrl: data.images[0].url }), { status: 200, headers: jsonHeaders() });
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