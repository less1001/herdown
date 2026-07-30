// Herdown Chrome Extension Content Script
console.log('[Herdown Extension] Content script loaded.');

let isInspectorActive = false;
let hoverElement = null;

// Message listener from Popup or Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PAGE_DATA') {
    const selection = window.getSelection() ? window.getSelection().toString().trim() : '';

    // Handle Zhihu auto expander
    if (window.location.href.includes('zhihu.com/question/')) {
      // 1. Try to click and expand via MouseEvent
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn && btn.textContent && btn.textContent.includes('显示全部')) {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          btn.click();
        }
      });

      // 2. Ironclad Noscript Fallback: if answers are still collapsed, extract from noscript tag which has 100% full content
      const richTexts = document.querySelectorAll('.RichContent');
      richTexts.forEach(rich => {
        const noscript = rich.querySelector('noscript');
        if (noscript) {
          const innerContent = rich.querySelector('.RichContent-inner');
          if (innerContent) {
            // Replace the truncated text with the raw full HTML from noscript tag
            innerContent.innerHTML = noscript.innerHTML;
            // Remove the more/expand button
            const moreBtn = rich.querySelector('.ContentItem-more');
            if (moreBtn) moreBtn.remove();
          }
        }
      });
    }

    // Give a short 120ms delay to let expanded HTML render in DOM, then return parsed HTML
    setTimeout(() => {
      let targetHtml = document.documentElement.outerHTML;

      // Jike specific precise extraction and noise purification
      if (window.location.href.includes('okjike.com')) {
        const jikePost = document.querySelector('article') || document.querySelector('[class*="PostItem"]') || document.querySelector('[class*="JikePostCard"]');
        if (jikePost) {
          const clonedPost = jikePost.cloneNode(true);
          // Strip out action buttons, comments, reactions, and interaction count areas completely
          const noiseSelectors = [
            '[class*="actions"]', 
            '[class*="comment"]', 
            '[class*="Comment"]', 
            '[class*="Reaction"]',
            '[class*="reactor"]', 
            '[class*="Reactor"]', 
            '[class*="interaction"]', 
            '[class*="Interaction"]', 
            'button', 
            '[class*="Avatar"]', 
            '[class*="UserRecommend"]',
            '[class*="Recommend"]', 
            '[class*="Footer"]', 
            '[class*="toolbar"]',
            '[class*="Toolbar"]',
            'svg'
          ];
          noiseSelectors.forEach(sel => {
            clonedPost.querySelectorAll(sel).forEach(el => el.remove());
          });

          // Extract only the post content area and media/image grid to ensure 100% clean markdown
          targetHtml = `
            <html>
              <head>
                <title>${document.title}</title>
              </head>
              <body>
                <div class="jike-purified-content">${clonedPost.innerHTML}</div>
              </body>
            </html>
          `;
        }
      }

      // X.com / Twitter specific precise single tweet and thread extractor
      if (window.location.href.includes('x.com') || window.location.href.includes('twitter.com')) {
        const tweetArticle = document.querySelector('article[data-testid="tweet"]');
        if (tweetArticle) {
          // 1. Gather Rich Metadata from DOM
          const userNameEl = tweetArticle.querySelector('[data-testid="User-Name"]');
          let authorHandle = '';
          if (userNameEl) {
            const spans = userNameEl.querySelectorAll('span');
            for (let s of spans) {
              if (s.innerText && s.innerText.startsWith('@')) {
                authorHandle = s.innerText.trim();
                break;
              }
            }
          }

          const timeEl = tweetArticle.querySelector('time');
          const publishedTime = timeEl ? timeEl.getAttribute('datetime') : '';

          const textEl = tweetArticle.querySelector('[data-testid="tweetText"]');
          let cleanTitle = document.title;
          let description = '';
          if (textEl) {
            const fullText = textEl.innerText.trim();
            description = fullText.slice(0, 120);
            // Grab the first line as a neat clean title (max 60 chars) to mirror Obsidian
            const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length > 0) {
              cleanTitle = lines[0];
              if (cleanTitle.length > 60) {
                cleanTitle = cleanTitle.slice(0, 57) + '...';
              }
            }
          }

          // Clean title fallback to avoid (1) unread prefixes
          cleanTitle = cleanTitle.replace(/^\(\d+\)\s+/, '').replace(/\s+\/\s+X$/, '').replace(/\s+\|\s+Twitter$/, '');

          // 2. Clone and Sanitize DOM while preserving media photos
          const clonedTweet = tweetArticle.cloneNode(true);
          
          // Noise elements to strip, making sure NOT to touch tweetPhoto or images
          const xNoise = [
            '[role="group"]', // reply/retweet/like action bar
            '[data-testid="caret"]', // dropdown caret
            '[class*="r-1tlfct8"]' // vertical connecting lines in threads
          ];
          xNoise.forEach(sel => {
            clonedTweet.querySelectorAll(sel).forEach(el => el.remove());
          });

          // Strip redundant utility SVGs but protect images inside photo grids
          clonedTweet.querySelectorAll('svg').forEach(svg => svg.remove());

          targetHtml = `
            <html>
              <head>
                <title>${cleanTitle}</title>
                <script id="herdown-metadata" type="application/json">
                  {
                    "author": "${authorHandle}",
                    "published": "${publishedTime}",
                    "description": "${description.replace(/"/g, '\\"')}"
                  }
                </script>
              </head>
              <body>
                <div class="x-purified-tweet">${clonedTweet.innerHTML}</div>
              </body>
            </html>
          `;
        }
      }

      // CSDN specific precise extraction to bypass paywall mask and filter headers/footers
      if (window.location.href.includes('csdn.net')) {
        const csdnContent = document.getElementById('article_content') || document.querySelector('.article_content');
        if (csdnContent) {
          const clonedContent = csdnContent.cloneNode(true);
          // Strip out follow button, ads, code run/copy buttons overlays
          const noise = [
            '.hide-article-box', '.csdn-tracking-statistics', '[class*="opt-box"]',
            '.save_to_devcloud', '.reward-user-box', '.follow-text-box'
          ];
          noise.forEach(sel => {
            clonedContent.querySelectorAll(sel).forEach(el => el.remove());
          });

          targetHtml = `
            <html>
              <head>
                <title>${document.title}</title>
              </head>
              <body>
                <div id="article_content">${clonedContent.innerHTML}</div>
              </body>
            </html>
          `;
        }
      }

      // WeChat specific precise extraction
      if (window.location.href.includes('mp.weixin.qq.com')) {
        const wechatContent = document.getElementById('js_content') || document.querySelector('.rich_media_content');
        if (wechatContent) {
          const metaArea = document.querySelector('.rich_media_meta_list');
          targetHtml = `
            <html>
              <head>
                <title>${document.title}</title>
                <script>
                  var nickname = "${(document.querySelector('.rich_media_meta_nickname')?.innerText || '').trim()}";
                  var msg_author = "${(document.querySelector('.rich_media_meta_text')?.innerText || '').trim()}";
                  var ct = "${Math.floor(Date.now() / 1000)}";
                </script>
              </head>
              <body>
                ${metaArea ? metaArea.outerHTML : ''}
                <div id="js_content">${wechatContent.innerHTML}</div>
              </body>
            </html>
          `;
        }
      }

      sendResponse({
        url: window.location.href,
        title: document.title,
        html: targetHtml,
        selection: selection,
        isZhihuQuestion: window.location.href.includes('zhihu.com/question/')
      });
    }, 120);

    return true; // Keep message channel open for asynchronous sendResponse
  }

  if (request.action === 'START_ELEMENT_PICKER') {
    activateElementPicker(sendResponse);
    return true;
  }
});

function activateElementPicker(callback) {
  if (isInspectorActive) return;
  isInspectorActive = true;

  const style = document.createElement('style');
  style.id = 'herdown-inspector-style';
  style.innerHTML = `
    .herdown-inspect-hover {
      outline: 2px dashed #10b981 !important;
      outline-offset: 2px !important;
      background-color: rgba(16, 185, 129, 0.08) !important;
      cursor: crosshair !important;
    }
  `;
  document.head.appendChild(style);

  function onMouseMove(e) {
    if (!isInspectorActive) return;
    if (hoverElement) {
      hoverElement.classList.remove('herdown-inspect-hover');
    }
    hoverElement = e.target;
    if (hoverElement && hoverElement !== document.body && hoverElement !== document.documentElement) {
      hoverElement.classList.add('herdown-inspect-hover');
    }
  }

  function onClick(e) {
    if (!isInspectorActive) return;
    e.preventDefault();
    e.stopPropagation();

    const pickedHtml = hoverElement ? hoverElement.outerHTML : '';
    deactivate();
    
    if (callback) {
      callback({
        url: window.location.href,
        title: document.title,
        html: pickedHtml
      });
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      deactivate();
    }
  }

  function deactivate() {
    isInspectorActive = false;
    if (hoverElement) hoverElement.classList.remove('herdown-inspect-hover');
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    const styleEl = document.getElementById('herdown-inspector-style');
    if (styleEl) styleEl.remove();
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}
