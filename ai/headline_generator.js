addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { brief, keywords = '', count = 5 } = await request.json();
    
    if (!brief) {
      return new Response(JSON.stringify({ error: 'Missing brief' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Create ${count} compelling headlines/titles from the following brief. Each headline should be:
- Attention-grabbing and engaging
- Appropriate for the target audience
- Clear and descriptive
- Varied in style (numbered lists, questions, how-to, etc.)
- Optimized for engagement

${keywords ? `Include these keywords where relevant: ${keywords}` : ''}

Provide a brief explanation of what makes each headline effective.`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: brief }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    const headlines = data.choices?.[0]?.message?.content || '';
    
    const parsed = parseHeadlines(headlines, count);
    
    return new Response(JSON.stringify({ 
      headlines: parsed,
      config: { keywords, count },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseHeadlines(response, expectedCount) {
  const lines = response.split('\n').filter(line => line.trim());
  const headlines = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Match numbered or bulleted headlines
    const match = trimmed.match(/^(\d+\.|\-|•)\s*(.+)/);
    if (match) {
      headlines.push({
        title: match[2].trim(),
        style: determineHeadlineStyle(match[2]),
        characterCount: match[2].length
      });
    } else if (trimmed && !trimmed.startsWith('#') && !trimmed.toLowerCase().includes('explanation') && headlines.length < expectedCount) {
      headlines.push({
        title: trimmed,
        style: determineHeadlineStyle(trimmed),
        characterCount: trimmed.length
      });
    }
  });
  
  return headlines;
}

function determineHeadlineStyle(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('how') || lowerTitle.includes('step')) return 'how-to';
  if (lowerTitle.includes('?')) return 'question';
  if (/^\d+/.test(title)) return 'numbered';
  if (lowerTitle.includes('top') || lowerTitle.includes('best')) return 'list';
  if (lowerTitle.includes('why') || lowerTitle.includes('what') || lowerTitle.includes('when')) return 'question';
  if (lowerTitle.includes('secret') || lowerTitle.includes('hack')) return 'clickbait';
  return 'descriptive';
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Headline & Title Generator</title>
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
            max-width: 1000px;
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
        textarea, input {
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;
            font-size: 16px; transition: border-color 0.3s ease;
        }
        textarea:focus, input:focus { outline: none; border-color: #667eea; }
        textarea { min-height: 150px; resize: vertical; }
        .row { display: flex; gap: 15px; }
        .row .form-group { flex: 1; }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .results { margin-top: 30px; display: none; }
        .headline-card {
            background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 12px;
            border-left: 4px solid #667eea; cursor: pointer;
            transition: all 0.3s ease;
        }
        .headline-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .headline-header {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;
        }
        .headline-number {
            background: #667eea; color: white; padding: 5px 12px; border-radius: 15px;
            font-weight: 600; font-size: 0.9em;
        }
        .headline-style {
            background: #e9ecef; padding: 4px 10px; border-radius: 12px;
            font-size: 0.8em; color: #495057; text-transform: capitalize;
        }
        .headline-text {
            font-size: 1.3em; font-weight: 600; margin-bottom: 10px; color: #333;
        }
        .headline-metrics {
            display: flex; gap: 15px; font-size: 0.9em; color: #6c757d;
        }
        .style-how-to { border-left-color: #28a745; }
        .style-question { border-left-color: #ffc107; }
        .style-numbered { border-left-color: #007bff; }
        .style-list { border-left-color: #17a2b8; }
        .style-clickbait { border-left-color: #e83e8c; }
        .style-descriptive { border-left-color: #6c757d; }
        .selected {
            background: #e3f2fd; border-color: #2196f3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 Headline & Title Generator</h1>
            <p>Create compelling headlines that grab attention and drive engagement</p>
        </div>
        <div class="content">
            <form id="generateForm">
                <div class="form-group">
                    <label for="brief">Content Brief:</label>
                    <textarea id="brief" placeholder="Describe your content topic, target audience, and key message..." required></textarea>
                </div>
                <div class="row">
                    <div class="form-group">
                        <label for="keywords">Keywords (optional):</label>
                        <input type="text" id="keywords" placeholder="Enter relevant keywords separated by commas">
                    </div>
                    <div class="form-group">
                        <label for="count">Number of Headlines:</label>
                        <select id="count">
                            <option value="3">3 Headlines</option>
                            <option value="5" selected>5 Headlines</option>
                            <option value="7">7 Headlines</option>
                            <option value="10">10 Headlines</option>
                        </select>
                    </div>
                </div>
                <button type="submit">Generate Headlines</button>
            </form>

            <div id="results" class="results">
                <h3>✨ Generated Headlines</h3>
                <p style="margin-bottom: 20px; color: #6c757d;">Click on any headline to select it</p>
                <div id="headlinesList"></div>
            </div>
        </div>
    </div>
    <script>
        let selectedHeadline = null;

        document.getElementById('generateForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const brief = document.getElementById('brief').value;
            const keywords = document.getElementById('keywords').value;
            const count = parseInt(document.getElementById('count').value);

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ brief, keywords, count })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayHeadlines(data.headlines);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function displayHeadlines(headlines) {
            const results = document.getElementById('results');
            const list = document.getElementById('headlinesList');
            
            list.innerHTML = headlines.map(headline => \`
                <div class="headline-card style-\${headline.style}" onclick="selectHeadline(this, '\${headline.title}')">
                    <div class="headline-header">
                        <span class="headline-number">Headline \${headlines.indexOf(headline) + 1}</span>
                        <span class="headline-style">\${headline.style.replace('-', ' ')}</span>
                    </div>
                    <div class="headline-text">\${headline.title}</div>
                    <div class="headline-metrics">
                        <span>📏 \${headline.characterCount} characters</span>
                        <span>🎯 \${estimateImpact(headline.title)}% engagement</span>
                    </div>
                </div>
            \`).join('');
            
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth' });
        }

        function selectHeadline(element, title) {
            // Remove previous selection
            document.querySelectorAll('.headline-card').forEach(card => card.classList.remove('selected'));
            
            // Add selection to clicked element
            element.classList.add('selected');
            selectedHeadline = title;
            
            // Show copy options
            if (!document.getElementById('copyOptions')) {
                const copyOptions = document.createElement('div');
                copyOptions.id = 'copyOptions';
                copyOptions.innerHTML = \`
                    <div style="margin-top: 20px; padding: 20px; background: #e8f5e8; border-radius: 10px; text-align: center;">
                        <h4 style="color: #2e7d32; margin-bottom: 15px;">✅ Headline Selected!</h4>
                        <button onclick="copySelectedHeadline()" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 10px;">Copy to Clipboard</button>
                        <button onclick="downloadHeadlines()" style="background: #17a2b8; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">Download All</button>
                    </div>
                \`;
                document.getElementById('results').appendChild(copyOptions);
            }
        }

        function copySelectedHeadline() {
            if (selectedHeadline) {
                navigator.clipboard.writeText(selectedHeadline).then(() => {
                    alert('Headline copied to clipboard!');
                });
            }
        }

        function downloadHeadlines() {
            const headlines = Array.from(document.querySelectorAll('.headline-text')).map(el => el.textContent);
            const content = 'Generated Headlines:\\n\\n' + headlines.map((headline, index) => \`\${index + 1}. \${headline}\`).join('\\n');
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'generated-headlines.txt';
            a.click();
            URL.revokeObjectURL(url);
        }

        function estimateImpact(title) {
            let score = 50; // Base score
            
            // Title length optimization
            if (title.length >= 30 && title.length <= 60) score += 15;
            else if (title.length >= 20 && title.length <= 80) score += 10;
            
            // Power words
            const powerWords = ['how', 'why', 'what', 'top', 'best', 'secret', 'free', 'ultimate', 'guide', 'tips'];
            const wordCount = title.toLowerCase().split(' ').filter(word => powerWords.includes(word)).length;
            score += wordCount * 5;
            
            // Question format
            if (title.includes('?')) score += 10;
            
            // Numbers
            if (/^\d+/.test(title)) score += 8;
            
            return Math.min(score, 95);
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }