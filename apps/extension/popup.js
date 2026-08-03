// Herdown Extension Popup Logic

const MAX_SOURCE_HTML = 5_000_000;
const MAX_OBSIDIAN_URI = 200_000;

let pageData = null;
let currentMarkdown = '';
let currentTitle = '';
let activeTabId = null;
let statusTimer = null;

const isEnglish = navigator.language.toLowerCase().startsWith('en');
const copy = isEnglish ? {
  stats: 'Local processing', scope: 'Extract range', preparing: 'Preparing', full: 'Full page', selection: 'Selected text', picker: 'Pick element',
  loading: 'Reading the page and preparing clean Markdown...', noTab: 'Unable to read the active tab.', invalidPage: 'Open the extension on a regular webpage, then try again.',
  refresh: 'Refresh the page and try Herdown again.', noData: 'No page data was returned. Refresh and try again.', noSelection: 'No text is selected on this page.',
  pickerStarted: 'Picker started. Click an element on the page, then reopen Herdown.', pickerFailed: 'Could not start the picker. Refresh the page and try again.',
  noMarkdown: 'Create Markdown before using this action.', obsidianLong: 'This content is too long for a direct Obsidian link. Use download or copy instead.',
  obsidianTried: 'Tried to open Obsidian. If it did not open, use download or copy.', copied: 'Markdown copied to the clipboard.', downloading: 'Markdown download started.',
  tooLarge: 'This page is too large to process in the popup. Try selecting a smaller section.', badClipboard: 'Clipboard access was not available.',
  wordCount: ' chars | about ', minutes: ' min', more: '... (more content is available in the exported file)'
} : {
  stats: '本地处理', scope: '提取范围', preparing: '准备中', full: '完整网页', selection: '划选片段', picker: '元素拾取',
  loading: '正在读取网页并整理为干净Markdown...', noTab: '无法读取当前激活的标签页。', invalidPage: '请在普通网页上打开插件后再试。',
  refresh: '请刷新当前页面后再次尝试。', noData: '没有读取到网页内容，请刷新后再试。', noSelection: '当前页面未划选任何文本。',
  pickerStarted: '元素拾取已开始。点击网页中的元素后，重新打开Herdown继续处理。', pickerFailed: '无法启动元素拾取，请刷新页面后再试。',
  noMarkdown: '请先生成Markdown再使用此功能。', obsidianLong: '内容过长，无法通过链接直接发送到Obsidian，请改用下载或复制。',
  obsidianTried: '已尝试打开Obsidian。如果没有打开，请使用下载或复制。', copied: 'Markdown已复制到剪贴板。', downloading: 'Markdown下载已开始。',
  tooLarge: '页面内容过大，无法在插件弹窗中处理，请改为划选较小片段。', badClipboard: '当前浏览器不允许访问剪贴板。',
  wordCount: '字 | 约', minutes: '分钟', more: '……导出文件中包含更多内容'
};

document.addEventListener('DOMContentLoaded', async () => {
  applyLocale();
  bindActions();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id || null;

  const pending = await chrome.storage.local.get(['pendingClip', 'pendingPicker']);
  const pendingData = pending.pendingPicker || pending.pendingClip;
  const pendingKey = pending.pendingPicker ? 'pendingPicker' : pending.pendingClip ? 'pendingClip' : null;

  if (pendingData?.html) {
    pageData = pendingData;
    await chrome.storage.local.remove(pendingKey);
    initView();
    showStatus(pending.pendingPicker ? (isEnglish ? 'Picked content is ready.' : '已载入刚刚拾取的内容。') : (isEnglish ? 'Context-menu content is ready.' : '已载入右键提取的内容。'));
    return;
  }

  if (!activeTabId) {
    setPreview(copy.noTab);
    return;
  }

  setPreview(copy.loading);
  chrome.tabs.sendMessage(activeTabId, { action: 'GET_PAGE_DATA' }, (res) => {
    if (chrome.runtime.lastError) {
      setPreview(copy.invalidPage);
      return;
    }
    if (!res || !res.html) {
      setPreview(copy.noData);
      return;
    }
    pageData = res;
    initView();
  });
});

