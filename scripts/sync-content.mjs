// Копирует markdown из репозитория ./docs → ./content с разделением по локалям.
// Конвенция: foo.mdx → content/ru/foo.mdx, foo_en.mdx → content/en/foo.mdx
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.join(__dirname, '..');
const srcRoot = path.join(websiteRoot, 'docs');
const dstRoot = path.join(websiteRoot, 'content');
const publicRoot = path.join(websiteRoot, 'public');

// Docs naming convention is fixed: index.md -> ru, index_en.md -> en.
// Keep this independent from Next.js defaultLocale.
const SOURCE_DEFAULT_LOCALE = 'ru';
const LOCALES = ['ru', 'en'];

const ROOT_META_BY_LOCALE = {
  en: {
    index: 'Documentation',
    solutions: 'Solutions',
    concepts: 'Concepts',
  },
  ru: {
    index: 'Документация',
    solutions: 'Решения',
    concepts: 'Концепции',
  },
};

// Build regex: matches _<locale> before extension
const LOCALE_SUFFIX_RE = new RegExp(
  `_(${LOCALES.join('|')})\\.mdx?$`,
  'i',
);

function shouldSkip(relPosix) {
  const base = path.posix.basename(relPosix);
  if (base === 'AGENTS.md' || base === 'AGENTS.mdx') return true;
  if (base === 'CNAME') return true;
  if (relPosix.startsWith('i18n/')) return true;
  return false;
}

/**
 * Determine locale and target filename for a source file.
 * "index_en.mdx" → { locale: "en", name: "index.mdx" }
 * "index.mdx"    → { locale: "ru", name: "index.mdx" }
 */
function parseLocale(filename) {
  const m = filename.match(LOCALE_SUFFIX_RE);
  if (m) {
    const locale = m[1].toLowerCase();
    const name = filename.replace(LOCALE_SUFFIX_RE, (match) =>
      match.replace(`_${m[1]}`, ''),
    );
    return {locale, name: normalizeTargetName(name)};
  }
  return {locale: SOURCE_DEFAULT_LOCALE, name: normalizeTargetName(filename)};
}

function normalizeTargetName(filename) {
  return filename.replace(/\.(md|mdx)$/i, '.mdx');
}

function parseDirectiveAttributes(raw = '') {
  const attrs = {};
  for (const match of raw.matchAll(/(\w+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g)) {
    const [, key, doubleQuoted, singleQuoted, bare] = match;
    attrs[key] = doubleQuoted ?? singleQuoted ?? bare ?? '';
  }
  return attrs;
}

function parseJsxAttributes(raw = '') {
  const attrs = {};
  for (const match of raw.matchAll(/(\w+)=(?:\{([^}]*)\}|"([^"]*)"|'([^']*)'|([^\s]+))/g)) {
    const [, key, braced, doubleQuoted, singleQuoted, bare] = match;
    attrs[key] = (braced ?? doubleQuoted ?? singleQuoted ?? bare ?? '').trim();
  }
  return attrs;
}

function renderProps(attrs) {
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (/^-?\d+(?:\.\d+)?$/.test(value)) return ` ${key}={${value}}`;
      return ` ${key}=${JSON.stringify(value)}`;
    })
    .join('');
}

function convertLeafDirectives(body, directiveName, componentName) {
  return body.replace(
    new RegExp(`::${directiveName}(?:\\{([^}]*)\\})?\\s*\\n([\\s\\S]*?)\\n::`, 'g'),
    (_, rawAttrs = '', inner) => {
      const attrs = parseDirectiveAttributes(rawAttrs);
      const content = inner.trim();
      return `<${componentName}${renderProps(attrs)}>\n${content}\n</${componentName}>`;
    },
  );
}

function convertCardGroupItems(inner) {
  const lines = inner
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const cards = lines.map((line) => {
    const match = line.match(
      /^(?:[-*+]\s+)?\[([^\]]+)\]\(([^)]+)\)\s+-\s+(.+?)(?:\s+\[([A-Za-z0-9_-]+)\])?$/,
    );
    if (!match) return line;
    const [, title, href, description, icon] = match;
    const iconProp = icon ? ` icon=${JSON.stringify(icon)}` : '';
    return `<Card title=${JSON.stringify(title)} href=${JSON.stringify(href)}${iconProp}>
  ${description}
</Card>`;
  });

  return cards.join('\n');
}

function convertStepItems(inner) {
  const lines = inner
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const steps = lines.map((line) => {
    const match = line.match(/^(?:\d+\.\s+|[-*+]\s+)?(.+?)\s+-\s+(.+)$/);
    if (!match) return line;
    const [, title, description] = match;
    return `<Step title=${JSON.stringify(title)}>
${description}
</Step>`;
  });

  return steps.join('\n\n');
}

function convertContainerDirective(content, directiveName, componentName, childDirectiveName, childComponentName) {
  return content.replace(
    new RegExp(`:::${directiveName}(?:\\{([^}]*)\\})?\\s*\\n([\\s\\S]*?)\\n:::`, 'g'),
    (_, rawAttrs = '', inner) => {
      const attrs = parseDirectiveAttributes(rawAttrs);
      const convertedChildren = convertLeafDirectives(
        inner.trim(),
        childDirectiveName,
        childComponentName,
      );
      return `<${componentName}${renderProps(attrs)}>\n${convertedChildren}\n</${componentName}>`;
    },
  );
}

function convertCardGroupDirective(content) {
  return content.replace(
    /:::card-group(?:\{([^}]*)\})?\s*\n([\s\S]*?)\n:::/g,
    (_, rawAttrs = '', inner) => {
      const attrs = parseDirectiveAttributes(rawAttrs);
      const trimmed = inner.trim();
      const convertedChildren = trimmed.includes('::card')
        ? convertLeafDirectives(trimmed, 'card', 'Card')
        : convertCardGroupItems(trimmed);
      return `<CardGroup${renderProps(attrs)}>\n${convertedChildren}\n</CardGroup>`;
    },
  );
}

function convertCardGroupCommentBlock(content) {
  return content.replace(
    /<!--\s*convert:card-group(?:\s+([^>]*?))?\s*-->\s*\n?([\s\S]*?)\n?\s*<!--\s*\/convert:card-group\s*-->/g,
    (_, rawAttrs = '', inner) => {
      const attrs = parseDirectiveAttributes(rawAttrs.trim());
      const trimmed = inner.trim();
      if (trimmed.includes(':::card-group')) {
        return convertCardGroupDirective(trimmed);
      }
      if (trimmed.includes('::card')) {
        return `<CardGroup${renderProps(attrs)}>${'\n'}${convertLeafDirectives(trimmed, 'card', 'Card')}${'\n'}</CardGroup>`;
      }
      return `<CardGroup${renderProps(attrs)}>${'\n'}${convertCardGroupItems(trimmed)}${'\n'}</CardGroup>`;
    },
  );
}

function convertStepsDirective(content) {
  return content.replace(
    /:::steps(?:\{([^}]*)\})?\s*\n([\s\S]*?)\n:::/g,
    (_, rawAttrs = '', inner) => {
      const attrs = parseDirectiveAttributes(rawAttrs);
      const trimmed = inner.trim();
      const convertedChildren = trimmed.includes('::step')
        ? convertLeafDirectives(trimmed, 'step', 'Step')
        : convertStepItems(trimmed);
      return `<Steps${renderProps(attrs)}>\n${convertedChildren}\n</Steps>`;
    },
  );
}

function convertStepsCommentBlock(content) {
  return content.replace(
    /<!--\s*convert:steps(?:\s+([^>]*?))?\s*-->\s*\n?([\s\S]*?)\n?\s*<!--\s*\/convert:steps\s*-->/g,
    (_, rawAttrs = '', inner) => {
      const attrs = parseDirectiveAttributes(rawAttrs.trim());
      const trimmed = inner.trim();
      if (trimmed.includes(':::steps')) {
        return convertStepsDirective(trimmed);
      }
      if (trimmed.includes('::step')) {
        return `<Steps${renderProps(attrs)}>${'\n'}${convertLeafDirectives(trimmed, 'step', 'Step')}${'\n'}</Steps>`;
      }
      return `<Steps${renderProps(attrs)}>${'\n'}${convertStepItems(trimmed)}${'\n'}</Steps>`;
    },
  );
}

function convertCardGroupJsxBlock(content) {
  return content.replace(
    /<CardGroup(?:\s+([^>]*))?>\s*\n?([\s\S]*?)\n?\s*<\/CardGroup>/g,
    (_, rawAttrs = '', inner) => {
      const attrs = parseJsxAttributes(rawAttrs.trim());
      const trimmed = inner.trim();
      if (trimmed.includes('<Card')) {
        return `<CardGroup${renderProps(attrs)}>${'\n'}${trimmed}${'\n'}</CardGroup>`;
      }
      return `<CardGroup${renderProps(attrs)}>${'\n'}${convertCardGroupItems(trimmed)}${'\n'}</CardGroup>`;
    },
  );
}

