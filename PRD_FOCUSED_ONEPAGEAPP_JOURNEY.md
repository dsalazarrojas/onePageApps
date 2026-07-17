# PRD — Focused onePageApps Journey

**Version:** 1.0
**Date:** 2026-07-16
**Status:** Proposed for implementation
**Companion execution plan (web):** `TODO_WEB_V1_FOCUSED.md`
**Companion execution plan (iOS):** `../oneTimeUseWebApp/TODO_IOS_V1_FOCUSED.md`

## 1. Decision Summary

onePageApps will be designed around one promise:

> Pick a widget, deploy it, and share a working link in three minutes — no code, no config.

The product has two connected layers with different jobs:

1. **The public catalog site** (`onepageapps.gic.mx`) is the acquisition layer. It gives search
   engines and visitors useful, stable, browsable pages for single-purpose widgets — countdowns,
   polls, QR pages, link-in-bio pages, and the rest of the template corpus.
2. **The deploy loop** — the web bridge Worker plus the iOS/macOS/visionOS app — is the conversion
   layer. It lets a person pick a widget, configure it, deploy it to a live URL, and share it,
   without understanding Cloudflare Workers, KV, `wrangler`, or API tokens beyond the one-time
   setup step.

The ~208-template corpus (defined in `oneTimeUseWebApp/Models.swift`) is a strategic asset. It
must not dominate or complicate the deploy interface, and it must not be presented as an
undifferentiated wall of 208 equally-weighted choices.

## 2. Product Problem

The current product contains valuable capabilities but presents too many of them at equal
importance, split unevenly across three repos that drifted apart instead of converging:

- A live public catalog site whose **generate**, **deploy**, and **pricing** pages are dead ends —
  the code paths exist (`generate.html`, `preview.html` both contain real Stripe-checkout-redirect
  logic) but the backend they depend on, `onePageAppsPrivate`, is fully coded and never
  provisioned: KV namespace ids are still literal `<id>` placeholders, `DEFAULT_BRIDGE_URL` is an
  empty string in both `assets/site-shared.js` and its `docs/assets/` mirror, so every deploy/AI
  call fails closed today.
- Three near-duplicate "port gicFormsForCloudflare parity" PRDs in the iOS repo (`PRD.md`,
  `PRD202605111211.md`, `PRD202605111236.md`), a separate pivot PRD for a 28-worker Kids-AI batch
  (`PRD20_Kids_AI_Apps.md`), two overlapping DESIGN documents (`DESIGN.md`, `DESIGN copy.md`), and
  a README that claims "macOS 12.0 or later" while the Xcode project targets 26.0 across
  iOS/macOS/visionOS — a contradiction a new contributor has no way to resolve by reading the docs.
- On the web side, two competing PRDs (`PRDmd.md`, the original static-site plan, vs.
  `PRD-miniapps-site.md`, the backend/monetization/AI-generation plan) with an unresolved
  `onepageapps` vs. `miniapps` naming question, an incomplete template migration (nil-metadata
  templates silently excluded from the index), and `prompt.md` instructing work against a
  `PRD.md` file that does not exist in this repo.
- A scaffolded-but-unwired backend: `onePageAppsPrivate/cloudflare-bridge-worker.js` already
  implements `/validate`, `/ai/create`, `/ai/edit`, `/deploy/byo`, `/deploy/gic`, Stripe routes,
  and an API-key admin surface, with two test suites — none of it reachable from the live site.

Users must currently assemble a workflow themselves, and on the web the workflow is currently
impossible to complete at all: a visible **Deploy** or **Generate** button does not work. The
redesign must change the product hierarchy and finish wiring the backend loop — it is not merely
a restyle.

## 3. Product Objective

### 3.1 North-star journey

**Web:**

1. Land on the home page understanding what the product does in one sentence.
2. Browse or search the catalog.
3. Preview a widget.
4. Configure the few fields it needs.
5. Deploy it.
6. Get a live URL immediately.
7. Copy the link or embed snippet and share it.

**iOS:**

1. Open the app and see the template gallery.
2. Pick a template.
3. Configure it in a short wizard.
4. Enter (once) or reuse a stored Cloudflare API token.
5. Deploy.
6. See the live link.
7. Share via QR code, copy link, or system share sheet.

The complete journey should take no more than three minutes for a simple widget on either
surface.

### 3.2 Primary metrics (funnel)

- **Visit → preview:** percentage of site visitors who open at least one template preview.
- **Preview → deploy attempt:** percentage of previews that click Deploy / Generate.
- **Deploy attempt → live link:** percentage of deploy attempts that produce a working URL
  (today: 0%, because the bridge is unconfigured).
- **Live link → share/embed:** percentage of successful deploys where the user copies the link,
  downloads the QR, or copies an embed snippet.
- **iOS wizard completion:** percentage of started configuration wizards that reach a live
  deploy in the same sitting.

### 3.3 Quality constraints

- No Cloudflare API token is required on the web normal path (the bridge deploys to a
  GIC-managed Worker; BYO-Cloudflare remains available as an advanced/portability option, see
  `deployByo()` in the bridge worker).
- The iOS wizard completes in one sitting — no forced app backgrounding to fetch a token
  mid-flow.
- The interface always has one visually dominant next action; a visible button must work today
  (no dead-end CTAs).
- No YAML, "worker", "KV", or "wrangler" vocabulary appears on the normal path.
- Desktop and 360 px mobile journeys are both complete on the web.

## 4. Users & Jobs

### 4.1 Primary user

A non-developer who needs one small, single-purpose web thing right now: an event countdown, a
quick poll, a QR landing page, a link-in-bio page, a simple RSVP form. They do not want to learn
Cloudflare, write code, or manage hosting.

Primary jobs:

- "I need this one small page live today."
- "Show me something close to what I want, let me tweak a few fields."
- "Give me a link (and a QR code) I can send right now."
- "Let me do the same thing from my phone as from my laptop."

### 4.2 Advanced user

A developer who wants to deploy the widget to their own Cloudflare account (BYO), inspect or
copy the underlying Worker source, or use an API key for programmatic access. Advanced users
remain supported through progressive disclosure; their controls must not define the first-run
experience on either surface.

## 5. Architecture

```text
                    Google / direct visitor
                              |
                              v
        onePageApps catalog site (onepageapps.gic.mx, GitHub Pages)
        home -> browse -> preview -> generate/deploy -> share
                              |
                              v
              onePageAppsPrivate bridge Worker
       (/validate, /ai/create, /ai/edit, /deploy/gic, /deploy/byo)
                              ^
                              |
        oneTimeUseWebApp (iOS / macOS / visionOS, SwiftUI)
        gallery -> configure -> deploy -> link / QR / embed
```

- **`oneTimeUseWebApp/Models.swift`** remains the authoritative template metadata source
  (~208 `AppTemplate` entries: id, category, config fields, worker script).
- **`onePageApps/docs/apps-index.json.gz`** is the shared contract between the site and the iOS
  app — generated from the same template corpus, consumed by both `docs/*.html` (site) and
  `AppSettings.swift`'s `remoteAppsIndexGzipURL` (iOS sync).
- **`onePageAppsPrivate/cloudflare-bridge-worker.js`** is the single backend both surfaces call:
  the site calls it directly over HTTPS from browser JS; the iOS app calls the same routes (or
  deploys BYO directly to the user's Cloudflare account with their own token).
- **`onePageAppsPrivate` is intentionally not a git repo** (mirrors `formsPrivate`) — treat its
  contents as deploy target, not as something to `git init`.

## 6. Focused Journey per Surface

### 6.1 Web: home → browse → preview → generate → deploy → share

- **Home** states the promise in one sentence, surfaces a search box and a small set of popular
  categories — not all categories at once.
- **Browse** is search-first; result cards show name, one-line purpose, and one dominant
  **Preview** action.
- **Preview** (`preview.html`) shows the widget rendered with sample data, its configurable
  fields, and one dominant **Deploy** action.
- **Generate** (`generate.html`) — for AI-assisted or from-scratch flows — same contract: one
  dominant action, real-time status, no dead-end button.
- **Deploy** calls the bridge (`/deploy/gic` for the normal path), returns a live URL.
- **Share** surfaces the URL, a copy-link action, a QR code, and an embed snippet.

### 6.2 iOS: gallery → configure → deploy → link/QR/embed

- **Gallery** — the existing 3-tab app's template browser, grouped/searchable, not a flat list of
  208 items.
- **Configure** — a short wizard driven by the template's declared config fields in
  `Models.swift`.
- **Deploy** — uses the stored Cloudflare API token (Keychain) to deploy, via the bridge or
  directly to the user's own account for BYO.
- **Link/QR/embed** — live URL, QR code, system share sheet.

## 7–8. (Reserved — no additional workspace/library-experience sections beyond §6 for V1; see
Non-goals §15 for what is intentionally out of scope.)

## 9. Design Constitution

Every implementation and review task must enforce these rules:

1. One dominant action per screen or sheet.
2. Use the user's vocabulary: Template, Preview, Deploy, Share — not Worker, KV, wrangler, YAML.
3. Hide implementation formats and infrastructure terms until requested.
4. Prefer strong defaults over configuration.
5. Use progressive disclosure for advanced capability (BYO Cloudflare, API keys).
6. Do not repeat the same action in multiple persistent locations.
7. Do not add explanatory text when placement, naming, or defaults can make the action
   self-explanatory.
8. Empty states must offer one useful next action.
9. Success states must offer the next step in the journey (deployed → share, not deployed →
   dead end).
10. **No dead-end CTAs: a visible button must work today.** If a capability isn't wired yet,
    the button is hidden or disabled with a clear reason — never present-but-broken.

### 9.1 Visible-choice budgets

- Web home: 1 primary search action + a small popular-categories row (not the full category
  list).
- Preview page: 1 dominant Deploy action.
- Share sheet/state: 1 primary copy-link action; QR and embed are secondary.
- iOS gallery: search-first, not a flat 208-item list as the default view.
- iOS configure wizard: one screen's worth of fields at a time where the template has more than
  a handful.

## 10. Golden Journey