function applyLocale() {
  document.documentElement.lang = isEnglish ? 'en' : 'zh-CN';
  document.title = isEnglish ? 'Herdown Clipper' : 'Herdown剪藏';
  const text = {
    'stats-info': copy.stats,
    'scope-label': copy.scope,
    'btn-full': copy.full,
    'btn-selection': copy.selection,
    'btn-picker': copy.picker,
    'btn-obsidian': isEnglish ? 'Send to Obsidian' : '存入Obsidian',
    'btn-copy': isEnglish ? 'Copy Markdown' : '复制Markdown',
    'btn-download': isEnglish ? 'Download.md' : '下载.md文件',
    'privacy-note': isEnglish ? 'Page content is processed in this browser and is not uploaded.' : '内容只在当前浏览器处理，不上传页面内容'
  };
  Object.entries(text).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function bindActions() {
  document.getElementById('btn-full').addEventListener('click', () => {
    if (!ensurePageData()) return;
    setActiveMode('btn-full');
    renderMarkdown(pageData.html);
  });

  document.getElementById('btn-selection').addEventListener('click', () => {
    if (!ensurePageData()) return;
    setActiveMode('btn-selection');
    if (pageData.selection) {
      renderMarkdown(`<div>${pageData.selection}</div>`);
    } else {
      setPreview(copy.noSelection);
    }
  });

  document.getElementById('btn-picker').addEventListener('click', () => {
    if (!activeTabId) {
      showStatus(copy.pickerFailed);
      return;
    }
    chrome.tabs.sendMessage(activeTabId, { action: 'START_ELEMENT_PICKER' }, (pickedRes) => {
      if (chrome.runtime.lastError || !pickedRes?.ok) {
        showStatus(copy.pickerFailed);
        return;
      }
      showStatus(copy.pickerStarted);
      window.close();
    });
  });

  document.getElementById('btn-obsidian').addEventListener('click', () => {
    if (!ensureMarkdown()) return;
    if (currentMarkdown.length > MAX_OBSIDIAN_URI) {
      showStatus(copy.obsidianLong);
      return;
    }
    const cleanFileName = makeFileName(currentTitle || 'Herdown Article', 'Herdown Article');
    const obsidianUri = `obsidian://new?name=${encodeURIComponent(cleanFileName)}&content=${encodeURIComponent(currentMarkdown)}`;
    window.open(obsidianUri, '_blank');
    showStatus(copy.obsidianTried);
  });

  document.getElementById('btn-copy').addEventListener('click', async () => {
    if (!ensureMarkdown()) return;
    try {
      await navigator.clipboard.writeText(currentMarkdown);
      showStatus(copy.copied);
    } catch {
      showStatus(copy.badClipboard);
    }
  });

  document.getElementById('btn-download').addEventListener('click', () => {
    if (!ensureMarkdown()) return;
    const cleanTitle = makeFileName(currentTitle || 'Herdown Article', 'Herdown Article');
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url,
      filename: `Clippings/${cleanTitle}.md`,
      saveAs: false
    }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        showStatus(isEnglish ? `Download failed: ${error.message}` : `下载失败：${error.message}`);
      } else {
        showStatus(copy.downloading);
      }
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });
}

function ensurePageData() {
  if (pageData?.html) return true;
  showStatus(copy.refresh);
  return false;
}

function ensureMarkdown() {
  if (currentMarkdown) return true;
  showStatus(copy.noMarkdown);
  return false;
}

function setActiveMode(id) {
  ['btn-full', 'btn-selection', 'btn-picker'].forEach((buttonId) => {
    document.getElementById(buttonId).classList.toggle('active', buttonId === id);
  });
}

function initView() {
  renderMarkdown(pageData.html);
}

