import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Download, Globe2, Layers, RefreshCw, Upload } from 'lucide-react';
import type { Language } from './i18n';
import { htmlToMarkdown } from './DataMarkdownTools';

type NotionResponse = {
  success: boolean;
  platform?: string;
  code?: string;
  message?: string;
  source_url?: string;
  final_url?: string;
  title?: string;
  markdown?: string;
  images?: string[];
  character_count?: number;
  elapsed_ms?: number;
};

const downloadMarkdown = (content: string, filename: string) => {
  const objectUrl = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
};

const htmlPageTitle = (html: string): string => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return document.title.trim() || document.querySelector('h1')?.textContent?.trim() || 'Notion page';
};

const localHtmlMarkdown = (html: string): { title: string; markdown: string } => {
  const title = htmlPageTitle(html);
  const body = htmlToMarkdown(html);
  const markdown = body.startsWith(`# ${title}`) ? body : `# ${title}\n\n${body}`;
  return { title, markdown: `${markdown.trim()}\n` };
};

type WebsiteCrawlItem = {
  url: string;
  source_url?: string;
  title?: string;
  markdown?: string;
  success?: boolean;
  message?: string;
  elapsed_ms?: number;
};

type WebsiteCrawlResponse = {
  success: boolean;
  domain?: string;
  total_pages?: number;
  results?: WebsiteCrawlItem[];
  elapsed_ms?: number;
  message?: string;
};

