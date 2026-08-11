import React, { useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Document, ExternalHyperlink, HeadingLevel, Paragraph, Table, TextRun } from 'docx';
import { AlertCircle, Check, Copy, Download, FileDown, FileText, Printer, RefreshCw, Table2, Upload } from 'lucide-react';
import { Language } from './i18n';
import { ToolSeoContent } from './ToolSeoContent';

type OutputKind = 'html' | 'pdf' | 'word' | 'csv';

type DocxRuntime = typeof import('docx');

const SAMPLE_MARKDOWN = `# Quarterly update

This Markdown can become a web page, a PDF, a Word document, or a CSV table.

## Highlights

- Clean headings and paragraphs
- Links, code, and tables
- Local browser processing

| Metric | Value | Change |
| :--- | ---: | :---: |
| Active users | 1,284 | +18% |
| Conversion | 42.6% | +6.2% |

\`npm run build\` keeps the workflow reproducible.`;

type OutputCopy = { title: string; intro: string; eyebrow: string; input: string; preview: string; action: string; file: string };

const pageCopy: Record<OutputKind, Record<Language, OutputCopy>> = {
  html: {
    zh: { title: 'Markdown转HTML', intro: '把Markdown转换为可直接发布、保存和继续编辑的独立HTML文件。', eyebrow: '本地即时转换', input: 'Markdown输入', preview: 'HTML预览', action: '下载HTML', file: 'Markdown转HTML.html' },
    en: { title: 'Markdown to HTML', intro: 'Turn Markdown into a standalone HTML file that is ready to publish, save, or edit.', eyebrow: 'Local instant conversion', input: 'Markdown input', preview: 'HTML preview', action: 'Download HTML', file: 'markdown-to-html.html' },
    ja: { title: 'MarkdownからHTMLへ', intro: 'Markdownを公開、保存、編集に使える独立したHTMLファイルに変換します。', eyebrow: 'ブラウザ内で即時変換', input: 'Markdown入力', preview: 'HTMLプレビュー', action: 'HTMLをダウンロード', file: 'markdown-to-html.html' },
    es: { title: 'Markdown a HTML', intro: 'Convierte Markdown en un archivo HTML independiente listo para publicar, guardar o editar.', eyebrow: 'Conversión local instantánea', input: 'Entrada Markdown', preview: 'Vista previa HTML', action: 'Descargar HTML', file: 'markdown-to-html.html' },
    de: { title: 'Markdown zu HTML', intro: 'Markdown in eine eigenständige HTML-Datei zum Veröffentlichen, Speichern oder Bearbeiten umwandeln.', eyebrow: 'Lokale Sofortkonvertierung', input: 'Markdown-Eingabe', preview: 'HTML-Vorschau', action: 'HTML herunterladen', file: 'markdown-to-html.html' },
  },
  pdf: {
    zh: { title: 'Markdown转PDF', intro: '把Markdown排版为适合打印的A4文档，保留标题、段落、列表、表格、代码和链接。', eyebrow: '本地即时转换', input: 'Markdown输入', preview: '打印预览', action: '打印/保存PDF', file: 'Markdown转PDF.pdf' },
    en: { title: 'Markdown to PDF', intro: 'Format Markdown as a print-ready A4 document while preserving headings, paragraphs, lists, tables, code, and links.', eyebrow: 'Local instant conversion', input: 'Markdown input', preview: 'Print preview', action: 'Print/Save PDF', file: 'markdown-to-pdf.pdf' },
    ja: { title: 'MarkdownからPDFへ', intro: '見出し、段落、リスト、表、コード、リンクを保ったままMarkdownを印刷向けのA4文書に整えます。', eyebrow: 'ブラウザ内で即時変換', input: 'Markdown入力', preview: '印刷プレビュー', action: '印刷またはPDF保存', file: 'markdown-to-pdf.pdf' },
    es: { title: 'Markdown a PDF', intro: 'Da formato a Markdown como documento A4 listo para imprimir, conservando títulos, párrafos, listas, tablas, código y enlaces.', eyebrow: 'Conversión local instantánea', input: 'Entrada Markdown', preview: 'Vista previa de impresión', action: 'Imprimir o guardar PDF', file: 'markdown-to-pdf.pdf' },
    de: { title: 'Markdown zu PDF', intro: 'Markdown als druckfertiges A4-Dokument formatieren und Überschriften, Absätze, Listen, Tabellen, Code und Links erhalten.', eyebrow: 'Lokale Sofortkonvertierung', input: 'Markdown-Eingabe', preview: 'Druckvorschau', action: 'PDF drucken oder speichern', file: 'markdown-to-pdf.pdf' },
  },
  word: {
    zh: { title: 'Markdown转Word', intro: '把Markdown转换为可继续编辑的DOCX，适合交付、审阅和协作。', eyebrow: '本地即时转换', input: 'Markdown输入', preview: 'Word结构预览', action: '下载Word', file: 'Markdown转Word.docx' },
    en: { title: 'Markdown to Word', intro: 'Turn Markdown into an editable DOCX file for delivery, review, and collaboration.', eyebrow: 'Local instant conversion', input: 'Markdown input', preview: 'Word structure preview', action: 'Download Word', file: 'markdown-to-word.docx' },
    ja: { title: 'MarkdownからWordへ', intro: 'Markdownを納品、レビュー、共同編集に使える編集可能なDOCXに変換します。', eyebrow: 'ブラウザ内で即時変換', input: 'Markdown入力', preview: 'Word構造プレビュー', action: 'Wordをダウンロード', file: 'markdown-to-word.docx' },
    es: { title: 'Markdown a Word', intro: 'Convierte Markdown en un archivo DOCX editable para entregar, revisar y colaborar.', eyebrow: 'Conversión local instantánea', input: 'Entrada Markdown', preview: 'Vista previa de Word', action: 'Descargar Word', file: 'markdown-to-word.docx' },
    de: { title: 'Markdown zu Word', intro: 'Markdown in eine bearbeitbare DOCX-Datei für Übergabe, Prüfung und Zusammenarbeit umwandeln.', eyebrow: 'Lokale Sofortkonvertierung', input: 'Markdown-Eingabe', preview: 'Word-Strukturvorschau', action: 'Word herunterladen', file: 'markdown-to-word.docx' },
  },
  csv: {
    zh: { title: 'Markdown转CSV', intro: '提取Markdown表格并下载为CSV，适合继续在Excel或数据工具中处理。', eyebrow: '本地即时转换', input: 'Markdown表格输入', preview: 'CSV预览', action: '下载CSV', file: 'Markdown转CSV.csv' },
    en: { title: 'Markdown to CSV', intro: 'Extract a Markdown table and download it as CSV for Excel or data tools.', eyebrow: 'Local instant conversion', input: 'Markdown table input', preview: 'CSV preview', action: 'Download CSV', file: 'markdown-to-csv.csv' },
    ja: { title: 'MarkdownからCSVへ', intro: 'Markdown表を抽出してCSVとしてダウンロードし、Excelやデータツールで続けて使えます。', eyebrow: 'ブラウザ内で即時変換', input: 'Markdown表の入力', preview: 'CSVプレビュー', action: 'CSVをダウンロード', file: 'markdown-to-csv.csv' },
    es: { title: 'Markdown a CSV', intro: 'Extrae una tabla Markdown y descárgala como CSV para Excel u otras herramientas de datos.', eyebrow: 'Conversión local instantánea', input: 'Entrada de tabla Markdown', preview: 'Vista previa CSV', action: 'Descargar CSV', file: 'markdown-to-csv.csv' },
    de: { title: 'Markdown zu CSV', intro: 'Eine Markdown-Tabelle extrahieren und als CSV für Excel oder Datentools herunterladen.', eyebrow: 'Lokale Sofortkonvertierung', input: 'Markdown-Tabelleneingabe', preview: 'CSV-Vorschau', action: 'CSV herunterladen', file: 'markdown-to-csv.csv' },
  },
};

