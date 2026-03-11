addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { sourceText, variations = 3, creativity = 0.7 } = await request.json();
    
    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'Missing sourceText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const creativityLevel = creativity < 0.3 ? 'conservative' : creativity > 0.8 ? 'very creative' : 'moderate';
    const sysPrompt = `Generate ${variations} paraphrased versions of the following text with ${creativityLevel} creativity level (${creativity}). 
Each version should:
- Maintain the original meaning
- Use different sentence structures and vocabulary
- Be appropriate for the same audience
- Vary in tone slightly while staying consistent

Label each variation clearly.`;

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
    const paraphrases = data.choices?.[0]?.message?.content || '';
    
    const parsed = parseParaphrases(paraphrases, variations);
    
    return new Response(JSON.stringify({ 
      variations: parsed,
      config: { variations, creativity },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseParaphrases(response, expectedCount) {
  const lines = response.split('\n').filter(line => line.trim());
  const variations = [];
  
  let currentVariation = '';
  let variationIndex = 0;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Check if this is a variation header
    if (trimmed.match(/^\d+\./) || trimmed.toLowerCase().includes('variation') || trimmed.toLowerCase().includes('version')) {
      if (currentVariation && variationIndex < expectedCount) {
        variations.push({
          id: variationIndex + 1,
          text: currentVariation.trim(),
          wordCount: currentVariation.split(/\s+/).length
        });
        variationIndex++;
      }
      currentVariation = '';
    } else if (trimmed) {
      currentVariation += line + '\n';
    }
  });
  
  // Add the last variation
  if (currentVariation && variationIndex < expectedCount) {
    variations.push({
      id: variationIndex + 1,
      text: currentVariation.trim(),
      wordCount: currentVariation.split(/\s+/).length
    });
  }
  
  // If no structured parsing worked, split by double newlines
  if (variations.length === 0) {
    const paragraphs = response.split('\n\n').filter(p => p.trim());
    paragraphs.forEach((paragraph, index) => {
      if (index < expectedCount) {
        variations.push({
          id: index + 1,
          text: paragraph.trim(),
          wordCount: paragraph.split(/\s+/).length
        });
      }
    });
  }
  
  return variations;
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paraphraser</title>
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
            max-width: 1100px;
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
            resize: vertical; font-family: inherit;
        }
        textarea:focus { outline: none; border-color: #667eea; }
        .options-row {
            display: flex; gap: 20px; margin-bottom: 20px;
        }
        .options-row .form-group { flex: 1; }
        .slider-group { margin-bottom: 15px; }
        .slider-label {
            display: flex; justify-content: space-between; margin-bottom: 8px;
            font-weight: 600;
        }
        input[type="range"] {
            width: 100%; height: 6px; border-radius: 3px; background: #e9ecef;
            outline: none; -webkit-appearance: none;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; appearance: none;
            width: 20px; height: 20px; border-radius: 50%;
            background: #667eea; cursor: pointer;
        }
        .creativity-labels {
            display: flex; justify-content: space-between; font-size: 0.8em; color: #6c757d;
            margin-top: 5px;
        }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .results {
            margin-top: 30px; display: none;
        }
        .variation-card {
            background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 12px;
            border-left: 4px solid #667eea; position: relative;
        }
        .variation-header {
            display: flex; justify-content: between; align-items: center;
            margin-bottom: 15px;
        }
        .variation-number {
            background: #667eea; color: white; padding: 5px 15px; border-radius: 15px;
            font-weight: 600; font-size: 0.9em;
        }
        .variation-stats {
            font-size: 0.8em; color: #6c757d;
        }
        .variation-text {
            background: white; padding: 15px; border-radius: 8px;
            line-height: 1.6; margin-bottom: 15px;
        }
        .variation-actions {
            display: flex; gap: 10px; flex-wrap: wrap;
        }
        .action-btn {
            background: #667eea; color: white; border: none; padding: 8px 16px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
        }
        .copy-btn { background: #28a745; }
        .download-btn { background: #17a2b8; }
        .similarity-btn { background: #6f42c1; }
        .loading {
            text-align: center; padding: 40px; color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Paraphraser</h1>
            <p>Generate creative variations of your text while preserving meaning</p>
        </div>
        <div class="content">
            <form id="paraphraseForm">
                <div class="form-group">
                    <label for="sourceText">Text to Paraphrase:</label>
                    <textarea id="sourceText" placeholder="Enter the text you want to paraphrase..." required></textarea>
                </div>
                <div class="options-row">
                    <div class="form-group">
                        <label for="variations">Number of Variations:</label>
                        <select id="variations">
                            <option value="2">2 Variations</option>
                            <option value="3" selected>3 Variations</option>
                            <option value="4">4 Variations</option>
                            <option value="5">5 Variations</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <div class="slider-group">
                            <div class="slider-label">
                                <span>Creativity Level</span>
                                <span id="creativityValue">0.7</span>
                            </div>
                            <input type="range" id="creativity" min="0" max="1" step="0.1" value="0.7">
                            <div class="creativity-labels">
                                <span>Conservative</span>
                                <span>Balanced</span>
                                <span>Very Creative</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button type="submit">Generate Variations</button>
            </form>

            <div id="loading" class="loading" style="display: none;">
                <h3>🔄 Generating variations...</h3>
                <p>Creating unique paraphrases with AI</p>
            </div>

            <div id="results" class="results">
                <h3>✨ Paraphrase Variations</h3>
                <div id="variationsList"></div>
            </div>
        </div>
    </div>
    <script>
        const creativitySlider = document.getElementById('creativity');
        const creativityValue = document.getElementById('creativityValue');
        
        creativitySlider.addEventListener('input', function() {
            creativityValue.textContent = this.value;
        });

        document.getElementById('paraphraseForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceText = document.getElementById('sourceText').value;
            const variations = parseInt(document.getElementById('variations').value);
            const creativity = parseFloat(document.getElementById('creativity').value);

            try {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('results').style.display = 'none';

                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceText, variations, creativity })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayVariations(data.variations);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        });

        function displayVariations(variations) {
            const results = document.getElementById('results');
            const list = document.getElementById('variationsList');
            
            list.innerHTML = variations.map(variation => \`
                <div class="variation-card">
                    <div class="variation-header">
                        <span class="variation-number">Variation \${variation.id}</span>
                        <span class="variation-stats">\${variation.wordCount} words</span>
                    </div>
                    <div class="variation-text">\${variation.text}</div>
                    <div class="variation-actions">
                        <button class="action-btn copy-btn" onclick="copyVariation('\${variation.id}')">Copy</button>
                        <button class="action-btn download-btn" onclick="downloadVariation('\${variation.id}')">Save</button>
                        <button class="action-btn similarity-btn" onclick="checkSimilarity('\${variation.id}')">Check Original</button>
                    </div>
                </div>
            \`).join('');
            
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth' });
        }

        function copyVariation(variationId) {
            const variation = document.querySelector(\`.variation-card:nth-child(\${variationId}) .variation-text\`);
            navigator.clipboard.writeText(variation.textContent).then(() => {
                alert('Variation copied to clipboard!');
            });
        }

        function downloadVariation(variationId) {
            const variation = document.querySelector(\`.variation-card:nth-child(\${variationId}) .variation-text\`);
            const content = variation.textContent;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`paraphrase-variation-\${variationId}.txt\`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function checkSimilarity(variationId) {
            const variation = document.querySelector(\`.variation-card:nth-child(\${variationId}) .variation-text\`).textContent;
            const original = document.getElementById('sourceText').value;
            
            // Simple similarity calculation
            const similarity = calculateSimilarity(variation, original);
            alert(\`Similarity to original: \${similarity.toFixed(1)}%\\nLower percentage = more unique paraphrase\`);
        }

        function calculateSimilarity(text1, text2) {
            const words1 = text1.toLowerCase().split(/\s+/);
            const words2 = text2.toLowerCase().split(/\s+/);
            const common = words1.filter(word => words2.includes(word));
            return (common.length / Math.max(words1.length, words2.length)) * 100;
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }