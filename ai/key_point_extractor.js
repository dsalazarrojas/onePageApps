addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { sourceText, points = 5, audience = 'general' } = await request.json();
    
    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'Missing sourceText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Extract the top ${points} most actionable insights from the following text. Focus on practical, implementable points that the target audience (${audience}) can act upon. Number each point clearly and provide brief explanations.`;
    
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: sourceText }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    const insights = data.choices?.[0]?.message?.content || '';
    
    // Parse insights into structured format
    const structuredInsights = parseInsights(insights);
    
    return new Response(JSON.stringify({ 
      insights: structuredInsights,
      rawOutput: insights,
      config: { points, audience },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseInsights(insights) {
  const lines = insights.split('\n').filter(line => line.trim());
  const parsed = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    // Match numbered points like "1. Insight text" or "- Insight text"
    const match = trimmed.match(/^(\d+\.|\-|•)\s*(.+)/);
    if (match) {
      parsed.push({
        point: match[2].trim(),
        category: categorizeInsight(match[2])
      });
    }
  });
  
  return parsed.length > 0 ? parsed : [{ point: insights, category: 'general' }];
}

function categorizeInsight(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('strategy') || lowerText.includes('plan')) return 'strategic';
  if (lowerText.includes('implement') || lowerText.includes('action')) return 'actionable';
  if (lowerText.includes('risk') || lowerText.includes('concern')) return 'risk';
  if (lowerText.includes('benefit') || lowerText.includes('advantage')) return 'opportunity';
  return 'informational';
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Key Point Extractor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .content { padding: 40px; }
        .form-group { margin: 20px 0; }
        .form-group label {
            display: block; margin-bottom: 8px; font-weight: 600; color: #495057;
        }
        textarea, input, select {
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;
            font-size: 16px; transition: border-color 0.3s ease;
        }
        textarea:focus, input:focus, select:focus { outline: none; border-color: #667eea; }
        textarea { min-height: 200px; resize: vertical; }
        .row { display: flex; gap: 15px; }
        .row .form-group { flex: 1; }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .result {
            margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 12px;
            display: none;
        }
        .insight-item {
            background: white; padding: 20px; margin: 15px 0; border-radius: 10px;
            border-left: 4px solid #667eea; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .insight-category {
            display: inline-block; padding: 4px 12px; border-radius: 15px;
            font-size: 0.8em; font-weight: 600; margin-bottom: 10px;
        }
        .category-strategic { background: #e3f2fd; color: #1565c0; }
        .category-actionable { background: #e8f5e8; color: #2e7d32; }
        .category-risk { background: #fff3e0; color: #f57c00; }
        .category-opportunity { background: #f3e5f5; color: #7b1fa2; }
        .category-informational { background: #f5f5f5; color: #616161; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Key Point Extractor</h1>
            <p>Extract actionable insights from any text with AI-powered analysis</p>
        </div>
        <div class="content">
            <form id="extractForm">
                <div class="form-group">
                    <label for="sourceText">Source Text:</label>
                    <textarea id="sourceText" placeholder="Paste your text here..." required></textarea>
                </div>
                <div class="row">
                    <div class="form-group">
                        <label for="points">Number of Key Points:</label>
                        <select id="points">
                            <option value="3">3 Points</option>
                            <option value="5" selected>5 Points</option>
                            <option value="7">7 Points</option>
                            <option value="10">10 Points</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="audience">Target Audience:</label>
                        <select id="audience">
                            <option value="general" selected>General</option>
                            <option value="executives">Executives</option>
                            <option value="managers">Managers</option>
                            <option value="developers">Developers</option>
                            <option value="marketers">Marketers</option>
                            <option value="sales">Sales Team</option>
                        </select>
                    </div>
                </div>
                <button type="submit">Extract Key Points</button>
            </form>
            <div id="result" class="result">
                <h3>🔍 Key Insights Found</h3>
                <div id="insightsList"></div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('extractForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceText = document.getElementById('sourceText').value;
            const points = parseInt(document.getElementById('points').value);
            const audience = document.getElementById('audience').value;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceText, points, audience })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayInsights(data.insights);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function displayInsights(insights) {
            const result = document.getElementById('result');
            const list = document.getElementById('insightsList');
            
            list.innerHTML = insights.map(insight => \`
                <div class="insight-item">
                    <span class="insight-category category-\${insight.category}">\${insight.category}</span>
                    <p>\${insight.point}</p>
                </div>
            \`).join('');
            
            result.style.display = 'block';
            result.scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }