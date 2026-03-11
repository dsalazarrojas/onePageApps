addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Handle file upload
  if (path === '/upload' && request.method === 'POST') {
    return handleFileUpload(request);
  }
  
  // Handle file download
  if (path.startsWith('/download/')) {
    return handleFileDownload(request);
  }
  
  // Serve main page
  if (path === '/') {
    return serveUploadPage();
  }
  
  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function handleFileUpload(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const password = formData.get('password') || '';
    const expiresIn = formData.get('expiresIn') || '24'; // hours

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400, headers: jsonHeaders() });
    }

    // Generate unique file ID
    const fileId = crypto.randomUUID();
    const expirationTime = Date.now() + (parseInt(expiresIn) * 60 * 60 * 1000);

    // Get file data
    const fileData = await file.arrayBuffer();
    const fileSize = fileData.byteLength;
    const fileName = file.name;
    const fileType = file.type;

    // Store file metadata and data in R2
    const metadata = {
      fileName,
      fileType,
      fileSize,
      passwordProtected: password.length > 0,
      expirationTime,
      uploadedAt: Date.now(),
      fileId
    };

    // Store metadata
    await FILE_R2.put(`metadata_${fileId}`, JSON.stringify(metadata));

    // Store file data (encrypted if password provided)
    let fileBuffer;
    if (password) {
      // Simple password-based encryption (in production, use proper encryption)
      fileBuffer = await encryptFile(new Uint8Array(fileData), password);
    } else {
      fileBuffer = new Uint8Array(fileData);
    }

    await FILE_R2.put(`file_${fileId}`, fileBuffer);

    // Set expiration in KV
    await FILE_KV.put(`expiry_${fileId}`, expirationTime.toString());

    // Generate share URL
    const baseUrl = request.url.split('/')[0] + '//' + request.url.split('/')[2];
    const shareUrl = password 
      ? `${baseUrl}/download/${fileId}?pw_required=true`
      : `${baseUrl}/download/${fileId}`;

    const uploadResult = {
      fileId,
      shareUrl,
      expiresAt: new Date(expirationTime).toISOString(),
      fileName,
      fileSize,
      passwordProtected: password.length > 0,
      downloadCount: 0
    };

    return new Response(JSON.stringify(uploadResult), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Upload failed' }), { status: 500, headers: jsonHeaders() });
  }
}

