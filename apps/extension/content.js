// Herdown Chrome Extension Content Script
// The script is injected only after an explicit user action.

const MAX_PAGE_HTML = 8_000_000;
let isInspectorActive = false;
let hoverElement = null;

if (!globalThis.__HERDOWN_CONTENT_SCRIPT_READY__) {
  globalThis.__HERDOWN_CONTENT_SCRIPT_READY__ = true;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PAGE_DATA') {
    const selection = window.getSelection() ? window.getSelection().toString().trim() : '';

    if (window.location.href.includes('zhihu.com/question/')) {
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button) => {
        if (button?.textContent?.includes('显示全部')) {
          button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          button.click();
        }
      });

      document.querySelectorAll('.RichContent').forEach((rich) => {
        const noscript = rich.querySelector('noscript');
        const innerContent = rich.querySelector('.RichContent-inner');
        if (noscript && innerContent) {
          innerContent.innerHTML = noscript.innerHTML;
          rich.querySelector('.ContentItem-more')?.remove();
        }
      });
    }

    waitForPageReady().then(() => {
      let targetHtml = document.documentElement.outerHTML;

      if (window.location.href.includes('okjike.com')) {
        const jikePost = document.querySelector('article') || document.querySelector('[class*="PostItem"]') || document.querySelector('[class*="JikePostCard"]');
        if (jikePost) {
          const clonedPost = jikePost.cloneNode(true);
          const noiseSelectors = [
            '[class*="actions"]', '[class*="comment"]', '[class*="Comment"]', '[class*="Reaction"]',
            '[class*="reactor"]', '[class*="Reactor"]', '[class*="interaction"]', '[class*="Interaction"]',
            'button', '[class*="Avatar"]', '[class*="UserRecommend"]', '[class*="Recommend"]',
            '[class*="Footer"]', '[class*="toolbar"]', '[class*="Toolbar"]', 'svg'
          ];
          noiseSelectors.forEach((selector) => clonedPost.querySelectorAll(selector).forEach((element) => element.remove()));
          targetHtml = `
            <html><head><title>${escapeHtml(document.title)}</title></head>
            <body><div class="jike-purified-content">${clonedPost.innerHTML}</div></body></html>`;
        }
      }

      if (window.location.href.includes('x.com') || window.location.href.includes('twitter.com')) {
        const tweetArticle = document.querySelector('article[data-testid="tweet"]');
        if (tweetArticle) {
          const userNameEl = tweetArticle.querySelector('[data-testid="User-Name"]');
          let authorHandle = '';
          userNameEl?.querySelectorAll('span').forEach((span) => {
            if (!authorHandle && span.innerText?.startsWith('@')) authorHandle = span.innerText.trim();
          });

          const publishedTime = tweetArticle.querySelector('time')?.getAttribute('datetime') || '';
          const textEl = tweetArticle.querySelector('[data-testid="tweetText"]');
          let cleanTitle = document.title;
          let description = '';
          if (textEl) {
            const fullText = textEl.innerText.trim();
            description = fullText.slice(0, 120);
            const firstLine = fullText.split('\n').map((line) => line.trim()).find(Boolean);
            if (firstLine) cleanTitle = firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
          }
          cleanTitle = cleanTitle.replace(/^\(\d+\)\s+/, '').replace(/\s+\/\s+X$/, '').replace(/\s+\|\s+Twitter$/, '');

          const clonedTweet = tweetArticle.cloneNode(true);
          ['[role="group"]', '[data-testid="caret"]', '[class*="r-1tlfct8"]'].forEach((selector) => {
            clonedTweet.querySelectorAll(selector).forEach((element) => element.remove());
          });
          clonedTweet.querySelectorAll('svg').forEach((svg) => svg.remove());

          const metadata = safeScriptJson({ author: authorHandle, published: publishedTime, description });
          targetHtml = `
            <html><head><title>${escapeHtml(cleanTitle)}</title>
              <script id="herdown-metadata" type="application/json">${metadata}</script>
            </head><body><div class="x-purified-tweet">${clonedTweet.innerHTML}</div></body></html>`;
        }
      }

      if (window.location.href.includes('csdn.net')) {
        const csdnContent = document.getElementById('article_content') || document.querySelector('.article_content');
        if (csdnContent) {
          const clonedContent = csdnContent.cloneNode(true);
          ['.hide-article-box', '.csdn-tracking-statistics', '[class*="opt-box"]', '.save_to_devcloud', '.reward-user-box', '.follow-text-box']
            .forEach((selector) => clonedContent.querySelectorAll(selector).forEach((element) => element.remove()));
          targetHtml = `
            <html><head><title>${escapeHtml(document.title)}</title></head>
            <body><div id="article_content">${clonedContent.innerHTML}</div></body></html>`;
        }
      }

      if (window.location.href.includes('mp.weixin.qq.com')) {
        const wechatContent = document.getElementById('js_content') || document.querySelector('.rich_media_content');
        if (wechatContent) {
          const nickname = document.querySelector('.rich_media_meta_nickname')?.innerText?.trim() || '';
          const author = document.querySelector('.rich_media_meta_text')?.innerText?.trim() || '';
          const publishTime = document.querySelector('#publish_time')?.innerText?.trim()
            || document.querySelector('.rich_media_meta_list .publish_time')?.innerText?.trim()
            || '';
          const publishTimestamp = document.querySelector('#publish_time')?.getAttribute('data-time') || '';
          targetHtml = `
            <html><head><title>${escapeHtml(document.title)}</title>
              <script>
                var nickname = ${safeScriptJson(nickname)};
                var msg_author = ${safeScriptJson(author)};
                var publish_time = ${safeScriptJson(publishTime)};
                var ct = ${safeScriptJson(publishTimestamp)};
              </script>
            </head><body><div id="js_content">${wechatContent.innerHTML}</div></body></html>`;
        }
      }

      if (targetHtml.length > MAX_PAGE_HTML) {
        sendResponse({ error: 'PAGE_TOO_LARGE' });
        return;
      }

      sendResponse({
        url: window.location.href,
        title: document.title,
        html: targetHtml,
        selection,
        isZhihuQuestion: window.location.href.includes('zhihu.com/question/')
      });
    }).catch((error) => {
      console.error('[Herdown] Failed to read page:', error);
      sendResponse({ error: 'PAGE_READ_FAILED' });
    });

    return true;
  }

  if (request.action === 'START_ELEMENT_PICKER') {
    if (isInspectorActive) {
      sendResponse({ ok: false });
      return false;
    }
    activateElementPicker();
    sendResponse({ ok: true });
    return false;
  }
  });
}

