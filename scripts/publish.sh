#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE_FILES=0

if [[ "${1:-}" == "--stage" ]]; then
  STAGE_FILES=1
fi

cd "$ROOT_DIR"

echo "==> Regenerating apps index"
node scripts/generate_index.js

echo ""
echo "==> Regenerating category pages, robots.txt, and sitemap.xml"
node scripts/generate_categories.js

APP_COUNT="$(node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync('docs/apps-index.json','utf8'));process.stdout.write(String(data.totalApps||data.apps.length||0));")"
CATEGORY_COUNT="$(find categories -maxdepth 1 -name '*.html' | wc -l | tr -d ' ')"
CHANGED_FILES="$(git --no-pager status --short | wc -l | tr -d ' ')"

echo ""
echo "==> Summary"
echo "Apps indexed: $APP_COUNT"
echo "Category HTML files: $CATEGORY_COUNT"
echo "Files changed in git status: $CHANGED_FILES"

if [[ "$STAGE_FILES" -eq 1 ]]; then
  echo ""
  echo "==> Staging generated artifacts"
  git add docs/ categories/ robots.txt sitemap.xml generate.html success.html assets/ docs/assets/ about.html browse.html preview.html index.html LOCAL_PIPELINE.md MINIAPPS_SITE_TODO.md
fi

echo ""
echo "==> Git status"
git --no-pager status --short

echo ""
echo "Done. Review with 'git diff' or 'git add -p' before committing."