async function handleFileDownload(request) {
  try {
    const url = new URL(request.url);
    const fileId = url.pathname.split('/').pop();
    const password = url.searchParams.get('password') || '';

    // Check if file exists and hasn't expired
    const expiryTime = await FILE_KV.get(`expiry_${fileId}`);
    if (!expiryTime || Date.now() > parseInt(expiryTime)) {
      await cleanupExpiredFile(fileId);
      return new Response('File has expired or been deleted', { status: 410, headers: textHeaders() });
    }

    // Get metadata
    const metadataStr = await FILE_R2.get(`metadata_${fileId}`);
    if (!metadataStr) {
      return new Response('File not found', { status: 404, headers: textHeaders() });
    }

    const metadata = JSON.parse(metadataStr);

    // Check password if required
    if (metadata.passwordProtected && !password) {
      return servePasswordPage(fileId);
    }

    // Decrypt file if password protected
    let fileData;
    if (metadata.passwordProtected) {
      fileData = await decryptFile(await FILE_R2.get(`file_${fileId}`), password);
      if (!fileData) {
        return new Response('Incorrect password', { status: 401, headers: textHeaders() });
      }
    } else {
      fileData = await FILE_R2.get(`file_${fileId}`);
    }

    // Update download count
    metadata.downloadCount = (metadata.downloadCount || 0) + 1;
    await FILE_R2.put(`metadata_${fileId}`, JSON.stringify(metadata));

    // Return file
    return new Response(fileData, {
      headers: {
        'Content-Type': metadata.fileType,
        'Content-Disposition': `attachment; filename="${metadata.fileName}"`,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response('Download failed', { status: 500, headers: textHeaders() });
  }
}

async function serveUploadPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure File Sharing</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; text-align: center; }
        .upload-section { margin: 20px 0; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        button {
            background: #28a745;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        button:hover { background: #218838; }
        .result {
            margin-top: 20px;
            padding: 15px;
            background: #d4edda;
            border-radius: 5px;
            display: none;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
        }
        .file-info {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Secure File Sharing</h1>
        <p>Upload a file and get a secure, time-limited share link.</p>
        
        <form id="uploadForm">
            <div class="upload-section">
                <label for="file">Choose File:</label>
                <input type="file" id="file" name="file" required>
                <div class="file-info" id="fileInfo"></div>
            </div>
            
            <div class="form-group">
                <label for="password">Password Protection (Optional):</label>
                <input type="password" id="password" name="password" placeholder="Leave empty for no password">
            </div>
            
            <div class="form-group">
                <label for="expiresIn">Expires In:</label>
                <select id="expiresIn" name="expiresIn">
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="24" selected>24 Hours</option>
                    <option value="168">1 Week</option>
                </select>
            </div>
            
            <button type="submit">Upload & Generate Link</button>
        </form>
        
        <div id="result" class="result">
            <h3>✅ Upload Successful!</h3>
            <p><strong>Share URL:</strong></p>
            <p><a id="shareUrl" href="#" target="_blank"></a></p>
            <button id="copyUrl" onclick="copyToClipboard()">Copy URL</button>
            <button id="shareNative" onclick="shareNative()">Share...</button>
        </div>
        
        <div id="error" class="result error"></div>
    </div>

    <script>
        document.getElementById('file').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                document.getElementById('fileInfo').textContent = \`File: \${file.name} (\${sizeMB} MB)\`;
            }
        });

        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('file', document.getElementById('file').files[0]);
            formData.append('password', document.getElementById('password').value);
            formData.append('expiresIn', document.getElementById('expiresIn').value);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (response.ok) {
                    document.getElementById('shareUrl').textContent = result.shareUrl;
                    document.getElementById('shareUrl').href = result.shareUrl;
                    document.getElementById('result').style.display = 'block';
                    document.getElementById('error').style.display = 'none';
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
            } catch (error) {
                document.getElementById('error').textContent = 'Error: ' + error.message;
                document.getElementById('error').style.display = 'block';
                document.getElementById('result').style.display = 'none';
            }
        });

        function copyToClipboard() {
            const url = document.getElementById('shareUrl').textContent;
            navigator.clipboard.writeText(url);
            alert('URL copied to clipboard!');
        }

        function shareNative() {
            const url = document.getElementById('shareUrl').textContent;
            if (navigator.share) {
                navigator.share({
                    title: 'Secure File Share',
                    url: url
                });
            } else {
                copyToClipboard();
            }
        }
    </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

async function servePasswordPage(fileId) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Required</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 400px;
            margin: 100px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        button {
            background: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🔒 Password Required</h2>
        <p>This file is password protected.</p>
        <form action="/download/${fileId}" method="GET">
            <input type="password" name="password" placeholder="Enter password" required>
            <br><br>
            <button type="submit">Download</button>
        </form>
    </div>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

async function encryptFile(fileBuffer, password) {
  // Simple encryption placeholder - in production use proper encryption
  // This is just a basic XOR encryption for demonstration
  const key = password.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return fileBuffer.map(byte => byte ^ key);
}

async function decryptFile(encryptedBuffer, password) {
  try {
    const key = password.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return encryptedBuffer.map(byte => byte ^ key);
  } catch {
    return null;
  }
}

async function cleanupExpiredFile(fileId) {
  try {
    await FILE_R2.delete(`file_${fileId}`);
    await FILE_R2.delete(`metadata_${fileId}`);
    await FILE_KV.delete(`expiry_${fileId}`);
  } catch (e) {
    console.error('Cleanup failed:', e);
  }
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