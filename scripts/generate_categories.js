#!/usr/bin/env node
/**
 * generate_categories.js
 * Reads docs/apps-index.json + each category's meta.yaml, then writes:
 *   categories/index.html
 *   categories/<slug>.html  (one per category)
 *   robots.txt
 *   sitemap.xml
 *   docs/robots.txt  (mirror for Pages)
 *   docs/sitemap.xml (mirror for Pages)
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT        = path.resolve(__dirname, "..");
const DOCS_DIR    = path.join(ROOT, "docs");
const CAT_DIR     = path.join(ROOT, "categories");
const INDEX_JSON  = path.join(DOCS_DIR, "apps-index.json");

const BASE_URL    = "https://onePageApps.gic.mx";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readYAML(p) {
  // Tiny YAML reader — handles simple key: "value" / key: value lines only
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const obj   = {};
  for (const line of lines) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (m) obj[m[1]] = m[2].replace(/^"(.*)"$/, "$1").trim();
  }
  return obj;
}

function slugToHtmlFile(slug) {
  return slug.replace(/_/g, "-") + ".html";
}

function slugToUrlPath(slug) {
  return "/categories/" + slug.replace(/_/g, "-") + ".html";
}

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log("  wrote", path.relative(ROOT, filePath));
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
const index     = readJSON(INDEX_JSON);
const allApps   = index.apps;

// Collect category slugs from the manifest
const catSlugs  = [...new Set(allApps.map(a => a.category))].sort();

// Load meta.yaml for each slug
const catMeta = {};
for (const slug of catSlugs) {
  const yamlPath = path.join(ROOT, slug, "meta.yaml");
  if (fs.existsSync(yamlPath)) {
    catMeta[slug] = readYAML(yamlPath);
  } else {
    // fallback
    catMeta[slug] = {
      name:        slug.replace(/_/g, " "),
      slug,
      description: "",
      icon:        "category",
      appCount:    String(allApps.filter(a => a.category === slug).length),
    };
  }
}

// Group apps by category
const appsByCategory = {};
for (const slug of catSlugs) {
  appsByCategory[slug] = allApps.filter(a => a.category === slug);
}

// ---------------------------------------------------------------------------
// Shared HTML chrome
// ---------------------------------------------------------------------------
const GA_ID = ""; // set when analytics property is ready

function gaSnippet() {
  if (!GA_ID) return "";
  return `
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>`;
}

function htmlHead({ title, description, canonical, ogImage = BASE_URL + "/docs/assets/social-preview.png" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <link rel="canonical" href="${escape(canonical)}" />
  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:title"       content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url"         content="${escape(canonical)}" />
  <meta property="og:image"       content="${escape(ogImage)}" />
  <!-- Twitter -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${escape(title)}" />
  <meta name="twitter:description" content="${escape(description)}" />
  <meta name="twitter:image"       content="${escape(ogImage)}" />
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{primary:'#ec5b13'}}}}</script>
  <!-- Material Symbols -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <!-- Public Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap" />
  <style>
    body { font-family: 'Public Sans', sans-serif; }
    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
  </style>${gaSnippet()}
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col">`;
}

function navbar(activePath = "") {
  const links = [
    { href: BASE_URL + "/",               label: "Home"       },
    { href: BASE_URL + "/browse.html",    label: "Browse"     },
    { href: BASE_URL + "/categories/",    label: "Categories" },
    { href: BASE_URL + "/about.html",     label: "About"      },
  ];
  const linkHtml = links.map(l => {
    const active = activePath === l.href ? "text-primary font-semibold" : "text-gray-600 hover:text-primary";
    return `<a href="${l.href}" class="${active} transition-colors">${l.label}</a>`;
  }).join("\n      ");
  return `
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
      <a href="${BASE_URL}/" class="flex items-center gap-2 font-bold text-lg text-primary">
        <span class="material-symbols-outlined">widgets</span>
        One-Page Apps
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm">
      ${linkHtml}
      </nav>
      <a href="${BASE_URL}/browse.html"
         class="inline-flex items-center gap-1 text-sm bg-primary text-white px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity font-medium">
        <span class="material-symbols-outlined text-base">search</span>Browse Apps
      </a>
    </div>
  </header>`;
}

function footer() {
  return `
  <footer class="mt-auto bg-white border-t border-gray-200 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p>&copy; ${new Date().getFullYear()} onePageApps.gic.mx — 200 free one-page web apps</p>
      <nav class="flex flex-wrap gap-4">
        <a href="${BASE_URL}/about.html"   class="hover:text-primary transition-colors">About</a>
        <a href="${BASE_URL}/contact.html" class="hover:text-primary transition-colors">Contact</a>
        <a href="${BASE_URL}/privacy.html" class="hover:text-primary transition-colors">Privacy</a>
        <a href="${BASE_URL}/terms.html"   class="hover:text-primary transition-colors">Terms</a>
        <a href="${BASE_URL}/sitemap.xml"  class="hover:text-primary transition-colors">Sitemap</a>
      </nav>
    </div>
  </footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// App card snippet (used in category pages)
// ---------------------------------------------------------------------------
function appCard(app) {
  const previewUrl = `${BASE_URL}/preview.html?id=${encodeURIComponent(app.id)}`;
  const aiLabel    = app.requiresAI
    ? `<span class="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-medium">AI</span>`
    : "";
  const dataLabel  = app.storesData
    ? `<span class="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">Stores Data</span>`
    : "";
  return `
        <article class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-primary text-xl">${escape(app.systemImage || "widgets")}</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 leading-snug">${escape(app.name)}</h3>
                <div class="flex items-center gap-1.5 mt-0.5">${aiLabel}${dataLabel}</div>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed flex-1">${escape(app.description)}</p>
          <a href="${previewUrl}"
             class="self-start inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
            <span class="material-symbols-outlined text-base">open_in_new</span>Try it
          </a>
        </article>`;
}

// ---------------------------------------------------------------------------
// Generate categories/index.html
// ---------------------------------------------------------------------------
function generateCategoriesIndex() {
  const title       = "Browse by Category — One-Page Apps";
  const description = "Explore 200 free one-page web apps organized into 17 categories. From AI tools to calculators, converters to embeddable widgets — find the right app for any task.";
  const canonical   = BASE_URL + "/categories/";

  const cards = catSlugs.map(slug => {
    const meta     = catMeta[slug];
    const count    = appsByCategory[slug].length;
    const href     = BASE_URL + slugToUrlPath(slug);
    return `
      <a href="${href}" class="group bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3 hover:shadow-lg hover:border-primary/40 transition-all">
        <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <span class="material-symbols-outlined text-primary text-2xl">${escape(meta.icon || "category")}</span>
        </div>
        <div>
          <h2 class="font-semibold text-gray-900 text-lg leading-snug group-hover:text-primary transition-colors">${escape(meta.name)}</h2>
          <p class="text-sm text-gray-500 mt-1">${count} app${count !== 1 ? "s" : ""}</p>
        </div>
        <p class="text-sm text-gray-600 leading-relaxed flex-1">${escape(meta.description)}</p>
        <span class="self-start text-sm text-primary font-medium group-hover:underline">View apps →</span>
      </a>`;
  }).join("\n");

  const html = `${htmlHead({ title, description, canonical })}
${navbar(canonical)}
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
    <!-- Breadcrumb -->
    <nav class="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <ol class="flex items-center gap-1.5">
        <li><a href="${BASE_URL}/" class="hover:text-primary transition-colors">Home</a></li>
        <li><span class="material-symbols-outlined text-xs">chevron_right</span></li>
        <li class="text-gray-900 font-medium">Categories</li>
      </ol>
    </nav>

    <header class="mb-10">
      <h1 class="text-3xl font-bold text-gray-900">App Categories</h1>
      <p class="mt-2 text-gray-600 text-lg">
        ${index.totalApps} apps across ${catSlugs.length} categories. Pick a category to explore.
      </p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      ${cards}
    </div>
  </main>
${footer()}`;

  writeFile(path.join(CAT_DIR, "index.html"), html);
}

// ---------------------------------------------------------------------------
// Generate one category page per slug
// ---------------------------------------------------------------------------
function generateCategoryPage(slug) {
  const meta        = catMeta[slug];
  const apps        = appsByCategory[slug];
  const count       = apps.length;
  const htmlFile    = slugToHtmlFile(slug);
  const urlPath     = slugToUrlPath(slug);
  const canonical   = BASE_URL + urlPath;
  const title       = `${meta.name} Apps — ${count} Free One-Page Apps`;
  const description = `${meta.description} Browse ${count} free one-page ${meta.name} apps you can deploy to Cloudflare Workers in seconds.`;

  // JSON-LD BreadcrumbList
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",       "item": BASE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": "Categories", "item": BASE_URL + "/categories/" },
      { "@type": "ListItem", "position": 3, "name": meta.name,    "item": canonical },
    ],
  }, null, 0);

  const appCards = apps.map(a => appCard(a)).join("\n");

  // AI badge summary
  const aiApps   = apps.filter(a => a.requiresAI).length;
  const freeApps = count - aiApps;

  const html = `${htmlHead({ title, description, canonical })}
<script type="application/ld+json">${jsonLd}</script>
${navbar()}
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
    <!-- Breadcrumb -->
    <nav class="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <ol class="flex items-center gap-1.5">
        <li><a href="${BASE_URL}/" class="hover:text-primary transition-colors">Home</a></li>
        <li><span class="material-symbols-outlined text-xs">chevron_right</span></li>
        <li><a href="${BASE_URL}/categories/" class="hover:text-primary transition-colors">Categories</a></li>
        <li><span class="material-symbols-outlined text-xs">chevron_right</span></li>
        <li class="text-gray-900 font-medium">${escape(meta.name)}</li>
      </ol>
    </nav>

    <header class="mb-10">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-3xl">${escape(meta.icon || "category")}</span>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">${escape(meta.name)}</h1>
          <p class="text-gray-500 text-sm mt-0.5">${count} app${count !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <p class="text-gray-700 text-lg max-w-3xl leading-relaxed">${escape(meta.description)}</p>
      <!-- Summary badges -->
      <div class="flex flex-wrap gap-3 mt-5">
        <span class="inline-flex items-center gap-1.5 text-sm bg-gray-100 rounded-full px-3 py-1 text-gray-700">
          <span class="material-symbols-outlined text-base">grid_view</span>${count} apps total
        </span>
        ${aiApps > 0 ? `<span class="inline-flex items-center gap-1.5 text-sm bg-purple-100 rounded-full px-3 py-1 text-purple-700">
          <span class="material-symbols-outlined text-base">auto_awesome</span>${aiApps} require AI key
        </span>` : ""}
        ${freeApps > 0 ? `<span class="inline-flex items-center gap-1.5 text-sm bg-green-100 rounded-full px-3 py-1 text-green-700">
          <span class="material-symbols-outlined text-base">check_circle</span>${freeApps} no API key needed
        </span>` : ""}
        <a href="${BASE_URL}/browse.html?category=${encodeURIComponent(slug)}"
           class="inline-flex items-center gap-1.5 text-sm bg-primary/10 rounded-full px-3 py-1 text-primary font-medium hover:bg-primary/20 transition-colors">
          <span class="material-symbols-outlined text-base">search</span>Filter in Browse
        </a>
      </div>
    </header>

    <!-- App grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${appCards}
    </div>

    <!-- Back link -->
    <div class="mt-10 pt-6 border-t border-gray-200">
      <a href="${BASE_URL}/categories/"
         class="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-base">arrow_back</span>All categories
      </a>
    </div>
  </main>
${footer()}`;

  writeFile(path.join(CAT_DIR, htmlFile), html);
}

// ---------------------------------------------------------------------------
// Generate robots.txt
// ---------------------------------------------------------------------------
function generateRobotsTxt() {
  const content = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  writeFile(path.join(ROOT, "robots.txt"), content);
  writeFile(path.join(DOCS_DIR, "robots.txt"), content);
}

// ---------------------------------------------------------------------------
// Generate sitemap.xml
// ---------------------------------------------------------------------------
function generateSitemap() {
  const now = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { loc: BASE_URL + "/",                  priority: "1.0", freq: "weekly"  },
    { loc: BASE_URL + "/browse.html",       priority: "0.9", freq: "weekly"  },
    { loc: BASE_URL + "/categories/",       priority: "0.9", freq: "weekly"  },
    { loc: BASE_URL + "/about.html",        priority: "0.5", freq: "monthly" },
    { loc: BASE_URL + "/contact.html",      priority: "0.4", freq: "monthly" },
    { loc: BASE_URL + "/privacy.html",      priority: "0.3", freq: "yearly"  },
    { loc: BASE_URL + "/terms.html",        priority: "0.3", freq: "yearly"  },
  ];

  const categoryIndexUrls = catSlugs.map(slug => ({
    loc:      BASE_URL + slugToUrlPath(slug),
    priority: "0.8",
    freq:     "weekly",
  }));

  const appUrls = allApps.map(app => ({
    loc:      `${BASE_URL}/preview.html?id=${encodeURIComponent(app.id)}`,
    priority: "0.6",
    freq:     "monthly",
  }));

  const allUrls = [...staticUrls, ...categoryIndexUrls, ...appUrls];

  const urlEntries = allUrls.map(u => `  <url>
    <loc>${escape(u.loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

  writeFile(path.join(ROOT, "sitemap.xml"), xml);
  writeFile(path.join(DOCS_DIR, "sitemap.xml"), xml);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log("generate_categories.js — generating category pages, robots.txt, sitemap.xml\n");

console.log("Category pages:");
generateCategoriesIndex();
for (const slug of catSlugs) {
  generateCategoryPage(slug);
}

console.log("\nRobots + Sitemap:");
generateRobotsTxt();
generateSitemap();

console.log(`\nDone. ${catSlugs.length + 1} category pages, robots.txt (×2), sitemap.xml (×2).`);
