import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
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
  Upload
} from 'lucide-react';
import { getInitialLanguage, Language, messages } from './i18n';

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

type ToolSlug = 'tools' | 'url-to-markdown' | 'txt-to-markdown' | 'pdf-to-markdown' | 'word-to-markdown' | 'ppt-to-markdown' | 'excel-to-markdown' | 'docs' | 'help' | 'faq' | 'api' | 'mcp' | 'cli' | 'skill' | 'pricing' | 'browser-extension' | null;
type ProductCode = 'starter' | 'standard' | 'bulk';

declare global {
  interface Window {
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
  return ['tools', 'url-to-markdown', 'txt-to-markdown', 'pdf-to-markdown', 'word-to-markdown', 'ppt-to-markdown', 'excel-to-markdown', 'docs', 'help', 'faq', 'api', 'mcp', 'cli', 'skill', 'pricing', 'browser-extension'].includes(slug) ? slug : null;
};

const toolPageInfo: Record<Exclude<ToolSlug, null>, { title: string; enTitle: string; description: string; enDescription: string; local?: boolean }> = {
  tools: { title: '本地资料', enTitle: 'Local materials', description: '选择本地资料，整理成可以直接使用的Markdown。网页链接请使用首页转换。', enDescription: 'Choose a local file and prepare it as Markdown. Use the homepage for webpage links.' },
  'url-to-markdown': { title: 'URL转Markdown', enTitle: 'URL to Markdown', description: '粘贴网页链接，提取正文、标题、图片和来源信息，生成干净Markdown。', enDescription: 'Paste a webpage URL to extract the body, title, images, and source metadata into clean Markdown.' },
  'txt-to-markdown': { title: 'TXT转Markdown', enTitle: 'TXT to Markdown', description: '把纯文本整理成可直接保存和交给AI使用的Markdown文件。', enDescription: 'Turn plain text into a Markdown file ready to save or send to an AI tool.' },
  'pdf-to-markdown': { title: 'PDF转Markdown', enTitle: 'PDF to Markdown', description: '使用本地MarkItDown处理可提取文字的PDF，不上传文件，不增加服务器费用。', enDescription: 'Use local MarkItDown to process text-based PDFs without uploading files or adding server cost.', local: true },
  'word-to-markdown': { title: 'Word转Markdown', enTitle: 'Word to Markdown', description: '使用本地MarkItDown把Word文档整理为结构化Markdown。', enDescription: 'Use local MarkItDown to turn Word documents into structured Markdown.', local: true },
  'ppt-to-markdown': { title: 'PPT转Markdown', enTitle: 'PPT to Markdown', description: '使用本地MarkItDown把PPT和PPTX整理为结构化Markdown。', enDescription: 'Use local MarkItDown to turn PPT and PPTX files into structured Markdown.', local: true },
  'excel-to-markdown': { title: 'Excel转Markdown', enTitle: 'Excel to Markdown', description: '使用本地MarkItDown把Excel表格整理成适合AI读取的Markdown。', enDescription: 'Use local MarkItDown to turn Excel spreadsheets into Markdown for AI tools.', local: true },
  docs: { title: 'Docs文档', enTitle: 'Docs', description: '查看网页转换、API、MCP、CLI、本地工具和AIAgent接入说明。', enDescription: 'Read guides for web conversion, API, MCP, CLI, local tools, and AI agent integrations.' },
  help: { title: '帮助文档', enTitle: 'Help', description: '从网页转换、API密钥、MCP和本地文档工具开始使用Herdown。', enDescription: 'Start using Herdown with web conversion, API keys, MCP, and local document tools.' },
  faq: { title: '常见问题', enTitle: 'FAQ', description: '查看解析范围、数据保存、额度和本地文档处理的常见问题。', enDescription: 'Answers about parsing, data retention, quotas, and local document processing.' },
  api: { title: 'API控制台', enTitle: 'API console', description: '创建和管理HerdownAPI密钥，查看额度和使用情况。', enDescription: 'Create and manage Herdown API keys and view usage.' },
  mcp: { title: 'MCP接入', enTitle: 'MCP integration', description: '配置远程MCP，连接Herdown网页解析和全站抓取能力。', enDescription: 'Connect a remote MCP client to Herdown webpage parsing and site crawling.' },
  cli: { title: 'CLI命令行工具', enTitle: 'CLI tool', description: '在终端调用Herdown，把网页整理成Markdown文件。', enDescription: 'Run Herdown from a terminal and save webpages as Markdown.' },
  skill: { title: 'HerdownSkill', enTitle: 'Herdown Skill', description: '把Herdown配置到AI Agent，让Agent自动选择合适的资料整理方式。', enDescription: 'Configure Herdown for an AI agent so it can choose the right material workflow.' },
  pricing: { title: '价格和额度', enTitle: 'Pricing and credits', description: '查看Herdown免费额度和一次性付费点数包。', enDescription: 'View Herdown free usage and one-time credit packages.' },
  'browser-extension': { title: '浏览器插件', enTitle: 'Browser extension', description: '下载Herdown浏览器本地扩展，用当前页面快速整理资料。', enDescription: 'Download the Herdown browser extension to prepare the current page locally.' },
};

const toolLabel = (slug: Exclude<ToolSlug, null>, language: Language) => language === 'en' ? toolPageInfo[slug].enTitle : toolPageInfo[slug].title;
const toolDescription = (slug: Exclude<ToolSlug, null>, language: Language) => language === 'en' ? toolPageInfo[slug].enDescription : toolPageInfo[slug].description;
const localizedHref = (path: string, language: Language) => `${path}${path.includes('?') ? '&' : '?'}lang=${language}`;

function TextMarkdownTool({ language }: { language: Language }) {
  const ui = messages[language];
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
        <span className="text-xs font-semibold text-emerald-400">{language === 'en' ? 'Local instant conversion' : '本地即时转换'}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{toolLabel('txt-to-markdown', language)}</h1>
        <p className="text-sm text-slate-400 mt-3 leading-7">{language === 'en' ? 'Text is processed in this browser and is not uploaded. Copy or download the cleaned `.md` file.' : '文本只在当前浏览器处理，不上传服务器。整理后可以复制或直接下载为`.md`文件。'}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label className="p-5 rounded-2xl bg-[#0f1722] border border-[#1e293b]">
          <span className="block text-xs font-semibold text-slate-300 mb-3">{language === 'en' ? 'Input TXT text' : '输入TXT文本'}</span>
          <textarea value={text} onChange={event => setText(event.target.value)} rows={16} placeholder={language === 'en' ? 'Paste plain text here...' : '把纯文本粘贴到这里...'} className="w-full h-80 resize-y rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
        </label>
        <div className="p-5 rounded-2xl bg-[#0f1722] border border-[#1e293b]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">{language === 'en' ? 'Markdown result' : 'Markdown结果'}</span>
            <div className="flex gap-2">
              <button onClick={copy} disabled={!markdown} className="px-3 py-1.5 rounded-lg bg-[#1e293b] text-xs text-slate-200 disabled:opacity-40">{copied ? ui.copied : language === 'en' ? 'Copy' : '复制'}</button>
              <button onClick={download} disabled={!markdown} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs text-white disabled:opacity-40">{ui.download}</button>
            </div>
          </div>
          <pre className="h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown || (language === 'en' ? 'The result will appear here...' : '转换结果会显示在这里...')}</pre>
        </div>
      </div>
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
  const skillExample = ['Use Herdown when the user asks to:', '- turn a public webpage into clean Markdown', '- prepare material for an AI workflow or knowledge tool', '- preserve article metadata and image links', '', 'Choose the browser, RESTAPI, MCP, or CLI path based on the user environment.', 'Do not claim to access private pages or bypass a login.'].join('\n');

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
                ['/word-to-markdown', 'Word', isEnglish ? 'Use local MarkItDown for DOCX files.' : 'Word文档使用本地MarkItDown。'],
                ['/pdf-to-markdown', 'PDF', isEnglish ? 'Use local MarkItDown for electronic PDFs.' : '电子PDF使用本地MarkItDown。'],
                ['/ppt-to-markdown', 'PPT', isEnglish ? 'Use local MarkItDown for presentations.' : '演示文稿使用本地MarkItDown。'],
                ['/excel-to-markdown', 'Excel', isEnglish ? 'Use local MarkItDown for spreadsheets.' : '表格使用本地MarkItDown。'],
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

export function App() {
  const [toolSlug] = useState<ToolSlug>(() => getToolSlug());
  const [activeTab, setActiveTab] = useState<'converter' | 'crawl' | 'keys' | 'account' | 'admin' | 'mcp' | 'cli' | 'extension' | 'skills'>(() => toolSlug === 'api' ? 'keys' : toolSlug === 'mcp' ? 'mcp' : toolSlug === 'cli' ? 'cli' : toolSlug === 'skill' ? 'skills' : toolSlug === 'browser-extension' ? 'extension' : 'converter');
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());
  const ui = messages[language];
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
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
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
    fetch('/v1/security-config')
      .then(response => response.ok ? response.json() : null)
      .then(data => setTurnstileSiteKey(typeof data?.turnstile_site_key === 'string' ? data.turnstile_site_key : ''))
      .catch(() => setTurnstileSiteKey(''));
    fetch('/v1/me', { credentials: 'include' })
      .then(response => response.ok ? response.json() : null)
      .then(data => setSessionUser(data?.authenticated ? data.user : null))
      .catch(() => setSessionUser(null))
      .finally(() => setSessionLoading(false));
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    fetchKeys();
    fetchStats();
  }, [sessionLoading, sessionUser]);

  useEffect(() => {
    window.localStorage.setItem('herdown_language', language);
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    const pagePath = window.location.pathname === '/index.html' ? '/' : window.location.pathname;
    const title = toolSlug ? `${toolLabel(toolSlug, language)}｜Herdown` : language === 'en' ? 'Clean Markdown for AI agents｜Herdown' : '给AIAgent用的干净Markdown入口｜Herdown';
    const description = toolSlug ? toolDescription(toolSlug, language) : language === 'en' ? 'Turn webpages, documents, and images into clean materials for AI workflows.' : '把网页、文档和图片整理成适合AI知识库使用的干净资料。';
    const keywords = toolSlug === 'url-to-markdown'
      ? language === 'en' ? 'URL to Markdown, webpage to Markdown, HTML to Markdown' : 'URL转Markdown,网页转Markdown,HTML转Markdown'
      : toolSlug === 'tools'
        ? language === 'en' ? 'document to Markdown, local document conversion' : '文档转Markdown,本地文档转换'
        : language === 'en' ? 'clean Markdown for AI workflows, REST API, MCP, CLI' : '干净Markdown,AI工作流,RESTAPI,MCP,CLI';
    const canonicalUrl = `${window.location.origin}${pagePath}${language === 'en' ? '?lang=en' : ''}`;
    const setMeta = (selector: string, attribute: string, value: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      element?.setAttribute(attribute, value);
    };
    const setAlternate = (languageCode: string, href: string) => {
      const element = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${languageCode}"]`);
      element?.setAttribute('href', href);
    };
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="keywords"]', 'content', keywords);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    setAlternate('en', `${window.location.origin}${pagePath}?lang=en`);
    setAlternate('zh-CN', `${window.location.origin}${pagePath}`);
    setAlternate('x-default', `${window.location.origin}${pagePath}`);
    const schema = document.querySelector<HTMLScriptElement>('script[data-herdown-schema]');
    if (schema) {
      const faqItems = language === 'en'
        ? [['What does Herdown do?', 'Herdown turns webpages or HTML into clean Markdown for saving, reading, AI workflows, and knowledge tools.'], ['Is my content stored long-term?', 'No. Herdown processes content in real time and does not host your content or run a knowledge base. Limited technical logs may be used for security and troubleshooting.'], ['Can I use it without coding?', 'Yes. Paste a URL and click Convert. Developers can also use the API, MCP, CLI, or browser extension.']]
        : [['Herdown是做什么的？', '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读、交给AI工作流或知识库继续使用。'], ['我提交的内容会被长期保存吗？', '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。必要的短期技术日志仅用于安全防护、稳定性和故障排查。'], ['不会写代码也能用吗？', '可以。直接粘贴网页链接并点击转换即可。开发者也可以通过API、MCP、CLI或浏览器插件接入自己的工作流。']];
      const pageSchema: Record<string, unknown> = toolSlug ? {
        '@context': 'https://schema.org',
        '@type': toolSlug === 'faq' ? 'FAQPage' : 'WebPage',
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: language === 'en' ? 'en' : 'zh-CN',
        isPartOf: { '@type': 'WebSite', name: 'Herdown', url: window.location.origin },
      } : {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Herdown',
        url: canonicalUrl,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        inLanguage: language === 'en' ? 'en' : 'zh-CN',
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: language === 'en' ? ['Webpage to Markdown', 'Document to Markdown', 'REST API', 'MCP', 'CLI'] : ['网页转Markdown', '文档转Markdown', 'REST API', 'MCP', 'CLI'],
      };
      if (toolSlug === 'faq') pageSchema.mainEntity = faqItems.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } }));
      schema.textContent = JSON.stringify(pageSchema);
    }
    if (toolSlug) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
      const savedKeys = JSON.parse(window.localStorage.getItem('herdown_api_keys') || '[]');
      setApiKeys(Array.isArray(savedKeys) ? savedKeys : []);
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
    fetchCredits(apiKeys.find(k => k.status === 'active')?.key);
  }, [apiKeys]);

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
        fetchStats();
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

  return (
    <div className="min-h-screen bg-[#070a0e] text-[#e2e8f0] font-sans antialiased selection:bg-[#0f6b4f] selection:text-white flex flex-col">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070a0e]/80 border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center gap-2">
          <a href={localizedHref('/', language)} className="flex shrink-0 items-center gap-2 sm:gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/60" aria-label={ui.home}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0f6b4f] to-[#10b981] p-[1px] shadow-lg shadow-[#0f6b4f]/20">
              <div className="w-full h-full bg-[#090d12] rounded-[11px] flex items-center justify-center font-bold text-emerald-400 font-mono text-base">
                HD
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-['Outfit']">
                Herdown
              </span>
            </div>
          </a>

          {/* Navigation Tabs */}
          <nav className="hidden sm:flex overflow-x-auto whitespace-nowrap scrollbar-none items-center gap-1 bg-[#111823] p-1 rounded-xl border border-[#1e293b] max-w-[60%] sm:max-w-none">
            <a
              href={localizedHref('/', language)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'converter' && (!toolSlug || ['tools', 'url-to-markdown', 'txt-to-markdown', 'pdf-to-markdown', 'word-to-markdown', 'ppt-to-markdown', 'excel-to-markdown'].includes(toolSlug))
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {ui.single}
            </a>
            <a
              href={localizedHref('/api', language)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                toolSlug === 'api'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {ui.api}
            </a>
            {sessionUser?.is_admin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {ui.admin}
              </button>
            )}
            <a
              href={localizedHref('/mcp', language)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                toolSlug === 'mcp'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              {ui.mcp}
            </a>
            <a
              href={localizedHref('/cli', language)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                toolSlug === 'cli'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              {ui.cli}
            </a>
            <a
              href={localizedHref('/skill', language)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                toolSlug === 'skill'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {ui.skill}
            </a>
            <a
              href={localizedHref('/browser-extension', language)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                toolSlug === 'browser-extension'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <PlugZap className="w-3.5 h-3.5" />
              {ui.extension}
            </a>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <a
              href={localizedHref('/pricing', language)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ui.upgrade}</span>
            </a>
            <button
              onClick={() => {
                const nextLanguage: Language = language === 'zh' ? 'en' : 'zh';
                const nextUrl = new URL(window.location.href);
                if (nextLanguage === 'en') nextUrl.searchParams.set('lang', 'en');
                else nextUrl.searchParams.delete('lang');
                window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);
                setLanguage(nextLanguage);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#111823] border border-[#1e293b] text-slate-300 hover:text-white text-xs font-semibold transition"
              title={language === 'zh' ? 'Switch to English' : '切换到中文'}
            >
              {ui.language}
            </button>
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
                <span className="hidden sm:inline">{language === 'en' ? 'Sign in' : '登录'}</span>
              </button>
            )}
            <a
              href="https://github.com/less1001/herdown"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-[#111823] border border-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={ui.github}
            >
              <Code2 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* TAB 1: Single Page Converter */}
        {activeTab === 'converter' && (
          <>
            {toolSlug === 'tools' && <UnifiedMaterialsTool language={language} />}
            {toolSlug === 'txt-to-markdown' && <TextMarkdownTool language={language} />}
            {(toolSlug === 'pdf-to-markdown' || toolSlug === 'word-to-markdown' || toolSlug === 'ppt-to-markdown' || toolSlug === 'excel-to-markdown') && <LocalToolGuide slug={toolSlug} language={language} />}
            {toolSlug === 'pricing' && <PricingPage language={language} onUpgrade={() => setShowUpgradeModal(true)} />}
            {(toolSlug === 'docs' || toolSlug === 'help') && <HelpPage language={language} />}
            {(!toolSlug || toolSlug === 'url-to-markdown') && <div className="space-y-8">
            {/* Hero Banner */}
            <div className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {ui.heroBadge}
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-normal">
                {language === 'en' ? <>A clean <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Markdown</span> entry point for AI agents</> : <>给 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">AI Agent</span> 用的干净 <span className="inline-block">Markdown入口</span></>}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                {language === 'en' ? 'Webpages, articles, PDF, Word, PPT, Excel, images, and screenshots.' : '通用网页、公众号文章、PDF、Word、PPT、Excel、图片和截图。'}
                <br className="hidden sm:block" />
                {language === 'en' ? 'Clean the source first, then send it to your AI workflow or knowledge tool.' : '先把资料清干净，再交给你的AI工作流或知识库。'}
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
                  <button
                    onClick={() => setInputMode('crawl')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      inputMode === 'crawl' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ui.crawl}
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
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                    {loading ? ui.parsing : ui.parse}
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
                  {language === 'en' ? '1,000 free webpage parses per month. Homepage and API usage share the same quota; site crawl counts each page.' : '每月1000次免费网页解析：首页和API共用额度，全站抓取按页面计数。'}
                </p>
              )}
            </div>

            {/* Result Area */}
            {result && (
              <div className="bg-[#0f1722] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl space-y-0">
                <div className="bg-[#111823] px-6 py-4 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {result.platform}
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
                      {copiedMd ? '已复制' : '复制结果'}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090d12] border border-[#1e293b] text-xs font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载 .md
                    </button>
                  </div>
                </div>

                {typeof result.source_tokens === 'number' && typeof result.markdown_tokens === 'number' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#1e293b] border-b border-[#1e293b]">
                    <div className="bg-[#0d131c] px-5 py-4">
                      <span className="block text-[11px] text-slate-500">原网页HTML估算</span>
                      <strong className="block text-lg text-slate-200 mt-1">{result.source_tokens.toLocaleString()} Tokens</strong>
                    </div>
                    <div className="bg-[#0d131c] px-5 py-4">
                      <span className="block text-[11px] text-slate-500">清洗后Markdown估算</span>
                      <strong className="block text-lg text-emerald-300 mt-1">{result.markdown_tokens.toLocaleString()} Tokens</strong>
                    </div>
                    <div className="bg-[#0d131c] px-5 py-4">
                      <span className="block text-[11px] text-slate-500">预计节省上下文</span>
                      <strong className="block text-lg text-emerald-400 mt-1">{(result.token_savings_percent || 0).toFixed(1)}%</strong>
                      <span className="text-[10px] text-slate-500">仅为估算值，实际数量取决于模型</span>
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
                      渲染预览
                    </button>
                    <button
                      onClick={() => setOutputTab('source')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'source' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Markdown 源码
                    </button>
                    <button
                      onClick={() => setOutputTab('images')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                        outputTab === 'images' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      提取图片 ({result.images.length})
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
                        <p className="col-span-full text-slate-500 text-center py-8">本文未提取到独立图片</p>
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
            </div>}
          </>
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
          </div>
        )}

        {/* TAB: Chrome Extension */}
        {activeTab === 'extension' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Layers className="w-4 h-4 text-emerald-400" />
                {tr('Herdown browser extension V1.0', 'Herdown浏览器扩展V1.0')}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                {language === 'en' ? <>A <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">zero-cost extraction extension</span> running locally in your browser</> : <>直接运行在您浏览器本地的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">零成本提取插件</span></>}
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                {tr('Avoid cloud processing costs. Herdown uses the browser DOM and your signed-in cookies to turn the current page into clean material.', '免除一切云端服务器转算成本！通过浏览器原生DOM渲染，利用您已登录的Cookie，直接把页面整理成干净资料。')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-2">
              <div className="p-6 rounded-2xl bg-[#0d131d] border border-[#1e293b] space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'en' ? <>Download the ZIP package, unzip it, open <code className="text-emerald-400">chrome://extensions/</code> in Chrome, enable Developer mode, then choose Load unpacked.</> : <>下载ZIP包并解压后，在Chrome打开<code className="text-emerald-400">chrome://extensions/</code>，开启右上方“开发者模式”，点击“加载已解压的扩展程序”选择本目录即可！</>}
                </p>
                <div className="pt-2">
                  <a
                    href="/downloads/herdown-extension.zip"
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'converter' && (!toolSlug || toolSlug === 'url-to-markdown' || toolSlug === 'faq') && (
          <section id="faq" className="max-w-4xl mx-auto mt-14 scroll-mt-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{language === 'en' ? 'FAQ' : '常见问题'}</h2>
            </div>

            <div className="rounded-2xl border border-[#1e293b] bg-[#0d131d] divide-y divide-[#1e293b] overflow-hidden">
              <details className="group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-white flex items-center justify-between gap-4">
                  {language === 'en' ? 'What does Herdown do?' : 'Herdown是做什么的？'}
                  <span className="text-emerald-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-slate-400 leading-7 pt-3">{language === 'en' ? 'Herdown turns webpages or HTML into clean Markdown for saving, reading, AI workflows, and knowledge tools.' : '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读、交给AI工作流或知识库继续使用。'}</p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-white flex items-center justify-between gap-4">
                  {language === 'en' ? 'Is my content stored long-term?' : '我提交的内容会被长期保存吗？'}
                  <span className="text-emerald-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-slate-400 leading-7 pt-3">{language === 'en' ? 'No. Herdown processes content in real time and does not host your content or run a knowledge base. Limited technical logs may be used for security and troubleshooting.' : '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。必要的短期技术日志仅用于安全防护、稳定性和故障排查。'}</p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-white flex items-center justify-between gap-4">
                  {language === 'en' ? 'Can I use it without coding?' : '不会写代码也能用吗？'}
                  <span className="text-emerald-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-slate-400 leading-7 pt-3">{language === 'en' ? 'Yes. Paste a URL and click Convert. Developers can also use the API, MCP, CLI, or browser extension.' : '可以。直接粘贴网页链接并点击转换即可。开发者也可以通过API、MCP、CLI或浏览器插件接入自己的工作流。'}</p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-white flex items-center justify-between gap-4">
                  {language === 'en' ? 'Why can some pages not be parsed?' : '为什么有些网页无法解析？'}
                  <span className="text-emerald-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-slate-400 leading-7 pt-3">{language === 'en' ? 'Login walls, paywalls, anti-bot rules, and dynamic loading can affect results. Try pasting the page HTML or use the browser extension locally.' : '登录限制、付费墙、反爬机制和动态加载都可能影响结果。你可以尝试粘贴已打开页面的HTML源码，或使用浏览器插件在本地提取。'}</p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-white flex items-center justify-between gap-4">
                  {language === 'en' ? 'How are credits billed? Do they renew?' : '点数包如何计费？会自动续费吗？'}
                  <span className="text-emerald-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-slate-400 leading-7 pt-3">{language === 'en' ? 'The checkout shows the price, included credits, and payment method. Herdown only offers one-time credit packs and does not auto-renew.' : '收银台会明确展示金额、包含额度和支付方式。Herdown目前只提供一次性点数包，不会自动续费。'}</p>
              </details>
              <details className="group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-white flex items-center justify-between gap-4">
                  {language === 'en' ? 'What content must not be submitted?' : '哪些内容不能提交？'}
                  <span className="text-emerald-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-slate-400 leading-7 pt-3">{language === 'en' ? 'Only process content you are allowed to access and use. Do not bypass access controls, scrape private data, infringe copyright, or violate platform rules.' : '请只处理你有权访问和使用的内容。不要用于绕过访问限制、抓取私人数据、侵犯版权或违反第三方平台规则。'}</p>
              </details>
            </div>

            <div className="mt-5 text-xs">
              <div className="rounded-xl border border-[#1e293b] bg-[#0d131d] p-4"><span className="text-emerald-400 font-bold block mb-1">{language === 'en' ? 'Free plan' : '免费体验'}</span><span className="text-white font-bold">{ui.free}</span>{language === 'en' ? '. One-time credit packs do not expire and do not auto-renew.' : '；也可以选择一次性点数包，点数不过期，不自动续费。'}</div>
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
      <footer className="border-t border-[#1e293b] bg-[#070a0e] py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:hidden rounded-2xl border border-[#1e293b] bg-[#0b1119] overflow-hidden text-sm">
            <details className="group border-b border-[#1e293b]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-semibold text-slate-200">
                {language === 'en' ? 'Tools' : '工具'}
                <span className="text-lg font-normal text-emerald-400 transition group-open:rotate-45">+</span>
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4 text-slate-400">
                <a href={localizedHref('/tools', language)} className="hover:text-emerald-300 transition">{language === 'en' ? 'All tools' : '工具入口'}</a>
                {(['url-to-markdown', 'txt-to-markdown', 'word-to-markdown', 'pdf-to-markdown', 'ppt-to-markdown', 'excel-to-markdown'] as const).map(slug => (
                  <a key={slug} href={localizedHref(`/${slug}`, language)} className="hover:text-emerald-300 transition">{toolLabel(slug, language)}</a>
                ))}
              </div>
            </details>
            <details className="group border-b border-[#1e293b]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-semibold text-slate-200">
                {language === 'en' ? 'Developers' : '开发者'}
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
                {language === 'en' ? 'Help and legal' : '帮助与政策'}
                <span className="text-lg font-normal text-emerald-400 transition group-open:rotate-45">+</span>
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4 text-slate-400">
                <a href={localizedHref('/faq', language)} className="hover:text-emerald-300 transition">{ui.faq}</a>
                <a href={localizedHref('/terms', language)} className="hover:text-emerald-300 transition">{ui.terms}</a>
                <a href={localizedHref('/privacy', language)} className="hover:text-emerald-300 transition">{ui.privacy}</a>
                <a href="mailto:vkdefi@gmail.com" className="hover:text-emerald-300 transition">{ui.contact}</a>
                <a href="https://x.com/vkdefi" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">@vkdefi</a>
                <a href="https://github.com/less1001/herdown" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">GitHub Repo</a>
              </div>
            </details>
          </div>
          <div className="hidden gap-8 text-xs sm:grid sm:grid-cols-3">
            <div>
              <h3 className="mb-3 font-semibold text-slate-200">{language === 'en' ? 'Tools' : '工具'}</h3>
              <div className="flex flex-col items-start gap-2 text-slate-500">
                <a href={localizedHref('/tools', language)} className="hover:text-emerald-300 transition">{language === 'en' ? 'All tools' : '工具入口'}</a>
                {(['url-to-markdown', 'txt-to-markdown', 'word-to-markdown', 'pdf-to-markdown', 'ppt-to-markdown', 'excel-to-markdown'] as const).map(slug => (
                  <a key={slug} href={localizedHref(`/${slug}`, language)} className="hover:text-emerald-300 transition">{toolLabel(slug, language)}</a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-slate-200">{language === 'en' ? 'Developers' : '开发者'}</h3>
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
              <h3 className="mb-3 font-semibold text-slate-200">{language === 'en' ? 'Help and legal' : '帮助与政策'}</h3>
              <div className="flex flex-col items-start gap-2 text-slate-500">
                <a href={localizedHref('/faq', language)} className="hover:text-emerald-300 transition">{ui.faq}</a>
                <a href={localizedHref('/terms', language)} className="hover:text-emerald-300 transition">{ui.terms}</a>
                <a href={localizedHref('/privacy', language)} className="hover:text-emerald-300 transition">{ui.privacy}</a>
                <a href="mailto:vkdefi@gmail.com" className="hover:text-emerald-300 transition">{ui.contact}</a>
                <a href="https://x.com/vkdefi" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">@vkdefi</a>
                <a href="https://github.com/less1001/herdown" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition">GitHub Repo</a>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#1e293b] pt-4 text-xs text-slate-500 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
            <div>© 2026 <span className="font-medium text-slate-300">Herdown</span>. All rights reserved.</div>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              {language === 'en' ? 'End-to-End Privacy Preserved' : '端到端隐私保护'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
