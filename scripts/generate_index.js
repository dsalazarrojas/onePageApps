#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");

const CATEGORY_MAP = Object.freeze({
  "AI": { slug: "ai", display: "AI" },
  "Embeddable Widgets": { slug: "embeddable_widgets", display: "Embeddable Widgets" },
  "Finance & Business": { slug: "finance_business", display: "Finance & Business" },
  "Converter": { slug: "converter", display: "Converter" },
  "Education": { slug: "education", display: "Education" },
  "Accessibility & SEO": { slug: "accessibility_seo", display: "Accessibility & SEO" },
  "Image Tools": { slug: "image_tools", display: "Image Tools" },
  "Utility": { slug: "utility", display: "Utility" },
  "Fun & Misc": { slug: "fun_misc", display: "Fun & Misc" },
  "Developer Tools": { slug: "developer_tools", display: "Developer Tools" },
  "CSS & Design": { slug: "css_design", display: "CSS & Design" },
  "Creative": { slug: "creative", display: "Creative" },
  "Text Tools": { slug: "text_tools", display: "Text Tools" },
  "SEO & Webmaster": { slug: "seo_webmaster", display: "SEO & Webmaster" },
  "Productivity": { slug: "productivity", display: "Productivity" },
  "SVG Tools": { slug: "svg_tools", display: "SVG Tools" },
  "Calculators": { slug: "calculators", display: "Calculators" },
});

const PLATFORM_REQUIRED_KEYS = new Set([
  "cloudflareAPIToken",
  "cloudflareAccountID",
]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "apps",
  "custom",
  "for",
  "from",
  "get",
  "in",
  "into",
  "of",
  "on",
  "or",
  "page",
  "pages",
  "the",
  "to",
  "tool",
  "tools",
  "using",
  "use",
  "with",
  "your",
]);

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(options.repoRoot);
  const modelsPath = path.resolve(options.modelsPath);
  const companionTemplatesDir = path.resolve(options.companionTemplatesDir);
  const docsDir = path.join(repoRoot, "docs");
  const resolveAddedAt = createAddedAtResolver(repoRoot);

  ensureDir(path.join(repoRoot, "scripts"));
  ensureDir(docsDir);
  for (const { slug } of Object.values(CATEGORY_MAP)) {
    ensureDir(path.join(repoRoot, slug));
  }

  const swiftSource = readRequiredFile(modelsPath, "Models.swift metadata");
  const parsedTemplates = parseTemplatesFromModels(swiftSource);

  if (parsedTemplates.length === 0) {
    throw new Error(`No AppTemplate entries were parsed from ${modelsPath}.`);
  }

  const missingContent = [];
  const categoryErrors = [];
  const summary = {
    parsedTemplates: parsedTemplates.length,
    indexedApps: 0,
    localScripts: 0,
    fallbackScripts: 0,
    localHelps: 0,
    fallbackHelps: 0,
    appsWithoutHelp: 0,
    aiOnlyTemplates: 0,
  };

  const apps = [];

  for (const template of parsedTemplates) {
    const categoryInfo = CATEGORY_MAP[template.category];
    if (!categoryInfo) {
      categoryErrors.push(
        `${template.name}: unknown category "${template.category}" in ${path.basename(modelsPath)}`
      );
      continue;
    }

    const hasStaticScript = Boolean(template.workerScriptName);
    const relativeScriptPath = hasStaticScript
      ? toPosixPath(categoryInfo.slug, `${template.workerScriptName}.js`)
      : null;
    let scriptLocation = { source: "ai-only", resolvedPath: null };

    if (hasStaticScript) {
      const localScriptPath = path.join(repoRoot, relativeScriptPath);
      const fallbackScriptPath = path.join(companionTemplatesDir, `${template.workerScriptName}.js`);
      scriptLocation = resolveContent({
        localPath: localScriptPath,
        fallbackPath: fallbackScriptPath,
        label: `script for "${template.name}"`,
        strictLocalOnly: options.strictLocalOnly,
        missingContent,
      });

      if (scriptLocation.source === "local") {
        summary.localScripts += 1;
      } else if (scriptLocation.source === "fallback") {
        summary.fallbackScripts += 1;
      }
    } else {
      summary.aiOnlyTemplates += 1;
    }

    const helpStem = template.helpDocumentName || `${template.workerScriptName}_help`;
    const relativeHelpPath = toPosixPath(categoryInfo.slug, `${helpStem}.md`);
    const localHelpPath = path.join(repoRoot, relativeHelpPath);
    const fallbackHelpPath = path.join(companionTemplatesDir, `${helpStem}.md`);
    const helpExistsLocally = fs.existsSync(localHelpPath);
    const helpExistsInFallback = fs.existsSync(fallbackHelpPath);
    let hasHelp = false;
    let helpPath = null;

    if (helpExistsLocally || helpExistsInFallback) {
      hasHelp = true;
      helpPath = relativeHelpPath;

      if (helpExistsLocally) {
        summary.localHelps += 1;
      } else {
        summary.fallbackHelps += 1;
      }

      if (options.strictLocalOnly && !helpExistsLocally) {
        missingContent.push(
          `Missing repo-local help for "${template.name}" at ${localHelpPath} (fallback exists at ${fallbackHelpPath})`
        );
      }
    } else if (template.helpDocumentName) {
      missingContent.push(
        `Missing help for "${template.name}" at ${localHelpPath} and fallback ${fallbackHelpPath}`
      );
    } else {
      summary.appsWithoutHelp += 1;
    }

    apps.push({
      id: `${template.workerScriptName || slugify(template.name)}--${categoryInfo.slug}`.toLowerCase(),
      name: template.name,
      category: categoryInfo.slug,
      categoryDisplay: categoryInfo.display,
      description: template.description,
      systemImage: template.systemImage,
      workerScriptName: template.workerScriptName,
      scriptPath: relativeScriptPath,
      hasStaticScript,
      helpPath,
      hasHelp,
      requiresAI: template.requiresAI,
      storesData: template.storesData,
      supportsNotifications: template.supportsNotifications,
      requiredKeys: template.requiredKeys,
      addedAt: resolveAddedAt([
        scriptLocation.resolvedPath,
        helpExistsLocally ? localHelpPath : (helpExistsInFallback ? fallbackHelpPath : null),
      ]),
      tags: deriveTags(template, categoryInfo),
    });
  }

  if (categoryErrors.length > 0) {
    throw new Error(formatList("Category mapping errors", categoryErrors));
  }

  if (missingContent.length > 0) {
    throw new Error(formatList("Content validation failed", missingContent));
  }

  apps.sort((left, right) => {
    return (
      left.category.localeCompare(right.category) ||
      left.name.localeCompare(right.name) ||
      (left.workerScriptName || "").localeCompare(right.workerScriptName || "")
    );
  });

  summary.indexedApps = apps.length;
  const generatedAt = new Date().toISOString();
  const manifest = {
    generatedAt,
    totalApps: apps.length,
    apps,
  };

  const jsonBuffer = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const gzBuffer = zlib.gzipSync(jsonBuffer);

  fs.writeFileSync(path.join(docsDir, "apps-index.json"), jsonBuffer);
  fs.writeFileSync(path.join(docsDir, "apps-index.json.gz"), gzBuffer);
  fs.writeFileSync(path.join(docsDir, "last_updated.txt"), `${generatedAt}\n`, "utf8");

  const outputLines = [
    `Generated ${apps.length} app index entries from ${summary.parsedTemplates} AppTemplate records.`,
    `Scripts validated: ${summary.localScripts} local, ${summary.fallbackScripts} companion fallback.`,
    `Help files validated: ${summary.localHelps} local, ${summary.fallbackHelps} companion fallback, ${summary.appsWithoutHelp} without help docs.`,
    `AI-only templates included (no static script, seed-from-existing in generate.html): ${summary.aiOnlyTemplates}.`,
    `Wrote docs/apps-index.json, docs/apps-index.json.gz, and docs/last_updated.txt.`,
  ];

  if (summary.fallbackScripts > 0 || summary.fallbackHelps > 0) {
    outputLines.push(
      "Note: fallback validation used companion WorkerTemplates for files not yet present in onePageApps."
    );
  }

  console.log(outputLines.join("\n"));
}

