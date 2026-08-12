if (!globalThis.__HERDOWN_CLIPPER_V2__) {
  globalThis.__HERDOWN_CLIPPER_V2__ = true;
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'HERDOWN_V2_READ_PAGE') {
      try {
        sendResponse(extractPage(request.selectionText || ''));
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unable to read this page.' });
      }
      return false;
    }
    if (request.action === 'HERDOWN_V2_START_PICKER') {
      startPicker();
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });
}

function extractPage(selectionText = '') {
  const isWeChat = location.hostname === 'mp.weixin.qq.com';
  const content = isWeChat
    ? document.querySelector('#js_content, .rich_media_content')
    : findArticleRoot() || document.body;
  if (!content) return { ok: false, error: 'No readable article content was found.' };

  const clone = content.cloneNode(true);
  removeNoise(clone, isWeChat);
  const selectionHtml = selectedHtml() || (selectionText.trim() ? `<p>${escapeHtml(selectionText)}</p>` : '');
  const title = cleanText(isWeChat
    ? document.querySelector('#activity-name, .rich_media_title')?.textContent || document.title
    : document.querySelector('h1')?.textContent || document.title);
  const metadata = extractMetadata(isWeChat);
  const published = cleanText(isWeChat
    ? document.querySelector('#publish_time, .publish_time')?.textContent
    : document.querySelector('time[datetime], time, [itemprop="datePublished"]')?.getAttribute('datetime') || document.querySelector('time, [itemprop="datePublished"]')?.textContent);
  const description = firstParagraph(clone);
  return {
    ok: true,
    kind: isWeChat ? 'wechat' : 'article',
    url: location.href,
    title,
    author: metadata.author,
    publisher: metadata.publisher,
    published,
    description,
    html: clone.innerHTML,
    selectionHtml
  };
}

function extractMetadata(isWeChat) {
  return {
    author: cleanText(isWeChat
      ? document.querySelector('#js_author_name')?.textContent
      : document.querySelector('[rel="author"], .author, [itemprop="author"]')?.textContent),
    publisher: cleanText(isWeChat
      ? document.querySelector('#js_name, .rich_media_meta_nickname')?.textContent
      : '')
  };
}

function removeNoise(root, isWeChat) {
  const selectors = [
    'script', 'style', 'noscript', 'iframe', 'form', 'button', 'svg', 'video', 'audio', 'canvas',
    'nav', 'aside', 'footer', '[role="navigation"]', '[role="complementary"]',
    '.advertisement', '.ads', '.ad', '.ad-container', '[class*="advert"]', '[id*="advert"]',
    '[class*="recommend"]', '[class*="comment"]', '[class*="toolbar"]', '[class*="share"]', '[class*="qr_code"]'
  ];
  if (isWeChat) selectors.push('.js_praise_container', '.reward_area', '.rich_media_tool', '.rich_media_area_extra', '#js_report_article', '#js_tags', '.profile_container');
  selectors.forEach((selector) => root.querySelectorAll(selector).forEach((element) => element.remove()));
  root.querySelectorAll('[data-src]').forEach((image) => {
    if (image.tagName?.toLowerCase() === 'img' && image.getAttribute('data-src')) image.setAttribute('src', image.getAttribute('data-src'));
  });
}

function findArticleRoot() {
  const selectors = [
    'article', '[itemprop="articleBody"]', '.article-content', '.post-content', '.entry-content',
    '.article-body', '.post-body', '[role="main"]', 'main'
  ];
  const candidates = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
  return candidates
    .filter((candidate) => candidate instanceof HTMLElement)
    .sort((left, right) => (right.innerText?.length || 0) - (left.innerText?.length || 0))[0] || null;
}

function selectedHtml() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return '';
  const wrapper = document.createElement('div');
  wrapper.appendChild(selection.getRangeAt(0).cloneContents());
  return wrapper.innerHTML;
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function firstParagraph(root) {
  const candidate = Array.from(root.querySelectorAll('p, h2, h3, div')).map((node) => cleanText(node.textContent)).find((value) => value.length >= 20);
  return candidate ? candidate.slice(0, 180) : '';
}

function cleanText(value) {
  return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function startPicker() {
  if (globalThis.__HERDOWN_PICKER_V2__) return;
  globalThis.__HERDOWN_PICKER_V2__ = true;
  const style = document.createElement('style');
  style.id = 'herdown-picker-style-v2';
  style.textContent = '.herdown-picker-v2 { outline: 2px solid #10b981 !important; outline-offset: 2px !important; cursor: crosshair !important; }';
  document.documentElement.appendChild(style);
  let hovered = null;
  const stop = () => {
    hovered?.classList.remove('herdown-picker-v2');
    style.remove();
    document.removeEventListener('mousemove', move, true);
    document.removeEventListener('click', choose, true);
    document.removeEventListener('keydown', keydown, true);
    globalThis.__HERDOWN_PICKER_V2__ = false;
  };
  const move = (event) => {
    hovered?.classList.remove('herdown-picker-v2');
    hovered = event.target;
    if (hovered instanceof Element) hovered.classList.add('herdown-picker-v2');
  };
  const choose = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (hovered instanceof Element) {
      const clone = hovered.cloneNode(true);
      removeNoise(clone, location.hostname === 'mp.weixin.qq.com');
      const metadata = extractMetadata(location.hostname === 'mp.weixin.qq.com');
      chrome.storage.local.set({ herdownPendingPickerV2: {
        ok: true,
        kind: location.hostname === 'mp.weixin.qq.com' ? 'wechat' : 'article',
        url: location.href,
        title: cleanText(document.querySelector('h1, #activity-name, .rich_media_title')?.textContent || document.title),
        ...metadata,
        published: '', description: firstParagraph(clone), html: clone.innerHTML, selectionHtml: ''
      } });
    }
    stop();
  };
  const keydown = (event) => { if (event.key === 'Escape') stop(); };
  document.addEventListener('mousemove', move, true);
  document.addEventListener('click', choose, true);
  document.addEventListener('keydown', keydown, true);
}
