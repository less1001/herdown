// Herdown Chrome Extension Background Service Worker

// Create context menu on installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "herdown-clip-page",
    title: "Herdown提取当前网页",
    contexts: ["page", "selection", "link"]
  });
});

// Context Menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "herdown-clip-page" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Herdown] Context menu extraction failed:', chrome.runtime.lastError.message);
        return;
      }
      if (response && response.html) {
        chrome.storage.local.set({ pendingClip: response });
      }
    });
  }
});
