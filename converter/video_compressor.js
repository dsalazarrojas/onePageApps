addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { videoData, quality, format }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { videoData, quality = 'medium', format = 'mp4' } = await request.json();
    
    if (!videoData) {
      return new Response(JSON.stringify({ error: 'Missing videoData' }), { status: 400, headers: jsonHeaders() });
    }

    // Convert base64 to binary
    const videoBuffer = Uint8Array.from(atob(videoData), c => c.charCodeAt(0));
    
    // For video compression, we'd typically use external services like:
    // - Cloudflare Stream
    // - Mux
    // - FFmpeg-based services
    
    // For now, return compression info and integration guidance
    const compressionSettings = {
      low: { bitrate: '500k', resolution: '480p', size: 'Small' },
      medium: { bitrate: '1M', resolution: '720p', size: 'Medium' },
      high: { bitrate: '2.5M', resolution: '1080p', size: 'Large' }
    };
    
    const settings = compressionSettings[quality] || compressionSettings.medium;
    
    // This is a placeholder - in production you'd integrate with:
    // - Cloudflare Stream API: https://developers.cloudflare.com/stream/
    // - Mux API: https://docs.mux.com/
    // - Third-party video processing services
    
    const result = {
      status: 'pending',
      message: 'Video compression would be processed by Cloudflare Stream or similar service',
      originalSize: videoBuffer.length,
      estimatedOutputSize: Math.floor(videoBuffer.length * 0.3), // ~70% compression estimate
      compressionRatio: '70%',
      settings: settings,
      service: 'cloudflare_stream',
      note: 'In production, this would return a processing job ID and URL'
    };
    
    return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders() });
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