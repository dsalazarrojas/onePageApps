(function () {
  const DEFAULT_BRIDGE_URL = 'https://onepageapps-bridge.dsalazar.workers.dev';

  const STORAGE_KEYS = Object.freeze({
    bridgeUrl: 'opa-bridge-url',
    jwt: 'opa-jwt',
    cloudflareDraft: 'opa-cloudflare-draft',
    byoLlmDraft: 'opa-byo-llm-draft',
    generatedScript: 'opa-generated-script',
    generatedPrompt: 'opa-generated-prompt'
  });

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function normalizeBridgeUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  async function fetchFromCandidates(candidates, responseType = 'json') {
    let lastError = new Error('Unable to load resource');
    for (const candidate of unique(candidates)) {
      try {
        const response = await fetch(candidate, { cache: 'no-store' });
        if (!response.ok) {
          lastError = new Error(`HTTP ${response.status} for ${candidate}`);
          continue;
        }
        return responseType === 'text' ? response.text() : response.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  async function fetchAppsIndex(primary) {
    const primaryValue = primary || '/docs/apps-index.json';
    return fetchFromCandidates([
      primaryValue,
      '/docs/apps-index.json',
      'docs/apps-index.json',
      './docs/apps-index.json',
      './apps-index.json',
      'apps-index.json',
      '../docs/apps-index.json'
    ], 'json');
  }

  function getBridgeUrl() {
    return normalizeBridgeUrl(localStorage.getItem(STORAGE_KEYS.bridgeUrl) || DEFAULT_BRIDGE_URL);
  }

  function requireBridgeUrl() {
    const bridgeUrl = getBridgeUrl();
    if (!bridgeUrl) {
      throw new Error(
        'The onePageApps bridge worker is not configured yet. Deploy onePageAppsPrivate, then set DEFAULT_BRIDGE_URL or localStorage["opa-bridge-url"].'
      );
    }
    return bridgeUrl;
  }

  function safeJsonParse(value, fallback = null) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function decodeBase64Url(segment) {
    const normalized = String(segment || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(String(segment || '').length / 4) * 4, '=');
    return atob(normalized);
  }

  function getJwtPayload(token) {
    const value = String(token || '').trim();
    if (!value) return null;
    const parts = value.split('.');
    if (parts.length !== 3) return null;
    try {
      return JSON.parse(decodeBase64Url(parts[1]));
    } catch (_) {
      return null;
    }
  }

  function getUserTier(token) {
    const payload = getJwtPayload(token || localStorage.getItem(STORAGE_KEYS.jwt));
    const tier = String(payload?.plan || payload?.tier || 'free').toLowerCase();
    return ['business', 'pro'].includes(tier) ? tier : 'free';
  }

  function isPaidTier(token) {
    return getUserTier(token) !== 'free';
  }

  function isNewApp(addedAt, days = 30) {
    if (!addedAt) return false;
    const addedTime = Date.parse(addedAt);
    if (!Number.isFinite(addedTime)) return false;
    return (Date.now() - addedTime) <= days * 24 * 60 * 60 * 1000;
  }

  function formatDate(value) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return '';
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(parsed));
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(value || ''));
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = String(value || '');
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  function track(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  }

  window.OnePageAppsShared = {
    DEFAULT_BRIDGE_URL,
    STORAGE_KEYS,
    unique,
    normalizeBridgeUrl,
    fetchFromCandidates,
    fetchAppsIndex,
    getBridgeUrl,
    requireBridgeUrl,
    safeJsonParse,
    getJwtPayload,
    getUserTier,
    isPaidTier,
    isNewApp,
    formatDate,
    copyText,
    track
  };
})();
