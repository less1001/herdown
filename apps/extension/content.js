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
