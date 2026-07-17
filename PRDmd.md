> **SUPERSEDED by [`PRD_FOCUSED_ONEPAGEAPP_JOURNEY.md`](./PRD_FOCUSED_ONEPAGEAPP_JOURNEY.md)**
> (2026-07-16). This document is kept for historical reference only; do not use it to plan new
> work. See the focused PRD and its companion TODOs
> (`TODO_WEB_V1_FOCUSED.md`, `../oneTimeUseWebApp/TODO_IOS_V1_FOCUSED.md`) instead.

# PRD — onePageApps.gic.mx

**Product:** One-Page Apps Showcase & Distribution Site  
**Domain:** `onePageApps.gic.mx`  
**Repository:** `onePageApps` (GitHub Pages, same pattern as `forms`)  
**Companion App:** `oneTimeUseWebApp` (iOS/macOS SwiftUI app)  
**Date:** March 11, 2026  

---

## 1. Executive Summary

Build a static GitHub Pages website at `onePageApps.gic.mx` that showcases, lets users try, and distributes the 200 one-page web apps (Cloudflare Worker templates) from the `oneTimeUseWebApp` iOS/macOS app. The site replicates the proven architecture of `forms.gic.mx` (84,000+ YAML form templates), adapted for mini web apps instead of forms:

- **GitHub repo** hosts the app assets (`.js` workers, `_help.md` docs) organized by category folders.
- **GitHub Pages** serves the static site: homepage, browse page, preview/try page, category pages.
- **`apps-index.json`** is the central manifest the site reads (and the iOS app downloads).
- **The iOS app** (`oneTimeUseWebApp`) fetches `apps-index.json` from the site to sync its template gallery, exactly as `gicFormsForCloudflare` does with `forms-index.json`.

---

## 2. Architecture Comparison: forms.gic.mx → onePageApps.gic.mx

| Aspect | forms.gic.mx | onePageApps.gic.mx |
|---|---|---|
| **Content unit** | YAML form template + .xlsx + .help.md | .js worker script + _help.md |
| **Content count** | 84,298 forms | 200 apps (growing) |
| **Categories** | 418 (folder-based) | 17 (folder-based) |
| **Index file** | `docs/forms-index.json` | `docs/apps-index.json` |
| **Compressed index** | `docs/forms-index.sqlite.gz` | `docs/apps-index.json.gz` (optional) |
| **Browse page** | `browse.html` — search, filter by category/language/question count | `browse.html` — search, filter by category/AI-required/stores-data |
| **Preview page** | `preview.html?id=...` — renders YAML form visually | `preview.html?id=...` — live demo iframe + help docs + deploy CTA |
| **Category pages** | `categories/*.html` — SEO landing per top category | `categories/*.html` — SEO landing per category |
| **Companion app** | `gicFormsForCloudflare` (macOS) | `oneTimeUseWebApp` (iOS/macOS) |
| **App ↔ Site sync** | App fetches `forms-index.json` from `forms.gic.mx` | App fetches `apps-index.json` from `onePageApps.gic.mx` |
| **Hosting** | GitHub Pages + custom domain (CNAME) | GitHub Pages + custom domain (CNAME) |
| **Analytics** | GA4 (G-KE41D4D58D) | GA4 (new property, TBD) |
| **Design system** | Tailwind CDN, Public Sans, Material Symbols, orange primary `#ec5b13` | Same design system for brand consistency |

---

## 3. Repository Structure

