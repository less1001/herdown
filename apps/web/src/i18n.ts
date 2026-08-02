export type Language = 'zh' | 'en';

export const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'zh';
  const requested = new URLSearchParams(window.location.search).get('lang');
  if (requested === 'zh' || requested === 'zh-CN') return 'zh';
  if (requested === 'en') return 'en';
  const saved = window.localStorage.getItem('herdown_language');
  if (saved === 'zh' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};

export const messages = {
  zh: {
    single: '单页转换', crawl: '全站爬取', api: 'API', admin: '管理', mcp: 'MCP', cli: 'CLI', extension: '浏览器插件', skill: 'Skill', upgrade: '升级', login: 'Google登录', logout: '退出登录',
    tools: '工具入口', help: '帮助', docs: 'Docs', faq: 'FAQ',
    heroBadge: '支持网页、文档和图片整理成适合AI知识库使用的干净资料', heroTitle: '给AI Agent用的干净Markdown入口', heroDescription: '通用网页、公众号文章、PDF、Word、PPT、Excel、图片和截图。先把资料清干净，再交给你的AI工作流或知识库。', quickExample: '快速体验示例：', article: '网页文章', urlMode: '网页URL链接转换', htmlMode: '直接粘贴HTML源码', urlPlaceholder: '粘贴网页URL...', htmlPlaceholder: '在此粘贴包含HTML源码的文本...', parse: '转换为Markdown', parsing: '正在解析中...', parseHtml: '解析HTML源码',
    copied: '已复制', copyResult: '复制结果', download: '下载.md', preview: '渲染预览', source: 'Markdown源码', images: '提取图片', noImages: '本文未提取到独立图片', sourceTokens: '原网页HTML估算', markdownTokens: '清洗后Markdown估算', savedContext: '预计节省上下文', estimated: '仅为估算值，实际数量取决于模型',
    extensionZip: '下载插件ZIP',
    docsTitle: 'HerdownDocs', docsSubtitle: '从一条网页链接开始，把干净资料接入你的AI工作流。', quickStart: '快速开始', apiDocs: 'API文档', integrations: '工作流接入', localTools: '本地工具', security: '额度与安全', docsStart: '打开首页，粘贴网页链接，点击转换为Markdown即可。', docsApi: '在API页面创建密钥，然后使用RESTAPI、MCP或CLI。', docsLocal: 'PDF、PPT和Excel使用本地MarkItDown，截图和扫描件使用本地Unlimited-OCRSkill。', docsWorkflow: 'Herdown负责把网页、文档和图片整理成干净资料，Dify、Coze、FastGPT或n8n负责后续工作流。',
    faqTitle: '使用前你可能想知道', faqHint: '点击问题即可展开答案', free: '每月1,000次免费解析', noStorage: 'Herdown以实时处理为主，不提供内容托管或知识库服务。',
    language: 'EN', languageZh: '中文', languageEn: 'English', github: 'GitHub源码', terms: '服务条款', privacy: '隐私政策', contact: '联系邮箱', home: '首页',
  },
  en: {
    single: 'Single page', crawl: 'Site crawl', api: 'API', admin: 'Admin', mcp: 'MCP', cli: 'CLI', extension: 'Browser extension', skill: 'Skill', upgrade: 'Upgrade', login: 'Sign in with Google', logout: 'Sign out',
    tools: 'Tools', help: 'Help', docs: 'Docs', faq: 'FAQ',
    heroBadge: 'Turn webpages, documents, and images into clean materials for AI knowledge workflows', heroTitle: 'A clean Markdown entry point for AI agents', heroDescription: 'Webpages, WeChat articles, PDF, Word, PPT, Excel, images, and screenshots. Clean the source first, then send it to your AI workflow or knowledge tool.', quickExample: 'Try an example:', article: 'Web article', urlMode: 'Web URL to Markdown', htmlMode: 'Paste HTML source', urlPlaceholder: 'Paste a webpage URL...', htmlPlaceholder: 'Paste HTML source here...', parse: 'Convert to Markdown', parsing: 'Parsing...', parseHtml: 'Parse HTML source',
    copied: 'Copied', copyResult: 'Copy result', download: 'Download.md', preview: 'Preview', source: 'Markdown source', images: 'Images', noImages: 'No standalone images were extracted', sourceTokens: 'Original HTML estimate', markdownTokens: 'Clean Markdown estimate', savedContext: 'Estimated context saved', estimated: 'Estimate only; actual tokens depend on the model',
    extensionZip: 'Download extension ZIP',
    docsTitle: 'HerdownDocs', docsSubtitle: 'Start with one URL and connect clean materials to your AI workflow.', quickStart: 'Quick start', apiDocs: 'API documentation', integrations: 'Workflow integrations', localTools: 'Local tools', security: 'Quota and security', docsStart: 'Open the homepage, paste a URL, and click Convert to Markdown.', docsApi: 'Create an API key at the API console, then use the RESTAPI, MCP, or CLI.', docsLocal: 'Use local MarkItDown for Word, PDF, PPT, and Excel. Use the local Unlimited-OCRSkill for screenshots and scans.', docsWorkflow: 'Herdown creates clean materials. Dify, Coze, FastGPT, or n8n can handle the workflow that comes next.',
    faqTitle: 'Questions before you start', faqHint: 'Click a question to expand the answer', free: '1,000 free parses per month', noStorage: 'Herdown processes content in real time and does not provide content hosting or a knowledge base.',
    language: '中文', languageZh: '中文', languageEn: 'English', github: 'GitHub source', terms: 'Terms', privacy: 'Privacy', contact: 'Contact email', home: 'Home',
  },
} as const;

export type Messages = typeof messages.zh;
