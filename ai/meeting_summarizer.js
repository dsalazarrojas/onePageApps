addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { notes, maxWords = 200, includeActionItems = true } = await request.json();
    
    if (!notes) {
      return new Response(JSON.stringify({ error: 'Missing notes' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Summarize the following meeting notes into a concise summary (max ${maxWords} words). 
${includeActionItems ? 'Also identify and list all action items with responsible persons and deadlines.' : ''}

Structure your response as:
1. Meeting Summary (key points discussed)
2. ${includeActionItems ? 'Action Items (if any)' : 'Key Takeaways'}

Format clearly with bullet points and headings.`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: notes }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await aiResp.json();
    const summary = data.choices?.[0]?.message?.content || '';
    
    const parsed = parseMeetingSummary(summary, includeActionItems);
    
    return new Response(JSON.stringify({ 
      summary: parsed.summary,
      actionItems: parsed.actionItems,
      metadata: {
        wordCount: notes.split(/\s+/).length,
        summaryLength: parsed.summary.length,
        actionItemCount: parsed.actionItems.length
      },
      config: { maxWords, includeActionItems },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseMeetingSummary(content, includeActionItems) {
  const lines = content.split('\n').filter(line => line.trim());
  let summary = '';
  const actionItems = [];
  
  let currentSection = 'summary';
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes('action item') || trimmed.toLowerCase().includes('todo') || trimmed.toLowerCase().includes('follow-up')) {
      currentSection = 'action';
    } else if (trimmed.toLowerCase().includes('summary') || trimmed.toLowerCase().includes('key point')) {
      currentSection = 'summary';
    } else if (trimmed && currentSection === 'action' && includeActionItems) {
      // Parse action item
      const actionItem = parseActionItem(trimmed);
      if (actionItem) actionItems.push(actionItem);
    } else if (trimmed && currentSection === 'summary') {
      summary += line + '\n';
    }
  });
  
  return {
    summary: summary.trim(),
    actionItems: actionItems.length > 0 ? actionItems : parseSimpleActionItems(content)
  };
}

function parseActionItem(line) {
  // Look for patterns like "John - Review budget by Friday" or "TODO: Call client"
  const patterns = [
    /^(.+?)\s*[-:]\s*(.+)/, // "Name - Task"
    /TODO[:\s]*(.+)/, // "TODO: Task"
    /ACTION[:\s]*(.+)/, // "ACTION: Task"
    /(@\w+)\s+(.+)/, // "@name task"
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      if (pattern.source.includes('@')) {
        return { assignee: match[1], task: match[2], status: 'pending', priority: 'medium' };
      } else if (pattern.source.includes('TODO') || pattern.source.includes('ACTION')) {
        return { assignee: 'Unassigned', task: match[1], status: 'pending', priority: 'medium' };
      } else {
        return { assignee: match[1], task: match[2], status: 'pending', priority: 'medium' };
      }
    }
  }
  
  return null;
}

function parseSimpleActionItems(content) {
  // Fallback: look for lines that seem like tasks
  const lines = content.split('\n');
  const potentialTasks = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && (trimmed.toLowerCase().includes('need to') || 
                    trimmed.toLowerCase().includes('should') ||
                    trimmed.toLowerCase().includes('must') ||
                    trimmed.includes('?') && trimmed.length < 100)) {
      potentialTasks.push({
        assignee: 'TBD',
        task: trimmed,
        status: 'pending',
        priority: 'medium'
      });
    }
  });
  
  return potentialTasks.slice(0, 5); // Limit to 5 items
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Notes Summarizer</title>
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
            font-size: 16px; transition: border-color 0.3s ease; min-height: 250px;
            resize: vertical; font-family: inherit;
        }
        textarea:focus { outline: none; border-color: #667eea; }
        .options-row {
            display: flex; gap: 20px; align-items: center; margin-bottom: 20px;
        }
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
        .results { margin-top: 30px; display: none; }
        .results-grid {
            display: grid; grid-template-columns: 2fr 1fr; gap: 30px;
        }
        .section {
            background: #f8f9fa; padding: 25px; border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        .section h3 {
            color: #667eea; margin-bottom: 20px; font-size: 1.3em;
        }
        .summary-content {
            background: white; padding: 20px; border-radius: 8px;
            line-height: 1.7; white-space: pre-wrap;
        }
        .action-item {
            background: white; margin: 12px 0; padding: 15px; border-radius: 8px;
            border-left: 4px solid #28a745; position: relative;
        }
        .action-item-header {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        }
        .assignee {
            background: #667eea; color: white; padding: 4px 10px; border-radius: 12px;
            font-size: 0.8em; font-weight: 600;
        }
        .task-text {
            font-weight: 500; margin-bottom: 8px;
        }
        .task-meta {
            font-size: 0.8em; color: #6c757d;
        }
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px; margin-top: 20px;
        }
        .stat-card {
            background: white; padding: 15px; border-radius: 8px; text-align: center;
            border: 2px solid #e9ecef;
        }
        .stat-number {
            font-size: 2em; font-weight: bold; color: #667eea;
        }
        .stat-label {
            font-size: 0.9em; color: #6c757d; margin-top: 5px;
        }
        .export-options {
            display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;
        }
        .export-btn {
            background: #667eea; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
        }
        .copy-btn { background: #28a745; }
        .download-btn { background: #17a2b8; }
        .email-btn { background: #6f42c1; }
        @media (max-width: 768px) {
            .results-grid { grid-template-columns: 1fr; }
            .options-row { flex-direction: column; align-items: stretch; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Meeting Notes Summarizer</h1>
            <p>Transform meeting notes into clear summaries and actionable items</p>
        </div>
        <div class="content">
            <form id="summarizeForm">
                <div class="form-section">
                    <h3>Meeting Notes</h3>
                    <div class="form-group">
                        <label for="notes">Paste your meeting notes here:</label>
                        <textarea id="notes" placeholder="Paste your meeting notes, transcription, or discussion points here..." required></textarea>
                    </div>
                </div>
                <div class="form-section">
                    <h3>Summary Settings</h3>
                    <div class="options-row">
                        <div class="form-group" style="flex: 1;">
                            <label for="maxWords">Summary Length:</label>
                            <select id="maxWords">
                                <option value="150">Brief (150 words)</option>
                                <option value="200" selected>Standard (200 words)</option>
                                <option value="300">Detailed (300 words)</option>
                                <option value="500">Comprehensive (500 words)</option>
                            </select>
                        </div>
                        <div class="toggle-group" style="flex: 1;">
                            <input type="checkbox" id="includeActionItems" checked>
                            <label for="includeActionItems">Extract action items and todos</label>
                        </div>
                    </div>
                </div>
                <button type="submit">Summarize Meeting</button>
            </form>

            <div id="results" class="results">
                <h3>📊 Meeting Summary</h3>
                <div class="results-grid">
                    <div>
                        <div class="section">
                            <h3>📋 Meeting Summary</h3>
                            <div id="summaryContent" class="summary-content"></div>
                            <div class="export-options">
                                <button class="export-btn copy-btn" onclick="copySummary()">Copy Summary</button>
                                <button class="export-btn download-btn" onclick="downloadSummary()">Download</button>
                            </div>
                        </div>
                        <div id="actionItemsSection" class="section" style="margin-top: 20px; display: none;">
                            <h3>✅ Action Items</h3>
                            <div id="actionItemsList"></div>
                        </div>
                    </div>
                    <div>
                        <div class="section">
                            <h3>📈 Summary Stats</h3>
                            <div id="statsContent" class="stats-grid"></div>
                        </div>
                        <div class="section" style="margin-top: 20px;">
                            <h3>📧 Quick Actions</h3>
                            <div class="export-options">
                                <button class="export-btn email-btn" onclick="createEmailDraft()">Create Email Summary</button>
                                <button class="export-btn" onclick="scheduleFollowUp()">Schedule Follow-up</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('summarizeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const notes = document.getElementById('notes').value;
            const maxWords = parseInt(document.getElementById('maxWords').value);
            const includeActionItems = document.getElementById('includeActionItems').checked;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notes, maxWords, includeActionItems })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displaySummary(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function displaySummary(data) {
            const results = document.getElementById('results');
            
            // Display summary
            document.getElementById('summaryContent').textContent = data.summary;
            
            // Display action items if available
            if (data.actionItems && data.actionItems.length > 0) {
                const actionItemsSection = document.getElementById('actionItemsSection');
                const actionItemsList = document.getElementById('actionItemsList');
                
                actionItemsList.innerHTML = data.actionItems.map(item => \`
                    <div class="action-item">
                        <div class="action-item-header">
                            <span class="assignee">\${item.assignee}</span>
                            <span class="task-meta">\${item.priority} priority</span>
                        </div>
                        <div class="task-text">\${item.task}</div>
                        <div class="task-meta">Status: \${item.status}</div>
                    </div>
                \`).join('');
                
                actionItemsSection.style.display = 'block';
            }
            
            // Display stats
            const statsContent = document.getElementById('statsContent');
            statsContent.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-number">\${data.metadata.wordCount}</div>
                    <div class="stat-label">Original Words</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${data.metadata.summaryLength}</div>
                    <div class="stat-label">Summary Words</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${data.metadata.actionItemCount}</div>
                    <div class="stat-label">Action Items</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${Math.round((data.metadata.summaryLength / data.metadata.wordCount) * 100)}%</div>
                    <div class="stat-label">Compression</div>
                </div>
            \`;
            
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth' });
        }

        function copySummary() {
            const summary = document.getElementById('summaryContent').textContent;
            navigator.clipboard.writeText(summary).then(() => {
                alert('Summary copied to clipboard!');
            });
        }

        function downloadSummary() {
            const notes = document.getElementById('notes').value;
            const summary = document.getElementById('summaryContent').textContent;
            const actionItems = Array.from(document.querySelectorAll('.action-item .task-text')).map(el => el.textContent);
            
            const content = \`MEETING SUMMARY
Generated: \${new Date().toLocaleString()}

ORIGINAL NOTES:
\${notes}

SUMMARY:
\${summary}

\${actionItems.length > 0 ? \`ACTION ITEMS:
\${actionItems.map((item, index) => \`\${index + 1}. \${item}\`).join('\\n')}\` : ''}\`;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'meeting-summary.txt';
            a.click();
            URL.revokeObjectURL(url);
        }

        function createEmailDraft() {
            const summary = document.getElementById('summaryContent').textContent;
            const actionItems = Array.from(document.querySelectorAll('.action-item')).map(item => {
                const assignee = item.querySelector('.assignee').textContent;
                const task = item.querySelector('.task-text').textContent;
                return \`• \${assignee}: \${task}\`;
            }).join('\\n');
            
            const subject = \`Meeting Summary - \${new Date().toLocaleDateString()}\`;
            const body = \`Hello team,\\n\\nHere's a summary of today's meeting:\\n\\n\${summary}\\n\\n\${actionItems.length > 0 ? \`Action Items:\\n\${actionItems}\\n\\n\` : ''}Please let me know if you have any questions.\\n\\nBest regards\`;
            
            const mailtoLink = \`mailto:?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
            window.open(mailtoLink);
        }

        function scheduleFollowUp() {
            alert('This would integrate with your calendar app to schedule a follow-up meeting. Implementation depends on your calendar system (Google Calendar, Outlook, etc.)');
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }