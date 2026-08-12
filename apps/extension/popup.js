const DEFAULT_DOWNLOAD_FOLDER = 'Herdown md';
const DEFAULT_OBSIDIAN_FOLDER = 'Herdown';
const MAX_OBSIDIAN_URI = 200_000;
const DEFAULT_SETTINGS = {
  language: 'auto',
  downloadFolder: DEFAULT_DOWNLOAD_FOLDER,
  obsidianVault: '',
  obsidianFolder: DEFAULT_OBSIDIAN_FOLDER
};

let activeTabId = null;
let pageData = null;
let currentMarkdown = '';
let settings = { ...DEFAULT_SETTINGS };
let activeMode = 'full';

let english = false;
const enText = {
  full: 'Full article', selection: 'Selected text', reading: 'Reading the current page...',
  noTab: 'No active page is available.', invalid: 'Open Herdown on a regular webpage, then try again.',
  noSelection: 'Select text on the page first.', noContent: 'No readable article content was found.',
  copy: 'Copy Markdown', download: 'Download .md', obsidian: 'Save to Obsidian', retry: 'Extract again', settings: 'Settings', website: 'Open site',
  copied: 'Markdown copied.', downloaded: 'Download started.', obsidianLong: 'This clipping is too long for an Obsidian link. Download it instead.',
  obsidianTried: 'Sent to Obsidian.', title: 'Untitled clipping', chars: 'chars', contentView: 'Content preview', sourceView: 'Markdown source', viewLabel: 'View', source: 'Source'
};
const zhText = {
  full: '整篇文章', selection: '划选内容', reading: '正在读取当前页面...',
  noTab: '没有可读取的当前页面。', invalid: '请在普通网页上打开Herdown后重试。',
  noSelection: '请先在网页中划选内容。', noContent: '没有找到可剪藏的正文内容。',
  copy: '复制Markdown', download: '下载.md文件', obsidian: '保存到Obsidian', retry: '重新提取', settings: '设置', website: '打开官网',
  copied: 'Markdown已复制。', downloaded: '下载已开始。', obsidianLong: '内容过长，无法通过链接发送到Obsidian，请改用下载。',
  obsidianTried: '已发送到Obsidian。', title: '未命名剪藏', chars: '字', contentView: '内容预览', sourceView: 'Markdown源码', viewLabel: '查看方式', source: '来源'
};
let text = zhText;

let activeView = 'content';

document.addEventListener('DOMContentLoaded', () => { void bootstrap(); });

async function bootstrap() {
  bindActions();
  settings = { ...DEFAULT_SETTINGS, ...(await chrome.storage.sync.get(DEFAULT_SETTINGS)) };
  const updates = {};
  if (!settings.downloadFolder || ['Clippings', 'Herdown Clippings', 'Herdown'].includes(settings.downloadFolder)) {
    settings.downloadFolder = DEFAULT_DOWNLOAD_FOLDER;
    updates.downloadFolder = DEFAULT_DOWNLOAD_FOLDER;
  }
  if (!settings.obsidianFolder || ['Clippings', 'Herdown Clippings'].includes(settings.obsidianFolder)) {
    settings.obsidianFolder = DEFAULT_OBSIDIAN_FOLDER;
    updates.obsidianFolder = DEFAULT_OBSIDIAN_FOLDER;
  }
  if (Object.keys(updates).length) await chrome.storage.sync.set(updates);
  english = settings.language === 'en'
    ? true
    : settings.language === 'zh'
      ? false
      : navigator.language.toLowerCase().startsWith('en');
  text = english ? enText : zhText;
  applyCopy();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id || null;
  const pending = await chrome.storage.local.get(['herdownPendingClipV2', 'herdownPendingPickerV2']);
  const pendingData = pending.herdownPendingPickerV2 || pending.herdownPendingClipV2;
  if (pendingData?.ok) {
    pageData = pendingData;
    activeMode = pendingData.mode === 'selection' && pendingData.selectionHtml ? 'selection' : 'full';
    await chrome.storage.local.remove(['herdownPendingClipV2', 'herdownPendingPickerV2']);
    updateModeButtons();
    renderCurrent();
    return;
  }
  await readCurrentPage();
}

