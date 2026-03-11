#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODELS_SWIFT="${MODELS_SWIFT:-/Volumes/2tb Mac Pro M2/GitHub/oneTimeUseWebApp/oneTimeUseWebApp/Models.swift}"
SOURCE_DIR="${SOURCE_DIR:-/Volumes/2tb Mac Pro M2/GitHub/oneTimeUseWebApp/oneTimeUseWebApp/WorkerTemplates}"

export REPO_ROOT MODELS_SWIFT SOURCE_DIR

python3 - <<'PY'
from pathlib import Path
import os
import re
import shutil
import sys

repo_root = Path(os.environ['REPO_ROOT'])
models_path = Path(os.environ['MODELS_SWIFT'])
source_dir = Path(os.environ['SOURCE_DIR'])

if not models_path.exists():
    raise SystemExit(f"Models.swift not found: {models_path}")
if not source_dir.exists():
    raise SystemExit(f"WorkerTemplates directory not found: {source_dir}")

category_specs = [
    ("AI", "ai", "AI-powered apps for text generation, analysis, extraction, and assistant workflows.", "smart_toy"),
    ("Embeddable Widgets", "embeddable_widgets", "Embeddable website widgets such as counters, pickers, bars, forms, and lightweight interactive UI blocks.", "widgets"),
    ("Finance & Business", "finance_business", "Business and finance tools for pricing, budgets, invoices, expenses, conversions, and operational workflows.", "trending_up"),
    ("Converter", "converter", "Conversion tools for files, data formats, media, units, encodings, and cross-format workflows.", "swap_horiz"),
    ("Education", "education", "Learning, quiz, study, practice, and classroom-oriented tools.", "school"),
    ("Accessibility & SEO", "accessibility_seo", "Accessibility auditing and SEO support tools for web quality, usability, and discoverability.", "visibility"),
    ("Image Tools", "image_tools", "Image editing and transformation tools for cropping, resizing, converting, annotating, and composing visuals.", "image"),
    ("Utility", "utility", "General-purpose utility apps for everyday web tasks, automation, sharing, and operational helpers.", "build"),
    ("Fun & Misc", "fun_misc", "Playful, novelty, and miscellaneous apps for experiments, entertainment, and casual utility.", "sentiment_very_satisfied"),
    ("Developer Tools", "developer_tools", "Developer-focused tools for formatting, debugging, testing, parsing, and inspecting technical data.", "code"),
    ("CSS & Design", "css_design", "CSS and visual design generators for styling, layout, effects, and interface polish.", "palette"),
    ("Creative", "creative", "Creative generation tools for design, writing, campaigns, content, and idea exploration.", "brush"),
    ("Text Tools", "text_tools", "Text-focused utilities for editing, counting, comparing, transforming, and preparing written content.", "text_fields"),
    ("SEO & Webmaster", "seo_webmaster", "SEO and webmaster tools for metadata, sitemaps, robots directives, indexing, and search previews.", "search"),
    ("Productivity", "productivity", "Productivity apps for scheduling, organization, tracking, notes, and day-to-day workflows.", "check_circle"),
    ("SVG Tools", "svg_tools", "SVG-specific tools for editing, optimizing, recoloring, and converting vector graphics.", "draw"),
    ("Calculators", "calculators", "Calculators for finance, health, time, tips, loans, and other quick computations.", "calculate"),
]
category_map = {name: {"slug": slug, "description": description, "icon": icon} for name, slug, description, icon in category_specs}
category_order = [name for name, *_ in category_specs]

models_text = models_path.read_text(encoding='utf-8')
anchor = 'static let templates: [AppTemplate] = ['
start = models_text.find(anchor)
if start == -1:
    raise SystemExit('Could not find TemplateRegistry in Models.swift')
templates_text = models_text[start + len(anchor):]


def extract_app_blocks(text: str):
    blocks = []
    i = 0
    while True:
        idx = text.find('AppTemplate(', i)
        if idx == -1:
            break
        j = idx + len('AppTemplate(')
        depth = 1
        in_string = False
        escape = False
        while j < len(text) and depth > 0:
            ch = text[j]
            if in_string:
                if escape:
                    escape = False
                elif ch == '\\':
                    escape = True
                elif ch == '"':
                    in_string = False
            else:
                if ch == '"':
                    in_string = True
                elif ch == '(':
                    depth += 1
                elif ch == ')':
                    depth -= 1
            j += 1
        if depth != 0:
            raise SystemExit('Unbalanced parentheses while parsing Models.swift')
        blocks.append(text[idx:j])
        i = j
    return blocks


def extract_string(block: str, field: str):
    match = re.search(rf'{re.escape(field)}:\s*"((?:[^"\\]|\\.)*)"', block, re.S)
    if not match:
        return None
    return bytes(match.group(1), 'utf-8').decode('unicode_escape')


def slugify(value: str):
    value = value.lower()
    value = re.sub(r'[^a-z0-9]+', '_', value)
    value = re.sub(r'_+', '_', value).strip('_')
    return value

