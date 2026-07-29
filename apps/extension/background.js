// Herdown Chrome Extension Background Service Worker

// Create context menu on installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "herdown-clip-page",
    title: "🧩 Herdown 剪藏当前网页到 Obsidian",
    contexts: ["page", "selection", "link"]
  });
});

// Context Menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "herdown-clip-page" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_DATA' }, (response) => {
      if (response && response.html) {
        // Broadcast to background storage or open popup
        chrome.storage.local.set({ pendingClip: response }, () => {
          chrome.action.openPopup();
        });
      }
    });
  }
});
