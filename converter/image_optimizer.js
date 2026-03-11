addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { imageData, quality, format }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { imageData, quality = 0.8, format = 'jpeg' } = await request.json();
    
    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Missing imageData' }), { status: 400, headers: jsonHeaders() });
    }

    // Convert base64 to binary
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    
    // Since Cloudflare Workers don't have native image processing libraries,
    // we'll return the image with basic optimization info
    // In a real implementation, you'd integrate with an image processing service
    
    const optimizedImage = await processImage(imageBuffer, quality, format);
    
    // Return optimized image as base64
    const optimizedBase64 = btoa(String.fromCharCode(...optimizedImage));
    
    const stats = {
      originalSize: imageBuffer.length,
      optimizedSize: optimizedImage.length,
      compressionRatio: (1 - optimizedImage.length / imageBuffer.length * 100).toFixed(1)
    };
    
    return new Response(JSON.stringify({ 
      optimizedImage: optimizedBase64, 
      stats,
      format 
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

async function processImage(imageBuffer, quality, format) {
  // Basic image processing - in a real implementation, use services like:
  // - Cloudflare Images API
  // - Third-party image processing APIs
  // For now, we'll just return the original buffer with basic metadata
  
  // This is a placeholder for actual image processing
  // In production, integrate with:
  // - Cloudflare Images: https://developers.cloudflare.com/images/
  // - External services like TinyPNG, ImageOptim, etc.
  
  return imageBuffer;
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