```
onePageApps/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── request-an-app.md
│   └── FUNDING.yml
├── docs/                              # ← GitHub Pages serves from here
│   ├── assets/
│   │   └── social-preview.png
│   ├── apps-index.json                # Central manifest
│   ├── apps-index.json.gz             # Compressed for app download
│   ├── last_updated.txt
│   ├── index.html                     # → symlink or copy of top-level
│   ├── browse.html
│   ├── preview.html
│   ├── robots.txt
│   └── sitemap.xml
├── categories/
│   ├── index.html
│   ├── ai.html
│   ├── embeddable-widgets.html
│   ├── finance-business.html
│   ├── converter.html
│   ├── education.html
│   ├── accessibility-seo.html
│   ├── image-tools.html
│   ├── utility.html
│   ├── fun-misc.html
│   ├── developer-tools.html
│   ├── css-design.html
│   ├── creative.html
│   ├── text-tools.html
│   ├── seo-webmaster.html
│   ├── productivity.html
│   ├── svg-tools.html
│   └── calculators.html
├── ai/                                # One folder per category
│   ├── meta.yaml                      # Category metadata
│   ├── text_summarizer.js
│   ├── text_summarizer_help.md
│   ├── text_translator.js
│   ├── text_translator_help.md
│   └── ...
├── embeddable_widgets/
│   ├── meta.yaml
│   ├── embeddable_visitor_counter.js
│   ├── embeddable_visitor_counter_help.md
│   └── ...
├── finance_business/
│   └── ...
├── converter/
│   └── ...
├── ... (14 more category folders)
├── scripts/
│   ├── generate_index.js              # Builds apps-index.json from folders
│   └── generate_categories.js         # Builds category HTML pages
├── about.html
├── contact.html
├── privacy.html
├── terms.html
├── CNAME                              # onePageApps.gic.mx
├── index.html                         # Homepage
├── browse.html                        # Browse/search all apps
├── preview.html                       # App preview/try page
├── robots.txt
├── sitemap.xml
├── README.md
├── LICENSE-CODE                        # MIT
├── PRD.md                             # This file
└── .gitignore
```

---

## 4. `apps-index.json` Schema

The central manifest, analogous to `forms-index.json`:

```json
{
  "generatedAt": "2026-03-11T12:00:00Z",
  "totalApps": 200,
  "apps": [
    {
      "id": "text_summarizer--ai",
      "name": "Text Summarizer",
      "category": "ai",
      "categoryDisplay": "AI",
      "description": "Paste text, get a concise summary powered by your chosen LLM.",
      "systemImage": "doc.text.magnifyingglass",
      "workerScriptName": "text_summarizer",
      "scriptPath": "ai/text_summarizer.js",
      "helpPath": "ai/text_summarizer_help.md",
      "hasHelp": true,
      "requiresAI": true,
      "storesData": false,
      "supportsNotifications": false,
      "requiredKeys": ["openAI"],
      "tags": ["text", "ai", "summarize", "llm"]
    }
  ]
}
```

**Key differences from forms-index.json:**
- `questionCount` / `questionTypes` → replaced by `requiresAI`, `storesData`, `requiredKeys`
- `filePath` / `xlsxPath` → `scriptPath`, `helpPath`
- Added `tags` for richer search
- Added `systemImage` so the app can use the site as source of truth

---

## 5. Detailed Task List

### Phase 0 — Repository Setup & Scaffolding

- [X] **0.1** Initialize the `onePageApps` Git repo with `.gitignore`, `README.md`, `LICENSE-CODE` (MIT).
- [X] **0.2** Create the `CNAME` file with `onePageApps.gic.mx`.
- [ ] **0.3** Set up the DNS record for `onePageApps.gic.mx` → GitHub Pages.
- [ ] **0.4** Enable GitHub Pages (serve from root or `/docs`).
- [X] **0.5** Create the folder structure: `docs/`, `docs/assets/`, `categories/`, `scripts/`.
- [X] **0.6** Add `.github/ISSUE_TEMPLATE/request-an-app.md`.
- [X] **0.7** Add `.github/FUNDING.yml` (same as forms repo).

### Phase 1 — Content Migration (Worker Scripts → Category Folders)

- [X] **1.1** Define the 17 category folder names mapping from the app's category strings:

  | App Category String | Folder Name |
  |---|---|
  | AI | `ai/` |
  | Embeddable Widgets | `embeddable_widgets/` |
  | Finance & Business | `finance_business/` |
  | Converter | `converter/` |
  | Education | `education/` |
  | Accessibility & SEO | `accessibility_seo/` |
  | Image Tools | `image_tools/` |
  | Utility | `utility/` |
  | Fun & Misc | `fun_misc/` |
  | Developer Tools | `developer_tools/` |
  | CSS & Design | `css_design/` |
  | Creative | `creative/` |
  | Text Tools | `text_tools/` |
  | SEO & Webmaster | `seo_webmaster/` |
  | Productivity | `productivity/` |
  | SVG Tools | `svg_tools/` |
  | Calculators | `calculators/` |

