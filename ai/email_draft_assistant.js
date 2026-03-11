addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { recipient, goal, tone = 'professional', constraints = '' } = await request.json();
    
    if (!recipient || !goal) {
      return new Response(JSON.stringify({ error: 'Missing recipient or goal' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Draft a professional email with the following specifications:
- Recipient: ${recipient}
- Goal/Purpose: ${goal}
- Tone: ${tone}
${constraints ? `- Additional constraints: ${constraints}` : ''}

Make the email:
- Clear and concise
- Professional but not overly formal
- Action-oriented if needed
- Include appropriate greeting and closing`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: 'Please draft this email now.' }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    const emailDraft = data.choices?.[0]?.message?.content || '';
    
    return new Response(JSON.stringify({ 
      emailDraft,
      subject: generateSubject(goal, tone),
      config: { recipient, goal, tone, constraints },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function generateSubject(goal, tone) {
  // Simple subject line generation
  const subjectTemplates = {
    professional: [
      'Re: Your inquiry',
      'Follow-up',
      'Quick question',
      'Regarding our discussion'
    ],
    casual: [
      'Quick follow-up',
      'Hey there!',
      'Just checking in',
      'Question for you'
    ],
    formal: [
      'Regarding Your Inquiry',
      'Follow-up Request',
      'Official Correspondence',
      'Business Matter'
    ]
  };

  const templates = subjectTemplates[tone] || subjectTemplates.professional;
  return templates[Math.floor(Math.random() * templates.length)];
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Draft Assistant</title>
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
        textarea { min-height: 100px; resize: vertical; }
        .row { display: flex; gap: 20px; }
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
        .email-preview {
            background: white; padding: 20px; border-radius: 10px;
            border: 2px solid #e9ecef; font-family: 'Courier New', monospace;
            white-space: pre-wrap; line-height: 1.6;
        }
        .email-header {
            background: #667eea; color: white; padding: 15px 20px;
            margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0;
        }
        .action-buttons {
            display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;
        }
        .action-btn {
            background: #28a745; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
        }
        .copy-btn { background: #17a2b8; }
        .email-btn { background: #6f42c1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Email Draft Assistant</h1>
            <p>Generate professional emails from brief prompts and context</p>
        </div>
        <div class="content">
            <form id="draftForm">
                <div class="form-group">
                    <label for="recipient">Recipient:</label>
                    <input type="text" id="recipient" placeholder="colleague@company.com" required>
                </div>
                <div class="form-group">
                    <label for="goal">Email Purpose/Goal:</label>
                    <textarea id="goal" placeholder="What do you want to achieve with this email? (e.g., request a meeting, follow up on a project, introduce yourself)" required></textarea>
                </div>
                <div class="row">
                    <div class="form-group">
                        <label for="tone">Tone:</label>
                        <select id="tone">
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="formal">Formal</option>
                            <option value="friendly">Friendly</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="constraints">Additional Constraints (optional):</label>
                        <textarea id="constraints" placeholder="Any specific requirements, deadlines, or context..."></textarea>
                    </div>
                </div>
                <button type="submit">Draft Email</button>
            </form>

            <div id="result" class="result">
                <h3>📧 Your Email Draft</h3>
                <div class="email-preview">
                    <div class="email-header">
                        <strong>To:</strong> <span id="previewRecipient"></span><br>
                        <strong>Subject:</strong> <span id="previewSubject"></span>
                    </div>
                    <div id="previewContent"></div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn copy-btn" onclick="copyEmail()">Copy Email</button>
                    <button class="action-btn email-btn" onclick="openEmailClient()">Open in Email Client</button>
                </div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('draftForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const recipient = document.getElementById('recipient').value;
            const goal = document.getElementById('goal').value;
            const tone = document.getElementById('tone').value;
            const constraints = document.getElementById('constraints').value;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipient, goal, tone, constraints })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayDraft(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function displayDraft(data) {
            const result = document.getElementById('result');
            
            document.getElementById('previewRecipient').textContent = data.config.recipient;
            document.getElementById('previewSubject').textContent = data.subject;
            document.getElementById('previewContent').textContent = data.emailDraft;
            
            result.style.display = 'block';
            result.scrollIntoView({ behavior: 'smooth' });
        }

        function copyEmail() {
            const recipient = document.getElementById('previewRecipient').textContent;
            const subject = document.getElementById('previewSubject').textContent;
            const content = document.getElementById('previewContent').textContent;
            
            const fullEmail = \`To: \${recipient}\nSubject: \${subject}\n\n\${content}\`;
            
            navigator.clipboard.writeText(fullEmail).then(() => {
                alert('Email copied to clipboard!');
            });
        }

        function openEmailClient() {
            const recipient = document.getElementById('previewRecipient').textContent;
            const subject = document.getElementById('previewSubject').textContent;
            const content = document.getElementById('previewContent').textContent;
            
            const mailtoLink = \`mailto:\${recipient}?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(content)}\`;
            window.open(mailtoLink);
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }