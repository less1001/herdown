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
    if (chrome.runtime.lastError) {
      document.getElementById('preview-box').innerText = '提示: 请在有效的网页上打开插件，或者刷新当前页面后再次尝试。';
      return;
    }
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
      if (chrome.runtime.lastError) {
        console.warn('[Herdown] Could not start element picker:', chrome.runtime.lastError.message);
      }
    });
  });

  // Obsidian Direct URI
  document.getElementById('btn-obsidian').addEventListener('click', () => {
    if (!currentMarkdown) return;
    const cleanFileName = (currentTitle || 'Herdown Article')
      .replace(/["'“”‘’/\\?%*:|<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const obsidianUri = `obsidian://new?name=${encodeURIComponent(cleanFileName)}&content=${encodeURIComponent(currentMarkdown)}`;
    window.open(obsidianUri, '_blank');
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
    
    // Listen to Zhihu limit and sort changes to trigger re-render in real time
    const limitEl = document.getElementById('zhihu-limit');
    const sortEl = document.getElementById('zhihu-sort');
    if (limitEl) limitEl.addEventListener('input', () => renderMarkdown(pageData.html));
    if (sortEl) sortEl.addEventListener('change', () => renderMarkdown(pageData.html));
  }

  renderMarkdown(pageData.html);
}

function renderMarkdown(rawHtml) {
  let result = null;
  const isWeChat = pageData.url.includes('mp.weixin.qq.com');

  if (isWeChat && window.HerdownCore && typeof window.HerdownCore.parseMarkdown === 'function') {
    // 1. WeChat & Zhihu customized parsing logic via HerdownCore
    const limitEl = document.getElementById('zhihu-limit');
    const sortEl = document.getElementById('zhihu-sort');
    const zhihuLimit = limitEl ? parseInt(limitEl.value, 10) || 5 : 5;
    const zhihuSort = sortEl ? sortEl.value : 'votes';
    result = window.HerdownCore.parseMarkdown(rawHtml, pageData.url, { zhihuLimit, zhihuSort });
  } else if (window.Readability && window.TurndownService) {
    // 2. Universal fallback: Mozilla Readability + Turndown GFM Pipeline
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      
      // Fix relative URLs in document before feeding it to readability
      const baseEl = doc.createElement('base');
      baseEl.href = pageData.url;
      doc.head.appendChild(baseEl);

      // Try to parse Herdown metadata injected from content.js
      let meta = null;
      const metaEl = doc.getElementById('herdown-metadata');
      if (metaEl) {
        try {
          meta = JSON.parse(metaEl.textContent);
        } catch (e) {
          console.error('[Herdown] Failed to parse injected metadata:', e);
        }
      }

      const reader = new Readability(doc);
      const article = reader.parse();
      if (article && article.content) {
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          hr: '---'
        });

        // Use GFM plugin for tables, strikethroughs, tasks
        if (window.turndownPluginGfm && window.turndownPluginGfm.gfm) {
          turndownService.use(window.turndownPluginGfm.gfm);
        }

        const cleanTitle = doc.title || article.title || pageData.title;

        // Construct customized Frontmatter to mirror Obsidian Clipper
        let frontmatter = '';
        if (meta && (pageData.url.includes('x.com') || pageData.url.includes('twitter.com'))) {
          const today = new Date();
          const formatToday = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
          let formatPub = '';
          if (meta.published) {
            const pubDate = new Date(meta.published);
            formatPub = `${String(pubDate.getMonth() + 1).padStart(2, '0')}/${String(pubDate.getDate()).padStart(2, '0')}/${pubDate.getFullYear()}`;
          }

          frontmatter = [
            '---',
            `title: "${cleanTitle.replace(/"/g, '\\"')}"`,
            `source: "${pageData.url}"`,
            meta.author ? `author: ${meta.author}` : null,
            formatPub ? `published: ${formatPub}` : null,
            `created: ${formatToday}`,
            meta.description ? `description: "${meta.description.replace(/"/g, '\\"')}"` : null,
            'tags:',
            '  - clippings',
            '---'
          ].filter(Boolean).join('\n');
        } else {
          frontmatter = `---\ntitle: "${cleanTitle.replace(/"/g, '\\"')}"\nsource_url: "${pageData.url}"\ndomain: "${new URL(pageData.url).hostname}"\ntags: [herdown, clippings]\n---`;
        }

        result = {
          title: cleanTitle,
          markdown: turndownService.turndown(article.content),
          frontmatter: frontmatter
        };
      }
    } catch (e) {
      console.error('[Herdown] Readability pipeline failed:', e);
    }
  }

  // Fallback if pipelines fail or not loaded
  if (!result) {
    if (window.HerdownCore && typeof window.HerdownCore.parseMarkdown === 'function') {
      result = window.HerdownCore.parseMarkdown(rawHtml, pageData.url);
    } else {
      result = {
        title: pageData.title,
        markdown: rawHtml.replace(/<[^>]+>/g, ''),
        frontmatter: `---\nsource_url: "${pageData.url}"\n---`
      };
    }
  }

  currentTitle = result.title || pageData.title;
  
  const fullMarkdown = result.frontmatter + '\n\n# ' + currentTitle + '\n\n' + result.markdown;
  currentMarkdown = fullMarkdown;

  const wordCount = result.markdown.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 350));

  document.getElementById('char-info').innerText = `${wordCount} 字 | 约 ${readingTime} 分钟`;
  document.getElementById('preview-box').innerText = fullMarkdown.slice(0, 600) + '\n\n... (更多内容导出后可见)';
}

function showStatus(text) {
  const sb = document.getElementById('status-bar');
  sb.innerText = `✨ ${text}`;
  sb.style.color = '#34d399';
  setTimeout(() => {
    sb.innerText = '';
  }, 3000);
}