- [X] **1.2** Write a script (`scripts/migrate_workers.sh`) that reads the `AppTemplate` registry from `Models.swift`, copies each `.js` and `_help.md` file from `oneTimeUseWebApp/oneTimeUseWebApp/WorkerTemplates/` into the correct category folder in `onePageApps/`.
- [X] **1.3** Create `meta.yaml` for each category folder:
  ```yaml
  name: "AI"
  slug: "ai"
  description: "AI-powered apps that use LLMs for text analysis, generation, and translation."
  icon: "smart_toy"
  appCount: 25
  ```
- [X] **1.4** Run the migration and verify all 200 `.js` files + their `_help.md` companions land in the correct folders.
- [X] **1.5** Audit: Confirm no `.js` file is missing a `_help.md` companion. Generate stubs for any missing ones.

### Phase 2 — Index Generation Pipeline

- [X] **2.1** Write `scripts/generate_index.js` (Node.js script, runs locally):
  - Walk all category folders
  - For each `.js` file, extract metadata from the `AppTemplate` registry in `Models.swift` (or from a parallel `app_manifest.json` per category)
  - Generate `docs/apps-index.json` with the schema from §4
  - Generate `docs/apps-index.json.gz` (gzipped copy for app download)
  - Write `docs/last_updated.txt` with ISO timestamp
- [ ] **2.2** Alternative simpler approach: write a Swift script or Python script that parses `Models.swift` directly to extract all `AppTemplate(...)` entries and builds the JSON.
- [X] **2.3** Document the local build pipeline in `LOCAL_PIPELINE.md` (same pattern as forms repo).
- [ ] **2.4** Run the pipeline. Verify `apps-index.json` contains all 200 entries with correct metadata.

### Phase 3 — Homepage (`index.html`)

Replicate the `forms.gic.mx/index.html` structure, adapted for apps:

- [X] **3.1** Sticky header with logo ("GIC One-Page Apps"), nav links (Browse Apps, App Suite, How It Works), dark mode toggle, Browse CTA.
- [X] **3.2** Hero section:
  - Badge: "AI-Powered One-Page App Platform"
  - H1: "200+ One-Page Web Apps — Deploy in One Click"
  - Subtitle: "Free Cloudflare Worker apps for every need — AI tools, widgets, converters, calculators, and more. Deploy to your own Cloudflare account or try them here."
  - CTA buttons: "Browse Apps" + "Get the App" (App Store link)
  - Stats row: 200 Apps / 17 Categories / One-Click Deploy
- [X] **3.3** Browser mockup (right column): mini browse UI showing a 2×2 grid of app cards (AI, Widget, Converter, Finance categories).
- [X] **3.4** "How It Works" section (3 steps):
  1. Browse & Choose → pick from 200+ apps
  2. Configure → set your API keys, customize branding
  3. Deploy → one click to Cloudflare Workers, share the URL
- [X] **3.5** App Suite section: cards for `oneTimeUseWebApp` (iOS/macOS) with App Store link + "or use this site" note.
- [X] **3.6** Category highlights section: show top 6 categories as cards with icon, name, app count, and link to category page.
- [X] **3.7** CTA section: "Ready to deploy your next tool?" with Browse + Get App buttons.
- [X] **3.8** Footer: matching forms.gic.mx footer layout — Browse column, GIC Apps column, Legal column, disclaimer.
- [X] **3.9** Script block: load `apps-index.json`, update stats counters dynamically.
- [X] **3.10** Dark mode support (same `gic-theme` localStorage key for consistency across GIC sites).

### Phase 4 — Browse Page (`browse.html`)

Replicate `forms.gic.mx/browse.html` adapted for apps:

- [X] **4.1** Search bar: full-text search across app name, description, tags, and category.
- [ ] **4.2** Sidebar filters:
  - **Category filter**: list all 17 categories with app counts, checkboxes or radio buttons.
  - **Requires AI**: toggle filter (Yes/No/All).
  - **Stores Data**: toggle filter (Yes/No/All) — shows which apps need Cloudflare KV.
  - **Required Keys**: filter by API key requirement (None, OpenAI, Fal, etc.).