function applyCopy() {
  document.documentElement.lang = english ? 'en' : 'zh-CN';
  document.title = english ? 'Herdown Clipper' : 'Herdown剪藏';
  document.getElementById('full-page').textContent = text.full;
  document.getElementById('selection').textContent = text.selection;
  document.getElementById('content-view').textContent = text.contentView;
  document.getElementById('source-view').textContent = text.sourceView;
  document.querySelector('.view-tabs').setAttribute('aria-label', text.viewLabel);
  document.getElementById('save-obsidian').textContent = text.obsidian;
  document.getElementById('copy-markdown').textContent = text.copy;
  document.getElementById('download-markdown').textContent = text.download;
  document.getElementById('retry').textContent = text.retry;
  document.getElementById('website-link').textContent = text.website;
  document.getElementById('website-link').setAttribute('aria-label', text.website);
  document.getElementById('website-link').setAttribute('title', text.website);
  document.getElementById('settings').setAttribute('aria-label', text.settings);
  document.getElementById('settings').setAttribute('title', text.settings);
}

function bindActions() {
  document.getElementById('full-page').addEventListener('click', () => {
    activeMode = 'full';
    updateModeButtons();
    renderCurrent();
  });
  document.getElementById('selection').addEventListener('click', () => {
    activeMode = 'selection';
    updateModeButtons();
    renderCurrent();
  });
  document.getElementById('content-view').addEventListener('click', () => setActiveView('content'));
  document.getElementById('source-view').addEventListener('click', () => setActiveView('source'));
  document.getElementById('retry').addEventListener('click', () => { void readCurrentPage(); });
  document.getElementById('settings').addEventListener('click', () => { chrome.runtime.openOptionsPage(); });
  document.getElementById('copy-markdown').addEventListener('click', () => { void copyMarkdown(); });
  document.getElementById('download-markdown').addEventListener('click', downloadMarkdown);
  document.getElementById('save-obsidian').addEventListener('click', saveToObsidian);
  document.getElementById('preview').addEventListener('input', (event) => {
    currentMarkdown = event.target.value;
    updateCount();
  });
}

function updateModeButtons() {
  document.getElementById('full-page').classList.toggle('active', activeMode === 'full');
  document.getElementById('selection').classList.toggle('active', activeMode === 'selection');
}

function setActiveView(view) {
  activeView = view;
  document.getElementById('content-view').classList.toggle('active', view === 'content');
  document.getElementById('source-view').classList.toggle('active', view === 'source');
  document.getElementById('content-view').setAttribute('aria-selected', String(view === 'content'));
  document.getElementById('source-view').setAttribute('aria-selected', String(view === 'source'));
  document.getElementById('content-preview').hidden = view !== 'content';
  document.getElementById('preview').hidden = view !== 'source';
}

async function readCurrentPage() {
  setPreview(text.reading);
  setStatus('');
  if (!activeTabId || !await ensureContentScript(activeTabId)) {
    setPreview(text.invalid);
    return;
  }
  const response = await sendMessage(activeTabId, { action: 'HERDOWN_V2_READ_PAGE' });
  if (!response?.ok) {
    setPreview(response?.error || text.invalid);
    return;
  }
  pageData = response;
  renderCurrent();
}

async function ensureContentScript(tabId) {
  try {
    const [{ result: ready }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => globalThis.__HERDOWN_CLIPPER_V2__ === true
    });
    if (!ready) await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    return true;
  } catch {
    return false;
  }
}

function sendMessage(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(response);
    });
  });
}

function renderCurrent() {
  if (!pageData) {
    renderMarkdown(text.noContent);
    return;
  }
  const html = activeMode === 'selection' ? pageData.selectionHtml : pageData.html;
  if (!html?.trim()) {
    renderMarkdown(activeMode === 'selection' ? text.noSelection : text.noContent);
    return;
  }
  const isWeChat = pageData.kind === 'wechat';
  const markdown = removeLeadingTitle(
    parseWithDefuddle(html, pageData.url) || htmlToMarkdown(html, pageData.url, isWeChat),
    pageData.title,
    isWeChat
  );
  if (!markdown) {
    renderMarkdown(text.noContent);
    return;
  }
  currentMarkdown = `${buildFrontmatter(pageData)}\n\n${markdown}`;
  renderMarkdown(currentMarkdown);
  updateCount();
}

function renderMarkdown(markdown) {
  setPreview(markdown);
  document.getElementById('content-preview').innerHTML = markdownToPreview(markdown);
}

