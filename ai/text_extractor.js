addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }
  
  try {
    const { imageData, outputFormat = 'text' } = await request.json();
    
    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Missing imageData' }), { status: 400, headers: jsonHeaders() });
    }

    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing OPENAI_API_KEY' }), { status: 500, headers: jsonHeaders() });
    }

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Be precise and include all visible text, including labels, signs, documents, captions, or any other written content. Preserve the layout and formatting as much as possible. If there is no readable text, respond with "No text found".'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ]
        }
      ]
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!aiResp.ok) {
      const error = await aiResp.text();
      return new Response(JSON.stringify({ error: `Text extraction failed: ${error}` }), { status: 500, headers: jsonHeaders() });
    }

    const data = await aiResp.json();
    const extractedText = data.choices?.[0]?.message?.content || '';
    
    // Parse and structure the extracted text
    const structured = parseTextOutput(extractedText);
    
    const result = {
      extractedText,
      structured,
      format: outputFormat,
      timestamp: new Date().toISOString(),
      confidence: calculateConfidence(extractedText),
      metadata: {
        wordCount: extractedText.split(/\s+/).length,
        lineCount: extractedText.split('\n').length,
        hasSpecialCharacters: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(extractedText),
        isStructured: extractedText.includes(':') || extractedText.includes('-') || extractedText.includes('\n')
      }
    };
    
    return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function parseTextOutput(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const structured = {
    headers: [],
    lists: [],
    paragraphs: [],
    keyValuePairs: [],
    specialFormatting: []
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Detect headers (lines ending with colon or all caps)
    if (trimmedLine.endsWith(':') || (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3)) {
      structured.headers.push(trimmedLine);
      return;
    }
    
    // Detect key-value pairs
    const kvMatch = trimmedLine.match(/^(.+?):\s*(.+)$/);
    if (kvMatch) {
      structured.keyValuePairs.push({
        key: kvMatch[1].trim(),
        value: kvMatch[2].trim()
      });
      return;
    }
    
    // Detect list items
    if (/^[\d\-\*\•]\s+/.test(trimmedLine) || /^[\d]+\./.test(trimmedLine)) {
      structured.lists.push(trimmedLine);
      return;
    }
    
    // Detect special formatting
    if (trimmedLine.includes('@') || trimmedLine.includes('.com') || /^\d{3,}/.test(trimmedLine)) {
      structured.specialFormatting.push(trimmedLine);
      return;
    }
    
    // Regular paragraph
    if (trimmedLine.length > 0) {
      structured.paragraphs.push(trimmedLine);
    }
  });

  return structured;
}

