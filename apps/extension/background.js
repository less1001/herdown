// Herdown Chrome Extension Background Service Worker

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'herdown-clip-page',
      title: chrome.i18n.getMessage('contextMenuTitle') || 'Extract with Herdown',
      contexts: ['page', 'selection', 'link']
    });
  });
}

async function ensureContentScript(tabId) {
  const [{ result: isReady }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => globalThis.__HERDOWN_CONTENT_SCRIPT_READY__ === true
  });
  if (!isReady) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  }
}

chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.runtime.onStartup.addListener(createContextMenu);

// Context Menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'herdown-clip-page' && tab?.id) {
    ensureContentScript(tab.id)
      .then(() => {
        chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_DATA' }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response && response.html) chrome.storage.local.set({ pendingClip: response });
        });
      })
      .catch(() => {
        // Chrome internal pages and restricted frames cannot be read.
      });
  }
});
