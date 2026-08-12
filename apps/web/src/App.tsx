import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Key,
  Terminal,
  Cpu,
  Globe,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code2,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Camera,
  Layers,
  PlugZap,
  CheckCircle2,
  X,
  UserRound,
  LogIn,
  LogOut,
  Upload,
  Menu
} from 'lucide-react';
import { getInitialLanguage, homeMessages, Language, languageLabels, messages } from './i18n';
import { localeValue } from './localeValue';
import { HomeQualityHighlights, HomeSeoSections, OnPageSeoContent } from './OnPageSeoContent';
const ToolSeoContent = lazy(() => import('./ToolSeoContent').then(module => ({ default: module.ToolSeoContent })));
const TrustPage = lazy(() => import('./TrustPages').then(module => ({ default: module.TrustPage })));
const BlogPage = lazy(() => import('./BlogPages').then(module => ({ default: module.BlogPage })));
const MergeToolPage = lazy(() => import('./MergeTools').then(module => ({ default: module.MergeToolPage })));
const MarkdownFormatGuidePage = lazy(() => import('./GuidePages').then(module => ({ default: module.MarkdownFormatGuidePage })));
const MarkdownToolsHubPage = lazy(() => import('./GuidePages').then(module => ({ default: module.MarkdownToolsHubPage })));
const MergeDocumentsGuidePage = lazy(() => import('./GuidePages').then(module => ({ default: module.MergeDocumentsGuidePage })));
const SitemapCheckerPage = lazy(() => import('./SitemapTools').then(module => ({ default: module.SitemapCheckerPage })));
const SitemapExtractorPage = lazy(() => import('./SitemapTools').then(module => ({ default: module.SitemapExtractorPage })));
const SitemapGeneratorPage = lazy(() => import('./SitemapTools').then(module => ({ default: module.SitemapGeneratorPage })));
const SitemapValidatorPage = lazy(() => import('./SitemapTools').then(module => ({ default: module.SitemapValidatorPage })));
const WebsiteUrlExtractorPage = lazy(() => import('./SitemapTools').then(module => ({ default: module.WebsiteUrlExtractorPage })));
const CsvMarkdownPage = lazy(() => import('./DataMarkdownTools').then(module => ({ default: module.CsvMarkdownPage })));
const JsonMarkdownPage = lazy(() => import('./DataMarkdownTools').then(module => ({ default: module.JsonMarkdownPage })));
const PasteMarkdownPage = lazy(() => import('./DataMarkdownTools').then(module => ({ default: module.PasteMarkdownPage })));
const RtfMarkdownPage = lazy(() => import('./DataMarkdownTools').then(module => ({ default: module.RtfMarkdownPage })));
const XmlMarkdownPage = lazy(() => import('./DataMarkdownTools').then(module => ({ default: module.XmlMarkdownPage })));
const GoogleDocsMarkdownPage = lazy(() => import('./CloudMarkdownTools').then(module => ({ default: module.GoogleDocsMarkdownPage })));
const NotionMarkdownPage = lazy(() => import('./CloudMarkdownTools').then(module => ({ default: module.NotionMarkdownPage })));
const WebsiteToMarkdownPage = lazy(() => import('./CloudMarkdownTools').then(module => ({ default: module.WebsiteToMarkdownPage })));
const MarkdownOutputPage = lazy(() => import('./MarkdownOutputTools').then(module => ({ default: module.MarkdownOutputPage })));
const MarkdownViewerPage = lazy(() => import('./MarkdownPublishingTools').then(module => ({ default: module.MarkdownViewerPage })));
const MarkdownWechatPage = lazy(() => import('./MarkdownPublishingTools').then(module => ({ default: module.MarkdownWechatPage })));
const MarkdownXiaohongshuPage = lazy(() => import('./MarkdownPublishingTools').then(module => ({ default: module.MarkdownXiaohongshuPage })));
const LocalMarkdownToolsPage = lazy(() => import('./LocalMarkdownTools').then(module => ({ default: module.LocalMarkdownToolsPage })));

interface ParseResponse {
  success: boolean;
  title: string;
  markdown: string;
  images: string[];
  platform: 'wechat' | 'xiaohongshu' | 'zhihu' | 'twitter' | 'wikipedia' | 'general';
  elapsed_ms: number;
  source_tokens?: number;
  markdown_tokens?: number;
  token_savings?: number;
  token_savings_percent?: number;
  message?: string;
}

interface ApiKeyItem {
  key: string;
  name: string;
  status: string;
  created_at: string;
}

interface SessionUser {
  id: string;
  email: string;
  plan: string;
  display_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
}

interface AdminOverview {
  stats: {
    users: number;
    active_keys: number;
    completed_orders: number;
    sold_credits: number;
    usage_requests: number;
  };
  recent_users: Array<{ email: string; display_name?: string; plan: string; created_at: string }>;
  processing?: {
    total: number;
    succeeded: number;
    failed: number;
    success_rate: number;
    average_duration_ms: number;
    failure_reasons: Array<{ reason: string; count: number }>;
    file_types: Array<{ file_type: string; count: number }>;
  };
}

type ToolSlug = 'tools' | 'url-to-markdown' | 'website-to-markdown' | 'txt-to-markdown' | 'pdf-to-markdown' | 'word-to-markdown' | 'ppt-to-markdown' | 'excel-to-markdown' | 'csv-to-markdown' | 'json-to-markdown' | 'xml-to-markdown' | 'rtf-to-markdown' | 'paste-to-markdown' | 'notion-to-markdown' | 'google-docs-to-markdown' | 'markdown-to-html' | 'markdown-to-pdf' | 'markdown-to-word' | 'markdown-to-csv' | 'markdown-viewer' | 'markdown-to-wechat' | 'markdown-to-xiaohongshu' | 'markdown-tools' | 'markdown-format-guide' | 'merge-documents' | 'merge-pdf' | 'merge-docx' | 'merge-pptx' | 'merge-excel' | 'sitemap-extractor' | 'sitemap-checker' | 'sitemap-validator' | 'sitemap-generator' | 'website-url-extractor' | 'blog' | 'blog/how-to-convert-html-to-markdown-for-ai' | 'blog/best-markdown-converter-for-ai-agents' | 'blog/markdown-for-agents-tools' | 'about' | 'contact' | 'docs' | 'help' | 'faq' | 'api' | 'mcp' | 'cli' | 'skill' | 'pricing' | 'browser-extension' | null;
type ProductCode = 'starter' | 'standard' | 'bulk';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string | number;
      remove?: (widgetId: string | number) => void;
    };
  }
}

function TurnstileWidget({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey) return;
    let widgetId: string | number | undefined;
    let active = true;
    const render = () => {
      if (!active || !containerRef.current || !window.turnstile) return;
      containerRef.current.replaceChildren();
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-herdown-turnstile]');
    if (window.turnstile) {
      render();
    } else if (existingScript) {
      existingScript.addEventListener('load', render, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.herdownTurnstile = 'true';
      script.addEventListener('load', render, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (widgetId !== undefined) window.turnstile?.remove?.(widgetId);
    };
  }, [siteKey]);

  return <div ref={containerRef} className="min-h-16" />;
}

const pricingPackages: Array<{ code: ProductCode; price: string; credits: string; label: string; featured?: boolean }> = [
  { code: 'starter', price: '9.99', credits: '10,000', label: '入门包' },
  { code: 'standard', price: '29.99', credits: '50,000', label: '标准包', featured: true },
  { code: 'bulk', price: '49.99', credits: '100,000', label: '大容量包' },
];

