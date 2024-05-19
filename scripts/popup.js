// popup.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('chatMessages', (data) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting chat messages:', chrome.runtime.lastError);
        } else {
          console.log('Retrieved chat messages:', data.chatMessages); // Log retrieved messages
          if (data.chatMessages) {
            const summary = summarizeMessages(data.chatMessages);
            document.getElementById('summary').innerText = summary;
          } else {
            document.getElementById('summary').innerText = 'No messages found.';
          }
        }
      });
    } else {
      document.getElementById('summary').innerText = 'Unable to access Chrome storage.';
    }
  });
  
  function summarizeMessages(messages) {
    return messages.join('\n');
  }