const crawlCopy = {
  zh: {
    badge: '精品网站抓取工具', title: 'Website转Markdown', intro: '从域名、起始URL或Sitemap抓取多个公开页面，保留来源并导出干净Markdown。', form: '选择抓取入口', domain: '域名', start: '起始URL', sitemap: 'Sitemap', placeholderDomain: 'https://example.com', placeholderStart: 'https://example.com/docs/start', placeholderSitemap: 'https://example.com/sitemap.xml', pages: '页面数', startCrawl: '开始抓取', crawling: '抓取中', freeLimit: '免费访问每月1000次解析，未使用点数时每日最多20次请求；每次全站抓取最多5页，有可用点数时最多100页。', sourceMode: '来源模式', results: '抓取结果', pagesFound: '已处理页面', source: '来源', failed: '失败', success: '已完成', downloadMarkdown: '下载Markdown', downloadZip: '下载ZIP', copy: '复制全部', copied: '已复制', useTitle: '怎么使用Website转Markdown', steps: [['选择入口', '输入域名、起始URL或Sitemap地址。'], ['设置页数', '按当前免费额度或账户点数设置本次页面数。'], ['检查并导出', '逐页检查标题、来源和失败提示，再下载Markdown或ZIP。']], supportsTitle: '支持的抓取方式', supports: [['域名抓取', '优先查找根目录Sitemap，找不到时再读取网站入口页。'], ['起始URL抓取', '从你指定的公开页面发现同源链接，适合文档目录或专题入口。'], ['Sitemap抓取', '直接读取Sitemap或SitemapIndex中的公开URL，并自动去重。'], ['来源保留', '每个结果显示原始URL，导出的Markdown也会写入source_url。']], limitsTitle: '限制与失败处理', limits: '只处理公开可访问页面；登录墙、robots限制、超时、跨域保护和动态内容可能导致单页失败。失败页面会单独标记，不会伪装成空白成功结果。', privacyTitle: '隐私与数据范围', privacy: '网站抓取只会请求你提交的公开地址。Herdown不会把抓取结果作为公开页面长期托管；导出的文件由你主动下载。', faqTitle: 'Website转Markdown常见问题', faq: [['可以输入网站首页吗？', '可以。域名模式会优先查找根目录Sitemap，无法获取时读取入口页并发现同源链接。'], ['起始URL和Sitemap有什么区别？', '起始URL从一个公开页面发现同源链接；Sitemap模式直接使用Sitemap中的URL列表。'], ['为什么有些页面失败？', '目标页面可能需要登录、阻止服务器请求、超时或依赖浏览器脚本。结果会保留来源并显示失败状态。'], ['免费额度怎么算？', '免费访问每月1000次解析，未使用点数时每日最多20次请求；全站抓取按实际处理页面计数，单次最多5页。']], empty: '还没有结果，请输入地址开始抓取。', noMarkdown: '未提取到Markdown内容', requestFailed: '抓取请求失败，请检查地址、权限或免费额度后重试。', noResults: '没有发现可处理的公开页面。'},
  en: {
    badge: 'Focused website crawl tool', title: 'Website to Markdown', intro: 'Crawl multiple public pages from a domain, starting URL, or sitemap while retaining sources and exporting clean Markdown.', form: 'Choose a crawl entry', domain: 'Domain', start: 'Starting URL', sitemap: 'Sitemap', placeholderDomain: 'https://example.com', placeholderStart: 'https://example.com/docs/start', placeholderSitemap: 'https://example.com/sitemap.xml', pages: 'Pages', startCrawl: 'Start crawl', crawling: 'Crawling', freeLimit: 'Free access includes 1,000 parses per month and up to 20 requests per day without purchased credits. Each crawl request can process up to 5 pages; available credits allow up to 100 pages.', sourceMode: 'Source mode', results: 'Crawl results', pagesFound: 'Pages processed', source: 'Source', failed: 'Failed', success: 'Complete', downloadMarkdown: 'Download Markdown', downloadZip: 'Download ZIP', copy: 'Copy all', copied: 'Copied', useTitle: 'How to use Website to Markdown', steps: [['Choose an entry', 'Enter a domain, starting URL, or sitemap address.'], ['Set the page limit', 'Set the number of pages for your free quota or available credits.'], ['Review and export', 'Review titles, sources, and failures before downloading Markdown or ZIP.']], supportsTitle: 'Supported crawl inputs', supports: [['Domain crawl', 'The tool checks the root sitemap first, then reads the entry page when no sitemap is available.'], ['Starting URL crawl', 'Discover same-origin links from the public page you provide, useful for documentation sections.'], ['Sitemap crawl', 'Read public URLs from a sitemap or sitemap index and deduplicate them automatically.'], ['Source retention', 'Every result shows its original URL, and exported Markdown includes source_url.']], limitsTitle: 'Limits and failure handling', limits: 'Only publicly accessible pages are processed. Login walls, robots restrictions, timeouts, cross-origin protection, and dynamic content can make an individual page fail. Failed pages are marked instead of being reported as empty successes.', privacyTitle: 'Privacy and data scope', privacy: 'Website crawl requests only the public addresses you submit. Herdown does not publish crawl results as a long-term public collection; exported files are downloaded by you.', faqTitle: 'Website to Markdown FAQ', faq: [['Can I enter a homepage?', 'Yes. Domain mode checks the root sitemap first and falls back to the entry page to discover same-origin links.'], ['What is the difference between a starting URL and a sitemap?', 'Starting URL mode discovers same-origin links from one public page. Sitemap mode uses the URLs declared by the sitemap directly.'], ['Why did a page fail?', 'The page may require login, block server requests, time out, or depend on browser-only scripts. The source URL and failure state remain visible.'], ['How is the free quota counted?', 'Free access includes 1,000 monthly parses and up to 20 parsing requests per day without purchased credits. A crawl request processes up to 5 pages.']], empty: 'No results yet. Enter an address to start a crawl.', noMarkdown: 'No Markdown was extracted', requestFailed: 'The crawl request failed. Check the address, access, or free quota and try again.', noResults: 'No public pages were found to process.'},
  ja: {
    badge: 'Webサイト巡回ツール', title: 'WebサイトからMarkdownへ', intro: 'ドメイン、開始URL、Sitemapから公開ページを巡回し、出典を残してMarkdownを出力します。', form: '巡回入口を選択', domain: 'ドメイン', start: '開始URL', sitemap: 'Sitemap', placeholderDomain: 'https://example.com', placeholderStart: 'https://example.com/docs/start', placeholderSitemap: 'https://example.com/sitemap.xml', pages: 'ページ数', startCrawl: '巡回を開始', crawling: '巡回中', freeLimit: '無料枠は月1,000回、クレジット未購入時は1日20回までです。1回の巡回は5ページまで、クレジット利用時は最大100ページです。', sourceMode: '出典モード', results: '巡回結果', pagesFound: '処理済みページ', source: '出典', failed: '失敗', success: '完了', downloadMarkdown: 'Markdownを保存', downloadZip: 'ZIPを保存', copy: 'すべてコピー', copied: 'コピーしました', useTitle: 'WebサイトからMarkdownへの使い方', steps: [['入口を選択', 'ドメイン、開始URL、Sitemapを入力します。'], ['ページ数を設定', '無料枠または利用可能なクレジットに合わせてページ数を設定します。'], ['確認と出力', 'タイトル、出典、失敗表示を確認し、MarkdownまたはZIPを保存します。']], supportsTitle: '対応する巡回方法', supports: [['ドメイン巡回', 'ルートSitemapを優先し、見つからない場合は入口ページを読み込みます。'], ['開始URL巡回', '指定した公開ページから同一サイトのリンクを発見します。'], ['Sitemap巡回', 'SitemapまたはSitemapIndexの公開URLを読み込み、重複を除きます。'], ['出典の保持', '各結果に元URLを表示し、Markdownにもsource_urlを書き込みます。']], limitsTitle: '制限と失敗処理', limits: '公開アクセス可能なページのみ対応します。ログイン、robots制限、タイムアウト、動的な内容により個別ページが失敗する場合があります。', privacyTitle: 'プライバシーとデータ範囲', privacy: '入力した公開アドレスだけをリクエストします。巡回結果を公開コレクションとして長期保管せず、出力ファイルは利用者が保存します。', faqTitle: 'WebサイトからMarkdownへのFAQ', faq: [['トップページを入力できますか？', 'はい。ドメインモードはルートSitemapを確認し、なければ入口ページから同一サイトのリンクを探します。'], ['開始URLとSitemapの違いは何ですか？', '開始URLは1ページからリンクを発見し、Sitemapは記載されたURLを直接使います。'], ['ページが失敗する理由は？', 'ログイン、サーバー拒否、タイムアウト、ブラウザ専用スクリプトなどが原因です。元URLと失敗状態は残ります。'], ['無料枠はどう数えますか？', '月1,000回の無料解析を共有し、クレジット未購入時は1日20回までです。サイト巡回は実際のページ数を数え、1回5ページまでです。']], empty: '結果はまだありません。アドレスを入力して巡回を開始してください。', noMarkdown: 'Markdownを抽出できませんでした', requestFailed: '巡回に失敗しました。アドレス、アクセス権、無料枠を確認してください。', noResults: '処理できる公開ページが見つかりませんでした。'},
  es: {
    badge: 'Herramienta de rastreo web', title: 'De sitio web a Markdown', intro: 'Rastrea páginas públicas desde un dominio, una URL inicial o un sitemap, conserva las fuentes y exporta Markdown limpio.', form: 'Elige una entrada', domain: 'Dominio', start: 'URL inicial', sitemap: 'Sitemap', placeholderDomain: 'https://example.com', placeholderStart: 'https://example.com/docs/start', placeholderSitemap: 'https://example.com/sitemap.xml', pages: 'Páginas', startCrawl: 'Iniciar rastreo', crawling: 'Rastreando', freeLimit: 'La cuota gratuita incluye 1.000 análisis al mes y hasta 20 solicitudes diarias sin créditos comprados. Cada rastreo procesa hasta 5 páginas; con créditos puede llegar a 100.', sourceMode: 'Modo de fuente', results: 'Resultados del rastreo', pagesFound: 'Páginas procesadas', source: 'Fuente', failed: 'Fallida', success: 'Completada', downloadMarkdown: 'Descargar Markdown', downloadZip: 'Descargar ZIP', copy: 'Copiar todo', copied: 'Copiado', useTitle: 'Cómo usar De sitio web a Markdown', steps: [['Elige una entrada', 'Introduce un dominio, una URL inicial o una dirección de sitemap.'], ['Define el límite', 'Define el número de páginas según tu cuota gratuita o tus créditos.'], ['Revisa y exporta', 'Revisa títulos, fuentes y fallos antes de descargar Markdown o ZIP.']], supportsTitle: 'Entradas compatibles', supports: [['Rastreo por dominio', 'Comprueba primero el sitemap raíz y usa la página de entrada si no existe.'], ['Rastreo desde una URL', 'Descubre enlaces del mismo sitio desde la página pública indicada.'], ['Rastreo de sitemap', 'Lee URLs públicas de un sitemap o SitemapIndex y elimina duplicados.'], ['Conservar fuentes', 'Cada resultado muestra su URL original y el Markdown exportado incluye source_url.']], limitsTitle: 'Límites y fallos', limits: 'Solo se procesan páginas públicas. El inicio de sesión, robots, los tiempos de espera, la protección entre orígenes o el contenido dinámico pueden provocar fallos individuales.', privacyTitle: 'Privacidad y alcance', privacy: 'El rastreo solo solicita las direcciones públicas que envías. Herdown no publica los resultados como una colección permanente; tú decides cuándo descargar los archivos.', faqTitle: 'Preguntas frecuentes sobre De sitio web a Markdown', faq: [['¿Puedo introducir la página de inicio?', 'Sí. El modo de dominio comprueba el sitemap raíz y, si no está disponible, descubre enlaces desde la página de entrada.'], ['¿En qué se diferencian la URL inicial y el sitemap?', 'La URL inicial descubre enlaces del mismo sitio desde una página. El modo sitemap usa directamente las URLs declaradas.'], ['¿Por qué falla una página?', 'Puede requerir inicio de sesión, bloquear solicitudes, superar el tiempo de espera o depender de scripts del navegador. La fuente y el estado quedan visibles.'], ['¿Cómo se cuenta la cuota gratuita?', 'La cuota incluye 1.000 análisis al mes y hasta 20 solicitudes diarias sin créditos comprados. Cada rastreo procesa hasta 5 páginas.']], empty: 'Aún no hay resultados. Introduce una dirección para iniciar el rastreo.', noMarkdown: 'No se extrajo Markdown', requestFailed: 'Falló la solicitud. Comprueba la dirección, el acceso o la cuota gratuita.', noResults: 'No se encontraron páginas públicas procesables.'},
  de: {
    badge: 'Website-Crawl-Werkzeug', title: 'Website zu Markdown', intro: 'Öffentliche Seiten über Domain, Start-URL oder Sitemap crawlen, Quellen behalten und sauberes Markdown exportieren.', form: 'Crawl-Einstieg wählen', domain: 'Domain', start: 'Start-URL', sitemap: 'Sitemap', placeholderDomain: 'https://example.com', placeholderStart: 'https://example.com/docs/start', placeholderSitemap: 'https://example.com/sitemap.xml', pages: 'Seiten', startCrawl: 'Crawl starten', crawling: 'Wird gecrawlt', freeLimit: 'Das kostenlose Kontingent umfasst 1.000 Analysen pro Monat und ohne gekaufte Credits bis zu 20 Anfragen pro Tag. Ein Crawl verarbeitet bis zu 5 Seiten; mit Credits sind bis zu 100 Seiten möglich.', sourceMode: 'Quellenmodus', results: 'Crawl-Ergebnisse', pagesFound: 'Verarbeitete Seiten', source: 'Quelle', failed: 'Fehlgeschlagen', success: 'Fertig', downloadMarkdown: 'Markdown laden', downloadZip: 'ZIP laden', copy: 'Alles kopieren', copied: 'Kopiert', useTitle: 'Website zu Markdown verwenden', steps: [['Einstieg wählen', 'Domain, Start-URL oder Sitemap-Adresse eingeben.'], ['Seitenlimit setzen', 'Die Seitenzahl passend zum kostenlosen Kontingent oder zu Credits festlegen.'], ['Prüfen und exportieren', 'Titel, Quellen und Fehler prüfen und danach Markdown oder ZIP laden.']], supportsTitle: 'Unterstützte Crawl-Eingaben', supports: [['Domain-Crawl', 'Zuerst wird die Sitemap der Domain geprüft, danach die Einstiegsseite verwendet.'], ['Crawl ab Start-URL', 'Gleichseitige Links der angegebenen öffentlichen Seite entdecken.'], ['Sitemap-Crawl', 'Öffentliche URLs aus Sitemap oder SitemapIndex lesen und Duplikate entfernen.'], ['Quellen behalten', 'Jedes Ergebnis zeigt die Original-URL; exportiertes Markdown enthält source_url.']], limitsTitle: 'Grenzen und Fehler', limits: 'Nur öffentlich erreichbare Seiten werden verarbeitet. Login, robots, Zeitüberschreitungen, Cross-Origin-Schutz und dynamische Inhalte können einzelne Seiten fehlschlagen lassen.', privacyTitle: 'Datenschutz und Umfang', privacy: 'Der Crawl fordert nur die von dir eingegebenen öffentlichen Adressen an. Herdown veröffentlicht Crawl-Ergebnisse nicht dauerhaft; du entscheidest über den Download.', faqTitle: 'Website zu Markdown FAQ', faq: [['Kann ich die Startseite eingeben?', 'Ja. Der Domain-Modus prüft die Root-Sitemap und entdeckt bei Bedarf Links von der Einstiegsseite.'], ['Was ist der Unterschied zwischen Start-URL und Sitemap?', 'Die Start-URL entdeckt gleichseitige Links von einer öffentlichen Seite. Der Sitemap-Modus verwendet die dort angegebenen URLs direkt.'], ['Warum ist eine Seite fehlgeschlagen?', 'Sie kann Login erfordern, Anfragen blockieren, zu lange brauchen oder browserabhängige Skripte verwenden. Quelle und Status bleiben sichtbar.'], ['Wie wird das kostenlose Kontingent gezählt?', 'Das Kontingent umfasst 1.000 Analysen pro Monat und ohne gekaufte Credits 20 Anfragen pro Tag. Ein Crawl verarbeitet bis zu 5 Seiten.']], empty: 'Noch keine Ergebnisse. Adresse eingeben und Crawl starten.', noMarkdown: 'Kein Markdown extrahiert', requestFailed: 'Crawl-Anfrage fehlgeschlagen. Adresse, Zugriff oder Kontingent prüfen.', noResults: 'Keine verarbeitbaren öffentlichen Seiten gefunden.'},
} as const;

