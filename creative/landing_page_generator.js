addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { title, content, style, theme }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { title, content, style = 'modern', theme = 'light' } = await request.json();
    
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Missing title or content' }), { status: 400, headers: jsonHeaders() });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
            color: ${theme === 'dark' ? '#ffffff' : '#333333'};
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: ${theme === 'dark' ? '#2d2d2d' : '#f9f9f9'};
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: ${theme === 'dark' ? '#4CAF50' : '#2196F3'};
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .content {
            font-size: 1.1em;
            white-space: pre-wrap;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.9em;
            opacity: 0.7;
        }
        ${style === 'minimal' ? `
        .container {
            background: transparent;
            box-shadow: none;
            padding: 20px;
        }
        ` : ''}
        ${style === 'corporate' ? `
        body { font-family: Arial, sans-serif; }
        h1 { font-weight: normal; border-bottom: 3px solid #2196F3; }
        ` : ''}
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <div class="content">${content}</div>
        <div class="footer">
            <p>Generated with OneTimeUseWebApp</p>
            <p>Created: ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        ...corsHeaders()
      }
    });
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