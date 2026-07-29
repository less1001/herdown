// Herdown Extension Popup Logic

let pageData = null;
let currentMarkdown = '';
let currentTitle = '';

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    document.getElementById('preview-box').innerText = '错误: 无法读取当前激活的标签页。';
    return;
  }

  // Request page data from content script
  chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_DATA' }, (res) => {
    if (!res) {
      document.getElementById('preview-box').innerText = '提示: 请刷新当前页面后再次尝试使用 Herdown 剪藏。';
      return;
    }
    pageData = res;
    initView();
  });

  // Mode Buttons
  document.getElementById('btn-full').addEventListener('click', () => {
    setActiveMode('btn-full');
    renderMarkdown(pageData.html);
  });

  document.getElementById('btn-selection').addEventListener('click', () => {
    setActiveMode('btn-selection');
    if (pageData.selection) {
      renderMarkdown(`<div>${pageData.selection}</div>`);
    } else {
      document.getElementById('preview-box').innerText = '当前页面未划选任何文本！请先在网页上划选想要剪藏的段落。';
    }
  });

  document.getElementById('btn-picker').addEventListener('click', () => {
    window.close(); // Close popup so user can pick
    chrome.tabs.sendMessage(tab.id, { action: 'START_ELEMENT_PICKER' }, (pickedRes) => {
      // Picked handler
    });
  });

  // Obsidian Direct URI
  document.getElementById('btn-obsidian').addEventListener('click', () => {
    if (!currentMarkdown) return;
    const cleanTitle = (currentTitle || 'Herdown Note').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const vault = ''; // default active vault
    const obsidianUri = `obsidian://new?title=${encodeURIComponent(cleanTitle)}&content=${encodeURIComponent(currentMarkdown)}`;
    window.open(obsidianUri, '_self');
    showStatus('已成功呼出 Obsidian 并创建新笔记！');
  });

  // Copy Markdown
  document.getElementById('btn-copy').addEventListener('click', () => {
    if (!currentMarkdown) return;
    navigator.clipboard.writeText(currentMarkdown);
    showStatus('已复制干净 Markdown 到剪贴板！');
  });

  // Download Markdown File
  document.getElementById('btn-download').addEventListener('click', () => {
    if (!currentMarkdown) return;
    const cleanTitle = (currentTitle || 'Herdown Article').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: `Clippings/${cleanTitle}.md`,
      saveAs: false
    });
    showStatus('已开始下载 Markdown 到 Clippings/ 目录！');
  });
});

function setActiveMode(id) {
  ['btn-full', 'btn-selection', 'btn-picker'].forEach(b => {
    document.getElementById(b).classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

function initView() {
  if (pageData.isZhihuQuestion) {
    document.getElementById('zhihu-panel').classList.add('show');
  }

  renderMarkdown(pageData.html);
}

function renderMarkdown(rawHtml) {
  // Derive title & platform
  let platform = 'general';
  if (pageData.url.includes('weixin.qq.com')) platform = 'wechat';
  else if (pageData.url.includes('xiaohongshu.com')) platform = 'xiaohongshu';
  else if (pageData.url.includes('zhihu.com')) platform = 'zhihu';
  else if (pageData.url.includes('36kr.com')) platform = 'kr36';

  let title = pageData.title.replace(/- 知乎$/, '').replace(/_36氪$/, '').trim();
  currentTitle = title;

  // Simple pure HTML sanitizer -> Markdown for Extension Popup
  let md = rawHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n## $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, '![图片]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Remove orphan bold markers
  md = md.replace(/\*\*\s+/g, '**').replace(/\s+\*\*/g, '**');

  const wordCount = md.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 350));

  const frontmatter = `---
source_url: "${pageData.url}"
title: "${title}"
published_at: "${new Date().toISOString().split('T')[0]}"
saved_at: "${new Date().toISOString()}"
platform: ${platform}
word_count: ${wordCount}
reading_time: "${readingTime} min"
tags:
  - herdown
  - herdown/${platform}
  - clippings
parse_status: ok
---`;

  currentMarkdown = `${frontmatter}\n\n# ${title}\n\n${md}`;

  document.getElementById('char-info').innerText = `${wordCount} 字 | 约 ${readingTime} 分钟`;
  document.getElementById('preview-box').innerText = currentMarkdown.slice(0, 500) + '\n\n... (更多内容导出后可见)';
}

function showStatus(text) {
  const sb = document.getElementById('status-bar');
  sb.innerText = `✨ ${text}`;
  sb.style.color = '#34d399';
  setTimeout(() => {
    sb.innerText = '支持智能生成 tags: [herdown, herdown/平台, clippings]';
    sb.style.color = '#64748b';
  }, 3000);
}