type CrawlSourceType = 'domain' | 'start' | 'sitemap';

const crawlInputCopy = {
  zh: { title: '输入抓取地址', label: '域名、起始URL或Sitemap地址', placeholder: '例如：https://example.com，或https://example.com/sitemap.xml', hint: '系统会根据地址自动识别为域名、起始URL或Sitemap。' },
  en: { title: 'Enter a crawl address', label: 'Domain, starting URL, or sitemap address', placeholder: 'https://example.com or https://example.com/sitemap.xml', hint: 'The crawl type is detected automatically from the address.' },
  ja: { title: '巡回するアドレスを入力', label: 'ドメイン、開始URL、またはSitemapアドレス', placeholder: '例：https://example.com、またはhttps://example.com/sitemap.xml', hint: 'アドレスから巡回方法を自動判定します。' },
  es: { title: 'Introduce una dirección', label: 'Dominio, URL inicial o dirección del sitemap', placeholder: 'https://example.com o https://example.com/sitemap.xml', hint: 'El tipo de rastreo se detecta automáticamente a partir de la dirección.' },
  de: { title: 'Crawl-Adresse eingeben', label: 'Domain, Start-URL oder Sitemap-Adresse', placeholder: 'https://example.com oder https://example.com/sitemap.xml', hint: 'Der Crawl-Typ wird automatisch anhand der Adresse erkannt.' },
} as const;

