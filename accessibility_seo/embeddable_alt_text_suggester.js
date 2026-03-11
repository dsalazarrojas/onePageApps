addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (url.pathname === '/' && request.method === 'GET') {
    return servePage();
  }

  if (url.pathname === '/suggest' && request.method === 'POST') {
    return handleSuggest(request);
  }

  if (url.pathname === '/health' && request.method === 'GET') {
    return jsonResponse({ ok: true, hasAI: Boolean(getStringBinding('OPENAI_API_KEY')) }, 200);
  }

  return new Response('Not Found', { status: 404, headers: htmlHeaders() });
}

async function handleSuggest(request) {
  try {
    const apiKey = getStringBinding('OPENAI_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'Missing OPENAI_API_KEY. Add an AI provider before using this worker.' }, 500);
    }

    const baseUrl = getStringBinding('OPENAI_BASE_URL', 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = getStringBinding('MODEL', getStringBinding('OPENAI_MODEL', 'gpt-4o-mini'));
    const payload = await readRequestPayload(request);
    const style = normalizeStyle(payload.style);
    const prompt = buildPrompt({ style, keywords: payload.keywords, context: payload.context, pageTitle: payload.pageTitle });
    const imageInput = await buildImageInput(payload);

    if (!imageInput) {
      return jsonResponse({ error: 'Provide an uploaded image, a remote image URL, or a data URL.' }, 400);
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You write accessible, specific alt text for real websites. Return only the alt text sentence without bullets or labels.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              imageInput
            ]
          }
        ]
      })
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      return jsonResponse({ error: `Vision request failed (${upstream.status})`, details: raw.slice(0, 400) }, 502);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return jsonResponse({ error: 'AI provider returned invalid JSON.' }, 502);
    }

    const altText = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!altText) {
      return jsonResponse({ error: 'AI provider returned an empty alt text suggestion.' }, 502);
    }

    return jsonResponse({ altText, style, model }, 200);
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Suggestion failed.' }, 500);
  }
}

