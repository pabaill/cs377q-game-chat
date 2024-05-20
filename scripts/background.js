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

fetch(chrome.runtime.getURL('.env'))
  .then(response => response.text())
  .then(text => {
    const env = {};
    text.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
    console.log('Loaded env variables:', env);  // Debug log
    chrome.storage.local.set({ env });
  })
  .catch(error => console.error('Error loading .env file:', error));
