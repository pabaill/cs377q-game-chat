function extractChatMessages() {
    const chatElements = document.querySelectorAll('#game-chat-text .message-post span'); // Update the selector based on the chat structure
    const messages = [];
    
    chatElements.forEach(element => {
        const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        textNodes.forEach(node => {
          if (node.textContent.includes(':')) {
            messages.push(node.textContent.trim().substring(2));
          }
        });
    });

    console.log('Extracted messages:', messages);
  
    return messages;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === 'extractChat') {
      const messages = extractChatMessages();
      sendResponse({ messages: messages });
    } else {
      sendResponse({}); // Always send a response to avoid message port closure
    }
    return true; // Keep the message channel open for async responses
});