const getToolSlug = (): ToolSlug => {
  const slug = window.location.pathname.replace(/^\//, '') as Exclude<ToolSlug, null>;
  return ['tools', 'url-to-markdown', 'website-to-markdown', 'txt-to-markdown', 'pdf-to-markdown', 'word-to-markdown', 'ppt-to-markdown', 'excel-to-markdown', 'csv-to-markdown', 'json-to-markdown', 'xml-to-markdown', 'rtf-to-markdown', 'paste-to-markdown', 'notion-to-markdown', 'google-docs-to-markdown', 'markdown-to-html', 'markdown-to-pdf', 'markdown-to-word', 'markdown-to-csv', 'markdown-viewer', 'markdown-to-wechat', 'markdown-to-xiaohongshu', 'markdown-tools', 'markdown-format-guide', 'merge-documents', 'merge-pdf', 'merge-docx', 'merge-pptx', 'merge-excel', 'sitemap-extractor', 'sitemap-checker', 'sitemap-validator', 'sitemap-generator', 'website-url-extractor', 'blog', 'blog/how-to-convert-html-to-markdown-for-ai', 'blog/best-markdown-converter-for-ai-agents', 'blog/markdown-for-agents-tools', 'about', 'contact', 'docs', 'help', 'faq', 'api', 'mcp', 'cli', 'skill', 'pricing', 'browser-extension'].includes(slug) ? slug : null;
};

const toolPageInfo: Record<Exclude<ToolSlug, null>, { title: string; enTitle: string; description: string; enDescription: string; local?: boolean }> = {
  tools: { title: '本地资料', enTitle: 'Local materials', description: '选择本地资料，整理成可以直接使用的Markdown。网页链接请使用首页转换。', enDescription: 'Choose a local file and prepare it as Markdown. Use the homepage for webpage links.' },
  'url-to-markdown': { title: 'URL转Markdown', enTitle: 'URL to Markdown', description: '粘贴网页链接，提取正文、标题、图片和来源信息，生成干净Markdown。', enDescription: 'Paste a webpage URL to extract the body, title, images, and source metadata into clean Markdown.' },
  'website-to-markdown': { title: 'Website转Markdown', enTitle: 'Website to Markdown', description: '从域名、起始URL或Sitemap抓取多个公开页面，保留来源并导出Markdown或ZIP。', enDescription: 'Crawl multiple public pages from a domain, starting URL, or sitemap, retain sources, and export Markdown or ZIP.' },
  'txt-to-markdown': { title: 'TXT转Markdown', enTitle: 'TXT to Markdown', description: '把纯文本整理成可直接保存和交给AI使用的Markdown文件。', enDescription: 'Turn plain text into a Markdown file ready to save or send to an AI tool.' },
  'pdf-to-markdown': { title: 'PDF转Markdown', enTitle: 'PDF to Markdown', description: '在浏览器中直接处理文字型PDF，不上传文件。扫描版PDF不支持，请使用本地Unlimited-OCRSkill。', enDescription: 'Process text-based PDFs directly in the browser without uploading them. Scanned PDFs are not supported; use the local Unlimited-OCRSkill.', local: true },
  'word-to-markdown': { title: 'Word转Markdown', enTitle: 'Word to Markdown', description: '在浏览器中直接处理Word文档，不上传文件，整理为结构化Markdown。', enDescription: 'Process Word documents directly in the browser without uploading them, and turn them into structured Markdown.', local: true },
  'ppt-to-markdown': { title: 'PPT转Markdown', enTitle: 'PPT to Markdown', description: '在浏览器中直接提取PPT和PPTX文字，不上传文件，整理为Markdown。', enDescription: 'Extract text from PPT and PPTX files directly in the browser without uploading them, and prepare Markdown.', local: true },
  'excel-to-markdown': { title: 'Excel转Markdown', enTitle: 'Excel to Markdown', description: '在浏览器中直接把Excel工作表转换为Markdown表格，不上传文件。', enDescription: 'Convert Excel worksheets into Markdown tables directly in the browser without uploading them.', local: true },
  'csv-to-markdown': { title: 'CSV转Markdown', enTitle: 'CSV to Markdown', description: '上传CSV或TSV文件，或粘贴分隔数据，在浏览器中转换为Markdown表格。', enDescription: 'Upload CSV or TSV, or paste delimited data, and convert it into a Markdown table locally.', local: true },
  'json-to-markdown': { title: 'JSON转Markdown', enTitle: 'JSON to Markdown', description: '上传或粘贴JSON，把对象、数组和嵌套结构在浏览器中转换为可读Markdown。', enDescription: 'Upload or paste JSON and convert objects, arrays, and nested structures into readable Markdown locally.', local: true },
  'xml-to-markdown': { title: 'XML转Markdown', enTitle: 'XML to Markdown', description: '上传或粘贴XML，把Sitemap、RSS、Atom和通用嵌套数据转换为可读Markdown。', enDescription: 'Upload or paste XML and convert sitemaps, feeds, and generic nested data into readable Markdown.', local: true },
  'rtf-to-markdown': { title: 'RTF转Markdown', enTitle: 'RTF to Markdown', description: '上传或粘贴RTF文档，在浏览器中提取段落、Unicode文字和基础列表。', enDescription: 'Upload or paste RTF and extract paragraphs, Unicode text, and basic lists into Markdown locally.', local: true },
  'paste-to-markdown': { title: 'HTML转Markdown转换器', enTitle: 'HTML to Markdown Converter', description: '粘贴HTML源码、富文本或纯文本，在浏览器中转换为结构化Markdown。', enDescription: 'Paste HTML source, rich content, or plain text and convert it into structured Markdown locally.', local: true },
  'notion-to-markdown': { title: 'Notion转Markdown', enTitle: 'Notion to Markdown', description: '转换公开Notion页面，也支持上传NotionHTML导出文件或ZIP在本地处理。', enDescription: 'Convert public Notion pages, or process Notion HTML exports and ZIP files locally.', local: true },
  'google-docs-to-markdown': { title: 'Google Docs转Markdown', enTitle: 'Google Docs to Markdown', description: '转换公开Google Docs文档，也支持上传Google DocsHTML导出文件或粘贴HTML在本地处理。', enDescription: 'Convert public Google Docs documents, or process Google Docs HTML exports locally.', local: true },
  'markdown-to-html': { title: 'Markdown转HTML', enTitle: 'Markdown to HTML', description: '在浏览器本地把Markdown转换为可发布、可保存的独立HTML文件。', enDescription: 'Convert Markdown locally into a standalone HTML file ready to publish or save.', local: true },
  'markdown-to-pdf': { title: 'Markdown转PDF', enTitle: 'Markdown to PDF', description: '在浏览器本地把Markdown排版为A4PDF，保留标题、列表、表格、代码和链接。', enDescription: 'Format Markdown locally as an A4 PDF while preserving headings, lists, tables, code, and links.', local: true },
  'markdown-to-word': { title: 'Markdown转Word', enTitle: 'Markdown to Word', description: '在浏览器本地把Markdown转换为可继续编辑的DOCX文件。', enDescription: 'Convert Markdown locally into an editable DOCX file.', local: true },
  'markdown-to-csv': { title: 'Markdown转CSV', enTitle: 'Markdown to CSV', description: '在浏览器本地提取Markdown表格并下载为CSV文件。', enDescription: 'Extract a Markdown table locally and download it as a CSV file.', local: true },
  'markdown-viewer': { title: 'Markdown Viewer', enTitle: 'Markdown Viewer', description: '打开、编辑和预览本地Markdown文件，支持实时预览、HTML和PDF导出。', enDescription: 'Open, edit, and preview local Markdown files with live preview, HTML, and PDF export.', local: true },
  'markdown-to-wechat': { title: 'Markdown转微信公众号', enTitle: 'Markdown to WeChat', description: '把Markdown整理为适合微信公众号编辑器的富文本，支持主题预览和一键复制。', enDescription: 'Format Markdown as WeChat-friendly rich text with theme preview and one-click copy.', local: true },
  'markdown-to-xiaohongshu': { title: 'Markdown转小红书', enTitle: 'Markdown to Xiaohongshu', description: '把Markdown拆分为小红书图片卡片，支持主题、比例和浏览器打印保存。', enDescription: 'Turn Markdown into Xiaohongshu image cards with themes, ratios, and browser print/save.', local: true },
  'markdown-tools': { title: 'Markdown工具中心', enTitle: 'Markdown tools', description: '集中访问Markdown查看、编辑、格式转换和内容发布工具。', enDescription: 'Browse focused Markdown tools for viewing, editing, conversion, and publishing.' },
  'markdown-format-guide': { title: 'Markdown格式转换指南', enTitle: 'Markdown format guide', description: '根据编辑、交付和发布场景选择Markdown输出格式。', enDescription: 'Choose a Markdown output format based on editing, delivery, and publishing needs.' },
  'merge-documents': { title: '文档合并工具指南', enTitle: 'Merge document tools', description: '选择PDF、DOCX、PPTX或Excel合并工具，按顺序生成完整文件。', enDescription: 'Choose a PDF, DOCX, PPTX, or Excel merge tool and create an ordered output file.' },
  'merge-pdf': { title: 'PDF合并', enTitle: 'Merge PDF', description: '在线合并多个PDF文件，按顺序生成一个PDF。文件在浏览器本地处理。', enDescription: 'Merge multiple PDF files in order into one PDF locally in your browser.', local: true },
  'merge-docx': { title: 'DOCX合并', enTitle: 'Merge DOCX', description: '在线合并多个DOCX文档，尽量保留样式、表格、图片和列表。', enDescription: 'Merge DOCX documents while preserving styles, tables, images, and lists when possible.', local: true },
  'merge-pptx': { title: 'PPTX合并', enTitle: 'Merge PPTX', description: '在线合并多个PPTX演示文稿，保留幻灯片和媒体关系。', enDescription: 'Merge PPTX presentations while retaining slides and media relationships.', local: true },
  'merge-excel': { title: 'Excel合并', enTitle: 'Merge Excel', description: '在线合并多个Excel文件，默认每个文件一个工作表，也支持追加到一张表。', enDescription: 'Merge Excel files into one workbook with one sheet per file or append mode.', local: true },
  'sitemap-extractor': { title: 'SitemapURL提取器', enTitle: 'Sitemap URL Extractor', description: '输入域名或Sitemap地址，自动发现并展开SitemapIndex，导出去重后的URL列表。', enDescription: 'Discover sitemap files, expand sitemap indexes, and export a deduplicated URL list.' },
  'sitemap-checker': { title: 'Sitemap查找与检查器', enTitle: 'Sitemap Finder & Checker', description: '输入网站域名，查找Sitemap并检查可访问性、XML结构、URL数量和重复地址。', enDescription: 'Find sitemap files and check availability, XML structure, URL counts, and duplicate URLs.' },
  'sitemap-validator': { title: 'Sitemap验证器', enTitle: 'Sitemap Validator', description: '校验SitemapURL或粘贴的XML，检查语法、协议字段、重复URL和文件限制。', enDescription: 'Validate a sitemap URL or pasted XML for syntax, protocol fields, duplicate URLs, and file limits.' },
  'sitemap-generator': { title: 'XMLSitemap生成器', enTitle: 'XML Sitemap Generator', description: '抓取公开网站或粘贴URL列表，生成并下载符合标准的sitemap.xml文件。', enDescription: 'Crawl a public website or paste a URL list to generate and download a standards-compliant sitemap.xml file.' },
  'website-url-extractor': { title: 'Website URL提取器', enTitle: 'Website URL Extractor', description: '抓取公开网站的同源HTML链接，检查页面状态和标题，并导出URL清单。', enDescription: 'Crawl same-origin HTML links, inspect page status and titles, and export a website URL inventory.' },
  blog: { title: 'Herdown博客｜Markdown与AIAgent教程', enTitle: 'Herdown Blog', description: '阅读HTML转Markdown、AI Agent资料整理和Markdown工具工作流教程。', enDescription: 'Read practical guides about HTML to Markdown, AI agent material preparation, and Markdown tool workflows.' },
  'blog/how-to-convert-html-to-markdown-for-ai': { title: '如何把HTML转换为适合AI的Markdown｜Herdown', enTitle: 'How to Convert HTML to Markdown for AI', description: '了解如何提取网页正文、保留语义结构，并生成适合AI Agent使用的Markdown。', enDescription: 'Learn how to extract useful webpage content, preserve semantic structure, and create Markdown for AI agents.' },
  'blog/best-markdown-converter-for-ai-agents': { title: '如何选择适合AI Agent的Markdown转换器｜Herdown', enTitle: 'Best Markdown Converter for AI Agents: What to Compare', description: '从正文边界、结构质量、来源追踪、失败反馈和隐私边界评估AI Agent用Markdown转换器。', enDescription: 'Compare Markdown converters for AI agents by content boundaries, semantic quality, source traceability, failure feedback, and privacy.' },
  'blog/markdown-for-agents-tools': { title: 'AI Agent资料整理工具工作流指南｜Herdown', enTitle: 'Markdown for Agents Tools: A Practical Workflow', description: '了解网页提取、本地文件、Markdown查看、格式输出和平台发布如何组成AI Agent资料工作流。', enDescription: 'Connect webpage extraction, local files, Markdown review, format exports, and publishing tools into an AI agent workflow.' },
  docs: { title: 'Docs文档', enTitle: 'Docs', description: '查看网页转换、API、MCP、CLI、本地工具和AIAgent接入说明。', enDescription: 'Read guides for web conversion, API, MCP, CLI, local tools, and AI agent integrations.' },
  help: { title: '帮助文档', enTitle: 'Help', description: '从网页转换、API密钥、MCP和本地文档工具开始使用Herdown。', enDescription: 'Start using Herdown with web conversion, API keys, MCP, and local document tools.' },
  faq: { title: '常见问题', enTitle: 'FAQ', description: '查看解析范围、数据保存、额度和本地文档处理的常见问题。', enDescription: 'Answers about parsing, data retention, quotas, and local document processing.' },
  api: { title: 'API控制台', enTitle: 'API console', description: '创建和管理HerdownAPI密钥，查看额度和使用情况。', enDescription: 'Create and manage Herdown API keys and view usage.' },
  mcp: { title: 'MCP接入', enTitle: 'MCP integration', description: '配置远程MCP，连接Herdown网页解析和全站抓取能力。', enDescription: 'Connect a remote MCP client to Herdown webpage parsing and site crawling.' },
  cli: { title: 'CLI命令行工具', enTitle: 'CLI tool', description: '在终端调用Herdown，把网页整理成Markdown文件。', enDescription: 'Run Herdown from a terminal and save webpages as Markdown.' },
  skill: { title: 'HerdownSkill', enTitle: 'Herdown Skill', description: '把Herdown配置到AI Agent，让Agent自动选择合适的资料整理方式。', enDescription: 'Configure Herdown for an AI agent so it can choose the right material workflow.' },
  pricing: { title: '价格和额度', enTitle: 'Pricing and credits', description: '查看Herdown免费额度和一次性付费点数包。', enDescription: 'View Herdown free usage and one-time credit packages.' },
  'browser-extension': { title: '浏览器插件', enTitle: 'Browser extension', description: '下载Herdown浏览器本地扩展，用当前页面快速整理资料。', enDescription: 'Download the Herdown browser extension to prepare the current page locally.' },
  about: { title: '关于Herdown', enTitle: 'About Herdown', description: '了解Herdown的产品方向、本地优先处理方式和开发者入口。', enDescription: 'Learn about Herdown, its local-first tools, product direction, and developer entry points.' },
  contact: { title: '联系Herdown', enTitle: 'Contact Herdown', description: '反馈转换问题、页面问题、隐私问题或开发者接入需求。', enDescription: 'Contact Herdown about conversion, page behavior, privacy, or developer integration issues.' },
};

const localizedHref = (path: string, language: Language) => language === 'zh'
  ? path
  : `${path}${path.includes('?') ? '&' : '?'}lang=${language}`;

const localizedClientSeo: Partial<Record<Exclude<Language, 'zh' | 'en'>, Record<string, { title: string; description: string; keywords: string }>>> = {
  ja: {
    '/': { title: 'AIエージェント向けMarkdown｜Herdown', description: 'Webページ、文書、画像をAIエージェント向けのクリーンなMarkdownに変換します。', keywords: 'WebページMarkdown,文書Markdown,AIエージェント,Markdown変換' },
    '/about': { title: 'Herdownについて｜Herdown', description: 'Herdownの製品方針、ローカル優先の処理、開発者向け入口を紹介します。', keywords: 'Herdownについて,ローカルMarkdown,Markdownツール' },
    '/contact': { title: 'Herdownへのお問い合わせ｜Herdown', description: '変換結果、ページ動作、プライバシー、開発者連携についてお問い合わせください。', keywords: 'Herdownお問い合わせ,Markdown変換サポート,Herdownサポート' },
    '/markdown-tools': { title: 'Markdownツール｜表示、変換、公開｜Herdown', description: 'Markdownの表示、編集、形式変換、WeChatとXiaohongshu向け公開ツールをまとめています。', keywords: 'Markdownツール,Markdown Viewer,Markdown変換,Markdown公開' },
    '/markdown-format-guide': { title: 'Markdown形式ガイド｜Herdown', description: '編集、納品、公開の目的に合わせてMarkdownの出力形式を選びます。', keywords: 'Markdown形式,Markdown HTML,Markdown PDF,Markdown Word' },
    '/merge-documents': { title: '文書結合ツール｜PDF、DOCX、PPTX、Excel｜Herdown', description: 'PDF、DOCX、PPTX、Excelの結合ツールを形式別に選べます。', keywords: '文書結合,PDF結合,DOCX結合,PPTX結合,Excel結合' },
    '/merge-pdf': { title: 'PDF結合｜PDFファイルを結合｜Herdown', description: '複数のPDFを順番どおり1つに結合します。ファイルはブラウザ内で処理されます。', keywords: 'PDF結合,PDFファイル結合,PDFマージ' },
    '/merge-docx': { title: 'DOCX結合｜Word文書を結合｜Herdown', description: '複数のDOCXを結合し、可能な限り書式、表、画像、リストを保持します。', keywords: 'DOCX結合,Word文書結合,DOCXマージ' },
    '/merge-pptx': { title: 'PPTX結合｜PowerPointを結合｜Herdown', description: '複数のPPTXを結合し、スライド、画像、レイアウトの関連を保持します。', keywords: 'PPTX結合,PowerPoint結合,PPTXマージ' },
    '/merge-excel': { title: 'Excel結合｜Excelファイルとシートを結合｜Herdown', description: '複数のExcelを1つのブックに結合します。ファイルごとのシートと追加モードに対応します。', keywords: 'Excel結合,Excelファイル結合,Excelシート結合' },
    '/blog': { title: 'Herdownブログ｜MarkdownとAIエージェントのガイド', description: 'HTMLからMarkdownへの変換、AIエージェント向け資料整理、Markdownツールの実用ガイド。', keywords: 'Markdownブログ,HTMLからMarkdown,AIエージェント,Markdownツール' },
    '/blog/how-to-convert-html-to-markdown-for-ai': { title: 'HTMLをAI向けMarkdownに変換する方法｜Herdown', description: 'Webページの本文を抽出し、意味構造を保ったAIエージェント向けMarkdownを作る方法を説明します。', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools' },
    '/blog/best-markdown-converter-for-ai-agents': { title: 'AIエージェント向けMarkdown変換ツールの選び方｜Herdown', description: '本文境界、構造品質、出典追跡、失敗表示、プライバシーから変換ツールを比較します。', keywords: 'best markdown converter for ai agents,Markdown変換,AIエージェント' },
    '/blog/markdown-for-agents-tools': { title: 'Markdown for Agents Toolsワークフロー｜Herdown', description: 'Web抽出、ローカルファイル、Markdown確認、形式出力、公開をAIエージェントの流れにまとめます。', keywords: 'markdown for agents tools,Markdownツール,AIエージェント' },
  },
  es: {
    '/': { title: 'Markdown limpio para agentes de IA｜Herdown', description: 'Convierte páginas web, documentos e imágenes en Markdown limpio para agentes de IA.', keywords: 'página web a Markdown,documento a Markdown,agentes de IA,convertidor Markdown' },
    '/about': { title: 'Sobre Herdown｜Herdown', description: 'Conoce la dirección de Herdown, el procesamiento local y las entradas para desarrolladores.', keywords: 'sobre Herdown,herramientas Markdown locales,convertidor Markdown' },
    '/contact': { title: 'Contactar con Herdown｜Herdown', description: 'Contacta con Herdown sobre conversiones, funcionamiento, privacidad o integraciones técnicas.', keywords: 'contacto Herdown,soporte Markdown,soporte de conversión' },
    '/markdown-tools': { title: 'Herramientas Markdown｜Ver, convertir y publicar｜Herdown', description: 'Herramientas Markdown para ver, editar, convertir y publicar en WeChat o Xiaohongshu.', keywords: 'herramientas Markdown,visor Markdown,convertidor Markdown,publicar Markdown' },
    '/markdown-format-guide': { title: 'Guía de formatos Markdown｜Herdown', description: 'Elige HTML, PDF, Word, CSV u otros formatos Markdown según tu flujo de trabajo.', keywords: 'formatos Markdown,Markdown a HTML,Markdown a PDF,Markdown a Word' },
    '/merge-documents': { title: 'Herramientas para unir documentos｜Herdown', description: 'Elige herramientas para unir PDF, DOCX, PPTX o Excel en el orden de tus archivos.', keywords: 'unir documentos,unir PDF,unir DOCX,unir PPTX,unir Excel' },
    '/merge-pdf': { title: 'Unir PDF｜Combinar archivos PDF｜Herdown', description: 'Combina varios PDF en orden en un solo archivo dentro del navegador.', keywords: 'unir PDF,combinar PDF,unir archivos PDF' },
    '/merge-docx': { title: 'Unir DOCX｜Combinar documentos Word｜Herdown', description: 'Combina documentos DOCX y conserva estilos, tablas, imágenes y listas cuando es posible.', keywords: 'unir DOCX,combinar Word,DOCX merger' },
    '/merge-pptx': { title: 'Unir PPTX｜Combinar presentaciones PowerPoint｜Herdown', description: 'Combina presentaciones PPTX conservando diapositivas, imágenes y relaciones de diseño.', keywords: 'unir PPTX,combinar PowerPoint,PPTX merger' },
    '/merge-excel': { title: 'Unir Excel｜Combinar archivos y hojas Excel｜Herdown', description: 'Combina archivos Excel en un libro con una hoja por archivo o con modo de añadido.', keywords: 'unir Excel,combinar Excel,unir hojas Excel' },
    '/blog': { title: 'Blog de Herdown｜Guías de Markdown y agentes de IA', description: 'Guías prácticas sobre HTML a Markdown, preparación de materiales para agentes de IA y herramientas Markdown.', keywords: 'blog Markdown,HTML a Markdown,agentes de IA,herramientas Markdown' },
    '/blog/how-to-convert-html-to-markdown-for-ai': { title: 'Cómo convertir HTML a Markdown para IA｜Herdown', description: 'Aprende a extraer el contenido útil de una página y conservar su estructura para agentes de IA.', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools' },
    '/blog/best-markdown-converter-for-ai-agents': { title: 'Cómo elegir el mejor conversor Markdown para agentes de IA｜Herdown', description: 'Compara límites de contenido, estructura, fuentes, errores y privacidad para elegir un conversor Markdown.', keywords: 'best markdown converter for ai agents,convertidor Markdown,agentes de IA' },
    '/blog/markdown-for-agents-tools': { title: 'Flujo de trabajo de Markdown for Agents Tools｜Herdown', description: 'Conecta extracción web, archivos locales, revisión Markdown, exportación y publicación para agentes de IA.', keywords: 'markdown for agents tools,herramientas Markdown,agentes de IA' },
  },
  de: {
    '/': { title: 'Sauberes Markdown für AI-Agenten｜Herdown', description: 'Webseiten, Dokumente und Bilder in sauberes Markdown für AI-Agenten umwandeln.', keywords: 'Webseite zu Markdown,Dokument zu Markdown,AI-Agenten,Markdown-Konverter' },
    '/about': { title: 'Über Herdown｜Herdown', description: 'Mehr über Herdown, lokale Verarbeitung, Produktausrichtung und Entwicklerzugänge erfahren.', keywords: 'Über Herdown,Markdown-Werkzeuge,lokale Dateiverarbeitung' },
    '/contact': { title: 'Herdown kontaktieren｜Herdown', description: 'Herdown zu Konvertierung, Seitenverhalten, Datenschutz oder Entwicklerintegrationen kontaktieren.', keywords: 'Herdown Kontakt,Markdown Support,Konvertierungs-Support' },
    '/markdown-tools': { title: 'Markdown-Werkzeuge｜Anzeigen, konvertieren und veröffentlichen｜Herdown', description: 'Markdown-Werkzeuge zum Anzeigen, Bearbeiten, Konvertieren und Veröffentlichen.', keywords: 'Markdown-Werkzeuge,Markdown Viewer,Markdown-Konverter,Markdown veröffentlichen' },
    '/markdown-format-guide': { title: 'Markdown-Formatleitfaden｜Herdown', description: 'HTML, PDF, Word, CSV und weitere Ausgabeformate passend zum Workflow auswählen.', keywords: 'Markdown-Formate,Markdown zu HTML,Markdown zu PDF,Markdown zu Word' },
    '/merge-documents': { title: 'Dokumente zusammenführen｜PDF, DOCX, PPTX und Excel｜Herdown', description: 'Werkzeug für PDF, DOCX, PPTX oder Excel auswählen und Dateien lokal in Reihenfolge zusammenführen.', keywords: 'Dokumente zusammenführen,PDF zusammenführen,DOCX zusammenführen,PPTX zusammenführen,Excel zusammenführen' },
    '/merge-pdf': { title: 'PDF zusammenführen｜PDF-Dateien kombinieren｜Herdown', description: 'Mehrere PDF-Dateien lokal im Browser in der gewünschten Reihenfolge zusammenführen.', keywords: 'PDF zusammenführen,PDF kombinieren,PDF-Dateien verbinden' },
    '/merge-docx': { title: 'DOCX zusammenführen｜Word-Dokumente kombinieren｜Herdown', description: 'DOCX-Dokumente lokal zusammenführen und Formatierungen möglichst erhalten.', keywords: 'DOCX zusammenführen,Word-Dokumente kombinieren,DOCX-Merger' },
    '/merge-pptx': { title: 'PPTX zusammenführen｜PowerPoint-Präsentationen kombinieren｜Herdown', description: 'PPTX-Präsentationen lokal zusammenführen und Folien, Bilder sowie Layoutbeziehungen erhalten.', keywords: 'PPTX zusammenführen,PowerPoint kombinieren,PPTX-Merger' },
    '/merge-excel': { title: 'Excel zusammenführen｜Dateien und Blätter kombinieren｜Herdown', description: 'Excel-Dateien in einer Arbeitsmappe zusammenführen, mit einem Blatt pro Datei oder Anhängemodus.', keywords: 'Excel zusammenführen,Excel-Dateien kombinieren,Excel-Blätter verbinden' },
    '/blog': { title: 'Herdown-Blog｜Anleitungen zu Markdown und AI-Agenten', description: 'Praktische Anleitungen zu HTML-zu-Markdown, Materialaufbereitung für AI-Agenten und Markdown-Werkzeugen.', keywords: 'Markdown-Blog,HTML zu Markdown,AI-Agenten,Markdown-Werkzeuge' },
    '/blog/how-to-convert-html-to-markdown-for-ai': { title: 'HTML für AI in Markdown umwandeln｜Herdown', description: 'Lerne, nützliche Webinhalte zu extrahieren und ihre Struktur für AI-Agenten zu bewahren.', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools' },
    '/blog/best-markdown-converter-for-ai-agents': { title: 'Den besten Markdown-Konverter für AI-Agenten auswählen｜Herdown', description: 'Markdown-Konverter nach Inhaltsgrenzen, Struktur, Quellen, Fehlermeldungen und Datenschutz vergleichen.', keywords: 'best markdown converter for ai agents,Markdown-Konverter,AI-Agenten' },
    '/blog/markdown-for-agents-tools': { title: 'Markdown for Agents Tools: Workflow｜Herdown', description: 'Webextraktion, lokale Dateien, Markdown-Prüfung, Exporte und Veröffentlichung für AI-Agenten verbinden.', keywords: 'markdown for agents tools,Markdown-Werkzeuge,AI-Agenten' },
  },
};

const toolLabel = (slug: Exclude<ToolSlug, null>, language: Language) => {
  if (language === 'zh') return toolPageInfo[slug].title;
  if (language === 'en') return toolPageInfo[slug].enTitle;
  return localizedClientSeo[language]?.[`/${slug}`]?.title || toolPageInfo[slug].enTitle;
};
const toolDescription = (slug: Exclude<ToolSlug, null>, language: Language) => {
  if (language === 'zh') return toolPageInfo[slug].description;
  if (language === 'en') return toolPageInfo[slug].enDescription;
  return localizedClientSeo[language]?.[`/${slug}`]?.description || toolPageInfo[slug].enDescription;
};

const readStoredApiKeys = (): ApiKeyItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const savedKeys = JSON.parse(window.localStorage.getItem('herdown_api_keys') || '[]');
    return Array.isArray(savedKeys) ? savedKeys : [];
  } catch {
    return [];
  }
};

function TextMarkdownTool({ language }: { language: Language }) {
  const ui = messages[language];
  const labels = {
    eyebrow: localeValue(language, { zh: '本地即时转换', en: 'Local instant conversion', ja: 'ブラウザ内で即時変換', es: 'Conversión local instantánea', de: 'Lokale Sofortkonvertierung' }),
    intro: localeValue(language, { zh: '文本只在当前浏览器处理，不上传服务器。整理后可以复制或直接下载为`.md`文件。', en: 'Text is processed in this browser and is not uploaded. Copy or download the cleaned `.md` file.', ja: 'テキストはこのブラウザ内で処理され、アップロードされません。整えた`.md`をコピーまたはダウンロードできます。', es: 'El texto se procesa en este navegador y no se sube. Copia o descarga el archivo`.md` limpio.', de: 'Text wird in diesem Browser verarbeitet und nicht hochgeladen. Die bereinigte`.md`-Datei kopieren oder herunterladen.' }),
    input: localeValue(language, { zh: '输入TXT文本', en: 'Input TXT text', ja: 'TXTテキスト入力', es: 'Texto TXT de entrada', de: 'TXT-Eingabetext' }),
    placeholder: localeValue(language, { zh: '把纯文本粘贴到这里...', en: 'Paste plain text here...', ja: 'プレーンテキストをここに貼り付け...', es: 'Pega aquí el texto plano...', de: 'Reinen Text hier einfügen...' }),
    result: localeValue(language, { zh: 'Markdown结果', en: 'Markdown result', ja: 'Markdownの結果', es: 'Resultado Markdown', de: 'Markdown-Ergebnis' }),
    copy: localeValue(language, { zh: '复制', en: 'Copy', ja: 'コピー', es: 'Copiar', de: 'Kopieren' }),
    empty: localeValue(language, { zh: '转换结果会显示在这里...', en: 'The result will appear here...', ja: '変換結果がここに表示されます...', es: 'El resultado aparecerá aquí...', de: 'Das Ergebnis erscheint hier...' }),
  };
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const markdown = text
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const copy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!markdown) return;
    const blob = new Blob([`${markdown}\n`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'herdown-text.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{labels.eyebrow}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{toolLabel('txt-to-markdown', language)}</h1>
        <p className="text-sm text-slate-400 mt-3 leading-7">{labels.intro}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label className="p-5 rounded-2xl bg-[#0f1722] border border-[#1e293b]">
          <span className="block text-xs font-semibold text-slate-300 mb-3">{labels.input}</span>
          <textarea value={text} onChange={event => setText(event.target.value)} rows={16} placeholder={labels.placeholder} className="w-full h-80 resize-y rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
        </label>
        <div className="p-5 rounded-2xl bg-[#0f1722] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">{labels.result}</span>
            <div className="flex gap-2">
              <button onClick={copy} disabled={!markdown} className="px-3 py-1.5 rounded-lg bg-[#1e293b] text-xs text-slate-200 disabled:opacity-40">{copied ? ui.copied : labels.copy}</button>
              <button onClick={download} disabled={!markdown} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs text-white disabled:opacity-40">{ui.download}</button>
            </div>
          </div>
          <pre className="h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown || labels.empty}</pre>
        </div>
      </div>
    </div>
  );
}

type PdfMessageType = 'success' | 'warning' | 'error' | 'info';

function PdfMarkdownTool({ language }: { language: Language }) {
  const labels = {
    eyebrow: localeValue(language, { zh: '浏览器在线转换，仅支持文字型PDF', en: 'Browser conversion, text PDFs only', ja: 'ブラウザ内変換、テキストPDFのみ対応', es: 'Conversión en el navegador, solo PDF de texto', de: 'Browser-Konvertierung, nur Text-PDFs' }),
    intro: localeValue(language, { zh: '选择文字型PDF，文件会在当前浏览器中处理，不上传到服务器。', en: 'Choose a text-based PDF. It is processed in your browser and is not uploaded.', ja: 'テキストPDFを選択してください。ブラウザ内で処理し、アップロードしません。', es: 'Elige un PDF de texto. Se procesa en el navegador y no se sube.', de: 'Text-PDF auswählen. Die Verarbeitung erfolgt im Browser ohne Upload.' }),
    drop: localeValue(language, { zh: '拖入或选择文字型PDF', en: 'Drop or choose a text-based PDF', ja: 'テキストPDFをドロップまたは選択', es: 'Suelta o elige un PDF de texto', de: 'Text-PDF ablegen oder auswählen' }),
    local: localeValue(language, { zh: '浏览器本地处理，文件留在你的电脑上。', en: 'Local browser processing. The file stays on your computer.', ja: 'ブラウザ内で処理します。ファイルは端末に残ります。', es: 'Procesamiento local en el navegador. El archivo permanece en tu equipo.', de: 'Lokale Verarbeitung im Browser. Die Datei bleibt auf deinem Gerät.' }),
  };
  const ui = {
    invalidFile: localeValue(language, { zh: '请选择PDF文件。', en: 'Please choose a PDF file.', ja: 'PDFファイルを選択してください。', es: 'Elige un archivo PDF.', de: 'Wähle eine PDF-Datei aus.' }),
    noSelectableText: localeValue(language, { zh: '没有检测到可选文字。这看起来是扫描版或图片型PDF，网页端不支持处理，请使用本地Unlimited-OCRSkill。', en: 'No selectable text was found. This appears to be a scanned or image-only PDF, which is not supported online. Use the local Unlimited-OCRSkill.', ja: '選択できる文字が見つかりません。スキャンまたは画像だけのPDFのようです。オンラインでは対応していないため、ローカルのUnlimited-OCRSkillを使用してください。', es: 'No se encontró texto seleccionable. Parece un PDF escaneado o solo de imagen, que no se admite en línea. Usa Unlimited-OCRSkill local.', de: 'Es wurde kein markierbarer Text gefunden. Dies scheint eine gescannte oder bildbasierte PDF zu sein, die online nicht unterstützt wird. Nutze das lokale Unlimited-OCRSkill.' }),
    converted: localeValue(language, { zh: '已在当前浏览器完成转换，PDF没有上传到服务器。', en: 'Converted in this browser. The PDF was not uploaded.', ja: 'このブラウザで変換しました。PDFはアップロードされていません。', es: 'Convertido en este navegador. El PDF no se ha subido.', de: 'In diesem Browser konvertiert. Die PDF wurde nicht hochgeladen.' }),
    failed: localeValue(language, { zh: 'PDF读取失败，请换一个文字型PDF重试。', en: 'The PDF could not be read. Try another text-based PDF.', ja: 'PDFを読み取れませんでした。別のテキストPDFで試してください。', es: 'No se pudo leer el PDF. Prueba con otro PDF de texto.', de: 'Die PDF konnte nicht gelesen werden. Versuche eine andere textbasierte PDF.' }),
    extracting: localeValue(language, { zh: '正在提取文字...', en: 'Extracting text...', ja: '文字を抽出しています...', es: 'Extrayendo texto...', de: 'Text wird extrahiert...' }),
    result: localeValue(language, { zh: 'Markdown结果', en: 'Markdown result', ja: 'Markdownの結果', es: 'Resultado Markdown', de: 'Markdown-Ergebnis' }),
    copied: localeValue(language, { zh: '已复制', en: 'Copied', ja: 'コピーしました', es: 'Copiado', de: 'Kopiert' }),
    copy: localeValue(language, { zh: '复制', en: 'Copy', ja: 'コピー', es: 'Copiar', de: 'Kopieren' }),
    download: localeValue(language, { zh: '下载Markdown', en: 'Download Markdown', ja: 'Markdownを保存', es: 'Descargar Markdown', de: 'Markdown laden' }),
    pagePrefix: localeValue(language, { zh: '第', en: 'Page ', ja: 'ページ', es: 'Página ', de: 'Seite ' }),
    pageSuffix: localeValue(language, { zh: '页', en: '', ja: '', es: '', de: '' }),
    scanNote: localeValue(language, { zh: '扫描版或图片型PDF不支持网页端处理，请使用本地', en: 'Scanned or image-only PDFs are not supported online. Use the local ', ja: 'スキャンまたは画像だけのPDFはオンラインに対応していません。ローカルの', es: 'Los PDF escaneados o solo de imagen no se admiten en línea. Usa ', de: 'Gescannte oder bildbasierte PDFs werden online nicht unterstützt. Nutze ' }),
    scanNoteEnd: localeValue(language, { zh: '进行OCR。', en: ' for OCR.', ja: 'をOCRに使用してください。', es: ' local para OCR.', de: ' für OCR.' }),
  };
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<PdfMessageType>('info');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setMarkdown('');
    setMessage('');
    setMessageType('info');
    setProgress(0);

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setMessage(ui.invalidFile);
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.mjs?url'),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await selectedFile.arrayBuffer()) }).promise;
      const pages: Array<{ number: number; text: string }> = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setProgress(Math.round((pageNumber / pdf.numPages) * 100));
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str?: string; hasEOL?: boolean }>;
        const pageText = items.map((item, index) => {
          const value = item.str || '';
          const nextValue = items[index + 1]?.str || '';
          if (!value || item.hasEOL) return `${value}\n`;
          const joinsCjk = /[\u4e00-\u9fff]$/.test(value) && /^[\u4e00-\u9fff]/.test(nextValue);
          const startsPunctuation = /^[，。！？；：、）》】」』”’]/.test(nextValue);
          return `${value}${joinsCjk || startsPunctuation ? '' : ' '}`;
        }).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        if (pageText) pages.push({ number: pageNumber, text: pageText });
      }

      if (!pages.length) {
        setMessage(ui.noSelectableText);
        setMessageType('warning');
        return;
      }

      const title = selectedFile.name.replace(/\.pdf$/i, '').replace(/"/g, '\\"');
      const body = pages.map(page => `## ${ui.pagePrefix}${page.number}${ui.pageSuffix}\n\n${page.text}`).join('\n\n');
      setMarkdown(`---\ntitle: "${title}"\nsource_file: "${selectedFile.name.replace(/"/g, '\\"')}"\nfile_type: "text-pdf"\npage_count: ${pdf.numPages}\n---\n\n# ${title}\n\n${body}`);
      setMessage(ui.converted);
      setMessageType('success');
    } catch (error) {
      console.error('PDF conversion failed', error);
      setMessage(ui.failed);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!markdown) return;
    const url = URL.createObjectURL(new Blob([`${markdown}\n`], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace(/\.pdf$/i, '') || 'herdown-pdf'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const messageClass = messageType === 'warning'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    : messageType === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-200'
      : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{labels.eyebrow}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{toolLabel('pdf-to-markdown', language)}</h1>
        <p className="text-sm text-slate-400 mt-3 leading-7">{labels.intro}</p>
      </div>
      <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-5">
        <label
          onDragOver={event => event.preventDefault()}
          onDrop={event => { event.preventDefault(); void handleFile(event.dataTransfer.files?.[0]); }}
          className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/40 bg-[#090d12] px-5 text-center hover:border-emerald-400 transition"
        >
          <FileText className="w-10 h-10 text-emerald-400 mb-3" />
          <span className="text-sm text-slate-200">{file?.name || labels.drop}</span>
          <span className="text-xs leading-6 text-slate-500 mt-2">{labels.local}</span>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={event => void handleFile(event.target.files?.[0])} />
        </label>
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-7 text-amber-100">
          {ui.scanNote}<a href="/skill" className="text-amber-300 underline underline-offset-4 hover:text-amber-200">Unlimited-OCRSkill</a>{ui.scanNoteEnd}
        </div>
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400"><span>{ui.extracting}</span><span>{progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[#090d12]"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        {message && <div className={`rounded-xl border p-4 text-sm leading-7 ${messageClass}`}>{message}</div>}
      </div>
      {markdown && (
        <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between gap-3"><span className="font-bold text-white">{ui.result}</span><div className="flex gap-2"><button onClick={() => void copy()} className="px-3 py-1.5 rounded-lg bg-[#1e293b] text-xs text-slate-200">{copied ? ui.copied : ui.copy}</button><button onClick={download} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs text-white hover:bg-emerald-500">{ui.download}</button></div></div>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown}</pre>
        </div>
      )}
      <ToolSeoContent slug="pdf-to-markdown" language={language} />
    </div>
  );
}

type OfficeKind = 'word' | 'ppt' | 'excel';

const officeFileConfig: Record<OfficeKind, { extension: string; accept: string; title: string; enTitle: string }> = {
  word: { extension: 'docx', accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx', title: 'Word转Markdown', enTitle: 'Word to Markdown' },
  ppt: { extension: 'pptx', accept: 'application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx', title: 'PPT转Markdown', enTitle: 'PPT to Markdown' },
  excel: { extension: 'xlsx', accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx', title: 'Excel转Markdown', enTitle: 'Excel to Markdown' },
};

const markdownCell = (value: unknown) => String(value ?? '').replace(/\r?\n/g, '<br>').replace(/\|/g, '\\|').trim();

const rowsToMarkdown = (rows: Array<Array<unknown>>) => {
  const width = Math.max(...rows.map(row => row.length), 0);
  if (!width) return '_Empty sheet_';
  const normalized = rows.map(row => Array.from({ length: width }, (_, index) => markdownCell(row[index])));
  const header = normalized[0].map(value => value || ' ');
  const divider = header.map(() => '---');
  const body = normalized.slice(1);
  return [`| ${header.join(' | ')} |`, `| ${divider.join(' | ')} |`, ...body.map(row => `| ${row.join(' | ')} |`)].join('\n');
};

const htmlToMarkdown = (html: string) => {
  const document = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = document.body.firstElementChild;
  if (!root) return '';

  const render = (node: Node, depth = 0): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof HTMLElement)) return Array.from(node.childNodes).map(child => render(child, depth)).join('');
    const content = Array.from(node.childNodes).map(child => render(child, depth)).join('');
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return `${'#'.repeat(Number(tag.slice(1)))} ${content.trim()}\n\n`;
    if (tag === 'p') return `${content.trim()}\n\n`;
    if (tag === 'br') return '\n';
    if (tag === 'strong' || tag === 'b') return `**${content.trim()}**`;
    if (tag === 'em' || tag === 'i') return `_${content.trim()}_`;
    if (tag === 'del' || tag === 's') return `~~${content.trim()}~~`;
    if (tag === 'a') return `[${content.trim()}](${node.getAttribute('href') || ''})`;
    if (tag === 'img') return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
    if (tag === 'li') return `${'  '.repeat(Math.max(depth - 1, 0))}- ${content.trim()}\n`;
    if (tag === 'ul' || tag === 'ol') return `${Array.from(node.children).map(child => render(child, depth + 1)).join('')}\n`;
    if (tag === 'table') {
      const rows = Array.from(node.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('th,td')).map(cell => markdownCell(cell.textContent)));
      return `${rowsToMarkdown(rows)}\n\n`;
    }
    return content;
  };

  return render(root).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
};

const pptSlideMarkdown = async (file: File, language: Language) => {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((left, right) => Number(left.match(/slide(\d+)\.xml$/)?.[1] || 0) - Number(right.match(/slide(\d+)\.xml$/)?.[1] || 0));
  const slides: string[] = [];

  for (const [index, slideFile] of slideFiles.entries()) {
    const xml = await zip.file(slideFile)?.async('string');
    if (!xml) continue;
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const paragraphs = Array.from(document.getElementsByTagName('*'))
      .filter(element => element.localName === 'p')
      .map(paragraph => Array.from(paragraph.getElementsByTagName('*')).filter(element => element.localName === 't').map(element => element.textContent || '').join(''))
      .map(value => value.trim())
      .filter(Boolean);
    if (paragraphs.length) slides.push(`## ${language === 'en' ? 'Slide' : '第'}${index + 1}${language === 'en' ? '' : '页'}\n\n${paragraphs.join('\n\n')}`);
  }

  return slides;
};

function OfficeMarkdownTool({ kind, language }: { kind: OfficeKind; language: Language }) {
  const config = officeFileConfig[kind];
  const info = toolPageInfo[`${kind === 'word' ? 'word' : kind === 'ppt' ? 'ppt' : 'excel'}-to-markdown` as 'word-to-markdown' | 'ppt-to-markdown' | 'excel-to-markdown'];
  const pagePath = `/${kind === 'word' ? 'word' : kind === 'ppt' ? 'ppt' : 'excel'}-to-markdown`;
  const kindNames = localeValue(language, { zh: kind === 'word' ? 'Word' : kind === 'ppt' ? 'PPTX' : 'Excel', en: kind === 'word' ? 'Word' : kind === 'ppt' ? 'PPTX' : 'Excel', ja: kind === 'word' ? 'Word' : kind === 'ppt' ? 'PPTX' : 'Excel', es: kind === 'word' ? 'Word' : kind === 'ppt' ? 'PPTX' : 'Excel', de: kind === 'word' ? 'Word' : kind === 'ppt' ? 'PPTX' : 'Excel' });
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<PdfMessageType>('info');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setMarkdown('');
    setMessage('');
    setMessageType('info');
    setProgress(0);
    if (!selectedFile.name.toLowerCase().endsWith(`.${config.extension}`)) {
      setMessage(language === 'en' ? `Please choose a ${config.extension.toUpperCase()} file.` : `请选择${config.extension.toUpperCase()}文件。`);
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      let body = '';
      if (kind === 'word') {
        // @ts-expect-error The browser bundle does not ship TypeScript declarations.
        const mammothModule = await import('mammoth/mammoth.browser.js');
        const mammoth = (mammothModule.default || mammothModule) as { convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
        const result = await mammoth.convertToHtml({ arrayBuffer: await selectedFile.arrayBuffer() });
        body = htmlToMarkdown(result.value);
        setProgress(100);
      } else if (kind === 'excel') {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array', cellDates: true });
        const sections = workbook.SheetNames.map(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as Array<Array<unknown>>;
          return `## ${sheetName}\n\n${rowsToMarkdown(rows)}`;
        });
        body = sections.join('\n\n');
        setProgress(100);
      } else {
        const slides = await pptSlideMarkdown(selectedFile, language);
        body = slides.join('\n\n');
        setProgress(100);
      }

      if (!body.trim()) {
        setMessage(language === 'en' ? 'No readable content was found in this file.' : '这个文件中没有检测到可读取的内容。');
        setMessageType('warning');
        return;
      }

      const title = selectedFile.name.replace(new RegExp(`\\.${config.extension}$`, 'i'), '').replace(/"/g, '\\"');
      setMarkdown(`---\ntitle: "${title}"\nsource_file: "${selectedFile.name.replace(/"/g, '\\"')}"\nfile_type: "${config.extension}"\n---\n\n# ${title}\n\n${body}`);
      setMessage(language === 'en' ? 'Converted in this browser. The file was not uploaded.' : '已在当前浏览器完成转换，文件没有上传到服务器。');
      setMessageType('success');
    } catch (error) {
      console.error(`${config.extension} conversion failed`, error);
      setMessage(language === 'en' ? `The ${config.extension.toUpperCase()} file could not be read. Try another file.` : `${config.extension.toUpperCase()}文件读取失败，请换一个文件重试。`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    if (!markdown) return;
    const url = URL.createObjectURL(new Blob([`${markdown}\n`], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace(new RegExp(`\\.${config.extension}$`, 'i'), '') || 'herdown-document'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const messageClass = messageType === 'warning'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    : messageType === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-200'
      : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{localeValue(language, { zh: `浏览器在线转换，支持${config.extension.toUpperCase()}文件`, en: `Browser conversion, ${config.extension.toUpperCase()} files`, ja: `ブラウザ内変換、${config.extension.toUpperCase()}ファイル`, es: `Conversión en el navegador, archivos ${config.extension.toUpperCase()}`, de: `Browser-Konvertierung, ${config.extension.toUpperCase()}-Dateien` })}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{toolLabel(`${kind === 'word' ? 'word' : kind === 'ppt' ? 'ppt' : 'excel'}-to-markdown`, language)}</h1>
        <p className="text-sm text-slate-400 mt-3 leading-7">{toolDescription(`${kind === 'word' ? 'word' : kind === 'ppt' ? 'ppt' : 'excel'}-to-markdown`, language)}</p>
      </div>
      <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-5">
        <label
          onDragOver={event => event.preventDefault()}
          onDrop={event => { event.preventDefault(); void handleFile(event.dataTransfer.files?.[0]); }}
          className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/40 bg-[#090d12] px-5 text-center hover:border-emerald-400 transition"
        >
          <FileText className="w-10 h-10 text-emerald-400 mb-3" />
          <span className="text-sm text-slate-200">{file?.name || localeValue(language, { zh: `拖入或选择${config.extension.toUpperCase()}文件`, en: `Drop or choose a ${config.extension.toUpperCase()} file`, ja: `${kindNames}ファイルをドロップまたは選択`, es: `Suelta o elige un archivo ${kindNames}`, de: `${kindNames}-Datei ablegen oder auswählen` })}</span>
          <span className="text-xs leading-6 text-slate-500 mt-2">{localeValue(language, { zh: '浏览器本地处理，文件留在你的电脑上。', en: 'Local browser processing. The file stays on your computer.', ja: 'ブラウザ内で処理します。ファイルは端末に残ります。', es: 'Procesamiento local en el navegador. El archivo permanece en tu equipo.', de: 'Lokale Verarbeitung im Browser. Die Datei bleibt auf deinem Gerät.' })}</span>
          <input type="file" accept={config.accept} className="hidden" onChange={event => void handleFile(event.target.files?.[0])} />
        </label>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-7 text-emerald-100">
          {kind === 'word'
              ? localeValue(language, { zh: 'Word正文、标题、列表、链接和表格会在浏览器本地转换。', en: 'Word text, headings, lists, links, and tables are converted locally.', ja: 'Wordの本文、見出し、リスト、リンク、表をブラウザ内で変換します。', es: 'El texto, los títulos, las listas, los enlaces y las tablas de Word se convierten localmente.', de: 'Word-Text, Überschriften, Listen, Links und Tabellen werden lokal konvertiert.' })
            : kind === 'ppt'
              ? localeValue(language, { zh: '幻灯片文字会在浏览器本地提取，图片、动画和视觉位置不会重建。', en: 'Slide text is extracted locally. Images, animations, and visual positioning are not reconstructed.', ja: 'スライドの文字をブラウザ内で抽出します。画像、アニメーション、配置は再現されません。', es: 'El texto de las diapositivas se extrae localmente. No se reconstruyen imágenes, animaciones ni posiciones visuales.', de: 'Folientext wird lokal extrahiert. Bilder, Animationen und visuelle Positionen werden nicht rekonstruiert.' })
              : localeValue(language, { zh: '各个工作表会在浏览器本地转换为Markdown表格。', en: 'Worksheets are converted into Markdown tables locally.', ja: '各ワークシートをブラウザ内でMarkdown表に変換します。', es: 'Las hojas se convierten localmente en tablas Markdown.', de: 'Arbeitsblätter werden lokal in Markdown-Tabellen umgewandelt.' })}
        </div>
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400"><span>{language === 'en' ? 'Extracting content...' : '正在提取内容...'}</span><span>{progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-[#090d12]"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        {message && <div className={`rounded-xl border p-4 text-sm leading-7 ${messageClass}`}>{message}</div>}
      </div>
      {markdown && (
        <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between gap-3"><span className="font-bold text-white">{language === 'en' ? 'Markdown result' : 'Markdown结果'}</span><div className="flex gap-2"><button onClick={() => void copy()} className="px-3 py-1.5 rounded-lg bg-[#1e293b] text-xs text-slate-200">{copied ? (language === 'en' ? 'Copied' : '已复制') : (language === 'en' ? 'Copy' : '复制')}</button><button onClick={download} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs text-white hover:bg-emerald-500">{language === 'en' ? 'Download Markdown' : '下载Markdown'}</button></div></div>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown}</pre>
        </div>
      )}
    </div>
  );
}

function LocalToolGuide({ slug, language }: { slug: 'pdf-to-markdown' | 'word-to-markdown' | 'ppt-to-markdown' | 'excel-to-markdown'; language: Language }) {
  const ui = messages[language];
  const info = toolPageInfo[slug];
  const extension = slug === 'word-to-markdown' ? 'docx' : slug === 'ppt-to-markdown' ? 'pptx' : slug === 'excel-to-markdown' ? 'xlsx' : 'pdf';
  const sampleFileName = language === 'en' ? `your-file.${extension}` : `你的文件.${extension}`;
  const command = ['python -m pip install markitdown', `markitdown "${sampleFileName}" > output.md`].join('\n');
  const details = language === 'en' ? {
    'word-to-markdown': { suitable: 'DOCX files with headings, paragraphs, lists, tables, and links.', output: 'Produces structured Markdown that is easy to search, edit, and send to an AI workflow.', note: 'Complex layout, tracked changes, and embedded objects may need a quick review.' },
    'pdf-to-markdown': { suitable: 'Text-based PDFs such as reports, papers, manuals, and articles.', output: 'Extracts readable text and document structure into Markdown.', note: 'Scanned PDFs are images. Use the local Unlimited-OCRSkill for those files.' },
    'ppt-to-markdown': { suitable: 'PPT and PPTX presentations with slide titles, text, and tables.', output: 'Turns slide content into a linear Markdown document for reading and search.', note: 'Visual positioning, animations, and charts may not map perfectly to Markdown.' },
    'excel-to-markdown': { suitable: 'XLSX spreadsheets with worksheets, tables, and cell values.', output: 'Converts worksheet data into Markdown tables for review and AI workflows.', note: 'Formulas are exported as available values; charts and complex formatting may need review.' },
  }[slug] : {
    'word-to-markdown': { suitable: '包含标题、段落、列表、表格和链接的DOCX文档。', output: '整理成结构清晰的Markdown，方便搜索、编辑和交给AI工作流。', note: '复杂排版、修订记录和嵌入对象可能需要人工检查。' },
    'pdf-to-markdown': { suitable: '报告、论文、说明书和文章等可提取文字的PDF。', output: '提取可阅读的文字和文档结构，整理成Markdown。', note: '扫描PDF本质上是图片，请使用本地Unlimited-OCRSkill。' },
    'ppt-to-markdown': { suitable: '包含幻灯片标题、文字和表格的PPT、PPTX演示文稿。', output: '把幻灯片内容整理成便于阅读和搜索的Markdown文档。', note: '视觉位置、动画和图表无法完全还原为Markdown。' },
    'excel-to-markdown': { suitable: '包含工作表、表格和单元格内容的XLSX电子表格。', output: '把工作表数据转换成Markdown表格，方便查看和交给AI工作流。', note: '公式会按可读取的值导出，图表和复杂格式可能需要检查。' },
  }[slug];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{language === 'en' ? 'Local tool, no upload' : '本地工具，不上传文件'}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{toolLabel(slug, language)}</h1>
        <p className="text-sm text-slate-400 mt-3 leading-7">{toolDescription(slug, language)}</p>
      </div>
      <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white">{language === 'en' ? 'How to use' : '怎么用'}</h2>
          <p className="text-sm text-slate-400 mt-2 leading-7">{language === 'en' ? 'Install local MarkItDown and run the command below. Your file stays on your computer.' : '安装本地MarkItDown后，在终端执行下面的命令。文件留在你的电脑上，Herdown不接收文件内容。'}</p>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-xs leading-7 text-emerald-200">{command}</pre>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#0a0f16] border border-[#1e293b] p-4">
            <h3 className="text-sm font-bold text-white">{language === 'en' ? 'Suitable files' : '适合的文件'}</h3>
            <p className="mt-2 text-xs leading-6 text-slate-400">{details.suitable}</p>
          </div>
          <div className="rounded-xl bg-[#0a0f16] border border-[#1e293b] p-4">
            <h3 className="text-sm font-bold text-white">{language === 'en' ? 'Output' : '输出结果'}</h3>
            <p className="mt-2 text-xs leading-6 text-slate-400">{details.output}</p>
          </div>
          <div className="rounded-xl bg-[#0a0f16] border border-[#1e293b] p-4">
            <h3 className="text-sm font-bold text-white">{language === 'en' ? 'Please note' : '使用提示'}</h3>
            <p className="mt-2 text-xs leading-6 text-slate-400">{details.note}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-6">{language === 'en' ? 'For scans or screenshots, use the local Unlimited-OCRSkill. It runs locally and needs no extra Herdown server.' : '复杂扫描件或截图请使用本地Unlimited-OCRSkill。它在本地运行，不需要Herdown额外服务器。'}</p>
      </div>
    </div>
  );
}

function PricingPage({ language, onUpgrade }: { language: Language; onUpgrade: () => void }) {
  const isEnglish = language === 'en';
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'One-time credit packs' : '一次性点数包'}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{isEnglish ? 'Choose the amount that fits your workflow' : '选择适合你的使用额度'}</h1>
        <p className="text-sm text-slate-400 mt-3 leading-7">{isEnglish ? 'The free plan includes 1,000 webpage parses per user each month. Paid credits do not expire and do not auto-renew.' : '免费用户每月有1,000次网页解析额度。付费点数不过期，不自动续费。'}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {pricingPackages.map(item => (
          <div key={item.code} className={`rounded-2xl border bg-[#0f1722] p-5 ${item.featured ? 'border-emerald-500 shadow-lg shadow-emerald-950/20' : 'border-[#1e293b]'}`}>
            <p className="text-sm font-semibold text-emerald-300">{isEnglish ? (item.code === 'starter' ? 'Starter' : item.code === 'standard' ? 'Standard' : 'Bulk') : item.label}</p>
            <p className="mt-4 text-3xl font-black text-white">US${item.price}</p>
            <p className="mt-2 text-sm text-slate-300">{item.credits}{isEnglish ? ' parses' : '次解析额度'}</p>
            <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'For webpage conversion, API, MCP, and CLI.' : '支持网页转换、API、MCP和CLI。'}</p>
            <button onClick={onUpgrade} className="mt-5 w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-500">{isEnglish ? 'Upgrade now' : '立即升级'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UnifiedMaterialsTool({ language }: { language: Language }) {
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [message, setMessage] = useState('');

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setMarkdown('');
    const name = selectedFile.name.toLowerCase();
    if (/\.(txt|md)$/.test(name)) {
      const text = await selectedFile.text();
      setMarkdown(text.split(/\r?\n/).map(line => line.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim());
      setMessage(language === 'en' ? 'Processed locally. The file was not uploaded.' : '已在本地处理，文件没有上传到服务器。');
      return;
    }
    if (selectedFile.type.startsWith('image/')) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(selectedFile);
      });
      setMarkdown(`![${selectedFile.name}](${dataUrl})`);
      setMessage(language === 'en' ? 'The image is ready as Markdown. Use the image text tool if you need to recognize text.' : '图片已整理为Markdown。如需识别图片文字，请进入图片文字工具。');
      return;
    }
    if (/\.(docx|pdf|pptx|xlsx)$/.test(name)) {
      setMessage(language === 'en' ? 'This format needs a dedicated processing step. Follow the format guide to continue.' : '这种格式需要进入对应的专用页面，请按照页面提示继续处理。');
      return;
    }
    setMessage(language === 'en' ? 'This file type is not supported yet.' : '暂不支持这个文件类型。');
  };

  const download = () => {
    if (!markdown) return;
    const url = URL.createObjectURL(new Blob([`${markdown}\n`], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace(/\.[^.]+$/, '') || 'herdown-material'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fileName = file?.name.toLowerCase() || '';
  const guide = /\.docx$/.test(fileName)
    ? { href: '/word-to-markdown', zh: '打开Word转换', en: 'Open Word converter' }
    : /\.pdf$/.test(fileName)
      ? { href: '/pdf-to-markdown', zh: '打开PDF转换', en: 'Open PDF converter' }
      : /\.pptx$/.test(fileName)
        ? { href: '/ppt-to-markdown', zh: '打开PPT转换', en: 'Open PPT converter' }
        : /\.xlsx$/.test(fileName)
          ? { href: '/excel-to-markdown', zh: '打开Excel转换', en: 'Open Excel converter' }
          : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{language === 'en' ? 'Material organizer' : '资料整理入口'}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{toolLabel('tools', language)}</h1>
        <p className="text-sm text-slate-400 mt-3 leading-7">{language === 'en' ? 'Choose a local file and prepare it as clean Markdown. Use the homepage for webpage links.' : '选择本地资料并整理成干净Markdown。网页链接请使用首页转换。'}</p>
      </div>
      <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-5">
        <div className="flex items-center gap-2 text-white font-bold"><Upload className="w-5 h-5 text-emerald-400" />{language === 'en' ? 'Choose a local file' : '选择本地资料'}</div>
        <label onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void handleFile(event.dataTransfer.files?.[0]); }} className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/40 bg-[#090d12] px-5 text-center hover:border-emerald-400 transition">
          <Upload className="w-9 h-9 text-emerald-400 mb-3" />
          <span className="text-sm text-slate-200">{file?.name || (language === 'en' ? 'Drop or choose a local file' : '拖入或选择本地资料')}</span>
          <span className="text-xs leading-6 text-slate-500 mt-2">{language === 'en' ? 'TXT, Markdown, and images work here. Word, PDF, PPT, and Excel continue in their matching format guide.' : 'TXT、Markdown和图片可在这里整理；Word、PDF、PPT和Excel请进入对应格式页面。'}</span>
          <input type="file" accept=".txt,.md,.docx,.pdf,.pptx,.xlsx,image/*" className="hidden" onChange={event => void handleFile(event.target.files?.[0])} />
        </label>
        {!file && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [language === 'en' ? 'TXT and Markdown' : 'TXT和Markdown', language === 'en' ? 'Prepare directly in the browser.' : '可直接整理。'],
              [language === 'en' ? 'Images' : '图片', language === 'en' ? 'Prepare as Markdown images.' : '整理为Markdown图片。'],
              [language === 'en' ? 'Word, PDF, PPT, Excel' : 'Word、PDF、PPT、Excel', language === 'en' ? 'Open the matching format guide for the next step.' : '进入对应格式页面继续处理。'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-[#1e293b] bg-[#090d12] p-4">
                <p className="text-sm font-semibold text-slate-200">{title}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        )}
        {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-6 text-emerald-200">{message}{guide && <a href={localizedHref(guide.href, language)} className="ml-2 text-emerald-300 underline underline-offset-4 hover:text-emerald-200">{language === 'en' ? guide.en : guide.zh}</a>}</div>}
      </div>
      {markdown && (
        <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between gap-3"><span className="font-bold text-white">{language === 'en' ? 'Markdown result' : 'Markdown结果'}</span><button onClick={download} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs text-white hover:bg-emerald-500">{language === 'en' ? 'Download Markdown' : '下载Markdown'}</button></div>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown}</pre>
        </div>
      )}
    </div>
  );
}


function ProfessionalDocsPage({ language }: { language: Language }) {
  const isEnglish = language === 'en';
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const apiBase = 'https://api.herdown.com';
  const sections = [
    {
      title: isEnglish ? 'Get started' : '开始使用',
      items: [
        ['overview', isEnglish ? 'What is Herdown' : 'Herdown是什么'],
        ['getting-started', isEnglish ? 'First parse' : '第一次解析'],
      ],
    },
    {
      title: isEnglish ? 'Account and usage' : '账户和使用',
      items: [
        ['authentication', isEnglish ? 'API key' : 'API密钥'],
        ['quota', isEnglish ? 'Quota and billing' : '额度和计费'],
      ],
    },
    {
      title: 'RESTAPI',
      items: [
        ['rest-api', isEnglish ? 'Overview' : '接口概览'],
        ['parse', 'POST /v1/parse'],
        ['crawl', 'POST /v1/crawl'],
        ['errors', isEnglish ? 'Errors and limits' : '错误和限制'],
      ],
    },
    {
      title: 'MCP',
      items: [
        ['mcp', isEnglish ? 'Remote MCP' : '远程MCP'],
      ],
    },
    {
      title: isEnglish ? 'Agent tools' : 'Agent工具',
      items: [
        ['skill', 'Skill'],
        ['cli', 'CLI'],
      ],
    },
    {
      title: isEnglish ? 'More' : '更多',
      items: [
        ['local-tools', isEnglish ? 'Local tools' : '本地工具'],
        ['integrations', isEnglish ? 'Integrations' : '工作流接入'],
        ['faq', 'FAQ'],
      ],
    },
  ];
  const quickstartExample = ['curl -X POST ' + apiBase + '/v1/parse \\', '  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\', '  -H "Content-Type: application/json" \\', "  -d '{\"url\":\"https://example.com/article\"}'"].join('\n');
  const crawlExample = ['curl -X POST ' + apiBase + '/v1/crawl \\', '  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\', '  -H "Content-Type: application/json" \\', "  -d '{\"url\":\"https://example.com\",\"limit\":5}'"].join('\n');
  const mcpExample = ['{', '  "mcpServers": {', '    "herdown": {', '      "url": "https://api.herdown.com/mcp"', '    }', '  }', '}'].join('\n');
  const cliExample = ['npx @herdown/cli "https://example.com/article"', 'npx @herdown/cli "https://example.com/article" -o article.md', 'npx @herdown/cli "https://example.com/article" -k "sk_live_YOUR_API_KEY"'].join('\n');
  const skillExample = (language === 'en'
    ? ['Use Herdown when the user asks to:', '- turn a public webpage into clean Markdown', '- prepare material for an AI workflow or knowledge tool', '- preserve article metadata and image links', '', 'Choose the browser, RESTAPI, MCP, or CLI path based on the user environment.', 'Do not claim to access private pages or bypass a login.']
    : language === 'ja'
      ? ['次の依頼ではHerdownを使います:', '- 公開WebページをクリーンなMarkdownに変換する', '- AIワークフローやナレッジツール用の資料を準備する', '- 記事のメタデータと画像リンクを保持する', '', '利用環境に応じてブラウザ、RESTAPI、MCP、CLIの経路を選びます。', '非公開ページへのアクセスやログイン回避を案内しません。']
      : language === 'es'
        ? ['Usa Herdown cuando el usuario pida:', '- convertir una página web pública en Markdown limpio', '- preparar material para un flujo de IA o una herramienta de conocimiento', '- conservar los metadatos del artículo y los enlaces de imágenes', '', 'Elige la ruta de navegador,RESTAPI,MCP o CLI según el entorno del usuario.', 'No afirmes que puedes acceder a páginas privadas ni evadir un inicio de sesión.']
        : language === 'de'
          ? ['Verwende Herdown,wenn der Nutzer darum bittet:', '- eine öffentliche Webseite in sauberes Markdown umzuwandeln', '- Material für einen KI-Workflow oder ein Wissenswerkzeug vorzubereiten', '- Artikelmetadaten und Bildlinks zu erhalten', '', 'Wähle je nach Umgebung des Nutzers den Browser-,RESTAPI-,MCP-oder CLI-Weg.', 'Behaupte nicht,auf private Seiten zugreifen oder eine Anmeldung umgehen zu können.']
          : ['用户提出以下需求时使用Herdown:', '- 把公开网页转换为干净Markdown', '- 为AI工作流或知识工具准备资料', '- 保留文章元数据和图片链接', '', '根据用户环境选择浏览器、RESTAPI、MCP或CLI路径。', '不要声称可以访问私有页面或绕过登录。']).join('\n');

  const copyCode = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedBlock(id);
      window.setTimeout(() => setCopiedBlock(current => current === id ? null : current), 1400);
    } catch {
      setCopiedBlock(null);
    }
  };

  const codeBlock = (id: string, label: string, value: string) => (
    <div className="overflow-hidden rounded-xl border border-[#243244] bg-[#080c11]">
      <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <button onClick={() => void copyCode(id, value)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-[#162231] hover:text-emerald-300">
          {copiedBlock === id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copiedBlock === id ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-7 text-emerald-200">{value}</pre>
    </div>
  );

  const sectionTitle = (id: string, title: string, description: string) => (
    <div id={id} className="scroll-mt-8 border-b border-[#1e293b] pb-4">
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[220px_minmax(0,1fr)_180px]">
        <aside className="hidden self-start xl:sticky xl:top-6 xl:block">
          <div className="rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300"><FileText className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-bold text-white">HerdownDocs</p>
                <p className="text-[11px] text-slate-500">v1</p>
              </div>
            </div>
            <nav className="space-y-4">
              {sections.map(section => (
                <div key={section.title}>
                  <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{section.title}</p>
                  <div className="space-y-0.5">
                    {section.items.map(([id, label]) => (
                      <a key={id} href={'#' + id} className="block rounded-lg px-2 py-1.5 text-xs text-slate-400 transition hover:bg-[#172333] hover:text-emerald-300">{label}</a>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <details className="xl:hidden rounded-2xl border border-[#1e293b] bg-[#0d131c]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white">{isEnglish ? 'Browse documentation' : '浏览文档目录'}</summary>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-[#1e293b] p-4 sm:grid-cols-3">
            {sections.map(section => (
              <div key={section.title}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{section.title}</p>
                <div className="space-y-1">
                  {section.items.map(([id, label]) => <a key={id} href={'#' + id} className="block py-1 text-xs text-slate-400 hover:text-emerald-300">{label}</a>)}
                </div>
              </div>
            ))}
          </div>
        </details>

        <article className="min-w-0 space-y-12">
          <section id="overview" className="scroll-mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">{isEnglish ? 'Developer documentation' : '开发者文档'}</p>
            <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{isEnglish ? 'Clean materials for AI agents' : '为AIAgent准备干净资料'}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">{isEnglish ? 'Herdown turns public webpages, documents, and images into clean Markdown. Use the web interface for a quick result, or connect the API, MCP, Skill, CLI, and local tools to your AI agent.' : 'Herdown把公开网页、文档和图片整理成干净Markdown。想快速使用就打开网页入口，需要接入自己的AIAgent就使用API、MCP、Skill、CLI和本地工具。'}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#getting-started" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-[#07110d] hover:bg-emerald-400">{isEnglish ? 'Start here' : '从这里开始'}</a>
              <a href="#rest-api" className="rounded-lg border border-[#2a3a4d] px-3 py-2 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300">RESTAPI</a>
              <a href="#skill" className="rounded-lg border border-[#2a3a4d] px-3 py-2 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300">Skill</a>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
            <p className="text-sm font-semibold text-emerald-300">{isEnglish ? 'One clear boundary' : '一个清晰边界'}</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{isEnglish ? 'Herdown prepares clean source material. It does not provide a complete knowledge-base Q&A system. Give the Markdown to the AI agent or knowledge tool you already use.' : 'Herdown负责准备干净资料，不负责搭建完整知识库问答系统。解析后的Markdown可以交给你已经在使用的AIAgent或知识库工具。'}</p>
          </section>

          <section className="space-y-5">
            {sectionTitle('getting-started', isEnglish ? 'Get started' : '开始使用', isEnglish ? 'The fastest path is one public URL and one click.' : '最快的方式是粘贴一个公开网页链接，然后点击一次。')}
            <div className="grid gap-3 md:grid-cols-3">
              {[
                [isEnglish ? 'Open' : '打开', isEnglish ? 'Open the homepage or the unified tools page.' : '打开首页或统一工具入口。'],
                [isEnglish ? 'Convert' : '转换', isEnglish ? 'Paste a public URL and click Convert to Markdown.' : '粘贴公开网页链接，点击转换为Markdown。'],
                [isEnglish ? 'Use' : '使用', isEnglish ? 'Copy or download the result, then give it to your AI agent.' : '复制或下载结果，再交给你的AIAgent。'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
            <a href={localizedHref('/tools', language)} className="inline-flex rounded-lg border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10">{isEnglish ? 'Open unified tools' : '打开统一工具入口'}</a>
          </section>

          <section className="space-y-5">
            {sectionTitle('authentication', isEnglish ? 'API key and authentication' : 'API密钥和身份验证', isEnglish ? 'Create a key from the API page. Keep it on your server or in a local environment variable.' : '在API页面创建密钥。密钥应保存在自己的服务器或本地环境变量中。')}
            <a href={localizedHref('/api', language)} className="inline-flex rounded-lg border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10">{isEnglish ? 'Open API console' : '打开API控制台'}</a>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-7 text-amber-100">
              {isEnglish ? 'Do not put a live API key in frontend code, a public repository, or a screenshot.' : '不要把正式API密钥放进前端代码、公开仓库或截图。'}
            </div>
            {codeBlock('env', isEnglish ? 'Environment variable' : '环境变量', 'export HERDOWN_API_KEY="sk_live_YOUR_API_KEY"')}
          </section>

          <section className="space-y-5">
            {sectionTitle('quota', isEnglish ? 'Quota and billing' : '额度和计费', isEnglish ? 'Free usage is monthly. Paid packages are one-time credits and do not renew automatically.' : '免费额度按月计算。付费套餐是一次性点数，不会自动续费。')}
            <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
              <table className="min-w-[560px] w-full text-left text-xs">
                <thead className="bg-[#111a26] text-slate-300"><tr><th className="px-4 py-3">{isEnglish ? 'Access' : '类型'}</th><th className="px-4 py-3">{isEnglish ? 'Allowance' : '额度'}</th><th className="px-4 py-3">{isEnglish ? 'Crawl limit' : '全站抓取限制'}</th></tr></thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-400">
                  <tr><td className="px-4 py-3">{isEnglish ? 'Free' : '免费用户'}</td><td className="px-4 py-3">{isEnglish ? '1,000 parses per month' : '每月1000次解析'}</td><td className="px-4 py-3">{isEnglish ? 'Up to 5 pages per request' : '每次最多5页'}</td></tr>
                  <tr><td className="px-4 py-3">{isEnglish ? 'Paid credits' : '付费点数'}</td><td className="px-4 py-3">{isEnglish ? 'One-time credits, no auto-renewal' : '一次性点数，不自动续费'}</td><td className="px-4 py-3">{isEnglish ? 'Up to 100 pages per request within balance' : '每次最多100页，不能超过剩余点数'}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-5">
            {sectionTitle('rest-api', isEnglish ? 'RESTAPI' : 'RESTAPI接口', isEnglish ? 'HTTP endpoints for your backend, scripts, and workflow tools.' : '适合后端、脚本和工作流平台调用的HTTP接口。')}
            <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-5 text-sm leading-7 text-slate-400">
              <p>{isEnglish ? 'Base URL' : '基础地址'}：<code className="text-emerald-300">{apiBase}</code></p>
              <p>{isEnglish ? 'Method' : '请求方式'}：<code className="text-emerald-300">POST</code></p>
              <p>{isEnglish ? 'Authentication' : '身份验证'}：<code className="text-emerald-300">Authorization: Bearer YOUR_API_KEY</code></p>
              <p>{isEnglish ? 'Content type' : '内容类型'}：<code className="text-emerald-300">application/json</code></p>
            </div>
          </section>

          <section className="space-y-5">
            {sectionTitle('parse', 'POST /v1/parse', isEnglish ? 'Parse one public webpage or raw HTML into clean Markdown.' : '把一个公开网页或HTML源码解析成干净Markdown。')}
            {codeBlock('parse', isEnglish ? 'Request' : '请求', quickstartExample)}
            <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
              <table className="min-w-[560px] w-full text-left text-xs">
                <thead className="bg-[#111a26] text-slate-300"><tr><th className="px-4 py-3">Field</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">{isEnglish ? 'Description' : '说明'}</th></tr></thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-400">
                  <tr><td className="px-4 py-3 text-emerald-300">url</td><td className="px-4 py-3">string</td><td className="px-4 py-3">{isEnglish ? 'Public HTTP or HTTPS URL.' : '公开的HTTP或HTTPS网页链接。'}</td></tr>
                  <tr><td className="px-4 py-3 text-emerald-300">html</td><td className="px-4 py-3">string</td><td className="px-4 py-3">{isEnglish ? 'Optional raw HTML. Use url or html.' : '可选的HTML源码。url和html至少填写一个。'}</td></tr>
                </tbody>
              </table>
            </div>
            {codeBlock('response', isEnglish ? 'Response' : '响应', ['{', '  "success": true,', '  "title": "Example article",', '  "markdown": "# Clean Markdown...",', '  "images": [],', '  "elapsed_ms": 120,', '  "source_tokens": 18420,', '  "markdown_tokens": 2180,', '  "token_savings": 16240,', '  "token_savings_percent": 88.2', '}'].join('\n'))}
            <p className="text-sm leading-7 text-slate-400">{isEnglish ? 'images is an array of image URL strings extracted from the source page. Markdown may also contain image references; the array is provided so clients can list or download them separately.' : 'images是从原网页提取出的图片URL字符串数组。Markdown中也可能包含图片引用，单独返回这个数组方便客户端列出或下载图片。'}</p>
          </section>

          <section className="space-y-5">
            {sectionTitle('crawl', 'POST /v1/crawl', isEnglish ? 'Discover and parse pages from a public website or sitemap.' : '从公开网站或Sitemap发现并解析网页。')}
            {codeBlock('crawl', 'Request', crawlExample)}
            {codeBlock('crawl-response', 'Response', ['{', '  "success": true,', '  "domain": "https://example.com",', '  "total_pages": 2,', '  "results": [', '    {', '      "url": "https://example.com/guide",', '      "title": "Guide",', '      "markdown": "# Guide...",', '      "elapsed_ms": 180', '    }', '  ],', '  "elapsed_ms": 420', '}'].join('\n'))}
            <p className="text-sm leading-7 text-slate-400">{isEnglish ? 'Each results item contains url, title, markdown, and elapsed_ms. Free users are limited to 5 pages per request. Paid crawl can use up to 100 pages within the available balance.' : 'results中的每项包括url、title、markdown和elapsed_ms。免费用户每次最多5页，付费用户每次最多100页，但不能超过剩余点数。'}</p>
          </section>

          <section className="space-y-5">
            {sectionTitle('errors', isEnglish ? 'Errors and limits' : '错误和限制', isEnglish ? 'Use the HTTP status and code field to decide whether to retry or ask the user to act.' : '结合HTTP状态码和code字段判断是重试，还是提示用户处理。')}
            <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111a26] text-slate-300"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">{isEnglish ? 'What to do' : '处理方式'}</th></tr></thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-400">
                  <tr><td className="px-4 py-3 text-amber-300">INVALID_INPUT</td><td className="px-4 py-3">400</td><td className="px-4 py-3">{isEnglish ? 'Check url or html.' : '检查url或html参数。'}</td></tr>
                  <tr><td className="px-4 py-3 text-amber-300">FORBIDDEN_TARGET</td><td className="px-4 py-3">400</td><td className="px-4 py-3">{isEnglish ? 'Private and internal addresses are not allowed.' : '不能访问内网和私有地址。'}</td></tr>
                  <tr><td className="px-4 py-3 text-amber-300">FREE_QUOTA_EXHAUSTED</td><td className="px-4 py-3">402</td><td className="px-4 py-3">{isEnglish ? 'Wait for the monthly reset or upgrade.' : '等待下月额度恢复，或购买付费点数。'}</td></tr>
                  <tr><td className="px-4 py-3 text-amber-300">CREDITS_EXHAUSTED</td><td className="px-4 py-3">402</td><td className="px-4 py-3">{isEnglish ? 'Buy another credit package.' : '购买新的点数包。'}</td></tr>
                  <tr><td className="px-4 py-3 text-amber-300">RATE_LIMIT_EXCEEDED</td><td className="px-4 py-3">429</td><td className="px-4 py-3">{isEnglish ? 'Slow down and retry later.' : '降低请求频率后再重试。'}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-5">
            {sectionTitle('mcp', isEnglish ? 'Remote MCP' : '远程MCP', isEnglish ? 'Connect an MCP client to discover and call Herdown tools.' : '让支持MCP的客户端发现并调用Herdown工具。')}
            {codeBlock('mcp', 'mcp.json', mcpExample)}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['parse_webpage', isEnglish ? 'Parse one public webpage or HTML. Input: url or html. Returns title, markdown, images, and token estimates.' : '解析一个公开网页或HTML。输入url或html，返回标题、Markdown、图片和Token估算。'],
                ['crawl_website', isEnglish ? 'Discover and parse public pages. Input: url and optional limit. Returns page results and elapsed time.' : '发现并解析公开页面。输入url和可选limit，返回页面结果和耗时。'],
                ['health_check', isEnglish ? 'Check whether the API is reachable. No content input is required.' : '检查API是否可访问，不需要提交内容。'],
              ].map(([name, description]) => <div key={name} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="font-mono text-sm text-emerald-300">{name}</p><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
            </div>
            <p className="text-sm leading-7 text-slate-400">{isEnglish ? 'Add the API key as an Authorization Bearer token when the client requires authentication.' : '客户端要求身份验证时，把API密钥放在AuthorizationBearerToken请求头中。'}</p>
          </section>

          <section className="space-y-5">
            {sectionTitle('skill', isEnglish ? 'Skill' : 'Skill说明', isEnglish ? 'Instructions that help an AI agent choose and use Herdown correctly.' : '帮助AIAgent正确选择和使用Herdown的操作说明。')}
            <p className="text-sm leading-7 text-slate-400">{isEnglish ? 'A Skill is not another server. It tells an agent when to use the browser, RESTAPI, MCP, or CLI, how to preserve useful metadata, and how to handle failures.' : 'Skill不是另一个服务器，而是给AIAgent看的操作说明。它告诉Agent什么时候使用网页、RESTAPI、MCP或CLI，如何保留有用的元数据，以及失败时怎么处理。'}</p>
            {codeBlock('skill-install', isEnglish ? 'Install' : '安装命令', isEnglish ? 'mkdir -p ~/.agents/skills/herdown\ncurl -L https://raw.githubusercontent.com/less1001/herdown/main/packages/cli/SKILL.md -o ~/.agents/skills/herdown/SKILL.md' : 'mkdir -p ~/.agents/skills/herdown\ncurl -L https://raw.githubusercontent.com/less1001/herdown/main/packages/cli/SKILL.md -o ~/.agents/skills/herdown/SKILL.md')}
            {codeBlock('skill', isEnglish ? 'Skill behavior' : 'Skill用法', skillExample)}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="font-semibold text-white">{isEnglish ? 'Herdown Skill' : 'HerdownSkill'}</p><p className="mt-2 text-xs leading-6 text-slate-400">{isEnglish ? 'Web extraction, clean Markdown, API, MCP, and CLI routing.' : '网页提取、干净Markdown、API、MCP和CLI调用。'}</p></div>
              <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="font-semibold text-white">{isEnglish ? 'Local Unlimited-OCRSkill' : '本地Unlimited-OCRSkill'}</p><p className="mt-2 text-xs leading-6 text-slate-400">{isEnglish ? 'Local processing for scans and screenshots without an extra online OCR server.' : '本地处理扫描件和截图，不增加额外在线OCR服务器。'}</p></div>
            </div>
          </section>

          <section className="space-y-5">
            {sectionTitle('cli', 'CLI', isEnglish ? 'Run Herdown from a terminal and save the result locally.' : '在终端运行Herdown，并把结果保存到本地。')}
            {codeBlock('cli', isEnglish ? 'Terminal' : '终端命令', cliExample)}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="font-semibold text-white">{isEnglish ? 'Install and help' : '安装和帮助'}</p><pre className="mt-2 overflow-x-auto text-xs leading-6 text-emerald-300">npx @herdown/cli --help\nnpx @herdown/cli --version</pre></div>
              <div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="font-semibold text-white">{isEnglish ? 'Options' : '参数'}</p><p className="mt-2 text-xs leading-6 text-slate-400">{isEnglish ? '-o writes a Markdown file. -k provides an API key. Without -o, Markdown is printed to the terminal.' : '-o把结果写入Markdown文件，-k提供API密钥。不使用-o时，Markdown直接输出到终端。'}</p></div>
            </div>
          </section>

          <section className="space-y-5">
            {sectionTitle('local-tools', isEnglish ? 'Local document and image tools' : '本地文档和图片工具', isEnglish ? 'Keep local files on your computer whenever possible.' : '本地文件尽量留在自己的电脑上处理。')}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['/txt-to-markdown', 'TXT / Markdown', isEnglish ? 'Runs in the browser and does not upload the file.' : '浏览器本地处理，不上传文件。'],
                ['/word-to-markdown', 'Word', isEnglish ? 'Process DOCX files in the browser without uploading them.' : 'Word文档在浏览器中处理，不上传文件。'],
                ['/pdf-to-markdown', 'PDF', isEnglish ? 'Process text-based PDFs in the browser. Scans need local OCR.' : '文字型PDF在浏览器中处理，扫描版使用本地OCR。'],
                ['/ppt-to-markdown', 'PPT', isEnglish ? 'Extract slide text in the browser without uploading the file.' : 'PPT在浏览器中提取文字，不上传文件。'],
                ['/excel-to-markdown', 'Excel', isEnglish ? 'Convert worksheets to Markdown tables in the browser.' : 'Excel工作表在浏览器中转换为Markdown表格。'],
              ].map(([href, title, body]) => <a key={href} href={localizedHref(href, language)} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4 hover:border-emerald-500/40"><p className="font-semibold text-white">{title}</p><p className="mt-2 text-xs leading-6 text-slate-400">{body}</p></a>)}
            </div>
          </section>

          <section className="space-y-5">
            {sectionTitle('integrations', isEnglish ? 'Workflow integrations' : '工作流接入', isEnglish ? 'Use an HTTP request node, send the URL to /v1/parse, and pass the markdown field forward.' : '使用HTTP请求节点，把网址传给/v1/parse，再把返回的markdown字段交给后续节点。')}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Dify', isEnglish ? 'Create a custom tool, choose HTTP, set POST /v1/parse, add the Bearer header, and map response.markdown to the next node.' : '创建自定义工具，选择HTTP，设置POST /v1/parse，添加Bearer请求头，再把response.markdown交给下一个节点。'],
                ['Coze', isEnglish ? 'Add an HTTP request step, send {"url":"..."} as JSON, add Authorization, and use the markdown field in the following step.' : '添加HTTP请求步骤，以JSON发送{"url":"..."}，添加Authorization，再在后续步骤使用markdown字段。'],
                ['FastGPT', isEnglish ? 'Add an external API tool, set the endpoint and Bearer token, then expose the markdown response to the workflow.' : '添加外部API工具，设置接口地址和BearerToken，再把markdown返回值交给工作流。'],
                ['n8n', isEnglish ? 'Use an HTTP Request node with POST, JSON body, and Authorization header, then reference the markdown field in the next node.' : '使用HTTPRequest节点，配置POST、JSON请求体和Authorization请求头，再在下一个节点引用markdown字段。'],
              ].map(([name, description]) => <div key={name} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="font-semibold text-white">{name}</p><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
            </div>
          </section>

          <section className="space-y-5">
            {sectionTitle('faq', 'FAQ', isEnglish ? 'Answers about access, data handling, and usage limits.' : '关于访问、数据处理和使用限制的常见问题。')}
            <a href={localizedHref('/faq', language)} className="inline-flex rounded-lg border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10">{isEnglish ? 'Open full FAQ' : '打开完整FAQ'}</a>
          </section>
        </article>

        <aside className="hidden self-start xl:sticky xl:top-6 xl:block">
          <div className="border-l border-[#1e293b] pl-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{isEnglish ? 'On this page' : '本页目录'}</p>
            <nav className="space-y-2">
              {[['overview', isEnglish ? 'Overview' : '概览'], ['getting-started', isEnglish ? 'Get started' : '开始使用'], ['authentication', isEnglish ? 'API key' : 'API密钥'], ['rest-api', 'RESTAPI'], ['mcp', 'MCP'], ['skill', 'Skill'], ['cli', 'CLI'], ['local-tools', isEnglish ? 'Local tools' : '本地工具'], ['integrations', isEnglish ? 'Integrations' : '工作流接入']].map(([id, label]) => <a key={id} href={'#' + id} className="block text-xs text-slate-500 hover:text-emerald-300">{label}</a>)}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HelpPage({ language }: { language: Language }) {
  return <ProfessionalDocsPage language={language} />;
}

function ToolLoading({ language }: { language: Language }) {
  const label = language === 'en' ? 'Loading tool...' : language === 'ja' ? 'ツールを読み込んでいます...' : language === 'es' ? 'Cargando herramienta...' : language === 'de' ? 'Werkzeug wird geladen...' : '正在加载工具...';
  return (
    <div className="mx-auto flex min-h-[420px] max-w-5xl items-center justify-center">
      <div className="rounded-2xl border border-[#1e293b] bg-[#0f1722] px-5 py-4 text-sm text-slate-400" role="status">
        {label}
      </div>
    </div>
  );
}

export function App() {
  const [toolSlug] = useState<ToolSlug>(() => getToolSlug());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'converter' | 'crawl' | 'keys' | 'account' | 'admin' | 'mcp' | 'cli' | 'extension' | 'skills'>(() => toolSlug === 'api' ? 'keys' : toolSlug === 'mcp' ? 'mcp' : toolSlug === 'cli' ? 'cli' : toolSlug === 'skill' ? 'skills' : toolSlug === 'browser-extension' ? 'extension' : 'converter');
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());
  const ui = messages[language];
  const home = homeMessages[language];
  const footer = {
    allTools: localeValue(language, { zh: '工具入口', en: 'All tools', ja: 'すべてのツール', es: 'Todas las herramientas', de: 'Alle Werkzeuge' }),
    blog: localeValue(language, { zh: '博客', en: 'Blog', ja: 'ブログ', es: 'Blog', de: 'Blog' }),
    helpLegal: localeValue(language, { zh: '帮助与政策', en: 'Help and legal', ja: 'ヘルプとポリシー', es: 'Ayuda y políticas', de: 'Hilfe und Richtlinien' }),
    githubRepo: localeValue(language, { zh: 'GitHub仓库', en: 'GitHub repository', ja: 'GitHubリポジトリ', es: 'Repositorio de GitHub', de: 'GitHub-Repository' }),
    copyright: localeValue(language, { zh: '保留所有权利。', en: 'All rights reserved.', ja: '全著作権所有。', es: 'Todos los derechos reservados.', de: 'Alle Rechte vorbehalten.' }),
  };
  const tr = (english: string, chinese: string) => language === 'en' ? english : chinese;
  const skillSnippet = language === 'en'
    ? `---
name: herdown
description: Web-to-Markdown, sitemap crawling, and clean material preparation for AI agents.

When the user asks to read a public webpage or prepare material for an AI workflow, run:
npx @herdown/cli "<URL>" -o output.md -k "<YOUR_API_KEY>"`
    : `---
name: herdown
description: 为AIAgent提供网页转Markdown、Sitemap抓取和干净资料整理。

当用户需要读取公开网页或准备AI工作流资料时，执行：
npx @herdown/cli "<URL>" -o output.md -k "<YOUR_API_KEY>"`;
  const [inputUrl, setInputUrl] = useState(() => new URLSearchParams(window.location.search).get('url') || '');
  const [inputHtml, setInputHtml] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'html' | 'crawl'>('url');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlPageLimit, setCrawlPageLimit] = useState(5);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlResult, setCrawlResult] = useState<any>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCode>('starter');

  const [outputTab, setOutputTab] = useState<'preview' | 'source' | 'images'>('preview');
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(readStoredApiKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [keyCreationMessage, setKeyCreationMessage] = useState('');
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [hasPaidCredits, setHasPaidCredits] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);

  // Usage stats state
  const [stats, setStats] = useState({ today_requests: 0, daily_quota: 100000, active_keys: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (document.querySelector('script[data-herdown-analytics]')) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
      window.gtag('js', new Date());
      window.gtag('config', 'G-HD28MKHXD2');
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-HD28MKHXD2';
      script.dataset.herdownAnalytics = 'true';
      document.head.appendChild(script);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'converter') return;
    let active = true;
    const loadSession = () => {
      fetch('/v1/me', { credentials: 'include' })
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (active) setSessionUser(data?.authenticated ? data.user : null);
        })
        .catch(() => {
          if (active) setSessionUser(null);
        })
        .finally(() => {
          if (active) setSessionLoading(false);
        });
    };
    void loadSession();
    return () => { active = false; };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'keys') return;
    let active = true;
    fetch('/v1/security-config')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (active) setTurnstileSiteKey(typeof data?.turnstile_site_key === 'string' ? data.turnstile_site_key : '');
      })
      .catch(() => {
        if (active) setTurnstileSiteKey('');
      });
    return () => {
      active = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (sessionLoading || activeTab === 'converter') return;
    void fetchKeys();
    void fetchStats();
  }, [sessionLoading, sessionUser, activeTab]);

  useEffect(() => {
    window.localStorage.setItem('herdown_language', language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
    const pagePath = window.location.pathname === '/index.html' ? '/' : window.location.pathname;
    const localizedMeta = language !== 'zh' && language !== 'en' ? localizedClientSeo[language]?.[pagePath] : undefined;
    const runtimeSeoTitle = toolSlug === 'url-to-markdown'
      ? language === 'en' ? 'Free URL to Markdown Converter｜Herdown' : '免费网页转Markdown｜Herdown'
      : toolSlug === 'tools'
        ? language === 'en' ? 'Local Document to Markdown Tools｜Herdown' : '本地文档转Markdown工具｜Herdown'
        : toolSlug === 'docs'
          ? language === 'en' ? 'Developer Documentation for Web to Markdown｜Herdown' : '网页转Markdown开发者文档｜Herdown'
          : toolSlug === 'pricing'
            ? language === 'en' ? 'Webpage Parsing Pricing and Credits｜Herdown' : '网页解析价格和额度｜Herdown'
            : toolSlug === 'browser-extension'
              ? language === 'en' ? 'Browser Extension for Local Web to Markdown｜Herdown' : '浏览器本地网页转Markdown插件｜Herdown'
              : toolSlug === 'skill'
                ? language === 'en' ? 'Herdown Skill for AI Agent Workflows｜Herdown' : 'HerdownSkill：AIAgent工作流｜Herdown'
                : toolSlug === 'excel-to-markdown'
                  ? language === 'en' ? 'Excel to Markdown Converter｜Herdown' : 'Excel转Markdown转换器｜Herdown'
                  : toolSlug ? `${toolLabel(toolSlug, language)}｜Herdown` : `${home.heroTitle}｜Herdown`;
    const runtimeSeoDescription = toolSlug === 'url-to-markdown'
      ? language === 'en' ? 'Use the free URL to Markdown converter to extract one public webpage, review the source, and download clean Markdown.' : '使用免费网页转Markdown工具提取一个公开网页，检查来源并下载干净Markdown。'
      : toolSlug === 'tools'
        ? language === 'en' ? 'Choose a local document to Markdown converter for Word, PDF, PPT, Excel, CSV, JSON, XML, RTF, or Markdown files.' : '选择本地文档转Markdown工具，处理Word、PDF、PPT、Excel、CSV、JSON、XML、RTF或Markdown文件。'
        : toolSlug === 'docs'
          ? language === 'en' ? 'Connect webpage to Markdown workflows with the Herdown REST API, MCP, CLI, Skill, and browser extension.' : '通过HerdownRESTAPI、MCP、CLI、Skill和浏览器插件接入网页转Markdown工作流。'
          : toolSlug === 'pricing'
            ? language === 'en' ? 'Review Herdown webpage parsing pricing, the free allowance, and one-time credits before starting a Markdown workflow.' : '查看Herdown网页解析价格、免费额度和一次性点数，再开始Markdown工作流。'
            : toolSlug === 'browser-extension'
              ? language === 'en' ? 'Install the Herdown browser extension to extract the current rendered webpage locally and export clean Markdown.' : '安装Herdown浏览器插件，在本地提取当前渲染网页并导出干净Markdown。'
              : toolSlug === 'skill'
                ? language === 'en' ? 'Use Herdown Skill to route an AI agent between public URL conversion, local files, API, MCP, CLI, browser extraction, and OCR.' : '使用HerdownSkill让AIAgent在公开URL、本地文件、API、MCP、CLI、浏览器提取和OCR之间选择。'
                : toolSlug === 'excel-to-markdown'
                  ? language === 'en' ? 'Convert XLSX worksheets into readable Markdown tables locally in the browser, with clear format limits and review steps.' : '在浏览器本地将XLSX工作表转换为可读Markdown表格，并说明格式限制和检查步骤。'
                  : toolSlug ? toolDescription(toolSlug, language) : home.heroDescription;
    const title = localizedMeta?.title || runtimeSeoTitle;
    const description = localizedMeta?.description || runtimeSeoDescription;
    const keywords = toolSlug === 'google-docs-to-markdown'
      ? language === 'en' ? 'Google Docs to Markdown,Google Docs document to Markdown,Google Docs HTML export' : 'Google Docs转Markdown,Google Docs文档转Markdown,Google DocsHTML导出'
      : toolSlug === 'markdown-to-html'
      ? language === 'en' ? 'Markdown to HTML,convert Markdown to HTML,Markdown HTML converter' : 'Markdown转HTML,Markdown转网页,MarkdownHTML转换'
      : toolSlug === 'markdown-to-pdf'
      ? language === 'en' ? 'Markdown to PDF,convert Markdown to PDF,Markdown PDF converter' : 'Markdown转PDF,Markdown转文档,MarkdownPDF转换'
      : toolSlug === 'markdown-to-word'
      ? language === 'en' ? 'Markdown to Word,Markdown to DOCX,convert Markdown to Word' : 'Markdown转Word,Markdown转DOCX,Markdown文档转换'
      : toolSlug === 'markdown-to-csv'
      ? language === 'en' ? 'Markdown to CSV,Markdown table to CSV,convert Markdown table' : 'Markdown转CSV,Markdown表格转CSV,表格导出CSV'
      : toolSlug === 'markdown-viewer'
      ? language === 'en' ? 'Markdown viewer,Markdown editor,open MD file,Markdown live preview' : 'Markdown Viewer,Markdown编辑器,打开MD文件,Markdown实时预览'
      : toolSlug === 'markdown-to-wechat'
      ? language === 'en' ? 'Markdown to WeChat,WeChat rich text,Markdown WeChat formatter' : 'Markdown转微信公众号,公众号排版,Markdown公众号编辑器'
      : toolSlug === 'markdown-to-xiaohongshu'
      ? language === 'en' ? 'Markdown to Xiaohongshu,Xiaohongshu image cards,Markdown image generator' : 'Markdown转小红书,小红书图片卡片,Markdown图片生成'
      : toolSlug === 'notion-to-markdown'
      ? language === 'en' ? 'Notion to Markdown,Notion page to Markdown,Notion HTML export' : 'Notion转Markdown,Notion页面转Markdown,NotionHTML导出'
      : toolSlug === 'paste-to-markdown'
      ? language === 'en' ? 'HTML to Markdown converter,paste HTML to Markdown,rich text to Markdown' : 'HTML转Markdown,HTML粘贴转Markdown,富文本转Markdown'
      : toolSlug === 'rtf-to-markdown'
      ? language === 'en' ? 'RTF to Markdown,convert RTF to MD,RTF text extractor' : 'RTF转Markdown,RTF转MD,RTF文字提取'
      : toolSlug === 'xml-to-markdown'
      ? language === 'en' ? 'XML to Markdown,convert XML to MD,XML table converter' : 'XML转Markdown,XML转MD,XML表格转换'
      : toolSlug === 'json-to-markdown'
      ? language === 'en' ? 'JSON to Markdown,JSON to Markdown table,convert JSON to MD' : 'JSON转Markdown,JSON转Markdown表格,JSON转MD'
      : toolSlug === 'csv-to-markdown'
      ? language === 'en' ? 'CSV to Markdown,CSV to Markdown table,convert CSV to MD' : 'CSV转Markdown,CSV转Markdown表格,CSV转MD'
      : toolSlug === 'website-url-extractor'
      ? language === 'en' ? 'website URL extractor,extract links from website,internal link crawler' : 'Website URL提取器,网站链接提取,站内URL导出'
      : toolSlug === 'website-to-markdown'
      ? language === 'en' ? 'website to Markdown,website crawl to Markdown,website to Markdown converter,multi-page Markdown' : 'Website转Markdown,网站抓取转Markdown,多页面Markdown,网站内容提取'
      : toolSlug === 'sitemap-generator'
      ? language === 'en' ? 'sitemap generator,XML sitemap generator,create sitemap XML' : 'Sitemap生成器,XMLSitemap生成,在线生成Sitemap'
      : toolSlug === 'sitemap-validator'
      ? language === 'en' ? 'sitemap validator,validate sitemap XML,XML sitemap validator' : 'Sitemap验证器,Sitemap校验,XMLSitemap验证'
      : toolSlug === 'sitemap-checker'
      ? language === 'en' ? 'sitemap checker,sitemap finder,check sitemap XML' : 'Sitemap检查器,Sitemap查找器,检查Sitemap'
      : toolSlug === 'sitemap-extractor'
      ? language === 'en' ? 'sitemap extractor,sitemap URL extractor,extract URLs from sitemap' : 'Sitemap提取器,SitemapURL提取,网站URL导出'
      : toolSlug === 'url-to-markdown'
      ? language === 'en' ? 'URL to Markdown, webpage to Markdown, HTML to Markdown' : 'URL转Markdown,网页转Markdown,HTML转Markdown'
      : toolSlug === 'markdown-tools'
      ? language === 'en' ? 'Markdown tools,Markdown viewer,Markdown converter,Markdown publishing' : 'Markdown工具,Markdown查看器,Markdown转换,Markdown发布'
      : toolSlug === 'markdown-format-guide'
      ? language === 'en' ? 'Markdown format guide,Markdown to HTML,Markdown to PDF,Markdown to Word' : 'Markdown格式转换,Markdown转HTML,Markdown转PDF,Markdown转Word'
      : toolSlug === 'merge-documents'
      ? language === 'en' ? 'merge documents,merge PDF,merge DOCX,merge PPTX,merge Excel' : '文档合并,PDF合并,DOCX合并,PPTX合并,Excel合并'
      : toolSlug === 'merge-pdf'
      ? language === 'en' ? 'merge PDF,combine PDF,PDF merger,merge PDF files' : 'PDF合并,合并PDF,PDF文件合并,在线PDF合并'
      : toolSlug === 'merge-docx'
      ? language === 'en' ? 'merge DOCX,combine DOCX,merge Word documents,DOCX merger' : 'DOCX合并,合并DOCX,Word文档合并'
      : toolSlug === 'merge-pptx'
      ? language === 'en' ? 'merge PPTX,combine PowerPoint,presentation merger,merge slides' : 'PPTX合并,合并PPTX,PowerPoint合并'
      : toolSlug === 'merge-excel'
      ? language === 'en' ? 'merge Excel,combine Excel files,merge worksheets,Excel merger' : 'Excel合并,合并Excel,Excel工作表合并'
      : toolSlug === 'blog/how-to-convert-html-to-markdown-for-ai'
      ? 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools'
      : toolSlug === 'blog/best-markdown-converter-for-ai-agents'
      ? 'best markdown converter for ai agents,Markdown converter,AI agent tools'
      : toolSlug === 'blog/markdown-for-agents-tools'
      ? 'markdown for agents tools,Markdown tools,AI agent workflow'
      : toolSlug === 'blog'
      ? language === 'en' ? 'Markdown blog,HTML to Markdown,AI agents,Markdown tools' : 'Markdown博客,HTML转Markdown,AIAgent,Markdown工具'
      : toolSlug === 'tools'
        ? language === 'en' ? 'document to Markdown, local document conversion' : '文档转Markdown,本地文档转换'
        : language === 'en' ? 'AI-ready Markdown,AI agents,REST API,MCP,CLI' : 'AI-ready Markdown,AIAgent,RESTAPI,MCP,CLI';
    const finalKeywords = localizedMeta?.keywords || keywords;
    const languageQuery = language === 'zh' ? '' : `?lang=${language}`;
    const canonicalUrl = `${window.location.origin}${pagePath}${languageQuery}`;
    const setMeta = (selector: string, attribute: string, value: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      element?.setAttribute(attribute, value);
    };
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="keywords"]', 'content', finalKeywords);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
    const alternateUrls: Array<[string, string]> = [
      ['zh-CN', `${window.location.origin}${pagePath}`],
      ['en', `${window.location.origin}${pagePath}?lang=en`],
      ['ja', `${window.location.origin}${pagePath}?lang=ja`],
      ['es', `${window.location.origin}${pagePath}?lang=es`],
      ['de', `${window.location.origin}${pagePath}?lang=de`],
      ['x-default', `${window.location.origin}${pagePath}`],
    ];
    for (const [hrefLang, hrefValue] of alternateUrls) {
      let alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hrefLang}"]`);
      if (!alternate) {
        alternate = document.createElement('link');
        alternate.rel = 'alternate';
        alternate.hreflang = hrefLang;
        document.head.appendChild(alternate);
      }
      alternate.href = hrefValue;
    }
    const schema = document.querySelector<HTMLScriptElement>('script[data-herdown-schema]');
    if (schema) {
      const faqItems = language === 'en'
        ? [['What does Herdown do?', 'Herdown turns webpages or HTML into clean Markdown for saving, reading, AI workflows, and knowledge tools.'], ['Is my content stored long-term?', 'No. Herdown processes content in real time and does not host your content or run a knowledge base. Limited technical logs may be used for security and troubleshooting.'], ['Can I use it without coding?', 'Yes. Paste a URL and click Convert. Developers can also use the API, MCP, CLI, or browser extension.']]
        : [['Herdown是做什么的？', '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读、交给AI工作流或知识库继续使用。'], ['我提交的内容会被长期保存吗？', '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。必要的短期技术日志仅用于安全防护、稳定性和故障排查。'], ['不会写代码也能用吗？', '可以。直接粘贴网页链接并点击转换即可。开发者也可以通过API、MCP、CLI或浏览器插件接入自己的工作流。']];
      const isInteractiveTool = Boolean(toolSlug && (toolSlug.endsWith('-to-markdown') || ['website-to-markdown', 'markdown-to-html', 'markdown-to-pdf', 'markdown-to-word', 'markdown-to-csv', 'markdown-viewer', 'markdown-to-wechat', 'markdown-to-xiaohongshu', 'merge-documents', 'merge-pdf', 'merge-docx', 'merge-pptx', 'merge-excel', 'sitemap-extractor', 'sitemap-checker', 'sitemap-validator', 'sitemap-generator', 'website-url-extractor'].includes(toolSlug)));
      const richSeoPage = !toolSlug || ['tools', 'docs', 'pricing', 'browser-extension', 'skill', 'excel-to-markdown'].includes(toolSlug);
      const pageSchema: Record<string, unknown> = toolSlug ? {
        '@context': 'https://schema.org',
        '@type': toolSlug === 'faq' ? 'FAQPage' : isInteractiveTool ? 'WebApplication' : 'WebPage',
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: language === 'zh' ? 'zh-CN' : language,
        isPartOf: { '@type': 'WebSite', name: 'Herdown', url: window.location.origin },
      } : {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Herdown',
        url: canonicalUrl,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        inLanguage: language === 'zh' ? 'zh-CN' : language,
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: language === 'en' ? ['Webpage to Markdown', 'Document to Markdown', 'REST API', 'MCP', 'CLI'] : ['网页转Markdown', '文档转Markdown', 'REST API', 'MCP', 'CLI'],
      };
      if (isInteractiveTool) {
        pageSchema.applicationCategory = 'UtilitiesApplication';
        pageSchema.operatingSystem = 'Web';
        pageSchema.offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
      }
      if (toolSlug === 'faq' || !toolSlug) pageSchema.mainEntity = (!toolSlug ? home.faqItems.map(item => [item.question, item.answer]) : faqItems).map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } }));
      const siteUrl = window.location.origin;
      const labels = {
        zh: { step1: '准备输入', step2: '检查结果', step3: '复制或下载', faq1: '支持什么输入？', faq2: '文件会上传吗？', faq3: '结果需要复核吗？', privacy: '本地文件工具在当前浏览器中处理文件；网页工具只请求你提交的公开地址。', review: '结果会根据输入结构生成，复杂排版或格式边界可能需要人工检查。', output: '结果可以在页面中复制或下载，具体格式以本页工具提供的操作为准。', home: '首页' },
        en: { step1: 'Prepare the input', step2: 'Review the result', step3: 'Copy or download', faq1: 'What input does it support?', faq2: 'Are files uploaded?', faq3: 'Should I review the result?', privacy: 'Local file tools process files in this browser. Web tools request only the public address you submit.', review: 'The result follows the input structure. Complex layouts or format boundaries may need a manual check.', output: 'Copy or download the result from the page. The available output format depends on this tool.', home: 'Home' },
        ja: { step1: '入力を準備', step2: '結果を確認', step3: 'コピーまたは保存', faq1: 'どの入力に対応しますか？', faq2: 'ファイルはアップロードされますか？', faq3: '結果を確認する必要がありますか？', privacy: 'ローカルファイルツールはこのブラウザ内で処理します。Webツールは入力した公開アドレスだけをリクエストします。', review: '結果は入力構造に従って生成され、複雑なレイアウトは確認が必要な場合があります。', output: 'ページから結果をコピーまたは保存できます。出力形式はこのツールの案内に従います。', home: 'ホーム' },
        es: { step1: 'Prepara la entrada', step2: 'Revisa el resultado', step3: 'Copia o descarga', faq1: '¿Qué entrada admite?', faq2: '¿Se suben los archivos?', faq3: '¿Debo revisar el resultado?', privacy: 'Las herramientas de archivos locales procesan el contenido en este navegador. Las herramientas web solo solicitan la dirección pública que envías.', review: 'El resultado sigue la estructura de entrada y los diseños complejos pueden requerir una revisión manual.', output: 'Copia o descarga el resultado desde la página. El formato disponible depende de esta herramienta.', home: 'Inicio' },
        de: { step1: 'Eingabe vorbereiten', step2: 'Ergebnis prüfen', step3: 'Kopieren oder laden', faq1: 'Welche Eingabe wird unterstützt?', faq2: 'Werden Dateien hochgeladen?', faq3: 'Muss ich das Ergebnis prüfen?', privacy: 'Lokale Dateitools verarbeiten Dateien in diesem Browser. Webtools rufen nur die von dir eingegebene öffentliche Adresse ab.', review: 'Das Ergebnis folgt der Eingabestruktur und komplexe Layouts müssen eventuell manuell geprüft werden.', output: 'Kopiere oder lade das Ergebnis auf dieser Seite. Das verfügbare Format hängt von diesem Werkzeug ab.', home: 'Startseite' },
      }[language];
      delete pageSchema['@context'];
      pageSchema['@id'] = canonicalUrl + '#webpage';
      pageSchema.isPartOf = { '@id': siteUrl + '/#website' };
      pageSchema.publisher = { '@id': siteUrl + '/#organization' };
      const organization = { '@type': 'Organization', '@id': siteUrl + '/#organization', name: 'Herdown', url: siteUrl + '/', logo: { '@type': 'ImageObject', url: siteUrl + '/og-image.svg' }, sameAs: ['https://github.com/less1001/herdown'] };
      const website = { '@type': 'WebSite', '@id': siteUrl + '/#website', name: 'Herdown', url: siteUrl + '/', inLanguage: language === 'zh' ? 'zh-CN' : language, publisher: { '@id': siteUrl + '/#organization' } };
      const breadcrumb = { '@type': 'BreadcrumbList', '@id': canonicalUrl + '#breadcrumb', itemListElement: [{ '@type': 'ListItem', position: 1, name: labels.home, item: siteUrl + '/' }, ...(pagePath === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: title, item: canonicalUrl }])] };
      const graph: unknown[] = [organization, website, pageSchema, breadcrumb];
      if (isInteractiveTool || richSeoPage) {
        const steps = !toolSlug
          ? [{ name: language === 'en' ? 'Choose a public URL or HTML' : '选择公开URL或HTML', text: language === 'en' ? 'Paste a public webpage URL or HTML source into the homepage converter.' : '在首页转换器中粘贴公开网页URL或HTML源码。' }, { name: language === 'en' ? 'Generate clean Markdown' : '生成干净Markdown', text: home.heroDescription }, { name: language === 'en' ? 'Review and download' : '检查并下载', text: language === 'en' ? 'Review the title, source, structure, and output before copying or downloading Markdown.' : '检查标题、来源、结构和结果后，再复制或下载Markdown。' }]
          : [{ name: labels.step1, text: title + ': ' + description }, { name: labels.step2, text: labels.review }, { name: labels.step3, text: labels.output }];
        const structuredFaqs: Array<[string, string]> = !toolSlug
          ? home.faqItems.slice(0, 4).map(item => [item.question, item.answer])
          : [[title + '：' + labels.faq1, description], [labels.faq2, labels.privacy], [labels.faq3, labels.review]];
        graph.push({ '@type': 'HowTo', '@id': canonicalUrl + '#howto', name: title, description, inLanguage: language === 'zh' ? 'zh-CN' : language, step: steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, name: step.name, text: step.text, url: canonicalUrl + '#step-' + (index + 1) })) });
        graph.push({ '@type': 'FAQPage', '@id': canonicalUrl + '#faq', inLanguage: language === 'zh' ? 'zh-CN' : language, mainEntity: structuredFaqs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) });
      }
      schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    }
    if (toolSlug) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [language, toolSlug]);

  useEffect(() => {
    if (language === 'zh' || language === 'en') return;
    let active = true;
    const path = window.location.pathname === '/index.html' ? '/' : window.location.pathname;
    void import('./publicLocalization').then(({ installLegacyLocalization }) => {
      if (active) installLegacyLocalization(language, path);
    });
    return () => { active = false; };
  }, [language, toolSlug]);

  const fetchKeys = async () => {
    if (sessionUser) {
      try {
        const savedKeys = JSON.parse(window.localStorage.getItem('herdown_api_keys') || '[]');
        if (Array.isArray(savedKeys)) {
          await Promise.all(savedKeys.map((item: ApiKeyItem) => fetch('/v1/account/link-key', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: item.key }),
          }).catch(() => undefined)));
        }
        const response = await fetch('/v1/keys', { credentials: 'include' });
        const data = await response.json();
        if (response.ok && Array.isArray(data.keys)) {
          setApiKeys(data.keys);
          return;
        }
      } catch {
        // Fall back to the browser copy if the account request fails.
      }
    }
    try {
      setApiKeys(readStoredApiKeys());
    } catch {
      setApiKeys([]);
    }
  };

  const saveKeys = (keys: ApiKeyItem[]) => {
    setApiKeys(keys);
    window.localStorage.setItem('herdown_api_keys', JSON.stringify(keys));
  };

  const fetchCredits = async (key?: string) => {
    if (!key) {
      setCreditBalance(null);
      setFreeRemaining(null);
      setHasPaidCredits(false);
      return;
    }
    try {
      const res = await fetch('/v1/credits', { headers: { Authorization: `Bearer ${key}` } });
      if (res.ok) {
        const data = await res.json();
        setCreditBalance(typeof data.credits === 'number' ? data.credits : null);
        setFreeRemaining(typeof data.free_remaining === 'number' ? data.free_remaining : null);
        setHasPaidCredits(data.has_paid_credits === true);
      }
    } catch {
      setCreditBalance(null);
    }
  };

  useEffect(() => {
    if (activeTab !== 'keys' && activeTab !== 'account') return;
    void fetchCredits(apiKeys.find(k => k.status === 'active')?.key);
  }, [apiKeys, activeTab]);

  useEffect(() => {
    if (activeTab === 'admin' && sessionUser?.is_admin) void fetchAdminOverview();
  }, [activeTab, sessionUser]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/v1/usage');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setSessionUser(null);
    setActiveTab('converter');
    await fetchKeys();
  };

  const fetchAdminOverview = async () => {
    try {
      const response = await fetch('/v1/admin/overview', { credentials: 'include' });
      const data = await response.json();
      if (response.ok && data.success) setAdminOverview(data);
    } catch {
      setAdminOverview(null);
    }
  };

  const handleDownloadZip = async () => {
    if (!crawlResult || !crawlResult.results || !crawlResult.results.length) {
      alert('无可打包的页面内容！');
      return;
    }
    setDownloadingZip(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      crawlResult.results.forEach((item: any, idx: number) => {
        // Create safe file name
        const safeTitle = (item.title || `Page_${idx + 1}`)
          .replace(/[/\\?%*:|"<>]/g, '_')
          .trim();
        
        // Combine frontmatter + title + markdown body
        const content = `---\ntitle: "${(item.title || '').replace(/"/g, '\\"')}"\nsource_url: "${item.url}"\n---\n\n# ${item.title}\n\n${item.markdown}`;
        
        zip.file(`${safeTitle}.md`, content);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanDomain = crawlResult.domain.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Herdown_Crawl_${cleanDomain}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
      alert('打包压缩 ZIP 失败，请稍后重试！');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleParse = async () => {
    if (inputMode === 'url' && !inputUrl.trim()) return;
    if (inputMode === 'html' && !inputHtml.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const activeUserKey = apiKeys.find(k => k.status === 'active')?.key;

      const res = await fetch('/v1/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeUserKey ? { 'Authorization': `Bearer ${activeUserKey}` } : {}),
        },
        body: JSON.stringify({
          url: inputMode === 'url' ? inputUrl.trim() : undefined,
          html: inputMode === 'html' ? inputHtml : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || '转换失败，请检查网址或频控限制');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || '网络请求异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return;
    setCrawlLoading(true);
    setCrawlResult(null);
    try {
      const activeUserKey = apiKeys.find(k => k.status === 'active')?.key;
      const res = await fetch('/v1/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeUserKey ? { 'Authorization': `Bearer ${activeUserKey}` } : {}),
        },
        body: JSON.stringify({
          url: crawlUrl.trim(),
          limit: hasPaidCredits ? Math.min(100, Math.max(1, crawlPageLimit)) : Math.min(5, Math.max(1, crawlPageLimit)),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCrawlResult(data);
      }
    } catch {
      // ignore
    } finally {
      setCrawlLoading(false);
    }
  };

  const handleCheckout = async (product: ProductCode = selectedProduct) => {
    const activeUserKey = apiKeys.find(k => k.status === 'active')?.key;
    if (!activeUserKey) {
      setShowUpgradeModal(false);
      setActiveTab('keys');
      alert('请先创建一个API密钥。升级完成后，购买的点数会自动发放到这个密钥。');
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch('/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeUserKey}` },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.message || '支付链接生成失败');
      }
    } catch {
      alert('支付通道初始化失败');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    if (!turnstileSiteKey || !turnstileToken) {
      setKeyCreationMessage('请先完成安全验证。');
      return;
    }
    setCreatingKey(true);
    setKeyCreationMessage('');
    try {
      const res = await fetch('/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim(), turnstile_token: turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNewKeyName('');
        setTurnstileToken('');
        const item: ApiKeyItem = {
          key: data.key,
          name: data.name,
          status: 'active',
          created_at: data.created_at,
        };
        saveKeys([...apiKeys.filter(key => key.key !== item.key), item]);
        await fetchStats();
      } else {
        setKeyCreationMessage(data.message || 'API密钥创建失败，请稍后重试。');
      }
    } catch {
      setKeyCreationMessage('网络异常，API密钥创建失败。');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (key: string) => {
    try {
      const res = await fetch(`/v1/keys/${key}`, { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } });
      if (res.ok) {
        saveKeys(apiKeys.map(item => item.key === key ? { ...item, status: 'revoked' } : item));
      }
    } catch {
      // ignore
    }
  };

  const handleCopyMarkdown = () => {
    if (!result?.markdown) return;
    navigator.clipboard.writeText(result.markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!result?.markdown) return;
    const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(result.title || 'article').replace(/[/\\?%*:|"<>]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeApiKeySample = apiKeys.find(k => k.status === 'active')?.key || 'sk_live_YOUR_API_KEY';

  const cleanContextSection = (
    <section className="space-y-6 pt-10">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">{home.cleanContextTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">{home.cleanContextSubtitle}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {home.cleanContextFeatures.map(feature => (
          <div key={feature.title} className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5">
            <h3 className="text-sm font-bold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{feature.body}</p>
          </div>
        ))}
      </div>
      <HomeQualityHighlights language={language} />
    </section>
  );
  const urlPageContent = {
    zh: { title: '免费网页转Markdown', intro: '输入一个公开网页URL，提取正文、标题、图片和来源信息，生成可以继续阅读、编辑和交给AI使用的Markdown。', how: '怎么使用免费网页转Markdown', steps: [['粘贴公开URL', '输入可以公开访问的网页地址。'], ['开始转换', 'Herdown请求页面并清理导航、广告和其他无效内容。'], ['检查并下载', '检查正文、来源和图片，再复制或下载Markdown。']], scope: '支持范围与限制', scopeText: '适合公开可访问的文章、文档和资料页。登录墙、robots限制、超时、动态渲染或受保护内容可能无法完整解析。', quota: '免费额度说明', quotaText: '免费访问每月1000次网页解析，首页和API共用额度；未使用点数时每日最多20次解析请求，单次全站抓取最多5页，全站抓取按实际页面计数。', faq: [['为什么网页转换失败？', '目标页面可能需要登录、阻止服务器请求、依赖浏览器脚本或超出免费额度。'], ['转换结果会保留来源吗？', '会。结果会显示来源URL，下载的Markdown也会保留来源信息。'], ['URL转换和Website转Markdown有什么区别？', 'URL转换处理单个公开页面；Website转Markdown用于从域名、起始URL或Sitemap抓取多个页面。']], related: '继续使用相关工具' },
    en: { title: 'Free URL to Markdown Converter', intro: 'Enter a public webpage URL to extract readable content, titles, images, and source metadata into Markdown for editing, reading, and AI workflows.', how: 'How to use the Free URL to Markdown Converter', steps: [['Paste a public URL', 'Enter a webpage address that can be accessed publicly.'], ['Run the converter', 'Herdown requests the page and removes navigation, ads, and other noise.'], ['Review and download', 'Check the content, source, and images before copying or downloading Markdown.']], scope: 'Supported scope and limits', scopeText: 'Works best for public articles, documentation, and material pages. Login walls, robots restrictions, timeouts, client-rendered content, or protected pages may prevent a complete result.', quota: 'Free quota', quotaText: 'Free access includes 1,000 webpage parses per month shared by the homepage and API. Without purchased credits, parsing requests are limited to 20 per day; each site crawl request can process up to 5 pages and counts actual pages.', faq: [['Why did a webpage conversion fail?', 'The target may require login, block server requests, depend on browser scripts, or exceed the free quota.'], ['Are sources retained?', 'Yes. The result shows the source URL and downloaded Markdown keeps source metadata.'], ['How is this different from Website to Markdown?', 'URL to Markdown processes one public page. Website to Markdown crawls multiple pages from a domain, starting URL, or sitemap.']], related: 'Continue with related tools' },
    ja: { title: '無料URLからMarkdownへの変換', intro: '公開WebページのURLから本文、タイトル、画像、出典情報を抽出し、編集やAIワークフローに使えるMarkdownに整えます。', how: '無料URLからMarkdownへの使い方', steps: [['公開URLを貼り付け', '公開アクセスできるWebページのアドレスを入力します。'], ['変換を実行', 'ページを取得し、ナビゲーションや広告などのノイズを整理します。'], ['確認して保存', '本文、出典、画像を確認してMarkdownをコピーまたは保存します。']], scope: '対応範囲と制限', scopeText: '公開記事、ドキュメント、資料ページに適しています。ログイン、robots制限、タイムアウト、動的描画、保護されたページは完全に取得できない場合があります。', quota: '無料枠', quotaText: '月1,000回の無料解析をトップページとAPIで共有します。クレジット未購入時は1日20回まで、サイト巡回は1回5ページまでで、実際のページ数を数えます。', faq: [['Webページの変換が失敗するのはなぜですか？', 'ログインが必要、サーバーが拒否、ブラウザスクリプトに依存、無料枠超過などが原因です。'], ['出典は残りますか？', 'はい。結果に元URLを表示し、保存したMarkdownにも出典情報を残します。'], ['WebサイトからMarkdownへとの違いは？', 'URL変換は1つの公開ページ、Webサイト変換はドメイン、開始URL、Sitemapから複数ページを処理します。']], related: '関連ツール' },
    es: { title: 'Convertidor gratuito de URL a Markdown', intro: 'Introduce una URL pública para extraer contenido, títulos, imágenes y datos de origen en Markdown para editar, leer o usar con IA.', how: 'Cómo usar el convertidor gratuito de URL a Markdown', steps: [['Pega una URL pública', 'Introduce una dirección web accesible públicamente.'], ['Ejecuta la conversión', 'Herdown solicita la página y elimina navegación, anuncios y ruido.'], ['Revisa y descarga', 'Comprueba contenido, fuente e imágenes antes de copiar o descargar Markdown.']], scope: 'Alcance y límites', scopeText: 'Funciona mejor con artículos, documentación y páginas públicas. El inicio de sesión, robots, tiempos de espera, contenido renderizado en el cliente o páginas protegidas pueden impedir un resultado completo.', quota: 'Cuota gratuita', quotaText: 'Incluye 1.000 análisis web al mes compartidos por la página principal y la API. Sin créditos comprados, hay un máximo de 20 solicitudes de análisis al día; cada rastreo procesa hasta 5 páginas y cuenta las páginas reales.', faq: [['¿Por qué falló una conversión?', 'La página puede requerir inicio de sesión, bloquear solicitudes, depender de scripts del navegador o superar la cuota.'], ['¿Se conservan las fuentes?', 'Sí. El resultado muestra la URL de origen y el Markdown descargado conserva los datos de fuente.'], ['¿En qué se diferencia de De sitio web a Markdown?', 'URL a Markdown procesa una página. De sitio web a Markdown rastrea varias páginas desde dominio, URL inicial o sitemap.']], related: 'Herramientas relacionadas' },
    de: { title: 'Kostenloser URL-zu-Markdown-Konverter', intro: 'Eine öffentliche Webseiten-URL eingeben und lesbare Inhalte, Titel, Bilder sowie Quelldaten für Bearbeitung und AI-Workflows als Markdown extrahieren.', how: 'Kostenlosen URL-zu-Markdown-Konverter verwenden', steps: [['Öffentliche URL einfügen', 'Eine öffentlich erreichbare Webseitenadresse eingeben.'], ['Konvertierung starten', 'Herdown ruft die Seite ab und entfernt Navigation, Werbung und Rauschen.'], ['Prüfen und laden', 'Inhalt, Quelle und Bilder prüfen und Markdown kopieren oder laden.']], scope: 'Umfang und Grenzen', scopeText: 'Geeignet für öffentliche Artikel, Dokumentation und Materialseiten. Login, robots, Zeitüberschreitungen, clientseitiges Rendering oder geschützte Seiten können ein vollständiges Ergebnis verhindern.', quota: 'Kostenloses Kontingent', quotaText: 'Enthält 1.000 kostenlose Analysen pro Monat, geteilt von Startseite und API. Ohne gekaufte Credits sind 20 Analyseanfragen pro Tag möglich; jeder Website-Crawl verarbeitet bis zu 5 Seiten und zählt echte Seiten.', faq: [['Warum ist die Umwandlung fehlgeschlagen?', 'Die Seite kann Login erfordern, Anfragen blockieren, Browser-Skripte benötigen oder das Kontingent überschreiten.'], ['Bleiben Quellen erhalten?', 'Ja. Das Ergebnis zeigt die Quell-URL und geladenes Markdown behält Quelldaten.'], ['Was ist der Unterschied zu Website zu Markdown?', 'URL zu Markdown verarbeitet eine Seite. Website zu Markdown crawlt mehrere Seiten aus Domain, Start-URL oder Sitemap.']], related: 'Verwandte Werkzeuge' },
  }[language];
  const urlResultLabels = {
    zh: { copy: '复制结果', copied: '已复制', download: '下载.md', htmlTokens: '原网页HTML估算', markdownTokens: '清洗后Markdown估算', savings: '预计节省上下文', estimate: '仅为估算值，实际数量取决于模型', preview: '渲染预览', source: 'Markdown源码', images: '提取图片', emptyImages: '本文未提取到独立图片', general: '通用' },
    en: { copy: 'Copy result', copied: 'Copied', download: 'Download .md', htmlTokens: 'Source HTML estimate', markdownTokens: 'Clean Markdown estimate', savings: 'Estimated context saved', estimate: 'Estimate only; actual counts depend on the model', preview: 'Rendered preview', source: 'Markdown source', images: 'Extracted images', emptyImages: 'No standalone images were extracted', general: 'General' },
    ja: { copy: '結果をコピー', copied: 'コピーしました', download: 'Markdownを保存', htmlTokens: '元HTMLの推定', markdownTokens: '整理後Markdownの推定', savings: '推定コンテキスト削減', estimate: '推定値です。実際の数はモデルによって異なります', preview: 'プレビュー', source: 'Markdownソース', images: '抽出画像', emptyImages: '独立した画像は抽出されませんでした', general: '一般' },
    es: { copy: 'Copiar resultado', copied: 'Copiado', download: 'Descargar .md', htmlTokens: 'Estimación del HTML original', markdownTokens: 'Estimación del Markdown limpio', savings: 'Contexto estimado ahorrado', estimate: 'Solo es una estimación; el recuento real depende del modelo', preview: 'Vista previa', source: 'Código Markdown', images: 'Imágenes extraídas', emptyImages: 'No se extrajeron imágenes independientes', general: 'General' },
    de: { copy: 'Ergebnis kopieren', copied: 'Kopiert', download: 'Markdown laden', htmlTokens: 'Schätzung des Quell-HTML', markdownTokens: 'Schätzung des sauberen Markdown', savings: 'Geschätzter Kontextgewinn', estimate: 'Nur eine Schätzung; die tatsächliche Anzahl hängt vom Modell ab', preview: 'Vorschau', source: 'Markdown-Quelltext', images: 'Extrahierte Bilder', emptyImages: 'Keine eigenständigen Bilder extrahiert', general: 'Allgemein' },
  }[language];
  const urlRelatedTools = {
    zh: { aria: '相关工具', website: 'Website转Markdown', extractor: 'SitemapURL提取器', checker: 'Sitemap查找与检查', viewer: 'Markdown查看器' },
    en: { aria: 'Continue with related tools', website: 'Website to Markdown', extractor: 'Sitemap URL Extractor', checker: 'Sitemap Finder & Checker', viewer: 'Markdown Viewer' },
    ja: { aria: '関連ツール', website: 'WebサイトからMarkdownへ', extractor: 'SitemapURL抽出', checker: 'Sitemap検索とチェック', viewer: 'Markdownビューア' },
    es: { aria: 'Herramientas relacionadas', website: 'De sitio web a Markdown', extractor: 'Extractor de URL de Sitemap', checker: 'Buscador y comprobador de Sitemap', viewer: 'Visor Markdown' },
    de: { aria: 'Verwandte Werkzeuge', website: 'Website zu Markdown', extractor: 'Sitemap-URL-Extraktor', checker: 'Sitemap-Finder und -Prüfer', viewer: 'Markdown-Viewer' },
  }[language];
  const urlFaqTitle = localeValue(language, { zh: '常见问题', en: 'FAQ', ja: 'よくある質問', es: 'Preguntas frecuentes', de: 'FAQ' });
  const urlQualityContent = {
    zh: { title: '转换结果与来源信息', text: '结果会尽量保留标题层级、正文、列表、链接、表格、代码、图片引用和来源URL，同时清理导航、广告、评论和推荐模块。它不是网页视觉复刻，复杂CSS、交互组件、登录内容和动态区域可能需要HTML粘贴或浏览器插件配合。' },
    en: { title: 'Output quality and source information', text: 'The result aims to keep heading levels, body text, lists, links, tables, code, image references, and the source URL while removing navigation, ads, comments, and recommendation modules. It is not a visual copy of the webpage; complex CSS, interactive components, login content, and dynamic areas may need HTML paste or the browser extension.' },
    ja: { title: '出力品質と出典情報', text: '見出し、本文、リスト、リンク、表、コード、画像参照、元URLをできるだけ保持し、ナビゲーション、広告、コメント、推薦モジュールを整理します。画面の完全な複製ではないため、複雑なCSS、ログイン内容、動的領域にはHTML貼り付けやブラウザ拡張機能が役立ちます。' },
    es: { title: 'Calidad y datos de origen', text: 'El resultado intenta conservar títulos, texto, listas, enlaces, tablas, código, referencias de imágenes y la URL de origen, mientras elimina navegación, anuncios, comentarios y recomendaciones. No es una copia visual; CSS complejo, componentes interactivos, contenido con login y zonas dinámicas pueden requerir HTML pegado o la extensión.' },
    de: { title: 'Ausgabequalität und Quelldaten', text: 'Die Ausgabe versucht Überschriften, Text, Listen, Links, Tabellen, Code, Bildverweise und die Quell-URL zu erhalten und entfernt Navigation, Werbung, Kommentare und Empfehlungen. Es ist keine visuelle Kopie; komplexes CSS, interaktive Komponenten, Login-Inhalte und dynamische Bereiche können HTML-Einfügen oder die Erweiterung erfordern.' },
  }[language];

  return (
    <div className="min-h-screen bg-[#070a0e] text-[#e2e8f0] font-sans antialiased selection:bg-[#0f6b4f] selection:text-white flex flex-col">
      {/* Background Grid */}
      <div className="herdown-print-background fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Header */}
      <header className="herdown-site-header sticky top-0 z-50 backdrop-blur-md bg-[#070a0e]/80 border-b border-[#1e293b]">
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center gap-2">
          <a href={localizedHref('/', language)} className="flex shrink-0 items-center gap-2 sm:gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/60" aria-label={ui.home}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0f6b4f] to-[#10b981] p-[1px] shadow-lg shadow-[#0f6b4f]/20">
              <div className="w-full h-full bg-[#090d12] rounded-[11px] flex items-center justify-center font-bold text-emerald-400 font-mono text-base">
                HD
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                Herdown
              </span>
            </div>
          </a>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 rounded-xl border border-[#1e293b] bg-[#111823] p-1">
            <a
              href={localizedHref('/', language)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'converter' && (!toolSlug || ['tools', 'url-to-markdown', 'website-to-markdown', 'txt-to-markdown', 'pdf-to-markdown', 'word-to-markdown', 'ppt-to-markdown', 'excel-to-markdown', 'csv-to-markdown', 'json-to-markdown', 'xml-to-markdown', 'rtf-to-markdown', 'paste-to-markdown', 'notion-to-markdown', 'google-docs-to-markdown', 'markdown-to-html', 'markdown-to-pdf', 'markdown-to-word', 'markdown-to-csv', 'markdown-viewer', 'markdown-to-wechat', 'markdown-to-xiaohongshu', 'markdown-tools', 'markdown-format-guide', 'merge-documents', 'merge-pdf', 'merge-docx', 'merge-pptx', 'merge-excel', 'sitemap-extractor', 'sitemap-checker', 'sitemap-validator', 'sitemap-generator', 'website-url-extractor', 'blog', 'blog/how-to-convert-html-to-markdown-for-ai', 'blog/best-markdown-converter-for-ai-agents', 'blog/markdown-for-agents-tools'].includes(toolSlug))
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {ui.single}
            </a>
            <details className="group relative">
              <summary className={`cursor-pointer list-none rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${['api', 'mcp', 'cli', 'skill', 'browser-extension'].includes(toolSlug || '') ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                {home.developers}<span className="ml-1 text-[10px]">⌄</span>
              </summary>
              <div className="absolute left-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-[#1e293b] bg-[#0d131c] p-1.5 shadow-2xl">
                {[
                  ['/api', ui.api],
                  ['/mcp', ui.mcp],
                  ['/cli', ui.cli],
                  ['/skill', ui.skill],
                  ['/browser-extension', ui.extension],
                ].map(([path, label]) => (
                  <a key={path} href={localizedHref(path, language)} className="block rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-[#111823] hover:text-white">{label}</a>
                ))}
                <a href="https://github.com/less1001/herdown" target="_blank" rel="noreferrer" className="block rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-[#111823] hover:text-white">GitHub</a>
                {sessionUser?.is_admin && <button type="button" onClick={() => setActiveTab('admin')} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-400 hover:bg-[#111823] hover:text-white">{ui.admin}</button>}
              </div>
            </details>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <a
              href={localizedHref('/pricing', language)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ui.upgrade}</span>
            </a>
            <label className="sr-only" htmlFor="herdown-language">{home.languageLabel}</label>
            <select
              id="herdown-language"
              value={language}
              onChange={event => {
                const nextLanguage = event.target.value as Language;
                const nextUrl = new URL(window.location.href);
                if (nextLanguage === 'zh') nextUrl.searchParams.delete('lang');
                else nextUrl.searchParams.set('lang', nextLanguage);
                window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);
                setLanguage(nextLanguage);
              }}
              className="max-w-24 rounded-xl border border-[#1e293b] bg-[#111823] px-2 py-1.5 text-xs font-semibold text-slate-300 outline-none hover:text-white"
              title="Language"
            >
              {Object.entries(languageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {sessionUser ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('account')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#111823] border border-[#1e293b] text-slate-300 hover:text-white text-xs transition"
                  title={sessionUser.email}
                >
                  <UserRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-24 truncate">{sessionUser.display_name || sessionUser.email}</span>
                </button>
                <button
                  onClick={() => void handleLogout()}
                  className="p-2 rounded-lg text-slate-500 hover:text-white transition"
                  title={ui.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-200 transition text-xs font-semibold"
                title={ui.login}
                aria-label={ui.login}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{home.signIn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(value => !value)}
              className="flex lg:hidden items-center justify-center p-2 rounded-lg bg-[#111823] border border-[#1e293b] text-slate-300 hover:text-white transition"
              aria-label={language === 'en' ? 'Open menu' : language === 'ja' ? 'メニューを開く' : language === 'es' ? 'Abrir menú' : language === 'de' ? 'Menü öffnen' : '打开菜单'}
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#1e293b] bg-[#090d12]/95 px-4 py-3 shadow-2xl">
            <a
              href={localizedHref('/', language)}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-[#111823] px-3 py-2.5 text-sm font-medium text-white"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              {ui.single}
            </a>
            <details className="mt-2 rounded-lg border border-[#1e293b] bg-[#0d131c]">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-slate-200">
                {home.developers}
              </summary>
              <div className="grid gap-1 border-t border-[#1e293b] p-2">
                <a href={localizedHref('/api', language)} onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-[#111823] hover:text-white">{ui.api}</a>
                <a href={localizedHref('/mcp', language)} onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-[#111823] hover:text-white">{ui.mcp}</a>
                <a href={localizedHref('/cli', language)} onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-[#111823] hover:text-white">{ui.cli}</a>
                <a href={localizedHref('/skill', language)} onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-[#111823] hover:text-white">{ui.skill}</a>
                <a href={localizedHref('/browser-extension', language)} onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-[#111823] hover:text-white">{ui.extension}</a>
                <a href="https://github.com/less1001/herdown" target="_blank" rel="noreferrer" className="rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-[#111823] hover:text-white">GitHub</a>
                {sessionUser?.is_admin && <button type="button" onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} className="rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-[#111823] hover:text-white">{ui.admin}</button>}
              </div>
            </details>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative ${toolSlug === 'markdown-to-pdf' ? 'herdown-print-shell' : ''}`}>
        {/* TAB 1: Single Page Converter */}
        {activeTab === 'converter' && (
          <Suspense fallback={<ToolLoading language={language} />}>
            <>
            {toolSlug === 'tools' && <><UnifiedMaterialsTool language={language} /><OnPageSeoContent page="tools" language={language} /></>}
            {toolSlug === 'txt-to-markdown' && <LocalMarkdownToolsPage kind="txt" language={language} />}
            {toolSlug === 'pdf-to-markdown' && <LocalMarkdownToolsPage kind="pdf" language={language} />}
            {toolSlug === 'word-to-markdown' && <LocalMarkdownToolsPage kind="word" language={language} />}
            {toolSlug === 'ppt-to-markdown' && <LocalMarkdownToolsPage kind="ppt" language={language} />}
            {toolSlug === 'excel-to-markdown' && <LocalMarkdownToolsPage kind="excel" language={language} />}
            {toolSlug === 'csv-to-markdown' && <CsvMarkdownPage language={language} />}
            {toolSlug === 'json-to-markdown' && <JsonMarkdownPage language={language} />}
            {toolSlug === 'xml-to-markdown' && <XmlMarkdownPage language={language} />}
            {toolSlug === 'rtf-to-markdown' && <RtfMarkdownPage language={language} />}
            {toolSlug === 'paste-to-markdown' && <PasteMarkdownPage language={language} />}
            {toolSlug === 'website-to-markdown' && <WebsiteToMarkdownPage language={language} />}
            {toolSlug === 'notion-to-markdown' && <NotionMarkdownPage language={language} />}
            {toolSlug === 'google-docs-to-markdown' && <GoogleDocsMarkdownPage language={language} />}
            {toolSlug === 'markdown-to-html' && <MarkdownOutputPage kind="html" language={language} />}
            {toolSlug === 'markdown-to-pdf' && <MarkdownOutputPage kind="pdf" language={language} />}
            {toolSlug === 'markdown-to-word' && <MarkdownOutputPage kind="word" language={language} />}
            {toolSlug === 'markdown-to-csv' && <MarkdownOutputPage kind="csv" language={language} />}
            {toolSlug === 'markdown-viewer' && <MarkdownViewerPage language={language} />}
            {toolSlug === 'markdown-to-wechat' && <MarkdownWechatPage language={language} />}
            {toolSlug === 'markdown-to-xiaohongshu' && <MarkdownXiaohongshuPage language={language} />}
            {toolSlug === 'markdown-tools' && <MarkdownToolsHubPage language={language} />}
            {toolSlug === 'markdown-format-guide' && <MarkdownFormatGuidePage language={language} />}
            {toolSlug === 'merge-documents' && <MergeDocumentsGuidePage language={language} />}
            {toolSlug === 'merge-pdf' && <MergeToolPage kind="pdf" language={language} />}
            {toolSlug === 'merge-docx' && <MergeToolPage kind="docx" language={language} />}
            {toolSlug === 'merge-pptx' && <MergeToolPage kind="pptx" language={language} />}
            {toolSlug === 'merge-excel' && <MergeToolPage kind="xlsx" language={language} />}
            {toolSlug === 'sitemap-extractor' && <SitemapExtractorPage language={language} />}
            {toolSlug === 'sitemap-checker' && <SitemapCheckerPage language={language} />}
            {toolSlug === 'sitemap-validator' && <SitemapValidatorPage language={language} />}
            {toolSlug === 'sitemap-generator' && <SitemapGeneratorPage language={language} />}
            {toolSlug === 'website-url-extractor' && <WebsiteUrlExtractorPage language={language} />}
            {toolSlug === 'blog' && <BlogPage language={language} />}
            {toolSlug === 'blog/how-to-convert-html-to-markdown-for-ai' && <BlogPage language={language} articlePath="/blog/how-to-convert-html-to-markdown-for-ai" />}
            {toolSlug === 'blog/best-markdown-converter-for-ai-agents' && <BlogPage language={language} articlePath="/blog/best-markdown-converter-for-ai-agents" />}
            {toolSlug === 'blog/markdown-for-agents-tools' && <BlogPage language={language} articlePath="/blog/markdown-for-agents-tools" />}
            {toolSlug === 'pricing' && <><PricingPage language={language} onUpgrade={() => setShowUpgradeModal(true)} /><OnPageSeoContent page="pricing" language={language} /></>}
            {(toolSlug === 'docs' || toolSlug === 'help') && <HelpPage language={language} />}
            {toolSlug === 'about' && <TrustPage kind="about" language={language} />}
            {toolSlug === 'contact' && <TrustPage kind="contact" language={language} />}
            {(!toolSlug || toolSlug === 'url-to-markdown') && <div className="space-y-20">
            {/* Hero Banner */}
            <div className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {home.heroBadge}
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-normal">
                {toolSlug === 'url-to-markdown' ? urlPageContent.title : home.heroTitle}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                {toolSlug === 'url-to-markdown' ? urlPageContent.intro : home.heroDescription}
              </p>
              
            </div>

            {/* Input Card */}
            <div className="bg-[#0f1722] border border-[#1e293b] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-4 border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInputMode('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      inputMode === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ui.urlMode}
                  </button>
                  <button
                    onClick={() => setInputMode('html')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      inputMode === 'html' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ui.htmlMode}
                  </button>
                </div>
              </div>

              {inputMode === 'crawl' ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      placeholder={tr('Target domain or sitemap.xml URL', '输入目标域名或sitemap.xml链接')}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#090d12] border border-[#1e293b] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <label className="w-full sm:w-24 shrink-0 text-xs text-slate-400">
                      {tr('Pages', '抓取页数')}
                      <input
                        type="number"
                        min={1}
                        max={hasPaidCredits ? 100 : 5}
                        value={crawlPageLimit}
                        onChange={(e) => setCrawlPageLimit(Math.max(1, Math.min(hasPaidCredits ? 100 : 5, Number(e.target.value) || 1)))}
                        className="mt-1 w-full px-3 py-3 rounded-xl bg-[#090d12] border border-[#1e293b] text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </label>
                    <button
                      onClick={handleCrawl}
                      disabled={crawlLoading || !crawlUrl.trim()}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-semibold text-white flex items-center justify-center gap-2 transition"
                    >
                      {crawlLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                      {crawlLoading ? tr('Crawling...', '递归抓取中...') : tr('Start crawl', '开始抓取')}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {hasPaidCredits ? tr('Paid credits are charged by actual pages, up to 100 pages per request.', '付费点数按实际抓取页数扣除，每次最多100页。') : tr('Free users can crawl up to 5 pages per request.', '免费用户每次最多抓取5页。')}
                  </p>
                  {crawlResult && (
                    <div className="space-y-3 pt-3 border-t border-[#1e293b]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
                        <span>{tr('Pages', '抓取页面')}: <strong className="text-emerald-400">{crawlResult.total_pages}</strong></span>
                        <button
                          onClick={handleDownloadZip}
                          disabled={downloadingZip}
                          className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition"
                        >
                          {downloadingZip ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          {downloadingZip ? tr('Packaging...', '正在打包...') : tr('Download ZIP', '下载ZIP')}
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {crawlResult.results.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#090d12] border border-[#1e293b]">
                            <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate mt-1">{item.url}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : inputMode === 'url' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder={ui.urlPlaceholder}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#090d12] border border-[#1e293b] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                  <button
                    onClick={handleParse}
                    disabled={loading || !inputUrl.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      {loading ? ui.parsing : home.generate}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={5}
                    value={inputHtml}
                    onChange={(e) => setInputHtml(e.target.value)}
                    placeholder={ui.htmlPlaceholder}
                    className="w-full p-4 rounded-xl bg-[#090d12] border border-[#1e293b] text-xs font-mono text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleParse}
                      disabled={loading || !inputHtml.trim()}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold text-sm text-white shadow-lg flex items-center gap-2 transition"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {ui.parseHtml}
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}
              {(!toolSlug || toolSlug === 'url-to-markdown') && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  {home.quotaNote}
                </p>
              )}
            </div>

            {/* Result Area */}
            {result && (
              <div className="bg-[#0f1722] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl space-y-0">
                <div className="bg-[#111823] px-6 py-4 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {result.platform === 'general' ? urlResultLabels.general : result.platform}
                    </span>
                    <h2 className="text-base font-bold text-white max-w-xl truncate" title={result.title}>
                      {result.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono mr-2">
                      ⚡ {result.elapsed_ms}ms
                    </span>
                    <button
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090d12] border border-[#1e293b] text-xs font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                    >
                      {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedMd ? urlResultLabels.copied : urlResultLabels.copy}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090d12] border border-[#1e293b] text-xs font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {urlResultLabels.download}
                    </button>
                  </div>
                </div>

                {typeof result.source_tokens === 'number' && typeof result.markdown_tokens === 'number' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#1e293b] border-b border-[#1e293b]">
                    <div className="bg-[#0d131c] px-5 py-4">
                      <span className="block text-[11px] text-slate-500">{urlResultLabels.htmlTokens}</span>
                      <strong className="block text-lg text-slate-200 mt-1">{result.source_tokens.toLocaleString()} Tokens</strong>
                    </div>
                    <div className="bg-[#0d131c] px-5 py-4">
                      <span className="block text-[11px] text-slate-500">{urlResultLabels.markdownTokens}</span>
                      <strong className="block text-lg text-emerald-300 mt-1">{result.markdown_tokens.toLocaleString()} Tokens</strong>
                    </div>
                    <div className="bg-[#0d131c] px-5 py-4">
                      <span className="block text-[11px] text-slate-500">{urlResultLabels.savings}</span>
                      <strong className="block text-lg text-emerald-400 mt-1">{(result.token_savings_percent || 0).toFixed(1)}%</strong>
                      <span className="text-[10px] text-slate-500">{urlResultLabels.estimate}</span>
                    </div>
                  </div>
                )}

                <div className="px-6 py-2 bg-[#0d131c] border-b border-[#1e293b] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOutputTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'preview' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {urlResultLabels.preview}
                    </button>
                    <button
                      onClick={() => setOutputTab('source')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'source' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      {urlResultLabels.source}
                    </button>
                    <button
                      onClick={() => setOutputTab('images')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'images' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      {urlResultLabels.images} ({result.images.length})
                    </button>
                  </div>
                </div>

                <div className="p-6 min-h-[320px] max-h-[600px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#090d12]">
                  {outputTab === 'source' && (
                    <textarea
                      readOnly
                      value={result.markdown}
                      className="w-full h-[400px] bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                    />
                  )}

                  {outputTab === 'preview' && (
                    <div className="prose prose-invert prose-emerald max-w-none font-sans text-sm space-y-4">
                      {result.markdown.split('\n\n').map((block, idx) => {
                        if (block.startsWith('# ')) {
                          return <h1 key={idx} className="text-xl font-bold text-white">{block.slice(2)}</h1>;
                        }
                        if (block.startsWith('## ')) {
                          return <h2 key={idx} className="text-lg font-bold text-white border-b border-[#1e293b] pb-1">{block.slice(3)}</h2>;
                        }
                        if (block.startsWith('![')) {
                          const urlMatch = /\]\((.*?)\)/.exec(block);
                          if (urlMatch?.[1]) {
                            return (
                              <div key={idx} className="my-3 rounded-xl overflow-hidden border border-[#1e293b] bg-[#111823] p-2 inline-block max-w-md">
                                <img src={urlMatch[1]} alt="Extracted" className="rounded-lg max-h-80 object-cover" />
                              </div>
                            );
                          }
                        }
                        return <p key={idx} className="text-slate-300 leading-relaxed">{block}</p>;
                      })}
                    </div>
                  )}

                  {outputTab === 'images' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {result.images.length === 0 ? (
                        <p className="col-span-full text-slate-500 text-center py-8">{urlResultLabels.emptyImages}</p>
                      ) : (
                        result.images.map((imgUrl, idx) => (
                          <div key={idx} className="group relative bg-[#111823] border border-[#1e293b] rounded-xl overflow-hidden p-2">
                            <img src={imgUrl} alt={`Img ${idx}`} className="w-full h-36 object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-600 text-white"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {toolSlug === 'url-to-markdown' && (
              <div className="space-y-8 pt-10">
                <section aria-labelledby="url-howto-title" className="space-y-4">
                  <h2 id="url-howto-title" className="text-2xl font-bold text-white">{urlPageContent.how}</h2>
                  <div className="grid gap-4 md:grid-cols-3">{urlPageContent.steps.map(([title, body], index) => <div key={title} id={`url-step-${index + 1}`} className="rounded-xl border border-[#1e293b] bg-[#0f1722] p-4"><h3 className="font-semibold text-white">{index + 1}. {title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>)}</div>
                </section>
                <section className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-2"><div><h2 className="text-xl font-bold text-white">{urlPageContent.scope}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{urlPageContent.scopeText}</p></div><div><h2 className="text-xl font-bold text-white">{urlPageContent.quota}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{urlPageContent.quotaText}</p></div></section>
                <section className="border-t border-[#1e293b] pt-8"><h2 className="text-xl font-bold text-white">{urlQualityContent.title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{urlQualityContent.text}</p></section>
                <section aria-labelledby="url-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8"><h2 id="url-faq-title" className="text-xl font-bold text-white">{urlFaqTitle}</h2><div className="grid gap-3 md:grid-cols-3">{urlPageContent.faq.map(([question, answer]) => <details key={question} className="rounded-xl border border-[#1e293b] bg-[#0f1722] p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-200">{question}</summary><p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p></details>)}</div></section>
                <nav aria-label={urlRelatedTools.aria} className="flex flex-wrap gap-4 border-t border-[#1e293b] pt-6 text-sm text-emerald-300"><a href={localizedHref('/website-to-markdown', language)}>{urlRelatedTools.website}</a><a href={localizedHref('/sitemap-extractor', language)}>{urlRelatedTools.extractor}</a><a href={localizedHref('/sitemap-checker', language)}>{urlRelatedTools.checker}</a><a href={localizedHref('/markdown-viewer', language)}>{urlRelatedTools.viewer}</a></nav>
              </div>
            )}
            {!toolSlug && cleanContextSection}
            {!toolSlug && <HomeSeoSections language={language} />}
            </div>}
            </>
          </Suspense>
        )}

        {/* TAB 2: Full Site Crawl */}
        {activeTab === 'crawl' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-emerald-400" />
                {tr('Sitemap recursive crawl', '全站Sitemap递归抓取')}
              </h2>
              <p className="text-slate-400 text-xs mt-1">{tr('Enter a domain or sitemap.xml URL to discover and parse a list of Markdown pages.', '输入域名或sitemap.xml链接，自动发现并解析网页Markdown列表。')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder={tr('Target domain, such as https://docs.example.com or https://example.com/sitemap.xml', '输入目标域名，如https://docs.example.com或https://example.com/sitemap.xml')}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#090d12] border border-[#1e293b] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <label className="w-28 shrink-0 text-xs text-slate-400">
                  {tr('Pages', '抓取页数')}
                  <input
                    type="number"
                    min={1}
                    max={hasPaidCredits ? 100 : 5}
                    value={crawlPageLimit}
                    onChange={(e) => setCrawlPageLimit(Math.max(1, Math.min(hasPaidCredits ? 100 : 5, Number(e.target.value) || 1)))}
                    className="mt-1 w-full px-3 py-3 rounded-xl bg-[#090d12] border border-[#1e293b] text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </label>
                <button
                  onClick={handleCrawl}
                  disabled={crawlLoading || !crawlUrl.trim()}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-semibold text-white flex items-center gap-2 transition"
                >
                  {crawlLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  {crawlLoading ? tr('Crawling...', '递归抓取中...') : tr('Start site crawl', '开始全站抓取')}
                </button>
              </div>
              <p className="text-xs text-slate-500">{hasPaidCredits ? tr('Paid credits are charged by actual pages, up to 100 pages per request.', '付费点数按实际抓取页数扣除，每次最多100页。') : tr('Free users can crawl up to 5 pages per request. Upgrade for a higher limit.', '免费用户每次最多抓取5页，付费后可提高单次抓取页数。')}</p>

              {crawlResult && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-[#1e293b] pb-2">
                    <span>{tr('Domain', '域名')}: <strong className="text-white">{crawlResult.domain}</strong></span>
                    <div className="flex items-center gap-3">
                      <span>{tr('Pages', '抓取页面')}: <strong className="text-emerald-400">{crawlResult.total_pages}</strong> <span className="hidden sm:inline">({tr('took', '耗时')} {crawlResult.elapsed_ms}ms)</span></span>
                      <button
                        onClick={handleDownloadZip}
                        disabled={downloadingZip}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                      >
                        {downloadingZip ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {downloadingZip ? tr('Packaging...', '正在打包...') : tr('Download all Markdown (.zip)', '一键打包下载全站Markdown(.zip)')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {crawlResult.results.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate max-w-md">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{item.url}</span>
                        </div>
                        <pre className="p-2 rounded bg-[#111823] font-mono text-[11px] text-slate-400 max-h-24 overflow-hidden">
                          {item.markdown.slice(0, 200)}...
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-6">
              <span className="text-xs font-semibold text-emerald-400">{language === 'en' ? 'My Herdown' : '我的Herdown'}</span>
              <h2 className="text-2xl font-bold text-white mt-2">{language === 'en' ? 'Account' : '账号管理'}</h2>
              {sessionUser ? (
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {sessionUser.avatar_url ? <img src={sessionUser.avatar_url} alt="" className="w-12 h-12 rounded-full border border-[#29423d]" /> : <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-300"><UserRound /></div>}
                  <div>
                    <p className="font-bold text-white">{sessionUser.display_name || (language === 'en' ? 'Google user' : 'Google用户')}</p>
                    <p className="text-sm text-slate-400">{sessionUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-sm text-slate-400 leading-7">{language === 'en' ? 'Sign in to recover your API keys after changing devices or clearing browser data, and view your quota.' : '登录后可以在更换设备或清理浏览器缓存后找回API密钥，并查看自己的额度。'}</p>
                  <button onClick={handleGoogleLogin} className="mt-4 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold">{ui.login}</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b]"><span className="text-xs text-slate-400">{language === 'en' ? 'Active API keys' : '当前API密钥'}</span><p className="text-2xl font-extrabold text-white mt-2">{apiKeys.filter(key => key.status === 'active').length}</p></div>
              <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b]"><span className="text-xs text-slate-400">{language === 'en' ? 'Monthly free quota' : '本月免费额度'}</span><p className="text-2xl font-extrabold text-emerald-400 mt-2">{hasPaidCredits ? (language === 'en' ? 'Not used' : '不扣免费额度') : `${(freeRemaining ?? 1000).toLocaleString()}${language === 'en' ? '' : '次'}`}</p></div>
              <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b]"><span className="text-xs text-slate-400">{language === 'en' ? 'Paid credits' : '付费点数'}</span><p className="text-2xl font-extrabold text-white mt-2">{(hasPaidCredits ? (creditBalance ?? 0) : 0).toLocaleString()}{language === 'en' ? '' : '次'}</p></div>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#0d131d] p-5 text-sm text-slate-400 leading-7">
              {language === 'en' ? 'The free quota is 1,000 parses per user per month and is shared across IP, device, and API key. Changing keys does not reset it. Each IP can create one API key per week. Paid credits do not expire or auto-renew.' : '免费额度是每个用户每月1000次，IP、设备和API密钥共同计算，换密钥不会重置。API密钥每周最多创建1个。付费点数不过期，也不会自动续费。'}
            </div>
          </div>
        )}

        {activeTab === 'admin' && sessionUser?.is_admin && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <span className="text-xs font-semibold text-emerald-400">{language === 'en' ? 'Herdown admin' : 'Herdown后台'}</span>
              <h2 className="text-2xl font-bold text-white mt-2">{language === 'en' ? 'Operations' : '运营管理'}</h2>
              <p className="text-sm text-slate-400 mt-2">{language === 'en' ? 'Only necessary operational data is shown. Submitted page bodies are not stored.' : '只显示必要的运营数据，不保存用户提交的网页正文。'}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                [language === 'en' ? 'Users' : '用户', adminOverview?.stats.users ?? 0],
                [language === 'en' ? 'Active keys' : '活跃密钥', adminOverview?.stats.active_keys ?? 0],
                [language === 'en' ? 'Completed orders' : '完成订单', adminOverview?.stats.completed_orders ?? 0],
                [language === 'en' ? 'Credits sold' : '已售额度', adminOverview?.stats.sold_credits ?? 0],
                [language === 'en' ? 'Usage records' : '调用记录', adminOverview?.stats.usage_requests ?? 0],
              ].map(([label, value]) => <div key={label} className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]"><span className="text-xs text-slate-400">{label}</span><p className="text-xl font-extrabold text-white mt-2">{Number(value).toLocaleString()}</p></div>)}
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{language === 'en' ? 'Processing monitoring' : '处理监控'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{language === 'en' ? 'Only processing metadata is recorded, never submitted content.' : '只记录处理统计，不保存用户提交的正文或文件。'}</p>
                </div>
                <span className="text-xs text-slate-500">{language === 'en' ? 'All time' : '累计数据'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  [language === 'en' ? 'Total' : '处理总量', adminOverview?.processing?.total ?? 0],
                  [language === 'en' ? 'Succeeded' : '成功', adminOverview?.processing?.succeeded ?? 0],
                  [language === 'en' ? 'Failed' : '失败', adminOverview?.processing?.failed ?? 0],
                  [language === 'en' ? 'Success rate' : '成功率', `${adminOverview?.processing?.success_rate ?? 0}%`],
                  [language === 'en' ? 'Avg duration' : '平均耗时', `${adminOverview?.processing?.average_duration_ms ?? 0}ms`],
                ].map(([label, value]) => <div key={label} className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]"><span className="text-xs text-slate-400">{label}</span><p className="text-xl font-extrabold text-white mt-2">{typeof value === 'number' ? value.toLocaleString() : value}</p></div>)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#1e293b] bg-[#0f1722] overflow-hidden">
                  <div className="p-4 border-b border-[#1e293b] font-bold text-white">{language === 'en' ? 'Failure reasons' : '失败原因'}</div>
                  <div className="divide-y divide-[#1e293b]">
                    {(adminOverview?.processing?.failure_reasons || []).map(item => <div key={item.reason} className="p-3 flex items-center justify-between gap-4 text-sm"><span className="text-slate-300 truncate">{item.reason}</span><span className="text-amber-300">{item.count}</span></div>)}
                    {!adminOverview?.processing?.failure_reasons?.length && <p className="p-4 text-sm text-slate-500">{language === 'en' ? 'No failure records.' : '暂无失败记录。'}</p>}
                  </div>
                </div>
                <div className="rounded-xl border border-[#1e293b] bg-[#0f1722] overflow-hidden">
                  <div className="p-4 border-b border-[#1e293b] font-bold text-white">{language === 'en' ? 'File and source types' : '文件和来源类型'}</div>
                  <div className="divide-y divide-[#1e293b]">
                    {(adminOverview?.processing?.file_types || []).map(item => <div key={item.file_type} className="p-3 flex items-center justify-between gap-4 text-sm"><span className="text-slate-300">{item.file_type}</span><span className="text-emerald-300">{item.count}</span></div>)}
                    {!adminOverview?.processing?.file_types?.length && <p className="p-4 text-sm text-slate-500">{language === 'en' ? 'No processing records yet.' : '暂无处理记录。'}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#1e293b] bg-[#0f1722] overflow-hidden">
              <div className="p-5 border-b border-[#1e293b] font-bold text-white">{language === 'en' ? 'Recently registered users' : '最近注册用户'}</div>
              <div className="divide-y divide-[#1e293b]">
                {(adminOverview?.recent_users || []).map((item, index) => <div key={`${item.email}-${index}`} className="p-4 flex items-center justify-between gap-4 text-sm"><div><p className="text-white">{item.display_name || (language === 'en' ? 'Google user' : 'Google用户')}</p><p className="text-slate-500">{item.email}</p></div><span className="text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</span></div>)}
                {!adminOverview?.recent_users?.length && <p className="p-5 text-sm text-slate-500">{language === 'en' ? 'No data yet.' : '暂无数据，点击管理入口后会自动加载。'}</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: API Keys & Pricing Modal trigger */}
        {activeTab === 'keys' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{language === 'en' ? 'API key console' : 'API密钥控制台'}</h2>
                <p className="text-slate-400 text-xs mt-1">{sessionUser ? (language === 'en' ? 'Your API keys are linked to your Google account and can be recovered on other devices.' : 'API密钥已绑定到你的Google账号，可在其他设备登录后找回。') : (language === 'en' ? 'Without sign-in, keys are stored only in this browser. Sign in before creating one.' : '未登录时密钥只保存在当前浏览器，建议登录Google账号后再创建。')}{language === 'en' ? ' Credits are added to the key used for payment.' : '付款后的点数会自动发放到你用于付款的密钥。'}</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <CreditCard className="w-4 h-4" />
                {tr('Upgrade', '升级')}
              </button>
            </div>

            {/* Usage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">{language === 'en' ? 'Requests today' : '今日解析请求'}</span>
                <p className="text-2xl font-extrabold text-white mt-1">{stats.today_requests}{language === 'en' ? '' : '次'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">{language === 'en' ? 'Available parse quota' : '可用解析额度'}</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{hasPaidCredits ? `${(creditBalance ?? 0).toLocaleString()}${language === 'en' ? ' parses' : '次'}` : `${(freeRemaining ?? 1000).toLocaleString()}${language === 'en' ? ' parses' : '次'}`}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                <span className="text-xs text-slate-400 font-medium">{language === 'en' ? 'Active API keys' : '已生效API密钥'}</span>
                <p className="text-2xl font-extrabold text-white mt-1">{apiKeys.filter(k => k.status === 'active').length}</p>
              </div>
            </div>

            {/* Key Creator */}
            <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder={language === 'en' ? 'Key name, such as ClaudeAgent or CursorPro' : '输入Key名称，如ClaudeAgent或CursorPro'}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#090d12] border border-[#1e293b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleCreateKey}
                  disabled={creatingKey || !newKeyName.trim() || !turnstileToken}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                    {language === 'en' ? 'Create API key' : '生成新Key'}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                  {turnstileSiteKey ? <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} /> : (
                    <p className="text-xs text-amber-300">{tr('Security verification is being configured. New keys are temporarily unavailable.', '安全验证正在配置中，暂时不能创建新密钥。')}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-6">{tr('Each IP can create one API key per week. Free quota is shared across IP, device, and key; changing keys does not reset it.', '同一IP每周最多创建1个API密钥。免费额度按IP、设备和密钥共同计算，换密钥不会重置。')}</p>
              </div>
              {keyCreationMessage && <p className="text-xs text-rose-300">{keyCreationMessage}</p>}
            </div>

            {/* Keys Table */}
            <div className="bg-[#0f1722] border border-[#1e293b] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111823] border-b border-[#1e293b] text-[11px] font-semibold text-slate-400 uppercase">
                    <th className="p-4">{tr('Key name', 'Key名称')}</th>
                    <th className="p-4">{language === 'en' ? 'API token' : 'API密钥Token'}</th>
                    <th className="p-4">{tr('Created', '创建时间')}</th>
                    <th className="p-4">{tr('Status', '状态')}</th>
                    <th className="p-4 text-right">{tr('Actions', '操作')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-xs">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        {language === 'en' ? 'No active API key. Create one above; sign in to link it to your account.' : '尚无活跃APIKey。点击上方“生成新Key”创建专属密钥；登录后密钥会绑定到你的账号。'}
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#111823]/50 transition">
                        <td className="p-4 font-semibold text-white">{item.name}</td>
                        <td className="p-4 font-mono text-emerald-400">
                          {item.key.slice(0, 10)}****************
                        </td>
                        <td className="p-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.key);
                              setCopiedKeyIndex(idx);
                              setTimeout(() => setCopiedKeyIndex(null), 2000);
                            }}
                            className="px-2 py-1 rounded bg-[#1e293b] text-slate-300 hover:text-white"
                          >
                            {copiedKeyIndex === idx ? ui.copied : language === 'en' ? 'Copy token' : '复制Token'}
                          </button>
                          {item.status === 'active' && (
                            <button
                              onClick={() => handleRevokeKey(item.key)}
                              className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            >
                              {language === 'en' ? 'Revoke' : '撤销'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MCP & Advanced REST API Documentation */}
        {activeTab === 'mcp' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">{tr('Remote MCP and advanced RESTAPI', '远程MCP和高级RESTAPI指南')}</h2>
                <p className="text-slate-400 text-xs mt-1">{tr('Site crawl, webpage screenshots, structured endpoints, and MCP protocol.', '支持全站抓取、网页截图、结构化接口和MCP协议。')}</p>
            </div>

            {/* MCP Integration Card */}
            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">{tr('Remote MCP endpoint configuration', '远程MCP端点配置')} <span className="text-slate-500">Anthropic MCP Standard</span></h3>
              </div>
              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
{`{
  "mcpServers": {
    "herdown": {
      "command": "npx",
      "args": ["-y", "@herdown/mcp", "https://api.herdown.com/mcp"],
      "env": {
        "HERDOWN_API_KEY": "${activeApiKeySample}"
      }
    }
  }
}`}
              </pre>
            </div>

            {/* Advanced Endpoints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b] space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  {tr('Site crawl API', '全站抓取API')} (<code className="text-emerald-400">POST /v1/crawl</code>)
                </h4>
                <pre className="p-3 rounded-lg bg-[#090d12] font-mono text-[11px] text-slate-300 overflow-x-auto">
{`curl -X POST "https://api.herdown.com/v1/crawl" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/sitemap.xml"}'`}
                </pre>
              </div>

              <div className="p-5 rounded-xl bg-[#0f1722] border border-[#1e293b] space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  {tr('Web screenshot API', '网页截图API')} (<code className="text-emerald-400">POST /v1/screenshot</code>)
                </h4>
                <pre className="p-3 rounded-lg bg-[#090d12] font-mono text-[11px] text-slate-300 overflow-x-auto">
{`curl -X POST "https://api.herdown.com/v1/screenshot" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://mp.weixin.qq.com/s/xxx"}'`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLI */}
        {activeTab === 'cli' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">npx @herdown/cli {tr('CLI tool', '命令行工具')}</h2>
                <p className="text-slate-400 text-xs mt-1">{tr('Run it from a terminal without a global install and generate clean Markdown.', '无需全局安装，在终端一键抓取并生成干净Markdown。')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-emerald-300 overflow-x-auto">
{`# ${language === 'en' ? 'Print Markdown in the terminal' : '在终端直接打印Markdown'}
npx @herdown/cli "https://mp.weixin.qq.com/s/xxxxxx"

# ${language === 'en' ? 'Save output to a local output.md file' : '保存输出到本地output.md文件'}
npx @herdown/cli "https://mp.weixin.qq.com/s/xxxxxx" -o output.md`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 6: SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {tr('Standard Agent Skill package and platform guide', '标准AgentSkill扩展包和平台支持规范')}
              </div>
              <h2 className="text-2xl font-bold text-white">{tr('Install Herdown for your AI agent', '一键为AIAgent安装Herdown技能')}</h2>
                <p className="text-slate-400 text-xs mt-1">
                {tr('Works with Hermes Agent, Claude Code, OpenClaw, QClaw, and Antigravity. Configure the Skill in your agent environment.', '兼容Hermes Agent、Claude Code、OpenClaw、QClaw和Antigravity。把Skill配置到你的Agent环境即可。')}
              </p>
            </div>

            {/* 平台规则细则卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-2">🟢 {tr('WeChat Official Account', '微信公众号')} (mp.weixin.qq)</span>
<span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">{tr('Supported', '已支持')}</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>{tr('Removes related posts, sharing controls, and recommendations.', '自动过滤底部在看、分享、往期推荐。')}</li>
                  <li>{tr('Restores WeChat tables as Markdown.', '支持table微信特殊表格的Markdown还原。')}</li>
                  <li><strong>{tr('Image hotlink handling', '特有抗防盗链')}</strong>: {tr('Adds local-friendly image references for preview.', '自动处理图片引用，便于本地预览。')}</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-2">{tr('General webpages', '网页图文')} </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">{tr('Supported', '已支持')}</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>{tr('Removes sharing controls, related content, and comments.', '自动剥离底部分享、相似推荐、评论区。')}</li>
                  <li>{tr('Extracts image galleries and preserves page structure.', '一键提取完整图集及高清原图，还原排版。')}</li>
                  <li>{tr('Handles common image hotlink restrictions.', '支持常见图片防盗链处理。')}</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-2">{tr('Social posts', '社交帖子')} (X / Twitter)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">{tr('Supported', '已支持')}</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>{tr('Removes trends, suggested accounts, and redundant timestamps.', '一键剥离侧边趋势、推荐关注和多余的时间戳。')}</li>
                  <li>{tr('Extracts post text and multiple images with clean formatting.', '支持多图、主帖正文提取并规范排版。')}</li>
                  <li>{tr('Adds metadata suitable for local knowledge tools.', '自动附带适合本地知识管理工具的元数据属性。')}</li>
                </ul>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">packages/cli/SKILL.md</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(skillSnippet);
                    alert(tr('SKILL.md copied to clipboard.', 'SKILL.md已成功复制到剪贴板！'));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {tr('Copy SKILL.md', '一键复制SKILL.md')}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-[#090d12] border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{skillSnippet}
              </pre>
            </div>
            <OnPageSeoContent page="skill" language={language} />
          </div>
        )}

        {/* TAB: Chrome Extension */}
        {activeTab === 'extension' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Layers className="w-4 h-4 text-emerald-400" />
                {tr('Herdown browser extension V1.1.5', 'Herdown浏览器扩展V1.1.5')}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                {language === 'en' ? <>A <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">zero-cost extraction extension</span> running locally in your browser</> : <>直接运行在您浏览器本地的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">零成本提取插件</span></>}
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                {tr('Process the current page locally in your browser and turn its rendered content into clean material.', '直接在浏览器本地读取当前页面内容，整理成干净资料。')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-2">
              <div className="p-6 rounded-2xl bg-[#0d131d] border border-[#1e293b] space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'en' ? <>Download the ZIP package, unzip it, open <code className="text-emerald-400">chrome://extensions/</code> in Chrome, enable Developer mode, then choose Load unpacked.</> : <>下载ZIP包并解压后，在Chrome打开<code className="text-emerald-400">chrome://extensions/</code>，开启右上方“开发者模式”，点击“加载已解压的扩展程序”选择本目录即可！</>}
                </p>
                <div className="pt-2">
                  <a
                    href="/downloads/herdown-extension-v1.2.1.zip"
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    {ui.extensionZip}
                  </a>
                </div>
              </div>

            </div>

            <div className="p-6 rounded-2xl bg-[#0a0f16] border border-emerald-500/20 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {tr('Extension features', '插件特色功能全览')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">{tr('Local Markdown export', '本地Markdown导出')}</strong>
                  {tr('No extra server is required. Export Markdown for local tools with one click.', '无需额外服务器，点击按钮即可导出适合本地工具继续处理的Markdown。')}
                </div>
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">{tr('Web element Inspector picker', '网页元素Inspector拾取器')}</strong>
                  {tr('For complex pages, enable picker mode and click any area to convert that HTML block.', '遇到复杂网页时，开启鼠标拾取模式，点击任意区域精确转换该HTML块。')}
                </div>
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">{tr('Word count and reading time', '自动化字数与阅读时长统计')}</strong>
                  {language === 'en' ? <>Clean invisible characters, estimate <code className="text-slate-200">word_count</code> and <code className="text-slate-200">reading_time</code>, and add <code className="text-slate-200">tags: [herdown, clippings]</code>.</> : <>全自动清洗不可见字符，智能预估<code className="text-slate-200">word_count</code>与<code className="text-slate-200">reading_time</code>并自动打上<code className="text-slate-200">tags: [herdown, clippings]</code>。</>}
                </div>
                <div className="p-3 rounded-xl bg-[#0f1722] border border-[#1e293b]">
                  <strong className="text-emerald-400 block mb-1">{tr('Templates and output settings', '模板与输出设置')}</strong>
                  {tr('Choose a filename, folder, Obsidian vault, and frontmatter template without uploading page content.', '可设置文件名、文件夹、Obsidian Vault和Frontmatter模板，网页内容不上传。')}
                </div>
              </div>
            </div>
            <OnPageSeoContent page="browser-extension" language={language} />
          </div>
        )}

        {activeTab === 'converter' && (!toolSlug || toolSlug === 'faq') && (
          <section id="faq" className="max-w-4xl mx-auto mt-28 scroll-mt-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{home.faqTitle}</h2>
            </div>

            <div className="rounded-2xl border border-[#1e293b] bg-[#0d131d] divide-y divide-[#1e293b] overflow-hidden">
              {home.faqItems.map(item => (
                <details key={item.question} className="group p-5">
                  <summary className="cursor-pointer list-none text-sm font-bold text-white flex items-center justify-between gap-4">
                    {item.question}
                    <span className="text-emerald-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-sm text-slate-400 leading-7 pt-3">{item.answer}</p>
                </details>
              ))}
            </div>

            <div className="mt-5 text-xs">
              <div className="rounded-xl border border-[#1e293b] bg-[#0d131d] p-4"><span className="text-emerald-400 font-bold block mb-1">{home.freePlan}</span><span className="text-white font-bold">{ui.free}</span>{home.freePlanSuffix}</div>
            </div>
          </section>
        )}
      </main>

      {/* Pricing Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1722] border border-[#1e293b] rounded-2xl max-w-4xl w-full p-6 space-y-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                {language === 'en' ? 'Checkout' : '支付收银台'}
              </span>
              <h3 className="text-2xl font-extrabold text-white">{language === 'en' ? 'Upgrade Herdown credits' : '升级Herdown额度'}</h3>
              <p className="text-xs text-slate-400">{language === 'en' ? 'Create an API key first. Credits are added to it after payment.' : '先创建API密钥，付款成功后点数会自动发放到该密钥'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {pricingPackages.map((item) => (
                <div key={item.code} className={`p-5 rounded-xl bg-gradient-to-b from-[#132320] to-[#111823] border ${item.featured ? 'border-2 border-emerald-500' : 'border-[#29423d]'} space-y-5 shadow-lg shadow-emerald-950/20`}>
                  <div className="space-y-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${item.featured ? 'bg-emerald-500 text-black' : 'bg-emerald-500/15 text-emerald-300'}`}>{language === 'en' ? (item.code === 'starter' ? 'Starter' : item.code === 'standard' ? 'Standard' : 'Bulk') : item.label}</span>
                    <h4 className="text-lg font-bold text-white">{language === 'en' ? 'One-time payment' : '一次性付款'}</h4>
                    <div className="text-2xl font-black text-emerald-400">US${item.price}</div>
                    <p className="text-sm text-white font-semibold">{item.credits}{language === 'en' ? ' parses' : '次解析额度'}</p>
                    <p className="text-xs text-slate-400 leading-6">{language === 'en' ? 'Credits do not expire or auto-renew.' : '点数不过期，不自动续费。'}</p>
                    <p className="text-xs text-slate-300 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{language === 'en' ? 'Web, API, MCP, and CLI' : '支持网页、API、MCP和CLI'}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedProduct(item.code); void handleCheckout(item.code); }}
                    disabled={checkoutLoading}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2"
                  >
                    {checkoutLoading && selectedProduct === item.code ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    {language === 'en' ? 'Upgrade now' : '立即升级'}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-emerald-200">{language === 'en' ? '1,000 free parses per user per month. IP, device, and API key are counted together; changing keys does not reset the quota.' : '每个用户每月1,000次免费解析，IP、设备和API密钥共同计算，换密钥不会重置。'}</p>

            <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-[#1e293b]/60 leading-relaxed">
              🔒 {language === 'en' ? 'Digital API credits are virtual goods and are delivered after successful payment; refunds are subject to the terms.' : '声明：数字API额度属于虚拟商品，开通/充值成功即完成交付，不支持无理由退款。'}<br />
              {language === 'en' ? 'Herdown processes content in real time and does not host or leak third-party images or private content.' : '项目采用零数据存储架构，仅作实时格式解析，绝不转存、托管或泄露第三方图片与隐私内容。'}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="herdown-site-footer border-t border-[#1e293b] bg-[#070a0e] py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:hidden rounded-2xl border border-[#1e293b] bg-[#0b1119] overflow-hidden text-sm">
            <details className="group border-b border-[#1e293b]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-semibold text-slate-200">
                {language === 'en' ? 'Tools' : '工具'}
                <span className="text-lg font-normal text-emerald-400 transition group-open:rotate-45">+</span>
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4 text-slate-400">
                <a href={localizedHref('/tools', language)} className="hover:text-emerald-300 transition">{footer.allTools}</a>
                {(['url-to-markdown', 'website-to-markdown', 'txt-to-markdown', 'word-to-markdown', 'pdf-to-markdown', 'ppt-to-markdown', 'excel-to-markdown', 'csv-to-markdown', 'json-to-markdown', 'xml-to-markdown', 'rtf-to-markdown', 'paste-to-markdown', 'notion-to-markdown', 'google-docs-to-markdown', 'markdown-to-html', 'markdown-to-pdf', 'markdown-to-word', 'markdown-to-csv', 'markdown-viewer', 'markdown-to-wechat', 'markdown-to-xiaohongshu', 'markdown-tools', 'markdown-format-guide', 'merge-documents', 'merge-pdf', 'merge-docx', 'merge-pptx', 'merge-excel', 'sitemap-extractor', 'sitemap-checker', 'sitemap-validator', 'sitemap-generator', 'website-url-extractor'] as const).map(slug => (
                  <a key={slug} href={localizedHref(`/${slug}`, language)} className="hover:text-emerald-300 transition">{toolLabel(slug, language)}</a>
                ))}
              </div>
            </details>
            <details className="group border-b border-[#1e293b]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-semibold text-slate-200">
                {home.developers}
                <span className="text-lg font-normal text-emerald-400 transition group-open:rotate-45">+</span>
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4 text-slate-400">
                <a href={localizedHref('/docs', language)} className="hover:text-emerald-300 transition">{ui.docs}</a>
                <a href={localizedHref('/api', language)} className="hover:text-emerald-300 transition">{ui.api}</a>
                <a href={localizedHref('/mcp', language)} className="hover:text-emerald-300 transition">{ui.mcp}</a>
                <a href={localizedHref('/cli', language)} className="hover:text-emerald-300 transition">{ui.cli}</a>
                <a href={localizedHref('/skill', language)} className="hover:text-emerald-300 transition">{ui.skill}</a>
                <a href={localizedHref('/browser-extension', language)} className="hover:text-emerald-300 transition">{ui.extension}</a>
              </div>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-semibold text-slate-200">
                {footer.helpLegal}
                <span className="text-lg font-normal text-emerald-400 transition group-open:rotate-45">+</span>
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4 text-slate-400">
                <a href={localizedHref('/faq', language)} className="hover:text-emerald-300 transition">{ui.faq}</a>
                <a href={localizedHref('/blog', language)} className="hover:text-emerald-300 transition">{footer.blog}</a>
                <a href={localizedHref('/about', language)} className="hover:text-emerald-300 transition">{language === 'en' ? 'About' : language === 'ja' ? 'About' : language === 'es' ? 'Acerca de' : language === 'de' ? 'Über uns' : '关于我们'}</a>
                <a href={localizedHref('/contact', language)} className="hover:text-emerald-300 transition">{language === 'en' ? 'Contact' : language === 'ja' ? 'お問い合わせ' : language === 'es' ? 'Contacto' : language === 'de' ? 'Kontakt' : '联系邮箱'}</a>
                <a href={localizedHref('/terms', language)} className="hover:text-emerald-300 transition">{ui.terms}</a>
                <a href={localizedHref('/privacy', language)} className="hover:text-emerald-300 transition">{ui.privacy}</a>
                <a href="mailto:vkdefi@gmail.com" className="hover:text-emerald-300 transition">{ui.contact}</a>
                <a href="https://x.com/vkdefi" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">@vkdefi</a>
                <a href="https://github.com/less1001/herdown" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">{footer.githubRepo}</a>
              </div>
            </details>
          </div>
          <div className="hidden gap-8 text-xs sm:grid sm:grid-cols-3">
            <div>
              <h3 className="mb-3 font-semibold text-slate-200">{language === 'en' ? 'Tools' : '工具'}</h3>
              <div className="flex flex-col items-start gap-2 text-slate-500">
                <a href={localizedHref('/tools', language)} className="hover:text-emerald-300 transition">{footer.allTools}</a>
                {(['url-to-markdown', 'website-to-markdown', 'txt-to-markdown', 'word-to-markdown', 'pdf-to-markdown', 'ppt-to-markdown', 'excel-to-markdown', 'csv-to-markdown', 'json-to-markdown', 'xml-to-markdown', 'rtf-to-markdown', 'paste-to-markdown', 'notion-to-markdown', 'google-docs-to-markdown', 'markdown-to-html', 'markdown-to-pdf', 'markdown-to-word', 'markdown-to-csv', 'markdown-viewer', 'markdown-to-wechat', 'markdown-to-xiaohongshu', 'markdown-tools', 'markdown-format-guide', 'merge-documents', 'merge-pdf', 'merge-docx', 'merge-pptx', 'merge-excel', 'sitemap-extractor', 'sitemap-checker', 'sitemap-validator', 'sitemap-generator', 'website-url-extractor'] as const).map(slug => (
                  <a key={slug} href={localizedHref(`/${slug}`, language)} className="hover:text-emerald-300 transition">{toolLabel(slug, language)}</a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-slate-200">{home.developers}</h3>
              <div className="flex flex-col items-start gap-2 text-slate-500">
                <a href={localizedHref('/docs', language)} className="hover:text-emerald-300 transition">{ui.docs}</a>
                <a href={localizedHref('/api', language)} className="hover:text-emerald-300 transition">{ui.api}</a>
                <a href={localizedHref('/mcp', language)} className="hover:text-emerald-300 transition">{ui.mcp}</a>
                <a href={localizedHref('/cli', language)} className="hover:text-emerald-300 transition">{ui.cli}</a>
                <a href={localizedHref('/skill', language)} className="hover:text-emerald-300 transition">{ui.skill}</a>
                <a href={localizedHref('/browser-extension', language)} className="hover:text-emerald-300 transition">{ui.extension}</a>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-slate-200">{footer.helpLegal}</h3>
              <div className="flex flex-col items-start gap-2 text-slate-500">
                <a href={localizedHref('/faq', language)} className="hover:text-emerald-300 transition">{ui.faq}</a>
                <a href={localizedHref('/blog', language)} className="hover:text-emerald-300 transition">{footer.blog}</a>
                <a href={localizedHref('/about', language)} className="hover:text-emerald-300 transition">{language === 'en' ? 'About' : language === 'ja' ? 'About' : language === 'es' ? 'Acerca de' : language === 'de' ? 'Über uns' : '关于我们'}</a>
                <a href={localizedHref('/contact', language)} className="hover:text-emerald-300 transition">{language === 'en' ? 'Contact' : language === 'ja' ? 'お問い合わせ' : language === 'es' ? 'Contacto' : language === 'de' ? 'Kontakt' : '联系邮箱'}</a>
                <a href={localizedHref('/terms', language)} className="hover:text-emerald-300 transition">{ui.terms}</a>
                <a href={localizedHref('/privacy', language)} className="hover:text-emerald-300 transition">{ui.privacy}</a>
                <a href="mailto:vkdefi@gmail.com" className="hover:text-emerald-300 transition">{ui.contact}</a>
                <a href="https://x.com/vkdefi" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">@vkdefi</a>
                <a href="https://github.com/less1001/herdown" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">{footer.githubRepo}</a>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#1e293b] pt-4 text-xs text-slate-500 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
            <div>© 2026 <span className="font-medium text-slate-300">Herdown</span>. {footer.copyright}</div>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              {localeValue(language, { zh: '端到端隐私保护', en: 'End-to-End Privacy Preserved', ja: 'エンドツーエンドのプライバシー保護', es: 'Privacidad de extremo a extremo', de: 'Ende-zu-Ende-Datenschutz' })}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
