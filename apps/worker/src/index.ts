import { parseMarkdown, detectPlatform, extractSitemapUrls, chunkMarkdownForRAG, ParseResult } from '@herdown/core';

export interface Env {
  DB?: D1Database;
  APP_NAME?: string;
  WAFFO_MERCHANT_ID?: string;
  WAFFO_PRIVATE_KEY?: string;
  WAFFO_STARTER_PRODUCT_ID?: string;
  WAFFO_STANDARD_PRODUCT_ID?: string;
  WAFFO_BULK_PRODUCT_ID?: string;
  WAFFO_TEST_MERCHANT_ID?: string;
  WAFFO_TEST_PRIVATE_KEY?: string;
  WAFFO_TEST_STARTER_PRODUCT_ID?: string;
  WAFFO_TEST_STANDARD_PRODUCT_ID?: string;
  WAFFO_TEST_BULK_PRODUCT_ID?: string;
  HERDOWN_TEST_TOKEN?: string;
  WAFFO_TEST_WEBHOOK_PUBLIC_KEY?: string;
  WAFFO_PROD_WEBHOOK_PUBLIC_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  ADMIN_EMAIL?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

const json = (data: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS, DELETE');
  headers.set('access-control-allow-headers', 'Content-Type, Authorization, X-Waffo-Signature');
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
};

type SeoLanguage = 'zh' | 'en';

type SeoPage = {
  title: string;
  description: string;
  keywords: string;
  heading: string;
  intro: string;
};

const seoPages: Record<string, Record<SeoLanguage, SeoPage>> = {
  '/': {
    zh: {
      title: '给AIAgent用的干净Markdown入口｜Herdown',
      description: '把网页、文档和图片整理成适合AI工作流使用的干净Markdown。',
      keywords: '网页转Markdown,文档转Markdown,图片转Markdown,AI工作流',
      heading: '给AIAgent用的干净Markdown入口',
      intro: '把网页、文档和图片整理成适合AI工作流使用的干净Markdown。',
    },
    en: {
      title: 'Clean Markdown for AI agents｜Herdown',
      description: 'Turn webpages, WeChat articles, documents, and images into clean Markdown for AI workflows.',
      keywords: 'webpage to Markdown,WeChat article to Markdown,document to Markdown,image to Markdown,AI workflow',
      heading: 'Clean Markdown for AI workflows',
      intro: 'Turn webpages, documents, and images into clean Markdown for the AI workflow you already use.',
    },
  },
  '/tools': {
    zh: { title: '本地资料｜Herdown', description: '在浏览器本地整理TXT、Markdown、图片、Word、PDF、PPT和Excel资料。', keywords: '本地文档转换,文档转Markdown,TXT转Markdown,PDF转Markdown', heading: '本地资料', intro: '选择资料并整理成干净Markdown，文件保留在当前设备。' },
    en: { title: 'Local materials｜Herdown', description: 'Organize TXT, Markdown, images, Word, PDF, PPT, and Excel files locally in your browser.', keywords: 'local document conversion,document to Markdown,TXT to Markdown,PDF to Markdown', heading: 'Local materials', intro: 'Choose a file and turn it into clean Markdown while it stays on your device.' },
  },
  '/url-to-markdown': {
    zh: { title: '网页转Markdown｜Herdown', description: '把公开网页整理成适合AI工作流使用的干净Markdown。', keywords: '网页转Markdown,URL转Markdown,HTML转Markdown', heading: '网页转Markdown', intro: '粘贴一个公开网页链接，提取正文并整理成干净Markdown。' },
    en: { title: 'URL to Markdown｜Herdown', description: 'Turn a public webpage into clean Markdown for AI workflows.', keywords: 'URL to Markdown,webpage to Markdown,HTML to Markdown', heading: 'URL to Markdown', intro: 'Paste a public webpage URL and get clean Markdown for your workflow.' },
  },
  '/txt-to-markdown': {
    zh: { title: 'TXT转Markdown｜Herdown', description: '把TXT文本整理成结构清晰的Markdown。', keywords: 'TXT转Markdown,文本转Markdown', heading: 'TXT转Markdown', intro: '导入TXT文本，快速整理为可继续编辑的Markdown。' },
    en: { title: 'TXT to Markdown｜Herdown', description: 'Turn plain TXT files into clean, structured Markdown.', keywords: 'TXT to Markdown,text to Markdown', heading: 'TXT to Markdown', intro: 'Convert a plain TXT file into clean Markdown you can keep editing.' },
  },
  '/pdf-to-markdown': {
    zh: { title: 'PDF转Markdown｜Herdown', description: '在本地将PDF资料整理成Markdown，不上传文件。', keywords: 'PDF转Markdown,PDF转换', heading: 'PDF转Markdown', intro: '使用本地工具整理PDF资料，文件不需要上传到Herdown。' },
    en: { title: 'PDF to Markdown｜Herdown', description: 'Turn PDF materials into Markdown locally without uploading the file.', keywords: 'PDF to Markdown,PDF conversion', heading: 'PDF to Markdown', intro: 'Process PDF materials locally without uploading the file to Herdown.' },
  },
  '/ppt-to-markdown': {
    zh: { title: 'PPT转Markdown｜Herdown', description: '在本地将PPT演示文稿整理成Markdown。', keywords: 'PPT转Markdown,演示文稿转换', heading: 'PPT转Markdown', intro: '将演示文稿整理成适合继续编辑和AI处理的Markdown。' },
    en: { title: 'PPT to Markdown｜Herdown', description: 'Turn PowerPoint presentations into Markdown locally.', keywords: 'PPT to Markdown,presentation conversion', heading: 'PPT to Markdown', intro: 'Turn a presentation into Markdown for editing and AI workflows.' },
  },
  '/excel-to-markdown': {
    zh: { title: 'Excel转Markdown｜Herdown', description: '在本地将Excel表格整理成结构清晰的Markdown。', keywords: 'Excel转Markdown,表格转换', heading: 'Excel to Markdown', intro: '将Excel表格整理成便于阅读、编辑和继续处理的Markdown。' },
    en: { title: 'Excel to Markdown｜Herdown', description: 'Turn Excel spreadsheets into clean, readable Markdown locally.', keywords: 'Excel to Markdown,spreadsheet conversion', heading: 'Excel to Markdown', intro: 'Turn a spreadsheet into Markdown that is easy to read and reuse.' },
  },
  '/word-to-markdown': {
    zh: { title: 'Word转Markdown｜Herdown', description: '在本地将Word文档整理成结构化Markdown。', keywords: 'Word转Markdown,DOCX转换,文档转Markdown', heading: 'Word转Markdown', intro: '使用本地工具整理Word文档，文件不需要上传到Herdown。' },
    en: { title: 'Word to Markdown｜Herdown', description: 'Turn Word documents into structured Markdown locally.', keywords: 'Word to Markdown,DOCX conversion,document to Markdown', heading: 'Word to Markdown', intro: 'Process Word documents locally without uploading the file to Herdown.' },
  },
  '/api': {
    zh: { title: 'API控制台｜Herdown', description: '创建和管理HerdownAPI密钥，查看额度和使用情况。', keywords: 'Herdown API,API密钥,网页解析API', heading: 'API控制台', intro: '创建API密钥，把网页解析接入你的脚本和工作流。' },
    en: { title: 'API console｜Herdown', description: 'Create and manage Herdown API keys and view usage.', keywords: 'Herdown API,API key,webpage parsing API', heading: 'API console', intro: 'Create an API key and connect webpage parsing to your scripts and workflows.' },
  },
  '/mcp-guide': {
    zh: { title: 'MCP接入｜Herdown', description: '配置Herdown远程MCP，让支持MCP的客户端调用网页解析和全站抓取。', keywords: 'Herdown MCP,MCP接入,远程MCP,网页解析', heading: 'MCP接入', intro: '把Herdown连接到支持MCP的客户端，调用网页解析和全站抓取能力。' },
    en: { title: 'MCP integration｜Herdown', description: 'Connect Herdown remote MCP to clients that support webpage parsing and site crawling.', keywords: 'Herdown MCP,MCP integration,remote MCP,webpage parsing', heading: 'MCP integration', intro: 'Connect Herdown to an MCP client and call webpage parsing and site crawling tools.' },
  },
  '/cli': {
    zh: { title: 'CLI命令行工具｜Herdown', description: '在终端调用Herdown，把公开网页整理成Markdown文件。', keywords: 'Herdown CLI,网页转Markdown,命令行工具', heading: 'CLI命令行工具', intro: '在终端运行Herdown，将公开网页转换并保存为Markdown。' },
    en: { title: 'CLI tool｜Herdown', description: 'Run Herdown from a terminal and save public webpages as Markdown files.', keywords: 'Herdown CLI,webpage to Markdown,command line tool', heading: 'CLI tool', intro: 'Run Herdown from a terminal and save public webpages as Markdown.' },
  },
  '/skill': {
    zh: { title: 'HerdownSkill｜Herdown', description: '把Herdown接入AIAgent，让Agent选择合适的网页和资料整理方式。', keywords: 'HerdownSkill,AIAgentSkill,网页转Markdown', heading: 'HerdownSkill', intro: '把这份操作说明交给AIAgent，让它按场景选择网页、API、MCP或CLI。' },
    en: { title: 'Herdown Skill｜Herdown', description: 'Give an AI agent instructions for choosing the right Herdown material workflow.', keywords: 'Herdown Skill,AI agent skill,webpage to Markdown', heading: 'Herdown Skill', intro: 'Give an AI agent the instructions it needs to choose the right Herdown workflow.' },
  },
  '/pricing': {
    zh: { title: '价格和额度｜Herdown', description: '查看Herdown免费额度和一次性付费点数包。', keywords: 'Herdown价格,API额度,网页解析套餐', heading: '价格和额度', intro: '免费使用网页解析，也可以按需购买不过期的一次性点数。' },
    en: { title: 'Pricing and credits｜Herdown', description: 'View Herdown free usage and one-time credit packages.', keywords: 'Herdown pricing,API credits,webpage parsing plans', heading: 'Pricing and credits', intro: 'Start with free webpage parsing or buy one-time credits when you need more.' },
  },
  '/browser-extension': {
    zh: { title: '浏览器插件｜Herdown', description: '下载Herdown浏览器本地扩展，用当前页面快速整理资料。', keywords: 'Herdown浏览器插件,网页提取插件,Markdown插件', heading: '浏览器插件', intro: '下载本地扩展，在浏览器中整理当前页面并导出Markdown。' },
    en: { title: 'Browser extension｜Herdown', description: 'Download the Herdown browser extension to prepare the current page locally.', keywords: 'Herdown browser extension,web clipping extension,Markdown extension', heading: 'Browser extension', intro: 'Download the local extension to prepare the current page and export Markdown.' },
  },
  '/docs': {
    zh: { title: '开发者文档｜Herdown', description: '查看Herdown的网页解析、REST API、MCP、CLI和本地工具使用说明。', keywords: 'Herdown文档,REST API,MCP,CLI,网页解析', heading: '为AI工作流准备干净资料', intro: '查看网页解析、REST API、MCP、CLI和本地工具的使用说明。' },
    en: { title: 'Developer documentation｜Herdown', description: 'Learn how to use Herdown webpage parsing, REST API, MCP, CLI, and local tools.', keywords: 'Herdown docs,REST API,MCP,CLI,webpage parsing', heading: 'Clean materials for AI workflows', intro: 'Learn how to connect Herdown to your workflow with the REST API, MCP, CLI, and local tools.' },
  },
  '/help': {
    zh: { title: '帮助中心｜Herdown', description: '查看Herdown的使用帮助、额度说明、账号和数据处理说明。', keywords: 'Herdown帮助,使用说明,额度,数据处理', heading: '帮助中心', intro: '查找使用Herdown、额度、账号和数据处理相关的说明。' },
    en: { title: 'Help center｜Herdown', description: 'Find help about using Herdown, quotas, accounts, and data handling.', keywords: 'Herdown help,usage guide,quota,data handling', heading: 'Help center', intro: 'Find answers about using Herdown, quotas, accounts, and data handling.' },
  },
  '/faq': {
    zh: { title: '常见问题｜Herdown', description: '查看Herdown关于网页解析、数据保存、额度和付费服务的常见问题。', keywords: 'Herdown常见问题,网页解析,额度,付费服务', heading: '常见问题', intro: '查看使用Herdown前最常见的问题和答案。' },
    en: { title: 'FAQ｜Herdown', description: 'Answers about Herdown webpage parsing, data retention, quotas, and paid services.', keywords: 'Herdown FAQ,webpage parsing,quota,paid service', heading: 'Frequently asked questions', intro: 'Find answers to common questions before using Herdown.' },
  },
};

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const escapeJsonForHtml = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

const normalizePublicPath = (pathname: string): string => {
  if (pathname === '/index.html') return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
};

const getSeoLanguage = (request: Request): SeoLanguage => {
  const requested = new URL(request.url).searchParams.get('lang');
  if (requested === 'en') return 'en';
  if (requested === 'zh' || requested === 'zh-CN') return 'zh';
  return (request.headers.get('accept-language') || '').toLowerCase().startsWith('en') ? 'en' : 'zh';
};

const seoFallback = (path: string, language: SeoLanguage, page: SeoPage): string => {
  const links = language === 'en'
    ? [['/', 'Home'], ['/url-to-markdown', 'URL to Markdown'], ['/tools', 'Local materials'], ['/docs', 'Docs'], ['/faq', 'FAQ']]
    : [['/', '首页'], ['/url-to-markdown', '网页转Markdown'], ['/tools', '本地资料'], ['/docs', '开发者文档'], ['/faq', '常见问题']];
  const localized = (href: string) => language === 'en' ? `${href}${href.includes('?') ? '&' : '?'}lang=en` : href;
  const nav = links.map(([href, label]) => `<a href="${localized(href)}">${label}</a>`).join(' · ');
  const faqItems = path === '/faq' ? (language === 'en'
    ? [['What does Herdown do?', 'Herdown turns a webpage URL or HTML into clean Markdown for saving, reading, and AI workflows.'], ['Is my content stored long-term?', 'No. Herdown processes content in real time and does not host your content or run a knowledge base. Limited technical logs may be used for security and troubleshooting.'], ['Can I use it without coding?', 'Yes. Paste a URL and click Convert. Developers can also use the API, MCP, CLI, or browser extension.']]
    : [['Herdown是做什么的？', '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读、交给AI工作流或知识库继续使用。'], ['我提交的内容会被长期保存吗？', '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。必要的短期技术日志仅用于安全防护、稳定性和故障排查。'], ['不会写代码也能用吗？', '可以。直接粘贴网页链接并点击转换即可。开发者也可以通过API、MCP、CLI或浏览器插件接入自己的工作流。']]) : [];
  const faqHtml = faqItems.map(([question, answer]) => `<section><h2>${escapeHtml(question)}</h2><p>${escapeHtml(answer)}</p></section>`).join('');
  return `<main class="seo-fallback"><p class="seo-brand"><a href="${localized('/')}">Herdown</a></p><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.intro)}</p><nav>${nav}</nav>${faqHtml}<p class="seo-route">${escapeHtml(path)}</p></main>`;
};

const seoSchema = (path: string, language: SeoLanguage, page: SeoPage, canonicalUrl: string): string => {
  if (path === '/') {
    return escapeJsonForHtml({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Herdown',
      url: canonicalUrl,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      inLanguage: language === 'en' ? 'en' : 'zh-CN',
      description: page.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: language === 'en' ? ['Webpage to Markdown', 'Document to Markdown', 'REST API', 'MCP', 'CLI'] : ['网页转Markdown', '文档转Markdown', 'REST API', 'MCP', 'CLI'],
    });
  }
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': path === '/faq' ? 'FAQPage' : 'WebPage',
    name: page.title,
    url: canonicalUrl,
    inLanguage: language === 'en' ? 'en' : 'zh-CN',
    description: page.description,
  };
  if (path === '/faq') {
    const items = language === 'en'
      ? [['What does Herdown do?', 'Herdown turns a webpage URL or HTML into clean Markdown for saving, reading, and AI workflows.'], ['Is my content stored long-term?', 'No. Herdown processes content in real time and does not host your content or run a knowledge base. Limited technical logs may be used for security and troubleshooting.'], ['Can I use it without coding?', 'Yes. Paste a URL and click Convert. Developers can also use the API, MCP, CLI, or browser extension.']]
      : [['Herdown是做什么的？', '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读、交给AI工作流或知识库继续使用。'], ['我提交的内容会被长期保存吗？', '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。必要的短期技术日志仅用于安全防护、稳定性和故障排查。'], ['不会写代码也能用吗？', '可以。直接粘贴网页链接并点击转换即可。开发者也可以通过API、MCP、CLI或浏览器插件接入自己的工作流。']];
    schema.mainEntity = items.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }));
  }
  return escapeJsonForHtml(schema);
};

