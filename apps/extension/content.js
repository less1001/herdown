// Herdown Chrome Extension Content Script
console.log('[Herdown Extension] Content script loaded.');

let isInspectorActive = false;
let hoverElement = null;

// Message listener from Popup or Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PAGE_DATA') {
    const selection = window.getSelection() ? window.getSelection().toString().trim() : '';
    sendResponse({
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
      selection: selection,
      isZhihuQuestion: window.location.href.includes('zhihu.com/question/')
    });
    return true;
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
