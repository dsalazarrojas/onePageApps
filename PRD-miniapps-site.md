> **SUPERSEDED by [`PRD_FOCUSED_ONEPAGEAPP_JOURNEY.md`](./PRD_FOCUSED_ONEPAGEAPP_JOURNEY.md)**
> (2026-07-16). This document is kept for historical reference only; do not use it to plan new
> work. The `miniapps.gic.mx` rename explored below is explicitly killed — the domain stays
> `onepageapps.gic.mx`. See the focused PRD and its companion TODOs
> (`TODO_WEB_V1_FOCUSED.md`, `../oneTimeUseWebApp/TODO_IOS_V1_FOCUSED.md`) instead.

# PRD: onePageApps.gic.mx — Backend, Monetization & AI Generation

**Status:** Draft — revised after site audit
**Date:** 2026-03-28
**Existing site:** onePageApps.gic.mx (live, repo: `onePageApps`)
**Missing piece:** Private backend worker (new repo: `onePageAppsPrivate`)
**Domain note:** The iOS app and live site already use `onePageApps.gic.mx`. A migration to `miniapps.gic.mx` is possible but requires updating the iOS app URL and DNS. This PRD targets `onePageApps.gic.mx` as the current domain; rename can be a separate task.
**Mirrors pattern:** `forms` / `formsPrivate`

---

## 1. Current State (What Already Exists)

The `onePageApps` repo is a fully functional static site already live at `onePageApps.gic.mx`. Most of the frontend work is complete:

| Feature | Status |
|---------|--------|
| `index.html` — landing page | ✅ Done |
| `browse.html` — search + filter catalog | ✅ Done |
| `preview.html` — app detail + live iframe demo | ✅ Done |
| 17 category pages | ✅ Done |
| About, contact, privacy, terms | ✅ Done |
| `docs/apps-index.json` + `.gz` (199 apps) | ✅ Done |
| Build pipeline (migrate, generate-index, generate-categories) | ✅ Done |
| iOS app sync (downloads `apps-index.json.gz`) | ✅ Done |
| Google Analytics 4 | ✅ Done |
| SEO (robots.txt, sitemap.xml, schema.org) | ✅ Done |
| Dark mode + search + filters | ✅ Done |
| Live previews for ~70 client-side apps | ✅ Done |
| GitHub FUNDING.yml + issue templates | ✅ Done |

---

## 2. What Is Missing

Everything below requires a private backend companion repo (`onePageAppsPrivate`) modeled after `formsPrivate`, plus a few additional frontend pages.

| Missing Feature | Priority |
|----------------|----------|
| AI generation page (`generate.html`) — describe app → AI writes Worker JS | P0 |
| Bridge Cloudflare Worker (AI routes) | P0 |
| Web-based BYO Cloudflare deploy | P0 |
| Web-based GIC-hosted deploy | P1 |
| Stripe monetization (checkout, webhooks, JWT) | P1 |
| JWT auth for gated features | P1 |
| API key management (Pro/Business) | P2 |
| Admin key management | P2 |
| `success.html` — post-payment page | P1 |
| `publish.sh` — full pre-publish build script | P2 |
| Custom GA4 events (app_view, deploy_cta_click, etc.) | P2 |

---

## 3. New Repo: `onePageAppsPrivate`

Never pushed to GitHub. Mirrors `formsPrivate` structure exactly.

```
onePageAppsPrivate/
├── cloudflare-bridge-worker.js   ← main Worker
├── wrangler.toml
├── SETUP.md
├── CONFIG.md
├── README.md
└── scripts/
    ├── deploy-worker.sh
    └── set-secrets.sh
```

The `DEFAULT_BRIDGE_URL` constant in the frontend pages points to the deployed Worker URL. Set it in `docs/assets/site-shared.js` after first deployment.

---

## 4. New Frontend Pages

### 4.1 `generate.html` — AI App Generator

The web equivalent of the iOS app's "describe it and deploy it" flow.

**UI sections:**

1. **Prompt area** — large textarea: "Describe the app you want to build…"
2. **Seed from existing** — optional dropdown to base generation on an existing template (populated from `apps-index.json`)
3. **LLM selector** — tabs: "Use GIC AI" (requires login/Pro, 5 free/month) vs "Use my own key" (BYO API key + base URL fields)
4. **Generate button** → calls `/ai/create/stream` → streams Worker JS into editor
5. **Code editor** — read-only by default, with "Edit" toggle that calls `/ai/edit/stream` on instruction submit
6. **Instruction field** — "Change the output format to CSV" → re-runs AI edit
7. **Validate button** → calls `/validate` → shows pass/fail + errors inline
8. **Deploy panel** (after valid JS):
   - "Deploy to My Cloudflare" — BYO token modal
   - "Deploy with GIC Hosting" — Stripe checkout CTA if Free tier limit reached
9. **Session storage** — generated script survives page refresh (sessionStorage, never sent to server)

**Auth state awareness:**
- Not logged in + Free tier: show 5/month counter and login CTA
- Pro: unlimited GIC AI generations
- BYO key: always available regardless of tier

### 4.2 `success.html` — Post-Payment

- Reads `?session_id=` param from Stripe redirect
- Calls `/stripe/verify` → receives JWT → stores in localStorage
- Shows "Welcome to Pro / Business" confirmation
- Links back to browse + generate pages

---

## 5. Bridge Worker Routes (`onePageAppsPrivate`)

CORS: restricted to `https://onepageapps.gic.mx` (except API key routes).

### 5.1 AI Routes — Phase 1 (JWT / BYO key / API key required)

| Endpoint | Description |
|----------|-------------|
| `POST /ai/create` | Generate Worker JS from prompt (blocking) |
| `POST /ai/create/stream` | Generate Worker JS — SSE streaming |
| `POST /ai/edit` | Edit Worker JS with instruction (blocking) |
| `POST /ai/edit/stream` | Edit Worker JS — SSE streaming |

**Request body (`/ai/create`):**
```json
{
  "prompt": "A Markdown-to-HTML converter with syntax highlighting and a download button",
  "baseTemplate": "document_converter",
  "byoKey": "sk-...",
  "byoBaseURL": "https://..."
}
```

**System prompt for Worker JS generation must:**
- Output only valid Cloudflare Worker JS (no React, no Node modules)
- Return an HTML page for `GET /`, handle API at `POST /`
- Use `env.*` for all secrets (never hardcode)
- Include proper CORS headers
- Follow WORKER_TEMPLATE_GUIDELINES.md conventions

**Rate limits:**
- Free tier: 5 AI creates/month (counter in KV: `aiUsage:{jwtSub}:{YYYY-MM}`)
- Pro/Business: unlimited via GIC LLM
- BYO key: always unlimited (counted separately for analytics)

### 5.2 Deploy Routes — Phase 2

| Endpoint | Description |
|----------|-------------|
| `POST /deploy/byo` | Proxy deploy to user's own Cloudflare (any tier) |
| `POST /deploy/gic` | Deploy to GIC's Cloudflare account (Pro+ required) |

**BYO deploy (`/deploy/byo`):**
- No JWT required
- User sends: `{ cfAccountId, cfApiToken, scriptName, workerJs, secrets: {} }`
- Bridge validates token format, proxies to `api.cloudflare.com`
- Strict allowlist: only `api.cloudflare.com` can be forwarded to
- Returns Cloudflare API response verbatim

**GIC-hosted deploy (`/deploy/gic`):**
- JWT required (Pro+)
- User sends: `{ workerJs, title, templateId?, secrets: {} }`
- Bridge uses GIC's `CF_ACCOUNT_ID` + `CF_API_TOKEN`
- Assigns slug: `{6-char random}` at `{slug}.onepageapps.gic.mx`
- Stores in `APPS_KV`: `app:{slug}` → `{ ownerId, deployedAt, expiresAt?, title, templateId }`
- Free tier: 1 active app (7-day expiry), enforced via `user:{jwtSub}:appCount` in KV
- Pro: 10 active apps (permanent)
- Business: unlimited
- Returns: `{ url, slug, expiresAt? }`

### 5.3 App Management — Phase 2

| Endpoint | Description |
|----------|-------------|
| `POST /apps/list` | List user's GIC-hosted apps (JWT required) |
| `POST /apps/delete` | Delete a GIC-hosted app (JWT required) |

### 5.4 Validate

| Endpoint | Description |
|----------|-------------|
| `POST /validate` | Static checks on Worker JS (no JWT required) |

Checks: `addEventListener` or `export default` present, no `eval()`, no `process.env` (Node pattern), no hardcoded secrets patterns, valid JS syntax (regex-based).

### 5.5 Stripe Routes — Phase 2 (identical to formsPrivate)

| Endpoint | Description |
|----------|-------------|
| `POST /stripe/checkout` | Create Checkout Session |
| `POST /stripe/verify` | Validate session → issue JWT |
| `POST /stripe/renew` | Renew JWT if subscription active |
| `POST /stripe/portal` | Billing Portal session |
| `POST /stripe/webhook` | Handle subscription lifecycle events |

Stripe events to subscribe: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.payment_failed`.

`successUrl`: `https://onepageapps.gic.mx/success.html?session_id={CHECKOUT_SESSION_ID}`
`cancelUrl`: `https://onepageapps.gic.mx/browse.html`

### 5.6 API Key Management — Phase 3 (identical to formsPrivate)

| Endpoint | Description |
|----------|-------------|
| `POST /api/keys/create` | Create API key (JWT + CSRF) |
| `POST /api/keys/list` | List keys (JWT + CSRF) |
| `POST /api/keys/revoke` | Revoke key (JWT + CSRF) |

### 5.7 Admin Routes — Phase 3 (identical to formsPrivate)

| Endpoint | Description |
|----------|-------------|
| `POST /admin/keys/create` | Issue gift key (Admin API key) |
| `POST /admin/keys/list` | List all keys |
| `POST /admin/keys/revoke` | Revoke any key |

---

## 6. Pricing & Tiers

Same structure as `forms.gic.mx`:

| Feature | Free | Pro ($9/mo · $79/yr) | Business ($19/mo · $149/yr) |
|---------|------|----------------------|------------------------------|
| Browse + live preview | ✓ | ✓ | ✓ |
| BYO Cloudflare deploy (web) | ✓ | ✓ | ✓ |
| AI generation (BYO LLM key) | ✓ | ✓ | ✓ |
| AI generation (GIC LLM) | 5/month | Unlimited | Unlimited |
| GIC-hosted active apps | 1 (7-day) | 10 (permanent) | Unlimited |
| Custom subdomain for hosted apps | ✗ | ✓ | ✓ |
| API access | ✗ | ✓ | ✓ |
| White label / embed | ✗ | ✗ | ✓ |

---

## 7. Secrets & Configuration

### 7.1 `wrangler.toml`
```toml
name = "onepageapps-bridge"
main = "cloudflare-bridge-worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "OPA_KV"
id = "<id>"
preview_id = "<preview_id>"

[[kv_namespaces]]
binding = "APPS_KV"
id = "<id>"
preview_id = "<preview_id>"
```

### 7.2 Secrets (set via `wrangler secret put`)

**Core:**
- `JWT_SECRET` — `openssl rand -hex 32`

**LLM Provider Cascade (same 5-provider pattern as formsPrivate):**
- `GIC_LLM_API_KEY`, `GIC_LLM_BASE_URL`, `GIC_LLM_MODEL` (Provider 1)
- `GIC_LLM_2_KEY`, `GIC_LLM_2_BASE_URL`, `GIC_LLM_2_MODEL` (Provider 2)
- … through `GIC_LLM_5_*`
- Recommended: `gpt-4o` or `gpt-4.1` as primary (more capable for Worker JS than gpt-4o-mini)

**GIC Cloudflare (for GIC-hosted deployments):**
- `CF_ACCOUNT_ID` — GIC's Cloudflare Account ID
- `CF_API_TOKEN` — token with `Workers Scripts:Edit` + `Workers Routes:Edit`
- `CF_HOSTED_ZONE_ID` — Zone ID for `onepageapps.gic.mx`
- `CF_HOSTED_BASE_DOMAIN` — `onepageapps.gic.mx` (deployed app URLs: `{slug}.onepageapps.gic.mx`)

**Stripe:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_BIZ_MONTHLY`
- `STRIPE_PRICE_BIZ_ANNUAL`

**Admin:**
- `GIC_ADMIN_API_KEY` — `gic_admin_<64 random chars>`

**Optional allowlists:**
- `ALLOWED_LLM_HOSTS` — comma-separated
- `ALLOWED_CF_HOSTS` — should be `api.cloudflare.com`

### 7.3 KV Namespaces

**`OPA_KV`** (mirrors `GIC_KV` in formsPrivate):
- JWT tokens, CSRF tokens, Stripe session state
- API keys per user
- Rate limit counters
- AI usage counters: `aiUsage:{jwtSub}:{YYYY-MM}` → integer

**`APPS_KV`** (new, for GIC-hosted deployments):
- `app:{slug}` → `{ ownerId, workerName, title, templateId, deployedAt, expiresAt? }`
- `user:{jwtSub}:apps` → `[slug, ...]`
- `user:{jwtSub}:appCount` → integer

---

## 8. Security

Identical to `formsPrivate`:
- CORS: `Origin: https://onepageapps.gic.mx` only (except `/api/keys/*`)
- CSRF tokens: 15-minute TTL
- Rate limiting (in-memory, per IP):
  - `/ai/*`: 10 req/min free, 60 req/min Pro
  - `/deploy/gic`: 5 req/min
  - `/deploy/byo`: 20 req/min
  - `/stripe/*`: 5 req/min
  - `/api/keys/*`: 10 req/min
- BYO CF token: never logged, only forwarded to `api.cloudflare.com`
- Generated Worker JS: static checks before deploy (no `eval`, no hardcoded secrets)
- GIC-hosted apps: random non-sequential slugs

---

## 9. Stripe Setup (from scratch)

1. Create Stripe products:
   - "onePageApps Pro" — $9/mo + $79/yr
   - "onePageApps Business" — $19/mo + $149/yr
2. Webhook endpoint: `https://<worker>.workers.dev/stripe/webhook`
3. Subscribe to: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
4. Store all price IDs and webhook secret as Worker secrets

---

## 10. Cloudflare Setup for GIC-Hosted Deployments