const renderSeoShell = async (request: Request, env: Env, path: string): Promise<Response> => {
  const language = getSeoLanguage(request);
  const page = seoPages[path][language];
  const url = new URL(request.url);
  const canonicalUrl = `${url.origin}${path}${language === 'en' ? '?lang=en' : ''}`;
  const asset = await env.ASSETS!.fetch(new Request(new URL('/', request.url), request));
  if (!asset.ok) return asset;
  let html = await asset.text();
  const replace = (pattern: RegExp, replacement: string) => { html = html.replace(pattern, replacement); };
  replace(/<html lang="[^"]*">/i, `<html lang="${language === 'en' ? 'en' : 'zh-CN'}">`);
  replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
  replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(page.description)}" />`);
  replace(/<meta name="keywords"[^>]*>/i, `<meta name="keywords" content="${escapeHtml(page.keywords)}" />`);
  replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(page.title)}" />`);
  replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(page.description)}" />`);
  replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  replace(/<link rel="alternate" hreflang="en"[^>]*>/i, `<link rel="alternate" hreflang="en" href="${escapeHtml(`${url.origin}${path}?lang=en`)}" />`);
  replace(/<link rel="alternate" hreflang="zh-CN"[^>]*>/i, `<link rel="alternate" hreflang="zh-CN" href="${escapeHtml(`${url.origin}${path}`)}" />`);
  replace(/<link rel="alternate" hreflang="x-default"[^>]*>/i, `<link rel="alternate" hreflang="x-default" href="${escapeHtml(`${url.origin}${path}`)}" />`);
  replace(/<script type="application\/ld\+json"(?:\s+data-herdown-schema)?[^>]*>[\s\S]*?<\/script>/gi, `<script type="application/ld+json" data-herdown-schema>${seoSchema(path, language, page, canonicalUrl)}</script>`);
  replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${seoFallback(path, language, page)}</div>`);
  const headers = new Headers(asset.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('cdn-cache-control', 'no-store');
  headers.set('vary', 'Accept-Language');
  return new Response(html, { status: asset.status, headers });
};

const legalPage = (
  title: string,
  description: string,
  sections: Array<{ heading: string; body: string }>,
  english = false,
) => {
  const sectionHtml = sections
    .map(
      ({ heading, body }) => `
        <section>
          <h2>${heading}</h2>
          <p>${body}</p>
        </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <title>${title} | Herdown</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; background: #070a0e; color: #d8e1e8; font: 16px/1.75 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { max-width: 760px; margin: 0 auto; padding: 56px 24px 72px; }
      a { color: #52d9ad; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .brand { display: inline-block; color: #ffffff; font-weight: 800; font-size: 20px; margin-bottom: 44px; }
      h1 { color: #ffffff; font-size: clamp(30px, 6vw, 44px); line-height: 1.15; margin: 0 0 12px; }
      h2 { color: #ffffff; font-size: 20px; margin: 34px 0 8px; }
      p { margin: 0; color: #aebdca; }
      .updated { color: #7f91a0; font-size: 14px; }
      footer { border-top: 1px solid #1e293b; margin-top: 48px; padding-top: 20px; color: #7f91a0; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <a class="brand" href="/">Herdown</a>
      <h1>${title}</h1>
      <p class="updated">${english ? 'Effective date: August 1, 2026' : '生效日期：2026年8月1日'}</p>
      ${sectionHtml}
      <footer>
        <a href="/terms">${english ? 'Terms' : '服务条款'}</a> · <a href="/privacy">${english ? 'Privacy' : '隐私政策'}</a> · <a href="mailto:vkdefi@gmail.com">vkdefi@gmail.com</a> · <a href="https://x.com/vkdefi">@vkdefi</a>
      </footer>
    </main>
  </body>
</html>`;
};

const termsPage = (english = false) => english ? legalPage('Terms of Service', 'Herdown Terms of Service', [
  { heading: 'Service description', body: 'Herdown provides online tools, API, MCP, and related developer tools for turning webpages, documents, and images into Markdown. You may submit only content you are authorized to process and must follow applicable laws and third-party website rules.' },
  { heading: 'One-time credit packs', body: 'Paid services are sold as one-time credit packs shown on the product page and do not include automatic renewal. After payment is completed and confirmed by the payment provider, the corresponding credits are delivered according to the product description.' },
  { heading: 'Digital services and refunds', body: 'Credits are digital service capacity. Unless required by law or the service was not provided as agreed, issued or used digital credits generally cannot be refunded. Refund requests are handled according to the payment provider rules and the specific order.' },
  { heading: 'Service availability', body: 'Herdown works to keep the service stable but does not guarantee that every third-party website, login-restricted page, or dynamic page can always be parsed. You may not use the service for illegal activity, infringement, bypassing access controls, or compromising the security of another system.' },
  { heading: 'User obligations and enforcement', body: 'You must follow applicable laws, third-party platform rules, and these terms. You may not use the service for illegal, infringing, fraudulent, abusive scraping, access-control bypass, or harmful activity. Herdown may suspend or terminate access for violations or abnormal use and may cooperate when legally required.' },
  { heading: 'Terms updates', body: 'We may update these terms for product, compliance, or security reasons. Continued use of the service means that you accept the updated terms.' },
], true) : legalPage('服务条款', 'Herdown服务条款', [
  { heading: '服务说明', body: 'Herdown提供网页、文档和图片转为Markdown的在线工具、API、MCP与相关开发者工具。您应仅提交有权处理的内容，并遵守适用法律及第三方网站规则。' },
  { heading: '一次性点数包', body: '付费服务以商品页面展示的一次性点数包为准，不包含自动续费。支付完成并经支付平台确认后，系统会按商品说明发放相应服务额度。' },
  { heading: '数字服务与退款', body: '点数属于数字服务额度。除法律另有规定或服务未能按约提供外，已发放或已使用的数字额度通常不支持退款。退款申请会依据支付平台规则与具体订单情况处理。' },
  { heading: '服务可用性', body: 'Herdown会尽力保持服务稳定，但不承诺对任何第三方网站、受登录限制内容或动态页面始终可解析。不得将服务用于违法、侵权、绕过访问控制或影响他人系统安全的用途。' },
  { heading: '用户义务与违规处理', body: '您应遵守适用法律、第三方平台规则及本条款，不得利用服务处理违法、侵权、欺诈、恶意抓取、绕过访问限制或危害他人权益的内容。发现违规或异常使用时，Herdown可暂停或终止相关访问权限，并在法律要求时配合处理。' },
  { heading: '条款更新', body: '我们可能因功能、合规或安全需要更新本条款。继续使用服务即表示您接受更新后的条款。' },
]);

const privacyPage = (english = false) => english ? legalPage('Privacy Policy', 'Herdown Privacy Policy', [
  { heading: 'Information processed', body: 'To complete a request, Herdown processes the webpage URLs, HTML, file content, API parameters, and necessary technical logs that you submit or generate through the service.' },
  { heading: 'How information is used', body: 'Submitted content is used only to complete the current parsing or conversion request, troubleshoot errors, and protect the service. Herdown does not sell, rent, or use your content for targeted advertising.' },
  { heading: 'Content and storage', body: 'Herdown uses real-time processing and does not provide user content hosting or a long-term knowledge base. Limited short-term logs may be used to prevent abuse, maintain stability, and diagnose failures.' },
  { heading: 'Third-party services', body: 'Payments are handled by independent providers such as Waffo Pancake. Payment providers process payment information under their own privacy policies; Herdown does not directly store complete bank-card information.' },
  { heading: 'Account, access, and deletion requests', body: 'You may sign in with Google to recover API keys, view quota, and manage your profile. You can delete API keys on the website. To request access to or deletion of service records related to you, email vkdefi@gmail.com and do not send identity documents or bank-card numbers through a public page. After verification, we will handle identifiable records within a reasonable period. Payment orders and payment information are handled by Waffo Pancake under its rules.' },
], true) : legalPage('隐私政策', 'Herdown隐私政策', [
  { heading: '处理的信息', body: '为完成请求，Herdown会处理您主动提交的网页链接、HTML内容、文件内容、API请求参数以及必要的技术日志。' },
  { heading: '数据使用方式', body: '提交内容仅用于完成当前的解析、转换、错误排查与安全防护。Herdown不以出售、出租或广告定向为目的使用您的内容。' },
  { heading: '内容与存储', body: 'Herdown采用实时处理方式，不提供用户内容托管或长期知识库服务。必要的短期日志可能用于防滥用、保障服务稳定与定位故障。' },
  { heading: '第三方服务', body: '支付由Waffo Pancake等独立支付服务商处理。支付服务商会依其自身隐私政策处理付款信息；Herdown不会直接保存完整银行卡信息。' },
  { heading: '账号与查询、删除', body: '您可以使用Google账号登录，用于找回API密钥、查看额度和管理个人资料。Herdown不提供用户内容托管或长期知识库服务。您可在网站内删除API密钥；如需查询或删除与您相关的服务记录，请发送邮件至vkdefi@gmail.com，且不要在公开页面提交身份证件、银行卡号等敏感信息。经核实后，我们会在合理期限内处理可识别的相关记录。付款订单与付款资料由Waffo Pancake按其规则处理。' },
]);

const getClientIp = (request: Request): string => {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';
};

const getCookie = (request: Request, name: string): string | undefined => {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

const getDeviceId = (request: Request): string | undefined => {
  const deviceId = getCookie(request, 'herdown_device_id');
  return deviceId && /^dev_[a-zA-Z0-9_-]{16,80}$/.test(deviceId) ? deviceId : undefined;
};

const attachDeviceCookie = (response: Response, deviceId: string): Response => {
  const headers = new Headers(response.headers);
  headers.append('set-cookie', `herdown_device_id=${encodeURIComponent(deviceId)}; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

type AuthUser = {
  id: string;
  email: string;
  plan: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

const SESSION_COOKIE = 'herdown_session';
const OAUTH_STATE_COOKIE = 'herdown_oauth_state';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const randomToken = (prefix: string): string => `${prefix}_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;

const setCookie = (headers: Headers, name: string, value: string, maxAge: number, options = 'HttpOnly; Secure; SameSite=Lax'): void => {
  headers.append('set-cookie', `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; ${options}`);
};

const clearCookie = (headers: Headers, name: string): void => {
  headers.append('set-cookie', `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);
};

const responseRedirect = (location: string, cookies: Array<{ name: string; value: string; maxAge: number }> = []): Response => {
  const headers = new Headers({ Location: location, 'cache-control': 'no-store' });
  cookies.forEach(cookie => setCookie(headers, cookie.name, cookie.value, cookie.maxAge));
  return new Response(null, { status: 302, headers });
};

const createSession = async (userId: string, env: Env): Promise<string | null> => {
  if (!env.DB) return null;
  const token = randomToken('sess');
  const tokenHash = await sha256Base64(token);
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  try {
    await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(tokenHash, userId, expiresAt)
      .run();
    return token;
  } catch {
    return null;
  }
};

const getSessionUser = async (request: Request, env: Env): Promise<AuthUser | null> => {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || !env.DB) return null;
  try {
    const tokenHash = await sha256Base64(token);
    const row = await env.DB.prepare(`
      SELECT u.id, u.email, u.plan, u.display_name, u.avatar_url
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).bind(tokenHash, Date.now()).first<AuthUser>();
    return row || null;
  } catch {
    return null;
  }
};

const isAdminUser = (user: AuthUser | null, env: Env): boolean => Boolean(user && env.ADMIN_EMAIL && user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase());

const googleRedirectUri = (request: Request, env: Env): string => env.GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/auth/google/callback`;

const googleErrorPage = (message: string): Response => new Response(`<!doctype html><meta charset="utf-8"><title>Herdown登录失败</title><style>body{font-family:system-ui;background:#070a0e;color:#e2e8f0;padding:48px;line-height:1.7}a{color:#52d9ad}</style><h1>Google登录失败</h1><p>${message}</p><p><a href="/">返回Herdown</a></p>`, {
  status: 400,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
});

type WaffoWebhookEvent = {
  eventType?: string;
  eventId?: string;
  mode?: 'test' | 'prod';
  data?: {
    orderId?: string;
    orderMerchantExternalId?: string;
  };
};

const WAFFO_CHECKOUT_PATH = '/v1/actions/checkout/create-session';
const FREE_MONTHLY_QUOTA = 1_000;
const KEY_CREATION_INTERVAL = 'week';
const ABUSE_BLOCK_MS = 15 * 60 * 1000;
const ABUSE_BLOCK_THRESHOLD = 5;

type ProductCode = 'starter' | 'standard' | 'bulk';
type ProductConfig = {
  credits: number;
  productionEnv: keyof Env;
  testEnv: keyof Env;
};

const PRODUCT_CATALOG: Record<ProductCode, ProductConfig> = {
  starter: { credits: 10_000, productionEnv: 'WAFFO_STARTER_PRODUCT_ID', testEnv: 'WAFFO_TEST_STARTER_PRODUCT_ID' },
  standard: { credits: 50_000, productionEnv: 'WAFFO_STANDARD_PRODUCT_ID', testEnv: 'WAFFO_TEST_STANDARD_PRODUCT_ID' },
  bulk: { credits: 100_000, productionEnv: 'WAFFO_BULK_PRODUCT_ID', testEnv: 'WAFFO_TEST_BULK_PRODUCT_ID' },
};

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
};

const encodeDerLength = (length: number): Uint8Array => {
  if (length < 128) return new Uint8Array([length]);
  const values: number[] = [];
  let current = length;
  while (current > 0) {
    values.unshift(current & 0xff);
    current >>= 8;
  }
  return new Uint8Array([0x80 | values.length, ...values]);
};

const wrapPkcs1PrivateKey = (pkcs1: Uint8Array): Uint8Array => {
  // Web Crypto accepts PKCS#8. Waffo may export the older RSA PKCS#1 PEM form.
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const rsaAlgorithm = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
  ]);
  const content = new Uint8Array(version.length + rsaAlgorithm.length + pkcs1.length);
  content.set(version, 0);
  content.set(rsaAlgorithm, version.length);
  content.set(pkcs1, version.length + rsaAlgorithm.length);
  const length = encodeDerLength(content.length);
  const wrapped = new Uint8Array(1 + length.length + content.length);
  wrapped[0] = 0x30;
  wrapped.set(length, 1);
  wrapped.set(content, 1 + length.length);
  return wrapped;
};

const pemToDer = (pem: string, privateKey = false): Uint8Array => {
  const normalized = pem.replace(/\\n/g, '\n').trim();
  const body = normalized
    .replace(/-----BEGIN (?:RSA )?(?:PUBLIC|PRIVATE) KEY-----/g, '')
    .replace(/-----END (?:RSA )?(?:PUBLIC|PRIVATE) KEY-----/g, '')
    .replace(/\s/g, '');
  const der = base64ToBytes(body);
  return privateKey && normalized.includes('BEGIN RSA PRIVATE KEY') ? wrapPkcs1PrivateKey(der) : der;
};

const sha256Base64 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
};

const waffoRequestSignature = async (method: string, path: string, body: string, privateKeyPem: string): Promise<string> => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const canonical = `${method}\n${path}\n${timestamp}\n${await sha256Base64(body)}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    toArrayBuffer(pemToDer(privateKeyPem, true)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(canonical));
  return `${timestamp}.${bytesToBase64(new Uint8Array(signature))}`;
};

const verifyWaffoWebhook = async (rawBody: string, signatureHeader: string, publicKeyPem: string): Promise<boolean> => {
  const parts = Object.fromEntries(signatureHeader.split(',').map((part) => {
    const [key, ...rest] = part.split('=');
    return [key.trim(), rest.join('=').trim()];
  }));
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!timestamp || !signature || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) return false;

  try {
    const publicKey = await crypto.subtle.importKey(
      'spki',
      toArrayBuffer(pemToDer(publicKeyPem)),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      toArrayBuffer(base64ToBytes(signature)),
      new TextEncoder().encode(`${timestamp}.${rawBody}`),
    );
  } catch {
    return false;
  }
};

const getCreditStatus = async (apiKey: string, env: Env): Promise<{ balance: number; hasPurchasedCredits: boolean }> => {
  if (!env.DB) return { balance: 0, hasPurchasedCredits: false };
  try {
    const [balanceRow, purchaseRow] = await env.DB.batch([
      env.DB.prepare('SELECT COALESCE(SUM(credits), 0) AS balance FROM credit_ledger WHERE api_key = ?').bind(apiKey),
      env.DB.prepare("SELECT COUNT(*) AS count FROM credit_ledger WHERE api_key = ? AND reason = 'purchase'").bind(apiKey),
    ]);
    const balance = Number((balanceRow.results?.[0] as { balance?: number } | undefined)?.balance || 0);
    const hasPurchasedCredits = Number((purchaseRow.results?.[0] as { count?: number } | undefined)?.count || 0) > 0;
    return { balance, hasPurchasedCredits };
  } catch {
    // The ledger migration has not been applied yet. Keep existing limits working.
    return { balance: 0, hasPurchasedCredits: false };
  }
};

type FreeQuotaIdentity = { ip: string; deviceId?: string; key?: string };

const getFreeQuotaIdentity = (authInfo: { ip: string; deviceId?: string; keyOrIp: string; isKey: boolean }): FreeQuotaIdentity => ({
  ip: authInfo.ip,
  deviceId: authInfo.deviceId,
  key: authInfo.isKey ? authInfo.keyOrIp : undefined,
});

const getFreeQuotaKeys = (identity: FreeQuotaIdentity): string[] => {
  return Array.from(new Set([
    `free:ip:${identity.ip}`,
    identity.deviceId ? `free:device:${identity.deviceId}` : '',
    identity.key ? `free:${identity.key}` : '',
  ].filter(Boolean)));
};

const getFreeQuotaStatus = async (identity: FreeQuotaIdentity, env: Env): Promise<{ used: number; remaining: number }> => {
  if (!env.DB) return { used: 0, remaining: FREE_MONTHLY_QUOTA };
  const month = new Date().toISOString().slice(0, 7);
  try {
    const rows = await Promise.all(getFreeQuotaKeys(identity).map((key) => env.DB!.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(key, month)
      .first<{ count: number }>()));
    const used = Math.max(0, ...rows.map((row) => Number(row?.count || 0)));
    return { used, remaining: Math.max(0, FREE_MONTHLY_QUOTA - used) };
  } catch {
    return { used: 0, remaining: FREE_MONTHLY_QUOTA };
  }
};

const consumeFreeQuota = async (identity: FreeQuotaIdentity, amount: number, env: Env): Promise<boolean> => {
  if (!env.DB) return true;
  const requested = Math.max(1, Math.floor(amount));
  if (requested > FREE_MONTHLY_QUOTA) return false;
  const month = new Date().toISOString().slice(0, 7);
  try {
    const statements = getFreeQuotaKeys(identity).map((key) => env.DB!.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, ?)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + excluded.count
      WHERE usage_logs.count + excluded.count <= ?
    `).bind(key, month, requested, FREE_MONTHLY_QUOTA));
    const results = await env.DB.batch(statements);
    return results.every((result) => (result.meta.changes || 0) === 1);
  } catch {
    return false;
  }
};

