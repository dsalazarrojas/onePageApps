(function () {
  const shared = window.OnePageAppsShared || {};
  const STORAGE_KEYS = shared.STORAGE_KEYS || {};

  function getStoredJson(key, fallback) {
    return shared.safeJsonParse?.(localStorage.getItem(key), fallback) ?? fallback;
  }

  function setStoredJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getJwt() {
    return localStorage.getItem(STORAGE_KEYS.jwt || 'opa-jwt') || '';
  }

  function setJwt(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.jwt || 'opa-jwt', token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.jwt || 'opa-jwt');
    }
  }

  function clearJwt() {
    localStorage.removeItem(STORAGE_KEYS.jwt || 'opa-jwt');
  }

  async function ensureAnonSession() {
    const token = getJwt();
    const payload = shared.getJwtPayload?.(token);
    if (payload?.sub && Number(payload.exp) > (Date.now() / 1000) + 60) {
      return token;
    }

    try {
      const bridgeUrl = shared.requireBridgeUrl();
      const response = await fetch(`${bridgeUrl}/auth/csrf`, { method: 'POST' });
      const data = await response.json();
      if (data?.anonToken) {
        setJwt(data.anonToken);
        return data.anonToken;
      }
    } catch (_) {
      // Let the authenticated request surface its usual error to the caller.
    }

    return getJwt();
  }

  function friendlyErrorMessage(error) {
    if (error?.status === 429) return "You're deploying too quickly — wait a moment and try again.";
    if (error?.status === 402) return "You've reached the free plan's limit.";
    if (error?.status === 401) return 'Your session expired — please try again.';
    if (!error?.status) return "Couldn't reach the deploy service — check your connection and try again.";
    const message = String(error?.message || '').trim();
    return message && !message.startsWith('{') ? message : 'Deploy failed — please try again.';
  }

  function getUserTier() {
    return shared.getUserTier?.(getJwt()) || 'free';
  }

  function getCloudflareDraft() {
    return getStoredJson(STORAGE_KEYS.cloudflareDraft || 'opa-cloudflare-draft', {
      cfAccountId: '',
      cfApiToken: '',
      scriptName: ''
    });
  }

  function setCloudflareDraft(value) {
    setStoredJson(STORAGE_KEYS.cloudflareDraft || 'opa-cloudflare-draft', {
      ...getCloudflareDraft(),
      ...(value || {})
    });
  }

  function getByoLlmDraft() {
    return getStoredJson(STORAGE_KEYS.byoLlmDraft || 'opa-byo-llm-draft', {
      byoKey: '',
      byoBaseURL: ''
    });
  }

  function setByoLlmDraft(value) {
    setStoredJson(STORAGE_KEYS.byoLlmDraft || 'opa-byo-llm-draft', {
      ...getByoLlmDraft(),
      ...(value || {})
    });
  }

  async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const data = contentType.includes('application/json')
      ? (shared.safeJsonParse?.(text, null) ?? null)
      : null;

    if (!response.ok) {
      const message = data?.error || data?.message || text || `HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data ?? { ok: true, text };
  }

  async function requestJson(endpoint, options = {}) {
    const bridgeUrl = shared.requireBridgeUrl();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const jwt = options.jwt ?? getJwt();
    if (jwt && options.includeAuth !== false) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    if (options.csrfToken) {
      headers['X-CSRF-Token'] = options.csrfToken;
    }
    if (options.apiKey) {
      headers['X-GIC-API-Key'] = options.apiKey;
    }

    const response = await fetch(`${bridgeUrl}${endpoint}`, {
      method: options.method || 'POST',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal
    });

    return parseResponse(response);
  }

  function emitSseEvent(buffer, handlers) {
    const lines = buffer.split('\n');
    let eventName = 'message';
    const dataLines = [];

    lines.forEach((line) => {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim() || 'message';
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    });

    const rawData = dataLines.join('\n');
    const data = shared.safeJsonParse?.(rawData, rawData) ?? rawData;

    if (eventName === 'chunk' && handlers.onChunk) handlers.onChunk(data);
    if (eventName === 'status' && handlers.onStatus) handlers.onStatus(data);
    if (eventName === 'final' && handlers.onFinal) handlers.onFinal(data);
    if (eventName === 'error' && handlers.onError) handlers.onError(data);
  }

  async function streamJson(endpoint, body, handlers = {}) {
    await ensureAnonSession();
    const bridgeUrl = shared.requireBridgeUrl();
    const response = await fetch(`${bridgeUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(getJwt() ? { Authorization: `Bearer ${getJwt()}` } : {})
      },
      body: JSON.stringify(body || {}),
      signal: handlers.signal
    });

    if (!response.ok || !response.body) {
      await parseResponse(response);
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';

    while (true) {
      const result = await reader.read();
      if (result.done) break;
      pending += decoder.decode(result.value, { stream: true });
      const parts = pending.split('\n\n');
      pending = parts.pop() || '';
      parts.forEach((chunk) => {
        if (chunk.trim()) emitSseEvent(chunk, handlers);
      });
    }

    if (pending.trim()) {
      emitSseEvent(pending, handlers);
    }
    return null;
  }

  function getGeneratedScript() {
    return sessionStorage.getItem(STORAGE_KEYS.generatedScript || 'opa-generated-script') || '';
  }

  function setGeneratedScript(script) {
    sessionStorage.setItem(STORAGE_KEYS.generatedScript || 'opa-generated-script', String(script || ''));
  }

  function getGeneratedPrompt() {
    return sessionStorage.getItem(STORAGE_KEYS.generatedPrompt || 'opa-generated-prompt') || '';
  }

  function setGeneratedPrompt(prompt) {
    sessionStorage.setItem(STORAGE_KEYS.generatedPrompt || 'opa-generated-prompt', String(prompt || ''));
  }

  async function validateWorker(workerJs) {
    return requestJson('/validate', {
      body: { workerJs },
      includeAuth: false
    });
  }

  async function deployByo(payload) {
    return requestJson('/deploy/byo', {
      body: payload,
      includeAuth: false
    });
  }

  async function deployGic(payload) {
    await ensureAnonSession();
    return requestJson('/deploy/gic', {
      body: payload
    });
  }

  async function startCheckout(plan, billing = 'monthly') {
    return requestJson('/stripe/checkout', {
      body: { plan, billing }
    });
  }

  async function verifyStripeSession(sessionId, stateToken) {
    return requestJson('/stripe/verify', {
      body: { sessionId, stateToken },
      includeAuth: false
    });
  }

  async function renewJwt() {
    return requestJson('/stripe/renew', { body: {} });
  }

  async function openBillingPortal(returnUrl) {
    return requestJson('/stripe/portal', {
      body: { returnUrl }
    });
  }

  async function listHostedApps() {
    return requestJson('/apps/list', { body: {} });
  }

  async function deleteHostedApp(slug) {
    return requestJson('/apps/delete', { body: { slug } });
  }

  async function listApiKeys(csrfToken) {
    return requestJson('/api/keys/list', {
      body: {},
      csrfToken
    });
  }

  async function createApiKey(payload, csrfToken) {
    return requestJson('/api/keys/create', {
      body: payload,
      csrfToken
    });
  }

  async function revokeApiKey(keyId, csrfToken) {
    return requestJson('/api/keys/revoke', {
      body: { keyId },
      csrfToken
    });
  }

  window.OnePageAppsBridge = {
    getJwt,
    setJwt,
    clearJwt,
    ensureAnonSession,
    friendlyErrorMessage,
    getUserTier,
    getCloudflareDraft,
    setCloudflareDraft,
    getByoLlmDraft,
    setByoLlmDraft,
    getGeneratedScript,
    setGeneratedScript,
    getGeneratedPrompt,
    setGeneratedPrompt,
    requestJson,
    streamJson,
    validateWorker,
    deployByo,
    deployGic,
    startCheckout,
    verifyStripeSession,
    renewJwt,
    openBillingPortal,
    listHostedApps,
    deleteHostedApp,
    listApiKeys,
    createApiKey,
    revokeApiKey,
    track: shared.track || function () {}
  };
})();
