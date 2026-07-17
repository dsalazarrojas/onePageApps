# Local pipeline

This repo's local pipeline has two stages:

1. **Migrate content into `onePageApps/`**
2. **Generate the index artifacts in `docs/`**
3. **Publish regenerated site artifacts before a push**

The index generator is owned here and reads authoritative metadata from the companion app:

- Metadata: `../oneTimeUseWebApp/oneTimeUseWebApp/Models.swift`
- Companion worker source fallback: `../oneTimeUseWebApp/oneTimeUseWebApp/WorkerTemplates/`

## 1) Content migration

The production layout expected by the site is:

```text
onePageApps/
├── ai/
├── embeddable_widgets/
├── finance_business/
├── converter/
├── education/
├── accessibility_seo/
├── image_tools/
├── utility/
├── fun_misc/
├── developer_tools/
├── css_design/
├── creative/
├── text_tools/
├── seo_webmaster/
├── productivity/
├── svg_tools/
└── calculators/
```

Populate those category folders with each app's:

- `*.js` worker script
- `*_help.md` help document

If a migration helper exists in this repo later, run it first. If migration is still in progress, the index generator can temporarily validate against the companion app's `WorkerTemplates/` directory while still emitting the final `onePageApps` relative paths.

## 2) Generate the index

From the repo root:

```bash
node scripts/generate_index.js
```

Outputs:

- `docs/apps-index.json`
- `docs/apps-index.json.gz`
- `docs/last_updated.txt`

What the generator does:

- parses `AppTemplate(...)` entries from `Models.swift`
- maps app categories to the folder slugs defined in the PRD
- builds repo-relative `scriptPath` / `helpPath`
- creates missing `docs/`, `scripts/`, and category directories
- validates content from `onePageApps/` first
- falls back to `oneTimeUseWebApp/WorkerTemplates/` if migration is not complete yet
- fails with explicit errors if required metadata or content cannot be found

## 3) Publish workflow

Before pushing site changes, run:

```bash
./scripts/publish.sh
```

That script:

1. runs `node scripts/generate_index.js`
2. runs `node scripts/generate_categories.js`
3. prints a summary with total apps, category pages, and changed files
4. shows `git status` so you can review exactly what changed

If you want it to stage the generated artifacts after regeneration:

```bash
./scripts/publish.sh --stage
```

Recommended follow-up:

```bash
git add -p
git commit -m "chore: publish YYYY-MM-DD"
git push
```

## Strict mode

Once migration is complete, enforce repo-local content only:

```bash
node scripts/generate_index.js --strict-local-only
```

That mode fails if any expected `*.js` or `*_help.md` file is still missing from `onePageApps/`.

## Optional path overrides

```bash
node scripts/generate_index.js \
  --repo-root /absolute/path/to/onePageApps \
  --models /absolute/path/to/Models.swift \
  --companion-templates /absolute/path/to/WorkerTemplates
```

## Current validation notes

- The generator treats `Models.swift` as the source of truth for which apps are indexable.
- Templates without `workerScriptName` are skipped.
- The current registry produces **199** indexed apps.
- `WorkerTemplates/email_draft_assistant.js` exists in the companion app, but its `AppTemplate` currently has `workerScriptName: nil`, so it is intentionally excluded from the manifest until the metadata is updated.