- [X] **4.3** App card grid:
  - Each card shows: category badge (color-coded), app name, description (2-line clamp), tags, "Requires AI" chip if applicable, "Try It →" and "Help" links.
  - Cards link to `preview.html?id={app_id}`.
- [ ] **4.4** Sort options: A-Z, Category, Newest.
- [X] **4.5** Pagination or infinite scroll (200 apps is manageable — virtual scroll or load-all is fine).
- [X] **4.6** URL hash state: `browse.html#category=ai&q=translator` — so deep-links work and the app can link directly to filtered views.
- [X] **4.7** "No results" state with suggestion to request a new app via GitHub Issue.
- [X] **4.8** Loading skeleton (same animation as forms browse page).

### Phase 5 — Preview / Try Page (`preview.html`)

This is the key differentiator vs. the forms site. Instead of just showing a form preview, users can **actually use the app** in-browser:

- [X] **5.1** Load app metadata from `apps-index.json` based on `?id=` query param.
- [X] **5.2** App info header: name, category badge, description, "Requires AI" / "Stores Data" badges.
- [X] **5.3** Live demo panel (primary content):
  - For apps that DON'T require API keys (pure client-side): load the worker `.js` into a sandboxed iframe or render the HTML directly. These are the apps users can try immediately (calculators, converters, CSS generators, etc.).
  - For apps that DO require API keys: show a "demo unavailable" card with explanation + "Deploy with the App" CTA. Optionally show a screenshot or animated GIF of the app in action.
  - Determine which apps are client-side-tryable by checking `requiredKeys.length === 0 && !requiresAI`.
- [X] **5.4** Help/documentation tab: render the `_help.md` file as formatted markdown (using marked.js or similar), same as forms preview renders YAML help guides.
- [X] **5.5** "Deploy This App" section:
  - Primary CTA: "Deploy with OneTimeUseWebApp" → App Store deep-link or universal link.
  - Secondary: "View Source" → link to the `.js` file on GitHub.
  - Embed code snippet (for embeddable widgets): `<iframe src="..." width="100%" height="500"></iframe>`.
- [X] **5.6** Related apps section: show 3-4 apps from the same category.
- [X] **5.7** Schema.org `SoftwareApplication` structured data.
- [X] **5.8** Open Graph + Twitter Card meta tags (dynamic per app).
- [X] **5.9** Breadcrumb: Home > Category > App Name.

### Phase 6 — Category Pages (`categories/*.html`)

- [X] **6.1** Category index page (`categories/index.html`): grid of all 17 categories with icon, name, description, app count.
- [X] **6.2** Individual category pages: one per category, each listing all apps in that category as cards.
  - Header: category name, description from `meta.yaml`, app count.
  - App grid: same card component as browse page, filtered to this category.
  - SEO: unique title, meta description, canonical URL.
- [X] **6.3** Write `scripts/generate_categories.js` to auto-generate these from `apps-index.json` + `meta.yaml` files.

### Phase 7 — Static Pages