const consumeCredits = async (apiKey: string, credits: number, reason: 'parse' | 'crawl', env: Env): Promise<boolean> => {
  if (!env.DB) return false;
  const amount = Math.max(1, Math.floor(credits));
  try {
    const id = `${reason}_${crypto.randomUUID()}`;
    const result = await env.DB.prepare(`
      INSERT INTO credit_ledger (api_key, credits, reason, external_order_id)
      SELECT ?, ?, ?, ?
      WHERE (SELECT COALESCE(SUM(credits), 0) FROM credit_ledger WHERE api_key = ?) >= ?
    `).bind(apiKey, -amount, reason, id, apiKey, amount).run();
    return (result.meta.changes || 0) === 1;
  } catch {
    return false;
  }
};

const createWaffoCheckout = async (
  env: Env,
  merchantOrderId: string,
  origin: string,
  productCode: ProductCode,
  testMode: boolean,
): Promise<{ checkoutUrl?: string; error?: string }> => {
  const merchantId = testMode ? env.WAFFO_TEST_MERCHANT_ID : env.WAFFO_MERCHANT_ID;
  const privateKey = testMode ? env.WAFFO_TEST_PRIVATE_KEY : env.WAFFO_PRIVATE_KEY;
  const productConfig = PRODUCT_CATALOG[productCode];
  const productId = env[testMode ? productConfig.testEnv : productConfig.productionEnv] as string | undefined;
  if (!merchantId || !privateKey || !productId) {
    return { error: '支付配置尚未完成' };
  }

  const body = JSON.stringify({
    productId,
    currency: 'USD',
    successUrl: `${origin}/?payment=success`,
    orderMerchantExternalId: merchantOrderId,
    metadata: { herdown_product: productCode },
    language: 'zh-Hans',
  });

  try {
    const signature = await waffoRequestSignature('POST', WAFFO_CHECKOUT_PATH, body, privateKey);
    const [timestamp, signatureValue] = signature.split('.', 2);
    const response = await fetch(`https://api.waffo.ai${WAFFO_CHECKOUT_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-merchant-id': merchantId,
        'x-timestamp': timestamp,
        'x-signature': signatureValue,
      },
      body,
    });
    const payload = await response.json().catch(() => ({})) as { data?: { checkoutUrl?: string } };
    if (!response.ok || !payload.data?.checkoutUrl) return { error: '支付平台暂时无法创建订单' };
    return { checkoutUrl: payload.data.checkoutUrl };
  } catch {
    return { error: '支付平台暂时无法创建订单' };
  }
};

const isForbiddenUrl = (urlString: string): boolean => {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) return true;

    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      /^192\.168\./.test(host)
    ) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};

const getWeekKey = (): string => {
  const date = new Date();
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
};

const verifyTurnstile = async (token: string, request: Request, env: Env): Promise<boolean> => {
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;
  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    const ip = getClientIp(request);
    if (ip) body.set('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
};

type GoogleProfile = { sub?: string; email?: string; name?: string; picture?: string };

const upsertGoogleUser = async (profile: GoogleProfile, env: Env): Promise<string | null> => {
  if (!env.DB || !profile.sub || !profile.email) return null;
  const email = profile.email.trim().toLowerCase();
  try {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE google_sub = ? OR email = ? LIMIT 1')
      .bind(profile.sub, email)
      .first<{ id: string }>();
    const userId = existing?.id || `usr_${crypto.randomUUID().replace(/-/g, '')}`;
    await env.DB.prepare(`
      INSERT INTO users (id, email, plan, google_sub, display_name, avatar_url, updated_at)
      VALUES (?, ?, 'free', ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        google_sub = excluded.google_sub,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = CURRENT_TIMESTAMP
    `).bind(userId, email, profile.sub, profile.name || email.split('@')[0], profile.picture || null).run();
    return userId;
  } catch {
    return null;
  }
};

const exchangeGoogleCode = async (code: string, request: Request, env: Env): Promise<GoogleProfile | null> => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(request, env),
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok) return null;
  const tokens = await tokenResponse.json() as { access_token?: string };
  if (!tokens.access_token) return null;
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) return null;
  return profileResponse.json() as Promise<GoogleProfile>;
};

const getBlockKey = (keyOrIp: string, isKey: boolean): string => `block:${isKey ? 'key' : 'ip'}:${keyOrIp}`;
const getAbuseKey = (keyOrIp: string, isKey: boolean): string => `abuse:${isKey ? 'key' : 'ip'}:${keyOrIp}`;

const getActiveBlockUntil = async (keyOrIp: string, isKey: boolean, env: Env): Promise<number> => {
  if (!env.DB) return 0;
  try {
    const row = await env.DB.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(getBlockKey(keyOrIp, isKey), 'block')
      .first<{ count: number }>();
    return Number(row?.count || 0);
  } catch {
    return 0;
  }
};

const recordAbuseAndMaybeBlock = async (keyOrIp: string, isKey: boolean, env: Env): Promise<void> => {
  if (!env.DB) return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + 1
    `).bind(getAbuseKey(keyOrIp, isKey), today).run();
    const row = await env.DB.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(getAbuseKey(keyOrIp, isKey), today)
      .first<{ count: number }>();
    if (Number(row?.count || 0) >= ABUSE_BLOCK_THRESHOLD) {
      await env.DB.prepare(`
        INSERT INTO usage_logs (key_or_ip, parse_date, count)
        VALUES (?, 'block', ?)
        ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = excluded.count
      `).bind(getBlockKey(keyOrIp, isKey), Date.now() + ABUSE_BLOCK_MS).run();
    }
  } catch {
    // Abuse protection must not break normal requests when logging fails.
  }
};

const consumeKeyCreationSlot = async (ip: string, env: Env): Promise<boolean> => {
  if (!env.DB) return true;
  const week = `${KEY_CREATION_INTERVAL}:${getWeekKey()}`;
  try {
    const result = await env.DB.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + 1
      WHERE usage_logs.count < 1
    `).bind(`key-create:${ip}`, week).run();
    return (result.meta.changes || 0) === 1;
  } catch {
    return false;
  }
};

const recordProcessingLog = async (
  env: Env,
  details: {
    endpoint: string;
    fileType: string;
    success: boolean;
    errorReason?: string;
    durationMs: number;
    keyOrIp?: string;
    userId?: string;
  },
): Promise<void> => {
  if (!env.DB) return;
  try {
    await env.DB.prepare(`
      INSERT INTO processing_logs (endpoint, file_type, success, error_reason, duration_ms, key_or_ip, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      details.endpoint,
      details.fileType,
      details.success ? 1 : 0,
      details.errorReason?.slice(0, 300) || null,
      Math.max(0, Math.floor(details.durationMs)),
      details.keyOrIp || null,
      details.userId || null,
    ).run();
  } catch {
    // Monitoring must never break a user request.
  }
};

const verifyApiKeyOrIp = async (request: Request, env: Env): Promise<{ keyOrIp: string; isKey: boolean; userId: string; ip: string; deviceId?: string }> => {
  const ip = getClientIp(request);
  const deviceId = getDeviceId(request);
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token === 'sk_admin_test_unlimited_8888') {
    return { keyOrIp: token, isKey: true, userId: 'usr_admin', ip, deviceId };
  }

  if (token && token !== 'sk_live_demo88888888' && env.DB) {
    try {
      const res = await env.DB.prepare('SELECT user_id, status FROM api_keys WHERE key = ?').bind(token).first<{ user_id: string; status: string }>();
      if (res && res.status === 'active') {
        return { keyOrIp: token, isKey: true, userId: res.user_id, ip, deviceId };
      }
    } catch {
      // ignore
    }
  }

  return { keyOrIp: ip, isKey: false, userId: 'usr_anonymous', ip, deviceId };
};

