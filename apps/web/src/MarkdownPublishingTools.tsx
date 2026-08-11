import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Check, Clipboard, Columns3, Copy, Download, Eye, FolderOpen, Printer, Upload } from 'lucide-react';
import type { Language } from './i18n';
import { translateLegacyText } from './publicLocalization';
import { ToolSeoContent } from './ToolSeoContent';

type AssetMap = Record<string, string>;
type ViewerMode = 'split' | 'editor' | 'preview';
type WechatTheme = 'elegant' | 'minimal' | 'tech' | 'warm';
type XhsTheme = 'grid' | 'warm' | 'minimal' | 'sunset' | 'forest';
type XhsRatio = '3:4' | '3:5' | '4:5' | '1:1';
type XhsFont = 'system' | 'sans' | 'serif';
type XhsSize = 'small' | 'medium' | 'large';
const viewerSample: Record<Language, string> = {
  zh: `---\ntitle: Markdown Viewer示例\n---\n\n# Markdown Viewer\n\n把本地Markdown文件拖到左侧，右侧会实时显示排版结果。\n\n## 支持的内容\n\n- 标题、段落、列表和任务列表\n- 表格、引用、链接和图片\n- 代码块与本地文件预览\n\n### 一段代码\n\n\`\`\`javascript\nconst cleanMarkdown = true;\nconsole.log(cleanMarkdown);\n\`\`\`\n\n> 内容只在当前浏览器中处理。\n\n| 项目 | 状态 |\n| --- | --- |\n| 实时预览 | 已支持 |\n| 本地打开 | 已支持 |`,
  en: `---\ntitle: Markdown Viewer example\n---\n\n# Markdown Viewer\n\nDrop a local Markdown file on the left to see the formatted result on the right.\n\n## Supported content\n\n- Headings, paragraphs, lists, and task lists\n- Tables, quotes, links, and images\n- Code blocks and local file previews\n\n### A code sample\n\n\`\`\`javascript\nconst cleanMarkdown = true;\nconsole.log(cleanMarkdown);\n\`\`\`\n\n> Content is processed in this browser.\n\n| Item | Status |\n| --- | --- |\n| Live preview | Supported |\n| Local open | Supported |`,
  ja: `---\ntitle: Markdownビューアの例\n---\n\n# Markdownビューア\n\n左側にローカルMarkdownファイルをドロップすると、右側に整形結果が表示されます。\n\n## 対応する内容\n\n- 見出し、段落、リスト、タスクリスト\n- 表、引用、リンク、画像\n- コードブロックとローカルファイルのプレビュー\n\n### コード例\n\n\`\`\`javascript\nconst cleanMarkdown = true;\nconsole.log(cleanMarkdown);\n\`\`\`\n\n> 内容はこのブラウザ内で処理されます。\n\n| 項目 | 状態 |\n| --- | --- |\n| ライブプレビュー | 対応 |\n| ローカルで開く | 対応 |`,
  es: `---\ntitle: Ejemplo de Markdown Viewer\n---\n\n# Visor Markdown\n\nSuelta un archivo Markdown local a la izquierda para ver el resultado con formato a la derecha.\n\n## Contenido compatible\n\n- Títulos, párrafos, listas y listas de tareas\n- Tablas, citas, enlaces e imágenes\n- Bloques de código y vistas previas de archivos locales\n\n### Ejemplo de código\n\n\`\`\`javascript\nconst cleanMarkdown = true;\nconsole.log(cleanMarkdown);\n\`\`\`\n\n> El contenido se procesa en este navegador.\n\n| Elemento | Estado |\n| --- | --- |\n| Vista previa en vivo | Compatible |\n| Apertura local | Compatible |`,
  de: `---\ntitle: Markdown-Viewer-Beispiel\n---\n\n# Markdown-Viewer\n\nLege links eine lokale Markdown-Datei ab, um rechts das formatierte Ergebnis zu sehen.\n\n## Unterstützte Inhalte\n\n- Überschriften, Absätze, Listen und Aufgabenlisten\n- Tabellen, Zitate, Links und Bilder\n- Codeblöcke und lokale Dateivorschauen\n\n### Codebeispiel\n\n\`\`\`javascript\nconst cleanMarkdown = true;\nconsole.log(cleanMarkdown);\n\`\`\`\n\n> Inhalte werden in diesem Browser verarbeitet.\n\n| Element | Status |\n| --- | --- |\n| Live-Vorschau | Unterstützt |\n| Lokal öffnen | Unterstützt |`,
};

const normalizeName = (name: string): string => name.split('/').pop()?.toLowerCase() || name.toLowerCase();

const baseName = (name: string): string => name
  .replace(/\.(md|markdown|txt)$/i, '')
  .replace(/[^\p{L}\p{N}_-]+/gu, '-')
  .replace(/^-+|-+$/g, '') || 'herdown-markdown';

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const copyText = async (value: string): Promise<boolean> => {
  if (!value.trim()) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

const stripFrontmatter = (markdown: string): string => markdown.replace(/^\uFEFF?---\s*\n[\s\S]*?\n---\s*\n?/, '');

const assetUrl = (reference: string, assets: AssetMap): string => {
  const cleaned = reference.trim().replace(/^<|>$/g, '').split(/[?#]/)[0];
  return assets[normalizeName(cleaned)] || reference;
};

const resolveMarkdownAssets = (markdown: string, assets: AssetMap): string => {
  if (!Object.keys(assets).length) return markdown;
  let resolved = markdown.replace(/(!?\[[^\]]*\]\()([^\s)]+)(\s*(?:"[^"]*"|'[^']*')?\))/g, (full, prefix: string, reference: string, suffix: string) => `${prefix}${assetUrl(reference, assets)}${suffix}`);
  resolved = resolved.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi, (full, prefix: string, reference: string, suffix: string) => `${prefix}${assetUrl(reference, assets)}${suffix}`);
  return resolved;
};

const markdownToHtml = (markdown: string, assets: AssetMap = {}): string => {
  if (!markdown.trim()) return '';
  const raw = marked.parse(resolveMarkdownAssets(stripFrontmatter(markdown), assets), { gfm: true, breaks: false }) as string;
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel', 'referrerpolicy'] });
};

const readFiles = async (files: FileList | File[]): Promise<{ markdown: string; name: string; assets: AssetMap }> => {
  const list = Array.from(files);
  const markdownFile = list.find(file => /\.(md|markdown|txt)$/i.test(file.name));
  if (!markdownFile) throw new Error('请同时选择一个.md或.markdown文件。');
  const assets: AssetMap = {};
  for (const file of list.filter(candidate => candidate !== markdownFile && candidate.type.startsWith('image/'))) {
    assets[normalizeName(file.name)] = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`图片读取失败：${file.name}`));
      reader.readAsDataURL(file);
    });
  }
  return { markdown: await markdownFile.text(), name: markdownFile.name, assets };
};

