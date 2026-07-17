# TODO — Web V1: Bridge Wiring + Focused Journey

**Date:** 2026-07-16
**Source PRD:** `PRD_FOCUSED_ONEPAGEAPP_JOURNEY.md` (north star; this document is the executable,
scope-cut version)
**Sibling plan:** `../oneTimeUseWebApp/TODO_IOS_V1_FOCUSED.md` (iOS surface, executed independently)

## 0. The one promise

> Pick a widget, deploy it, and share a working link in three minutes — no code, no config.

Everything in this document serves that promise. Anything that doesn't is in §8 (Deferred).

## 1. Why this order

The site's frontend is largely built — the catalog, preview, and generate pages already exist
with real (not stub) deploy-request code. What's missing is the backend behind them: the bridge
Worker is fully coded but never provisioned. Wiring the backend first (Phase 1) turns existing
dead-end buttons into working ones with no new UI work; only after that does polishing the
information architecture (Phase 3–4) make sense — there's no point simplifying a shell around a
loop that doesn't complete yet.

## 2. Verified repo facts (2026-07-16)

### Frontend (`onePageApps` repo, site served from repo root; `docs/` holds a mirror — keep both
in sync as currently done)

- `generate.html` (34,071 bytes) and `preview.html` (63,192 bytes) exist at repo root, each with
  real deploy-request and Stripe-checkout-redirect logic (e.g. `preview.html:1284-1286`,
  `generate.html:534-536` — both read `error?.data?.checkoutUrl` from a bridge response and
  redirect). These are not stub buttons; they fail today only because the bridge is unreachable.
- `assets/site-shared.js:2` and its mirror `docs/assets/site-shared.js:2` both declare
  `const DEFAULT_BRIDGE_URL = '';` — empty. Both also carry a matching warning string: "The
  onePageApps bridge worker is not configured yet. Deploy onePageAppsPrivate, then set
  DEFAULT_BRIDGE_URL or localStorage[\"opa-bridge-url\"]."
- `apps-index.json.gz` and its uncompressed sibling live at `docs/apps-index.json.gz` /
  `docs/apps-index.json` (not repo root).
- `scripts/migrate_workers.sh` and `scripts/generate_index.js` both fall back to the iOS repo's
  `oneTimeUseWebApp/oneTimeUseWebApp/WorkerTemplates` as a companion source dir when local
  content is missing. That directory holds the actual deployable payloads: 200 `.js` worker
  scripts plus `_help.md` docs (do not confuse it with the iOS repo's *top-level*
  `WorkerTemplates/`, which contains only Python survey tooling). Template *metadata* authority
  is `oneTimeUseWebApp/Models.swift` (208 `AppTemplate` entries). `generate_index.js` supports
  `--strict-local-only` to disable the fallback once migration is complete.
- `prompt.md` (406 bytes) instructs "Implement the 'onePageApps/PRD.md' in that same directory" —
  `PRD.md` does not exist in this repo. Only `PRDmd.md` and `PRD-miniapps-site.md` exist.
- `CNAME` = `onePageApps.gic.mx`; domain references are throughout `docs/*.html` and
  `onePageAppsPrivate/CONFIG.md`. No DNS zone/Terraform config exists in git — DNS is a manual
  Cloudflare-dashboard task.

### Backend (`/Volumes/2tb Mac Pro M2/GitHub/onePageAppsPrivate/cloudflare-bridge-worker.js`,
44,873 bytes; **not a git repo**, mirrors `formsPrivate`)

Already implemented and reusable: `/validate`, `/ai/create`, `/ai/edit` (+ `/stream` variants),
`/deploy/byo` (`deployByo()`), `/deploy/gic` (`deployGic()`), `/stripe/checkout`,
`/stripe/verify`, `/stripe/webhook`, `/stripe/renew`, `/stripe/portal`, `/auth/csrf`,
`/apps/list`, `/apps/delete`, `/api/keys/*`, `/admin/keys/*`. Rate-limit config already declares
buckets for `deploy_byo`, `deploy_gic`, and `validate`. Two test suites exist:
`tests/worker.test.mjs` and `tests/bridge-core.test.mjs`.

`wrangler.toml` defines two KV namespaces — `OPA_KV` and `APPS_KV` — both still literal
`<id>` / `<preview_id>` placeholders. No secrets are configured. `DEFAULT_BRIDGE_URL` is unset on
the frontend side (see above), so even a deployed worker is unreachable from the site until that
constant is set.

## 3. Scope cuts (decided — do not re-litigate during implementation)

1. **No Stripe/paid tiers in V1.** The bridge's Stripe routes stay coded but unwired; hide or
   free-label any pricing surface reachable from the normal path.
2. **Keep the `onepageapps.gic.mx` domain.** The `miniapps.gic.mx` rename floated in
   `PRD-miniapps-site.md` is killed.
3. **No new templates.** Ship the existing ~208-template corpus as-is.
4. **No self-serve API-key admin UI.** `/api/keys/*` and `/admin/keys/*` stay coded, unwired.
5. **Reuse the coded bridge worker as-is.** No new backend routes for V1 — only provisioning
   (KV ids, secrets, deploy, DNS) and wiring the existing frontend to it.

## 4. Phase 1 — `BRIDGE-1xx`: Provision the bridge Worker (~2-3 days)

- **BRIDGE-101** — Create the two KV namespaces (`OPA_KV`, `APPS_KV`) via `wrangler kv namespace
  create`, and fill the real ids into `onePageAppsPrivate/wrangler.toml` (replacing the literal
  `<id>` / `<preview_id>` placeholders).
- **BRIDGE-102** — Set required secrets (Cloudflare API token for `deployGic()`, any AI provider
  key used by `/ai/create`, Stripe keys can be set now or deferred since Stripe stays unwired —
  set at minimum whatever `/validate` and `/deploy/gic` require to run without erroring).
- **BRIDGE-103** — `wrangler deploy` the bridge worker (`onepageapps-bridge` or equivalent script
  name) from `onePageAppsPrivate`.
- **BRIDGE-104** — Run `tests/worker.test.mjs` and `tests/bridge-core.test.mjs` against the
  deployed worker; fix any failures surfaced by real KV/secrets vs. previous local/mocked state.
- **DEC-101** — DNS decision (30 min): (a) wildcard `*.onepageapps.gic.mx` routed to the bridge
  via a Cloudflare Worker route, if DNS is on Cloudflare; (b) fallback: the deployed worker's
  `*.workers.dev` URL, migrate to (a) later. Recommendation: (a) if DNS is already proxied
  through Cloudflare, else (b) now.
- **BRIDGE-105** — Set `DEFAULT_BRIDGE_URL` to the resolved worker URL in both
  `assets/site-shared.js:2` and `docs/assets/site-shared.js:2` — keep them identical.

**Gate:** `/validate` and `/ai/create` respond with valid JSON from the live site origin (test
via browser fetch from `onepageapps.gic.mx`, not just `curl` against the worker URL directly —
CORS/origin config must also work).

## 5. Phase 2 — `SITE-2xx`: Wire the deploy loop end-to-end (~2-3 days)

- **SITE-201** — Confirm `generate.html`'s AI-create flow completes against the live bridge:
  submit a prompt, get a generated widget, land in a preview/configure state.
- **SITE-202** — Confirm `preview.html`'s Deploy action completes against the live bridge:
  configure a template's fields, click Deploy, receive a live URL back from `deployGic()`.
- **SITE-203** — Surface the live URL clearly on success: copy-link action, QR code, embed
  snippet (per PRD §6.1/§9 — one dominant action, no extra panels).
- **SITE-204** — Remove or hide every dead-end CTA on the normal path: pricing buttons, Stripe
  checkout entry points, any `href="#"` anchor that isn't JS-populated at runtime (audit
  `preview.html`'s `app-category-badge`, `demo-open-link`, `deploy-source-link`,
  `info-category-link`, `share-twitter-link`, `related-view-all` — confirm each gets a real
  `href` set by JS, or hide it if it doesn't).
- **SITE-205** — Error-path handling: bridge timeout, validation failure, rate-limit response —
  each shows a clear, non-technical message, not a raw error or a silently-dead button.

**Gate:** the golden journey (PRD §10, web half) completes on the live site — search a template,
preview it, deploy it, get a link, embed it elsewhere and see it render. **This is the moment
onePageApps becomes a product.**

