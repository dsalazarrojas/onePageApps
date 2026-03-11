(function () {
  function unique(values) {
    return [...new Set(values.filter(Boolean))];
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

  window.OnePageAppsShared = {
    unique,
    fetchFromCandidates,
    fetchAppsIndex
  };
})();