function waitForPageReady(maxWait = 4000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let previousLength = -1;
    let stableChecks = 0;

    const check = () => {
      const currentLength = document.body?.innerText?.length || 0;
      if (currentLength === previousLength) stableChecks += 1;
      else stableChecks = 0;
      previousLength = currentLength;

      if (stableChecks >= 2 || Date.now() - startedAt >= maxWait) {
        resolve();
        return;
      }
      setTimeout(check, 120);
    };
    check();
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function safeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function activateElementPicker() {
  isInspectorActive = true;

  const style = document.createElement('style');
  style.id = 'herdown-inspector-style';
  style.textContent = `
    .herdown-inspect-hover {
      outline: 2px dashed #10b981 !important;
      outline-offset: 2px !important;
      background-color: rgba(16, 185, 129, 0.08) !important;
      cursor: crosshair !important;
    }
  `;
  document.head.appendChild(style);

  function onMouseMove(event) {
    if (!isInspectorActive) return;
    hoverElement?.classList.remove('herdown-inspect-hover');
    hoverElement = event.target;
    if (hoverElement && hoverElement !== document.body && hoverElement !== document.documentElement) {
      hoverElement.classList.add('herdown-inspect-hover');
    }
  }

  function onClick(event) {
    if (!isInspectorActive) return;
    event.preventDefault();
    event.stopPropagation();

    const pickedData = {
      url: window.location.href,
      title: document.title,
      html: hoverElement?.outerHTML || ''
    };
    deactivate();
    if (pickedData.html) {
      chrome.storage.local.set({ pendingPicker: pickedData }).catch((error) => {
        console.error('[Herdown] Could not save picked element:', error);
      });
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') deactivate();
  }

  function deactivate() {
    isInspectorActive = false;
    hoverElement?.classList.remove('herdown-inspect-hover');
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.getElementById('herdown-inspector-style')?.remove();
    hoverElement = null;
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}
