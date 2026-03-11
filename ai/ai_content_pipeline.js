addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (path === '/' && request.method === 'GET') {
    return servePage(url.searchParams.get('example') === '1');
  }

  if (path === '/run' && request.method === 'POST') {
    return handleRun(request);
  }

  return new Response('Not Found', { status: 404, headers: textHeaders() });
}

async function handleRun(request) {
  try {
    const body = await request.json();
    const config = getConfig();
    const exampleMode = Boolean(body?.exampleMode);
    const input = String(body?.input || '').trim() || (exampleMode ? exampleInput() : '');

    if (!input) {
      return jsonResponse({ error: 'Missing input' }, 400);
    }

    const steps = config.steps.filter(step => step.prompt.trim());
    if (!steps.length) {
      return jsonResponse({ error: 'No pipeline steps configured. Set STEP1_PROMPT and STEP2_PROMPT.' }, 500);
    }

    if (!config.apiKey && !exampleMode) {
      return jsonResponse({ error: 'Pipeline not configured: missing OPENAI_API_KEY. Use example mode or add an API key.' }, 500);
    }

    let current = input;
    const results = [];
    for (const step of steps) {
      const source = current;
      current = exampleMode ? runExampleStep(step, current) : await runLiveStep(step, current, config);
      results.push({ step: step.number, title: step.title, prompt: step.prompt, input: source, output: current });
    }

    return jsonResponse({
      pipelineName: config.pipelineName,
      exampleMode,
      input,
      output: current,
      steps: results,
      model: config.model
    }, 200);
  } catch (e) {
    return jsonResponse({ error: e?.message || 'Pipeline run failed' }, 500);
  }
}

