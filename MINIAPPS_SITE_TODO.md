# onePageApps PRD Checklist

Only fully implemented and verified tasks get `[x]`. External setup that requires live credentials, Stripe dashboard access, Cloudflare account access, DNS changes, or an actual deployed Worker URL stays unchecked.

## Phase 9 — AI Generation (P0)

- [x] Create `onePageAppsPrivate` repo, scaffold from `formsPrivate` structure
- [x] Implement `/ai/create`, `/ai/create/stream`, `/ai/edit`, `/ai/edit/stream`
- [x] Implement `/validate`
- [x] Write `SETUP.md`, `CONFIG.md`, `scripts/deploy-worker.sh`, `scripts/set-secrets.sh`
- [x] Build `generate.html` with code editor + streaming output
- [x] Add BYO deploy modal to `generate.html` and `preview.html`
- [ ] Add `DEFAULT_BRIDGE_URL` to `site-shared.js` after first Worker deploy

## Phase 10 — Stripe & GIC-Hosted Deploy (P1)

- [ ] Implement all `/stripe/*` routes in bridge Worker
- [ ] Create Stripe products + webhook + set all secrets
- [x] Implement `/deploy/gic` (uses GIC CF account)
- [x] Implement `/apps/list`, `/apps/delete`
- [ ] Set up wildcard DNS `*.onepageapps.gic.mx` on Cloudflare
- [x] Build `success.html`
- [x] Add pricing section to `index.html`
- [x] Add GIC-hosted deploy CTA to `preview.html` + `generate.html`

## Phase 11 — API Keys & Admin (P2)

- [x] Implement `/api/keys/*` and `/admin/keys/*`
- [x] Add API documentation page or section to `about.html`
- [x] Implement admin gift key flow (same as `formsPrivate`)

## Phase 12 — Publish Script & Polish (P2)

- [x] Write `scripts/publish.sh` (runs `generate_index` + `generate_categories`, prints summary, stages files)
- [x] Update `LOCAL_PIPELINE.md` to document the publish workflow
- [x] Add custom GA4 events: `app_generate`, `app_deploy_byo`, `app_deploy_gic`, `generate_cta_click`, `deploy_cta_click`
- [x] SEO: add `generate.html` to sitemap, update category pages with deploy CTA
- [x] Add "New" badge in index for recently added apps (track `addedAt` in index)

## Phase 13 — iOS App URL Update

- [ ] If migrating to `miniapps.gic.mx`: update DNS, CNAME in repo, iOS app URL, sitemap
- [x] Or: keep `onepageapps.gic.mx` as canonical and skip this phase
