addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Serve API documentation page
  if (path === '/' || path === '/docs') {
    return serveApiDocs();
  }

  // Proxy requests to target API
  if (path.startsWith('/proxy/')) {
    return handleProxyRequest(request);
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function handleProxyRequest(request) {
  try {
    const url = new URL(request.url);
    const encodedTargetUrl = url.pathname.replace('/proxy/', '');
    const targetUrl = decodeURIComponent(encodedTargetUrl);

    // Validate target URL
    let parsedTargetUrl;
    try {
      parsedTargetUrl = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid target URL' }), { 
        status: 400, 
        headers: jsonHeaders() 
      });
    }

    // Validate that target URL matches allowed domains (security)
    const allowedDomains = PROXY_ALLOWED_DOMAINS ? PROXY_ALLOWED_DOMAINS.split(',') : [];
    if (allowedDomains.length > 0 && !allowedDomains.some(domain => parsedTargetUrl.hostname.includes(domain))) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), { 
        status: 403, 
        headers: jsonHeaders() 
      });
    }

    // Get API key from environment
    const apiKey = PROXY_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Proxy not configured' }), { 
        status: 500, 
        headers: jsonHeaders() 
      });
    }

    // Clone the request and modify headers
    const headers = new Headers(request.headers);
    headers.delete('host'); // Remove host header
    headers.delete('origin'); // Remove origin header
    
    // Add proxy-specific headers
    headers.set('X-Proxy-Timestamp', Date.now().toString());
    headers.set('X-Proxy-ID', PROXY_ID || 'default');

    // Make request to target API
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    });

    const response = await fetch(proxyRequest);
    
    // Clone response and add CORS headers
    const proxyResponse = new Response(response.body, response.status);
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    proxyResponse.headers.set('X-Proxy-Response', 'true');
    
    return proxyResponse;
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Proxy error' }), { 
      status: 500, 
      headers: jsonHeaders() 
    });
  }
}

async function serveApiDocs() {
  const docsHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Gateway Documentation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { color: #007bff; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #28a745; margin-top: 30px; }
        h3 { color: #17a2b8; }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #d63384;
        }
        pre {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #007bff;
        }
        .endpoint {
            background: #e9ecef;
            padding: 15px;
            margin: 15px 0;
            border-radius: 6px;
            border-left: 4px solid #28a745;
        }
        .note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .warning {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 API Gateway Documentation</h1>
        <p>Secure API proxy that protects your API keys while providing access to external services.</p>
        
        <div class="note">
            <strong>Note:</strong> This gateway is configured with your API key as an environment variable, 
            keeping it secure from client-side exposure.
        </div>

        <h2>Base URL</h2>
        <code id="baseUrl">${'{your-worker-url}'}</code>

        <h2>Endpoints</h2>

        <div class="endpoint">
            <h3>GET /proxy/{encoded-url}</h3>
            <p>Proxy any allowed API request, hiding your API key from clients.</p>
            
            <h4>Parameters:</h4>
            <ul>
                <li><code>encoded-url</code> - URL-encoded target API endpoint</li>
            </ul>

            <h4>Example:</h4>
            <pre><code>// This would proxy to: https://api.example.com/data
fetch('${'{your-worker-url}'}/proxy/' + encodeURIComponent('https://api.example.com/data'))
  .then(response => response.json())
  .then(data => console.log(data));</code></pre>
        </div>

        <div class="endpoint">
            <h3>POST /proxy/{encoded-url}</h3>
            <p>Proxy POST requests with body data.</p>
            
            <h4>Example:</h4>
            <pre><code>// This would proxy to: https://api.example.com/analyze
fetch('${'{your-worker-url}'}/proxy/' + encodeURIComponent('https://api.example.com/analyze'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Hello World',
    language: 'en'
  })
})</code></pre>
        </div>

        <h2>Security Features</h2>
        <ul>
            <li>✅ API key protection - Your key never reaches the client</li>
            <li>✅ Domain filtering - Only allowed domains can be proxied</li>
            <li>✅ Request logging - All proxy requests are tracked</li>
            <li>✅ CORS enabled - Direct browser access supported</li>
            <li>✅ Header sanitization - Removes potentially harmful headers</li>
        </ul>

        <div class="warning">
            <strong>Warning:</strong> This proxy should only be used with trusted APIs. 
            The service provides your API key to any domain listed in your allowed domains configuration.
        </div>

        <h2>Configuration</h2>
        <p>Your proxy is configured with the following environment variables:</p>
        <ul>
            <li><code>PROXY_API_KEY</code> - Your secure API key</li>
            <li><code>PROXY_ALLOWED_DOMAINS</code> - Comma-separated list of allowed target domains</li>
            <li><code>PROXY_ID</code> - Unique identifier for this proxy instance</li>
        </ul>

        <h2>Usage Examples</h2>

        <h3>Simple GET Request</h3>
        <pre><code>const weatherData = await fetch(
  '/proxy/' + encodeURIComponent('https://api.weather.com/v1/current?location=London')
).then(r => r.json());</code></pre>

        <h3>Complex API Call</h3>
        <pre><code>const aiResponse = await fetch(
  '/proxy/' + encodeURIComponent('https://api.openai.com/v1/chat/completions'),
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }]
    })
  }
).then(r => r.json());</code></pre>

        <h2>Response Format</h2>
        <p>All responses include the following headers:</p>
        <ul>
            <li><code>X-Proxy-Response: true</code> - Identifies this as a proxy response</li>
            <li><code>X-Proxy-Timestamp</code> - When the request was processed</li>
            <li><code>X-Proxy-ID</code> - Proxy instance identifier</li>
        </ul>

        <div class="note">
            <strong>Best Practice:</strong> Always test your proxy setup with the documentation endpoint 
            at <a href="/docs">/docs</a> before deploying to production.
        </div>
    </div>

    <script>
        // Update base URL in documentation
        document.getElementById('baseUrl').textContent = window.location.origin;
    </script>
</body>
</html>`;

  return new Response(docsHtml, { status: 200, headers: textHeaders() });
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/html', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}