function calculateConfidence(text) {
  if (text === 'No text found') return 0;
  
  let confidence = 50; // Base confidence
  
  // Increase confidence based on structure
  if (text.includes(':')) confidence += 20;
  if (/\d/.test(text)) confidence += 10;
  if (/[A-Z]{2,}/.test(text)) confidence += 10;
  if (text.length > 50) confidence += 10;
  
  return Math.min(confidence, 95);
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Text Extractor from Image</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

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

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .content {
            padding: 40px;
        }

        .upload-section {
            border: 3px dashed #ddd;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            margin-bottom: 30px;
            transition: border-color 0.3s ease;
            background: #f8f9fa;
        }

        .upload-section.dragover {
            border-color: #667eea;
            background: #f0f4ff;
        }

        .upload-section input[type="file"] {
            display: none;
        }

        .upload-btn {
            background: #667eea;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            margin: 10px;
            transition: background-color 0.3s ease;
        }

        .upload-btn:hover {
            background: #5a6fd8;
        }

        .image-preview {
            max-width: 100%;
            max-height: 400px;
            border-radius: 10px;
            margin: 20px 0;
            display: none;
        }

        .result-section {
            margin-top: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 12px;
            display: none;
        }

        .confidence-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            margin-bottom: 20px;
        }

        .confidence-high { background: #28a745; }
        .confidence-medium { background: #ffc107; color: #333; }
        .confidence-low { background: #dc3545; }

        .text-output {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin-bottom: 20px;
        }

        .structured-output {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }

        .section {
            margin-bottom: 20px;
        }

        .section h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.2em;
        }

        .item {
            background: #f8f9fa;
            padding: 10px 15px;
            margin: 5px 0;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }

        .metadata {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .metadata-item {
            background: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 0.9em;
        }

        .action-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .action-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }

        .copy-btn { background: #28a745; }
        .download-btn { background: #17a2b8; }
        .share-btn { background: #6c757d; }

        @media (max-width: 768px) {
            .container { margin: 10px; }
            .header, .content { padding: 20px; }
            .metadata { flex-direction: column; }
            .action-buttons { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Text Extractor</h1>
            <p>Extract all text from images with AI-powered OCR technology</p>
        </div>

        <div class="content">
            <div class="upload-section" id="uploadSection">
                <h3>📁 Upload Image</h3>
                <p>Drag and drop an image here, or click to select</p>
                <p style="font-size: 0.9em; color: #666; margin: 10px 0;">
                    Supports: JPG, PNG, GIF, WEBP • Max size: 10MB
                </p>
                <input type="file" id="fileInput" accept="image/*">
                <button class="upload-btn" onclick="document.getElementById('fileInput').click()">
                    Choose Image
                </button>
                <div id="imagePreview"></div>
            </div>

            <div id="resultSection" class="result-section">
                <div class="metadata">
                    <div class="metadata-item">
                        <strong>Confidence:</strong> 
                        <span id="confidenceDisplay"></span>
                    </div>
                    <div class="metadata-item">
                        <strong>Words:</strong> <span id="wordCount">0</span>
                    </div>
                    <div class="metadata-item">
                        <strong>Lines:</strong> <span id="lineCount">0</span>
                    </div>
                    <div class="metadata-item">
                        <strong>Processed:</strong> <span id="timestamp"></span>
                    </div>
                </div>

                <div class="confidence-badge" id="confidenceBadge"></div>

                <div class="text-output" id="extractedText"></div>

                <div class="structured-output">
                    <h3>Structured Data</h3>
                    <div id="structuredData"></div>
                </div>

                <div class="action-buttons">
                    <button class="action-btn copy-btn" onclick="copyText()">Copy Text</button>
                    <button class="action-btn download-btn" onclick="downloadText()">Download</button>
                    <button class="action-btn share-btn" onclick="shareText()">Share</button>
                    <button class="action-btn" onclick="extractNewImage()">Extract from New Image</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const uploadSection = document.getElementById('uploadSection');
        const fileInput = document.getElementById('fileInput');
        const resultSection = document.getElementById('resultSection');
        let currentImageData = null;

        // Drag and drop functionality
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });

        uploadSection.addEventListener('dragleave', () => {
            uploadSection.classList.remove('dragover');
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        function handleFile(file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                currentImageData = e.target.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
                showPreview(e.target.result);
                extractText();
            };
            reader.readAsDataURL(file);
        }

        function showPreview(imageSrc) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = \`
                <img src="\${imageSrc}" class="image-preview" style="display: block;" alt="Preview">
                <button class="upload-btn" onclick="extractText()">Extract Text</button>
            \`;
        }

        async function extractText() {
            if (!currentImageData) {
                alert('Please upload an image first');
                return;
            }

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageData: currentImageData })
                });

                const data = await response.json();

                if (response.ok) {
                    displayResults(data);
                } else {
                    throw new Error(data.error || 'Text extraction failed');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        function displayResults(data) {
            // Update metadata
            document.getElementById('wordCount').textContent = data.metadata.wordCount;
            document.getElementById('lineCount').textContent = data.metadata.lineCount;
            document.getElementById('timestamp').textContent = new Date(data.timestamp).toLocaleString();

            // Update confidence
            const confidence = data.confidence;
            const confidenceDisplay = document.getElementById('confidenceDisplay');
            const confidenceBadge = document.getElementById('confidenceBadge');
            
            confidenceDisplay.textContent = \`\${confidence}%\`;
            confidenceBadge.textContent = confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low';
            confidenceBadge.className = \`confidence-badge \${confidence >= 80 ? 'confidence-high' : confidence >= 50 ? 'confidence-medium' : 'confidence-low'}\`;

            // Display extracted text
            document.getElementById('extractedText').textContent = data.extractedText;

            // Display structured data
            displayStructuredData(data.structured);

            // Show result section
            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }

        function displayStructuredData(structured) {
            const container = document.getElementById('structuredData');
            let html = '';

            if (structured.headers.length > 0) {
                html += '<div class="section"><h3>Headers</h3>';
                structured.headers.forEach(header => {
                    html += \`<div class="item">\${header}</div>\`;
                });
                html += '</div>';
            }

            if (structured.keyValuePairs.length > 0) {
                html += '<div class="section"><h3>Key-Value Pairs</h3>';
                structured.keyValuePairs.forEach(kv => {
                    html += \`<div class="item"><strong>\${kv.key}:</strong> \${kv.value}</div>\`;
                });
                html += '</div>';
            }

            if (structured.lists.length > 0) {
                html += '<div class="section"><h3>Lists</h3>';
                structured.lists.forEach(listItem => {
                    html += \`<div class="item">\${listItem}</div>\`;
                });
                html += '</div>';
            }

            if (structured.paragraphs.length > 0) {
                html += '<div class="section"><h3>Paragraphs</h3>';
                structured.paragraphs.forEach(paragraph => {
                    html += \`<div class="item">\${paragraph}</div>\`;
                });
                html += '</div>';
            }

            if (structured.specialFormatting.length > 0) {
                html += '<div class="section"><h3>Special Content</h3>';
                structured.specialFormatting.forEach(item => {
                    html += \`<div class="item">\${item}</div>\`;
                });
                html += '</div>';
            }

            if (html === '') {
                html = '<p>No structured data detected.</p>';
            }

            container.innerHTML = html;
        }

        function copyText() {
            const text = document.getElementById('extractedText').textContent;
            navigator.clipboard.writeText(text).then(() => {
                alert('Text copied to clipboard!');
            });
        }

        function downloadText() {
            const text = document.getElementById('extractedText').textContent;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'extracted-text.txt';
            a.click();
            URL.revokeObjectURL(url);
        }

        function shareText() {
            const text = document.getElementById('extractedText').textContent;
            if (navigator.share) {
                navigator.share({
                    title: 'Extracted Text',
                    text: text
                });
            } else {
                copyText();
                alert('Text copied to clipboard for sharing!');
            }
        }

        function extractNewImage() {
            fileInput.value = '';
            currentImageData = null;
            document.getElementById('imagePreview').innerHTML = '';
            resultSection.style.display = 'none';
            uploadSection.scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/html', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}