- [X] **7.1** `about.html` — About GIC One-Page Apps, link to the iOS app, link to forms.gic.mx, author info.
- [X] **7.2** `contact.html` — Contact form or email link + GitHub Issues link.
- [X] **7.3** `privacy.html` — Privacy policy (apps run on user's Cloudflare account, no data collected by GIC).
- [X] **7.4** `terms.html` — Terms of service.
- [X] **7.5** `robots.txt` — Allow all, reference sitemap.
- [X] **7.6** `sitemap.xml` — Include homepage, browse, all category pages, all preview pages (`preview.html?id=...`). Generate via script.

### Phase 8 — iOS App Integration

Update `oneTimeUseWebApp` to fetch its template registry from the site:

- [X] **8.1** Add `onePageApps.gic.mx` as the canonical URL for the apps index in `AppSettings.swift` or a new constant.
- [X] **8.2** Add a `RemoteTemplateSync` service (similar to how `gicFormsForCloudflare` syncs from `forms.gic.mx/docs/forms-index.json`):
  - On app launch (or manual refresh), fetch `https://onePageApps.gic.mx/docs/apps-index.json.gz`.
  - Compare `generatedAt` timestamp with cached version.
  - If newer: download, decompress, update the local template registry.
  - Fallback: use bundled `apps-index.json` if network unavailable.
- [X] **8.3** Update `TemplateGalleryView.swift` to support both bundled templates and remote templates.
- [X] **8.4** Add "New" badge for apps added since last sync.
- [X] **8.5** Add "Open on Web" button in `ConfigurationView.swift` and `DeployResultView.swift` that links to `https://onePageApps.gic.mx/preview.html?id={app_id}`.
- [X] **8.6** Add deep-link support: `onepageapps://app/{app_id}` → opens the template in the app.

### Phase 9 — SEO & Analytics

- [ ] **9.1** Create a new GA4 property for `onePageApps.gic.mx` (or reuse the existing GIC one with a separate stream).
- [ ] **9.2** Add GA4 tracking to all pages.
- [ ] **9.3** Track custom events:
  - `app_view` (preview page load)
  - `app_try` (live demo interaction)
  - `deploy_cta_click` (deploy button click)
  - `app_store_click` (app store link click)
  - `category_browse` (category page view)
  - `search` (browse search query)
- [ ] **9.4** Add Schema.org `WebSite` + `SoftwareApplication` structured data.
- [ ] **9.5** Add Open Graph + Twitter card meta tags to all page templates.
- [ ] **9.6** Submit sitemap to Google Search Console.
- [ ] **9.7** Set canonical URLs on all pages.

### Phase 10 — Cross-Promotion & Ecosystem Links

- [ ] **10.1** Add "One-Page Apps" link in `forms.gic.mx` footer under "GIC Apps".
- [ ] **10.2** Add "One-Page Apps" link in the `gicFormsForCloudflare` app (since it references Cloudflare Workers).
- [ ] **10.3** Add "Forms Library" link in `onePageApps.gic.mx` footer pointing to `forms.gic.mx`.
- [ ] **10.4** Update `gic.mx` to include the One-Page Apps site in the product ecosystem.
- [ ] **10.5** Add app-ads.txt if applicable.

### Phase 11 — Launch Checklist

- [ ] **11.1** Verify HTTPS + custom domain working.
- [ ] **11.2** Verify all 200 apps appear in browse page with correct metadata.
- [ ] **11.3** Verify preview page works for at least 10 client-side-tryable apps (calculators, converters, CSS generators).
- [X] **11.4** Verify preview page shows "deploy required" state for AI-dependent apps.
- [X] **11.5** Verify category pages load and show correct app counts.
- [ ] **11.6** Verify `apps-index.json` is accessible at `https://onePageApps.gic.mx/docs/apps-index.json`.
- [ ] **11.7** Verify iOS app can download and parse `apps-index.json` from the site.
- [ ] **11.8** Lighthouse audit: Performance ≥ 90, Accessibility ≥ 90, SEO ≥ 90.
- [ ] **11.9** Test dark mode on all pages.
- [ ] **11.10** Test mobile responsiveness on all pages.
- [ ] **11.11** Verify sitemap.xml is valid and contains all expected URLs.

---

## 6. Client-Side Tryable Apps (Immediate Live Demo)

These apps have `requiredKeys: []` and `requiresAI: false`, meaning they work entirely in the browser with no API keys. The preview page should render them as live demos:

| Category | Count | Examples |
|---|---|---|
| Calculators | 4 | BMI/BMR Calculator, Age Calculator, Loan EMI Calculator, Tip Calculator |
| Converter | ~12 | Color Converter, CSV/JSON Converter, Unit Converter, Timestamp Converter, Number Base Converter, Roman Numeral, Morse Code, etc. |
| CSS & Design | 7 | Box Shadow Generator, Gradient Generator, Glassmorphism, Flexbox Playground, Border Radius, Button Style, Neumorphism |
| Developer Tools | ~5 | Regex Tester, JSON Formatter, Cron Tester, JWT Decoder, URL Parser |
| Image Tools | ~8 | Image Cropper, Resizer, Rotator, Format Converter, Collage Maker, etc. |
| SVG Tools | 4 | SVG Editor, Optimizer, Recolorer, SVG to Image |
| Text Tools | ~4 | Word Counter, Case Converter, Duplicate Line Remover, Text Diff |
| Utility | ~7 | Password Generator, QR Code Generator, Encode/Decode, Lorem Ipsum, etc. |
| Embeddable Widgets (some) | ~10 | Countdown Timer, Scroll Progress Bar, Back-to-Top Button, Live Clock, etc. |
| Fun & Misc | ~5 | Typing Test, ASCII Art, Emoji Picker, Meme Generator, Confetti Button |

**~70 apps** can offer live in-browser demos. The remaining ~130 require API keys or KV storage and show a "Deploy to try" state.

---

## 7. Technical Decisions

### 7.1 Static site (no build framework)
Same as forms.gic.mx: plain HTML + Tailwind CDN + vanilla JS. No React/Next/Hugo needed. This keeps the site simple, fast, and easy to maintain with the same tooling.

### 7.2 Preview sandboxing
For live demos, each worker `.js` file contains a complete HTML page in the `fetch()` handler's response. To render a live demo:
1. The preview page fetches the raw `.js` file from the repo.
2. Extracts the HTML string from the worker's response body.
3. Renders it in a sandboxed `<iframe>` with `sandbox="allow-scripts allow-forms"`.
4. A helper script or regex extracts the HTML template from the worker code.

### 7.3 Index sync strategy (app ↔ site)
- The iOS app downloads `apps-index.json.gz` on first launch and on manual refresh (or every 24h).
- The app compares `generatedAt` with cached timestamp; only re-downloads if newer.
- The bundled `apps-index.json` in the app bundle serves as the offline fallback.
- This is identical to how `gicFormsForCloudflare` handles `forms-index.json`.

### 7.4 No server-side logic
Everything is static HTML + client-side JS, served by GitHub Pages. The `.js` worker files are source code assets, not executed server-side. Live demos run in sandboxed iframes client-side.

---

## 8. Content Per App (Stored in Repo)

Each app in the repo has exactly 2 files in its category folder:

| File | Purpose | Example |
|---|---|---|
| `{name}.js` | Cloudflare Worker source code | `ai/text_summarizer.js` |
| `{name}_help.md` | Documentation/help guide | `ai/text_summarizer_help.md` |

Plus one `meta.yaml` per category folder with category metadata.

This mirrors the forms repo where each form has `.yaml`, `.xlsx`, and `.help.md`.

---

## 9. Implementation Priority

| Priority | Phase | Effort | Impact |
|---|---|---|---|
| 🔴 P0 | Phase 0 — Repo setup | 1 day | Foundation |
| 🔴 P0 | Phase 1 — Content migration | 1 day | Content |
| 🔴 P0 | Phase 2 — Index generation | 1 day | Core pipeline |
| 🔴 P0 | Phase 3 — Homepage | 2 days | Public face |
| 🔴 P0 | Phase 4 — Browse page | 2 days | Core UX |
| 🟡 P1 | Phase 5 — Preview page | 3 days | Key differentiator |
| 🟡 P1 | Phase 6 — Category pages | 1 day | SEO |
| 🟡 P1 | Phase 7 — Static pages | 1 day | Legal/info |
| 🟡 P1 | Phase 8 — iOS app integration | 2 days | Ecosystem sync |
| 🟢 P2 | Phase 9 — SEO & analytics | 1 day | Growth |
| 🟢 P2 | Phase 10 — Cross-promotion | 0.5 day | Ecosystem |
| 🟢 P2 | Phase 11 — Launch checklist | 1 day | QA |

**Total estimated effort:** ~16 days

---

## 10. Success Metrics

- Site is live at `onePageApps.gic.mx` with all 200 apps browsable
- `apps-index.json` is publicly accessible and parseable by the iOS app
- At least 70 apps have working live demos in the preview page
- iOS app successfully syncs templates from the site
- Google indexes the site within 2 weeks of launch
- Category pages rank for "[category] web tools" keywords within 3 months

---

## 11. Future Work (Out of Scope for v1)

- [ ] User-submitted apps via PR template
- [ ] Analytics dashboard showing app usage/deploy counts
- [ ] Premium/paid app tier
- [ ] Cloudflare Workers deployment directly from the website (no app needed)
- [ ] App versioning and update notifications
- [ ] Spanish/multi-language support
- [ ] Community ratings/reviews for apps
- [ ] PWA with offline browse capability
