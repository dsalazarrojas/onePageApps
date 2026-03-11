addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { url, selectors }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { url, selectors } = await request.json();
    
    if (!url || !selectors) {
      return new Response(JSON.stringify({ error: 'Missing url or selectors' }), { status: 400, headers: jsonHeaders() });
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: jsonHeaders() });
    }

    // Check if URL is accessible
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OneTimeUseWebApp/1.0)'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${response.status}: ${response.statusText}` }), { status: 400, headers: jsonHeaders() });
    }

    const html = await response.text();
    
    // Basic HTML parsing to extract data
    const extractedData = {};
    
    selectors.forEach(selector => {
      try {
        const regex = new RegExp(`<[^>]+class="[^"]*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"[^>]*>([\\s\\S]*?)<\/[^>]+>`, 'gi');
        const matches = html.match(regex);
        
        if (matches) {
          extractedData[selector] = matches.map(match => {
            // Remove HTML tags and clean up text
            return match
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .trim();
          }).filter(text => text.length > 0);
        }
      } catch (e) {
        extractedData[selector] = [];
      }
    });

    const result = {
      url,
      status: response.status,
      extractedData,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Scraping failed' }), { status: 500, headers: jsonHeaders() });
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