const getPageCopy = (kind: OutputKind, language: Language): OutputCopy => pageCopy[kind][language];

const escapeAttribute = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const renderMarkdownHtml = (markdown: string): string => {
  if (!markdown.trim()) return '';
  const html = marked.parse(markdown, { gfm: true, breaks: false }) as string;
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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

const baseName = (value: string): string => value.replace(/\.(md|markdown|txt)$/i, '').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'herdown-markdown';

const htmlDocument = (title: string, body: string, language: Language): string => `<!doctype html>
<html lang="${language === 'zh' ? 'zh-CN' : language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeAttribute(title)}</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { max-width: 860px; margin: 0 auto; padding: 48px 28px; color: #17202a; line-height: 1.7; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.5em 0 .55em; }
    h1 { margin-top: 0; font-size: 2.1rem; }
    p, ul, ol, blockquote, pre, table { margin: 1em 0; }
    a { color: #087f5b; }
    blockquote { border-left: 4px solid #73c9a8; padding-left: 16px; color: #52616b; }
    code { background: #eef3f1; padding: .12em .3em; border-radius: 4px; }
    pre { background: #17202a; color: #f3f7f6; padding: 16px; overflow: auto; border-radius: 8px; }
    pre code { background: transparent; padding: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cfd9d6; padding: 8px 10px; text-align: left; }
    th { background: #edf4f1; }
    img { max-width: 100%; height: auto; }
    @media print { body { padding: 0; } pre, table, blockquote { break-inside: avoid; } }
  </style>
</head>
<body>${body}</body>
</html>`;

const rowCells = (line: string): string[] => {
  const placeholder = '\uE000';
  const normalized = line.trim().replace(/^\|/, '').replace(/\|$/, '').replace(/\\\|/g, placeholder);
  return normalized.split('|').map(cell => cell.trim().replaceAll(placeholder, '|'));
};

const isSeparatorRow = (cells: string[]): boolean => cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell.trim()));

export type MarkdownTable = { headers: string[]; rows: string[][] };

export const extractMarkdownTables = (markdown: string): MarkdownTable[] => {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const tables: MarkdownTable[] = [];
  let index = 0;
  while (index < lines.length - 1) {
    if (!lines[index].includes('|') || !lines[index + 1].includes('|')) {
      index += 1;
      continue;
    }
    const headers = rowCells(lines[index]);
    const separator = rowCells(lines[index + 1]);
    if (headers.length < 2 || !isSeparatorRow(separator)) {
      index += 1;
      continue;
    }
    const rows: string[][] = [];
    index += 2;
    while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
      rows.push(rowCells(lines[index]));
      index += 1;
    }
    tables.push({ headers, rows });
  }
  return tables;
};

const csvEscape = (value: string): string => /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

export const tableToCsv = (table: MarkdownTable | undefined): string => {
  if (!table) return '';
  const width = Math.max(table.headers.length, ...table.rows.map(row => row.length), 0);
  const normalize = (row: string[]) => Array.from({ length: width }, (_, index) => csvEscape(row[index] || '')).join(',');
  return [normalize(table.headers), ...table.rows.map(normalize)].join('\r\n');
};

const docxRuns = (node: Node, docx: DocxRuntime, style: { bold?: boolean; italics?: boolean; strike?: boolean; code?: boolean } = {}): Array<TextRun | ExternalHyperlink> => {
  if (node.nodeType === Node.TEXT_NODE) {
    return [new docx.TextRun({ text: node.textContent || '', bold: style.bold, italics: style.italics, strike: style.strike, font: style.code ? 'Courier New' : undefined })];
  }
  if (!(node instanceof HTMLElement)) return [];
  const tag = node.tagName.toLowerCase();
  if (tag === 'br') return [new docx.TextRun({ break: 1 })];
  if (tag === 'a' && node.getAttribute('href')) {
    return [new docx.ExternalHyperlink({ link: node.getAttribute('href') || '', children: [new docx.TextRun({ text: node.textContent || '', style: 'Hyperlink' })] })];
  }
  if (tag === 'img') return [new docx.TextRun({ text: node.getAttribute('alt') || '[image]' })];
  const nextStyle = {
    bold: style.bold || tag === 'strong' || tag === 'b',
    italics: style.italics || tag === 'em' || tag === 'i',
    strike: style.strike || tag === 'del' || tag === 's',
    code: style.code || tag === 'code',
  };
  return Array.from(node.childNodes).flatMap(child => docxRuns(child, docx, nextStyle));
};

type DocxHeading = DocxRuntime['HeadingLevel'][keyof DocxRuntime['HeadingLevel']];

const docxParagraph = (element: HTMLElement, docx: DocxRuntime, heading?: DocxHeading) => new docx.Paragraph({
  ...(heading ? { heading } : {}),
  children: docxRuns(element, docx),
});

const docxBlocks = (node: Node, docx: DocxRuntime): Array<Paragraph | Table> => {
  if (!(node instanceof HTMLElement)) return [];
  const tag = node.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) {
    const heading = tag === 'h1' ? docx.HeadingLevel.HEADING_1 : tag === 'h2' ? docx.HeadingLevel.HEADING_2 : tag === 'h3' ? docx.HeadingLevel.HEADING_3 : tag === 'h4' ? docx.HeadingLevel.HEADING_4 : tag === 'h5' ? docx.HeadingLevel.HEADING_5 : docx.HeadingLevel.HEADING_6;
    return [docxParagraph(node, docx, heading)];
  }
  if (tag === 'p') return [docxParagraph(node, docx)];
  if (tag === 'pre') {
    return [new docx.Paragraph({ children: [new docx.TextRun({ text: node.textContent || '', font: 'Courier New', size: 19 })], shading: { fill: '17202A' } })];
  }
  if (tag === 'blockquote') {
    return [new docx.Paragraph({ children: [new docx.TextRun({ text: node.textContent || '', italics: true })], border: { left: { color: '52D9AD', style: docx.BorderStyle.SINGLE, size: 8, space: 8 } } })];
  }
  if (tag === 'ul' || tag === 'ol') {
    return Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li').map(item => new docx.Paragraph({ children: docxRuns(item, docx), bullet: tag === 'ul' ? { level: 0 } : undefined, numbering: tag === 'ol' ? { reference: 'markdown-numbered', level: 0 } : undefined }));
  }
  if (tag === 'table') {
    const rows = Array.from(node.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr'));
    if (!rows.length) return [];
    return [new docx.Table({ width: { size: 100, type: docx.WidthType.PERCENTAGE }, rows: rows.map(row => new docx.TableRow({ children: Array.from(row.children).map(cell => new docx.TableCell({ children: [new docx.Paragraph({ children: docxRuns(cell, docx) })] })) })) })];
  }
  if (tag === 'hr') return [new docx.Paragraph({ border: { bottom: { color: 'CBD5E1', style: docx.BorderStyle.SINGLE, size: 6, space: 1 } } })];
  return Array.from(node.childNodes).flatMap(child => docxBlocks(child, docx));
};

const markdownToDocx = (html: string, docx: DocxRuntime): Document => {
  const parsed = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const children = Array.from(parsed.body.childNodes).flatMap(node => docxBlocks(node, docx));
  return new docx.Document({
    numbering: { config: [{ reference: 'markdown-numbered', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: docx.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
    sections: [{ properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } }, children: children.length ? children : [new docx.Paragraph('')] }],
  });
};

const PreviewSurface = React.forwardRef<HTMLElement, { html: string; className?: string; emptyText: string }>(({ html, className = '', emptyText }, ref) => (
  <article ref={ref} className={`markdown-preview prose prose-invert max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: html || `<p class="empty-preview">${emptyText}</p>` }} />
));
PreviewSurface.displayName = 'PreviewSurface';

const MarkdownInput = ({ value, onChange, language, onFile }: { value: string; onChange: (value: string) => void; language: Language; onFile: (file: File) => void }) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-sm font-semibold text-slate-200">{language === 'zh' ? 'Markdown输入' : language === 'en' ? 'Markdown input' : language === 'ja' ? 'Markdown入力' : language === 'es' ? 'Entrada Markdown' : 'Markdown-Eingabe'}</div>
      <div className="flex items-center gap-2">
        <label htmlFor="markdown-output-file" className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#1e293b] px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white">
          <Upload className="h-3.5 w-3.5" />{language === 'zh' ? '打开.md文件' : language === 'en' ? 'Open .md' : language === 'ja' ? '.mdを開く' : language === 'es' ? 'Abrir .md' : '.md öffnen'}
        </label>
        <input id="markdown-output-file" name="markdown-file" className="sr-only" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={event => { const file = event.target.files?.[0]; if (file) onFile(file); event.currentTarget.value = ''; }} />
      </div>
    </div>
    <textarea id="markdown-output-input" name="markdown" value={value} onChange={event => onChange(event.target.value)} spellCheck={false} rows={18} className="w-full resize-y rounded-xl border border-[#1e293b] bg-[#090d12] p-4 font-mono text-sm leading-6 text-slate-200 outline-none transition focus:border-emerald-500/70" aria-label={language === 'zh' ? 'Markdown输入' : language === 'en' ? 'Markdown input' : language === 'ja' ? 'Markdown入力' : language === 'es' ? 'Entrada Markdown' : 'Markdown-Eingabe'} />
  </div>
);

const OutputToolbar = ({ kind, language, canDownload, busy, copied, onCopy, onDownload, onSample, onClear }: { kind: OutputKind; language: Language; canDownload: boolean; busy: boolean; copied: boolean; onCopy: () => void; onDownload: () => void; onSample: () => void; onClear: () => void }) => {
  const copyLabel = language === 'zh' ? '复制' : language === 'en' ? 'Copy' : language === 'ja' ? 'コピー' : language === 'es' ? 'Copiar' : 'Kopieren';
  const clearLabel = language === 'zh' ? '清空' : language === 'en' ? 'Clear' : language === 'ja' ? 'クリア' : language === 'es' ? 'Limpiar' : 'Leeren';
  const sampleLabel = language === 'zh' ? '载入示例' : language === 'en' ? 'Load sample' : language === 'ja' ? 'サンプルを読み込む' : language === 'es' ? 'Cargar ejemplo' : 'Beispiel laden';
  const config = getPageCopy(kind, language);
  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" onClick={onSample} className="rounded-lg border border-[#1e293b] px-3 py-2 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-white">{sampleLabel}</button>
    <button type="button" onClick={onClear} className="rounded-lg border border-[#1e293b] px-3 py-2 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-white">{clearLabel}</button>
    <button type="button" onClick={onCopy} disabled={!canDownload || busy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 py-2 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Copy className="h-3.5 w-3.5" />{copied ? (language === 'zh' ? '已复制' : language === 'en' ? 'Copied' : language === 'ja' ? 'コピーしました' : language === 'es' ? 'Copiado' : 'Kopiert') : copyLabel}</button>
    <button type="button" onClick={onDownload} disabled={!canDownload || busy} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : kind === 'pdf' ? <Printer className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}{config.action}</button>
  </div>;
};

export function MarkdownOutputPage({ kind, language }: { kind: OutputKind; language: Language }) {
  const copy = getPageCopy(kind, language);
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [sourceName, setSourceName] = useState('herdown-markdown');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLElement>(null);
  const html = useMemo(() => renderMarkdownHtml(markdown), [markdown]);
  const tables = useMemo(() => extractMarkdownTables(markdown), [markdown]);
  const csv = useMemo(() => tableToCsv(tables[0]), [tables]);
  const outputText = kind === 'csv' ? csv : html;
  const canDownload = Boolean(markdown.trim() && (kind !== 'csv' || csv));

  const handleFile = async (file: File) => {
    setMarkdown(await file.text());
    setSourceName(baseName(file.name));
    setMessage(language === 'zh' ? `已在本地打开${file.name}。` : language === 'en' ? `${file.name} loaded locally.` : language === 'ja' ? `${file.name}をローカルで開きました。` : language === 'es' ? `${file.name} se abrió localmente.` : `${file.name} wurde lokal geöffnet.`);
  };

  const handleCopy = async () => {
    const ok = await copyText(outputText);
    setCopied(ok);
    setMessage(ok ? (language === 'zh' ? '结果已复制。' : language === 'en' ? 'Output copied.' : language === 'ja' ? '結果をコピーしました。' : language === 'es' ? 'Resultado copiado.' : 'Ergebnis kopiert.') : (language === 'zh' ? '浏览器没有允许复制，请手动选择结果。' : language === 'en' ? 'Copy was blocked by the browser.' : language === 'ja' ? 'ブラウザがコピーを許可しませんでした。結果を手動で選択してください。' : language === 'es' ? 'El navegador bloqueó la copia. Selecciona el resultado manualmente.' : 'Der Browser hat das Kopieren blockiert. Wähle das Ergebnis manuell aus.'));
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleDownload = async () => {
    if (!canDownload) return;
    setBusy(true);
    setMessage('');
    try {
      if (kind === 'html') {
        downloadBlob(new Blob([htmlDocument(sourceName, html, language)], { type: 'text/html;charset=utf-8' }), `${sourceName}.html`);
      } else if (kind === 'csv') {
        downloadBlob(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), `${sourceName}.csv`);
      } else if (kind === 'word') {
        const docx = await import('docx');
        const doc = markdownToDocx(html, docx);
        downloadBlob(await docx.Packer.toBlob(doc), `${sourceName}.docx`);
      } else if (kind === 'pdf') {
        if (!previewRef.current) throw new Error(language === 'zh' ? 'PDF预览还没有准备好。' : language === 'en' ? 'The PDF preview is not ready.' : language === 'ja' ? 'PDFプレビューの準備ができていません。' : language === 'es' ? 'La vista previa del PDF aún no está lista.' : 'Die PDF-Vorschau ist noch nicht bereit.');
        window.print();
      }
      setMessage(kind === 'pdf'
        ? (language === 'zh' ? '已打开打印窗口，请选择“保存为PDF”。' : language === 'en' ? 'The print dialog is open. Choose “Save as PDF”.' : language === 'ja' ? '印刷画面が開きました。「PDFとして保存」を選択してください。' : language === 'es' ? 'Se abrió la ventana de impresión. Elige “Guardar como PDF”.' : 'Der Druckdialog ist geöffnet. Wähle „Als PDF speichern“.')
        : (language === 'zh' ? `${copy.action}已生成。` : language === 'en' ? `${copy.action} ready.` : language === 'ja' ? `${copy.action}を生成しました。` : language === 'es' ? `${copy.action} listo.` : `${copy.action} ist bereit.`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (language === 'zh' ? '导出失败，请重试。' : language === 'en' ? 'The export failed. Try again.' : language === 'ja' ? 'エクスポートに失敗しました。もう一度お試しください。' : language === 'es' ? 'La exportación falló. Inténtalo de nuevo.' : 'Der Export ist fehlgeschlagen. Versuche es erneut.'));
    } finally {
      setBusy(false);
    }
  };

  return <main className={`mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 ${kind === 'pdf' ? 'markdown-output-pdf-page' : ''}`}>
    <div className={`max-w-3xl ${kind === 'pdf' ? 'markdown-output-pdf-ui' : ''}`}>
      <span className="text-xs font-semibold text-emerald-400">{copy.eyebrow}</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{copy.intro} {language === 'zh' ? 'Markdown只在当前浏览器处理，不上传到服务器。' : language === 'en' ? 'Your Markdown stays in this browser.' : language === 'ja' ? 'Markdownはこのブラウザ内だけで処理されます。' : language === 'es' ? 'Markdown se procesa solo en este navegador.' : 'Markdown wird nur in diesem Browser verarbeitet.'}</p>
    </div>

    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className={`rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5 ${kind === 'pdf' ? 'markdown-output-pdf-ui' : ''}`}>
        <MarkdownInput value={markdown} onChange={value => { setMarkdown(value); setMessage(''); }} language={language} onFile={file => void handleFile(file)} />
        {kind === 'csv' && <p className="mt-3 text-xs leading-6 text-slate-500">{language === 'zh' ? `检测到${tables.length}个Markdown表格，下载时导出第一个表格。` : language === 'en' ? `Detected ${tables.length} Markdown table${tables.length === 1 ? '' : 's'}. The first table is exported.` : language === 'ja' ? `Markdown表を${tables.length}個検出しました。最初の表をエクスポートします。` : language === 'es' ? `Se detectaron ${tables.length} tablas Markdown. Se exportará la primera.` : `${tables.length} Markdown-Tabellen erkannt. Die erste Tabelle wird exportiert.`}</p>}
        <div className="mt-4"><OutputToolbar kind={kind} language={language} canDownload={canDownload} busy={busy} copied={copied} onCopy={() => void handleCopy()} onDownload={() => void handleDownload()} onSample={() => { setMarkdown(SAMPLE_MARKDOWN); setSourceName('herdown-markdown'); setMessage(''); }} onClear={() => { setMarkdown(''); setSourceName('herdown-markdown'); setMessage(''); }} /></div>
        {message && <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs leading-5 text-emerald-200" role="status">{message}</p>}
        {!canDownload && <p className="mt-4 inline-flex items-center gap-2 text-xs text-amber-300"><AlertCircle className="h-3.5 w-3.5" />{kind === 'csv' ? (language === 'zh' ? '请加入带分隔线的Markdown表格后再导出CSV。' : language === 'en' ? 'Add a Markdown table with a separator row to export CSV.' : language === 'ja' ? 'CSVをエクスポートするには区切り行付きのMarkdown表を追加してください。' : language === 'es' ? 'Añade una tabla Markdown con fila separadora para exportar CSV.' : 'Füge eine Markdown-Tabelle mit Trennzeile hinzu, um CSV zu exportieren.') : (language === 'zh' ? '输入Markdown后才可以导出。' : language === 'en' ? 'Enter Markdown to enable export.' : language === 'ja' ? 'Markdownを入力するとエクスポートできます。' : language === 'es' ? 'Introduce Markdown para activar la exportación.' : 'Gib Markdown ein, um den Export zu aktivieren.')}</p>}
      </section>

      <section className={`rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5 ${kind === 'pdf' ? 'markdown-output-pdf-preview' : ''}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-200">{copy.preview}</h2>
          {kind === 'csv' ? <Table2 className="h-4 w-4 text-emerald-400" /> : kind === 'word' ? <FileText className="h-4 w-4 text-emerald-400" /> : <FileDown className="h-4 w-4 text-emerald-400" />}
        </div>
        {kind === 'csv' ? <div className="overflow-auto rounded-xl border border-[#1e293b] bg-white text-slate-800">
          {tables[0] ? <table className="min-w-full border-collapse text-left text-sm"><thead><tr>{tables[0].headers.map((header, index) => <th key={`${header}-${index}`} className="border-b border-slate-200 bg-slate-100 px-3 py-2 font-semibold">{header}</th>)}</tr></thead><tbody>{tables[0].rows.map((row, rowIndex) => <tr key={rowIndex}>{tables[0].headers.map((_, columnIndex) => <td key={columnIndex} className="border-b border-slate-200 px-3 py-2">{row[columnIndex] || ''}</td>)}</tr>)}</tbody></table> : <p className="p-5 text-sm text-slate-500">{language === 'zh' ? 'Markdown表格预览会显示在这里。' : language === 'en' ? 'A Markdown table preview will appear here.' : language === 'ja' ? 'Markdown表のプレビューがここに表示されます。' : language === 'es' ? 'Aquí aparecerá la vista previa de la tabla Markdown.' : 'Hier wird eine Markdown-Tabellenvorschau angezeigt.'}</p>}
        </div> : <PreviewSurface ref={previewRef} html={html} emptyText={language === 'zh' ? 'Markdown预览会显示在这里。' : language === 'en' ? 'Markdown preview will appear here.' : language === 'ja' ? 'Markdownプレビューがここに表示されます。' : language === 'es' ? 'Aquí aparecerá la vista previa de Markdown.' : 'Hier wird die Markdown-Vorschau angezeigt.'} className="min-h-[460px] rounded-xl bg-white p-6 text-slate-800" />}
      </section>
    </div>
    <div className={kind === 'pdf' ? 'markdown-output-pdf-ui' : ''}>
      <ToolSeoContent slug={`markdown-to-${kind}` as 'markdown-to-html' | 'markdown-to-pdf' | 'markdown-to-word' | 'markdown-to-csv'} language={language} />
    </div>
  </main>;
}
