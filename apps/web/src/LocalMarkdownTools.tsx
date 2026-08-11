import React, { useState } from 'react';
import { Copy, Download, FileText } from 'lucide-react';
import type { Language } from './i18n';
import { getPageCopy, localeValue } from './publicLocalization';
import { ToolSeoContent } from './ToolSeoContent';
import { OnPageSeoContent } from './OnPageSeoContent';

const localizedObject = <T,>(language: Language, values: Record<Language, T>): T => values[language];

type LocalMarkdownKind = 'txt' | 'pdf' | 'word' | 'ppt' | 'excel';
type OfficeKind = Exclude<LocalMarkdownKind, 'txt' | 'pdf'>;

const pageInfo: Record<LocalMarkdownKind, { path: string; fallbackTitle: string; fallbackDescription: string }> = {
  txt: { path: '/txt-to-markdown', fallbackTitle: 'TXT转Markdown', fallbackDescription: '把纯文本整理成可以继续编辑和保存的Markdown。' },
  pdf: { path: '/pdf-to-markdown', fallbackTitle: 'PDF转Markdown', fallbackDescription: '在浏览器中处理文字型PDF，不上传文件。' },
  word: { path: '/word-to-markdown', fallbackTitle: 'Word转Markdown', fallbackDescription: '在浏览器中处理Word文档，不上传文件。' },
  ppt: { path: '/ppt-to-markdown', fallbackTitle: 'PPT转Markdown', fallbackDescription: '在浏览器中提取PPT和PPTX文字，不上传文件。' },
  excel: { path: '/excel-to-markdown', fallbackTitle: 'Excel转Markdown', fallbackDescription: '在浏览器中把Excel工作表转换为Markdown表格，不上传文件。' },
};

const pageTitle = (kind: LocalMarkdownKind, language: Language) => {
  const copy = getPageCopy(pageInfo[kind].path, language);
  return copy?.heading || copy?.title || pageInfo[kind].fallbackTitle;
};

const pageDescription = (kind: LocalMarkdownKind, language: Language) => {
  const copy = getPageCopy(pageInfo[kind].path, language);
  return copy?.description || pageInfo[kind].fallbackDescription;
};

const rowsToMarkdown = (rows: Array<Array<unknown>>) => {
  const width = Math.max(...rows.map(row => row.length), 0);
  if (!width) return '_Empty sheet_';
  const normalized = rows.map(row => Array.from({ length: width }, (_, index) => String(row[index] ?? '').replace(/\r?\n/g, '<br>').replace(/\|/g, '\\|').trim()));
  const header = normalized[0].map(value => value || ' ');
  const divider = header.map(() => '---');
  return [`| ${header.join(' | ')} |`, `| ${divider.join(' | ')} |`, ...normalized.slice(1).map(row => `| ${row.join(' | ')} |`)].join('\n');
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
      const rows = Array.from(node.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('th,td')).map(cell => String(cell.textContent || '').replace(/\|/g, '\\|').trim()));
      return `${rowsToMarkdown(rows)}\n\n`;
    }
    return content;
  };
  return render(root).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
};

const downloadMarkdown = (markdown: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([`${markdown}\n`], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function TextMarkdownTool({ language }: { language: Language }) {
  const labels = localizedObject(language, {
    zh: { eyebrow: '本地即时转换', intro: '文本只在当前浏览器处理，不上传服务器。', input: '输入TXT文本', placeholder: '把纯文本粘贴到这里...', result: 'Markdown结果', copy: '复制', copied: '已复制', download: '下载Markdown' },
    en: { eyebrow: 'Local instant conversion', intro: 'Text is processed in this browser and is not uploaded.', input: 'Input TXT text', placeholder: 'Paste plain text here...', result: 'Markdown result', copy: 'Copy', copied: 'Copied', download: 'Download Markdown' },
    ja: { eyebrow: 'ブラウザ内で即時変換', intro: 'テキストはこのブラウザ内で処理され、アップロードされません。', input: 'TXTテキスト入力', placeholder: 'プレーンテキストをここに貼り付け...', result: 'Markdownの結果', copy: 'コピー', copied: 'コピーしました', download: 'Markdownを保存' },
    es: { eyebrow: 'Conversión local instantánea', intro: 'El texto se procesa en este navegador y no se sube.', input: 'Texto TXT de entrada', placeholder: 'Pega aquí el texto plano...', result: 'Resultado Markdown', copy: 'Copiar', copied: 'Copiado', download: 'Descargar Markdown' },
    de: { eyebrow: 'Lokale Sofortkonvertierung', intro: 'Text wird in diesem Browser verarbeitet und nicht hochgeladen.', input: 'TXT-Eingabetext', placeholder: 'Reinen Text hier einfügen...', result: 'Markdown-Ergebnis', copy: 'Kopieren', copied: 'Kopiert', download: 'Markdown laden' },
  });
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const markdown = text.split(/\r?\n/).map(line => line.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const copy = async () => { if (!markdown) return; await navigator.clipboard.writeText(markdown); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div className="space-y-6 max-w-4xl mx-auto">
    <div><span className="text-xs font-semibold text-emerald-400">{labels.eyebrow}</span><h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{pageTitle('txt', language)}</h1><p className="text-sm text-slate-400 mt-3 leading-7">{pageDescription('txt', language)}</p></div>
    <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4"><label className="text-sm font-semibold text-white">{labels.input}</label><textarea value={text} onChange={event => setText(event.target.value)} placeholder={labels.placeholder} className="min-h-64 w-full resize-y rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500" /><div className="flex justify-end gap-2"><button onClick={() => void copy()} disabled={!markdown} className="inline-flex items-center gap-2 rounded-lg bg-[#1e293b] px-3 py-2 text-xs text-slate-200 disabled:opacity-40"><Copy className="w-4 h-4" />{copied ? labels.copied : labels.copy}</button><button onClick={() => downloadMarkdown(markdown, 'herdown-text.md')} disabled={!markdown} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white disabled:opacity-40"><Download className="w-4 h-4" />{labels.download}</button></div></div>
    {markdown && <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b]"><h2 className="font-bold text-white">{labels.result}</h2><pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown}</pre></div>}
  </div>;
}

function PdfMarkdownTool({ language }: { language: Language }) {
  const labels = localizedObject(language, {
    zh: { drop: '拖入或选择文字型PDF', local: '浏览器本地处理，文件留在你的电脑上。', result: 'Markdown结果', copy: '复制', copied: '已复制', download: '下载Markdown', invalid: '请选择PDF文件。', empty: '没有检测到可选文字。这看起来是扫描版或图片型PDF，网页端不支持处理，请使用本地Unlimited-OCRSkill。', done: '已在当前浏览器完成转换，PDF没有上传到服务器。', failed: 'PDF读取失败，请换一个文字型PDF重试。', scan: '扫描版或图片型PDF不支持网页端处理，请使用本地Unlimited-OCRSkill。' },
    en: { drop: 'Drop or choose a text-based PDF', local: 'Local browser processing. The file stays on your computer.', result: 'Markdown result', copy: 'Copy', copied: 'Copied', download: 'Download Markdown', invalid: 'Please choose a PDF file.', empty: 'No selectable text was found. This appears to be a scanned or image-only PDF. Use the local Unlimited-OCRSkill.', done: 'Converted in this browser. The PDF was not uploaded.', failed: 'The PDF could not be read. Try another text-based PDF.', scan: 'Scanned or image-only PDFs are not supported online. Use the local Unlimited-OCRSkill.' },
    ja: { drop: 'テキストPDFをドロップまたは選択', local: 'ブラウザ内で処理します。ファイルは端末に残ります。', result: 'Markdownの結果', copy: 'コピー', copied: 'コピーしました', download: 'Markdownを保存', invalid: 'PDFファイルを選択してください。', empty: '選択できる文字が見つかりません。ローカルのUnlimited-OCRSkillを使用してください。', done: 'このブラウザで変換しました。PDFはアップロードされていません。', failed: 'PDFを読み取れませんでした。', scan: 'スキャンPDFや画像PDFはオンラインに対応していません。ローカルのUnlimited-OCRSkillを使用してください。' },
    es: { drop: 'Suelta o elige un PDF de texto', local: 'Procesamiento local en el navegador. El archivo permanece en tu equipo.', result: 'Resultado Markdown', copy: 'Copiar', copied: 'Copiado', download: 'Descargar Markdown', invalid: 'Elige un archivo PDF.', empty: 'No se encontró texto seleccionable. Usa Unlimited-OCRSkill local.', done: 'Convertido en este navegador. El PDF no se ha subido.', failed: 'No se pudo leer el PDF.', scan: 'Los PDF escaneados o solo de imagen no se admiten en línea. Usa Unlimited-OCRSkill local.' },
    de: { drop: 'Text-PDF ablegen oder auswählen', local: 'Lokale Verarbeitung im Browser. Die Datei bleibt auf deinem Gerät.', result: 'Markdown-Ergebnis', copy: 'Kopieren', copied: 'Kopiert', download: 'Markdown laden', invalid: 'Wähle eine PDF-Datei aus.', empty: 'Es wurde kein markierbarer Text gefunden. Nutze das lokale Unlimited-OCRSkill.', done: 'In diesem Browser konvertiert. Die PDF wurde nicht hochgeladen.', failed: 'Die PDF konnte nicht gelesen werden.', scan: 'Gescannte oder bildbasierte PDFs werden online nicht unterstützt. Nutze das lokale Unlimited-OCRSkill.' },
  });
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setFile(selectedFile); setMarkdown(''); setMessage('');
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) { setMessage(labels.invalid); return; }
    setLoading(true);
    try {
      const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.mjs?url')]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await selectedFile.arrayBuffer()) }).promise;
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const items = (await page.getTextContent()).items as Array<{ str?: string; hasEOL?: boolean }>;
        const pageText = items.map((item, index) => { const value = item.str || ''; const next = items[index + 1]?.str || ''; if (!value || item.hasEOL) return `${value}\n`; const cjk = /[\u4e00-\u9fff]$/.test(value) && /^[\u4e00-\u9fff]/.test(next); const punctuation = /^[，。！？；：、）》】」』”’]/.test(next); return `${value}${cjk || punctuation ? '' : ' '}`; }).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        if (pageText) pages.push(`## ${language === 'en' ? 'Page ' : language === 'ja' ? 'ページ' : language === 'es' ? 'Página ' : language === 'de' ? 'Seite ' : '第'}${pageNumber}${language === 'zh' ? '页' : ''}\n\n${pageText}`);
      }
      if (!pages.length) { setMessage(labels.empty); return; }
      const title = selectedFile.name.replace(/\.pdf$/i, '').replace(/"/g, '\\"');
      setMarkdown(`---\ntitle: "${title}"\nsource_file: "${selectedFile.name.replace(/"/g, '\\"')}"\nfile_type: "text-pdf"\npage_count: ${pdf.numPages}\n---\n\n# ${title}\n\n${pages.join('\n\n')}`);
      setMessage(labels.done);
    } catch (error) { console.error('PDF conversion failed', error); setMessage(labels.failed); } finally { setLoading(false); }
  };
  const copy = async () => { if (!markdown) return; await navigator.clipboard.writeText(markdown); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <div className="space-y-6 max-w-5xl mx-auto"><div className="max-w-3xl"><span className="text-xs font-semibold text-emerald-400">{localeValue(language, { zh: '浏览器在线转换，仅支持文字型PDF', en: 'Browser conversion, text PDFs only', ja: 'ブラウザ内変換、テキストPDFのみ対応', es: 'Conversión en el navegador, solo PDF de texto', de: 'Browser-Konvertierung, nur Text-PDFs' })}</span><h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{pageTitle('pdf', language)}</h1><p className="text-sm text-slate-400 mt-3 leading-7">{pageDescription('pdf', language)}</p></div><div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-5"><label onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void handleFile(event.dataTransfer.files?.[0]); }} className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/40 bg-[#090d12] px-5 text-center"><FileText className="w-10 h-10 text-emerald-400 mb-3" /><span className="text-sm text-slate-200">{file?.name || labels.drop}</span><span className="text-xs leading-6 text-slate-500 mt-2">{labels.local}</span><input type="file" accept="application/pdf,.pdf" className="hidden" onChange={event => void handleFile(event.target.files?.[0])} /></label><div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-7 text-amber-100">{labels.scan}</div>{loading && <div className="text-sm text-slate-400">{language === 'en' ? 'Extracting text...' : '正在提取文字...'}</div>}{message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-7 text-emerald-200">{message}</div>}</div>{markdown && <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4"><div className="flex items-center justify-between gap-3"><span className="font-bold text-white">{labels.result}</span><div className="flex gap-2"><button onClick={() => void copy()} className="px-3 py-1.5 rounded-lg bg-[#1e293b] text-xs text-slate-200">{copied ? labels.copied : labels.copy}</button><button onClick={() => downloadMarkdown(markdown, `${file?.name.replace(/\.pdf$/i, '') || 'herdown-pdf'}.md`)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-xs text-white">{labels.download}</button></div></div><pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown}</pre></div>}<ToolSeoContent slug="pdf-to-markdown" language={language} /></div>;
}

const officeConfig: Record<OfficeKind, { extension: string; accept: string; name: string }> = {
  word: { extension: 'docx', accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx', name: 'Word' },
  ppt: { extension: 'pptx', accept: 'application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx', name: 'PPTX' },
  excel: { extension: 'xlsx', accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx', name: 'Excel' },
};

const pptSlideMarkdown = async (file: File, language: Language) => {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/slide(\d+)\.xml$/)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml$/)?.[1] || 0));
  const slides: string[] = [];
  for (const [index, slideFile] of slideFiles.entries()) {
    const xml = await zip.file(slideFile)?.async('string');
    if (!xml) continue;
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const paragraphs = Array.from(document.getElementsByTagName('*')).filter(element => element.localName === 'p').map(paragraph => Array.from(paragraph.getElementsByTagName('*')).filter(element => element.localName === 't').map(element => element.textContent || '').join('')).map(value => value.trim()).filter(Boolean);
    if (paragraphs.length) slides.push(`## ${language === 'en' ? 'Slide ' : language === 'ja' ? 'スライド' : language === 'es' ? 'Diapositiva ' : language === 'de' ? 'Folie ' : '第'}${index + 1}${language === 'zh' ? '页' : ''}\n\n${paragraphs.join('\n\n')}`);
  }
  return slides;
};

function OfficeMarkdownTool({ kind, language }: { kind: OfficeKind; language: Language }) {
  const config = officeConfig[kind];
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setFile(selectedFile); setMarkdown(''); setMessage('');
    if (!selectedFile.name.toLowerCase().endsWith(`.${config.extension}`)) { setMessage(localeValue(language, { zh: `请选择${config.extension.toUpperCase()}文件。`, en: `Please choose a ${config.extension.toUpperCase()} file.`, ja: `${config.extension.toUpperCase()}ファイルを選択してください。`, es: `Elige un archivo ${config.extension.toUpperCase()}.`, de: `Wähle eine ${config.extension.toUpperCase()}-Datei aus.` })); return; }
    setLoading(true);
    try {
      let body = '';
      if (kind === 'word') {
        // @ts-expect-error The browser bundle does not ship TypeScript declarations.
        const mammothModule = await import('mammoth/mammoth.browser.js');
        const mammoth = (mammothModule.default || mammothModule) as { convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
        body = htmlToMarkdown((await mammoth.convertToHtml({ arrayBuffer: await selectedFile.arrayBuffer() })).value);
      } else if (kind === 'excel') {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array', cellDates: true });
        body = workbook.SheetNames.map(sheetName => { const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' }) as Array<Array<unknown>>; return `## ${sheetName}\n\n${rowsToMarkdown(rows)}`; }).join('\n\n');
      } else {
        body = (await pptSlideMarkdown(selectedFile, language)).join('\n\n');
      }
      if (!body.trim()) { setMessage(localeValue(language, { zh: '这个文件中没有检测到可读取的内容。', en: 'No readable content was found in this file.', ja: '読み取れる内容が見つかりませんでした。', es: 'No se encontró contenido legible.', de: 'Es wurde kein lesbarer Inhalt gefunden.' })); return; }
      const title = selectedFile.name.replace(new RegExp(`\\.${config.extension}$`, 'i'), '').replace(/"/g, '\\"');
      setMarkdown(`---\ntitle: "${title}"\nsource_file: "${selectedFile.name.replace(/"/g, '\\"')}"\nfile_type: "${config.extension}"\n---\n\n# ${title}\n\n${body}`);
      setMessage(localeValue(language, { zh: '已在当前浏览器完成转换，文件没有上传到服务器。', en: 'Converted in this browser. The file was not uploaded.', ja: 'このブラウザで変換しました。ファイルはアップロードされていません。', es: 'Convertido en este navegador. El archivo no se ha subido.', de: 'In diesem Browser konvertiert. Die Datei wurde nicht hochgeladen.' }));
    } catch (error) { console.error(`${config.extension} conversion failed`, error); setMessage(localeValue(language, { zh: '文件读取失败，请换一个文件重试。', en: 'The file could not be read. Try another file.', ja: 'ファイルを読み取れませんでした。', es: 'No se pudo leer el archivo.', de: 'Die Datei konnte nicht gelesen werden.' })); } finally { setLoading(false); }
  };
  return <div className="space-y-6 max-w-5xl mx-auto"><div className="max-w-3xl"><span className="text-xs font-semibold text-emerald-400">{localeValue(language, { zh: `浏览器在线转换，支持${config.extension.toUpperCase()}文件`, en: `Browser conversion, ${config.extension.toUpperCase()} files`, ja: `ブラウザ内変換、${config.extension.toUpperCase()}ファイル`, es: `Conversión en el navegador, archivos ${config.extension.toUpperCase()}`, de: `Browser-Konvertierung, ${config.extension.toUpperCase()}-Dateien` })}</span><h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">{pageTitle(kind, language)}</h1><p className="text-sm text-slate-400 mt-3 leading-7">{pageDescription(kind, language)}</p></div><div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-5"><label onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void handleFile(event.dataTransfer.files?.[0]); }} className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500/40 bg-[#090d12] px-5 text-center"><FileText className="w-10 h-10 text-emerald-400 mb-3" /><span className="text-sm text-slate-200">{file?.name || localeValue(language, { zh: `拖入或选择${config.extension.toUpperCase()}文件`, en: `Drop or choose a ${config.extension.toUpperCase()} file`, ja: `${config.name}ファイルをドロップまたは選択`, es: `Suelta o elige un archivo ${config.name}`, de: `${config.name}-Datei ablegen oder auswählen` })}</span><span className="text-xs leading-6 text-slate-500 mt-2">{localeValue(language, { zh: '浏览器本地处理，文件留在你的电脑上。', en: 'Local browser processing. The file stays on your computer.', ja: 'ブラウザ内で処理します。ファイルは端末に残ります。', es: 'Procesamiento local en el navegador. El archivo permanece en tu equipo.', de: 'Lokale Verarbeitung im Browser. Die Datei bleibt auf deinem Gerät.' })}</span><input type="file" accept={config.accept} className="hidden" onChange={event => void handleFile(event.target.files?.[0])} /></label><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-7 text-emerald-100">{kind === 'ppt' ? localeValue(language, { zh: '幻灯片文字会在浏览器本地提取，图片、动画和视觉位置不会重建。', en: 'Slide text is extracted locally. Images, animations, and visual positioning are not reconstructed.', ja: 'スライドの文字をブラウザ内で抽出します。画像、アニメーション、配置は再現されません。', es: 'El texto de las diapositivas se extrae localmente. No se reconstruyen imágenes, animaciones ni posiciones visuales.', de: 'Folientext wird lokal extrahiert. Bilder, Animationen und visuelle Positionen werden nicht rekonstruiert.' }) : kind === 'excel' ? localeValue(language, { zh: '各个工作表会在浏览器本地转换为Markdown表格。', en: 'Worksheets are converted into Markdown tables locally.', ja: '各ワークシートをブラウザ内でMarkdown表に変換します。', es: 'Las hojas se convierten localmente en tablas Markdown.', de: 'Arbeitsblätter werden lokal in Markdown-Tabellen umgewandelt.' }) : localeValue(language, { zh: 'Word正文、标题、列表、链接和表格会在浏览器本地转换。', en: 'Word text, headings, lists, links, and tables are converted locally.', ja: 'Wordの本文、見出し、リスト、リンク、表をブラウザ内で変換します。', es: 'El texto, los títulos, las listas, los enlaces y las tablas de Word se convierten localmente.', de: 'Word-Text, Überschriften, Listen, Links und Tabellen werden lokal konvertiert.' })}</div>{loading && <div className="text-sm text-slate-400">{language === 'en' ? 'Extracting content...' : '正在提取内容...'}</div>}{message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-7 text-emerald-200">{message}</div>}</div>{markdown && <div className="p-6 rounded-2xl bg-[#0f1722] border border-[#1e293b] space-y-4"><div className="flex items-center justify-between gap-3"><span className="font-bold text-white">{language === 'en' ? 'Markdown result' : 'Markdown结果'}</span><button onClick={() => downloadMarkdown(markdown, `${file?.name.replace(new RegExp(`\\.${config.extension}$`, 'i'), '') || 'herdown-document'}.md`)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white"><Download className="w-4 h-4" />{language === 'en' ? 'Download Markdown' : '下载Markdown'}</button></div><pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-[#090d12] border border-[#1e293b] p-4 text-sm leading-7 text-emerald-200">{markdown}</pre></div>}</div>;
}

export function LocalMarkdownToolsPage({ kind, language }: { kind: LocalMarkdownKind; language: Language }) {
  if (kind === 'txt') return <TextMarkdownTool language={language} />;
  if (kind === 'pdf') return <PdfMarkdownTool language={language} />;
  return <><OfficeMarkdownTool kind={kind} language={language} />{kind === 'excel' && <OnPageSeoContent page="excel-to-markdown" language={language} />}</>;
}
