addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { sourceText, labelSet = 'positive/neutral/negative' } = await request.json();
    
    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'Missing sourceText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const isFivePoint = labelSet === '1-5';
    const sysPrompt = `Analyze the sentiment of the following text. Provide:
1. A sentiment score: ${isFivePoint ? '1-5 (1=very negative, 5=very positive)' : 'positive/neutral/negative'}
2. Confidence level (0-100%)
3. Brief explanation for your assessment
4. Key emotional indicators found in the text

Respond in JSON format with fields: sentiment, confidence, explanation, indicators.`;

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
    
    // Try to parse as JSON, fallback to text parsing
    let analysis;
    try {
      analysis = JSON.parse(rawResponse);
    } catch {
      analysis = parseSentimentResponse(rawResponse, isFivePoint);
    }
    
    return new Response(JSON.stringify({ 
      analysis,
      config: { labelSet },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseSentimentResponse(response, isFivePoint) {
  // Simple parsing fallback
  const lowerResponse = response.toLowerCase();
  let sentiment, confidence = 85;
  
  if (isFivePoint) {
    if (lowerResponse.includes('5') || lowerResponse.includes('very positive')) sentiment = 5;
    else if (lowerResponse.includes('4') || lowerResponse.includes('positive')) sentiment = 4;
    else if (lowerResponse.includes('3') || lowerResponse.includes('neutral')) sentiment = 3;
    else if (lowerResponse.includes('2') || lowerResponse.includes('negative')) sentiment = 2;
    else sentiment = 1;
  } else {
    if (lowerResponse.includes('positive')) sentiment = 'positive';
    else if (lowerResponse.includes('negative')) sentiment = 'negative';
    else sentiment = 'neutral';
  }
  
  return {
    sentiment,
    confidence,
    explanation: response.substring(0, 200) + '...',
    indicators: ['text analysis', 'context evaluation']
  };
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentiment Analyzer</title>
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
        textarea, select {
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;
            font-size: 16px; transition: border-color 0.3s ease;
        }
        textarea:focus, select:focus { outline: none; border-color: #667eea; }
        textarea { min-height: 200px; resize: vertical; }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .result {
            margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 12px;
            display: none;
        }
        .sentiment-display {
            text-align: center; padding: 20px; margin-bottom: 20px;
            background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .sentiment-score {
            font-size: 3em; font-weight: bold; margin-bottom: 10px;
        }
        .score-positive { color: #28a745; }
        .score-neutral { color: #ffc107; }
        .score-negative { color: #dc3545; }
        .confidence-bar {
            width: 100%; height: 10px; background: #e9ecef; border-radius: 5px;
            overflow: hidden; margin: 10px 0;
        }
        .confidence-fill {
            height: 100%; background: #28a745; transition: width 0.3s ease;
        }
        .explanation {
            background: white; padding: 20px; border-radius: 10px; margin-top: 20px;
            border-left: 4px solid #667eea;
        }
        .indicators {
            display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;
        }
        .indicator {
            background: #e9ecef; padding: 5px 12px; border-radius: 15px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Sentiment Analyzer</h1>
            <p>Analyze emotional tone and sentiment with AI-powered text analysis</p>
        </div>
        <div class="content">
            <form id="analyzeForm">
                <div class="form-group">
                    <label for="sourceText">Text to Analyze:</label>
                    <textarea id="sourceText" placeholder="Enter your text here for sentiment analysis..." required></textarea>
                </div>
                <div class="form-group">
                    <label for="labelSet">Sentiment Scale:</label>
                    <select id="labelSet">
                        <option value="positive/neutral/negative">3-Point Scale (Positive/Neutral/Negative)</option>
                        <option value="1-5">5-Point Scale (1=Very Negative, 5=Very Positive)</option>
                    </select>
                </div>
                <button type="submit">Analyze Sentiment</button>
            </form>
            <div id="result" class="result">
                <div class="sentiment-display">
                    <div id="sentimentScore" class="sentiment-score"></div>
                    <div id="sentimentLabel"></div>
                    <div class="confidence-bar">
                        <div id="confidenceFill" class="confidence-fill"></div>
                    </div>
                    <div id="confidenceText"></div>
                </div>
                <div class="explanation">
                    <h3>Analysis Explanation</h3>
                    <p id="explanation"></p>
                    <div class="indicators">
                        <h4 style="margin-right: 10px;">Key Indicators:</h4>
                        <div id="indicatorsList"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('analyzeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceText = document.getElementById('sourceText').value;
            const labelSet = document.getElementById('labelSet').value;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceText, labelSet })
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
            const sentimentScore = document.getElementById('sentimentScore');
            const sentimentLabel = document.getElementById('sentimentLabel');
            const confidenceFill = document.getElementById('confidenceFill');
            const confidenceText = document.getElementById('confidenceText');
            const explanation = document.getElementById('explanation');
            const indicatorsList = document.getElementById('indicatorsList');
            
            // Display sentiment score
            const isFivePoint = typeof analysis.sentiment === 'number' && analysis.sentiment > 3;
            
            if (isFivePoint) {
                sentimentScore.textContent = analysis.sentiment + '/5';
                let scoreClass, label;
                if (analysis.sentiment >= 4) { scoreClass = 'score-positive'; label = 'Positive'; }
                else if (analysis.sentiment >= 3) { scoreClass = 'score-neutral'; label = 'Neutral'; }
                else { scoreClass = 'score-negative'; label = 'Negative'; }
                sentimentScore.className = \`sentiment-score \${scoreClass}\`;
                sentimentLabel.textContent = label;
            } else {
                sentimentScore.textContent = analysis.sentiment.toUpperCase();
                if (analysis.sentiment === 'positive') sentimentScore.className = 'sentiment-score score-positive';
                else if (analysis.sentiment === 'negative') sentimentScore.className = 'sentiment-score score-negative';
                else sentimentScore.className = 'sentiment-score score-neutral';
                sentimentLabel.textContent = '';
            }
            
            // Display confidence
            confidenceFill.style.width = analysis.confidence + '%';
            confidenceText.textContent = \`Confidence: \${analysis.confidence}%\`;
            
            // Display explanation
            explanation.textContent = analysis.explanation;
            
            // Display indicators
            indicatorsList.innerHTML = analysis.indicators.map(indicator => 
                \`<span class="indicator">\${indicator}</span>\`
            ).join('');
            
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