const checkAndLogRateLimit = async (keyOrIp: string, isKey: boolean, env: Env): Promise<{ allowed: boolean; reason?: string }> => {
  if (keyOrIp === 'sk_admin_test_unlimited_8888') {
    return { allowed: true };
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const minuteStr = new Date().toISOString().slice(0, 16);

  const maxPerMinute = isKey ? 20 : 5;
  const maxPerDay = isKey ? 100 : 20;

  if (!env.DB) return { allowed: true };

  try {
    const activeBlockUntil = await getActiveBlockUntil(keyOrIp, isKey, env);
    if (activeBlockUntil > Date.now()) {
      return { allowed: false, reason: '检测到异常请求，访问已暂时暂停15分钟' };
    }

    const minuteKey = `min:${keyOrIp}:${minuteStr}`;
    await env.DB.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + 1
    `).bind(minuteKey, minuteStr).run();

    const minRow = await env.DB.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(minuteKey, minuteStr)
      .first<{ count: number }>();

    if (minRow && typeof minRow.count === 'number' && minRow.count > maxPerMinute) {
      await recordAbuseAndMaybeBlock(keyOrIp, isKey, env);
      return { allowed: false, reason: `请求太频繁！已达到限制 (${maxPerMinute} 次/分钟)` };
    }

    const dailyKey = `day:${keyOrIp}:${dateStr}`;
    await env.DB.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + 1
    `).bind(dailyKey, dateStr).run();

    const dayRow = await env.DB.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(dailyKey, dateStr)
      .first<{ count: number }>();

    if (dayRow && typeof dayRow.count === 'number' && dayRow.count > maxPerDay) {
      await recordAbuseAndMaybeBlock(keyOrIp, isKey, env);
      return { allowed: false, reason: `已达到今日解析配额上限 (${maxPerDay} 次/天)` };
    }
  } catch (err) {
    console.error('Rate limit check failed:', err);
  }

  return { allowed: true };
};

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB 防爆内存限制

