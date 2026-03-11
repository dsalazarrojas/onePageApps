addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === 'GET' && url.pathname === '/') {
    return new Response(renderApp(), { status: 200, headers: htmlHeaders() });
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

function renderApp() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meme Generator</title>
  <style>
    * { box-sizing: border-box; }
    :root {
      color-scheme: dark;
      --bg: #07111f;
      --panel: rgba(10, 18, 32, 0.88);
      --panel-2: rgba(18, 28, 46, 0.95);
      --border: rgba(148, 163, 184, 0.22);
      --text: #e5eefb;
      --muted: #9fb0c8;
      --brand: #60a5fa;
      --brand-2: #c084fc;
      --shadow: 0 30px 80px rgba(2, 8, 23, 0.45);
    }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 30%),
        radial-gradient(circle at top right, rgba(192, 132, 252, 0.16), transparent 26%),
        linear-gradient(160deg, #08111d 0%, #0d1728 46%, #07101b 100%);
      padding: 24px;
    }
    .app {
      max-width: 1320px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
    }
    .controls {
      padding: 24px;
      position: sticky;
      top: 24px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1;
    }
    .lead {
      margin: 0 0 22px;
      color: var(--muted);
      line-height: 1.5;
    }
    .section {
      margin-top: 22px;
      padding-top: 20px;
      border-top: 1px solid rgba(148, 163, 184, 0.16);
    }
    .section:first-of-type {
      margin-top: 0;
      padding-top: 0;
      border-top: 0;
    }
    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #d8e5fb;
    }
    .template-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .template-card {
      position: relative;
      border: 2px solid transparent;
      border-radius: 18px;
      padding: 0;
      overflow: hidden;
      background: #0f172a;
      cursor: pointer;
      transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      min-height: 110px;
    }
    .template-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.25);
    }
    .template-card.active {
      border-color: var(--brand);
      box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.16);
    }
    .template-art {
      position: absolute;
      inset: 0;
    }
    .template-label {
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 10px;
      padding: 6px 10px;
      font-weight: 700;
      font-size: 0.85rem;
      border-radius: 999px;
      background: rgba(8, 15, 28, 0.75);
      color: #f8fbff;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    .upload-card .template-art {
      display: grid;
      place-items: center;
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.95)),
        radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.18), transparent 30%);
      border: 2px dashed rgba(148, 163, 184, 0.35);
      border-radius: 16px;
      inset: 8px;
    }
    .upload-icon {
      font-size: 2rem;
      line-height: 1;
      filter: drop-shadow(0 6px 12px rgba(96, 165, 250, 0.25));
    }
    .control-grid {
      display: grid;
      gap: 14px;
    }
    label {
      display: grid;
      gap: 8px;
      font-size: 0.95rem;
      color: #dce8fb;
    }
    input[type="text"],
    input[type="number"] {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 14px;
      background: var(--panel-2);
      color: var(--text);
      padding: 12px 14px;
      font: inherit;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }
    input[type="text"]:focus,
    input[type="number"]:focus {
      border-color: rgba(96, 165, 250, 0.9);
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.16);
    }
    input[type="color"] {
      width: 100%;
      height: 48px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 14px;
      background: var(--panel-2);
      padding: 6px;
      cursor: pointer;
    }
    input[type="range"] {
      width: 100%;
      accent-color: #60a5fa;
    }
    input[type="file"] {
      width: 100%;
      border: 1px dashed rgba(148, 163, 184, 0.3);
      border-radius: 14px;
      padding: 12px;
      background: rgba(15, 23, 42, 0.55);
      color: var(--muted);
    }
    .split {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .value-pill {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      min-width: 48px;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 0.85rem;
      color: #dce8fb;
      background: rgba(96, 165, 250, 0.15);
      border: 1px solid rgba(96, 165, 250, 0.22);
    }
    .button-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 22px;
    }
    button {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
    }
    button:hover {
      transform: translateY(-1px);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .primary {
      color: #06111e;
      background: linear-gradient(135deg, #93c5fd, #60a5fa);
      box-shadow: 0 12px 30px rgba(96, 165, 250, 0.25);
    }
    .secondary {
      color: var(--text);
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.24);
    }
    .preview {
      padding: 24px;
      display: grid;
      gap: 16px;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .preview-title {
      margin: 0;
      font-size: 1.25rem;
    }
    .preview-copy {
      margin: 4px 0 0;
      color: var(--muted);
    }
    .canvas-shell {
      min-height: 540px;
      display: grid;
      place-items: center;
      border-radius: 24px;
      overflow: hidden;
      background:
        linear-gradient(45deg, rgba(30, 41, 59, 0.75) 25%, transparent 25%, transparent 75%, rgba(30, 41, 59, 0.75) 75%),
        linear-gradient(45deg, rgba(30, 41, 59, 0.75) 25%, transparent 25%, transparent 75%, rgba(30, 41, 59, 0.75) 75%);
      background-size: 32px 32px;
      background-position: 0 0, 16px 16px;
      border: 1px solid rgba(148, 163, 184, 0.16);
    }
    canvas {
      max-width: 100%;
      max-height: 75vh;
      display: block;
      background: #0f172a;
    }
    .status {
      min-height: 1.3em;
      color: var(--muted);
      font-size: 0.95rem;
    }
    .hidden {
      display: none !important;
    }
    @media (max-width: 1080px) {
      .app { grid-template-columns: 1fr; }
      .controls { position: static; }
    }
    @media (max-width: 700px) {
      body { padding: 16px; }
      .controls, .preview { padding: 18px; }
      .template-grid,
      .split { grid-template-columns: 1fr; }
      .canvas-shell { min-height: 360px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="panel controls">
      <div class="section">
        <h1>Meme Generator</h1>
        <p class="lead">Pick a bold gradient template or upload your own image, then add classic top and bottom meme text with full canvas-based styling controls.</p>
      </div>

      <div class="section">
        <div class="section-title">
          <span>Background</span>
          <span class="value-pill" id="sourceLabel">Template</span>
        </div>
        <div class="template-grid" id="templateGrid"></div>
        <label class="hidden" id="uploadLabel">
          Upload image
          <input id="imageUpload" type="file" accept="image/*">
        </label>
      </div>

      <div class="section control-grid">
        <label>
          Top text
          <input id="topText" type="text" maxlength="120" placeholder="WHEN THE DEPLOY WORKS">
        </label>
        <label>
          Bottom text
          <input id="bottomText" type="text" maxlength="120" placeholder="AND YOU DIDN'T EVEN REFRESH">
        </label>
      </div>

      <div class="section control-grid">
        <div class="section-title">
          <span>Font size</span>
          <span class="value-pill" id="fontSizeValue">40</span>
        </div>
        <input id="fontSize" type="range" min="20" max="80" value="40">

        <div class="split">
          <label>
            Text color
            <input id="textColor" type="color" value="#ffffff">
          </label>
          <label>
            Outline color
            <input id="outlineColor" type="color" value="#000000">
          </label>
        </div>

        <div class="section-title">
          <span>Outline thickness</span>
          <span class="value-pill" id="outlineValue">4</span>
        </div>
        <input id="outlineThickness" type="range" min="1" max="10" value="4">
      </div>

      <div class="button-row">
        <button class="primary" id="generateBtn" type="button">Generate Meme</button>
        <button class="secondary" id="downloadBtn" type="button" disabled>Download PNG</button>
      </div>
    </aside>

    <section class="panel preview">
      <div class="preview-header">
        <div>
          <h2 class="preview-title">Live preview</h2>
          <p class="preview-copy">The canvas updates as you edit text, colors, and outlines after a source image is ready.</p>
        </div>
        <div class="value-pill" id="canvasInfo">1200 × 1200</div>
      </div>
      <div class="canvas-shell">
        <canvas id="previewCanvas" width="1200" height="1200"></canvas>
      </div>
      <div class="status" id="status">Choose a built-in template or upload your own image to start.</div>
    </section>
  </div>

  <script>
    const templates = [
      { id: 'sunrise', name: 'Sunrise Roast', gradient: ['#f97316', '#ef4444'], accent: '#fff3c4', pattern: 'burst' },
      { id: 'neon', name: 'Neon Night', gradient: ['#0f172a', '#7c3aed'], accent: '#67e8f9', pattern: 'rings' },
      { id: 'mint', name: 'Mint Mode', gradient: ['#10b981', '#14b8a6'], accent: '#ecfeff', pattern: 'waves' },
      { id: 'royal', name: 'Royal Drama', gradient: ['#4c1d95', '#1d4ed8'], accent: '#dbeafe', pattern: 'diagonal' },
      { id: 'pink', name: 'Pink Alert', gradient: ['#ec4899', '#f59e0b'], accent: '#fff7ed', pattern: 'spotlight' },
      { id: 'mono', name: 'Mono Chaos', gradient: ['#111827', '#475569'], accent: '#f8fafc', pattern: 'grid' }
    ];

    const templateGrid = document.getElementById('templateGrid');
    const uploadLabel = document.getElementById('uploadLabel');
    const imageUpload = document.getElementById('imageUpload');
    const topTextInput = document.getElementById('topText');
    const bottomTextInput = document.getElementById('bottomText');
    const fontSizeInput = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const textColorInput = document.getElementById('textColor');
    const outlineColorInput = document.getElementById('outlineColor');
    const outlineThicknessInput = document.getElementById('outlineThickness');
    const outlineValue = document.getElementById('outlineValue');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const sourceLabel = document.getElementById('sourceLabel');
    const statusEl = document.getElementById('status');
    const canvasInfo = document.getElementById('canvasInfo');
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');

    let activeSource = { type: 'template', value: templates[0] };
    let uploadedImage = null;
    let hasRendered = false;

    renderTemplateCards();
    updateRangeLabels();
    renderMeme();

    templateGrid.addEventListener('click', event => {
      const button = event.target.closest('.template-card');
      if (!button) return;
      const sourceType = button.dataset.source;
      if (sourceType === 'upload') {
        activeSource = { type: 'upload', value: null };
        updateTemplateSelection();
        sourceLabel.textContent = uploadedImage ? 'Upload' : 'Upload needed';
        uploadLabel.classList.remove('hidden');
        imageUpload.click();
        renderMeme();
        return;
      }

      const template = templates.find(item => item.id === button.dataset.templateId);
      if (!template) return;
      activeSource = { type: 'template', value: template };
      updateTemplateSelection();
      uploadLabel.classList.add('hidden');
      sourceLabel.textContent = 'Template';
      renderMeme();
    });

    imageUpload.addEventListener('change', async event => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        uploadedImage = await loadImageFile(file);
        activeSource = { type: 'upload', value: file.name };
        updateTemplateSelection();
        uploadLabel.classList.remove('hidden');
        sourceLabel.textContent = 'Upload';
        setStatus('Custom image loaded. Tweak your text and styling, then download the PNG.');
        renderMeme();
      } catch (error) {
        setStatus(error.message || 'Could not load the selected image.');
      }
    });

    [topTextInput, bottomTextInput, textColorInput, outlineColorInput].forEach(input => {
      input.addEventListener('input', () => {
        if (sourceReady()) renderMeme();
      });
    });

    [fontSizeInput, outlineThicknessInput].forEach(input => {
      input.addEventListener('input', () => {
        updateRangeLabels();
        if (sourceReady()) renderMeme();
      });
    });

    generateBtn.addEventListener('click', () => {
      renderMeme();
    });

    downloadBtn.addEventListener('click', () => {
      if (!hasRendered) return;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'meme-generator-output.png';
      link.click();
    });

    function renderTemplateCards() {
      templateGrid.innerHTML = templates.map(template => {
        return '<button type="button" class="template-card" data-source="template" data-template-id="' + template.id + '">' +
          '<span class="template-art" style="' + buildTemplateBackground(template) + '"></span>' +
          '<span class="template-label">' + escapeHtml(template.name) + '</span>' +
        '</button>';
      }).join('') +
      '<button type="button" class="template-card upload-card" data-source="upload">' +
        '<span class="template-art"><span class="upload-icon">⬆</span></span>' +
        '<span class="template-label">Upload your own image</span>' +
      '</button>';
      updateTemplateSelection();
    }

    function buildTemplateBackground(template) {
      const gradient = 'background: linear-gradient(135deg, ' + template.gradient[0] + ', ' + template.gradient[1] + ');';
      const overlay = template.pattern === 'rings'
        ? 'box-shadow: inset 0 0 0 12px rgba(255,255,255,0.05), inset 0 0 0 28px rgba(255,255,255,0.03);'
        : template.pattern === 'grid'
          ? 'background-image: linear-gradient(135deg, ' + template.gradient[0] + ', ' + template.gradient[1] + '), linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px); background-size: cover, 18px 18px, 18px 18px;'
          : '';
      return gradient + overlay;
    }

    function updateTemplateSelection() {
      templateGrid.querySelectorAll('.template-card').forEach(card => {
        const matchesTemplate = activeSource.type === 'template' && card.dataset.templateId === activeSource.value.id;
        const matchesUpload = activeSource.type === 'upload' && card.dataset.source === 'upload';
        card.classList.toggle('active', matchesTemplate || matchesUpload);
      });
    }

    function updateRangeLabels() {
      fontSizeValue.textContent = fontSizeInput.value;
      outlineValue.textContent = outlineThicknessInput.value;
    }

    function renderMeme() {
      const dimensions = getOutputDimensions();
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      drawSource(dimensions.width, dimensions.height);
      drawMemeText(topTextInput.value, 'top');
      drawMemeText(bottomTextInput.value, 'bottom');
      hasRendered = true;
      downloadBtn.disabled = !sourceReady();
      canvasInfo.textContent = dimensions.width + ' × ' + dimensions.height;

      if (activeSource.type === 'upload' && !uploadedImage) {
        setStatus('Select an image file to use the upload option.');
      } else if (activeSource.type === 'upload') {
        setStatus('Preview updated from your uploaded image.');
      } else {
        setStatus('Preview updated from the built-in "' + activeSource.value.name + '" template.');
      }
    }

    function sourceReady() {
      return activeSource.type === 'template' || Boolean(uploadedImage);
    }

    function getOutputDimensions() {
      if (activeSource.type === 'upload' && uploadedImage) {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(uploadedImage.width, uploadedImage.height));
        return {
          width: Math.max(320, Math.round(uploadedImage.width * scale)),
          height: Math.max(320, Math.round(uploadedImage.height * scale))
        };
      }
      return { width: 1200, height: 1200 };
    }

    function drawSource(width, height) {
      ctx.clearRect(0, 0, width, height);
      if (activeSource.type === 'upload') {
        if (uploadedImage) {
          drawCoverImage(uploadedImage, 0, 0, width, height);
        } else {
          drawEmptyState(width, height);
        }
        return;
      }
      drawTemplateScene(activeSource.value, width, height);
    }

    function drawTemplateScene(template, width, height) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, template.gradient[0]);
      gradient.addColorStop(1, template.gradient[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = template.accent;

      if (template.pattern === 'burst') {
        ctx.translate(width / 2, height / 2);
        for (let index = 0; index < 18; index += 1) {
          ctx.rotate(Math.PI / 9);
          ctx.fillRect(-width * 0.04, -height * 0.6, width * 0.08, height * 0.42);
        }
      } else if (template.pattern === 'rings') {
        ctx.lineWidth = width * 0.03;
        ctx.strokeStyle = template.accent;
        for (let radius = width * 0.18; radius <= width * 0.54; radius += width * 0.1) {
          ctx.beginPath();
          ctx.arc(width * 0.58, height * 0.45, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (template.pattern === 'waves') {
        ctx.strokeStyle = template.accent;
        ctx.lineWidth = width * 0.04;
        for (let row = 0; row < 7; row += 1) {
          const y = height * 0.18 + row * height * 0.11;
          ctx.beginPath();
          for (let x = -width * 0.1; x <= width * 1.1; x += width * 0.1) {
            const offset = (row % 2 === 0 ? 1 : -1) * Math.sin(x / width * Math.PI * 2) * height * 0.025;
            if (x === -width * 0.1) {
              ctx.moveTo(x, y + offset);
            } else {
              ctx.lineTo(x, y + offset);
            }
          }
          ctx.stroke();
        }
      } else if (template.pattern === 'diagonal') {
        for (let x = -height; x < width + height; x += width * 0.12) {
          ctx.save();
          ctx.translate(x, 0);
          ctx.rotate(-Math.PI / 5);
          ctx.fillRect(0, 0, width * 0.05, height * 1.4);
          ctx.restore();
        }
      } else if (template.pattern === 'spotlight') {
        const glow = ctx.createRadialGradient(width * 0.35, height * 0.3, width * 0.03, width * 0.35, height * 0.3, width * 0.42);
        glow.addColorStop(0, 'rgba(255,255,255,0.75)');
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        for (let index = 0; index < 18; index += 1) {
          ctx.beginPath();
          ctx.arc(Math.random() * width, Math.random() * height, width * 0.018, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (template.pattern === 'grid') {
        const step = width * 0.08;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        for (let x = 0; x <= width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.88, width * 0.38, height * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawEmptyState(width, height) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.setLineDash([16, 16]);
      ctx.lineWidth = 8;
      ctx.strokeRect(width * 0.12, height * 0.12, width * 0.76, height * 0.76);
      ctx.setLineDash([]);
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.font = '700 ' + Math.round(width / 18) + 'px Inter, Arial, sans-serif';
      ctx.fillText('Upload an image to begin', width / 2, height / 2);
    }

    function drawCoverImage(image, x, y, width, height) {
      const imageRatio = image.width / image.height;
      const frameRatio = width / height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.width;
      let sourceHeight = image.height;

      if (imageRatio > frameRatio) {
        sourceWidth = image.height * frameRatio;
        sourceX = (image.width - sourceWidth) / 2;
      } else {
        sourceHeight = image.width / frameRatio;
        sourceY = (image.height - sourceHeight) / 2;
      }

      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    }

    function drawMemeText(text, position) {
      const content = String(text || '').trim().toUpperCase();
      if (!content) return;

      const maxWidth = canvas.width * 0.9;
      let fontSize = Math.max(24, Math.round(Number(fontSizeInput.value) * canvas.width / 720));
      let lines = [];

      while (fontSize >= 18) {
        ctx.font = '900 ' + fontSize + 'px Impact, "Arial Black", sans-serif';
        lines = wrapText(content, maxWidth);
        const widest = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
        if (widest <= maxWidth && lines.length <= 4) break;
        fontSize -= 2;
      }

      ctx.font = '900 ' + fontSize + 'px Impact, "Arial Black", sans-serif';
      ctx.fillStyle = textColorInput.value;
      ctx.strokeStyle = outlineColorInput.value;
      ctx.lineJoin = 'round';
      ctx.textAlign = 'center';
      ctx.lineWidth = Math.max(2, Number(outlineThicknessInput.value) * canvas.width / 960);
      ctx.miterLimit = 2;

      const lineHeight = fontSize * 1.05;
      const margin = canvas.height * 0.06;
      let startY = position === 'top'
        ? margin + fontSize
        : canvas.height - margin - lineHeight * (lines.length - 1);

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
      });
    }

    function wrapText(text, maxWidth) {
      const words = text.split(/\\s+/).filter(Boolean);
      const lines = [];
      let currentLine = '';

      words.forEach(word => {
        const nextLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
          currentLine = nextLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });

      if (currentLine) lines.push(currentLine);
      return lines.length ? lines : [''];
    }

    function loadImageFile(file) {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('Please choose an image file.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('The selected image could not be decoded.'));
          image.src = reader.result;
        };
        reader.onerror = () => reject(new Error('The file could not be read.'));
        reader.readAsDataURL(file);
      });
    }

    function setStatus(message) {
      statusEl.textContent = message;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  </script>
</body>
</html>`;
}

function htmlHeaders() {
  return { 'Content-Type': 'text/html; charset=UTF-8', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function textHeaders() {
  return { 'Content-Type': 'text/plain; charset=UTF-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json; charset=UTF-8', ...corsHeaders() };
}