function servePage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Embeddable Alt Text Suggester</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: radial-gradient(circle at top, rgba(14,165,233,.18), transparent 30%), #020617; color: #e2e8f0; }
    .page { max-width: 1040px; margin: 0 auto; padding: 28px 18px 56px; }
    .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
    .card { background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(148,163,184,.18); border-radius: 28px; padding: 26px; box-shadow: 0 24px 50px rgba(2,6,23,.42); }
    h1 { margin: 0 0 12px; font-size: clamp(2.1rem, 5vw, 3.6rem); line-height: 1.02; }
    p { color: #cbd5e1; line-height: 1.7; }
    label { display: grid; gap: 8px; margin-top: 14px; font-size: 14px; color: #cbd5e1; }
    input, textarea, select, button { width: 100%; border-radius: 16px; font: inherit; padding: 12px 14px; }
    input, textarea, select { border: 1px solid rgba(148,163,184,.28); background: rgba(15,23,42,.84); color: #e2e8f0; }
    textarea { min-height: 110px; resize: vertical; }
    button { border: none; background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; font-weight: 700; cursor: pointer; margin-top: 16px; }
    .preview { min-height: 240px; border-radius: 20px; border: 1px dashed rgba(148,163,184,.28); display: grid; place-items: center; overflow: hidden; background: rgba(15,23,42,.55); color: #94a3b8; }
    .preview img { display: block; width: 100%; height: auto; }
    .result { display: none; margin-top: 16px; padding: 16px; border-radius: 18px; background: rgba(30, 41, 59, 0.86); }
    .error { background: rgba(127, 29, 29, 0.32); color: #fecaca; }
    .copy { margin-top: 12px; background: rgba(59,130,246,.16); }
    @media (max-width: 860px) { .hero { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <article class="card">
        <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(6,182,212,.16);color:#a5f3fc;font-size:13px;">Vision-powered accessibility</div>
        <h1>Generate embeddable alt text suggestions.</h1>
        <p>Upload an image or reference a live asset URL, choose the writing style, and get alt text you can paste straight into your CMS or frontend. The worker uses an OpenAI-compatible vision endpoint configured through the app runtime.</p>
        <label>Image upload
          <input id="image" type="file" accept="image/*">
        </label>
        <label>Or image URL
          <input id="imageUrl" type="url" placeholder="https://example.com/product-shot.jpg">
        </label>
        <label>Style
          <select id="style">
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
            <option value="decorative">Decorative / purely visual</option>
          </select>
        </label>
        <label>Optional SEO keywords
          <input id="keywords" type="text" placeholder="linen shirt, summer capsule wardrobe">
        </label>
        <label>Optional page context
          <textarea id="context" placeholder="This image appears in a PDP hero block for a lightweight travel shirt."></textarea>
        </label>
        <button id="submitButton" type="button">Suggest alt text</button>
        <div id="result" class="result"></div>
        <div id="error" class="result error"></div>
        <button id="copyButton" class="copy" type="button" style="display:none;">Copy suggestion</button>
      </article>
      <aside class="card">
        <div class="preview" id="preview">Preview will appear here.</div>
        <p style="margin-top:16px;">Tip: keep decorative images brief, and avoid starting with “image of” unless your editorial style guide requires it.</p>
      </aside>
    </section>
  </main>
  <script>
    const imageInput = document.getElementById('image');
    const imageUrlInput = document.getElementById('imageUrl');
    const preview = document.getElementById('preview');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const copyButton = document.getElementById('copyButton');
    const submitButton = document.getElementById('submitButton');

    function setPreviewFromUrl(url) {
      if (!url) {
        preview.innerHTML = 'Preview will appear here.';
        return;
      }
      preview.innerHTML = '<img src=\"' + url + '\" alt=\"Preview\">';
    }

    imageInput.addEventListener('change', () => {
      const [file] = imageInput.files;
      if (!file) return setPreviewFromUrl('');
      const reader = new FileReader();
      reader.onload = () => setPreviewFromUrl(reader.result);
      reader.readAsDataURL(file);
    });
    imageUrlInput.addEventListener('input', () => {
      if (!imageInput.files.length) setPreviewFromUrl(imageUrlInput.value.trim());
    });

    submitButton.addEventListener('click', async () => {
      result.style.display = 'none';
      error.style.display = 'none';
      copyButton.style.display = 'none';
      submitButton.disabled = true;
      try {
        const formData = new FormData();
        if (imageInput.files[0]) formData.append('image', imageInput.files[0]);
        if (imageUrlInput.value.trim()) formData.append('imageUrl', imageUrlInput.value.trim());
        formData.append('style', document.getElementById('style').value);
        formData.append('keywords', document.getElementById('keywords').value.trim());
        formData.append('context', document.getElementById('context').value.trim());
        const response = await fetch('/suggest', { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Suggestion failed');
        result.textContent = data.altText;
        result.style.display = 'block';
        copyButton.style.display = 'block';
      } catch (err) {
        error.textContent = err.message || 'Suggestion failed';
        error.style.display = 'block';
      } finally {
        submitButton.disabled = false;
      }
    });

    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(result.textContent || '');
    });
  </script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: htmlHeaders() });
}

async function readRequestPayload(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return {
      file: formData.get('image'),
      imageUrl: String(formData.get('imageUrl') || '').trim(),
      imageData: String(formData.get('imageData') || '').trim(),
      style: String(formData.get('style') || '').trim(),
      keywords: String(formData.get('keywords') || '').trim(),
      context: String(formData.get('context') || '').trim(),
      pageTitle: String(formData.get('pageTitle') || '').trim()
    };
  }

  const body = await request.json();
  return {
    file: null,
    imageUrl: String(body?.imageUrl || '').trim(),
    imageData: String(body?.imageData || '').trim(),
    style: String(body?.style || '').trim(),
    keywords: String(body?.keywords || '').trim(),
    context: String(body?.context || '').trim(),
    pageTitle: String(body?.pageTitle || '').trim()
  };
}

async function buildImageInput(payload) {
  if (payload.file instanceof File) {
    const bytes = new Uint8Array(await payload.file.arrayBuffer());
    const mime = payload.file.type || 'image/jpeg';
    return {
      type: 'image_url',
      image_url: { url: `data:${mime};base64,${bytesToBase64(bytes)}` }
    };
  }

  if (payload.imageData) {
    const dataUrl = payload.imageData.startsWith('data:') ? payload.imageData : `data:image/jpeg;base64,${payload.imageData}`;
    return { type: 'image_url', image_url: { url: dataUrl } };
  }

  if (payload.imageUrl && /^https?:\/\//i.test(payload.imageUrl)) {
    return { type: 'image_url', image_url: { url: payload.imageUrl } };
  }

  return null;
}

function buildPrompt({ style, keywords, context, pageTitle }) {
  const styleInstruction = {
    concise: 'Keep the alt text to one crisp sentence under 20 words.',
    detailed: 'Write one descriptive sentence with useful detail, but keep it accessible and under 35 words.',
    decorative: 'Treat the image as decorative or lightly supportive; keep the alt text very brief unless meaningful content appears.'
  }[style] || 'Keep the alt text concise and accessible.';

  const parts = [
    styleInstruction,
    'Describe only what is verifiably visible in the image.',
    'Avoid phrases like “image of” or “picture of”.',
    keywords ? `If relevant and truthful, naturally incorporate these keywords: ${keywords}.` : '',
    context ? `Page context: ${context}.` : '',
    pageTitle ? `Page title: ${pageTitle}.` : ''
  ].filter(Boolean);

  return parts.join(' ');
}

function normalizeStyle(value) {
  return ['concise', 'detailed', 'decorative'].includes(value) ? value : 'concise';
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function getStringBinding(name, fallback = '') {
  const value = globalThis[name];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() };
}

function htmlHeaders() {
  return { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
