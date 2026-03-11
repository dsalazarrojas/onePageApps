# 📦 200+ One-Page Apps for Cloudflare Workers

[![Code License: MIT](https://img.shields.io/badge/Code%20License-MIT-blue.svg)](LICENSE-CODE)
[![Apps Count](https://img.shields.io/badge/Apps-200+-green.svg)](#repository-layout)
[![Categories](https://img.shields.io/badge/Categories-17-orange.svg)](#repository-layout)

**onePageApps.gic.mx** is the static content repository for the GIC one-page app library.

It bootstraps the content layer for the companion **`oneTimeUseWebApp`** app by organizing Cloudflare Worker templates and their help documents into category folders.

## Current scope

This repository currently covers the Phase 0 / Phase 1 bootstrap work from the PRD:
- repository scaffolding
- category folder metadata
- worker/help content migration from `oneTimeUseWebApp`

Site pages, category HTML generation, and `docs/apps-index.json` generation are intentionally left for later tasks.

## Quick start

From this repository root:

```bash
./scripts/migrate_workers.sh
```

The migration script reads app metadata from:
- `../oneTimeUseWebApp/oneTimeUseWebApp/Models.swift`
- `../oneTimeUseWebApp/oneTimeUseWebApp/WorkerTemplates/`

Then it:
- creates the 17 category folders
- copies each worker `.js` file into the correct category
- copies the matching `_help.md` file
- generates stub help only when a source help file is truly missing
- writes `meta.yaml` for every category with app counts

## Repository layout

```text
.github/ISSUE_TEMPLATE/   Issue templates
categories/               Future SEO category pages scaffold
calculators/              Migrated worker templates + meta.yaml
...                       16 more category folders
creative/
docs/assets/              GitHub Pages assets scaffold
scripts/migrate_workers.sh
```

## Companion project

Source templates come from:
- `/Volumes/2tb Mac Pro M2/GitHub/oneTimeUseWebApp`

## License

Code in this repository is licensed under MIT. See [LICENSE-CODE](LICENSE-CODE).
