addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { sourceText, preserveStyle = false, readingLevel = 'general' } = await request.json();
    
    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'Missing sourceText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const styleInstruction = preserveStyle ? ' Preserve the original tone, voice, and style as much as possible.' : '';
    const levelInstruction = readingLevel !== 'general' ? ` Adjust the reading level to be appropriate for ${readingLevel} readers.` : '';
    
    const sysPrompt = `Improve the grammar, clarity, and readability of the following text. Make necessary corrections while maintaining the original meaning.${styleInstruction}${levelInstruction} Provide:
1. The improved version of the text
2. A summary of changes made
3. Suggestions for further improvement (if any)`;

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
    const improvedText = data.choices?.[0]?.message?.content || '';
    
    // Parse the response to extract improved text and changes
    const parsed = parseRewriteResponse(improvedText);
    
    return new Response(JSON.stringify({ 
      improvedText: parsed.improvedText,
      changesSummary: parsed.changesSummary,
      suggestions: parsed.suggestions,
      config: { preserveStyle, readingLevel },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseRewriteResponse(response) {
  // Simple parsing to extract improved text and changes
  const lines = response.split('\n');
  let improvedText = '';
  let changesSummary = '';
  let suggestions = '';

  let currentSection = 'improved';
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('summary of changes') || trimmed.toLowerCase().includes('changes made')) {
      currentSection = 'changes';
    } else if (trimmed.toLowerCase().includes('suggestions') || trimmed.toLowerCase().includes('further improvement')) {
      currentSection = 'suggestions';
    } else if (trimmed && !trimmed.startsWith('#')) {
      if (currentSection === 'improved') {
        improvedText += line + '\n';
      } else if (currentSection === 'changes') {
        changesSummary += line + '\n';
      } else {
        suggestions += line + '\n';
      }
    }
  });

  return {
    improvedText: improvedText.trim() || response,
    changesSummary: changesSummary.trim() || 'Text improved for grammar and clarity.',
    suggestions: suggestions.trim() || 'No additional suggestions.'
  };
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grammar & Clarity Rewriter</title>
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
        .form-section { margin-bottom: 30px; }
        .form-section h3 {
            color: #667eea; margin-bottom: 20px; font-size: 1.3em;
        }
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
        .toggle-group {
            display: flex; align-items: center; gap: 10px;
        }
        .toggle-group input[type="checkbox"] {
            width: 20px; height: 20px; accent-color: #667eea;
        }
        select {
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;
            font-size: 16px; transition: border-color 0.3s ease;
        }
        select:focus { outline: none; border-color: #667eea; }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .comparison-section {
            display: none; margin-top: 30px;
        }
        .comparison-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .text-panel {
            background: #f8f9fa; padding: 20px; border-radius: 12px;
            border: 2px solid #e9ecef;
        }
        .text-panel h4 {
            color: #667eea; margin-bottom: 15px; font-size: 1.2em;
        }
        .text-content {
            background: white; padding: 15px; border-radius: 8px;
            min-height: 200px; white-space: pre-wrap; line-height: 1.6;
            border: 1px solid #dee2e6;
        }
        .changes-section {
            margin-top: 20px; padding: 20px; background: #e3f2fd; border-radius: 10px;
            border-left: 4px solid #2196f3;
        }
        .suggestions-section {
            margin-top: 15px; padding: 20px; background: #fff3e0; border-radius: 10px;
            border-left: 4px solid #ff9800;
        }
        .word-count {
            display: flex; gap: 20px; margin-top: 15px; font-size: 0.9em; color: #6c757d;
        }
        .action-buttons {
            display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;
        }
        .action-btn {
            background: #667eea; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
        }
        .copy-btn { background: #28a745; }
        .download-btn { background: #17a2b8; }
        .swap-btn { background: #6f42c1; }
        @media (max-width: 768px) {
            .comparison-grid { grid-template-columns: 1fr; }
            .options-row { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✏️ Grammar & Clarity Rewriter</h1>
            <p>Improve grammar, clarity, and readability while preserving your voice</p>
        </div>
        <div class="content">
            <form id="rewriteForm">
                <div class="form-section">
                    <h3>Original Text</h3>
                    <div class="form-group">
                        <label for="sourceText">Text to Improve:</label>
                        <textarea id="sourceText" placeholder="Enter your text here for grammar and clarity improvement..." required></textarea>
                    </div>
                    <div class="word-count">
                        <div>Characters: <span id="charCount">0</span></div>
                        <div>Words: <span id="wordCount">0</span></div>
                        <div>Reading time: <span id="readingTime">0 min</span></div>
                    </div>
                </div>
                <div class="form-section">
                    <h3>Settings</h3>
                    <div class="options-row">
                        <div class="form-group">
                            <label>Style Preservation:</label>
                            <div class="toggle-group">
                                <input type="checkbox" id="preserveStyle">
                                <label for="preserveStyle">Preserve original tone and style</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="readingLevel">Reading Level:</label>
                            <select id="readingLevel">
                                <option value="general">General Audience</option>
                                <option value="elementary">Elementary (Grade 1-5)</option>
                                <option value="middle">Middle School (Grade 6-8)</option>
                                <option value="high">High School (Grade 9-12)</option>
                                <option value="college">College Level</option>
                                <option value="graduate">Graduate Level</option>
                            </select>
                        </div>
                    </div>
                </div>
                <button type="submit">Improve Text</button>
            </form>

            <div id="comparisonSection" class="comparison-section">
                <h3>📝 Text Improvement Results</h3>
                <div class="comparison-grid">
                    <div class="text-panel">
                        <h4>Original Text</h4>
                        <div id="originalTextDisplay" class="text-content"></div>
                    </div>
                    <div class="text-panel">
                        <h4>Improved Text</h4>
                        <div id="improvedTextDisplay" class="text-content"></div>
                        <div class="action-buttons">
                            <button class="action-btn copy-btn" onclick="copyImprovedText()">Copy Improved</button>
                            <button class="action-btn download-btn" onclick="downloadImprovedText()">Download</button>
                            <button class="action-btn swap-btn" onclick="swapTexts()">Swap Texts</button>
                        </div>
                    </div>
                </div>
                <div class="changes-section">
                    <h4>📊 Changes Made</h4>
                    <div id="changesSummary"></div>
                </div>
                <div class="suggestions-section">
                    <h4>💡 Suggestions for Further Improvement</h4>
                    <div id="suggestionsDisplay"></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('sourceText').addEventListener('input', updateWordCount);
        document.getElementById('rewriteForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceText = document.getElementById('sourceText').value;
            const preserveStyle = document.getElementById('preserveStyle').checked;
            const readingLevel = document.getElementById('readingLevel').value;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceText, preserveStyle, readingLevel })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayResults(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function updateWordCount() {
            const text = document.getElementById('sourceText').value;
            const chars = text.length;
            const words = text.split(/\s+/).filter(word => word.length > 0).length;
            const readingTime = Math.ceil(words / 200); // Average reading speed
            
            document.getElementById('charCount').textContent = chars;
            document.getElementById('wordCount').textContent = words;
            document.getElementById('readingTime').textContent = readingTime + ' min';
        }

        function displayResults(data) {
            // Show comparison section
            document.getElementById('comparisonSection').style.display = 'block';
            
            // Display texts
            document.getElementById('originalTextDisplay').textContent = document.getElementById('sourceText').value;
            document.getElementById('improvedTextDisplay').textContent = data.improvedText;
            
            // Display changes and suggestions
            document.getElementById('changesSummary').innerHTML = \`<p>\${data.changesSummary}</p>\`;
            document.getElementById('suggestionsDisplay').innerHTML = \`<p>\${data.suggestions}</p>\`;
            
            // Scroll to results
            document.getElementById('comparisonSection').scrollIntoView({ behavior: 'smooth' });
        }

        function copyImprovedText() {
            const improvedText = document.getElementById('improvedTextDisplay').textContent;
            navigator.clipboard.writeText(improvedText).then(() => {
                alert('Improved text copied to clipboard!');
            });
        }

        function downloadImprovedText() {
            const originalText = document.getElementById('originalTextDisplay').textContent;
            const improvedText = document.getElementById('improvedTextDisplay').textContent;
            const changes = document.getElementById('changesSummary').textContent;
            
            const content = \`ORIGINAL TEXT:\n\${originalText}\n\nIMPROVED TEXT:\n\${improvedText}\n\nCHANGES MADE:\n\${changes}\`;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'improved-text.txt';
            a.click();
            URL.revokeObjectURL(url);
        }

        function swapTexts() {
            const originalDisplay = document.getElementById('originalTextDisplay').textContent;
            const improvedDisplay = document.getElementById('improvedTextDisplay').textContent;
            
            document.getElementById('originalTextDisplay').textContent = improvedDisplay;
            document.getElementById('improvedTextDisplay').textContent = originalDisplay;
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }