import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Download, FileCode2, Globe2, Link2, Search, Upload } from 'lucide-react';
import type { Language } from './i18n';
import { localeValue } from './publicLocalization';
import { ToolSeoContent } from './ToolSeoContent';

type SitemapSource = {
  url: string;
  final_url: string;
  status: number;
  valid: boolean;
  type: 'urlset' | 'sitemapindex' | 'unknown';
  url_count: number;
  duplicate_urls: number;
  issues: string[];
};

type SitemapExtractResponse = {
  success: boolean;
  code?: string;
  message?: string;
  input_url?: string;
  robots_url?: string;
  robots_found?: boolean;
  sitemaps?: SitemapSource[];
  urls?: string[];
  total_sitemaps?: number;
  total_urls?: number;
  truncated?: boolean;
  elapsed_ms?: number;
};

type SitemapCheck = {
  key: string;
  label: string;
  status: 'pass' | 'warning' | 'error' | 'info';
  message: string;
};

type SitemapCheckResponse = SitemapExtractResponse & {
  checks?: SitemapCheck[];
  score?: number;
  status?: 'healthy' | 'warning' | 'error';
  duplicate_urls?: number;
};

type SitemapValidateResponse = {
  success: boolean;
  code?: string;
  message?: string;
  source_url?: string | null;
  http_status?: number | null;
  valid?: boolean;
  status?: 'healthy' | 'warning' | 'error';
  score?: number;
  type?: 'urlset' | 'sitemapindex' | 'unknown';
  total_urls?: number;
  duplicate_urls?: number;
  sample_urls?: string[];
  size_bytes?: number;
  checks?: SitemapCheck[];
  elapsed_ms?: number;
};

type WebsiteCrawlPage = {
  url: string;
  final_url: string;
  status: number;
  title: string;
  depth: number;
  content_type: string;
  last_modified: string;
};

type WebsiteUrlResponse = {
  success: boolean;
  code?: string;
  message?: string;
  input_url?: string;
  origin?: string;
  robots_url?: string;
  robots_found?: boolean;
  robots_blocked?: number;
  pages?: WebsiteCrawlPage[];
  urls?: string[];
  discovered_urls?: string[];
  total_urls?: number;
  truncated?: boolean;
  elapsed_ms?: number;
};

const downloadText = (content: string, filename: string, type: string) => {
  const objectUrl = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
};

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const sitemapXml = (entries: Array<{ url: string; lastmod?: string }>) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry => `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}\n  </url>`).join('\n')}\n</urlset>\n`;

const localizeSitemapCheck = (item: SitemapCheck, result: SitemapCheckResponse, language: Language): { label: string; message: string } => {
  const directSitemapUrl = Boolean(result.input_url && /sitemap/i.test(result.input_url));
  const totalSitemaps = result.total_sitemaps || 0;
  const totalUrls = result.total_urls || 0;
  const duplicateUrls = result.duplicate_urls || 0;
  const copy: Record<Language, Record<string, { label: string; message: string }>> = {
    zh: {
      robots: { label: 'robots.txt发现', message: directSitemapUrl ? '本次直接检查Sitemap地址，不需要通过robots.txt发现。' : result.robots_found ? '已从robots.txt发现Sitemap声明。' : '没有从robots.txt发现Sitemap声明，已继续检查常见路径。' },
      reachable: { label: 'Sitemap可访问', message: `找到${totalSitemaps}个有效Sitemap文件。` },
      format: { label: 'XML格式', message: '已识别urlset或sitemapindex根元素，loc地址可以读取。' },
      urls: { label: '页面URL', message: `共读取${totalUrls}个去重URL。` },
      duplicates: { label: '重复URL', message: duplicateUrls ? `发现${duplicateUrls}个重复loc地址。` : '没有发现重复loc地址。' },
    },
    en: {
      robots: { label: 'robots.txt discovery', message: directSitemapUrl ? 'The sitemap URL was checked directly, so robots.txt discovery was not required.' : result.robots_found ? 'Sitemap declarations were found in robots.txt.' : 'No sitemap declaration was found in robots.txt; common paths were checked.' },
      reachable: { label: 'Sitemap availability', message: `${totalSitemaps} valid sitemap file${totalSitemaps === 1 ? '' : 's'} found.` },
      format: { label: 'XML format', message: 'The urlset or sitemapindex root was recognized and loc values were readable.' },
      urls: { label: 'Page URLs', message: `${totalUrls} unique URL${totalUrls === 1 ? '' : 's'} read.` },
      duplicates: { label: 'Duplicate URLs', message: duplicateUrls ? `${duplicateUrls} duplicate loc value${duplicateUrls === 1 ? '' : 's'} found.` : 'No duplicate loc values found.' },
    },
    ja: {
      robots: { label: 'robots.txtの発見', message: directSitemapUrl ? 'SitemapのURLを直接確認したため、robots.txtからの発見は必要ありませんでした。' : result.robots_found ? 'robots.txtからSitemapの宣言を見つけました。' : 'robots.txtにSitemapの宣言がないため、一般的なパスを確認しました。' },
      reachable: { label: 'Sitemapの可用性', message: `有効なSitemapファイルを${totalSitemaps}件見つけました。` },
      format: { label: 'XML形式', message: 'urlsetまたはsitemapindexのルートを認識し、locを読み取れました。' },
      urls: { label: 'ページURL', message: `重複を除いたURLを${totalUrls}件読み取りました。` },
      duplicates: { label: '重複URL', message: duplicateUrls ? `重複したlocを${duplicateUrls}件見つけました。` : '重複したlocは見つかりませんでした。' },
    },
    es: {
      robots: { label: 'Descubrimiento en robots.txt', message: directSitemapUrl ? 'La URL del Sitemap se comprobó directamente; no fue necesario descubrirla mediante robots.txt.' : result.robots_found ? 'Se encontraron declaraciones de Sitemap en robots.txt.' : 'No se encontró una declaración de Sitemap en robots.txt; se revisaron las rutas habituales.' },
      reachable: { label: 'Disponibilidad del Sitemap', message: `Se encontraron ${totalSitemaps} archivo${totalSitemaps === 1 ? '' : 's'} de Sitemap válido${totalSitemaps === 1 ? '' : 's'}.` },
      format: { label: 'Formato XML', message: 'Se reconoció la raíz urlset o sitemapindex y se pudieron leer los valores loc.' },
      urls: { label: 'URLs de páginas', message: `Se leyeron ${totalUrls} URL${totalUrls === 1 ? '' : 's'} únicas.` },
      duplicates: { label: 'URLs duplicadas', message: duplicateUrls ? `Se encontraron ${duplicateUrls} valores loc duplicados.` : 'No se encontraron valores loc duplicados.' },
    },
    de: {
      robots: { label: 'robots.txt-Erkennung', message: directSitemapUrl ? 'Die Sitemap-URL wurde direkt geprüft; eine Erkennung über robots.txt war nicht nötig.' : result.robots_found ? 'Sitemap-Angaben wurden in robots.txt gefunden.' : 'In robots.txt wurde keine Sitemap-Angabe gefunden; übliche Pfade wurden geprüft.' },
      reachable: { label: 'Sitemap-Erreichbarkeit', message: `${totalSitemaps} gültige Sitemap-Datei${totalSitemaps === 1 ? '' : 'en'} gefunden.` },
      format: { label: 'XML-Format', message: 'Die urlset- oder sitemapindex-Wurzel wurde erkannt und loc-Werte konnten gelesen werden.' },
      urls: { label: 'Seiten-URLs', message: `${totalUrls} eindeutige URL${totalUrls === 1 ? '' : 's'} gelesen.` },
      duplicates: { label: 'Doppelte URLs', message: duplicateUrls ? `${duplicateUrls} doppelte loc-Werte gefunden.` : 'Keine doppelten loc-Werte gefunden.' },
    },
  };
  return copy[language][item.key] || { label: item.label, message: item.message };
};

export function SitemapExtractorPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SitemapExtractResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const extract = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = input.trim();
    if (!target || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/v1/tools/sitemap-extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const payload = await response.json() as SitemapExtractResponse;
      setResult(payload);
    } catch {
      setResult({ success: false, message: isEnglish ? 'The request failed. Check your connection and try again.' : '请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  const urls = result?.urls || [];
  const copyUrls = async () => {
    if (!urls.length) return;
    await navigator.clipboard.writeText(urls.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadUrls = (format: 'txt' | 'csv' | 'md') => {
    if (!urls.length) return;
    if (format === 'csv') {
      downloadText(`url\n${urls.map(csvCell).join('\n')}\n`, 'herdown-sitemap-urls.csv', 'text/csv;charset=utf-8');
      return;
    }
    if (format === 'md') {
      downloadText(`# Sitemap URLs\n\n${urls.map(url => `- ${url}`).join('\n')}\n`, 'herdown-sitemap-urls.md', 'text/markdown;charset=utf-8');
      return;
    }
    downloadText(`${urls.join('\n')}\n`, 'herdown-sitemap-urls.txt', 'text/plain;charset=utf-8');
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Free website tool' : '免费的网站工具'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'Sitemap URL Extractor' : 'SitemapURL提取器'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Enter a domain or sitemap.xml URL to discover sitemap files, expand sitemap indexes, and export a deduplicated URL list.' : '输入域名或sitemap.xml地址，自动发现Sitemap、展开SitemapIndex，并导出去重后的完整URL列表。'}</p>
      </header>

      <section aria-labelledby="extractor-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="extractor-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Extract URLs from a sitemap' : '从Sitemap提取URL'}</h2>
        <form onSubmit={extract} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="sitemap-extractor-input">{isEnglish ? 'Domain or sitemap URL' : '域名或Sitemap地址'}</label>
          <div className="relative flex-1">
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input id="sitemap-extractor-input" value={input} onChange={event => setInput(event.target.value)} placeholder="https://example.com/sitemap.xml" inputMode="url" autoCapitalize="none" spellCheck={false} className="w-full rounded-xl border border-[#263445] bg-[#090d12] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500" />
          </div>
          <button type="submit" disabled={!input.trim() || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
            <Search className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? (isEnglish ? 'Extracting' : '正在提取') : (isEnglish ? 'Extract URLs' : '提取URL')}
          </button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'Herdown reads public robots.txt and sitemap files only. Private network addresses are blocked.' : 'Herdown只读取公开的robots.txt和Sitemap文件，内网及私有地址会被拦截。'}</p>
      </section>

      {result && (
        <section aria-live="polite" aria-labelledby="extractor-result-title" className="space-y-4">
          <h2 id="extractor-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Extraction result' : '提取结果'}</h2>
          {!result.success ? (
            <div className="flex gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{result.message || (isEnglish ? 'No readable sitemap was found.' : '没有找到可读取的Sitemap。')}</span>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Unique URLs' : '去重URL'}</p><p className="mt-1 text-2xl font-bold text-white">{result.total_urls || urls.length}</p></div>
                <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Valid sitemaps' : '有效Sitemap'}</p><p className="mt-1 text-2xl font-bold text-white">{result.total_sitemaps || 0}</p></div>
                <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">robots.txt</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-200"><CheckCircle2 className={`h-4 w-4 ${result.robots_found ? 'text-emerald-400' : 'text-slate-600'}`} />{result.robots_found ? (isEnglish ? 'Found' : '已找到') : (isEnglish ? 'Not declared' : '未声明')}</p></div>
              </div>
              {result.truncated && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">{isEnglish ? 'The result reached the public tool limit. The exported list contains the first 10,000 unique URLs.' : '结果已达到公开工具上限，本次导出前10,000个去重URL。'}</div>}
              <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3">
                  <span className="text-sm font-semibold text-slate-200">{isEnglish ? 'URL list' : 'URL列表'}</span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void copyUrls()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}</button>
                    {(['txt', 'csv', 'md'] as const).map(format => <button key={format} type="button" onClick={() => downloadUrls(format)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs uppercase text-slate-300 hover:border-emerald-500/40 hover:text-white"><Download className="h-3.5 w-3.5" />{format}</button>)}
                  </div>
                </div>
                <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-all p-4 text-xs leading-6 text-emerald-200">{urls.join('\n')}</pre>
              </div>
              <div className="space-y-2">
                {(result.sitemaps || []).filter(item => item.valid).map(item => (
                  <div key={item.url} className="flex flex-col gap-1 rounded-xl border border-[#1e293b] bg-[#0d131c] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-all text-slate-300">{item.final_url || item.url}</span>
                    <span className="shrink-0 text-slate-500">{item.type} · {item.url_count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="extractor-how-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="extractor-how-title" className="text-xl font-bold text-white">{isEnglish ? 'How the sitemap extractor works' : 'Sitemap提取器如何工作'}</h2></div>
        {[
          [isEnglish ? 'Find sitemap files' : '发现Sitemap', isEnglish ? 'Enter a domain and Herdown checks robots.txt plus common sitemap paths.' : '输入域名后，Herdown会检查robots.txt和常见Sitemap路径。'],
          [isEnglish ? 'Expand sitemap indexes' : '展开SitemapIndex', isEnglish ? 'Child sitemap files are followed automatically and duplicate page URLs are removed.' : '自动继续读取子Sitemap，并去除重复页面URL。'],
          [isEnglish ? 'Export clean URLs' : '导出干净URL', isEnglish ? 'Copy the list or download TXT, CSV, or Markdown for audits, migrations, and AI ingestion.' : '支持复制或下载TXT、CSV和Markdown，可用于检查、迁移和AI资料导入。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="extractor-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="extractor-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'Sitemap extractor FAQ' : 'Sitemap提取常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Can it read a sitemap index?' : '支持SitemapIndex吗？', isEnglish ? 'Yes. It follows child sitemap files and combines their page URLs into one deduplicated list.' : '支持。工具会读取子Sitemap，并合并成一个去重URL列表。'],
            [isEnglish ? 'Does it crawl every page?' : '会抓取每个网页内容吗？', isEnglish ? 'No. This page reads sitemap files only. Use Website URL Extractor when you need link crawling.' : '不会。本页只读取Sitemap文件；需要爬取页面链接时请使用Website URL Extractor。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
    </article>
  );
}

export function SitemapCheckerPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SitemapCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = input.trim();
    if (!target || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/v1/tools/sitemap-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      setResult(await response.json() as SitemapCheckResponse);
    } catch {
      setResult({ success: false, message: isEnglish ? 'The request failed. Check your connection and try again.' : '请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  const statusText = result?.status === 'healthy'
    ? localeValue(language, { zh: '状态良好', en: 'Healthy', ja: '正常', es: 'Correcto', de: 'In Ordnung' })
    : result?.status === 'warning'
      ? localeValue(language, { zh: '需要检查', en: 'Needs attention', ja: '要確認', es: 'Requiere atención', de: 'Prüfung erforderlich' })
      : localeValue(language, { zh: '发现问题', en: 'Errors found', ja: '問題あり', es: 'Se encontraron errores', de: 'Fehler gefunden' });
  const scoreColor = (result?.score || 0) >= 90 ? 'text-emerald-300' : (result?.score || 0) >= 70 ? 'text-amber-300' : 'text-red-300';

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Free SEO tool' : '免费SEO工具'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'Sitemap Finder & Checker' : 'Sitemap查找与检查器'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Enter a domain to find sitemap files through robots.txt and common paths, then check availability, XML structure, URL counts, and duplicates.' : '输入网站域名，通过robots.txt和常见路径查找Sitemap，并检查可访问性、XML结构、URL数量和重复地址。'}</p>
      </header>

      <section aria-labelledby="checker-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="checker-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Find and check a sitemap' : '查找并检查Sitemap'}</h2>
        <form onSubmit={check} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="sitemap-checker-input">{isEnglish ? 'Website domain or sitemap URL' : '网站域名或Sitemap地址'}</label>
          <div className="relative flex-1">
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input id="sitemap-checker-input" value={input} onChange={event => setInput(event.target.value)} placeholder="https://example.com" inputMode="url" autoCapitalize="none" spellCheck={false} className="w-full rounded-xl border border-[#263445] bg-[#090d12] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500" />
          </div>
          <button type="submit" disabled={!input.trim() || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
            <Search className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? (isEnglish ? 'Checking' : '正在检查') : (isEnglish ? 'Check sitemap' : '检查Sitemap')}
          </button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'You can also enter a sitemap.xml URL directly. The checker reads public files only.' : '也可以直接输入sitemap.xml地址。本工具只读取公开文件。'}</p>
      </section>

      {result && (
        <section aria-live="polite" aria-labelledby="checker-result-title" className="space-y-4">
          <h2 id="checker-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Sitemap check result' : 'Sitemap检查结果'}</h2>
          {!result.success ? (
            <div className="flex gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{result.message || (isEnglish ? 'The sitemap could not be checked.' : '无法完成Sitemap检查。')}</span></div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1e293b] bg-[#0d131c] p-5 text-center">
                  <span className={`text-4xl font-extrabold ${scoreColor}`}>{result.score}</span>
                  <span className="mt-1 text-xs text-slate-500">{isEnglish ? 'Sitemap score' : 'Sitemap评分'}</span>
                  <span className="mt-3 rounded-full border border-[#263445] px-3 py-1 text-xs text-slate-300">{statusText}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Valid sitemaps' : '有效Sitemap'}</p><p className="mt-1 text-2xl font-bold text-white">{result.total_sitemaps || 0}</p></div>
                  <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Unique URLs' : '去重URL'}</p><p className="mt-1 text-2xl font-bold text-white">{result.total_urls || 0}</p></div>
                  <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Duplicate URLs' : '重复URL'}</p><p className="mt-1 text-2xl font-bold text-white">{result.duplicate_urls || 0}</p></div>
                </div>
              </div>
              <div className="space-y-3">
                {(result.checks || []).map(item => {
                  const display = localizeSitemapCheck(item, result, language);
                  const tone = item.status === 'pass' ? 'border-emerald-500/25 bg-emerald-500/5' : item.status === 'warning' ? 'border-amber-500/25 bg-amber-500/5' : item.status === 'error' ? 'border-red-500/25 bg-red-500/5' : 'border-[#263445] bg-[#0d131c]';
                  const iconTone = item.status === 'pass' ? 'text-emerald-400' : item.status === 'warning' ? 'text-amber-400' : item.status === 'error' ? 'text-red-400' : 'text-slate-500';
                  return <div key={item.key} className={`flex gap-3 rounded-xl border p-4 ${tone}`}><CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} /><div><h3 className="text-sm font-semibold text-slate-200">{display.label}</h3><p className="mt-1 text-xs leading-6 text-slate-400">{display.message}</p></div></div>;
                })}
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
                <div className="border-b border-[#1e293b] px-4 py-3 text-sm font-semibold text-slate-200">{isEnglish ? 'Checked sitemap files' : '已检查的Sitemap文件'}</div>
                <div className="divide-y divide-[#1e293b]">
                  {(result.sitemaps || []).map(item => (
                    <div key={item.url} className="grid gap-2 p-4 text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <span className="break-all text-slate-300">{item.final_url || item.url}</span>
                      <span className={item.valid ? 'text-emerald-400' : item.status === 404 ? 'text-slate-600' : 'text-red-400'}>{item.valid ? (isEnglish ? 'Valid' : '有效') : `HTTP ${item.status}`}</span>
                      <span className="text-slate-500">{item.type} · {item.url_count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <a href={isEnglish ? '/sitemap-extractor?lang=en' : '/sitemap-extractor'} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200">{isEnglish ? 'Export all sitemap URLs' : '导出全部SitemapURL'}<span aria-hidden="true">→</span></a>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="checker-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="checker-details-title" className="text-xl font-bold text-white">{isEnglish ? 'What the sitemap checker tests' : 'Sitemap检查项目'}</h2></div>
        {[
          [isEnglish ? 'Discovery' : '发现路径', isEnglish ? 'Checks robots.txt declarations and common sitemap locations.' : '检查robots.txt声明和常见Sitemap路径。'],
          [isEnglish ? 'XML structure' : 'XML结构', isEnglish ? 'Recognizes urlset and sitemapindex roots and validates loc values.' : '识别urlset与sitemapindex根元素并校验loc地址。'],
          [isEnglish ? 'URL quality' : 'URL质量', isEnglish ? 'Counts unique URLs, reports duplicates, and expands child sitemap files.' : '统计去重URL、报告重复地址并展开子Sitemap。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="checker-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="checker-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'Sitemap checker FAQ' : 'Sitemap检查常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Is robots.txt required?' : '必须有robots.txt吗？', isEnglish ? 'No. If robots.txt is missing, the checker continues with common sitemap paths.' : '不是。找不到robots.txt时，工具仍会继续检查常见Sitemap路径。'],
            [isEnglish ? 'What does the score mean?' : '评分代表什么？', isEnglish ? 'The score summarizes discovery, availability, XML structure, URL counts, duplicates, and truncation.' : '评分综合反映发现路径、可访问性、XML结构、URL数量、重复地址和结果截断。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
      <ToolSeoContent slug="sitemap-checker" language={language} />
    </article>
  );
}

export function SitemapValidatorPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const [mode, setMode] = useState<'url' | 'xml'>('url');
  const [url, setUrl] = useState('');
  const [xml, setXml] = useState('');
  const [result, setResult] = useState<SitemapValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = mode === 'url' ? { url: url.trim() } : { xml };
    if (!(mode === 'url' ? url.trim() : xml.trim()) || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/v1/tools/sitemap-validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setResult(await response.json() as SitemapValidateResponse);
    } catch {
      setResult({ success: false, message: isEnglish ? 'The request failed. Check your connection and try again.' : '请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (file?: File) => {
    if (!file) return;
    setMode('xml');
    setXml(await file.text());
    setResult(null);
  };

  const score = result?.score || 0;
  const scoreColor = score >= 90 ? 'text-emerald-300' : score >= 70 ? 'text-amber-300' : 'text-red-300';
  const resultLabel = result?.valid ? (isEnglish ? 'Valid sitemap' : 'Sitemap有效') : (isEnglish ? 'Validation failed' : '校验未通过');

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Free XML validation tool' : '免费XML校验工具'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'Sitemap Validator' : 'Sitemap验证器'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Validate a sitemap URL or pasted XML for well-formed syntax, sitemap roots, namespace, loc values, duplicates, metadata, and protocol limits.' : '校验SitemapURL或粘贴的XML，检查语法、根元素、命名空间、loc地址、重复URL、可选字段和协议限制。'}</p>
      </header>

      <section aria-labelledby="validator-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="validator-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Validate sitemap XML' : '校验SitemapXML'}</h2>
        <div className="mt-4 inline-flex rounded-xl border border-[#263445] bg-[#090d12] p-1">
          {(['url', 'xml'] as const).map(item => <button key={item} type="button" onClick={() => { setMode(item); setResult(null); }} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${mode === item ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item === 'url' ? (isEnglish ? 'Sitemap URL' : 'SitemapURL') : (isEnglish ? 'Paste XML' : '粘贴XML')}</button>)}
        </div>
        <form onSubmit={validate} className="mt-4 space-y-3">
          {mode === 'url' ? (
            <div className="relative">
              <label className="sr-only" htmlFor="sitemap-validator-url">{isEnglish ? 'Sitemap URL' : 'Sitemap地址'}</label>
              <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input id="sitemap-validator-url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/sitemap.xml" inputMode="url" autoCapitalize="none" spellCheck={false} className="w-full rounded-xl border border-[#263445] bg-[#090d12] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500" />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block rounded-xl border border-dashed border-[#334155] bg-[#090d12] px-4 py-3 text-xs text-slate-400 hover:border-emerald-500/50">
                <span className="inline-flex cursor-pointer items-center gap-2"><Upload className="h-4 w-4 text-emerald-400" />{isEnglish ? 'Choose an XML file' : '选择XML文件'}</span>
                <input type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={event => void loadFile(event.target.files?.[0])} />
              </label>
              <label className="sr-only" htmlFor="sitemap-validator-xml">{isEnglish ? 'Sitemap XML' : 'SitemapXML内容'}</label>
              <textarea id="sitemap-validator-xml" value={xml} onChange={event => setXml(event.target.value)} rows={14} placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc></url>\n</urlset>'} spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-emerald-500" />
            </div>
          )}
          <button type="submit" disabled={loading || !(mode === 'url' ? url.trim() : xml.trim())} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
            <FileCode2 className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? (isEnglish ? 'Validating' : '正在校验') : (isEnglish ? 'Validate sitemap' : '校验Sitemap')}
          </button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'Pasted XML is used for this validation request only. DOCTYPE is rejected and input is limited to 6MB.' : '粘贴的XML只用于本次校验请求。工具拒绝DOCTYPE，公开输入上限为6MB。'}</p>
      </section>

      {result && (
        <section aria-live="polite" aria-labelledby="validator-result-title" className="space-y-4">
          <h2 id="validator-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Validation result' : '校验结果'}</h2>
          {!result.success ? (
            <div className="flex gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{result.message || (isEnglish ? 'The sitemap could not be validated.' : '无法完成Sitemap校验。')}</span></div>
          ) : (
            <>
              <div className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${result.valid ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'}`}>
                <div><p className="text-lg font-bold text-white">{resultLabel}</p><p className="mt-1 text-xs text-slate-400">{result.type} · {result.total_urls || 0}{isEnglish ? ' unique URLs' : '个去重URL'} · {result.size_bytes || 0} bytes</p></div>
                <div className="text-center"><p className={`text-4xl font-extrabold ${scoreColor}`}>{result.score}</p><p className="text-xs text-slate-500">{isEnglish ? 'Validation score' : '校验评分'}</p></div>
              </div>
              <div className="space-y-3">
                {(result.checks || []).map(item => {
                  const tone = item.status === 'pass' ? 'border-emerald-500/25 bg-emerald-500/5' : item.status === 'warning' ? 'border-amber-500/25 bg-amber-500/5' : item.status === 'error' ? 'border-red-500/25 bg-red-500/5' : 'border-[#263445] bg-[#0d131c]';
                  const iconTone = item.status === 'pass' ? 'text-emerald-400' : item.status === 'warning' ? 'text-amber-400' : item.status === 'error' ? 'text-red-400' : 'text-slate-500';
                  return <div key={item.key} className={`flex gap-3 rounded-xl border p-4 ${tone}`}><CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} /><div><h3 className="text-sm font-semibold text-slate-200">{item.label}</h3><p className="mt-1 text-xs leading-6 text-slate-400">{item.message}</p></div></div>;
                })}
              </div>
              {(result.sample_urls || []).length > 0 && <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]"><div className="border-b border-[#1e293b] px-4 py-3 text-sm font-semibold text-slate-200">{isEnglish ? 'Sample URLs' : 'URL样例'}</div><pre className="overflow-auto whitespace-pre-wrap break-all p-4 text-xs leading-6 text-emerald-200">{result.sample_urls?.join('\n')}</pre></div>}
              <div className="flex flex-wrap gap-4 text-sm font-semibold"><a href={isEnglish ? '/sitemap-checker?lang=en' : '/sitemap-checker'} className="text-emerald-300 hover:text-emerald-200">{isEnglish ? 'Find a website sitemap' : '查找网站Sitemap'}<span className="ml-1" aria-hidden="true">→</span></a><a href={isEnglish ? '/sitemap-extractor?lang=en' : '/sitemap-extractor'} className="text-emerald-300 hover:text-emerald-200">{isEnglish ? 'Export sitemap URLs' : '导出SitemapURL'}<span className="ml-1" aria-hidden="true">→</span></a></div>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="validator-checks-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="validator-checks-title" className="text-xl font-bold text-white">{isEnglish ? 'What the validator checks' : 'Sitemap验证项目'}</h2></div>
        {[
          [isEnglish ? 'Well-formed XML' : 'XML语法', isEnglish ? 'Checks tags, attributes, closing order, and rejects DOCTYPE declarations.' : '检查标签、属性和闭合顺序，并拒绝DOCTYPE声明。'],
          [isEnglish ? 'Sitemap protocol' : 'Sitemap协议', isEnglish ? 'Checks roots, namespace, loc URLs, 50,000 URL limit, and 50MB limit.' : '检查根元素、命名空间、loc地址、50,000个URL限制和50MB限制。'],
          [isEnglish ? 'Optional metadata' : '可选字段', isEnglish ? 'Checks lastmod, changefreq, priority, and duplicate loc values.' : '检查lastmod、changefreq、priority和重复loc地址。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="validator-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="validator-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'Sitemap validator FAQ' : 'Sitemap验证常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Does this validate XSD?' : '是否进行完整XSD校验？', isEnglish ? 'It validates well-formed XML and the practical sitemap protocol fields listed above. It does not fetch an external XSD.' : '工具校验XML语法和上面列出的Sitemap协议字段，不会另外下载外部XSD。'],
            [isEnglish ? 'Can I validate XML before publishing?' : '未上线的XML可以校验吗？', isEnglish ? 'Yes. Switch to Paste XML or choose a local .xml file.' : '可以。切换到粘贴XML，或选择本地.xml文件。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
    </article>
  );
}

export function SitemapGeneratorPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const [mode, setMode] = useState<'crawl' | 'paste'>('crawl');
  const [siteUrl, setSiteUrl] = useState('');
  const [limit, setLimit] = useState(25);
  const [rawUrls, setRawUrls] = useState('');
  const [includeLastmod, setIncludeLastmod] = useState(false);
  const [manualLastmod, setManualLastmod] = useState(new Date().toISOString().slice(0, 10));
  const [generatedXml, setGeneratedXml] = useState('');
  const [urlCount, setUrlCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetResult = () => {
    setGeneratedXml('');
    setUrlCount(0);
    setDuplicateCount(0);
    setMessage('');
  };

  const parsePastedUrls = (): { entries: Array<{ url: string; lastmod?: string }>; duplicates: number } => {
    const candidates = rawUrls.split(/[\s,]+/).map(value => value.trim()).filter(Boolean);
    if (candidates.length > 50000) throw new Error(isEnglish ? 'One sitemap can contain at most 50,000 URLs.' : '单个Sitemap最多包含50,000个URL。');
    const entries: Array<{ url: string; lastmod?: string }> = [];
    const seen = new Set<string>();
    let origin = '';
    let duplicates = 0;
    for (const value of candidates) {
      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        throw new Error(isEnglish ? `Invalid URL: ${value}` : `无效URL：${value}`);
      }
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(isEnglish ? `Unsupported URL: ${value}` : `不支持的URL：${value}`);
      parsed.hash = '';
      if (!origin) origin = parsed.origin;
      if (parsed.origin !== origin) throw new Error(isEnglish ? 'All URLs in one sitemap must use the same origin.' : '同一个Sitemap中的URL必须属于同一个网站来源。');
      const normalized = parsed.toString();
      if (seen.has(normalized)) {
        duplicates += 1;
        continue;
      }
      seen.add(normalized);
      entries.push({ url: normalized, lastmod: includeLastmod ? manualLastmod : undefined });
    }
    if (!entries.length) throw new Error(isEnglish ? 'Paste at least one valid URL.' : '请至少粘贴一个有效URL。');
    return { entries, duplicates };
  };

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    resetResult();
    try {
      let entries: Array<{ url: string; lastmod?: string }> = [];
      let duplicates = 0;
      if (mode === 'paste') {
        const parsed = parsePastedUrls();
        entries = parsed.entries;
        duplicates = parsed.duplicates;
      } else {
        const response = await fetch('/v1/tools/website-url-extract', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url: siteUrl.trim(), limit }),
        });
        const payload = await response.json() as WebsiteUrlResponse;
        if (!payload.success) throw new Error(payload.message || (isEnglish ? 'The website could not be crawled.' : '无法抓取这个网站。'));
        const lastmodByUrl = new Map((payload.pages || []).map(page => [page.final_url, page.last_modified]));
        entries = (payload.urls || []).map(url => {
          const headerDate = lastmodByUrl.get(url);
          const parsedDate = headerDate ? new Date(headerDate) : null;
          return { url, lastmod: includeLastmod && parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : undefined };
        });
        if (!entries.length) throw new Error(isEnglish ? 'No public pages were found.' : '没有发现可访问的公开网页。');
        if (payload.truncated) setMessage(isEnglish ? `The public crawler stopped at ${entries.length} pages. Increase the limit up to 50 or paste a complete URL list.` : `公开抓取已在${entries.length}个页面停止。可以把上限提高到50，或粘贴完整URL列表。`);
      }
      setGeneratedXml(sitemapXml(entries));
      setUrlCount(entries.length);
      setDuplicateCount(duplicates);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isEnglish ? 'Sitemap generation failed.' : 'Sitemap生成失败。'));
    } finally {
      setLoading(false);
    }
  };

  const copyXml = async () => {
    if (!generatedXml) return;
    await navigator.clipboard.writeText(generatedXml);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const preview = generatedXml.split('\n').slice(0, 120).join('\n');

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Free sitemap creation tool' : '免费Sitemap生成工具'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'XML Sitemap Generator' : 'XMLSitemap生成器'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Crawl a public website or paste up to 50,000 URLs, then generate and download a standards-compliant sitemap.xml file.' : '抓取公开网站或粘贴最多50,000个URL，生成并下载符合标准的sitemap.xml文件。'}</p>
      </header>

      <section aria-labelledby="generator-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="generator-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Create sitemap.xml' : '创建sitemap.xml'}</h2>
        <div className="mt-4 inline-flex rounded-xl border border-[#263445] bg-[#090d12] p-1">
          {(['crawl', 'paste'] as const).map(item => <button key={item} type="button" onClick={() => { setMode(item); resetResult(); }} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${mode === item ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item === 'crawl' ? (isEnglish ? 'Crawl website' : '抓取网站') : (isEnglish ? 'Paste URL list' : '粘贴URL列表')}</button>)}
        </div>
        <form onSubmit={generate} className="mt-4 space-y-4">
          {mode === 'crawl' ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
              <div className="relative">
                <label className="sr-only" htmlFor="sitemap-generator-url">{isEnglish ? 'Website URL' : '网站地址'}</label>
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input id="sitemap-generator-url" value={siteUrl} onChange={event => setSiteUrl(event.target.value)} placeholder="https://example.com" inputMode="url" autoCapitalize="none" spellCheck={false} className="w-full rounded-xl border border-[#263445] bg-[#090d12] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500" />
              </div>
              <label className="rounded-xl border border-[#263445] bg-[#090d12] px-3 py-2 text-xs text-slate-500">{isEnglish ? 'Page limit' : '页面上限'}<input type="number" min={1} max={50} value={limit} onChange={event => setLimit(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 w-full bg-transparent text-sm text-white outline-none" /></label>
            </div>
          ) : (
            <div>
              <label className="sr-only" htmlFor="sitemap-generator-urls">{isEnglish ? 'URL list' : 'URL列表'}</label>
              <textarea id="sitemap-generator-urls" value={rawUrls} onChange={event => setRawUrls(event.target.value)} rows={12} placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/contact'} spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-emerald-500" />
            </div>
          )}
          <div className="flex flex-col gap-3 rounded-xl border border-[#263445] bg-[#090d12] p-4 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={includeLastmod} onChange={event => setIncludeLastmod(event.target.checked)} className="accent-emerald-500" />{mode === 'crawl' ? (isEnglish ? 'Include verified Last-Modified dates when available' : '有可靠Last-Modified响应头时写入lastmod') : (isEnglish ? 'Include one lastmod date for all pasted URLs' : '为粘贴的URL统一写入lastmod')}</label>
            {mode === 'paste' && includeLastmod && <input type="date" value={manualLastmod} onChange={event => setManualLastmod(event.target.value)} className="rounded-lg border border-[#334155] bg-[#111823] px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500" />}
          </div>
          <button type="submit" disabled={loading || !(mode === 'crawl' ? siteUrl.trim() : rawUrls.trim())} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><FileCode2 className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />{loading ? (isEnglish ? 'Generating' : '正在生成') : (isEnglish ? 'Generate sitemap.xml' : '生成sitemap.xml')}</button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'The crawler follows public same-origin HTML links, respects robots.txt, blocks private networks, and processes up to 50 pages per request.' : '抓取模式只跟随同源公开HTML链接，遵守robots.txt，拦截内网地址，每次最多处理50个页面。'}</p>
      </section>

      {message && <div aria-live="polite" className={`rounded-xl border p-4 text-sm leading-6 ${generatedXml ? 'border-amber-500/25 bg-amber-500/10 text-amber-200' : 'border-red-500/25 bg-red-500/10 text-red-200'}`}>{message}</div>}

      {generatedXml && (
        <section aria-labelledby="generator-result-title" className="space-y-4">
          <h2 id="generator-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Generated sitemap' : '生成结果'}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'URLs' : 'URL数量'}</p><p className="mt-1 text-2xl font-bold text-white">{urlCount}</p></div>
            <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Removed duplicates' : '移除重复URL'}</p><p className="mt-1 text-2xl font-bold text-white">{duplicateCount}</p></div>
            <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'File size' : '文件大小'}</p><p className="mt-1 text-2xl font-bold text-white">{new TextEncoder().encode(generatedXml).byteLength}</p></div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">sitemap.xml</span><div className="flex gap-2"><button type="button" onClick={() => void copyXml()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy XML' : '复制XML')}</button><button type="button" onClick={() => downloadText(generatedXml, 'sitemap.xml', 'application/xml;charset=utf-8')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{isEnglish ? 'Download' : '下载'}</button></div></div>
            <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-all p-4 text-xs leading-6 text-emerald-200">{preview}{generatedXml.split('\n').length > 120 ? `\n${isEnglish ? '...preview truncated' : '...预览已截断'}` : ''}</pre>
          </div>
          <a href={isEnglish ? '/sitemap-validator?lang=en' : '/sitemap-validator'} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200">{isEnglish ? 'Validate another sitemap' : '继续验证其他Sitemap'}<span aria-hidden="true">→</span></a>
        </section>
      )}

      <section aria-labelledby="generator-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="generator-details-title" className="text-xl font-bold text-white">{isEnglish ? 'How to create a useful sitemap' : '如何生成可靠的Sitemap'}</h2></div>
        {[
          [isEnglish ? 'Use canonical URLs' : '使用规范URL', isEnglish ? 'Include final public URLs and remove tracking parameters, fragments, and duplicate addresses.' : '使用最终公开URL，去除跟踪参数、锚点和重复地址。'],
          [isEnglish ? 'Use honest lastmod dates' : '使用真实lastmod', isEnglish ? 'Only include lastmod when you know when the page changed. The crawler uses a verified response header when available.' : '只有确认页面更新时间时才写入lastmod；抓取模式只使用可靠响应头。'],
          [isEnglish ? 'Stay within one origin' : '保持同一网站来源', isEnglish ? 'A sitemap file should contain URLs from one origin and no more than 50,000 URLs.' : '一个Sitemap文件应只包含同一网站来源的URL，且不超过50,000个。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="generator-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="generator-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'Sitemap generator FAQ' : 'Sitemap生成常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Can I submit the downloaded file to Search Console?' : '下载文件可以提交到Search Console吗？', isEnglish ? 'Yes. Upload sitemap.xml to your website, confirm it is publicly accessible, then submit its URL.' : '可以。把sitemap.xml上传到网站并确认公开可访问，再提交文件地址。'],
            [isEnglish ? 'Why is crawling limited to 50 pages?' : '为什么在线抓取最多50页？', isEnglish ? 'The public crawler keeps requests fast and safe. For larger sites, paste an exported URL list with up to 50,000 URLs.' : '公开抓取需要控制速度和安全。大型网站可粘贴导出的URL列表，最多支持50,000个。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
      <ToolSeoContent slug="sitemap-generator" language={language} />
    </article>
  );
}

export function WebsiteUrlExtractorPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const [input, setInput] = useState('');
  const [limit, setLimit] = useState(50);
  const [result, setResult] = useState<WebsiteUrlResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState('');

  const extract = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setQuery('');
    try {
      const response = await fetch('/v1/tools/website-url-extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: input.trim(), limit }),
      });
      const payload = await response.json() as WebsiteUrlResponse;
      setResult(payload);
    } catch {
      setResult({ success: false, message: isEnglish ? 'The crawl request failed. Check your connection and try again.' : '抓取请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  const urls = result?.discovered_urls || result?.urls || [];
  const pagesByUrl = new Map((result?.pages || []).flatMap(page => [[page.url, page], [page.final_url, page]]));
  const filteredUrls = urls.filter(url => url.toLowerCase().includes(query.trim().toLowerCase()));

  const copyUrls = async () => {
    if (!urls.length) return;
    await navigator.clipboard.writeText(urls.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadUrls = (format: 'txt' | 'csv' | 'md') => {
    if (!urls.length) return;
    if (format === 'csv') {
      const rows = urls.map(url => {
        const page = pagesByUrl.get(url);
        return [url, page?.status ? String(page.status) : '', page?.title || '', page?.depth !== undefined ? String(page.depth) : ''].map(csvCell).join(',');
      });
      downloadText(`url,status,title,depth\n${rows.join('\n')}\n`, 'herdown-website-urls.csv', 'text/csv;charset=utf-8');
      return;
    }
    if (format === 'md') {
      downloadText(`# Website URLs\n\n${urls.map(url => `- [${pagesByUrl.get(url)?.title || url}](${url})`).join('\n')}\n`, 'herdown-website-urls.md', 'text/markdown;charset=utf-8');
      return;
    }
    downloadText(`${urls.join('\n')}\n`, 'herdown-website-urls.txt', 'text/plain;charset=utf-8');
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Free internal link crawler' : '免费站内链接工具'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'Website URL Extractor' : 'Website URL提取器'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Crawl a public website, collect same-origin HTML links, inspect response status and titles, then export a clean URL inventory.' : '抓取公开网站，收集同源HTML链接，查看响应状态和页面标题，并导出干净的URL清单。'}</p>
      </header>

      <section aria-labelledby="website-extractor-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="website-extractor-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Extract internal website URLs' : '提取网站内部URL'}</h2>
        <form onSubmit={extract} className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px_auto]">
          <div className="relative">
            <label className="sr-only" htmlFor="website-url-extractor-input">{isEnglish ? 'Website URL' : '网站地址'}</label>
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input id="website-url-extractor-input" value={input} onChange={event => setInput(event.target.value)} placeholder="https://example.com" inputMode="url" autoCapitalize="none" spellCheck={false} className="w-full rounded-xl border border-[#263445] bg-[#090d12] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500" />
          </div>
          <label className="rounded-xl border border-[#263445] bg-[#090d12] px-3 py-2 text-xs text-slate-500">{isEnglish ? 'Page limit' : '抓取上限'}<input type="number" min={1} max={50} value={limit} onChange={event => setLimit(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 w-full bg-transparent text-sm text-white outline-none" /></label>
          <button type="submit" disabled={!input.trim() || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"><Link2 className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />{loading ? (isEnglish ? 'Crawling' : '正在抓取') : (isEnglish ? 'Extract URLs' : '提取URL')}</button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'The crawler follows public same-origin HTML links, respects robots.txt, removes fragments and tracking parameters, and blocks private networks.' : '工具只跟随公开的同源HTML链接，遵守robots.txt，去除锚点和跟踪参数，并拦截内网地址。'}</p>
      </section>

      {result && !result.success && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{result.message || (isEnglish ? 'No URLs could be extracted.' : '无法提取URL。')}</div>}

      {result?.success && (
        <section aria-labelledby="website-extractor-result-title" className="space-y-4">
          <h2 id="website-extractor-result-title" className="text-xl font-bold text-white">{isEnglish ? 'URL inventory' : 'URL清单'}</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              [isEnglish ? 'Discovered' : '发现URL', String(urls.length)],
              [isEnglish ? 'Fetched pages' : '已抓取页面', String(result.pages?.length || 0)],
              [isEnglish ? 'Blocked by robots' : 'robots拦截', String(result.robots_blocked || 0)],
              [isEnglish ? 'Elapsed' : '耗时', `${result.elapsed_ms || 0}ms`],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>)}
          </div>
          {result.truncated && <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs leading-6 text-amber-200">{isEnglish ? 'The crawl reached the selected page limit. The exported list includes links already discovered from those pages.' : '抓取已达到设置的页面上限，导出清单仍包含这些页面上已经发现的链接。'}</div>}
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
            <div className="flex flex-col gap-3 border-b border-[#1e293b] p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative flex-1"><span className="sr-only">{isEnglish ? 'Filter URLs' : '筛选URL'}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={isEnglish ? 'Filter URLs' : '筛选URL'} className="w-full rounded-lg border border-[#263445] bg-[#090d12] py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-emerald-500" /></label>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void copyUrls()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-2 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy all' : '复制全部')}</button>{(['txt', 'csv', 'md'] as const).map(format => <button key={format} type="button" onClick={() => downloadUrls(format)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase text-white hover:bg-emerald-500">{format}</button>)}</div>
            </div>
            <div className="max-h-[38rem] overflow-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="sticky top-0 bg-[#111823] text-slate-400"><tr><th className="px-4 py-3 font-medium">URL</th><th className="px-4 py-3 font-medium">{isEnglish ? 'Status' : '状态'}</th><th className="px-4 py-3 font-medium">{isEnglish ? 'Title' : '标题'}</th><th className="px-4 py-3 font-medium">{isEnglish ? 'Depth' : '深度'}</th></tr></thead>
                <tbody className="divide-y divide-[#1e293b]">{filteredUrls.slice(0, 1000).map(url => { const page = pagesByUrl.get(url); return <tr key={url} className="text-slate-300"><td className="max-w-xl break-all px-4 py-3"><a href={url} target="_blank" rel="noreferrer" className="hover:text-emerald-300">{url}</a></td><td className="px-4 py-3">{page?.status || '—'}</td><td className="max-w-xs truncate px-4 py-3">{page?.title || '—'}</td><td className="px-4 py-3">{page?.depth ?? '—'}</td></tr>; })}</tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="website-extractor-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="website-extractor-details-title" className="text-xl font-bold text-white">{isEnglish ? 'What this URL extractor checks' : '这个URL提取器会处理什么'}</h2></div>
        {[
          [isEnglish ? 'Internal links only' : '只保留站内链接', isEnglish ? 'Links must use the same origin as the starting page. External links are not included.' : '链接必须与起始页面属于同一网站来源，外部链接不会混入清单。'],
          [isEnglish ? 'Clean URL normalization' : '规范化URL', isEnglish ? 'Fragments and common tracking parameters are removed before duplicate links are merged.' : '工具先删除锚点和常见跟踪参数，再合并重复链接。'],
          [isEnglish ? 'Useful crawl metadata' : '保留抓取信息', isEnglish ? 'Fetched pages include HTTP status, title, crawl depth, content type, and Last-Modified when present.' : '已抓取页面展示HTTP状态、标题、抓取深度、内容类型和可用的Last-Modified。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="website-extractor-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="website-extractor-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'Website URL extractor FAQ' : 'Website URL提取常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Is this the same as a sitemap extractor?' : '这和Sitemap提取器一样吗？', isEnglish ? 'No. This tool crawls HTML links. The sitemap extractor reads sitemap files and can expand much larger URL sets.' : '不一样。这个工具抓取HTML链接，Sitemap提取器读取Sitemap文件并能展开更大的URL集合。'],
            [isEnglish ? 'Why are some URLs missing status values?' : '为什么部分URL没有状态码？', isEnglish ? 'They were discovered from fetched pages after the selected crawl limit was reached, so they are exported but were not requested.' : '这些URL已从页面链接中被发现，但抓取达到上限后没有继续请求，因此仍会导出但没有状态码。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
    </article>
  );
}