function parseArgs(argv) {
  const defaultRepoRoot = path.resolve(__dirname, "..");
  const options = {
    repoRoot: defaultRepoRoot,
    modelsPath: path.resolve(
      defaultRepoRoot,
      "../oneTimeUseWebApp/oneTimeUseWebApp/Models.swift"
    ),
    companionTemplatesDir: path.resolve(
      defaultRepoRoot,
      "../oneTimeUseWebApp/oneTimeUseWebApp/WorkerTemplates"
    ),
    strictLocalOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--strict-local-only") {
      options.strictLocalOnly = true;
      continue;
    }

    if (argument === "--repo-root" || argument === "--models" || argument === "--companion-templates") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`Missing value for ${argument}`);
      }
      index += 1;
      if (argument === "--repo-root") {
        options.repoRoot = value;
      } else if (argument === "--models") {
        options.modelsPath = value;
      } else {
        options.companionTemplatesDir = value;
      }
      continue;
    }

    if (argument === "--help" || argument === "-h") {
      printHelpAndExit();
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function printHelpAndExit() {
  console.log(`Usage: node scripts/generate_index.js [options]

Options:
  --repo-root <path>             Override the onePageApps repository root
  --models <path>                Override the Models.swift metadata source
  --companion-templates <path>   Override the companion WorkerTemplates directory
  --strict-local-only            Require repo-local content instead of companion fallback
  -h, --help                     Show this help message
`);
  process.exit(0);
}

function readRequiredFile(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${description} at ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toPosixPath(...parts) {
  return parts.join("/").replace(/\/+/g, "/");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTemplatesFromModels(swiftSource) {
  const anchor = "static let templates: [AppTemplate] = [";
  const anchorIndex = swiftSource.indexOf(anchor);
  if (anchorIndex === -1) {
    throw new Error(`Could not find "${anchor}" in Models.swift.`);
  }

  const equalsIndex = swiftSource.indexOf("=", anchorIndex);
  const arrayStart = swiftSource.indexOf("[", equalsIndex);
  const arrayEnd = findMatchingDelimiter(swiftSource, arrayStart, "[", "]");
  const arrayContent = swiftSource.slice(arrayStart + 1, arrayEnd);
  const bodies = extractTopLevelAppTemplateBodies(arrayContent);

  return bodies.map(parseAppTemplateBody);
}

function extractTopLevelAppTemplateBodies(source) {
  const bodies = [];
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      if (char === "\\") {
        index += 1;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      continue;
    }
    if (char === ")") {
      parenDepth -= 1;
      continue;
    }
    if (char === "[") {
      bracketDepth += 1;
      continue;
    }
    if (char === "]") {
      bracketDepth -= 1;
      continue;
    }
    if (char === "{") {
      braceDepth += 1;
      continue;
    }
    if (char === "}") {
      braceDepth -= 1;
      continue;
    }

    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0 && source.startsWith("AppTemplate", index)) {
      let cursor = index + "AppTemplate".length;
      while (/\s/.test(source[cursor] || "")) {
        cursor += 1;
      }
      if (source[cursor] !== "(") {
        continue;
      }
      const end = findMatchingDelimiter(source, cursor, "(", ")");
      bodies.push(source.slice(cursor + 1, end));
      index = end;
    }
  }

  return bodies;
}

function parseAppTemplateBody(body) {
  const parts = splitTopLevel(body, ",");
  const properties = {};

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) {
      continue;
    }
    const pair = splitTopLevelKeyValue(part);
    if (!pair) {
      continue;
    }
    properties[pair.key] = pair.value;
  }

  return {
    name: parseSwiftString(properties.name),
    category: parseSwiftString(properties.category),
    description: parseSwiftString(properties.description),
    systemImage: parseSwiftString(properties.systemImage),
    requiredKeys: parseSwiftEnumArray(properties.requiredKeys || "[]").filter(
      (key) => !PLATFORM_REQUIRED_KEYS.has(key)
    ),
    requiresAI: parseSwiftBoolean(properties.requiresAI, false),
    workerScriptName: parseSwiftOptionalString(properties.workerScriptName),
    helpDocumentName: parseSwiftOptionalString(properties.helpDocumentName),
    storesData: parseSwiftBoolean(properties.storesData, false),
    supportsNotifications: parseSwiftBoolean(properties.supportsNotifications, false),
  };
}

function splitTopLevel(source, separator) {
  const parts = [];
  let current = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      current += char;
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      current += char;
      if (char === "\\") {
        current += next || "";
        index += 1;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      current += char + next;
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      current += char + next;
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"") {
      current += char;
      inString = true;
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      current += char;
      continue;
    }
    if (char === ")") {
      parenDepth -= 1;
      current += char;
      continue;
    }
    if (char === "[") {
      bracketDepth += 1;
      current += char;
      continue;
    }
    if (char === "]") {
      bracketDepth -= 1;
      current += char;
      continue;
    }
    if (char === "{") {
      braceDepth += 1;
      current += char;
      continue;
    }
    if (char === "}") {
      braceDepth -= 1;
      current += char;
      continue;
    }

    if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts;
}

function splitTopLevelKeyValue(source) {
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      if (char === "\\") {
        index += 1;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      continue;
    }
    if (char === ")") {
      parenDepth -= 1;
      continue;
    }
    if (char === "[") {
      bracketDepth += 1;
      continue;
    }
    if (char === "]") {
      bracketDepth -= 1;
      continue;
    }
    if (char === "{") {
      braceDepth += 1;
      continue;
    }
    if (char === "}") {
      braceDepth -= 1;
      continue;
    }

    if (char === ":" && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return {
        key: source.slice(0, index).trim(),
        value: source.slice(index + 1).trim(),
      };
    }
  }

  return null;
}

