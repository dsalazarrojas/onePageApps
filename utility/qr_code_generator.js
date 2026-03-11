addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { text, size = 'medium', color = 'black', background = 'white' } = await request.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400, headers: jsonHeaders() });
    }

    // Generate QR code using a third-party service or library
    // For demo purposes, we'll use a simple QR service or generate basic QR data
    
    const qrCodeData = await generateQRCode(text, { size, color, background });
    
    return new Response(JSON.stringify({ 
      qrCode: qrCodeData,
      text: text,
      size: size,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Generator</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f8f9fa;
            color: #333;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #007bff;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .form-group {
            margin: 20px 0;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #495057;
        }
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #007bff;
        }
        textarea {
            resize: vertical;
            min-height: 100px;
        }
        .options-row {
            display: flex;
            gap: 15px;
        }
        .options-row .form-group {
            flex: 1;
        }
        button {
            background: #007bff;
            color: white;
            padding: 15px 40px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            width: 100%;
            margin-top: 20px;
            transition: background-color 0.3s ease;
        }
        button:hover {
            background: #0056b3;
        }
        .result {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            background: #e9ecef;
            border-radius: 10px;
            display: none;
        }
        .qr-image {
            max-width: 100%;
            height: auto;
            border: 2px solid #007bff;
            border-radius: 8px;
            margin: 20px 0;
        }
        .download-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .download-btn {
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
        }
        .download-btn:hover {
            background: #218838;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            display: none;
        }
        .preview-section {
            margin-top: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔳 QR Code Generator</h1>
        <p style="text-align: center; color: #6c757d; font-size: 1.1em;">
            Generate QR codes for text, URLs, contact info, and more!
        </p>

        <form id="qrForm">
            <div class="form-group">
                <label for="text">Text or URL:</label>
                <textarea 
                    id="text" 
                    placeholder="Enter text, URL, or any content to encode in QR code..."
                    required
                ></textarea>
            </div>

            <div class="options-row">
                <div class="form-group">
                    <label for="size">Size:</label>
                    <select id="size">
                        <option value="small">Small (128x128)</option>
                        <option value="medium" selected>Medium (256x256)</option>
                        <option value="large">Large (512x512)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="color">QR Color:</label>
                    <select id="color">
                        <option value="black" selected>Black</option>
                        <option value="blue">Blue</option>
                        <option value="red">Red</option>
                        <option value="green">Green</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="background">Background:</label>
                    <select id="background">
                        <option value="white" selected>White</option>
                        <option value="transparent">Transparent</option>
                    </select>
                </div>
            </div>

            <button type="submit">Generate QR Code</button>
        </form>

        <div id="error" class="error"></div>

        <div id="result" class="result">
            <h3>✅ QR Code Generated!</h3>
            <div class="preview-section">
                <p><strong>Content:</strong> <span id="previewText"></span></p>
            </div>
            <div>
                <img id="qrImage" class="qr-image" alt="Generated QR Code">
            </div>
            <div class="download-buttons">
                <button id="downloadPng" class="download-btn">Download PNG</button>
                <button id="copyLink" class="download-btn">Copy Image URL</button>
                <button id="shareQr" class="download-btn">Share QR Code</button>
            </div>
            <div style="margin-top: 15px;">
                <p><strong>Direct link:</strong> <span id="qrLink" style="font-size: 0.9em; word-break: break-all;"></span></p>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('qrForm');
        const result = document.getElementById('result');
        const error = document.getElementById('error');
        const qrImage = document.getElementById('qrImage');
        const qrLink = document.getElementById('qrLink');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const text = document.getElementById('text').value;
            const size = document.getElementById('size').value;
            const color = document.getElementById('color').value;
            const background = document.getElementById('background').value;

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, size, color, background })
                });

                const data = await response.json();

                if (response.ok) {
                    // Show result
                    document.getElementById('previewText').textContent = text;
                    qrImage.src = data.qrCode;
                    qrLink.textContent = data.qrCode;
                    
                    result.style.display = 'block';
                    error.style.display = 'none';

                    // Update download button
                    document.getElementById('downloadPng').onclick = () => downloadQR(data.qrCode, 'qr-code.png');
                    document.getElementById('copyLink').onclick = () => copyToClipboard(data.qrCode);
                    document.getElementById('shareQr').onclick = () => shareQR(data.qrCode, text);
                } else {
                    throw new Error(data.error || 'Failed to generate QR code');
                }
            } catch (err) {
                error.textContent = 'Error: ' + err.message;
                error.style.display = 'block';
                result.style.display = 'none';
            }
        });

        function downloadQR(dataUrl, filename) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Image URL copied to clipboard!');
            });
        }

        function shareQR(dataUrl, text) {
            if (navigator.share) {
                fetch(dataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
                        navigator.share({
                            title: 'QR Code',
                            text: 'Check out this QR code: ' + text,
                            files: [file]
                        });
                    });
            } else {
                copyToClipboard(dataUrl);
                alert('QR code data URL copied to clipboard!');
            }
        }
    </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

// Simple QR code generation (in production, use a proper QR library)
async function generateQRCode(text, options) {
  // This is a simplified implementation
  // In production, you'd use libraries like:
  // - qrcode (for Node.js)
  // - qr-code-generator (for browsers)
  // - Third-party QR API services
  
  // For demo purposes, we'll use a QR code API service
  const sizeMap = {
    small: '128x128',
    medium: '256x256', 
    large: '512x512'
  };

  const colorMap = {
    black: '000000',
    blue: '0000FF',
    red: 'FF0000',
    green: '00FF00'
  };

  const size = sizeMap[options.size] || '256x256';
  const color = colorMap[options.color] || '000000';
  const bg = options.background === 'transparent' ? 'transparent' : 'FFFFFF';

  // Using QR Server API (free tier)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(text)}&color=${color}&bgcolor=${bg}`;

  return qrUrl;
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