entries = []
missing_categories = []
for block in extract_app_blocks(templates_text):
    name = extract_string(block, 'name')
    category = extract_string(block, 'category')
    description = extract_string(block, 'description') or ''
    worker = extract_string(block, 'workerScriptName')
    help_name = extract_string(block, 'helpDocumentName')
    if not name or not category:
        continue
    if category not in category_map:
        missing_categories.append((name, category))
        continue
    if worker is None:
        fallback = slugify(name)
        if (source_dir / f'{fallback}.js').exists():
            worker = fallback
    entries.append({
        'name': name,
        'category': category,
        'description': description.strip(),
        'worker': worker,
        'help_name': help_name,
    })

if missing_categories:
    formatted = ', '.join(f'{name} -> {category}' for name, category in missing_categories[:10])
    raise SystemExit(f'Found unknown categories in Models.swift: {formatted}')

category_dirs = []
for category_name in category_order:
    slug = category_map[category_name]['slug']
    category_dir = repo_root / slug
    category_dir.mkdir(parents=True, exist_ok=True)
    category_dirs.append(category_dir)
    for path in category_dir.glob('*.js'):
        path.unlink()
    for path in category_dir.glob('*_help.md'):
        path.unlink()
    meta_path = category_dir / 'meta.yaml'
    if meta_path.exists():
        meta_path.unlink()

copied = []
stubbed = []
missing_sources = []
skipped = []
seen_workers = set()

for entry in entries:
    worker = entry['worker']
    if not worker:
        skipped.append(entry)
        continue
    if worker in seen_workers:
        raise SystemExit(f'Duplicate worker mapping detected for {worker}')
    seen_workers.add(worker)

    category_slug = category_map[entry['category']]['slug']
    category_dir = repo_root / category_slug
    source_js = source_dir / f'{worker}.js'
    if not source_js.exists():
        missing_sources.append(f'missing js: {worker}.js ({entry["name"]})')
        continue

    dest_js = category_dir / source_js.name
    shutil.copy2(source_js, dest_js)

    help_base = entry['help_name'] or f'{worker}_help'
    source_help = source_dir / f'{help_base}.md'
    dest_help = category_dir / f'{worker}_help.md'
    if source_help.exists():
        shutil.copy2(source_help, dest_help)
    else:
        stub_text = (
            f"# {entry['name']}\n\n"
            "## What it does\n"
            f"{entry['description'] or 'This one-page app was migrated without a source help file, so this stub preserves the basic app metadata.'}\n\n"
            "## What you need\n"
            "- Review the companion app template for configuration requirements and deployment details.\n\n"
            "## Notes\n"
            "- This help file was generated automatically because the source `_help.md` file was missing during migration.\n"
        )
        dest_help.write_text(stub_text, encoding='utf-8')
        stubbed.append(dest_help.relative_to(repo_root).as_posix())

    copied.append({**entry, 'category_slug': category_slug})

if missing_sources:
    raise SystemExit('\n'.join(missing_sources))

source_js_files = sorted(p.stem for p in source_dir.glob('*.js'))

counts_by_category = {category_map[name]['slug']: 0 for name in category_order}
for entry in copied:
    counts_by_category[entry['category_slug']] += 1

for category_name in category_order:
    spec = category_map[category_name]
    category_dir = repo_root / spec['slug']
    meta_text = (
        '# Generated by scripts/migrate_workers.sh\n'
        f'name: "{category_name.replace(chr(34), r"\\\"")}"\n'
        f'slug: "{spec["slug"]}"\n'
        f'description: "{spec["description"].replace(chr(34), r"\\\"")}"\n'
        f'icon: "{spec["icon"]}"\n'
        f'appCount: {counts_by_category[spec["slug"]]}\n'
    )
    (category_dir / 'meta.yaml').write_text(meta_text, encoding='utf-8')

migrated_js = []
migrated_help = []
for category_name in category_order:
    slug = category_map[category_name]['slug']
    category_dir = repo_root / slug
    migrated_js.extend(sorted(category_dir.glob('*.js')))
    migrated_help.extend(sorted(category_dir.glob('*_help.md')))
missing_destination_help = []
for js_path in migrated_js:
    help_path = js_path.with_name(f'{js_path.stem}_help.md')
    if not help_path.exists():
        missing_destination_help.append(help_path.relative_to(repo_root).as_posix())

if missing_destination_help:
    raise SystemExit('Missing help files after migration: ' + ', '.join(missing_destination_help))

orphan_source_js = sorted(set(source_js_files) - seen_workers)
print(f'Migrated apps: {len(copied)}')
print(f'Stub help files generated: {len(stubbed)}')
print(f'Skipped templates without resolvable worker script: {len(skipped)}')
print(f'Migrated JS files: {len(migrated_js)}')
print(f'Migrated help files: {len(migrated_help)}')
print(f'Source JS files not referenced by Models.swift: {len(orphan_source_js)}')
if orphan_source_js:
    print('Orphan source JS:', ', '.join(orphan_source_js))
if skipped:
    print('Skipped templates:')
    for entry in skipped:
        print(f"- {entry['name']} ({entry['category']})")
if stubbed:
    print('Stubbed help files:')
    for path in stubbed:
        print(f'- {path}')
PY
