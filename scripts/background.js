// background.js

chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked'); // Confirm icon click is detected
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scripts/content.js'] // Correct path to content.js
    }).then(() => {
      console.log('Content script injected');
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
  
  function summarizeChat(tab, messages) {
    chrome.storage.local.set({ "messages": messages }).then(() => {
        console.log("stored messages: ", messages)
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/createBox.js']
        }).then(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'updateBox' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error creating box:', chrome.runtime.lastError);
                } 
            })
        });
      });
  }