// background.js
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      console.log('Content script injected');
      chrome.tabs.sendMessage(tab.id, { action: 'extractChat' }, (response) => {
        if (response && response.messages) {
          console.log('Messages received from content script:', response.messages); // Log received messages
          summarizeChat(response.messages);
        } else {
          console.error('No messages received from content script');
        }
      });
    });
  });
  
  function summarizeChat(messages) {
    console.log('Storing messages:', messages);
    chrome.storage.local.set({ chatMessages: messages }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting chat messages:', chrome.runtime.lastError);
      } else {
        console.log('Chat messages saved successfully.');
      }
    });
  }