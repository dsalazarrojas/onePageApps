addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { sourceText } = await request.json();
    
    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'Missing sourceText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Analyze the tone of the following text. Identify:
1. Primary tone (e.g., professional, casual, urgent, friendly, formal, sarcastic, etc.)
2. Secondary tones (if any)
3. Intensity level (1-10)
4. Evidence from the text that supports your analysis
5. Emotional undertones detected

Respond in JSON format with fields: primaryTone, secondaryTones, intensity, evidence, emotionalUndertones.`;

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
    const rawResponse = data.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      analysis = JSON.parse(rawResponse);
    } catch {
      analysis = parseToneResponse(rawResponse);
    }
    
    return new Response(JSON.stringify({ 
      analysis,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseToneResponse(response) {
  const lowerResponse = response.toLowerCase();
  let primaryTone = 'neutral';
  let secondaryTones = [];
  let intensity = 5;
  let evidence = 'Text analysis indicates neutral tone';
  let emotionalUndertones = [];

  if (lowerResponse.includes('urgent') || lowerResponse.includes('asap')) {
    primaryTone = 'urgent'; intensity = 8;
  } else if (lowerResponse.includes('friendly') || lowerResponse.includes('thanks')) {
    primaryTone = 'friendly'; intensity = 6;
  } else if (lowerResponse.includes('formal') || lowerResponse.includes('dear')) {
    primaryTone = 'formal'; intensity = 7;
  } else if (lowerResponse.includes('casual') || lowerResponse.includes('hey')) {
    primaryTone = 'casual'; intensity = 4;
  } else if (lowerResponse.includes('professional') || lowerResponse.includes('regarding')) {
    primaryTone = 'professional'; intensity = 6;
  }

  return {
    primaryTone,
    secondaryTones,
    intensity,
    evidence: response.substring(0, 150) + '...',
    emotionalUndertones
  };
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tone Analyzer</title>
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
        textarea {
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;
            font-size: 16px; transition: border-color 0.3s ease; min-height: 200px;
            resize: vertical;
        }
        textarea:focus { outline: none; border-color: #667eea; }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .result {
            margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 12px;
            display: none;
        }
        .tone-display {
            text-align: center; padding: 20px; margin-bottom: 20px;
            background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .primary-tone {
            font-size: 2.5em; font-weight: bold; margin-bottom: 10px;
            text-transform: capitalize;
        }
        .tone-professional { color: #007bff; }
        .tone-casual { color: #28a745; }
        .tone-urgent { color: #dc3545; }
        .tone-friendly { color: #ffc107; }
        .tone-formal { color: #6f42c1; }
        .tone-neutral { color: #6c757d; }
        .intensity-bar {
            width: 100%; height: 15px; background: #e9ecef; border-radius: 7px;
            overflow: hidden; margin: 15px 0; position: relative;
        }
        .intensity-fill {
            height: 100%; background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
            transition: width 0.3s ease; border-radius: 7px;
        }
        .intensity-label {
            text-align: center; font-weight: 600; margin-bottom: 10px;
        }
        .secondary-tones {
            display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;
            justify-content: center;
        }
        .secondary-tone {
            background: #e9ecef; padding: 8px 15px; border-radius: 20px;
            font-size: 0.9em;
        }
        .evidence {
            background: white; padding: 20px; border-radius: 10px; margin-top: 20px;
            border-left: 4px solid #667eea;
        }
        .emotional-undertones {
            display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px;
        }
        .undertone {
            background: #fff3cd; padding: 5px 12px; border-radius: 12px;
            font-size: 0.8em; color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Tone Analyzer</h1>
            <p>Detect and analyze the tone and emotional characteristics of any text</p>
        </div>
        <div class="content">
            <form id="analyzeForm">
                <div class="form-group">
                    <label for="sourceText">Text to Analyze:</label>
                    <textarea id="sourceText" placeholder="Enter your text here to analyze its tone and emotional characteristics..." required></textarea>
                </div>
                <button type="submit">Analyze Tone</button>
            </form>
            <div id="result" class="result">
                <div class="tone-display">
                    <div id="primaryTone" class="primary-tone"></div>
                    <div class="intensity-label">Tone Intensity</div>
                    <div class="intensity-bar">
                        <div id="intensityFill" class="intensity-fill"></div>
                    </div>
                    <div id="intensityText"></div>
                    <div id="secondaryTones" class="secondary-tones"></div>
                </div>
                <div class="evidence">
                    <h3>Evidence & Analysis</h3>
                    <p id="evidence"></p>
                    <h4>Emotional Undertones:</h4>
                    <div id="emotionalUndertones" class="emotional-undertones"></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('analyzeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceText = document.getElementById('sourceText').value;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceText })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayAnalysis(data.analysis);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function displayAnalysis(analysis) {
            const result = document.getElementById('result');
            const primaryTone = document.getElementById('primaryTone');
            const intensityFill = document.getElementById('intensityFill');
            const intensityText = document.getElementById('intensityText');
            const secondaryTones = document.getElementById('secondaryTones');
            const evidence = document.getElementById('evidence');
            const emotionalUndertones = document.getElementById('emotionalUndertones');
            
            // Display primary tone
            primaryTone.textContent = analysis.primaryTone;
            primaryTone.className = \`primary-tone tone-\${analysis.primaryTone}\`;
            
            // Display intensity
            const intensityPercent = (analysis.intensity / 10) * 100;
            intensityFill.style.width = intensityPercent + '%';
            intensityText.textContent = \`\${analysis.intensity}/10\`;
            
            // Display secondary tones
            if (analysis.secondaryTones && analysis.secondaryTones.length > 0) {
                secondaryTones.innerHTML = analysis.secondaryTones.map(tone => 
                    \`<span class="secondary-tone">\${tone}</span>\`
                ).join('');
            } else {
                secondaryTones.innerHTML = '<span class="secondary-tone">No secondary tones detected</span>';
            }
            
            // Display evidence
            evidence.textContent = analysis.evidence;
            
            // Display emotional undertones
            if (analysis.emotionalUndertones && analysis.emotionalUndertones.length > 0) {
                emotionalUndertones.innerHTML = analysis.emotionalUndertones.map(undertone => 
                    \`<span class="undertone">\${undertone}</span>\`
                ).join('');
            } else {
                emotionalUndertones.innerHTML = '<span class="undertone">No specific undertones detected</span>';
            }
            
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