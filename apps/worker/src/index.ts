import { parseMarkdown, detectPlatform, extractSitemapUrls, chunkMarkdownForRAG, ParseResult } from '@herdown/core';
import { XMLValidator } from 'fast-xml-parser';
import { buildLocalizedSeoPages } from './localizedSeo';

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
  HERDOWN_ADMIN_TEST_KEY?: string;
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

type SeoLanguage = 'zh' | 'en' | 'ja' | 'es' | 'de';
type BaseSeoLanguage = 'zh' | 'en';

type SeoPage = {
  title: string;
  description: string;
  keywords: string;
  heading: string;
  intro: string;
};

const seoPages: Record<string, Record<BaseSeoLanguage, SeoPage>> = {
  '/': {
    zh: {
      title: '给AI Agent用的高质量Markdown资料入口｜Herdown',
      description: '把网页、文档和图片转换为适合AI Agent理解、检索和使用的高质量Markdown，支持本地文件、API、MCP、CLI和浏览器插件。',
      keywords: '网页转Markdown,文档转Markdown,HTML转Markdown,Markdown转换器,AI Agent资料,API,MCP,CLI',
      heading: '给AI Agent用的高质量Markdown资料入口',
      intro: '把网页、文档和图片转换为适合AI Agent理解、检索和使用的高质量Markdown。',
    },
    en: {
      title: 'High-quality Markdown for AI agents｜Herdown',
      description: 'Turn webpages, documents, and images into high-quality Markdown for AI agents, with local files, API, MCP, CLI, and browser extension workflows.',
      keywords: 'webpage to Markdown,document to Markdown,HTML to Markdown,Markdown converter,AI agents,API,MCP,CLI',
      heading: 'High-quality Markdown for AI agents',
      intro: 'Turn webpages, documents, and images into high-quality Markdown for the AI agent you already use.',
    },
  },
  '/tools': {
    zh: { title: '本地文档转Markdown工具｜Herdown', description: '选择Word、PDF、PPT、Excel、CSV、JSON、XML、RTF或Markdown文件，在浏览器本地转换并下载。', keywords: '本地文档转Markdown,文档转Markdown,TXT转Markdown,PDF转Markdown,Excel转Markdown', heading: '本地文档转Markdown工具', intro: '选择对应格式的本地转换器，把文件整理成可检查、可下载的Markdown。' },
    en: { title: 'Local Document to Markdown Tools｜Herdown', description: 'Choose a Word, PDF, PPT, Excel, CSV, JSON, XML, RTF, or Markdown file converter and process it locally in your browser.', keywords: 'local document to Markdown,document conversion,TXT to Markdown,PDF to Markdown,Excel to Markdown', heading: 'Local Document to Markdown Tools', intro: 'Choose a format-aware local converter and prepare Markdown you can review and download.' },
  },
  '/about': {
    zh: { title: '关于Herdown｜Herdown', description: '了解Herdown的产品方向、本地优先处理方式和开发者入口。', keywords: '关于Herdown,本地Markdown,Markdown工具', heading: '关于Herdown', intro: '把资料整理成可以继续使用的Markdown。' },
    en: { title: 'About Herdown｜Herdown', description: 'Learn about Herdown, its local-first tools, product direction, and developer entry points.', keywords: 'about Herdown,local Markdown tools,Markdown converter', heading: 'About Herdown', intro: 'Turn source material into Markdown you can keep using.' },
  },
  '/contact': {
    zh: { title: '联系Herdown｜Herdown', description: '反馈转换问题、页面问题、隐私问题或开发者接入需求。', keywords: '联系Herdown,Markdown转换支持,Herdown支持', heading: '联系Herdown', intro: '告诉我们你遇到的问题。' },
    en: { title: 'Contact Herdown｜Herdown', description: 'Contact Herdown about conversion, page behavior, privacy, or developer integration issues.', keywords: 'contact Herdown,Markdown conversion support,Herdown support', heading: 'Contact Herdown', intro: 'Tell us what needs attention.' },
  },
  '/url-to-markdown': {
    zh: { title: '免费网页转Markdown转换器｜Herdown', description: '使用免费网页转Markdown工具提取一个公开网页，检查标题、正文和来源，再下载干净Markdown。', keywords: '免费网页转Markdown,URL转Markdown,网页转Markdown,HTML转Markdown', heading: '免费网页转Markdown转换器', intro: '输入一个公开网页URL，提取正文、标题、图片和来源信息。' },
    en: { title: 'Free URL to Markdown Converter｜Herdown', description: 'Use the free URL to Markdown converter to extract one public webpage, review the source, and download clean Markdown.', keywords: 'free URL to Markdown converter,URL to Markdown,webpage to Markdown,HTML to Markdown', heading: 'Free URL to Markdown Converter', intro: 'Enter one public webpage URL, review the extracted content and source, then download Markdown.' },
  },
  '/website-to-markdown': {
    zh: { title: 'Website转Markdown｜多页面网站抓取｜Herdown', description: '从域名、起始URL或Sitemap抓取多个公开页面，保留来源并导出Markdown或ZIP。', keywords: 'website to markdown,website crawl to markdown,网站转Markdown,网页批量转Markdown', heading: 'Website转Markdown', intro: '从域名、起始URL或Sitemap抓取多个公开页面，保留来源并导出干净Markdown。' },
    en: { title: 'Website to Markdown｜Multi-page Website Crawler｜Herdown', description: 'Crawl multiple public pages from a domain, starting URL, or sitemap, retain source URLs, and export Markdown or ZIP.', keywords: 'website to markdown,website crawl to markdown,website to markdown converter,multi-page markdown', heading: 'Website to Markdown', intro: 'Crawl multiple public pages from a domain, starting URL, or sitemap while retaining source URLs.' },
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
    zh: { title: 'Excel转Markdown转换器｜生成Markdown表格｜Herdown', description: '在浏览器本地将XLSX工作表转换为可读Markdown表格，检查公式和格式限制后下载。', keywords: 'Excel转Markdown,Excel转Markdown表格,XLSX转Markdown,表格转换', heading: 'Excel转Markdown转换器', intro: '将Excel工作表整理为便于阅读、检查和继续处理的Markdown表格。' },
    en: { title: 'Excel to Markdown Converter｜Readable Tables｜Herdown', description: 'Convert XLSX worksheets into readable Markdown tables locally in the browser, with clear format limits and review steps.', keywords: 'Excel to Markdown,Excel to Markdown table,XLSX to Markdown,spreadsheet conversion', heading: 'Excel to Markdown Converter', intro: 'Turn a spreadsheet into Markdown tables that are easy to review and reuse.' },
  },
  '/csv-to-markdown': {
    zh: { title: 'CSV转Markdown｜在线生成Markdown表格｜Herdown', description: '上传CSV或TSV文件，或粘贴分隔数据，在浏览器本地转换为Markdown表格，支持复制和下载。', keywords: 'CSV转Markdown,CSV转Markdown表格,CSV转MD', heading: 'CSV转Markdown', intro: '把CSV、TSV或粘贴的分隔数据转换为可复制下载的Markdown表格。' },
    en: { title: 'CSV to Markdown｜Online Table Converter｜Herdown', description: 'Upload CSV or TSV, or paste delimited data, and convert it locally into a Markdown table for copying or download.', keywords: 'CSV to Markdown,CSV to Markdown table,convert CSV to MD', heading: 'CSV to Markdown', intro: 'Convert CSV, TSV, or pasted delimited data into a downloadable Markdown table.' },
  },
  '/json-to-markdown': {
    zh: { title: 'JSON转Markdown｜对象数组在线转换｜Herdown', description: '上传或粘贴JSON，在浏览器本地把对象、数组、嵌套结构和记录列表转换为可读Markdown。', keywords: 'JSON转Markdown,JSON转Markdown表格,JSON转MD', heading: 'JSON转Markdown', intro: '把JSON对象、数组和嵌套结构转换为可复制下载的Markdown。' },
    en: { title: 'JSON to Markdown｜Convert Objects and Arrays｜Herdown', description: 'Upload or paste JSON and convert objects, arrays, nested structures, and record lists into readable Markdown locally.', keywords: 'JSON to Markdown,JSON to Markdown table,convert JSON to MD', heading: 'JSON to Markdown', intro: 'Convert JSON objects, arrays, and nested structures into downloadable Markdown.' },
  },
  '/xml-to-markdown': {
    zh: { title: 'XML转Markdown｜Sitemap与RSS在线转换｜Herdown', description: '上传或粘贴XML，在浏览器本地把Sitemap、RSS、Atom和通用嵌套数据转换为可读Markdown。', keywords: 'XML转Markdown,XML转MD,XML表格转换', heading: 'XML转Markdown', intro: '把Sitemap、订阅源和通用XML转换为可复制下载的Markdown。' },
    en: { title: 'XML to Markdown｜Convert Sitemaps and Feeds｜Herdown', description: 'Upload or paste XML and convert sitemaps, RSS, Atom, and generic nested data into readable Markdown locally.', keywords: 'XML to Markdown,convert XML to MD,XML table converter', heading: 'XML to Markdown', intro: 'Convert sitemaps, feeds, and generic XML into downloadable Markdown.' },
  },
  '/rtf-to-markdown': {
    zh: { title: 'RTF转Markdown｜在线提取富文本内容｜Herdown', description: '上传或粘贴RTF文档，在浏览器本地提取段落、Unicode文字、制表符、标点和基础列表，生成Markdown。', keywords: 'RTF转Markdown,RTF转MD,RTF文字提取', heading: 'RTF转Markdown', intro: '从RTF文档提取可读文字和段落，转换为可复制下载的Markdown。' },
    en: { title: 'RTF to Markdown｜Extract Rich Text Online｜Herdown', description: 'Upload or paste RTF and locally extract paragraphs, Unicode text, tabs, punctuation, and basic lists into Markdown.', keywords: 'RTF to Markdown,convert RTF to MD,RTF text extractor', heading: 'RTF to Markdown', intro: 'Extract readable text and paragraphs from RTF into downloadable Markdown.' },
  },
  '/paste-to-markdown': {
    zh: { title: 'HTML转Markdown转换器｜Herdown', description: '粘贴HTML源码、富文本或纯文本，在浏览器本地转换标题、链接、列表、表格、引用、代码和图片。', keywords: 'HTML转Markdown,HTML转Markdown转换器,HTML源码转Markdown,粘贴转Markdown', heading: 'HTML转Markdown转换器', intro: '粘贴HTML源码、富文本或纯文本，在浏览器本地转换为干净Markdown。' },
    en: { title: 'HTML to Markdown Converter｜Herdown', description: 'Paste HTML source, rich content, or plain text and convert headings, links, lists, tables, quotes, code, and images locally in your browser.', keywords: 'HTML to Markdown converter,convert HTML to Markdown,HTML source to Markdown,paste to Markdown', heading: 'HTML to Markdown Converter', intro: 'Paste HTML source, rich content, or plain text and convert it into clean Markdown locally.' },
  },
  '/notion-to-markdown': {
    zh: { title: 'Notion转Markdown｜公开页面与HTML导出转换｜Herdown', description: '转换公开Notion页面，也支持上传NotionHTML导出文件或ZIP在浏览器本地处理，生成可复制下载的Markdown。', keywords: 'Notion转Markdown,Notion页面转Markdown,NotionHTML导出', heading: 'Notion转Markdown', intro: '把公开Notion页面或HTML导出文件转换为干净Markdown。' },
    en: { title: 'Notion to Markdown｜Public Pages and HTML Export｜Herdown', description: 'Convert public Notion pages online, or process Notion HTML exports and ZIP files locally into downloadable Markdown.', keywords: 'Notion to Markdown,Notion page to Markdown,Notion HTML export', heading: 'Notion to Markdown', intro: 'Convert public Notion pages or HTML exports into clean Markdown.' },
  },
  '/google-docs-to-markdown': {
    zh: { title: 'Google Docs转Markdown｜公开文档与HTML导出转换｜Herdown', description: '转换公开Google Docs文档，也支持上传Google DocsHTML导出文件或粘贴HTML在浏览器本地处理。', keywords: 'Google Docs转Markdown,Google Docs文档转Markdown,Google DocsHTML导出', heading: 'Google Docs转Markdown', intro: '把公开Google Docs文档或HTML导出文件转换为干净Markdown。' },
    en: { title: 'Google Docs to Markdown｜Public Documents and HTML Export｜Herdown', description: 'Convert public Google Docs documents online, or process Google Docs HTML exports locally into clean Markdown.', keywords: 'Google Docs to Markdown,Google Docs document to Markdown,Google Docs HTML export', heading: 'Google Docs to Markdown', intro: 'Convert public Google Docs documents or HTML exports into clean Markdown.' },
  },
  '/markdown-to-html': {
    zh: { title: 'Markdown转HTML｜在线生成独立HTML文件｜Herdown', description: '在浏览器本地把Markdown转换为带样式、可预览、可下载的独立HTML文件。', keywords: 'Markdown转HTML,Markdown转网页,MarkdownHTML转换', heading: 'Markdown转HTML', intro: '把Markdown转换为可以直接发布和保存的独立HTML文件。' },
    en: { title: 'Markdown to HTML｜Standalone HTML Export｜Herdown', description: 'Convert Markdown locally into a styled, previewable, downloadable standalone HTML file.', keywords: 'Markdown to HTML,convert Markdown to HTML,Markdown HTML converter', heading: 'Markdown to HTML', intro: 'Turn Markdown into a standalone HTML file that is ready to publish or save.' },
  },
  '/markdown-to-pdf': {
    zh: { title: 'Markdown转PDF｜在线生成A4PDF｜Herdown', description: '在浏览器本地把Markdown排版为A4PDF，保留标题、列表、表格、代码和链接。', keywords: 'Markdown转PDF,Markdown转文档,MarkdownPDF转换', heading: 'Markdown转PDF', intro: '把Markdown排版为适合分享和交付的A4PDF文件。' },
    en: { title: 'Markdown to PDF｜A4 PDF Export｜Herdown', description: 'Format Markdown locally as an A4 PDF while preserving headings, lists, tables, code, and links.', keywords: 'Markdown to PDF,convert Markdown to PDF,Markdown PDF converter', heading: 'Markdown to PDF', intro: 'Format Markdown as an A4 PDF for sharing and delivery.' },
  },
  '/markdown-to-word': {
    zh: { title: 'Markdown转Word｜在线生成DOCX文件｜Herdown', description: '在浏览器本地把Markdown转换为可继续编辑的DOCX，支持标题、列表、表格、代码和链接。', keywords: 'Markdown转Word,Markdown转DOCX,Markdown文档转换', heading: 'Markdown转Word', intro: '把Markdown转换为可以继续编辑和审阅的Word文档。' },
    en: { title: 'Markdown to Word｜Editable DOCX Export｜Herdown', description: 'Convert Markdown locally into an editable DOCX with headings, lists, tables, code, and links.', keywords: 'Markdown to Word,Markdown to DOCX,convert Markdown to Word', heading: 'Markdown to Word', intro: 'Turn Markdown into a Word document that is ready for editing and review.' },
  },
  '/markdown-to-csv': {
    zh: { title: 'Markdown转CSV｜Markdown表格导出CSV｜Herdown', description: '在浏览器本地提取Markdown表格并下载为CSV，适合继续在Excel或数据工具中处理。', keywords: 'Markdown转CSV,Markdown表格转CSV,表格导出CSV', heading: 'Markdown转CSV', intro: '提取Markdown表格并下载为可以继续处理的CSV文件。' },
    en: { title: 'Markdown to CSV｜Export Markdown Tables｜Herdown', description: 'Extract a Markdown table locally and download it as CSV for Excel or data tools.', keywords: 'Markdown to CSV,Markdown table to CSV,convert Markdown table', heading: 'Markdown to CSV', intro: 'Extract a Markdown table and download it as a CSV file for further processing.' },
  },
  '/markdown-viewer': {
    zh: { title: 'Markdown Viewer｜在线打开和预览MD文件｜Herdown', description: '在浏览器本地打开、编辑和预览Markdown文件，支持实时预览、HTML和PDF导出。', keywords: 'Markdown Viewer,Markdown文件查看器,打开MD文件,Markdown实时预览', heading: 'Markdown Viewer', intro: '打开本地Markdown文件，实时查看排版并导出结果。' },
    en: { title: 'Markdown Viewer｜Open and Preview MD Files｜Herdown', description: 'Open, edit, and preview Markdown files locally with live preview, HTML, and PDF export.', keywords: 'Markdown viewer,Markdown file viewer,open MD file,Markdown live preview', heading: 'Markdown Viewer', intro: 'Open a local Markdown file, preview it live, and export the result.' },
  },
  '/markdown-to-wechat': {
    zh: { title: 'Markdown转微信公众号｜在线公众号排版｜Herdown', description: '把Markdown整理为适合微信公众号编辑器的富文本，支持主题预览和一键复制。', keywords: 'Markdown转微信公众号,公众号排版,Markdown公众号编辑器', heading: 'Markdown转微信公众号', intro: '把Markdown排版为可以复制到微信公众号编辑器的富文本。' },
    en: { title: 'Markdown to WeChat｜Rich Text Formatter｜Herdown', description: 'Format Markdown as WeChat-friendly rich text with theme preview and one-click copy.', keywords: 'Markdown to WeChat,WeChat rich text,Markdown WeChat formatter', heading: 'Markdown to WeChat', intro: 'Format Markdown as rich text that can be copied into the WeChat editor.' },
  },
  '/markdown-to-xiaohongshu': {
    zh: { title: 'Markdown转小红书｜生成小红书图片卡片｜Herdown', description: '把Markdown拆分为小红书图片卡片，支持主题、比例和ZIP下载。', keywords: 'Markdown转小红书,小红书图片卡片,Markdown图片生成', heading: 'Markdown转小红书', intro: '把Markdown拆分为适合发布的小红书图片卡片。' },
    en: { title: 'Markdown to Xiaohongshu｜Image Card Generator｜Herdown', description: 'Turn Markdown into Xiaohongshu image cards with themes, ratios, and ZIP download.', keywords: 'Markdown to Xiaohongshu,Xiaohongshu image cards,Markdown image generator', heading: 'Markdown to Xiaohongshu', intro: 'Turn Markdown into downloadable Xiaohongshu image cards.' },
  },
  '/markdown-tools': {
    zh: { title: 'Markdown工具中心｜查看、转换与发布｜Herdown', description: '访问Markdown查看器、格式转换和微信公众号、小红书发布工具。', keywords: 'Markdown工具,Markdown查看器,Markdown转换,Markdown发布', heading: 'Markdown工具中心', intro: '从Markdown编辑和预览开始，按下一步任务选择输出工具。' },
    en: { title: 'Markdown Tools｜View, Convert, and Publish｜Herdown', description: 'Browse focused Markdown tools for viewing, conversion, and WeChat or Xiaohongshu publishing.', keywords: 'Markdown tools,Markdown viewer,Markdown converter,Markdown publishing', heading: 'Markdown tools', intro: 'Start with Markdown editing and choose the output tool for your next task.' },
  },
  '/markdown-format-guide': {
    zh: { title: 'Markdown格式转换指南｜Herdown', description: '根据编辑、交付和发布场景选择Markdown转HTML、PDF、Word、CSV和平台排版工具。', keywords: 'Markdown格式转换,Markdown转HTML,Markdown转PDF,Markdown转Word', heading: 'Markdown格式转换指南', intro: '根据下一步要编辑、交付或发布的位置选择Markdown输出格式。' },
    en: { title: 'Markdown Format Guide｜Choose the Right Output｜Herdown', description: 'Choose Markdown to HTML, PDF, Word, CSV, or publishing tools based on your next workflow.', keywords: 'Markdown format guide,Markdown to HTML,Markdown to PDF,Markdown to Word', heading: 'Markdown format guide', intro: 'Choose a Markdown output format based on where you will edit, deliver, or publish next.' },
  },
  '/merge-documents': {
    zh: { title: '文档合并工具指南｜PDF、DOCX、PPTX和Excel｜Herdown', description: '选择PDF、DOCX、PPTX或Excel合并工具，按文件顺序生成一个可下载文件。', keywords: '文档合并,PDF合并,DOCX合并,PPTX合并,Excel合并', heading: '文档合并工具指南', intro: '按格式选择合并工具，文件在浏览器本地处理。' },
    en: { title: 'Merge Document Tools｜PDF, DOCX, PPTX, and Excel｜Herdown', description: 'Choose a PDF, DOCX, PPTX, or Excel merge tool and create an ordered downloadable file locally.', keywords: 'merge documents,merge PDF,merge DOCX,merge PPTX,merge Excel', heading: 'Merge document tools', intro: 'Choose a format-specific merge tool and process files locally in your browser.' },
  },
  '/merge-pdf': {
    zh: { title: 'PDF合并｜在线合并PDF文件｜Herdown', description: '在线合并多个PDF文件，按顺序生成一个PDF。文件在浏览器本地处理，不上传。', keywords: 'PDF合并,合并PDF,PDF文件合并,在线PDF合并', heading: 'PDF合并', intro: '选择多个PDF，调整顺序并下载一个合并后的PDF文件。' },
    en: { title: 'Merge PDF｜Combine PDF Files Online｜Herdown', description: 'Combine multiple PDF files in order into one PDF locally in your browser without uploading them.', keywords: 'merge PDF,combine PDF,PDF merger,merge PDF files', heading: 'Merge PDF', intro: 'Choose PDF files, set their order, and download one merged PDF.' },
  },
  '/merge-docx': {
    zh: { title: 'DOCX合并｜在线合并Word文档｜Herdown', description: '在线合并多个DOCX文档，尽量保留样式、表格、图片和列表。文件在浏览器本地处理。', keywords: 'DOCX合并,合并DOCX,Word文档合并,Merge DOCX', heading: 'DOCX合并', intro: '按顺序选择Word文档，生成一个可以继续编辑的DOCX文件。' },
    en: { title: 'Merge DOCX｜Combine Word Documents Online｜Herdown', description: 'Combine DOCX documents locally while preserving styles, tables, images, and lists when possible.', keywords: 'merge DOCX,combine DOCX,merge Word documents,DOCX merger', heading: 'Merge DOCX', intro: 'Choose Word documents in order and create one editable DOCX file.' },
  },
  '/merge-pptx': {
    zh: { title: 'PPTX合并｜在线合并PowerPoint演示文稿｜Herdown', description: '在线合并多个PPTX演示文稿，按文件顺序保留幻灯片、图片和版式关系。', keywords: 'PPTX合并,合并PPTX,PowerPoint合并,Merge PPTX', heading: 'PPTX合并', intro: '选择多个演示文稿，按文件顺序追加幻灯片并下载合并文件。' },
    en: { title: 'Merge PPTX｜Combine PowerPoint Presentations｜Herdown', description: 'Combine PPTX presentations in order while retaining slides, images, and layout relationships locally.', keywords: 'merge PPTX,combine PPTX,merge PowerPoint,PowerPoint merger', heading: 'Merge PPTX', intro: 'Choose presentations, append their slides in order, and download one file.' },
  },
  '/merge-excel': {
    zh: { title: 'Excel合并｜在线合并Excel文件和工作表｜Herdown', description: '在线合并多个Excel文件，默认每个文件一个工作表，也支持把数据追加到一张表。', keywords: 'Excel合并,合并Excel,Excel工作表合并,Merge Excel', heading: 'Excel合并', intro: '把多个Excel文件合并为一个工作簿，并选择工作表或追加模式。' },
    en: { title: 'Merge Excel｜Combine Excel Files and Sheets｜Herdown', description: 'Combine Excel files into one workbook with one worksheet per file or append all data into one sheet.', keywords: 'merge Excel,combine Excel,merge Excel files,Excel merger', heading: 'Merge Excel', intro: 'Combine Excel files into one workbook and choose worksheet or append mode.' },
  },
  '/word-to-markdown': {
    zh: { title: 'Word转Markdown｜Herdown', description: '在本地将Word文档整理成结构化Markdown。', keywords: 'Word转Markdown,DOCX转换,文档转Markdown', heading: 'Word转Markdown', intro: '使用本地工具整理Word文档，文件不需要上传到Herdown。' },
    en: { title: 'Word to Markdown｜Herdown', description: 'Turn Word documents into structured Markdown locally.', keywords: 'Word to Markdown,DOCX conversion,document to Markdown', heading: 'Word to Markdown', intro: 'Process Word documents locally without uploading the file to Herdown.' },
  },
  '/sitemap-extractor': {
    zh: { title: 'SitemapURL提取器｜免费导出网站URL｜Herdown', description: '输入域名或Sitemap地址，自动发现Sitemap、展开SitemapIndex并导出去重后的URL列表，支持TXT、CSV和Markdown。', keywords: 'Sitemap提取器,SitemapURL提取,网站URL导出', heading: 'SitemapURL提取器', intro: '发现并展开网站Sitemap，导出去重后的完整URL列表。' },
    en: { title: 'Sitemap URL Extractor｜Free URL Export｜Herdown', description: 'Discover sitemap files, expand sitemap indexes, and export a deduplicated URL list as TXT, CSV, or Markdown.', keywords: 'sitemap extractor,sitemap URL extractor,extract URLs from sitemap', heading: 'Sitemap URL Extractor', intro: 'Discover sitemap files, expand sitemap indexes, and export clean website URLs.' },
  },
  '/sitemap-checker': {
    zh: { title: 'Sitemap检查器｜查找并检查XMLSitemap｜Herdown', description: '输入网站域名，自动查找Sitemap并检查可访问性、XML结构、URL数量、重复地址和SitemapIndex。', keywords: 'Sitemap检查器,Sitemap查找器,检查Sitemap', heading: 'Sitemap查找与检查器', intro: '查找网站Sitemap，并检查文件状态、XML结构和URL质量。' },
    en: { title: 'Sitemap Finder & Checker｜Free XML Check｜Herdown', description: 'Find sitemap files and check availability, XML structure, URL counts, duplicate URLs, and sitemap indexes.', keywords: 'sitemap checker,sitemap finder,check sitemap XML', heading: 'Sitemap Finder & Checker', intro: 'Find website sitemap files and check their status, XML structure, and URL quality.' },
  },
  '/sitemap-validator': {
    zh: { title: 'Sitemap验证器｜在线校验SitemapXML｜Herdown', description: '输入SitemapURL或粘贴XML，检查XML语法、Sitemap根元素、命名空间、loc地址、重复URL和协议限制。', keywords: 'Sitemap验证器,Sitemap校验,XMLSitemap验证', heading: 'Sitemap验证器', intro: '校验在线Sitemap或未发布的XML内容，并定位具体错误。' },
    en: { title: 'Sitemap Validator｜Validate Sitemap XML｜Herdown', description: 'Validate a sitemap URL or pasted XML for syntax, roots, namespace, loc values, duplicate URLs, and protocol limits.', keywords: 'sitemap validator,validate sitemap XML,XML sitemap validator', heading: 'Sitemap Validator', intro: 'Validate a live sitemap or unpublished XML and locate specific errors.' },
  },
  '/sitemap-generator': {
    zh: { title: 'Sitemap生成器｜在线创建sitemap.xml｜Herdown', description: '抓取公开网站或粘贴最多50,000个URL，生成并下载符合标准的sitemap.xml文件。', keywords: 'Sitemap生成器,XMLSitemap生成,在线生成Sitemap', heading: 'XMLSitemap生成器', intro: '从公开网站或URL列表生成可以下载的标准sitemap.xml文件。' },
    en: { title: 'XML Sitemap Generator｜Create sitemap.xml｜Herdown', description: 'Crawl a public website or paste up to 50,000 URLs to generate and download a standards-compliant sitemap.xml file.', keywords: 'sitemap generator,XML sitemap generator,create sitemap XML', heading: 'XML Sitemap Generator', intro: 'Generate a downloadable standards-compliant sitemap.xml from a public website or URL list.' },
  },
  '/website-url-extractor': {
    zh: { title: 'Website URL提取器｜抓取并导出站内链接｜Herdown', description: '抓取公开网站的同源HTML链接，检查HTTP状态、页面标题和抓取深度，并导出TXT、CSV或Markdown清单。', keywords: 'Website URL提取器,网站链接提取,站内URL导出', heading: 'Website URL提取器', intro: '抓取公开网站的内部链接，查看页面信息并导出干净的URL清单。' },
    en: { title: 'Website URL Extractor｜Export Internal Links｜Herdown', description: 'Crawl same-origin HTML links, inspect HTTP status, titles, and crawl depth, then export TXT, CSV, or Markdown.', keywords: 'website URL extractor,extract links from website,internal link crawler', heading: 'Website URL Extractor', intro: 'Crawl internal website links, inspect page details, and export a clean URL inventory.' },
  },
  '/api': {
    zh: { title: 'API控制台｜Herdown', description: '创建和管理HerdownAPI密钥，查看额度和使用情况。', keywords: 'Herdown API,API密钥,网页解析API', heading: 'API控制台', intro: '创建API密钥，把网页解析接入你的脚本和工作流。' },
    en: { title: 'API console｜Herdown', description: 'Create and manage Herdown API keys and view usage.', keywords: 'Herdown API,API key,webpage parsing API', heading: 'API console', intro: 'Create an API key and connect webpage parsing to your scripts and workflows.' },
  },
  '/mcp': {
    zh: { title: 'MCP接入｜Herdown', description: '配置Herdown远程MCP，让支持MCP的客户端调用网页解析和全站抓取。', keywords: 'Herdown MCP,MCP接入,远程MCP,网页解析', heading: 'MCP接入', intro: '把Herdown连接到支持MCP的客户端，调用网页解析和全站抓取能力。' },
    en: { title: 'MCP integration｜Herdown', description: 'Connect Herdown remote MCP to clients that support webpage parsing and site crawling.', keywords: 'Herdown MCP,MCP integration,remote MCP,webpage parsing', heading: 'MCP integration', intro: 'Connect Herdown to an MCP client and call webpage parsing and site crawling tools.' },
  },
  '/cli': {
    zh: { title: 'CLI命令行工具｜Herdown', description: '在终端调用Herdown，把公开网页整理成Markdown文件。', keywords: 'Herdown CLI,网页转Markdown,命令行工具', heading: 'CLI命令行工具', intro: '在终端运行Herdown，将公开网页转换并保存为Markdown。' },
    en: { title: 'CLI tool｜Herdown', description: 'Run Herdown from a terminal and save public webpages as Markdown files.', keywords: 'Herdown CLI,webpage to Markdown,command line tool', heading: 'CLI tool', intro: 'Run Herdown from a terminal and save public webpages as Markdown.' },
  },
  '/skill': {
    zh: { title: 'HerdownSkill：AIAgent工作流路由｜Herdown', description: '使用HerdownSkill让AIAgent在公开URL、本地文件、API、MCP、CLI、浏览器提取和OCR之间选择。', keywords: 'HerdownSkill,AIAgentSkill,网页转Markdown,Agent工作流', heading: 'HerdownSkill：AIAgent工作流路由', intro: '把这份操作说明交给AIAgent，让它按场景选择网页、API、MCP、CLI或本地工具。' },
    en: { title: 'Herdown Skill for AI Agent Workflows｜Herdown', description: 'Use Herdown Skill to route an AI agent between public URL conversion, local files, API, MCP, CLI, browser extraction, and OCR.', keywords: 'Herdown Skill,AI agent skill,webpage to Markdown,agent workflow', heading: 'Herdown Skill for AI Agent Workflows', intro: 'Give an AI agent the instructions it needs to choose the right Herdown workflow.' },
  },
  '/pricing': {
    zh: { title: '网页解析价格和额度｜Herdown', description: '查看Herdown网页解析免费额度、每日规则和一次性点数包，再开始Markdown工作流。', keywords: 'Herdown价格,网页解析额度,API额度,一次性点数', heading: '网页解析价格和额度', intro: '先使用免费网页解析，再按需购买不过期的一次性点数。' },
    en: { title: 'Webpage Parsing Pricing and Credits｜Herdown', description: 'Review Herdown webpage parsing pricing, the free allowance, and one-time credits before starting a Markdown workflow.', keywords: 'Herdown pricing,webpage parsing credits,API credits,one-time credits', heading: 'Webpage Parsing Pricing and Credits', intro: 'Start with free webpage parsing or buy one-time credits when you need more.' },
  },
  '/browser-extension': {
    zh: { title: '浏览器本地网页转Markdown插件｜Herdown', description: '安装Herdown浏览器插件，在本地提取当前渲染网页，检查后导出干净Markdown。', keywords: 'Herdown浏览器插件,网页转Markdown插件,网页提取插件,Markdown插件', heading: '浏览器本地网页转Markdown插件', intro: '下载本地扩展，在浏览器中整理当前页面并导出Markdown。' },
    en: { title: 'Browser Extension for Local Web to Markdown｜Herdown', description: 'Install the Herdown browser extension to extract the current rendered webpage locally and export clean Markdown.', keywords: 'Herdown browser extension,local web to Markdown,web clipping extension,Markdown extension', heading: 'Browser Extension for Local Web to Markdown', intro: 'Download the local extension to prepare the current page and export Markdown.' },
  },
  '/docs': {
    zh: { title: '网页转Markdown开发者文档｜Herdown', description: '通过HerdownRESTAPI、MCP、CLI、Skill和浏览器插件接入网页转Markdown工作流。', keywords: 'Herdown文档,REST API,MCP,CLI,网页转Markdown,AIAgent', heading: '网页转Markdown开发者文档', intro: '查看网页解析、REST API、MCP、CLI和本地工具的使用说明。' },
    en: { title: 'Developer Documentation for Web to Markdown｜Herdown', description: 'Connect webpage to Markdown workflows with the Herdown REST API, MCP, CLI, Skill, and browser extension.', keywords: 'Herdown docs,REST API,MCP,CLI,web to Markdown,AI agents', heading: 'Developer Documentation for Web to Markdown', intro: 'Learn how to connect Herdown to your AI agent with the REST API, MCP, CLI, and local tools.' },
  },
  '/help': {
    zh: { title: '帮助中心｜Herdown', description: '查看Herdown的使用帮助、额度说明、账号和数据处理说明。', keywords: 'Herdown帮助,使用说明,额度,数据处理', heading: '帮助中心', intro: '查找使用Herdown、额度、账号和数据处理相关的说明。' },
    en: { title: 'Help center｜Herdown', description: 'Find help about using Herdown, quotas, accounts, and data handling.', keywords: 'Herdown help,usage guide,quota,data handling', heading: 'Help center', intro: 'Find answers about using Herdown, quotas, accounts, and data handling.' },
  },
  '/faq': {
    zh: { title: '常见问题｜Herdown', description: '查看Herdown关于网页解析、数据保存、额度和付费服务的常见问题。', keywords: 'Herdown常见问题,网页解析,额度,付费服务', heading: '常见问题', intro: '查看使用Herdown前最常见的问题和答案。' },
    en: { title: 'FAQ｜Herdown', description: 'Answers about Herdown webpage parsing, data retention, quotas, and paid services.', keywords: 'Herdown FAQ,webpage parsing,quota,paid service', heading: 'Frequently asked questions', intro: 'Find answers to common questions before using Herdown.' },
  },
  '/blog': {
    zh: { title: 'Herdown博客｜Markdown与AIAgent教程', description: '阅读HTML转Markdown、AI Agent资料整理和Markdown工具工作流教程。', keywords: 'Markdown博客,HTML转Markdown,AIAgent,Markdown工具', heading: 'Herdown博客', intro: '围绕Markdown、AI Agent和资料整理工作流，分享可以直接使用的教程。' },
    en: { title: 'Herdown Blog｜Markdown and AI Agent guides', description: 'Read practical guides about HTML to Markdown, AI agent material preparation, and Markdown tool workflows.', keywords: 'Markdown blog,HTML to Markdown,AI agents,Markdown tools', heading: 'Herdown Blog', intro: 'Practical guides for Markdown, AI agents, and clean material workflows.' },
  },
  '/blog/how-to-convert-html-to-markdown-for-ai': {
    zh: { title: '如何把HTML转换为适合AI的Markdown｜Herdown', description: '了解如何提取网页正文、保留语义结构，并生成适合AI Agent使用的Markdown。', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools', heading: '如何把HTML转换为适合AI的Markdown', intro: '从网页HTML中提取正文、保留语义结构，并整理成AI Agent可以稳定理解、检索和引用的Markdown。' },
    en: { title: 'How to Convert HTML to Markdown for AI｜Herdown', description: 'Learn how to extract useful webpage content, preserve semantic structure, and create Markdown for AI agents.', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools', heading: 'How to Convert HTML to Markdown for AI', intro: 'Extract useful content from webpage HTML, preserve its meaning, and prepare Markdown that AI agents can read, retrieve, and cite reliably.' },
  },
  '/blog/best-markdown-converter-for-ai-agents': {
    zh: { title: '如何选择适合AI Agent的Markdown转换器｜Herdown', description: '从正文边界、结构质量、来源追踪、失败反馈和隐私边界评估AI Agent用Markdown转换器。', keywords: 'best markdown converter for ai agents,Markdown转换器,AI Agent工具', heading: '如何选择适合AI Agent的Markdown转换器', intro: '从正文识别、结构保留、隐私边界和下游交付四个维度，判断Markdown转换器是否真的适合AI Agent。' },
    en: { title: 'Best Markdown Converter for AI Agents: What to Compare｜Herdown', description: 'Compare Markdown converters for AI agents by content boundaries, semantic quality, source traceability, failure feedback, and privacy.', keywords: 'best markdown converter for ai agents,Markdown converter,AI agent tools', heading: 'Best Markdown Converter for AI Agents: What to Compare', intro: 'Evaluate a Markdown converter for AI agents by content boundaries, semantic structure, privacy, and the handoff to downstream tools.' },
  },
  '/blog/markdown-for-agents-tools': {
    zh: { title: 'AI Agent资料整理工具工作流指南｜Herdown', description: '了解网页提取、本地文件、Markdown查看、格式输出和平台发布如何组成AI Agent资料工作流。', keywords: 'markdown for agents tools,Markdown工具,AI Agent工作流', heading: 'AI Agent资料整理工具工作流指南', intro: '把网页、文件、Markdown查看、格式输出和平台发布工具连接起来，建立一条适合AI Agent的资料处理流程。' },
    en: { title: 'Markdown for Agents Tools: A Practical Workflow｜Herdown', description: 'Connect webpage extraction, local files, Markdown review, format exports, and publishing tools into an AI agent workflow.', keywords: 'markdown for agents tools,Markdown tools,AI agent workflow', heading: 'Markdown for Agents Tools: A Practical Workflow', intro: 'Connect webpage extraction, local files, Markdown review, format exports, and publishing tools into a workflow built for AI agents.' },
  },
};

const localizedSeoPages: Record<string, Partial<Record<SeoLanguage, SeoPage>>> = {
  '/': {
    ja: { title: 'AIエージェント向けMarkdown｜Herdown', description: 'Webページ、文書、画像をAIエージェント向けのクリーンなMarkdownに変換します。', keywords: 'WebページMarkdown,文書Markdown,AIエージェント,Markdown変換', heading: 'AIエージェント向けのクリーンなMarkdown', intro: 'Webページ、文書、画像をAIエージェントが扱いやすいMarkdownに整えます。' },
    es: { title: 'Markdown limpio para agentes de IA｜Herdown', description: 'Convierte páginas web, documentos e imágenes en Markdown limpio para agentes de IA.', keywords: 'página web a Markdown,documento a Markdown,agentes de IA,convertidor Markdown', heading: 'Markdown limpio para agentes de IA', intro: 'Convierte páginas web, documentos e imágenes en Markdown claro para tu agente de IA.' },
    de: { title: 'Sauberes Markdown für AI-Agenten｜Herdown', description: 'Webseiten, Dokumente und Bilder in sauberes Markdown für AI-Agenten umwandeln.', keywords: 'Webseite zu Markdown,Dokument zu Markdown,AI-Agenten,Markdown-Konverter', heading: 'Sauberes Markdown für AI-Agenten', intro: 'Webseiten, Dokumente und Bilder in gut nutzbares Markdown für deinen AI-Agenten umwandeln.' },
  },
  '/markdown-tools': {
    ja: { title: 'Markdownツール｜表示、変換、公開｜Herdown', description: 'Markdownの表示、編集、形式変換、WeChatとXiaohongshu向け公開ツールをまとめています。', keywords: 'Markdownツール,Markdown Viewer,Markdown変換,Markdown公開', heading: 'Markdownツール', intro: 'Markdownを編集し、次の作業に合う出力ツールを選びます。' },
    es: { title: 'Herramientas Markdown｜Ver, convertir y publicar｜Herdown', description: 'Herramientas Markdown para ver, editar, convertir y publicar en WeChat o Xiaohongshu.', keywords: 'herramientas Markdown,visor Markdown,convertidor Markdown,publicar Markdown', heading: 'Herramientas Markdown', intro: 'Edita Markdown y elige la herramienta de salida para tu siguiente tarea.' },
    de: { title: 'Markdown-Werkzeuge｜Anzeigen, konvertieren und veröffentlichen｜Herdown', description: 'Markdown-Werkzeuge zum Anzeigen, Bearbeiten, Konvertieren und Veröffentlichen.', keywords: 'Markdown-Werkzeuge,Markdown Viewer,Markdown-Konverter,Markdown veröffentlichen', heading: 'Markdown-Werkzeuge', intro: 'Markdown bearbeiten und das passende Ausgabeformat für den nächsten Schritt wählen.' },
  },
  '/markdown-format-guide': {
    ja: { title: 'Markdown形式ガイド｜Herdown', description: '編集、納品、公開の目的に合わせてMarkdownの出力形式を選びます。', keywords: 'Markdown形式,Markdown HTML,Markdown PDF,Markdown Word', heading: 'Markdown形式ガイド', intro: '次に編集、納品、公開する場所に合わせて出力形式を選びます。' },
    es: { title: 'Guía de formatos Markdown｜Herdown', description: 'Elige HTML, PDF, Word, CSV u otros formatos Markdown según tu flujo de trabajo.', keywords: 'formatos Markdown,Markdown a HTML,Markdown a PDF,Markdown a Word', heading: 'Guía de formatos Markdown', intro: 'Elige el formato según dónde editarás, entregarás o publicarás después.' },
    de: { title: 'Markdown-Formatleitfaden｜Herdown', description: 'HTML, PDF, Word, CSV und weitere Ausgabeformate passend zum Workflow auswählen.', keywords: 'Markdown-Formate,Markdown zu HTML,Markdown zu PDF,Markdown zu Word', heading: 'Markdown-Formatleitfaden', intro: 'Das Format danach wählen, wo du als Nächstes bearbeitest, lieferst oder veröffentlichst.' },
  },
  '/merge-documents': {
    ja: { title: '文書結合ツール｜PDF、DOCX、PPTX、Excel｜Herdown', description: 'PDF、DOCX、PPTX、Excelの結合ツールを形式別に選べます。', keywords: '文書結合,PDF結合,DOCX結合,PPTX結合,Excel結合', heading: '文書結合ツール', intro: '形式に合う結合ツールを選び、ブラウザ内で処理します。' },
    es: { title: 'Herramientas para unir documentos｜Herdown', description: 'Elige herramientas para unir PDF, DOCX, PPTX o Excel en el orden de tus archivos.', keywords: 'unir documentos,unir PDF,unir DOCX,unir PPTX,unir Excel', heading: 'Herramientas para unir documentos', intro: 'Elige una herramienta por formato y procesa los archivos en tu navegador.' },
    de: { title: 'Dokumente zusammenführen｜PDF, DOCX, PPTX und Excel｜Herdown', description: 'Werkzeug für PDF, DOCX, PPTX oder Excel auswählen und Dateien lokal in Reihenfolge zusammenführen.', keywords: 'Dokumente zusammenführen,PDF zusammenführen,DOCX zusammenführen,PPTX zusammenführen,Excel zusammenführen', heading: 'Dokumente zusammenführen', intro: 'Ein Format auswählen und Dateien lokal im Browser verarbeiten.' },
  },
  '/merge-pdf': {
    ja: { title: 'PDF結合｜PDFファイルを結合｜Herdown', description: '複数のPDFを順番どおり1つに結合します。ファイルはブラウザ内で処理されます。', keywords: 'PDF結合,PDFファイル結合,PDFマージ', heading: 'PDF結合', intro: 'PDFを選択して順番を調整し、1つのPDFをダウンロードします。' },
    es: { title: 'Unir PDF｜Combinar archivos PDF｜Herdown', description: 'Combina varios PDF en orden en un solo archivo dentro del navegador.', keywords: 'unir PDF,combinar PDF,unir archivos PDF', heading: 'Unir PDF', intro: 'Elige los PDF, ordena los archivos y descarga un único PDF.' },
    de: { title: 'PDF zusammenführen｜PDF-Dateien kombinieren｜Herdown', description: 'Mehrere PDF-Dateien lokal im Browser in der gewünschten Reihenfolge zusammenführen.', keywords: 'PDF zusammenführen,PDF kombinieren,PDF-Dateien verbinden', heading: 'PDF zusammenführen', intro: 'PDFs auswählen, sortieren und eine gemeinsame PDF-Datei laden.' },
  },
  '/merge-docx': {
    ja: { title: 'DOCX結合｜Word文書を結合｜Herdown', description: '複数のDOCXを結合し、可能な限り書式、表、画像、リストを保持します。', keywords: 'DOCX結合,Word文書結合,DOCXマージ', heading: 'DOCX結合', intro: 'Word文書を順番に選び、編集可能なDOCXを作成します。' },
    es: { title: 'Unir DOCX｜Combinar documentos Word｜Herdown', description: 'Combina documentos DOCX y conserva estilos, tablas, imágenes y listas cuando es posible.', keywords: 'unir DOCX,combinar Word,DOCX merger', heading: 'Unir DOCX', intro: 'Elige documentos Word en orden y crea un DOCX editable.' },
    de: { title: 'DOCX zusammenführen｜Word-Dokumente kombinieren｜Herdown', description: 'DOCX-Dokumente lokal zusammenführen und Formatierungen möglichst erhalten.', keywords: 'DOCX zusammenführen,Word-Dokumente kombinieren,DOCX-Merger', heading: 'DOCX zusammenführen', intro: 'Word-Dokumente auswählen und ein bearbeitbares DOCX erstellen.' },
  },
  '/merge-pptx': {
    ja: { title: 'PPTX結合｜PowerPointを結合｜Herdown', description: '複数のPPTXを結合し、スライド、画像、レイアウトの関連を保持します。', keywords: 'PPTX結合,PowerPoint結合,PPTXマージ', heading: 'PPTX結合', intro: 'プレゼンテーションを選び、スライドを順番に追加します。' },
    es: { title: 'Unir PPTX｜Combinar presentaciones PowerPoint｜Herdown', description: 'Combina presentaciones PPTX conservando diapositivas, imágenes y relaciones de diseño.', keywords: 'unir PPTX,combinar PowerPoint,PPTX merger', heading: 'Unir PPTX', intro: 'Elige presentaciones y añade sus diapositivas en orden.' },
    de: { title: 'PPTX zusammenführen｜PowerPoint-Präsentationen kombinieren｜Herdown', description: 'PPTX-Präsentationen lokal zusammenführen und Folien, Bilder sowie Layoutbeziehungen erhalten.', keywords: 'PPTX zusammenführen,PowerPoint kombinieren,PPTX-Merger', heading: 'PPTX zusammenführen', intro: 'Präsentationen auswählen und Folien in Reihenfolge anfügen.' },
  },
  '/merge-excel': {
    ja: { title: 'Excel結合｜Excelファイルとシートを結合｜Herdown', description: '複数のExcelを1つのブックに結合します。ファイルごとのシートと追加モードに対応します。', keywords: 'Excel結合,Excelファイル結合,Excelシート結合', heading: 'Excel結合', intro: 'Excelを1つのブックにまとめ、シートまたは追加モードを選びます。' },
    es: { title: 'Unir Excel｜Combinar archivos y hojas Excel｜Herdown', description: 'Combina archivos Excel en un libro con una hoja por archivo o con modo de añadido.', keywords: 'unir Excel,combinar Excel,unir hojas Excel', heading: 'Unir Excel', intro: 'Combina archivos Excel en un libro y elige el modo de hojas o añadido.' },
    de: { title: 'Excel zusammenführen｜Dateien und Blätter kombinieren｜Herdown', description: 'Excel-Dateien in einer Arbeitsmappe zusammenführen, mit einem Blatt pro Datei oder Anhängemodus.', keywords: 'Excel zusammenführen,Excel-Dateien kombinieren,Excel-Blätter verbinden', heading: 'Excel zusammenführen', intro: 'Excel-Dateien in einer Arbeitsmappe kombinieren und den Modus wählen.' },
  },
  '/blog': {
    ja: { title: 'Herdownブログ｜MarkdownとAIエージェントのガイド', description: 'HTMLからMarkdownへの変換、AIエージェント向け資料整理、Markdownツールの実用ガイド。', keywords: 'Markdownブログ,HTMLからMarkdown,AIエージェント,Markdownツール', heading: 'Herdownブログ', intro: 'Markdown、AIエージェント、資料整理ワークフローの実用ガイド。' },
    es: { title: 'Blog de Herdown｜Guías de Markdown y agentes de IA', description: 'Guías prácticas sobre HTML a Markdown, preparación de materiales para agentes de IA y herramientas Markdown.', keywords: 'blog Markdown,HTML a Markdown,agentes de IA,herramientas Markdown', heading: 'Blog de Herdown', intro: 'Guías prácticas para Markdown, agentes de IA y materiales limpios.' },
    de: { title: 'Herdown-Blog｜Anleitungen zu Markdown und AI-Agenten', description: 'Praktische Anleitungen zu HTML-zu-Markdown, Materialaufbereitung für AI-Agenten und Markdown-Werkzeugen.', keywords: 'Markdown-Blog,HTML zu Markdown,AI-Agenten,Markdown-Werkzeuge', heading: 'Herdown-Blog', intro: 'Praktische Anleitungen für Markdown, AI-Agenten und saubere Material-Workflows.' },
  },
  '/blog/how-to-convert-html-to-markdown-for-ai': {
    ja: { title: 'HTMLをAI向けMarkdownに変換する方法｜Herdown', description: 'Webページの本文を抽出し、意味構造を保ったAIエージェント向けMarkdownを作る方法を説明します。', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools', heading: 'HTMLをAI向けMarkdownに変換する方法', intro: 'WebページのHTMLから本文を抽出し、AIエージェントが読み取りやすいMarkdownに整えます。' },
    es: { title: 'Cómo convertir HTML a Markdown para IA｜Herdown', description: 'Aprende a extraer el contenido útil de una página y conservar su estructura para agentes de IA.', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools', heading: 'Cómo convertir HTML a Markdown para IA', intro: 'Extrae el contenido útil del HTML y conserva su estructura para agentes de IA.' },
    de: { title: 'HTML für AI in Markdown umwandeln｜Herdown', description: 'Lerne, nützliche Webinhalte zu extrahieren und ihre Struktur für AI-Agenten zu bewahren.', keywords: 'how to convert html to markdown for ai,best markdown converter for ai agents,markdown for agents tools', heading: 'HTML für AI in Markdown umwandeln', intro: 'Nützliche Inhalte aus HTML extrahieren und ihre Struktur für AI-Agenten bewahren.' },
  },
  '/blog/best-markdown-converter-for-ai-agents': {
    ja: { title: 'AIエージェント向けMarkdown変換ツールの選び方｜Herdown', description: '本文境界、構造品質、出典追跡、失敗表示、プライバシーから変換ツールを比較します。', keywords: 'best markdown converter for ai agents,Markdown変換,AIエージェント', heading: 'AIエージェント向けMarkdown変換ツールの選び方', intro: 'Markdown変換ツールを本文境界、構造、出典、失敗表示、プライバシーから比較します。' },
    es: { title: 'Cómo elegir el mejor conversor Markdown para agentes de IA｜Herdown', description: 'Compara límites de contenido, estructura, fuentes, errores y privacidad para elegir un conversor Markdown.', keywords: 'best markdown converter for ai agents,convertidor Markdown,agentes de IA', heading: 'Cómo elegir el mejor conversor Markdown para agentes de IA', intro: 'Compara un conversor Markdown por sus límites de contenido, estructura, fuentes, errores y privacidad.' },
    de: { title: 'Den besten Markdown-Konverter für AI-Agenten auswählen｜Herdown', description: 'Markdown-Konverter nach Inhaltsgrenzen, Struktur, Quellen, Fehlermeldungen und Datenschutz vergleichen.', keywords: 'best markdown converter for ai agents,Markdown-Konverter,AI-Agenten', heading: 'Den besten Markdown-Konverter für AI-Agenten auswählen', intro: 'Markdown-Konverter nach Inhaltsgrenzen, Struktur, Quellen, Fehlern und Datenschutz vergleichen.' },
  },
  '/blog/markdown-for-agents-tools': {
    ja: { title: 'Markdown for Agents Toolsワークフロー｜Herdown', description: 'Web抽出、ローカルファイル、Markdown確認、形式出力、公開をAIエージェントの流れにまとめます。', keywords: 'markdown for agents tools,Markdownツール,AIエージェント', heading: 'Markdown for Agents Toolsワークフロー', intro: 'Web抽出、ローカルファイル、Markdown確認、形式出力、公開をAIエージェントの流れにまとめます。' },
    es: { title: 'Flujo de trabajo de Markdown for Agents Tools｜Herdown', description: 'Conecta extracción web, archivos locales, revisión Markdown, exportación y publicación para agentes de IA.', keywords: 'markdown for agents tools,herramientas Markdown,agentes de IA', heading: 'Flujo de trabajo de Markdown for Agents Tools', intro: 'Conecta extracción web, archivos locales, revisión Markdown, exportación y publicación para agentes de IA.' },
    de: { title: 'Markdown for Agents Tools: Workflow｜Herdown', description: 'Webextraktion, lokale Dateien, Markdown-Prüfung, Exporte und Veröffentlichung für AI-Agenten verbinden.', keywords: 'markdown for agents tools,Markdown-Werkzeuge,AI-Agenten', heading: 'Markdown for Agents Tools: Workflow', intro: 'Webextraktion, lokale Dateien, Markdown-Prüfung, Exporte und Veröffentlichung für AI-Agenten verbinden.' },
  },
};

const additionalLocalizedSeoPages = buildLocalizedSeoPages();

const seoPageFor = (path: string, language: SeoLanguage): SeoPage => additionalLocalizedSeoPages[path]?.[language as 'ja' | 'es' | 'de'] || localizedSeoPages[path]?.[language] || seoPages[path][language === 'zh' ? 'zh' : 'en'];

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
  if (requested === 'ja') return 'ja';
  if (requested === 'es') return 'es';
  if (requested === 'de') return 'de';
  const accepted = (request.headers.get('accept-language') || '').toLowerCase();
  if (accepted.startsWith('ja')) return 'ja';
  if (accepted.startsWith('es')) return 'es';
  if (accepted.startsWith('de')) return 'de';
  return accepted.startsWith('en') ? 'en' : 'zh';
};

const isLanguageVariantUrl = (url: URL): boolean => url.searchParams.has('lang');

type SeoFallbackSection = [string, string];

const seoFallbackSections: Record<string, Record<BaseSeoLanguage, SeoFallbackSection[]>> = {
  '/sitemap-extractor': {
    zh: [['自动发现Sitemap', '输入域名后检查robots.txt和常见Sitemap路径，也可以直接输入sitemap.xml地址。'], ['展开SitemapIndex', '自动读取子Sitemap并合并页面地址，重复URL只保留一次。'], ['导出URL列表', '结果可以复制或下载为TXT、CSV和Markdown，用于网站检查、迁移和AI资料导入。']],
    en: [['Discover sitemap files', 'Enter a domain to check robots.txt and common sitemap paths, or enter a sitemap.xml URL directly.'], ['Expand sitemap indexes', 'Follow child sitemap files automatically and keep each page URL once.'], ['Export URL lists', 'Copy the result or download TXT, CSV, or Markdown for audits, migrations, and AI ingestion.']],
  },
  '/sitemap-checker': {
    zh: [['自动查找Sitemap', '检查robots.txt声明与常见Sitemap路径，也支持直接输入sitemap.xml地址。'], ['检查XML结构', '识别urlset与sitemapindex根元素，验证loc地址并展开子Sitemap。'], ['检查URL质量', '统计去重URL和重复loc地址，给出清晰的通过、警告与错误项目。']],
    en: [['Find sitemap files', 'Check robots.txt declarations and common sitemap paths, or enter a sitemap.xml URL directly.'], ['Check XML structure', 'Recognize urlset and sitemapindex roots, validate loc values, and expand child sitemaps.'], ['Check URL quality', 'Count unique and duplicate loc values with clear pass, warning, and error checks.']],
  },
  '/sitemap-validator': {
    zh: [['真正的XML语法校验', '检查标签、属性和闭合关系，拒绝Sitemap不需要的DOCTYPE声明。'], ['Sitemap协议检查', '检查urlset或sitemapindex、标准命名空间、loc地址、50,000个URL和50MB限制。'], ['可选字段检查', '检查lastmod、changefreq、priority和重复loc地址，并给出具体问题位置。']],
    en: [['Real XML syntax validation', 'Check tags, attributes, and closing order while rejecting DOCTYPE declarations that sitemaps do not need.'], ['Sitemap protocol checks', 'Check urlset or sitemapindex, namespace, loc values, the 50,000 URL limit, and the 50MB limit.'], ['Optional metadata checks', 'Check lastmod, changefreq, priority, and duplicate loc values with specific feedback.']],
  },
  '/sitemap-generator': {
    zh: [['抓取网站生成', '跟随同源公开HTML链接，遵守robots.txt并拦截内网地址，每次最多处理50个页面。'], ['粘贴URL生成', '支持最多50,000个同源URL，自动移除重复地址并拒绝无效URL。'], ['下载标准XML', '输出包含标准Sitemap0.9命名空间的sitemap.xml，可复制、下载并继续验证。']],
    en: [['Generate by crawling', 'Follow public same-origin HTML links, respect robots.txt, block private networks, and process up to 50 pages.'], ['Generate from pasted URLs', 'Accept up to 50,000 same-origin URLs, remove duplicates, and reject invalid URLs.'], ['Download standard XML', 'Create sitemap.xml with the standard Sitemap 0.9 namespace for copying, downloading, and validation.']],
  },
  '/website-url-extractor': {
    zh: [['抓取站内链接', '只跟随与起始页面同源的公开HTML链接，外部链接不会混入清单。'], ['清理重复URL', '删除锚点和常见跟踪参数，再对规范化地址去重。'], ['导出页面清单', '查看HTTP状态、页面标题和抓取深度，并下载TXT、CSV或Markdown。']],
    en: [['Crawl internal links', 'Follow only public same-origin HTML links so external sites do not enter the inventory.'], ['Normalize duplicate URLs', 'Remove fragments and common tracking parameters before deduplicating normalized addresses.'], ['Export a page inventory', 'Inspect HTTP status, page titles, and crawl depth, then download TXT, CSV, or Markdown.']],
  },
  '/pricing': {
    zh: [['免费额度', '免费用户每月可使用1000次网页解析，适合先验证网页转Markdown效果。'], ['一次性点数', '点数包按页面展示购买，不自动续费，购买后的额度不过期。'], ['适用场景', '个人脚本、API、MCP和全站抓取都可以按需使用，具体限制以当前账号额度为准。']],
    en: [['Free usage', 'Free users can run 1,000 webpage parses per month to try the URL-to-Markdown workflow.'], ['One-time credits', 'Credit packages are purchased as shown on the pricing page, do not auto-renew, and do not expire.'], ['When to use it', 'Use the credits for scripts, the API, MCP, or site crawling according to the allowance on your account.']],
  },
  '/ppt-to-markdown': {
    zh: [['本地处理', 'PPT与PPTX文件使用本地工具整理，文件不会上传到Herdown。'], ['适合内容', '适合提取演示文稿中的标题、段落、列表和表格内容，生成可继续编辑的Markdown。'], ['使用提示', '复杂排版、扫描图片和嵌入媒体可能需要人工检查或配合本地OCR工具。']],
    en: [['Local processing', 'PPT and PPTX files are processed with a local tool and are not uploaded to Herdown.'], ['Suitable content', 'The workflow is suited to extracting presentation headings, paragraphs, lists, and tables into editable Markdown.'], ['What to check', 'Complex layouts, scanned images, and embedded media may need a manual review or a local OCR tool.']],
  },
  '/excel-to-markdown': {
    zh: [['本地处理', 'Excel与XLSX文件在当前设备上整理，Herdown不会接收文件内容。'], ['输出内容', '表格数据会整理成便于阅读、复制和继续交给AI工具处理的Markdown。'], ['使用提示', '复杂公式、图表、合并单元格和隐藏工作表转换后应人工复核。']],
    en: [['Local processing', 'Excel and XLSX files are prepared on the current device and their contents are not sent to Herdown.'], ['Output', 'Spreadsheet data is organized as Markdown that is easy to read, copy, and pass to an AI tool.'], ['What to check', 'Review complex formulas, charts, merged cells, and hidden worksheets after conversion.']],
  },
  '/csv-to-markdown': {
    zh: [['本地解析', 'CSV和TSV文件只在当前浏览器中处理，内容不会上传到Herdown。'], ['可靠表格转换', '支持常见分隔符和带引号单元格，并转义Markdown竖线、反斜杠和单元格换行。'], ['复制与下载', '转换结果可以直接复制，也可以下载为独立的Markdown文件。']],
    en: [['Local parsing', 'CSV and TSV files are processed only in the current browser and are not uploaded to Herdown.'], ['Reliable table conversion', 'Common delimiters and quoted cells are supported, with Markdown pipes, backslashes, and cell line breaks handled safely.'], ['Copy and download', 'Copy the converted table directly or download it as a standalone Markdown file.']],
  },
  '/json-to-markdown': {
    zh: [['本地严格解析', 'JSON只在当前浏览器中解析，语法错误会明确提示，内容不会上传。'], ['数组转换为表格', '对象数组会合并字段并生成Markdown表格，嵌套值会保持完整内容。'], ['保留嵌套层级', '嵌套对象和非表格数组会转换为标题与列表，保留原始结构。']],
    en: [['Strict local parsing', 'JSON is parsed only in the current browser, syntax errors are reported, and content is not uploaded.'], ['Arrays become tables', 'Object arrays combine their keys into Markdown table columns while retaining nested values.'], ['Keep nested hierarchy', 'Nested objects and non-tabular arrays become headings and lists that preserve their structure.']],
  },
  '/xml-to-markdown': {
    zh: [['识别Sitemap', 'urlset和sitemapindex会转换为包含loc、lastmod、changefreq和priority的Markdown表格。'], ['识别订阅源', 'RSS与Atom的标题、链接、日期、作者和描述会转换为可读章节。'], ['通用XML层级', '重复记录尽量转换为表格，其他嵌套元素保留层级，并拒绝DOCTYPE声明。']],
    en: [['Recognize sitemaps', 'urlset and sitemapindex become Markdown tables with loc, lastmod, changefreq, and priority.'], ['Recognize feeds', 'RSS and Atom titles, links, dates, authors, and descriptions become readable sections.'], ['Generic XML hierarchy', 'Repeated records become tables when possible, other nested elements retain hierarchy, and DOCTYPE is rejected.']],
  },
  '/rtf-to-markdown': {
    zh: [['本地提取', 'RTF文件只在当前浏览器中解析，文件内容不会上传到Herdown。'], ['保留可读结构', 'Unicode文字、段落、换行、制表符、标点和基础列表会转换为干净Markdown。'], ['移除非正文对象', '字体表、颜色表、嵌入图片、对象、页眉和页脚会被安全跳过。']],
    en: [['Local extraction', 'RTF files are parsed only in the current browser and are not uploaded to Herdown.'], ['Preserve readable structure', 'Unicode text, paragraphs, line breaks, tabs, punctuation, and basic lists become clean Markdown.'], ['Exclude non-body objects', 'Font tables, color tables, embedded images, objects, headers, and footers are safely skipped.']],
  },
  '/paste-to-markdown': {
    zh: [['富文本粘贴', '直接读取剪贴板中的HTML格式，保留标题、链接、列表、表格、引用、代码和图片。'], ['HTML源码', '粘贴原始HTML获得可预测的结构转换，并移除脚本、样式、表单和导航元素。'], ['纯文本', '保留原始段落，规范常见项目符号，不会凭空添加不存在的结构。']],
    en: [['Rich paste', 'Read HTML formatting from the clipboard and preserve headings, links, lists, tables, quotes, code, and images.'], ['HTML source', 'Paste raw HTML for predictable structural conversion while removing scripts, styles, forms, and navigation.'], ['Plain text', 'Keep original paragraphs, normalize common bullets, and avoid inventing structure that is not present.']],
  },
  '/notion-to-markdown': {
    zh: [['公开页面在线转换', '公开发布的Notion页面可以直接输入URL在线转换，工具会读取正文并生成Markdown。'], ['HTML导出兜底', '页面私密或受限时，从Notion导出HTML或ZIP，在当前浏览器中完成转换。'], ['保留可用结构', '标题、段落、列表、链接、表格、引用、代码和图片会尽量转换为可继续编辑的Markdown。']],
    en: [['Convert public pages online', 'Enter a published public Notion URL to fetch its body and generate Markdown online.'], ['HTML export fallback', 'When a page is private or restricted, export HTML or ZIP from Notion and convert it in this browser.'], ['Keep useful structure', 'Headings, paragraphs, lists, links, tables, quotes, code, and images are converted into editable Markdown when available.']],
  },
  '/google-docs-to-markdown': {
    zh: [['公开文档在线转换', '公开分享的Google Docs文档可以输入URL，工具通过HTML导出读取正文并生成Markdown。'], ['HTML导出兜底', '文档受限时，在Google Docs中下载为HTML，再上传或粘贴到当前页面本地转换。'], ['保留文档结构', '标题、段落、列表、链接、表格、引用和代码会尽量转换为可继续编辑的Markdown。']],
    en: [['Convert public documents online', 'Enter a publicly shared Google Docs URL and use its HTML export to generate Markdown.'], ['HTML export fallback', 'When the document is restricted, download it as HTML from Google Docs and convert it locally here.'], ['Keep document structure', 'Headings, paragraphs, lists, links, tables, quotes, and code are converted into editable Markdown when available.']],
  },
  '/markdown-to-html': {
    zh: [['独立HTML文件', '生成包含标题、样式和正文的单文件HTML，下载后可以直接发布或继续编辑。'], ['安全预览', '预览会清理脚本和事件属性，避免粘贴的HTML在页面中执行。'], ['适合发布', '适合博客草稿、项目文档、邮件正文和需要交付网页文件的场景。']],
    en: [['Standalone HTML', 'Generate a single HTML file with headings, styles, and body content ready to publish or edit.'], ['Safe preview', 'The preview removes scripts and event attributes so pasted HTML cannot execute in the page.'], ['Good for publishing', 'Use it for blog drafts, project docs, email content, and deliverable web files.']],
  },
  '/markdown-to-pdf': {
    zh: [['A4排版', '在浏览器中生成A4PDF，标题、段落、列表、表格、代码和链接会保留可读结构。'], ['分页保护', '表格、代码块和引用会尽量避免在页面中间断开。'], ['本地导出', 'Markdown和生成过程只在当前浏览器中运行，不上传服务器。']],
    en: [['A4 layout', 'Generate an A4 PDF in the browser while keeping headings, paragraphs, lists, tables, code, and links readable.'], ['Page break care', 'Tables, code blocks, and quotes are kept together where the browser export allows.'], ['Local export', 'Markdown and the export process stay in this browser and are not uploaded.']],
  },
  '/markdown-to-word': {
    zh: [['可编辑DOCX', '输出可以继续在Microsoft Word中编辑的DOCX文件。'], ['保留结构', '标题、段落、列表、表格、代码、引用和链接会转换为对应的Word结构。'], ['适合交付', '适合把AIAgent生成的Markdown交给客户、同事或审阅者继续处理。']],
    en: [['Editable DOCX', 'Export a DOCX file that can continue to be edited in Microsoft Word.'], ['Keep structure', 'Headings, paragraphs, lists, tables, code, quotes, and links become corresponding Word structures.'], ['Ready for delivery', 'Hand AI-generated Markdown to clients, teammates, or reviewers for continued work.']],
  },
  '/markdown-to-csv': {
    zh: [['识别Markdown表格', '读取带表头和分隔线的Markdown表格，自动补齐缺少的列。'], ['CSV兼容', '输出带UTF-8标记的CSV，中文在常见表格工具中可以正常打开。'], ['本地处理', '表格只在当前浏览器中解析，不上传原始Markdown。']],
    en: [['Read Markdown tables', 'Read Markdown tables with headers and separator rows and fill missing cells when needed.'], ['CSV compatibility', 'Export UTF-8 CSV that opens correctly in common spreadsheet tools.'], ['Local processing', 'The table is parsed in this browser without uploading the source Markdown.']],
  },
  '/markdown-viewer': {
    zh: [['打开本地文件', '支持.md、.markdown和ZIP文件，选择配套图片后可以在预览中显示相对路径图片。'], ['实时预览', '输入时即时渲染标题、列表、表格、引用、代码块和链接。'], ['多种导出', '可以下载原始Markdown、独立HTML文件，也可以从当前预览生成PDF。']],
    en: [['Open local files', 'Open .md, .markdown, or ZIP files and match selected local images to relative references.'], ['Live preview', 'Render headings, lists, tables, quotes, code blocks, and links as you type.'], ['Multiple exports', 'Download Markdown, a standalone HTML file, or a PDF from the current preview.']],
  },
  '/markdown-to-wechat': {
    zh: [['微信公众号富文本', '复制时同时提供HTML和纯文本内容，适合粘贴到微信公众号编辑器。'], ['主题预览', '支持Elegant、Minimal、Tech Blue和Warm Orange四种排版主题。'], ['本地图片', 'Markdown文件和本地图片可以一起导入，图片会在浏览器中转为可预览的本地数据。']],
    en: [['WeChat rich text', 'Copy both HTML and plain text so the result can be pasted into the WeChat editor.'], ['Theme preview', 'Choose Elegant, Minimal, Tech Blue, or Warm Orange before copying.'], ['Local images', 'Import Markdown with local images together and preview them in this browser.']],
  },
  '/markdown-to-xiaohongshu': {
    zh: [['卡片分页', '使用##标题或---分隔线控制卡片顺序，没有分页标记时按段落拆分。'], ['比例和主题', '支持3:4、3:5、4:5和1:1比例，以及Grid Paper、Warm、Minimal、Sunset和Forest主题。'], ['PNG打包', '每张卡片在浏览器中渲染为PNG，再打包为ZIP下载。']],
    en: [['Card breaks', 'Use ## headings or --- separators to control the card sequence, or let longer paragraphs split automatically.'], ['Ratios and themes', 'Use 3:4, 3:5, 4:5, or 1:1 with Grid Paper, Warm, Minimal, Sunset, or Forest.'], ['PNG package', 'Render each card in the browser and download the PNG cards inside a ZIP.']],
  },
  '/pdf-to-markdown': {
    zh: [['本地处理', 'PDF文件使用本地工具处理，不上传到Herdown，适合电子版文字PDF。'], ['输出内容', '正文、标题、列表和表格会尽量整理成结构清晰的Markdown。'], ['使用提示', '扫描PDF和图片型PDF需要配合本地OCR工具，复杂排版需要人工复核。']],
    en: [['Local processing', 'PDF files are processed locally without uploading them to Herdown, especially text-based PDFs.'], ['Output', 'The workflow attempts to preserve body text, headings, lists, and tables as structured Markdown.'], ['What to check', 'Scanned or image-only PDFs need a local OCR tool, and complex layouts need a manual review.']],
  },
  '/txt-to-markdown': {
    zh: [['浏览器本地处理', 'TXT文本只在当前浏览器中整理，不上传服务器。'], ['输出内容', '纯文本会转换成便于保存、编辑和交给AI使用的Markdown文件。'], ['适合场景', '适合会议记录、资料摘录、脚本输出和需要快速清理的文本。']],
    en: [['Browser-only processing', 'TXT text is prepared in the current browser and is not uploaded to a server.'], ['Output', 'Plain text is converted into Markdown that is easy to save, edit, and send to an AI tool.'], ['Good for', 'Use it for meeting notes, excerpts, command output, and other text that needs quick cleanup.']],
  },
  '/word-to-markdown': {
    zh: [['本地处理', 'Word与DOCX文件使用本地工具整理，文件不会上传到Herdown。'], ['输出内容', '文档标题、段落、列表和常见表格会尽量转换为结构化Markdown。'], ['使用提示', '复杂样式、批注、文本框和嵌入对象转换后应人工检查。']],
    en: [['Local processing', 'Word and DOCX files are prepared with a local tool and are not uploaded to Herdown.'], ['Output', 'Document headings, paragraphs, lists, and common tables are converted into structured Markdown when possible.'], ['What to check', 'Review complex styles, comments, text boxes, and embedded objects after conversion.']],
  },
  '/browser-extension': {
    zh: [['当前页面整理', '浏览器插件可以读取当前已打开的网页，在本地提取正文并导出Markdown。'], ['适合场景', '适合登录后才能阅读、动态加载或需要保留当前页面上下文的网页。'], ['隐私边界', '插件在浏览器本地运行，导出前可以检查正文、来源和图片结果。']],
    en: [['Prepare the current page', 'The browser extension reads the open webpage locally, extracts the main content, and exports Markdown.'], ['Good for', 'Use it for login-required, dynamically loaded, or context-heavy pages that are already open in your browser.'], ['Privacy boundary', 'The extension runs locally so you can review the text, source, and image results before exporting.']],
  },
  '/help': {
    zh: [['网页转换', '公开网页可以通过首页转换，也可以粘贴已经打开的HTML源码处理。'], ['本地文件', 'TXT、图片、Word、PDF、PPT和Excel分别使用浏览器或本地工具处理。'], ['开发者接入', '需要自动化时，可以使用RESTAPI、MCP、CLI或浏览器插件。']],
    en: [['Web conversion', 'Use the homepage for public webpages, or paste the HTML source of a page that is already open.'], ['Local files', 'TXT, images, Word, PDF, PPT, and Excel use browser-based or local processing paths.'], ['Developer access', 'For automation, connect through the RESTAPI, MCP, CLI, or browser extension.']],
  },
  '/markdown-tools': {
    zh: [['本地查看与编辑', '打开Markdown文件并实时检查标题、表格、代码、链接和图片。'], ['格式转换', '按交付场景转换为HTML、PDF、Word或CSV文件。'], ['平台发布', '把Markdown整理为微信公众号富文本或小红书图片卡片。']],
    en: [['View and edit locally', 'Open Markdown files and check headings, tables, code, links, and images live.'], ['Format conversion', 'Choose HTML, PDF, Word, or CSV based on the next delivery step.'], ['Platform publishing', 'Prepare Markdown for WeChat rich text or Xiaohongshu image cards.']],
  },
  '/markdown-format-guide': {
    zh: [['继续编辑', '需要在网页中发布时选择Markdown转HTML，需要在Word中审阅时选择Markdown转Word。'], ['交付与归档', '需要固定版式时选择Markdown转PDF，需要表格数据时选择Markdown转CSV。'], ['内容发布', '公众号使用富文本复制，小红书使用图片卡片下载。']],
    en: [['Continue editing', 'Choose Markdown to HTML for web publishing or Markdown to Word for Word review.'], ['Delivery and archive', 'Choose Markdown to PDF for fixed layout or Markdown to CSV for table data.'], ['Content publishing', 'Use rich-text copy for WeChat and image-card download for Xiaohongshu.']],
  },
  '/merge-documents': {
    zh: [['PDF合并', '适合把多个PDF章节或资料按顺序合并为一个文件。'], ['DOCX与PPTX合并', '适合合并Word交付稿或PowerPoint演示文稿，结果仍可在原软件中打开。'], ['Excel合并', '默认每个文件一个工作表，也支持把多个表格追加到一张工作表。']],
    en: [['Merge PDF', 'Combine chapters or reference PDFs into one ordered file.'], ['Merge DOCX and PPTX', 'Combine Word deliverables or PowerPoint presentations into files that open in the original apps.'], ['Merge Excel', 'Create one worksheet per file by default, or append multiple tables into one sheet.']],
  },
  '/merge-pdf': {
    zh: [['本地合并', 'PDF文件只在当前浏览器中读取和生成，不上传到Herdown。'], ['顺序控制', '可以上移、下移或移除文件，输出页码顺序与文件列表一致。'], ['输出检查', '生成后会重新打开PDF并核对页数，再提供下载。']],
    en: [['Local merge', 'PDF files are read and generated in this browser without uploading them to Herdown.'], ['Order control', 'Move or remove files before merging so the output page order is explicit.'], ['Output check', 'The generated PDF is reopened and its page count is checked before download.']],
  },
  '/merge-docx': {
    zh: [['样式和结构', '合并库会尽量保留正文样式、表格、图片、项目符号和编号。'], ['分页', '不同DOCX文档之间会插入分页，方便继续编辑和审阅。'], ['格式边界', '宏、复杂批注和部分嵌入对象需要在Word中复核。']],
    en: [['Styles and structure', 'The merger attempts to preserve body styles, tables, images, bullets, and numbering.'], ['Page breaks', 'A page break is inserted between DOCX files for continued editing and review.'], ['Format boundaries', 'Review macros, complex comments, and some embedded objects in Word.']],
  },
  '/merge-pptx': {
    zh: [['幻灯片顺序', 'PPTX会按文件列表顺序追加幻灯片。'], ['媒体关系', '工具会复制图片、图表、主题和版式关系，避免只提取文字。'], ['输出检查', '生成后会重新打开压缩包并核对幻灯片数量和关键关系文件。']],
    en: [['Slide order', 'PPTX slides are appended in the order shown in the file list.'], ['Media relationships', 'Images, charts, themes, and layouts are copied instead of extracting text only.'], ['Output check', 'The generated package is reopened and its slide count and key relationships are checked.']],
  },
  '/merge-excel': {
    zh: [['每文件一个工作表', '默认每个源文件生成一个工作表，多工作表文件会按顺序展开。'], ['追加模式', '追加模式把所有源数据放入一张合并数据表，并记录来源文件和工作表。'], ['格式边界', '宏、图表、透视表和复杂格式不会原样合并。']],
    en: [['One worksheet per file', 'The default creates one output worksheet per source file and flattens multiple source sheets in order.'], ['Append mode', 'Append mode puts all source rows in one merged sheet and records the source file and worksheet.'], ['Format boundaries', 'Macros, charts, pivot tables, and complex formatting are not merged byte-for-byte.']],
  },
};

const interactiveSeoPaths = new Set([
  '/markdown-to-html', '/markdown-to-pdf', '/markdown-to-word', '/markdown-to-csv',
  '/markdown-viewer', '/markdown-to-wechat', '/markdown-to-xiaohongshu',
  '/merge-documents', '/merge-pdf', '/merge-docx', '/merge-pptx', '/merge-excel',
  '/sitemap-extractor', '/sitemap-checker', '/sitemap-validator', '/sitemap-generator',
  '/website-url-extractor', '/website-to-markdown',
]);

const isInteractiveSeoPath = (path: string): boolean => path.endsWith('-to-markdown') || interactiveSeoPaths.has(path);

type SeoStructuredCopy = {
  steps: Array<{ name: string; text: string }>;
  faqs: SeoFallbackSection[];
};

const seoStructuredCopy = (path: string, language: SeoLanguage, page: SeoPage): SeoStructuredCopy => {
  const copy: Record<SeoLanguage, { step1: string; step2: string; step3: string; faq1: string; faq2: string; faq3: string; privacy: string; review: string; output: string }> = {
    zh: { step1: '准备输入', step2: '检查结果', step3: '复制或下载', faq1: '支持什么输入？', faq2: '文件会上传吗？', faq3: '结果需要复核吗？', privacy: '本地文件工具在当前浏览器中处理文件；网页和公开地址工具只请求你提交的公开地址。', review: '转换结果会根据输入结构生成，复杂排版、受保护内容或格式边界可能需要人工检查。', output: '结果可以在页面中复制或下载，具体格式以本页工具提供的操作为准。' },
    en: { step1: 'Prepare the input', step2: 'Review the result', step3: 'Copy or download', faq1: 'What input does it support?', faq2: 'Are files uploaded?', faq3: 'Should I review the result?', privacy: 'Local file tools process files in this browser. Web and public URL tools request only the public address you submit.', review: 'The result follows the input structure. Complex layouts, protected content, or format boundaries may need a manual check.', output: 'Copy or download the result from the page. The available output format depends on this tool.' },
    ja: { step1: '入力を準備', step2: '結果を確認', step3: 'コピーまたは保存', faq1: 'どの入力に対応しますか？', faq2: 'ファイルはアップロードされますか？', faq3: '結果を確認する必要がありますか？', privacy: 'ローカルファイルツールはこのブラウザ内で処理します。Webツールは入力した公開アドレスだけをリクエストします。', review: '結果は入力構造に従って生成されます。複雑なレイアウトや保護された内容は確認が必要な場合があります。', output: 'ページから結果をコピーまたは保存できます。出力形式はこのツールの案内に従います。' },
    es: { step1: 'Prepara la entrada', step2: 'Revisa el resultado', step3: 'Copia o descarga', faq1: '¿Qué entrada admite?', faq2: '¿Se suben los archivos?', faq3: '¿Debo revisar el resultado?', privacy: 'Las herramientas de archivos locales procesan el contenido en este navegador. Las herramientas web solo solicitan la dirección pública que envías.', review: 'El resultado sigue la estructura de entrada. Los diseños complejos, el contenido protegido o los límites de formato pueden requerir una revisión manual.', output: 'Copia o descarga el resultado desde la página. El formato disponible depende de esta herramienta.' },
    de: { step1: 'Eingabe vorbereiten', step2: 'Ergebnis prüfen', step3: 'Kopieren oder laden', faq1: 'Welche Eingabe wird unterstützt?', faq2: 'Werden Dateien hochgeladen?', faq3: 'Muss ich das Ergebnis prüfen?', privacy: 'Lokale Dateitools verarbeiten Dateien in diesem Browser. Webtools rufen nur die von dir eingegebene öffentliche Adresse ab.', review: 'Das Ergebnis folgt der Eingabestruktur. Komplexe Layouts, geschützte Inhalte oder Formatgrenzen müssen eventuell manuell geprüft werden.', output: 'Kopiere oder lade das Ergebnis auf dieser Seite. Das verfügbare Format hängt von diesem Werkzeug ab.' },
  };
  const labels = copy[language];
  return {
    steps: [
      { name: labels.step1, text: page.heading + ': ' + page.intro },
      { name: labels.step2, text: labels.review },
      { name: labels.step3, text: labels.output },
    ],
    faqs: [
      [page.heading + '：' + labels.faq1, page.intro],
      [labels.faq2, labels.privacy],
      [labels.faq3, labels.review],
    ],
  };
};

const blogArticlePath = '/blog/how-to-convert-html-to-markdown-for-ai';
const blogArticlePaths = new Set([
  blogArticlePath,
  '/blog/best-markdown-converter-for-ai-agents',
  '/blog/markdown-for-agents-tools',
]);

type BlogSeoSection = { heading: string; paragraphs: string[]; bullets?: string[] };
type BlogSeoCopy = {
  title: string;
  intro: string;
  updated: string;
  sections: BlogSeoSection[];
  faqTitle: string;
  faqs: Array<[string, string]>;
};

const localizedBlogSeoCopies: Record<'ja' | 'es' | 'de', Record<string, BlogSeoCopy>> = {
  ja: {
    [blogArticlePath]: {
      title: 'HTMLをAI向けMarkdownに変換する方法',
      intro: 'WebページのHTMLから本文を抽出し、意味構造を保ったMarkdownに整えて、AIエージェントが安定して読めるようにします。',
      updated: '更新日：2026年8月10日',
      sections: [
        { heading: 'なぜ生のHTMLはAIエージェントに向かないのか', paragraphs: ['HTMLはブラウザで表示するための形式であり、検索やAIの読み取りに最適化された形式ではありません。ナビゲーション、広告、コメント、スクリプト、スタイルが本文の周囲に含まれています。', '良い変換はタグを削除するだけではありません。本文の範囲を見つけ、見出し、段落、リスト、表、リンク、コード、画像の説明を残す必要があります。'] },
        { heading: 'HTMLをAI向けMarkdownに変換する方法', paragraphs: ['信頼できる変換では、次の4点を確認します。'], bullets: ['ページ全体ではなく本文や記事の領域を特定する。', 'ナビゲーション、広告、Cookie通知、コメント、スクリプト、スタイル、重複したおすすめを削除する。', '見出し、段落、リスト、表、リンク、コード、画像とキャプションを保持する。', '欠落した段落、結合した表、壊れたリンク、途中で切れた末尾を確認する。'] },
        { heading: 'AIエージェント向けMarkdown変換ツールの条件', paragraphs: ['変換ツールを選ぶときは、ボタンの数ではなく出力の品質とプライバシーの境界を比較します。'], bullets: ['本文の境界が安定している。', 'H1、H2、リスト、表、コードの構造が読みやすい。', 'URL、タイトル、著者、公開日などの出典情報を残せる。', '失敗したときに原因を明確に表示する。', 'ローカル処理とリモート処理の範囲が説明されている。'] },
        { heading: 'Herdownを使った実践フロー', paragraphs: ['公開URLをURLからMarkdownツールに入力するか、ファイル形式に合うローカルツールを選びます。プレビューとMarkdownソースを確認し、必要に応じてHTML、PDF、Word、WeChat、Xiaohongshu向けに出力します。'] },
      ],
      faqTitle: 'よくある質問',
      faqs: [['HTMLからMarkdownに変換すると見た目も保存されますか？', '完全には保存されません。Markdownは意味構造を優先し、固定レイアウトや複雑なCSSはHTMLや元ページで確認します。'], ['なぜ変換結果を確認する必要がありますか？', '複雑な表、脚注、コード、遅延読み込み画像、ログインが必要な内容は公開HTMLから完全に取得できない場合があります。'], ['AIエージェントにMarkdownが向いている理由は何ですか？', '見出し、リスト、表、コードの境界が明確で、検索や次の処理に渡しやすいからです。']],
    },
    '/blog/best-markdown-converter-for-ai-agents': {
      title: 'AIエージェント向けMarkdown変換ツールの選び方',
      intro: '本文の範囲、意味構造、出典、失敗表示、プライバシーからMarkdown変換ツールを比較します。',
      updated: '更新日：2026年8月11日',
      sections: [
        { heading: '対応形式の数だけで比較しない', paragraphs: ['AIエージェントが必要とするのは、形式の多さよりも安定して検索できるノイズの少ない資料です。本文の範囲を正しく認識できなければ、多くの入力形式に対応していても結果は使いにくくなります。'] },
        { heading: 'Markdown変換ツールを評価する5つの指標', paragraphs: ['AIエージェント向けの変換ツールは次の5点で確認します。'], bullets: ['ナビゲーション、広告、コメント、おすすめを本文から分離できるか。', '見出し、リスト、表、コード、引用、リンクを保持できるか。', 'URL、タイトル、著者、公開日を追跡できるか。', 'ログイン制限やスキャンPDFに対して原因を表示できるか。', 'ローカル処理とリモート処理のデータ範囲が明確か。'] },
        { heading: '入力の種類ごとにツールを分ける', paragraphs: ['公開ページはURLからMarkdown、テキストPDFやWord、PPT、Excelはローカルツール、スキャン資料はローカルOCR、既存のMarkdownはViewerや出力ツールを使うと整理しやすくなります。'] },
        { heading: '変換後に使える確認リスト', paragraphs: ['H1が1つだけか、見出しの順序が自然か、表の列がずれていないか、コードが欠けていないか、リンクと末尾が完全か、出典URLが残っているかを確認します。'] },
      ],
      faqTitle: 'よくある質問',
      faqs: [['対応形式が多いツールほど優れていますか？', '必ずしもそうではありません。本文の境界、構造、出典、失敗時の説明のほうが重要です。'], ['AIエージェントに必要なMarkdownとは何ですか？', '見出しと段落が明確で、表とコードが読みやすく、出典を追跡できるMarkdownです。'], ['オンライン変換を避けるべき場合はありますか？', '機密ファイルやスキャン資料では、ローカル処理またはローカルOCRを優先してください。']],
    },
    '/blog/markdown-for-agents-tools': {
      title: 'AIエージェント向け資料整理ツールのワークフロー',
      intro: 'Web抽出、ローカルファイル、Markdown確認、形式出力、公開をAIエージェント向けの流れにまとめます。',
      updated: '更新日：2026年8月11日',
      sections: [
        { heading: 'AIエージェントに万能ボタンは必要ない', paragraphs: ['エージェントの作業では、Webページ、文書、表計算、コード、公開用コンテンツを扱います。すべてを1つのツールに任せるより、各ツールに明確な役割を持たせるほうが安定します。'] },
        { heading: 'AIエージェント向け資料整理ツールの構成', paragraphs: ['実用的な流れには次の段階があります。'], bullets: ['公開URL、貼り付けたHTML、ローカルファイルを入力する。', 'ナビゲーション、広告、重複モジュールを除去する。', 'Markdown Viewerで見出し、表、コード、リンク、画像を確認する。', 'HTML、PDF、Word、CSVまたはMarkdownとして出力する。', 'WeChatやXiaohongshu向けに公開用レイアウトを整える。'] },
        { heading: 'Web解析とローカルファイル処理の分担', paragraphs: ['公開ページはリモート解析、機密ファイルや文書はブラウザ内のローカル処理、スキャンPDFや画像はローカルOCRに分けます。対応外の入力を成功したように表示しないことも重要です。'] },
        { heading: 'エージェントに渡す前に残す情報', paragraphs: ['元URL、タイトル、著者、公開日、処理上の制限を残します。H1、H2、H3、表の見出し、コードの言語、画像の代替テキストも維持します。'] },
      ],
      faqTitle: 'よくある質問',
      faqs: [['HTMLをそのままエージェントに渡さない理由は何ですか？', 'HTMLにはナビゲーション、スタイル、スクリプト、おすすめが含まれやすく、Markdownのほうが文脈の境界を管理しやすいからです。'], ['Markdown Viewerは何に役立ちますか？', '公開や納品の前に、見出し、表、コード、リンク、画像、末尾を確認できます。'], ['すべてのファイルをオンライン処理できますか？', 'いいえ。機密ファイル、スキャンPDF、画像資料はローカル処理やローカルOCRを選びます。']],
    },
  },
  es: {
    [blogArticlePath]: {
      title: 'Cómo convertir HTML a Markdown para IA',
      intro: 'Extrae el contenido principal del HTML de una página y conserva su estructura para que los agentes de IA puedan leerlo y recuperarlo.',
      updated: 'Actualizado el 10 de agosto de 2026',
      sections: [
        { heading: 'Por qué el HTML sin limpiar no es una buena entrada para la IA', paragraphs: ['El HTML está diseñado para mostrar páginas en un navegador, no para recuperar contenido limpio. Una página puede mezclar navegación, anuncios, comentarios, scripts, estilos y recomendaciones con el texto útil.', 'Una buena conversión identifica el límite del contenido principal y conserva títulos, párrafos, listas, tablas, enlaces, código, imágenes y pies de imagen.'] },
        { heading: 'Cómo convertir HTML a Markdown para IA', paragraphs: ['Un flujo fiable incluye cuatro comprobaciones:'], bullets: ['Localizar el artículo o documento principal en lugar de convertir todo el código fuente.', 'Eliminar navegación, anuncios, avisos de cookies, comentarios, scripts, estilos y recomendaciones repetidas.', 'Conservar títulos, párrafos, listas, tablas, enlaces, bloques de código, imágenes y pies de imagen.', 'Revisar párrafos ausentes, tablas unidas, enlaces rotos y finales incompletos.'] },
        { heading: 'Qué debe tener un conversor Markdown para agentes de IA', paragraphs: ['La calidad del resultado y los límites de privacidad importan más que la cantidad de botones.'], bullets: ['Límites de contenido estables.', 'Estructura clara de H1, H2, listas, tablas y código.', 'URL, título, autor y fecha para rastrear la fuente.', 'Errores claros cuando una página no se puede procesar.', 'Procesamiento local o límites remotos explicados.'] },
        { heading: 'Flujo práctico con Herdown', paragraphs: ['Pega una URL pública en URL a Markdown o elige la herramienta local para tu archivo. Revisa la vista previa y el Markdown, y después exporta a HTML, PDF, Word o a un formato de publicación.'] },
      ],
      faqTitle: 'Preguntas frecuentes',
      faqs: [['¿HTML a Markdown conserva el diseño visual?', 'No completamente. Markdown conserva la estructura semántica; los diseños fijos y el CSS complejo pertenecen al HTML o a la página original.'], ['¿Por qué debo revisar el resultado?', 'Las tablas complejas, notas, código, imágenes de carga diferida y contenido con acceso restringido pueden no estar completos en el HTML público.'], ['¿Por qué Markdown sirve para agentes de IA?', 'Sus títulos, listas, tablas y bloques de código tienen límites claros y son más fáciles de recuperar y procesar.']],
    },
    '/blog/best-markdown-converter-for-ai-agents': {
      title: 'Cómo elegir el mejor conversor Markdown para agentes de IA',
      intro: 'Compara conversores Markdown por sus límites de contenido, estructura, fuentes, errores y privacidad.',
      updated: 'Actualizado el 11 de agosto de 2026',
      sections: [
        { heading: 'No compares solo la cantidad de formatos', paragraphs: ['Los agentes de IA necesitan material estable, recuperable y con poco ruido. Muchos formatos no sirven si el conversor no identifica bien el contenido principal.'] },
        { heading: 'Cinco criterios para elegir un conversor Markdown', paragraphs: ['Comprueba estos cinco puntos:'], bullets: ['Separación entre contenido principal, navegación, anuncios, comentarios y recomendaciones.', 'Conservación de títulos, listas, tablas, código, citas y enlaces.', 'Seguimiento de URL, título, autor y fecha de publicación.', 'Mensajes claros para muros de inicio de sesión, PDF escaneado y recursos protegidos.', 'Límites claros entre procesamiento local y remoto.'] },
        { heading: 'Usa una herramienta distinta para cada entrada', paragraphs: ['Usa URL a Markdown para páginas públicas, herramientas locales para PDF de texto, Word, presentaciones y hojas de cálculo, OCR local para documentos escaneados y Markdown Viewer cuando el origen ya sea Markdown.'] },
        { heading: 'Lista de revisión reutilizable', paragraphs: ['Comprueba que haya un solo H1, niveles de título lógicos, columnas alineadas, bloques de código completos, enlaces válidos, final completo y URL de origen.'] },
      ],
      faqTitle: 'Preguntas frecuentes',
      faqs: [['¿Un conversor con más formatos siempre es mejor?', 'No. Los límites de contenido, la estructura, las fuentes y los errores claros suelen importar más.'], ['¿Qué Markdown necesitan los agentes de IA?', 'Títulos claros, párrafos completos, tablas y código legibles, además de fuentes rastreables.'], ['¿Cuándo debo evitar una conversión online?', 'Para archivos sensibles, escaneos o contenido privado, usa procesamiento local u OCR local.']],
    },
    '/blog/markdown-for-agents-tools': {
      title: 'Flujo de trabajo de herramientas Markdown para agentes de IA',
      intro: 'Conecta extracción web, archivos locales, revisión Markdown, exportación y publicación en un flujo práctico para agentes de IA.',
      updated: 'Actualizado el 11 de agosto de 2026',
      sections: [
        { heading: 'Los agentes no necesitan un botón universal', paragraphs: ['Los flujos de agentes trabajan con páginas, documentos, hojas de cálculo, código y contenido para publicar. Cada herramienta debe tener una función clara y Markdown puede servir como formato intermedio.'] },
        { heading: 'Qué debe incluir un flujo de herramientas Markdown', paragraphs: ['Un flujo completo incluye:'], bullets: ['Captura desde URL públicas, HTML pegado o archivos locales.', 'Limpieza que elimina navegación, anuncios y módulos repetidos.', 'Revisión de títulos, tablas, código, enlaces e imágenes.', 'Entrega en HTML, PDF, Word, CSV o Markdown.', 'Diseños de publicación para WeChat y Xiaohongshu.'] },
        { heading: 'Cómo combinar páginas remotas y archivos locales', paragraphs: ['Usa análisis remoto para páginas públicas y herramientas locales para archivos privados, PDF de texto, Word, presentaciones, hojas de cálculo y CSV. Los escaneos y las imágenes necesitan OCR local.'] },
        { heading: 'Qué conservar antes de entregar el material a un agente', paragraphs: ['Conserva URL, título, autor, fecha y límites de procesamiento. Mantén H1, H2, H3, cabeceras de tablas, etiquetas de lenguaje del código y textos alternativos de imágenes.'] },
      ],
      faqTitle: 'Preguntas frecuentes',
      faqs: [['¿Por qué no enviar HTML directamente al agente?', 'HTML suele contener navegación, estilos, scripts y recomendaciones. Markdown ofrece límites de contexto más claros.'], ['¿Para qué sirve Markdown Viewer?', 'Permite revisar títulos, tablas, código, enlaces, imágenes y el final antes de entregar el contenido.'], ['¿Se puede procesar cualquier archivo online?', 'No. Los archivos sensibles, PDF escaneados e imágenes deben procesarse localmente cuando sea necesario.']],
    },
  },
  de: {
    [blogArticlePath]: {
      title: 'HTML für AI in Markdown umwandeln',
      intro: 'Nützliche Inhalte aus dem HTML einer Webseite extrahieren und ihre Struktur für AI-Agenten erhalten.',
      updated: 'Aktualisiert am 10. August 2026',
      sections: [
        { heading: 'Warum unbearbeitetes HTML keine gute AI-Eingabe ist', paragraphs: ['HTML ist für die Darstellung im Browser gedacht, nicht für saubere Suche. Navigation, Werbung, Kommentare, Skripte, Styles und Empfehlungen stehen oft neben dem eigentlichen Inhalt.', 'Eine gute Umwandlung erkennt den Hauptinhalt und erhält Überschriften, Absätze, Listen, Tabellen, Links, Code, Bilder und Bildunterschriften.'] },
        { heading: 'HTML für AI in Markdown umwandeln', paragraphs: ['Ein zuverlässiger Ablauf umfasst vier Prüfungen:'], bullets: ['Den Hauptartikel statt des gesamten Quellcodes erkennen.', 'Navigation, Werbung, Cookie-Hinweise, Kommentare, Skripte, Styles und doppelte Empfehlungen entfernen.', 'Überschriften, Absätze, Listen, Tabellen, Links, Codeblöcke, Bilder und Bildunterschriften erhalten.', 'Fehlende Absätze, verbundene Tabellen, defekte Links und unvollständige Enden prüfen.'] },
        { heading: 'Was ein Markdown-Konverter für AI-Agenten können muss', paragraphs: ['Ausgabequalität und Datenschutzgrenzen sind wichtiger als die Zahl der Schaltflächen.'], bullets: ['Stabile Grenzen für den Hauptinhalt.', 'Klare H1-, H2-, Listen-, Tabellen- und Codestruktur.', 'URL, Titel, Autor und Datum zur Quellenprüfung.', 'Klare Fehlermeldungen bei nicht zugänglichen Seiten.', 'Verständliche Grenzen für lokale und entfernte Verarbeitung.'] },
        { heading: 'Praktischer Ablauf mit Herdown', paragraphs: ['Eine öffentliche URL in URL zu Markdown einfügen oder das lokale Werkzeug für den Dateityp wählen. Vorschau und Markdown prüfen und danach HTML, PDF, Word oder ein Veröffentlichungsformat erzeugen.'] },
      ],
      faqTitle: 'Häufige Fragen',
      faqs: [['Bleibt das visuelle Design bei HTML zu Markdown erhalten?', 'Nicht vollständig. Markdown erhält die semantische Struktur, feste Layouts und komplexes CSS bleiben in HTML oder der Originalseite.'], ['Warum muss ich das Ergebnis prüfen?', 'Komplexe Tabellen, Fußnoten, Code, verzögert geladene Bilder und geschützte Inhalte können im öffentlichen HTML fehlen.'], ['Warum ist Markdown für AI-Agenten geeignet?', 'Überschriften, Listen, Tabellen und Codeblöcke haben klare Grenzen und lassen sich leichter suchen und weiterverarbeiten.']],
    },
    '/blog/best-markdown-converter-for-ai-agents': {
      title: 'Den besten Markdown-Konverter für AI-Agenten auswählen',
      intro: 'Markdown-Konverter nach Inhaltsgrenzen, Struktur, Quellen, Fehlermeldungen und Datenschutz vergleichen.',
      updated: 'Aktualisiert am 11. August 2026',
      sections: [
        { heading: 'Nicht nur die Zahl der Formate vergleichen', paragraphs: ['AI-Agenten brauchen stabile, durchsuchbare und rauschfreie Inhalte. Viele Formate helfen nicht, wenn der Hauptinhalt falsch erkannt wird.'] },
        { heading: 'Fünf Kriterien für einen Markdown-Konverter', paragraphs: ['Prüfe diese fünf Punkte:'], bullets: ['Hauptinhalt von Navigation, Werbung, Kommentaren und Empfehlungen trennen.', 'Überschriften, Listen, Tabellen, Code, Zitate und Links bewahren.', 'URL, Titel, Autor und Veröffentlichungsdatum nachvollziehbar halten.', 'Klare Hinweise bei Login-Schranken, gescannten PDFs und geschützten Ressourcen.', 'Grenzen zwischen lokaler und entfernter Verarbeitung erklären.'] },
        { heading: 'Für jede Eingabe das passende Werkzeug verwenden', paragraphs: ['Öffentliche Webseiten mit URL zu Markdown, Text-PDF, Word, Präsentationen und Tabellen lokal, Scans mit lokalem OCR und vorhandenes Markdown mit Markdown Viewer oder Ausgabe-Werkzeugen bearbeiten.'] },
        { heading: 'Eine wiederverwendbare Prüfliste', paragraphs: ['Ein einziges H1, logische Überschriften, passende Tabellenspalten, vollständige Codeblöcke, funktionierende Links, ein vollständiges Ende und eine erhaltene Quell-URL prüfen.'] },
      ],
      faqTitle: 'Häufige Fragen',
      faqs: [['Ist ein Konverter mit mehr Formaten immer besser?', 'Nein. Inhaltsgrenzen, Struktur, Quellen und klare Fehlermeldungen sind oft wichtiger.'], ['Welches Markdown brauchen AI-Agenten?', 'Klare Überschriften, vollständige Absätze, lesbare Tabellen und Codeblöcke sowie nachvollziehbare Quellen.'], ['Wann sollte ich keine Online-Konvertierung nutzen?', 'Bei sensiblen Dateien, Scans oder privaten Inhalten lokale Verarbeitung oder lokales OCR verwenden.']],
    },
    '/blog/markdown-for-agents-tools': {
      title: 'Markdown-Werkzeuge für AI-Agenten: Workflow',
      intro: 'Webextraktion, lokale Dateien, Markdown-Prüfung, Exporte und Veröffentlichung zu einem AI-Agenten-Workflow verbinden.',
      updated: 'Aktualisiert am 11. August 2026',
      sections: [
        { heading: 'AI-Agenten brauchen keine übergroße Schaltfläche', paragraphs: ['Agenten-Workflows verarbeiten Webseiten, Dokumente, Tabellen, Code und Veröffentlichungen. Jedes Werkzeug sollte einen klaren Schritt übernehmen; Markdown eignet sich als prüfbares Zwischenformat.'] },
        { heading: 'Was ein Markdown-Werkzeug-Workflow enthalten sollte', paragraphs: ['Ein vollständiger Ablauf enthält:'], bullets: ['Eingabe aus öffentlichen URLs, eingefügtem HTML oder lokalen Dateien.', 'Bereinigung von Navigation, Werbung und doppelten Modulen.', 'Prüfung von Überschriften, Tabellen, Code, Links und Bildern.', 'Ausgabe als HTML, PDF, Word, CSV oder Markdown.', 'Spezielle Veröffentlichungs-Layouts für WeChat und Xiaohongshu.'] },
        { heading: 'Remote-Webseiten und lokale Dateien verbinden', paragraphs: ['Öffentliche Webseiten können entfernt analysiert werden. Private Dateien, Text-PDFs, Word, Präsentationen, Tabellen und CSV sollten lokal verarbeitet werden. Scans und Bilder benötigen lokales OCR.'] },
        { heading: 'Was vor der Übergabe an einen Agenten erhalten bleiben muss', paragraphs: ['Quell-URL, Titel, Autor, Datum und Verarbeitungslimits bewahren. H1, H2, H3, Tabellenüberschriften, Code-Sprachmarkierungen und Alternativtexte für Bilder erhalten.'] },
      ],
      faqTitle: 'Häufige Fragen',
      faqs: [['Warum HTML nicht direkt an einen Agenten senden?', 'HTML enthält oft Navigation, Styles, Skripte und Empfehlungen. Markdown bietet klarere Grenzen für den Kontext.'], ['Wozu dient Markdown Viewer?', 'Vor der Übergabe lassen sich Überschriften, Tabellen, Code, Links, Bilder und das Ende prüfen.'], ['Kann jede Datei online verarbeitet werden?', 'Nein. Sensible Dateien, gescannte PDFs und Bilder sollten bei Bedarf lokal verarbeitet werden.']],
    },
  },
};

const blogSeoFallback = (path: string, language: SeoLanguage, page: SeoPage): string => {
  const chinese = language === 'zh';
  const localized = (href: string) => language === 'zh' ? href : `${href}?lang=${language}`;
  const link = (href: string, label: string) => `<a href="${localized(href)}">${escapeHtml(label)}</a>`;
  const nav = chinese
    ? [link('/', '首页'), link('/blog', '博客'), link('/url-to-markdown', '网页转Markdown'), link('/markdown-tools', 'Markdown工具')].join(' · ')
    : language === 'ja'
      ? [link('/', 'ホーム'), link('/blog', 'ブログ'), link('/url-to-markdown', 'URLからMarkdown'), link('/markdown-tools', 'Markdownツール')].join(' · ')
      : language === 'es'
        ? [link('/', 'Inicio'), link('/blog', 'Blog'), link('/url-to-markdown', 'URL a Markdown'), link('/markdown-tools', 'Herramientas Markdown')].join(' · ')
        : language === 'de'
          ? [link('/', 'Startseite'), link('/blog', 'Blog'), link('/url-to-markdown', 'URL zu Markdown'), link('/markdown-tools', 'Markdown-Werkzeuge')].join(' · ')
          : [link('/', 'Home'), link('/blog', 'Blog'), link('/url-to-markdown', 'URL to Markdown'), link('/markdown-tools', 'Markdown tools')].join(' · ');
  if (path === '/blog') {
    const title = chinese ? 'Herdown博客' : language === 'ja' ? 'Herdownブログ' : language === 'es' ? 'Blog de Herdown' : language === 'de' ? 'Herdown-Blog' : 'Herdown Blog';
    const intro = chinese ? '围绕Markdown、AI Agent和资料整理工作流，分享可以直接使用的教程。' : language === 'ja' ? 'Markdown、AIエージェント、資料整理ワークフローの実用ガイド。' : language === 'es' ? 'Guías prácticas para Markdown, agentes de IA y materiales limpios.' : language === 'de' ? 'Praktische Anleitungen für Markdown, AI-Agenten und saubere Material-Workflows.' : 'Practical guides for Markdown, AI agents, and clean material workflows.';
    const localizedCards = language === 'ja' ? localizedBlogSeoCopies.ja : language === 'es' ? localizedBlogSeoCopies.es : language === 'de' ? localizedBlogSeoCopies.de : undefined;
    const cards = chinese ? [
      [blogArticlePath, '如何把HTML转换为适合AI的Markdown', '从网页HTML中提取正文、保留语义结构，并整理成AI Agent可以稳定理解、检索和引用的Markdown。'],
      ['/blog/best-markdown-converter-for-ai-agents', '如何选择适合AI Agent的Markdown转换器', '从正文边界、结构质量、来源追踪、失败反馈和隐私边界评估AI Agent用Markdown转换器。'],
      ['/blog/markdown-for-agents-tools', 'AI Agent资料整理工具工作流指南', '把网页、文件、Markdown查看、格式输出和平台发布工具连接起来，建立适合AI Agent的资料处理流程。'],
    ] : localizedCards ? [
      [blogArticlePath, localizedCards[blogArticlePath].title, localizedCards[blogArticlePath].intro],
      ['/blog/best-markdown-converter-for-ai-agents', localizedCards['/blog/best-markdown-converter-for-ai-agents'].title, localizedCards['/blog/best-markdown-converter-for-ai-agents'].intro],
      ['/blog/markdown-for-agents-tools', localizedCards['/blog/markdown-for-agents-tools'].title, localizedCards['/blog/markdown-for-agents-tools'].intro],
    ] : [
      [blogArticlePath, 'How to Convert HTML to Markdown for AI', 'Extract useful content from webpage HTML, preserve its meaning, and prepare Markdown that AI agents can read, retrieve, and cite reliably.'],
      ['/blog/best-markdown-converter-for-ai-agents', 'Best Markdown Converter for AI Agents: What to Compare', 'Evaluate a Markdown converter for AI agents by content boundaries, semantic structure, privacy, and downstream handoff.'],
      ['/blog/markdown-for-agents-tools', 'Markdown for Agents Tools: A Practical Workflow', 'Connect webpage extraction, local files, Markdown review, format exports, and publishing tools for AI agent workflows.'],
    ];
    const readLabel = chinese ? '阅读文章' : language === 'ja' ? '記事を読む' : language === 'es' ? 'Leer el artículo' : language === 'de' ? 'Artikel lesen' : 'Read the article';
    const cardsHtml = cards.map(([href, articleTitle, articleIntro]) => `<article><h2>${escapeHtml(articleTitle)}</h2><p>${escapeHtml(articleIntro)}</p><p>${link(href, readLabel)}</p></article>`).join('');
    return `<main class="seo-fallback"><p class="seo-brand"><a href="${localized('/')}">Herdown</a></p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p><nav>${nav}</nav>${cardsHtml}</main>`;
  }
  const localizedCopy = language === 'ja' || language === 'es' || language === 'de' ? localizedBlogSeoCopies[language][path] : undefined;
  if (localizedCopy) {
    const sectionsHtml = localizedCopy.sections.map(section => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(item => `<p>${escapeHtml(item)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</section>`).join('');
    const faqHtml = localizedCopy.faqs.map(item => `<h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p>`).join('');
    return `<main class="seo-fallback"><p class="seo-brand"><a href="${localized('/')}" >Herdown</a></p><nav>${nav}</nav><article><h1>${escapeHtml(localizedCopy.title)}</h1><p>${escapeHtml(localizedCopy.intro)}</p><p>${escapeHtml(localizedCopy.updated)}</p>${sectionsHtml}<section><h2>${escapeHtml(localizedCopy.faqTitle)}</h2>${faqHtml}</section></article></main>`;
  }
  if (path !== blogArticlePath) {
    const bestConverter = path === '/blog/best-markdown-converter-for-ai-agents';
    const sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }> = bestConverter
      ? chinese ? [
        { heading: '不要只比较支持多少种格式', paragraphs: ['很多Markdown转换器会用格式数量展示能力，但AI Agent真正需要的是稳定、可检索、少噪声的内容。支持几十种输入格式，如果正文边界不准确，最后仍然会得到难以使用的材料。', '一次转换应该包含输入识别、正文提取、结构保留、来源记录和结果交付。'] },
        { heading: '评估适合AI Agent的Markdown转换器的五项指标', paragraphs: ['可以按下面五项指标检查适合AI Agent的Markdown转换器：'], bullets: ['正文边界是否避开导航、广告、评论、推荐模块和Cookie提示。', '标题、列表、表格、代码块、引用和链接是否保持语义。', '是否保留原始URL、标题、作者和发布时间。', '遇到登录墙、扫描版PDF或受保护资源时是否明确失败原因。', '是否能在浏览器本地处理文件，并说明远程解析的数据边界。'] },
        { heading: '一个可复用的检查清单', paragraphs: ['每次转换后检查H1是否唯一、H2层级是否连续、表格列是否错位、代码块是否完整、链接是否有效、文章结尾是否被截断，以及来源URL是否保留。'] },
      ] : [
        { heading: 'Do not compare converters by format count alone', paragraphs: ['AI agents need stable, searchable, low-noise material. Dozens of input formats do not help if the main content boundary is wrong.', 'Treat each conversion as a delivery chain: recognize the input, extract useful content, preserve structure, record the source, and prepare the result for a downstream workflow.'] },
        { heading: 'Five ways to evaluate the best Markdown converter for AI agents', paragraphs: ['Use these five checks when comparing the best markdown converter for ai agents:'], bullets: ['Content boundaries that avoid navigation, ads, comments, recommendations, and cookie banners.', 'Semantic headings, lists, tables, code blocks, quotes, and links.', 'Source traceability with URL, title, author, and publication date.', 'Clear feedback for login walls, scanned PDFs, and protected resources.', 'A clear local-processing and privacy boundary.'] },
        { heading: 'A reusable review checklist', paragraphs: ['Check for one H1, logical heading levels, aligned table columns, complete code blocks, working links, a complete ending, and a retained source URL.'] },
      ]
      : chinese ? [
        { heading: 'AI Agent需要的不是一个万能按钮', paragraphs: ['Agent工作流通常同时处理网页、文档、表格、代码和发布内容。更可靠的方式是让每个工具承担清楚的一步，使用Markdown作为人和Agent都能检查的中间格式。'] },
        { heading: 'AI Agent资料整理工具应该包含哪些环节', paragraphs: ['一条完整的AI Agent资料整理工具工作流通常包括：'], bullets: ['从公开网页URL、粘贴HTML或本地文件开始。', '删除导航、广告和重复模块，保留正文语义。', '使用Markdown Viewer检查标题、表格、代码、链接和图片。', '导出HTML、PDF、Word、CSV或继续保存为Markdown。', '针对微信公众号和小红书重新排版。'] },
        { heading: '远程网页解析和本地文件处理如何分工', paragraphs: ['公开网页适合远程解析，私密文件、文字型PDF、Word、PPT、Excel和CSV更适合浏览器本地处理。扫描版PDF和图片资料需要本地OCR，不应该把不支持的输入伪装成成功结果。'] },
        { heading: '交给Agent之前要保留什么', paragraphs: ['保留来源URL、标题、作者、发布时间和处理限制。正文要保持H1、H2和H3层级，表格需要表头，代码块需要语言标记，图片需要替代文字。'] },
      ] : [
        { heading: 'AI agents do not need one oversized button', paragraphs: ['Agent workflows handle webpages, documents, spreadsheets, code, and publishing content. Each tool should own a clear step, with Markdown as an intermediate format that people and agents can review.'] },
        { heading: 'What Markdown for Agents Tools should include', paragraphs: ['A complete markdown for agents tools workflow includes:'], bullets: ['Input capture from public URLs, pasted HTML, or local files.', 'Content cleaning that removes navigation, ads, and repeated modules.', 'Markdown review for headings, tables, code, links, and images.', 'Delivery through HTML, PDF, Word, CSV, or a saved Markdown file.', 'Platform publishing layouts for WeChat and Xiaohongshu.'] },
        { heading: 'How remote webpages and local files fit together', paragraphs: ['Use remote parsing for public webpages and local browser tools for private files, text PDFs, Word, presentations, spreadsheets, and CSV. Scanned PDFs and image materials need local OCR and clear limits.'] },
        { heading: 'What to preserve before handing material to an agent', paragraphs: ['Keep the source URL, title, author, publication date, and processing limits. Preserve H1, H2, and H3 levels, table headers, code language labels, and meaningful image alternatives.'] },
      ];
    const sectionsHtml = sections.map(section => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(item => `<p>${escapeHtml(item)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</section>`).join('');
    const faq = bestConverter
      ? chinese ? [['格式越多的转换器就越好吗？', '不一定。正文边界、结构质量、来源追踪和失败反馈通常比格式数量更重要。'], ['AI Agent需要什么样的Markdown？', '需要标题层级清楚、段落完整、表格和代码块可读，并且带有可追溯的来源信息。']] : [['Is a converter with more formats always better?', 'No. Content boundaries, semantic quality, source traceability, and clear failures often matter more than format count.'], ['What Markdown do AI agents need?', 'They need clear headings, complete paragraphs, readable tables and code blocks, and traceable source information.']]
      : chinese ? [['为什么不直接把HTML交给Agent？', 'HTML通常包含大量导航、样式、脚本和推荐内容，Markdown更容易控制上下文长度和语义边界。'], ['所有文件都适合在线处理吗？', '不适合。敏感文件、扫描版PDF和图片资料应根据页面限制选择本地处理或本地OCR。']] : [['Why not send HTML directly to an agent?', 'HTML often contains navigation, styles, scripts, and recommendations. Markdown gives the context a clearer boundary.'], ['Can every file be processed online?', 'No. Sensitive files, scanned PDFs, and image materials should use local processing or local OCR when needed.']];
    return `<main class="seo-fallback"><p class="seo-brand"><a href="${localized('/')}">Herdown</a></p><nav>${nav}</nav><article><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.intro)}</p><p>${escapeHtml(chinese ? '更新日期：2026年8月11日' : 'Updated August 11, 2026')}</p>${sectionsHtml}<section><h2>${escapeHtml(chinese ? '常见问题' : 'Frequently asked questions')}</h2>${faq.map(item => `<h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p>`).join('')}</section></article></main>`;
  }
  const sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }> = chinese ? [
    { heading: '为什么HTML不适合直接交给AI Agent', paragraphs: ['HTML适合浏览器渲染，不一定适合AI阅读。网页通常同时包含导航、广告、推荐内容、评论、脚本和样式。把整份HTML直接放进上下文，会让真正有价值的正文被无效内容稀释。', '高质量的转换不是简单删除标签，而是识别正文边界，保留标题层级、段落、列表、表格、链接、代码和图片说明。'] },
    { heading: '如何把HTML转换为适合AI的Markdown', paragraphs: ['可靠的HTML转Markdown流程包括四个检查：'], bullets: ['定位正文区域，不要转换整份网页源码。', '删除导航、广告、Cookie提示、评论、脚本、样式和重复推荐。', '保留标题、段落、列表、表格、链接、代码块、图片和图注。', '检查缺失段落、粘连表格、失效链接和不完整结尾。'] },
    { heading: '适合AI Agent的Markdown转换器应该具备什么', paragraphs: ['比较适合AI Agent的Markdown转换器时，重点是输出质量和工作流边界，而不是按钮数量。'], bullets: ['正文边界稳定，避开页眉、页脚和推荐模块。', 'H1、H2、列表、表格和代码块保持清晰结构。', '保留来源地址、标题、作者和时间等元数据。', '失败时明确说明原因，不用空白结果伪装成功。', '清晰说明本地处理和隐私边界。'] },
    { heading: 'AI Agent资料整理工具如何组成工作流', paragraphs: ['AI Agent资料整理工具更适合组成一条小型工作流：网页转Markdown处理公开URL，文件转Markdown处理Word、文字型PDF、PPT、Excel、CSV、JSON、XML和RTF，Markdown Viewer负责检查，Markdown转HTML、PDF和Word负责交付，平台排版工具负责发布。'] },
    { heading: '使用Herdown的实际流程', paragraphs: ['把公开网页URL粘贴到网页转Markdown页面，或选择对应的本地文件工具；检查预览和Markdown源码中的标题、表格、代码、链接和文章结尾；需要交付时导出为HTML、PDF或Word，需要发布时使用微信公众号或小红书工具。'] },
  ] : [
    { heading: 'Why raw HTML is a poor input for AI agents', paragraphs: ['HTML is built for browser rendering, not clean retrieval. A modern page can contain navigation, ads, recommendations, comments, scripts, styles, and consent banners around the content a reader needs.', 'A good conversion identifies the main content boundary and keeps headings, paragraphs, lists, tables, links, code, images, and captions meaningful after the page layout is gone.'] },
    { heading: 'How to Convert HTML to Markdown for AI', paragraphs: ['A reliable HTML-to-Markdown workflow includes four checks:'], bullets: ['Locate the main article or document body instead of converting the whole page.', 'Remove navigation, ads, cookie banners, comments, scripts, styles, and repeated recommendations.', 'Preserve semantic headings, paragraphs, lists, tables, links, code blocks, images, and captions.', 'Review missing paragraphs, merged table cells, broken links, and incomplete endings.'] },
    { heading: 'What makes the best Markdown converter for AI agents', paragraphs: ['When you search for the best markdown converter for ai agents, compare output quality and workflow boundaries rather than the number of buttons.'], bullets: ['Stable content boundaries that avoid headers, footers, and recommendation modules.', 'Readable H1, H2, list, table, and code-block structure.', 'Source metadata such as URL, title, author, and publication date.', 'Clear failures instead of an empty result that looks successful.', 'A clear local-processing or privacy boundary.'] },
    { heading: 'How Markdown for Agents Tools fit together', paragraphs: ['Markdown for agents tools work best as a small workflow: webpage to Markdown for public URLs, document to Markdown for files, Markdown Viewer for checking, Markdown to HTML, PDF, and Word for delivery, and publishing tools for platform-specific layouts.'] },
    { heading: 'A practical Herdown workflow', paragraphs: ['Paste a public URL into URL to Markdown or choose the local tool for your file type. Review the preview and Markdown source, check headings, tables, code blocks, links, and the ending, then export to HTML, PDF, or Word or publish with the WeChat and Xiaohongshu tools.'] },
  ];
  const sectionsHtml = sections.map(section => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(item => `<p>${escapeHtml(item)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</section>`).join('');
  const faq = chinese ? [
    ['HTML转Markdown会保留原网页的视觉样式吗？', '不会完全保留。Markdown优先保留语义结构，固定布局和复杂CSS需要在HTML或原网页中查看。'],
    ['为什么转换后还需要人工检查？', '复杂表格、脚注、代码块、懒加载图片和登录后内容可能无法从公开HTML中完整获取。'],
    ['AI Agent为什么更适合使用Markdown？', 'Markdown的标题、列表、表格和代码块边界明确，长度更可控，也更容易被检索和继续处理。'],
  ] : [
    ['Does HTML to Markdown preserve the original visual design?', 'Not completely. Markdown preserves semantic structure, while fixed layouts and complex CSS belong in HTML or the original page.'],
    ['Why should I review the output?', 'Complex tables, footnotes, code blocks, lazy-loaded images, and login-only content may not be fully available in public HTML.'],
    ['Why is Markdown useful for AI agents?', 'Headings, lists, tables, and code blocks have clear boundaries. The result is easier to control, retrieve, and pass to another tool.'],
  ];
  const title = chinese ? '如何把HTML转换为适合AI的Markdown' : 'How to Convert HTML to Markdown for AI';
  const intro = chinese ? '从网页HTML中提取正文、保留语义结构，并整理成AI Agent可以稳定理解、检索和引用的Markdown。' : 'Extract useful content from webpage HTML, preserve its meaning, and prepare Markdown that AI agents can read, retrieve, and cite reliably.';
  return `<main class="seo-fallback"><p class="seo-brand"><a href="${localized('/')}">Herdown</a></p><nav>${nav}</nav><article><h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p><p>${escapeHtml(chinese ? '更新日期：2026年8月10日' : 'Updated August 10, 2026')}</p>${sectionsHtml}<section><h2>${escapeHtml(chinese ? '常见问题' : 'Frequently asked questions')}</h2>${faq.map(item => `<h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p>`).join('')}</section></article></main>`;
};

const seoFallback = (path: string, language: SeoLanguage, page: SeoPage): string => {
  if (path === '/blog' || blogArticlePaths.has(path)) return blogSeoFallback(path, language, page);
  const fallbackLanguage: BaseSeoLanguage = language === 'zh' ? 'zh' : 'en';
  const linksByLanguage: Record<SeoLanguage, string[][]> = {
    zh: [['/', '首页'], ['/url-to-markdown', '网页转Markdown'], ['/tools', '本地资料'], ['/docs', '开发者文档'], ['/faq', '常见问题']],
    en: [['/', 'Home'], ['/url-to-markdown', 'URL to Markdown'], ['/tools', 'Local materials'], ['/docs', 'Docs'], ['/faq', 'FAQ']],
    ja: [['/', 'ホーム'], ['/url-to-markdown', 'URLからMarkdown'], ['/tools', 'ローカル資料'], ['/docs', 'ドキュメント'], ['/faq', 'よくある質問']],
    es: [['/', 'Inicio'], ['/url-to-markdown', 'URL a Markdown'], ['/tools', 'Materiales locales'], ['/docs', 'Documentación'], ['/faq', 'Preguntas frecuentes']],
    de: [['/', 'Startseite'], ['/url-to-markdown', 'URL zu Markdown'], ['/tools', 'Lokale Materialien'], ['/docs', 'Dokumentation'], ['/faq', 'FAQ']],
  };
  const links = linksByLanguage[language];
  const localized = (href: string) => language === 'zh' ? href : `${href}${href.includes('?') ? '&' : '?'}lang=${language}`;
  const nav = links.map(([href, label]) => `<a href="${localized(href)}">${label}</a>`).join(' · ');
  const genericSections: Record<SeoLanguage, SeoFallbackSection[]> = {
    zh: [['怎么使用', '输入资料后运行页面中的工具，检查结果，再复制或下载需要的格式。'], ['输入与输出', page.intro], ['隐私与限制', '本地工具在浏览器中处理文件；网页解析和外部服务的可用范围以页面说明和目标网站访问权限为准。']],
    en: [['How it works', 'Add your input, run the tool, review the result, and copy or download the format you need.'], ['Input and output', page.intro], ['Privacy and limits', 'Local tools process files in the browser. Web parsing and external services depend on page access and the limits described on this page.']],
    ja: [['使い方', '入力を追加してツールを実行し、結果を確認して必要な形式でコピーまたはダウンロードします。'], ['入力と出力', page.intro], ['プライバシーと制限', 'ローカルツールはブラウザ内でファイルを処理します。Web解析はページへのアクセス権とこのページの制限に従います。']],
    es: [['Cómo funciona', 'Añade la entrada, ejecuta la herramienta, revisa el resultado y cópialo o descárgalo en el formato necesario.'], ['Entrada y salida', page.intro], ['Privacidad y límites', 'Las herramientas locales procesan archivos en el navegador. El análisis web depende del acceso a la página y de los límites indicados aquí.']],
    de: [['So funktioniert es', 'Eingabe hinzufügen, Werkzeug ausführen, Ergebnis prüfen und im benötigten Format kopieren oder herunterladen.'], ['Eingabe und Ausgabe', page.intro], ['Datenschutz und Grenzen', 'Lokale Werkzeuge verarbeiten Dateien im Browser. Web-Parsing hängt vom Seitenzugriff und den hier beschriebenen Grenzen ab.']],
  };
  // The localized shell must not fall back to English section headings. For ja/es/de,
  // the localized generic sections keep the server-rendered H2/H3 content readable
  // even when a route does not have a dedicated localized section set yet.
  const homeFallbackSections: Record<SeoLanguage, SeoFallbackSection[]> = {
    zh: [['核心能力', 'Web转Markdown、Doc转Markdown、RESTAPI、MCP、CLI和浏览器插件覆盖从单页网页到本地文档和开发者工作流的不同入口。'], ['输出质量', '正文清理、代码块保留、表格支持和来源保留让结果更适合阅读、检索、复核和交给AIAgent。'], ['怎么开始', '粘贴公开网页URL或HTML，生成Markdown后检查标题、来源和结构，再复制或下载结果。']],
    en: [['Core capabilities', 'Web to Markdown, document to Markdown, REST API, MCP, CLI, and browser extension cover single pages, local documents, and developer workflows.'], ['Output quality', 'Body cleaning, code block preservation, table support, and source retention make the result easier to read, retrieve, review, and pass to an AI agent.'], ['How to start', 'Paste a public webpage URL or HTML, generate Markdown, review the title, source, and structure, then copy or download the result.']],
    ja: [['主な機能', 'Web、文書、REST API、MCP、CLI、ブラウザ拡張機能で、ページ、ローカル資料、開発者ワークフローを処理します。'], ['出力品質', '本文整理、コード、表、出典を保ち、読解とAIエージェントへの受け渡しに使えます。'], ['始め方', '公開URLまたはHTMLを貼り付け、Markdownを生成して確認します。']],
    es: [['Capacidades principales', 'Web a Markdown, documentos, REST API, MCP, CLI y extensión cubren páginas, archivos locales y automatización.'], ['Calidad de salida', 'Limpieza del cuerpo, código, tablas y fuentes mejoran la lectura, recuperación y revisión.'], ['Cómo empezar', 'Pega una URL pública o HTML, genera Markdown y revisa título, fuente y estructura.']],
    de: [['Kernfunktionen', 'Web zu Markdown, Dokumente, REST API, MCP, CLI und Erweiterung decken Seiten, lokale Dateien und Automatisierung ab.'], ['Ausgabequalität', 'Inhalt bereinigen, Code, Tabellen und Quellen erhalten, damit Material gelesen und geprüft werden kann.'], ['Start', 'Öffentliche URL oder HTML einfügen, Markdown erzeugen und Titel, Quelle und Struktur prüfen.']],
  };
  const sections = path === '/'
    ? homeFallbackSections[language]
    : language === 'zh' || language === 'en'
      ? seoFallbackSections[path]?.[fallbackLanguage] || genericSections[language]
      : genericSections[language];
  const sectionDetail: Record<SeoLanguage, string> = { zh: '页面说明', en: 'Page details', ja: 'ページの詳細', es: 'Detalles de la página', de: 'Seitendetails' };
  const sectionsHtml = sections.map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><h3>${escapeHtml(sectionDetail[language])}</h3><p>${escapeHtml(body)}</p></section>`).join('');
  const faqByLanguage: Record<SeoLanguage, string[][]> = {
    zh: [['Herdown是做什么的？', '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读和AI工作流继续使用。'], ['我提交的内容会被长期保存吗？', '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。'], ['不会写代码也能用吗？', '可以。直接使用页面工具即可，开发者还可以使用API、MCP、CLI或浏览器插件。']],
    en: [['What does Herdown do?', 'Herdown turns webpage URLs or HTML into clean Markdown for saving, reading, and AI workflows.'], ['Is my content stored long-term?', 'No. Herdown processes content in real time and does not host your content or run a knowledge base.'], ['Can I use it without coding?', 'Yes. Use the page tools directly, or connect through the API, MCP, CLI, or browser extension.']],
    ja: [['Herdownは何をしますか？', 'WebページURLやHTMLを保存、閲覧、AIワークフローに使えるクリーンなMarkdownに整えます。'], ['内容は長期保存されますか？', 'いいえ。Herdownはリアルタイム処理を行い、コンテンツ保管やナレッジベースを提供しません。'], ['コードを書かずに使えますか？', 'はい。ページのツールを直接使うか、API、MCP、CLI、ブラウザ拡張機能で接続できます。']],
    es: [['¿Qué hace Herdown?', 'Herdown convierte URLs o HTML en Markdown limpio para guardar, leer y usar con flujos de IA.'], ['¿Se guarda mi contenido a largo plazo?', 'No. Herdown procesa el contenido en tiempo real y no ofrece alojamiento ni base de conocimiento.'], ['¿Puedo usarlo sin programar?', 'Sí. Usa las herramientas de la página o conecta la API, MCP, CLI o extensión del navegador.']],
    de: [['Was macht Herdown?', 'Herdown wandelt Webseiten-URLs oder HTML in sauberes Markdown zum Speichern, Lesen und für AI-Workflows um.'], ['Wird mein Inhalt langfristig gespeichert?', 'Nein. Herdown verarbeitet Inhalte in Echtzeit und bietet keine Inhaltsablage oder Wissensdatenbank.'], ['Kann ich es ohne Programmierung nutzen?', 'Ja. Die Seitentools direkt nutzen oder API, MCP, CLI und Browser-Erweiterung verbinden.']],
  };
  const faqItems = path === '/faq' ? faqByLanguage[language] : [];
  const faqHtml = faqItems.map(([question, answer]) => `<section><h2>${escapeHtml(question)}</h2><p>${escapeHtml(answer)}</p></section>`).join('');
  const structured = (isInteractiveSeoPath(path) || ['/tools', '/docs', '/pricing', '/browser-extension', '/skill'].includes(path)) ? seoStructuredCopy(path, language, page) : null;
  const howToHeading: Record<SeoLanguage, string> = { zh: '使用步骤', en: 'How to use', ja: '使い方', es: 'Cómo usarlo', de: 'So funktioniert es' };
  const faqHeading: Record<SeoLanguage, string> = { zh: '工具FAQ', en: 'Tool FAQ', ja: 'ツールFAQ', es: 'Preguntas frecuentes', de: 'Werkzeug-FAQ' };
  const howToHtml = structured ? `<section><h2>${howToHeading[language]}</h2>${structured.steps.map(step => `<h3>${escapeHtml(step.name)}</h3><p>${escapeHtml(step.text)}</p>`).join('')}</section>` : '';
  const structuredFaqHtml = structured ? `<section><h2>${faqHeading[language]}</h2>${structured.faqs.map(([question, answer]) => `<h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p>`).join('')}</section>` : '';
  return `<main class="seo-fallback"><p class="seo-brand"><a href="${localized('/')}">Herdown</a></p><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.intro)}</p><nav>${nav}</nav>${sectionsHtml}${howToHtml}${structuredFaqHtml}${faqHtml}</main>`;
};

const seoSchema = (path: string, language: SeoLanguage, page: SeoPage, canonicalUrl: string): string => {
  const inLanguage = language === 'zh' ? 'zh-CN' : language;
  const englishLike = language !== 'zh';
  const siteUrl = 'https://herdown.com';
  const ogImage = siteUrl + '/og-image.svg';
  const isInteractiveTool = isInteractiveSeoPath(path);
  const isRichSeoPath = isInteractiveTool || ['/tools', '/docs', '/pricing', '/browser-extension', '/skill'].includes(path);
  const organization = {
    '@type': 'Organization',
    '@id': siteUrl + '/#organization',
    name: 'Herdown',
    url: siteUrl + '/',
    logo: { '@type': 'ImageObject', url: ogImage },
    sameAs: ['https://github.com/less1001/herdown'],
  };
  const website = {
    '@type': 'WebSite',
    '@id': siteUrl + '/#website',
    name: 'Herdown',
    url: siteUrl + '/',
    inLanguage,
    publisher: { '@id': siteUrl + '/#organization' },
  };
  const pageNode: Record<string, unknown> = {
    '@type': path === '/' ? 'WebApplication' : path === '/faq' ? 'FAQPage' : blogArticlePaths.has(path) ? 'Article' : path === '/blog' ? 'CollectionPage' : isInteractiveTool ? 'WebApplication' : 'WebPage',
    '@id': canonicalUrl + '#webpage',
    name: path === '/' ? 'Herdown' : page.title,
    url: canonicalUrl,
    inLanguage,
    description: page.description,
    isPartOf: { '@id': siteUrl + '/#website' },
    publisher: { '@id': siteUrl + '/#organization' },
  };
  if (path === '/' || isRichSeoPath) {
    pageNode.applicationCategory = path === '/' ? 'DeveloperApplication' : 'UtilitiesApplication';
    pageNode.operatingSystem = 'Web';
    pageNode.offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
  }
  if (path === '/') {
    pageNode.featureList = englishLike ? ['Webpage to Markdown', 'Document to Markdown', 'REST API', 'MCP', 'CLI', 'Browser extension', 'Body cleaning', 'Code block preservation', 'Table support', 'Source retention'] : ['网页转Markdown', '文档转Markdown', 'REST API', 'MCP', 'CLI', '浏览器插件', '正文清理', '代码块保留', '表格支持', '来源保留'];
  }
  if (blogArticlePaths.has(path)) {
    pageNode.headline = page.heading;
    pageNode.author = { '@type': 'Organization', name: 'Herdown', url: siteUrl + '/' };
    pageNode.datePublished = '2026-08-10';
    pageNode.dateModified = '2026-08-10';
    pageNode.articleSection = 'AI agent workflows';
    pageNode.keywords = page.keywords;
    pageNode.mainEntityOfPage = { '@id': canonicalUrl + '#webpage' };
  }
  const breadcrumbLabels: Record<SeoLanguage, { home: string; current: string }> = {
    zh: { home: '首页', current: page.heading },
    en: { home: 'Home', current: page.heading },
    ja: { home: 'ホーム', current: page.heading },
    es: { home: 'Inicio', current: page.heading },
    de: { home: 'Startseite', current: page.heading },
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': canonicalUrl + '#breadcrumb',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbLabels[language].home, item: siteUrl + '/' },
      ...(path === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: breadcrumbLabels[language].current, item: canonicalUrl }]),
    ],
  };
  const graph: unknown[] = [organization, website, pageNode, breadcrumb];
  const structured = isRichSeoPath ? seoStructuredCopy(path, language, page) : null;
  if (structured) {
    graph.push({
      '@type': 'HowTo',
      '@id': canonicalUrl + '#howto',
      name: page.heading,
      description: page.description,
      inLanguage,
      step: structured.steps.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, name: step.name, text: step.text, url: canonicalUrl + '#step-' + (index + 1) })),
    });
    graph.push({
      '@type': 'FAQPage',
      '@id': canonicalUrl + '#faq',
      inLanguage,
      mainEntity: structured.faqs.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
    });
  }
  if (path === '/') {
    const homeCopy: Record<SeoLanguage, { steps: string[]; faqs: Array<[string, string]> }> = {
      zh: { steps: ['选择公开URL或HTML', '生成高质量Markdown', '检查并复制或下载'], faqs: [['Herdown是做什么的？', '把网页、文档和图片转换为适合AI Agent理解、检索和使用的高质量Markdown。'], ['我提交的内容会被长期保存吗？', '不会。网页以实时处理为主，本地文件在浏览器中处理，不提供内容托管或知识库服务。'], ['不会写代码也能用吗？', '可以。首页支持直接粘贴网页URL或HTML，开发者还可以使用API、MCP、CLI和浏览器插件。'], ['为什么有些网页无法解析？', '登录限制、付费墙、反爬规则、动态加载或没有可读正文都可能影响结果。']] },
      en: { steps: ['Choose a public URL or HTML', 'Generate high-quality Markdown', 'Review and copy or download'], faqs: [['What does Herdown do?', 'Herdown turns webpages, documents, and images into high-quality Markdown for AI agents.'], ['Is my content stored long-term?', 'No. Web content is processed for the request, local files stay in the browser, and Herdown is not a content host or knowledge base.'], ['Can I use it without coding?', 'Yes. Paste a webpage URL or HTML on the homepage, or use the API, MCP, CLI, or browser extension.'], ['Why can some pages not be parsed?', 'Login walls, paywalls, anti-bot rules, dynamic loading, and missing readable content can affect results.']] },
      ja: { steps: ['公開URLまたはHTMLを選ぶ', '高品質Markdownを生成', '確認してコピーまたは保存'], faqs: [['Herdownは何をしますか？', 'Webページ、文書、画像をAIエージェント向けの高品質Markdownに変換します。'], ['内容は長期保存されますか？', 'いいえ。Webはリクエスト処理、ローカルファイルはブラウザ内で処理します。'], ['コードなしで使えますか？', 'はい。URLまたはHTMLを貼り付けて使えます。API、MCP、CLI、拡張機能も利用できます。'], ['解析できないページがある理由は？', 'ログイン、アクセス制限、動的読み込み、本文不足などが原因です。']] },
      es: { steps: ['Elegir URL pública o HTML', 'Generar Markdown de alta calidad', 'Revisar y copiar o descargar'], faqs: [['¿Qué hace Herdown?', 'Convierte páginas, documentos e imágenes en Markdown de alta calidad para agentes de IA.'], ['¿Se guarda el contenido?', 'No. La web se procesa para la solicitud y los archivos locales permanecen en el navegador.'], ['¿Puedo usarlo sin programar?', 'Sí. Pega una URL o HTML, o usa API, MCP, CLI y extensión.'], ['¿Por qué falla una página?', 'El login, los muros de pago, el bloqueo, el contenido dinámico o la falta de texto pueden afectar.']] },
      de: { steps: ['Öffentliche URL oder HTML wählen', 'Hochwertiges Markdown erzeugen', 'Prüfen und kopieren oder laden'], faqs: [['Was macht Herdown?', 'Webseiten, Dokumente und Bilder in hochwertiges Markdown für AI-Agenten umwandeln.'], ['Wird der Inhalt langfristig gespeichert?', 'Nein. Web wird für die Anfrage verarbeitet und lokale Dateien bleiben im Browser.'], ['Ohne Programmierung nutzbar?', 'Ja. URL oder HTML einfügen oder API, MCP, CLI und Erweiterung nutzen.'], ['Warum schlägt eine Seite fehl?', 'Login, Bezahlschranke, Bot-Schutz, dynamische Inhalte oder fehlender Text können die Ursache sein.']] },
    };
    const localizedHome = homeCopy[language];
    graph.push({ '@type': 'HowTo', '@id': canonicalUrl + '#howto', name: page.heading, description: page.description, inLanguage, step: localizedHome.steps.map((name, index) => ({ '@type': 'HowToStep', position: index + 1, name, text: name, url: canonicalUrl + '#home-step-' + (index + 1) })) });
    graph.push({ '@type': 'FAQPage', '@id': canonicalUrl + '#faq', inLanguage, mainEntity: localizedHome.faqs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) });
  }
  if (path === '/faq') {
    const itemsByLanguage: Record<SeoLanguage, string[][]> = {
      zh: [['Herdown是做什么的？', '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读和AI工作流继续使用。'], ['我提交的内容会被长期保存吗？', '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。'], ['不会写代码也能用吗？', '可以。直接使用页面工具，开发者还可以使用API、MCP、CLI或浏览器插件。']],
      en: [['What does Herdown do?', 'Herdown turns webpage URLs or HTML into clean Markdown for saving, reading, and AI workflows.'], ['Is my content stored long-term?', 'No. Herdown processes content in real time and does not host your content or run a knowledge base.'], ['Can I use it without coding?', 'Yes. Use the page tools directly, or connect through the API, MCP, CLI, or browser extension.']],
      ja: [['Herdownは何をしますか？', 'WebページURLやHTMLを保存、閲覧、AIワークフローに使えるクリーンなMarkdownに整えます。'], ['内容は長期保存されますか？', 'いいえ。Herdownはリアルタイム処理を行い、コンテンツ保管やナレッジベースを提供しません。'], ['コードを書かずに使えますか？', 'はい。ページのツールを直接使うか、API、MCP、CLI、ブラウザ拡張機能で接続できます。']],
      es: [['¿Qué hace Herdown?', 'Herdown convierte URLs o HTML en Markdown limpio para guardar, leer y usar con flujos de IA.'], ['¿Se guarda mi contenido a largo plazo?', 'No. Herdown procesa el contenido en tiempo real y no ofrece alojamiento ni base de conocimiento.'], ['¿Puedo usarlo sin programar?', 'Sí. Usa las herramientas de la página o conecta la API, MCP, CLI o extensión del navegador.']],
      de: [['Was macht Herdown?', 'Herdown wandelt Webseiten-URLs oder HTML in sauberes Markdown zum Speichern, Lesen und für AI-Workflows um.'], ['Wird mein Inhalt langfristig gespeichert?', 'Nein. Herdown verarbeitet Inhalte in Echtzeit und bietet keine Inhaltsablage oder Wissensdatenbank.'], ['Kann ich es ohne Programmierung nutzen?', 'Ja. Die Seitentools direkt nutzen oder API, MCP, CLI und Browser-Erweiterung verbinden.']],
    };
    const items = itemsByLanguage[language];
    pageNode.mainEntity = items.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } }));
  }
  return escapeJsonForHtml({ '@context': 'https://schema.org', '@graph': graph });
};

const renderSeoShell = async (request: Request, env: Env, path: string): Promise<Response> => {
  const language = getSeoLanguage(request);
  const page = seoPageFor(path, language);
  const url = new URL(request.url);
  const canonicalUrl = `https://herdown.com${path}${language === 'zh' ? '' : `?lang=${language}`}`;
  const noindex = path === '/api';
  const alternateLinks = (['zh', 'en', 'ja', 'es', 'de'] as SeoLanguage[]).map(item => `<link rel="alternate" hreflang="${item === 'zh' ? 'zh-CN' : item}" href="https://herdown.com${path}${item === 'zh' ? '' : `?lang=${item}`}" />`).join('') + `<link rel="alternate" hreflang="x-default" href="https://herdown.com${path}" />`;
  const asset = await env.ASSETS!.fetch(new Request(new URL('/', request.url), request));
  if (!asset.ok) return asset;
  let html = await asset.text();
  const replace = (pattern: RegExp, replacement: string) => { html = html.replace(pattern, replacement); };
  replace(/<html lang="[^"]*"[^>]*>/i, `<html lang="${language === 'zh' ? 'zh-CN' : language}" translate="no">`);
  replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
  replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(page.description)}" />`);
  replace(/<meta name="keywords"[^>]*>/i, `<meta name="keywords" content="${escapeHtml(page.keywords)}" />`);
  replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}" />`);
  replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(page.title)}" />`);
  replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(page.description)}" />`);
  replace(/<meta property="og:image"[^>]*>/i, '<meta property="og:image" content="https://herdown.com/og-image.svg" />');
  replace(/<meta property="og:image:alt"[^>]*>/i, `<meta property="og:image:alt" content="${escapeHtml(page.title)}" />`);
  replace(/<meta name="twitter:card"[^>]*>/i, '<meta name="twitter:card" content="summary_large_image" />');
  replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`);
  replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`);
  replace(/<meta name="twitter:image"[^>]*>/i, '<meta name="twitter:image" content="https://herdown.com/og-image.svg" />');
  replace(/<meta property="og:locale"[^>]*>/i, `<meta property="og:locale" content="${language === 'zh' ? 'zh_CN' : language === 'en' ? 'en_US' : language === 'ja' ? 'ja_JP' : language === 'es' ? 'es_ES' : 'de_DE'}" />`);
  replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  replace(/<link rel="alternate"[^>]*>\s*/gi, '');
  replace(/<link rel="canonical"[^>]*>/i, `${alternateLinks}<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  replace(/<script type="application\/ld\+json"(?:\s+data-herdown-schema)?[^>]*>[\s\S]*?<\/script>/gi, `<script type="application/ld+json" data-herdown-schema>${seoSchema(path, language, page, canonicalUrl)}</script>`);
  const fallback = seoFallback(path, language, page);
  replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<script|\s*<noscript|\s*<\/body>)/i, `<div id="root">${fallback}</div>`);
  replace(/<noscript>[\s\S]*?<\/noscript>/i, '');
  const headers = new Headers(asset.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('cdn-cache-control', 'no-store');
  headers.set('vary', 'Accept-Language');
  headers.set('x-robots-tag', noindex ? 'noindex,follow' : 'index,follow');
  return new Response(html, { status: asset.status, headers });
};

const legalPage = (
  title: string,
  description: string,
  sections: Array<{ heading: string; body: string }>,
  canonicalUrl: string,
  english = false,
  noindex = false,
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
    <meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}" />
    <meta property="og:title" content="${title} | Herdown" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <link rel="canonical" href="${canonicalUrl}" />
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

const termsPage = (canonicalUrl: string, english = false, noindex = false) => english ? legalPage('Terms of Service', 'Herdown Terms of Service', [
  { heading: 'Service description', body: 'Herdown provides online tools, API, MCP, and related developer tools for turning webpages, documents, and images into Markdown. You may submit only content you are authorized to process and must follow applicable laws and third-party website rules.' },
  { heading: 'One-time credit packs', body: 'Paid services are sold as one-time credit packs shown on the product page and do not include automatic renewal. After payment is completed and confirmed by the payment provider, the corresponding credits are delivered according to the product description.' },
  { heading: 'Digital services and refunds', body: 'Credits are digital service capacity. Unless required by law or the service was not provided as agreed, issued or used digital credits generally cannot be refunded. Refund requests are handled according to the payment provider rules and the specific order.' },
  { heading: 'Service availability', body: 'Herdown works to keep the service stable but does not guarantee that every third-party website, login-restricted page, or dynamic page can always be parsed. You may not use the service for illegal activity, infringement, bypassing access controls, or compromising the security of another system.' },
  { heading: 'User obligations and enforcement', body: 'You must follow applicable laws, third-party platform rules, and these terms. You may not use the service for illegal, infringing, fraudulent, abusive scraping, access-control bypass, or harmful activity. Herdown may suspend or terminate access for violations or abnormal use and may cooperate when legally required.' },
  { heading: 'Terms updates', body: 'We may update these terms for product, compliance, or security reasons. Continued use of the service means that you accept the updated terms.' },
], canonicalUrl, true, noindex) : legalPage('服务条款', 'Herdown服务条款', [
  { heading: '服务说明', body: 'Herdown提供网页、文档和图片转为Markdown的在线工具、API、MCP与相关开发者工具。您应仅提交有权处理的内容，并遵守适用法律及第三方网站规则。' },
  { heading: '一次性点数包', body: '付费服务以商品页面展示的一次性点数包为准，不包含自动续费。支付完成并经支付平台确认后，系统会按商品说明发放相应服务额度。' },
  { heading: '数字服务与退款', body: '点数属于数字服务额度。除法律另有规定或服务未能按约提供外，已发放或已使用的数字额度通常不支持退款。退款申请会依据支付平台规则与具体订单情况处理。' },
  { heading: '服务可用性', body: 'Herdown会尽力保持服务稳定，但不承诺对任何第三方网站、受登录限制内容或动态页面始终可解析。不得将服务用于违法、侵权、绕过访问控制或影响他人系统安全的用途。' },
  { heading: '用户义务与违规处理', body: '您应遵守适用法律、第三方平台规则及本条款，不得利用服务处理违法、侵权、欺诈、恶意抓取、绕过访问限制或危害他人权益的内容。发现违规或异常使用时，Herdown可暂停或终止相关访问权限，并在法律要求时配合处理。' },
  { heading: '条款更新', body: '我们可能因功能、合规或安全需要更新本条款。继续使用服务即表示您接受更新后的条款。' },
], canonicalUrl, false, noindex);

const privacyPage = (canonicalUrl: string, english = false, noindex = false) => english ? legalPage('Privacy Policy', 'Herdown Privacy Policy', [
  { heading: 'Information processed', body: 'To complete a request, Herdown processes the webpage URLs, HTML, file content, API parameters, and necessary technical logs that you submit or generate through the service.' },
  { heading: 'How information is used', body: 'Submitted content is used only to complete the current parsing or conversion request, troubleshoot errors, and protect the service. Herdown does not sell, rent, or use your content for targeted advertising.' },
  { heading: 'Content and storage', body: 'Herdown uses real-time processing and does not provide user content hosting or a long-term knowledge base. Limited short-term logs may be used to prevent abuse, maintain stability, and diagnose failures.' },
  { heading: 'Third-party services', body: 'Payments are handled by independent providers such as Waffo Pancake. Herdown also uses Microsoft Clarity to understand anonymous website interactions, such as page visits, clicks, scrolling, device type, and session diagnostics. Clarity processes this information under Microsoft\'s privacy terms. Payment providers process payment information under their own privacy policies; Herdown does not directly store complete bank-card information.' },
  { heading: 'Account, access, and deletion requests', body: 'You may sign in with Google to recover API keys, view quota, and manage your profile. You can delete API keys on the website. To request access to or deletion of service records related to you, email vkdefi@gmail.com and do not send identity documents or bank-card numbers through a public page. After verification, we will handle identifiable records within a reasonable period. Payment orders and payment information are handled by Waffo Pancake under its rules.' },
], canonicalUrl, true, noindex) : legalPage('隐私政策', 'Herdown隐私政策', [
  { heading: '处理的信息', body: '为完成请求，Herdown会处理您主动提交的网页链接、HTML内容、文件内容、API请求参数以及必要的技术日志。' },
  { heading: '数据使用方式', body: '提交内容仅用于完成当前的解析、转换、错误排查与安全防护。Herdown不以出售、出租或广告定向为目的使用您的内容。' },
  { heading: '内容与存储', body: 'Herdown采用实时处理方式，不提供用户内容托管或长期知识库服务。必要的短期日志可能用于防滥用、保障服务稳定与定位故障。' },
  { heading: '第三方服务', body: '支付由Waffo Pancake等独立支付服务商处理。Herdown还使用MicrosoftClarity了解匿名网站交互，例如页面访问、点击、滚动、设备类型和会话诊断。Clarity会依照Microsoft隐私条款处理相关信息。支付服务商会依其自身隐私政策处理付款信息；Herdown不会直接保存完整银行卡信息。' },
  { heading: '账号与查询、删除', body: '您可以使用Google账号登录，用于找回API密钥、查看额度和管理个人资料。Herdown不提供用户内容托管或长期知识库服务。您可在网站内删除API密钥；如需查询或删除与您相关的服务记录，请发送邮件至vkdefi@gmail.com，且不要在公开页面提交身份证件、银行卡号等敏感信息。经核实后，我们会在合理期限内处理可识别的相关记录。付款订单与付款资料由Waffo Pancake按其规则处理。' },
], canonicalUrl, false, noindex);

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

const permanentRedirect = (location: string): Response => new Response(null, {
  status: 301,
  headers: { Location: location, 'cache-control': 'public, max-age=86400' },
});

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

type AuthInfo = { keyOrIp: string; isKey: boolean; userId: string; ip: string; deviceId?: string; invalidToken?: boolean };

const verifyApiKeyOrIp = async (request: Request, env: Env): Promise<AuthInfo> => {
  const ip = getClientIp(request);
  const deviceId = getDeviceId(request);
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token && env.HERDOWN_ADMIN_TEST_KEY && token === env.HERDOWN_ADMIN_TEST_KEY) {
    return { keyOrIp: token, isKey: true, userId: 'usr_admin', ip, deviceId };
  }

  if (token && env.DB) {
    try {
      const res = await env.DB.prepare('SELECT user_id, status FROM api_keys WHERE key = ?').bind(token).first<{ user_id: string; status: string }>();
      if (res && res.status === 'active') {
        return { keyOrIp: token, isKey: true, userId: res.user_id, ip, deviceId };
      }
    } catch {
      // ignore
    }
  }

  return { keyOrIp: token || ip, isKey: false, userId: 'usr_anonymous', ip, deviceId, invalidToken: Boolean(token) };
};

const checkAndLogRateLimit = async (keyOrIp: string, isKey: boolean, env: Env): Promise<{ allowed: boolean; reason?: string }> => {
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

const PUBLIC_TOOL_MAX_BYTES = 6 * 1024 * 1024;
const PUBLIC_TOOL_MAX_SITEMAPS = 40;
const PUBLIC_TOOL_MAX_URLS = 10000;

type PublicTextResult = {
  text: string;
  status: number;
  finalUrl: string;
  contentType: string;
  lastModified: string;
};

type SitemapInspection = {
  valid: boolean;
  type: 'urlset' | 'sitemapindex' | 'unknown';
  urls: string[];
  locCount: number;
  duplicateCount: number;
  issues: string[];
};

type SitemapSourceResult = {
  url: string;
  final_url: string;
  status: number;
  valid: boolean;
  type: SitemapInspection['type'];
  url_count: number;
  duplicate_urls: number;
  issues: string[];
};

type SitemapValidationCheck = {
  key: string;
  label: string;
  status: 'pass' | 'warning' | 'error' | 'info';
  message: string;
};

const normalizePublicToolUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('请输入网站域名或Sitemap地址');
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (parsed.username || parsed.password) throw new Error('目标地址不能包含用户名或密码');
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') throw new Error('目标地址只能使用标准HTTP或HTTPS端口');
  parsed.hash = '';
  const normalized = parsed.toString();
  if (isForbiddenUrl(normalized)) throw new Error('安全防火墙已拦截内网或私有地址');
  return normalized;
};

const readResponseTextWithLimit = async (response: Response, maxBytes = PUBLIC_TOOL_MAX_BYTES): Promise<string> => {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) throw new Error(`目标文件超过${Math.floor(maxBytes / 1024 / 1024)}MB处理上限`);
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      totalBytes += chunk.value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error(`目标文件超过${Math.floor(maxBytes / 1024 / 1024)}MB处理上限`);
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
};

const fetchPublicText = async (rawUrl: string, timeoutMs = 6000, env?: Env): Promise<PublicTextResult> => {
  let currentUrl = normalizePublicToolUrl(rawUrl);
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      const current = new URL(currentUrl);
      response = current.hostname === 'herdown.com' && env?.ASSETS
        ? await env.ASSETS.fetch(new Request(currentUrl, { signal: controller.signal }))
        : await fetch(currentUrl, {
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'user-agent': 'HerdownBot/1.0 (+https://herdown.com)',
            accept: 'application/xml,text/xml,text/plain,text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          },
        });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error('目标网站响应超时');
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return { text: '', status: response.status, finalUrl: currentUrl, contentType: '', lastModified: '' };
      }
      currentUrl = normalizePublicToolUrl(new URL(location, currentUrl).toString());
      continue;
    }

    const text = response.ok ? await readResponseTextWithLimit(response) : '';
    return {
      text,
      status: response.status,
      finalUrl: currentUrl,
      contentType: response.headers.get('content-type') || '',
      lastModified: response.headers.get('last-modified') || '',
    };
  }
  throw new Error('目标地址重定向次数过多');
};

const decodeXmlText = (value: string): string => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .trim();

const inspectSitemapXml = (xml: string): SitemapInspection => {
  const issues: string[] = [];
  const rootMatch = /<(urlset|sitemapindex)\b[^>]*>/i.exec(xml);
  const type = (rootMatch?.[1]?.toLowerCase() || 'unknown') as SitemapInspection['type'];
  if (type === 'unknown') issues.push('没有找到urlset或sitemapindex根元素');
  if (type !== 'unknown' && !new RegExp(`<\\/${type}\\s*>`, 'i').test(xml)) issues.push(`${type}根元素没有正确闭合`);

  const urls: string[] = [];
  const seen = new Set<string>();
  let locCount = 0;
  for (const match of xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)) {
    locCount += 1;
    const value = decodeXmlText(match[1] || '');
    try {
      const normalized = normalizePublicToolUrl(value);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        urls.push(normalized);
      }
    } catch {
      issues.push(`发现无效URL：${value.slice(0, 160)}`);
    }
  }

  if (type !== 'unknown' && urls.length === 0) issues.push('Sitemap中没有可用的loc地址');
  return { valid: type !== 'unknown' && issues.length === 0, type, urls, locCount, duplicateCount: Math.max(0, locCount - urls.length), issues };
};

const validateSitemapContent = (xml: string): {
  valid: boolean;
  status: 'healthy' | 'warning' | 'error';
  score: number;
  type: SitemapInspection['type'];
  total_urls: number;
  duplicate_urls: number;
  sample_urls: string[];
  size_bytes: number;
  checks: SitemapValidationCheck[];
} => {
  const checks: SitemapValidationCheck[] = [];
  const sizeBytes = new TextEncoder().encode(xml).byteLength;
  const hasDoctype = /<!DOCTYPE\b/i.test(xml);
  const syntaxResult = hasDoctype ? { err: { msg: 'Sitemap不允许DOCTYPE声明', line: 1, col: 1 } } : XMLValidator.validate(xml);

  if (syntaxResult !== true) {
    const error = syntaxResult.err;
    const message = error.msg.replace(/[.。]+$/, '');
    checks.push({ key: 'syntax', label: 'XML语法', status: 'error', message: `${message}，位置${error.line}:${error.col}。` });
    return {
      valid: false,
      status: 'error',
      score: 0,
      type: 'unknown',
      total_urls: 0,
      duplicate_urls: 0,
      sample_urls: [],
      size_bytes: sizeBytes,
      checks,
    };
  }

  checks.push({ key: 'syntax', label: 'XML语法', status: 'pass', message: 'XML标签、属性和闭合关系正确。' });
  const inspection = inspectSitemapXml(xml);
  checks.push(inspection.type === 'unknown'
    ? { key: 'root', label: 'Sitemap根元素', status: 'error', message: '根元素必须是urlset或sitemapindex。' }
    : { key: 'root', label: 'Sitemap根元素', status: 'pass', message: `已识别${inspection.type}根元素。` });

  const rootTag = /<(urlset|sitemapindex)\b([^>]*)>/i.exec(xml);
  const namespace = /\bxmlns\s*=\s*["']([^"']+)["']/i.exec(rootTag?.[2] || '')?.[1] || '';
  checks.push(namespace === 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ? { key: 'namespace', label: 'XML命名空间', status: 'pass', message: '使用标准Sitemap0.9命名空间。' }
    : { key: 'namespace', label: 'XML命名空间', status: 'warning', message: '建议在根元素使用http://www.sitemaps.org/schemas/sitemap/0.9。' });

  checks.push(inspection.urls.length
    ? { key: 'urls', label: 'loc地址', status: inspection.issues.length ? 'error' : 'pass', message: inspection.issues.length ? inspection.issues.join('；') : `找到${inspection.urls.length}个有效且唯一的loc地址。` }
    : { key: 'urls', label: 'loc地址', status: 'error', message: '没有找到有效的loc地址。' });
  checks.push(inspection.duplicateCount
    ? { key: 'duplicates', label: '重复URL', status: 'warning', message: `发现${inspection.duplicateCount}个重复loc地址。` }
    : { key: 'duplicates', label: '重复URL', status: 'pass', message: '没有发现重复loc地址。' });

  const invalidLastmod = [...xml.matchAll(/<lastmod\b[^>]*>([\s\S]*?)<\/lastmod>/gi)].filter(match => {
    const value = decodeXmlText(match[1] || '');
    return !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) || Number.isNaN(Date.parse(value));
  }).length;
  const allowedChangefreq = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
  const invalidChangefreq = [...xml.matchAll(/<changefreq\b[^>]*>([\s\S]*?)<\/changefreq>/gi)].filter(match => !allowedChangefreq.has(decodeXmlText(match[1] || '').toLowerCase())).length;
  const invalidPriority = [...xml.matchAll(/<priority\b[^>]*>([\s\S]*?)<\/priority>/gi)].filter(match => {
    const value = Number(decodeXmlText(match[1] || ''));
    return !Number.isFinite(value) || value < 0 || value > 1;
  }).length;
  const invalidMetadata = invalidLastmod + invalidChangefreq + invalidPriority;
  checks.push(invalidMetadata
    ? { key: 'metadata', label: '可选字段', status: 'warning', message: `发现${invalidLastmod}个无效lastmod、${invalidChangefreq}个无效changefreq、${invalidPriority}个无效priority。` }
    : { key: 'metadata', label: '可选字段', status: 'pass', message: '已使用的lastmod、changefreq和priority字段格式正确。' });

  const overUrlLimit = inspection.locCount > 50000;
  const overSizeLimit = sizeBytes > 50 * 1024 * 1024;
  checks.push(overUrlLimit || overSizeLimit
    ? { key: 'limits', label: 'Sitemap限制', status: 'error', message: `单个Sitemap包含${inspection.locCount}个loc，文件大小${sizeBytes}字节；标准上限为50,000个URL和50MB。` }
    : { key: 'limits', label: 'Sitemap限制', status: 'pass', message: `共${inspection.locCount}个loc，文件大小${sizeBytes}字节，未超过单文件上限。` });

  let score = 100;
  for (const check of checks) {
    if (check.status === 'error') score -= check.key === 'root' || check.key === 'urls' ? 35 : 25;
    if (check.status === 'warning') score -= check.key === 'namespace' ? 10 : 5;
  }
  score = Math.max(0, score);
  const hasError = checks.some(check => check.status === 'error');
  const hasWarning = checks.some(check => check.status === 'warning');
  return {
    valid: !hasError,
    status: hasError ? 'error' : hasWarning ? 'warning' : 'healthy',
    score,
    type: inspection.type,
    total_urls: inspection.urls.length,
    duplicate_urls: inspection.duplicateCount,
    sample_urls: inspection.urls.slice(0, 10),
    size_bytes: sizeBytes,
    checks,
  };
};

const sitemapCandidatesForInput = async (rawInput: string, env: Env): Promise<{ inputUrl: string; candidates: string[]; robotsUrl: string; robotsFound: boolean }> => {
  const inputUrl = normalizePublicToolUrl(rawInput);
  const parsed = new URL(inputUrl);
  const directSitemap = /(?:^|[\/_-])sitemap|\.xml$/i.test(parsed.pathname);
  if (directSitemap) return { inputUrl, candidates: [inputUrl], robotsUrl: '', robotsFound: false };

  const origin = parsed.origin;
  const robotsUrl = `${origin}/robots.txt`;
  const candidates: string[] = [];
  let robotsFound = false;
  const robots = await fetchPublicText(robotsUrl, 4500, env).catch(() => null);
  if (robots?.status === 200 && robots.text) {
    robotsFound = true;
    for (const match of robots.text.matchAll(/^\s*sitemap\s*:\s*(\S+)\s*$/gim)) {
      try {
        candidates.push(normalizePublicToolUrl(match[1] || ''));
      } catch {
        // Ignore malformed Sitemap declarations and continue with common paths.
      }
    }
  }
  candidates.push(
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
    `${origin}/wp-sitemap.xml`,
  );
  return { inputUrl, candidates: [...new Set(candidates)], robotsUrl, robotsFound };
};

const collectSitemapUrls = async (rawInput: string, env: Env): Promise<{
  input_url: string;
  robots_url: string;
  robots_found: boolean;
  sitemaps: SitemapSourceResult[];
  urls: string[];
  truncated: boolean;
}> => {
  const discovery = await sitemapCandidatesForInput(rawInput, env);
  const queue = [...discovery.candidates];
  const visited = new Set<string>();
  const collectedUrls = new Set<string>();
  const sitemaps: SitemapSourceResult[] = [];
  let truncated = false;

  while (queue.length && visited.size < PUBLIC_TOOL_MAX_SITEMAPS && collectedUrls.size < PUBLIC_TOOL_MAX_URLS) {
    const candidate = queue.shift();
    if (!candidate) break;
    let normalizedCandidate: string;
    try {
      normalizedCandidate = normalizePublicToolUrl(candidate);
    } catch {
      continue;
    }
    if (visited.has(normalizedCandidate)) continue;
    visited.add(normalizedCandidate);

    const response = await fetchPublicText(normalizedCandidate, 6000, env).catch(error => ({
      text: '',
      status: 0,
      finalUrl: normalizedCandidate,
      contentType: '',
      lastModified: '',
      error: error instanceof Error ? error.message : '抓取失败',
    }));
    if (!response.text) {
      sitemaps.push({
        url: normalizedCandidate,
        final_url: response.finalUrl,
        status: response.status,
        valid: false,
        type: 'unknown',
        url_count: 0,
        duplicate_urls: 0,
        issues: ['error' in response ? response.error : `HTTP ${response.status}`],
      });
      continue;
    }

    const inspection = inspectSitemapXml(response.text);
    sitemaps.push({
      url: normalizedCandidate,
      final_url: response.finalUrl,
      status: response.status,
      valid: inspection.valid,
      type: inspection.type,
      url_count: inspection.urls.length,
      duplicate_urls: inspection.duplicateCount,
      issues: inspection.issues,
    });

    if (inspection.type === 'sitemapindex') {
      queue.push(...inspection.urls);
      continue;
    }
    if (inspection.type === 'urlset') {
      for (const pageUrl of inspection.urls) {
        if (collectedUrls.size >= PUBLIC_TOOL_MAX_URLS) {
          truncated = true;
          break;
        }
        collectedUrls.add(pageUrl);
      }
    }
  }

  if (queue.length || visited.size >= PUBLIC_TOOL_MAX_SITEMAPS) truncated = true;
  return {
    input_url: discovery.inputUrl,
    robots_url: discovery.robotsUrl,
    robots_found: discovery.robotsFound,
    sitemaps,
    urls: [...collectedUrls],
    truncated,
  };
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

type RobotsRule = { path: string; allow: boolean };

const parseRobotsRules = (robotsText: string): RobotsRule[] => {
  const lines = robotsText.split(/\r?\n/);
  const rules: RobotsRule[] = [];
  let active = false;
  let groupHasRules = false;
  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (groupHasRules) {
        active = false;
        groupHasRules = false;
      }
      const agent = value.toLowerCase();
      active = active || agent === '*' || agent === 'herdownbot';
      continue;
    }
    if ((key === 'allow' || key === 'disallow') && active) {
      groupHasRules = true;
      if (value) rules.push({ path: value, allow: key === 'allow' });
    }
  }
  return rules;
};

const isAllowedByRobots = (targetUrl: string, rules: RobotsRule[]): boolean => {
  const parsed = new URL(targetUrl);
  const path = `${parsed.pathname}${parsed.search}`;
  const matches = rules.filter(rule => path.startsWith(rule.path)).sort((a, b) => b.path.length - a.path.length);
  return matches[0]?.allow ?? true;
};

const normalizeCrawlUrl = (value: string, baseUrl: string, origin: string): string | null => {
  try {
    const parsed = new URL(decodeXmlText(value), baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) return null;
    if (parsed.username || parsed.password) return null;
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(?:utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.searchParams.sort();
    if (/\.(?:avif|bmp|css|gif|ico|jpe?g|js|json|map|mp3|mp4|ogg|pdf|png|svg|webm|webp|woff2?|xml|zip)$/i.test(parsed.pathname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const extractInternalLinks = (html: string, pageUrl: string, origin: string): string[] => {
  const links = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const normalized = normalizeCrawlUrl(match[1] || match[2] || match[3] || '', pageUrl, origin);
    if (normalized) links.add(normalized);
  }
  return [...links];
};

const extractHtmlTitle = (html: string): string => {
  const value = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '';
  return decodeXmlText(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).slice(0, 300);
};

const crawlWebsiteUrls = async (rawInput: string, requestedLimit: number, env: Env): Promise<{
  input_url: string;
  origin: string;
  robots_url: string;
  robots_found: boolean;
  robots_blocked: number;
  pages: WebsiteCrawlPage[];
  urls: string[];
  discovered_urls: string[];
  truncated: boolean;
}> => {
  const inputUrl = normalizePublicToolUrl(rawInput);
  const parsedInput = new URL(inputUrl);
  const origin = parsedInput.origin;
  const limit = Math.min(50, Math.max(1, Math.floor(requestedLimit || 25)));
  const robotsUrl = `${origin}/robots.txt`;
  const robotsResponse = await fetchPublicText(robotsUrl, 4500, env).catch(() => null);
  const robotsFound = robotsResponse?.status === 200 && Boolean(robotsResponse.text);
  const robotsRules = robotsFound ? parseRobotsRules(robotsResponse?.text || '') : [];
  const queue: Array<{ url: string; depth: number }> = [{ url: inputUrl, depth: 0 }];
  const queued = new Set([inputUrl]);
  const discovered = new Set([inputUrl]);
  const pages: WebsiteCrawlPage[] = [];
  let robotsBlocked = 0;

  while (queue.length && pages.length < limit) {
    const batch = queue.splice(0, Math.min(8, limit - pages.length));
    const batchResults = await Promise.all(batch.map(async item => {
      if (!isAllowedByRobots(item.url, robotsRules)) return { item, blocked: true as const };
      const response = await fetchPublicText(item.url, 5000, env).catch(error => ({
        text: '',
        status: 0,
        finalUrl: item.url,
        contentType: '',
        lastModified: '',
        error: error instanceof Error ? error.message : '抓取失败',
      }));
      return { item, blocked: false as const, response };
    }));

    for (const batchResult of batchResults) {
      if (batchResult.blocked) {
        robotsBlocked += 1;
        continue;
      }
      const { item, response } = batchResult;
      pages.push({
        url: item.url,
        final_url: response.finalUrl,
        status: response.status,
        title: response.text ? extractHtmlTitle(response.text) : '',
        depth: item.depth,
        content_type: response.contentType,
        last_modified: response.lastModified,
      });
      if (response.status !== 200 || !/text\/html|application\/xhtml\+xml/i.test(response.contentType) || new URL(response.finalUrl).origin !== origin) continue;
      for (const link of extractInternalLinks(response.text, response.finalUrl, origin)) {
        if (discovered.size >= limit || queued.has(link)) continue;
        discovered.add(link);
        queued.add(link);
        queue.push({ url: link, depth: item.depth + 1 });
      }
    }
  }

  const successfulUrls = pages.filter(page => page.status === 200 && page.final_url.startsWith(origin)).map(page => page.final_url);
  return {
    input_url: inputUrl,
    origin,
    robots_url: robotsUrl,
    robots_found: robotsFound,
    robots_blocked: robotsBlocked,
    pages,
    urls: [...new Set(successfulUrls)],
    discovered_urls: [...discovered],
    truncated: queue.length > 0 || discovered.size >= limit,
  };
};

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

    const publicPath = normalizePublicPath(url.pathname);
    if ((request.method === 'GET' || request.method === 'HEAD') && url.hostname.toLowerCase() === 'www.herdown.com') {
      const canonicalUrl = new URL(request.url);
      canonicalUrl.protocol = 'https:';
      canonicalUrl.hostname = 'herdown.com';
      return permanentRedirect(canonicalUrl.toString());
    }
    if ((request.method === 'GET' || request.method === 'HEAD') && url.protocol === 'http:') {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      if (publicPath === '/help') {
        httpsUrl.hostname = 'herdown.com';
        httpsUrl.pathname = '/docs';
      }
      return permanentRedirect(httpsUrl.toString());
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && publicPath === '/help') {
      const docsUrl = new URL(request.url);
      docsUrl.protocol = 'https:';
      docsUrl.hostname = 'herdown.com';
      docsUrl.pathname = '/docs';
      return permanentRedirect(docsUrl.toString());
    }

    const isApiHost = url.hostname === 'api.herdown.com';
    const isMcpEndpoint = url.pathname === '/mcp';
    const isPublicSitePath = publicPath === '/'
      || Boolean(seoPages[publicPath])
      || publicPath === '/terms'
      || publicPath === '/privacy'
      || publicPath === '/sitemap.xml'
      || publicPath === '/robots.txt'
      || publicPath === '/llms.txt'
      || publicPath === '/llms-full.txt';

    if (url.pathname.startsWith('/v1/') && request.headers.has('authorization')) {
      const authInfo = await verifyApiKeyOrIp(request, env);
      if (authInfo.invalidToken) {
        return json({ success: false, code: 'INVALID_API_KEY', message: 'API密钥无效或已撤销' }, { status: 401 });
      }
    }

    if ((request.method === 'GET' || request.method === 'HEAD') && isApiHost && !isMcpEndpoint && isPublicSitePath) {
      const mainSiteUrl = new URL(request.url);
      mainSiteUrl.protocol = 'https:';
      mainSiteUrl.hostname = 'herdown.com';
      return permanentRedirect(mainSiteUrl.toString());
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

    if (url.pathname === '/v1/tools/sitemap-extract' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({ success: false, code: 'RATE_LIMIT_EXCEEDED', message: rateLimitResult.reason }, { status: 429 });
      }

      const body = await request.json().catch(() => ({})) as { url?: string };
      const target = (body.url || '').trim();
      if (!target || target.length > 2048) {
        return json({ success: false, code: 'INVALID_INPUT', message: '请输入有效的网站域名或Sitemap地址' }, { status: 400 });
      }

      const startedAt = Date.now();
      try {
        const result = await collectSitemapUrls(target, env);
        const validSitemaps = result.sitemaps.filter(item => item.valid);
        if (!validSitemaps.length) {
          return json({
            success: false,
            code: 'SITEMAP_NOT_FOUND',
            message: '没有找到可读取的Sitemap，请检查域名、robots.txt或Sitemap地址',
            ...result,
            elapsed_ms: Date.now() - startedAt,
          }, { status: 422 });
        }
        return json({
          success: true,
          ...result,
          total_sitemaps: validSitemaps.length,
          total_urls: result.urls.length,
          elapsed_ms: Date.now() - startedAt,
        });
      } catch (error) {
        return json({
          success: false,
          code: 'SITEMAP_EXTRACT_FAILED',
          message: error instanceof Error ? error.message : 'Sitemap提取失败',
        }, { status: 422 });
      }
    }

    if (url.pathname === '/v1/tools/sitemap-check' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({ success: false, code: 'RATE_LIMIT_EXCEEDED', message: rateLimitResult.reason }, { status: 429 });
      }

      const body = await request.json().catch(() => ({})) as { url?: string };
      const target = (body.url || '').trim();
      if (!target || target.length > 2048) {
        return json({ success: false, code: 'INVALID_INPUT', message: '请输入有效的网站域名或Sitemap地址' }, { status: 400 });
      }

      const startedAt = Date.now();
      try {
        const result = await collectSitemapUrls(target, env);
        const validSitemaps = result.sitemaps.filter(item => item.valid);
        const formatFailures = result.sitemaps.filter(item => item.status === 200 && !item.valid);
        const duplicateUrls = result.sitemaps.reduce((total, item) => total + item.duplicate_urls, 0);
        const directSitemap = !result.robots_url;
        const checks: Array<{ key: string; label: string; status: 'pass' | 'warning' | 'error' | 'info'; message: string }> = [];

        checks.push(directSitemap
          ? { key: 'robots', label: 'robots.txt发现', status: 'info', message: '本次直接检查Sitemap地址，不需要通过robots.txt发现。' }
          : result.robots_found
            ? { key: 'robots', label: 'robots.txt发现', status: 'pass', message: `可以访问${result.robots_url}。` }
            : { key: 'robots', label: 'robots.txt发现', status: 'warning', message: '没有找到可读取的robots.txt，已继续检查常见Sitemap路径。' });
        checks.push(validSitemaps.length
          ? { key: 'reachable', label: 'Sitemap可访问', status: 'pass', message: `找到${validSitemaps.length}个有效Sitemap文件。` }
          : { key: 'reachable', label: 'Sitemap可访问', status: 'error', message: '没有找到可读取的Sitemap文件。' });
        checks.push(formatFailures.length
          ? { key: 'format', label: 'XML格式', status: 'error', message: `${formatFailures.length}个文件可以访问，但不是有效的SitemapXML。` }
          : validSitemaps.length
            ? { key: 'format', label: 'XML格式', status: 'pass', message: '已识别urlset或sitemapindex根元素，loc地址可以读取。' }
            : { key: 'format', label: 'XML格式', status: 'info', message: '找到Sitemap后才能检查XML格式。' });
        checks.push(result.urls.length
          ? { key: 'urls', label: '页面URL', status: result.truncated ? 'warning' : 'pass', message: result.truncated ? `已读取${result.urls.length}个去重URL，结果达到公开工具上限。` : `共读取${result.urls.length}个去重URL。` }
          : { key: 'urls', label: '页面URL', status: 'error', message: '没有提取到可用的页面URL。' });
        checks.push(duplicateUrls
          ? { key: 'duplicates', label: '重复URL', status: 'warning', message: `发现${duplicateUrls}个重复loc地址，结果列表已自动去重。` }
          : { key: 'duplicates', label: '重复URL', status: 'pass', message: '没有发现重复loc地址。' });

        let score = 100;
        if (!directSitemap && !result.robots_found) score -= 10;
        if (!validSitemaps.length) score -= 60;
        if (formatFailures.length) score -= 20;
        if (!result.urls.length) score -= 10;
        if (duplicateUrls) score -= 5;
        if (result.truncated) score -= 10;
        score = Math.max(0, score);

        return json({
          success: true,
          ...result,
          checks,
          score,
          status: score >= 90 ? 'healthy' : score >= 70 ? 'warning' : 'error',
          total_sitemaps: validSitemaps.length,
          total_urls: result.urls.length,
          duplicate_urls: duplicateUrls,
          elapsed_ms: Date.now() - startedAt,
        });
      } catch (error) {
        return json({
          success: false,
          code: 'SITEMAP_CHECK_FAILED',
          message: error instanceof Error ? error.message : 'Sitemap检查失败',
        }, { status: 422 });
      }
    }

    if (url.pathname === '/v1/tools/sitemap-validate' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({ success: false, code: 'RATE_LIMIT_EXCEEDED', message: rateLimitResult.reason }, { status: 429 });
      }
      const requestLength = Number(request.headers.get('content-length') || 0);
      if (requestLength > PUBLIC_TOOL_MAX_BYTES + 64 * 1024) {
        return json({ success: false, code: 'PAYLOAD_TOO_LARGE', message: '粘贴的XML超过6MB公开工具上限' }, { status: 413 });
      }

      const body = await request.json().catch(() => ({})) as { url?: string; xml?: string };
      const targetUrl = (body.url || '').trim();
      let xml = body.xml || '';
      if (!targetUrl && !xml.trim()) {
        return json({ success: false, code: 'INVALID_INPUT', message: '请输入SitemapURL或粘贴XML内容' }, { status: 400 });
      }
      if (new TextEncoder().encode(xml).byteLength > PUBLIC_TOOL_MAX_BYTES) {
        return json({ success: false, code: 'PAYLOAD_TOO_LARGE', message: '粘贴的XML超过6MB公开工具上限' }, { status: 413 });
      }

      const startedAt = Date.now();
      let sourceUrl = '';
      let httpStatus = 0;
      try {
        if (targetUrl) {
          const response = await fetchPublicText(targetUrl, 6000, env);
          sourceUrl = response.finalUrl;
          httpStatus = response.status;
          if (response.status !== 200 || !response.text) {
            return json({ success: false, code: 'SITEMAP_FETCH_FAILED', message: `Sitemap地址返回HTTP ${response.status}`, source_url: sourceUrl, http_status: response.status }, { status: 422 });
          }
          xml = response.text;
        }

        const validation = validateSitemapContent(xml);
        return json({
          success: true,
          source_url: sourceUrl || null,
          http_status: httpStatus || null,
          ...validation,
          elapsed_ms: Date.now() - startedAt,
        });
      } catch (error) {
        return json({
          success: false,
          code: 'SITEMAP_VALIDATE_FAILED',
          message: error instanceof Error ? error.message : 'Sitemap校验失败',
        }, { status: 422 });
      }
    }

    if (url.pathname === '/v1/tools/website-url-extract' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({ success: false, code: 'RATE_LIMIT_EXCEEDED', message: rateLimitResult.reason }, { status: 429 });
      }
      const body = await request.json().catch(() => ({})) as { url?: string; limit?: number };
      const target = (body.url || '').trim();
      if (!target || target.length > 2048) {
        return json({ success: false, code: 'INVALID_INPUT', message: '请输入有效的网站地址' }, { status: 400 });
      }

      const startedAt = Date.now();
      try {
        const result = await crawlWebsiteUrls(target, Number(body.limit) || 25, env);
        if (!result.urls.length) {
          return json({ success: false, code: 'NO_PUBLIC_PAGES', message: '没有抓取到可访问的公开网页', ...result, elapsed_ms: Date.now() - startedAt }, { status: 422 });
        }
        return json({ success: true, ...result, total_urls: result.urls.length, elapsed_ms: Date.now() - startedAt });
      } catch (error) {
        return json({ success: false, code: 'WEBSITE_URL_EXTRACT_FAILED', message: error instanceof Error ? error.message : '网站URL提取失败' }, { status: 422 });
      }
    }

    if (url.pathname === '/v1/tools/cloud-document-to-markdown' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { platform?: string; url?: string };
      const platform = body.platform;
      const target = (body.url || '').trim();
      if (platform !== 'notion' && platform !== 'google-docs') {
        return json({ success: false, code: 'UNSUPPORTED_PLATFORM', message: '当前接口只支持Notion和Google Docs公开页面' }, { status: 400 });
      }
      if (!target || target.length > 2048) {
        return json({ success: false, code: 'INVALID_INPUT', message: platform === 'notion' ? '请输入有效的Notion公开页面地址' : '请输入有效的Google Docs文档地址' }, { status: 400 });
      }

      const startedAt = Date.now();
      try {
        const normalized = normalizePublicToolUrl(target);
        const hostname = new URL(normalized).hostname.toLowerCase();
        let fetchUrl = normalized;
        if (platform === 'notion') {
          const isNotionHost = hostname === 'notion.site' || hostname.endsWith('.notion.site') || hostname === 'notion.so' || hostname.endsWith('.notion.so') || hostname === 'notion.com' || hostname.endsWith('.notion.com');
          if (!isNotionHost) {
            return json({ success: false, code: 'INVALID_NOTION_URL', message: '请输入notion.site、notion.so或notion.com公开页面地址' }, { status: 400 });
          }
        } else {
          const isGoogleDocsHost = hostname === 'docs.google.com';
          const documentId = /\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i.exec(new URL(normalized).pathname)?.[1];
          if (!isGoogleDocsHost || !documentId) {
            return json({ success: false, code: 'INVALID_GOOGLE_DOCS_URL', message: '请输入docs.google.com/document/d/...公开文档地址' }, { status: 400 });
          }
          fetchUrl = `https://docs.google.com/document/d/${documentId}/export?format=html`;
        }

        const response = await fetchPublicText(fetchUrl, 10000, env);
        if (response.status !== 200 || !response.text.trim()) {
          const serviceName = platform === 'notion' ? 'Notion页面' : 'Google Docs文档';
          return json({ success: false, code: platform === 'notion' ? 'NOTION_FETCH_FAILED' : 'GOOGLE_DOCS_FETCH_FAILED', message: `${serviceName}无法访问，HTTP状态${response.status}。请确认内容已经公开发布。`, http_status: response.status }, { status: 422 });
        }
        if (!/text\/html|application\/xhtml\+xml/i.test(response.contentType)) {
          return json({ success: false, code: 'CLOUD_DOCUMENT_CONTENT_TYPE', message: '目标地址没有返回可转换的HTML页面' }, { status: 422 });
        }

        const metadataResponse = platform === 'google-docs' ? await fetchPublicText(normalized, 8000, env).catch(() => null) : null;
        const titleSource = metadataResponse?.text || response.text;
        const ogTitleMatch = /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i.exec(titleSource) || /<meta\b[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i.exec(titleSource);
        const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(titleSource);
        const pageTitle = decodeXmlText((ogTitleMatch?.[1] || titleMatch?.[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/\s+-\s+Google Docs$/i, '')) || (platform === 'notion' ? 'Notion page' : 'Google Docs document');
        const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(response.text);
        const bodyHtml = bodyMatch?.[1] || response.text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        const cleanedBodyHtml = bodyHtml.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, table => {
          const text = table.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
          return text ? table : '';
        }).replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, paragraph => {
          const text = paragraph.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, '').trim();
          return text && /^\|+$/.test(text) ? '' : paragraph;
        });
        const parsed = parseMarkdown(cleanedBodyHtml, response.finalUrl);
        const bodyMarkdown = parsed.markdown.trim();
        const markdown = bodyMarkdown && bodyMarkdown.startsWith(`# ${pageTitle}`) ? bodyMarkdown : `# ${pageTitle}\n\n${bodyMarkdown}`;
        const visibleCharacters = markdown.replace(/^---[\s\S]*?---\s*/m, '').replace(/\s+/g, '').length;
        if (visibleCharacters < 40) {
          const serviceName = platform === 'notion' ? 'Notion页面' : 'Google Docs文档';
          return json({ success: false, code: 'CLOUD_DOCUMENT_CONTENT_UNAVAILABLE', message: `没有读取到公开${serviceName}正文。请确认内容已经公开，或使用本地HTML导出模式。` }, { status: 422 });
        }

        return json({
          success: true,
          platform,
          source_url: normalized,
          final_url: response.finalUrl,
          http_status: response.status,
          title: pageTitle,
          markdown,
          images: parsed.images,
          character_count: markdown.length,
          elapsed_ms: Date.now() - startedAt,
        });
      } catch (error) {
        return json({ success: false, code: 'CLOUD_DOCUMENT_CONVERT_FAILED', message: error instanceof Error ? error.message : '在线文档转换失败' }, { status: 422 });
      }
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

      const body = (await request.json().catch(() => ({}))) as { url?: string; limit?: number; source_type?: 'domain' | 'start' | 'sitemap' };
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
      const processingFileType = body.source_type === 'sitemap' || targetUrl.includes('sitemap') ? 'sitemap' : 'website-crawl';
      try {
        const fetchCrawlResource = async (address: string): Promise<{ html: string; status: number }> => {
          const parsedAddress = new URL(address);
          if (env.ASSETS && parsedAddress.hostname === 'herdown.com' && parsedAddress.pathname === '/sitemap.xml') {
            const assetUrl = new URL(`${parsedAddress.pathname}${parsedAddress.search}`, request.url);
            const assetResponse = await env.ASSETS.fetch(new Request(assetUrl.toString()));
            return { html: assetResponse.ok ? await assetResponse.text() : '', status: assetResponse.status };
          }
          if (env.ASSETS && parsedAddress.hostname === 'herdown.com' && parsedAddress.protocol === 'https:') {
            const publicPath = normalizePublicPath(parsedAddress.pathname);
            const isKnownSeoPath = Object.prototype.hasOwnProperty.call(seoPages, publicPath)
              || Object.prototype.hasOwnProperty.call(localizedSeoPages, publicPath)
              || Object.prototype.hasOwnProperty.call(additionalLocalizedSeoPages, publicPath);
            if (isKnownSeoPath) {
              const syntheticRequest = new Request(`https://herdown.com${publicPath}${parsedAddress.search}`, { headers: request.headers });
              try {
                const rendered = await renderSeoShell(syntheticRequest, env, publicPath);
                return { html: rendered.ok ? await rendered.text() : '', status: rendered.status };
              } catch {
                // Fall through to the normal fetch path for any route that cannot be rendered locally.
              }
            }
          }
          return safeFetchPageHtml(address, undefined, 5000).catch(() => ({ html: '', status: 0 }));
        };
        let sitemapUrl = targetUrl;
        if (body.source_type === 'domain' || (!body.source_type && !targetUrl.includes('sitemap'))) {
          const origin = new URL(targetUrl).origin;
          sitemapUrl = `${origin}/sitemap.xml`;
        }

        const sitemapRes = body.source_type === 'start' ? null : await fetchCrawlResource(sitemapUrl);
        let content = sitemapRes?.html || '';
        
        if (!content) {
          const mainRes = await fetchCrawlResource(targetUrl);
          content = mainRes?.html || '';
        }

        let discoveredUrls = extractSitemapUrls(content, targetUrl, crawlLimit * 2);
        if (body.source_type !== 'start' && /<sitemapindex\b/i.test(content)) {
          const childSitemaps = discoveredUrls.slice(0, crawlLimit);
          const childContents = await Promise.all(childSitemaps.map(async (childUrl) => {
            const childRes = await fetchCrawlResource(childUrl);
            return childRes?.html || '';
          }));
          discoveredUrls = childContents.flatMap((childContent) => extractSitemapUrls(childContent, targetUrl, crawlLimit * 2));
        }
        const subUrls = Array.from(new Set(body.source_type === 'start' ? [targetUrl, ...discoveredUrls] : discoveredUrls)).slice(0, crawlLimit);
        const crawlResults = await Promise.all(
          subUrls.map(async (u: string) => {
            const pageStart = Date.now();
            const pageRes = await fetchCrawlResource(u);
            const html = pageRes?.html || '';
            if (!html) {
              return { url: u, source_url: u, title: '', markdown: '', success: false, message: pageRes.status ? `HTTP ${pageRes.status}` : '页面无法访问', elapsed_ms: Date.now() - pageStart };
            }
            const parsed = parseMarkdown(html, u);
            return {
              url: u,
              source_url: u,
              title: parsed.title,
              markdown: parsed.markdown,
              success: Boolean(parsed.markdown.trim()),
              message: parsed.markdown.trim() ? undefined : '未提取到可读正文',
              elapsed_ms: parsed.elapsed_ms || Date.now() - pageStart,
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
    const isMcpApiHost = url.hostname === 'api.herdown.com' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.pathname === '/mcp' && isMcpApiHost) {
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
            const authInfo = await verifyApiKeyOrIp(request, env);
            if (!authInfo.isKey) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32001, message: authInfo.invalidToken ? 'Invalid or revoked API key' : 'A valid API key is required for parse_webpage' } }, { status: 401 });
            }
            const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
            if (!rateLimitResult.allowed) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32029, message: rateLimitResult.reason || 'Rate limit exceeded' } }, { status: 429 });
            }
            const creditStatus = await getCreditStatus(authInfo.keyOrIp, env);
            const freeQuota = creditStatus.hasPurchasedCredits ? null : await getFreeQuotaStatus(getFreeQuotaIdentity(authInfo), env);
            if (creditStatus.hasPurchasedCredits && creditStatus.balance < 1) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32002, message: 'Credits exhausted' } }, { status: 402 });
            }
            if (!creditStatus.hasPurchasedCredits && (!freeQuota || freeQuota.remaining < 1)) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32002, message: 'Free monthly quota exhausted' } }, { status: 402 });
            }
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
            const consumed = creditStatus.hasPurchasedCredits
              ? await consumeCredits(authInfo.keyOrIp, 1, 'parse', env)
              : await consumeFreeQuota(getFreeQuotaIdentity(authInfo), 1, env);
            if (!consumed) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32002, message: creditStatus.hasPurchasedCredits ? 'Credits exhausted' : 'Free monthly quota exhausted' } }, { status: 402 });
            }

            return json({
              jsonrpc: '2.0',
              id: body.id ?? null,
              result: {
                content: [{ type: 'text', text: parsed.markdown }],
                structuredContent: parsed,
              },
            });
          }

          if (toolName === 'crawl_website') {
            const authInfo = await verifyApiKeyOrIp(request, env);
            if (!authInfo.isKey) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32001, message: authInfo.invalidToken ? 'Invalid or revoked API key' : 'A valid API key is required for crawl_website' } }, { status: 401 });
            }
            const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
            if (!rateLimitResult.allowed) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32029, message: rateLimitResult.reason || 'Rate limit exceeded' } }, { status: 429 });
            }
            const requestedLimit = Math.max(1, Math.floor(Number(args.limit) || 5));
            const creditStatus = await getCreditStatus(authInfo.keyOrIp, env);
            const freeQuota = creditStatus.hasPurchasedCredits ? null : await getFreeQuotaStatus(getFreeQuotaIdentity(authInfo), env);
            const crawlLimit = creditStatus.hasPurchasedCredits
              ? Math.min(requestedLimit, creditStatus.balance, 100)
              : Math.min(requestedLimit, 5, freeQuota?.remaining || 0);
            if (crawlLimit < 1) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32002, message: creditStatus.hasPurchasedCredits ? 'Credits exhausted' : 'Free monthly quota exhausted' } }, { status: 402 });
            }
            const targetUrl = (args.url || '').trim();
            if (!targetUrl || isForbiddenUrl(targetUrl)) {
              return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32602, message: 'Invalid public URL' } }, { status: 400 });
            }
            let sitemapUrl = targetUrl;
            if (!targetUrl.includes('sitemap')) sitemapUrl = `${new URL(targetUrl).origin}/sitemap.xml`;
            const sitemapRes = await safeFetchPageHtml(sitemapUrl, undefined, 5000).catch(() => null);
            let content = sitemapRes?.html || '';
            if (!content) {
              const mainRes = await safeFetchPageHtml(targetUrl, undefined, 5000).catch(() => null);
              content = mainRes?.html || '';
            }
            const subUrls = extractSitemapUrls(content, targetUrl, crawlLimit);
            const crawlResults = await Promise.all(subUrls.map(async (urlValue: string) => {
              const pageRes = await safeFetchPageHtml(urlValue, undefined, 5000).catch(() => null);
              const parsed = parseMarkdown(pageRes?.html || '', urlValue);
              return { url: urlValue, title: parsed.title, markdown: parsed.markdown, elapsed_ms: parsed.elapsed_ms };
            }));
            if (crawlResults.length > 0) {
              const consumed = creditStatus.hasPurchasedCredits
                ? await consumeCredits(authInfo.keyOrIp, crawlResults.length, 'crawl', env)
                : await consumeFreeQuota(getFreeQuotaIdentity(authInfo), crawlResults.length, env);
              if (!consumed) {
                return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32002, message: creditStatus.hasPurchasedCredits ? 'Credits exhausted' : 'Free monthly quota exhausted' } }, { status: 402 });
              }
            }
            const result = { success: true, total_pages: crawlResults.length, results: crawlResults };
            return json({
              jsonrpc: '2.0',
              id: body.id ?? null,
              result: { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result },
            });
          }
        }

        return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: 'Method not found' } }, { status: 404 });
      }
    }

    if (url.pathname === '/terms' || url.pathname === '/terms/') {
      const english = (request.headers.get('accept-language') || '').toLowerCase().startsWith('en');
      const noindex = isLanguageVariantUrl(url);
      return new Response(termsPage('https://herdown.com/terms', english, noindex), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600', 'x-robots-tag': noindex ? 'noindex,follow' : 'index,follow' },
      });
    }

    if (url.pathname === '/privacy' || url.pathname === '/privacy/') {
      const english = (request.headers.get('accept-language') || '').toLowerCase().startsWith('en');
      const noindex = isLanguageVariantUrl(url);
      return new Response(privacyPage('https://herdown.com/privacy', english, noindex), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600', 'x-robots-tag': noindex ? 'noindex,follow' : 'index,follow' },
      });
    }

    if ((publicPath === '/' || seoPages[publicPath]) && env.ASSETS) {
      return renderSeoShell(request, env, publicPath);
    }

    if ((url.pathname === '/' || url.pathname === '/index.html') && env.ASSETS) {
      const asset = await env.ASSETS.fetch(new Request(new URL('/', request.url), request));
      if (asset.ok) {
        const headers = new Headers(asset.headers);
        headers.set('cache-control', 'no-cache, no-store, must-revalidate');
        return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
      }
    }

    // Static Assets Fallback
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
