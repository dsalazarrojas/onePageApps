import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

test('new public pages and bridge assets exist', () => {
  [
    'generate.html',
    'success.html',
    'assets/bridge.js',
    'assets/site-shared.js',
    'docs/assets/bridge.js',
    'docs/assets/site-shared.js',
    'scripts/publish.sh',
    'MINIAPPS_SITE_TODO.md'
  ].forEach((relativePath) => assert.equal(exists(relativePath), true, `${relativePath} should exist`));
});

test('generate page exposes prompt, editor, validation, and deploy controls', () => {
  const html = read('generate.html');
  [
    'id="prompt-input"',
    'id="template-select"',
    'id="code-output"',
    'id="validate-btn"',
    'id="open-byo-modal"',
    'id="deploy-gic-btn"',
    'assets/bridge.js'
  ].forEach((snippet) => assert.ok(html.includes(snippet), `Expected generate.html to include ${snippet}`));
});

test('success page verifies Stripe sessions and stores auth state', () => {
  const html = read('success.html');
  [
    'session_id',
    'state_token',
    'verifyStripeSession',
    'setJwt',
    'id="result-card"'
  ].forEach((snippet) => assert.ok(html.includes(snippet), `Expected success.html to include ${snippet}`));
});

test('browse and preview pages include deploy affordances', () => {
  const browseHtml = read('browse.html');
  const previewHtml = read('preview.html');

  assert.ok(browseHtml.includes('deploy-app-btn'), 'browse.html should render deploy buttons');
  assert.ok(browseHtml.includes('id="deploy-modal"'), 'browse.html should include the deploy modal');
  assert.ok(previewHtml.includes('id="deploy-byo-btn"'), 'preview.html should include BYO deploy CTA');
  assert.ok(previewHtml.includes('id="deploy-gic-btn"'), 'preview.html should include GIC deploy CTA');
  assert.ok(previewHtml.includes('id="deploy-panel"'), 'preview.html should expose a deploy anchor');
});

test('analytics markers and generated category deploy links exist', () => {
  const indexHtml = read('index.html');
  const generateHtml = read('generate.html');
  const previewHtml = read('preview.html');
  const browseHtml = read('browse.html');
  const aiCategoryHtml = read('categories/ai.html');

  [
    'generate_cta_click',
    'deploy_cta_click',
    'app_generate',
    'app_deploy_byo',
    'app_deploy_gic',
    'app_view'
  ].forEach((marker) => {
    assert.ok(
      indexHtml.includes(marker) ||
        generateHtml.includes(marker) ||
        previewHtml.includes(marker) ||
        browseHtml.includes(marker),
      `Expected to find analytics marker ${marker}`
    );
  });

  assert.ok(aiCategoryHtml.includes('#deploy-panel'), 'generated category pages should link to deploy panel');
  assert.ok(aiCategoryHtml.includes('>Generate<'), 'generated category pages should include Generate nav');
});

test('pricing, docs, and new-badge plumbing are present', () => {
  const indexHtml = read('index.html');
  const aboutHtml = read('about.html');
  const localPipeline = read('LOCAL_PIPELINE.md');
  const publishScript = read('scripts/publish.sh');
  const browseHtml = read('browse.html');

  assert.ok(indexHtml.includes('id="pricing"'), 'index.html should include the pricing section');
  assert.ok(aboutHtml.includes('`POST /api/keys/create`'), 'about.html should document API routes');
  assert.ok(localPipeline.includes('./scripts/publish.sh'), 'LOCAL_PIPELINE.md should document publish.sh');
  assert.ok(publishScript.includes('node scripts/generate_index.js'), 'publish.sh should run generate_index.js');
  assert.ok(publishScript.includes('node scripts/generate_categories.js'), 'publish.sh should run generate_categories.js');
  assert.ok(browseHtml.includes('isNewApp(app.addedAt)'), 'browse.html should render New badges from addedAt');
});

test('shared assets are mirrored to docs/assets', () => {
  assert.equal(read('assets/site-shared.js'), read('docs/assets/site-shared.js'));
  assert.equal(read('assets/bridge.js'), read('docs/assets/bridge.js'));
});

test('generated manifest and sitemap include new metadata and routes', () => {
  const manifest = JSON.parse(read('docs/apps-index.json'));
  assert.ok(Array.isArray(manifest.apps) && manifest.apps.length > 0, 'apps-index.json should contain apps');
  assert.ok(manifest.apps.every((app) => Object.prototype.hasOwnProperty.call(app, 'addedAt')), 'each app should have addedAt metadata');

  const sitemap = read('sitemap.xml');
  assert.ok(sitemap.includes('/generate.html'), 'sitemap should include generate.html');
  assert.ok(sitemap.includes('/success.html'), 'sitemap should include success.html');
});

test('inline page scripts parse without syntax errors', () => {
  const pages = ['index.html', 'browse.html', 'preview.html', 'generate.html', 'success.html', 'about.html'];
  const regex = /<script\b(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;

  pages.forEach((page) => {
    const html = read(page);
    let match;
    let index = 0;
    while ((match = regex.exec(html)) !== null) {
      const attrs = match[1] || '';
      const source = match[2];
      if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) {
        continue;
      }
      new vm.Script(source, { filename: `${page}#inline-script-${index}` });
      index += 1;
    }
    assert.ok(index > 0, `${page} should include at least one inline script`);
  });
});
