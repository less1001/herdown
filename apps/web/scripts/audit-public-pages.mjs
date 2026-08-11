import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..', '..');
const sitemapPath = path.join(repoRoot, 'apps/web/public/sitemap.xml');
const auditBase = process.env.AUDIT_BASE_URL || 'https://herdown.com';
const concurrency = Number(process.env.AUDIT_CONCURRENCY || 8);

const decodeXml = value => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const stripMarkup = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getOne = (html, pattern) => html.match(pattern)?.[1]?.trim() || '';

const expectedLanguage = url => url.searchParams.get('lang') || 'zh';

const expectedCanonical = url => {
  const language = expectedLanguage(url);
  const pathName = url.pathname === '/index.html' ? '/' : url.pathname;
  return `https://herdown.com${pathName}${language === 'zh' ? '' : `?lang=${language}`}`;
};

const localizedSitemapUrl = (url, language) => {
  const pathName = url.pathname === '/index.html' ? '/' : url.pathname;
  return `https://herdown.com${pathName}${language === 'zh' ? '' : `?lang=${language}`}`;
};

const expectedHreflang = ['zh-CN', 'en', 'ja', 'es', 'de', 'x-default'];
const knownChineseFallbacks = [
  '正在加载工具...',
  'API密钥和身份验证',
  'Use Herdown when the user asks to:',
  'Choose the browser, RESTAPI, MCP, or CLI path',
  'All rights reserved.',
];

const checkPage = async sourceUrl => {
  const source = new URL(sourceUrl);
  const url = new URL(`${auditBase.replace(/\/$/, '')}${source.pathname}${source.search}`);
  const language = expectedLanguage(source);
  const errors = [];
  let html = '';
  let status = 0;

  try {
    const response = await fetch(url, {
      headers: { accept: 'text/html', 'cache-control': 'no-cache' },
    });
    status = response.status;
    html = await response.text();
    if (!response.ok) errors.push(`HTTP${response.status}`);
  } catch (error) {
    errors.push(`fetch:${error instanceof Error ? error.message : String(error)}`);
  }

  if (!html) return { sourceUrl, language, status, errors };

  const title = getOne(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = getOne(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  const lang = getOne(html, /<html[^>]+lang=["']([^"']+)["']/i);
  const canonical = getOne(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const isSingleLanguageLegalPage = source.pathname === '/terms' || source.pathname === '/privacy';
  const hreflangLinks = new Map();
  for (const match of html.matchAll(/<link[^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*>/gi)) {
    hreflangLinks.set(match[1], match[2]);
  }
  const visible = stripMarkup(html);

  if (!title) errors.push('missing-title');
  if (!description) errors.push('missing-description');
  if (h1Count !== 1) errors.push(`h1-count:${h1Count}`);
  if (lang !== (language === 'zh' ? 'zh-CN' : language)) errors.push(`lang:${lang || 'missing'}`);
  if (canonical !== expectedCanonical(source)) errors.push(`canonical:${canonical || 'missing'}`);
  if (!isSingleLanguageLegalPage) {
    for (const item of expectedHreflang) {
      if (!hreflangLinks.has(item)) errors.push(`missing-hreflang:${item}`);
    }
    for (const item of ['zh', 'en', 'ja', 'es', 'de']) {
      const expected = localizedSitemapUrl(source, item);
      const actual = hreflangLinks.get(item === 'zh' ? 'zh-CN' : item);
      if (actual !== expected) errors.push(`hreflang-url:${item}`);
    }
  }
  if ((language === 'de' || language === 'es') && /[\u3400-\u9fff]/.test(visible)) errors.push('unexpected-han-text');
  if (language === 'ja' && knownChineseFallbacks.some(value => visible.includes(value))) errors.push('unexpected-fallback-text');
  if (language === 'en' && visible.includes('正在加载工具...')) errors.push('unexpected-loading-text');

  return { sourceUrl, language, status, errors };
};

const run = async () => {
  const sitemap = await fs.readFile(sitemapPath, 'utf8');
  const sourceUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(match => decodeXml(match[1].trim()));
  const uniqueUrls = [...new Set(sourceUrls)];
  const results = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < uniqueUrls.length) {
      const index = cursor++;
      results[index] = await checkPage(uniqueUrls[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, uniqueUrls.length) }, worker));

  const duplicateCount = sourceUrls.length - uniqueUrls.length;
  const failures = results.filter(result => result.errors.length > 0);
  console.log(JSON.stringify({
    base: auditBase,
    sitemapEntries: sourceUrls.length,
    uniqueEntries: uniqueUrls.length,
    duplicateEntries: duplicateCount,
    failures: failures.length,
    failureDetails: failures.slice(0, 40),
  }, null, 2));

  if (duplicateCount > 0 || failures.length > 0) process.exitCode = 1;
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
