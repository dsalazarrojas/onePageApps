addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { pageText, brand = '', maxKeywords = 10, descriptionLength = 160 } = await request.json();
    
    if (!pageText) {
      return new Response(JSON.stringify({ error: 'Missing pageText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Analyze the following page content and provide:
1. ${maxKeywords} most relevant SEO keywords (prioritize those with search volume potential)
2. A compelling meta description (${descriptionLength} characters max) that includes primary keywords
3. Content optimization suggestions

${brand ? `Brand context: ${brand}` : ''}

Provide results in structured JSON format with fields: keywords, metaDescription, optimizationTips.`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: pageText }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    const rawResponse = data.choices?.[0]?.message?.content || '';
    
    let seoData;
    try {
      seoData = JSON.parse(rawResponse);
    } catch {
      seoData = parseSEOResponse(rawResponse, maxKeywords, descriptionLength);
    }
    
    return new Response(JSON.stringify({ 
      ...seoData,
      config: { brand, maxKeywords, descriptionLength },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseSEOResponse(response, maxKeywords, descriptionLength) {
  const lines = response.split('\n').filter(line => line.trim());
  const keywords = [];
  let metaDescription = '';
  const optimizationTips = [];

  let currentSection = '';
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes('keyword') || trimmed.toLowerCase().includes('seo')) {
      currentSection = 'keywords';
    } else if (trimmed.toLowerCase().includes('meta') || trimmed.toLowerCase().includes('description')) {
      currentSection = 'meta';
    } else if (trimmed.toLowerCase().includes('tip') || trimmed.toLowerCase().includes('suggestion')) {
      currentSection = 'tips';
    } else if (trimmed && currentSection === 'keywords' && keywords.length < maxKeywords) {
      // Extract keywords (remove numbering, bullets)
      const keyword = trimmed.replace(/^\d+\.\s*|^-\s*|^\*\s*/, '').trim();
      if (keyword && keyword.length > 2) keywords.push(keyword);
    } else if (trimmed && currentSection === 'meta' && !metaDescription) {
      metaDescription = trimmed;
    } else if (trimmed && currentSection === 'tips') {
      optimizationTips.push(trimmed);
    }
  });

  // Fallback if no structured parsing
  if (keywords.length === 0) {
    const words = response.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = {};
    words.forEach(word => {
      if (!['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were', 'what'].includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
    
    keywords.push(...sortedWords);
    metaDescription = response.substring(0, descriptionLength) + '...';
  }

  if (optimizationTips.length === 0) {
    optimizationTips.push('Use primary keywords in title and first paragraph', 'Include relevant keywords in headings (H1, H2, H3)', 'Optimize images with alt text containing target keywords');
  }

  return {
    keywords: keywords.slice(0, maxKeywords),
    metaDescription: metaDescription.substring(0, descriptionLength),
    optimizationTips
  };
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Keywords & Meta Description Generator</title>
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
        textarea, input {
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;
            font-size: 16px; transition: border-color 0.3s ease;
        }
        textarea:focus, input:focus { outline: none; border-color: #667eea; }
        textarea { min-height: 200px; resize: vertical; }
        .row { display: flex; gap: 20px; }
        .row .form-group { flex: 1; }
        .counter {
            font-size: 0.9em; color: #6c757d; text-align: right; margin-top: 5px;
        }
        .counter.warning { color: #ffc107; }
        .counter.danger { color: #dc3545; }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .results { margin-top: 30px; display: none; }
        .results-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .section {
            background: #f8f9fa; padding: 20px; border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        .section h3 {
            color: #667eea; margin-bottom: 15px; font-size: 1.2em;
        }
        .keywords-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px; margin-top: 15px;
        }
        .keyword-tag {
            background: white; padding: 8px 12px; border-radius: 20px;
            border: 2px solid #e9ecef; cursor: pointer;
            transition: all 0.3s ease; text-align: center;
        }
        .keyword-tag:hover {
            background: #667eea; color: white; border-color: #667eea;
        }
        .keyword-tag.selected {
            background: #28a745; color: white; border-color: #28a745;
        }
        .meta-description {
            background: white; padding: 15px; border-radius: 8px;
            border: 2px solid #e9ecef; font-size: 1.1em; line-height: 1.6;
            margin-top: 15px;
        }
        .tips-list {
            list-style: none; margin-top: 15px;
        }
        .tips-list li {
            background: white; padding: 12px; margin: 8px 0; border-radius: 6px;
            border-left: 3px solid #28a745;
        }
        .stats-bar {
            display: flex; gap: 15px; margin-top: 15px; font-size: 0.9em;
            color: #6c757d;
        }
        .stat-item { background: white; padding: 8px 12px; border-radius: 6px; }
        @media (max-width: 768px) {
            .results-grid { grid-template-columns: 1fr; }
            .row { flex-direction: column; }
            .keywords-grid { grid-template-columns: 1fr 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 SEO Keywords & Meta Description Generator</h1>
            <p>Optimize your content for search engines with AI-powered keyword research</p>
        </div>
        <div class="content">
            <form id="seoForm">
                <div class="form-group">
                    <label for="pageText">Page Content:</label>
                    <textarea id="pageText" placeholder="Paste your page content, blog post, or article here..." required></textarea>
                </div>
                <div class="row">
                    <div class="form-group">
                        <label for="brand">Brand Name (optional):</label>
                        <input type="text" id="brand" placeholder="Your brand or company name">
                    </div>
                    <div class="form-group">
                        <label for="maxKeywords">Number of Keywords:</label>
                        <select id="maxKeywords">
                            <option value="5">5 Keywords</option>
                            <option value="10" selected>10 Keywords</option>
                            <option value="15">15 Keywords</option>
                            <option value="20">20 Keywords</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="descriptionLength">Meta Description Length:</label>
                        <select id="descriptionLength">
                            <option value="120">120 characters</option>
                            <option value="155" selected>155 characters</option>
                            <option value="160">160 characters</option>
                            <option value="200">200 characters</option>
                        </select>
                    </div>
                </div>
                <button type="submit">Generate SEO Analysis</button>
            </form>

            <div id="results" class="results">
                <h3>📈 SEO Optimization Results</h3>
                <div class="results-grid">
                    <div class="section">
                        <h3>🔍 SEO Keywords</h3>
                        <div id="keywordsContainer" class="keywords-grid"></div>
                        <div class="stats-bar">
                            <div class="stat-item">Selected: <span id="selectedCount">0</span></div>
                            <div class="stat-item">Total Found: <span id="totalKeywords">0</span></div>
                        </div>
                    </div>
                    <div class="section">
                        <h3>📝 Meta Description</h3>
                        <div id="metaDescriptionContainer" class="meta-description"></div>
                        <div id="metaCounter" class="counter">0 / 155 characters</div>
                        <button onclick="copyMetaDescription()" style="margin-top: 15px; width: auto; padding: 10px 20px;">Copy Meta Description</button>
                    </div>
                </div>
                <div class="section" style="margin-top: 20px;">
                    <h3>💡 SEO Optimization Tips</h3>
                    <ul id="optimizationTips" class="tips-list"></ul>
                    <button onclick="downloadSEOReport()" style="margin-top: 15px; width: auto; padding: 10px 20px; background: #17a2b8;">Download SEO Report</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        let selectedKeywords = new Set();

        document.getElementById('descriptionLength').addEventListener('change', updateMetaCounter);
        document.getElementById('pageText').addEventListener('input', updateMetaCounter);

        document.getElementById('seoForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const pageText = document.getElementById('pageText').value;
            const brand = document.getElementById('brand').value;
            const maxKeywords = parseInt(document.getElementById('maxKeywords').value);
            const descriptionLength = parseInt(document.getElementById('descriptionLength').value);

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pageText, brand, maxKeywords, descriptionLength })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displaySEOData(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function displaySEOData(data) {
            const results = document.getElementById('results');
            
            // Display keywords
            const keywordsContainer = document.getElementById('keywordsContainer');
            selectedKeywords.clear();
            keywordsContainer.innerHTML = data.keywords.map(keyword => 
                \`<div class="keyword-tag" onclick="toggleKeyword('\${keyword}', this)">\${keyword}</div>\`
            ).join('');
            
            document.getElementById('totalKeywords').textContent = data.keywords.length;
            updateSelectedCount();
            
            // Display meta description
            const metaContainer = document.getElementById('metaDescriptionContainer');
            metaContainer.textContent = data.metaDescription;
            updateMetaCounter();
            
            // Display optimization tips
            const tipsContainer = document.getElementById('optimizationTips');
            tipsContainer.innerHTML = data.optimizationTips.map(tip => \`<li>\${tip}</li>\`).join('');
            
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth' });
        }

        function toggleKeyword(keyword, element) {
            if (selectedKeywords.has(keyword)) {
                selectedKeywords.delete(keyword);
                element.classList.remove('selected');
            } else {
                selectedKeywords.add(keyword);
                element.classList.add('selected');
            }
            updateSelectedCount();
        }

        function updateSelectedCount() {
            document.getElementById('selectedCount').textContent = selectedKeywords.size;
        }

        function updateMetaCounter() {
            const metaText = document.getElementById('metaDescriptionContainer').textContent;
            const maxLength = parseInt(document.getElementById('descriptionLength').value);
            const counter = document.getElementById('metaCounter');
            
            counter.textContent = \`\${metaText.length} / \${maxLength} characters\`;
            counter.className = 'counter';
            
            if (metaText.length > maxLength) {
                counter.classList.add('danger');
            } else if (metaText.length > maxLength * 0.9) {
                counter.classList.add('warning');
            }
        }

        function copyMetaDescription() {
            const metaText = document.getElementById('metaDescriptionContainer').textContent;
            navigator.clipboard.writeText(metaText).then(() => {
                alert('Meta description copied to clipboard!');
            });
        }

        function downloadSEOReport() {
            const keywords = Array.from(document.querySelectorAll('.keyword-tag.selected')).map(el => el.textContent);
            const metaDescription = document.getElementById('metaDescriptionContainer').textContent;
            const tips = Array.from(document.querySelectorAll('#optimizationTips li')).map(li => li.textContent);
            
            const content = \`SEO OPTIMIZATION REPORT
Generated: \${new Date().toLocaleString()}

SELECTED KEYWORDS:
\${keywords.map((keyword, index) => \`\${index + 1}. \${keyword}\`).join('\\n')}

META DESCRIPTION:
\${metaDescription}

OPTIMIZATION TIPS:
\${tips.map((tip, index) => \`\${index + 1}. \${tip}\`).join('\\n')}

IMPLEMENTATION CHECKLIST:
□ Add primary keywords to title tag
□ Include keywords in H1, H2 headings  
□ Use keywords naturally in content
□ Optimize images with alt text
□ Create internal links with keyword anchor text
□ Build quality backlinks to target keywords\`;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'seo-optimization-report.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }