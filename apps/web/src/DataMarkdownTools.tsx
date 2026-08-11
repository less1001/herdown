import React, { useRef, useState } from 'react';
import { Braces, ClipboardPaste, CodeXml, Copy, Download, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import type { Language } from './i18n';

const downloadText = (content: string, filename: string, type = 'text/markdown;charset=utf-8') => {
  const objectUrl = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
};

const markdownCell = (value: unknown): string => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\|/g, '\\|')
  .replace(/\r?\n/g, '<br>')
  .trim();

const tableToMarkdown = (rows: unknown[][]): string => {
  const usefulRows = rows.filter(row => row.some(cell => String(cell ?? '').trim()));
  if (!usefulRows.length) throw new Error('EMPTY_TABLE');
  const width = Math.max(...usefulRows.map(row => row.length));
  const normalized = usefulRows.map(row => Array.from({ length: width }, (_, index) => markdownCell(row[index])));
  const header = normalized[0].map((cell, index) => cell || `Column ${index + 1}`);
  const separator = header.map(() => '---');
  return [header, separator, ...normalized.slice(1)].map(row => `| ${row.join(' | ')} |`).join('\n');
};

export function CsvMarkdownPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [rows, setRows] = useState(0);
  const [columns, setColumns] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const convertData = async (data: string | ArrayBuffer, type: 'string' | 'array') => {
    setLoading(true);
    setMessage('');
    setMarkdown('');
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data, { type, raw: false, dense: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('EMPTY_TABLE');
      const values = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], { header: 1, raw: false, defval: '' });
      const usefulRows = values.filter(row => row.some(cell => String(cell ?? '').trim()));
      const output = tableToMarkdown(usefulRows);
      setRows(usefulRows.length);
      setColumns(Math.max(...usefulRows.map(row => row.length)));
      setMarkdown(`${output}\n`);
    } catch (error) {
      const empty = error instanceof Error && error.message === 'EMPTY_TABLE';
      setMessage(empty ? (isEnglish ? 'No table data was found.' : '没有找到可转换的表格数据。') : (isEnglish ? 'The CSV could not be parsed. Check its delimiter, quotes, and encoding.' : 'CSV解析失败，请检查分隔符、引号和文件编码。'));
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage(isEnglish ? 'Choose a CSV or TSV file no larger than 10MB.' : '请选择不超过10MB的CSV或TSV文件。');
      return;
    }
    setFileName(file.name);
    setSource('');
    await convertData(await file.arrayBuffer(), 'array');
  };

  const convertPaste = (event: React.FormEvent) => {
    event.preventDefault();
    if (!source.trim() || loading) return;
    setFileName('');
    void convertData(source, 'string');
  };

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Local CSV conversion' : '本地CSV转换'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'CSV to Markdown' : 'CSV转Markdown'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Upload a CSV or TSV file, or paste delimited data, and turn it into a clean Markdown table directly in your browser.' : '上传CSV或TSV文件，或直接粘贴分隔数据，在浏览器中转换为干净的Markdown表格。'}</p>
      </header>

      <section aria-labelledby="csv-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="csv-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Add CSV data' : '添加CSV数据'}</h2>
        <input ref={inputRef} type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" className="hidden" onChange={event => void onFile(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#334155] bg-[#090d12] px-4 py-6 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"><Upload className="h-4 w-4" />{fileName || (isEnglish ? 'Choose CSV or TSV file' : '选择CSV或TSV文件')}</button>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-[#263445]" /><span>{isEnglish ? 'or paste data' : '或粘贴数据'}</span><span className="h-px flex-1 bg-[#263445]" /></div>
        <form onSubmit={convertPaste}>
          <label className="sr-only" htmlFor="csv-source">{isEnglish ? 'CSV data' : 'CSV数据'}</label>
          <textarea id="csv-source" value={source} onChange={event => setSource(event.target.value)} rows={10} placeholder={'name,score,city\nAlice,98,Shanghai\nBob,91,Shenzhen'} spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500" />
          <button type="submit" disabled={!source.trim() || loading} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><FileSpreadsheet className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />{loading ? (isEnglish ? 'Converting' : '正在转换') : (isEnglish ? 'Convert to Markdown' : '转换为Markdown')}</button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'Files are parsed locally and are not uploaded. The first non-empty row becomes the table header.' : '文件只在当前浏览器中解析，不会上传。第一行非空数据会作为表头。'}</p>
      </section>

      {message && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>}

      {markdown && (
        <section aria-labelledby="csv-result-title" className="space-y-4">
          <h2 id="csv-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Markdown result' : 'Markdown结果'}</h2>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Rows including header' : '行数含表头'}</p><p className="mt-1 text-2xl font-bold text-white">{rows}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Columns' : '列数'}</p><p className="mt-1 text-2xl font-bold text-white">{columns}</p></div></div>
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">{fileName ? `${fileName}.md` : 'table.md'}</span><div className="flex gap-2"><button type="button" onClick={() => void copyMarkdown()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}</button><button type="button" onClick={() => downloadText(markdown, `${fileName.replace(/\.(csv|tsv)$/i, '') || 'table'}.md`)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{isEnglish ? 'Download .md' : '下载.md'}</button></div></div>
            <pre className="max-h-[36rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-emerald-100">{markdown}</pre>
          </div>
        </section>
      )}

      <section aria-labelledby="csv-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="csv-details-title" className="text-xl font-bold text-white">{isEnglish ? 'CSV conversion details' : 'CSV转换细节'}</h2></div>
        {[
          [isEnglish ? 'CSV and TSV' : '支持CSV和TSV', isEnglish ? 'The parser detects comma, tab, semicolon, and other common delimiters, including quoted cells.' : '解析器支持逗号、制表符、分号等常见分隔符，并能处理带引号的单元格。'],
          [isEnglish ? 'Markdown-safe cells' : '安全的Markdown单元格', isEnglish ? 'Pipes and backslashes are escaped, while line breaks inside a cell become HTML line breaks.' : '单元格中的竖线和反斜杠会被转义，内部换行会转换为HTML换行。'],
          [isEnglish ? 'Private local processing' : '本地隐私处理', isEnglish ? 'The source file stays in your browser. Herdown does not receive its contents.' : '源文件停留在当前浏览器中，Herdown不会接收文件内容。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="csv-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="csv-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'CSV to Markdown FAQ' : 'CSV转Markdown常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Are formulas evaluated?' : '会计算公式吗？', isEnglish ? 'No. CSV contains values rather than spreadsheet formulas. Use the Excel converter for XLSX workbooks.' : '不会。CSV保存的是文本值，不包含工作簿公式。XLSX文件请使用Excel转Markdown。'],
            [isEnglish ? 'What encoding should I use?' : '文件应使用什么编码？', isEnglish ? 'UTF-8 is recommended. If characters are garbled, export the source CSV as UTF-8 and retry.' : '推荐使用UTF-8。如果出现乱码，请把源CSV重新导出为UTF-8后再转换。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
    </article>
  );
}

const markdownInline = (value: unknown): string => {
  if (value === null) return '`null`';
  if (typeof value === 'boolean' || typeof value === 'number') return `\`${String(value)}\``;
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/([*_\[\]<>])/g, '\\$1')
    .replace(/\r?\n/g, '<br>');
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const jsonArrayTable = (items: Record<string, unknown>[]): string | null => {
  const keys = Array.from(new Set(items.flatMap(item => Object.keys(item))));
  if (!keys.length || keys.length > 24) return null;
  const header = keys.map(markdownCell);
  const rows = items.map(item => keys.map(key => {
    const value = item[key];
    return markdownCell(isPlainObject(value) || Array.isArray(value) ? JSON.stringify(value) : value);
  }));
  return [header, header.map(() => '---'), ...rows].map(row => `| ${row.join(' | ')} |`).join('\n');
};

const jsonToMarkdown = (value: unknown, depth = 2): string => {
  if (Array.isArray(value)) {
    if (!value.length) return '`[]`';
    if (value.every(isPlainObject)) {
      const table = jsonArrayTable(value);
      if (table) return table;
    }
    return value.map((item, index) => {
      if (isPlainObject(item) || Array.isArray(item)) return `- Item ${index + 1}\n\n${jsonToMarkdown(item, Math.min(depth + 1, 6)).split('\n').map(line => line ? `  ${line}` : line).join('\n')}`;
      return `- ${markdownInline(item)}`;
    }).join('\n');
  }
  if (isPlainObject(value)) {
    const sections: string[] = [];
    const primitives: string[] = [];
    for (const [key, item] of Object.entries(value)) {
      if (isPlainObject(item) || Array.isArray(item)) {
        sections.push(`${'#'.repeat(Math.min(depth, 6))} ${markdownInline(key)}\n\n${jsonToMarkdown(item, Math.min(depth + 1, 6))}`);
      } else {
        primitives.push(`- ${markdownInline(key)}: ${markdownInline(item)}`);
      }
    }
    return [...primitives, ...sections].join('\n\n') || '`{}`';
  }
  return markdownInline(value);
};

const countJsonNodes = (value: unknown): number => {
  if (Array.isArray(value)) return 1 + value.reduce<number>((total, item) => total + countJsonNodes(item), 0);
  if (isPlainObject(value)) return 1 + Object.values(value).reduce<number>((total, item) => total + countJsonNodes(item), 0);
  return 1;
};

export function JsonMarkdownPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [rootType, setRootType] = useState('');
  const [nodeCount, setNodeCount] = useState(0);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = (text: string) => {
    setMessage('');
    setMarkdown('');
    try {
      const value = JSON.parse(text) as unknown;
      setRootType(Array.isArray(value) ? (isEnglish ? 'Array' : '数组') : isPlainObject(value) ? (isEnglish ? 'Object' : '对象') : (isEnglish ? 'Primitive' : '基础值'));
      setNodeCount(countJsonNodes(value));
      setMarkdown(`${jsonToMarkdown(value)}\n`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setMessage(isEnglish ? `Invalid JSON. ${detail}` : `JSON格式无效。${detail}`);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage(isEnglish ? 'Choose a JSON file no larger than 10MB.' : '请选择不超过10MB的JSON文件。');
      return;
    }
    setFileName(file.name);
    setSource('');
    convert(await file.text());
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!source.trim()) return;
    setFileName('');
    convert(source);
  };

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Local structured data conversion' : '本地结构化数据转换'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'JSON to Markdown' : 'JSON转Markdown'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Upload or paste JSON and turn objects, arrays, nested sections, and record lists into readable Markdown locally.' : '上传或粘贴JSON，在本地把对象、数组、嵌套结构和记录列表转换为可读的Markdown。'}</p>
      </header>

      <section aria-labelledby="json-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="json-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Add JSON data' : '添加JSON数据'}</h2>
        <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={event => void onFile(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#334155] bg-[#090d12] px-4 py-6 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"><Upload className="h-4 w-4" />{fileName || (isEnglish ? 'Choose JSON file' : '选择JSON文件')}</button>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-[#263445]" /><span>{isEnglish ? 'or paste JSON' : '或粘贴JSON'}</span><span className="h-px flex-1 bg-[#263445]" /></div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="json-source">JSON</label>
          <textarea id="json-source" value={source} onChange={event => setSource(event.target.value)} rows={14} placeholder={'[{"name":"Alice","score":98},{"name":"Bob","score":91}]'} spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500" />
          <button type="submit" disabled={!source.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><Braces className="h-4 w-4" />{isEnglish ? 'Convert to Markdown' : '转换为Markdown'}</button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'The JSON stays in this browser. Arrays of records become tables, while nested objects become Markdown sections.' : 'JSON内容只在当前浏览器中处理。记录数组会转换为表格，嵌套对象会转换为Markdown章节。'}</p>
      </section>

      {message && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200">{message}</div>}

      {markdown && (
        <section aria-labelledby="json-result-title" className="space-y-4">
          <h2 id="json-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Markdown result' : 'Markdown结果'}</h2>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Root type' : '根类型'}</p><p className="mt-1 text-xl font-bold text-white">{rootType}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'JSON nodes' : 'JSON节点'}</p><p className="mt-1 text-2xl font-bold text-white">{nodeCount}</p></div></div>
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">{fileName ? `${fileName}.md` : 'data.md'}</span><div className="flex gap-2"><button type="button" onClick={() => void copyMarkdown()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}</button><button type="button" onClick={() => downloadText(markdown, `${fileName.replace(/\.json$/i, '') || 'data'}.md`)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{isEnglish ? 'Download .md' : '下载.md'}</button></div></div>
            <pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-emerald-100">{markdown}</pre>
          </div>
        </section>
      )}

      <section aria-labelledby="json-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="json-details-title" className="text-xl font-bold text-white">{isEnglish ? 'How JSON becomes Markdown' : 'JSON如何转换为Markdown'}</h2></div>
        {[
          [isEnglish ? 'Record arrays become tables' : '记录数组变成表格', isEnglish ? 'Arrays of objects use the combined object keys as table columns.' : '对象数组会合并对象字段，并使用这些字段作为Markdown表格列。'],
          [isEnglish ? 'Nested data becomes sections' : '嵌套数据变成章节', isEnglish ? 'Nested objects and non-tabular arrays keep their hierarchy as headings and lists.' : '嵌套对象和无法表格化的数组会使用标题与列表保留层级。'],
          [isEnglish ? 'Invalid JSON is rejected' : '拒绝无效JSON', isEnglish ? 'Strict JSON parsing reports syntax errors instead of silently losing malformed data.' : '工具使用严格JSON解析，遇到语法错误会明确提示，不会静默丢失内容。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="json-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="json-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'JSON to Markdown FAQ' : 'JSON转Markdown常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Does the tool flatten nested JSON?' : '会把嵌套JSON完全展平吗？', isEnglish ? 'No. Nested objects remain grouped under Markdown headings, so the original hierarchy stays understandable.' : '不会。嵌套对象会保留在对应Markdown标题下，原始层级仍然清晰。'],
            [isEnglish ? 'Can it process JSONL?' : '支持JSONL吗？', isEnglish ? 'Not directly. Convert JSONL into one valid JSON array before using this page.' : '暂不直接支持。请先把JSONL整理成一个有效JSON数组再使用。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
    </article>
  );
}

const xmlElementChildren = (element: Element): Element[] => Array.from(element.children);

const xmlLeafText = (element: Element): string => element.textContent?.trim() || '';

const xmlTable = (elements: Element[]): string | null => {
  if (elements.length < 2) return null;
  const keys = Array.from(new Set(elements.flatMap(element => xmlElementChildren(element).filter(child => !child.children.length).map(child => child.localName))));
  if (!keys.length || keys.length > 16) return null;
  const rows = elements.map(element => {
    const values = new Map(xmlElementChildren(element).filter(child => !child.children.length).map(child => [child.localName, xmlLeafText(child)]));
    return keys.map(key => markdownCell(values.get(key) || ''));
  });
  return [keys.map(markdownCell), keys.map(() => '---'), ...rows].map(row => `| ${row.join(' | ')} |`).join('\n');
};

const genericXmlMarkdown = (element: Element, depth = 2): string => {
  const children = xmlElementChildren(element);
  if (!children.length) return markdownInline(xmlLeafText(element));
  const groups = new Map<string, Element[]>();
  for (const child of children) groups.set(child.localName, [...(groups.get(child.localName) || []), child]);
  const sections: string[] = [];
  const leaves: string[] = [];
  for (const [name, items] of groups) {
    if (items.every(item => !item.children.length)) {
      for (const item of items) leaves.push(`- ${markdownInline(name)}: ${markdownInline(xmlLeafText(item))}`);
      continue;
    }
    const table = xmlTable(items);
    if (table) {
      sections.push(`${'#'.repeat(Math.min(depth, 6))} ${markdownInline(name)}\n\n${table}`);
      continue;
    }
    sections.push(items.map((item, index) => `${'#'.repeat(Math.min(depth, 6))} ${markdownInline(name)}${items.length > 1 ? ` ${index + 1}` : ''}\n\n${genericXmlMarkdown(item, Math.min(depth + 1, 6))}`).join('\n\n'));
  }
  return [...leaves, ...sections].join('\n\n');
};

const sitemapXmlMarkdown = (root: Element): string => {
  const rowName = root.localName === 'sitemapindex' ? 'sitemap' : 'url';
  const rows = Array.from(root.getElementsByTagNameNS('*', rowName));
  const keys = root.localName === 'sitemapindex' ? ['loc', 'lastmod'] : ['loc', 'lastmod', 'changefreq', 'priority'];
  const data = rows.map(row => keys.map(key => markdownCell(Array.from(row.children).find(child => child.localName === key)?.textContent?.trim() || '')));
  return [keys, keys.map(() => '---'), ...data].map(row => `| ${row.join(' | ')} |`).join('\n');
};

const feedXmlMarkdown = (root: Element): string => {
  const isRss = root.localName === 'rss';
  const container = isRss ? Array.from(root.children).find(child => child.localName === 'channel') || root : root;
  const title = Array.from(container.children).find(child => child.localName === 'title')?.textContent?.trim();
  const itemName = isRss ? 'item' : 'entry';
  const items = Array.from(container.children).filter(child => child.localName === itemName);
  const sections = items.map((item, index) => {
    const find = (...names: string[]) => Array.from(item.children).find(child => names.includes(child.localName));
    const itemTitle = find('title')?.textContent?.trim() || `Item ${index + 1}`;
    const linkNode = find('link');
    const link = linkNode?.getAttribute('href') || linkNode?.textContent?.trim() || '';
    const date = find('pubDate', 'published', 'updated')?.textContent?.trim() || '';
    const author = find('author', 'creator')?.textContent?.trim() || '';
    const description = find('description', 'summary', 'content')?.textContent?.trim() || '';
    return [`## ${markdownInline(itemTitle)}`, link ? `- Link: ${markdownInline(link)}` : '', date ? `- Date: ${markdownInline(date)}` : '', author ? `- Author: ${markdownInline(author)}` : '', description ? `\n${markdownInline(description)}` : ''].filter(Boolean).join('\n');
  });
  return [`# ${markdownInline(title || (isRss ? 'RSS Feed' : 'Atom Feed'))}`, ...sections].join('\n\n');
};

const xmlToMarkdown = (document: XMLDocument): { markdown: string; root: string; elements: number; mode: string } => {
  const root = document.documentElement;
  const elements = document.getElementsByTagName('*').length;
  if (root.localName === 'urlset' || root.localName === 'sitemapindex') return { markdown: sitemapXmlMarkdown(root), root: root.localName, elements, mode: 'sitemap' };
  if (root.localName === 'rss' || root.localName === 'feed') return { markdown: feedXmlMarkdown(root), root: root.localName, elements, mode: 'feed' };
  return { markdown: `# ${markdownInline(root.localName)}\n\n${genericXmlMarkdown(root)}`, root: root.localName, elements, mode: 'generic' };
};

export function XmlMarkdownPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [rootName, setRootName] = useState('');
  const [elementCount, setElementCount] = useState(0);
  const [detectedMode, setDetectedMode] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = (text: string) => {
    setMessage('');
    setMarkdown('');
    if (/<!DOCTYPE/i.test(text)) {
      setMessage(isEnglish ? 'DOCTYPE is not supported. Remove external entity declarations and retry.' : '不支持DOCTYPE，请移除外部实体声明后重试。');
      return;
    }
    const document = new DOMParser().parseFromString(text, 'application/xml');
    const parserError = document.querySelector('parsererror');
    if (parserError) {
      setMessage(isEnglish ? `Invalid XML. ${parserError.textContent?.trim() || ''}` : `XML格式无效。${parserError.textContent?.trim() || ''}`);
      return;
    }
    const result = xmlToMarkdown(document);
    setRootName(result.root);
    setElementCount(result.elements);
    setDetectedMode(result.mode === 'sitemap' ? 'Sitemap' : result.mode === 'feed' ? (isEnglish ? 'RSS or Atom feed' : 'RSS或Atom订阅') : (isEnglish ? 'Generic XML' : '通用XML'));
    setMarkdown(`${result.markdown}\n`);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage(isEnglish ? 'Choose an XML file no larger than 10MB.' : '请选择不超过10MB的XML文件。');
      return;
    }
    setFileName(file.name);
    setSource('');
    convert(await file.text());
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!source.trim()) return;
    setFileName('');
    convert(source);
  };

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Local XML conversion' : '本地XML转换'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'XML to Markdown' : 'XML转Markdown'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Upload or paste XML and convert sitemaps, RSS or Atom feeds, and generic nested data into readable Markdown.' : '上传或粘贴XML，把Sitemap、RSS或Atom订阅和通用嵌套数据转换为可读Markdown。'}</p>
      </header>

      <section aria-labelledby="xml-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="xml-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Add XML data' : '添加XML数据'}</h2>
        <input ref={inputRef} type="file" accept=".xml,.rss,.atom,application/xml,text/xml" className="hidden" onChange={event => void onFile(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#334155] bg-[#090d12] px-4 py-6 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"><Upload className="h-4 w-4" />{fileName || (isEnglish ? 'Choose XML file' : '选择XML文件')}</button>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-[#263445]" /><span>{isEnglish ? 'or paste XML' : '或粘贴XML'}</span><span className="h-px flex-1 bg-[#263445]" /></div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="xml-source">XML</label>
          <textarea id="xml-source" value={source} onChange={event => setSource(event.target.value)} rows={14} placeholder={'<catalog>\n  <book><title>Example</title><author>Alice</author></book>\n</catalog>'} spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500" />
          <button type="submit" disabled={!source.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><CodeXml className="h-4 w-4" />{isEnglish ? 'Convert to Markdown' : '转换为Markdown'}</button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'XML is parsed locally. The tool rejects DOCTYPE declarations and never uploads file contents.' : 'XML只在本地解析。工具拒绝DOCTYPE声明，也不会上传文件内容。'}</p>
      </section>

      {message && <div role="alert" className="max-h-40 overflow-auto rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200">{message}</div>}

      {markdown && (
        <section aria-labelledby="xml-result-title" className="space-y-4">
          <h2 id="xml-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Markdown result' : 'Markdown结果'}</h2>
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Root element' : '根元素'}</p><p className="mt-1 text-xl font-bold text-white">{rootName}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Elements' : '元素数量'}</p><p className="mt-1 text-2xl font-bold text-white">{elementCount}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Detected type' : '识别类型'}</p><p className="mt-1 text-lg font-bold text-white">{detectedMode}</p></div></div>
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">{fileName ? `${fileName}.md` : 'data.md'}</span><div className="flex gap-2"><button type="button" onClick={() => void copyMarkdown()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}</button><button type="button" onClick={() => downloadText(markdown, `${fileName.replace(/\.(xml|rss|atom)$/i, '') || 'data'}.md`)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{isEnglish ? 'Download .md' : '下载.md'}</button></div></div>
            <pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-emerald-100">{markdown}</pre>
          </div>
        </section>
      )}

      <section aria-labelledby="xml-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="xml-details-title" className="text-xl font-bold text-white">{isEnglish ? 'XML conversion modes' : 'XML转换模式'}</h2></div>
        {[
          ['Sitemap XML', isEnglish ? 'urlset and sitemapindex files become tables with loc, lastmod, changefreq, and priority fields.' : 'urlset和sitemapindex会转换为包含loc、lastmod、changefreq和priority的表格。'],
          ['RSS and Atom', isEnglish ? 'Feed titles, item titles, links, dates, authors, and descriptions become readable sections.' : '订阅标题、条目标题、链接、日期、作者和描述会转换为可读章节。'],
          [isEnglish ? 'Generic XML' : '通用XML', isEnglish ? 'Repeated records become tables when possible; other nested elements retain their hierarchy.' : '重复记录会尽可能转换为表格，其他嵌套元素会保留原始层级。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="xml-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="xml-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'XML to Markdown FAQ' : 'XML转Markdown常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Are XML attributes preserved?' : '会保留XML属性吗？', isEnglish ? 'This version focuses on element content. Important values stored only in custom attributes may need manual review.' : '当前版本主要转换元素内容。只存在于自定义属性中的重要值需要人工复核。'],
            [isEnglish ? 'Why is DOCTYPE rejected?' : '为什么拒绝DOCTYPE？', isEnglish ? 'External entity declarations are unnecessary for these conversion modes and are rejected for safer local parsing.' : '这些转换场景不需要外部实体声明，拒绝DOCTYPE可以让本地解析更安全。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
    </article>
  );
}

type RtfState = { skip: boolean; unicodeFallback: number };

const rtfDestinations = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'header', 'headerl', 'headerr', 'footer', 'footerl', 'footerr', 'xmlnstbl', 'listtable', 'listoverridetable', 'themedata', 'datastore', 'filetbl', 'revtbl', 'generator']);

const windows1252Char = (value: number): string => {
  const special: Record<number, string> = {
    0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
  };
  return special[value] || String.fromCharCode(value);
};

const rtfToText = (source: string): string => {
  if (!/^\s*\{\\rtf(?:1)?\b/i.test(source)) throw new Error('NOT_RTF');
  const states: RtfState[] = [{ skip: false, unicodeFallback: 1 }];
  let state = states[0];
  let output = '';
  let index = 0;
  let fallbackChars = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === '{') {
      state = { ...state };
      states.push(state);
      index += 1;
      continue;
    }
    if (char === '}') {
      if (states.length > 1) states.pop();
      state = states[states.length - 1];
      index += 1;
      continue;
    }
    if (fallbackChars > 0 && char !== '\\') {
      fallbackChars -= 1;
      index += 1;
      continue;
    }
    if (char !== '\\') {
      if (!state.skip && char !== '\r' && char !== '\n') output += char;
      index += 1;
      continue;
    }
    index += 1;
    const symbol = source[index];
    if (symbol === '\\' || symbol === '{' || symbol === '}') {
      if (!state.skip && fallbackChars === 0) output += symbol;
      else if (fallbackChars > 0) fallbackChars -= 1;
      index += 1;
      continue;
    }
    if (symbol === "'") {
      const hex = source.slice(index + 1, index + 3);
      if (/^[0-9a-f]{2}$/i.test(hex)) {
        if (!state.skip && fallbackChars === 0) output += windows1252Char(Number.parseInt(hex, 16));
        else if (fallbackChars > 0) fallbackChars -= 1;
        index += 3;
      } else index += 1;
      continue;
    }
    if (symbol === '*') {
      state.skip = true;
      index += 1;
      continue;
    }
    if (symbol === '~') {
      if (!state.skip) output += ' ';
      index += 1;
      continue;
    }
    if (symbol === '-') {
      index += 1;
      continue;
    }
    if (symbol === '_') {
      if (!state.skip) output += '‑';
      index += 1;
      continue;
    }
    const wordMatch = source.slice(index).match(/^([a-zA-Z]+)(-?\d+)? ?/);
    if (!wordMatch) {
      index += 1;
      continue;
    }
    const word = wordMatch[1].toLowerCase();
    const parameter = wordMatch[2] === undefined ? undefined : Number(wordMatch[2]);
    index += wordMatch[0].length;
    if (rtfDestinations.has(word)) {
      state.skip = true;
      continue;
    }
    if (state.skip) continue;
    if (word === 'uc' && parameter !== undefined) state.unicodeFallback = Math.max(0, parameter);
    else if (word === 'u' && parameter !== undefined) {
      const code = parameter < 0 ? parameter + 65536 : parameter;
      output += String.fromCharCode(code);
      fallbackChars = state.unicodeFallback;
    } else if (word === 'par') output += '\n\n';
    else if (word === 'line') output += '\n';
    else if (word === 'tab') output += '\t';
    else if (word === 'page' || word === 'sect') output += '\n\n';
    else if (word === 'emdash') output += '—';
    else if (word === 'endash') output += '–';
    else if (word === 'bullet') output += '•';
    else if (word === 'lquote') output += '‘';
    else if (word === 'rquote') output += '’';
    else if (word === 'ldblquote') output += '“';
    else if (word === 'rdblquote') output += '”';
    else if (word === 'bin' && parameter && parameter > 0) index += parameter;
  }
  return output
    .replace(/\u0000/g, '')
    .replace(/^[ \t]*[•·][ \t]*/gm, '- ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const textToParagraphMarkdown = (text: string): string => text
  .split(/\n{2,}/)
  .map(block => block.split('\n').map(line => line.trimEnd()).join('\n').trim())
  .filter(Boolean)
  .join('\n\n');

export function RtfMarkdownPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [paragraphCount, setParagraphCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = (text: string) => {
    setMessage('');
    setMarkdown('');
    try {
      const plainText = rtfToText(text);
      if (!plainText) throw new Error('EMPTY_RTF');
      const output = textToParagraphMarkdown(plainText);
      setCharacterCount(output.length);
      setParagraphCount(output.split(/\n{2,}/).filter(Boolean).length);
      setMarkdown(`${output}\n`);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(code === 'NOT_RTF' ? (isEnglish ? 'This does not appear to be a valid RTF document.' : '这段内容不是有效的RTF文档。') : (isEnglish ? 'No readable text could be extracted from this RTF document.' : '没有从这个RTF文档中提取到可读文字。'));
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage(isEnglish ? 'Choose an RTF file no larger than 10MB.' : '请选择不超过10MB的RTF文件。');
      return;
    }
    setFileName(file.name);
    setSource('');
    convert(await file.text());
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!source.trim()) return;
    setFileName('');
    convert(source);
  };

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{isEnglish ? 'Local rich text extraction' : '本地富文本提取'}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{isEnglish ? 'RTF to Markdown' : 'RTF转Markdown'}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{isEnglish ? 'Upload or paste an RTF document and extract its paragraphs, Unicode text, tabs, punctuation, and basic lists into clean Markdown.' : '上传或粘贴RTF文档，提取段落、Unicode文字、制表符、标点和基础列表，生成干净Markdown。'}</p>
      </header>

      <section aria-labelledby="rtf-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="rtf-form-title" className="text-lg font-bold text-white">{isEnglish ? 'Add an RTF document' : '添加RTF文档'}</h2>
        <input ref={inputRef} type="file" accept=".rtf,application/rtf,text/rtf" className="hidden" onChange={event => void onFile(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#334155] bg-[#090d12] px-4 py-6 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"><Upload className="h-4 w-4" />{fileName || (isEnglish ? 'Choose RTF file' : '选择RTF文件')}</button>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-600"><span className="h-px flex-1 bg-[#263445]" /><span>{isEnglish ? 'or paste RTF source' : '或粘贴RTF源码'}</span><span className="h-px flex-1 bg-[#263445]" /></div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="rtf-source">RTF</label>
          <textarea id="rtf-source" value={source} onChange={event => setSource(event.target.value)} rows={14} placeholder={'{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Arial;}}\n\\f0\\fs24 Example\\par Second paragraph\n}'} spellCheck={false} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500" />
          <button type="submit" disabled={!source.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><FileText className="h-4 w-4" />{isEnglish ? 'Convert to Markdown' : '转换为Markdown'}</button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{isEnglish ? 'RTF is parsed locally and never uploaded. This tool prioritizes readable text and paragraph structure over exact visual styling.' : 'RTF只在本地解析，不会上传。工具优先保留可读文字和段落结构，不追求原始视觉样式的完全还原。'}</p>
      </section>

      {message && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>}

      {markdown && (
        <section aria-labelledby="rtf-result-title" className="space-y-4">
          <h2 id="rtf-result-title" className="text-xl font-bold text-white">{isEnglish ? 'Markdown result' : 'Markdown结果'}</h2>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Paragraphs' : '段落数量'}</p><p className="mt-1 text-2xl font-bold text-white">{paragraphCount}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><p className="text-xs text-slate-500">{isEnglish ? 'Characters' : '字符数量'}</p><p className="mt-1 text-2xl font-bold text-white">{characterCount}</p></div></div>
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">{fileName ? `${fileName}.md` : 'document.md'}</span><div className="flex gap-2"><button type="button" onClick={() => void copyMarkdown()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}</button><button type="button" onClick={() => downloadText(markdown, `${fileName.replace(/\.rtf$/i, '') || 'document'}.md`)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{isEnglish ? 'Download .md' : '下载.md'}</button></div></div>
            <pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-emerald-100">{markdown}</pre>
          </div>
        </section>
      )}

      <section aria-labelledby="rtf-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3">
        <div className="md:col-span-3"><h2 id="rtf-details-title" className="text-xl font-bold text-white">{isEnglish ? 'What the RTF converter preserves' : 'RTF转换会保留什么'}</h2></div>
        {[
          [isEnglish ? 'Unicode text' : 'Unicode文字', isEnglish ? 'RTF Unicode escapes and common Windows-1252 characters are decoded into readable text.' : 'RTF中的Unicode转义和常见Windows-1252字符会转换为可读文字。'],
          [isEnglish ? 'Paragraph structure' : '段落结构', isEnglish ? 'Paragraph, line, tab, page, and section controls become clean Markdown spacing.' : '段落、换行、制表符、分页和分节控制会整理为干净的Markdown间距。'],
          [isEnglish ? 'Safe text extraction' : '安全文字提取', isEnglish ? 'Font tables, color tables, images, embedded objects, headers, and footers are excluded.' : '字体表、颜色表、图片、嵌入对象、页眉和页脚会被排除。'],
        ].map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}
      </section>

      <section aria-labelledby="rtf-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8">
        <h2 id="rtf-faq-title" className="text-xl font-bold text-white">{isEnglish ? 'RTF to Markdown FAQ' : 'RTF转Markdown常见问题'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [isEnglish ? 'Does it preserve exact fonts and layout?' : '会保留原始字体和版式吗？', isEnglish ? 'No. Markdown does not represent exact RTF page layout. The tool focuses on reusable text and paragraphs.' : '不会。Markdown无法表达RTF的精确页面版式，工具专注于可复用的文字和段落。'],
            [isEnglish ? 'Are embedded images converted?' : '会转换嵌入图片吗？', isEnglish ? 'No. Embedded binary images and objects are intentionally skipped.' : '不会。嵌入的二进制图片和对象会被主动跳过。'],
          ].map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}
        </div>
      </section>
    </article>
  );
}

const collapseMarkdown = (value: string): string => value
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n[ \t]+/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const htmlTableMarkdown = (table: HTMLTableElement): string => {
  const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => markdownCell(cell.textContent || '')));
  if (!rows.length) return '';
  const width = Math.max(...rows.map(row => row.length));
  const normalized = rows.map(row => Array.from({ length: width }, (_, index) => row[index] || ''));
  return [normalized[0], normalized[0].map(() => '---'), ...normalized.slice(1)].map(row => `| ${row.join(' | ')} |`).join('\n');
};

const htmlNodeMarkdown = (node: Node, listDepth = 0): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent?.replace(/\s+/g, ' ') || '';
  if (!(node instanceof HTMLElement)) return '';
  const tag = node.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'template', 'svg', 'canvas', 'form', 'button', 'nav', 'header', 'footer', 'aside'].includes(tag)) return '';
  const children = () => Array.from(node.childNodes).map(child => htmlNodeMarkdown(child, listDepth)).join('');
  if (/^h[1-6]$/.test(tag)) return `\n\n${'#'.repeat(Number(tag[1]))} ${collapseMarkdown(children())}\n\n`;
  if (tag === 'p' || tag === 'section' || tag === 'article' || tag === 'main' || tag === 'div') return `\n\n${collapseMarkdown(children())}\n\n`;
  if (tag === 'br') return '\n';
  if (tag === 'hr') return '\n\n---\n\n';
  if (tag === 'strong' || tag === 'b') return `**${children().trim()}**`;
  if (tag === 'em' || tag === 'i') return `_${children().trim()}_`;
  if (tag === 'del' || tag === 's' || tag === 'strike') return `~~${children().trim()}~~`;
  if (tag === 'code' && node.parentElement?.tagName.toLowerCase() !== 'pre') {
    const content = node.textContent || '';
    const fence = content.includes('`') ? '``' : '`';
    return `${fence}${content}${fence}`;
  }
  if (tag === 'pre') {
    const code = node.textContent?.replace(/^\n|\n$/g, '') || '';
    const language = node.querySelector('code')?.className.match(/language-([\w-]+)/)?.[1] || '';
    const fence = code.includes('```') ? '````' : '```';
    return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
  }
  if (tag === 'a') {
    const label = collapseMarkdown(children()) || node.getAttribute('href') || '';
    const href = node.getAttribute('href') || '';
    if (!href || /^javascript:/i.test(href)) return label;
    return `[${label}](${href})`;
  }
  if (tag === 'img') {
    const src = node.getAttribute('src') || '';
    if (!src || /^data:/i.test(src)) return '';
    return `![${node.getAttribute('alt') || ''}](${src})`;
  }
  if (tag === 'blockquote') return `\n\n${collapseMarkdown(children()).split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
  if (tag === 'ul' || tag === 'ol') return `\n${Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li').map((child, index) => {
    const content = collapseMarkdown(Array.from(child.childNodes).filter(item => !(item instanceof HTMLElement && ['ul', 'ol'].includes(item.tagName.toLowerCase()))).map(item => htmlNodeMarkdown(item, listDepth + 1)).join(''));
    const nested = Array.from(child.children).filter(item => ['ul', 'ol'].includes(item.tagName.toLowerCase())).map(item => htmlNodeMarkdown(item, listDepth + 1).split('\n').map(line => line ? `  ${line}` : line).join('\n')).join('');
    return `${'  '.repeat(listDepth)}${tag === 'ol' ? `${index + 1}.` : '-'} ${content}${nested}`;
  }).join('\n')}\n`;
  if (tag === 'li') return children();
  if (tag === 'table') return `\n\n${htmlTableMarkdown(node as HTMLTableElement)}\n\n`;
  if (tag === 'details') {
    const summary = node.querySelector(':scope > summary')?.textContent?.trim() || 'Details';
    const body = Array.from(node.childNodes).filter(child => !(child instanceof HTMLElement && child.tagName.toLowerCase() === 'summary')).map(child => htmlNodeMarkdown(child, listDepth)).join('');
    return `\n\n<details>\n<summary>${summary}</summary>\n\n${collapseMarkdown(body)}\n\n</details>\n\n`;
  }
  if (tag === 'sup') return `<sup>${children().trim()}</sup>`;
  if (tag === 'sub') return `<sub>${children().trim()}</sub>`;
  return children();
};

export const htmlToMarkdown = (source: string): string => {
  const document = new DOMParser().parseFromString(source, 'text/html');
  return collapseMarkdown(Array.from(document.body.childNodes).map(node => htmlNodeMarkdown(node)).join(''));
};

const plainTextToMarkdown = (source: string): string => collapseMarkdown(source
  .replace(/\r\n?/g, '\n')
  .split('\n')
  .map(line => line.replace(/^[ \t]*[•·][ \t]+/, '- ').trimEnd())
  .join('\n'));

const pasteCopy = {
  zh: {
    badge: 'HTML在线转换，浏览器本地处理', title: 'HTML转Markdown转换器', intro: '粘贴HTML源码、富文本或纯文本，在浏览器本地转换标题、链接、列表、表格、引用、代码和图片。', form: '输入HTML或粘贴内容', rich: '富文本粘贴', html: 'HTML源码', text: '纯文本', richLabel: '富文本粘贴区域', richPlaceholder: '点击这里，然后粘贴网页、文档或编辑器中的内容', textPlaceholder: '在这里粘贴纯文本', convert: '转换为Markdown', privacy: '转换完全在当前浏览器中运行。脚本、样式、表单、导航和不安全链接会被移除。', result: 'Markdown输出', copy: '复制', copied: '已复制', download: '下载.md', exampleTitle: 'HTML输入与Markdown输出示例', exampleHtml: '<h1>产品说明</h1><p>查看<a href="https://example.com">在线文档</a>。</p>', exampleMarkdown: '# 产品说明\n\n查看[在线文档](https://example.com)。', modesTitle: '支持范围', modes: [['富文本粘贴', '从网页、文档或编辑器粘贴，读取剪贴板中可用的HTML结构。'], ['HTML源码', '粘贴原始HTML，适合需要明确控制标题、链接、列表、表格、引用和代码的场景。'], ['纯文本', '保留段落并规范常见项目符号，不会凭空添加原文不存在的结构。']], limitsTitle: '限制与隐私', limits: 'Markdown保留内容结构，不复刻网页的字体、颜色、布局和交互控件。外部资源地址会保留为链接或图片引用，脚本和样式不会执行。', faqTitle: 'HTML转Markdown常见问题', faq: [['为什么部分网页样式消失了？', 'Markdown表达内容结构而不是精确页面样式，字体、颜色、布局容器和交互控件会被移除。'], ['剪贴板内容会上传吗？', '不会。富文本、HTML和纯文本只在当前浏览器中读取和转换。'], ['HTML转换失败怎么办？', '检查输入是否包含可读正文，或切换到HTML源码模式后重新粘贴。']], related: '相关工具', url: 'URL转Markdown', viewer: 'Markdown Viewer'},
  en: {
    badge: 'Browser-based HTML conversion', title: 'HTML to Markdown Converter', intro: 'Paste HTML source, rich content, or plain text and convert headings, links, lists, tables, quotes, code, and images locally in your browser.', form: 'Enter HTML or paste content', rich: 'Rich paste', html: 'HTML source', text: 'Plain text', richLabel: 'Rich content paste area', richPlaceholder: 'Click here, then paste content from a webpage, document, or editor', textPlaceholder: 'Paste plain text here', convert: 'Convert to Markdown', privacy: 'Conversion runs entirely in this browser. Scripts, styles, forms, navigation, and unsafe links are removed.', result: 'Markdown output', copy: 'Copy', copied: 'Copied', download: 'Download .md', exampleTitle: 'HTML input and Markdown output example', exampleHtml: '<h1>Product guide</h1><p>Read the <a href="https://example.com">online docs</a>.</p>', exampleMarkdown: '# Product guide\n\nRead the [online docs](https://example.com).', modesTitle: 'Supported input modes', modes: [['Rich paste', 'Paste from a webpage, document, or editor and use the HTML structure available on the clipboard.'], ['HTML source', 'Paste raw HTML when you need deterministic conversion of headings, links, lists, tables, quotes, and code.'], ['Plain text', 'Keep paragraphs and normalize common bullet characters without inventing structure.']], limitsTitle: 'Limits and privacy', limits: 'Markdown preserves content structure rather than exact page styling. Fonts, colors, layout containers, and interactive controls are removed. External resources remain as links or image references; scripts and styles never run.', faqTitle: 'HTML to Markdown Converter FAQ', faq: [['Why did some webpage styling disappear?', 'Markdown represents content structure rather than exact page styling, so fonts, colors, layout containers, and interactive controls are removed.'], ['Is clipboard content uploaded?', 'No. Rich content, HTML, and plain text are read and converted only in this browser.'], ['What should I do when conversion fails?', 'Check that the input contains readable content, or switch to HTML source mode and paste it again.']], related: 'Related tools', url: 'URL to Markdown', viewer: 'Markdown Viewer'},
  ja: {
    badge: 'ブラウザ内HTML変換', title: 'HTMLからMarkdownへの変換', intro: 'HTMLソース、リッチコンテンツ、プレーンテキストを貼り付け、見出し、リンク、リスト、表、引用、コード、画像をブラウザ内で変換します。', form: 'HTMLまたは貼り付け内容', rich: 'リッチ貼り付け', html: 'HTMLソース', text: 'プレーンテキスト', richLabel: 'リッチコンテンツ貼り付け欄', richPlaceholder: 'ここをクリックしてWebページや文書の内容を貼り付けます', textPlaceholder: 'プレーンテキストを貼り付けます', convert: 'Markdownに変換', privacy: '変換はこのブラウザ内で実行します。スクリプト、スタイル、フォーム、ナビゲーション、安全でないリンクは削除します。', result: 'Markdown出力', copy: 'コピー', copied: 'コピーしました', download: '.mdを保存', exampleTitle: 'HTML入力とMarkdown出力の例', exampleHtml: '<h1>製品ガイド</h1><p><a href="https://example.com">オンライン文書</a>を読む。</p>', exampleMarkdown: '# 製品ガイド\n\n[オンライン文書](https://example.com)を読む。', modesTitle: '対応する入力', modes: [['リッチ貼り付け', 'Webページ、文書、エディターから貼り付け、クリップボードのHTML構造を使います。'], ['HTMLソース', '見出し、リンク、リスト、表、引用、コードを明確に変換したい場合に使います。'], ['プレーンテキスト', '段落を保ち、一般的な箇条書きを整えます。存在しない構造は追加しません。']], limitsTitle: '制限とプライバシー', limits: 'Markdownは正確な見た目ではなく内容構造を保ちます。フォント、色、レイアウト、操作部品は削除します。外部リソースはリンクまたは画像参照として残り、スクリプトは実行しません。', faqTitle: 'HTMLからMarkdownへのFAQ', faq: [['Webページの見た目が消えるのはなぜですか？', 'Markdownは内容構造を表すため、フォント、色、レイアウト、操作部品は削除します。'], ['クリップボードの内容はアップロードされますか？', 'いいえ。リッチコンテンツ、HTML、テキストはこのブラウザ内でのみ読み取り、変換します。'], ['変換に失敗した場合は？', '読み取り可能な内容があるか確認し、HTMLソースモードでもう一度貼り付けてください。']], related: '関連ツール', url: 'URLからMarkdownへ', viewer: 'Markdownビューア'},
  es: {
    badge: 'Conversión HTML en el navegador', title: 'Convertidor de HTML a Markdown', intro: 'Pega HTML, contenido enriquecido o texto plano y convierte títulos, enlaces, listas, tablas, citas, código e imágenes localmente.', form: 'Introduce HTML o pega contenido', rich: 'Pegado enriquecido', html: 'Fuente HTML', text: 'Texto plano', richLabel: 'Área para pegar contenido enriquecido', richPlaceholder: 'Haz clic aquí y pega contenido de una página, documento o editor', textPlaceholder: 'Pega texto plano aquí', convert: 'Convertir a Markdown', privacy: 'La conversión se ejecuta en este navegador. Se eliminan scripts, estilos, formularios, navegación y enlaces inseguros.', result: 'Salida Markdown', copy: 'Copiar', copied: 'Copiado', download: 'Descargar .md', exampleTitle: 'Ejemplo de entrada HTML y salida Markdown', exampleHtml: '<h1>Guía del producto</h1><p>Lee la <a href="https://example.com">documentación online</a>.</p>', exampleMarkdown: '# Guía del producto\n\nLee la [documentación online](https://example.com).', modesTitle: 'Entradas compatibles', modes: [['Pegado enriquecido', 'Pega contenido desde una página, documento o editor y usa la estructura HTML del portapapeles.'], ['Fuente HTML', 'Pega HTML cuando necesites una conversión controlada de títulos, enlaces, listas, tablas, citas y código.'], ['Texto plano', 'Conserva párrafos y normaliza viñetas comunes sin inventar estructura.']], limitsTitle: 'Límites y privacidad', limits: 'Markdown conserva la estructura del contenido, no el diseño exacto. Se eliminan fuentes, colores, contenedores y controles interactivos. Los recursos externos quedan como enlaces o referencias de imagen y los scripts no se ejecutan.', faqTitle: 'Preguntas frecuentes sobre HTML a Markdown', faq: [['¿Por qué desapareció el estilo de la página?', 'Markdown representa la estructura del contenido, no el diseño exacto; por eso se eliminan fuentes, colores, contenedores y controles.'], ['¿Se sube el contenido del portapapeles?', 'No. El contenido enriquecido, HTML y texto se leen y convierten solo en este navegador.'], ['¿Qué hago si falla la conversión?', 'Comprueba que la entrada tenga contenido legible o cambia a Fuente HTML y vuelve a pegarla.']], related: 'Herramientas relacionadas', url: 'URL a Markdown', viewer: 'Visor Markdown'},
  de: {
    badge: 'HTML-Konvertierung im Browser', title: 'HTML-zu-Markdown-Konverter', intro: 'HTML-Quelltext, Rich Text oder reinen Text einfügen und Überschriften, Links, Listen, Tabellen, Zitate, Code und Bilder lokal umwandeln.', form: 'HTML eingeben oder Inhalt einfügen', rich: 'Rich Text einfügen', html: 'HTML-Quelle', text: 'Reiner Text', richLabel: 'Bereich für Rich Text', richPlaceholder: 'Hier klicken und Inhalt aus Webseite, Dokument oder Editor einfügen', textPlaceholder: 'Reinen Text hier einfügen', convert: 'In Markdown umwandeln', privacy: 'Die Konvertierung läuft vollständig in diesem Browser. Skripte, Styles, Formulare, Navigation und unsichere Links werden entfernt.', result: 'Markdown-Ausgabe', copy: 'Kopieren', copied: 'Kopiert', download: '.md laden', exampleTitle: 'Beispiel für HTML-Eingabe und Markdown-Ausgabe', exampleHtml: '<h1>Produktleitfaden</h1><p>Online-Dokumentation <a href="https://example.com">lesen</a>.</p>', exampleMarkdown: '# Produktleitfaden\n\nOnline-Dokumentation [lesen](https://example.com).', modesTitle: 'Unterstützte Eingaben', modes: [['Rich Text einfügen', 'Inhalt aus Webseite, Dokument oder Editor einfügen und die HTML-Struktur der Zwischenablage verwenden.'], ['HTML-Quelle', 'HTML einfügen, wenn Überschriften, Links, Listen, Tabellen, Zitate und Code kontrolliert umgewandelt werden sollen.'], ['Reiner Text', 'Absätze behalten und übliche Aufzählungszeichen normalisieren, ohne neue Struktur zu erfinden.']], limitsTitle: 'Grenzen und Datenschutz', limits: 'Markdown bewahrt die Inhaltsstruktur statt des exakten Designs. Schriften, Farben, Layout-Container und interaktive Steuerelemente werden entfernt. Externe Ressourcen bleiben als Links oder Bildreferenzen erhalten; Skripte werden nicht ausgeführt.', faqTitle: 'FAQ zum HTML-zu-Markdown-Konverter', faq: [['Warum ist das Seitendesign verschwunden?', 'Markdown beschreibt die Inhaltsstruktur statt des exakten Designs, daher werden Schriften, Farben, Layout-Container und Steuerelemente entfernt.'], ['Wird der Zwischenablageinhalt hochgeladen?', 'Nein. Rich Text, HTML und reiner Text werden nur in diesem Browser gelesen und umgewandelt.'], ['Was tun bei einem Konvertierungsfehler?', 'Prüfen, ob die Eingabe lesbaren Inhalt enthält, oder zur HTML-Quelle wechseln und erneut einfügen.']], related: 'Verwandte Werkzeuge', url: 'URL zu Markdown', viewer: 'Markdown-Viewer'},
} as const;

export function PasteMarkdownPage({ language }: { language: Language }) {
  const isEnglish = language !== 'zh';
  const copy = pasteCopy[language];
  const pasteRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'rich' | 'html' | 'text'>('rich');
  const [source, setSource] = useState('');
  const [sourceKind, setSourceKind] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const reset = (nextMode: 'rich' | 'html' | 'text') => {
    setMode(nextMode);
    setSource('');
    setSourceKind('');
    setMarkdown('');
    setMessage('');
    if (pasteRef.current) pasteRef.current.textContent = '';
  };

  const onRichPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    const captured = html || text;
    setSource(captured);
    setSourceKind(html ? 'html' : 'text');
    setMarkdown('');
    setMessage('');
    if (pasteRef.current) pasteRef.current.textContent = text || (isEnglish ? 'Rich content captured' : '已捕获富文本内容');
  };

  const convert = (event: React.FormEvent) => {
    event.preventDefault();
    if (!source.trim()) return;
    const kind = mode === 'rich' ? sourceKind : mode;
    const output = kind === 'html' ? htmlToMarkdown(source) : plainTextToMarkdown(source);
    if (!output) {
      setMessage(isEnglish ? 'No readable content was found.' : '没有找到可转换的可读内容。');
      setMarkdown('');
      return;
    }
    setMessage('');
    setMarkdown(`${output}\n`);
  };

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold text-emerald-400">{copy.badge}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">{copy.intro}</p>
      </header>
      <section aria-labelledby="paste-form-title" className="rounded-2xl border border-[#1e293b] bg-[#0f1722] p-5 shadow-2xl shadow-black/30 sm:p-6">
        <h2 id="paste-form-title" className="text-lg font-bold text-white">{copy.form}</h2>
        <div className="mt-4 inline-flex flex-wrap rounded-xl border border-[#263445] bg-[#090d12] p-1">{(['rich', 'html', 'text'] as const).map(item => <button key={item} type="button" onClick={() => reset(item)} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${mode === item ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item === 'rich' ? copy.rich : item === 'html' ? copy.html : copy.text}</button>)}</div>
        <form onSubmit={convert} className="mt-4">
          {mode === 'rich' ? <div ref={pasteRef} role="textbox" aria-label={copy.richLabel} tabIndex={0} contentEditable suppressContentEditableWarning onPaste={onRichPaste} className="min-h-52 rounded-xl border border-dashed border-[#334155] bg-[#090d12] p-5 text-sm leading-7 text-slate-300 outline-none empty:before:text-slate-600 empty:before:content-[attr(data-placeholder)] focus:border-emerald-500" data-placeholder={copy.richPlaceholder} /> : <><label className="sr-only" htmlFor="paste-source">{mode === 'html' ? copy.html : copy.text}</label><textarea id="paste-source" value={source} onChange={event => { setSource(event.target.value); setMarkdown(''); }} rows={14} placeholder={mode === 'html' ? copy.exampleHtml : copy.textPlaceholder} spellCheck={mode === 'text'} className="w-full resize-y rounded-xl border border-[#263445] bg-[#090d12] p-4 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500" /></>}
          <button type="submit" disabled={!source.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><ClipboardPaste className="h-4 w-4" />{copy.convert}</button>
        </form>
        <p className="mt-3 text-xs leading-6 text-slate-500">{copy.privacy}</p>
      </section>
      {message && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>}
      {markdown && <section aria-labelledby="paste-result-title" className="space-y-4"><h2 id="paste-result-title" className="text-xl font-bold text-white">{copy.result}</h2><div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1722]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3"><span className="text-sm font-semibold text-slate-200">pasted-content.md</span><div className="flex gap-2"><button type="button" onClick={() => void copyMarkdown()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#263445] px-3 py-1.5 text-xs text-slate-300 hover:text-white"><Copy className="h-3.5 w-3.5" />{copied ? copy.copied : copy.copy}</button><button type="button" onClick={() => downloadText(markdown, 'pasted-content.md')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-3.5 w-3.5" />{copy.download}</button></div></div><pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap p-4 text-xs leading-6 text-emerald-100">{markdown}</pre></div></section>}
      <section aria-labelledby="paste-example-title" className="space-y-4"><h2 id="paste-example-title" className="text-xl font-bold text-white">{copy.exampleTitle}</h2><div className="grid gap-4 md:grid-cols-2"><pre className="overflow-auto rounded-xl border border-[#1e293b] bg-[#0d131c] p-4 text-xs leading-6 text-slate-300">{copy.exampleHtml}</pre><pre className="overflow-auto rounded-xl border border-[#1e293b] bg-[#0d131c] p-4 text-xs leading-6 text-emerald-100">{copy.exampleMarkdown}</pre></div></section>
      <section aria-labelledby="paste-details-title" className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-3"><div className="md:col-span-3"><h2 id="paste-details-title" className="text-xl font-bold text-white">{copy.modesTitle}</h2></div>{copy.modes.map(([title, description]) => <div key={title} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{description}</p></div>)}</section>
      <section className="grid gap-4 border-t border-[#1e293b] pt-8 md:grid-cols-2"><div><h2 className="text-xl font-bold text-white">{copy.limitsTitle}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{copy.limits}</p></div><div><h2 className="text-xl font-bold text-white">{language === 'zh' ? '隐私与本地处理' : language === 'en' ? 'Privacy and local processing' : language === 'ja' ? 'プライバシーとローカル処理' : language === 'es' ? 'Privacidad y procesamiento local' : 'Datenschutz und lokale Verarbeitung'}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{copy.privacy}</p></div></section>
      <section aria-labelledby="paste-faq-title" className="space-y-4 border-t border-[#1e293b] pt-8"><h2 id="paste-faq-title" className="text-xl font-bold text-white">{copy.faqTitle}</h2><div className="grid gap-3 md:grid-cols-2">{copy.faq.map(([question, answer]) => <div key={question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-slate-200">{question}</h3><p className="mt-2 text-xs leading-6 text-slate-400">{answer}</p></div>)}</div></section>
      <nav aria-label={copy.related} className="flex flex-wrap gap-4 border-t border-[#1e293b] pt-6 text-sm text-emerald-300"><a href="/url-to-markdown">{copy.url}</a><a href="/markdown-viewer">{copy.viewer}</a></nav>
    </article>
  );
}
