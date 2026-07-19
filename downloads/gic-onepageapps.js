#!/usr/bin/env node
/**
 * GIC OnePageApps CLI — programmatic access to the OnePageApps Bridge Worker
 *
 * Usage (as CLI):
 *   GIC_API_KEY=opa_live_xxx node cli/gic-onepageapps.js createApp "A wedding countdown page" > app.js
 *   GIC_API_KEY=opa_live_xxx node cli/gic-onepageapps.js validate app.js
 *   GIC_API_KEY=opa_live_xxx node cli/gic-onepageapps.js deployGic app.js --title "Wedding countdown"
 *   node cli/gic-onepageapps.js cfSetup            # one-time BYO Cloudflare onboarding
 *   node cli/gic-onepageapps.js deployByo app.js --name wedding-countdown
 *
 * Environment variables:
 *   GIC_API_KEY     — GIC API key (opa_live_* subscriber/gift, gic_admin_* admin)
 *   GIC_BRIDGE_URL  — optional: override bridge URL (default: production worker)
 *   CF_ACCOUNT_ID   — BYO deploys: your Cloudflare account id
 *   CF_API_TOKEN    — BYO deploys: token with Workers Scripts:Edit
 *
 * Falls back to ~/.config/gic/credentials.json:
 *   { "gicApiKey": { "onepageapps": "opa_live_..." },
 *     "cloudflare": { "accountId": "...", "apiToken": "..." } }
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_BRIDGE_URL = 'https://onepageapps-bridge.dsalazar.workers.dev';

const CREDS_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.config', 'gic', 'credentials.json'
);

function getBridgeUrl() {
  return (process.env.GIC_BRIDGE_URL || DEFAULT_BRIDGE_URL).replace(/\/$/, '');
}

function readCredsFile() {
  try {
    return JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeCredsFile(update) {
  const current = readCredsFile() || {};
  const next = { ...current, ...update };
  fs.mkdirSync(path.dirname(CREDS_FILE), { recursive: true });
  fs.writeFileSync(CREDS_FILE, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
  fs.chmodSync(CREDS_FILE, 0o600);
  return CREDS_FILE;
}

function getApiKey() {
  if (process.env.GIC_API_KEY) return process.env.GIC_API_KEY;
  const creds = readCredsFile();
  return (creds && creds.gicApiKey && creds.gicApiKey.onepageapps) || '';
}

function getCloudflareCreds() {
  const creds = readCredsFile();
  return {
    accountId: process.env.CF_ACCOUNT_ID || (creds && creds.cloudflare && creds.cloudflare.accountId) || '',
    apiToken: process.env.CF_API_TOKEN || (creds && creds.cloudflare && creds.cloudflare.apiToken) || ''
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper (Node.js built-in only — no npm dependencies)
// ─────────────────────────────────────────────────────────────────────────────

function request(method, urlString, body, headers) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
    const url = new URL(urlString);
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(parsed.error || parsed.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.data = parsed;
            reject(err);
          } else {
            resolve(parsed);
          }
        } catch (_) {
          if (res.statusCode >= 400) {
            const err = new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`);
            err.status = res.statusCode;
            reject(err);
          } else {
            resolve({ raw: data });
          }
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function bridgePost(pathName, body, apiKey) {
  const key = apiKey || getApiKey();
  if (!key) {
    return Promise.reject(new Error(
      'No GIC API key found. Set GIC_API_KEY, or add it to ' +
      '~/.config/gic/credentials.json under {"gicApiKey":{"onepageapps":"opa_live_..."}}.\n' +
      'Get a key from OnePageApps → API Keys (Pro/Business), or ask the admin for a gift key.'
    ));
  }
  const header = key.startsWith('gic_admin_') ? { 'X-GIC-Admin-Key': key } : { 'X-GIC-API-Key': key };
  return request('POST', `${getBridgeUrl()}${pathName}`, body, header);
}

function readWorkerFile(file) {
  if (file === '-') return fs.readFileSync(0, 'utf8');
  return fs.readFileSync(file, 'utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
// Core commands
// ─────────────────────────────────────────────────────────────────────────────

async function createApp(prompt, apiKey) {
  return bridgePost('/ai/create', { prompt }, apiKey);
}

async function editApp(file, instruction, apiKey) {
  const workerJs = readWorkerFile(file);
  return bridgePost('/ai/edit', { workerJs, instruction }, apiKey);
}

async function validate(file, apiKey) {
  const workerJs = readWorkerFile(file);
  return bridgePost('/validate', { workerJs }, apiKey);
}

async function deployGic(file, { title, templateId } = {}, apiKey) {
  const workerJs = readWorkerFile(file);
  return bridgePost('/deploy/gic', { workerJs, title: title || 'Generated App', templateId }, apiKey);
}

async function deployByo(file, { name } = {}, apiKey) {
  const workerJs = readWorkerFile(file);
  const { accountId, apiToken } = getCloudflareCreds();
  if (!accountId || !apiToken) {
    throw new Error(
      'No Cloudflare credentials found. Run `cfSetup` once, or set CF_ACCOUNT_ID and CF_API_TOKEN.\n' +
      'Your credentials are sent only with this deploy request and are never stored by GIC.'
    );
  }
  return bridgePost('/deploy/byo', {
    cfAccountId: accountId,
    cfApiToken: apiToken,
    scriptName: name || 'onepageapp-worker',
    workerJs
  }, apiKey);
}

async function listApps(apiKey) {
  return bridgePost('/apps/list', {}, apiKey);
}

async function deleteApp(slug, apiKey) {
  return bridgePost('/apps/delete', { slug }, apiKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// BYO Cloudflare onboarding (cfSetup)
// ─────────────────────────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

async function verifyCloudflareCreds(accountId, apiToken) {
  return request('GET', `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, null, {
    Authorization: `Bearer ${apiToken}`
  });
}

async function cfSetup() {
  process.stdout.write(
    '\nBYO Cloudflare setup (one time). Your credentials stay on this machine\n' +
    'in ~/.config/gic/credentials.json and are sent only to Cloudflare\'s API\n' +
    'via the GIC bridge at deploy time. GIC never stores them server-side.\n\n' +
    'If you do not have a Cloudflare account yet (free is enough):\n' +
    '  1. Sign up: https://dash.cloudflare.com/sign-up\n' +
    '  2. Copy your Account ID (dashboard → Workers & Pages → right sidebar)\n' +
    '  3. Create an API token: https://dash.cloudflare.com/profile/api-tokens\n' +
    '     → "Create Token" → template "Edit Cloudflare Workers" → scope to your account\n\n'
  );
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const accountId = await ask(rl, 'Cloudflare Account ID: ');
    const apiToken = await ask(rl, 'Cloudflare API Token: ');
    if (!accountId || !apiToken) throw new Error('Both Account ID and API Token are required.');
    process.stdout.write('Verifying with Cloudflare…\n');
    await verifyCloudflareCreds(accountId, apiToken);
    const file = writeCredsFile({
      ...(readCredsFile() || {}),
      cloudflare: { accountId, apiToken }
    });
    process.stdout.write(`Verified. Credentials saved to ${file} (chmod 600).\n`);
    return { ok: true, file };
  } finally {
    rl.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin commands (gic_admin_* key)
// ─────────────────────────────────────────────────────────────────────────────

async function adminCreateKey({ label, plan, note } = {}, apiKey) {
  return bridgePost('/admin/keys/create', { label, plan: plan || 'pro', note }, apiKey);
}

async function adminListKeys(apiKey) {
  return bridgePost('/admin/keys/list', {}, apiKey);
}

async function adminRevokeKey(keyId, apiKey) {
  return bridgePost('/admin/keys/revoke', { keyId }, apiKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      flags[name] = (i + 1 < args.length && !args[i + 1].startsWith('--')) ? args[++i] : true;
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

const USAGE = `
GIC OnePageApps CLI

Usage: node cli/gic-onepageapps.js <command> [args] [--flags]

Commands:
  createApp "<prompt>"                Generate a worker app from a prompt (prints JSON; use --output js > app.js)
  editApp <file> "<instruction>"      Edit an existing worker file
  validate <file>                     Validate a worker file ("-" reads stdin)
  deployGic <file> --title "Name"     Deploy GIC-hosted (plan limits; free = 1 app, 7 days)
  deployByo <file> --name my-app      Deploy to YOUR Cloudflare account (permanent, free)
  listApps                            List your GIC-hosted apps
  deleteApp <slug>                    Delete a GIC-hosted app
  cfSetup                             One-time BYO Cloudflare onboarding (guided)
  adminCreateKey --label X --plan pro Create a key (admin)
  adminListKeys                       List keys (admin)
  adminRevokeKey <keyId>              Revoke a key (admin)

Environment:
  GIC_API_KEY     GIC key (opa_live_* / gic_admin_*); falls back to ~/.config/gic/credentials.json
  GIC_BRIDGE_URL  Optional bridge override
  CF_ACCOUNT_ID / CF_API_TOKEN  BYO Cloudflare creds (or run cfSetup once)
`;

async function runCli() {
  const [, , command, ...rest] = process.argv;
  const { flags, positional } = parseFlags(rest);

  const printResult = (result) => {
    if (flags.output === 'js' && result && result.workerJs) {
      process.stdout.write(result.workerJs);
      return;
    }
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  };

  try {
    switch (command) {
      case 'createApp': printResult(await createApp(positional[0])); break;
      case 'editApp': printResult(await editApp(positional[0], positional[1])); break;
      case 'validate': printResult(await validate(positional[0])); break;
      case 'deployGic': printResult(await deployGic(positional[0], { title: flags.title, templateId: flags.template })); break;
      case 'deployByo': printResult(await deployByo(positional[0], { name: flags.name })); break;
      case 'listApps': printResult(await listApps()); break;
      case 'deleteApp': printResult(await deleteApp(positional[0])); break;
      case 'cfSetup': printResult(await cfSetup()); break;
      case 'adminCreateKey': printResult(await adminCreateKey({ label: flags.label, plan: flags.plan, note: flags.note })); break;
      case 'adminListKeys': printResult(await adminListKeys()); break;
      case 'adminRevokeKey': printResult(await adminRevokeKey(positional[0])); break;
      default:
        process.stdout.write(USAGE);
        process.exitCode = command ? 1 : 0;
    }
  } catch (error) {
    const detail = error.data ? `\n${JSON.stringify(error.data, null, 2)}` : '';
    process.stderr.write(`Error${error.status ? ` (HTTP ${error.status})` : ''}: ${error.message}${detail}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  createApp, editApp, validate, deployGic, deployByo,
  listApps, deleteApp, cfSetup,
  adminCreateKey, adminListKeys, adminRevokeKey
};

if (require.main === module) runCli();