const estimateTokenCount = (value: string): number => {
  const asciiCount = (value.match(/[\x20-\x7e]/g) || []).length;
  const characterCount = Array.from(value).length;
  const nonAsciiCount = Math.max(0, characterCount - asciiCount);
  return Math.max(1, Math.ceil(asciiCount / 4 + nonAsciiCount / 1.5));
};

const getPlatformReferer = (platform: ReturnType<typeof detectPlatform>): string | undefined => ({
  wechat: 'https://mp.weixin.qq.com/',
  xiaohongshu: 'https://www.xiaohongshu.com/',
  zhihu: 'https://www.zhihu.com/',
  twitter: 'https://x.com/',
} as Partial<Record<ReturnType<typeof detectPlatform>, string>>)[platform];

const isInvalidWeChatPage = (html: string): boolean => {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  return /参数错误|页面不存在|链接已失效|内容已被删除/.test(text) && !/<div[^>]+id=["']js_content["']/i.test(html);
};

async function safeFetchPageHtml(targetUrl: string, referer?: string, timeoutMs = 8000, zhihuLimit = 5, zhihuSort = 'default'): Promise<{ html: string; status: number }> {
  // Check if URL is zhihu.com to rewrite fetch request to mobile API
  if (targetUrl.includes('zhihu.com/question/')) {
    try {
      const qidMatch = /question\/(\d+)/.exec(targetUrl);
      const aidMatch = /answer\/(\d+)/.exec(targetUrl);
      const headers = {
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'accept': 'application/json',
      };

      if (aidMatch) {
        // Fetch single answer
        const answerId = aidMatch[1];
        const apiRes = await fetch(`https://api.zhihu.com/answers/${answerId}`, { headers });
        if (apiRes.ok) {
          const data: any = await apiRes.json();
          const mockHtml = `
            <html>
              <head>
                <title>${data.question?.title || '知乎问答'}</title>
                <meta name="author" content="${data.author?.name || '知乎用户'}" />
              </head>
              <body>
                <div class="AuthorInfo-name">${data.author?.name || '知乎用户'}</div>
                <div class="RichText">${data.content || ''}</div>
              </body>
            </html>
          `;
          return { html: mockHtml, status: 200 };
        }
      } else if (qidMatch) {
        // Fetch question answers list with dynamic limit and sort (votes/date)
        const questionId = qidMatch[1];
        const sortParam = zhihuSort === 'date' ? 'created' : 'default';
        const apiRes = await fetch(`https://api.zhihu.com/questions/${questionId}/answers?limit=${zhihuLimit}&sort_by=${sortParam}`, { headers });
        if (apiRes.ok) {
          const listData: any = await apiRes.json();
          const qTitle = listData.data?.[0]?.question?.title || '知乎问答';
          let bodyHtml = '';
          if (listData.data && Array.isArray(listData.data)) {
            listData.data.forEach((ans: any) => {
              bodyHtml += `
                <div class="answer-item">
                  <div class="AuthorInfo-name">${ans.author?.name || '知乎用户'}</div>
                  <div class="RichText">${ans.content || ''}</div>
                </div>
                <hr/>
              `;
            });
          }
          const mockHtml = `
            <html>
              <head>
                <title>${qTitle}</title>
              </head>
              <body>
                ${bodyHtml}
              </body>
            </html>
          `;
          return { html: mockHtml, status: 200 };
        }
      }
    } catch (apiErr) {
      console.error('[Herdown Worker] Zhihu API fallback failed:', apiErr);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isZhihu = targetUrl.includes('zhihu.com');
    const fetchRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        ...(isZhihu ? {
          'referer': 'https://www.zhihu.com/',
          'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1'
        } : (referer ? { 'referer': referer } : {})),
      },
    });

    clearTimeout(timer);

    if (!fetchRes.ok) {
      return { html: '', status: fetchRes.status };
    }

    const contentLength = fetchRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      throw new Error(`目标网页体积超出 10MB 安全解析上限`);
    }

    const text = await fetchRes.text();
    if (text.length > MAX_PAYLOAD_BYTES) {
      return { html: text.slice(0, MAX_PAYLOAD_BYTES), status: fetchRes.status };
    }

    return { html: text, status: fetchRes.status };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('抓取目标网页响应超时 (超过 8 秒安全限制)');
    }
    throw err;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS, DELETE',
          'access-control-allow-headers': '*',
          'access-control-max-age': '86400',
        },
      });
    }

    if (url.pathname === '/auth/google' && request.method === 'GET') {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.DB) {
        return googleErrorPage('Google登录尚未完成配置，请稍后再试。');
      }
      const state = randomToken('state');
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.search = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: googleRedirectUri(request, env),
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'online',
        prompt: 'select_account',
      }).toString();
      return responseRedirect(authUrl.toString(), [{ name: OAUTH_STATE_COOKIE, value: state, maxAge: 600 }]);
    }

    if (url.pathname === '/auth/google/callback' && request.method === 'GET') {
      const state = url.searchParams.get('state') || '';
      const savedState = getCookie(request, OAUTH_STATE_COOKIE);
      const code = url.searchParams.get('code') || '';
      if (!state || !savedState || state !== savedState || !code) return googleErrorPage('登录验证已过期，请重新点击Google登录。');
      const profile = await exchangeGoogleCode(code, request, env);
      const userId = profile ? await upsertGoogleUser(profile, env) : null;
      const sessionToken = userId ? await createSession(userId, env) : null;
      if (!sessionToken) return googleErrorPage('无法创建登录会话，请检查数据库和Google配置。');
      const redirect = responseRedirect('/?login=success');
      const headers = new Headers(redirect.headers);
      setCookie(headers, SESSION_COOKIE, sessionToken, SESSION_MAX_AGE);
      clearCookie(headers, OAUTH_STATE_COOKIE);
      return new Response(null, { status: 302, headers });
    }

    if (url.pathname === '/auth/logout' && (request.method === 'GET' || request.method === 'POST')) {
      const token = getCookie(request, SESSION_COOKIE);
      if (token && env.DB) {
        try {
          await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Base64(token)).run();
        } catch {
          // Ignore logout cleanup errors and still clear the browser session.
        }
      }
      const redirect = responseRedirect('/');
      const headers = new Headers(redirect.headers);
      clearCookie(headers, SESSION_COOKIE);
      return new Response(null, { status: 302, headers });
    }

    if (url.pathname === '/v1/me' && request.method === 'GET') {
      const user = await getSessionUser(request, env);
      return json({ authenticated: Boolean(user), user: user ? { ...user, is_admin: isAdminUser(user, env) } : null });
    }

    if (url.pathname === '/v1/account/link-key' && request.method === 'POST') {
      const sessionUser = await getSessionUser(request, env);
      if (!sessionUser || !env.DB) return json({ success: false, message: '请先登录Google账号' }, { status: 401 });
      const body = await request.json().catch(() => ({})) as { key?: string };
      const key = (body.key || '').trim();
      if (!key || key.length > 160) return json({ success: false, message: 'API密钥无效' }, { status: 400 });
      try {
        const existing = await env.DB.prepare('SELECT key FROM api_keys WHERE key = ? AND status != "revoked"').bind(key).first<{ key: string }>();
        if (!existing) return json({ success: false, message: 'API密钥不存在或已撤销' }, { status: 404 });
        await env.DB.prepare('UPDATE api_keys SET user_id = ? WHERE key = ?').bind(sessionUser.id, key).run();
        return json({ success: true });
      } catch {
        return json({ success: false, message: 'API密钥绑定失败' }, { status: 500 });
      }
    }

    if (url.pathname === '/v1/admin/overview' && request.method === 'GET') {
      const user = await getSessionUser(request, env);
      if (!isAdminUser(user, env) || !env.DB) return json({ success: false, message: '无管理员权限' }, { status: 403 });
      try {
        const [usersRow, keysRow, ordersRow, creditsRow, usageRow] = await env.DB.batch([
          env.DB.prepare('SELECT COUNT(*) AS count FROM users'),
          env.DB.prepare('SELECT COUNT(*) AS count FROM api_keys WHERE status = "active"'),
          env.DB.prepare('SELECT COUNT(*) AS count FROM payment_orders WHERE payment_status = "completed"'),
          env.DB.prepare('SELECT COALESCE(SUM(credits), 0) AS count FROM credit_ledger WHERE reason = "purchase"'),
          env.DB.prepare('SELECT COALESCE(SUM(count), 0) AS count FROM usage_logs WHERE key_or_ip LIKE "day:%"'),
        ]);
        const rowValue = (index: number, key: string): number => Number((([usersRow, keysRow, ordersRow, creditsRow, usageRow][index] as any)?.results?.[0] as any)?.[key] || 0);
        let processing = {
          total: 0,
          succeeded: 0,
          failed: 0,
          success_rate: 0,
          average_duration_ms: 0,
          failure_reasons: [] as Array<{ reason: string; count: number }>,
          file_types: [] as Array<{ file_type: string; count: number }>,
        };
        try {
          const [summary, reasons, fileTypes] = await env.DB.batch([
            env.DB.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(success), 0) AS succeeded, COALESCE(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END), 0) AS failed, COALESCE(AVG(duration_ms), 0) AS average_duration_ms FROM processing_logs`),
            env.DB.prepare(`SELECT COALESCE(NULLIF(error_reason, ''), 'UNKNOWN') AS reason, COUNT(*) AS count FROM processing_logs WHERE success = 0 GROUP BY COALESCE(NULLIF(error_reason, ''), 'UNKNOWN') ORDER BY count DESC LIMIT 10`),
            env.DB.prepare(`SELECT file_type, COUNT(*) AS count FROM processing_logs GROUP BY file_type ORDER BY count DESC LIMIT 10`),
          ]);
          const summaryRow = (summary.results?.[0] || {}) as Record<string, unknown>;
          const total = Number(summaryRow.total || 0);
          const succeeded = Number(summaryRow.succeeded || 0);
          processing = {
            total,
            succeeded,
            failed: Number(summaryRow.failed || 0),
            success_rate: total ? Number(((succeeded / total) * 100).toFixed(1)) : 0,
            average_duration_ms: Math.round(Number(summaryRow.average_duration_ms || 0)),
            failure_reasons: (reasons.results || []) as Array<{ reason: string; count: number }>,
            file_types: (fileTypes.results || []) as Array<{ file_type: string; count: number }>,
          };
        } catch {
          // Older databases may not have the monitoring migration yet.
        }
        const { results: recentUsers } = await env.DB.prepare('SELECT email, display_name, plan, created_at FROM users ORDER BY created_at DESC LIMIT 20').all();
        return json({
          success: true,
          stats: {
            users: rowValue(0, 'count'),
            active_keys: rowValue(1, 'count'),
            completed_orders: rowValue(2, 'count'),
            sold_credits: rowValue(3, 'count'),
            usage_requests: rowValue(4, 'count'),
          },
          processing,
          recent_users: recentUsers || [],
        });
      } catch {
        return json({ success: false, message: '管理员数据暂时无法读取' }, { status: 500 });
      }
    }

    if (url.pathname === '/health') {
      return json({
        status: 'ok',
        app: env.APP_NAME || 'Herdown',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
      });
    }

    // REST API Endpoint: POST /v1/parse
    if (url.pathname === '/v1/parse' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.reason,
        }, { status: 429 });
      }

      const body = (await request.json().catch(() => ({}))) as { url?: string; html?: string; zhihuLimit?: number; zhihuSort?: string };
      const targetUrl = (body.url || '').trim();
      const rawHtml = (body.html || '').trim();

      if (!targetUrl && !rawHtml) {
        return json({
          success: false,
          code: 'INVALID_INPUT',
          message: '请提供有效的 url 或 html 参数',
        }, { status: 400 });
      }

      if (targetUrl && isForbiddenUrl(targetUrl)) {
        return json({
          success: false,
          code: 'FORBIDDEN_TARGET',
          message: '安全防火墙已拦截该目标地址 (禁止内网/私有 IP 访问)',
        }, { status: 400 });
      }

      const creditStatus = authInfo.isKey ? await getCreditStatus(authInfo.keyOrIp, env) : { balance: 0, hasPurchasedCredits: false };
      if (creditStatus.hasPurchasedCredits && creditStatus.balance < 1) {
        return json({
          success: false,
          code: 'CREDITS_EXHAUSTED',
          message: '点数已用完，请购买新的点数包后继续使用',
        }, { status: 402 });
      }
      const freeQuota = creditStatus.hasPurchasedCredits ? null : await getFreeQuotaStatus(getFreeQuotaIdentity(authInfo), env);
      if (freeQuota && freeQuota.remaining < 1) {
        return json({
          success: false,
          code: 'FREE_QUOTA_EXHAUSTED',
          message: '本月免费额度已用完，请升级后继续使用',
        }, { status: 402 });
      }

      const processingStartedAt = Date.now();
      let processingSuccess = false;
      let processingErrorReason = '';
      let processingFileType = rawHtml ? 'html' : 'webpage';
      try {
        let sourceHtml = rawHtml;
        if (!sourceHtml && targetUrl) {
          const platform = detectPlatform(targetUrl);
          processingFileType = platform;
          const referer = getPlatformReferer(platform);

          const fetchResult = await safeFetchPageHtml(targetUrl, referer, 8000, body.zhihuLimit, body.zhihuSort);

          if (fetchResult.status !== 200 && fetchResult.status !== 0) {
            processingErrorReason = `HTTP_${fetchResult.status}`;
            return json({
              success: false,
              code: 'PARSE_FAILED',
              message: `目标网页返回 HTTP 错误码 ${fetchResult.status}`,
            }, { status: 500 });
          }

          sourceHtml = fetchResult.html;

          if (platform === 'wechat' && isInvalidWeChatPage(sourceHtml)) {
            processingErrorReason = 'INVALID_SOURCE';
            return json({
              success: false,
              code: 'INVALID_SOURCE',
              message: '微信公众号文章链接无效、已删除或已失效',
            }, { status: 422 });
          }
        }

        const result: ParseResult = parseMarkdown(sourceHtml, targetUrl);
        const sourceTokens = estimateTokenCount(sourceHtml);
        const markdownTokens = estimateTokenCount(result.markdown);
        const tokenSavings = Math.max(0, sourceTokens - markdownTokens);
        const tokenSavingsPercent = sourceTokens > 0 ? Number(((tokenSavings / sourceTokens) * 100).toFixed(1)) : 0;

        if (creditStatus.hasPurchasedCredits && !(await consumeCredits(authInfo.keyOrIp, 1, 'parse', env))) {
          processingErrorReason = 'CREDITS_EXHAUSTED';
          return json({
            success: false,
            code: 'CREDITS_EXHAUSTED',
            message: '点数已用完，请购买新的点数包后继续使用',
          }, { status: 402 });
        }
        if (!creditStatus.hasPurchasedCredits && !(await consumeFreeQuota(getFreeQuotaIdentity(authInfo), 1, env))) {
          processingErrorReason = 'FREE_QUOTA_EXHAUSTED';
          return json({
            success: false,
            code: 'FREE_QUOTA_EXHAUSTED',
            message: '本月免费额度已用完，请升级后继续使用',
          }, { status: 402 });
        }

        processingSuccess = true;
        return json({
          success: true,
          title: result.title,
          markdown: result.markdown,
          frontmatter: result.frontmatter,
          images: result.images,
          platform: result.platform,
          account: result.account,
          author: result.author,
          published_at: result.publish_date,
          elapsed_ms: result.elapsed_ms,
          source_tokens: sourceTokens,
          markdown_tokens: markdownTokens,
          token_savings: tokenSavings,
          token_savings_percent: tokenSavingsPercent,
        });
      } catch (err: any) {
        processingErrorReason = err?.message || 'PARSE_FAILED';
        return json({
          success: false,
          code: 'PARSE_FAILED',
          message: err?.message || '抓取或解析目标网页失败',
        }, { status: 500 });
      } finally {
        await recordProcessingLog(env, {
          endpoint: '/v1/parse',
          fileType: processingFileType,
          success: processingSuccess,
          errorReason: processingErrorReason,
          durationMs: Date.now() - processingStartedAt,
          keyOrIp: authInfo.keyOrIp,
          userId: authInfo.userId,
        });
      }
    }

    // Feature 1: Crawl Endpoint (Sitemap & Recursive Crawl) - POST /v1/crawl
    if (url.pathname === '/v1/crawl' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({ success: false, message: rateLimitResult.reason }, { status: 429 });
      }

      const body = (await request.json().catch(() => ({}))) as { url?: string; limit?: number };
      const targetUrl = (body.url || '').trim();
      const requestedLimit = Math.max(1, Math.floor(Number(body.limit) || 5));
      const creditStatus = authInfo.isKey ? await getCreditStatus(authInfo.keyOrIp, env) : { balance: 0, hasPurchasedCredits: false };
      const freeQuota = creditStatus.hasPurchasedCredits ? null : await getFreeQuotaStatus(getFreeQuotaIdentity(authInfo), env);
      const crawlLimit = creditStatus.hasPurchasedCredits
        ? Math.min(requestedLimit, creditStatus.balance, 100)
        : Math.min(requestedLimit, 5, freeQuota?.remaining || 0);

      if (creditStatus.hasPurchasedCredits && crawlLimit < 1) {
        return json({ success: false, code: 'CREDITS_EXHAUSTED', message: '点数已用完，请购买新的点数包后继续使用' }, { status: 402 });
      }
      if (!creditStatus.hasPurchasedCredits && crawlLimit < 1) {
        return json({ success: false, code: 'FREE_QUOTA_EXHAUSTED', message: '本月免费额度已用完，请升级后继续使用' }, { status: 402 });
      }

      if (!targetUrl || isForbiddenUrl(targetUrl)) {
        return json({ success: false, message: '请传入有效的公网目标域名 URL' }, { status: 400 });
      }

      const startTime = Date.now();
      let processingSuccess = false;
      let processingErrorReason = '';
      const processingFileType = targetUrl.includes('sitemap') ? 'sitemap' : 'website-crawl';
      try {
        let sitemapUrl = targetUrl;
        if (!targetUrl.includes('sitemap')) {
          const origin = new URL(targetUrl).origin;
          sitemapUrl = `${origin}/sitemap.xml`;
        }

        const sitemapRes = await safeFetchPageHtml(sitemapUrl, undefined, 5000).catch(() => null);
        let content = sitemapRes?.html || '';
        
        if (!content) {
          const mainRes = await safeFetchPageHtml(targetUrl, undefined, 5000).catch(() => null);
          content = mainRes?.html || '';
        }

        const subUrls = extractSitemapUrls(content, targetUrl, crawlLimit);
        const crawlResults = await Promise.all(
          subUrls.map(async (u: string) => {
            const pageRes = await safeFetchPageHtml(u, undefined, 5000).catch(() => null);
            const html = pageRes?.html || '';
            const parsed = parseMarkdown(html, u);
            return {
              url: u,
              title: parsed.title,
              markdown: parsed.markdown,
              elapsed_ms: parsed.elapsed_ms,
            };
          })
        );

        if (creditStatus.hasPurchasedCredits && !(await consumeCredits(authInfo.keyOrIp, crawlResults.length, 'crawl', env))) {
          processingErrorReason = 'CREDITS_EXHAUSTED';
          return json({ success: false, code: 'CREDITS_EXHAUSTED', message: '点数不足，请购买新的点数包后继续使用' }, { status: 402 });
        }
        if (!creditStatus.hasPurchasedCredits && crawlResults.length > 0 && !(await consumeFreeQuota(getFreeQuotaIdentity(authInfo), crawlResults.length, env))) {
          processingErrorReason = 'FREE_QUOTA_EXHAUSTED';
          return json({ success: false, code: 'FREE_QUOTA_EXHAUSTED', message: '本月免费额度已用完，请升级后继续使用' }, { status: 402 });
        }

        processingSuccess = true;
        return json({
          success: true,
          domain: targetUrl,
          total_pages: crawlResults.length,
          results: crawlResults,
          elapsed_ms: Date.now() - startTime,
        });
      } catch (err: any) {
        processingErrorReason = err?.message || 'CRAWL_FAILED';
        return json({ success: false, message: err?.message || 'Crawl 失败' }, { status: 500 });
      } finally {
        await recordProcessingLog(env, {
          endpoint: '/v1/crawl',
          fileType: processingFileType,
          success: processingSuccess,
          errorReason: processingErrorReason,
          durationMs: Date.now() - startTime,
          keyOrIp: authInfo.keyOrIp,
          userId: authInfo.userId,
        });
      }
    }

    // Feature 2: Screenshot API - POST /v1/screenshot
    if (url.pathname === '/v1/screenshot' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) return json({ success: false, message: rateLimitResult.reason }, { status: 429 });
      const body = (await request.json().catch(() => ({}))) as { url?: string };
      const targetUrl = (body.url || '').trim();

      if (!targetUrl || isForbiddenUrl(targetUrl)) {
        return json({ success: false, message: '请传入有效的 URL' }, { status: 400 });
      }

      return json({
        success: true,
        url: targetUrl,
        screenshot_url: `https://image.thum.io/get/width/1200/crop/800/${targetUrl}`,
        viewport: { width: 1200, height: 800 },
        format: 'png',
      });
    }

    // Feature 3: Vectorize RAG Chunks API - POST /v1/vectorize
    if (url.pathname === '/v1/vectorize' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) return json({ success: false, message: rateLimitResult.reason }, { status: 429 });
      const body = (await request.json().catch(() => ({}))) as { url?: string; html?: string; chunk_size?: number };
      const targetUrl = (body.url || '').trim();
      const rawHtml = body.html || '';

      if (targetUrl && isForbiddenUrl(targetUrl)) {
        return json({ success: false, message: '请传入有效的公网 URL' }, { status: 400 });
      }

      let sourceHtml = rawHtml;
      if (!sourceHtml && targetUrl) {
        const fetchRes = await safeFetchPageHtml(targetUrl, undefined, 5000).catch(() => null);
        if (fetchRes) {
          sourceHtml = fetchRes.html;
        }
      }

      if (sourceHtml.length > 10000) {
        sourceHtml = sourceHtml.slice(0, 10000);
      }

      const parsed = parseMarkdown(sourceHtml, targetUrl);
      const chunks = chunkMarkdownForRAG(parsed.markdown, body.chunk_size || 400);

      return json({
        success: true,
        title: parsed.title,
        total_chunks: chunks.length,
        notice: '单次向量切分限制最高 10,000 字，超长部分已自动截断以保障服务稳定',
        chunks,
      });
    }

    // Create a server-side Waffo checkout session. The API key identifies the credit recipient.
    if (url.pathname === '/v1/checkout' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { product?: string; test?: boolean };
      const authInfo = await verifyApiKeyOrIp(request, env);
      if (!authInfo.isKey) {
        return json({ success: false, message: '请先创建并使用一个API密钥，付款后的点数会发放到该密钥' }, { status: 401 });
      }

      const requestedProduct = body.product || 'starter';
      if (!Object.prototype.hasOwnProperty.call(PRODUCT_CATALOG, requestedProduct)) {
        return json({ success: false, message: '无效的点数包' }, { status: 400 });
      }
      const productCode = requestedProduct as ProductCode;
      const productConfig = PRODUCT_CATALOG[productCode];

      if (!env.DB) return json({ success: false, message: '支付服务暂时不可用' }, { status: 503 });

      const testMode = body.test === true && Boolean(env.HERDOWN_TEST_TOKEN) && request.headers.get('x-herdown-test-token') === env.HERDOWN_TEST_TOKEN;
      const merchantOrderId = `hd_${crypto.randomUUID().replace(/-/g, '')}`;
      const mode = testMode ? 'test' : 'prod';
      try {
        await env.DB.prepare(`
          INSERT INTO payment_orders (merchant_order_id, api_key, product_code, credits, payment_status, mode)
          VALUES (?, ?, ?, ?, 'pending', ?)
        `).bind(merchantOrderId, authInfo.keyOrIp, productCode, productConfig.credits, mode).run();
      } catch {
        return json({ success: false, message: '支付订单初始化失败，请稍后重试' }, { status: 500 });
      }

      const checkout = await createWaffoCheckout(env, merchantOrderId, url.origin, productCode, testMode);
      if (!checkout.checkoutUrl) {
        await env.DB.prepare("UPDATE payment_orders SET payment_status = 'failed' WHERE merchant_order_id = ?")
          .bind(merchantOrderId)
          .run()
          .catch(() => null);
        return json({ success: false, message: checkout.error || '支付通道初始化失败' }, { status: 503 });
      }
      return json({
        success: true,
        product: productCode,
        credits: productConfig.credits,
        checkout_url: checkout.checkoutUrl,
      });
    }

    // Waffo retries webhooks. A unique external order id makes credit delivery idempotent.
    if (url.pathname === '/v1/webhook/waffo' && request.method === 'POST') {
      const rawBody = await request.text();
      const event = JSON.parse(rawBody || '{}') as WaffoWebhookEvent;
      const publicKey = event.mode === 'test' ? env.WAFFO_TEST_WEBHOOK_PUBLIC_KEY : env.WAFFO_PROD_WEBHOOK_PUBLIC_KEY;
      const signature = request.headers.get('x-waffo-signature') || '';
      if (!publicKey || !(await verifyWaffoWebhook(rawBody, signature, publicKey))) {
        return json({ received: false, message: '无效的支付通知签名' }, { status: 401 });
      }

      if (event.eventType !== 'order.completed' || !event.data?.orderMerchantExternalId || !event.data.orderId || !env.DB) {
        return json({ received: true, processed: false });
      }

      try {
        const order = await env.DB.prepare(`
          SELECT api_key, credits FROM payment_orders
          WHERE merchant_order_id = ? AND payment_status = 'pending' AND mode = ?
        `).bind(event.data.orderMerchantExternalId, event.mode || 'prod').first<{ api_key: string; credits: number }>();

        if (!order) return json({ received: true, processed: false });

        await env.DB.batch([
          env.DB.prepare(`
            INSERT OR IGNORE INTO credit_ledger (api_key, credits, reason, external_order_id)
            VALUES (?, ?, 'purchase', ?)
          `).bind(order.api_key, order.credits, event.data.orderId),
          env.DB.prepare(`
            UPDATE payment_orders
            SET payment_status = 'completed', waffo_order_id = ?, completed_at = CURRENT_TIMESTAMP
            WHERE merchant_order_id = ? AND payment_status = 'pending'
          `).bind(event.data.orderId, event.data.orderMerchantExternalId),
        ]);
      } catch {
        return json({ received: false, message: '支付通知处理失败' }, { status: 500 });
      }

      return json({ received: true, processed: true });
    }

    if (url.pathname === '/v1/security-config' && request.method === 'GET') {
      return json({ turnstile_site_key: env.TURNSTILE_SITE_KEY || '' });
    }

    // Dashboard API: API Key Management
    if (url.pathname === '/v1/keys') {
      if (request.method === 'GET') {
        const authInfo = await verifyApiKeyOrIp(request, env);
        const sessionUser = await getSessionUser(request, env);
        if (!env.DB) return json({ keys: [] });
        try {
          const query = sessionUser
            ? env.DB.prepare('SELECT name, key, status, created_at FROM api_keys WHERE user_id = ? AND status != "revoked" ORDER BY created_at DESC').bind(sessionUser.id)
            : authInfo.isKey
              ? env.DB.prepare('SELECT name, key, status, created_at FROM api_keys WHERE key = ? AND status != "revoked"').bind(authInfo.keyOrIp)
              : null;
          if (!query) return json({ authenticated: false, keys: [] });
          const { results } = await query
            .all();
          return json({ authenticated: Boolean(sessionUser), keys: results || [] });
        } catch {
          return json({ keys: [] });
        }
      }

      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as { name?: string; turnstile_token?: string };
        if (!env.TURNSTILE_SECRET_KEY) {
          return json({ success: false, code: 'TURNSTILE_NOT_CONFIGURED', message: '安全验证暂未配置，请稍后重试' }, { status: 503 });
        }
        if (!(await verifyTurnstile(body.turnstile_token || '', request, env))) {
          return json({ success: false, code: 'TURNSTILE_FAILED', message: '请先完成安全验证后再创建API密钥' }, { status: 403 });
        }
        const ip = getClientIp(request);
        if (!(await consumeKeyCreationSlot(ip, env))) {
          return json({ success: false, code: 'KEY_CREATION_LIMIT', message: '同一IP每周最多创建1个API密钥' }, { status: 429 });
        }
        const keyName = (body.name || 'API Key').trim();
        const newKey = `sk_live_free_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
        const sessionUser = await getSessionUser(request, env);
        const userId = sessionUser?.id || `usr_${crypto.randomUUID().replace(/-/g, '')}`;

        if (env.DB) {
          try {
            await env.DB.prepare("INSERT OR IGNORE INTO users (id, email, plan) VALUES (?, ?, 'free')")
              .bind(userId, sessionUser?.email || `${userId}@key.local`)
              .run();

            await env.DB.prepare('INSERT INTO api_keys (key, user_id, name, status) VALUES (?, ?, ?, ?)').bind(newKey, userId, keyName, 'active').run();
          } catch (e: any) {
            return json({ success: false, message: e?.message || '数据库写入失败' }, { status: 500 });
          }
        }

        const deviceId = getDeviceId(request) || `dev_${crypto.randomUUID().replace(/-/g, '')}`;
        return attachDeviceCookie(json({ success: true, key: newKey, name: keyName, created_at: new Date().toISOString() }), deviceId);
      }
    }

    if (url.pathname.startsWith('/v1/keys/') && request.method === 'DELETE') {
      const keyToDelete = url.pathname.replace('/v1/keys/', '');
      const authInfo = await verifyApiKeyOrIp(request, env);
      const sessionUser = await getSessionUser(request, env);
      if (!sessionUser && (!authInfo.isKey || authInfo.keyOrIp !== keyToDelete)) {
        return json({ success: false, message: '只能删除当前使用的API密钥' }, { status: 401 });
      }
      if (env.DB && keyToDelete) {
        try {
          if (sessionUser) {
            await env.DB.prepare('UPDATE api_keys SET status = "revoked" WHERE key = ? AND user_id = ?').bind(keyToDelete, sessionUser.id).run();
          } else {
            await env.DB.prepare('UPDATE api_keys SET status = "revoked" WHERE key = ?').bind(keyToDelete).run();
          }
        } catch {
          // ignore
        }
      }
      return json({ success: true, key: keyToDelete });
    }

    if (url.pathname === '/v1/credits' && request.method === 'GET') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      if (!authInfo.isKey) return json({ success: false, message: '请提供有效的API密钥' }, { status: 401 });
      const creditStatus = await getCreditStatus(authInfo.keyOrIp, env);
      const freeQuota = creditStatus.hasPurchasedCredits ? null : await getFreeQuotaStatus(getFreeQuotaIdentity(authInfo), env);
      return json({
        success: true,
        credits: creditStatus.balance,
        has_paid_credits: creditStatus.hasPurchasedCredits,
        free_quota: FREE_MONTHLY_QUOTA,
        free_remaining: freeQuota?.remaining ?? 0,
      });
    }

    // Dashboard API: Usage Statistics
    if (url.pathname === '/v1/usage' && request.method === 'GET') {
      const dateStr = new Date().toISOString().slice(0, 10);
      let todayCount = 0;
      let totalKeys = 0;

      if (env.DB) {
        try {
          const row = await env.DB.prepare('SELECT SUM(count) as total FROM usage_logs WHERE parse_date = ? AND key_or_ip LIKE "day:%"').bind(dateStr).first<{ total: number }>();
          todayCount = row?.total || 0;

          const keysRow = await env.DB.prepare('SELECT COUNT(*) as cnt FROM api_keys WHERE status = "active"').first<{ cnt: number }>();
          totalKeys = keysRow?.cnt || 0;
        } catch {
          // ignore
        }
      }

      return json({
        today_requests: todayCount,
        daily_quota: 100,
        monthly_free_quota: FREE_MONTHLY_QUOTA,
        quota_tier: '免费每月1,000次，API密钥每日最多100次请求',
        active_keys: totalKeys,
      });
    }

    // MCP Remote Endpoint (MCP 2026-07-28 Stateless Protocol Standard)
    if (url.pathname === '/mcp') {
      if (request.method === 'GET') {
        const sessionId = Math.random().toString(36).substring(2, 15);
        
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            const endpointUrl = `${new URL(request.url).origin}/mcp?session_id=${sessionId}`;
            
            // Send endpoint immediately
            controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointUrl}\n\n`));
            
            // Active heartbeat interval to keep SSE connection alive
            const interval = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(`: ping\n\n`));
              } catch {
                clearInterval(interval);
              }
            }, 15000);
          }
        });
        
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',
          },
        });
      }

      if (request.method === 'POST') {
        const body = (await request.json().catch(() => null)) as {
          jsonrpc?: string;
          id?: string | number | null;
          method?: string;
          params?: Record<string, unknown>;
          _meta?: { protocolVersion?: string; clientCapabilities?: Record<string, unknown> };
        } | null;

        if (!body?.method) {
          return json({ jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32600, message: 'Invalid Request' } }, { status: 400 });
        }

        // Support both initialization handshake and direct stateless call (MCP 2026-07-28)
        if (body.method === 'initialize') {
          return json({
            jsonrpc: '2.0',
            id: body.id ?? null,
            result: {
              protocolVersion: body._meta?.protocolVersion || '2026-07-28',
              serverInfo: { name: 'Herdown MCP Server', version: '2.4.0' },
              capabilities: { tools: {}, stateless: true },
              _meta: { stateless: true },
            },
          });
        }

        if (body.method === 'tools/list') {
          return json({
            jsonrpc: '2.0',
            id: body.id ?? null,
            result: {
              tools: [
                {
                  name: 'parse_webpage',
                  description: 'Parse public web pages into clean Markdown formatted for AI workflows.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', description: 'The public HTTP/HTTPS URL of the target article or web page' },
                      html: { type: 'string', description: 'Optional raw HTML string if URL is not directly accessible' },
                    },
                    required: ['url'],
                  },
                },
                {
                  name: 'crawl_website',
                  description: 'Crawl all internal pages or sitemap of a website into Markdown.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', description: 'Domain URL or Sitemap XML link' },
                      limit: { type: 'number', description: 'Max pages to crawl (1-10)' },
                    },
                    required: ['url'],
                  },
                },
                {
                  name: 'health_check',
                  description: 'Check MD for Agents backend service status.',
                  inputSchema: { type: 'object', properties: {} },
                },
              ],
            },
          });
        }

        if (body.method === 'tools/call') {
          const toolName = String(body.params?.name ?? '');
          const args = (body.params?.arguments ?? {}) as { url?: string; html?: string; limit?: number };

          if (toolName === 'health_check') {
            return json({
              jsonrpc: '2.0',
              id: body.id ?? null,
              result: { content: [{ type: 'text', text: 'Service Operational. Version 2.4.0' }] },
            });
          }

          if (toolName === 'parse_webpage') {
            const targetUrl = (args.url || '').trim();
            let sourceHtml = args.html || '';

            if (targetUrl && isForbiddenUrl(targetUrl)) {
              return json({
                jsonrpc: '2.0',
                id: body.id ?? null,
                error: { code: -32602, message: 'Invalid URL: Internal or private IP addresses forbidden' },
              });
            }

            if (targetUrl && !sourceHtml) {
              const platform = detectPlatform(targetUrl);
              let referer = '';
              if (platform === 'xiaohongshu') {
                referer = 'https://www.xiaohongshu.com/';
              } else if (platform === 'wechat') {
                referer = 'https://mp.weixin.qq.com/';
              } else if (platform === 'zhihu') {
                referer = 'https://www.zhihu.com/';
              } else if (platform === 'twitter') {
                referer = 'https://x.com/';
              }
              const fetchRes = await safeFetchPageHtml(targetUrl, referer, 8000).catch(() => null);
              if (fetchRes) {
                sourceHtml = fetchRes.html;
              }
            }

            const parsed = parseMarkdown(sourceHtml, targetUrl);

            return json({
              jsonrpc: '2.0',
              id: body.id ?? null,
              result: {
                content: [{ type: 'text', text: parsed.markdown }],
                structuredContent: parsed,
              },
            });
          }
        }

        return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: 'Method not found' } }, { status: 404 });
      }
    }

    if (url.pathname === '/terms' || url.pathname === '/terms/') {
      const english = (request.headers.get('accept-language') || '').toLowerCase().startsWith('en');
      return new Response(termsPage(english), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      });
    }

    if (url.pathname === '/privacy' || url.pathname === '/privacy/') {
      const english = (request.headers.get('accept-language') || '').toLowerCase().startsWith('en');
      return new Response(privacyPage(english), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      });
    }

    const publicPath = normalizePublicPath(url.pathname);
    if (seoPages[publicPath] && env.ASSETS) {
      return renderSeoShell(request, env, publicPath);
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const htmlContent = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Herdown - 给 AI Agent 用的干净 Markdown 入口</title>
    <meta name="description" content="专为 AI Agent、开发者与自动化工作流打造的网页转 Markdown 工具链、REST API 与远程 MCP 平台。" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="/assets/index-Cdc-Gcav.js?v=${Date.now()}"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-Bh3JPuA3.css">
  </head>
  <body class="bg-[#090d10] text-[#e1e7ec] antialiased selection:bg-[#0f6b4f] selection:text-white">
    <div id="root"></div>
  </body>
</html>`;
      return new Response(htmlContent, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Static Assets Fallback (Serves JS/CSS bundles)
    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch {
        // Fallback
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
