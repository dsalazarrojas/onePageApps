addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { url, regions? }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { url, regions = ['iad', 'fra', 'syd'] } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers: jsonHeaders() });
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: jsonHeaders() });
    }

    const results = await Promise.all(regions.map(async region => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'HEAD', // Use HEAD for faster checking
          headers: {
            'User-Agent': 'OneTimeUseWebApp-StatusChecker/1.0'
          },
          cf: {
            cacheTtl: 0,
            cacheEverything: false
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const responseTime = Date.now() - startTime;
        
        return {
          region,
          status: 'online',
          httpStatus: response.status,
          responseTime: responseTime,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        };
      } catch (e) {
        return {
          region,
          status: 'offline',
          httpStatus: null,
          responseTime: null,
          error: e.message,
          timestamp: new Date().toISOString()
        };
      }
    }));

    const summary = {
      total: regions.length,
      online: results.filter(r => r.status === 'online').length,
      offline: results.filter(r => r.status === 'offline').length,
      overallStatus: results.some(r => r.status === 'online') ? 'partial' : 'offline'
    };

    const status = {
      url,
      summary,
      results,
      checkTime: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(status), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Status check failed' }), { status: 500, headers: jsonHeaders() });
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