function renderMarkdown(rawHtml) {
  if (!rawHtml || rawHtml.length > MAX_SOURCE_HTML) {
    currentMarkdown = '';
    setPreview(copy.tooLarge);
    return;
  }

  let result = null;
  const isWeChat = pageData.url.includes('mp.weixin.qq.com');

  if (isWeChat && window.HerdownCore && typeof window.HerdownCore.parseMarkdown === 'function') {
    result = window.HerdownCore.parseMarkdown(rawHtml, pageData.url);
  } else if (window.Readability && window.TurndownService) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      const baseEl = doc.createElement('base');
      baseEl.href = pageData.url;
      doc.head.appendChild(baseEl);

      let meta = null;
      const metaEl = doc.getElementById('herdown-metadata');
      if (metaEl) {
        try {
          meta = JSON.parse(metaEl.textContent);
        } catch (error) {
          console.error('[Herdown] Failed to parse injected metadata:', error);
        }
      }

      const article = new Readability(doc).parse();
      if (article?.content) {
        const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', hr: '---' });
        if (window.turndownPluginGfm?.gfm) turndownService.use(window.turndownPluginGfm.gfm);

        const cleanTitle = doc.title || article.title || pageData.title;
        const today = new Date();
        const formatToday = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
        let frontmatter = '';
        if (meta && (pageData.url.includes('x.com') || pageData.url.includes('twitter.com'))) {
          const pubDate = meta.published ? new Date(meta.published) : null;
          const formatPub = pubDate && !Number.isNaN(pubDate.getTime())
            ? `${String(pubDate.getMonth() + 1).padStart(2, '0')}/${String(pubDate.getDate()).padStart(2, '0')}/${pubDate.getFullYear()}`
            : '';
          frontmatter = [
            '---',
            `title: "${escapeYaml(cleanTitle)}"`,
            `source: "${escapeYaml(pageData.url)}"`,
            meta.author ? `author: ${escapeYaml(meta.author)}` : null,
            formatPub ? `published: ${formatPub}` : null,
            `created: ${formatToday}`,
            meta.description ? `description: "${escapeYaml(meta.description)}"` : null,
            'tags:',
            '  - clippings',
            '---'
          ].filter(Boolean).join('\n');
        } else {
          let domain = '';
          try { domain = new URL(pageData.url).hostname; } catch {}
          frontmatter = `---\ntitle: "${escapeYaml(cleanTitle)}"\nsource_url: "${escapeYaml(pageData.url)}"\ndomain: "${escapeYaml(domain)}"\ntags: [herdown, clippings]\n---`;
        }

        result = { title: cleanTitle, markdown: turndownService.turndown(article.content), frontmatter };
      }
    } catch (error) {
      console.error('[Herdown] Readability pipeline failed:', error);
    }
  }

  if (!result) {
    if (window.HerdownCore && typeof window.HerdownCore.parseMarkdown === 'function') {
      result = window.HerdownCore.parseMarkdown(rawHtml, pageData.url);
    } else {
      result = { title: pageData.title, markdown: rawHtml.replace(/<[^>]+>/g, ''), frontmatter: `---\nsource_url: "${escapeYaml(pageData.url)}"\n---` };
    }
  }

  currentTitle = result.title || pageData.title;
  currentMarkdown = `${result.frontmatter}\n\n# ${currentTitle}\n\n${result.markdown}`;
  const wordCount = result.markdown.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 350));
  document.getElementById('char-info').innerText = isEnglish
    ? `${wordCount}${copy.wordCount}${readingTime}${copy.minutes}`
    : `${wordCount}${copy.wordCount}${readingTime}${copy.minutes}`;
  setPreview(`${currentMarkdown.slice(0, 600)}\n\n${copy.more}`);
}

function makeFileName(value, fallback) {
  const clean = String(value).replace(/["'“”‘’/\\?%*:|<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  return clean || fallback;
}

function escapeYaml(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

function setPreview(text) {
  const preview = document.getElementById('preview-box');
  if (preview) preview.innerText = text;
}

function showStatus(text) {
  const statusBar = document.getElementById('status-bar');
  if (!statusBar) return;
  if (statusTimer) clearTimeout(statusTimer);
  statusBar.innerText = text;
  statusBar.style.color = '#34d399';
  statusTimer = setTimeout(() => {
    statusBar.innerText = '';
  }, 4000);
}