function convertStepsJsxBlock(content) {
  return content.replace(
    /<Steps(?:\s+([^>]*))?>\s*\n?([\s\S]*?)\n?\s*<\/Steps>/g,
    (_, rawAttrs = '', inner) => {
      const attrs = parseJsxAttributes(rawAttrs.trim());
      const trimmed = inner.trim();
      if (trimmed.includes('<Step')) {
        return `<Steps${renderProps(attrs)}>${'\n'}${trimmed}${'\n'}</Steps>`;
      }
      return `<Steps${renderProps(attrs)}>${'\n'}${convertStepItems(trimmed)}${'\n'}</Steps>`;
    },
  );
}

function transformContent(source, filename) {
  if (!/\.(md|mdx)$/i.test(filename)) return source;

  let content = source;
  content = convertCardGroupCommentBlock(content);
  content = convertStepsCommentBlock(content);
  content = convertCardGroupDirective(content);
  content = convertStepsDirective(content);
  content = convertCardGroupJsxBlock(content);
  content = convertStepsJsxBlock(content);
  return content;
}

function collectFiles(dir, rel = '') {
  /** @type {{src: string, locale: string, dst: string}[]} */
  const out = [];
  for (const ent of fs.readdirSync(dir, {withFileTypes: true})) {
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    const rPosix = r.split(path.sep).join('/');
    if (shouldSkip(rPosix)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...collectFiles(full, r));
    } else if (/\.(md|mdx)$/i.test(ent.name)) {
      const {locale, name} = parseLocale(ent.name);
      const dstRel = rel ? `${rel}/${name}` : name;
      out.push({src: rPosix, locale, dst: dstRel});
    }
  }
  return out;
}

function syncCname() {
  const srcCname = path.join(srcRoot, 'CNAME');
  const dstCname = path.join(publicRoot, 'CNAME');
  if (!fs.existsSync(srcCname)) {
    if (fs.existsSync(dstCname)) fs.rmSync(dstCname, {force: true});
    return false;
  }
  fs.mkdirSync(publicRoot, {recursive: true});
  fs.copyFileSync(srcCname, dstCname);
  return true;
}

if (!fs.existsSync(srcRoot)) {
  console.error(`sync-content: не найден каталог ${srcRoot}`);
  process.exit(1);
}

fs.rmSync(dstRoot, {recursive: true, force: true});
fs.mkdirSync(dstRoot, {recursive: true});

const files = collectFiles(srcRoot);
for (const {src, locale, dst} of files) {
  const from = path.join(srcRoot, ...src.split('/'));
  const to = path.join(dstRoot, locale, ...dst.split('/'));
  fs.mkdirSync(path.dirname(to), {recursive: true});
  const source = fs.readFileSync(from, 'utf8');
  const transformed = transformContent(source, src);
  fs.writeFileSync(to, transformed, 'utf8');
}
const hasCname = syncCname();

for (const locale of LOCALES) {
  const localeEntries = new Set(
    files
      .filter((f) => f.locale === locale)
      .map((f) => {
        const [firstSegment] = f.dst.split('/');
        return firstSegment.replace(/\.mdx$/i, '');
      }),
  );

  const baseMeta = ROOT_META_BY_LOCALE[locale] ?? ROOT_META_BY_LOCALE[SOURCE_DEFAULT_LOCALE];
  const meta = Object.fromEntries(
    Object.entries(baseMeta).filter(([key]) => localeEntries.has(key)),
  );

  const localeDir = path.join(dstRoot, locale);
  fs.mkdirSync(localeDir, {recursive: true});
  const metaPath = path.join(localeDir, '_meta.ts');
  const body = `export default ${JSON.stringify(meta, null, 2)};\n`;
  fs.writeFileSync(metaPath, body, 'utf8');
}

const byLocale = {};
for (const {locale} of files) {
  byLocale[locale] = (byLocale[locale] || 0) + 1;
}
const summary = Object.entries(byLocale)
  .map(([l, n]) => `${l}: ${n}`)
  .join(', ');
console.log(`sync-content: ${files.length} файл(ов) из docs/ → content/ (${summary})`);
if (hasCname) console.log('sync-content: CNAME synced to public/CNAME');
