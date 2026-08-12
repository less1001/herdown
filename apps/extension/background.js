function createMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'herdown-clip-v2',
      title: '用Herdown剪藏',
      contexts: ['page', 'selection']
    });
  });
}

chrome.runtime.onInstalled.addListener(createMenu);
chrome.runtime.onStartup.addListener(createMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'herdown-clip-v2' || !tab?.id) return;
  try {
    await ensureContentScript(tab.id);
    const response = await sendMessage(tab.id, {
      action: 'HERDOWN_V2_READ_PAGE',
      selectionText: info.selectionText || ''
    });
    if (!response?.ok) return;
    await chrome.storage.local.set({
      herdownPendingClipV2: {
        ...response,
        mode: info.selectionText?.trim() ? 'selection' : 'full'
      }
    });
    await openClipperWindow();
  } catch {
    // Chrome's protected pages cannot be clipped.
  }
});

function sendMessage(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(response);
    });
  });
}

async function openClipperWindow() {
  try {
    if (chrome.action?.openPopup) {
      await chrome.action.openPopup();
      return;
    }
  } catch {
    // Some Chrome versions do not allow opening the action popup here.
  }
  await chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 440,
    height: 620,
    focused: true
  });
}

async function ensureContentScript(tabId) {
  const [{ result: ready }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => globalThis.__HERDOWN_CLIPPER_V2__ === true
  });
  if (!ready) await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}