function markdownToPreview(markdown) {
  const withoutFrontmatter = String(markdown || '').replace(/^---\n[\s\S]*?\n---\n*/m, '');
  return escapeHtml(withoutFrontmatter)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .split(/\n{2,}/)
    .map((block) => /^<h[1-3]>/.test(block) ? block : `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function parseWithDefuddle(html, pageUrl) {
  const Defuddle = globalThis.Defuddle;
  if (typeof Defuddle !== 'function') return '';
  try {
    const documentNode = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    const result = new Defuddle(documentNode, {
      url: pageUrl,
      contentSelector: 'body',
      markdown: true,
      useAsync: false,
      removeExactSelectors: true,
      removePartialSelectors: true,
      removeHiddenElements: true,
      removeLowScoring: false,
      removeSmallImages: true,
      standardize: true
    }).parse();
    const markdown = String(result?.content || '').trim();
    return markdown.length >= 40 ? cleanupMarkdown(markdown, pageUrl.includes('mp.weixin.qq.com')) : '';
  } catch (error) {
    console.warn('Defuddle local parse failed; using the built-in fallback.', error);
    return '';
  }
}

function buildFrontmatter(data) {
  const lines = [
    '---',
    `title: "${yamlValue(data.title || text.title)}"`,
    `source: "${yamlValue(data.url)}"`,
    data.author ? `author: "${yamlValue(data.author)}"` : null,
    data.publisher ? `publisher: "${yamlValue(data.publisher)}"` : null,
    data.published ? `published: "${yamlValue(data.published)}"` : null,
    `created: "${localDate()}"`,
    data.description ? `description: "${yamlValue(data.description)}"` : null,
    'tags:',
    '  - clippings',
    '  - herdown',
    '---'
  ];
  return lines.filter(Boolean).join('\n');
}

function localDate() {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function htmlToMarkdown(html, pageUrl, isWeChat) {
  const documentNode = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const markdown = Array.from(documentNode.body.childNodes).map((node) => nodeToMarkdown(node, pageUrl, isWeChat)).join('');
  return cleanupMarkdown(markdown, isWeChat);
}

function nodeToMarkdown(node, pageUrl, isWeChat, listDepth = 0) {
  if (node.nodeType === Node.TEXT_NODE) return cleanInline(node.nodeValue || '', isWeChat);
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const element = node;
  const tag = element.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'video', 'audio', 'canvas'].includes(tag)) return '';
  const children = () => Array.from(element.childNodes).map((child) => nodeToMarkdown(child, pageUrl, isWeChat, listDepth)).join('');
  const inline = () => cleanInline(children(), isWeChat).replace(/\s+/g, ' ').trim();
  if (tag === 'br') return '\n';
  if (tag === 'img') {
    const source = absoluteUrl(element.getAttribute('data-src') || element.getAttribute('data-original') || element.getAttribute('data-lazy-src') || element.getAttribute('src'), pageUrl);
    return source ? `![${cleanInline(element.getAttribute('alt') || '', isWeChat)}](${source})` : '';
  }
  if (tag === 'a') {
    const label = inline();
    const href = absoluteUrl(element.getAttribute('href'), pageUrl);
    if (!href) return label;
    if (!label) return href;
    return `[${label}](${href})`;
  }
  if (/^h[1-6]$/.test(tag)) return `\n\n${'#'.repeat(Number(tag[1]))} ${inline()}\n\n`;
  if (tag === 'p' || tag === 'figcaption') return inline() ? `\n\n${inline()}\n\n` : '';
  if (tag === 'blockquote') return inline().split('\n').filter(Boolean).map((line) => `> ${line}`).join('\n') + '\n\n';
  if (tag === 'pre') return `\n\n\`\`\`\n${element.textContent.trim()}\n\`\`\`\n\n`;
  if (tag === 'code') return `\`${element.textContent.trim()}\``;
  if (tag === 'strong' || tag === 'b') return `**${inline()}**`;
  if (tag === 'em' || tag === 'i') return `*${inline()}*`;
  if (tag === 'del' || tag === 's') return `~~${inline()}~~`;
  if (tag === 'hr') return '\n\n---\n\n';
  if (tag === 'ul' || tag === 'ol') {
    const ordered = tag === 'ol';
    const items = Array.from(element.children).filter((child) => child.tagName?.toLowerCase() === 'li');
    return `\n\n${items.map((item, index) => {
      const content = Array.from(item.childNodes).map((child) => nodeToMarkdown(child, pageUrl, isWeChat, listDepth + 1)).join('');
      const marker = ordered ? `${index + 1}. ` : '- ';
      return `${'  '.repeat(listDepth)}${marker}${cleanupMarkdown(content, isWeChat).replace(/\n/g, '\n  ')}`;
    }).join('\n')}\n\n`;
  }
  if (tag === 'table') return tableToMarkdown(element, pageUrl, isWeChat);
  if (['div', 'section', 'article', 'main', 'figure', 'header', 'footer', 'li'].includes(tag)) return `\n${children()}\n`;
  return children();
}

function tableToMarkdown(table, pageUrl, isWeChat) {
  const rows = Array.from(table.querySelectorAll('tr')).map((row) => Array.from(row.querySelectorAll('th, td')).map((cell) => {
    return cleanInline(Array.from(cell.childNodes).map((node) => nodeToMarkdown(node, pageUrl, isWeChat)).join(), isWeChat).replace(/\|/g, '\\|').trim();
  })).filter((row) => row.length);
  if (!rows.length) return '';
  const width = Math.max(...rows.map((row) => row.length));
  const normalize = (row) => Array.from({ length: width }, (_, index) => row[index] || '');
  const output = [normalize(rows[0]), Array(width).fill('---'), ...rows.slice(1).map(normalize)];
  return `\n\n${output.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n`;
}

function cleanInline(value, isWeChat) {
  return String(value || '').replace(/\u00a0/g, ' ').replace(/[\t\r]+/g, ' ');
}

function cleanupMarkdown(value, isWeChat) {
  const destinations = [];
  const protectedLinks = String(value || '').replace(/\]\(([^\n)]+)\)/g, (_match, destination) => {
    const index = destinations.push(destination) - 1;
    return `](__HERDOWN_LINK_${index}__)`;
  });
  const cleaned = cleanInline(protectedLinks, isWeChat)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
  return cleaned.replace(/__HERDOWN_LINK_(\d+)__/g, (_match, index) => destinations[Number(index)] || '');
}