async function runLiveStep(step, input, config) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: step.prompt },
        { role: 'user', content: input }
      ]
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Step ${step.number} failed (${response.status}): ${raw.slice(0, 300)}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Step ${step.number} returned invalid JSON`);
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`Step ${step.number} returned an empty response`);
  }

  return content;
}

function runExampleStep(step, input) {
  const lines = input.split(/\n+/).map(line => line.trim()).filter(Boolean);
  if (step.number === 1) {
    return ['Outline:', ...lines.slice(0, 5).map((line, index) => `${index + 1}. ${line.replace(/^[\-•\d.\s]+/, '')}`)].join('\n');
  }
  if (step.number === 2) {
    return `Draft:\n\n${lines.map(line => `• ${line}`).join('\n')}\n\nThis example output demonstrates a local pipeline run without calling an external model.`;
  }
  return `Polished Output:\n\n${input}\n\nEdited for clarity, structure, and readability.`;
}

function servePage(prefillExample) {
  const config = getConfig();
  const initialInput = prefillExample ? exampleInput() : '';
  const status = config.apiKey ? 'Live AI mode is ready.' : 'OPENAI_API_KEY is not configured. Example mode is available.';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.pipelineName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background: linear-gradient(180deg, #eff6ff, #f8fafc); color: #0f172a; padding: 28px 16px; }
    .shell { max-width: 1280px; margin: 0 auto; }
    .hero, .card { background: white; border-radius: 28px; box-shadow: 0 24px 60px rgba(15,23,42,0.08); }
    .hero { padding: 28px; margin-bottom: 20px; }
    .pill { display: inline-block; padding: 8px 12px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 13px; }
    .status { margin-top: 16px; padding: 14px 16px; border-radius: 16px; background: #eff6ff; color: #1d4ed8; }
    .layout { display: grid; grid-template-columns: 1.15fr 0.7fr 1.15fr; gap: 20px; align-items: start; }
    .card { padding: 24px; }
    label { display: block; font-weight: 700; margin-bottom: 10px; }
    textarea { width: 100%; min-height: 360px; resize: vertical; border: 1px solid #cbd5e1; border-radius: 18px; padding: 16px; font: inherit; line-height: 1.6; }
    textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 16px; }
    button { border: none; border-radius: 16px; background: #0f172a; color: white; padding: 14px 18px; font: inherit; font-weight: 700; cursor: pointer; }
    button.secondary { background: #e2e8f0; color: #0f172a; }
    .steps { display: grid; gap: 14px; }
    .step { border: 1px solid #dbeafe; background: #f8fbff; border-radius: 18px; padding: 16px; }
    .step h3 { margin: 0 0 8px; }
    .step p { color: #475569; font-size: 14px; line-height: 1.6; }
    .step-status { color: #2563eb; font-size: 13px; }
    .output { min-height: 360px; border-radius: 18px; background: #0f172a; color: #e2e8f0; padding: 18px; white-space: pre-wrap; line-height: 1.6; overflow-wrap: anywhere; }
    .meta { margin-top: 14px; color: #64748b; font-size: 13px; }
    .error { display: none; margin-top: 16px; padding: 14px 16px; border-radius: 16px; background: #fee2e2; color: #991b1b; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } textarea, .output { min-height: 240px; } }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div class="pill">Chain up to 3 AI prompts</div>
      <h1>${escapeHtml(config.pipelineName)}</h1>
      <p>Use a single Worker route to turn source notes into structured output. Each step feeds the next, making it easy to build outline → draft → polish flows.</p>
      <div class="status">${escapeHtml(status)}</div>
    </section>
    <div class="layout">
      <section class="card">
        <label for="inputText">${escapeHtml(config.inputLabel)}</label>
        <textarea id="inputText" placeholder="Paste notes, rough copy, or source material here...">${escapeHtml(initialInput)}</textarea>
        <div class="controls">
          <button id="runButton" type="button">Run pipeline</button>
          <button id="exampleButton" type="button" class="secondary">Load example</button>
          <label><input id="exampleToggle" type="checkbox" ${prefillExample ? 'checked' : ''}> Example mode</label>
        </div>
        <div class="error" id="errorBox"></div>
      </section>
      <section class="card">
        <h2>Step progress</h2>
        <div class="steps">
          ${config.steps.filter(step => step.prompt.trim()).map(step => `<div class="step" id="step-${step.number}"><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.prompt)}</p><div class="step-status">Waiting to run</div></div>`).join('')}
        </div>
      </section>
      <section class="card">
        <label>${escapeHtml(config.outputLabel)}</label>
        <div class="output" id="outputPanel">Run the pipeline to see step-by-step results.</div>
        <div class="controls"><button id="copyButton" type="button" class="secondary">Copy output</button></div>
        <div class="meta" id="metaLine">Model: ${escapeHtml(config.model)}</div>
      </section>
    </div>
  </div>
  <script>
    const inputText = document.getElementById('inputText');
    const runButton = document.getElementById('runButton');
    const exampleButton = document.getElementById('exampleButton');
    const exampleToggle = document.getElementById('exampleToggle');
    const outputPanel = document.getElementById('outputPanel');
    const metaLine = document.getElementById('metaLine');
    const errorBox = document.getElementById('errorBox');
    const exampleText = ${JSON.stringify(exampleInput())};

    function setError(message) {
      errorBox.textContent = message;
      errorBox.style.display = message ? 'block' : 'none';
    }

    function resetSteps() {
      document.querySelectorAll('.step-status').forEach(node => { node.textContent = 'Waiting to run'; });
    }

    runButton.addEventListener('click', async () => {
      setError('');
      resetSteps();
      outputPanel.textContent = 'Running pipeline...';
      runButton.disabled = true;
      try {
        const response = await fetch('/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: inputText.value, exampleMode: exampleToggle.checked })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Pipeline run failed');
        data.steps.forEach(step => {
          const status = document.querySelector('#step-' + step.step + ' .step-status');
          if (status) status.textContent = 'Completed';
        });
        outputPanel.textContent = data.output || '';
        metaLine.textContent = (data.exampleMode ? 'Example mode' : 'Live AI mode') + ' • ' + data.steps.length + ' step(s) • Model: ' + (data.model || 'default');
      } catch (error) {
        outputPanel.textContent = 'Run failed.';
        setError(error.message || 'Unable to run pipeline.');
      } finally {
        runButton.disabled = false;
      }
    });

    exampleButton.addEventListener('click', () => {
      inputText.value = exampleText;
      exampleToggle.checked = true;
      setError('');
    });

    document.getElementById('copyButton').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(outputPanel.textContent || '');
        metaLine.textContent = 'Output copied to clipboard.';
      } catch (_) {
        metaLine.textContent = 'Copy failed in this browser.';
      }
    });
  </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: htmlHeaders() });
}

function getConfig() {
  return {
    pipelineName: getStringBinding('PIPELINE_NAME', 'AI Content Pipeline'),
    inputLabel: getStringBinding('INPUT_LABEL', 'Input'),
    outputLabel: getStringBinding('OUTPUT_LABEL', 'Final Output'),
    apiKey: getStringBinding('OPENAI_API_KEY'),
    baseUrl: getStringBinding('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    model: getStringBinding('MODEL', 'gpt-4o-mini'),
    steps: [
      { number: 1, title: 'Step 1', prompt: getStringBinding('STEP1_PROMPT', 'You are a strategist. Convert the input into a concise outline with clear sections.') },
      { number: 2, title: 'Step 2', prompt: getStringBinding('STEP2_PROMPT', 'You are a writer. Expand the outline into a polished first draft.') },
      { number: 3, title: 'Step 3', prompt: getStringBinding('STEP3_PROMPT', '') }
    ]
  };
}

function exampleInput() {
  return 'Launch notes:\n- New AI workspace for small teams\n- Shared prompts, version history, and approvals\n- Main pain point: scattered docs and slow content review\n- Goal: turn feature notes into a launch-ready blog post and email';
}

function getStringBinding(name, fallback = '') {
  const value = typeof globalThis[name] === 'undefined' ? fallback : globalThis[name];
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders() });
}

function htmlHeaders() {
  return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