const openMarkdownFiles = async (files: FileList | File[]): Promise<{ markdown: string; name: string; assets: AssetMap }> => {
  const list = Array.from(files);
  const zip = list.find(file => /\.zip$/i.test(file.name));
  if (zip) {
    const JSZip = (await import('jszip')).default;
    const archive = await JSZip.loadAsync(await zip.arrayBuffer());
    const entries = Object.values(archive.files).filter(entry => !entry.dir);
    const markdownEntry = entries.find(entry => /\.(md|markdown|txt)$/i.test(entry.name));
    if (!markdownEntry) throw new Error('ZIP中没有找到.md或.markdown文件。');
    const assets: AssetMap = {};
    for (const entry of entries.filter(candidate => /\.(png|jpe?g|gif|webp|svg)$/i.test(candidate.name))) {
      const blob = await entry.async('blob');
      assets[normalizeName(entry.name)] = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(`ZIP图片读取失败：${entry.name}`));
        reader.readAsDataURL(blob);
      });
    }
    return { markdown: await markdownEntry.async('string'), name: markdownEntry.name, assets };
  }
  return readFiles(list);
};

const pageIntro = (language: Language, zh: string, en: string): string => language === 'zh' ? zh : language === 'en' ? en : translateLegacyText(en, language);

type PrintBody = string | ((document: Document) => void);

const openBrowserPrint = (title: string, bodyClass: string, body: PrintBody, extraStyles: string): boolean => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  const stylesheetLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'))
    .map(link => link.href);
  printWindow.document.open();
  printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>');
  printWindow.document.close();
  printWindow.document.title = title;
  printWindow.document.body.className = bodyClass;
  stylesheetLinks.forEach(href => {
    const link = printWindow.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    printWindow.document.head.appendChild(link);
  });
  const style = printWindow.document.createElement('style');
  style.textContent = extraStyles;
  printWindow.document.head.appendChild(style);
  printWindow.document.body.className = bodyClass;
  if (typeof body === 'string') printWindow.document.body.innerHTML = body;
  else body(printWindow.document);
  const print = () => window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 120);
  if (printWindow.document.readyState === 'complete') print();
  else printWindow.addEventListener('load', print, { once: true });
  return true;
};

const ToolHeader = ({ language, eyebrow, title, description }: { language: Language; eyebrow: string; title: string; description: string }) => (
  <div className="max-w-3xl">
    <span className="text-xs font-semibold text-emerald-400">{eyebrow}</span>
    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
    <p className="mt-3 text-sm leading-7 text-slate-400">{description} {pageIntro(language, '文件只在当前浏览器处理。', 'Files stay in this browser.')}</p>
  </div>
);

const ImportBox = ({ language, onFiles, accept = '.md,.markdown,.zip,text/markdown', multiple = true }: { language: Language; onFiles: (files: FileList | File[]) => void; accept?: string; multiple?: boolean }) => (
  <label
    className="flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-emerald-500/40 bg-[#090d12] px-4 text-center transition hover:border-emerald-400"
    onDragOver={event => event.preventDefault()}
    onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files); }}
  >
    <Upload className="h-5 w-5 text-emerald-400" />
    <span className="text-sm text-slate-300">{pageIntro(language, '拖入.md、图片或ZIP，也可以选择文件', 'Drop .md, images, or a ZIP, or choose files')}</span>
    <input className="sr-only" name="markdown-files" type="file" accept={accept} multiple={multiple} onChange={event => { if (event.target.files?.length) onFiles(event.target.files); event.currentTarget.value = ''; }} />
  </label>
);

const ActionButton = ({ children, onClick, disabled = false, secondary = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; secondary?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${secondary ? 'border border-[#263548] bg-[#111823] text-slate-300 hover:border-emerald-500/50 hover:text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
    {children}
  </button>
);

const ToolFooter = ({ language, sections }: { language: Language; sections: Array<{ title: string; text: string }> }) => (
  <section className="mt-10 grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3" aria-label={pageIntro(language, '工具说明', 'About this tool')}>
    {sections.map(section => <div key={section.title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h2 className="text-sm font-semibold text-slate-200">{section.title}</h2><p className="mt-2 text-xs leading-6 text-slate-500">{section.text}</p></div>)}
  </section>
);

const viewerPreviewClass = 'markdown-publishing-preview max-w-none';

export function MarkdownViewerPage({ language }: { language: Language }) {
  const [markdown, setMarkdown] = useState(viewerSample[language]);
  const [assets, setAssets] = useState<AssetMap>({});
  const [mode, setMode] = useState<ViewerMode>('split');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const syncingRef = useRef(false);
  const html = useMemo(() => markdownToHtml(markdown, assets), [markdown, assets]);
  const previewHtml = useMemo(() => html.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>'), [html]);

  useEffect(() => {
    const saved = window.localStorage.getItem('herdown_markdown_viewer_draft');
    if (saved) setMarkdown(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('herdown_markdown_viewer_draft', markdown);
  }, [markdown]);

  const openFiles = async (files: FileList | File[]) => {
    try {
      const result = await openMarkdownFiles(files);
      setMarkdown(result.markdown);
      setAssets(result.assets);
      setMessage(pageIntro(language, `已在本地打开${result.name}。`, `${result.name} opened locally.`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (language === 'en' ? 'The file could not be opened.' : '文件打开失败。'));
    }
  };

  const syncFrom = (source: HTMLElement, target: HTMLElement) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;
    target.scrollTop = sourceMax > 0 && targetMax > 0 ? (source.scrollTop / sourceMax) * targetMax : 0;
    window.requestAnimationFrame(() => { syncingRef.current = false; });
  };

  const copyMarkdown = async () => {
    const ok = await copyText(markdown);
    setCopied(ok);
    setMessage(ok ? pageIntro(language, 'Markdown已复制。', 'Markdown copied.') : pageIntro(language, '浏览器没有允许复制，请手动选择内容。', 'The browser blocked copying. Select the content manually.'));
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadMarkdown = () => downloadBlob(new Blob([`${markdown}\n`], { type: 'text/markdown;charset=utf-8' }), 'herdown-markdown.md');

  const downloadHtml = () => {
    const body = `<article class="markdown-publishing-preview">${html}</article>`;
    downloadBlob(new Blob([`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Markdown Viewer</title><style>body{max-width:860px;margin:0 auto;padding:32px;font-family:system-ui,sans-serif;line-height:1.7;color:#17202a}img{max-width:100%}pre{padding:16px;background:#17202a;color:white;overflow:auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}</style></head><body>${body}</body></html>`], { type: 'text/html;charset=utf-8' }), 'markdown-viewer.html');
  };

  const printPreview = () => {
    if (!markdown.trim()) return;
    const sourceHtml = previewRef.current?.innerHTML || previewHtml;
    const opened = openBrowserPrint(
      pageIntro(language, 'Markdown Viewer打印', 'Print Markdown Viewer'),
      'markdown-viewer-page',
      printDocument => {
        if (previewRef.current) {
          const article = printDocument.importNode(previewRef.current, true) as HTMLElement;
          article.className = 'markdown-viewer-print-content markdown-publishing-preview markdown-publishing-light';
          printDocument.body.appendChild(article);
        } else {
          const article = printDocument.createElement('article');
          article.className = 'markdown-viewer-print-content markdown-publishing-preview markdown-publishing-light';
          article.innerHTML = sourceHtml;
          printDocument.body.appendChild(article);
        }
      },
      '@page{size:A4;margin:12mm}body{margin:0;background:#fff;color:#111827;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.markdown-viewer-page{max-width:none!important;margin:0!important;padding:0!important}.markdown-viewer-print-content{display:block!important;position:static!important;width:100%!important;height:auto!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important;opacity:1!important;color:#111827!important;background:#fff!important}.markdown-publishing-preview{line-height:1.75}.markdown-publishing-preview h1,.markdown-publishing-preview h2,.markdown-publishing-preview h3,.markdown-publishing-preview h4,.markdown-publishing-preview h5,.markdown-publishing-preview h6{color:inherit;font-weight:700;line-height:1.3;margin:1.3em 0 .55em}.markdown-publishing-preview h1{font-size:2rem;margin-top:0}.markdown-publishing-preview h2{font-size:1.5rem}.markdown-publishing-preview h3{font-size:1.25rem}.markdown-publishing-preview p{margin:.8em 0}.markdown-publishing-preview ul,.markdown-publishing-preview ol{margin:.8em 0;padding-left:1.5em}.markdown-publishing-preview li{margin:.25em 0}.markdown-publishing-preview blockquote{border-left:3px solid #087f5b;color:#475569;margin:1em 0;padding-left:1em}.markdown-publishing-preview pre{background:#0f172a;border-radius:.75rem;color:#e2e8f0;margin:1em 0;overflow:visible;padding:1rem;white-space:pre-wrap}.markdown-publishing-preview pre code{background:transparent;color:inherit;padding:0}.markdown-publishing-preview code{background:#e2e8f0;color:#0f172a;padding:.12em .35em}.markdown-publishing-preview table{border-collapse:collapse;margin:1em 0;min-width:100%}.markdown-publishing-preview th,.markdown-publishing-preview td{border:1px solid #cbd5e1;padding:.55rem .7rem;text-align:left}.markdown-publishing-preview th{background:#f1f5f9;color:#0f172a;font-weight:700}.markdown-publishing-preview img{height:auto;max-width:100%}.markdown-publishing-preview hr{border:0;border-top:1px solid #cbd5e1;margin:1.5em 0}',
    );
    setMessage(pageIntro(language, opened ? '已打开打印窗口，请选择“保存为PDF”。' : '浏览器阻止了打印窗口，请允许弹出窗口后重试。', opened ? 'The print window is open. Choose “Save as PDF”.' : 'The browser blocked the print window. Allow pop-ups and try again.'));
  };

  return <div className="markdown-viewer-page mx-auto w-full max-w-7xl pb-20 pt-8">
    <div className="markdown-viewer-ui">
      <ToolHeader language={language} eyebrow={pageIntro(language, '本地Markdown查看器', 'Local Markdown viewer')} title={pageIntro(language, 'Markdown Viewer', 'Markdown Viewer')} description={pageIntro(language, '打开或拖入.md文件，实时查看排版结果，也可以编辑、复制和导出。', 'Open or drop a .md file to preview, edit, copy, and export it in real time.')} />
      <div className="mt-7 flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#263548] bg-[#111823] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-emerald-500/50 hover:text-white"><FolderOpen className="h-3.5 w-3.5" />{pageIntro(language, '打开Markdown', 'Open Markdown')}<input className="sr-only" name="markdown-viewer-file" type="file" accept=".md,.markdown,.zip,text/markdown" onChange={event => { if (event.target.files?.length) void openFiles(event.target.files); event.currentTarget.value = ''; }} /></label>
      <ActionButton secondary onClick={downloadMarkdown} disabled={!markdown.trim()}><Download className="h-3.5 w-3.5" />{pageIntro(language, '下载.md', 'Download .md')}</ActionButton>
      <ActionButton secondary onClick={downloadHtml} disabled={!markdown.trim()}><Download className="h-3.5 w-3.5" />{pageIntro(language, '导出HTML', 'Export HTML')}</ActionButton>
      <ActionButton secondary onClick={printPreview} disabled={!markdown.trim()}><Printer className="h-3.5 w-3.5" />{pageIntro(language, '打印/保存PDF', 'Print/save PDF')}</ActionButton>
      <ActionButton secondary onClick={() => void copyMarkdown()} disabled={!markdown.trim()}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? pageIntro(language, '已复制', 'Copied') : pageIntro(language, '复制Markdown', 'Copy Markdown')}</ActionButton>
      <div className="ml-auto flex rounded-lg border border-[#263548] bg-[#111823] p-1">
        {(['split', 'editor', 'preview'] as ViewerMode[]).map(item => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-2.5 py-1.5 text-xs ${mode === item ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item === 'split' ? <Columns3 className="inline h-3.5 w-3.5" /> : item === 'editor' ? pageIntro(language, '编辑', 'Edit') : <Eye className="inline h-3.5 w-3.5" />}</button>)}
      </div>
      </div>
      <div className="mt-3"><ImportBox language={language} onFiles={files => void openFiles(files)} /></div>
    </div>
    <div className={`markdown-viewer-workspace mt-5 grid gap-4 ${mode === 'split' ? 'lg:grid-cols-2' : ''}`}>
      <section className={`${mode === 'split' || mode === 'editor' ? '' : 'hidden'} markdown-viewer-editor-section rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4`} aria-label={pageIntro(language, 'Markdown编辑器', 'Markdown editor')}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-200">{pageIntro(language, 'Markdown编辑器', 'Markdown editor')}</h2><span className="text-xs text-slate-500">{markdown.length} {pageIntro(language, '字符', 'characters')}</span></div>
        <textarea ref={editorRef} name="markdown-viewer-editor" value={markdown} onChange={event => setMarkdown(event.target.value)} onScroll={() => { if (previewRef.current && editorRef.current) syncFrom(editorRef.current, previewRef.current); }} spellCheck={false} className="min-h-[520px] w-full resize-y rounded-xl border border-[#1e293b] bg-[#090d12] p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-emerald-500/70" aria-label={pageIntro(language, 'Markdown编辑器', 'Markdown editor')} />
      </section>
      <section className={`${mode === 'split' || mode === 'preview' ? '' : 'hidden'} markdown-viewer-preview-section rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4`} aria-label={pageIntro(language, '实时预览', 'Live preview')}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-200">{pageIntro(language, '实时预览', 'Live preview')}</h2><div className="flex rounded-md border border-[#263548] p-0.5"><button type="button" onClick={() => setPreviewTheme('dark')} className={`px-2 py-1 text-[11px] ${previewTheme === 'dark' ? 'rounded bg-[#263548] text-white' : 'text-slate-500'}`}>{pageIntro(language, '深色', 'Dark')}</button><button type="button" onClick={() => setPreviewTheme('light')} className={`px-2 py-1 text-[11px] ${previewTheme === 'light' ? 'rounded bg-white text-slate-900' : 'text-slate-500'}`}>{pageIntro(language, '浅色', 'Light')}</button></div></div>
        <article ref={previewRef} onScroll={() => { if (editorRef.current && previewRef.current) syncFrom(previewRef.current, editorRef.current); }} className={`${viewerPreviewClass} ${previewTheme === 'light' ? 'markdown-publishing-light' : ''} max-h-[600px] overflow-auto rounded-xl p-5`} dangerouslySetInnerHTML={{ __html: previewHtml || `<p class="text-slate-500">${pageIntro(language, '输入Markdown后显示预览。', 'Enter Markdown to preview it.')}</p>` }} />
      </section>
    </div>
    <article className="markdown-viewer-print-content markdown-publishing-preview" dangerouslySetInnerHTML={{ __html: previewHtml || `<p>${pageIntro(language, '输入Markdown后显示预览。', 'Enter Markdown to preview it.')}</p>` }} />
    <div className="markdown-viewer-ui">
      {message && <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs leading-5 text-emerald-200" role="status">{message}</p>}
      <ToolFooter language={language} sections={language === 'en' ? [{ title: 'Local files', text: 'Open .md, .markdown, or ZIP files. A selected image file can be matched to a relative image reference.' }, { title: 'Live preview', text: 'Headings, lists, tables, links, quotes, code blocks, and common inline Markdown are rendered as you type.' }, { title: 'Export', text: 'Download the original Markdown, a standalone HTML file, or print the current preview to save as PDF.' }] : language === 'zh' ? [{ title: '本地文件', text: '支持打开.md、.markdown和ZIP文件。选择配套图片后，可以预览相对路径图片。' }, { title: '实时预览', text: '输入时即时渲染标题、列表、表格、链接、引用、代码块和常见Markdown格式。' }, { title: '导出结果', text: '可以下载原始Markdown、独立HTML文件，也可以打开浏览器打印窗口，将当前预览保存为PDF。' }] : language === 'ja' ? [{ title: 'ローカルファイル', text: '.md、.markdown、ZIPを開き、相対パスの画像も確認できます。' }, { title: 'ライブプレビュー', text: '入力しながら見出し、リスト、表、リンク、引用、コードを表示します。' }, { title: '出力', text: '元のMarkdownとHTMLを保存し、現在のプレビューを印刷してPDFにできます。' }] : language === 'es' ? [{ title: 'Archivos locales', text: 'Abre .md, .markdown o ZIP y relaciona imágenes locales con rutas relativas.' }, { title: 'Vista en vivo', text: 'Renderiza títulos, listas, tablas, enlaces, citas y código mientras escribes.' }, { title: 'Exportación', text: 'Descarga Markdown o HTML, o imprime la vista actual para guardarla como PDF.' }] : [{ title: 'Lokale Dateien', text: '.md, .markdown oder ZIP öffnen und lokale Bilder mit relativen Pfaden verbinden.' }, { title: 'Live-Vorschau', text: 'Überschriften, Listen, Tabellen, Links, Zitate und Code werden beim Schreiben gerendert.' }, { title: 'Export', text: 'Markdown oder HTML laden oder die aktuelle Vorschau drucken und als PDF speichern.' }]} />
      <ToolSeoContent slug="markdown-viewer" language={language} />
    </div>
  </div>;
}

const wechatThemeStyles: Record<WechatTheme, { label: string; body: string; accent: string; quote: string; code: string }> = {
  elegant: { label: 'Elegant', body: '#3f3f46', accent: '#17a673', quote: '#f5f5f5', code: '#f5f7f9' },
  minimal: { label: 'Minimal', body: '#262626', accent: '#6b7280', quote: '#f6f6f6', code: '#f4f4f5' },
  tech: { label: 'Tech Blue', body: '#17324d', accent: '#1877c9', quote: '#eff6ff', code: '#eef6ff' },
  warm: { label: 'Warm Orange', body: '#4a3528', accent: '#d97832', quote: '#fff7ed', code: '#fff4e8' },
};

const renderWechatHtml = (markdown: string, assets: AssetMap, theme: WechatTheme): string => {
  const raw = markdownToHtml(markdown, assets);
  if (!raw) return '';
  const parsed = new DOMParser().parseFromString(`<div id="herdown-wechat-root">${raw}</div>`, 'text/html');
  const root = parsed.querySelector('#herdown-wechat-root');
  if (!root) return '';
  const palette = wechatThemeStyles[theme];
  const setStyle = (selector: string, style: string) => root.querySelectorAll<HTMLElement>(selector).forEach(element => { element.style.cssText = style; });
  setStyle('h1', `margin:0 0 24px;color:${palette.body};font-size:26px;line-height:1.35;font-weight:700;border-bottom:2px solid ${palette.accent};padding-bottom:12px;`);
  setStyle('h2', `margin:30px 0 14px;color:${palette.body};font-size:21px;line-height:1.45;font-weight:700;`);
  setStyle('h3,h4,h5,h6', `margin:24px 0 10px;color:${palette.body};font-size:18px;line-height:1.5;font-weight:700;`);
  setStyle('p', `margin:0 0 18px;color:${palette.body};font-size:16px;line-height:1.9;letter-spacing:.02em;`);
  setStyle('ul,ol', `margin:0 0 20px;padding-left:24px;color:${palette.body};font-size:16px;line-height:1.9;`);
  setStyle('li', 'padding-left:4px;margin:3px 0;');
  setStyle('blockquote', `margin:20px 0;padding:14px 16px;border-left:4px solid ${palette.accent};background:${palette.quote};color:${palette.body};font-style:italic;`);
  setStyle('pre', `margin:20px 0;padding:14px 16px;overflow:auto;border-radius:8px;background:#18212b;color:#eef7f3;font-size:13px;line-height:1.65;`);
  setStyle('pre code', 'padding:0;background:transparent;color:inherit;font-size:inherit;');
  setStyle('code', `padding:2px 5px;border-radius:4px;background:${palette.code};color:${palette.body};font-size:.92em;`);
  setStyle('table', 'width:100%;margin:20px 0;border-collapse:collapse;font-size:14px;line-height:1.6;');
  setStyle('th', `padding:9px 10px;border:1px solid #d7dadd;background:${palette.code};color:${palette.body};font-weight:700;text-align:left;`);
  setStyle('td', `padding:9px 10px;border:1px solid #d7dadd;color:${palette.body};text-align:left;`);
  setStyle('a', `color:${palette.accent};text-decoration:none;`);
  setStyle('hr', `margin:28px 0;border:0;border-top:1px solid ${palette.accent};opacity:.35;`);
  setStyle('img', 'display:block;max-width:100%;height:auto;margin:16px auto;border-radius:6px;');
  root.querySelectorAll<HTMLImageElement>('img').forEach(image => image.setAttribute('referrerpolicy', 'no-referrer'));
  return DOMPurify.sanitize(root.innerHTML, { ADD_ATTR: ['target', 'rel', 'referrerpolicy'] });
};

const plainTextFromHtml = (html: string): string => new DOMParser().parseFromString(html, 'text/html').body.innerText || '';

const copyRichHtml = async (html: string): Promise<boolean> => {
  if (!html.trim()) return false;
  try {
    const ClipboardItemConstructor = (window as unknown as { ClipboardItem?: new (items: Record<string, Blob>) => ClipboardItem }).ClipboardItem;
    if (navigator.clipboard.write && ClipboardItemConstructor) {
      await navigator.clipboard.write([new ClipboardItemConstructor({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plainTextFromHtml(html)], { type: 'text/plain' }) })]);
      return true;
    }
    return copyText(plainTextFromHtml(html));
  } catch {
    return copyText(plainTextFromHtml(html));
  }
};

export function MarkdownWechatPage({ language }: { language: Language }) {
  const [markdown, setMarkdown] = useState('');
  const [assets, setAssets] = useState<AssetMap>({});
  const [theme, setTheme] = useState<WechatTheme>('elegant');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => renderWechatHtml(markdown, assets, theme), [markdown, assets, theme]);

  const openFiles = async (files: FileList | File[]) => {
    try {
      const result = await openMarkdownFiles(files);
      setMarkdown(result.markdown);
      setAssets(result.assets);
      setMessage(pageIntro(language, `已在本地打开${result.name}。`, `${result.name} opened locally.`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : pageIntro(language, '文件打开失败。', 'The file could not be opened.'));
    }
  };

  const copyToWechat = async () => {
    const ok = await copyRichHtml(html);
    setCopied(ok);
    setMessage(ok ? pageIntro(language, '已复制富文本，可以粘贴到微信公众号编辑器。', 'Rich text copied. Paste it into the WeChat editor.') : pageIntro(language, '浏览器没有允许复制，请手动选择右侧预览。', 'The browser blocked copying. Select the preview manually.'));
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="mx-auto w-full max-w-7xl pb-20 pt-8">
    <ToolHeader language={language} eyebrow={pageIntro(language, '本地Markdown排版', 'Local Markdown publishing')} title={pageIntro(language, 'Markdown转微信公众号', 'Markdown to WeChat')} description={pageIntro(language, '把Markdown整理成适合微信公众号编辑器的富文本，复制后直接粘贴。', 'Turn Markdown into WeChat-friendly rich text that can be copied into the official editor.')} />
    <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]">
      <section className="rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-200">{pageIntro(language, 'Markdown输入', 'Markdown input')}</h2><div className="flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#263548] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white"><Upload className="h-3.5 w-3.5" />{pageIntro(language, '打开文件', 'Open file')}<input className="sr-only" name="markdown-wechat-file" type="file" accept=".md,.markdown,.zip,text/markdown" onChange={event => { if (event.target.files?.length) void openFiles(event.target.files); event.currentTarget.value = ''; }} /></label><button type="button" onClick={() => setMarkdown('')} className="rounded-lg border border-[#263548] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white">{pageIntro(language, '清空', 'Clear')}</button></div></div>
        <div className="mt-3"><ImportBox language={language} onFiles={files => void openFiles(files)} /></div>
        <textarea name="markdown-wechat-editor" value={markdown} onChange={event => setMarkdown(event.target.value)} spellCheck={false} rows={22} className="mt-3 min-h-[500px] w-full resize-y rounded-xl border border-[#1e293b] bg-[#090d12] p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-emerald-500/70" aria-label={pageIntro(language, 'Markdown输入', 'Markdown input')} placeholder={pageIntro(language, '把Markdown粘贴到这里，支持标题、列表、表格、代码和图片。', 'Paste Markdown here. Headings, lists, tables, code, and images are supported.')} />
        {message && <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs leading-5 text-emerald-200" role="status">{message}</p>}
      </section>
      <section className="rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-200">{pageIntro(language, '微信公众号预览', 'WeChat preview')}</h2><ActionButton onClick={() => void copyToWechat()} disabled={!html.trim()}>{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? pageIntro(language, '已复制', 'Copied') : pageIntro(language, '复制到公众号', 'Copy to WeChat')}</ActionButton></div>
        <div className="mt-4 flex flex-wrap gap-2"><div className="flex rounded-lg border border-[#263548] p-1"><button type="button" onClick={() => setPreviewMode('light')} className={`rounded-md px-2.5 py-1.5 text-xs ${previewMode === 'light' ? 'bg-[#263548] text-white' : 'text-slate-400 hover:text-white'}`}>{pageIntro(language, '浅色', 'Light')}</button><button type="button" onClick={() => setPreviewMode('dark')} className={`rounded-md px-2.5 py-1.5 text-xs ${previewMode === 'dark' ? 'bg-[#263548] text-white' : 'text-slate-400 hover:text-white'}`}>{pageIntro(language, '深色', 'Dark')}</button></div>{(Object.keys(wechatThemeStyles) as WechatTheme[]).map(item => <button key={item} type="button" onClick={() => setTheme(item)} className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${theme === item ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-[#263548] text-slate-400 hover:text-white'}`}>{translateLegacyText(wechatThemeStyles[item].label, language)}</button>)}</div>
        <div className={`mt-4 rounded-[32px] p-3 shadow-2xl ${previewMode === 'dark' ? 'bg-[#202832]' : 'bg-[#e9e9e9]'}`}><div className="rounded-[25px] bg-white p-2"><div className="mb-2 rounded-t-[20px] border-b border-[#ececec] bg-white py-2 text-center text-xs text-slate-500">WeChat Article</div><article className="wechat-preview max-h-[650px] overflow-auto px-3 py-5" dangerouslySetInnerHTML={{ __html: html || `<p style="color:#94a3b8">${pageIntro(language, '输入Markdown后显示公众号预览。', 'Enter Markdown to preview it.')}</p>` }} /></div></div>
      </section>
    </div>
    <ToolFooter language={language} sections={language === 'en' ? [{ title: 'Paste-ready HTML', text: 'The copy action includes text/html and text/plain, so the WeChat editor receives formatted content with a readable fallback.' }, { title: 'Themes', text: 'Choose Elegant, Minimal, Tech Blue, or Warm Orange before copying.' }, { title: 'Images', text: 'Select the Markdown file together with local images, or import a ZIP containing the document and its images.' }] : [{ title: '适合粘贴的富文本', text: '复制时同时提供text/html和text/plain，微信公众号编辑器可以接收排版内容，也保留纯文本兜底。' }, { title: '排版主题', text: '支持Elegant、Minimal、Tech Blue和Warm Orange四种主题，复制前可以切换。' }, { title: '图片处理', text: '选择Markdown文件时可以同时选择本地图片，也可以导入包含文档和图片的ZIP。' }]} />
    <ToolSeoContent slug="markdown-to-wechat" language={language} />
  </div>;
}

const xhsThemes: Record<XhsTheme, { label: string; background: string; text: string; accent: string; muted: string }> = {
  grid: { label: 'Grid Paper', background: '#f8faf7', text: '#405e56', accent: '#efb7a3', muted: '#86a49a' },
  warm: { label: 'Warm', background: '#fff8ef', text: '#6a4936', accent: '#e8a873', muted: '#a98267' },
  minimal: { label: 'Minimal', background: '#ffffff', text: '#222222', accent: '#d1d5db', muted: '#737373' },
  sunset: { label: 'Sunset', background: '#fff1e8', text: '#7c3e38', accent: '#f28b72', muted: '#b66d61' },
  forest: { label: 'Forest', background: '#eef5ed', text: '#31533c', accent: '#8dbb8a', muted: '#6c9270' },
};

const xhsRatios: Record<XhsRatio, string> = { '3:4': '3 / 4', '3:5': '3 / 5', '4:5': '4 / 5', '1:1': '1 / 1' };

const splitXhsCards = (markdown: string): string[] => {
  const source = stripFrontmatter(markdown).trim();
  if (!source) return [];
  const lines = source.split(/\r?\n/);
  const cards: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^---\s*$/.test(line) || (/^##\s+/.test(line) && current.length > 0)) {
      if (current.join('\n').trim()) cards.push(current.join('\n').trim());
      current = /^##\s+/.test(line) ? [line] : [];
    } else {
      current.push(line);
    }
  }
  if (current.join('\n').trim()) cards.push(current.join('\n').trim());
  if (cards.length > 1) return cards;
  const paragraphs = source.split(/\n{2,}/).filter(Boolean);
  if (paragraphs.length <= 1) return [source];
  const result: string[] = [];
  let bucket = '';
  for (const paragraph of paragraphs) {
    if (bucket && `${bucket}\n\n${paragraph}`.length > 520) {
      result.push(bucket);
      bucket = paragraph;
    } else {
      bucket = bucket ? `${bucket}\n\n${paragraph}` : paragraph;
    }
  }
  if (bucket) result.push(bucket);
  return result;
};

export function MarkdownXiaohongshuPage({ language }: { language: Language }) {
  const [markdown, setMarkdown] = useState('');
  const [assets, setAssets] = useState<AssetMap>({});
  const [theme, setTheme] = useState<XhsTheme>('grid');
  const [ratio, setRatio] = useState<XhsRatio>('3:4');
  const [font, setFont] = useState<XhsFont>('system');
  const [size, setSize] = useState<XhsSize>('medium');
  const [message, setMessage] = useState('');
  const cards = useMemo(() => splitXhsCards(markdown), [markdown]);
  const palette = xhsThemes[theme];
  const xhsHtml = useMemo(() => cards.map(card => markdownToHtml(card, assets)), [cards, assets]);

  const openFiles = async (files: FileList | File[]) => {
    try {
      const result = await openMarkdownFiles(files);
      setMarkdown(result.markdown);
      setAssets(result.assets);
      setMessage(language === 'en' ? `${result.name} opened locally.` : `已在本地打开${result.name}。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : pageIntro(language, '文件打开失败。', 'The file could not be opened.'));
    }
  };

  const printCards = () => {
    if (!cards.length) return;
    const renderedCards = Array.from(document.querySelectorAll<HTMLElement>('.markdown-xhs-page .markdown-xhs-preview-list > .xhs-card'));
    const opened = openBrowserPrint(
      pageIntro(language, 'Markdown转小红书打印', 'Print Markdown to Xiaohongshu cards'),
      'markdown-xhs-page',
      printDocument => {
        const container = printDocument.createElement('div');
        container.className = 'markdown-xhs-print-content';
        renderedCards.forEach(card => container.appendChild(printDocument.importNode(card, true)));
        printDocument.body.appendChild(container);
      },
      '@page{size:A4;margin:12mm}.markdown-xhs-page{max-width:none!important;margin:0!important;padding:0!important;background:#fff}.markdown-xhs-print-content{display:block!important;position:static!important;width:100%!important;height:auto!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important;opacity:1!important;background:#fff}.xhs-card{position:relative;display:block;overflow:hidden;padding:9%;box-shadow:none;break-inside:avoid;break-after:page;page-break-inside:avoid;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact;width:min(100%,273mm);max-width:100%;max-height:273mm;margin:0 auto 12mm}.xhs-card:last-child{margin-bottom:0;break-after:auto;page-break-after:auto}.xhs-card h1,.xhs-card h2,.xhs-card h3,.xhs-card h4,.xhs-card h5,.xhs-card h6{color:inherit;line-height:1.18;margin:0 0 .8em;font-weight:800;letter-spacing:-.025em}.xhs-card h1{font-size:2.15em}.xhs-card h2{font-size:1.65em}.xhs-card h3{font-size:1.3em}.xhs-card p{margin:0 0 1em;line-height:1.65}.xhs-card ul,.xhs-card ol{margin:0 0 1em;padding-left:1.35em;line-height:1.65}.xhs-card li{margin:.25em 0}.xhs-card blockquote{border-left:3px solid currentColor;margin:1em 0;padding:.8em .9em;opacity:.68}.xhs-card code{background:rgba(255,255,255,.45);border-radius:.3em;padding:.1em .3em}.xhs-card pre{background:rgba(255,255,255,.48);border-radius:.65em;margin:1em 0;overflow:hidden;padding:.8em;white-space:pre-wrap}.xhs-card pre code{background:transparent}.xhs-card table{border-collapse:collapse;font-size:.82em;margin:1em 0;width:100%}.xhs-card th,.xhs-card td{border:1px solid currentColor;padding:.35em .5em;text-align:left}.xhs-card img{display:block;height:auto;margin:.8em auto;max-height:35%;max-width:100%;object-fit:contain}.xhs-card.xhs-font-small{font-size:15px!important}.xhs-card.xhs-font-medium{font-size:17px!important}.xhs-card.xhs-font-large{font-size:20px!important}',
    );
    setMessage(pageIntro(language, opened ? '已打开打印窗口，请选择“保存为PDF”或直接打印卡片。' : '浏览器阻止了打印窗口，请允许弹出窗口后重试。', opened ? 'The print window is open. Choose “Save as PDF” or print the cards.' : 'The browser blocked the print window. Allow pop-ups and try again.'));
  };

  const fontFamily = font === 'serif' ? 'Georgia,SimSun,serif' : font === 'sans' ? 'Arial,Microsoft YaHei,sans-serif' : 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const fontSize = size === 'small' ? '15px' : size === 'large' ? '20px' : '17px';

  return <div className="markdown-xhs-page mx-auto w-full max-w-7xl pb-20 pt-8">
    <div className="markdown-xhs-ui"><ToolHeader language={language} eyebrow={pageIntro(language, '本地图片卡片生成', 'Local image card generator')} title={pageIntro(language, 'Markdown转小红书', 'Markdown to Xiaohongshu')} description={pageIntro(language, '把Markdown按标题或分隔线拆成小红书图文卡片，选择比例和主题后打印或保存为PDF。', 'Turn Markdown into Xiaohongshu image cards, choose a ratio and theme, then print or save them as a PDF.')} /></div>
    <div className="markdown-xhs-workspace mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
      <section className="markdown-xhs-ui rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-200">{pageIntro(language, 'Markdown输入', 'Markdown input')}</h2><div className="flex gap-2"><label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#263548] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white"><Upload className="h-3.5 w-3.5" />{pageIntro(language, '打开文件', 'Open file')}<input className="sr-only" name="markdown-xhs-file" type="file" accept=".md,.markdown,.zip,image/*,text/markdown" multiple onChange={event => { if (event.target.files?.length) void openFiles(event.target.files); event.currentTarget.value = ''; }} /></label><button type="button" onClick={() => setMarkdown('')} className="rounded-lg border border-[#263548] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white">{pageIntro(language, '清空', 'Clear')}</button></div></div>
        <div className="mt-3"><ImportBox language={language} onFiles={files => void openFiles(files)} accept=".md,.markdown,.zip,image/*,text/markdown" /></div>
        <textarea name="markdown-xhs-editor" value={markdown} onChange={event => setMarkdown(event.target.value)} spellCheck={false} rows={22} className="mt-3 min-h-[500px] w-full resize-y rounded-xl border border-[#1e293b] bg-[#090d12] p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-emerald-500/70" aria-label={pageIntro(language, 'Markdown输入', 'Markdown input')} placeholder={pageIntro(language, '用#写封面标题，用##分卡片，或用---手动分页。', 'Use # for the cover, ## for cards, or --- for manual page breaks.')} />
        <p className="mt-3 text-xs leading-6 text-slate-500">{pageIntro(language, '约定：##会创建新卡片，---会手动分页。导入Markdown和图片时请一起选择。', 'Use ## to create a new card and --- for a manual page break. Select Markdown and local images together.')}</p>
        {message && <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs leading-5 text-emerald-200" role="status">{message}</p>}
      </section>
      <section className="markdown-xhs-preview-shell rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5">
        <div className="markdown-xhs-ui flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-200">{pageIntro(language, '小红书卡片预览', 'Xiaohongshu card preview')}</h2><ActionButton onClick={printCards} disabled={!cards.length}><Printer className="h-3.5 w-3.5" />{pageIntro(language, '打印/保存卡片', 'Print/save cards')}</ActionButton></div>
        <div className="markdown-xhs-ui mt-4 flex flex-wrap gap-2"><select name="xiaohongshu-theme" value={theme} onChange={event => setTheme(event.target.value as XhsTheme)} className="rounded-lg border border-[#263548] bg-[#111823] px-2.5 py-1.5 text-xs text-slate-300">{(Object.keys(xhsThemes) as XhsTheme[]).map(item => <option key={item} value={item}>{translateLegacyText(xhsThemes[item].label, language)}</option>)}</select><div className="flex rounded-lg border border-[#263548] p-1">{(Object.keys(xhsRatios) as XhsRatio[]).map(item => <button key={item} type="button" onClick={() => setRatio(item)} className={`px-2 py-1 text-xs ${ratio === item ? 'rounded bg-[#263548] text-white' : 'text-slate-500 hover:text-white'}`}>{item}</button>)}</div><select name="xiaohongshu-font" value={font} onChange={event => setFont(event.target.value as XhsFont)} className="rounded-lg border border-[#263548] bg-[#111823] px-2.5 py-1.5 text-xs text-slate-300"><option value="system">{pageIntro(language, '系统字体', 'Default Font')}</option><option value="sans">{pageIntro(language, '无衬线', 'Sans')}</option><option value="serif">{pageIntro(language, '衬线', 'Serif')}</option></select><select name="xiaohongshu-size" value={size} onChange={event => setSize(event.target.value as XhsSize)} className="rounded-lg border border-[#263548] bg-[#111823] px-2.5 py-1.5 text-xs text-slate-300"><option value="small">{pageIntro(language, '小字号', 'Small')}</option><option value="medium">{pageIntro(language, '中字号', '14px M')}</option><option value="large">{pageIntro(language, '大字号', 'Large')}</option></select></div>
        <div className="markdown-xhs-preview-list mt-4 max-h-[760px] space-y-6 overflow-auto rounded-xl bg-[#101a2d] p-4">{xhsHtml.length ? xhsHtml.map((cardHtml, index) => <article key={`${index}-${cardHtml.slice(0, 12)}`} className={`xhs-card xhs-theme-${theme} xhs-font-${size}`} style={{ aspectRatio: xhsRatios[ratio], backgroundColor: palette.background, color: palette.text, fontFamily, fontSize }} dangerouslySetInnerHTML={{ __html: cardHtml }} />) : <div className="flex min-h-64 items-center justify-center text-center text-sm leading-7 text-slate-500">{pageIntro(language, '输入Markdown后显示卡片。', 'Enter Markdown to preview cards.')}</div>}</div>
        <p className="markdown-xhs-ui mt-3 text-xs text-slate-500">{cards.length ? `${cards.length}${pageIntro(language, '张卡片', ' cards')}` : pageIntro(language, '尚未生成卡片', 'No cards yet')}</p>
      </section>
    </div>
    <div className="markdown-xhs-print-content">
      {xhsHtml.map((cardHtml, index) => <article key={`print-${index}-${cardHtml.slice(0, 12)}`} className={`xhs-card xhs-theme-${theme} xhs-font-${size}`} style={{ aspectRatio: xhsRatios[ratio], backgroundColor: palette.background, color: palette.text, fontFamily, fontSize }} dangerouslySetInnerHTML={{ __html: cardHtml }} />)}
    </div>
    <div className="markdown-xhs-ui">
      <ToolFooter language={language} sections={language === 'en' ? [{ title: 'Card breaks', text: 'Use ## headings or --- separators to control the card sequence. Without them, longer paragraphs are split into readable cards.' }, { title: 'Visual controls', text: 'Grid Paper, Warm, Minimal, Sunset, and Forest themes work with 3:4, 3:5, 4:5, and 1:1 ratios.' }, { title: 'Local print', text: 'Each visible card stays in the browser. Print the cards or choose Save as PDF in the browser print dialog.' }] : [{ title: '卡片分页', text: '使用##标题或---分隔线控制卡片顺序。没有分页标记时，较长内容会按段落拆分。' }, { title: '视觉设置', text: 'Grid Paper、Warm、Minimal、Sunset和Forest主题支持3:4、3:5、4:5和1:1比例。' }, { title: '本地打印', text: '卡片内容只在浏览器中处理。点击打印/保存卡片，然后在浏览器打印窗口中选择保存为PDF。' }]} />
      <ToolSeoContent slug="markdown-to-xiaohongshu" language={language} />
    </div>
  </div>;
}