**Scenario:** A user wants an event countdown page for a wedding.

**Web:** They land on `onepageapps.gic.mx`, search "countdown", open the preview, see the widget
rendered with sample data, set the target date and event name, click Deploy, get a live URL
within seconds, copy the embed snippet, and paste it into another page — the countdown renders
live there too.

**iOS:** Independently, they open the oneTimeUseWebApp app on their phone, find the same
countdown template in the gallery, configure the same two fields, deploy using their stored
Cloudflare token, and get a live link and QR code on the device.

**Outcome contract:**

- Both journeys complete in under three minutes.
- No Cloudflare token is required on the web path; the iOS path uses one already stored in
  Keychain (or a one-time entry if first run).
- The deployed page is reachable from a clean browser with no login.
- The embed snippet, pasted elsewhere, renders the same live countdown.
- The iOS-deployed link opens correctly on a real device.

## 11. Public Template SEO Requirements

For every catalog/preview page:

- Stable, clean URL.
- Static HTML (GitHub Pages) containing the meaningful page content — no auth wall.
- Unique title, H1, description, and canonical URL in initial HTML.
- Human-readable purpose and a **Preview** / **Deploy** CTA into the live loop.
- Related templates and category links.
- Valid status codes, no soft-404s, included in an XML sitemap.

Indexing all ~208 templates is not itself a success criterion — pages must provide genuine value.

## 12. Analytics Events

The focused funnel requires (no tokens, no PII in payloads):

- `catalog_search`, `template_previewed`, `deploy_started`, `deploy_succeeded`,
  `deploy_failed` (with reason category, not raw error text), `link_copied`, `qr_opened`,
  `embed_copied`.
- iOS: `wizard_started`, `wizard_completed`, `token_stored`, `deploy_started`,
  `deploy_succeeded`, `deploy_failed`, `share_sheet_opened`.

## 13. Accessibility, Performance, and Security

- WCAG 2.2 AA target for the core journey on both surfaces.
- Complete keyboard operation for browse/preview/deploy on web.
- API tokens (Cloudflare, GIC-issued) live in the OS Keychain on iOS and are never placed in
  URLs or query strings on either surface.
- The bridge Worker enforces the rate limits it already declares
  (`RATE_LIMIT_RULES` in `cloudflare-bridge-worker.js`) for `deploy_byo`, `deploy_gic`, and
  `validate`.
- Published widgets get reasonable abuse controls (rate limiting) at the bridge layer; no
  new auth system is introduced for V1.

## 14. Pricing Assumption for Validation

Pricing/Stripe is explicitly **unvalidated and deferred** for V1 (see Non-goals). The bridge
worker already contains Stripe checkout/webhook code; it is not wired into the V1 UI. Any
pricing surfaces visible on the site today must be hidden or clearly free-labeled until Release
C (§17).

## 15. Non-goals

- Renaming the domain to `miniapps.gic.mx` — killed; `onepageapps.gic.mx` is final for this
  product.
- Kids AI Phase 20 (28-worker batch) — deferred, tracked only in the superseded
  `PRD20_Kids_AI_Apps.md`.
- Durable-Objects real-time apps — a brainstorm, not scoped for V1.
- Stripe monetization in V1 — code exists in the bridge worker but stays unwired until
  Release C.
- gicFormsForCloudflare parity port in V1 (iOS) — deferred, tracked only in the superseded
  `PRD.md` / `PRD202605111211.md` / `PRD202605111236.md`.
- visionOS App Store release — iOS ships first; macOS later; visionOS not in scope at all for
  this rollout.
- New templates — the ~208-template corpus is fixed for V1; growing it is separate work.
- Self-serve API-key admin UI — the bridge already has `/api/keys/*` / `/admin/keys/*` routes,
  but no UI is built for V1.

## 16. Release Gates

The focused journey is release-ready only when:

- All task IDs in both companion TODOs map to an implementation and verification task.
- The golden journey (§10) passes on both surfaces: on the live site (desktop + 360 px) and on
  a real iOS device.
- A reviewer unfamiliar with the implementation can complete both journeys without instructions.
- No dead-end CTA remains reachable from the normal path on the site.
- Existing public catalog/preview URLs remain reachable with the same canonical URLs.

## 17. Recommended Rollout

### Release A — Web loop live

Provision the bridge Worker (KV, secrets, deploy, DNS), wire `generate.html`/`preview.html` to
it end-to-end, remove dead-end CTAs. This is Phase 1–2 of `TODO_WEB_V1_FOCUSED.md`.

### Release B — iOS on App Store

Ship the existing 3-tab iOS app with App Store submission blockers resolved (icons, privacy
manifest, stray files, README, deployment target audit). This is `TODO_IOS_V1_FOCUSED.md`.

### Release C — Monetization

Wire the already-coded Stripe checkout/webhook/subscription paths into the site and (optionally)
the app; validate pricing against real usage.

### Release D — Advanced / AI power

Surface AI create/edit, BYO-Cloudflare self-serve, API-key admin, and the gicForms parity /
Kids-AI explorations through progressive disclosure, once the focused loop is proven.