const detectCrawlSourceType = (value: string): CrawlSourceType => {
  const target = value.trim();
  if (/sitemap|\.xml(?:[?#]|$)/i.test(target)) return 'sitemap';
  try {
    const parsed = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
    return parsed.pathname === '/' && !parsed.search && !parsed.hash ? 'domain' : 'start';
  } catch {
    return 'domain';
  }
};

export function WebsiteToMarkdownPage({ language }: { language: Language }) {
  const copy = crawlCopy[language];
  const inputCopy = crawlInputCopy[language];
  const related = {
    zh: { aria: '相关工具', url: '网页转Markdown', extractor: 'SitemapURL提取器', checker: 'Sitemap查找与检查', viewer: 'Markdown查看器' },
    en: { aria: 'Related tools', url: 'URL to Markdown', extractor: 'Sitemap URL Extractor', checker: 'Sitemap Finder & Checker', viewer: 'Markdown Viewer' },
    ja: { aria: '関連ツール', url: 'URLからMarkdownへ', extractor: 'SitemapURL抽出', checker: 'Sitemap検索とチェック', viewer: 'Markdownビューア' },
    es: { aria: 'Herramientas relacionadas', url: 'URL a Markdown', extractor: 'Extractor de URL de Sitemap', checker: 'Buscador y comprobador de Sitemap', viewer: 'Visor Markdown' },
    de: { aria: 'Verwandte Werkzeuge', url: 'URL zu Markdown', extractor: 'Sitemap-URL-Extraktor', checker: 'Sitemap-Finder und -Prüfer', viewer: 'Markdown-Viewer' },
  }[language];
  const relatedHref = (path: string) => language === 'zh' ? path : `${path}?lang=${language}`;
  const [target, setTarget] = useState('');
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<WebsiteCrawlResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const items = result?.results || [];
  const successfulItems = items.filter(item => item.success !== false && Boolean(item.markdown?.trim()));
  const combinedMarkdown = successfulItems.map((item, index) => `---\ntitle: "${(item.title || `Page ${index + 1}`).replace(/"/g, '\\"')}"\nsource_url: "${item.source_url || item.url}"\n---\n\n# ${item.title || `Page ${index + 1}`}\n\n${item.markdown?.trim() || ''}`).join('\n\n');

  const runCrawl = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/v1/crawl', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: target.trim(), source_type: detectCrawlSourceType(target), limit: Math.max(1, Math.min(100, limit)) }) });
      const data = await response.json() as WebsiteCrawlResponse;
      if (!response.ok || !data.success) setError(data.message || copy.requestFailed);
      else setResult(data);
    } catch {
      setError(copy.requestFailed);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!combinedMarkdown) return;
    await navigator.clipboard.writeText(combinedMarkdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadZip = async () => {
    if (!successfulItems.length) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    successfulItems.forEach((item, index) => {
      const name = (item.title || `page-${index + 1}`).replace(/[\\/:?%*|"<>]/g, '_').trim() || `page-${index + 1}`;
      zip.file(`${name}.md`, `---\ntitle: "${(item.title || name).replace(/"/g, '\\"')}"\nsource_url: "${item.source_url || item.url}"\n---\n\n# ${item.title || name}\n\n${item.markdown?.trim() || ''}\n`);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'herdown-website-crawl.zip';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <article className="mx-auto max-w-5xl space-y-10">
    <header className="max-w-3xl">
      <span className="text-xs font-semibold text-emerald-400">{copy.badge}</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-400">{copy.intro}</p>
    </header>

    <section aria-labelledby="website-crawl-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
      <h2 id="website-crawl-form-title" className="text-lg font-bold text-white">{inputCopy.title}</h2>
      <form onSubmit={runCrawl} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end">
        <label className="sr-only" htmlFor="website-crawl-target">{inputCopy.label}</label>
        <div className="relative h-12"><Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="website-crawl-target" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} value={target} onChange={event => setTarget(event.target.value)} placeholder={inputCopy.placeholder} aria-describedby="website-crawl-input-hint" className="h-full w-full rounded-xl border border-[#263445] bg-[#090d12] py-0 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500" /></div>
        <label className="flex flex-col text-xs text-slate-400">{copy.pages}<input type="number" min={1} max={100} value={limit} onChange={event => setLimit(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} className="mt-1 h-12 w-full rounded-xl border border-[#263445] bg-[#090d12] px-3 py-0 text-sm text-slate-100 outline-none focus:border-emerald-500" /></label>
        <button type="submit" disabled={!target.trim() || loading} className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}{loading ? copy.crawling : copy.startCrawl}</button>
      </form>
      <p id="website-crawl-input-hint" className="mt-3 text-xs leading-6 text-slate-500">{inputCopy.hint}</p>
      <p className="mt-3 text-xs leading-6 text-slate-500">{copy.freeLimit}</p>
    </section>

    {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    {result && <section aria-labelledby="website-crawl-results-title" className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="website-crawl-results-title" className="text-xl font-bold text-white">{copy.results}</h2><p className="mt-1 text-xs text-slate-500">{copy.pagesFound}: {result.total_pages || 0} · {result.domain}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void copyAll()} disabled={!combinedMarkdown} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-2 text-xs text-slate-300 disabled:opacity-40"><Copy className="h-3.5 w-3.5" />{copied ? copy.copied : copy.copy}</button><button type="button" onClick={() => downloadMarkdown(combinedMarkdown, 'website-crawl.md')} disabled={!combinedMarkdown} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-2 text-xs text-slate-300 disabled:opacity-40"><Download className="h-3.5 w-3.5" />{copy.downloadMarkdown}</button><button type="button" onClick={() => void downloadZip()} disabled={!successfulItems.length} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Download className="h-3.5 w-3.5" />{copy.downloadZip}</button></div></div>{!items.length && <p className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4 text-sm text-slate-400">{copy.noResults}</p>}<div className="space-y-3">{items.map((item, index) => { const ok = item.success !== false && Boolean(item.markdown?.trim()); return <article key={`${item.url}-${index}`} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-white">{item.title || copy.noMarkdown}</h3><p className="mt-1 break-all text-xs text-slate-500">{item.source_url || item.url}</p></div><span className={`inline-flex shrink-0 items-center gap-1 text-xs ${ok ? 'text-emerald-300' : 'text-red-300'}`}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}{ok ? copy.success : copy.failed}</span></div>{!ok && <p className="mt-3 text-xs leading-6 text-red-200">{item.message || copy.noMarkdown}</p>}{ok && <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap rounded-lg bg-[#090d12] p-3 text-xs leading-6 text-emerald-100">{item.markdown}</pre>}</article>; })}</div></section>}

    <section aria-labelledby="website-crawl-howto-title" className="space-y-4"><h2 id="website-crawl-howto-title" className="text-xl font-bold text-white">{copy.useTitle}</h2><div className="grid gap-4 md:grid-cols-3">{copy.steps.map(([title, body], index) => <div key={title} id={`step-${index + 1}`} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{index + 1}. {title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>)}</div></section>
    <section aria-labelledby="website-crawl-support-title" className="space-y-4"><h2 id="website-crawl-support-title" className="text-xl font-bold text-white">{copy.supportsTitle}</h2><div className="grid gap-4 md:grid-cols-2">{copy.supports.map(([title, body]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>)}</div></section>
    <section className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-2"><div><h2 className="text-xl font-bold text-white">{copy.limitsTitle}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{copy.limits}</p></div><div><h2 className="text-xl font-bold text-white">{copy.privacyTitle}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{copy.privacy}</p></div></section>
    <section aria-labelledby="website-crawl-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8"><h2 id="website-crawl-faq-title" className="text-xl font-bold text-white">{copy.faqTitle}</h2><div className="grid gap-3 md:grid-cols-2">{copy.faq.map(([question, answer]) => <details key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-200">{question}</summary><p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p></details>)}</div></section>
    <nav aria-label={related.aria} className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#1e293b] pt-6 text-sm text-emerald-300"><a href={relatedHref('/url-to-markdown')}>{related.url}</a><a href={relatedHref('/sitemap-extractor')}>{related.extractor}</a><a href={relatedHref('/sitemap-checker')}>{related.checker}</a><a href={relatedHref('/markdown-viewer')}>{related.viewer}</a></nav>
  </article>;
}

export function NotionMarkdownPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'url' | 'local'>('url');
  const [url, setUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [result, setResult] = useState<NotionResponse | null>(null);
  const [localFileName, setLocalFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = (nextMode: 'url' | 'local') => {
    setMode(nextMode);
    setResult(null);
    setLocalFileName('');
    setHtmlSource('');
  };

  const convertUrl = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/v1/tools/cloud-document-to-markdown', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ platform: 'notion', url: url.trim() }),
      });
      setResult(await response.json() as NotionResponse);
    } catch {
      setResult({ success: false, message: isEnglish ? 'The request failed. Check your connection and try again.' : '请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  const convertLocal = async (html: string, fileName: string) => {
    setLoading(true);
    setResult(null);
    try {
      const output = localHtmlMarkdown(html);
      if (output.markdown.replace(/\s/g, '').length < 40) throw new Error('EMPTY');
      setResult({ success: true, platform: 'notion', title: output.title, markdown: output.markdown, character_count: output.markdown.length, source_url: fileName });
    } catch {
      setResult({ success: false, message: isEnglish ? 'No readable Notion HTML content was found.' : '没有找到可读的NotionHTML内容。' });
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setResult({ success: false, message: isEnglish ? 'Choose a Notion HTML export no larger than 50MB.' : '请选择不超过50MB的NotionHTML导出文件。' });
      return;
    }
    setLocalFileName(file.name);
    try {
      if (/\.zip$/i.test(file.name) || file.type.includes('zip')) {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const htmlEntries = Object.values(zip.files).filter(entry => !entry.dir && /\.(html?|xhtml)$/i.test(entry.name));
        if (!htmlEntries.length) throw new Error('EMPTY');
        const selected = htmlEntries.find(entry => /(^|\/)index\.html?$/i.test(entry.name)) || htmlEntries[0];
        await convertLocal(await selected.async('text'), selected.name);
      } else if (/\.html?$/i.test(file.name) || file.type.includes('html')) {
        await convertLocal(await file.text(), file.name);
      } else {
        setResult({ success: false, message: isEnglish ? 'Choose a Notion HTML export or ZIP file.' : '请选择NotionHTML导出文件或ZIP文件。' });
      }
    } catch {
      setResult({ success: false, message: isEnglish ? 'The Notion export could not be opened. Export it as HTML and retry.' : '无法打开Notion导出文件，请重新导出为HTML后重试。' });
    }
  };

  const submitLocal = (event: React.FormEvent) => {
    event.preventDefault();
    if (htmlSource.trim()) void convertLocal(htmlSource, 'pasted-notion.html');
  };

  const markdown = result?.markdown || '';
  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Notion to Markdown' : 'Notion转Markdown'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'Notion to Markdown' : 'Notion转Markdown'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Convert a public Notion page online, or process a Notion HTML export locally when the page is private or access-restricted.' : '公开Notion页面可在线转换；如果页面受限，也可以上传NotionHTML导出文件或粘贴HTML在本地处理。'}</p>
      </header>

      <section aria-labelledby="notion-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="notion-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Choose a Notion source' : '选择Notion来源'}</h2>
        <div className="mt-4 inline-flex rounded-xl border border-[#263445] bg-[#090d12] p-1">
          {(['url', 'local'] as const).map(item => <button key={item} type="button" onClick={() => reset(item)} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${mode === item ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item === 'url' ? (isEnglish ? 'Public URL' : '公开URL') : (isEnglish ? 'HTML export' : 'HTML导出')}</button>)}
        </div>
        {mode === 'url' ? (
          <form onSubmit={convertUrl} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="notion-url">{isEnglish ? 'Public Notion URL' : '公开Notion地址'}</label>
            <div className="relative flex-1"><Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="notion-url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://your-workspace.notion.site/page" inputMode="url" autoCapitalize="none" spellCheck={false} className="w-full rounded-xl border border-[#263445] bg-[#090d12] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500" /></div>
            <button type="submit" disabled={!url.trim() || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{loading ? (isEnglish ? 'Converting' : '正在转换') : (isEnglish ? 'Convert page' : '转换页面')}</button>
          </form>
        ) : (
          <>
            <input ref={inputRef} type="file" accept=".html,.htm,.zip,text/html,application/zip" className="hidden" onChange={event => void onFile(event.target.files?.[0])} />
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#334155] bg-[#090d12] px-4 py-6 text-sm font-semibold text-slate-300 hover:border-emerald-500/50 hover:text-white"><Upload className="h-4 w-4" />{localFileName || (isEnglish ? 'Choose Notion HTML or ZIP export' : '选择NotionHTML或ZIP导出文件')}</button>
            <div className="my-4 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-[#263445]" /><span>{isEnglish ? 'or paste exported HTML' : '或粘贴导出的HTML'}</span><span className="h-px flex-1 bg-[#263445]" /></div>
            <form onSubmit={submitLocal}><label className="sr-only" htmlFor="notion-html">HTML</label><textarea id="notion-html" value={htmlSource} onChange={event => setHtmlSource(event.target.value)} rows={12} placeholder="<h1>Notion page</h1><p>Page content</p>" spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500" /><button type="submit" disabled={!htmlSource.trim() || loading} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{loading ? (isEnglish ? 'Converting' : '正在转换') : (isEnglish ? 'Convert local HTML' : '转换本地HTML')}</button></form>
          </>
        )}
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'Online mode requires a published public page. HTML export mode stays in this browser and supports Notion HTML ZIP exports.' : '在线模式要求页面已经公开发布。HTML导出模式只在当前浏览器中处理，并支持NotionHTMLZIP导出。'}</p>
      </section>

      {result && !result.success && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200">{result.message || (isEnglish ? 'The Notion page could not be converted.' : 'Notion页面无法转换。')}</div>}

      {result?.success && markdown && (
        <section aria-labelledby="notion-result-title" className="space-y-4">
          <h2 id="notion-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Markdown result' : 'Markdown结果'}</h2>
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Title' : '标题'}</p><p className="mt-1 truncate text-sm font-bold text-white">{result.title}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Characters' : '字符数'}</p><p className="mt-1 text-2xl font-bold text-white">{result.character_count || markdown.length}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Source' : '来源'}</p><p className="mt-1 truncate text-sm font-bold text-white">{result.source_url?.startsWith('http') ? 'Notion URL' : result.source_url}</p></div></div>
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">notion-page.md</span><div className="flex gap-2"><button type="button" onClick={() => void copyMarkdown()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}</button><button type="button" onClick={() => downloadMarkdown(markdown, 'notion-page.md')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{isEnglish ? 'Download .md' : '下载.md'}</button></div></div><pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-emerald-100">{markdown}</pre></div>
        </section>
      )}

      <section aria-labelledby="notion-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3"><div className="md:col-span-3"><h2 id="notion-details-title" className="text-xl font-bold text-white">{isEnglish ? 'Reliable Notion conversion paths' : '可靠的Notion转换路径'}</h2></div>
        {[
          [isEnglish ? 'Published public page' : '公开发布页面', isEnglish ? 'Use the published notion.site URL when anyone on the web can view the page.' : '页面设置为任何人可访问后，使用公开的notion.site地址。'],
          [isEnglish ? 'HTML export ZIP' : 'HTML导出ZIP', isEnglish ? 'In Notion, export the page as HTML, then select the ZIP here. The first HTML page is converted locally.' : '在Notion中将页面导出为HTML，再上传ZIP；工具会在本地转换其中的HTML页面。'],
          [isEnglish ? 'Private content stays local' : '私密内容留在本地', isEnglish ? 'If a page cannot be published, export HTML and keep the content on your device.' : '页面无法公开时，导出HTML即可在本地处理，内容不需要上传。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="notion-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8"><h2 id="notion-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'Notion to Markdown FAQ' : 'Notion转Markdown常见问题'}</h2><div className="grid gap-3 md:grid-cols-2">
        {[
          [isEnglish ? 'Why did the public URL fail?' : '为什么公开URL失败？', isEnglish ? 'The page may still be private, may use an editor URL, or may require access. Publish it from Notion or use an HTML export.' : '页面可能仍是私密状态、使用了编辑器地址或需要权限。请在Notion中发布，或改用HTML导出。'],
          [isEnglish ? 'Does the ZIP upload go to a server?' : 'ZIP上传会发送到服务器吗？', isEnglish ? 'No. HTML ZIP files are opened and converted in your browser.' : '不会。HTMLZIP文件会在当前浏览器中打开和转换。'],
        ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
      </div></section>
    </article>
  );
}

export function GoogleDocsMarkdownPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'url' | 'local'>('url');
  const [url, setUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [result, setResult] = useState<NotionResponse | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = (nextMode: 'url' | 'local') => {
    setMode(nextMode);
    setResult(null);
    setFileName('');
    setHtmlSource('');
  };

  const convertUrl = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/v1/tools/cloud-document-to-markdown', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platform: 'google-docs', url: url.trim() }) });
      setResult(await response.json() as NotionResponse);
    } catch {
      setResult({ success: false, message: isEnglish ? 'The request failed. Check your connection and try again.' : '请求失败，请检查网络后重试。' });
    } finally {
      setLoading(false);
    }
  };

  const convertLocal = (html: string, sourceName: string) => {
    setLoading(true);
    setResult(null);
    try {
      const output = localHtmlMarkdown(html);
      if (output.markdown.replace(/\s/g, '').length < 40) throw new Error('EMPTY');
      setResult({ success: true, platform: 'google-docs', title: output.title, markdown: output.markdown, character_count: output.markdown.length, source_url: sourceName });
    } catch {
      setResult({ success: false, message: isEnglish ? 'No readable Google Docs HTML content was found.' : '没有找到可读的Google DocsHTML内容。' });
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setResult({ success: false, message: isEnglish ? 'Choose an HTML export no larger than 50MB.' : '请选择不超过50MB的HTML导出文件。' });
      return;
    }
    setFileName(file.name);
    if (/\.html?$/i.test(file.name) || file.type.includes('html')) convertLocal(await file.text(), file.name);
    else setResult({ success: false, message: isEnglish ? 'Choose a Google Docs HTML export.' : '请选择Google DocsHTML导出文件。' });
  };

  const submitLocal = (event: React.FormEvent) => {
    event.preventDefault();
    if (htmlSource.trim()) convertLocal(htmlSource, 'pasted-google-docs.html');
  };

  const markdown = result?.markdown || '';
  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl"><span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Google Docs to Markdown' : 'Google Docs转Markdown'}</span><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'Google Docs to Markdown' : 'Google Docs转Markdown'}</h1><p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Convert a public Google Docs document online, or process an exported HTML file locally when the document is private or restricted.' : '公开Google Docs文档可在线转换；如果文档受限，也可以上传Google DocsHTML导出文件或粘贴HTML在本地处理。'}</p></header>
      <section aria-labelledby="google-docs-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6"><h2 id="google-docs-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Choose a Google Docs source' : '选择Google Docs来源'}</h2><div className="mt-4 inline-flex rounded-xl border border-[#263445] bg-[#090d12] p-1">{(['url', 'local'] as const).map(item => <button key={item} type="button" onClick={() => reset(item)} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${mode === item ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item === 'url' ? (isEnglish ? 'Public URL' : '公开URL') : (isEnglish ? 'HTML export' : 'HTML导出')}</button>)}</div>
        {mode === 'url' ? <form onSubmit={convertUrl} className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="google-docs-url">{isEnglish ? 'Public Google Docs URL' : '公开Google Docs地址'}</label><div className="relative flex-1"><Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input id="google-docs-url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://docs.google.com/document/d/.../edit" inputMode="url" autoCapitalize="none" spellCheck={false} className="w-full rounded-xl border border-[#263445] bg-[#090d12] py-3 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-500" /></div><button type="submit" disabled={!url.trim() || loading} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{loading ? (isEnglish ? 'Converting' : '正在转换') : (isEnglish ? 'Convert document' : '转换文档')}</button></form> : <><input ref={inputRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={event => void onFile(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#334155] bg-[#090d12] px-4 py-6 text-sm font-semibold text-slate-300 hover:border-emerald-500/50 hover:text-white"><Upload className="h-4 w-4" />{fileName || (isEnglish ? 'Choose Google Docs HTML export' : '选择Google DocsHTML导出文件')}</button><div className="my-4 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-[#263445]" /><span>{isEnglish ? 'or paste exported HTML' : '或粘贴导出的HTML'}</span><span className="h-px flex-1 bg-[#263445]" /></div><form onSubmit={submitLocal}><label className="sr-only" htmlFor="google-docs-html">HTML</label><textarea id="google-docs-html" value={htmlSource} onChange={event => setHtmlSource(event.target.value)} rows={12} placeholder="<h1>Document title</h1><p>Document content</p>" spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500" /><button type="submit" disabled={!htmlSource.trim() || loading} className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{loading ? (isEnglish ? 'Converting' : '正在转换') : (isEnglish ? 'Convert local HTML' : '转换本地HTML')}</button></form></>}
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'Online mode uses Google Docs HTML export and requires a document shared publicly. HTML export mode stays in this browser.' : '在线模式使用Google DocsHTML导出，并要求文档已经公开分享。HTML导出模式只在当前浏览器中处理。'}</p>
      </section>
      {result && !result.success && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200">{result.message || (isEnglish ? 'The Google Docs document could not be converted.' : 'Google Docs文档无法转换。')}</div>}
      {result?.success && markdown && <section aria-labelledby="google-docs-result-title" className="space-y-4"><h2 id="google-docs-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Markdown result' : 'Markdown结果'}</h2><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Title' : '标题'}</p><p className="mt-1 truncate text-sm font-bold text-white">{result.title}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Characters' : '字符数'}</p><p className="mt-1 text-2xl font-bold text-white">{result.character_count || markdown.length}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Source' : '来源'}</p><p className="mt-1 truncate text-sm font-bold text-white">{result.source_url?.startsWith('http') ? 'Google Docs URL' : result.source_url}</p></div></div><div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">google-docs.md</span><div className="flex gap-2"><button type="button" onClick={() => void copyMarkdown()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}</button><button type="button" onClick={() => downloadMarkdown(markdown, 'google-docs.md')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{isEnglish ? 'Download .md' : '下载.md'}</button></div></div><pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-emerald-100">{markdown}</pre></div></section>}
      <section aria-labelledby="google-docs-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3"><div className="md:col-span-3"><h2 id="google-docs-details-title" className="text-xl font-bold text-white">{isEnglish ? 'Google Docs conversion paths' : 'Google Docs转换路径'}</h2></div>{[[isEnglish ? 'Public document URL' : '公开文档URL', isEnglish ? 'Use a docs.google.com document URL shared with anyone who has the link.' : '使用设置为任何人可查看的docs.google.com文档地址。'], [isEnglish ? 'HTML export' : 'HTML导出', isEnglish ? 'Download the document as HTML from Google Docs, then upload the file or paste its HTML here.' : '在Google Docs中下载为HTML，再上传文件或把HTML粘贴到这里。'], [isEnglish ? 'Local privacy' : '本地隐私', isEnglish ? 'HTML exports stay in your browser and are not sent to Herdown.' : 'HTML导出文件留在当前浏览器中，不会发送到Herdown。']].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}</section>
      <section aria-labelledby="google-docs-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8"><h2 id="google-docs-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'Google Docs to Markdown FAQ' : 'Google Docs转Markdown常见问题'}</h2><div className="grid gap-3 md:grid-cols-2">{[[isEnglish ? 'Why did the public URL fail?' : '为什么公开URL失败？', isEnglish ? 'The document may be private or restricted. Share it publicly or use the HTML export mode.' : '文档可能是私密或受限状态。请公开分享文档，或使用HTML导出模式。'], [isEnglish ? 'Are comments and suggestions included?' : '会包含评论和建议吗？', isEnglish ? 'The HTML export focuses on document body content. Comments and suggestions outside the body are not treated as Markdown content.' : 'HTML导出主要处理正文内容，正文外的评论和建议不会作为Markdown正文。']].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}</div></section>
    </article>
  );
}