function parseSwiftString(value) {
  if (!value) {
    throw new Error("Expected a Swift string literal but received an empty value.");
  }
  const trimmed = value.trim();
  if (!(trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
    throw new Error(`Expected a quoted Swift string literal, got: ${trimmed}`);
  }
  const inner = trimmed.slice(1, -1);
  return inner
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

function parseSwiftOptionalString(value) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === "nil") {
    return null;
  }
  return parseSwiftString(trimmed);
}

function parseSwiftBoolean(value, defaultValue) {
  if (!value) {
    return defaultValue;
  }
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  throw new Error(`Expected Swift boolean literal, got: ${trimmed}`);
}

function parseSwiftEnumArray(value) {
  const trimmed = value.trim();
  if (!(trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    throw new Error(`Expected Swift array literal, got: ${trimmed}`);
  }

  const keys = [];
  const regex = /\.([A-Za-z0-9_]+)/g;
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

function findMatchingDelimiter(source, openIndex, openChar, closeChar) {
  let depth = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      if (char === "\\") {
        index += 1;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error(`Unmatched ${openChar}${closeChar} delimiters while parsing Models.swift.`);
}

function resolveContent({ localPath, fallbackPath, label, strictLocalOnly, missingContent }) {
  const localExists = fs.existsSync(localPath);
  if (localExists) {
    return { source: "local", resolvedPath: localPath };
  }

  if (strictLocalOnly) {
    missingContent.push(`Missing repo-local ${label} at ${localPath}`);
    return { source: "missing", resolvedPath: null };
  }

  const fallbackExists = fs.existsSync(fallbackPath);
  if (fallbackExists) {
    return { source: "fallback", resolvedPath: fallbackPath };
  }

  missingContent.push(
    `Missing ${label} at ${localPath} and fallback ${fallbackPath}`
  );
  return { source: "missing", resolvedPath: null };
}

function deriveTags(template, categoryInfo) {
  const rawSources = [
    template.name,
    categoryInfo.display,
    template.description,
    template.workerScriptName ? template.workerScriptName.replace(/_/g, " ") : "",
  ];

  const seen = new Set();
  const tags = [];

  for (const source of rawSources) {
    const matches = source
      .toLowerCase()
      .replace(/&/g, " ")
      .match(/[a-z0-9]+/g);

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      if ((match.length < 2 && match !== "ai") || STOP_WORDS.has(match)) {
        continue;
      }
      if (seen.has(match)) {
        continue;
      }
      seen.add(match);
      tags.push(match);
      if (tags.length >= 12) {
        return tags;
      }
    }
  }

  return tags;
}

function createAddedAtResolver(repoRoot) {
  const creationMap = loadGitCreationMap(repoRoot);

  return function resolveAddedAt(paths) {
    for (const candidate of paths.filter(Boolean)) {
      const relative = relativeRepoPath(repoRoot, candidate);
      if (relative && creationMap.has(relative)) {
        return creationMap.get(relative);
      }

      try {
        const stats = fs.statSync(candidate);
        const birthTime = stats.birthtimeMs > 0 ? stats.birthtime : null;
        const source = birthTime && Number.isFinite(birthTime.getTime()) ? birthTime : stats.mtime;
        return new Date(source).toISOString();
      } catch (_) {
        // Ignore and continue to the next candidate.
      }
    }

    return null;
  };
}

function relativeRepoPath(repoRoot, candidatePath) {
  const relative = path.relative(repoRoot, candidatePath);
  if (!relative || relative.startsWith("..")) {
    return null;
  }
  return toPosixPath(relative);
}

function loadGitCreationMap(repoRoot) {
  const map = new Map();

  try {
    const output = execFileSync(
      "git",
      ["--no-pager", "log", "--diff-filter=A", "--reverse", "--format=__DATE__%cI", "--name-only", "--", "."],
      { cwd: repoRoot, encoding: "utf8" }
    );

    let currentDate = null;
    for (const line of output.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }
      if (line.startsWith("__DATE__")) {
        currentDate = line.replace("__DATE__", "").trim();
        continue;
      }
      if (!currentDate) {
        continue;
      }
      const key = toPosixPath(line.trim());
      if (!map.has(key)) {
        map.set(key, currentDate);
      }
    }
  } catch (_) {
    return map;
  }

  return map;
}

function formatList(title, items) {
  return `${title}:\n- ${items.join("\n- ")}`;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
