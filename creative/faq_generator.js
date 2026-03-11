addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { sourceText, count = 5, format = 'Q&A' } = await request.json();
    
    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'Missing sourceText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Generate ${count} relevant frequently asked questions (FAQs) based on the following content. Each FAQ should:
- Address common concerns users might have
- Be phrased as questions customers/visitors would actually ask
- Have concise, helpful answers
- Cover different aspects of the topic

${format === 'Q&A' ? 'Format each as: Q: [question]\nA: [answer]' : 'Format as bullet points with questions only'}

Provide practical, actionable information that helps users understand the topic better.`;

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
    const faqContent = data.choices?.[0]?.message?.content || '';
    
    const parsed = parseFAQContent(faqContent, format);
    
    return new Response(JSON.stringify({ 
      faqs: parsed,
      config: { count, format },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseFAQContent(content, format) {
  const lines = content.split('\n').filter(line => line.trim());
  const faqs = [];
  
  if (format === 'Q&A') {
    let currentQuestion = '';
    let currentAnswer = '';
    let inAnswer = false;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.toUpperCase().startsWith('Q:')) {
        if (currentQuestion && currentAnswer) {
          faqs.push({ question: currentQuestion, answer: currentAnswer });
        }
        currentQuestion = trimmed.substring(2).trim();
        currentAnswer = '';
        inAnswer = false;
      } else if (trimmed.toUpperCase().startsWith('A:')) {
        currentAnswer = trimmed.substring(2).trim();
        inAnswer = true;
      } else if (trimmed && inAnswer) {
        currentAnswer += ' ' + trimmed;
      }
    });
    
    // Add the last FAQ
    if (currentQuestion && currentAnswer) {
      faqs.push({ question: currentQuestion, answer: currentAnswer });
    }
  } else {
    // Bullets format - just questions
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
        const question = trimmed.replace(/^-\s*|^\d+\.\s*|^\*\s*/, '');
        if (question.includes('?')) {
          faqs.push({ question, answer: 'Detailed answer would be provided based on your content.' });
        }
      }
    });
  }
  
  return faqs;
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FAQ Generator</title>
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
        textarea, select {
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px;
            font-size: 16px; transition: border-color 0.3s ease; min-height: 200px;
            resize: vertical;
        }
        textarea:focus, select:focus { outline: none; border-color: #667eea; }
        .row { display: flex; gap: 20px; }
        .row .form-group { flex: 1; }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .results { margin-top: 30px; display: none; }
        .faq-item {
            background: #f8f9fa; margin: 20px 0; border-radius: 12px;
            overflow: hidden; border: 2px solid #e9ecef;
        }
        .faq-question {
            background: #667eea; color: white; padding: 20px; cursor: pointer;
            font-weight: 600; font-size: 1.1em; display: flex;
            justify-content: space-between; align-items: center;
        }
        .faq-question:hover { background: #5a6fd8; }
        .faq-answer {
            padding: 20px; line-height: 1.6; background: white;
            border-top: 1px solid #e9ecef;
        }
        .toggle-icon {
            transition: transform 0.3s ease;
            font-size: 1.2em;
        }
        .toggle-icon.rotated { transform: rotate(180deg); }
        .faq-header {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
        }
        .faq-count {
            background: #28a745; color: white; padding: 8px 15px; border-radius: 20px;
            font-size: 0.9em;
        }
        .export-options {
            display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;
        }
        .export-btn {
            background: #17a2b8; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
        }
        .copy-btn { background: #28a745; }
        .html-btn { background: #6f42c1; }
        .json-btn { background: #fd7e14; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❓ FAQ Generator</h1>
            <p>Generate comprehensive FAQ sections from your content automatically</p>
        </div>
        <div class="content">
            <form id="faqForm">
                <div class="form-group">
                    <label for="sourceText">Content to Generate FAQs From:</label>
                    <textarea id="sourceText" placeholder="Paste your product description, service details, or any content you want to create FAQs for..." required></textarea>
                </div>
                <div class="row">
                    <div class="form-group">
                        <label for="count">Number of FAQs:</label>
                        <select id="count">
                            <option value="3">3 FAQs</option>
                            <option value="5" selected>5 FAQs</option>
                            <option value="7">7 FAQs</option>
                            <option value="10">10 FAQs</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="format">Output Format:</label>
                        <select id="format">
                            <option value="Q&A" selected>Question & Answer</option>
                            <option value="bullets">Questions Only</option>
                        </select>
                    </div>
                </div>
                <button type="submit">Generate FAQs</button>
            </form>

            <div id="results" class="results">
                <div class="faq-header">
                    <h3>✨ Generated FAQs</h3>
                    <span id="faqCount" class="faq-count">0 FAQs</span>
                </div>
                <div id="faqList"></div>
                <div class="export-options">
                    <button class="export-btn copy-btn" onclick="copyAllFAQs()">Copy All</button>
                    <button class="export-btn html-btn" onclick="exportAsHTML()">Export HTML</button>
                    <button class="export-btn json-btn" onclick="exportAsJSON()">Export JSON</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('faqForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceText = document.getElementById('sourceText').value;
            const count = parseInt(document.getElementById('count').value);
            const format = document.getElementById('format').value;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceText, count, format })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayFAQs(data.faqs);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function displayFAQs(faqs) {
            const results = document.getElementById('results');
            const list = document.getElementById('faqList');
            const countDisplay = document.getElementById('faqCount');
            
            list.innerHTML = faqs.map((faq, index) => \`
                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFAQ(\${index})">
                        <span>\${faq.question}</span>
                        <span class="toggle-icon" id="icon-\${index}">▼</span>
                    </div>
                    <div class="faq-answer" id="answer-\${index}" style="display: none;">
                        \${faq.answer}
                    </div>
                </div>
            \`).join('');
            
            countDisplay.textContent = \`\${faqs.length} FAQs\`;
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth' });
        }

        function toggleFAQ(index) {
            const answer = document.getElementById('answer-' + index);
            const icon = document.getElementById('icon-' + index);
            
            if (answer.style.display === 'none') {
                answer.style.display = 'block';
                icon.classList.add('rotated');
            } else {
                answer.style.display = 'none';
                icon.classList.remove('rotated');
            }
        }

        function copyAllFAQs() {
            const faqs = Array.from(document.querySelectorAll('.faq-question')).map((question, index) => {
                const questionText = question.querySelector('span').textContent;
                const answerText = document.getElementById('answer-' + index).textContent;
                return \`Q: \${questionText}\\nA: \${answerText}\\n\`;
            }).join('');
            
            navigator.clipboard.writeText(faqs).then(() => {
                alert('All FAQs copied to clipboard!');
            });
        }

        function exportAsHTML() {
            const faqs = Array.from(document.querySelectorAll('.faq-question')).map((question, index) => {
                const questionText = question.querySelector('span').textContent;
                const answerText = document.getElementById('answer-' + index).textContent;
                return \`
                    <div class="faq-item">
                        <div class="faq-question">\${questionText}</div>
                        <div class="faq-answer">\${answerText}</div>
                    </div>
                \`;
            }).join('');
            
            const html = \`
<!DOCTYPE html>
<html>
<head>
    <title>FAQ</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .faq-item { margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; }
        .faq-question { background: #667eea; color: white; padding: 15px; font-weight: bold; }
        .faq-answer { padding: 15px; background: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Frequently Asked Questions</h1>
    \${faqs}
</body>
</html>\`;
            
            downloadFile(html, 'faq-export.html', 'text/html');
        }

        function exportAsJSON() {
            const faqs = Array.from(document.querySelectorAll('.faq-question')).map((question, index) => {
                return {
                    question: question.querySelector('span').textContent,
                    answer: document.getElementById('answer-' + index).textContent
                };
            });
            
            downloadFile(JSON.stringify(faqs, null, 2), 'faq-export.json', 'application/json');
        }

        function downloadFile(content, filename, type) {
            const blob = new Blob([content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
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