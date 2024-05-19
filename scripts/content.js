function extractChatMessages() {
    const chatElements = document.querySelectorAll('.message-post'); // Update the selector based on the chat structure
    const messages = [];
    
    chatElements.forEach(element => {
        const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        textNodes.forEach(node => {
          messages.push(node.textContent.trim());
        });
    });

    console.log('Extracted messages:', messages);
  
    return messages;
}
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractChat') {
      const messages = extractChatMessages();
      sendResponse({messages: messages});
    }
  });