## 6. Phase 3 — `CAT-3xx`: Finish catalog migration + doc consolidation (~2 days)

- **CAT-301** — Fix the nil-metadata template exclusions in the migration/index pipeline
  (`scripts/generate_index.js`) so no valid template silently drops out of `apps-index.json.gz`.
- **CAT-302** — Regenerate `apps-index.json.gz` (and the uncompressed sibling) from the current
  `Models.swift` corpus; run with `--strict-local-only` where feasible to confirm the fallback to
  the iOS repo's `WorkerTemplates/` is no longer load-bearing.
- **CAT-303** — Add "SUPERSEDED by `PRD_FOCUSED_ONEPAGEAPP_JOURNEY.md`" banners to `PRDmd.md` and
  `PRD-miniapps-site.md` (header only, no other content changes).
- **CAT-304** — Fix or delete `prompt.md`'s dangling reference to the nonexistent `PRD.md` —
  point it at `PRD_FOCUSED_ONEPAGEAPP_JOURNEY.md` or remove the file if it's unused tooling
  scaffolding.

**Gate:** template count in `apps-index.json.gz` matches the iOS app's `Models.swift` template
count (both surfaces show the same catalog).

## 7. Phase 4 — `IA-4xx`: Focused shell (~2-3 days)

- **IA-401** — Enforce choice budgets from PRD §9.1 on the index/browse pages: one primary search
  action, a small popular-categories row instead of the full category list up front.
- **IA-402** — Enforce the same on the preview page: one dominant Deploy action.
- **IA-403** — Vocabulary audit across the normal path: no "worker", "KV", "wrangler", or "YAML"
  visible outside an explicit Advanced/BYO section.
- **IA-404** — Subtraction pass: remove repeated CTAs, redundant panels, and any surviving
  pre-Phase-2 dead-end UI now that the loop works.

**Gate:** golden journey passes again at both desktop and 360 px; choice-budget count per screen
(primary actions > 1 fails); vocabulary audit clean.

## 8. Deferred (V1.1+; do not build now)

Stripe/paid tiers wiring (Release C) · self-serve API-key admin UI · new template additions ·
`miniapps.gic.mx` rename · Kids AI Phase 20 templates · Durable-Objects real-time apps ·
gicForms parity port (iOS-side, tracked in the iOS TODO's own deferred section) · AI edit-in-place
UX beyond the existing generate flow.

## 9. Golden-journey gate (release gate for this TODO)

> A user searches "countdown" on `onepageapps.gic.mx`, opens the preview, sets an event date and
> name, clicks Deploy, gets a live URL within seconds, copies the embed snippet, and pastes it
> into another page — the countdown renders live there too.

**Contract:** under 3 minutes; no Cloudflare token required on this path; no dead-end button
encountered; works at 360 px; the deployed page is reachable from a clean browser with no login;
the embed snippet renders live elsewhere.

**Verification per phase:** Phase 1 = `BRIDGE-104` test scripts pass against the deployed worker.
Phase 2 = golden journey manually, desktop + 360 px — this is the hard gate. Phase 3 = index
parity check (`CAT-3xx` gate). Phase 4 = golden journey again + choice-budget count + vocabulary
audit.

## 10. Working agreement (for AI-assisted implementation)

- One phase at a time, in order; each phase ends with its verification gate, not with "code
  merged".
- Two repos: frontend = `onePageApps` (edit root HTML/JS + keep `docs/` mirror in sync as
  currently done), backend = `onePageAppsPrivate` (not a git repo; deploy with `wrangler deploy`;
  secrets already partially scaffolded in the worker code — never print them once set).
- Reuse before build: `/validate`, `/ai/create`, `/deploy/gic`, `/deploy/byo`, CSRF, and rate
  limiting all already exist in the bridge worker — Phase 1 is provisioning, not writing new
  backend code.
- Every review of Phase 3/4 UI work re-checks the §7 choice budgets and §9.1 (PRD) vocabulary
  rules — AI implementers reliably add extra labels and panels; subtraction is part of every
  task, not a final step.
- No new paid services required for V1 — Cloudflare free tier (Workers + KV) covers the loop;
  Stripe stays unwired.