function removeLeadingTitle(markdown, title, isWeChat) {
  const lines = String(markdown || '').split('\n');
  const normalizedTitle = cleanInline(title || '', isWeChat).replace(/\s+/g, ' ').trim().toLowerCase();
  if (!normalizedTitle) return markdown;

  // Some publishers place category links before the article H1. Remove only a
  // matching H1 near the beginning so the note title is represented once.
  const titleLine = lines.findIndex((line, index) => {
    if (index > 24 || !/^#\s+/.test(line)) return false;
    const heading = cleanInline(line.replace(/^#\s+/, ''), isWeChat).replace(/\s+/g, ' ').trim().toLowerCase();
    return heading === normalizedTitle;
  });
  if (titleLine < 0) return markdown;

  lines.splice(titleLine, 1);
  if (lines[titleLine] === '') lines.splice(titleLine, 1);
  return lines.join('\n').replace(/^\n+/, '');
}

function absoluteUrl(value, base) {
  if (!value || value.startsWith('data:') || value.startsWith('javascript:')) return '';
  try { return new URL(value, base).href; } catch { return ''; }
}

function yamlValue(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ').trim();
}

function makeFileName(value) {
  return String(value || text.title).replace(/["'“”‘’/\\?%*:|<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) || text.title;
}

async function copyMarkdown() {
  if (!currentMarkdown) return;
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    setStatus(text.copied);
  } catch {
    setStatus(english ? 'Clipboard access was blocked.' : '浏览器阻止了剪贴板访问。', true);
  }
}

function downloadMarkdown() {
  if (!currentMarkdown) return;
  const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url,
    filename: `${settings.downloadFolder || DEFAULT_DOWNLOAD_FOLDER}/${makeFileName(pageData?.title)}.md`,
    saveAs: false
  }, () => {
    const error = chrome.runtime.lastError;
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(error ? error.message : text.downloaded, Boolean(error));
  });
}

function saveToObsidian() {
  if (!currentMarkdown) return;
  if (currentMarkdown.length > MAX_OBSIDIAN_URI) {
    setStatus(text.obsidianLong, true);
    return;
  }
  const noteName = makeFileName(pageData?.title);
  const notePath = settings.obsidianFolder
    ? `${settings.obsidianFolder.replace(/^\/+|\/+$/g, '')}/${noteName}`
    : '';
  const params = [
    [notePath ? 'file' : 'name', notePath || noteName],
    ['content', currentMarkdown],
    ...(settings.obsidianVault ? [['vault', settings.obsidianVault]] : [])
  ].map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  window.open(`obsidian://new?${params}`, '_blank');
  setStatus(text.obsidianTried);
}

function setPreview(value) {
  document.getElementById('preview').value = value;
  document.getElementById('content-preview').innerHTML = markdownToPreview(value);
}

function updateCount() {
  document.getElementById('count-label').textContent = currentMarkdown ? `${currentMarkdown.length}${text.chars}` : '';
}

function setStatus(value, isError = false) {
  const element = document.getElementById('status');
  element.textContent = value;
  element.style.color = isError ? '#f87171' : '#34d399';
}