1. Verify `onepageapps.gic.mx` zone is on Cloudflare
2. Create wildcard DNS: `*.onepageapps.gic.mx` → points to Cloudflare Workers
3. Create API token: `Workers Scripts:Edit` + `Workers Routes:Edit` + `Zone:Read`
4. Create Workers route: `*.onepageapps.gic.mx/*` → route to dynamic per-slug Workers
5. Create KV namespaces (`OPA_KV`, `APPS_KV`) via `wrangler kv:namespace create`
6. Store `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `CF_HOSTED_ZONE_ID` as Worker secrets

---

## 11. Additions to the Public `onePageApps` Repo

### 11.1 New files to add:
- `generate.html` — AI generator page (§4.1)
- `success.html` — post-payment page (§4.2)
- `docs/assets/bridge.js` — bridge URL constant + fetch helpers (mirrors `deploy-integrations.js` in forms)

### 11.2 Updates to existing files:
- `index.html` — add "Generate an App" CTA + pricing section
- `browse.html` — add "Deploy" button wiring for BYO Cloudflare modal
- `preview.html` — add deploy panel (BYO + GIC-hosted CTAs)
- `docs/assets/site-shared.js` — add `DEFAULT_BRIDGE_URL` constant after worker is deployed

### 11.3 Publish script (new):
- `scripts/publish.sh` — run locally before every site push

What it does (in order):
1. Runs `node scripts/generate_index.js` → regenerates `docs/apps-index.json` + `.gz` + `docs/last_updated.txt`
2. Runs `node scripts/generate_categories.js` → regenerates category pages, `robots.txt`, `sitemap.xml`
3. Prints a summary: app count, categories updated, files changed
4. Optionally: `git add docs/ categories/ robots.txt sitemap.xml && git status` (review before committing)

Usage:
```bash
./scripts/publish.sh          # regenerate everything
git add -p                    # review changes
git commit -m "chore: publish YYYY-MM-DD"
git push
```

No CI/CD. Index generation is always triggered manually before publishing.

---

## 12. Phase Plan (Starting from Current State)

All Phases 0–8 from the original PRD are complete. Remaining work:

### Phase 9 — AI Generation (P0)
- [ ] Create `onePageAppsPrivate` repo, scaffold from `formsPrivate` structure
- [ ] Implement `/ai/create`, `/ai/create/stream`, `/ai/edit`, `/ai/edit/stream`
- [ ] Implement `/validate`
- [ ] Write `SETUP.md`, `CONFIG.md`, `scripts/deploy-worker.sh`, `scripts/set-secrets.sh`
- [ ] Build `generate.html` with code editor (CodeMirror or similar) + streaming output
- [ ] Add BYO deploy modal to `generate.html` and `preview.html`
- [ ] Add `DEFAULT_BRIDGE_URL` to `site-shared.js` after first Worker deploy

### Phase 10 — Stripe & GIC-Hosted Deploy (P1)
- [ ] Implement all `/stripe/*` routes in bridge Worker
- [ ] Create Stripe products + webhook + set all secrets
- [ ] Implement `/deploy/gic` (uses GIC CF account)
- [ ] Implement `/apps/list`, `/apps/delete`
- [ ] Set up wildcard DNS `*.onepageapps.gic.mx` on Cloudflare
- [ ] Build `success.html`
- [ ] Add pricing section to `index.html`
- [ ] Add GIC-hosted deploy CTA to `preview.html` + `generate.html`

### Phase 11 — API Keys & Admin (P2)
- [ ] Implement `/api/keys/*` and `/admin/keys/*`
- [ ] Add API documentation page or section to `about.html`
- [ ] Implement admin gift key flow (same as formsPrivate)

### Phase 12 — Publish Script & Polish (P2)
- [ ] Write `scripts/publish.sh` (runs generate_index + generate_categories, prints summary, stages files)
- [ ] Update `LOCAL_PIPELINE.md` to document the publish workflow
- [ ] Add custom GA4 events: `app_generate`, `app_deploy_byo`, `app_deploy_gic`, `generate_cta_click`, `deploy_cta_click`
- [ ] SEO: add `generate.html` to sitemap, update category pages with deploy CTA
- [ ] Add "New" badge in index for recently added apps (track `addedAt` in index)

### Phase 13 — iOS App URL Update (when ready)
- [ ] If migrating to `miniapps.gic.mx`: update DNS, CNAME in repo, iOS app URL, sitemap
- [ ] Or: keep `onepageapps.gic.mx` as canonical and skip this phase

---

## 13. What We Are NOT Building (Scope Limits)

- No user accounts page (auth is JWT-in-localStorage, same as forms)
- Generated apps are **public and accessible** — no private app hosting
- No template submission system (future v2)
- No app versioning (future v2)
- No analytics dashboard for deployed apps (future v2)
- No self-hosted bridge worker distribution (future v2)
