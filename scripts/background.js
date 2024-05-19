// background.js

chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scripts/content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'updateBox' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message to content script:', chrome.runtime.lastError);
        } else {
          console.log('Popup deployed')
        }
      });
    }).catch(err => {
      console.error('Error injecting content script:', err);
    });
  });