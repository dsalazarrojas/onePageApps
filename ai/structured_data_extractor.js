addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  try {
    const { sourceText, schemaHint = '', strictJSON = false } = await request.json();
    
    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'Missing sourceText' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const sysPrompt = `Extract structured data from the following text and format it as valid JSON. ${schemaHint ? `Schema hint: ${schemaHint}` : ''}

${strictJSON ? 'IMPORTANT: Return only valid JSON without any additional text or markdown formatting.' : 'Format as clean JSON with proper indentation. If unsure about any fields, leave them as null or empty arrays.'}

Focus on identifying key entities, relationships, and structured information that can be programmatically used.`;

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
    const rawJSON = data.choices?.[0]?.message?.content || '';
    
    // Clean and parse JSON
    let structuredData;
    try {
      const cleanJSON = cleanJSONResponse(rawJSON);
      structuredData = JSON.parse(cleanJSON);
    } catch (e) {
      structuredData = createFallbackStructure(sourceText, schemaHint);
    }
    
    return new Response(JSON.stringify({ 
      data: structuredData,
      originalText: sourceText,
      schemaUsed: schemaHint,
      isValidJSON: isValidJSON(structuredData),
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function cleanJSONResponse(response) {
  // Remove markdown code blocks if present
  let cleaned = response.replace(/```json\s*/g, '').replace(/\s*```/g, '');
  
  // Remove any leading/trailing text that might not be JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned.trim();
}

function createFallbackStructure(text, schemaHint) {
  // Create a basic structure based on common patterns
  const structure = {
    extractedEntities: [],
    metadata: {
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      processingDate: new Date().toISOString()
    }
  };

  // Simple entity extraction
  const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) || [];
  const numbers = text.match(/\b\d+\b/g) || [];

  if (emails.length > 0) structure.emails = emails;
  if (urls.length > 0) structure.urls = urls;
  if (dates.length > 0) structure.dates = dates;
  if (numbers.length > 0) structure.numbers = numbers.slice(0, 10); // Limit to first 10

  return structure;
}

function isValidJSON(obj) {
  try {
    return typeof obj === 'object' && obj !== null;
  } catch {
    return false;
  }
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Structured Data Extractor</title>
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
            max-width: 1200px;
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
            display: flex; gap: 20px; margin-bottom: 20px; align-items: center;
        }
        .toggle-group {
            display: flex; align-items: center; gap: 10px;
        }
        .toggle-group input[type="checkbox"] {
            width: 20px; height: 20px; accent-color: #667eea;
        }
        button {
            background: #667eea; color: white; border: none; padding: 15px 40px;
            border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: 600;
            width: 100%; margin-top: 20px;
        }
        .results { margin-top: 30px; display: none; }
        .results-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        .json-viewer {
            background: #f8f9fa; padding: 20px; border-radius: 12px;
            border: 2px solid #e9ecef; max-height: 500px; overflow-y: auto;
        }
        .json-viewer pre {
            margin: 0; white-space: pre-wrap; word-wrap: break-word;
            font-family: 'Courier New', monospace; font-size: 14px;
        }
        .validation-status {
            display: flex; align-items: center; gap: 10px; margin-bottom: 15px;
            padding: 10px; border-radius: 8px;
        }
        .valid { background: #d4edda; color: #155724; }
        .invalid { background: #f8d7da; color: #721c24; }
        .status-icon { font-size: 1.2em; }
        .export-options {
            display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;
        }
        .export-btn {
            background: #667eea; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 14px;
        }
        .copy-btn { background: #28a745; }
        .download-btn { background: #17a2b8; }
        .template-btn { background: #6f42c1; }
        .json-tree {
            font-family: 'Courier New', monospace; font-size: 14px;
        }
        .json-key { color: #0066cc; font-weight: bold; }
        .json-string { color: #008800; }
        .json-number { color: #cc6600; }
        .json-boolean { color: #6666cc; }
        .json-null { color: #999999; }
        @media (max-width: 768px) {
            .results-grid { grid-template-columns: 1fr; }
            .options-row { flex-direction: column; align-items: stretch; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Structured Data Extractor</h1>
            <p>Convert unstructured text into organized JSON data with AI-powered parsing</p>
        </div>
        <div class="content">
            <form id="extractForm">
                <div class="form-section">
                    <h3>Source Text</h3>
                    <div class="form-group">
                        <label for="sourceText">Text to Extract Data From:</label>
                        <textarea id="sourceText" placeholder="Paste any unstructured text here - emails, reports, articles, conversations, etc." required></textarea>
                    </div>
                </div>
                <div class="form-section">
                    <h3>Extraction Settings</h3>
                    <div class="form-group">
                        <label for="schemaHint">Schema Hint (optional):</label>
                        <textarea id="schemaHint" placeholder="Describe the structure you want...&#10;Example: Extract person information including name, email, phone, company&#10;Or: Create a product catalog with name, price, category, features"></textarea>
                    </div>
                    <div class="options-row">
                        <div class="toggle-group">
                            <input type="checkbox" id="strictJSON">
                            <label for="strictJSON">Strict JSON output (no additional text)</label>
                        </div>
                    </div>
                </div>
                <button type="submit">Extract Structured Data</button>
            </form>

            <div id="results" class="results">
                <h3>📊 Extraction Results</h3>
                <div class="results-grid">
                    <div>
                        <div class="validation-status" id="validationStatus">
                            <span class="status-icon">⏳</span>
                            <span>Processing...</span>
                        </div>
                        <div class="json-viewer">
                            <div id="jsonContent"></div>
                        </div>
                        <div class="export-options">
                            <button class="export-btn copy-btn" onclick="copyJSON()">Copy JSON</button>
                            <button class="export-btn download-btn" onclick="downloadJSON()">Download</button>
                            <button class="export-btn template-btn" onclick="showTemplates()">Schema Templates</button>
                        </div>
                    </div>
                    <div>
                        <h4>📈 Extraction Summary</h4>
                        <div id="extractionSummary" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 10px;">
                            <div id="summaryContent">
                                <p>No data extracted yet.</p>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <h4>🗂️ Schema Templates</h4>
                            <div id="schemaTemplates" style="display: none;">
                                <button onclick="applyTemplate('person')" style="margin: 5px; padding: 8px 16px; background: #e9ecef; border: none; border-radius: 4px; cursor: pointer;">Person Info</button>
                                <button onclick="applyTemplate('product')" style="margin: 5px; padding: 8px 16px; background: #e9ecef; border: none; border-radius: 4px; cursor: pointer;">Product</button>
                                <button onclick="applyTemplate('contact')" style="margin: 5px; padding: 8px 16px; background: #e9ecef; border: none; border-radius: 4px; cursor: pointer;">Contact</button>
                                <button onclick="applyTemplate('event')" style="margin: 5px; padding: 8px 16px; background: #e9ecef; border: none; border-radius: 4px; cursor: pointer;">Event</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        const templates = {
            person: "Extract person information including name, age, occupation, location, and contact details",
            product: "Create a product catalog with name, price, category, description, features, and availability",
            contact: "Extract contact information including name, email, phone, address, company, and title",
            event: "Parse event details including date, time, location, attendees, agenda, and description"
        };

        document.getElementById('extractForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceText = document.getElementById('sourceText').value;
            const schemaHint = document.getElementById('schemaHint').value;
            const strictJSON = document.getElementById('strictJSON').checked;

            try {
                showProcessing();
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceText, schemaHint, strictJSON })
                });
                const data = await response.json();
                
                if (response.ok) {
                    displayResults(data);
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                showError(error.message);
            }
        });

        function showProcessing() {
            const results = document.getElementById('results');
            const validationStatus = document.getElementById('validationStatus');
            
            validationStatus.className = 'validation-status';
            validationStatus.innerHTML = '<span class="status-icon">⏳</span><span>Processing...</span>';
            results.style.display = 'block';
        }

        function displayResults(data) {
            const validationStatus = document.getElementById('validationStatus');
            const jsonContent = document.getElementById('jsonContent');
            const summaryContent = document.getElementById('summaryContent');
            
            // Update validation status
            if (data.isValidJSON) {
                validationStatus.className = 'validation-status valid';
                validationStatus.innerHTML = '<span class="status-icon">✅</span><span>Valid JSON extracted</span>';
            } else {
                validationStatus.className = 'validation-status invalid';
                validationStatus.innerHTML = '<span class="status-icon">⚠️</span><span>Partial extraction - may need cleanup</span>';
            }
            
            // Display JSON with syntax highlighting
            jsonContent.innerHTML = syntaxHighlight(JSON.stringify(data.data, null, 2));
            
            // Generate summary
            const summary = generateExtractionSummary(data);
            summaryContent.innerHTML = summary;
            
            // Scroll to results
            document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        }

        function generateExtractionSummary(data) {
            const dataObj = data.data;
            const keys = Object.keys(dataObj);
            let summary = '<h5>Extracted Fields:</h5><ul>';
            
            keys.forEach(key => {
                const value = dataObj[key];
                if (Array.isArray(value)) {
                    summary += \`<li><strong>\${key}:</strong> Array (\${value.length} items)</li>\`;
                } else if (typeof value === 'object' && value !== null) {
                    summary += \`<li><strong>\${key}:</strong> Object (\${Object.keys(value).length} fields)</li>\`;
                } else {
                    summary += \`<li><strong>\${key}:</strong> \${typeof value}</li>\`;
                }
            });
            
            summary += '</ul>';
            summary += \`<p><strong>Schema Used:</strong> \${data.schemaUsed || 'Auto-detected'}</p>\`;
            
            return summary;
        }

        function syntaxHighlight(json) {
            return json
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+\-]?\d+)?)/g, function(match) {
                    let cls = 'json-number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'json-key';
                        } else {
                            cls = 'json-string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'json-boolean';
                    } else if (/null/.test(match)) {
                        cls = 'json-null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });
        }

        function copyJSON() {
            const jsonText = document.getElementById('jsonContent').textContent;
            navigator.clipboard.writeText(jsonText).then(() => {
                alert('JSON copied to clipboard!');
            });
        }

        function downloadJSON() {
            const jsonText = document.getElementById('jsonContent').textContent;
            const blob = new Blob([jsonText], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'extracted-data.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        function showTemplates() {
            const templates = document.getElementById('schemaTemplates');
            templates.style.display = templates.style.display === 'none' ? 'block' : 'none';
        }

        function applyTemplate(templateName) {
            const template = templates[templateName];
            document.getElementById('schemaHint').value = template;
            showTemplates();
        }

        function showError(message) {
            const validationStatus = document.getElementById('validationStatus');
            validationStatus.className = 'validation-status invalid';
            validationStatus.innerHTML = '<span class="status-icon">❌</span><span>Error: ' + message + '</span>';
        }
    </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function textHeaders() { return { 'Content-Type': 'text/html', ...corsHeaders() }; }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }; }