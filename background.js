chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.toggleCyrillic !== undefined && sender.tab) {
    chrome.action.setIcon({
      tabId: sender.tab.id,
      path: msg.toggleCyrillic ? {
        "16": "icons/icon-cyrillic-16.png",
        "32": "icons/icon-cyrillic-32.png",
        "48": "icons/icon-cyrillic-48.png",
        "128": "icons/icon-cyrillic-128.png"
      } : {
        "16": "icons/icon-latin-16.png",
        "32": "icons/icon-latin-32.png",
        "48": "icons/icon-latin-48.png",
        "128": "icons/icon-latin-128.png"
      }
    });
  }
});
